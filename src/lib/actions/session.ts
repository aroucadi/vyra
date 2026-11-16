"use server";

import { appStore } from "@/lib/store";
import { EquipmentType, WorkoutSession } from "@/lib/types";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import { saveUserSyncBatch } from "@/lib/firebase/firestore-repository";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Non-fatal outside Next.js request context
  }
}

export async function saveSessionAction(session: WorkoutSession) {
  const authSession = await getAuthenticatedSession();
  const scopedSession: WorkoutSession = authSession
    ? { ...session, traineeId: authSession.uid }
    : session;

  const saved = appStore.saveSession(scopedSession);
  if (authSession) {
    await saveUserSyncBatch(authSession.uid, { sessions: [saved] }).catch(() => {});
  }
  safeRevalidate("/(trainee)/today");
  safeRevalidate("/(trainee)/progress");
  safeRevalidate("/(trainer)/roster");
  return saved;
}

export async function getSessionsAction(traineeId: string) {
  return appStore.getSessions(traineeId);
}

export async function getPersonalBestAction(
  traineeId: string,
  exerciseName: string,
  equipmentType?: EquipmentType
) {
  return appStore.getPersonalBestForExercise(traineeId, exerciseName, equipmentType);
}
