"use server";

import { appStore } from "@/lib/store";
import { WorkoutSession } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function saveSessionAction(session: WorkoutSession) {
  const saved = appStore.saveSession(session);
  revalidatePath("/(trainee)/today");
  revalidatePath("/(trainee)/progress");
  revalidatePath("/(trainer)/roster");
  return saved;
}

export async function getSessionsAction(traineeId: string) {
  return appStore.getSessions(traineeId);
}

export async function getPersonalBestAction(traineeId: string, exerciseName: string) {
  return appStore.getPersonalBestForExercise(traineeId, exerciseName);
}
