"use client";

import React from "react";
import { ShieldCheck, Activity, Scale, Sparkles, Dumbbell } from "lucide-react";
import { clsx } from "clsx";

export interface WeeklyVolumeBreakdown {
  upperPressingSets: number; // 6
  upperDynamicPullingSets: number; // 9
  posteriorIsometricSets: number; // 3
  totalPosturalSets: number; // 12
  dynamicRatio: string; // "1.5:1"
  totalPosturalRatio: string; // "2.0:1"
  lateralDeltExposures: number; // 3
  quadricepsSets: number; // 6
}

export const MASTER_PROGRAM_VOLUME_METRICS: WeeklyVolumeBreakdown = {
  upperPressingSets: 6,
  upperDynamicPullingSets: 9,
  posteriorIsometricSets: 3,
  totalPosturalSets: 12,
  dynamicRatio: "1.5:1",
  totalPosturalRatio: "2.0:1",
  lateralDeltExposures: 3,
  quadricepsSets: 6,
};

interface WeeklyVolumeDashboardProps {
  metrics?: WeeklyVolumeBreakdown;
  className?: string;
}

export function WeeklyVolumeDashboard({
  metrics = MASTER_PROGRAM_VOLUME_METRICS,
  className,
}: WeeklyVolumeDashboardProps) {
  return (
    <section className={clsx("bg-[#111622] rounded-2xl border border-[#1C2436] p-5 space-y-5 font-body shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1C2436] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
              Biomechanical Architecture
            </span>
            <span className="text-[11px] font-mono text-slate-400">Strict 3-Slot Split</span>
          </div>
          <h2 className="text-lg font-editorial font-bold text-white tracking-tight mt-1.5">
            Weekly Volume & Postural Allocation
          </h2>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#090C11] border border-[#1C2436] flex items-center justify-center text-amber-400 shrink-0">
          <Scale className="w-4 h-4" />
        </div>
      </div>

      {/* Primary 3-Metric Top Strip */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 bg-[#090C11] rounded-xl border border-[#1C2436]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Posture : Press
          </span>
          <span className="text-2xl font-black text-amber-400 font-display tabular-nums block mt-0.5">
            {metrics.totalPosturalRatio}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {metrics.dynamicRatio} dynamic
          </span>
        </div>

        <div className="p-3 bg-[#090C11] rounded-xl border border-[#1C2436]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Side Delts
          </span>
          <span className="text-2xl font-black text-sky-400 font-display tabular-nums block mt-0.5">
            {metrics.lateralDeltExposures}x / wk
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Mon · Wed · Thu
          </span>
        </div>

        <div className="p-3 bg-[#090C11] rounded-xl border border-[#1C2436]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Quads Armor
          </span>
          <span className="text-2xl font-black text-white font-display tabular-nums block mt-0.5">
            {metrics.quadricepsSets} sets
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Wed Press & Ext
          </span>
        </div>
      </div>

      {/* Detailed Biomechanical Breakdown Rows */}
      <div className="space-y-2 pt-0.5 text-xs">
        {/* 1. Upper Body Pressing */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#090C11] border border-[#1C2436] hover:border-slate-700 transition">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <Dumbbell className="w-3.5 h-3.5 text-slate-400" />
              <span>Upper-Body Pressing</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Mon 30° Incline (3) + Thu Neutral OHP (3)
            </p>
          </div>
          <span className="font-display text-base font-bold text-white tabular-nums">
            {metrics.upperPressingSets} sets
          </span>
        </div>

        {/* 2. Upper Body Dynamic Pulling */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#090C11] border border-[#1C2436] hover:border-slate-700 transition">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upper Dynamic Pulling</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Tue Lat Pulldown (3) + Tue Row (3) + Wed Face Pull (3)
            </p>
          </div>
          <span className="font-display text-base font-bold text-emerald-400 tabular-nums">
            {metrics.upperDynamicPullingSets} sets
          </span>
        </div>

        {/* 3. Posterior Isometric Retraction */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#090C11] border border-[#1C2436] hover:border-slate-700 transition">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-semibold text-sky-400">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Posterior Chain Isometric Retraction</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Thu Romanian Deadlift continuous scapular anchor (3)
            </p>
          </div>
          <span className="font-display text-base font-bold text-sky-400 tabular-nums">
            {metrics.posteriorIsometricSets} sets
          </span>
        </div>

        {/* 4. Quadriceps & Patellar Tendon Armor */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#090C11] border border-[#1C2436] hover:border-slate-700 transition">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quadriceps & Deceleration Armor</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Wed 45° Leg Press (3) + Wed Seated Leg Ext (3)
            </p>
          </div>
          <span className="font-display text-base font-bold text-amber-300 tabular-nums">
            {metrics.quadricepsSets} sets
          </span>
        </div>
      </div>

      {/* Rationale Footer Callout */}
      <div className="p-3.5 bg-[#090C11] border border-amber-500/30 rounded-xl text-xs text-slate-300 leading-relaxed font-body">
        <span className="font-bold text-amber-400 font-display uppercase tracking-wider mr-1.5">Biomechanical Rationale:</span>
        Station-locked superset on Wednesday integrates the cable face pull with zero transit time, restoring an indisputable <strong>2:1 total posture-to-push ratio</strong> (12:6) and <strong>1.5:1 dynamic ratio</strong> (9:6) while protecting knee joint decelerations for football.
      </div>
    </section>
  );
}
