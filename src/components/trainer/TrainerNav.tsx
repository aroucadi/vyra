"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ClipboardList, Dumbbell, BarChart3, Shield, ArrowRightLeft } from "lucide-react";

export function TrainerNav() {
  const pathname = usePathname();

  const links = [
    { label: "Client Roster", href: "/roster", icon: Users },
    { label: "Program Builder", href: "/program/new", icon: ClipboardList },
    { label: "Exercise Library", href: "/exercises", icon: Dumbbell },
  ];

  return (
    <aside className="w-64 bg-[#0B0F17] border-r border-[#1E293B] min-h-screen p-4 flex flex-col justify-between hidden md:flex">
      <div>
        <div className="flex items-center gap-2 px-2 py-4 mb-6 border-b border-[#1E293B]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#10B981] to-[#06B6D4] flex items-center justify-center font-black text-slate-950 text-base">
            NM
          </div>
          <div>
            <h1 className="font-bold text-sm text-[#F8FAFC] tracking-tight">NewME Coach</h1>
            <span className="text-[10px] text-[#06B6D4] font-mono uppercase tracking-wider">Pro Edition</span>
          </div>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#162032] text-[#10B981] border border-[#334155]/60"
                    : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#131C2E]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#10B981]" : "text-[#94A3B8]"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-[#1E293B] pt-4 space-y-3">
        <div className="bg-[#162032] p-3 rounded-lg border border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-xs font-semibold text-slate-200">Coach Marcus</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">CSCS • Precision Periodization</p>
        </div>

        <Link
          href="/today"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-[#1E293B] text-slate-300 hover:text-white hover:bg-[#334155] transition-colors border border-[#334155]"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-[#10B981]" />
          View Trainee App
        </Link>
      </div>
    </aside>
  );
}
