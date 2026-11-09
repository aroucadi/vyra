"use client";

import React from "react";
import { AutoregulationPlan } from "@/lib/autoregulation";
import { WearableBiometricSnapshot } from "@/lib/types";
import { ShieldAlert, Check, RefreshCw, Zap, ArrowRight, Watch } from "lucide-react";

interface AdaptiveRecalibrationCardProps {
  plan: AutoregulationPlan;
  onAccept: () => void;
  onDismiss: () => void;
  isApplied: boolean;
  wearableSnapshot?: WearableBiometricSnapshot | null;
}

export function AdaptiveRecalibrationCard({
  plan,
  onAccept,
  onDismiss,
  isApplied,
  wearableSnapshot,
}: AdaptiveRecalibrationCardProps) {
  const isReduced = plan.reducedRecovery ?? plan.cnsFatigueDetected;

  // If optimal recovery and no fatigue, show quiet progressive overload badge
  if (!isReduced) {
    return (
      <div className="bg-[#111622] border border-sky-500/30 rounded-2xl p-4 transition-all font-body shadow-sm">
        {/* Element 1: Eyebrow */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[11px] font-display font-bold uppercase tracking-wider text-sky-400">
              Full Recovery · You said {plan.sleepHours}h sleep
            </span>
          </div>
          {wearableSnapshot && wearableSnapshot.source !== "manual" && (
            <span className="flex items-center gap-1 text-[10px] font-mono tabular-nums text-sky-300 bg-sky-950/60 border border-sky-800/40 px-2 py-0.5 rounded-full">
              <Watch className="w-3 h-3 text-sky-400" />
              <span>Wearable · {wearableSnapshot.hrvMs ? `${wearableSnapshot.hrvMs}ms` : "Synced"}</span>
            </span>
          )}
        </div>

        {/* Element 2: Value / Content */}
        <div className="mb-3">
          <p className="text-sm font-editorial font-bold text-white">Full Recovery Capacity</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Target upper rep ceiling with planned RIR. Conditions ready for progressive overload.
          </p>
        </div>

        {/* Element 3: Supporting Status */}
        <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-sky-400 bg-sky-500/10 border border-sky-500/30 rounded-lg px-2.5 py-1.5 w-fit">
          <Zap className="w-3.5 h-3.5" />
          <span>Full Progression Active</span>
        </div>
      </div>
    );
  }

  // Sub-optimal or Depleted CNS state: Max 3 vertical elements
  const primaryCompound = plan.prescriptionDeltas.find((d) => d.isAxialLoaded) || plan.prescriptionDeltas[0];

  return (
    <div className="bg-[#111622] border border-amber-500/30 rounded-2xl p-4 shadow-lg transition-all animate-in fade-in duration-300 font-body">
      {/* 1. Element 1: Eyebrow with state & sleep */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] font-display font-bold uppercase tracking-wider text-amber-300">
            {plan.headline}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {wearableSnapshot && wearableSnapshot.source !== "manual" && (
            <span className="flex items-center gap-1 text-[10px] font-mono tabular-nums text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
              <Watch className="w-3 h-3 text-amber-400" />
              <span>Wearable · {wearableSnapshot.hrvMs ? `${wearableSnapshot.hrvMs}ms` : "Synced"}</span>
            </span>
          )}
          <span className="text-xs font-mono tabular-nums text-slate-300 bg-[#182030] px-2 py-0.5 rounded-full border border-[#1C2436]">
            {plan.sleepHours}h sleep
          </span>
        </div>
      </div>

      {/* 2. Element 2: Primary Recalibration Hero Value */}
      {primaryCompound && (
        <div className="bg-[#090C11] border border-[#1C2436] rounded-xl p-3 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white truncate pr-2">
              {primaryCompound.originalName}
            </span>
            <div className="flex items-center gap-1.5 font-mono tabular-nums text-xs">
              <span className="text-slate-500 line-through">
                {primaryCompound.originalWeightKg} kg
              </span>
              <ArrowRight className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400 font-bold text-sm">
                {primaryCompound.adaptedWeightKg} kg
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-[#1C2436] font-mono tabular-nums">
            <span>RIR buffer: +{primaryCompound.adaptedRir - primaryCompound.originalRir} ({primaryCompound.originalRir} → {primaryCompound.adaptedRir})</span>
            {primaryCompound.isSubstituted && (
              <span className="text-sky-400 font-mono text-[10px] bg-[#182030] border border-[#1C2436] px-1.5 py-0.5 rounded">
                Alt: {primaryCompound.adaptedName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Element 3: Supporting Action */}
      <div className="flex items-center gap-2">
        {isApplied ? (
          <div className="w-full flex items-center justify-between py-2.5 px-3 bg-amber-500/10 border border-amber-500/40 rounded-xl">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Adapted Plan Active</span>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="text-[11px] underline text-slate-400 hover:text-white px-1.5 py-0.5 cursor-pointer font-medium font-mono"
            >
              Undo
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onAccept}
              className="flex-1 min-h-[44px] px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Apply Adapted Weights</span>
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="min-h-[44px] px-3.5 text-slate-400 hover:text-white text-xs font-display uppercase tracking-wider font-bold rounded-xl hover:bg-[#182030] border border-[#1C2436] transition-colors cursor-pointer"
            >
              Keep Original
            </button>
          </>
        )}
      </div>
    </div>
  );
}
