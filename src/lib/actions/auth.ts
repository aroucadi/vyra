"use server";

import { appStore } from "@/lib/store";
import { revalidatePath } from "next/cache";

export async function getCurrentUserAction() {
  return appStore.getCurrentUser();
}

export async function switchUserAction(userId: string) {
  const user = appStore.setCurrentUser(userId);
  revalidatePath("/");
  revalidatePath("/(trainee)/today");
  revalidatePath("/(trainer)/roster");
  return user;
}
