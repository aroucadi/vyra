import { NextResponse } from "next/server";
import "@/db/coach-repository";
import { resolveRouteTenantContext } from "@/lib/auth/server-session";
import {
  ensureFirestoreCoachBridgeRegistered,
  loadBootstrapForUser,
} from "@/lib/firebase/firestore-repository";
import {
  runAutonomousCoachingLifecycleCheck,
  evaluateCommittedExperiments,
  assembleAthleteCaseFile,
  executeMacroBlockReview,
  executeWeeklyMesoReview,
} from "@/lib/ai/coaching-cycle";
import { athleteModelStore } from "@/lib/ai/athlete-model";
import { WorkoutSession, BodyMetricEntry } from "@/lib/types";

export interface CoachingCycleRequestBody {
  traineeId: string;
  sessions?: WorkoutSession[];
  metricEntries?: BodyMetricEntry[];
  averageLoggedCalories?: number;
  currentDate?: string;
  action?: "lifecycle_check" | "evaluate_experiments" | "macro_review" | "weekly_review";
  forceMacroReview?: boolean;
  forceWeeklyReview?: boolean;
}

/**
 * POST /api/ai/coaching-cycle
 *
 * Executes the multi-timescale coaching loops:
 * - `evaluateCommittedExperiments`: evaluates due experiments against `successMetric`, sets outcome to `confirmed` / `refuted` / `inconclusive`, and updates `AthleteModel`.
 * - `executeMacroBlockReview` (Loop A, 4-8 weeks)
 * - `executeWeeklyMesoReview` (Loop B, 7 days)
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CoachingCycleRequestBody>;
    if (!body || !body.traineeId) {
      return NextResponse.json(
        { ok: false, error: "Missing required field: traineeId" },
        { status: 400 }
      );
    }

    const tenant = await resolveRouteTenantContext(req, body.traineeId, {
      allowUnauthenticatedAnon: true,
    });
    if (!tenant.isAllowed) {
      return NextResponse.json(
        { ok: false, error: tenant.error || "Unauthorized" },
        { status: tenant.statusCode || 401 }
      );
    }

    ensureFirestoreCoachBridgeRegistered();
    const effectiveTraineeId = tenant.effectiveTraineeId;

    let sessions = Array.isArray(body.sessions) ? body.sessions : [];
    let metricEntries = Array.isArray(body.metricEntries) ? body.metricEntries : [];

    // Hydrate athlete model & cloud history from Firestore/PostgreSQL before running
    if (tenant.session) {
      await athleteModelStore.hydrateFromDatabase(effectiveTraineeId);
      if (sessions.length === 0 && metricEntries.length === 0) {
        try {
          const boot = await loadBootstrapForUser({
            uid: tenant.session.uid,
            email: tenant.session.email,
            displayName: tenant.session.name,
          });
          sessions = boot.sessions;
          metricEntries = boot.metrics;
        } catch {
          // Non-fatal fallback
        }
      }
    }

    if (body.action === "evaluate_experiments") {
      const evaluated = evaluateCommittedExperiments({
        traineeId: effectiveTraineeId,
        sessions,
        metricEntries,
        currentDate: body.currentDate,
      });
      if (tenant.session) await athleteModelStore.syncToDatabase(effectiveTraineeId);
      return NextResponse.json({ ok: true, evaluatedExperiments: evaluated }, { status: 200 });
    }

    if (body.action === "macro_review") {
      const caseFile = assembleAthleteCaseFile({
        traineeId: effectiveTraineeId,
        sessions,
        metricEntries,
        averageLoggedCalories: body.averageLoggedCalories,
      });
      const macroBlockPlan = executeMacroBlockReview(caseFile);
      if (tenant.session) await athleteModelStore.syncToDatabase(effectiveTraineeId);
      return NextResponse.json({ ok: true, macroBlockPlan }, { status: 200 });
    }

    if (body.action === "weekly_review") {
      const evaluated = evaluateCommittedExperiments({
        traineeId: effectiveTraineeId,
        sessions,
        metricEntries,
        currentDate: body.currentDate,
      });
      const caseFile = assembleAthleteCaseFile({
        traineeId: effectiveTraineeId,
        sessions,
        metricEntries,
        averageLoggedCalories: body.averageLoggedCalories,
      });
      const weeklyReview = executeWeeklyMesoReview(caseFile, {
        hasNewEvidence: sessions.length > 0 || metricEntries.length > 0,
      });
      if (tenant.session) await athleteModelStore.syncToDatabase(effectiveTraineeId);
      return NextResponse.json(
        { ok: true, evaluatedExperiments: evaluated, weeklyReview },
        { status: 200 }
      );
    }

    const lifecycle = runAutonomousCoachingLifecycleCheck({
      traineeId: effectiveTraineeId,
      sessions,
      metricEntries,
      averageLoggedCalories: body.averageLoggedCalories,
      currentDate: body.currentDate,
      forceMacroReview: body.forceMacroReview,
      forceWeeklyReview: body.forceWeeklyReview,
    });
    if (tenant.session) await athleteModelStore.syncToDatabase(effectiveTraineeId);

    return NextResponse.json({ ok: true, ...lifecycle }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to execute autonomous coaching cycle.",
      },
      { status: 500 }
    );
  }
}
