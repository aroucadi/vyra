"use server";

import { appStore } from "@/lib/store";
import { revalidatePath } from "next/cache";

export async function logWeightAction(traineeId: string, weightKg: number) {
  const metric = appStore.addMetric(traineeId, weightKg);
  revalidatePath("/(trainee)/progress");
  revalidatePath("/(trainer)/roster");
  return metric;
}

export async function getWeightHistoryAction(traineeId: string) {
  return appStore.getMetrics(traineeId);
}
