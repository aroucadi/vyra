"use server";

import { appStore } from "@/lib/store";

export async function getRosterAction() {
  return appStore.getRoster();
}

export async function getTraineeDetailAction(traineeId: string) {
  const trainee = appStore.getUser(traineeId);
  const activeProgram = appStore.getActiveProgramForTrainee(traineeId);
  const sessions = appStore.getSessions(traineeId);
  const metrics = appStore.getMetrics(traineeId);

  return {
    trainee,
    activeProgram,
    sessions,
    metrics,
  };
}
