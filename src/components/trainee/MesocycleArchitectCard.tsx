"use client";

import React, { useState, useMemo } from "react";
import {
  MESOCYCLE_SPLITS,
  STANDARD_MESOCYCLE_PHASES,
  TrainingFrequency,
  resolveMesocyclePlan,
  saveUserMesocyclePreference,
  MesocycleDay,
  MesocyclePhase,
} from "@/lib/mesocycle";
import { TrainingGoal, TRAINING_GOALS } from "@/lib/onboarding";
import { telemetry } from "@/lib/telemetry";
import {
  Calendar,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Flame,
} from "lucide-react";

interface MesocycleArchitectCardProps {
  userId: string;
  goal?: TrainingGoal;
  benchmark1RmKg?: number;
  onLockInPlan?: (frequency: TrainingFrequency) => void;
}

export function MesocycleArchitectCard({
  userId,
  goal = "hypertrophy",
  benchmark1RmKg = 80,
  onLockInPlan,
}: MesocycleArchitectCardProps) {
  const [frequency, setFrequency] = useState<TrainingFrequency>(4);
  const [isPhasesExpanded, setIsPhasesExpanded] = useState(false);
  const [isLockedIn, setIsLockedIn] = useState(false);

  const plan = useMemo(
    () => resolveMesocyclePlan(frequency, goal, benchmark1RmKg),
    [frequency, goal, benchmark1RmKg]
  );

  const handleFrequencyChange = (nextFreq: TrainingFrequency) => {
    setFrequency(nextFreq);
    telemetry.track(
      "mesocycle_frequency_selected",
      { frequency: nextFreq, goal, benchmark1RmKg },
      userId
    );
  };

  const handleLockIn = () => {
    saveUserMesocyclePreference(userId, frequency, goal);
    setIsLockedIn(true);
    telemetry.track(
      "onboarding_step_viewed",
      { step: "lock_in_mesocycle", frequency, goal },
      userId
    );
    onLockInPlan?.(frequency);
  };

  return (
    <div className="p-5 rounded-3xl bg-[#111622] border border-[#1C2436] shadow-xl space-y-5 font-body">
      {/* CARD HEADER */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Mesocycle Architect
          </span>
          <span className="text-xs font-mono text-slate-400">15 Weeks Remaining</span>
        </div>
        <h2 className="text-xl font-editorial font-bold text-white tracking-tight pt-0.5">
          Your 16-Week Periodization Roadmap
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed font-body">
          Calibrated from your baseline performance data. Select your weekly training frequency to autoregulate your progression curve.
        </p>
      </div>

      {/* 1-TAP FREQUENCY SEGMENTED SELECTOR */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
          Weekly Training Frequency
        </span>
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#090C11] border border-[#1C2436]">
          {([3, 4, 5] as TrainingFrequency[]).map((f) => {
            const isSelected = frequency === f;
            const splitDef = MESOCYCLE_SPLITS[f];
            return (
              <button
                key={f}
                type="button"
                onClick={() => handleFrequencyChange(f)}
                className={`min-h-[44px] py-2 px-1.5 rounded-xl text-center transition flex flex-col items-center justify-center cursor-pointer ${
                  isSelected
                    ? "bg-[#182030] text-amber-300 font-bold border border-amber-500/50 shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-[#111622]"
                }`}
              >
                <span className="text-xs font-bold leading-tight flex items-center gap-1 font-body">
                  {f} Days
                  {splitDef.recommended && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </span>
                <span className="text-[10px] font-mono text-slate-400 leading-none mt-0.5">
                  {f === 4 ? "Optimal" : f === 3 ? "Recovery" : "Volume"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-METRIC SUMMARY CARDS */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3.5 bg-[#090C11] border border-[#1C2436] rounded-2xl text-center shadow-sm">
            <div className="text-base sm:text-lg font-black font-display text-amber-400 tabular-nums leading-tight">
              +{plan.projectedStrengthGainRange.minKg}–{plan.projectedStrengthGainRange.maxKg} kg
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 font-mono">
              1RM Band
            </div>
          </div>

          <div className="p-3.5 bg-[#090C11] border border-[#1C2436] rounded-2xl text-center shadow-sm">
            <div className="text-base sm:text-lg font-black font-display text-sky-400 tabular-nums">
              +{plan.projectedVolumeIncreasePercent}%
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 font-mono">
              Volume Ramp
            </div>
          </div>

          <div className="p-3.5 bg-[#090C11] border border-[#1C2436] rounded-2xl text-center shadow-sm">
            <div className="text-base sm:text-lg font-black font-display text-white tabular-nums">
              {plan.split.restDaysCount} Days
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 font-mono">
              Rest / Week
            </div>
          </div>
        </div>
        <p className="text-[10px] font-mono text-slate-500 text-center">
          Model estimates for primary compound 1RM over 16 weeks based on adherence and recovery.
        </p>
      </div>

      {/* SPLIT BREAKDOWN */}
      <div className="p-4 rounded-2xl bg-[#090C11] border border-[#1C2436] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5 font-body">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{plan.split.splitName}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {plan.split.weeklySetsPerMuscle} sets/muscle/wk
          </span>
        </div>

        <div className="space-y-1.5">
          {plan.split.days.map((d: MesocycleDay) => (
            <div
              key={d.dayNumber}
              className="p-2.5 rounded-xl bg-[#111622] border border-[#1C2436] flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#182030] text-[10px] font-mono font-bold text-amber-400 border border-[#1C2436] flex items-center justify-center shrink-0">
                  {d.dayNumber}
                </span>
                <div>
                  <div className="font-semibold text-white leading-tight font-body">
                    {d.name}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-none mt-0.5 font-mono">
                    {d.focus}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4-PHASE PERIODIZATION ROADMAP */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setIsPhasesExpanded(!isPhasesExpanded)}
          className="w-full py-1.5 px-2 flex items-center justify-between text-xs text-slate-300 hover:text-white transition cursor-pointer font-body"
        >
          <span className="font-semibold flex items-center gap-1.5 text-xs text-slate-300">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            <span>16-Week Periodization Phases (4 Microcycles)</span>
          </span>
          {isPhasesExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {isPhasesExpanded && (
          <div className="space-y-2 pt-1 animate-in fade-in-50 duration-200">
            {plan.phases.map((p: MesocyclePhase) => (
              <div
                key={p.phaseNumber}
                className="p-3.5 rounded-2xl bg-[#090C11] border border-[#1C2436] space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-editorial">
                    {p.weeks}: {p.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#182030] text-amber-300 border border-[#1C2436]">
                    {p.rirTarget} RIR
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug font-body">
                  {p.focus}
                </p>
                <p className="text-[10px] font-mono text-sky-400 pt-0.5">
                  Overload: {p.overloadStrategy}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LOCK IN CTA */}
      <div>
        <button
          type="button"
          onClick={handleLockIn}
          disabled={isLockedIn}
          className={`w-full min-h-[48px] py-3.5 px-4 rounded-xl font-display uppercase tracking-wider font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
            isLockedIn
              ? "bg-[#182030] text-amber-300 border border-amber-500/40 cursor-default"
              : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20 active:scale-[0.98]"
          }`}
        >
          {isLockedIn ? (
            <>
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>16-Week Plan Locked In ({plan.split.shortLabel})</span>
            </>
          ) : (
            <>
              <span>Lock In My 16-Week Plan ({plan.split.shortLabel})</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
