"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchUserAction } from "@/lib/actions/auth";
import { User } from "@/lib/types";

export function RoleSwitcher({ currentUser }: { currentUser: User }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSwitch = (userId: string, targetPath: string) => {
    startTransition(async () => {
      await switchUserAction(userId);
      router.push(targetPath);
      router.refresh();
    });
  };

  return (
    <div className="bg-[#162032] border-b border-[#1E293B] px-4 py-2 flex flex-wrap items-center justify-between text-xs text-[#94A3B8] gap-2">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
        <span className="font-medium text-slate-300">Active Persona:</span>
        <span className="bg-[#0F172A] px-2 py-0.5 rounded border border-[#334155] font-semibold text-[#F8FAFC]">
          {currentUser.name} ({currentUser.role === "trainer" ? "Trainer" : "Trainee"})
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-slate-500 mr-1">Switch View:</span>
        <button
          onClick={() => handleSwitch("trainee_1", "/today")}
          disabled={isPending}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            currentUser.id === "trainee_1"
              ? "bg-[#10B981] text-slate-950 font-bold"
              : "bg-[#0F172A] text-slate-300 hover:bg-[#1E293B] border border-[#334155]"
          }`}
        >
          Alex (Trainee)
        </button>
        <button
          onClick={() => handleSwitch("trainer_1", "/roster")}
          disabled={isPending}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            currentUser.id === "trainer_1"
              ? "bg-[#8B5CF6] text-white font-bold"
              : "bg-[#0F172A] text-slate-300 hover:bg-[#1E293B] border border-[#334155]"
          }`}
        >
          Marcus (Coach)
        </button>
      </div>
    </div>
  );
}
