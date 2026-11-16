"use client";

import Link from "next/link";
import { User } from "@/lib/types";
import { VyraLogo } from "@/components/brand/VyraLogo";

export function RoleSwitcher({ currentUser }: { currentUser: User }) {
  const canCoach = currentUser.role === "trainer" || currentUser.role === "both";

  return (
    <div className="bg-[#090C11] border-b border-[#1C2436] px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 font-body">
      <div className="flex items-center gap-2.5">
        <VyraLogo size="xs" variant="wordmark" />
        <span className="w-px h-3.5 bg-[#1C2436]" />
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span className="bg-[#111622] px-2 py-0.5 rounded-lg border border-[#1C2436] font-semibold text-white text-[11px]">
          {currentUser.name} ({currentUser.role})
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/today"
          className="px-2.5 py-1 rounded-lg text-xs bg-[#111622] text-slate-300 hover:bg-[#182030] border border-[#1C2436]"
        >
          Trainee View
        </Link>
        {canCoach && (
          <Link
            href="/roster"
            className="px-2.5 py-1 rounded-lg text-xs bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 font-semibold"
          >
            Coach Studio
          </Link>
        )}
      </div>
    </div>
  );
}
