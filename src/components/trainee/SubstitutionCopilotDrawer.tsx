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
        className="max-w-md mx-auto rounded-t-3xl bg-[#090C11] border-[#1C2436] p-6 space-y-4 max-h-[88vh] overflow-y-auto font-body shadow-2xl text-slate-100"
      >
        {/* 1. Header (Eyebrow + Title) */}
        <SheetHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Biomechanical Copilot</span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#182030] text-slate-300 border border-[#1C2436]">
              {currentExercise.equipment}
            </span>
          </div>
          <SheetTitle className="text-xl font-editorial font-bold text-white tracking-tight pt-1">
            Swap {currentExercise.name}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-400 font-body">
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
                "min-h-[38px] px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border cursor-pointer font-body",
                equipmentFilter === f.id
                  ? "bg-amber-400 text-slate-950 font-display font-black uppercase tracking-wider shadow-sm border-amber-400"
                  : "bg-[#111622] border-[#1C2436] text-slate-400 hover:text-white"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 3. Ranked Alternatives List (Strictly <= 3 cards) */}
        <div className="space-y-3 pt-1">
          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-slate-400 animate-pulse">
              Computing optimal motor vector matches...
            </div>
          ) : candidates.length > 0 ? (
            candidates.map((cand, idx) => (
              <div
                key={cand.exercise.id || idx}
                className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl space-y-3 shadow-sm hover:border-slate-700 transition"
              >
                {/* Top Meta Badges: Similarity + Resistance Profile */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {Math.round(cand.similarityScore * 100)}% Match
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#182030] text-sky-400 border border-[#1C2436]">
                      {cand.resistanceProfile} Tension
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {cand.exercise.equipment}
                  </span>
                </div>

                {/* Candidate Name */}
                <div>
                  <h4 className="text-base font-editorial font-bold text-white tracking-tight">
                    {cand.exercise.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Target: <span className="text-amber-400 font-semibold">{cand.exercise.target}</span> · Division: <span className="text-slate-300">{cand.subdivision.replace('_', ' ')}</span>
                  </p>
                </div>

                {/* Coach Rationale */}
                <div className="p-3 rounded-xl bg-[#090C11] border border-[#1C2436] space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                    <CheckCircle2 className="w-3 h-3 text-amber-400" />
                    <span>Coach Rationale</span>
                  </div>
                  <p className="text-[11.5px] leading-snug text-slate-200">
                    {cand.biomechanicalRationale}
                  </p>
                  {cand.setupAdjustmentCue && (
                    <p className="text-[10.5px] leading-snug text-slate-400 pt-1 border-t border-[#1C2436] mt-1">
                      <span className="text-sky-400 font-semibold">Setup Tip: </span>
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
                  className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>Swap into Active Workout</span>
                </button>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 bg-[#111622] rounded-2xl border border-[#1C2436]">
              No direct substitutes found matching the filter criteria.
            </div>
          )}
        </div>

        {/* Secondary Dismiss Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 bg-[#111622] hover:bg-[#182030] text-slate-300 font-display uppercase tracking-wider font-bold text-xs rounded-xl border border-[#1C2436] transition cursor-pointer"
          >
            Cancel & Keep Current Exercise
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
