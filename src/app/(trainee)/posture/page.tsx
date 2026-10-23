"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import type { RoleEvaluationResult } from "@/lib/training-math/structural-balance-types";
import { hasEntitlement, SubscriptionTier } from "@/lib/entitlements";
import { StructuralBalanceRadar } from "@/components/trainee/StructuralBalanceRadar";
import { IntelligentPostureDiagnosis } from "@/components/trainee/IntelligentPostureDiagnosis";
import { TraineeNav } from "@/components/trainee/TraineeNav";
import { ArrowLeft, Shield, Lock, Loader2 } from "lucide-react";
import { clsx } from "clsx";

export default function PostureArchitecturePage() {
  const currentUser = appStore.getCurrentUser();
  const userTier = ((currentUser as any).tier as SubscriptionTier) || "PRO";
  const isEntitled = hasEntitlement(userTier, "structural_balance_radar");

  const [activeTemplateKey, setActiveTemplateKey] = useState<string>("poliquin");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [results, setResults] = useState<RoleEvaluationResult[]>([]);
  const [roleLabels, setRoleLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch structural balance from /api/posture
  useEffect(() => {
    let active = true;
    const fetchBalance = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/posture?template=${activeTemplateKey}`);
        if (!res.ok) throw new Error("Failed to compute balance");
        const data = await res.json();
        if (active) {
          setResults(data.results || []);
          setRoleLabels(data.labels || {});
          setLoading(false);
        }
      } catch (err) {
        if (active) setLoading(false);
      }
    };

    fetchBalance();
    return () => {
      active = false;
    };
  }, [activeTemplateKey]);

  // 1-Tap Corrective Injection Handler
  const handleInjectCorrective = async (exerciseName: string) => {
    appStore.swapExerciseInActiveProgram(currentUser.id, "Standing Dumbbell Lateral Raise", exerciseName);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 pb-24 max-w-md mx-auto flex flex-col font-sans">
      {/* 1. Header (Negative constraint ceiling compliant) */}
      <header className="sticky top-0 z-30 bg-[#0B0F17]/95 backdrop-blur-md p-4 border-b border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/program"
              aria-label="Back to Program"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Postural Architecture</h1>
              <p className="text-[10px] font-mono text-slate-400">Biomechanical Symmetry & Symmetry Radar</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
            <Shield className="w-2.5 h-2.5" />
            <span>Poliquin Standard</span>
          </span>
        </div>

        {/* Template Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "poliquin", label: "Poliquin Standard" },
            { id: "thibaudeauPowerlifting", label: "Thibaudeau Power" },
            { id: "atg", label: "ATG Posture" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTemplateKey(t.id);
                setSelectedRoleId("");
              }}
              className={clsx(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                activeTemplateKey === t.id
                  ? "bg-slate-800 border-emerald-500/60 text-emerald-400 shadow-sm"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* 2. Main Content Body */}
      <main className="flex-1 p-4 space-y-5">
        {!isEntitled ? (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">Vyra Pro Architecture Required</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unlock the full Biomechanical Symmetry Radar, joint shear risk synthesis, and 1-tap postural corrective protocols.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md hover:bg-emerald-400 transition"
            >
              Upgrade to Vyra Pro ($19/mo) →
            </Link>
          </div>
        ) : loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Computing Biomechanical Symmetry...</span>
          </div>
        ) : (
          <>
            {/* Interactive SVG Radar */}
            <StructuralBalanceRadar
              results={results}
              labels={roleLabels}
              selectedRoleId={selectedRoleId}
              onSelectRole={setSelectedRoleId}
            />

            {/* Intelligent Generative UI Diagnostic Card */}
            <IntelligentPostureDiagnosis
              results={results}
              onInjectCorrective={handleInjectCorrective}
            />
          </>
        )}
      </main>

      {/* Trainee Navigation Footer */}
      <TraineeNav />
    </div>
  );
}
