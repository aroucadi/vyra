"use server";

import { appStore } from "@/lib/store";
import { Program } from "@/lib/types";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Non-fatal outside Next.js request context
  }
}

export async function getActiveProgram(traineeId: string) {
  return appStore.getActiveProgramForTrainee(traineeId);
}

export async function getProgramById(programId: string) {
  return appStore.getProgram(programId);
}

export async function saveProgramAction(program: Program) {
  const saved = appStore.saveProgram(program);
  safeRevalidate("/(trainee)/today");
  safeRevalidate("/(trainee)/program");
  safeRevalidate("/(trainer)/roster");
  safeRevalidate(`/(trainer)/program/${program.id}`);
  return saved;
}

export async function publishProgramAction(programId: string) {
  const published = appStore.publishProgram(programId);
  safeRevalidate("/(trainee)/today");
  safeRevalidate("/(trainee)/program");
  safeRevalidate("/(trainer)/roster");
  return published;
}
