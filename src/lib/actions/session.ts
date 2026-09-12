"use server";

import { appStore } from "@/lib/store";
import { WorkoutSession } from "@/lib/types";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Non-fatal outside Next.js request context
  }
}

export async function saveSessionAction(session: WorkoutSession) {
  const saved = appStore.saveSession(session);
  safeRevalidate("/(trainee)/today");
  safeRevalidate("/(trainee)/progress");
  safeRevalidate("/(trainer)/roster");
  return saved;
}

export async function getSessionsAction(traineeId: string) {
  return appStore.getSessions(traineeId);
}

export async function getPersonalBestAction(traineeId: string, exerciseName: string) {
  return appStore.getPersonalBestForExercise(traineeId, exerciseName);
}
