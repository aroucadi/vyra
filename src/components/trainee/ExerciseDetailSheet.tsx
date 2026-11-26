"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { RagExercise } from "@/types/exercise-rag";
import { PlateCalculatorPopover } from "@/components/trainee/PlateCalculatorPopover";
import { AnatomicalTensionSpotlight } from "@/components/trainee/AnatomicalTensionSpotlight";
import { MindMuscleBiofeedbackCard } from "@/components/trainee/anatomy/MindMuscleBiofeedbackCard";
import { Interactive3DBiomechanicsLab } from "@/components/trainee/anatomy/Interactive3DBiomechanicsLab";
import { SubstitutionCandidate } from "@/lib/training-math/substitution-copilot";
import { appStore } from "@/lib/store";
import { resolveDayOneWorkoutDay } from "@/lib/onboarding";
import { isDirectVideoUrl, resolveExerciseVideoUrl, resolveProgramDay } from "@/lib/utils";
import { soundService } from "@/lib/in-gym/sound";
import { ExerciseVideoModal } from "@/components/trainee/ExerciseVideoModal";
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
  Play,
  Check,
  AlertCircle,
} from "lucide-react";
import { clsx } from "clsx";
import { enrichExerciseWithBiomechanics } from "@/lib/rag/biomechanical-metadata";

interface ExerciseDetailSheetProps {
  exercise: RagExercise | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectAsSubstitute?: (exercise: RagExercise) => void;
}

