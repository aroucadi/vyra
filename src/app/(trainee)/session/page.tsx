"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { resolveProgramDay, checkIsPersonalRecord } from "@/lib/utils";
import { WorkoutSession, SetLog, ProgramDay, EquipmentType, ExercisePrescription, Exercise, EquipmentOption, ExerciseConfidenceGuide, ExerciseBiofeedbackTag, ExerciseFeedbackRecord } from "@/lib/types";
import { saveSessionAction } from "@/lib/actions/session";
import { Log } from "@/components/primitives/Log";
import { Card } from "@/components/primitives/Card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { generateAutoregulationPlan, MinimalExerciseTarget } from "@/lib/autoregulation";
import { AdaptiveRecalibrationCard } from "@/components/trainee/AdaptiveRecalibrationCard";
import { OverloadPrescriptionCard } from "@/components/trainee/OverloadPrescriptionCard";
import { PasskeySyncCard } from "@/components/trainee/PasskeySyncCard";
import { MesocycleArchitectCard } from "@/components/trainee/MesocycleArchitectCard";
import { TrainingGoal } from "@/lib/onboarding";
import { computeExercisePrescription } from "@/lib/progression-adapter";
import { telemetry } from "@/lib/telemetry";
import {
  persistClientWorkoutSession,
  triggerBackupDownload,
  saveSessionDraft,
  loadSessionDraft,
  clearSessionDraft,
  enqueueMutation,
  drainMutationQueue,
} from "@/lib/storage";
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
  Volume2,
  VolumeX,
  ArrowRightLeft,
  Plus,
  CheckCircle2,
  Search,
  ExternalLink,
  Eye,
  Flame,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SkipForward,
} from "lucide-react";
import { soundService } from "@/lib/in-gym/sound";
import { SubstitutionCopilotDrawer } from "@/components/trainee/SubstitutionCopilotDrawer";
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
  completedSets: { weight: number; reps: number; isPR: boolean; isDropSet?: boolean }[];
  currentWeight: number;
  currentReps: number;
  target?: string;
  equipment?: string;
  isExtra?: boolean;
  equipmentVariations?: EquipmentOption[];
  confidenceGuide?: ExerciseConfidenceGuide;
  targetMuscleGroups?: string[];
  feedbackTag?: ExerciseBiofeedbackTag;
  feedbackTags?: ExerciseBiofeedbackTag[];
  skippedRemaining?: boolean;
}


