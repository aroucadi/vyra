"use client";

import React, { useState } from "react";
import { RoleEvaluationResult, BALANCE_STATUSES } from "@/lib/training-math/structural-balance-types";
import { Sparkles, ShieldAlert, CheckCircle2, ArrowRight, Check } from "lucide-react";
import { clsx } from "clsx";

export interface IntelligentPostureDiagnosisProps {
  results: RoleEvaluationResult[];
  onInjectCorrective?: (exerciseName: string) => Promise<void> | void;
  className?: string;
}

export function IntelligentPostureDiagnosis({
  results,
  onInjectCorrective,
  className,
}: IntelligentPostureDiagnosisProps) {
  const [injectedExercise, setInjectedExercise] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Analyze deficits across evaluated roles
  const weakRoles = results.filter((r) => r.status === BALANCE_STATUSES.WEAK);
  const borderlineRoles = results.filter((r) => r.status === BALANCE_STATUSES.BORDERLINE);

  // Determine biomechanical diagnosis profile
  let diagnosisTitle = "Optimal Biomechanical Symmetry";
  let diagnosisRisk = "Low joint shear risk. Anterior and posterior chains are structurally aligned.";
  let correctiveExercise = "Standing Cable Face Pull";
  let correctiveReason = "Maintain scapular stability and rotator cuff endurance.";
  let riskSeverity: "safe" | "moderate" | "high" = "safe";

  if (weakRoles.length > 0 || borderlineRoles.length > 0) {
    const laggingRole = weakRoles[0]?.roleId || borderlineRoles[0]?.roleId || "";

    if (laggingRole.includes("bench") || laggingRole.includes("incline") || laggingRole.includes("overhead")) {
      diagnosisTitle = "Anterior Shoulder Impingement Risk";
      diagnosisRisk =
        "Pressing volume exceeds scapular retraction and external rotation stability. The humeral head experiences anterior shear during heavy loads.";
      correctiveExercise = "Trap-3 Raise / Incline Powell Raise";
      correctiveReason =
        "Strengthen the lower trapezius and infraspinatus to restore glenohumeral centering.";
      riskSeverity = "high";
    } else if (laggingRole.includes("deadlift") || laggingRole.includes("rdl") || laggingRole.includes("hamstring")) {
      diagnosisTitle = "Posterior Chain & Lumbar Overload";
      diagnosisRisk =
        "Quad-dominant knee extension exceeds posterior hip hinge strength, increasing shear stress on the lumbar spine.";
      correctiveExercise = "Barbell Romanian Deadlift (2s Eccentric)";
      correctiveReason =
        "Reinforce hamstring eccentric control and posterior pelvic tilt stability.";
      riskSeverity = "high";
    } else {
      diagnosisTitle = "Borderline Structural Asymmetry";
      diagnosisRisk =
        "Minor force-couple discrepancy detected between compound anchors and accessory stabilizers.";
      correctiveExercise = "Standing Cable Face Pull";
      correctiveReason = "Enhance posterior deltoid and upper back isometric stiffness.";
      riskSeverity = "moderate";
    }
  }

  const handleInject = async () => {
    if (!onInjectCorrective || isBusy || injectedExercise) return;
    setIsBusy(true);
    try {
      await onInjectCorrective(correctiveExercise);
      setInjectedExercise(correctiveExercise);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      className={clsx(
        "p-4 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4",
        className
      )}
    >
      {/* 1. Header: Eyebrow + Intelligent Copilot Icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
              Intelligent UI Synthesis
            </span>
            <h4 className="text-sm font-bold text-white tracking-tight leading-tight">
              Postural Architecture Diagnostic
            </h4>
          </div>
        </div>

        <span
          className={clsx(
            "text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold flex items-center gap-1",
            riskSeverity === "safe"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : riskSeverity === "moderate"
              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
              : "bg-rose-500/15 text-rose-400 border-rose-500/30"
          )}
        >
          {riskSeverity === "safe" ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              <span>SYMMETRICAL</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3 h-3" />
              <span>{riskSeverity === "high" ? "ELEVATED RISK" : "MONITOR"}</span>
            </>
          )}
        </span>
      </div>

      {/* 2. Primary Biomechanical Risk Synthesis */}
      <div className="p-3.5 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-1.5">
        <div className="text-xs font-bold text-white tracking-tight">{diagnosisTitle}</div>
        <p className="text-[11px] text-slate-300 leading-relaxed">{diagnosisRisk}</p>
      </div>

      {/* 3. Actionable Corrective Protocol (1-Tap Injection) */}
      <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
            Prescribed Corrective Accessory
          </span>
          <span className="text-[10px] font-mono text-slate-400">3 Sets × 12–15</span>
        </div>

        <div className="font-bold text-white text-xs">{correctiveExercise}</div>
        <p className="text-[11px] text-slate-300 leading-relaxed">{correctiveReason}</p>

        {onInjectCorrective && (
          <button
            type="button"
            onClick={handleInject}
            disabled={isBusy || Boolean(injectedExercise)}
            className={clsx(
              "w-full mt-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm",
              injectedExercise
                ? "bg-slate-800 text-slate-400 cursor-default"
                : "bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 cursor-pointer"
            )}
          >
            {injectedExercise ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Injected into Next Workout ✓</span>
              </>
            ) : (
              <>
                <span>Add to Training Blueprint</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
