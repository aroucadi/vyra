"use server";

import { appStore } from "@/lib/store";
import { getAuthenticatedSession, isAnonymousTraineeId } from "@/lib/auth/server-session";

export async function getRosterAction() {
  const session = await getAuthenticatedSession();
  if (!session && !appStore.isTestEnvironment()) {
    return [];
  }
  const roster = appStore.getRoster();
  return session ? roster.filter((r) => r.trainee.id === session.uid) : roster;
}

export async function getTraineeDetailAction(traineeId: string) {
  const session = await getAuthenticatedSession();
  const effectiveId = session
    ? session.uid
    : appStore.isTestEnvironment() || isAnonymousTraineeId(traineeId)
      ? traineeId
      : "anon_visitor";
  const trainee = appStore.getUser(effectiveId);
  const activeProgram = appStore.getActiveProgramForTrainee(effectiveId);
  const sessions = appStore.getSessions(effectiveId);
  const metrics = appStore.getMetrics(effectiveId);

  return {
    trainee,
    activeProgram,
    sessions,
    metrics,
  };
}
