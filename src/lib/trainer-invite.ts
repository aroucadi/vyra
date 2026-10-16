/**
 * @file trainer-invite.ts
 * @description Spec 023: B2B2C Trainer-Invite & Onboarding Flow.
 * Generates and parses coach-curated deep links pre-filling custom 16-week mesocycles
 * and calibrated starting weights in zero taps, binding trainees directly to coach rosters.
 */

import { appStore } from "./store";
import { User, Program } from "./types";
import {
  deriveStartingWeightsFromAnchor,
  applyCalibratedWeightsToDayOne,
  AnchorLiftId,
  WeightUnit,
} from "./onboarding";
import { telemetry } from "./telemetry";

export interface TrainerInvitePayload {
  coachId: string;
  coachName: string;
  programTitle: string;
  weeks: number;
  anchorLift: AnchorLiftId;
  startingBenchKg: number;
  unit: WeightUnit;
  customNote?: string;
  traineeName?: string;
}

/**
 * Base64 URL-safe encoding for invite tokens.
 */
export function encodeTrainerInvite(payload: TrainerInvitePayload): string {
  const json = JSON.stringify(payload);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(json, "utf-8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  // Browser fallback
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decodes and validates base64 URL-safe token.
 */
export function decodeTrainerInvite(token: string): TrainerInvitePayload | null {
  if (!token) return null;
  try {
    let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    let json = "";
    if (typeof Buffer !== "undefined") {
      json = Buffer.from(base64, "base64").toString("utf-8");
    } else {
      json = decodeURIComponent(escape(atob(base64)));
    }

    const parsed = JSON.parse(json);
    if (!parsed.coachId || !parsed.coachName) return null;

    return {
      coachId: String(parsed.coachId),
      coachName: String(parsed.coachName),
      programTitle: String(parsed.programTitle || "16-Week Recomposition & Structural Balance"),
      weeks: Number(parsed.weeks) || 16,
      anchorLift: parsed.anchorLift === "dumbbell_bench" ? "dumbbell_bench" : "barbell_bench",
      startingBenchKg: Number(parsed.startingBenchKg) || 80,
      unit: parsed.unit === "lb" ? "lb" : "kg",
      customNote: parsed.customNote ? String(parsed.customNote) : undefined,
      traineeName: parsed.traineeName ? String(parsed.traineeName) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Generates the full URL for a coach invite.
 */
export function generateCoachInviteUrl(
  origin: string,
  payload: TrainerInvitePayload
): string {
  const token = encodeTrainerInvite(payload);
  const cleanOrigin = origin.replace(/\/$/, "");
  return `${cleanOrigin}/invite/${payload.coachId}?token=${token}`;
}

/**
 * Accepts a coach invite:
 * 1. Creates/ensures trainee user exists in appStore.
 * 2. Assigns 16-week mesocycle linked to coachId.
 * 3. Pre-fills calibrated starting weights deterministically.
 * 4. Ensures trainee appears in appStore.getRoster().
 */
export function acceptCoachInvite(
  traineeId: string,
  invite: TrainerInvitePayload
): { success: boolean; programId: string; trainee: User } {
  // 1. Ensure Trainee user exists
  let trainee = appStore.getUser(traineeId);
  if (!trainee) {
    const newTrainee: User = {
      id: traineeId,
      name: invite.traineeName || "New Athlete",
      role: "trainee",
      email: `${traineeId}@app.vyra.fit`,
      injuries: [],
      goals: ["Hypertrophy & Strength"],
    };
    trainee = appStore.addUser(newTrainee);
  }

  // 2. Clone master program or generate 16-week mesocycle assigned to coachId
  const masterProg = appStore.getPrograms()[0];
  const programId = `prog_invite_${traineeId}_${Date.now()}`;
  const now = new Date();
  const endDate = new Date(now.getTime() + invite.weeks * 7 * 86400000);

  const assignedProgram: Program = {
    id: programId,
    trainerId: invite.coachId,
    traineeId: trainee.id,
    title: invite.programTitle,
    startDate: now.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    durationWeeks: invite.weeks,
    status: "published",
    version: 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    weeks: masterProg ? masterProg.weeks.map((w) => ({ ...w, programId })) : [],
  };

  appStore.saveProgram(assignedProgram);

  // 3. Calibrate starting weights using invite parameters
  const calibration = deriveStartingWeightsFromAnchor(trainee.id, {
    anchorLift: invite.anchorLift,
    weight: invite.startingBenchKg,
    reps: 8,
    unit: invite.unit,
    mode: "calibrated",
  });
  applyCalibratedWeightsToDayOne(trainee.id, calibration);

  // 4. Set current user to trainee
  appStore.setCurrentUser(trainee);

  // 5. Emit non-PII telemetry
  telemetry.track(
    "coach_invite_accepted",
    {
      coachId: invite.coachId,
      weeks: invite.weeks,
      anchorLift: invite.anchorLift,
    },
    trainee.id
  );

  return {
    success: true,
    programId,
    trainee,
  };
}
