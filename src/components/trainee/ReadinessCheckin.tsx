"use client";

import React, { useState } from "react";
import { appStore } from "@/lib/store";
import { Moon, Sparkles, Check, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

interface ReadinessCheckinProps {
  userId: string;
  onCheckedIn: () => void;
}

export function ReadinessCheckin({ userId, onCheckedIn }: ReadinessCheckinProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const options = [
    { label: "Under 5 h", sub: "Lighter day", feeling: "light" as const, hours: 4.5, color: "text-rose-400 border-rose-500/30" },
    { label: "6 h", sub: "Moderate", feeling: "moderate" as const, hours: 6.0, color: "text-amber-400 border-amber-500/30" },
    { label: "7 h", sub: "Good", feeling: "good" as const, hours: 7.2, color: "text-emerald-400 border-emerald-500/30" },
    { label: "8 h or more", sub: "Full recovery", feeling: "full" as const, hours: 8.5, color: "text-emerald-400 border-emerald-500/30" },
  ];

  const handleSelect = (idx: number) => {
    setSelected(idx);
    setSubmitting(true);
    const opt = options[idx];
    appStore.saveDailyReadinessCheckin(userId, opt.hours, opt.feeling);
    setTimeout(() => {
      onCheckedIn();
    }, 200);
  };

  return (
    <div className="bg-[#111622] border border-[#1C2436] rounded-2xl p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-amber-400 stroke-[2.25]" />
          <h2 className="text-xs font-bold uppercase tracking-wider font-editorial text-white">Morning Readiness Calibration</h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400">1 tap adapts today</span>
      </div>

      <p className="text-xs text-slate-300 font-body">
        How many hours did you sleep last night?
      </p>

      <div className="grid grid-cols-4 gap-2 pt-1">
        {options.map((opt, idx) => (
          <button
            key={opt.label}
            type="button"
            disabled={submitting}
            onClick={() => handleSelect(idx)}
            className={clsx(
              "flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border transition-all cursor-pointer text-center select-none active:scale-[0.98]",
              selected === idx
                ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                : "bg-[#090C11] border-[#1C2436] hover:border-[#2D3A54] text-slate-300 font-medium"
            )}
          >
            <span className="text-xs font-mono-tabular font-bold">{opt.label}</span>
            <span className="text-[9px] text-slate-400 mt-0.5">{opt.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
