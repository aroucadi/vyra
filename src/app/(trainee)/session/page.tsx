"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { resolveProgramDay, checkIsPersonalRecord } from "@/lib/utils";
import { WorkoutSession, SetLog, ProgramDay, EquipmentType, ExercisePrescription, Exercise, EquipmentOption, ExerciseConfidenceGuide, ExerciseBiofeedbackTag, ExerciseFeedbackRecord, GymLocation } from "@/lib/types";
import { saveSessionAction } from "@/lib/actions/session";
import { uploadEquipmentPhotoAction } from "@/lib/actions/upload";
import { AudioNoteRecorder } from "@/components/trainee/AudioNoteRecorder";
import { GymSelectorDrawer } from "@/components/trainee/GymSelectorDrawer";
import { shareEquipmentPhotoWithGemini } from "@/lib/share-equipment";
import { isCloudStorageEnabled } from "@/lib/cloud-storage";
import { getStorageAdapter } from "@/lib/storage/adapter";
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
  MapPin,
  Search,
  ExternalLink,
  Eye,
  Flame,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SkipForward,
  Zap,
  Layers,
  Camera,
  FileText,
  Share2,
} from "lucide-react";
import { soundService } from "@/lib/in-gym/sound";
import { SubstitutionCopilotDrawer } from "@/components/trainee/SubstitutionCopilotDrawer";
import { JitCoachPropositionCard } from "@/components/trainee/JitCoachPropositionCard";
import { DailyAiCoachAdapterCard } from "@/components/trainee/DailyAiCoachAdapterCard";
import { DailyWorkoutAdaptationResult } from "@/lib/ai/daily-session-adapter";
import { evaluateJustInTimeProposition, CoachProposition } from "@/lib/ai/coach-agent";
import { sensoryMemoryStore } from "@/lib/ai/sensory-memory";
import { createEventEnvelope } from "@/lib/storage/events";
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
  feedbackNote?: string;
  feedbackAudioUrl?: string;
  equipmentPhotoUrl?: string;
  skippedRemaining?: boolean;
  supersetMode?: "superset" | "straight";
  targetWeightKg?: number;
  warmupSets?: number;
}


const BIOFEEDBACK_OPTIONS: { id: ExerciseBiofeedbackTag; icon: string; label: string; activeColor: string }[] = [
  { id: "optimal", icon: "🎯", label: "Optimal Form", activeColor: "border-amber-500/50 bg-amber-500/20 text-amber-300" },
  { id: "heavy", icon: "🥵", label: "Heavy / Fatigue", activeColor: "border-amber-500/50 bg-amber-500/20 text-amber-300" },
  { id: "balance_issue", icon: "⚖️", label: "Balance / Unstable", activeColor: "border-cyan-500/50 bg-cyan-500/20 text-cyan-300" },
  { id: "joint_strain", icon: "⚡", label: "Joint Discomfort", activeColor: "border-rose-500/50 bg-rose-500/20 text-rose-300" },
  { id: "light", icon: "🪶", label: "Too Light", activeColor: "border-slate-500/50 bg-slate-500/20 text-slate-200" },
];

function formatDuration(sec?: number): string {
  if (!sec || sec <= 0) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}


