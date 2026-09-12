import { redirect } from "next/navigation";
import { appStore } from "@/lib/store";

export default function RootPage() {
  const currentUser = appStore.getCurrentUser();
  if (currentUser.role === "trainer") {
    redirect("/roster");
  } else {
    redirect("/today");
  }
}
