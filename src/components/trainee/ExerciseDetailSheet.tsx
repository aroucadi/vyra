"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { RagExercise } from "@/types/exercise-rag";
import { PlateCalculatorPopover } from "@/components/trainee/PlateCalculatorPopover";
import { AnatomicalTensionSpotlight } from "@/components/trainee/AnatomicalTensionSpotlight";
import { SubstitutionCandidate } from "@/lib/training-math/substitution-copilot";
import { appStore } from "@/lib/store";
import { resolveDayOneWorkoutDay } from "@/lib/onboarding";
import {
  Sparkles,
  ArrowRightLeft,
  Video,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Disc,
  Zap,
  ListOrdered,
} from "lucide-react";
import { clsx } from "clsx";

interface ExerciseDetailSheetProps {
  exercise: RagExercise | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectAsSubstitute?: (exercise: RagExercise) => void;
}

function extractGoldenCues(instructions?: string[]): { setupCue: string; driveCue: string } {
  if (!instructions || instructions.length === 0) {
    return {
      setupCue: "Position body with neutral spine and stable biomechanical foundation.",
      driveCue: "Drive through full active range of motion with controlled eccentrics.",
    };
  }

  const setupCue = instructions[0];
  const executionKeywords = [
    "press",
    "pull",
    "push",
    "lift",
    "drive",
    "extend",
    "curl",
    "row",
    "squat",
    "contract",
    "raise",
    "explode",
  ];
  let driveCue = instructions.length > 2 ? instructions[2] : instructions[1] || instructions[0];

  for (let i = 1; i < instructions.length; i++) {
    const lower = instructions[i].toLowerCase();
    if (executionKeywords.some((k) => lower.includes(k))) {
      driveCue = instructions[i];
      break;
    }
  }

  return { setupCue, driveCue };
}

