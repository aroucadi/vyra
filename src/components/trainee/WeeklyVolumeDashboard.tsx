"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Activity,
  Scale,
  Sparkles,
  Dumbbell,
  ChevronDown,
  Layers,
} from "lucide-react";
import { clsx } from "clsx";
import { Program } from "@/lib/types";
import {
  WeeklyVolumeBreakdown,
  MASTER_PROGRAM_VOLUME_METRICS,
  computeWeeklyVolumeFromProgram,
} from "@/lib/training-math/weekly-volume";

export type { WeeklyVolumeBreakdown };
export { MASTER_PROGRAM_VOLUME_METRICS, computeWeeklyVolumeFromProgram };

interface WeeklyVolumeDashboardProps {
  program?: Program | null;
  metrics?: WeeklyVolumeBreakdown;
  className?: string;
}

export function WeeklyVolumeDashboard({
  program,
  metrics: metricsOverride,
  className,
}: WeeklyVolumeDashboardProps) {
  const [showRationale, setShowRationale] = useState(false);

  const metrics = useMemo(() => {
    if (metricsOverride) return metricsOverride;
    if (program) return computeWeeklyVolumeFromProgram(program);
    return MASTER_PROGRAM_VOLUME_METRICS;
  }, [program, metricsOverride]);

  const totalVolume = metrics.upperPressingSets + metrics.totalPosturalSets;
  const posturalPercent =
    totalVolume > 0 ? Math.round((metrics.totalPosturalSets / totalVolume) * 100) : 50;
  const pressingPercent = totalVolume > 0 ? 100 - posturalPercent : 50;

  return (
    <section
      className={clsx(
        "rounded-3xl bg-[#111622] border border-[#1C2436] p-5 sm:p-6 space-y-5 font-body shadow-xl relative overflow-hidden select-none",
        className
      )}
    >
      {/* Ambient Visual Accent */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header: Title + Precision Eyebrow */}
      <div className="flex items-center justify-between border-b border-[#1C2436] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Biomechanical Architecture
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {metrics.splitLabel || "Active Split"}
            </span>
          </div>
          <h2 className="text-xl font-editorial font-bold text-white tracking-tight">
            Volume & Postural Allocation
          </h2>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-[#090C11] border border-[#1C2436] flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
          <Scale className="w-4 h-4" />
        </div>
      </div>

      {/* 1. HERO DUAL KINETIC GAUGE: Posture vs Press Ratio */}
      <div className="p-4 rounded-2xl bg-[#090C11] border border-[#1C2436] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-editorial font-bold text-white tracking-tight">
              Scapular Protection Equilibrium
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono font-bold">
            <span className="text-amber-400 tabular-nums">{metrics.totalPosturalRatio}</span>
            <span className="text-slate-400 font-normal">Posture-to-Push</span>
          </div>
        </div>

        {/* Proportional Dual Bar Meter */}
        {metrics.isPosturallyDeficient && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-200">
            <span className="text-amber-400 font-bold shrink-0">⚠️ Alert:</span>
            <span>
              {metrics.posturalWarningMessage ||
                "Posture-to-push ratio is below the recommended 1.5:1 minimum threshold. Consider adding face pulls, rows, or rear delt work to protect shoulder health."}
            </span>
          </div>
        )}
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full bg-[#182030] overflow-hidden flex p-0.5 border border-[#1C2436]">
            <div
              style={{ width: `${posturalPercent}%` }}
              className="h-full rounded-l-full bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] transition-all duration-700"
              title={`Postural Work: ${metrics.totalPosturalSets} sets (${posturalPercent}%)`}
            />
            <div
              style={{ width: `${pressingPercent}%` }}
              className="h-full rounded-r-full bg-gradient-to-r from-slate-200 to-white opacity-80 transition-all duration-700 ml-0.5"
              title={`Pressing Work: ${metrics.upperPressingSets} sets (${pressingPercent}%)`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-300 font-semibold">{metrics.totalPosturalSets} Postural Sets</span>
              <span className="text-slate-500">({metrics.dynamicRatio} dynamic)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-slate-300 font-semibold">{metrics.upperPressingSets} Press Sets</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Metric Matrix */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="p-3.5 bg-[#090C11] rounded-2xl border border-[#1C2436] space-y-0.5 shadow-sm">
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block font-semibold">
            Postural Sets
          </span>
          <div className="text-2xl font-black text-amber-400 font-display tabular-nums">
            {metrics.totalPosturalSets}
          </div>
          <span className="text-[10px] font-mono text-slate-400 block">
            {metrics.totalPosturalSets} sets / wk
          </span>
        </div>

        <div className="p-3.5 bg-[#090C11] rounded-2xl border border-[#1C2436] space-y-0.5 shadow-sm">
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block font-semibold">
            Side Delts
          </span>
          <div className="text-2xl font-black text-sky-400 font-display tabular-nums">
            {metrics.lateralDeltExposures}x
          </div>
          <span className="text-[10px] font-mono text-slate-400 block">
            {metrics.lateralDeltExposures >= 2 ? "High-Freq" : "Weekly Freq"}
          </span>
        </div>

        <div className="p-3.5 bg-[#090C11] rounded-2xl border border-[#1C2436] space-y-0.5 shadow-sm">
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block font-semibold">
            Quads Volume
          </span>
          <div className="text-2xl font-black text-white font-display tabular-nums">
            {metrics.quadricepsSets}
          </div>
          <span className="text-[10px] font-mono text-slate-400 block">
            sets / wk
          </span>
        </div>
      </div>

      {/* 3. Detailed Biomechanical Channel Cards */}
      <div className="space-y-2 text-xs">
        <div className="p-3.5 rounded-2xl bg-[#090C11] border border-[#1C2436] hover:border-slate-700 transition flex items-center justify-between gap-3 group">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#182030] border border-[#1C2436] flex items-center justify-center text-slate-300">
                <Dumbbell className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-white tracking-tight">Upper-Body Pressing</span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#182030] text-slate-300 border border-[#1C2436]">
                Anterior
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono pl-8 truncate">
              {metrics.pressingSummary || MASTER_PROGRAM_VOLUME_METRICS.pressingSummary}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="font-display text-base font-bold text-white tabular-nums">
              {metrics.upperPressingSets}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">sets</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#090C11] border border-[#1C2436] hover:border-amber-500/40 transition flex items-center justify-between gap-3 group">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-white tracking-tight">Upper Dynamic Pulling</span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">
                V-Taper
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono pl-8 truncate">
              {metrics.pullingSummary || MASTER_PROGRAM_VOLUME_METRICS.pullingSummary}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="font-display text-base font-bold text-amber-400 tabular-nums">
              {metrics.upperDynamicPullingSets}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">sets</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#090C11] border border-[#1C2436] hover:border-sky-500/40 transition flex items-center justify-between gap-3 group">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-white tracking-tight">Posterior Isometric Retraction</span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/25">
                Anchor
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono pl-8 truncate">
              {metrics.isometricSummary || MASTER_PROGRAM_VOLUME_METRICS.isometricSummary}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="font-display text-base font-bold text-sky-400 tabular-nums">
              {metrics.posteriorIsometricSets}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">sets</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#090C11] border border-[#1C2436] hover:border-slate-700 transition flex items-center justify-between gap-3 group">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#182030] border border-[#1C2436] flex items-center justify-center text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-white tracking-tight">Quadriceps & Lower Force</span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#182030] text-slate-300 border border-[#1C2436]">
                Joints
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono pl-8 truncate">
              {metrics.quadsSummary || MASTER_PROGRAM_VOLUME_METRICS.quadsSummary}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="font-display text-base font-bold text-white tabular-nums">
              {metrics.quadricepsSets}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">sets</span>
          </div>
        </div>
      </div>

      {/* 4. Expandable Biomechanical Rationale */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowRationale((prev) => !prev)}
          className="w-full p-3 rounded-2xl bg-[#090C11] border border-[#1C2436] hover:border-amber-500/40 text-xs font-semibold text-slate-300 flex items-center justify-between transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-editorial font-bold">Why This Blueprint Works</span>
            <span className="text-[10px] font-mono text-slate-500">· Scapular & Volume Balance</span>
          </div>
          <ChevronDown
            className={clsx(
              "w-4 h-4 text-slate-400 transition-transform duration-200",
              showRationale && "rotate-180 text-amber-400"
            )}
          />
        </button>

        {showRationale && (
          <div className="mt-2 p-4 rounded-2xl bg-[#090C11] border border-amber-500/30 text-xs text-slate-300 leading-relaxed font-body space-y-2 animate-in fade-in duration-200">
            <p>
              <strong className={clsx("font-semibold font-editorial", metrics.isPosturallyDeficient ? "text-amber-400" : "text-emerald-400")}>
                Posture-to-Push Equilibrium ({metrics.totalPosturalRatio}):
              </strong>{" "}
              {metrics.isPosturallyDeficient
                ? `Current program provides ${metrics.totalPosturalSets} weekly postural/pulling sets against ${metrics.upperPressingSets} upper pressing sets (${metrics.totalPosturalRatio}). This is below the recommended 1.5:1 minimum threshold — prioritize upper back and rear delt pulling volume to protect scapular alignment and glenohumeral stability.`
                : `Balancing ${metrics.totalPosturalSets} weekly postural/pulling sets against ${metrics.upperPressingSets} upper pressing sets protects scapular alignment and glenohumeral joint longevity without sacrificing pressing strength.`}
            </p>
            <p>
              <strong className="text-sky-400 font-semibold font-editorial">
                Weekly Progression Distribution:
              </strong>{" "}
              Your active block schedules {metrics.quadricepsSets} direct quadriceps sets and {metrics.lateralDeltExposures} lateral-delt exposures across {metrics.splitLabel || "your weekly split"} to drive measurable overload while managing recovery.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
