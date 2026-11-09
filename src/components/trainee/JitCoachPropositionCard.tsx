"use client";

import React, { useState } from "react";
import { CoachProposition, CoachingTier } from "@/lib/ai/coach-agent";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Flame,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";

export interface JitCoachPropositionCardProps {
  proposition: CoachProposition;
  onAccept: (proposition: CoachProposition) => void;
  onDismiss: (proposition: CoachProposition) => void;
}

interface TierVisualTheme {
  shortBadge: string;
  ctaLabel: string;
  accentHex: string;
  glowGradient: string;
  borderClass: string;
  pillBgClass: string;
  pillTextClass: string;
  ctaClass: string;
}

const TIER_THEME_MAP: Record<CoachingTier, TierVisualTheme> = {
  tier_1_micro_setup: {
    shortBadge: "SETUP CALIBRATION",
    ctaLabel: "Lock In Setup Cue",
    accentHex: "#38BDF8",
    glowGradient:
      "radial-gradient(120% 90% at 0% 0%, rgba(56, 189, 248, 0.16) 0%, rgba(11, 15, 23, 0) 70%)",
    borderClass: "border-sky-500/30",
    pillBgClass: "bg-sky-500/12 border-sky-400/30",
    pillTextClass: "text-sky-300",
    ctaClass:
      "bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200 text-slate-950 shadow-sky-500/20",
  },
  tier_2_surgical_swap: {
    shortBadge: "SMART MOVEMENT UPGRADE",
    ctaLabel: "Switch to This Move",
    accentHex: "#F59E0B",
    glowGradient:
      "radial-gradient(120% 90% at 0% 0%, rgba(245, 158, 11, 0.18) 0%, rgba(11, 15, 23, 0) 70%)",
    borderClass: "border-amber-500/35",
    pillBgClass: "bg-amber-500/12 border-amber-400/35",
    pillTextClass: "text-amber-300",
    ctaClass:
      "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20",
  },
  tier_3_volume_prune: {
    shortBadge: "VOLUME FOCUS",
    ctaLabel: "Apply Set Trim",
    accentHex: "#A855F7",
    glowGradient:
      "radial-gradient(120% 90% at 0% 0%, rgba(168, 85, 247, 0.16) 0%, rgba(11, 15, 23, 0) 70%)",
    borderClass: "border-purple-500/30",
    pillBgClass: "bg-purple-500/12 border-purple-400/30",
    pillTextClass: "text-purple-300",
    ctaClass:
      "bg-gradient-to-r from-purple-400 to-fuchsia-400 hover:from-purple-300 hover:to-fuchsia-300 text-slate-950 shadow-purple-500/20",
  },
  tier_4_overload_protocol: {
    shortBadge: "OVERLOAD BREAKTHROUGH",
    ctaLabel: "Accept +2.5 kg Jump",
    accentHex: "#10B981",
    glowGradient:
      "radial-gradient(120% 90% at 0% 0%, rgba(16, 185, 129, 0.18) 0%, rgba(11, 15, 23, 0) 70%)",
    borderClass: "border-emerald-500/35",
    pillBgClass: "bg-emerald-500/12 border-emerald-400/35",
    pillTextClass: "text-emerald-300",
    ctaClass:
      "bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 shadow-emerald-500/20",
  },
  tier_5_macro_pivot: {
    shortBadge: "RECOVERY SHIELD",
    ctaLabel: "Apply Recovery Buffer",
    accentHex: "#F43F5E",
    glowGradient:
      "radial-gradient(120% 90% at 0% 0%, rgba(244, 63, 94, 0.18) 0%, rgba(11, 15, 23, 0) 70%)",
    borderClass: "border-rose-500/35",
    pillBgClass: "bg-rose-500/12 border-rose-400/35",
    pillTextClass: "text-rose-300",
    ctaClass:
      "bg-gradient-to-r from-rose-400 to-amber-300 hover:from-rose-300 hover:to-amber-200 text-slate-950 shadow-rose-500/20",
  },
};

