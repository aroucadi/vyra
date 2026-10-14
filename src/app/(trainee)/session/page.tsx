"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { resolveProgramDay, checkIsPersonalRecord } from "@/lib/utils";
import { WorkoutSession, SetLog, ProgramDay, EquipmentType, ExercisePrescription } from "@/lib/types";
import { saveSessionAction } from "@/lib/actions/session";
import { Log } from "@/components/primitives/Log";
import { Card } from "@/components/primitives/Card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { generateAutoregulationPlan, MinimalExerciseTarget } from "@/lib/autoregulation";
import { AdaptiveRecalibrationCard } from "@/components/trainee/AdaptiveRecalibrationCard";
import { OverloadPrescriptionCard } from "@/components/trainee/OverloadPrescriptionCard";
import { computeExercisePrescription } from "@/lib/progression-adapter";
import { telemetry } from "@/lib/telemetry";
import { persistClientWorkoutSession, triggerBackupDownload } from "@/lib/storage";
import {
  ArrowLeft,
  Clock,
  Dumbbell,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Trophy,
  Video,
  Info,
  HelpCircle,
  X,
  FastForward,
} from "lucide-react";
import { clsx } from "clsx";

interface ActiveExercise {
  id: string;
  name: string;
  category?: string;
  subMovementOrder?: string;
  supersetTag?: string;
  interSetRestSeconds?: number;
  targetSets: number;
  repLow: number;
  repHigh: number;
  targetRir: number;
  restSeconds: number;
  lastBestWeight: number;
  lastBestReps: number;
  formCue?: string;
  videoUrl?: string;
  loadGuidance?: string;
  completedSets: { weight: number; reps: number; isPR: boolean }[];
  currentWeight: number;
  currentReps: number;
}

function SessionFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayParam = searchParams.get("day");
  const currentUser = appStore.getCurrentUser();
  const program = appStore.getActiveProgramForTrainee(currentUser.id);

  const resolved = program
    ? resolveProgramDay(program.startDate)
    : { weekIndex: 1, dayOfWeek: 0, started: true };

  // Resolve target program day based on query parameter or today's exact scheduled day
  const currentWeek = program?.weeks ? program.weeks[Math.min(resolved.weekIndex - 1, program.weeks.length - 1)] : undefined;
  
  // Explicitly check for today's scheduled day:
  const scheduledToday = currentWeek?.days.find((d) => d.dayOfWeek === resolved.dayOfWeek);
  
  const targetDay: ProgramDay | undefined = dayParam
    ? currentWeek?.days.find((d) => d.id === dayParam) || program?.weeks.flatMap((w) => w.days).find((d) => d.id === dayParam)
    : (scheduledToday && !scheduledToday.isRestDay)
    ? scheduledToday
    : undefined;

  // Flow mode: "preview" | "active" | "summary"
  const initialMode = (searchParams.get("mode") as "preview" | "active" | "summary") || "preview";
  const [mode, setMode] = useState<"preview" | "active" | "summary">(initialMode);
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);

  // Exercises initialization
  const [exercises, setExercises] = useState<ActiveExercise[]>(() => {
    if (!targetDay || !targetDay.blocks) return [];
    const exPrescriptions = targetDay.blocks.flatMap((b) => b.exercises);
    return exPrescriptions.map((ex) => {
      const pb = appStore.getPersonalBestForExercise(currentUser.id, ex.exerciseName);
      const defaultWeight = pb ? pb.weightKg : (ex.selectedEquipment === "bodyweight" ? 0 : 25);
      const defaultReps = pb ? pb.reps : Math.round((ex.repRangeLow + ex.repRangeHigh) / 2);

      return {
        id: ex.id,
        name: ex.exerciseName,
        category: ex.category,
        subMovementOrder: ex.subMovementOrder,
        supersetTag: ex.supersetTag,
        interSetRestSeconds: ex.interSetRestSeconds,
        targetSets: ex.sets || 3,
        repLow: ex.repRangeLow,
        repHigh: ex.repRangeHigh,
        targetRir: ex.rirScheme?.[0] ?? 2,
        restSeconds: ex.restSeconds !== undefined ? ex.restSeconds : 90,
        lastBestWeight: defaultWeight,
        lastBestReps: defaultReps,
        formCue: ex.formCueText,
        videoUrl: ex.videoUrl,
        loadGuidance: ex.loadGuidance || "Double progression: add 2.5 kg once top rep target is reached.",
        completedSets: [],
        currentWeight: defaultWeight,
        currentReps: defaultReps,
      };
    });
  });

  // Re-sync exercises whenever targetDay changes
  useEffect(() => {
    if (!targetDay || !targetDay.blocks) {
      setExercises([]);
      return;
    }
    const exPrescriptions = targetDay.blocks.flatMap((b) => b.exercises);
    setExercises(
      exPrescriptions.map((ex) => {
        const pb = appStore.getPersonalBestForExercise(currentUser.id, ex.exerciseName);
        const defaultWeight = pb ? pb.weightKg : (ex.selectedEquipment === "bodyweight" ? 0 : 25);
        const defaultReps = pb ? pb.reps : Math.round((ex.repRangeLow + ex.repRangeHigh) / 2);

        return {
          id: ex.id,
          name: ex.exerciseName,
          category: ex.category,
          subMovementOrder: ex.subMovementOrder,
          supersetTag: ex.supersetTag,
          interSetRestSeconds: ex.interSetRestSeconds,
          targetSets: ex.sets || 3,
          repLow: ex.repRangeLow,
          repHigh: ex.repRangeHigh,
          targetRir: ex.rirScheme?.[0] ?? 2,
          restSeconds: ex.restSeconds !== undefined ? ex.restSeconds : 90,
          lastBestWeight: defaultWeight,
          lastBestReps: defaultReps,
          formCue: ex.formCueText,
          videoUrl: ex.videoUrl,
          loadGuidance: ex.loadGuidance || "Double progression: add 2.5 kg once top rep target is reached.",
          completedSets: [],
          currentWeight: defaultWeight,
          currentReps: defaultReps,
        };
      })
    );
    setCurrentExIndex(0);
    setIsRecalibrationApplied(false);
    setIsRecalibrationDismissed(false);
  }, [targetDay?.id]);

  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isExitAlertOpen, setIsExitAlertOpen] = useState(false);

  // Timer states
  const [sessionDurationSec, setSessionDurationSec] = useState(0);
  const [restTimerSec, setRestTimerSec] = useState<number | null>(null);
  const [sessionStartTime] = useState(() => new Date().toISOString());
  const [lastSetLoggedAt, setLastSetLoggedAt] = useState<number>(() => Date.now());

  // Overall session clock
  useEffect(() => {
    if (mode !== "active") return;
    const interval = setInterval(() => {
      setSessionDurationSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  // Rest countdown timer
  useEffect(() => {
    if (restTimerSec === null || restTimerSec <= 0) return;
    const timer = setInterval(() => {
      setRestTimerSec((prev) => {
        if (prev === null || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [restTimerSec]);

  // Check latest biometric snapshot from Apple Watch / Wearable
  const latestSnapshot = React.useMemo(() => {
    return appStore.getLatestWearableBiometrics(currentUser.id);
  }, [currentUser.id]);

  // Autoregulation & Readiness State
  const [sleepHours, setSleepHours] = useState<number>(() => {
    return latestSnapshot ? latestSnapshot.sleepHours : 5.5;
  });
  const [isRecalibrationApplied, setIsRecalibrationApplied] = useState<boolean>(false);
  const [isRecalibrationDismissed, setIsRecalibrationDismissed] = useState<boolean>(false);

  // Generate real-time autoregulation plan for current exercises
  const minimalTargets: MinimalExerciseTarget[] = React.useMemo(() => {
    return exercises.map((e) => ({
      id: e.id,
      name: e.name,
      targetSets: e.targetSets,
      repLow: e.repLow,
      repHigh: e.repHigh,
      targetRir: e.targetRir,
      plannedWeightKg: e.lastBestWeight || 60,
    }));
  }, [exercises]);

  const autoregulationPlan = React.useMemo(() => {
    return generateAutoregulationPlan(minimalTargets, {
      sleepHours,
      hrvMs: latestSnapshot?.hrvMs,
      deepSleepMinutes: latestSnapshot?.deepSleepMinutes,
      restingHeartRateBpm: latestSnapshot?.restingHeartRateBpm,
    });
  }, [minimalTargets, sleepHours, latestSnapshot]);

  // Keep snapshot of un-adapted exercises for true Undo support
  const [originalExercisesSnapshot, setOriginalExercisesSnapshot] = useState<ActiveExercise[] | null>(null);

  const handleAcceptRecalibration = () => {
    // Preserve snapshot prior to applying
    if (!originalExercisesSnapshot) {
      setOriginalExercisesSnapshot(exercises);
    }
    setExercises((prev) =>
      prev.map((ex) => {
        const delta = autoregulationPlan.prescriptionDeltas.find((d) => d.id === ex.id);
        if (!delta) return ex;
        return {
          ...ex,
          name: delta.adaptedName,
          targetSets: delta.adaptedSets,
          targetRir: delta.adaptedRir,
          currentWeight: delta.adaptedWeightKg,
          lastBestWeight: delta.adaptedWeightKg,
        };
      })
    );
    setIsRecalibrationApplied(true);
    telemetry.track("workout_recalibration_applied", {
      sleep_hours: sleepHours,
      readiness_score: autoregulationPlan.readinessScore,
      reduced_recovery: autoregulationPlan.reducedRecovery ?? autoregulationPlan.cnsFatigueDetected,
    }, currentUser.id);
  };

  const handleDismissRecalibration = () => {
    // If it was applied, undo back to original exercises
    if (isRecalibrationApplied && originalExercisesSnapshot) {
      setExercises(originalExercisesSnapshot);
      setIsRecalibrationApplied(false);
      telemetry.track("workout_recalibration_undone", {
        sleep_hours: sleepHours,
      }, currentUser.id);
      return;
    }
    setIsRecalibrationDismissed(true);
    telemetry.track("workout_recalibration_dismissed", {
      sleep_hours: sleepHours,
    }, currentUser.id);
  };

  const activeEx = exercises[currentExIndex];
  const isFinalExercise = currentExIndex === exercises.length - 1;
  const isFinalSetOfExercise = activeEx && activeEx.completedSets.length + 1 >= activeEx.targetSets;
  const isAllExercisesComplete = exercises.every((e) => e.completedSets.length >= e.targetSets);

  // Log a set (Effort: 1 tap, <= 5s)
  const handleLogSet = () => {
    if (!activeEx) return;

    const isPR = checkIsPersonalRecord(
      activeEx.currentWeight,
      activeEx.currentReps,
      activeEx.lastBestWeight,
      activeEx.lastBestReps
    );

    const newCompleted = [
      ...activeEx.completedSets,
      {
        weight: activeEx.currentWeight,
        reps: activeEx.currentReps,
        isPR,
      },
    ];

    setExercises((prev) => {
      const updated = [...prev];
      updated[currentExIndex] = {
        ...updated[currentExIndex],
        completedSets: newCompleted,
      };
      return updated;
    });

    // Track set logging telemetry with seconds_per_set
    const now = Date.now();
    const secondsPerSet = Math.max(1, Math.round((now - lastSetLoggedAt) / 1000));
    setLastSetLoggedAt(now);

    telemetry.track(
      "workout_set_logged",
      {
        exercise_name: activeEx.name,
        weight_kg: activeEx.currentWeight,
        reps: activeEx.currentReps,
        set_index: activeEx.completedSets.length + 1,
        is_pr: isPR,
        sub_movement_order: activeEx.subMovementOrder,
        seconds_per_set: secondsPerSet,
      },
      currentUser.id
    );

    // Workflow & Rest Timer logic:
    // Slot 1 (Leg Press): 90s countdown timer
    // Slot 2 (Leg Extension): 75s countdown timer
    // Superset Slot 3:
    //  - 3A (Face Pull): 0s rest -> Immediately prompt user for 3B
    //  - 3B (Lateral Raise): 60s rest countdown -> loop back to 3A for next round
    if (activeEx.subMovementOrder === "3A") {
      setRestTimerSec(null);
      const next3BIndex = exercises.findIndex((e, idx) => idx > currentExIndex && e.subMovementOrder === "3B");
      if (next3BIndex !== -1) {
        setTimeout(() => {
          setCurrentExIndex(next3BIndex);
        }, 150);
      }
    } else if (activeEx.subMovementOrder === "3B") {
      setRestTimerSec(60);
      const partner3AIndex = exercises.findIndex((e) => e.subMovementOrder === "3A");
      const current3BRounds = newCompleted.length;
      if (current3BRounds < activeEx.targetSets && partner3AIndex !== -1) {
        setTimeout(() => {
          setCurrentExIndex(partner3AIndex);
        }, 200);
      } else if (current3BRounds >= activeEx.targetSets && !isFinalExercise) {
        setTimeout(() => {
          setCurrentExIndex((prev) => Math.min(exercises.length - 1, prev + 1));
        }, 400);
      }
    } else {
      setRestTimerSec(activeEx.restSeconds);
      if (newCompleted.length >= activeEx.targetSets && !isFinalExercise) {
        setTimeout(() => {
          setCurrentExIndex((prev) => Math.min(exercises.length - 1, prev + 1));
        }, 400);
      }
    }
  };

  // Finish session
  const handleFinishSession = async () => {
    const allSetLogs: SetLog[] = exercises.flatMap((ex, exIdx) =>
      ex.completedSets.map((s, sIdx) => ({
        id: `set_${Date.now()}_${exIdx}_${sIdx}`,
        exercisePrescriptionId: ex.id,
        exerciseName: ex.name,
        setIndex: sIdx + 1,
        reps: s.reps,
        weightKg: s.weight,
        rirAchieved: ex.targetRir,
        isPR: s.isPR,
      }))
    );

    const completedSession: WorkoutSession = {
      id: `session_${Date.now()}`,
      traineeId: currentUser.id,
      programDayId: targetDay?.id || "day_1",
      programTitle: program?.title || "16-Week Blueprint",
      dayLabel: targetDay?.label || "Upper Hypertrophy",
      date: new Date().toISOString().split("T")[0],
      startedAt: sessionStartTime,
      endedAt: new Date().toISOString(),
      durationSec: sessionDurationSec,
      setLogs: allSetLogs,
    };

    telemetry.track(
      "workout_completed",
      {
        program_day_id: targetDay?.id,
        duration_sec: sessionDurationSec,
        total_sets: allSetLogs.length,
        is_recalibrated: isRecalibrationApplied,
      },
      currentUser.id
    );

    await persistClientWorkoutSession(completedSession);
    await saveSessionAction(completedSession);
    appStore.saveSession(completedSession);
    setMode("summary");
  };

  // --------------------------------------------------------------------------
  // STATE 1: SESSION PREVIEW (Between Today and Active Workout)
  // --------------------------------------------------------------------------
  if (mode === "preview") {
    return (
      <div className="flex-1 pb-12 px-4 pt-6 max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-200">
        <header className="flex items-center justify-between">
          <Link
            href="/today"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Today</span>
          </Link>
          <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            PREVIEW
          </span>
        </header>

        {!targetDay ? (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
            <h1 className="text-lg font-bold text-white">Choose today&apos;s session</h1>
            <p className="text-xs text-slate-400">
              No workout is scheduled for today. Select a session from your active blueprint below.
            </p>
            <div className="space-y-2 pt-2">
              {currentWeek?.days.filter((d) => !d.isRestDay).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => router.push(`/session?day=${d.id}&mode=preview`)}
                  className="w-full p-3.5 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition flex items-center justify-between"
                >
                  <span className="text-xs font-bold text-white">{d.label}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Select →</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {targetDay.label}
              </h1>
              <button
                type="button"
                onClick={() => setIsDayPickerOpen(true)}
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg"
              >
                Different day
              </button>
            </div>
            <p className="text-xs text-slate-400">
              {exercises.length} exercises · ~55 min · Target RIR 2
            </p>
          </div>
        )}

        {/* Readiness Input & Autoregulation Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
              Last Night&apos;s Sleep
            </span>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 tabular-nums">
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
                onClick={() => {
                  setSleepHours(option.hours);
                  setIsRecalibrationApplied(false);
                  setIsRecalibrationDismissed(false);
                }}
                className={clsx(
                  "py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer",
                  sleepHours === option.hours
                    ? "bg-slate-800 border-emerald-500/50 text-emerald-400 shadow-sm"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {!isRecalibrationDismissed && (
            <AdaptiveRecalibrationCard
              plan={autoregulationPlan}
              onAccept={handleAcceptRecalibration}
              onDismiss={handleDismissRecalibration}
              isApplied={isRecalibrationApplied}
              wearableSnapshot={latestSnapshot}
            />
          )}
        </section>

        {/* Clean Exercise List (name + target reps only) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-800/80">
          <div className="pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {isRecalibrationApplied ? "Recalibrated Program Blueprint" : "Planned Program Blueprint"}
          </div>
          {exercises.map((ex, idx) => (
            <div key={ex.id} className="py-2.5 first:pt-2 last:pb-0 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 truncate pr-2">
                <span className="font-mono text-slate-500 text-[10px] w-5">
                  {ex.subMovementOrder || `${idx + 1}.`}
                </span>
                <span className="font-medium text-slate-200 truncate">{ex.name}</span>
                {ex.subMovementOrder && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                    Superset
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] tabular">
                <span className="text-emerald-400 font-semibold">{ex.currentWeight}kg</span>
                <span className="text-slate-400">
                  {ex.targetSets} × {ex.repLow}-{ex.repHigh} (RIR {ex.targetRir})
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Coach Assistant Link */}
        <div className="flex items-center justify-between text-xs px-1 text-slate-400">
          <span>Need substitutions or equipment swap?</span>
          <Link href="/coach?prompt=I%20need%20to%20swap%20an%20exercise%20for%20today" className="text-emerald-400 font-semibold hover:underline">
            Ask Coach →
          </Link>
        </div>

        {/* Single Dominant Begin Action */}
        <button
          type="button"
          disabled={!targetDay || exercises.length === 0}
          onClick={() => {
            const secondsToStart = Math.max(1, Math.round((Date.now() - new Date(sessionStartTime).getTime()) / 1000));
            telemetry.track(
              "session_started",
              {
                exercise_count: exercises.length,
                is_recalibrated: isRecalibrationApplied,
                sleep_hours: sleepHours,
                seconds_to_start: secondsToStart,
              },
              currentUser.id
            );
            setMode("active");
          }}
          className={clsx(
            "w-full py-4 font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2",
            !targetDay || exercises.length === 0
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 cursor-pointer"
          )}
        >
          <span>Begin Workout</span>
        </button>

        {/* Different Day Picker Sheet */}
        <Sheet open={isDayPickerOpen} onOpenChange={setIsDayPickerOpen}>
          <SheetContent side="bottom" className="max-w-md mx-auto rounded-t-3xl bg-[#0B0F17] border-slate-800 p-6 space-y-4">
            <SheetHeader className="text-left space-y-1">
              <SheetTitle className="text-base font-bold text-white">Choose a Different Session</SheetTitle>
              <SheetDescription className="text-xs text-slate-400">
                Select a scheduled training day from your current blueprint week.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-2 pt-2">
              {currentWeek?.days.filter((d) => !d.isRestDay).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setIsDayPickerOpen(false);
                    router.push(`/session?day=${d.id}&mode=preview`);
                  }}
                  className={clsx(
                    "w-full p-3.5 rounded-xl text-left transition flex items-center justify-between border cursor-pointer",
                    d.id === targetDay?.id
                      ? "bg-slate-900 border-emerald-500/50 text-emerald-400"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700 text-white"
                  )}
                >
                  <span className="text-xs font-bold">{d.label}</span>
                  {d.id === targetDay?.id && (
                    <span className="text-[10px] font-mono text-emerald-400">Current</span>
                  )}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STATE 3: SESSION SUMMARY (Celebration View)
  // --------------------------------------------------------------------------
  if (mode === "summary") {
    const totalVolume = exercises.reduce(
      (acc, ex) => acc + ex.completedSets.reduce((sAcc, s) => sAcc + s.weight * s.reps, 0),
      0
    );
    const prCount = exercises.reduce(
      (acc, ex) => acc + ex.completedSets.filter((s) => s.isPR).length,
      0
    );
    const durationMin = Math.max(1, Math.round(sessionDurationSec / 60));
    const userTier = ((currentUser as any).tier as any) || "PRO";
    const userSessions = appStore.getSessions(currentUser.id);

    const overloadPrescriptions = exercises.map((ex) => {
      const presc = computeExercisePrescription(userSessions, {
        id: ex.id,
        name: ex.name,
        sets: ex.targetSets,
        repRangeLow: ex.repLow,
        repRangeHigh: ex.repHigh,
        lastWeightKg: ex.currentWeight,
        loadGuidance: ex.loadGuidance,
      });
      return {
        exerciseName: ex.name,
        ...presc,
        previousWeight: ex.currentWeight,
      };
    });

    return (
      <div className="flex-1 pb-12 px-4 pt-12 max-w-md mx-auto w-full space-y-8 animate-in zoom-in-95 duration-300">
        
        {/* Celebration Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-lg">
            🔥
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {targetDay?.label || "Session"} Complete
          </h1>
          <p className="text-xs text-slate-400">
            Outstanding execution. Progressive overload targets achieved.
          </p>
        </div>

        {/* Max 3 Numbers Metric Matrix */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
            <div className="text-lg font-bold text-white tabular">
              {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Vol (kg)</div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
            <div className="text-lg font-bold text-white tabular">{durationMin}m</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Duration</div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
            <div className="text-lg font-bold text-emerald-400 tabular">
              {prCount > 0 ? `+${prCount} PR` : "Solid"}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Records</div>
          </div>
        </div>

        {/* Biomechanical Overload & Deload Prescriptions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Next Session Prescriptions
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              Biomechanical Overload
            </span>
          </div>

          <div className="space-y-2.5">
            {overloadPrescriptions.map((p, idx) => (
              <OverloadPrescriptionCard
                key={`${p.exerciseName}_${idx}`}
                exerciseName={p.exerciseName}
                policyName={p.policyName}
                kind={p.kind}
                weight={p.weight}
                reps={p.reps}
                previousWeight={p.previousWeight}
                formattedWhy={p.formattedWhy}
                userTier={userTier}
              />
            ))}
          </div>
        </div>

        {/* Cross-Pillar Recovery Fuel Insight */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-white">Post-Workout Nutrition: </span>
            Tonnage was high (+{totalVolume} kg). Confirm your recovery shake with 40g protein and 6.9 g creatine within the next 45 minutes.
          </div>
        </div>

        {/* Done & Backup Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => router.push("/today")}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-sm rounded-xl shadow-lg transition"
          >
            Done · Return to Today
          </button>
          <button
            type="button"
            onClick={() => {
              const exportPayload = {
                user: { id: currentUser.id, name: currentUser.name },
                sessions: appStore.getSessions(currentUser.id),
                readinessLogs: appStore.getWearableBiometricsHistory(currentUser.id),
              };
              triggerBackupDownload(exportPayload, `vyra-backup-${currentUser.id}-${new Date().toISOString().split("T")[0]}.json`);
            }}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold rounded-xl transition"
          >
            Export Backup
          </button>
        </div>

      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STATE 2: ACTIVE GYM FLOOR WORKOUT (1 Exercise at a Time, Full-Screen)
  // --------------------------------------------------------------------------
  const currentSetNum = activeEx.completedSets.length + 1;

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col justify-between p-4 max-w-md mx-auto w-full select-none">
      
      {/* 1. Header: Exit Action + Exercise Index + Timer */}
      <header className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <button
          type="button"
          onClick={() => setIsExitAlertOpen(true)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
        >
          <X className="w-4 h-4" />
          <span>Exit</span>
        </button>

        <div className="text-xs font-mono font-semibold text-slate-300">
          Exercise {currentExIndex + 1} of {exercises.length}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
          <Clock className="w-3.5 h-3.5" />
          <span className="tabular">
            {Math.floor(sessionDurationSec / 60)}:{(sessionDurationSec % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </header>

      {/* 2. Main Gym Floor Card (1 Exercise at a Time) */}
      <main className="flex-1 flex flex-col justify-center py-4 space-y-6">
        
        {/* Station-Locked Superset Banner & Sub-Movement Indicator */}
        {activeEx.supersetTag && (
          <div className="p-3 bg-indigo-950/50 border border-indigo-700/60 rounded-xl space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Station-Locked Superset
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-200 border border-indigo-700/50">
                Round {Math.min(activeEx.completedSets.length + 1, activeEx.targetSets)} of {activeEx.targetSets}
              </span>
            </div>
            <div className="text-[11px] text-slate-200">
              {activeEx.subMovementOrder === "3A" ? (
                <span>👉 <strong>3A: Cable Face Pull (Eye-level)</strong> · 0s rest → immediately slide pulley down for 3B</span>
              ) : (
                <span>👉 <strong>3B: Cable Lateral Raise (Knee-level)</strong> · 60s rest triggered after set before next round</span>
              )}
            </div>
            <div className="text-[10px] font-mono text-indigo-300/80">
              {activeEx.supersetTag}
            </div>
          </div>
        )}

        {/* Exercise Header + Tips Trigger */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                {activeEx.subMovementOrder && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    {activeEx.subMovementOrder}
                  </span>
                )}
                <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
                  {activeEx.name}
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Target: {activeEx.targetSets} sets × {activeEx.repLow}-{activeEx.repHigh} reps · RIR {activeEx.targetRir}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  Overload Ceiling: {activeEx.repHigh} reps
                </span>
              </div>
            </div>

            {/* Non-blocking Tips Trigger Button */}
            <button
              type="button"
              onClick={() => setIsTipsOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-emerald-400 flex items-center gap-1.5 transition flex-shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Tips</span>
            </button>
          </div>

          {/* Reference Line: Last Best Session */}
          <div className="text-[11px] text-slate-500 font-mono">
            Previous best: {activeEx.lastBestWeight} kg × {activeEx.lastBestReps} reps
          </div>
        </div>

        {/* Set Progress Dots (● ● ○) */}
        <div className="flex items-center justify-center gap-2 py-1">
          {Array.from({ length: activeEx.targetSets }).map((_, idx) => {
            const isDone = idx < activeEx.completedSets.length;
            const isCurrent = idx === activeEx.completedSets.length;

            return (
              <span
                key={idx}
                className={clsx(
                  "w-3 h-3 rounded-full transition-all",
                  isDone && "bg-emerald-400 scale-100",
                  isCurrent && "border-2 border-emerald-400 bg-transparent animate-pulse",
                  !isDone && !isCurrent && "bg-slate-800 border border-slate-700"
                )}
              />
            );
          })}
        </div>

        {/* Pre-Filled Numeric Steppers: Weight & Reps */}
        <div className="grid grid-cols-2 gap-3">
          <Log.Stepper
            label="Weight (kg)"
            value={activeEx.currentWeight}
            step={2.5}
            unit="kg"
            onChange={(val) =>
              setExercises((prev) => {
                const copy = [...prev];
                copy[currentExIndex].currentWeight = val;
                return copy;
              })
            }
          />

          <Log.Stepper
            label="Reps Completed"
            value={activeEx.currentReps}
            step={1}
            min={1}
            max={50}
            unit="reps"
            onChange={(val) =>
              setExercises((prev) => {
                const copy = [...prev];
                copy[currentExIndex].currentReps = val;
                return copy;
              })
            }
          />
        </div>

        {/* Big Log Set Button (Effort: 1 tap, <= 5s) */}
        <Log.Confirm
          label={
            activeEx.subMovementOrder
              ? `Done · Log ${activeEx.subMovementOrder} (Round ${Math.min(currentSetNum, activeEx.targetSets)}) ✓`
              : `Log Set ${Math.min(currentSetNum, activeEx.targetSets)} ✓`
          }
          subLabel={
            activeEx.subMovementOrder === "3A"
              ? "0s Rest · Immediate transition to 3B"
              : activeEx.subMovementOrder === "3B"
              ? "Triggers 60s rest countdown before next round"
              : isFinalSetOfExercise
              ? "Final set for this exercise"
              : `${activeEx.restSeconds}s rest timer auto-starts`
          }
          onClick={handleLogSet}
        />

        {/* Auto Rest Timer Overlay (Subtle, 1-tap Skip) */}
        {restTimerSec !== null && (
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Rest Interval:</span>
              <span className="font-mono font-bold text-white text-sm tabular">{restTimerSec}s</span>
            </div>
            <button
              type="button"
              onClick={() => setRestTimerSec(null)}
              className="text-[11px] font-semibold text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Skip</span>
              <FastForward className="w-3 h-3" />
            </button>
          </div>
        )}

      </main>

      {/* 3. Bottom Exercise Switcher Controls */}
      <footer className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <button
          type="button"
          disabled={currentExIndex === 0}
          onClick={() => setCurrentExIndex((prev) => Math.max(0, prev - 1))}
          className="p-2 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 text-xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        {isAllExercisesComplete || isFinalExercise ? (
          <button
            type="button"
            onClick={handleFinishSession}
            className="py-2.5 px-4 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-md hover:bg-emerald-400 transition"
          >
            Finish Workout →
          </button>
        ) : (
          <span className="text-[11px] font-mono text-slate-500">
            {activeEx.completedSets.length}/{activeEx.targetSets} sets done
          </span>
        )}

        <button
          type="button"
          disabled={currentExIndex === exercises.length - 1}
          onClick={() => setCurrentExIndex((prev) => Math.min(exercises.length - 1, prev + 1))}
          className="p-2 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 text-xs"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>

      {/* TIPS SHEET (Drawer with Cues, Video, Load Strategy) */}
      <Sheet open={isTipsOpen} onOpenChange={setIsTipsOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto">
          <SheetHeader>
            <div className="flex items-center gap-2 text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <SheetTitle>{activeEx.name}</SheetTitle>
            </div>
            <SheetDescription>
              Setup guide and progression cues.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 pt-2 pb-6 text-xs">
            {/* Coach Load Strategy */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Coach Strategy</span>
              <p className="text-slate-300 leading-relaxed">{activeEx.loadGuidance}</p>
            </div>

            {/* Form Cue */}
            {activeEx.formCue && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">Execution Cue</span>
                <p className="text-slate-300 leading-relaxed">{activeEx.formCue}</p>
              </div>
            )}

            {/* Video Demonstration Link */}
            {activeEx.videoUrl && (
              <a
                href={activeEx.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>Watch Proper Form Guide</span>
                </div>
                <span>→</span>
              </a>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* EXIT CONFIRMATION MODAL */}
      <Sheet open={isExitAlertOpen} onOpenChange={setIsExitAlertOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto text-center space-y-4">
          <SheetHeader>
            <SheetTitle>Exit Active Workout?</SheetTitle>
            <SheetDescription>
              Your logged sets will be safely preserved in today's training log.
            </SheetDescription>
          </SheetHeader>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsExitAlertOpen(false)}
              className="flex-1 py-3 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
            >
              Keep Training
            </button>
            <button
              type="button"
              onClick={() => {
                setIsExitAlertOpen(false);
                router.push("/today");
              }}
              className="flex-1 py-3 bg-rose-600 text-white font-semibold text-xs rounded-xl"
            >
              Exit to Today
            </button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400 text-xs">Loading Session...</div>}>
      <SessionFlow />
    </Suspense>
  );
}