function compressImage(file: File, maxDim = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new (window as any).Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  const initialMode = (searchParams.get("mode") as "preview" | "warmup" | "active" | "cooldown" | "summary") || "preview";
  const [mode, setMode] = useState<"preview" | "warmup" | "active" | "cooldown" | "summary">(initialMode);
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);
  const [isGymDrawerOpen, setIsGymDrawerOpen] = useState(false);
  const [selectedGym, setSelectedGym] = useState<GymLocation | null>(() => {
    return appStore.getDefaultGymLocation(currentUser.id) || null;
  });

  // Exercises initialization
  const [exercises, setExercises] = useState<ActiveExercise[]>(() => {
    if (!targetDay || !targetDay.blocks) return [];
    const exPrescriptions = targetDay.blocks.flatMap((b) => b.exercises);
    return exPrescriptions.map((ex) => {
      const pb = appStore.getPersonalBestForExercise(currentUser.id, ex.exerciseName);
      const defaultWeight = pb ? pb.weightKg : (ex.targetWeightKg !== undefined ? ex.targetWeightKg : (ex.selectedEquipment === "bodyweight" ? 0 : 25));
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
        targetWeightKg: ex.targetWeightKg,
        warmupSets: ex.warmupSets,
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
        const defaultWeight = pb ? pb.weightKg : (ex.targetWeightKg !== undefined ? ex.targetWeightKg : (ex.selectedEquipment === "bodyweight" ? 0 : 25));
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
          targetWeightKg: ex.targetWeightKg,
          warmupSets: ex.warmupSets,
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

  // Wall-Clock Timing Architecture & Epoch References (Zero sleep throttling)
  const sessionStartEpochRef = React.useRef<number | null>(null);
  const warmupStartEpochRef = React.useRef<number | null>(null);
  const liftingStartEpochRef = React.useRef<number | null>(null);
  const cooldownStartEpochRef = React.useRef<number | null>(null);
  const restTargetEpochRef = React.useRef<number | null>(null);
  const restStartEpochRef = React.useRef<number | null>(null);

  const [sessionDurationSec, setSessionDurationSec] = useState(0);
  const [liftingDurationSec, setLiftingDurationSec] = useState(0);
  const [totalRestDurationSec, setTotalRestDurationSec] = useState(0);
  const [warmupDurationSec, setWarmupDurationSec] = useState(0);
  const [cooldownDurationSec, setCooldownDurationSec] = useState(0);
  const [warmupCompleted, setWarmupCompleted] = useState<boolean | undefined>(undefined);
  const [cooldownCompleted, setCooldownCompleted] = useState<boolean | undefined>(undefined);
  const [checkedWarmupDrills, setCheckedWarmupDrills] = useState<Record<number, boolean>>({});
  const [checkedCooldownDrills, setCheckedCooldownDrills] = useState<Record<number, boolean>>({});
  const [selectedFullPhoto, setSelectedFullPhoto] = useState<string | null>(null);
  const [sessionAudioUrl, setSessionAudioUrl] = useState<string | undefined>(undefined);
  const [sessionNote, setSessionNote] = useState<string | undefined>(undefined);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleUpdateExerciseAudio = (audioDataUrl: string | undefined) => {
    if (!activeEx) return;
    setExercises((prev) => {
      const copy = [...prev];
      copy[currentExIndex] = {
        ...copy[currentExIndex],
        feedbackAudioUrl: audioDataUrl,
      };
      saveSessionDraft(currentUser.id, copy, currentExIndex, sessionDurationSec, targetDay?.id);
      return copy;
    });
  };

  const handleUpdateSessionAudio = (audioDataUrl: string | undefined) => {
    setSessionAudioUrl(audioDataUrl);
    const completed = appStore.getSessions(currentUser.id).find((s) => s.id.startsWith("session_"));
    if (completed) {
      completed.audioNoteUrl = audioDataUrl;
      appStore.saveSession(completed);
    }
  };

  const handleUpdateFeedbackNote = (note: string) => {
    if (!activeEx) return;
    setExercises((prev) => {
      const copy = [...prev];
      copy[currentExIndex] = {
        ...copy[currentExIndex],
        feedbackNote: note,
      };
      saveSessionDraft(currentUser.id, copy, currentExIndex, sessionDurationSec, targetDay?.id);
      return copy;
    });
  };

  const handleUpdateEquipmentPhoto = (photoDataUrl: string | undefined) => {
    if (!activeEx) return;
    setExercises((prev) => {
      const copy = [...prev];
      copy[currentExIndex] = {
        ...copy[currentExIndex],
        equipmentPhotoUrl: photoDataUrl,
      };
      saveSessionDraft(currentUser.id, copy, currentExIndex, sessionDurationSec, targetDay?.id);
      return copy;
    });
  };

  const handleCaptureEquipmentPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.7);
      // 1. Immediately save compressed local photo (100% offline-resilient & instant)
      handleUpdateEquipmentPhoto(compressed);

      // 2. If Cloud Storage feature flag is enabled, perform background upload
      if (isCloudStorageEnabled() && typeof navigator !== "undefined" && navigator.onLine) {
        uploadEquipmentPhotoAction({
          dataUri: compressed,
          traineeId: currentUser.id,
          exerciseName: activeEx?.name || "exercise",
          sessionId: targetDay?.id,
        })
          .then((res) => {
            if (res.isCloud && res.url) {
              handleUpdateEquipmentPhoto(res.url);
            }
          })
          .catch((err) => {
            console.warn("Background cloud upload skipped, kept local photo:", err);
          });
      }

      telemetry.track("equipment_photo_captured", {
        exercise_name: activeEx?.name,
        cloud_storage_enabled: isCloudStorageEnabled(),
      }, currentUser.id);
    } catch (err) {
      console.warn("Failed to capture equipment photo:", err);
    }
  };

  const handleRemoveEquipmentPhoto = () => {
    handleUpdateEquipmentPhoto(undefined);
  };

  const [restTimerSec, setRestTimerSec] = useState<number | null>(null);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => soundService.getIsMuted());
  const [sessionStartTime, setSessionStartTime] = useState(() => new Date().toISOString());
  const [lastSetLoggedAt, setLastSetLoggedAt] = useState<number>(() => Date.now());

  // Helper to persist draft with exact epoch timestamps
  const persistDraft = (
    list: ActiveExercise[],
    exIdx: number = currentExIndex,
    phaseOverride?: "preview" | "warmup" | "active" | "cooldown" | "summary"
  ) => {
    saveSessionDraft({
      traineeId: currentUser.id,
      programDayId: targetDay?.id,
      dayLabel: targetDay?.label,
      exercises: list,
      currentExIndex: exIdx,
      currentExerciseIndex: exIdx,
      sessionDurationSec,
      durationSec: sessionDurationSec,
      startedAt: sessionStartTime,
      updatedAt: new Date().toISOString(),
      sessionStartEpochMs: sessionStartEpochRef.current || undefined,
      liftingStartEpochMs: liftingStartEpochRef.current || undefined,
      totalRestDurationSec,
      warmupDurationSec,
      cooldownDurationSec,
      warmupCompleted,
      cooldownCompleted,
      phase: phaseOverride || mode,
      gymId: selectedGym?.id,
      gymName: selectedGym?.name,
      gymAddress: selectedGym?.address,
    });
  };

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
            if (draft.gymId || draft.gymName) {
              setSelectedGym({
                id: draft.gymId || "gym_restored",
                name: draft.gymName || "Punch by Badr Hari Lissasfa",
                address: draft.gymAddress,
              });
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

  // True Wall-Clock Synchronization Engine (Immune to Mobile Background Sleep & Pocket Freezing)
  const syncClocks = React.useCallback(() => {
    const now = Date.now();
    if (sessionStartEpochRef.current) {
      setSessionDurationSec(Math.max(0, Math.round((now - sessionStartEpochRef.current) / 1000)));
    }
    if (mode === "warmup" && warmupStartEpochRef.current) {
      setWarmupDurationSec(Math.max(0, Math.round((now - warmupStartEpochRef.current) / 1000)));
    }
    if (mode === "active" && liftingStartEpochRef.current) {
      setLiftingDurationSec(Math.max(0, Math.round((now - liftingStartEpochRef.current) / 1000)));
    }
    if (mode === "cooldown" && cooldownStartEpochRef.current) {
      setCooldownDurationSec(Math.max(0, Math.round((now - cooldownStartEpochRef.current) / 1000)));
    }
    if (restTargetEpochRef.current) {
      const remaining = Math.max(0, Math.round((restTargetEpochRef.current - now) / 1000));
      setRestTimerSec(remaining);
      if (remaining <= 0) {
        if (restStartEpochRef.current) {
          const rested = Math.max(0, Math.round((now - restStartEpochRef.current) / 1000));
          setTotalRestDurationSec((prev) => prev + rested);
        }
        restTargetEpochRef.current = null;
        restStartEpochRef.current = null;
        setRestTimerSec(null);
        soundService.playRestChime();
      } else if (remaining <= 3 && remaining > 0) {
        soundService.playCountdownPip();
      }
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "preview" || mode === "summary") return;
    const interval = setInterval(syncClocks, 500);
    const handleSync = () => syncClocks();
    window.addEventListener("focus", handleSync);
    window.addEventListener("online", handleSync);
    document.addEventListener("visibilitychange", handleSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("online", handleSync);
      document.removeEventListener("visibilitychange", handleSync);
    };
  }, [mode, syncClocks]);

  const startRestCountdown = (seconds: number) => {
    const now = Date.now();
    if (restStartEpochRef.current && restTargetEpochRef.current) {
      const rested = Math.max(0, Math.round((now - restStartEpochRef.current) / 1000));
      setTotalRestDurationSec((prev) => prev + rested);
    }
    restStartEpochRef.current = now;
    restTargetEpochRef.current = now + seconds * 1000;
    setRestTimerSec(seconds);
  };

  const cancelOrSkipRest = () => {
    const now = Date.now();
    if (restStartEpochRef.current) {
      const rested = Math.max(0, Math.round((now - restStartEpochRef.current) / 1000));
      setTotalRestDurationSec((prev) => prev + rested);
    }
    restStartEpochRef.current = null;
    restTargetEpochRef.current = null;
    setRestTimerSec(null);
  };

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
  const [activeDailyAdaptation, setActiveDailyAdaptation] = useState<DailyWorkoutAdaptationResult | null>(null);

  const handleApplyDailyAdaptation = (result: DailyWorkoutAdaptationResult) => {
    if (!originalExercisesSnapshot) {
      setOriginalExercisesSnapshot(exercises);
    }
    setActiveDailyAdaptation(result);
    setExercises((prev) => {
      const baseList = originalExercisesSnapshot || prev;
      const nextList = baseList
        .map((ex) => {
          const adapted = result.adaptedExercises.find((a) => a.id === ex.id);
          if (!adapted) return ex;
          if (adapted.skippedForToday) {
            return { ...ex, skippedRemaining: true };
          }
          return {
            ...ex,
            name: adapted.name,
            equipment: adapted.equipment || ex.equipment,
            targetSets: adapted.targetSets,
            restSeconds: adapted.restSeconds,
            targetRir: adapted.targetRir,
            currentWeight: adapted.currentWeight,
            lastBestWeight: adapted.currentWeight,
            formCue: adapted.formCue || ex.formCue,
            loadGuidance: adapted.adaptationNotes.join(" · ") || ex.loadGuidance,
            skippedRemaining: false,
          };
        })
        .filter((ex) => !ex.skippedRemaining);
      return nextList.length > 0 ? nextList : baseList;
    });
    soundService.playTargetHitFeedback(false);
    getStorageAdapter()
      .appendEvent(currentUser.id, `trainee_${currentUser.id}`, "PROGRAM_EVOLVED", {
        propositionId: result.adaptationId,
        tier: "DAILY_EPHEMERAL_ADAPTATION",
        decision: "ACCEPTED",
        targetExerciseName: targetDay?.label || "Daily Session",
        sensoryRagSummary: result.coachHeadline,
        agentTurnCount: result.agentSteps.length,
      })
      .catch(() => {});
  };

  const handleRestoreOriginalDailySession = () => {
    if (originalExercisesSnapshot) {
      setExercises(originalExercisesSnapshot);
    }
    setActiveDailyAdaptation(null);
  };

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
  const [handledJitPropositions, setHandledJitPropositions] = useState<Record<string, boolean>>({});

  const activeJitProposition = React.useMemo<CoachProposition | null>(() => {
    if (!activeEx || handledJitPropositions[activeEx.id] || activeEx.completedSets.length > 0) {
      return null;
    }
    const historySessions = appStore.getSessions(currentUser.id);
    return evaluateJustInTimeProposition({
      traineeId: currentUser.id,
      exerciseName: activeEx.name,
      currentWeightKg: activeEx.currentWeight || activeEx.lastBestWeight || 20,
      targetSets: activeEx.targetSets,
      repLow: activeEx.repLow,
      repHigh: activeEx.repHigh,
      targetRir: activeEx.targetRir ?? 1,
      equipment: activeEx.equipment || "dumbbell",
      gymId: selectedGym?.id,
      gymName: selectedGym?.name,
      sessions: historySessions,
      sleepHours,
    });
  }, [activeEx, handledJitPropositions, currentUser.id, selectedGym?.id, selectedGym?.name, sleepHours]);

  const handleAcceptJitProposition = (prop: CoachProposition) => {
    if (!activeEx) return;
    setHandledJitPropositions((prev) => ({ ...prev, [activeEx.id]: true }));
    setExercises((prev) => {
      const copy = [...prev];
      const target = copy[currentExIndex];
      if (!target) return prev;
      copy[currentExIndex] = {
        ...target,
        name: prop.mutation.newExerciseName || target.name,
        equipment: prop.mutation.newEquipment || target.equipment,
        targetSets: prop.mutation.newTargetSets ?? target.targetSets,
        repLow: prop.mutation.newRepLow ?? target.repLow,
        repHigh: prop.mutation.newRepHigh ?? target.repHigh,
        targetRir: prop.mutation.newTargetRir ?? target.targetRir,
        currentWeight: prop.mutation.newTargetWeightKg ?? target.currentWeight,
        lastBestWeight: prop.mutation.newTargetWeightKg ?? target.lastBestWeight,
        formCue: prop.mutation.newFormCue || target.formCue,
        loadGuidance: prop.mutation.newLoadGuidance || prop.proposedFix,
      };
      saveSessionDraft(currentUser.id, copy, currentExIndex, sessionDurationSec, targetDay?.id);
      return copy;
    });
    soundService.playTargetHitFeedback(false);
    getStorageAdapter()
      .appendEvent(currentUser.id, `trainee_${currentUser.id}`, "PROGRAM_EVOLVED", {
        propositionId: prop.id,
        tier: prop.tier,
        decision: "ACCEPTED",
        targetExerciseName: prop.exerciseName,
        evolvedExerciseName: prop.mutation.newExerciseName || prop.exerciseName,
        evolvedSets: prop.mutation.newTargetSets,
        evolvedWeightKg: prop.mutation.newTargetWeightKg,
        sensoryRagSummary: prop.sensoryRagContext,
        agentTurnCount: prop.agentTrace?.iterationsExecuted || 0,
      })
      .catch(() => {});
  };

  const handleDismissJitProposition = (prop: CoachProposition) => {
    if (!activeEx) return;
    setHandledJitPropositions((prev) => ({ ...prev, [activeEx.id]: true }));
    getStorageAdapter()
      .appendEvent(currentUser.id, `trainee_${currentUser.id}`, "PROGRAM_EVOLVED", {
        propositionId: prop.id,
        tier: prop.tier,
        decision: "DISMISSED",
        targetExerciseName: prop.exerciseName,
        agentTurnCount: prop.agentTrace?.iterationsExecuted || 0,
      })
      .catch(() => {});
  };
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
  const isStraightMode = activeEx?.supersetMode === "straight";
  const partnerExercise = exercises.find((e, idx) =>
    idx !== currentExIndex &&
    (
      (activeEx?.subMovementOrder && e.subMovementOrder && activeEx.subMovementOrder.slice(0, -1) === e.subMovementOrder.slice(0, -1)) ||
      (activeEx?.supersetTag && e.supersetTag === activeEx.supersetTag && Math.abs(idx - currentExIndex) === 1)
    )
  );

  const handleToggleSupersetMode = () => {
    if (!activeEx) return;
    const currentMode = activeEx.supersetMode === "straight" ? "straight" : "superset";
    const nextMode: "straight" | "superset" = currentMode === "straight" ? "superset" : "straight";

    setExercises((prev) => {
      const copy = prev.map((ex) => {
        const isInSameGroup =
          (activeEx.supersetTag && ex.supersetTag === activeEx.supersetTag) ||
          (activeEx.subMovementOrder && ex.subMovementOrder && activeEx.subMovementOrder.slice(0, -1) === ex.subMovementOrder.slice(0, -1));
        if (isInSameGroup) {
          return { ...ex, supersetMode: nextMode };
        }
        return ex;
      });

      saveSessionDraft(currentUser.id, copy, currentExIndex, sessionDurationSec, targetDay?.id);
      return copy;
    });
  };

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

    // Zero-Cognition Gym Feedback: Haptic pulse & athletic registration sound
    soundService.playTargetHitFeedback(isPR);

    // Flight Recorder: Append immutable SET_LOGGED event
    try {
      getStorageAdapter().appendEvent(
        currentUser.id,
        targetDay?.id ? `session_${targetDay.id}` : "active_session",
        "SET_LOGGED",
        {
          sessionId: targetDay?.id || "active_session",
          exerciseName: activeEx.name,
          setIndex: newCompleted.length,
          weightKg: activeEx.currentWeight,
          reps: activeEx.currentReps,
          isPR,
          selectedEquipment: activeEx.equipment,
        }
      ).catch(() => {});
    } catch {}

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
    } else if (activeEx.supersetMode === "straight") {
      // Straight Sets Mode (Machine occupied / uncoupled superset):
      if (newCompletedLength < activeEx.targetSets) {
        startRestCountdown(activeEx.restSeconds || 60);
      } else {
        setRestTimerSec(activeEx.restSeconds || 60);
        setTimeout(() => {
          setCurrentExIndex((prev) => Math.min(exercises.length - 1, prev + 1));
        }, 300);
      }
    } else if (isSupersetA) {
      setRestTimerSec(null);
      const nextBIndex = exercises.findIndex(
        (e, idx) => idx > currentExIndex && (
          e.subMovementOrder === `${supersetPrefix}B` ||
          (e.supersetTag === activeEx.supersetTag && idx === currentExIndex + 1)
        )
      );
      if (nextBIndex !== -1) {
        setTimeout(() => {
          setCurrentExIndex(nextBIndex);
        }, 150);
      }
    } else if (isSupersetB) {
      setRestTimerSec(activeEx.restSeconds || 60);
      const partnerAIndex = exercises.findIndex(
        (e) => (
          e.subMovementOrder === `${supersetPrefix}A` ||
          (e.supersetTag === activeEx.supersetTag && e !== activeEx)
        )
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
      startRestCountdown(activeEx.restSeconds || 90);
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

  // Transition to Post-Workout Cooldown & Stretch Phase
  const handleTransitionToCooldown = () => {
    cancelOrSkipRest();
    const now = Date.now();
    if (liftingStartEpochRef.current) {
      setLiftingDurationSec(Math.max(1, Math.round((now - liftingStartEpochRef.current) / 1000)));
    }
    cooldownStartEpochRef.current = now;
    persistDraft(exercises, currentExIndex, "cooldown");
    setMode("cooldown");
  };

  // Finish session with full 3-metric wall-clock calculation
  const handleFinishSession = async (
    snapshot?: ActiveExercise[],
    overrideWarmup?: { completed: boolean; durationSec: number },
    overrideCooldown?: { completed: boolean; durationSec: number }
  ) => {
    cancelOrSkipRest();
    const now = Date.now();
    const finalSessionTotalSec = sessionStartEpochRef.current
      ? Math.max(1, Math.round((now - sessionStartEpochRef.current) / 1000))
      : sessionDurationSec;
    const finalLiftingSec = liftingStartEpochRef.current
      ? Math.max(1, Math.round((now - liftingStartEpochRef.current) / 1000))
      : liftingDurationSec;

    const wCompleted = overrideWarmup ? overrideWarmup.completed : (warmupCompleted ?? false);
    const wDuration = overrideWarmup ? overrideWarmup.durationSec : warmupDurationSec;
    const cCompleted = overrideCooldown ? overrideCooldown.completed : (cooldownCompleted ?? false);
    const cDuration = overrideCooldown ? overrideCooldown.durationSec : cooldownDurationSec;

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
        note: ex.feedbackNote,
        photoUrl: ex.equipmentPhotoUrl,
        audioNoteUrl: ex.feedbackAudioUrl,
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
      durationSec: finalSessionTotalSec,
      liftingDurationSec: finalLiftingSec,
      totalRestDurationSec,
      warmupDurationSec: wDuration,
      cooldownDurationSec: cDuration,
      warmupCompleted: wCompleted,
      cooldownCompleted: cCompleted,
      audioNoteUrl: sessionAudioUrl,
      sessionNote: sessionNote,
      gymId: selectedGym?.id,
      gymName: selectedGym?.name || "Punch by Badr Hari Lissasfa",
      gymAddress: selectedGym?.address,
      setLogs: allSetLogs,
      exerciseFeedbacks: listToSave
        .filter((ex) => (ex.feedbackTags && ex.feedbackTags.length > 0) || !!ex.feedbackTag || !!ex.feedbackNote || !!ex.equipmentPhotoUrl || !!ex.feedbackAudioUrl)
        .map((ex) => ({
          exerciseName: ex.name,
          tag: ex.feedbackTag,
          tags: ex.feedbackTags || (ex.feedbackTag ? [ex.feedbackTag] : []),
          note: ex.feedbackNote,
          photoUrl: ex.equipmentPhotoUrl,
          audioNoteUrl: ex.feedbackAudioUrl,
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
    sensoryMemoryStore.ingestFromSessionHistory([completedSession]);
    setMode("summary");
  };

  // --------------------------------------------------------------------------
  // STATE 1: SESSION PREVIEW (Between Today and Active Workout)
  // --------------------------------------------------------------------------
  if (mode === "preview") {
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
            <h1 className="text-xl font-editorial font-bold text-white">Choose today&apos;s session</h1>
            <p className="text-xs text-slate-400">
              No workout is scheduled for today. Select a session from your active blueprint below.
            </p>
            <div className="space-y-2 pt-2">
              {currentWeek?.days.filter((d) => !d.isRestDay).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => router.push(`/session?day=${d.id}&mode=preview`)}
                  className="w-full p-3.5 bg-[#090C11] border border-[#1C2436] hover:border-amber-500/50 rounded-xl text-left transition flex items-center justify-between cursor-pointer"
                >
                  <span className="text-xs font-bold text-white">{d.label}</span>
                  <span className="text-[10px] text-amber-400 font-mono">Select →</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
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
              {exercises.length} exercises · ~55 min · Target RIR 2
            </p>
          </div>
        )}

        {/* Salle de Sport / Training Location Selector */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#111622] border border-[#1C2436] text-xs shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Location</span>
                {selectedGym?.isDefault && (
                  <span className="text-[9px] font-mono text-amber-300 font-semibold">★ Default</span>
                )}
              </div>
              <p className="font-semibold text-white text-xs truncate">
                {selectedGym?.name || "Punch by Badr Hari Lissasfa"}
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

        {/* Readiness Input & Autoregulation Section */}
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
                onClick={() => {
                  setSleepHours(option.hours);
                  setIsRecalibrationApplied(false);
                  setIsRecalibrationDismissed(false);
                }}
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
              onAccept={handleAcceptRecalibration}
              onDismiss={handleDismissRecalibration}
              isApplied={isRecalibrationApplied}
              wearableSnapshot={latestSnapshot}
            />
          )}
        </section>

        {/* Real-Time AI Personal Trainer Daily Session Adaptation & Gym Equipment Recognition */}
        <DailyAiCoachAdapterCard
          traineeId={currentUser.id}
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
          onApplyDailyAdaptation={handleApplyDailyAdaptation}
          onRestoreOriginalSession={handleRestoreOriginalDailySession}
          activeAdaptation={activeDailyAdaptation}
        />

        {/* Clean Exercise List (with 1-tap video & interactive preview) */}
        <div className="bg-[#111622] border border-[#1C2436] rounded-2xl p-4 divide-y divide-[#1C2436]">
          <div className="pb-2.5 flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
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
              className="py-3 first:pt-2 last:pb-0 flex items-center justify-between text-xs cursor-pointer hover:bg-[#182030]/60 rounded-xl px-2 -mx-2 transition"
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
                    <span className="text-amber-400 font-semibold tabular-nums">{ex.currentWeight}kg</span>
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
                  className="p-1 rounded bg-[#090C11] hover:bg-[#182030] border border-[#1C2436] disabled:opacity-20 text-slate-300 transition"
                  title="Move up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === exercises.length - 1}
                  onClick={() => moveExerciseDown(idx)}
                  className="p-1 rounded bg-[#090C11] hover:bg-[#182030] border border-[#1C2436] disabled:opacity-20 text-slate-300 transition"
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
            className="text-amber-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
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
            "w-full py-4 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 font-display uppercase tracking-wider text-base font-black active:scale-[0.98]",
            !targetDay || exercises.length === 0
              ? "bg-[#182030] text-slate-500 cursor-not-allowed border border-[#1C2436]"
              : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20 cursor-pointer"
          )}
        >
          <span>Begin Workout →</span>
        </button>

        {/* Different Day Picker Sheet */}
        <Sheet open={isDayPickerOpen} onOpenChange={setIsDayPickerOpen}>
          <SheetContent side="bottom" className="max-w-md mx-auto rounded-t-3xl bg-[#090C11] border-[#1C2436] p-6 space-y-4 font-body shadow-2xl text-slate-100">
            <SheetHeader className="text-left space-y-1">
              <SheetTitle className="text-xl font-editorial font-bold text-white tracking-tight">Choose a Different Session</SheetTitle>
              <SheetDescription className="text-xs text-slate-400 font-body">
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
                    "w-full p-3.5 rounded-xl text-left transition flex items-center justify-between border cursor-pointer font-body",
                    d.id === targetDay?.id
                      ? "bg-[#182030] border-amber-500/50 text-amber-300 font-semibold shadow-sm"
                      : "bg-[#111622] border-[#1C2436] hover:border-slate-700 text-white"
                  )}
                >
                  <span className="text-xs font-semibold">{d.label}</span>
                  {d.id === targetDay?.id && (
                    <span className="text-[10px] font-mono text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">Current</span>
                  )}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        {/* Exercise Form & Video Preview Bottom Sheet */}
        <Sheet open={!!previewDetailEx} onOpenChange={(open) => !open && setPreviewDetailEx(null)}>
          <SheetContent side="bottom" className="max-w-md mx-auto max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#090C11] border-[#1C2436] p-6 space-y-4 font-body shadow-2xl text-slate-100">
            {previewDetailEx && (
              <>
                <SheetHeader className="text-left space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {previewDetailEx.subMovementOrder ? `SLOT ${previewDetailEx.subMovementOrder}` : "EXERCISE PREVIEW"}
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
                    {previewDetailEx.targetSets} sets × {previewDetailEx.repLow}-{previewDetailEx.repHigh} reps · Target RIR {previewDetailEx.targetRir} · {previewDetailEx.restSeconds}s rest
                  </SheetDescription>
                </SheetHeader>

                {/* 1-Tap Video Demo Button */}
                {previewDetailEx.videoUrl ? (
                  <a
                    href={previewDetailEx.videoUrl}
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

                {/* Kinetic Form Cue */}
                {previewDetailEx.formCue && (
                  <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Form Cue & Kinetic Anchor</span>
                    </div>
                    <p className="text-xs text-slate-100 leading-relaxed font-medium">
                      {previewDetailEx.formCue}
                    </p>
                  </div>
                )}

                {/* Coach Progression Guidance */}
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

                {/* Setup Checklist if available from Confidence Guide */}
                {previewDetailEx.confidenceGuide?.hardware?.setupSteps && previewDetailEx.confidenceGuide.hardware.setupSteps.length > 0 && (
                  <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-xl space-y-2">
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
                  <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      <span>Available Equipment Variations</span>
                      <span className="text-slate-400 font-normal">Swap if station occupied</span>
                    </div>
                    <div className="space-y-1.5">
                      {previewDetailEx.equipmentVariations.map((v, i) => (
                        <div key={i} className="p-2.5 bg-[#090C11] border border-[#1C2436] rounded-lg flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-mono text-amber-400 font-semibold mr-2">{v.equipmentType}</span>
                            <span className="text-slate-200 font-medium">{v.exerciseName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setExercises((prev) => {
                                  const copy = [...prev];
                                  const targetIdx = previewDetailEx ? copy.findIndex(e => e.id === previewDetailEx.id) : currentExIndex;
                                  if (targetIdx !== -1) {
                                    copy[targetIdx] = {
                                      ...copy[targetIdx],
                                      name: v.exerciseName,
                                      formCue: v.formCue,
                                      videoUrl: v.videoUrl,
                                      equipment: v.equipmentType,
                                    };
                                  }
                                  return copy;
                                });
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

        {/* Gym Selector Drawer (Preview Mode) */}
        <GymSelectorDrawer
          isOpen={isGymDrawerOpen}
          onOpenChange={setIsGymDrawerOpen}
          selectedGymId={selectedGym?.id}
          onSelectGym={(gym) => {
            setSelectedGym(gym);
            persistDraft(exercises, currentExIndex);
          }}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STATE: PRE-WORKOUT WARMUP & MOVEMENT PREP (Skippable With 1 Tap)
  // --------------------------------------------------------------------------
  if (mode === "warmup") {
    const rawRoutines = targetDay?.morningRoutine || [
      "Doorway Pull-Up Bar 30s Hollow-Body Scapular Hang (5 reps x 2s depression pause): Feet slightly forward, squeeze glutes, ribs down, pull shoulder blades down without bending elbows.",
      "Supine Windshield Wipers (60s): Lie on back, knees bent, feet wide; gently rock knees 5x left and 5x right with shoulders pinned flat to unwind overnight lumbar torsion.",
      "Standing Glute-Squeeze Hip Extension + Y-Reach (60s): Step back, squeeze both glutes hard for 5s (stretch front hip capsule), reach arms back into a Y with thumbs pointing behind.",
      "Incline Bench Push-Up Plus (60s): Hands elevated, push torso away at top for 2s to move shoulder blades through full protraction.",
    ];

    const warmupDrills = rawRoutines.map((drillStr, idx) => {
      const parts = drillStr.split(":");
      const title = parts[0]?.trim() || `Warmup Drill #${idx + 1}`;
      const desc = parts.slice(1).join(":").trim() || "Prime movement mechanics and joint capsule stability.";
      return { id: idx, title, desc };
    });

    const handleCompleteWarmup = () => {
      const now = Date.now();
      const duration = warmupStartEpochRef.current
        ? Math.max(1, Math.round((now - warmupStartEpochRef.current) / 1000))
        : warmupDurationSec;
      setWarmupDurationSec(duration);
      setWarmupCompleted(true);
      liftingStartEpochRef.current = now;
      setCurrentExIndex(0);
      persistDraft(exercises, 0, "active");
      setMode("active");
    };

    const handleSkipWarmup = () => {
      const now = Date.now();
      setWarmupDurationSec(0);
      setWarmupCompleted(false);
      liftingStartEpochRef.current = now;
      persistDraft(exercises, 0, "active");
      setMode("active");
    };

    return (
      <div className="flex-1 pb-12 px-4 pt-6 max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-200">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMode("preview")}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Session Preview</span>
          </button>
          <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-slate-900 border border-cyan-800/40">
            PHASE 1 / 3: WARMUP
          </span>
        </header>

        {/* Stopwatch & Header Card */}
        <div className="p-5 bg-[#111622] border border-[#1C2436] rounded-2xl text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-[10px] font-mono text-cyan-400">
            <Clock className="w-3 h-3" />
            <span>ELAPSED WARMUP TIME</span>
          </div>
          <div className="text-4xl font-display font-black text-white tracking-wider tabular-nums">
            {formatDuration(warmupDurationSec)}
          </div>
          <p className="text-xs text-slate-400 leading-snug">
            Counts directly toward total gym session time. Mobilizes pelvis, thoracic spine, and shoulder girdle.
          </p>
        </div>

        {/* Dynamic Drill Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 font-mono">
              Movement Alignment Drills ({Object.values(checkedWarmupDrills).filter(Boolean).length}/{warmupDrills.length} done)
            </span>
            <span className="text-[10px] font-mono text-amber-400">
              5–7 mins recommended
            </span>
          </div>

          <div className="space-y-2.5">
            {warmupDrills.map((drill) => {
              const isChecked = Boolean(checkedWarmupDrills[drill.id]);
              return (
                <div
                  key={drill.id}
                  onClick={() =>
                    setCheckedWarmupDrills((prev) => ({
                      ...prev,
                      [drill.id]: !prev[drill.id],
                    }))
                  }
                  className={clsx(
                    "p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none",
                    isChecked
                      ? "bg-[#090C11] border-amber-500/40 text-slate-400"
                      : "bg-[#111622] border-[#1C2436] hover:border-slate-700 text-white"
                  )}
                >
                  <div
                    className={clsx(
                      "w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                      isChecked
                        ? "bg-amber-400 border-amber-300 text-slate-950"
                        : "border-[#1C2436] bg-[#090C11] text-transparent"
                    )}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div
                      className={clsx(
                        "text-xs font-bold leading-tight",
                        isChecked && "line-through text-slate-500"
                      )}
                    >
                      {drill.title}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {drill.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dual Primary / Skip Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleCompleteWarmup}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider text-sm font-black rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Done with Warmup → Start Lifting</span>
          </button>

          <button
            type="button"
            onClick={handleSkipWarmup}
            className="w-full py-3 bg-[#111622] hover:bg-[#182030] active:scale-[0.98] border border-[#1C2436] text-slate-400 hover:text-white font-editorial font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5 text-slate-500" />
            <span>Skip Warmup (Straight to Exercises)</span>
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STATE: POST-WORKOUT COOLDOWN & DECOMPRESSION (Skippable With 1 Tap)
  // --------------------------------------------------------------------------
  if (mode === "cooldown") {
    const cooldownDrills = [
      {
        id: 0,
        title: "Doorway / Pull-Up Bar Passive Dead Hang (45s)",
        desc: "Passive hang; relax hips, feet forward, allow gravity to decompress lumbar spine and lengthen tight lats.",
      },
      {
        id: 1,
        title: "Half-Kneeling Couch Stretch / Psoas Opener (60s / side)",
        desc: "Squeeze back glute forward, tall spine. Releases tight hip flexor capsule shortened by 2.5h commute driving.",
      },
      {
        id: 2,
        title: "Doorway Pectoral & Biceps Release (45s / side)",
        desc: "Elbow braced at 90°, gently turn torso away with lower ribs down to reverse pressing shortening.",
      },
      {
        id: 3,
        title: "Diaphragmatic Parasympathetic Box Breathing (60s)",
        desc: "4s inhale through nose, 4s hold, 8s slow exhale through pursed lips. Downregulates central nervous system.",
      },
    ];

    const handleCompleteCooldown = () => {
      const now = Date.now();
      const duration = cooldownStartEpochRef.current
        ? Math.max(1, Math.round((now - cooldownStartEpochRef.current) / 1000))
        : cooldownDurationSec;
      handleFinishSession(exercises, undefined, { completed: true, durationSec: duration });
    };

    const handleSkipCooldown = () => {
      handleFinishSession(exercises, undefined, { completed: false, durationSec: 0 });
    };

    return (
      <div className="flex-1 pb-12 px-4 pt-6 max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-200">
        <header className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Lifting Finished</span>
          </span>
          <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-slate-900 border border-cyan-800/40">
            PHASE 3 / 3: COOLDOWN
          </span>
        </header>

        {/* Stopwatch & Header Card */}
        <div className="p-5 bg-[#111622] border border-[#1C2436] rounded-2xl text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-[10px] font-mono text-cyan-400">
            <Clock className="w-3 h-3" />
            <span>ELAPSED COOLDOWN TIME</span>
          </div>
          <div className="text-4xl font-display font-black text-white tracking-wider tabular-nums">
            {formatDuration(cooldownDurationSec)}
          </div>
          <p className="text-xs text-slate-400 leading-snug">
            Decompress vertebrae discs, stretch shortened hip flexors, and switch on parasympathetic recovery.
          </p>
        </div>

        {/* Dynamic Drill Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 font-mono">
              Post-Workout Stretches ({Object.values(checkedCooldownDrills).filter(Boolean).length}/{cooldownDrills.length} done)
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              3–5 mins
            </span>
          </div>

          <div className="space-y-2.5">
            {cooldownDrills.map((drill) => {
              const isChecked = Boolean(checkedCooldownDrills[drill.id]);
              return (
                <div
                  key={drill.id}
                  onClick={() =>
                    setCheckedCooldownDrills((prev) => ({
                      ...prev,
                      [drill.id]: !prev[drill.id],
                    }))
                  }
                  className={clsx(
                    "p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none",
                    isChecked
                      ? "bg-[#090C11] border-cyan-500/40 text-slate-400"
                      : "bg-[#111622] border-[#1C2436] hover:border-slate-700 text-white"
                  )}
                >
                  <div
                    className={clsx(
                      "w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                      isChecked
                        ? "bg-cyan-500 border-cyan-400 text-slate-950"
                        : "border-[#1C2436] bg-[#090C11] text-transparent"
                    )}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div
                      className={clsx(
                        "text-xs font-bold leading-tight",
                        isChecked && "line-through text-slate-500"
                      )}
                    >
                      {drill.title}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {drill.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dual Primary / Skip Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleCompleteCooldown}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider text-sm font-black rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Finish & Save Workout ✓</span>
          </button>

          <button
            type="button"
            onClick={handleSkipCooldown}
            className="w-full py-3 bg-[#111622] hover:bg-[#182030] active:scale-[0.98] border border-[#1C2436] text-slate-400 hover:text-white font-editorial font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5 text-slate-500" />
            <span>Skip Cooldown → View Summary</span>
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STATE 3: SESSION SUMMARY (Celebration View)
  // --------------------------------------------------------------------------
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
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-2xl shadow-lg shadow-amber-500/10">
            🔥
          </div>
          <h1 className="text-2xl font-editorial font-bold text-white tracking-tight">
            {targetDay?.label || "Session"} Complete
          </h1>
          <p className="text-xs text-slate-400 font-body">
            Outstanding execution. Progressive overload targets achieved.
          </p>
        </div>

        {/* Max 3 Numbers Metric Matrix */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl text-center">
            <div className="text-2xl font-display font-black text-white tabular-nums">
              {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
            </div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">Vol (kg)</div>
          </div>

          <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl text-center">
            <div className="text-2xl font-display font-black text-white tabular-nums">{durationMin}m</div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">Duration</div>
          </div>

          <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl text-center">
            <div className="text-2xl font-display font-black text-amber-400 tabular-nums">
              {prCount > 0 ? `+${prCount} PR` : "Solid"}
            </div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">Records</div>
          </div>
        </div>

        {/* Training Facility / Salle de Sport Card */}
        <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Salle de Sport
              </span>
              <p className="font-semibold text-white text-xs truncate">
                {selectedGym?.name || "Punch by Badr Hari Lissasfa"}
              </p>
              {selectedGym?.address && (
                <p className="text-[11px] text-slate-400 truncate">
                  {selectedGym.address}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsGymDrawerOpen(true)}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition active:scale-95 flex-shrink-0 cursor-pointer"
          >
            Change
          </button>
        </div>

        {/* Biomechanical Overload & Deload Prescriptions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Next Session Prescriptions
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-bold">
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
        <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed font-body">
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

        {/* Overall Post-Workout Voice Debrief (Optional) */}
        <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 font-editorial">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Post-Workout Voice Debrief (Optional)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Voice Memo</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Record a quick voice note about overall fatigue, pump, joint sensations, or football recovery.
          </p>
          <AudioNoteRecorder
            audioUrl={sessionAudioUrl}
            onSave={(url) => handleUpdateSessionAudio(url)}
            onDelete={() => handleUpdateSessionAudio(undefined)}
            label="Workout Voice Debrief"
            traineeId={currentUser.id}
            exerciseName="overall_workout_debrief"
            gymName={selectedGym?.name}
          />
        </div>

        {/* Done & Backup Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => router.push("/today")}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider text-base font-black rounded-2xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
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
            className="w-full py-2.5 bg-[#111622] hover:bg-[#182030] text-slate-400 hover:text-white border border-[#1C2436] text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Export Backup
          </button>
        </div>

        {/* Gym Selector Drawer (Summary Mode) */}
        <GymSelectorDrawer
          isOpen={isGymDrawerOpen}
          onOpenChange={setIsGymDrawerOpen}
          selectedGymId={selectedGym?.id}
          onSelectGym={(gym) => {
            setSelectedGym(gym);
            const sessions = appStore.getSessions(currentUser.id);
            if (sessions.length > 0) {
              appStore.updateSessionGym(sessions[0].id, {
                id: gym.id,
                name: gym.name,
                address: gym.address,
              });
            }
          }}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STATE 2: ACTIVE GYM FLOOR WORKOUT (1 Exercise at a Time, Full-Screen)
  // --------------------------------------------------------------------------
  const currentSetNum = activeEx.completedSets.length + 1;

  return (
    <div className="min-h-screen bg-[#090C11] flex flex-col justify-between p-4 max-w-md mx-auto w-full select-none font-body">
      
      {/* 1. Header: Exit Action + Exercise Index + Add Exercise + Timer */}
      <div className="space-y-3 pb-3 border-b border-[#1C2436]">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsExitAlertOpen(true)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer font-editorial font-bold"
          >
            <X className="w-4 h-4" />
            <span>Exit</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGymDrawerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#111622] hover:bg-[#182030] border border-[#1C2436] hover:border-amber-500/40 rounded-full text-[11px] font-medium text-slate-300 hover:text-amber-300 transition cursor-pointer max-w-[120px]"
              title="Change salle de sport"
            >
              <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="truncate">{selectedGym?.name || "Gym"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsReorderDrawerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#111622] hover:bg-[#182030] border border-[#1C2436] hover:border-amber-500/40 rounded-full text-xs font-mono font-bold text-slate-300 hover:text-white transition cursor-pointer"
              title="Reorder exercises or jump to available machine"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentExIndex + 1}/{exercises.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddExerciseSheetOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#111622] hover:bg-[#182030] border border-[#1C2436] rounded-full text-[11px] font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
              title="Log extra exercise on top of program"
            >
              <Plus className="w-3 h-3 stroke-[2.5]" />
              <span>Exercise</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 bg-[#111622] px-2.5 py-1 rounded-full border border-[#1C2436]">
            <Clock className="w-3.5 h-3.5" />
            <span className="tabular">
              {Math.floor(sessionDurationSec / 60)}:{(sessionDurationSec % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </header>

        {/* Live 3-Metric Gym Telemetry Strip */}
        <div className="grid grid-cols-3 gap-1.5 py-2 px-3 bg-[#111622] border border-[#1C2436] rounded-xl text-center">
          <div>
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">Total Gym</span>
            <span className="font-mono-tabular font-extrabold text-amber-400 text-sm">
              {Math.floor(sessionDurationSec / 60)}:{(sessionDurationSec % 60).toString().padStart(2, "0")}
            </span>
          </div>
          <div className="border-x border-[#1C2436]">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">Lifting</span>
            <span className="font-mono-tabular font-extrabold text-white text-sm">
              {Math.floor(liftingDurationSec / 60)}:{(liftingDurationSec % 60).toString().padStart(2, "0")}
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">Rest</span>
            <span className="font-mono-tabular font-extrabold text-sky-400 text-sm">
              {Math.floor(totalRestDurationSec / 60)}:{(totalRestDurationSec % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Gym Floor Card (1 Exercise at a Time) */}
      <main className="flex-1 flex flex-col justify-center py-4 space-y-6">
        
        {/* Station-Locked Superset Banner & Sub-Movement Indicator with Straight Sets Mode Switch */}
        {(activeEx.supersetTag || activeEx.subMovementOrder?.match(/[AB]$/)) && (
          <div className={clsx(
            "p-3 rounded-xl space-y-2 animate-in fade-in transition-colors",
            isStraightMode 
              ? "bg-slate-900/90 border border-slate-700/80" 
              : "bg-indigo-950/50 border border-indigo-700/60"
          )}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className={clsx(
                  "text-[10px] font-mono uppercase tracking-wider font-bold flex items-center gap-1.5",
                  isStraightMode ? "text-slate-300" : "text-indigo-400"
                )}>
                  <Sparkles className="w-3.5 h-3.5" />
                  {isStraightMode ? "Straight Sets Mode (One-by-One)" : "Station-Locked Superset"}
                </span>
                {activeEx.supersetTag && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Group {activeEx.supersetTag}
                  </span>
                )}
              </div>

              {/* Mode Toggle Pill */}
              <button
                type="button"
                onClick={handleToggleSupersetMode}
                className={clsx(
                  "text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95",
                  isStraightMode
                    ? "bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-300"
                    : "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300"
                )}
                title={isStraightMode ? "Switch back to alternating superset" : "Machine taken? Complete all sets of this exercise first"}
              >
                {isStraightMode ? (
                  <>
                    <Zap className="w-3 h-3 text-indigo-400" />
                    <span>⚡ Re-link Superset</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3 h-3 text-amber-400" />
                    <span>📋 Machine Busy? Straight Sets</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-slate-200">
              {isStraightMode ? (
                <span>
                  👉 <strong>Straight sets:</strong> Complete all {activeEx.targetSets} sets of <strong>{activeEx.name}</strong> with standard rest ({activeEx.restSeconds || 60}s) before moving to {partnerExercise ? <strong>{partnerExercise.name}</strong> : "the next station"}.
                </span>
              ) : isSupersetA ? (
                <span>
                  👉 <strong>{activeEx.subMovementOrder || "Movement A"}</strong>: {activeEx.name} · 0s rest → immediately transition to {partnerExercise ? <strong>{partnerExercise.name}</strong> : "partner exercise"}
                </span>
              ) : (
                <span>
                  👉 <strong>{activeEx.subMovementOrder || "Movement B"}</strong>: {activeEx.name} · {activeEx.restSeconds || 60}s rest triggered after set before next superset round
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>
                {isStraightMode
                  ? `Set ${Math.min(activeEx.completedSets.length + 1, activeEx.targetSets)} of ${activeEx.targetSets}`
                  : `Round ${Math.min(activeEx.completedSets.length + 1, activeEx.targetSets)} of ${activeEx.targetSets}`}
              </span>
              <span className={isStraightMode ? "text-slate-400" : "text-indigo-300/80"}>
                {isStraightMode ? "No machine switching required" : "Alternate back-and-forth between stations"}
              </span>
            </div>
          </div>
        )}

        {/* Self-Evolving Program Just-In-Time (JIT) Coach Proposition Card */}
        {activeJitProposition && (
          <JitCoachPropositionCard
            proposition={activeJitProposition}
            onAccept={handleAcceptJitProposition}
            onDismiss={handleDismissJitProposition}
          />
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
                <h2 className="text-2xl sm:text-3xl font-black font-display uppercase text-white tracking-tight leading-tight">
                  {activeEx.name}
                </h2>
              </div>
              <p className="text-xs text-slate-300 font-mono-tabular mt-1">
                Target: <span className="font-bold text-amber-400">{activeEx.targetSets} sets × {activeEx.repLow}-{activeEx.repHigh} reps</span> {activeEx.targetWeightKg ? `· ${activeEx.targetWeightKg}kg ` : ""}· RIR {activeEx.targetRir}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  Overload Ceiling: {activeEx.repHigh} reps
                </span>
                {activeEx.warmupSets !== undefined && activeEx.warmupSets > 0 && activeEx.completedSets.length === 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                    Warm-up: {activeEx.warmupSets} sets
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Direct 1-Click Video Form Demonstration */}
              {activeEx.videoUrl && (
                <a
                  href={activeEx.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
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
                className="px-2.5 py-1.5 rounded-lg bg-[#111622] border border-[#1C2436] hover:border-[#2D3A54] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition cursor-pointer active:scale-95"
                aria-label="Swap occupied exercise equipment"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>Swap</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg bg-[#111622] border border-[#1C2436] hover:border-[#2D3A54] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition cursor-pointer active:scale-95"
                title="Snap equipment setup photo"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeEx.equipmentPhotoUrl ? "Photo ✓" : "Photo"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTipsOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-[#111622] border border-[#1C2436] hover:border-[#2D3A54] text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
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
                    "w-3.5 h-3.5 rounded-full transition-all",
                    isDone && "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)] scale-100",
                    isCurrent && "border-2 border-amber-400 bg-amber-500/20 animate-pulse scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
                    !isDone && !isCurrent && "bg-[#151B27] border border-[#1C2436]"
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
                    "px-2.5 py-1 rounded-lg text-[11px] font-mono-tabular border flex items-center gap-1.5 shadow-sm",
                    s.isDropSet
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold"
                      : "bg-[#111622] border-[#1C2436] text-slate-200"
                  )}
                >
                  <span className="text-slate-400 text-[10px] font-bold">
                    {s.isDropSet ? "🔥 Drop:" : `Set ${idx + 1}:`}
                  </span>
                  <span className="font-extrabold text-white">{s.weight} kg</span>
                  <span className="text-slate-400 font-medium">× {s.reps}</span>
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
            <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl space-y-3 shadow-sm font-body">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <span>How did this lift feel? (Select all that apply)</span>
                </span>
                {(activeEx.feedbackTags && activeEx.feedbackTags.length > 0) || activeEx.feedbackTag ? (
                  <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {(activeEx.feedbackTags?.length || (activeEx.feedbackTag ? 1 : 0))} selected ✓
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">Multi-select</span>
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
                        "py-2 px-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between gap-1.5 cursor-pointer font-body",
                        isSelected
                          ? tag.activeColor
                          : "bg-[#090C11] border-[#1C2436] text-slate-300 hover:text-white hover:bg-[#182030]"
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm">{tag.icon}</span>
                        <span className="font-semibold truncate">{tag.label}</span>
                      </div>
                      {isSelected && <span className="text-xs font-bold text-amber-400 flex-shrink-0">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Free-Form Notes Text Input (Optional) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold font-body">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Setup & Biofeedback Notes (Optional)</span>
                </div>
                <textarea
                  value={activeEx.feedbackNote || ""}
                  onChange={(e) => handleUpdateFeedbackNote(e.target.value)}
                  placeholder="e.g. Pin set to position 4, right elbow felt smooth, micro-plates used..."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-[#090C11] border border-[#1C2436] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition resize-none font-body"
                />
              </div>

              {/* Audio Voice Note Feedback (Optional) */}
              <div className="pt-1">
                <AudioNoteRecorder
                  audioUrl={activeEx.feedbackAudioUrl}
                  onSave={(url) => handleUpdateExerciseAudio(url)}
                  onDelete={() => handleUpdateExerciseAudio(undefined)}
                  label={`Voice Note: ${activeEx.name}`}
                  traineeId={currentUser.id}
                  exerciseName={activeEx.name}
                  gymName={selectedGym?.name}
                />
              </div>

              {/* Machine / Equipment Setup Photo & Native Gemini Share */}
              <div className="p-3.5 rounded-xl bg-[#090C11] border border-[#1C2436] space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5 font-body">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Equipment / Barbell Setup Photo</span>
                  </span>
                  {activeEx.equipmentPhotoUrl && (
                    <span className="text-[10px] font-mono text-amber-400 font-bold">Photo Attached ✓</span>
                  )}
                </div>

                {activeEx.equipmentPhotoUrl ? (
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedFullPhoto(activeEx.equipmentPhotoUrl!)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#182030] border border-[#1C2436] hover:border-amber-500/40 transition group cursor-pointer text-left active:scale-95"
                    >
                      <img
                        src={activeEx.equipmentPhotoUrl}
                        alt="Setup preview"
                        className="w-8 h-8 object-cover rounded-lg border border-[#1C2436] group-hover:scale-105 transition flex-shrink-0"
                      />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-amber-300">Inspect Photo</span>
                        <span className="text-[9px] text-slate-400">Tap to enlarge</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => shareEquipmentPhotoWithGemini({
                        photoUrl: activeEx.equipmentPhotoUrl!,
                        exerciseName: activeEx.name,
                        note: activeEx.feedbackNote,
                        traineeId: currentUser.id,
                        gymName: selectedGym?.name,
                      })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-900/80 to-cyan-900/80 border border-indigo-700/70 hover:border-indigo-500 text-white transition text-[11px] font-semibold cursor-pointer active:scale-95 shadow-sm"
                      title="Share with Google Gemini for biomechanical analysis"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>Share with Gemini</span>
                      <Share2 className="w-3 h-3 ml-0.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] text-slate-400 hover:text-white px-2 py-1.5 rounded hover:bg-[#182030] transition cursor-pointer"
                    >
                      Retake
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-3 rounded-xl border border-dashed border-[#1C2436] hover:border-amber-400/60 bg-[#111622] hover:bg-[#182030] transition flex items-center justify-center gap-2 text-xs text-slate-300 cursor-pointer active:scale-98"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Snap Machine / Seat Setting / Barbell Photo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Next Step: Primary CTA (Next Exercise or Finish Workout) */}
            {isAllExercisesComplete || isFinalExercise ? (
              <button
                type="button"
                onClick={() => handleFinishSession()}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider text-base font-black rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer animate-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>Finish Workout & View Results ✓</span>
                </div>
                <span className="text-[11px] font-sans font-medium text-slate-900/80 normal-case">
                  All prescribed sets complete · Tap to save & view summary
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentExIndex((prev) => Math.min(exercises.length - 1, prev + 1))}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider text-base font-black rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer animate-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-2">
                  <span>Next: {exercises[currentExIndex + 1]?.name} →</span>
                </div>
                <span className="text-[11px] font-sans font-medium text-slate-900/80 normal-case">
                  {activeEx.name} complete ({activeEx.completedSets.length}/{activeEx.targetSets} sets)
                </span>
              </button>
            )}

            {/* Station Busy? Jump to any remaining pending exercise */}
            {pendingOtherExercises.length > 0 && (
              <div className="p-3 bg-[#111622] border border-[#1C2436] rounded-2xl space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Machine busy? Jump to available station:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {pendingOtherExercises.map(({ ex, idx }) => (
                    <button
                      key={ex.id || idx}
                      type="button"
                      onClick={() => jumpToExercise(idx)}
                      className="py-1.5 px-2.5 rounded-xl bg-[#090C11] hover:bg-[#182030] border border-[#1C2436] hover:border-amber-500/50 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span className="text-amber-400 font-mono font-bold">#{idx + 1}</span>
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
                className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-semibold text-amber-300 transition flex items-center justify-center gap-1.5 cursor-pointer font-editorial"
                title="Log immediate drop set with reduced load"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Drop Set ({activeEx.currentWeight}kg × {activeEx.currentReps})</span>
              </button>
              <button
                type="button"
                onClick={handleAddBonusSet}
                className="py-2.5 px-3 bg-[#111622] hover:bg-[#182030] border border-[#1C2436] rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer font-editorial"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Bonus Set</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsAddExerciseSheetOpen(true)}
              className="w-full py-2 px-3 text-[11px] text-slate-400 hover:text-slate-200 bg-[#111622]/60 hover:bg-[#111622] border border-[#1C2436] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Add Extra Exercise on top of program</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Log.Confirm
              isHitTarget={
                activeEx.currentWeight === (activeEx.lastBestWeight || activeEx.currentWeight) &&
                activeEx.currentReps >= (activeEx.repLow || 8)
              }
              label={
                activeEx.currentWeight === (activeEx.lastBestWeight || activeEx.currentWeight) &&
                activeEx.currentReps >= (activeEx.repLow || 8)
                  ? `⚡ HIT TARGET (${activeEx.currentWeight}kg × ${activeEx.currentReps}) · Set ${Math.min(currentSetNum, activeEx.targetSets)}/${activeEx.targetSets} ✓`
                  : isStraightMode
                  ? `Done · Log Set ${Math.min(currentSetNum, activeEx.targetSets)} of ${activeEx.targetSets} (${activeEx.currentWeight}kg × ${activeEx.currentReps}) ✓`
                  : activeEx.subMovementOrder
                  ? `Done · Log ${activeEx.subMovementOrder} (${activeEx.currentWeight}kg × ${activeEx.currentReps}) ✓`
                  : `Log Set ${Math.min(currentSetNum, activeEx.targetSets)} (${activeEx.currentWeight}kg × ${activeEx.currentReps}) ✓`
              }
              subLabel={
                isStraightMode
                  ? isFinalSetOfExercise
                    ? "Final target set of this movement · Advances to next exercise"
                    : `${activeEx.restSeconds || 60}s rest timer auto-starts`
                  : isSupersetA
                  ? `0s Rest · Immediate transition to ${partnerExercise?.subMovementOrder || `${supersetPrefix}B`}`
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
          <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200 shadow-sm font-body">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Rest:</span>
              <span className="font-display font-black text-amber-400 text-base tabular-nums">{restTimerSec}s</span>
              <span className="text-[10px] font-mono text-amber-400/90 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 hidden sm:inline">
                Chime Active
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
                className="p-1 rounded-md text-slate-400 hover:text-white transition cursor-pointer"
              >
                {isSoundMuted ? (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setRestTimerSec(null)}
                className="text-[11px] font-mono font-semibold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Skip</span>
                <FastForward className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* 3. Bottom Exercise Switcher Controls */}
      <footer className="pt-3 border-t border-[#1C2436] flex items-center justify-between font-body">
        <button
          type="button"
          disabled={currentExIndex === 0}
          onClick={() => setCurrentExIndex((prev) => Math.max(0, prev - 1))}
          className="p-2 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 text-xs cursor-pointer font-display uppercase tracking-wider font-bold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        {isAllExercisesComplete || isFinalExercise ? (
          <button
            type="button"
            onClick={() => handleFinishSession()}
            className="py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-display uppercase tracking-wider font-black rounded-xl text-xs shadow-md hover:from-amber-400 hover:to-amber-300 transition cursor-pointer"
          >
            Finish Workout →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsReorderDrawerOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#111622] hover:bg-[#182030] border border-[#1C2436] text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            title="Jump station or change order"
          >
            <ArrowUpDown className="w-3 h-3 text-amber-400" />
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
        <SheetContent side="bottom" className="max-w-md mx-auto rounded-t-3xl bg-[#090C11] border-[#1C2436] p-6 space-y-4 font-body shadow-2xl text-slate-100">
          <SheetHeader className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>FORM & CUES</span>
              </span>
            </div>
            <SheetTitle className="text-xl font-editorial font-bold text-white tracking-tight pt-1">
              {activeEx.name}
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400 font-body">
              Setup guide and biomechanical progression cues.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 pt-1 pb-4 text-xs">
            {/* Direct Video Demonstration Link */}
            {activeEx.videoUrl && (
              <a
                href={activeEx.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-display uppercase tracking-wider font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <Video className="w-4 h-4 stroke-[2.5]" />
                <span>Watch Form Demonstration Video</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            )}

            {/* Quick In-Gym Form & Strategy Cues (Zero walls of text) */}
            {activeEx.formCue && (
              <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-xl space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Form Cue & Anchor</span>
                <p className="text-xs text-white font-medium leading-relaxed">{activeEx.formCue}</p>
              </div>
            )}

            {activeEx.loadGuidance && (
              <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-xl space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-sky-400 font-bold">Overload Strategy</span>
                <p className="text-xs text-slate-300 leading-relaxed">{activeEx.loadGuidance}</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* EXIT CONFIRMATION MODAL */}
      <Sheet open={isExitAlertOpen} onOpenChange={setIsExitAlertOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto text-center space-y-4 rounded-t-3xl bg-[#090C11] border-[#1C2436] p-6 font-body text-slate-100 shadow-2xl">
          <SheetHeader>
            <SheetTitle className="text-xl font-editorial font-bold text-white tracking-tight">Exit Active Workout?</SheetTitle>
            <SheetDescription className="text-xs text-slate-400 font-body">
              Your logged sets will be safely preserved in today's training log.
            </SheetDescription>
          </SheetHeader>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsExitAlertOpen(false)}
              className="flex-1 py-3.5 bg-[#111622] hover:bg-[#182030] text-slate-300 font-display uppercase tracking-wider font-bold text-xs rounded-xl border border-[#1C2436] transition cursor-pointer"
            >
              Keep Training
            </button>
            <button
              type="button"
              onClick={() => {
                setIsExitAlertOpen(false);
                router.push("/today");
              }}
              className="flex-1 py-3.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-display uppercase tracking-wider font-bold text-xs rounded-xl border border-rose-500/40 transition cursor-pointer"
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
              const newVideoUrl = candidate.videoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(candidate.name.replace(/°/g, '') + ' proper form')}`;
              return {
                ...ex,
                name: candidate.name,
                formCue: candidate.instructions?.[0] || ex.formCue,
                equipment: candidate.equipment,
                target: candidate.target,
                videoUrl: newVideoUrl,
                currentWeight: candidate.equipment.toLowerCase().includes("body") ? 0 : ex.currentWeight,
              };
            })
          );
          setIsSwapDrawerOpen(false);
        }}
      />

      {/* WORKOUT COMPLETE: "DONE OR WANT TO LOG MORE?" MODAL */}
      <Sheet open={isWorkoutCompleteModalOpen} onOpenChange={setIsWorkoutCompleteModalOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto text-center space-y-5 pb-6 rounded-t-3xl bg-[#090C11] border-[#1C2436] p-6 font-body text-slate-100 shadow-2xl">
          <SheetHeader className="space-y-2">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-2xl shadow-lg shadow-amber-500/10 animate-in zoom-in-50 duration-300">
              🔥
            </div>
            <SheetTitle className="text-2xl font-editorial font-bold text-white tracking-tight">
              Workout Prescribed Target Crushed!
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed font-body">
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
              className="w-full py-4 px-5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
              className="w-full py-3.5 px-4 bg-[#111622] hover:bg-[#182030] active:scale-[0.98] text-white font-display uppercase tracking-wider font-bold text-xs rounded-xl border border-[#1C2436] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ Log Extra Exercise (On Top of Program)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsWorkoutCompleteModalOpen(false);
                handleAddBonusSet();
              }}
              className="w-full py-2.5 px-4 text-xs font-mono text-slate-400 hover:text-amber-400 transition cursor-pointer"
            >
              + Add 1 More Bonus Set to {activeEx?.name || "Exercise"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ADD EXTRA EXERCISE DRAWER */}
      <Sheet open={isAddExerciseSheetOpen} onOpenChange={setIsAddExerciseSheetOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto max-h-[85vh] flex flex-col p-5 rounded-t-3xl bg-[#090C11] border-[#1C2436] font-body text-slate-100 shadow-2xl">
          <SheetHeader className="pb-3 text-left">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-editorial font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Extra Exercise</span>
              </SheetTitle>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                Logged on top of program
              </span>
            </div>
            <SheetDescription className="text-xs text-slate-400 font-body">
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
              className="w-full pl-9 pr-3 py-2.5 bg-[#111622] border border-[#1C2436] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition font-body"
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
                  "px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer font-body",
                  selectedMuscleFilter === cat
                    ? "bg-amber-400 text-slate-950 font-display font-black uppercase tracking-wider text-xs shadow-sm"
                    : "bg-[#111622] text-slate-400 hover:text-white border border-[#1C2436] text-xs font-medium"
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
                className="w-full p-3.5 bg-[#111622] hover:bg-[#182030] border border-[#1C2436] hover:border-slate-700 rounded-xl text-left flex items-center justify-between transition cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-amber-400 transition font-body">
                    {ex.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                    <span className="text-amber-400 font-medium">{ex.primaryMuscle}</span>
                    <span>•</span>
                    <span className="capitalize">{ex.equipment}</span>
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-[#182030] group-hover:bg-amber-400 group-hover:text-slate-950 text-slate-400 border border-[#1C2436] transition">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Hidden File Input for Machine / Equipment Photo Capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCaptureEquipmentPhoto}
        className="hidden"
      />

      {/* Full Size Photo Preview Modal with Gemini Sharing */}
      {selectedFullPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedFullPhoto(null)}
        >
          <div className="relative max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-3 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>{activeEx.name} — Setup</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedFullPhoto(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <img src={selectedFullPhoto} alt="Machine setup full" className="w-full h-auto max-h-[60vh] object-contain rounded-xl border border-slate-800" />

            <button
              type="button"
              onClick={async () => {
                await shareEquipmentPhotoWithGemini({
                  photoUrl: selectedFullPhoto,
                  exerciseName: activeEx.name,
                  note: activeEx.feedbackNote,
                  traineeId: currentUser.id,
                  gymName: selectedGym?.name,
                });
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-[0.98] text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Share with Gemini / Phone Apps</span>
              <Share2 className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      )}
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
