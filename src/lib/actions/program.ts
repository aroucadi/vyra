"use server";

import { appStore } from "@/lib/store";
import { Program } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getActiveProgram(traineeId: string) {
  return appStore.getActiveProgramForTrainee(traineeId);
}

export async function getProgramById(programId: string) {
  return appStore.getProgram(programId);
}

export async function saveProgramAction(program: Program) {
  const saved = appStore.saveProgram(program);
  revalidatePath("/(trainee)/today");
  revalidatePath("/(trainee)/program");
  revalidatePath("/(trainer)/roster");
  revalidatePath(`/(trainer)/program/${program.id}`);
  return saved;
}

export async function publishProgramAction(programId: string) {
  const published = appStore.publishProgram(programId);
  revalidatePath("/(trainee)/today");
  revalidatePath("/(trainee)/program");
  revalidatePath("/(trainer)/roster");
  return published;
}
