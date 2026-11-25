"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { RagExercise } from "@/types/exercise-rag";
import { SubstitutionCandidate } from "@/lib/training-math/substitution-copilot";
import {
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  Video,
  X,
  Dumbbell,
  Check,
} from "lucide-react";
import { clsx } from "clsx";
import { resolveExerciseVideoUrl } from "@/lib/utils";
import { soundService } from "@/lib/in-gym/sound";

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
  const [equipmentFilter, setEquipmentFilter] = useState<
    "all" | "machine" | "dumbbell" | "cable" | "barbell" | "body weight"
  >("all");

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
  }, [
    currentExercise?.name,
    currentExercise?.target,
    currentExercise?.equipment,
    equipmentFilter,
    isOpen,
  ]);

  if (!currentExercise) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-w-md mx-auto rounded-t-3xl bg-[#05080c] border-[#1b2d47] p-5 space-y-4 max-h-[88vh] overflow-y-auto font-body shadow-2xl text-slate-100"
      >
        {/* 1. Header (Eyebrow + Title) */}
        <SheetHeader className="text-left space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#10b981]" />
                <span>Station Copilot</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0f1724] text-slate-300 border border-[#1b2d47]">
                {currentExercise.equipment}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-[#0f1724] border border-[#1b2d47] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <SheetTitle className="text-lg font-display font-black text-white uppercase tracking-tight pt-1">
            Swap {currentExercise.name}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-400 font-body">
            Station occupied or unavailable? Choose a biomechanically equivalent replacement targeting the exact same motor recruitment.
          </SheetDescription>
        </SheetHeader>

        {/* 2. Quick Equipment Availability Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: "all", label: "All Available" },
            { id: "cable", label: "2:1 Cable Stack" },
            { id: "machine", label: "Machine / Lever" },
            { id: "dumbbell", label: "Dumbbell" },
            { id: "barbell", label: "Barbell Rig" },
            { id: "body weight", label: "Bodyweight" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setEquipmentFilter(f.id as typeof equipmentFilter)}
              className={clsx(
                "min-h-[34px] px-3 rounded-lg text-[11px] font-mono uppercase tracking-wider whitespace-nowrap transition border cursor-pointer",
                equipmentFilter === f.id
                  ? "bg-[#10b981] text-black font-black border-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  : "bg-[#0f1724] border-[#1b2d47] text-slate-400 hover:text-white hover:border-slate-600"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 3. Ranked Alternatives List */}
        <div className="space-y-3 pt-1">
          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-[#10b981] animate-pulse">
              Computing optimal motor vector matches...
            </div>
          ) : candidates.length > 0 ? (
            candidates.map((cand, idx) => {
              const videoUrl = resolveExerciseVideoUrl(cand.exercise.name, {
                explicitVideoUrl: cand.exercise.videoUrl,
              });

              return (
                <div
                  key={cand.exercise.id || idx}
                  className="p-4 bg-[#090d16] border border-[#1b2d47] rounded-xl space-y-3 shadow-lg hover:border-[#10b981]/50 transition"
                >
                  {/* Top Badges: Match % + Tension Profile */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40">
                        {Math.round(cand.similarityScore * 100)}% Match
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        {cand.resistanceProfile} Tension
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {cand.exercise.equipment}
                    </span>
                  </div>

                  {/* Candidate Name & Target */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-display font-bold text-white tracking-wide uppercase">
                        {cand.exercise.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Target:{" "}
                        <span className="text-[#10b981] font-semibold">
                          {cand.exercise.target}
                        </span>{" "}
                        · Division:{" "}
                        <span className="text-slate-300">
                          {cand.subdivision.replace("_", " ")}
                        </span>
                      </p>
                    </div>

                    {videoUrl && (
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[10px] font-mono font-bold hover:bg-cyan-500/30 shrink-0 cursor-pointer"
                        title="Preview form video"
                      >
                        <Video className="w-3 h-3" />
                        <span>VIDEO</span>
                      </a>
                    )}
                  </div>

                  {/* Coach Rationale */}
                  <div className="p-2.5 rounded-lg bg-[#05080c] border border-[#1b2d47]/80 space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#10b981]">
                      <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
                      <span>Biomechanical Rationale</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-200">
                      {cand.biomechanicalRationale}
                    </p>
                    {cand.setupAdjustmentCue && (
                      <p className="text-[10px] leading-relaxed text-slate-400 pt-1 border-t border-[#1b2d47]/60 mt-1">
                        <span className="text-cyan-400 font-semibold">
                          Setup Tip:{" "}
                        </span>
                        {cand.setupAdjustmentCue}
                      </p>
                    )}
                  </div>

                  {/* 1-Tap Swap CTA */}
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playTargetHitFeedback(true);
                      onApplySubstitute(cand.exercise);
                      onClose();
                    }}
                    className="w-full h-10 bg-[#10b981] hover:bg-[#059669] active:scale-[0.98] text-black font-display uppercase tracking-wider font-black text-xs rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.3)] transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
                    <span>Swap Station & Continue Workout</span>
                  </button>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 bg-[#090d16] rounded-xl border border-[#1b2d47]">
              No direct substitutes found matching the filter criteria.
            </div>
          )}
        </div>

        {/* Secondary Dismiss Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 bg-[#0f1724] hover:bg-[#1b2d47] text-slate-300 font-display uppercase tracking-wider font-bold text-xs rounded-xl border border-[#1b2d47] transition cursor-pointer"
          >
            Cancel & Keep Current Exercise
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
