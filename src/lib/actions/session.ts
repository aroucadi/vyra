"use server";

import { appStore } from "@/lib/store";
import { EquipmentType, WorkoutSession } from "@/lib/types";
import { getAuthenticatedSession, isAnonymousTraineeId } from "@/lib/auth/server-session";
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
    : !appStore.isTestEnvironment() && !isAnonymousTraineeId(session.traineeId)
      ? { ...session, traineeId: "anon_visitor" }
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
  const authSession = await getAuthenticatedSession();
  const effectiveId = authSession
    ? authSession.uid
    : appStore.isTestEnvironment() || isAnonymousTraineeId(traineeId)
      ? traineeId
      : "anon_visitor";
  return appStore.getSessions(effectiveId);
}

export async function getPersonalBestAction(
  traineeId: string,
  exerciseName: string,
  equipmentType?: EquipmentType
) {
  const authSession = await getAuthenticatedSession();
  const effectiveId = authSession
    ? authSession.uid
    : appStore.isTestEnvironment() || isAnonymousTraineeId(traineeId)
      ? traineeId
      : "anon_visitor";
  return appStore.getPersonalBestForExercise(effectiveId, exerciseName, equipmentType);
}
