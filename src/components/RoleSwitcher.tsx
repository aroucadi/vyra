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
    <div className="bg-[#090C11] border-b border-[#1C2436] px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 font-body">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="font-medium text-slate-300">Active Persona:</span>
        <span className="bg-[#111622] px-2.5 py-0.5 rounded-lg border border-[#1C2436] font-semibold text-white">
          {currentUser.name} ({currentUser.role === "trainer" ? "Trainer" : "Trainee"})
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-slate-500 mr-1 text-[11px] font-mono">Switch View:</span>
        <button
          onClick={() => handleSwitch("trainee_alaa", "/today")}
          disabled={isPending}
          className={`px-2.5 py-1 rounded-lg text-xs transition-colors font-body cursor-pointer ${
            currentUser.id === "trainee_alaa"
              ? "bg-amber-400 text-slate-950 font-bold shadow-sm"
              : "bg-[#111622] text-slate-300 hover:bg-[#182030] border border-[#1C2436]"
          }`}
        >
          Alaa (Trainee)
        </button>
        <button
          onClick={() => handleSwitch("trainer_alaa", "/roster")}
          disabled={isPending}
          className={`px-2.5 py-1 rounded-lg text-xs transition-colors font-body cursor-pointer ${
            currentUser.id === "trainer_alaa"
              ? "bg-purple-600 text-white font-bold shadow-sm"
              : "bg-[#111622] text-slate-300 hover:bg-[#182030] border border-[#1C2436]"
          }`}
        >
          Alaa Pro (Coach)
        </button>
        <button
          onClick={() => handleSwitch("trainee_1", "/today")}
          disabled={isPending}
          className={`px-2.5 py-1 rounded-lg text-xs transition-colors font-body cursor-pointer ${
            currentUser.id === "trainee_1"
              ? "bg-amber-400 text-slate-950 font-bold"
              : "bg-[#111622] text-slate-400 hover:bg-[#182030] border border-[#1C2436]"
          }`}
        >
          Alex (Demo)
        </button>
        <button
          onClick={() => handleSwitch("trainer_1", "/roster")}
          disabled={isPending}
          className={`px-2.5 py-1 rounded-lg text-xs transition-colors font-body cursor-pointer ${
            currentUser.id === "trainer_1"
              ? "bg-purple-600 text-white font-bold"
              : "bg-[#111622] text-slate-400 hover:bg-[#182030] border border-[#1C2436]"
          }`}
        >
          Marcus (Demo)
        </button>
      </div>
    </div>
  );
}