export function JitCoachPropositionCard({
  proposition,
  onAccept,
  onDismiss,
}: JitCoachPropositionCardProps) {
  const [showTrace, setShowTrace] = useState(false);
  const theme =
    TIER_THEME_MAP[proposition.tier] || TIER_THEME_MAP.tier_2_surgical_swap;
  const trace = proposition.agentTrace;
  const mut = proposition.mutation;
  const isSwap = Boolean(
    mut.newExerciseName &&
      mut.newExerciseName.toLowerCase() !==
        proposition.exerciseName.toLowerCase()
  );

  const renderTierIcon = () => {
    switch (proposition.tier) {
      case "tier_4_overload_protocol":
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
      case "tier_5_macro_pivot":
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
      case "tier_3_volume_prune":
        return <Flame className="w-3.5 h-3.5 text-purple-400" />;
      case "tier_1_micro_setup":
        return <Compass className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <section
      data-testid="jit-coach-proposition-card"
      aria-label="AI Coach Recommendation"
      className={`relative overflow-hidden rounded-2xl bg-[#0B0F17] border ${theme.borderClass} p-3.5 sm:p-4 shadow-[0_16px_40px_rgba(0,0,0,0.55)] animate-in fade-in slide-in-from-top-2 duration-300 font-body`}
      style={{ backgroundImage: theme.glowGradient }}
    >
      {/* Top Specular Hairline Accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${theme.accentHex} 35%, transparent 100%)`,
        }}
      />

      {/* 1. Compact Header Strip: Coach Whisper Pill + Optional "Why?" Progressive Disclosure */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${theme.pillBgClass} ${theme.pillTextClass}`}
        >
          {renderTierIcon()}
          <span>{theme.shortBadge}</span>
        </div>

        <button
          type="button"
          onClick={() => setShowTrace((prev) => !prev)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#131A29]/90 hover:bg-[#1A2438] border border-white/10 text-[10px] font-mono font-semibold text-slate-300 hover:text-white transition cursor-pointer"
        >
          <span>{showTrace ? "Hide why" : "Why this call?"}</span>
          {showTrace ? (
            <ChevronUp className="w-3 h-3 text-slate-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-slate-400" />
          )}
        </button>
      </div>

      {/* 2. Glanceable Visual Transformation Box (Readable in < 2 Seconds) */}
      <div className="rounded-xl bg-[#070A10]/90 border border-white/[0.07] p-3 mb-2.5">
        {isSwap ? (
          <div className="space-y-2">
            {/* From -> To Movement Strip */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
              <span className="line-through text-slate-500 truncate max-w-[160px]">
                {proposition.exerciseName}
              </span>
              <ArrowRight className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="text-amber-400/90 uppercase font-bold tracking-wider text-[10px]">
                Better Biomechanical Match
              </span>
            </div>

            {/* New Target Exercise Name */}
            <div className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-none">
              {mut.newExerciseName}
            </div>

            {/* Tabular Prescription Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {mut.newTargetWeightKg !== undefined && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-extrabold tabular-nums">
                  {mut.newTargetWeightKg} kg
                </span>
              )}
              {mut.newRepLow !== undefined && mut.newRepHigh !== undefined && (
                <span className="px-2 py-0.5 rounded-md bg-[#131A29] border border-white/10 text-slate-200 font-mono text-[11px] font-bold tabular-nums">
                  {mut.newRepLow}–{mut.newRepHigh} reps
                </span>
              )}
              {mut.newEquipment && (
                <span className="px-2 py-0.5 rounded-md bg-[#131A29] border border-white/10 text-slate-300 font-mono text-[10px] uppercase tracking-wider">
                  {mut.newEquipment}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-white leading-tight">
              {proposition.headline.replace("➔", "→")}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {mut.newTargetWeightKg !== undefined && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-extrabold tabular-nums">
                  Target: {mut.newTargetWeightKg} kg
                </span>
              )}
              {mut.newTargetSets !== undefined && (
                <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-[11px] font-extrabold tabular-nums">
                  {mut.newTargetSets} Working Sets
                </span>
              )}
              {mut.newTargetRir !== undefined && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-[11px] font-bold tabular-nums">
                  RIR {mut.newTargetRir}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 1-Line Coach Takeaway + Optional Form Cue */}
        <p className="text-xs text-slate-300 leading-snug mt-2">
          {proposition.observation}
        </p>

        {mut.newFormCue && (
          <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-start gap-1.5 text-[11px] text-slate-300">
            <span className="font-mono font-bold uppercase text-[10px] text-amber-400 flex-shrink-0 mt-0.5">
              Cue:
            </span>
            <span className="leading-snug text-slate-200">{mut.newFormCue}</span>
          </div>
        )}
      </div>

      {/* 3. Progressive Disclosure Drawer: Deep Biomechanics & Agent Trace (Hidden by Default) */}
      {showTrace && (
        <div
          data-testid="agent-execution-trace"
          className="rounded-xl bg-[#070A10] border border-sky-500/20 p-3 mb-3 space-y-2.5 text-xs animate-in fade-in duration-200"
        >
          {proposition.sensoryRagContext && (
            <div className="p-2 rounded-lg bg-[#111726] border-l-2 border-amber-400 text-[11px] text-slate-200">
              <span className="font-mono font-bold uppercase text-[10px] text-amber-400 block mb-0.5">
                Past Biofeedback Memory
              </span>
              {proposition.sensoryRagContext}
            </div>
          )}

          <div>
            <span className="font-mono font-bold uppercase text-[10px] text-sky-400 block mb-0.5">
              Biomechanical Rationale
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {proposition.rootCauseDiagnosis}
            </p>
          </div>

          {trace && trace.steps.length > 0 && (
            <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>COACH VERIFICATION ({trace.steps.length} CHECKS)</span>
                {trace.selfCorrectionRetries > 0 && (
                  <span className="text-amber-400">
                    {trace.selfCorrectionRetries} guardrail self-correction
                  </span>
                )}
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {trace.steps.map((s) => (
                  <div
                    key={`${s.stepIndex}_${s.toolName}`}
                    className="text-[10px] font-mono text-slate-400 flex items-start gap-1.5 leading-tight"
                  >
                    <span className="text-emerald-400">✓</span>
                    <span className="text-slate-300">{s.observationSummary}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Zero-Friction 1-Tap Action Bar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="accept-evolution-btn"
          onClick={() => onAccept(proposition)}
          className={`flex-1 py-2.5 px-3.5 rounded-xl font-display uppercase tracking-wider text-xs font-black shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer ${theme.ctaClass}`}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.75]" />
          <span>{theme.ctaLabel}</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <button
          type="button"
          data-testid="dismiss-evolution-btn"
          onClick={() => onDismiss(proposition)}
          className="py-2.5 px-3 rounded-xl bg-[#131A29] hover:bg-[#1A2438] text-slate-300 hover:text-white border border-white/10 font-display uppercase tracking-wider text-xs font-bold transition active:scale-[0.98] flex items-center justify-center gap-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5 text-slate-400" />
          <span>Keep Original</span>
        </button>
      </div>
    </section>
  );
}
