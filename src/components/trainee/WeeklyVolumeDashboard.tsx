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
    <section className={clsx("bg-[#162032] rounded-2xl border border-[#1E293B] p-5 space-y-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              Biomechanical Architecture
            </span>
            <span className="text-[11px] font-mono text-slate-400">Strict 3-Slot Split</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight mt-1">
            Weekly Volume & Postural Allocation
          </h2>
        </div>
        <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
          <Scale className="w-4 h-4" />
        </div>
      </div>

      {/* Primary 3-Metric Top Strip */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 bg-[#0F172A] rounded-xl border border-[#1E293B]">
          <span className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block">
            Posture : Press
          </span>
          <span className="text-lg font-black text-emerald-400 font-mono tabular-nums block mt-0.5">
            {metrics.totalPosturalRatio}
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {metrics.dynamicRatio} dynamic
          </span>
        </div>

        <div className="p-3 bg-[#0F172A] rounded-xl border border-[#1E293B]">
          <span className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block">
            Side Delts
          </span>
          <span className="text-lg font-black text-cyan-400 font-mono tabular-nums block mt-0.5">
            {metrics.lateralDeltExposures}x / wk
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Mon · Wed · Thu
          </span>
        </div>

        <div className="p-3 bg-[#0F172A] rounded-xl border border-[#1E293B]">
          <span className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block">
            Quads Armor
          </span>
          <span className="text-lg font-black text-white font-mono tabular-nums block mt-0.5">
            {metrics.quadricepsSets} sets
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Wed Press & Ext
          </span>
        </div>
      </div>

      {/* Detailed Biomechanical Breakdown Rows */}
      <div className="space-y-2.5 pt-1 text-xs">
        {/* 1. Upper Body Pressing */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F172A]/70 border border-[#1E293B]/80">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <Dumbbell className="w-3.5 h-3.5 text-slate-400" />
              <span>Upper-Body Pressing</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Mon 30° Incline (3) + Thu Neutral OHP (3)
            </p>
          </div>
          <span className="font-mono text-sm font-bold text-slate-300 tabular-nums">
            {metrics.upperPressingSets} sets
          </span>
        </div>

        {/* 2. Upper Body Dynamic Pulling */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F172A]/70 border border-[#1E293B]/80">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-medium text-emerald-400">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upper Dynamic Pulling</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Tue Lat Pulldown (3) + Tue Row (3) + Wed Face Pull (3)
            </p>
          </div>
          <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
            {metrics.upperDynamicPullingSets} sets
          </span>
        </div>

        {/* 3. Posterior Isometric Retraction */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F172A]/70 border border-[#1E293B]/80">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-medium text-cyan-400">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Posterior Chain Isometric Retraction</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Thu Romanian Deadlift continuous scapular anchor (3)
            </p>
          </div>
          <span className="font-mono text-sm font-bold text-cyan-400 tabular-nums">
            {metrics.posteriorIsometricSets} sets
          </span>
        </div>

        {/* 4. Quadriceps & Patellar Tendon Armor */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F172A]/70 border border-[#1E293B]/80">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-medium text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quadriceps & Deceleration Armor</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Wed 45° Leg Press (3) + Wed Seated Leg Ext (3)
            </p>
          </div>
          <span className="font-mono text-sm font-bold text-indigo-300 tabular-nums">
            {metrics.quadricepsSets} sets
          </span>
        </div>
      </div>

      {/* Rationale Footer Callout */}
      <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-200/90 leading-relaxed">
        <span className="font-bold text-emerald-300">Biomechanical Rationale: </span>
        Station-locked superset on Wednesday integrates the cable face pull with zero transit time, restoring an indisputable <strong>2:1 total posture-to-push ratio</strong> (12:6) and <strong>1.5:1 dynamic ratio</strong> (9:6) while protecting knee joint decelerations for football.
      </div>
    </section>
  );
}
