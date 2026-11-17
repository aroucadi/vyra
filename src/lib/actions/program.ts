"use server";

import { appStore } from "@/lib/store";
import { Program } from "@/lib/types";
import { getAuthenticatedSession, isAnonymousTraineeId } from "@/lib/auth/server-session";
import { saveProgramToFirestore, saveUserSyncBatch } from "@/lib/firebase/firestore-repository";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Non-fatal outside Next.js request context
  }
}

export async function getActiveProgram(traineeId: string) {
  const session = await getAuthenticatedSession();
  const effectiveId = session
    ? session.uid
    : appStore.isTestEnvironment() || isAnonymousTraineeId(traineeId)
      ? traineeId
      : "anon_visitor";
  return appStore.getActiveProgramForTrainee(effectiveId);
}

export async function getProgramById(programId: string) {
  const session = await getAuthenticatedSession();
  const prog = appStore.getProgram(programId);
  if (!prog) return undefined;
  if (session && prog.traineeId !== session.uid) return undefined;
  if (!session && !appStore.isTestEnvironment() && !isAnonymousTraineeId(prog.traineeId)) {
    return undefined;
  }
  return prog;
}

export async function saveProgramAction(program: Program) {
  const session = await getAuthenticatedSession();
  const scopedProgram: Program = session
    ? { ...program, traineeId: session.uid, trainerId: session.uid }
    : !appStore.isTestEnvironment() && !isAnonymousTraineeId(program.traineeId)
      ? { ...program, traineeId: "anon_visitor", trainerId: "anon_visitor" }
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
  const existing = appStore.getProgram(programId);
  if (existing && !appStore.isTestEnvironment()) {
    if (session && existing.traineeId !== session.uid) {
      throw new Error("Forbidden: Cross-tenant program publish is not permitted.");
    }
    if (!session && !isAnonymousTraineeId(existing.traineeId)) {
      throw new Error("Authentication required to publish registered user program.");
    }
  }
  const published = appStore.publishProgram(programId);
  if (session && published.traineeId === session.uid) {
    const allTraineePrograms = appStore
      .getAllProgramsForTrainee(session.uid)
      .filter((p) => p.traineeId === session.uid);
    await saveUserSyncBatch(session.uid, {
      programs: allTraineePrograms.length > 0 ? allTraineePrograms : [published],
    }).catch(() => {});
  }
  safeRevalidate("/(trainee)/today");
  safeRevalidate("/(trainee)/program");
  safeRevalidate("/(trainer)/roster");
  return published;
}