function distillCue(raw: string): string {
  if (!raw) return "";
  const clean = raw
    .replace(/^(Lie flat|Stand upright|Sit firmly|Position yourself|Ensure your|Make sure your|Begin by)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const clauses = clean.split(/[,.;]/).map((c) => c.trim()).filter(Boolean);
  if (clauses.length >= 2) {
    return clauses.slice(0, 2).join(" · ");
  }
  return clean.length > 70 ? clean.slice(0, 68) + "..." : clean;
}

function extractGoldenCues(instructions?: string[]): { setupCue: string; driveCue: string } {
  if (!instructions || instructions.length === 0) {
    return {
      setupCue: "Neutral spine · Stable foundation",
      driveCue: "Controlled active range of motion",
    };
  }

  const setupCue = distillCue(instructions[0]);
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

  return { setupCue, driveCue: distillCue(driveCue) };
}

export function ExerciseDetailSheet({
  exercise,
  isOpen,
  onClose,
  onSelectAsSubstitute,
}: ExerciseDetailSheetProps) {
  const router = useRouter();
  const [tabState, setTabState] = useState<{
    exerciseId?: string;
    tab: "cues" | "steps" | "swaps";
  }>({ exerciseId: exercise?.id, tab: "cues" });
  const activeTab =
    tabState.exerciseId === exercise?.id ? tabState.tab : "cues";
  const setActiveTab = (tab: "cues" | "steps" | "swaps") =>
    setTabState({ exerciseId: exercise?.id, tab });
  const [candidates, setCandidates] = useState<SubstitutionCandidate[]>([]);
  const [substitutes, setSubstitutes] = useState<RagExercise[]>([]);
  const [videoModalExercise, setVideoModalExercise] = useState<RagExercise | null>(null);
  const [is3DLabOpen, setIs3DLabOpen] = useState(false);
  const [compensatingMuscle, setCompensatingMuscle] = useState<string | null>(null);
  const [swapFeedbackMessage, setSwapFeedbackMessage] = useState<string | null>(null);

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

  if (!exercise) return null;

  const enriched = enrichExerciseWithBiomechanics(exercise);

  const isBarbellOrSmith =
    exercise.equipment.toLowerCase().includes("barbell") ||
    exercise.equipment.toLowerCase().includes("smith");

  const { setupCue, driveCue } = extractGoldenCues(exercise.instructions);

  const effectiveVideoUrl =
    exercise.clipUrl ||
    exercise.videoUrl ||
    resolveExerciseVideoUrl(exercise.name, {
      id: exercise.id,
      clipUrl: exercise.clipUrl,
      explicitVideoUrl: exercise.videoUrl,
      equipment: exercise.equipment,
      targetMuscle: exercise.target,
    });

  const isDirectVideo = isDirectVideoUrl(effectiveVideoUrl);

  const handleSwapIntoTodayWorkout = () => {
    const currentUser = appStore.getCurrentUser();
    const program = appStore.getActiveProgramForTrainee(currentUser.id);
    if (!program) {
      handleUseInDayOneSession();
      return;
    }
    const resolved = resolveProgramDay(program.startDate);
    const currentWeek = program.weeks?.[Math.min(resolved.weekIndex - 1, (program.weeks?.length || 1) - 1)];
    const todayDay = currentWeek?.days?.find((d) => d.dayOfWeek === resolved.dayOfWeek && !d.isRestDay);
    const existingExercises = todayDay?.blocks?.flatMap((b) => b.exercises) || [];

    // Find an exercise matching either muscle target or the first exercise to replace
    const targetToReplace =
      existingExercises.find(
        (e) =>
          e.targetMuscleGroups?.some((t) => t.toLowerCase() === exercise.target.toLowerCase()) ||
          e.exerciseName.toLowerCase().includes(exercise.target.toLowerCase())
      ) || existingExercises[0];

    if (targetToReplace) {
      const res = appStore.swapExerciseInActiveProgram(
        currentUser.id,
        targetToReplace.exerciseName,
        exercise.name,
        todayDay?.dayOfWeek ?? resolved.dayOfWeek
      );
      if (res.success) {
        soundService.playTargetHitFeedback(true);
        setSwapFeedbackMessage(`Swapped for ${targetToReplace.exerciseName} in today's workout!`);
        setTimeout(() => {
          onClose();
          router.push("/today");
        }, 1200);
        return;
      }
    }

    handleUseInDayOneSession();
  };

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
    soundService.playTargetHitFeedback(true);
    onClose();
    router.push("/today?onboarding=day0");
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="max-w-md mx-auto rounded-t-3xl bg-[#05080c] border-[#1b2d47] p-5 space-y-4 max-h-[88vh] overflow-y-auto shadow-2xl font-body text-slate-100"
        >
          {/* 1. Header (Eyebrow + Capitalized Title + Plate Popover) */}
          <SheetHeader className="text-left space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                  {exercise.category || "Strength"}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0f1724] text-slate-300 border border-[#1b2d47]">
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
            <SheetTitle className="text-xl font-display font-black text-white tracking-tight uppercase pt-0.5">
              {exercise.name}
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400 font-body">
              Primary Target:{" "}
              <span className="text-[#10b981] font-semibold capitalize font-mono">
                {exercise.target}
              </span>{" "}
              · Body Part:{" "}
              <span className="text-slate-300 capitalize font-mono">
                {exercise.bodyPart}
              </span>
            </SheetDescription>

            {/* Biomechanical Metadata Radar Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {enriched.apparatusGroup && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                  {enriched.apparatusGroup.replace("_", " ")} · {enriched.hardwareDetail?.replace("_", " ")}
                </span>
              )}
              {enriched.muscleSubdivision && enriched.muscleSubdivision !== "general" && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {enriched.muscleSubdivision.replace("_", " ")}
                </span>
              )}
              {enriched.resistanceProfile && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  {enriched.resistanceProfile} Tension
                </span>
              )}
              {enriched.movementPattern && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#0f1724] text-slate-300 border border-[#1b2d47]">
                  {enriched.movementPattern.replace("_", " ")}
                </span>
              )}
              {enriched.axialLoading && enriched.axialLoading !== "none" && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Axial: {enriched.axialLoading}
                </span>
              )}
              {enriched.tempoRecommendation && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#0f1724] text-slate-400 border border-[#1b2d47]">
                  Tempo: {enriched.tempoRecommendation}
                </span>
              )}
            </div>
          </SheetHeader>

          {/* Feedback banner if swapped */}
          {swapFeedbackMessage && (
            <div className="p-3 bg-[#10b981]/20 border border-[#10b981]/50 rounded-xl flex items-center gap-2 text-xs font-mono text-[#10b981] animate-in fade-in">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{swapFeedbackMessage}</span>
            </div>
          )}

          {/* 2. Segmented 3-Tab Progressive Navigation */}
          <div className="grid grid-cols-3 p-1 bg-[#090d16] border border-[#1b2d47] rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("cues")}
              className={clsx(
                "h-8 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer",
                activeTab === "cues"
                  ? "bg-[#10b981] text-black font-display font-black uppercase tracking-wider shadow-sm"
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
                  ? "bg-[#10b981] text-black font-display font-black uppercase tracking-wider shadow-sm"
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
                  ? "bg-[#10b981] text-black font-display font-black uppercase tracking-wider shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Swaps{substitutes.length > 0 ? ` (${substitutes.length})` : ""}</span>
            </button>
          </div>

          {/* TAB 1: COACH CUES & ANATOMICAL SPOTLIGHT (High-Signal Hero) */}
          {activeTab === "cues" && (
            <div className="space-y-3">
              {/* Split Hero: Micro-Spotlight + 2 Kinetic Anchors */}
              <div className="grid grid-cols-[124px_1fr] gap-3 items-stretch">
                {/* Left Column: Refined Anatomical Tension Spotlight */}
                <div className="flex flex-col">
                  <AnatomicalTensionSpotlight
                    primaryMuscle={exercise.target}
                    secondaryMuscles={exercise.secondaryMuscles || []}
                    compensatingMuscle={compensatingMuscle}
                    accentColor="emerald"
                    className="h-full justify-between"
                  />
                  <button
                    type="button"
                    onClick={() => setIs3DLabOpen(true)}
                    className="mt-1 w-full py-1 rounded-lg bg-[#0b1320] border border-[#1b2d47] hover:border-[#10b981]/50 text-[#10b981] text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <span>🔬 3D Lab</span>
                  </button>
                </div>

                {/* Right Column: Setup Anchor & Kinetic Drive Cards */}
                <div className="flex flex-col justify-between gap-2">
                  {/* Anchor 1: Setup */}
                  <div className="p-3 bg-[#090d16] border border-[#1b2d47] rounded-2xl space-y-1 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#10b981] flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                        <span>Setup</span>
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">Prep</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-100 leading-snug pt-0.5">
                      {setupCue}
                    </p>
                  </div>

                  {/* Anchor 2: Kinetic Drive */}
                  <div className="p-3 bg-[#090d16] border border-[#1b2d47] rounded-2xl space-y-1 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Drive</span>
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">Action</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-100 leading-snug pt-0.5">
                      {driveCue}
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Demonstration Video Preview Container */}
              {isDirectVideo ? (
                <div className="relative rounded-2xl overflow-hidden bg-black border border-[#1b2d47] aspect-video w-full group">
                  <video
                    src={effectiveVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                  <div className="absolute bottom-2 right-2">
                    <button
                      type="button"
                      onClick={() => setVideoModalExercise(exercise)}
                      className="px-2.5 py-1 rounded-lg bg-[#05080c]/80 border border-[#1b2d47] text-white hover:text-cyan-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition shadow-md"
                    >
                      <Video className="w-3 h-3 text-cyan-400" />
                      <span>Expand Video</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setVideoModalExercise(exercise)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#090d16] hover:bg-[#0f1724] border border-[#1b2d47] text-xs font-semibold text-slate-200 flex items-center justify-between transition shadow-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-cyan-400" />
                    <span>Watch Biomechanical Form Demo</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}

              {/* Biomechanical Mistake Checkpoints */}
              {enriched.commonMistakes && enriched.commonMistakes.length > 0 && (
                <div className="p-3 bg-[#090d16] border border-[#1b2d47] rounded-2xl space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Biomechanical Watchpoints</span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {enriched.commonMistakes.map((m, idx) => (
                      <li key={idx} className="leading-snug">{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Interactive Mind-Muscle Biofeedback Diagnostics */}
              <MindMuscleBiofeedbackCard
                movementName={exercise.name}
                targetMuscle={exercise.target}
                onSelectSensation={(_sensationId, compSubdivision) => {
                  setCompensatingMuscle(compSubdivision || null);
                }}
              />
            </div>
          )}

          {/* TAB 2: FULL STEP-BY-STEP PROTOCOL */}
          {activeTab === "steps" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#10b981] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                  Step-by-Step Biomechanical Execution
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {(exercise.instructions || []).length} Steps
                </span>
              </div>

              <div className="space-y-2 p-3.5 bg-[#090d16] border border-[#1b2d47] rounded-2xl text-xs text-slate-300">
                {exercise.instructions && exercise.instructions.length > 0 ? (
                  exercise.instructions.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 py-1.5 border-b border-[#1b2d47] last:border-0">
                      <span className="w-5 h-5 rounded-full bg-[#05080c] border border-[#1b2d47] text-[#10b981] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
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
              <div className="p-3.5 bg-[#090d16] border border-[#1b2d47] rounded-2xl space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Disc className="w-3.5 h-3.5 text-cyan-400" />
                  Equipment & Loading Profile
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Prescribed Apparatus:</span>
                  <span className="font-semibold text-white capitalize">{exercise.equipment}</span>
                </div>
                {isBarbellOrSmith && (
                  <div className="pt-2 border-t border-[#1b2d47] flex items-center justify-between">
                    <span className="text-xs text-slate-400">Standard Olympic Bar:</span>
                    <span className="text-xs font-mono font-bold text-[#10b981]">20.0 kg Base Tare</span>
                  </div>
                )}
              </div>

              {/* Direct Biomechanical Swaps */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#10b981] font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  1-Tap Biomechanical Alternatives
                </span>
                <p className="text-[11px] text-slate-400">
                  Equipment occupied? Swap immediately to an exercise targeting the exact same primary motor pattern.
                </p>

                <div className="space-y-2.5 pt-1">
                  {substitutes.length > 0 ? (
                    substitutes.map((sub) => {
                      const match = candidates.find((c) => c.exercise.id === sub.id);
                      return (
                        <div
                          key={sub.id}
                          className="p-3.5 bg-[#090d16] border border-[#1b2d47] hover:border-[#10b981]/50 rounded-xl space-y-2 text-xs transition"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="space-y-0.5 min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white truncate capitalize">{sub.name}</span>
                                {match && (
                                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                                    {Math.round(match.similarityScore * 100)}%
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {sub.equipment} · <span className="text-[#10b981] capitalize">{sub.target}</span>
                                {match && (
                                  <span className="text-cyan-400 ml-1">· {match.resistanceProfile}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setVideoModalExercise(sub)}
                                className="p-1.5 rounded-lg bg-[#05080c] border border-[#1b2d47] text-cyan-400 hover:text-cyan-300 transition"
                                title="Watch preview"
                              >
                                <Video className="w-3.5 h-3.5" />
                              </button>

                              {onSelectAsSubstitute ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectAsSubstitute(sub);
                                    onClose();
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#059669] text-black font-display uppercase tracking-wider font-bold text-xs transition shrink-0 cursor-pointer shadow-sm active:scale-95"
                                >
                                  Swap
                                </button>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-500">Available</span>
                              )}
                            </div>
                          </div>

                          {match?.biomechanicalRationale && (
                            <div className="text-[11px] text-slate-300 leading-snug bg-[#05080c] p-2.5 rounded-lg border border-[#1b2d47]">
                              <span className="text-[#10b981] font-semibold font-mono text-[10px]">COACH: </span>
                              {match.biomechanicalRationale}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 rounded-xl bg-[#090d16] border border-[#1b2d47] text-center text-xs text-slate-400">
                      No immediate substitutes found for {exercise.target}.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Footer Button */}
          <div className="pt-2">
            {onSelectAsSubstitute ? (
              <button
                type="button"
                onClick={() => {
                  onSelectAsSubstitute(exercise);
                  onClose();
                }}
                className="w-full py-3.5 bg-gradient-to-r from-[#10b981] to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-display font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-[#10b981]/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>Select as Active Exercise</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSwapIntoTodayWorkout}
                  className="py-3 px-2 bg-[#090d16] hover:bg-[#111827] border border-[#10b981]/50 text-[#10b981] font-display font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Swap into Today</span>
                </button>
                <button
                  type="button"
                  onClick={handleUseInDayOneSession}
                  className="py-3 px-2 bg-gradient-to-r from-[#10b981] to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  <span>Start Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 3D Kinetic Biomechanics Lab Modal */}
      {is3DLabOpen && (
        <div className="fixed inset-0 z-50 bg-[#05080c]/95 backdrop-blur-md flex flex-col p-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#1b2d47] shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
              <span className="font-display font-black text-sm tracking-widest text-[#10b981] uppercase">
                3D Kinetic Biomechanics Lab
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIs3DLabOpen(false)}
              className="px-3 py-1 rounded-lg bg-[#0f1724] border border-[#1b2d47] text-xs font-mono font-bold text-slate-300 hover:text-white cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
          <div className="flex-1 mt-3 overflow-hidden rounded-2xl border border-[#1b2d47]">
            <Interactive3DBiomechanicsLab
              movementName={exercise.name}
              targetMuscle={exercise.target}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Inline Video Modal */}
      <ExerciseVideoModal
        isOpen={Boolean(videoModalExercise)}
        onClose={() => setVideoModalExercise(null)}
        exercise={videoModalExercise}
      />
    </>
  );
}
