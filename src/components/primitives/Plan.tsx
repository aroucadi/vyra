"use client";

import React from "react";
import { clsx } from "clsx";
import { Check } from "lucide-react";

export interface MomentItem {
  id: string;
  pillar: "train" | "eat" | "sleep" | "style" | "network";
  time: string;
  title: string;
  glance?: string;
  status: "past" | "now" | "upcoming";
  badge?: string;
}

export interface PlanTimelineProps {
  moments: MomentItem[];
  renderHero?: (moment: MomentItem) => React.ReactNode;
  onMomentClick?: (moment: MomentItem) => void;
  className?: string;
}

export function PlanTimeline({
  moments,
  renderHero,
  onMomentClick,
  className,
}: PlanTimelineProps) {
  return (
    <div className={clsx("space-y-3", className)}>
      {moments.map((m) => {
        // 1. Current Moment (Render as Hero or prominent card)
        if (m.status === "now") {
          return (
            <div key={m.id} className="pt-1 pb-1">
              {renderHero ? (
                renderHero(m)
              ) : (
                <div className="p-5 rounded-2xl bg-slate-900 border-2 border-emerald-500/30 space-y-2">
                  <div className="flex justify-between text-xs text-emerald-400 font-mono">
                    <span>NOW</span>
                    <span>{m.time}</span>
                  </div>
                  <h4 className="text-base font-bold text-white">{m.title}</h4>
                  {m.glance && <p className="text-xs text-slate-400">{m.glance}</p>}
                </div>
              )}
            </div>
          );
        }

        // 2. Past Moments (Collapsed to a tranquil tick)
        if (m.status === "past") {
          return (
            <div
              key={m.id}
              onClick={() => onMomentClick?.(m)}
              className="flex items-center justify-between p-3 bg-slate-900/30 border border-slate-800/40 rounded-xl text-xs text-slate-400 cursor-pointer hover:border-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-[10px] text-emerald-400 flex-shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span className="font-medium text-slate-300 truncate">{m.title}</span>
                {m.glance && <span className="text-[11px] text-slate-500 truncate">{m.glance}</span>}
              </div>
              <span className="font-mono text-[11px] text-slate-500 flex-shrink-0">{m.time}</span>
            </div>
          );
        }

        // 3. Upcoming Moments (Quiet, single-line rows)
        return (
          <div
            key={m.id}
            onClick={() => onMomentClick?.(m)}
            className="flex items-center justify-between p-3 bg-slate-900/20 border border-slate-800/30 rounded-xl text-xs text-slate-400 cursor-pointer hover:border-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <span className="w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center text-[9px] text-slate-600 flex-shrink-0">
                ○
              </span>
              <span className="font-medium text-slate-300 truncate">{m.title}</span>
              {m.glance && <span className="text-[11px] text-slate-500 truncate">{m.glance}</span>}
            </div>
            <span className="font-mono text-[11px] text-slate-500 flex-shrink-0">{m.time}</span>
          </div>
        );
      })}
    </div>
  );
}

// Week Calendar Strip Component (Used for Program)
export function PlanWeekStrip({
  days,
  selectedDayIndex,
  todayDayIndex,
  onSelectDay,
  className,
}: {
  days: { dayName: string; dayNumber: number; isRest?: boolean; label?: string }[];
  selectedDayIndex: number;
  todayDayIndex: number;
  onSelectDay: (idx: number) => void;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center justify-between gap-1.5 p-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl", className)}>
      {days.map((d, idx) => {
        const isSelected = selectedDayIndex === idx;
        const isToday = todayDayIndex === idx;

        return (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectDay(idx)}
            className={clsx(
              "flex-1 py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all focus-visible:ring-1 focus-visible:ring-emerald-400",
              isSelected
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md"
                : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
            )}
          >
            <span className={clsx("text-[10px] uppercase font-mono tracking-tighter", isSelected ? "text-slate-950" : "text-slate-500")}>
              {d.dayName}
            </span>
            <span className={clsx("text-xs font-bold tabular", isSelected ? "text-slate-950" : "text-white")}>
              {d.dayNumber}
            </span>
            {isToday && (
              <span
                className={clsx(
                  "w-1 h-1 rounded-full",
                  isSelected ? "bg-slate-950" : "bg-emerald-400"
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export const Plan = {
  Timeline: PlanTimeline,
  WeekStrip: PlanWeekStrip,
};
