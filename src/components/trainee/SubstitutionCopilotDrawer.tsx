"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { RagExercise } from "@/types/exercise-rag";
import { SubstitutionCandidate } from "@/lib/training-math/substitution-copilot";
import {
  Sparkles,
  ArrowRightLeft,
  ShieldCheck,
  Disc,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { clsx } from "clsx";

interface SubstitutionCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentExercise: {
    id?: string;
    name: string;
    target: string;
    equipment: string;
    bodyPart?: string;
  } | null;
  onApplySubstitute: (candidate: RagExercise) => void;
}

export function SubstitutionCopilotDrawer({
  isOpen,
  onClose,
  currentExercise,
  onApplySubstitute,
}: SubstitutionCopilotDrawerProps) {
  const [candidates, setCandidates] = useState<SubstitutionCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [equipmentFilter, setEquipmentFilter] = useState<"all" | "machine" | "dumbbell" | "cable" | "barbell" | "body weight">("all");

  useEffect(() => {
    if (!currentExercise || !isOpen) return;

    let active = true;
    const fetchSubs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("name", currentExercise.name);
        params.set("target", currentExercise.target);
        params.set("equipment", currentExercise.equipment);
        params.set("limit", "6");

        if (equipmentFilter !== "all") {
          params.set("preferred", equipmentFilter);
        }

        const res = await fetch(`/api/substitutions?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load substitutions");
        const data = await res.json();

        if (active && data.substitutes) {
          setCandidates(data.substitutes);
        }
      } catch {
        // fail silently
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSubs();
    return () => {
      active = false;
    };
  }, [currentExercise?.name, currentExercise?.target, currentExercise?.equipment, equipmentFilter, isOpen]);

  if (!currentExercise) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-w-md mx-auto rounded-t-3xl bg-[#0B0F17] border-slate-800 p-5 space-y-4 max-h-[88vh] overflow-y-auto"
      >
        {/* 1. Header (Eyebrow + Title) */}
        <SheetHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Biomechanical Copilot</span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
              {currentExercise.equipment}
            </span>
          </div>
          <SheetTitle className="text-base font-bold text-white tracking-tight pt-0.5">
            Swap {currentExercise.name}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-400">
            Equipment occupied? Select a biomechanically matched alternative without losing target fiber recruitment.
          </SheetDescription>
        </SheetHeader>

        {/* 2. Quick Equipment Availability Filter (44px touch targets) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: "all", label: "All Available" },
            { id: "machine", label: "Machine / Smith" },
            { id: "dumbbell", label: "Dumbbell" },
            { id: "cable", label: "Cable" },
            { id: "barbell", label: "Barbell" },
            { id: "body weight", label: "Bodyweight" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setEquipmentFilter(f.id as typeof equipmentFilter)}
              className={clsx(
                "min-h-[38px] px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition border cursor-pointer",
                equipmentFilter === f.id
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 3. Ranked Alternatives List (Strictly <= 3 cards) */}
        <div className="space-y-3 pt-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
              Computing optimal motor vector matches...
            </div>
          ) : candidates.length > 0 ? (
            candidates.map((cand, idx) => (
              <div
                key={cand.exercise.id || idx}
                className="p-3.5 bg-slate-900/70 border border-slate-800/90 rounded-2xl space-y-2.5 shadow-sm hover:border-slate-700 transition"
              >
                {/* Top Meta Badges: Similarity + Resistance Profile */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {Math.round(cand.similarityScore * 100)}% Match
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {cand.resistanceProfile} Tension
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {cand.exercise.equipment}
                  </span>
                </div>

                {/* Candidate Name */}
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {cand.exercise.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Target: <span className="text-slate-300 font-semibold">{cand.exercise.target}</span> · Division: <span className="text-emerald-400">{cand.subdivision.replace('_', ' ')}</span>
                  </p>
                </div>

                {/* Coach Rationale */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/60 space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Coach Rationale</span>
                  </div>
                  <p className="text-[11.5px] leading-snug text-slate-300">
                    {cand.biomechanicalRationale}
                  </p>
                  {cand.setupAdjustmentCue && (
                    <p className="text-[10.5px] leading-snug text-slate-400 pt-0.5 border-t border-slate-800/50 mt-1">
                      <span className="text-cyan-400 font-semibold">Setup Tip: </span>
                      {cand.setupAdjustmentCue}
                    </p>
                  )}
                </div>

                {/* 1-Tap Dominant CTA (44px touch target) */}
                <button
                  type="button"
                  onClick={() => {
                    onApplySubstitute(cand.exercise);
                    onClose();
                  }}
                  className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Swap into Active Workout</span>
                </button>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800/60">
              No direct substitutes found matching the filter criteria.
            </div>
          )}
        </div>

        {/* Secondary Dismiss Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs rounded-xl border border-slate-800 transition cursor-pointer"
          >
            Cancel & Keep Current Exercise
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
