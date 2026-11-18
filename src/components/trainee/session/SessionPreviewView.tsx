"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRightLeft,
  ArrowUp,
  ChevronRight,
  Dumbbell,
  ExternalLink,
  MapPin,
  Sparkles,
  Video,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AdaptiveRecalibrationCard } from "@/components/trainee/AdaptiveRecalibrationCard";
import { DailyAiCoachAdapterCard } from "@/components/trainee/DailyAiCoachAdapterCard";
import { GymSelectorDrawer } from "@/components/trainee/GymSelectorDrawer";
import { SubstitutionCopilotDrawer } from "@/components/trainee/SubstitutionCopilotDrawer";
import { resolveExerciseVideoUrl } from "@/lib/utils";
import { inferPrimaryMuscleFromExerciseName } from "@/lib/ai/sensory-memory";
import type { ActiveExercise } from "./types";
import type { AutoregulationPlan } from "@/lib/autoregulation";
import type { DailyWorkoutAdaptationResult } from "@/lib/ai/daily-session-adapter";
import type {
  Exercise,
  GymLocation,
  Program,
  ProgramDay,
  ProgramWeek,
  WearableBiometricSnapshot,
} from "@/lib/types";

interface SessionPreviewViewProps {
  userId: string;
  program?: Program;
  currentWeek?: ProgramWeek;
  targetDay?: ProgramDay;
  exercises: ActiveExercise[];
  originalExercisesSnapshot: ActiveExercise[] | null;
  selectedGym: GymLocation | null;
  sleepHours: number;
  latestSnapshot: WearableBiometricSnapshot | null;
  autoregulationPlan: AutoregulationPlan;
  isRecalibrationApplied: boolean;
  isRecalibrationDismissed: boolean;
  activeDailyAdaptation: DailyWorkoutAdaptationResult | null;
  catalogue: Exercise[];
  isDayPickerOpen: boolean;
  setIsDayPickerOpen: (open: boolean) => void;
  isGymDrawerOpen: boolean;
  setIsGymDrawerOpen: (open: boolean) => void;
  previewDetailEx: ActiveExercise | null;
  setPreviewDetailEx: (ex: ActiveExercise | null) => void;
  isSwapDrawerOpen: boolean;
  setIsSwapDrawerOpen: (open: boolean) => void;
  swapTargetExercise: {
    id?: string;
    name: string;
    target: string;
    equipment: string;
    bodyPart?: string;
  } | null;
  setSwapTargetExercise: (target: {
    id?: string;
    name: string;
    target: string;
    equipment: string;
    bodyPart?: string;
  } | null) => void;
  onSelectDay: (dayId: string) => void;
  onQuickStartStarterSession: () => void;
  onChangeSleepHours: (hours: number) => void;
  onAcceptRecalibration: () => void;
  onDismissRecalibration: () => void;
  onApplyDailyAdaptation: (result: DailyWorkoutAdaptationResult) => void;
  onRestoreOriginalDailySession: () => void;
  onMoveExerciseUp: (index: number) => void;
  onMoveExerciseDown: (index: number) => void;
  onSwapFromVariation: (
    targetExerciseId: string | undefined,
    variation: {
      exerciseName: string;
      formCue: string;
      videoUrl?: string;
      equipmentType: string;
    }
  ) => void;
  onSelectGym: (gym: GymLocation) => void;
  onApplySubstitute: (candidate: {
    name: string;
    instructions?: string[];
    equipment: string;
    target?: string;
    videoUrl?: string;
  }) => void;
  onBeginWorkout: () => void;
}

