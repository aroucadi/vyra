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
  // If optimal recovery and no fatigue, show quiet progressive overload badge
  if (!plan.cnsFatigueDetected) {
    return (
      <div className="bg-slate-900/70 border border-emerald-500/30 rounded-2xl p-4 transition-all">
        {/* Element 1: Eyebrow */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Full Recovery · You said {plan.sleepHours}h sleep
            </span>
          </div>
          {wearableSnapshot && (
            <span className="flex items-center gap-1 text-[10px] font-mono tabular-nums text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
              <Watch className="w-3 h-3 text-emerald-400" />
              <span>Watch · {wearableSnapshot.hrvMs ? `${wearableSnapshot.hrvMs}ms` : "Synced"}</span>
            </span>
          )}
        </div>

        {/* Element 2: Value / Content */}
        <div className="mb-3">
          <p className="text-sm font-semibold text-white">Full Recovery Capacity</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Target upper rep ceiling with planned RIR. Conditions ready for progressive overload.
          </p>
        </div>

        {/* Element 3: Supporting Status */}
        <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg px-2.5 py-1.5 w-fit">
          <Zap className="w-3.5 h-3.5" />
          <span>Full Progression Active</span>
        </div>
      </div>
    );
  }

  // Sub-optimal or Depleted CNS state: Max 3 vertical elements
  const primaryCompound = plan.prescriptionDeltas.find((d) => d.isAxialLoaded) || plan.prescriptionDeltas[0];

  return (
    <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-lg transition-all animate-in fade-in duration-300">
      {/* 1. Element 1: Eyebrow with state & sleep */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
            {plan.headline}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {wearableSnapshot && (
            <span className="flex items-center gap-1 text-[10px] font-mono tabular-nums text-amber-300 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full">
              <Watch className="w-3 h-3 text-amber-400" />
              <span>Watch · {wearableSnapshot.hrvMs ? `${wearableSnapshot.hrvMs}ms` : "Synced"}</span>
            </span>
          )}
          <span className="text-xs font-mono tabular-nums text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
            {plan.sleepHours}h sleep
          </span>
        </div>
      </div>

      {/* 2. Element 2: Primary Recalibration Hero Value */}
      {primaryCompound && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 truncate pr-2">
              {primaryCompound.originalName}
            </span>
            <div className="flex items-center gap-1.5 font-mono tabular-nums text-xs">
              <span className="text-slate-500 line-through">
                {primaryCompound.originalWeightKg} kg
              </span>
              <ArrowRight className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold text-sm">
                {primaryCompound.adaptedWeightKg} kg
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono tabular-nums">
            <span>RIR buffer: +{primaryCompound.adaptedRir - primaryCompound.originalRir} ({primaryCompound.originalRir} → {primaryCompound.adaptedRir})</span>
            {primaryCompound.isSubstituted && (
              <span className="text-cyan-400 font-sans font-medium text-[10px] bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                Machine Alt: {primaryCompound.adaptedName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Element 3: Supporting Action (Single Dominant CTA + Secondary Ghost) */}
      <div className="flex items-center gap-2">
        {isApplied ? (
          <div className="w-full flex items-center justify-between py-2 px-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Adapted Plan Active</span>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="text-[11px] underline text-slate-400 hover:text-white px-1.5 py-0.5 cursor-pointer font-medium"
            >
              Undo
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onAccept}
              className="flex-1 min-h-[44px] px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Apply Adapted Weights</span>
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="min-h-[44px] px-3.5 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              Keep Original
            </button>
          </>
        )}
      </div>
    </div>
  );
}
