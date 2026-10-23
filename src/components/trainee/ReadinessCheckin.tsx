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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400 stroke-[2]" />
          <h2 className="text-xs font-semibold text-slate-200">Morning Readiness Check-in</h2>
        </div>
        <span className="text-[10px] text-slate-500">1 tap adapts today</span>
      </div>

      <p className="text-xs text-slate-400">
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
                ? "bg-emerald-500/20 border-emerald-500 text-white"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
            )}
          >
            <span className="text-xs font-bold tabular">{opt.label}</span>
            <span className="text-[9px] text-slate-400 mt-0.5">{opt.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
