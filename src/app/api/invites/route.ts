import { NextRequest, NextResponse } from "next/server";
import { resolveRouteTenantContext } from "@/lib/auth/server-session";
import { checkDistributedRateLimit, resolveRateLimitKey } from "@/lib/auth/rate-limit";
import { isFirestoreRuntimeAvailable } from "@/lib/firebase/admin";
import {
  acceptCoachInviteInFirestore,
  loadCoachInviteFromFirestore,
  loadCoachRosterFromFirestore,
  saveCoachInviteToFirestore,
  FirestoreCoachInviteRecord,
} from "@/lib/firebase/firestore-repository";
import { generateMaster16WeekProgram } from "@/db/seed/master-transformation-program";
import {
  calculateEpley1RM,
  resolvePoliquinWorkingRatio,
  roundToGymIncrement,
  toKilograms,
} from "@/lib/onboarding";
import type { TrainerInvitePayload } from "@/lib/trainer-invite";
import type { Program } from "@/lib/types";

export const dynamic = "force-dynamic";

function sanitizeShortText(value: unknown, maxLen: number): string {
  return String(value || "")
    .slice(0, maxLen)
    .replace(/[<>]/g, "")
    .trim();
}

function buildCalibratedAssignedProgram(
  traineeId: string,
  invite: TrainerInvitePayload
): Program {
  const templateProg = generateMaster16WeekProgram();
  const programId = `prog_invite_${traineeId}_${Date.now()}`;
  const now = new Date();
  const weeksCount = Math.min(52, Math.max(1, Number(invite.weeks) || 16));
  const endDate = new Date(now.getTime() + weeksCount * 7 * 86400000);
  const startStr = now.toISOString().split("T")[0];
  const clonedWeeks = JSON.parse(
    JSON.stringify(templateProg.weeks.slice(0, weeksCount))
  ) as Program["weeks"];

  const anchorWeightKg = toKilograms(
    Math.min(400, Math.max(10, Number(invite.startingBenchKg) || 80)),
    invite.unit === "lb" ? "lb" : "kg"
  );
  const benchEquivalent1RmKg = calculateEpley1RM(
    invite.anchorLift === "dumbbell_bench" ? anchorWeightKg * 2.15 : anchorWeightKg,
    8
  );

  // Apply Poliquin structural balance calibration to Day 1 working sets
  const calibratedWeeks = clonedWeeks.map((week, wIdx) => ({
    ...week,
    programId,
    days: (week.days || []).map((day, dIdx) => ({
      ...day,
      blocks: (day.blocks || []).map((block) => ({
        ...block,
        exercises: (block.exercises || []).map((ex) => {
          if (wIdx !== 0 || dIdx !== 0) return ex;
          const { ratio } = resolvePoliquinWorkingRatio(ex.exerciseName);
          return {
            ...ex,
            targetWeightKg: roundToGymIncrement(benchEquivalent1RmKg * ratio, "kg"),
          };
        }),
      })),
    })),
  }));

  return {
    id: programId,
    trainerId: invite.coachId,
    traineeId,
    title: sanitizeShortText(
      invite.programTitle || "16-Week Recomposition & Structural Balance",
      100
    ),
    startDate: startStr,
    endDate: endDate.toISOString().split("T")[0],
    durationWeeks: weeksCount,
    status: "published",
    version: 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    weeks: calibratedWeeks,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inviteId = searchParams.get("inviteId");

    // 1. Public invite lookup (non-PII preview only)
    if (inviteId) {
      if (!isFirestoreRuntimeAvailable()) {
        return NextResponse.json({ ok: true, invite: null, persistedToCloud: false }, { status: 200 });
      }
      const record = await loadCoachInviteFromFirestore(inviteId);
      if (!record) {
        return NextResponse.json({ ok: false, error: "Invite not found." }, { status: 404 });
      }
      // Return only safe non-PII invite metadata
      return NextResponse.json(
        {
          ok: true,
          invite: {
            inviteId: record.inviteId,
            coachId: record.coachId,
            coachName: record.coachName,
            programTitle: record.programTitle,
            weeks: record.weeks,
            anchorLift: record.anchorLift,
            startingBenchKg: record.startingBenchKg,
            unit: record.unit,
            customNote: record.customNote,
            status: record.status,
          },
          persistedToCloud: true,
        },
        { status: 200 }
      );
    }

    // 2. Authenticated Coach Roster Lookup (strict tenant isolation)
    const requestedCoachId = searchParams.get("coachId");
    const tenant = await resolveRouteTenantContext(req, requestedCoachId, {
      allowUnauthenticatedAnon: false,
    });
    if (!tenant.isAllowed) {
      return NextResponse.json(
        { ok: false, error: tenant.error || "Unauthorized" },
        { status: tenant.statusCode || 401 }
      );
    }

    if (!isFirestoreRuntimeAvailable()) {
      return NextResponse.json(
        {
          ok: true,
          coachId: tenant.effectiveTraineeId,
          clients: [],
          sentInvites: [],
          persistedToCloud: false,
        },
        { status: 200 }
      );
    }

    const roster = await loadCoachRosterFromFirestore(tenant.effectiveTraineeId);
    return NextResponse.json(
      {
        ok: true,
        coachId: tenant.effectiveTraineeId,
        clients: roster.clients,
        sentInvites: roster.sentInvites,
        persistedToCloud: true,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load invite or roster.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: {
    action?: "create" | "accept";
    inviteId?: string;
    coachId?: string;
    traineeId?: string;
    traineeName?: string;
    traineeEmail?: string;
    invite?: Partial<TrainerInvitePayload>;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed JSON request body." }, { status: 400 });
  }

  try {
    const action = body.action || "accept";

    if (action === "create") {
      const tenant = await resolveRouteTenantContext(req, body.coachId, {
        allowUnauthenticatedAnon: true,
      });
      if (!tenant.isAllowed) {
        return NextResponse.json(
          { ok: false, error: tenant.error || "Unauthorized" },
          { status: tenant.statusCode || 401 }
        );
      }

      const rl = await checkDistributedRateLimit(
        resolveRateLimitKey(req, "invites-create", tenant.effectiveTraineeId),
        { maxRequests: 30, windowMs: 60_000 }
      );
      if (!rl.allowed) {
        return NextResponse.json(
          { ok: false, error: "Rate limit exceeded." },
          { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
        );
      }

      const inviteId =
        sanitizeShortText(body.inviteId, 64) ||
        `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const inviteRecord: FirestoreCoachInviteRecord = {
        inviteId,
        coachId: tenant.effectiveTraineeId,
        coachName: sanitizeShortText(body.invite?.coachName || tenant.session?.name || "Coach", 64),
        programTitle: sanitizeShortText(
          body.invite?.programTitle || "16-Week Recomposition & Structural Balance",
          100
        ),
        weeks: Math.min(52, Math.max(1, Number(body.invite?.weeks) || 16)),
        anchorLift:
          body.invite?.anchorLift === "dumbbell_bench" ? "dumbbell_bench" : "barbell_bench",
        startingBenchKg: Math.min(400, Math.max(10, Number(body.invite?.startingBenchKg) || 80)),
        unit: body.invite?.unit === "lb" ? "lb" : "kg",
        customNote: body.invite?.customNote
          ? sanitizeShortText(body.invite.customNote, 240)
          : undefined,
        traineeName: body.traineeName ? sanitizeShortText(body.traineeName, 64) : undefined,
        traineeEmail: body.traineeEmail
          ? sanitizeShortText(body.traineeEmail, 120).toLowerCase()
          : undefined,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      let saved: FirestoreCoachInviteRecord | null = null;
      if (isFirestoreRuntimeAvailable()) {
        saved = await saveCoachInviteToFirestore(inviteRecord);
      }

      return NextResponse.json(
        {
          ok: true,
          action: "create",
          invite: saved || inviteRecord,
          persistedToCloud: Boolean(saved),
        },
        { status: 200 }
      );
    }

    // Default: action === "accept"
    const tenant = await resolveRouteTenantContext(req, body.traineeId, {
      allowUnauthenticatedAnon: true,
    });
    if (!tenant.isAllowed) {
      return NextResponse.json(
        { ok: false, error: tenant.error || "Unauthorized" },
        { status: tenant.statusCode || 401 }
      );
    }

    const rl = await checkDistributedRateLimit(
      resolveRateLimitKey(req, "invites-accept", tenant.effectiveTraineeId),
      { maxRequests: 20, windowMs: 60_000 }
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: "Rate limit exceeded." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const coachId = sanitizeShortText(body.coachId || body.invite?.coachId, 64);
    if (!coachId) {
      return NextResponse.json({ ok: false, error: "coachId is required." }, { status: 400 });
    }

    const normalizedInvite: TrainerInvitePayload = {
      coachId,
      coachName: sanitizeShortText(body.invite?.coachName || "Coach", 64),
      programTitle: sanitizeShortText(
        body.invite?.programTitle || "16-Week Recomposition & Structural Balance",
        100
      ),
      weeks: Math.min(52, Math.max(1, Number(body.invite?.weeks) || 16)),
      anchorLift:
        body.invite?.anchorLift === "dumbbell_bench" ? "dumbbell_bench" : "barbell_bench",
      startingBenchKg: Math.min(400, Math.max(10, Number(body.invite?.startingBenchKg) || 80)),
      unit: body.invite?.unit === "lb" ? "lb" : "kg",
      customNote: body.invite?.customNote
        ? sanitizeShortText(body.invite.customNote, 240)
        : undefined,
      traineeName: sanitizeShortText(
        body.traineeName || body.invite?.traineeName || tenant.session?.name || "New Athlete",
        64
      ),
    };

    const assignedProgram = buildCalibratedAssignedProgram(
      tenant.effectiveTraineeId,
      normalizedInvite
    );

    let clientLink = null;
    if (isFirestoreRuntimeAvailable()) {
      clientLink = await acceptCoachInviteInFirestore({
        traineeId: tenant.effectiveTraineeId,
        traineeName: normalizedInvite.traineeName,
        traineeEmail: tenant.session?.email || body.traineeEmail,
        coachId,
        coachName: normalizedInvite.coachName,
        program: assignedProgram,
        inviteId: body.inviteId,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        action: "accept",
        traineeId: tenant.effectiveTraineeId,
        program: assignedProgram,
        clientLink,
        persistedToCloud: Boolean(clientLink),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process coach invite.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
