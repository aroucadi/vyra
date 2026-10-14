"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CoachSmartActionCardData } from "@/lib/coach-engine";
import { appStore } from "@/lib/store";
import { telemetry } from "@/lib/telemetry";
import { Check, ArrowRight, Sparkles, RefreshCw, Clock, ShieldAlert } from "lucide-react";
import { clsx } from "clsx";

interface CoachSmartActionCardProps {
  card: CoachSmartActionCardData;
  traineeId: string;
  onApplied?: (message: string) => void;
}

export function CoachSmartActionCard({
  card,
  traineeId,
  onApplied,
}: CoachSmartActionCardProps) {
  const [isApplied, setIsApplied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  if (isDismissed) return null;

  const handleApply = () => {
    const { actionType, currentExercise, newExercise, targetMinutes, loadFactor, rirDelta, dayOfWeek } =
      card.actionPayload;

    let resMessage = "";

    if (actionType === "swap" && currentExercise && newExercise) {
      const res = appStore.swapExerciseInActiveProgram(
        traineeId,
        currentExercise,
        newExercise,
        dayOfWeek
      );
      resMessage = res.message;
    } else if (actionType === "condense") {
      const res = appStore.condenseActiveProgramDay(
        traineeId,
        targetMinutes || 30,
        dayOfWeek
      );
      resMessage = res.message;
    } else if (actionType === "autoregulate") {
      const res = appStore.recalibrateActiveProgramLoads(
        traineeId,
        loadFactor || 0.9,
        rirDelta || 1,
        dayOfWeek
      );
      resMessage = res.message;
    }

    setIsApplied(true);
    setStatusMessage(resMessage || `Applied to ${card.targetDayLabel || "your program"}`);

    telemetry.track(
      "coach_smart_action_applied",
      {
        actionType,
        cardType: card.type,
        targetDay: card.targetDayLabel,
      },
      traineeId
    );

    if (onApplied) {
      onApplied(resMessage);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    telemetry.track(
      "coach_smart_action_dismissed",
      {
        actionType: card.actionPayload.actionType,
      },
      traineeId
    );
  };

  return (
    <div
      className={clsx(
        "rounded-2xl border p-4 shadow-lg transition-all animate-in fade-in duration-300 mt-2",
        isApplied
          ? "bg-slate-900/90 border-emerald-500/40"
          : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
      )}
    >
      {/* 1. Element 1: Eyebrow */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          {card.type === "autoregulate" ? (
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          ) : card.type === "condense" ? (
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span
            className={clsx(
              "text-[10px] font-bold uppercase tracking-wider",
              card.type === "autoregulate"
                ? "text-amber-300"
                : card.type === "condense"
                ? "text-cyan-300"
                : "text-emerald-400"
            )}
          >
            {card.eyebrow}
          </span>
        </div>

        {card.targetDayLabel && (
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700 truncate max-w-[140px]">
            {card.targetDayLabel}
          </span>
        )}
      </div>

      {/* 2. Element 2: Primary Content / Mutation Proposal */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 mb-3 space-y-2">
        <h4 className="text-xs font-bold text-white tracking-tight flex items-center justify-between">
          <span>{card.headline}</span>
        </h4>
        <p className="text-[11px] text-slate-400 leading-relaxed">{card.subtext}</p>

        {card.details.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-850 text-center font-mono tabular-nums text-[10px]">
            {card.details.map((d) => (
              <div key={d.label} className="bg-slate-900/60 rounded px-1.5 py-1">
                <span className="text-slate-500 block text-[9px] uppercase">{d.label}</span>
                <span className="text-slate-200 font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Intelligent UI Interactive Math / Formula Container */}
        {card.interactiveData && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-emerald-400 font-semibold uppercase tracking-wider">Formula in Code</span>
              <span className="text-slate-400 font-mono">Deterministic Math</span>
            </div>
            <code className="block text-[10px] text-slate-300 font-mono bg-slate-900/90 px-2 py-1 rounded border border-slate-800">
              {card.interactiveData.formula}
            </code>
            <p className="text-[10px] text-slate-400 italic">
              {card.interactiveData.conditionSummary}
            </p>
          </div>
        )}
      </div>

      {/* 3. Element 3: Supporting Action (Single Dominant CTA + 1-Tap Undo) */}
      <div>
        {isApplied ? (
          <div className="space-y-2">
            <div className="w-full py-2.5 px-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <Check className="w-4 h-4 stroke-[3]" />
                <span className="truncate">{statusMessage || "Blueprint Updated"}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsApplied(false);
                  setStatusMessage("");
                }}
                className="text-[11px] underline text-slate-400 hover:text-white px-1.5 py-0.5 cursor-pointer font-medium"
              >
                Undo
              </button>
            </div>
            <Link
              href="/session?mode=preview"
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>View Updated Session in Logger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {card.type === "load_explanation" ? (
              <Link
                href="/library"
                className="flex-1 min-h-[44px] px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{card.ctaLabel || "View Exercises"}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 min-h-[44px] px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{card.ctaLabel || "Apply Mutation"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="min-h-[44px] px-3.5 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
