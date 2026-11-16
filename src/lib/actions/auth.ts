"use server";

import { appStore } from "@/lib/store";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Non-fatal outside Next.js request context
  }
}

export async function getCurrentUserAction() {
  return appStore.getCurrentUser();
}

export async function switchUserAction(userId: string) {
  const session = await getAuthenticatedSession();
  if (!appStore.isTestEnvironment()) {
    if (!session || session.uid !== userId) {
      return appStore.getCurrentUser();
    }
  }
  const user = appStore.setCurrentUser(userId);
  safeRevalidate("/");
  safeRevalidate("/(trainee)/today");
  safeRevalidate("/(trainer)/roster");
  return user;
}
