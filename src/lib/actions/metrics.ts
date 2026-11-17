"use server";

import { appStore } from "@/lib/store";
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

export async function logWeightAction(traineeId: string, weightKg: number) {
  const authSession = await getAuthenticatedSession();
  const effectiveTraineeId = authSession
    ? authSession.uid
    : appStore.isTestEnvironment() || isAnonymousTraineeId(traineeId)
      ? traineeId
      : "anon_visitor";
  const metric = appStore.addMetric(effectiveTraineeId, weightKg);
  if (authSession) {
    await saveUserSyncBatch(authSession.uid, { metrics: [metric] }).catch(() => {});
  }
  safeRevalidate("/(trainee)/progress");
  safeRevalidate("/(trainer)/roster");
  return metric;
}

export async function getWeightHistoryAction(traineeId: string) {
  const authSession = await getAuthenticatedSession();
  const effectiveTraineeId = authSession
    ? authSession.uid
    : appStore.isTestEnvironment() || isAnonymousTraineeId(traineeId)
      ? traineeId
      : "anon_visitor";
  return appStore.getMetrics(effectiveTraineeId);
}