export function ExerciseDetailSheet({
  exercise,
  isOpen,
  onClose,
  onSelectAsSubstitute,
}: ExerciseDetailSheetProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"cues" | "steps" | "swaps">("cues");
  const [candidates, setCandidates] = useState<SubstitutionCandidate[]>([]);
  const [substitutes, setSubstitutes] = useState<RagExercise[]>([]);

  // Fetch contextual biomechanical substitutes
  useEffect(() => {
    if (!exercise || !isOpen) return;
    let active = true;
    const fetchSubs = async () => {
      try {
        const res = await fetch(
          `/api/substitutions?name=${encodeURIComponent(exercise.name)}&target=${encodeURIComponent(exercise.target)}&equipment=${encodeURIComponent(exercise.equipment)}&limit=3`
        );
        if (res.ok) {
          const data = await res.json();
          if (active && data.substitutes && data.substitutes.length > 0) {
            setCandidates(data.substitutes);
            setSubstitutes(data.substitutes.map((c: SubstitutionCandidate) => c.exercise));
            return;
          }
        }
        // Fallback to basic muscle query if needed
        const fallback = await fetch(`/api/exercises?muscle=${encodeURIComponent(exercise.target)}&limit=4`);
        if (!fallback.ok) return;
        const fbData = await fallback.json();
        if (active) {
          const filtered = (fbData.exercises || []).filter((e: RagExercise) => e.id !== exercise.id).slice(0, 3);
          setSubstitutes(filtered);
        }
      } catch {
        // fail silently
      }
    };
    fetchSubs();
    return () => {
      active = false;
    };
  }, [exercise?.id, exercise?.name, exercise?.target, exercise?.equipment, isOpen]);

  // Reset internal states on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab("cues");
    }
  }, [isOpen, exercise?.id]);

  if (!exercise) return null;

  const isBarbellOrSmith =
    exercise.equipment.toLowerCase().includes("barbell") ||
    exercise.equipment.toLowerCase().includes("smith");

  const { setupCue, driveCue } = extractGoldenCues(exercise.instructions);

  const handleUseInDayOneSession = () => {
    const currentUser = appStore.getCurrentUser();
    const dayOne = resolveDayOneWorkoutDay(currentUser.id);
    if (dayOne.primaryExercise) {
      appStore.swapExerciseInActiveProgram(
        currentUser.id,
        dayOne.primaryExercise.exerciseName,
        exercise.name,
        dayOne.programDay?.dayOfWeek
      );
    }
    onClose();
    router.push("/today?onboarding=day0");
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-w-md mx-auto rounded-t-3xl bg-[#0B0F17] border-slate-800 p-5 space-y-4 max-h-[88vh] overflow-y-auto shadow-2xl"
      >
        {/* 1. Header (Eyebrow + Capitalized Title + Plate Popover) */}
        <SheetHeader className="text-left space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                {exercise.category || "Strength"}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                {exercise.equipment}
              </span>
            </div>
            {isBarbellOrSmith && (
              <PlateCalculatorPopover
                totalWeight={60}
                unit="kg"
                equipmentType={exercise.equipment}
              />
            )}
          </div>
          <SheetTitle className="text-lg font-bold text-white tracking-tight capitalize pt-0.5">
            {exercise.name}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-400">
            Primary Target: <span className="text-emerald-400 font-semibold capitalize">{exercise.target}</span> · Body Part: <span className="text-slate-300 capitalize">{exercise.bodyPart}</span>
          </SheetDescription>
        </SheetHeader>

        {/* 2. Segmented 3-Tab Progressive Navigation */}
        <div className="grid grid-cols-3 p-1 bg-slate-950 border border-slate-800/90 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("cues")}
            className={clsx(
              "h-8 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer",
              activeTab === "cues"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Coach Cues</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("steps")}
            className={clsx(
              "h-8 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer",
              activeTab === "steps"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Full Steps</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("swaps")}
            className={clsx(
              "h-8 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer",
              activeTab === "swaps"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Swaps{substitutes.length > 0 ? ` (${substitutes.length})` : ""}</span>
          </button>
        </div>

        {/* TAB 1: COACH CUES & ANATOMICAL SPOTLIGHT (High-Signal Hero) */}
        {activeTab === "cues" && (
          <div className="space-y-3.5">
            {/* Split Hero: Micro-Spotlight + 2 Kinetic Anchors */}
            <div className="grid grid-cols-[108px_1fr] gap-3 items-stretch">
              {/* Left Column: Refined Anatomical Tension Spotlight */}
              <div className="flex flex-col">
                <AnatomicalTensionSpotlight
                  primaryMuscle={exercise.target}
                  secondaryMuscles={exercise.secondaryMuscles || []}
                  className="h-full justify-between"
                />
              </div>

              {/* Right Column: Setup Anchor & Kinetic Drive Cards */}
              <div className="flex flex-col justify-between gap-2.5">
                {/* Anchor 1: Setup */}
                <div className="p-3 bg-slate-900/80 border border-slate-800/90 rounded-2xl space-y-1 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>1. Setup Anchor</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Foundation</span>
                  </div>
                  <p className="text-[15px] text-slate-100 leading-snug line-clamp-3 pt-0.5">
                    {setupCue}
                  </p>
                </div>

                {/* Anchor 2: Kinetic Drive */}
                <div className="p-3 bg-slate-900/80 border border-slate-800/90 rounded-2xl space-y-1 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>2. Kinetic Drive</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Trajectory</span>
                  </div>
                  <p className="text-[15px] text-slate-100 leading-snug line-clamp-3 pt-0.5">
                    {driveCue}
                  </p>
                </div>
              </div>
            </div>

            {/* Video or External Form Demonstration Link */}
            {exercise.videoUrl && (
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-between transition shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>Watch Biomechanical Form Cue</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}
          </div>
        )}

        {/* TAB 2: FULL STEP-BY-STEP PROTOCOL */}
        {activeTab === "steps" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Step-by-Step Biomechanical Execution
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {(exercise.instructions || []).length} Steps
              </span>
            </div>

            <div className="space-y-2 p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs text-slate-300">
              {exercise.instructions && exercise.instructions.length > 0 ? (
                exercise.instructions.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 py-1.5 border-b border-slate-900 last:border-0">
                    <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs leading-relaxed text-slate-200">{step}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-2 text-center">
                  Execute with stable posture and controlled eccentric phase.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: EQUIPMENT & 1-TAP SWAPS */}
        {activeTab === "swaps" && (
          <div className="space-y-4">
            {/* Equipment Context Card */}
            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-emerald-400" />
                Equipment & Loading Profile
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Prescribed Apparatus:</span>
                <span className="font-semibold text-white capitalize">{exercise.equipment}</span>
              </div>
              {isBarbellOrSmith && (
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Standard Olympic Bar:</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">20.0 kg Base Tare</span>
                </div>
              )}
            </div>

            {/* Direct Biomechanical Swaps */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                1-Tap Biomechanical Alternatives
              </span>
              <p className="text-[11px] text-slate-400">
                Equipment occupied? Swap immediately to an exercise targeting the exact same primary motor pattern.
              </p>

              <div className="space-y-2 pt-1">
                {substitutes.length > 0 ? (
                  substitutes.map((sub) => {
                    const match = candidates.find((c) => c.exercise.id === sub.id);
                    return (
                      <div
                        key={sub.id}
                        className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5 min-w-0 pr-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white truncate capitalize">{sub.name}</span>
                              {match && (
                                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  {Math.round(match.similarityScore * 100)}%
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {sub.equipment} · <span className="text-emerald-400 capitalize">{sub.target}</span>
                              {match && (
                                <span className="text-cyan-400 ml-1">· {match.resistanceProfile}</span>
                              )}
                            </div>
                          </div>
                          {onSelectAsSubstitute ? (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectAsSubstitute(sub);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs transition shrink-0 cursor-pointer shadow-sm"
                            >
                              Swap
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-500">Available</span>
                          )}
                        </div>
                        {match?.biomechanicalRationale && (
                          <div className="text-[11px] text-slate-300 leading-snug bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                            <span className="text-emerald-400 font-semibold font-mono text-[10px]">COACH: </span>
                            {match.biomechanicalRationale}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center text-xs text-slate-400">
                    No immediate substitutes found for {exercise.target}.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Single Dominant CTA + Secondary Close */}
        <div className="pt-2 space-y-2">
          {onSelectAsSubstitute ? (
            <button
              type="button"
              onClick={() => {
                onSelectAsSubstitute(exercise);
                onClose();
              }}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Select as Active Exercise</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleUseInDayOneSession}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Use in Day 1 Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
