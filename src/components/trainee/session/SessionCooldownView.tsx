"use client";

import React from "react";
import { Check, CheckCircle2, Clock, Flame, SkipForward } from "lucide-react";
import { clsx } from "clsx";
import { formatDuration } from "./types";

interface SessionCooldownViewProps {
  cooldownDurationSec: number;
  checkedCooldownDrills: Record<number, boolean>;
  onToggleDrill: (drillId: number) => void;
  onCompleteCooldown: () => void;
  onSkipCooldown: () => void;
}

const COOLDOWN_DRILLS = [
  {
    id: 0,
    title: "Doorway / Pull-Up Bar Passive Dead Hang (45s)",
    desc: "Passive hang; relax hips, feet forward, allow gravity to decompress lumbar spine and lengthen tight lats.",
  },
  {
    id: 1,
    title: "Half-Kneeling Couch Stretch / Psoas Opener (60s / side)",
    desc: "Squeeze back glute forward, tall spine. Releases tight hip flexor capsule shortened by 2.5h commute driving.",
  },
  {
    id: 2,
    title: "Doorway Pectoral & Biceps Release (45s / side)",
    desc: "Elbow braced at 90°, gently turn torso away with lower ribs down to reverse pressing shortening.",
  },
  {
    id: 3,
    title: "Diaphragmatic Parasympathetic Box Breathing (60s)",
    desc: "4s inhale through nose, 4s hold, 8s slow exhale through pursed lips. Downregulates central nervous system.",
  },
];

export function SessionCooldownView({
  cooldownDurationSec,
  checkedCooldownDrills,
  onToggleDrill,
  onCompleteCooldown,
  onSkipCooldown,
}: SessionCooldownViewProps) {
  return (
    <div className="flex-1 pb-12 px-4 pt-6 max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-200">
      <header className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Lifting Finished</span>
        </span>
        <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-slate-900 border border-cyan-800/40">
          PHASE 3 / 3: COOLDOWN
        </span>
      </header>

      <div className="p-5 bg-[#111622] border border-[#1C2436] rounded-2xl text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-[10px] font-mono text-cyan-400">
          <Clock className="w-3 h-3" />
          <span>ELAPSED COOLDOWN TIME</span>
        </div>
        <div className="text-4xl font-display font-black text-white tracking-wider tabular-nums">
          {formatDuration(cooldownDurationSec)}
        </div>
        <p className="text-xs text-slate-400 leading-snug">
          Decompress vertebrae discs, stretch shortened hip flexors, and switch on parasympathetic recovery.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 font-mono">
            Post-Workout Stretches ({Object.values(checkedCooldownDrills).filter(Boolean).length}/{COOLDOWN_DRILLS.length} done)
          </span>
          <span className="text-[10px] font-mono text-cyan-400">3–5 mins</span>
        </div>

        <div className="space-y-2.5">
          {COOLDOWN_DRILLS.map((drill) => {
            const isChecked = Boolean(checkedCooldownDrills[drill.id]);
            return (
              <div
                key={drill.id}
                onClick={() => onToggleDrill(drill.id)}
                className={clsx(
                  "p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none",
                  isChecked
                    ? "bg-[#090C11] border-cyan-500/40 text-slate-400"
                    : "bg-[#111622] border-[#1C2436] hover:border-slate-700 text-white"
                )}
              >
                <div
                  className={clsx(
                    "w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                    isChecked
                      ? "bg-cyan-500 border-cyan-400 text-slate-950"
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
          onClick={onCompleteCooldown}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider text-sm font-black rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>Finish &amp; Save Workout ✓</span>
        </button>

        <button
          type="button"
          onClick={onSkipCooldown}
          className="w-full py-3 bg-[#111622] hover:bg-[#182030] active:scale-[0.98] border border-[#1C2436] text-slate-400 hover:text-white font-editorial font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <SkipForward className="w-3.5 h-3.5 text-slate-500" />
          <span>Skip Cooldown → View Summary</span>
        </button>
      </div>
    </div>
  );
}
