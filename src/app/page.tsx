import { redirect } from "next/navigation";
import { appStore } from "@/lib/store";

export default function RootPage() {
  redirect("/today");
}