const BIOFEEDBACK_OPTIONS: { id: ExerciseBiofeedbackTag; icon: string; label: string; activeColor: string }[] = [
  { id: "optimal", icon: "🎯", label: "Optimal Form", activeColor: "border-emerald-500/50 bg-emerald-500/20 text-emerald-300" },
  { id: "heavy", icon: "🥵", label: "Heavy / Fatigue", activeColor: "border-amber-500/50 bg-amber-500/20 text-amber-300" },
  { id: "balance_issue", icon: "⚖️", label: "Balance / Unstable", activeColor: "border-cyan-500/50 bg-cyan-500/20 text-cyan-300" },
  { id: "joint_strain", icon: "⚡", label: "Joint Discomfort", activeColor: "border-rose-500/50 bg-rose-500/20 text-rose-300" },
  { id: "light", icon: "🪶", label: "Too Light", activeColor: "border-slate-500/50 bg-slate-500/20 text-slate-200" },
];

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
        target: ex.targetMuscleGroups?.[0] || "chest",
        equipment: ex.selectedEquipment || "barbell",
        equipmentVariations: ex.equipmentVariations,
        confidenceGuide: ex.confidenceGuide,
        targetMuscleGroups: ex.targetMuscleGroups,
      };
    });
  });

  const [previewDetailEx, setPreviewDetailEx] = useState<ActiveExercise | null>(null);

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
          target: ex.targetMuscleGroups?.[0] || "chest",
          equipment: ex.selectedEquipment || "barbell",
          equipmentVariations: ex.equipmentVariations,
          confidenceGuide: ex.confidenceGuide,
          targetMuscleGroups: ex.targetMuscleGroups,
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
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState(false);
  const [swapTargetExercise, setSwapTargetExercise] = useState<{
    id?: string;
    name: string;
    target: string;
    equipment: string;
    bodyPart?: string;
  } | null>(null);
  const [isReorderDrawerOpen, setIsReorderDrawerOpen] = useState(false);

  // Timer states
  const [sessionDurationSec, setSessionDurationSec] = useState(0);
  const [restTimerSec, setRestTimerSec] = useState<number | null>(null);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => soundService.getIsMuted());
  const [sessionStartTime] = useState(() => new Date().toISOString());
  const [lastSetLoggedAt, setLastSetLoggedAt] = useState<number>(() => Date.now());

  // SPEC 018: Restore draft if recovering from app switch / browser crash in basement dead zone
  useEffect(() => {
    async function restoreDraft() {
      if (!currentUser?.id) return;
      try {
        const draft = await loadSessionDraft(currentUser.id, 4);
        if (draft && draft.exercises && draft.exercises.length > 0) {
          const hasLoggedSets = draft.exercises.some((e: any) => e.completedSets?.length > 0);
          const matchesDay = !dayParam || !draft.programDayId || draft.programDayId === targetDay?.id;
          const expectedCount = targetDay?.blocks?.flatMap((b) => b.exercises).length || 0;
          const isStaleDraft = expectedCount > 0 && draft.exercises.length < expectedCount;

          if (hasLoggedSets && matchesDay && !isStaleDraft) {
            setExercises(draft.exercises);
            if (typeof draft.currentExerciseIndex === "number") {
              setCurrentExIndex(Math.min(draft.currentExerciseIndex, draft.exercises.length - 1));
            }
            if (typeof draft.durationSec === "number") {
              setSessionDurationSec(draft.durationSec);
            }
            if (mode === "preview") {
              setMode("active");
            }
          } else if (isStaleDraft) {
            // Discard obsolete draft from older program versions to ensure the full 5-exercise blueprint loads
            clearSessionDraft(currentUser.id);
          }
        }
      } catch (err) {
        console.warn("Failed to restore session draft:", err);
      }
    }
    restoreDraft();
  }, [currentUser?.id, dayParam]);

  // SPEC 018: Auto-replay queued offline mutations on online / window focus
  useEffect(() => {
    const handleReplay = async () => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        await drainMutationQueue(async (mutation) => {
          if (mutation.type === "SAVE_SESSION") {
            await saveSessionAction(mutation.payload);
            return true;
          }
          return false;
        });
      }
    };

    window.addEventListener("online", handleReplay);
    window.addEventListener("focus", handleReplay);
    handleReplay();

    return () => {
      window.removeEventListener("online", handleReplay);
      window.removeEventListener("focus", handleReplay);
    };
  }, []);

  // Overall session clock
  useEffect(() => {
    if (mode !== "active") return;
    const interval = setInterval(() => {
      setSessionDurationSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  // Rest countdown timer with athletic audio/haptic chime triggers
  useEffect(() => {
    if (restTimerSec === null || restTimerSec <= 0) return;
    const timer = setInterval(() => {
      setRestTimerSec((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Play dual-tone rest completion chime (880Hz -> 1760Hz) & haptic double-pulse
          soundService.playRestChime();
          return null;
        }
        if (prev <= 4 && prev > 1) {
          // Gentle pip on final 3 seconds (3, 2, 1)
          soundService.playCountdownPip();
        }
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

  const [isWorkoutCompleteModalOpen, setIsWorkoutCompleteModalOpen] = useState<boolean>(false);
  const [isAddExerciseSheetOpen, setIsAddExerciseSheetOpen] = useState<boolean>(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState<string>("");
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>("all");

  const catalogue = React.useMemo(() => {
    return appStore.getExercises();
  }, []);

  const filteredCatalogueExercises = React.useMemo(() => {
    return catalogue.filter((ex) => {
      const q = exerciseSearchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.primaryMuscle.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q);

      const matchCat =
        selectedMuscleFilter === "all" ||
        ex.primaryMuscle.toLowerCase().includes(selectedMuscleFilter.toLowerCase()) ||
        (selectedMuscleFilter === "Arms" &&
          (ex.primaryMuscle.toLowerCase().includes("bicep") ||
            ex.primaryMuscle.toLowerCase().includes("tricep") ||
            ex.primaryMuscle.toLowerCase().includes("forearm"))) ||
        (selectedMuscleFilter === "Back" &&
          (ex.primaryMuscle.toLowerCase().includes("lat") ||
            ex.primaryMuscle.toLowerCase().includes("back")));

      return matchQuery && matchCat;
    });
  }, [catalogue, exerciseSearchQuery, selectedMuscleFilter]);

  const activeEx = exercises[currentExIndex];
  const isExCompleteOrSkipped = Boolean(
    activeEx && (activeEx.completedSets.length >= activeEx.targetSets || activeEx.skippedRemaining)
  );

  const pendingOtherExercises = exercises
    .map((e, idx) => ({ ex: e, idx }))
    .filter(
      ({ ex, idx }) =>
        idx !== currentExIndex && ex.completedSets.length < ex.targetSets && !ex.skippedRemaining
    );

  const isFinalExercise = currentExIndex === exercises.length - 1;
  const isFinalSetOfExercise = activeEx && activeEx.completedSets.length + 1 >= activeEx.targetSets;
  const isAllExercisesComplete = exercises.every((e) => e.completedSets.length >= e.targetSets);
  const isSupersetA = Boolean(activeEx?.subMovementOrder && activeEx.subMovementOrder.endsWith("A"));
  const isSupersetB = Boolean(activeEx?.subMovementOrder && activeEx.subMovementOrder.endsWith("B"));
  const supersetPrefix = activeEx?.subMovementOrder ? activeEx.subMovementOrder.slice(0, -1) : "";

  // Add bonus set to active exercise
  const handleAddBonusSet = () => {
    if (!activeEx) return;
    setExercises((prev) => {
      const copy = [...prev];
      copy[currentExIndex] = {
        ...copy[currentExIndex],
        targetSets: copy[currentExIndex].targetSets + 1,
      };
      saveSessionDraft(currentUser.id, copy, currentExIndex, sessionDurationSec, targetDay?.id);
      return copy;
    });
    setIsWorkoutCompleteModalOpen(false);
  };

  // Add extra exercise to active workout on top of program
  const handleAddExtraExercise = (picked: Exercise) => {
    const pb = appStore.getPersonalBestForExercise(currentUser.id, picked.name);
    const defaultWeight = pb ? pb.weightKg : (picked.equipment?.toLowerCase() === "bodyweight" ? 0 : 20);
    const defaultReps = pb ? pb.reps : 10;

    const newEx: ActiveExercise = {
      id: `extra_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: picked.name,
      category: "Bonus Work (On top of program)",
      targetSets: 3,
      repLow: 8,
      repHigh: 12,
      targetRir: 1,
      restSeconds: 60,
      lastBestWeight: defaultWeight,
      lastBestReps: defaultReps,
      formCue: picked.steps?.[0] || "Execute with strict eccentric control through full active range of motion.",
      videoUrl: picked.videoUrl,
      loadGuidance: "Bonus exercise logged on top of prescribed program. Train with 1-2 RIR.",
      completedSets: [],
      currentWeight: defaultWeight,
      currentReps: defaultReps,
      target: picked.primaryMuscle || "Upper Body",
      equipment: picked.equipment?.toLowerCase() || "dumbbell",
      isExtra: true,
    };

    const nextIndex = exercises.length;
    setExercises((prev) => {
      const updated = [...prev, newEx];
      saveSessionDraft(currentUser.id, updated, nextIndex, sessionDurationSec, targetDay?.id);
      return updated;
    });

    setCurrentExIndex(nextIndex);
    setIsAddExerciseSheetOpen(false);
    setIsWorkoutCompleteModalOpen(false);
  };

  // Exercise Sequence & Jump Helpers
  const moveExerciseUp = (index: number) => {
    if (index <= 0) return;
    setExercises((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      saveSessionDraft(currentUser.id, copy, currentExIndex === index ? index - 1 : currentExIndex === index - 1 ? index : currentExIndex, sessionDurationSec, targetDay?.id);
      return copy;
    });
    if (currentExIndex === index) {
      setCurrentExIndex(index - 1);
    } else if (currentExIndex === index - 1) {
      setCurrentExIndex(index);
    }
  };

  const moveExerciseDown = (index: number) => {
    if (index >= exercises.length - 1) return;
    setExercises((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      saveSessionDraft(currentUser.id, copy, currentExIndex === index ? index + 1 : currentExIndex === index + 1 ? index : currentExIndex, sessionDurationSec, targetDay?.id);
      return copy;
    });
    if (currentExIndex === index) {
      setCurrentExIndex(index + 1);
    } else if (currentExIndex === index + 1) {
      setCurrentExIndex(index);
    }
  };

  const jumpToExercise = (index: number) => {
    if (index < 0 || index >= exercises.length) return;
    setCurrentExIndex(index);
    saveSessionDraft(currentUser.id, exercises, index, sessionDurationSec, targetDay?.id);
    setIsReorderDrawerOpen(false);
  };

  const handleSkipRemainingSets = () => {
    if (!activeEx) return;
    setExercises((prev) => {
      const copy = [...prev];
      copy[currentExIndex] = {
        ...copy[currentExIndex],
        skippedRemaining: true,
      };
      saveSessionDraft(currentUser.id, copy, currentExIndex, sessionDurationSec, targetDay?.id);
      return copy;
    });
  };

  const handleToggleFeedbackTag = (tag: ExerciseBiofeedbackTag) => {
    if (!activeEx) return;
    setExercises((prev) => {
      const copy = [...prev];
      const currentTags = copy[currentExIndex].feedbackTags || (copy[currentExIndex].feedbackTag ? [copy[currentExIndex].feedbackTag!] : []);
      const nextTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];

      copy[currentExIndex] = {
        ...copy[currentExIndex],
        feedbackTags: nextTags,
        feedbackTag: nextTags[0],
      };
      saveSessionDraft(currentUser.id, copy, currentExIndex, sessionDurationSec, targetDay?.id);
      return copy;
    });

    telemetry.track(
      "exercise_feedback_logged",
      {
        exercise_name: activeEx.name,
        feedback_tag: tag,
        all_tags: activeEx.feedbackTags,
        completed_sets: activeEx.completedSets.length,
        target_sets: activeEx.targetSets,
      },
      currentUser.id
    );
  };

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
      // SPEC 018: Instant local draft journal (< 2ms) to prevent data loss in basement dead zones
      saveSessionDraft(currentUser.id, updated, currentExIndex, sessionDurationSec, targetDay?.id);
      return updated;
    });

    // Track set logging telemetry with seconds_per_set
    const now = Date.now();
    const secondsPerSet = Math.max(1, Math.round((now - lastSetLoggedAt) / 1000));
    setLastSetLoggedAt(now);

    const prescribedLoad = activeEx.lastBestWeight;
    const loggedLoad = activeEx.currentWeight;
    const loadDeltaKg = Number((loggedLoad - prescribedLoad).toFixed(2));
    const isOverride = prescribedLoad > 0 && Math.abs(loadDeltaKg) > 0.01;

    telemetry.track(
      "workout_set_logged",
      {
        exercise_name: activeEx.name,
        prescribed_load_kg: prescribedLoad,
        logged_load_kg: loggedLoad,
        load_delta_kg: loadDeltaKg,
        is_load_override: isOverride,
        reps: activeEx.currentReps,
        set_index: activeEx.completedSets.length + 1,
        is_pr: isPR,
        equipment: activeEx.equipment,
        sub_movement_order: activeEx.subMovementOrder,
        seconds_per_set: secondsPerSet,
      },
      currentUser.id
    );

    const newCompletedLength = newCompleted.length;
    const isThisExNowComplete = newCompletedLength >= activeEx.targetSets;

    const willAllExercisesBeComplete = exercises.every((e, idx) => {
      const count = idx === currentExIndex ? newCompletedLength : e.completedSets.length;
      return count >= e.targetSets;
    });

    // Workflow & Rest Timer logic:
    // If all exercises are now complete OR if the final exercise reached its target:
    // Prompt the trainee: "Workout complete! Done or want to log more?"
    const isSupersetA = Boolean(activeEx.subMovementOrder && activeEx.subMovementOrder.endsWith("A"));
    const isSupersetB = Boolean(activeEx.subMovementOrder && activeEx.subMovementOrder.endsWith("B"));
    const supersetPrefix = activeEx.subMovementOrder ? activeEx.subMovementOrder.slice(0, -1) : "";

    if (willAllExercisesBeComplete || (isFinalExercise && isThisExNowComplete)) {
      setRestTimerSec(null);
      soundService.playRestChime();
      setTimeout(() => {
        setIsWorkoutCompleteModalOpen(true);
      }, 300);
    } else if (isSupersetA) {
      setRestTimerSec(null);
      const nextBIndex = exercises.findIndex(
        (e, idx) => idx > currentExIndex && e.subMovementOrder === `${supersetPrefix}B`
      );
      if (nextBIndex !== -1) {
        setTimeout(() => {
          setCurrentExIndex(nextBIndex);
        }, 150);
      }
    } else if (isSupersetB) {
      setRestTimerSec(activeEx.restSeconds || 60);
      const partnerAIndex = exercises.findIndex(
        (e) => e.subMovementOrder === `${supersetPrefix}A`
      );
      const currentBRounds = newCompleted.length;
      if (currentBRounds < activeEx.targetSets && partnerAIndex !== -1) {
        setTimeout(() => {
          setCurrentExIndex(partnerAIndex);
        }, 200);
      } else if (currentBRounds >= activeEx.targetSets && !isFinalExercise) {
        setTimeout(() => {
          setCurrentExIndex((prev) => Math.min(exercises.length - 1, prev + 1));
        }, 400);
      }
    } else {
      setRestTimerSec(activeEx.restSeconds);
    }
  };

  const handleLogDropSet = () => {
    const isPR = checkIsPersonalRecord(
      activeEx.currentWeight,
      activeEx.currentReps,
      activeEx.lastBestWeight,
      activeEx.lastBestReps
    );

    const dropSetItem = {
      weight: activeEx.currentWeight,
      reps: activeEx.currentReps,
      isPR,
      isDropSet: true,
    };

    setExercises((prev) => {
      const copy = [...prev];
      const targetEx = copy[currentExIndex];
      const newCompleted = [...targetEx.completedSets, dropSetItem];
      // Auto-step weight down by ~20-25% for the next drop
      const nextSuggestedWeight = Math.max(2.5, Math.round((targetEx.currentWeight * 0.75) / 2.5) * 2.5);

      copy[currentExIndex] = {
        ...targetEx,
        completedSets: newCompleted,
        currentWeight: nextSuggestedWeight,
        currentReps: Math.max(4, targetEx.currentReps - 2),
      };
      saveSessionDraft(currentUser.id, copy, currentExIndex, sessionDurationSec, targetDay?.id);
      return copy;
    });

    telemetry.track(
      "workout_set_logged",
      {
        exercise_name: activeEx.name,
        logged_load_kg: activeEx.currentWeight,
        reps: activeEx.currentReps,
        is_drop_set: true,
        drop_index: activeEx.completedSets.filter((s) => s.isDropSet).length + 1,
      },
      currentUser.id
    );

    // Sound cue without full rest timer delay
    soundService.playCountdownPip();
    setRestTimerSec(null);
  };

  // Finish session
  const handleFinishSession = async (snapshot?: ActiveExercise[]) => {
    const listToSave = snapshot || exercises;
    const allSetLogs: SetLog[] = listToSave.flatMap((ex, exIdx) =>
      ex.completedSets.map((s, sIdx) => ({
        id: `set_${Date.now()}_${exIdx}_${sIdx}`,
        exercisePrescriptionId: ex.id,
        exerciseName: ex.name,
        setIndex: sIdx + 1,
        reps: s.reps,
        weightKg: s.weight,
        rirAchieved: ex.targetRir,
        isPR: s.isPR,
        isDropSet: s.isDropSet,
        feedbackTag: ex.feedbackTag,
        feedbackTags: ex.feedbackTags || (ex.feedbackTag ? [ex.feedbackTag] : []),
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
      exerciseFeedbacks: listToSave
        .filter((ex) => (ex.feedbackTags && ex.feedbackTags.length > 0) || !!ex.feedbackTag)
        .map((ex) => ({
          exerciseName: ex.name,
          tag: ex.feedbackTag,
          tags: ex.feedbackTags || (ex.feedbackTag ? [ex.feedbackTag] : []),
        })),
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

    // SPEC 018: Clear local draft, persist optimistically to durable storage, and queue network mutation on failure
    await clearSessionDraft(currentUser.id);
    await persistClientWorkoutSession(completedSession);
    try {
      await saveSessionAction(completedSession);
    } catch {
      await enqueueMutation({
        id: `mut_${completedSession.id}`,
        type: "SAVE_SESSION",
        payload: completedSession,
        maxAttempts: 5,
      });
    }
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

        {/* Clean Exercise List (with 1-tap video & interactive preview) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-800/80">
          <div className="pb-2.5 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {isRecalibrationApplied ? "Recalibrated Program Blueprint" : "Planned Program Blueprint"}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Tap exercise for form cues & video
            </span>
          </div>
          {exercises.map((ex, idx) => (
            <div
              key={ex.id}
              onClick={() => setPreviewDetailEx(ex)}
              className="py-3 first:pt-2 last:pb-0 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-800/50 rounded-xl px-2 -mx-2 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span className="font-mono text-slate-500 text-[10px] w-6 flex-shrink-0">
                  {ex.subMovementOrder || `${idx + 1}.`}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-slate-200 truncate">{ex.name}</span>
                    {ex.subMovementOrder && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                        Superset
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                    <span className="text-emerald-400 font-semibold tabular-nums">{ex.currentWeight}kg</span>
                    <span>·</span>
                    <span>{ex.targetSets} × {ex.repLow}-{ex.repHigh} (RIR {ex.targetRir})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveExerciseUp(idx)}
                  className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 disabled:opacity-20 text-slate-300 transition"
                  title="Move up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === exercises.length - 1}
                  onClick={() => moveExerciseDown(idx)}
                  className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 disabled:opacity-20 text-slate-300 transition"
                  title="Move down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                {ex.videoUrl && (
                  <a
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/50 hover:bg-emerald-900/60 text-emerald-400 flex items-center gap-1 text-[11px] font-semibold transition"
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

        {/* Substitution Copilot Trigger */}
        <div className="flex items-center justify-between text-xs px-1 text-slate-400">
          <span>Equipment occupied or need substitutions?</span>
          <button
            type="button"
            onClick={() => {
              if (exercises.length > 0) {
                setSwapTargetExercise({
                  id: exercises[0].id,
                  name: exercises[0].name,
                  target: exercises[0].target || "chest",
                  equipment: exercises[0].equipment || "barbell",
                });
                setIsSwapDrawerOpen(true);
              }
            }}
            className="text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Swap Copilot →</span>
          </button>
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
        {/* Exercise Form & Video Preview Bottom Sheet */}
        <Sheet open={!!previewDetailEx} onOpenChange={(open) => !open && setPreviewDetailEx(null)}>
          <SheetContent side="bottom" className="max-w-md mx-auto max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#0B0F17] border-slate-800 p-6 space-y-4">
            {previewDetailEx && (
              <>
                <SheetHeader className="text-left space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      {previewDetailEx.subMovementOrder ? `SLOT ${previewDetailEx.subMovementOrder}` : "EXERCISE PREVIEW"}
                    </span>
                    {previewDetailEx.equipment && (
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {previewDetailEx.equipment}
                      </span>
                    )}
                  </div>
                  <SheetTitle className="text-lg font-bold text-white tracking-tight">
                    {previewDetailEx.name}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-slate-400">
                    {previewDetailEx.targetSets} sets × {previewDetailEx.repLow}-{previewDetailEx.repHigh} reps · Target RIR {previewDetailEx.targetRir} · {previewDetailEx.restSeconds}s rest
                  </SheetDescription>
                </SheetHeader>

                {/* 1-Tap Video Demo Button */}
                {previewDetailEx.videoUrl ? (
                  <a
                    href={previewDetailEx.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                  >
                    <Video className="w-4 h-4 stroke-[2.5]" />
                    <span>Watch Form Demonstration Video</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                ) : (
                  <div className="text-[11px] text-slate-500 bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                    Video tutorial included in library catalogue
                  </div>
                )}

                {/* Kinetic Form Cue */}
                {previewDetailEx.formCue && (
                  <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Form Cue & Kinetic Anchor</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {previewDetailEx.formCue}
                    </p>
                  </div>
                )}

                {/* Coach Progression Guidance */}
                {previewDetailEx.loadGuidance && (
                  <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                      Coach Progression Strategy
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {previewDetailEx.loadGuidance}
                    </p>
                  </div>
                )}

                {/* Setup Checklist if available from Confidence Guide */}
                {previewDetailEx.confidenceGuide?.hardware?.setupSteps && previewDetailEx.confidenceGuide.hardware.setupSteps.length > 0 && (
                  <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Setup Checklist
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      {previewDetailEx.confidenceGuide.hardware.setupSteps.map((step: string, idx: number) => (
                        <li key={idx} className="leading-snug text-slate-300">{step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Equipment Variations if gym station is occupied */}
                {previewDetailEx.equipmentVariations && previewDetailEx.equipmentVariations.length > 0 && (
                  <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      <span>Available Equipment Variations</span>
                      <span className="text-slate-500 font-normal">Swap if station occupied</span>
                    </div>
                    <div className="space-y-1.5">
                      {previewDetailEx.equipmentVariations.map((v, i) => (
                        <div key={i} className="p-2 bg-slate-950 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-mono text-cyan-400 mr-2">{v.equipmentType}</span>
                            <span className="text-slate-200 font-medium">{v.exerciseName}</span>
                          </div>
                          {v.videoUrl && (
                            <a
                              href={v.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              <Video className="w-3 h-3" />
                              <span>Demo</span>
                            </a>
                          )}
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

        {/* Post-Session 1 Adaptive 16-Week Mesocycle Preview (Spec 027) */}
        {(() => {
          const userGoal: TrainingGoal = ((currentUser as any).goals?.[0] as TrainingGoal) || "hypertrophy";
          const primaryEx = exercises[0];
          const bestSet = primaryEx?.completedSets?.length
            ? primaryEx.completedSets.reduce(
                (best, s) =>
                  s.weight * (1 + s.reps / 30) > best.weight * (1 + best.reps / 30) ? s : best,
                primaryEx.completedSets[0]
              )
            : null;
          const benchmark1RmKg = bestSet
            ? Math.round(bestSet.weight * (1 + bestSet.reps / 30))
            : primaryEx?.currentWeight
            ? Math.round(primaryEx.currentWeight * 1.25)
            : 80;

          return (
            <MesocycleArchitectCard
              userId={currentUser.id}
              goal={userGoal}
              benchmark1RmKg={benchmark1RmKg}
            />
          );
        })()}

        {/* Post-Session 1 Passkey Registration & Cloud Sync Handoff (Spec 021) */}
        <PasskeySyncCard
          userId={currentUser.id}
          userName={currentUser.name}
          sessionsCount={appStore.getSessions(currentUser.id).length}
        />

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
      
      {/* 1. Header: Exit Action + Exercise Index + Add Exercise + Timer */}
      <header className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <button
          type="button"
          onClick={() => setIsExitAlertOpen(true)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Exit</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsReorderDrawerOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-full text-xs font-mono text-slate-300 hover:text-white transition cursor-pointer"
            title="Reorder exercises or jump to available machine"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentExIndex + 1}/{exercises.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddExerciseSheetOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
            title="Log extra exercise on top of program"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>Exercise</span>
          </button>
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

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Direct 1-Click Video Form Demonstration */}
              {activeEx.videoUrl && (
                <a
                  href={activeEx.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                  title="Watch quick exercise form demonstration (1 click)"
                >
                  <Video className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Video</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setSwapTargetExercise({
                    id: activeEx.id,
                    name: activeEx.name,
                    target: activeEx.target || "chest",
                    equipment: activeEx.equipment || "barbell",
                  });
                  setIsSwapDrawerOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                aria-label="Swap occupied exercise equipment"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>Swap</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTipsOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Tips</span>
              </button>
            </div>
          </div>

          {/* Reference Line: Last Best Session */}
          <div className="text-[11px] text-slate-500 font-mono">
            Previous best: {activeEx.lastBestWeight} kg × {activeEx.lastBestReps} reps
          </div>
        </div>

        {/* Set Progress Dots (● ● ○) + Completed Sets Summary */}
        <div className="space-y-2 py-1">
          <div className="flex items-center justify-center gap-2">
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

          {activeEx.completedSets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 justify-center">
              {activeEx.completedSets.map((s, idx) => (
                <span
                  key={idx}
                  className={clsx(
                    "px-2 py-0.5 rounded-lg text-[11px] font-mono border flex items-center gap-1",
                    s.isDropSet
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold"
                      : "bg-slate-900 border-slate-800 text-slate-300"
                  )}
                >
                  <span className="text-slate-500 text-[10px]">
                    {s.isDropSet ? "🔥 Drop:" : `S${idx + 1}:`}
                  </span>
                  <span>{s.weight}kg</span>
                  <span className="text-slate-400">× {s.reps}</span>
                </span>
              ))}
            </div>
          )}
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

        {/* Big Log Set / Exercise & Workout Completion Controls */}
        {isExCompleteOrSkipped ? (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Biofeedback Rating Chips (Multi-Select) */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <span>How did this lift feel? (Select all that apply)</span>
                </span>
                {(activeEx.feedbackTags && activeEx.feedbackTags.length > 0) || activeEx.feedbackTag ? (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-0.2 rounded bg-emerald-500/10">
                    {(activeEx.feedbackTags?.length || (activeEx.feedbackTag ? 1 : 0))} selected ✓
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">Multi-select</span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {BIOFEEDBACK_OPTIONS.map((tag) => {
                  const isSelected = Boolean(
                    activeEx.feedbackTags?.includes(tag.id) || (!activeEx.feedbackTags && activeEx.feedbackTag === tag.id)
                  );
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleFeedbackTag(tag.id)}
                      className={clsx(
                        "py-2 px-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between gap-1.5 cursor-pointer",
                        isSelected
                          ? tag.activeColor
                          : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm">{tag.icon}</span>
                        <span className="font-semibold truncate">{tag.label}</span>
                      </div>
                      {isSelected && <span className="text-xs font-bold text-emerald-400 flex-shrink-0">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Step: Primary CTA (Next Exercise or Finish Workout) */}
            {isAllExercisesComplete || isFinalExercise ? (
              <button
                type="button"
                onClick={() => handleFinishSession()}
                className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold rounded-2xl shadow-lg transition-all flex flex-col items-center justify-center gap-1 cursor-pointer animate-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>Finish Workout & View Results ✓</span>
                </div>
                <span className="text-[11px] font-medium text-slate-900/80">
                  All prescribed sets complete · Tap to save & view summary
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentExIndex((prev) => Math.min(exercises.length - 1, prev + 1))}
                className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold rounded-2xl shadow-lg transition-all flex flex-col items-center justify-center gap-1 cursor-pointer animate-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-2 text-base">
                  <span>Next: {exercises[currentExIndex + 1]?.name} →</span>
                </div>
                <span className="text-[11px] font-medium text-slate-900/80">
                  {activeEx.name} complete ({activeEx.completedSets.length}/{activeEx.targetSets} sets)
                </span>
              </button>
            )}

            {/* Station Busy? Jump to any remaining pending exercise */}
            {pendingOtherExercises.length > 0 && (
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Machine busy? Jump to available station:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {pendingOtherExercises.map(({ ex, idx }) => (
                    <button
                      key={ex.id || idx}
                      type="button"
                      onClick={() => jumpToExercise(idx)}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span className="text-emerald-400 font-mono font-bold">#{idx + 1}</span>
                      <span className="truncate max-w-[140px] font-semibold">{ex.name}</span>
                      <span className="text-[9px] text-slate-400 uppercase">({ex.equipment || "free"})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Drop Set & Extra Set Actions */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleLogDropSet}
                className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-semibold text-amber-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Log immediate drop set with reduced load"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Drop Set ({activeEx.currentWeight}kg × {activeEx.currentReps})</span>
              </button>
              <button
                type="button"
                onClick={handleAddBonusSet}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Bonus Set</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsAddExerciseSheetOpen(true)}
              className="w-full py-2 px-3 text-[11px] text-slate-400 hover:text-slate-200 border border-slate-800/80 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ Add Extra Exercise on top of program</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Log.Confirm
              label={
                activeEx.subMovementOrder
                  ? `Done · Log ${activeEx.subMovementOrder} (Round ${Math.min(currentSetNum, activeEx.targetSets)}) ✓`
                  : `Log Set ${Math.min(currentSetNum, activeEx.targetSets)} ✓`
              }
              subLabel={
                isSupersetA
                  ? `0s Rest · Immediate transition to ${supersetPrefix}B`
                  : isSupersetB
                  ? `Triggers ${activeEx.restSeconds || 60}s rest countdown before next round`
                  : isFinalSetOfExercise
                  ? "Final target set · Tap to finish or log drop set"
                  : `${activeEx.restSeconds}s rest timer auto-starts`
              }
              onClick={handleLogSet}
            />

            {/* 1-Tap Options: Skip sets & record difficulty OR reorder station */}
            <div className="flex items-center justify-between pt-1 px-1 text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => setIsReorderDrawerOpen(true)}
                className="hover:text-cyan-400 flex items-center gap-1 transition cursor-pointer"
              >
                <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                <span>Reorder / Jump</span>
              </button>
              <button
                type="button"
                onClick={handleSkipRemainingSets}
                className="hover:text-amber-400 flex items-center gap-1 transition cursor-pointer"
              >
                <SkipForward className="w-3 h-3 text-amber-400" />
                <span>End lift & rate feedback →</span>
              </button>
            </div>

            {/* In-Gym Drop Set Option */}
            {activeEx.completedSets.length > 0 && (
              <button
                type="button"
                onClick={handleLogDropSet}
                className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 rounded-xl text-xs font-semibold text-amber-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Log as Drop Set ({activeEx.currentWeight}kg × {activeEx.currentReps})</span>
              </button>
            )}
          </div>
        )}

        {/* Auto Rest Timer Overlay (Subtle, 1-tap Skip + Audio Chime Toggle) */}
        {restTimerSec !== null && (
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Rest:</span>
              <span className="font-mono font-bold text-white text-sm tabular">{restTimerSec}s</span>
              <span className="text-[10px] font-mono text-emerald-400/80 px-1.5 py-0.2 rounded bg-emerald-500/10 hidden sm:inline">
                Chime & Haptic Active
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const next = !isSoundMuted;
                  setIsSoundMuted(next);
                  soundService.setMuted(next);
                }}
                aria-label={isSoundMuted ? "Unmute rest timer audio" : "Mute rest timer audio"}
                className="p-1 rounded-md text-slate-400 hover:text-white transition"
              >
                {isSoundMuted ? (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setRestTimerSec(null)}
                className="text-[11px] font-semibold text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Skip</span>
                <FastForward className="w-3 h-3" />
              </button>
            </div>
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
            onClick={() => handleFinishSession()}
            className="py-2.5 px-4 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-md hover:bg-emerald-400 transition"
          >
            Finish Workout →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsReorderDrawerOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            title="Jump station or change order"
          >
            <ArrowUpDown className="w-3 h-3 text-cyan-400" />
            <span>{activeEx.completedSets.length}/{activeEx.targetSets} done · Jump</span>
          </button>
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
            {/* Direct Video Demonstration Link */}
            {activeEx.videoUrl && (
              <a
                href={activeEx.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition"
              >
                <Video className="w-4 h-4 stroke-[2.5]" />
                <span>Watch Form Demonstration Video</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            )}

            {/* Quick In-Gym Form & Strategy Cues (Zero walls of text) */}
            {activeEx.formCue && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Form Cue</span>
                <p className="text-xs text-white font-medium leading-snug">{activeEx.formCue}</p>
              </div>
            )}

            {activeEx.loadGuidance && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">Overload Strategy</span>
                <p className="text-xs text-slate-300 leading-snug">{activeEx.loadGuidance}</p>
              </div>
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

      {/* INTELLIGENT SUBSTITUTION COPILOT DRAWER (Spec 017) */}
      <SubstitutionCopilotDrawer
        isOpen={isSwapDrawerOpen}
        onClose={() => setIsSwapDrawerOpen(false)}
        currentExercise={swapTargetExercise}
        onApplySubstitute={(candidate) => {
          setExercises((prev) =>
            prev.map((ex, idx) => {
              const matches = (swapTargetExercise?.id && ex.id === swapTargetExercise.id) || idx === currentExIndex;
              if (!matches) return ex;
              return {
                ...ex,
                name: candidate.name,
                formCue: candidate.instructions?.[0] || ex.formCue,
                equipment: candidate.equipment,
                target: candidate.target,
                currentWeight: candidate.equipment.toLowerCase().includes("body") ? 0 : ex.currentWeight,
              };
            })
          );
          setIsSwapDrawerOpen(false);
        }}
      />

      {/* WORKOUT COMPLETE: "DONE OR WANT TO LOG MORE?" MODAL */}
      <Sheet open={isWorkoutCompleteModalOpen} onOpenChange={setIsWorkoutCompleteModalOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto text-center space-y-5 pb-6">
          <SheetHeader className="space-y-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-lg animate-in zoom-in-50 duration-300">
              🔥
            </div>
            <SheetTitle className="text-xl font-bold text-white tracking-tight">
              Workout Prescribed Target Crushed!
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              All prescribed sets logged ({exercises.reduce((s, e) => s + e.completedSets.length, 0)} total sets).
              Are you done for today, or do you want to log extra exercises on top of the program?
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsWorkoutCompleteModalOpen(false);
                handleFinishSession();
              }}
              className="w-full py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Finish & Save Workout ✓</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsWorkoutCompleteModalOpen(false);
                setIsAddExerciseSheetOpen(true);
              }}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>+ Log Extra Exercise (On Top of Program)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsWorkoutCompleteModalOpen(false);
                handleAddBonusSet();
              }}
              className="w-full py-2.5 px-4 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              + Add 1 More Bonus Set to {activeEx?.name || "Exercise"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ADD EXTRA EXERCISE DRAWER */}
      <Sheet open={isAddExerciseSheetOpen} onOpenChange={setIsAddExerciseSheetOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto max-h-[85vh] flex flex-col p-4">
          <SheetHeader className="pb-3 text-left">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add Extra Exercise</span>
              </SheetTitle>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                Logged on top of program
              </span>
            </div>
            <SheetDescription className="text-xs text-slate-400">
              Select any movement from the catalogue to add bonus volume to today's workout.
            </SheetDescription>
          </SheetHeader>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search exercise or muscle (e.g. chest, lat, curl)..."
              value={exerciseSearchQuery}
              onChange={(e) => setExerciseSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Muscle Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-[11px]">
            {["all", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedMuscleFilter(cat)}
                className={clsx(
                  "px-3 py-1 rounded-full whitespace-nowrap font-medium transition cursor-pointer",
                  selectedMuscleFilter === cat
                    ? "bg-emerald-500 text-slate-950 font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                )}
              >
                {cat === "all" ? "All Muscles" : cat}
              </button>
            ))}
          </div>

          {/* Exercise List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[50vh]">
            {filteredCatalogueExercises.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleAddExtraExercise(ex)}
                className="w-full p-3 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left flex items-center justify-between transition cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition">
                    {ex.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                    <span className="text-emerald-400/90 font-medium">{ex.primaryMuscle}</span>
                    <span>•</span>
                    <span className="capitalize">{ex.equipment}</span>
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-400 transition">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
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
