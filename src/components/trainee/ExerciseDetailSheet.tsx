"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { RagExercise } from "@/types/exercise-rag";
import { PlateCalculatorPopover } from "@/components/trainee/PlateCalculatorPopover";
import { AnatomicalBodyMap } from "@/components/trainee/AnatomicalBodyMap";
import {
  Sparkles,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Video,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Disc,
  Info
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
  const executionKeywords = ["press", "pull", "push", "lift", "drive", "extend", "curl", "row", "squat", "contract", "raise"];
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
  const [activeTab, setActiveTab] = useState<"form" | "swaps">("form");
  const [showFullSteps, setShowFullSteps] = useState(false);
  const [substitutes, setSubstitutes] = useState<RagExercise[]>([]);

  // Fetch contextual biomechanical substitutes
  useEffect(() => {
    if (!exercise || !isOpen) return;
    let active = true;
    const fetchSubs = async () => {
      try {
        const res = await fetch(`/api/exercises?muscle=${encodeURIComponent(exercise.target)}&limit=4`);
        if (!res.ok) return;
        const data = await res.json();
        if (active) {
          const filtered = (data.exercises || []).filter((e: RagExercise) => e.id !== exercise.id).slice(0, 3);
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
  }, [exercise?.id, exercise?.target, isOpen]);

  // Reset internal states on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab("form");
      setShowFullSteps(false);
    }
  }, [isOpen, exercise?.id]);

  if (!exercise) return null;

  const isBarbellOrSmith =
    exercise.equipment.toLowerCase().includes("barbell") ||
    exercise.equipment.toLowerCase().includes("smith");

  const { setupCue, driveCue } = extractGoldenCues(exercise.instructions);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-w-md mx-auto rounded-t-3xl bg-[#0B0F17] border-slate-800 p-5 space-y-4 max-h-[88vh] overflow-y-auto"
      >
        {/* 1. Header (Eyebrow + Title + Plate Popover) */}
        <SheetHeader className="text-left space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {exercise.category || "Strength"}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
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
          <SheetTitle className="text-lg font-bold text-white tracking-tight pt-1">
            {exercise.name}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-400">
            Primary Target: <span className="text-emerald-400 font-semibold">{exercise.target}</span> · Body Part: <span className="text-slate-300">{exercise.bodyPart}</span>
          </SheetDescription>
        </SheetHeader>

        {/* 2. Segmented 2-Tab Navigation (Progressive Disclosure) */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={clsx(
              "h-9 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer",
              activeTab === "form"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Form & Anatomy</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("swaps")}
            className={clsx(
              "h-9 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer",
              activeTab === "swaps"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Equipment & Swaps</span>
          </button>
        </div>

        {/* TAB 1: FORM & ANATOMICAL VISUALIZATION */}
        {activeTab === "form" && (
          <div className="space-y-4">
            {/* Visualizer: Anatomical Target Silhouette */}
            <AnatomicalBodyMap
              selectedMuscle={exercise.target}
              secondaryMuscles={exercise.secondaryMuscles || []}
              mode="visualizer"
            />

            {/* Golden Biomechanical Cues (Setup vs Drive) */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Golden Biomechanical Cues
              </span>

              <div className="grid gap-2">
                {/* Golden Cue 1: Setup */}
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                    <span>1. Setup & Anchor</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-snug">{setupCue}</p>
                </div>

                {/* Golden Cue 2: Drive */}
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <span>2. Drive & Trajectory</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-snug">{driveCue}</p>
                </div>
              </div>
            </div>

            {/* Video or External Form Demonstration Link */}
            {exercise.videoUrl && (
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full h-10 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>Watch Biomechanical Form Cue</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}

            {/* Expandable Full 5-Step Protocol */}
            {exercise.instructions && exercise.instructions.length > 2 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowFullSteps(!showFullSteps)}
                  className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>{showFullSteps ? "Hide Detailed Steps" : `View All ${exercise.instructions.length} Detailed Steps`}</span>
                  {showFullSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showFullSteps && (
                  <div className="mt-2 space-y-2 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-300">
                    {exercise.instructions.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-[11px] leading-relaxed text-slate-300">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EQUIPMENT & 1-TAP SWAPS */}
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
                  substitutes.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 min-w-0 pr-3">
                        <div className="font-semibold text-white truncate">{sub.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {sub.equipment} · <span className="text-emerald-400">{sub.target}</span>
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
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center text-xs text-slate-400">
                    No immediate substitutes found for {exercise.target}.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Single Dominant CTA */}
        <div className="pt-2">
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
            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
