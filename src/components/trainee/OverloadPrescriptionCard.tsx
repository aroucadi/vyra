"use client";

import React from "react";
import Link from "next/link";
import { TrendingUp, RefreshCw, Minus, Zap, Lock } from "lucide-react";
import { clsx } from "clsx";
import { hasEntitlement, SubscriptionTier } from "@/lib/entitlements";

export interface OverloadPrescriptionCardProps {
  exerciseName: string;
  policyName: string;
  kind: "up" | "hold" | "deload" | "first" | "off";
  weight?: number;
  reps?: number;
  previousWeight?: number;
  formattedWhy: string;
  unit?: string;
  userTier?: SubscriptionTier;
  onApply?: () => void;
  isApplied?: boolean;
}

export function OverloadPrescriptionCard({
  exerciseName,
  policyName,
  kind,
  weight,
  reps,
  previousWeight,
  formattedWhy,
  unit = "kg",
  userTier = "PRO",
  onApply,
  isApplied,
}: OverloadPrescriptionCardProps) {
  const isEntitled = hasEntitlement(userTier, "progression_engine");

  const weightDelta =
    weight != null && previousWeight != null ? Math.round((weight - previousWeight) * 10) / 10 : 0;

  // Status configuration conforming to 3-tier visual hierarchy
  const statusConfig = {
    up: {
      badge: "Overload Advance",
      badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      icon: TrendingUp,
      accentText: "text-amber-400",
      deltaPrefix: "+",
    },
    deload: {
      badge: "Deload Reset",
      badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      icon: RefreshCw,
      accentText: "text-rose-400",
      deltaPrefix: "",
    },
    hold: {
      badge: "Target Hold",
      badgeClass: "bg-[#182030] text-slate-300 border-[#1C2436]",
      icon: Minus,
      accentText: "text-slate-300",
      deltaPrefix: "",
    },
    first: {
      badge: "Baseline Established",
      badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      icon: Zap,
      accentText: "text-sky-400",
      deltaPrefix: "",
    },
    off: {
      badge: "Manual Targets",
      badgeClass: "bg-[#182030] text-slate-400 border-[#1C2436]",
      icon: Minus,
      accentText: "text-slate-400",
      deltaPrefix: "",
    },
  }[kind];

  const StatusIcon = statusConfig.icon;

  if (!isEntitled) {
    return (
      <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl space-y-3 relative overflow-hidden font-body shadow-sm">
        {/* Subtle blur overlay for Free tier */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 truncate">{exerciseName}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            <span>Vyra Pro</span>
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Automated progressive overload & 10% deload calculation available with Vyra Pro.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center w-full py-2.5 px-3 rounded-xl bg-[#182030] hover:bg-[#222C42] border border-[#1C2436] text-amber-300 text-xs font-display uppercase tracking-wider font-bold transition"
        >
          Unlock Automated Overload ($19/mo) →
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl space-y-3 font-body shadow-sm">
      {/* 1. Element 1: Eyebrow & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <StatusIcon className={clsx("w-3.5 h-3.5 flex-shrink-0", statusConfig.accentText)} />
          <span className="text-xs font-bold text-white tracking-tight truncate">{exerciseName}</span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">({policyName})</span>
        </div>
        <span
          className={clsx(
            "text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold flex-shrink-0",
            statusConfig.badgeClass
          )}
        >
          {statusConfig.badge}
        </span>
      </div>

      {/* 2. Element 2: Primary Value (Hero Content) with tabular numbers */}
      <div className="flex items-baseline justify-between pt-1 pb-0.5">
        <div className="flex items-baseline gap-2">
          {weight != null && (
            <span className="text-2xl font-black text-white tracking-tight tabular-nums font-display">
              {weight}
              <span className="text-xs font-medium text-slate-400 ml-1 font-mono">{unit}</span>
            </span>
          )}
          {reps != null && (
            <span className="text-sm font-semibold text-slate-300 tabular-nums font-mono">
              × {reps} reps
            </span>
          )}
        </div>

        {weightDelta !== 0 && (
          <span
            className={clsx(
              "text-xs font-mono font-bold tabular-nums",
              weightDelta > 0 ? "text-amber-400" : "text-rose-400"
            )}
          >
            {statusConfig.deltaPrefix}
            {weightDelta} {unit}
          </span>
        )}
      </div>

      {/* 3. Element 3: Supporting Action / Rationale */}
      <div className="pt-2 border-t border-[#1C2436] flex items-center justify-between gap-3 text-xs">
        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
          {formattedWhy}
        </p>
        {onApply && (
          <button
            type="button"
            onClick={onApply}
            disabled={isApplied}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition font-body cursor-pointer",
              isApplied
                ? "bg-[#182030] text-slate-500 cursor-default border border-[#1C2436]"
                : "bg-amber-400 hover:bg-amber-300 text-slate-950 font-display uppercase tracking-wider font-bold shadow-sm"
            )}
          >
            {isApplied ? "Applied ✓" : "Apply"}
          </button>
        )}
      </div>
    </div>
  );
}
