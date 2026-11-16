"use server";

import { appStore } from "@/lib/store";
import { Program } from "@/lib/types";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import { saveProgramToFirestore } from "@/lib/firebase/firestore-repository";
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
  const session = await getAuthenticatedSession();
  const scopedProgram: Program = session
    ? { ...program, traineeId: session.uid, trainerId: session.uid }
    : program;

  const saved = appStore.saveProgram(scopedProgram);
  if (session) {
    await saveProgramToFirestore(session.uid, saved).catch(() => {});
  }
  safeRevalidate("/(trainee)/today");
  safeRevalidate("/(trainee)/program");
  safeRevalidate("/(trainer)/roster");
  safeRevalidate(`/(trainer)/program/${program.id}`);
  return saved;
}

export async function publishProgramAction(programId: string) {
  const session = await getAuthenticatedSession();
  const published = appStore.publishProgram(programId);
  if (session && published.traineeId === session.uid) {
    await saveProgramToFirestore(session.uid, published).catch(() => {});
  }
  safeRevalidate("/(trainee)/today");
  safeRevalidate("/(trainee)/program");
  safeRevalidate("/(trainer)/roster");
  return published;
}
