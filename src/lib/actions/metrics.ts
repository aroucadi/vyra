"use server";

import { appStore } from "@/lib/store";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Non-fatal outside Next.js request context
  }
}

export async function logWeightAction(traineeId: string, weightKg: number) {
  const metric = appStore.addMetric(traineeId, weightKg);
  safeRevalidate("/(trainee)/progress");
  safeRevalidate("/(trainer)/roster");
  return metric;
}

export async function getWeightHistoryAction(traineeId: string) {
  return appStore.getMetrics(traineeId);
}
