"use client";

import React from "react";
import { ArrowLeft, Check, CheckCircle2, Clock, SkipForward } from "lucide-react";
import { clsx } from "clsx";
import { formatDuration } from "./types";
import type { ProgramDay } from "@/lib/types";

interface SessionWarmupViewProps {
  targetDay?: ProgramDay;
  warmupDurationSec: number;
  checkedWarmupDrills: Record<number, boolean>;
  onToggleDrill: (drillId: number) => void;
  onBackToPreview: () => void;
  onCompleteWarmup: () => void;
  onSkipWarmup: () => void;
}

const DEFAULT_WARMUP_ROUTINES = [
  "Doorway Pull-Up Bar 30s Hollow-Body Scapular Hang (5 reps x 2s depression pause): Feet slightly forward, squeeze glutes, ribs down, pull shoulder blades down without bending elbows.",
  "Supine Windshield Wipers (60s): Lie on back, knees bent, feet wide; gently rock knees 5x left and 5x right with shoulders pinned flat to unwind overnight lumbar torsion.",
  "Standing Glute-Squeeze Hip Extension + Y-Reach (60s): Step back, squeeze both glutes hard for 5s (stretch front hip capsule), reach arms back into a Y with thumbs pointing behind.",
  "Incline Bench Push-Up Plus (60s): Hands elevated, push torso away at top for 2s to move shoulder blades through full protraction.",
];

export function SessionWarmupView({
  targetDay,
  warmupDurationSec,
  checkedWarmupDrills,
  onToggleDrill,
  onBackToPreview,
  onCompleteWarmup,
  onSkipWarmup,
}: SessionWarmupViewProps) {
  const rawRoutines = targetDay?.morningRoutine || DEFAULT_WARMUP_ROUTINES;

  const warmupDrills = rawRoutines.map((drillStr, idx) => {
    const parts = drillStr.split(":");
    const title = parts[0]?.trim() || `Warmup Drill #${idx + 1}`;
    const desc =
      parts.slice(1).join(":").trim() ||
      "Prime movement mechanics and joint capsule stability.";
    return { id: idx, title, desc };
  });

  return (
    <div className="flex-1 pb-12 px-4 pt-6 max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-200">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToPreview}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Session Preview</span>
        </button>
        <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-slate-900 border border-cyan-800/40">
          PHASE 1 / 3: WARMUP
        </span>
      </header>

      <div className="p-5 bg-[#111622] border border-[#1C2436] rounded-2xl text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-[10px] font-mono text-cyan-400">
          <Clock className="w-3 h-3" />
          <span>ELAPSED WARMUP TIME</span>
        </div>
        <div className="text-4xl font-display font-black text-white tracking-wider tabular-nums">
          {formatDuration(warmupDurationSec)}
        </div>
        <p className="text-xs text-slate-400 leading-snug">
          Counts directly toward total gym session time. Mobilizes pelvis, thoracic spine, and shoulder girdle.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 font-mono">
            Movement Alignment Drills ({Object.values(checkedWarmupDrills).filter(Boolean).length}/{warmupDrills.length} done)
          </span>
          <span className="text-[10px] font-mono text-amber-400">
            5–7 mins recommended
          </span>
        </div>

        <div className="space-y-2.5">
          {warmupDrills.map((drill) => {
            const isChecked = Boolean(checkedWarmupDrills[drill.id]);
            return (
              <div
                key={drill.id}
                onClick={() => onToggleDrill(drill.id)}
                className={clsx(
                  "p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none",
                  isChecked
                    ? "bg-[#090C11] border-amber-500/40 text-slate-400"
                    : "bg-[#111622] border-[#1C2436] hover:border-slate-700 text-white"
                )}
              >
                <div
                  className={clsx(
                    "w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                    isChecked
                      ? "bg-amber-400 border-amber-300 text-slate-950"
                      : "border-[#1C2436] bg-[#090C11] text-transparent"
                  )}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="flex-1 space-y-1">
                  <div
                    className={clsx(
                      "text-xs font-bold leading-tight",
                      isChecked && "line-through text-slate-500"
                    )}
                  >
                    {drill.title}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    {drill.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          onClick={onCompleteWarmup}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider text-sm font-black rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>Done with Warmup → Start Lifting</span>
        </button>

        <button
          type="button"
          onClick={onSkipWarmup}
          className="w-full py-3 bg-[#111622] hover:bg-[#182030] active:scale-[0.98] border border-[#1C2436] text-slate-400 hover:text-white font-editorial font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <SkipForward className="w-3.5 h-3.5 text-slate-500" />
          <span>Skip Warmup (Straight to Exercises)</span>
        </button>
      </div>
    </div>
  );
}