export function SessionPreviewView({
  userId,
  program,
  currentWeek,
  targetDay,
  exercises,
  originalExercisesSnapshot,
  selectedGym,
  sleepHours,
  latestSnapshot,
  autoregulationPlan,
  isRecalibrationApplied,
  isRecalibrationDismissed,
  activeDailyAdaptation,
  catalogue,
  isDayPickerOpen,
  setIsDayPickerOpen,
  isGymDrawerOpen,
  setIsGymDrawerOpen,
  previewDetailEx,
  setPreviewDetailEx,
  isSwapDrawerOpen,
  setIsSwapDrawerOpen,
  swapTargetExercise,
  setSwapTargetExercise,
  onSelectDay,
  onQuickStartStarterSession,
  onChangeSleepHours,
  onAcceptRecalibration,
  onDismissRecalibration,
  onApplyDailyAdaptation,
  onRestoreOriginalDailySession,
  onMoveExerciseUp,
  onMoveExerciseDown,
  onSwapFromVariation,
  onSelectGym,
  onApplySubstitute,
  onBeginWorkout,
}: SessionPreviewViewProps) {
  return (
    <div className="flex-1 pb-12 px-4 pt-6 max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-200 font-body">
      <header className="flex items-center justify-between">
        <Link
          href="/today"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-editorial font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Today</span>
        </Link>
        <span className="text-[10px] font-mono text-amber-400 font-bold px-2.5 py-0.5 rounded-full bg-[#182030] border border-amber-500/30">
          BLUEPRINT PREVIEW
        </span>
      </header>

      {!targetDay ? (
        <div className="p-6 bg-[#111622] border border-[#1C2436] rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Dumbbell className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-editorial font-bold text-white">
            {program ? "Rest Day in Blueprint" : "Ready for Your First Session"}
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {program
              ? "Today is scheduled as active recovery. Select any training day from your split or launch a quick session."
              : "No workout split is active yet. Jump straight into a balanced Day-1 full-body session or design a custom split."}
          </p>
          <div className="space-y-2.5 pt-2">
            {currentWeek?.days
              .filter((d) => !d.isRestDay)
              .map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onSelectDay(d.id)}
                  className="w-full p-3.5 bg-[#090C11] border border-[#1C2436] hover:border-amber-500/50 rounded-xl text-left transition flex items-center justify-between cursor-pointer"
                >
                  <span className="text-xs font-bold text-white">{d.label}</span>
                  <span className="text-[10px] text-amber-400 font-mono">Select →</span>
                </button>
              ))}
            {!program && (
              <>
                <button
                  type="button"
                  onClick={onQuickStartStarterSession}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-[#090C11] font-display uppercase tracking-wider text-xs font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Zap className="w-4 h-4" />
                  <span>Quick-Start Day-1 Full Body</span>
                </button>
                <Link
                  href="/program/new"
                  className="w-full py-3 px-4 bg-[#090C11] border border-[#1C2436] hover:border-amber-500/40 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Build Custom Program</span>
                </Link>
                <Link
                  href="/today?onboarding=day0"
                  className="w-full py-2.5 px-4 bg-[#090C11] border border-[#1C2436] rounded-xl text-xs text-slate-400 hover:text-white flex items-center justify-center gap-2 transition"
                >
                  <span>Calibrate Starting Weights First</span>
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-editorial font-bold text-white tracking-tight">
                {targetDay.label}
              </h1>
              <button
                type="button"
                onClick={() => setIsDayPickerOpen(true)}
                className="text-[11px] font-medium text-amber-400 hover:text-amber-300 transition px-2.5 py-1 bg-[#111622] border border-[#1C2436] rounded-lg cursor-pointer"
              >
                Different day
              </button>
            </div>
            <p className="text-xs text-slate-400">
              {exercises.length} exercises · ~
              {Math.max(
                15,
                Math.round(exercises.reduce((a, e) => a + e.targetSets, 0) * 3.5)
              )}{" "}
              min · Target RIR {exercises[0]?.targetRir ?? 2}
            </p>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#111622] border border-[#1C2436] text-xs shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Location
                  </span>
                  {selectedGym?.isDefault && (
                    <span className="text-[9px] font-mono text-amber-300 font-semibold">
                      ★ Default
                    </span>
                  )}
                </div>
                <p className="font-semibold text-white text-xs truncate">
                  {selectedGym?.name || "Select Gym / Location"}
                </p>
                {selectedGym?.address && (
                  <p className="text-[10px] text-slate-400 truncate">
                    {selectedGym.address}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsGymDrawerOpen(true)}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-950/50 border border-cyan-800/50 hover:bg-cyan-900/50 transition flex-shrink-0 active:scale-95"
            >
              Change
            </button>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                Last Night&apos;s Sleep
              </span>
              <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1.5 tabular-nums">
                {latestSnapshot && sleepHours === latestSnapshot.sleepHours ? (
                  <span className="text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.2 rounded text-[10px] font-sans font-medium">
                    ⌚ Watch Synced
                  </span>
                ) : null}
                <span>{sleepHours}h</span>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { hours: 5.0, label: "Under 5 h" },
                { hours: 6.0, label: "6 h" },
                { hours: 7.0, label: "7 h" },
                { hours: 8.0, label: "8 h or more" },
              ].map((option) => (
                <button
                  key={option.hours}
                  type="button"
                  onClick={() => onChangeSleepHours(option.hours)}
                  className={clsx(
                    "py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer",
                    sleepHours === option.hours
                      ? "bg-[#182030] border-amber-500/50 text-amber-300 shadow-sm"
                      : "bg-[#111622] border-[#1C2436] text-slate-400 hover:text-slate-200 hover:bg-[#182030]"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {!isRecalibrationDismissed && (
              <AdaptiveRecalibrationCard
                plan={autoregulationPlan}
                onAccept={onAcceptRecalibration}
                onDismiss={onDismissRecalibration}
                isApplied={isRecalibrationApplied}
                wearableSnapshot={latestSnapshot}
              />
            )}
          </section>

          <DailyAiCoachAdapterCard
            traineeId={userId}
            gymId={selectedGym?.id}
            gymName={selectedGym?.name}
            exercises={(originalExercisesSnapshot || exercises).map((e) => ({
              id: e.id,
              name: e.name,
              targetSets: e.targetSets,
              repLow: e.repLow,
              repHigh: e.repHigh,
              targetRir: e.targetRir,
              restSeconds: e.restSeconds,
              currentWeight: e.currentWeight || e.lastBestWeight || 20,
              equipment: e.equipment,
              target: e.target,
              formCue: e.formCue,
            }))}
            onApplyDailyAdaptation={onApplyDailyAdaptation}
            onRestoreOriginalSession={onRestoreOriginalDailySession}
            activeAdaptation={activeDailyAdaptation}
          />

          <div className="bg-[#111622] border border-[#1C2436] rounded-2xl p-4 divide-y divide-[#1C2436]">
            <div className="pb-2.5 flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
                {isRecalibrationApplied
                  ? "Recalibrated Program Blueprint"
                  : "Planned Program Blueprint"}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Tap exercise for form cues &amp; video
              </span>
            </div>
            {exercises.map((ex, idx) => (
              <div
                key={ex.id}
                onClick={() => setPreviewDetailEx(ex)}
                className="py-3 first:pt-2 last:pb-0 flex items-center justify-between text-xs cursor-pointer hover:bg-[#182030]/60 rounded-xl px-2 -mx-2 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="font-mono text-slate-500 text-[10px] w-6 flex-shrink-0">
                    {ex.subMovementOrder || `${idx + 1}.`}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-slate-200 truncate">
                        {ex.name}
                      </span>
                      {ex.subMovementOrder && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                          Superset
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                      <span className="text-amber-400 font-semibold tabular-nums">
                        {ex.currentWeight}kg
                      </span>
                      <span>·</span>
                      <span>
                        {ex.targetSets} × {ex.repLow}-{ex.repHigh} (RIR {ex.targetRir})
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1.5 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onMoveExerciseUp(idx)}
                    className="p-1 rounded bg-[#090C11] hover:bg-[#182030] border border-[#1C2436] disabled:opacity-20 text-slate-300 transition"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === exercises.length - 1}
                    onClick={() => onMoveExerciseDown(idx)}
                    className="p-1 rounded bg-[#090C11] hover:bg-[#182030] border border-[#1C2436] disabled:opacity-20 text-slate-300 transition"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  {ex.videoUrl && (
                    <a
                      href={resolveExerciseVideoUrl(ex.name, {
                        previousVideoUrl: ex.videoUrl,
                        catalogue,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg bg-[#182030] border border-[#1C2436] hover:bg-[#222D42] text-amber-400 flex items-center gap-1 text-[11px] font-semibold transition"
                      title="Watch exercise video demonstration"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Video</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewDetailEx(ex)}
                    className="p-1 text-slate-400 hover:text-slate-200 transition"
                    aria-label="View exercise details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs px-1 text-slate-400">
            <span>Equipment occupied or need substitutions?</span>
            <button
              type="button"
              onClick={() => {
                if (exercises.length > 0) {
                  setSwapTargetExercise({
                    id: exercises[0].id,
                    name: exercises[0].name,
                    target:
                      exercises[0].target ||
                      inferPrimaryMuscleFromExerciseName(exercises[0].name),
                    equipment: exercises[0].equipment || "barbell",
                  });
                  setIsSwapDrawerOpen(true);
                }
              }}
              className="text-amber-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Swap Copilot →</span>
            </button>
          </div>

          <button
            type="button"
            disabled={!targetDay || exercises.length === 0}
            onClick={onBeginWorkout}
            className={clsx(
              "w-full py-4 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 font-display uppercase tracking-wider text-base font-black active:scale-[0.98]",
              !targetDay || exercises.length === 0
                ? "bg-[#182030] text-slate-500 cursor-not-allowed border border-[#1C2436]"
                : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20 cursor-pointer"
            )}
          >
            <span>Begin Workout →</span>
          </button>
        </>
      )}

      <Sheet open={isDayPickerOpen} onOpenChange={setIsDayPickerOpen}>
        <SheetContent
          side="bottom"
          className="max-w-md mx-auto rounded-t-3xl bg-[#090C11] border-[#1C2436] p-6 space-y-4 font-body shadow-2xl text-slate-100"
        >
          <SheetHeader className="text-left space-y-1">
            <SheetTitle className="text-xl font-editorial font-bold text-white tracking-tight">
              Choose a Different Session
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400 font-body">
              Select a scheduled training day from your current blueprint week.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-2 pt-2">
            {currentWeek?.days
              .filter((d) => !d.isRestDay)
              .map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setIsDayPickerOpen(false);
                    onSelectDay(d.id);
                  }}
                  className={clsx(
                    "w-full p-3.5 rounded-xl text-left transition flex items-center justify-between border cursor-pointer font-body",
                    d.id === targetDay?.id
                      ? "bg-[#182030] border-amber-500/50 text-amber-300 font-semibold shadow-sm"
                      : "bg-[#111622] border-[#1C2436] hover:border-slate-700 text-white"
                  )}
                >
                  <span className="text-xs font-semibold">{d.label}</span>
                  {d.id === targetDay?.id && (
                    <span className="text-[10px] font-mono text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                      Current
                    </span>
                  )}
                </button>
              ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={Boolean(previewDetailEx)}
        onOpenChange={(open) => !open && setPreviewDetailEx(null)}
      >
        <SheetContent
          side="bottom"
          className="max-w-md mx-auto max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#090C11] border-[#1C2436] p-6 space-y-4 font-body shadow-2xl text-slate-100"
        >
          {previewDetailEx && (
            <>
              <SheetHeader className="text-left space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {previewDetailEx.subMovementOrder
                      ? `SLOT ${previewDetailEx.subMovementOrder}`
                      : "EXERCISE PREVIEW"}
                  </span>
                  {previewDetailEx.equipment && (
                    <span className="text-[10px] font-mono text-slate-300 uppercase px-2 py-0.5 rounded-full bg-[#182030] border border-[#1C2436]">
                      {previewDetailEx.equipment}
                    </span>
                  )}
                </div>
                <SheetTitle className="text-xl font-editorial font-bold text-white tracking-tight pt-1">
                  {previewDetailEx.name}
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-400 font-body">
                  {previewDetailEx.targetSets} sets × {previewDetailEx.repLow}-
                  {previewDetailEx.repHigh} reps · Target RIR{" "}
                  {previewDetailEx.targetRir} · {previewDetailEx.restSeconds}s rest
                </SheetDescription>
              </SheetHeader>

              {previewDetailEx.videoUrl ? (
                <a
                  href={resolveExerciseVideoUrl(previewDetailEx.name, {
                    previousVideoUrl: previewDetailEx.videoUrl,
                    catalogue,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-display uppercase tracking-wider font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  <Video className="w-4 h-4 stroke-[2.5]" />
                  <span>Watch Form Demonstration Video</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              ) : (
                <div className="text-[11px] text-slate-400 bg-[#111622] border border-[#1C2436] rounded-xl p-3 text-center">
                  Video tutorial included in library catalogue
                </div>
              )}

              {previewDetailEx.formCue && (
                <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Form Cue &amp; Kinetic Anchor</span>
                  </div>
                  <p className="text-xs text-slate-100 leading-relaxed font-medium">
                    {previewDetailEx.formCue}
                  </p>
                </div>
              )}

              {previewDetailEx.loadGuidance && (
                <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-xl space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">
                    Coach Progression Strategy
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {previewDetailEx.loadGuidance}
                  </p>
                </div>
              )}

              {previewDetailEx.confidenceGuide?.hardware?.setupSteps &&
                previewDetailEx.confidenceGuide.hardware.setupSteps.length > 0 && (
                  <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-xl space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Setup Checklist
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      {previewDetailEx.confidenceGuide.hardware.setupSteps.map(
                        (step: string, idx: number) => (
                          <li key={idx} className="leading-snug text-slate-300">
                            {step}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              {previewDetailEx.equipmentVariations &&
                previewDetailEx.equipmentVariations.length > 0 && (
                  <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      <span>Available Equipment Variations</span>
                      <span className="text-slate-400 font-normal">
                        Swap if station occupied
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {previewDetailEx.equipmentVariations.map((v, i) => (
                        <div
                          key={i}
                          className="p-2.5 bg-[#090C11] border border-[#1C2436] rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="text-[10px] uppercase font-mono text-amber-400 font-semibold mr-2">
                              {v.equipmentType}
                            </span>
                            <span className="text-slate-200 font-medium">
                              {v.exerciseName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onSwapFromVariation(previewDetailEx.id, v);
                                setPreviewDetailEx(null);
                              }}
                              className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[10px] font-mono font-semibold border border-amber-500/30 transition cursor-pointer"
                            >
                              Swap to this
                            </button>
                            {v.videoUrl && (
                              <a
                                href={v.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                              >
                                <Video className="w-3 h-3" />
                                <span>Demo</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <button
                type="button"
                onClick={() => setPreviewDetailEx(null)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Done Previewing
              </button>
            </>
          )}
        </SheetContent>
      </Sheet>

      <GymSelectorDrawer
        isOpen={isGymDrawerOpen}
        onOpenChange={setIsGymDrawerOpen}
        selectedGymId={selectedGym?.id}
        onSelectGym={onSelectGym}
      />

      <SubstitutionCopilotDrawer
        isOpen={isSwapDrawerOpen}
        onClose={() => setIsSwapDrawerOpen(false)}
        currentExercise={swapTargetExercise}
        onApplySubstitute={onApplySubstitute}
      />
    </div>
  );
}
