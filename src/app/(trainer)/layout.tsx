import { notFound } from "next/navigation";
import { TrainerNav } from "@/components/trainer/TrainerNav";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Scope and exposure gate: Trainer routes return 404 in production
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F17]">
      <TrainerNav />
      <div className="flex-1 min-h-screen bg-[#0F172A] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
