"use client";

import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { appStore } from "@/lib/store";
import {
  resolveProgramDay,
  checkIsPersonalRecord,
  resolveExerciseVideoUrl,
} from "@/lib/utils";
import type {
  WorkoutSession,
  SetLog,
  Program,
  ProgramDay,
  ProgramWeek,
  Exercise,
  ExerciseBiofeedbackTag,
  GymLocation,
  User,
} from "@/lib/types";
import { saveSessionAction } from "@/lib/actions/session";
import { uploadEquipmentPhotoAction } from "@/lib/actions/upload";
import { AudioNoteRecorder } from "@/components/trainee/AudioNoteRecorder";
import { GymSelectorDrawer } from "@/components/trainee/GymSelectorDrawer";
import { shareEquipmentPhotoWithGemini } from "@/lib/share-equipment";
import { isCloudStorageEnabled } from "@/lib/cloud-storage";
import { getStorageAdapter } from "@/lib/storage/adapter";
import { Log } from "@/components/primitives/Log";
import {
  generateAutoregulationPlan,
  type MinimalExerciseTarget,
} from "@/lib/autoregulation";
import { telemetry } from "@/lib/telemetry";
import {
  persistClientWorkoutSession,
  saveSessionDraft,
  loadSessionDraft,
  clearSessionDraft,
  enqueueMutation,
  drainMutationQueue,
} from "@/lib/storage";
import {
  Clock,
  Sparkles,
  Video,
  HelpCircle,
  X,
  FastForward,
  Volume2,
  VolumeX,
  ArrowRightLeft,
  Plus,
  CheckCircle2,
  MapPin,
  Flame,
  ArrowUpDown,
  SkipForward,
  Zap,
  Layers,
  Camera,
  FileText,
  Share2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { soundService } from "@/lib/in-gym/sound";
import { JitCoachPropositionCard } from "@/components/trainee/JitCoachPropositionCard";
import type { DailyWorkoutAdaptationResult } from "@/lib/ai/daily-session-adapter";
import {
  evaluateJustInTimeProposition,
  recordPropositionAcceptance,
  recordPropositionRejection,
  type CoachProposition,
} from "@/lib/ai/coach-agent";
import { gymVisionInventoryStore } from "@/lib/ai/gym-vision-inventory";
import {
  sensoryMemoryStore,
  inferPrimaryMuscleFromExerciseName,
} from "@/lib/ai/sensory-memory";
import { clsx } from "clsx";
import { useVyraStoreVersion } from "@/components/auth/VyraAuthProvider";
import { useSessionTimers } from "@/hooks/useSessionTimers";
import {
  BIOFEEDBACK_OPTIONS,
  compressImage,
  mapDayPrescriptionsToExercises,
  type ActiveExercise,
  type SessionMode,
} from "@/components/trainee/session/types";
import { SessionPreviewView } from "@/components/trainee/session/SessionPreviewView";
import { SessionWarmupView } from "@/components/trainee/session/SessionWarmupView";
import { SessionCooldownView } from "@/components/trainee/session/SessionCooldownView";
import { SessionSummaryView } from "@/components/trainee/session/SessionSummaryView";
import { SessionSheets } from "@/components/trainee/session/SessionSheets";

interface SwapTarget {
  id?: string;
  name: string;
  target: string;
  equipment: string;
  bodyPart?: string;
}

interface SessionFlowProps {
  currentUser: User;
  program?: Program;
  currentWeek?: ProgramWeek;
  targetDay?: ProgramDay;
  dayParam: string | null;
  initialMode: SessionMode;
}

function SessionFlow({
  currentUser,
  program,
  currentWeek,
  targetDay,
  dayParam,
  initialMode,
}: SessionFlowProps) {
  const router = useRouter();
  const [mode, setMode] = useState<SessionMode>(initialMode);
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);
  const [isGymDrawerOpen, setIsGymDrawerOpen] = useState(false);
  const [selectedGymOverride, setSelectedGymOverride] =
    useState<GymLocation | null>(null);
  const selectedGym =
    selectedGymOverride ?? appStore.getDefaultGymLocation(currentUser.id) ?? null;

  const [exercises, setExercises] = useState<ActiveExercise[]>(() =>
    mapDayPrescriptionsToExercises(currentUser.id, targetDay)
  );
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [isRecalibrationApplied, setIsRecalibrationApplied] = useState(false);
  const [isRecalibrationDismissed, setIsRecalibrationDismissed] =
    useState(false);
  const [previewDetailEx, setPreviewDetailEx] = useState<ActiveExercise | null>(
    null
  );

  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isExitAlertOpen, setIsExitAlertOpen] = useState(false);
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState(false);
  const [swapTargetExercise, setSwapTargetExercise] =
    useState<SwapTarget | null>(null);
  const [isReorderDrawerOpen, setIsReorderDrawerOpen] = useState(false);
  const [isWorkoutCompleteModalOpen, setIsWorkoutCompleteModalOpen] =
    useState(false);
  const [isAddExerciseSheetOpen, setIsAddExerciseSheetOpen] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState("");
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState("all");

  const {
    sessionStartEpochRef,
    warmupStartEpochRef,
    liftingStartEpochRef,
    cooldownStartEpochRef,
    sessionDurationSec,
    setSessionDurationSec,
    liftingDurationSec,
    totalRestDurationSec,
    warmupDurationSec,
    setWarmupDurationSec,
    cooldownDurationSec,
    restTimerSec,
    setRestTimerSec,
    startRestCountdown,
    cancelOrSkipRest,
  } = useSessionTimers(mode);

  const [warmupCompleted, setWarmupCompleted] = useState<boolean | undefined>(
    undefined
  );
  const [cooldownCompleted] = useState<boolean | undefined>(undefined);
  const [checkedWarmupDrills, setCheckedWarmupDrills] = useState<
    Record<number, boolean>
  >({});
  const [checkedCooldownDrills, setCheckedCooldownDrills] = useState<
    Record<number, boolean>
  >({});
  const [selectedFullPhoto, setSelectedFullPhoto] = useState<string | null>(
    null
  );
  const [sessionAudioUrl, setSessionAudioUrl] = useState<string | undefined>(
    undefined
  );
  const [sessionAudioTranscript, setSessionAudioTranscript] = useState<
    string | undefined
  >(undefined);
  const [sessionNote] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() =>
    soundService.getIsMuted()
  );
  const [sessionStartTime] = useState(() => new Date().toISOString());
  const [lastSetLoggedAt, setLastSetLoggedAt] = useState<number>(() =>
    Date.now()
  );
  const [originalExercisesSnapshot, setOriginalExercisesSnapshot] = useState<
    ActiveExercise[] | null
  >(null);
  const [activeDailyAdaptation, setActiveDailyAdaptation] =
    useState<DailyWorkoutAdaptationResult | null>(null);
  const [handledJitPropositions, setHandledJitPropositions] = useState<
    Record<string, boolean>
  >({});

  const persistDraft = (
    list: ActiveExercise[],
    exIdx: number = currentExIndex,
    phaseOverride?: SessionMode
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
      isAdaptedSession: Boolean(activeDailyAdaptation),
      activeDailyAdaptation: activeDailyAdaptation || undefined,
    });
  };

  useEffect(() => {
    let active = true;
    async function restoreDraft() {
      if (!currentUser?.id) return;
      try {
        const draft = await loadSessionDraft(currentUser.id, 4);
        if (!active || !draft?.exercises?.length) return;

        const hasLoggedSets = draft.exercises.some(
          (e) =>
            Array.isArray((e as ActiveExercise).completedSets) &&
            (e as ActiveExercise).completedSets.length > 0
        );
        const matchesDay =
          !dayParam || !draft.programDayId || draft.programDayId === targetDay?.id;
        const expectedCount =
          targetDay?.blocks?.flatMap((b) => b.exercises).length || 0;
        const isStaleDraft =
          expectedCount > 0 &&
          draft.exercises.length < expectedCount &&
          !draft.isAdaptedSession;

        if ((hasLoggedSets || draft.isAdaptedSession) && matchesDay && !isStaleDraft) {
          setExercises(
            (draft.exercises as ActiveExercise[]).map((e) => ({
              ...e,
              target:
                e.target && e.target !== "chest"
                  ? e.target
                  : inferPrimaryMuscleFromExerciseName(e.name),
              videoUrl: resolveExerciseVideoUrl(e.name, {
                previousVideoUrl: e.videoUrl,
              }),
            }))
          );
          if (draft.activeDailyAdaptation) {
            setActiveDailyAdaptation(
              draft.activeDailyAdaptation as DailyWorkoutAdaptationResult
            );
          }
          if (typeof draft.currentExerciseIndex === "number") {
            setCurrentExIndex(
              Math.min(draft.currentExerciseIndex, draft.exercises.length - 1)
            );
          }
          if (typeof draft.durationSec === "number") {
            setSessionDurationSec(draft.durationSec);
          }
          if (draft.gymId || draft.gymName) {
            setSelectedGymOverride({
              id: draft.gymId || "gym_restored",
              name: draft.gymName || "Gym Floor",
              address: draft.gymAddress,
            });
          }
          setMode((prev) => (prev === "preview" ? "active" : prev));
        } else if (isStaleDraft) {
          clearSessionDraft(currentUser.id);
        }
      } catch (err) {
        console.warn("Failed to restore session draft:", err);
      }
    }
    restoreDraft();
    return () => {
      active = false;
    };
  }, [currentUser.id, dayParam, setSessionDurationSec, targetDay?.blocks, targetDay?.id]);

  useEffect(() => {
    const handleReplay = async () => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        await drainMutationQueue(async (mutation) => {
          if (mutation.type === "SAVE_SESSION") {
            await saveSessionAction(mutation.payload as WorkoutSession);
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

  const latestSnapshot = useMemo(
    () => appStore.getLatestWearableBiometrics(currentUser.id) ?? null,
    [currentUser.id]
  );

  const [sleepHours, setSleepHours] = useState<number>(() =>
    latestSnapshot ? latestSnapshot.sleepHours : 7.5
  );

  const minimalTargets: MinimalExerciseTarget[] = useMemo(
    () =>
      exercises.map((e) => ({
        id: e.id,
        name: e.name,
        targetSets: e.targetSets,
        repLow: e.repLow,
        repHigh: e.repHigh,
        targetRir: e.targetRir,
        plannedWeightKg: e.lastBestWeight || 60,
      })),
    [exercises]
  );

  const autoregulationPlan = useMemo(
    () =>
      generateAutoregulationPlan(minimalTargets, {
        sleepHours,
        hrvMs: latestSnapshot?.hrvMs,
        deepSleepMinutes: latestSnapshot?.deepSleepMinutes,
        restingHeartRateBpm: latestSnapshot?.restingHeartRateBpm,
      }),
    [minimalTargets, sleepHours, latestSnapshot]
  );

  const catalogue = useMemo(() => appStore.getExercises(), []);

  const filteredCatalogueExercises = useMemo(() => {
    return catalogue.filter((ex) => {
      const q = exerciseSearchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.primaryMuscle.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q);

      const matchCat =
        selectedMuscleFilter === "all" ||
        ex.primaryMuscle
          .toLowerCase()
          .includes(selectedMuscleFilter.toLowerCase()) ||
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

  const activeJitProposition = useMemo<CoachProposition | null>(() => {
    if (
      !activeEx ||
      handledJitPropositions[activeEx.id] ||
      activeEx.completedSets.length > 0
    ) {
      return null;
    }
    const historySessions = appStore.getSessions(currentUser.id);
    return evaluateJustInTimeProposition({
      traineeId: currentUser.id,
      sessionId: targetDay?.id,
      exerciseName: activeEx.name,
      primaryMuscle: activeEx.target || activeEx.targetMuscleGroups?.[0],
      currentWeightKg: activeEx.currentWeight || activeEx.lastBestWeight || 20,
      targetSets: activeEx.targetSets,
      repLow: activeEx.repLow,
      repHigh: activeEx.repHigh,
      targetRir: activeEx.targetRir ?? 1,
      equipment: activeEx.equipment || "dumbbell",
      gymId: selectedGym?.id,
      gymName: selectedGym?.name,
      sessions: historySessions,
      sleepHours: latestSnapshot ? sleepHours : undefined,
      injuries: currentUser.injuries,
      sessionDeloadAlreadyApplied: isRecalibrationApplied,
      equipmentPhotoDataUri: activeEx.equipmentPhotoUrl,
    });
  }, [
    activeEx,
    handledJitPropositions,
    currentUser.id,
    currentUser.injuries,
    targetDay?.id,
    selectedGym?.id,
    selectedGym?.name,
    sleepHours,
    latestSnapshot,
    isRecalibrationApplied,
  ]);

  const handleUpdateExerciseAudio = (
    audioDataUrl: string | undefined,
    transcript?: string
  ) => {
    if (!activeEx) return;
    setExercises((prev) => {
      const copy = [...prev];
      copy[currentExIndex] = {
        ...copy[currentExIndex],
        feedbackAudioUrl: audioDataUrl,
        feedbackAudioTranscript: transcript,
      };
      saveSessionDraft(
        currentUser.id,
        copy,
        currentExIndex,
        sessionDurationSec,
        targetDay?.id
      );
      return copy;
    });

    if (audioDataUrl && targetDay?.id) {
      sensoryMemoryStore
        .transcribeAndIngestAudio({
          traineeId: currentUser.id,
          sessionId: targetDay.id,
          exerciseName: activeEx.name,
          audioNoteUrl: audioDataUrl,
          audioTranscriptHint: transcript,
          tags:
            activeEx.feedbackTags ||
            (activeEx.feedbackTag ? [activeEx.feedbackTag] : []),
          freeTextNote: activeEx.feedbackNote,
          equipmentPhotoUrl: activeEx.equipmentPhotoUrl,
          gymId: selectedGym?.id,
          gymName: selectedGym?.name,
        })
        .catch((err) => {
          console.warn("Sensory memory audio ingestion error:", err);
        });
    }
  };

  const handleUpdateSessionAudio = (
    audioDataUrl: string | undefined,
    transcript?: string
  ) => {
    setSessionAudioUrl(audioDataUrl);
    setSessionAudioTranscript(transcript);
    const completed = appStore
      .getSessions(currentUser.id)
      .find((s) => s.id.startsWith("session_"));
    if (completed) {
      completed.audioNoteUrl = audioDataUrl;
      completed.audioTranscript = transcript;
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
      saveSessionDraft(
        currentUser.id,
        copy,
        currentExIndex,
        sessionDurationSec,
        targetDay?.id
      );
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
      saveSessionDraft(
        currentUser.id,
        copy,
        currentExIndex,
        sessionDurationSec,
        targetDay?.id
      );
      return copy;
    });
  };

  const handleCaptureEquipmentPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.7);
      handleUpdateEquipmentPhoto(compressed);

      if (selectedGym?.id) {
        gymVisionInventoryStore
          .analyzeGymPhotoAndUpdateInventory({
            gymId: selectedGym.id,
            gymName: selectedGym.name,
            traineeId: currentUser.id,
            exerciseName: activeEx?.name,
            photoDataUri: compressed,
            userCaptionOrHint: activeEx?.feedbackNote,
          })
          .catch((err) => {
            console.warn("Gym equipment photo vision analysis error:", err);
          });
      }

      if (
        isCloudStorageEnabled() &&
        typeof navigator !== "undefined" &&
        navigator.onLine
      ) {
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
            console.warn(
              "Background cloud upload skipped, kept local photo:",
              err
            );
          });
      }

      telemetry.track(
        "equipment_photo_captured",
        {
          exercise_name: activeEx?.name,
          cloud_storage_enabled: isCloudStorageEnabled(),
        },
        currentUser.id
      );
    } catch (err) {
      console.warn("Failed to capture equipment photo:", err);
    }
  };

  const handleApplyDailyAdaptation = (result: DailyWorkoutAdaptationResult) => {
    if (!originalExercisesSnapshot) {
      setOriginalExercisesSnapshot(exercises);
    }
    setActiveDailyAdaptation(result);
    const baseList = originalExercisesSnapshot || exercises;
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
          target:
            adapted.target || inferPrimaryMuscleFromExerciseName(adapted.name),
          videoUrl: resolveExerciseVideoUrl(adapted.name, {
            previousExerciseName: ex.name,
            previousVideoUrl: ex.videoUrl,
            catalogue,
          }),
          targetSets: adapted.targetSets,
          restSeconds: adapted.restSeconds,
          targetRir: adapted.targetRir,
          currentWeight: adapted.currentWeight,
          lastBestWeight: adapted.currentWeight,
          formCue: adapted.formCue || ex.formCue,
          loadGuidance:
            adapted.adaptationNotes.join(" · ") || ex.loadGuidance,
          skippedRemaining: false,
        };
      })
      .filter((ex) => !ex.skippedRemaining);
    const finalExercises = nextList.length > 0 ? nextList : baseList;
    setExercises(finalExercises);
    saveSessionDraft({
      traineeId: currentUser.id,
      programDayId: targetDay?.id,
      dayLabel: targetDay?.label,
      exercises: finalExercises,
      currentExIndex: 0,
      currentExerciseIndex: 0,
      sessionDurationSec,
      durationSec: sessionDurationSec,
      startedAt: sessionStartTime,
      updatedAt: new Date().toISOString(),
      phase: mode,
      gymId: selectedGym?.id,
      gymName: selectedGym?.name,
      gymAddress: selectedGym?.address,
      isAdaptedSession: true,
      activeDailyAdaptation: result,
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
    if (!originalExercisesSnapshot) {
      setOriginalExercisesSnapshot(exercises);
    }
    setExercises((prev) =>
      prev.map((ex) => {
        const delta = autoregulationPlan.prescriptionDeltas.find(
          (d) => d.id === ex.id
        );
        if (!delta) return ex;
        return {
          ...ex,
          name: delta.adaptedName,
          videoUrl: resolveExerciseVideoUrl(delta.adaptedName, {
            previousExerciseName: ex.name,
            previousVideoUrl: ex.videoUrl,
            catalogue,
          }),
          targetSets: delta.adaptedSets,
          targetRir: delta.adaptedRir,
          currentWeight: delta.adaptedWeightKg,
          lastBestWeight: delta.adaptedWeightKg,
        };
      })
    );
    setIsRecalibrationApplied(true);
    telemetry.track(
      "workout_recalibration_applied",
      {
        sleep_hours: sleepHours,
        readiness_score: autoregulationPlan.readinessScore,
        reduced_recovery:
          autoregulationPlan.reducedRecovery ??
          autoregulationPlan.cnsFatigueDetected,
      },
      currentUser.id
    );
  };

  const handleDismissRecalibration = () => {
    if (isRecalibrationApplied && originalExercisesSnapshot) {
      setExercises(originalExercisesSnapshot);
      setIsRecalibrationApplied(false);
      telemetry.track(
        "workout_recalibration_undone",
        { sleep_hours: sleepHours },
        currentUser.id
      );
      return;
    }
    setIsRecalibrationDismissed(true);
    telemetry.track(
      "workout_recalibration_dismissed",
      { sleep_hours: sleepHours },
      currentUser.id
    );
  };

  const handleAcceptJitProposition = (prop: CoachProposition) => {
    if (!activeEx) return;
    setHandledJitPropositions((prev) => ({ ...prev, [activeEx.id]: true }));
    recordPropositionAcceptance({
      traineeId: currentUser.id,
      sessionId: targetDay?.id,
      originalExerciseName: prop.exerciseName,
      newExerciseName: prop.mutation.newExerciseName,
      tier: prop.tier,
    });
    setExercises((prev) => {
      const copy = [...prev];
      const target = copy[currentExIndex];
      if (!target) return prev;
      const nextName = prop.mutation.newExerciseName || target.name;
      const nextVideoUrl = resolveExerciseVideoUrl(nextName, {
        explicitVideoUrl: prop.mutation.newVideoUrl,
        previousExerciseName: target.name,
        previousVideoUrl: target.videoUrl,
        catalogue,
      });
      copy[currentExIndex] = {
        ...target,
        name: nextName,
        equipment: prop.mutation.newEquipment || target.equipment,
        target: prop.mutation.newExerciseName
          ? inferPrimaryMuscleFromExerciseName(nextName)
          : target.target,
        videoUrl: nextVideoUrl,
        targetSets: prop.mutation.newTargetSets ?? target.targetSets,
        repLow: prop.mutation.newRepLow ?? target.repLow,
        repHigh: prop.mutation.newRepHigh ?? target.repHigh,
        targetRir: prop.mutation.newTargetRir ?? target.targetRir,
        currentWeight: prop.mutation.newTargetWeightKg ?? target.currentWeight,
        lastBestWeight:
          prop.mutation.newTargetWeightKg ?? target.lastBestWeight,
        formCue: prop.mutation.newFormCue || target.formCue,
        loadGuidance: prop.mutation.newLoadGuidance || prop.proposedFix,
      };
      persistDraft(copy, currentExIndex);
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
    recordPropositionRejection({
      traineeId: currentUser.id,
      sessionId: targetDay?.id,
      exerciseName: prop.exerciseName,
      tier: prop.tier,
    });
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
    activeEx &&
      (activeEx.completedSets.length >= activeEx.targetSets ||
        activeEx.skippedRemaining)
  );
  const pendingOtherExercises = exercises
    .map((e, idx) => ({ ex: e, idx }))
    .filter(
      ({ ex, idx }) =>
        idx !== currentExIndex &&
        ex.completedSets.length < ex.targetSets &&
        !ex.skippedRemaining
    );
  const isFinalExercise = currentExIndex === exercises.length - 1;
  const isFinalSetOfExercise = Boolean(
    activeEx && activeEx.completedSets.length + 1 >= activeEx.targetSets
  );
  const isAllExercisesComplete = exercises.every(
    (e) => e.completedSets.length >= e.targetSets
  );
  const isSupersetA = Boolean(
    activeEx?.subMovementOrder && activeEx.subMovementOrder.endsWith("A")
  );
  const isSupersetB = Boolean(
    activeEx?.subMovementOrder && activeEx.subMovementOrder.endsWith("B")
  );
  const supersetPrefix = activeEx?.subMovementOrder
    ? activeEx.subMovementOrder.slice(0, -1)
    : "";
  const isStraightMode = activeEx?.supersetMode === "straight";
  const partnerExercise = exercises.find(
    (e, idx) =>
      idx !== currentExIndex &&
      ((activeEx?.subMovementOrder &&
        e.subMovementOrder &&
        activeEx.subMovementOrder.slice(0, -1) ===
          e.subMovementOrder.slice(0, -1)) ||
        (activeEx?.supersetTag &&
          e.supersetTag === activeEx.supersetTag &&
          Math.abs(idx - currentExIndex) === 1))
  );

  const handleToggleSupersetMode = () => {
    if (!activeEx) return;
    const currentMode =
      activeEx.supersetMode === "straight" ? "straight" : "superset";
    const nextMode: "straight" | "superset" =
      currentMode === "straight" ? "superset" : "straight";

    setExercises((prev) => {
      const copy = prev.map((ex) => {
        const isInSameGroup =
          (activeEx.supersetTag && ex.supersetTag === activeEx.supersetTag) ||
          (activeEx.subMovementOrder &&
            ex.subMovementOrder &&
            activeEx.subMovementOrder.slice(0, -1) ===
              ex.subMovementOrder.slice(0, -1));
        if (isInSameGroup) {
          return { ...ex, supersetMode: nextMode };
        }
        return ex;
      });
      saveSessionDraft(
        currentUser.id,
        copy,
        currentExIndex,
        sessionDurationSec,
        targetDay?.id
      );
      return copy;
    });
  };

  const handleAddBonusSet = () => {
    if (!activeEx) return;
    setExercises((prev) => {
      const copy = [...prev];
      copy[currentExIndex] = {
        ...copy[currentExIndex],
        targetSets: copy[currentExIndex].targetSets + 1,
      };
      saveSessionDraft(
        currentUser.id,
        copy,
        currentExIndex,
        sessionDurationSec,
        targetDay?.id
      );
      return copy;
    });
    setIsWorkoutCompleteModalOpen(false);
  };

  const handleAddExtraExercise = (picked: Exercise) => {
    const pb = appStore.getPersonalBestForExercise(currentUser.id, picked.name);
    const defaultWeight = pb
      ? pb.weightKg
      : picked.equipment?.toLowerCase() === "bodyweight"
      ? 0
      : 20;
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
      formCue:
        picked.steps?.[0] ||
        "Execute with strict eccentric control through full active range of motion.",
      videoUrl: picked.videoUrl,
      loadGuidance:
        "Bonus exercise logged on top of prescribed program. Train with 1-2 RIR.",
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
      saveSessionDraft(
        currentUser.id,
        updated,
        nextIndex,
        sessionDurationSec,
        targetDay?.id
      );
      return updated;
    });

    setCurrentExIndex(nextIndex);
    setIsAddExerciseSheetOpen(false);
    setIsWorkoutCompleteModalOpen(false);
  };

  const moveExerciseUp = (index: number) => {
    if (index <= 0) return;
    const nextIdx =
      currentExIndex === index
        ? index - 1
        : currentExIndex === index - 1
        ? index
        : currentExIndex;
    setExercises((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      saveSessionDraft(
        currentUser.id,
        copy,
        nextIdx,
        sessionDurationSec,
        targetDay?.id
      );
      return copy;
    });
    if (nextIdx !== currentExIndex) {
      setCurrentExIndex(nextIdx);
    }
  };

  const moveExerciseDown = (index: number) => {
    if (index >= exercises.length - 1) return;
    const nextIdx =
      currentExIndex === index
        ? index + 1
        : currentExIndex === index + 1
        ? index
        : currentExIndex;
    setExercises((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      saveSessionDraft(
        currentUser.id,
        copy,
        nextIdx,
        sessionDurationSec,
        targetDay?.id
      );
      return copy;
    });
    if (nextIdx !== currentExIndex) {
      setCurrentExIndex(nextIdx);
    }
  };

  const jumpToExercise = (index: number) => {
    if (index < 0 || index >= exercises.length) return;
    setCurrentExIndex(index);
    saveSessionDraft(
      currentUser.id,
      exercises,
      index,
      sessionDurationSec,
      targetDay?.id
    );
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
      saveSessionDraft(
        currentUser.id,
        copy,
        currentExIndex,
        sessionDurationSec,
        targetDay?.id
      );
      return copy;
    });
  };

  const handleToggleFeedbackTag = (tag: ExerciseBiofeedbackTag) => {
    if (!activeEx) return;
    setExercises((prev) => {
      const copy = [...prev];
      const currentTags =
        copy[currentExIndex].feedbackTags ||
        (copy[currentExIndex].feedbackTag
          ? [copy[currentExIndex].feedbackTag!]
          : []);
      const nextTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];

      copy[currentExIndex] = {
        ...copy[currentExIndex],
        feedbackTags: nextTags,
        feedbackTag: nextTags[0],
      };
      saveSessionDraft(
        currentUser.id,
        copy,
        currentExIndex,
        sessionDurationSec,
        targetDay?.id
      );
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
      saveSessionDraft(
        currentUser.id,
        updated,
        currentExIndex,
        sessionDurationSec,
        targetDay?.id
      );
      return updated;
    });

    soundService.playTargetHitFeedback(isPR);

    try {
      getStorageAdapter()
        .appendEvent(
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
        )
        .catch(() => {});
    } catch {}

    const now = Date.now();
    const secondsPerSet = Math.max(
      1,
      Math.round((now - lastSetLoggedAt) / 1000)
    );
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
      const count =
        idx === currentExIndex ? newCompletedLength : e.completedSets.length;
      return count >= e.targetSets;
    });

    if (
      willAllExercisesBeComplete ||
      (isFinalExercise && isThisExNowComplete)
    ) {
      setRestTimerSec(null);
      soundService.playRestChime();
      setTimeout(() => {
        setIsWorkoutCompleteModalOpen(true);
      }, 300);
    } else if (activeEx.supersetMode === "straight") {
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
        (e, idx) =>
          idx > currentExIndex &&
          (e.subMovementOrder === `${supersetPrefix}B` ||
            (e.supersetTag === activeEx.supersetTag &&
              idx === currentExIndex + 1))
      );
      if (nextBIndex !== -1) {
        setTimeout(() => {
          setCurrentExIndex(nextBIndex);
        }, 150);
      }
    } else if (isSupersetB) {
      setRestTimerSec(activeEx.restSeconds || 60);
      const partnerAIndex = exercises.findIndex(
        (e) =>
          e.subMovementOrder === `${supersetPrefix}A` ||
          (e.supersetTag === activeEx.supersetTag && e !== activeEx)
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
    if (!activeEx) return;
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
      const nextSuggestedWeight = Math.max(
        2.5,
        Math.round((targetEx.currentWeight * 0.75) / 2.5) * 2.5
      );

      copy[currentExIndex] = {
        ...targetEx,
        completedSets: newCompleted,
        currentWeight: nextSuggestedWeight,
        currentReps: Math.max(4, targetEx.currentReps - 2),
      };
      saveSessionDraft(
        currentUser.id,
        copy,
        currentExIndex,
        sessionDurationSec,
        targetDay?.id
      );
      return copy;
    });

    telemetry.track(
      "workout_set_logged",
      {
        exercise_name: activeEx.name,
        logged_load_kg: activeEx.currentWeight,
        reps: activeEx.currentReps,
        is_drop_set: true,
        drop_index:
          activeEx.completedSets.filter((s) => s.isDropSet).length + 1,
      },
      currentUser.id
    );

    soundService.playCountdownPip();
    setRestTimerSec(null);
  };

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

    const wCompleted = overrideWarmup
      ? overrideWarmup.completed
      : warmupCompleted ?? false;
    const wDuration = overrideWarmup
      ? overrideWarmup.durationSec
      : warmupDurationSec;
    const cCompleted = overrideCooldown
      ? overrideCooldown.completed
      : cooldownCompleted ?? false;
    const cDuration = overrideCooldown
      ? overrideCooldown.durationSec
      : cooldownDurationSec;

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
        feedbackTags:
          ex.feedbackTags || (ex.feedbackTag ? [ex.feedbackTag] : []),
        note: ex.feedbackNote,
        photoUrl: ex.equipmentPhotoUrl,
        equipmentPhotoUrl: ex.equipmentPhotoUrl,
        equipmentPhotoBase64: ex.equipmentPhotoUrl?.startsWith("data:image/")
          ? ex.equipmentPhotoUrl
          : undefined,
        audioNoteUrl: ex.feedbackAudioUrl,
        audioTranscript: ex.feedbackAudioTranscript,
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
      audioTranscript: sessionAudioTranscript,
      sessionNote,
      gymId: selectedGym?.id,
      gymName: selectedGym?.name || "Gym Floor",
      gymAddress: selectedGym?.address,
      setLogs: allSetLogs,
      exerciseFeedbacks: listToSave
        .filter(
          (ex) =>
            (ex.feedbackTags && ex.feedbackTags.length > 0) ||
            Boolean(ex.feedbackTag) ||
            Boolean(ex.feedbackNote) ||
            Boolean(ex.equipmentPhotoUrl) ||
            Boolean(ex.feedbackAudioUrl)
        )
        .map((ex) => ({
          exerciseName: ex.name,
          tag: ex.feedbackTag,
          tags: ex.feedbackTags || (ex.feedbackTag ? [ex.feedbackTag] : []),
          note: ex.feedbackNote,
          photoUrl: ex.equipmentPhotoUrl,
          equipmentPhotoUrl: ex.equipmentPhotoUrl,
          equipmentPhotoBase64: ex.equipmentPhotoUrl?.startsWith("data:image/")
            ? ex.equipmentPhotoUrl
            : undefined,
          audioNoteUrl: ex.feedbackAudioUrl,
          audioTranscript: ex.feedbackAudioTranscript,
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

  const handleQuickStartStarterSession = () => {
    const nowIso = new Date().toISOString();
    const todayDow = (new Date().getDay() + 6) % 7;
    const progId = `prog_starter_${currentUser.id}_${Date.now()}`;
    const weekId = `${progId}_w1`;
    const dayId = `${weekId}_d${todayDow}`;

    const starterProgram: Program = {
      id: progId,
      traineeId: currentUser.id,
      trainerId: currentUser.id,
      title: "Foundational Full Body Starter",
      durationWeeks: 4,
      startDate: nowIso.split("T")[0],
      endDate: new Date(Date.now() + 28 * 86400000).toISOString().split("T")[0],
      version: 1,
      status: "published",
      createdAt: nowIso,
      updatedAt: nowIso,
      weeks: [
        {
          id: weekId,
          programId: progId,
          weekIndex: 1,
          days: [
            {
              id: dayId,
              weekId,
              dayOfWeek: todayDow,
              label: "Day-1 Full Body Foundation",
              isRestDay: false,
              morningRoutine: [
                "500ml water on waking",
                "5 min shoulder & hip mobility",
              ],
              nutrition: {
                targetProteinGrams: 140,
                supplements: [],
              },
              blocks: [
                {
                  id: `${dayId}_b1`,
                  order: 1,
                  type: "straight",
                  exercises: [
                    {
                      id: `${dayId}_ex1`,
                      exerciseId: "ex_incline_db_press",
                      exerciseName: "30° Incline Dumbbell Press",
                      sets: 3,
                      repRangeLow: 8,
                      repRangeHigh: 12,
                      rirScheme: [2, 2, 1],
                      targetWeightKg: 20,
                      restSeconds: 90,
                      selectedEquipment: "dumbbell",
                      loadGuidance:
                        "Pick a comfortable weight leaving ~2 reps in reserve; log set 1 to calibrate.",
                      formCueText:
                        "Tuck elbows ~45°, lower with 2-second control to upper chest.",
                      targetMuscleGroups: ["Chest", "Front Delts"],
                    },
                    {
                      id: `${dayId}_ex2`,
                      exerciseId: "ex_lat_pulldown",
                      exerciseName: "Wide-Grip Lat Pulldown",
                      sets: 3,
                      repRangeLow: 8,
                      repRangeHigh: 12,
                      rirScheme: [2, 2, 1],
                      targetWeightKg: 40,
                      restSeconds: 90,
                      selectedEquipment: "cable",
                      loadGuidance:
                        "Drive elbows down cleanly without swinging the torso.",
                      formCueText:
                        "Depress shoulder blades first, pull bar to upper clavicle.",
                      targetMuscleGroups: ["Lats", "Upper Back"],
                    },
                    {
                      id: `${dayId}_ex3`,
                      exerciseId: "ex_45_leg_press",
                      exerciseName: "45° Machine Leg Press",
                      sets: 3,
                      repRangeLow: 10,
                      repRangeHigh: 12,
                      rirScheme: [2, 2, 1],
                      targetWeightKg: 80,
                      restSeconds: 90,
                      selectedEquipment: "machine",
                      loadGuidance:
                        "Keep lumbar glued flat into the pad; stop shy of knee lockout.",
                      formCueText:
                        "Control descent for 2 seconds, push evenly through mid-foot.",
                      targetMuscleGroups: ["Quadriceps", "Glutes"],
                    },
                    {
                      id: `${dayId}_ex4`,
                      exerciseId: "ex_db_lateral_raise",
                      exerciseName: "Dumbbell Lateral Raise",
                      sets: 3,
                      repRangeLow: 12,
                      repRangeHigh: 15,
                      rirScheme: [2, 1, 1],
                      targetWeightKg: 8,
                      restSeconds: 60,
                      selectedEquipment: "dumbbell",
                      loadGuidance:
                        "Raise in the scapular plane (30° forward) with soft elbows.",
                      formCueText:
                        "Lead with elbows to shoulder height; pause briefly at top.",
                      targetMuscleGroups: ["Lateral Delts"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    appStore.saveProgram(starterProgram);
    appStore.publishProgram(progId);
    router.push(`/session?day=${dayId}&mode=preview`);
  };

  const applySubstituteCandidate = (candidate: {
    name: string;
    instructions?: string[];
    equipment: string;
    target?: string;
    videoUrl?: string;
  }) => {
    setExercises((prev) => {
      const nextList = prev.map((ex, idx) => {
        const matches =
          (swapTargetExercise?.id && ex.id === swapTargetExercise.id) ||
          idx === currentExIndex;
        if (!matches) return ex;
        const newVideoUrl = resolveExerciseVideoUrl(candidate.name, {
          explicitVideoUrl: candidate.videoUrl,
          previousExerciseName: ex.name,
          previousVideoUrl: ex.videoUrl,
          catalogue,
        });
        return {
          ...ex,
          name: candidate.name,
          formCue: candidate.instructions?.[0] || ex.formCue,
          equipment: candidate.equipment,
          target:
            candidate.target || inferPrimaryMuscleFromExerciseName(candidate.name),
          videoUrl: newVideoUrl,
          currentWeight: candidate.equipment.toLowerCase().includes("body")
            ? 0
            : ex.currentWeight,
        };
      });
      persistDraft(nextList, currentExIndex);
      return nextList;
    });
    setIsSwapDrawerOpen(false);
  };

  if (mode === "preview") {
    return (
      <SessionPreviewView
        userId={currentUser.id}
        program={program}
        currentWeek={currentWeek}
        targetDay={targetDay}
        exercises={exercises}
        originalExercisesSnapshot={originalExercisesSnapshot}
        selectedGym={selectedGym}
        sleepHours={sleepHours}
        latestSnapshot={latestSnapshot}
        autoregulationPlan={autoregulationPlan}
        isRecalibrationApplied={isRecalibrationApplied}
        isRecalibrationDismissed={isRecalibrationDismissed}
        activeDailyAdaptation={activeDailyAdaptation}
        catalogue={catalogue}
        isDayPickerOpen={isDayPickerOpen}
        setIsDayPickerOpen={setIsDayPickerOpen}
        isGymDrawerOpen={isGymDrawerOpen}
        setIsGymDrawerOpen={setIsGymDrawerOpen}
        previewDetailEx={previewDetailEx}
        setPreviewDetailEx={setPreviewDetailEx}
        isSwapDrawerOpen={isSwapDrawerOpen}
        setIsSwapDrawerOpen={setIsSwapDrawerOpen}
        swapTargetExercise={swapTargetExercise}
        setSwapTargetExercise={setSwapTargetExercise}
        onSelectDay={(dayId) =>
          router.push(`/session?day=${dayId}&mode=preview`)
        }
        onQuickStartStarterSession={handleQuickStartStarterSession}
        onChangeSleepHours={(hours) => {
          setSleepHours(hours);
          setIsRecalibrationApplied(false);
          setIsRecalibrationDismissed(false);
        }}
        onAcceptRecalibration={handleAcceptRecalibration}
        onDismissRecalibration={handleDismissRecalibration}
        onApplyDailyAdaptation={handleApplyDailyAdaptation}
        onRestoreOriginalDailySession={handleRestoreOriginalDailySession}
        onMoveExerciseUp={moveExerciseUp}
        onMoveExerciseDown={moveExerciseDown}
        onSwapFromVariation={(targetExerciseId, v) => {
          setExercises((prev) => {
            const copy = [...prev];
            const targetIdx = targetExerciseId
              ? copy.findIndex((e) => e.id === targetExerciseId)
              : currentExIndex;
            if (targetIdx !== -1) {
              copy[targetIdx] = {
                ...copy[targetIdx],
                name: v.exerciseName,
                formCue: v.formCue,
                videoUrl: resolveExerciseVideoUrl(v.exerciseName, {
                  explicitVideoUrl: v.videoUrl,
                  previousExerciseName: copy[targetIdx].name,
                  previousVideoUrl: copy[targetIdx].videoUrl,
                  catalogue,
                }),
                equipment: v.equipmentType,
              };
              persistDraft(copy, currentExIndex);
            }
            return copy;
          });
          setPreviewDetailEx(null);
        }}
        onSelectGym={(gym) => {
          setSelectedGymOverride(gym);
          persistDraft(exercises, currentExIndex);
        }}
        onApplySubstitute={applySubstituteCandidate}
        onBeginWorkout={() => {
          const secondsToStart = Math.max(
            1,
            Math.round((Date.now() - new Date(sessionStartTime).getTime()) / 1000)
          );
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
      />
    );
  }

  if (mode === "warmup") {
    return (
      <SessionWarmupView
        targetDay={targetDay}
        warmupDurationSec={warmupDurationSec}
        checkedWarmupDrills={checkedWarmupDrills}
        onToggleDrill={(drillId) =>
          setCheckedWarmupDrills((prev) => ({
            ...prev,
            [drillId]: !prev[drillId],
          }))
        }
        onBackToPreview={() => setMode("preview")}
        onCompleteWarmup={() => {
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
        }}
        onSkipWarmup={() => {
          const now = Date.now();
          setWarmupDurationSec(0);
          setWarmupCompleted(false);
          liftingStartEpochRef.current = now;
          persistDraft(exercises, 0, "active");
          setMode("active");
        }}
      />
    );
  }

  if (mode === "cooldown") {
    return (
      <SessionCooldownView
        cooldownDurationSec={cooldownDurationSec}
        checkedCooldownDrills={checkedCooldownDrills}
        onToggleDrill={(drillId) =>
          setCheckedCooldownDrills((prev) => ({
            ...prev,
            [drillId]: !prev[drillId],
          }))
        }
        onCompleteCooldown={() => {
          const now = Date.now();
          const duration = cooldownStartEpochRef.current
            ? Math.max(
                1,
                Math.round((now - cooldownStartEpochRef.current) / 1000)
              )
            : cooldownDurationSec;
          handleFinishSession(exercises, undefined, {
            completed: true,
            durationSec: duration,
          });
        }}
        onSkipCooldown={() => {
          handleFinishSession(exercises, undefined, {
            completed: false,
            durationSec: 0,
          });
        }}
      />
    );
  }

  if (mode === "summary") {
    return (
      <SessionSummaryView
        currentUser={currentUser}
        targetDay={targetDay}
        exercises={exercises}
        sessionDurationSec={sessionDurationSec}
        selectedGym={selectedGym}
        isGymDrawerOpen={isGymDrawerOpen}
        setIsGymDrawerOpen={setIsGymDrawerOpen}
        sessionAudioUrl={sessionAudioUrl}
        sessionAudioTranscript={sessionAudioTranscript}
        onSelectGym={(gym) => {
          setSelectedGymOverride(gym);
          const sessions = appStore.getSessions(currentUser.id);
          if (sessions.length > 0) {
            appStore.updateSessionGym(sessions[0].id, {
              id: gym.id,
              name: gym.name,
              address: gym.address,
            });
          }
        }}
        onUpdateSessionAudio={handleUpdateSessionAudio}
        onReturnToday={() => router.push("/today")}
      />
    );
  }

  if (!activeEx) {
    return (
      <div className="min-h-screen bg-[#090C11] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="text-sm text-slate-300">No active exercise loaded.</p>
        <button
          type="button"
          onClick={() => setMode("preview")}
          className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
        >
          Back to Session Preview
        </button>
      </div>
    );
  }

  const currentSetNum = activeEx.completedSets.length + 1;

  return (
    <div className="min-h-screen bg-[#090C11] flex flex-col justify-between p-4 max-w-md mx-auto w-full select-none font-body">
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
              <span>
                {currentExIndex + 1}/{exercises.length}
              </span>
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
              {Math.floor(sessionDurationSec / 60)}:
              {(sessionDurationSec % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-1.5 py-2 px-3 bg-[#111622] border border-[#1C2436] rounded-xl text-center">
          <div>
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">
              Total Gym
            </span>
            <span className="font-mono-tabular font-extrabold text-amber-400 text-sm">
              {Math.floor(sessionDurationSec / 60)}:
              {(sessionDurationSec % 60).toString().padStart(2, "0")}
            </span>
          </div>
          <div className="border-x border-[#1C2436]">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">
              Lifting
            </span>
            <span className="font-mono-tabular font-extrabold text-white text-sm">
              {Math.floor(liftingDurationSec / 60)}:
              {(liftingDurationSec % 60).toString().padStart(2, "0")}
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">
              Rest
            </span>
            <span className="font-mono-tabular font-extrabold text-sky-400 text-sm">
              {Math.floor(totalRestDurationSec / 60)}:
              {(totalRestDurationSec % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col justify-center py-4 space-y-6">
        {(activeEx.supersetTag || activeEx.subMovementOrder?.match(/[AB]$/)) && (
          <div
            className={clsx(
              "p-3 rounded-xl space-y-2 animate-in fade-in transition-colors",
              isStraightMode
                ? "bg-slate-900/90 border border-slate-700/80"
                : "bg-indigo-950/50 border border-indigo-700/60"
            )}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span
                  className={clsx(
                    "text-[10px] font-mono uppercase tracking-wider font-bold flex items-center gap-1.5",
                    isStraightMode ? "text-slate-300" : "text-indigo-400"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isStraightMode
                    ? "Straight Sets Mode (One-by-One)"
                    : "Station-Locked Superset"}
                </span>
                {activeEx.supersetTag && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Group {activeEx.supersetTag}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleToggleSupersetMode}
                className={clsx(
                  "text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95",
                  isStraightMode
                    ? "bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-300"
                    : "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300"
                )}
                title={
                  isStraightMode
                    ? "Switch back to alternating superset"
                    : "Machine taken? Complete all sets of this exercise first"
                }
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
                  👉 <strong>Straight sets:</strong> Complete all{" "}
                  {activeEx.targetSets} sets of <strong>{activeEx.name}</strong>{" "}
                  with standard rest ({activeEx.restSeconds || 60}s) before
                  moving to{" "}
                  {partnerExercise ? (
                    <strong>{partnerExercise.name}</strong>
                  ) : (
                    "the next station"
                  )}
                  .
                </span>
              ) : isSupersetA ? (
                <span>
                  👉 <strong>{activeEx.subMovementOrder || "Movement A"}</strong>
                  : {activeEx.name} · 0s rest → immediately transition to{" "}
                  {partnerExercise ? (
                    <strong>{partnerExercise.name}</strong>
                  ) : (
                    "partner exercise"
                  )}
                </span>
              ) : (
                <span>
                  👉 <strong>{activeEx.subMovementOrder || "Movement B"}</strong>
                  : {activeEx.name} · {activeEx.restSeconds || 60}s rest
                  triggered after set before next superset round
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>
                {isStraightMode
                  ? `Set ${Math.min(activeEx.completedSets.length + 1, activeEx.targetSets)} of ${activeEx.targetSets}`
                  : `Round ${Math.min(activeEx.completedSets.length + 1, activeEx.targetSets)} of ${activeEx.targetSets}`}
              </span>
              <span
                className={
                  isStraightMode ? "text-slate-400" : "text-indigo-300/80"
                }
              >
                {isStraightMode
                  ? "No machine switching required"
                  : "Alternate back-and-forth between stations"}
              </span>
            </div>
          </div>
        )}

        {activeJitProposition && (
          <JitCoachPropositionCard
            proposition={activeJitProposition}
            onAccept={handleAcceptJitProposition}
            onDismiss={handleDismissJitProposition}
          />
        )}

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
                Target:{" "}
                <span className="font-bold text-amber-400">
                  {activeEx.targetSets} sets × {activeEx.repLow}-
                  {activeEx.repHigh} reps
                </span>{" "}
                {activeEx.targetWeightKg ? `· ${activeEx.targetWeightKg}kg ` : ""}
                · RIR {activeEx.targetRir}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  Overload Ceiling: {activeEx.repHigh} reps
                </span>
                {activeEx.warmupSets !== undefined &&
                  activeEx.warmupSets > 0 &&
                  activeEx.completedSets.length === 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                      Warm-up: {activeEx.warmupSets} sets
                    </span>
                  )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {activeEx.videoUrl && (
                <a
                  href={resolveExerciseVideoUrl(activeEx.name, {
                    previousVideoUrl: activeEx.videoUrl,
                    catalogue,
                  })}
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
                    target:
                      activeEx.target ||
                      inferPrimaryMuscleFromExerciseName(activeEx.name),
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

          <div className="text-[11px] text-slate-500 font-mono">
            Previous best: {activeEx.lastBestWeight} kg ×{" "}
            {activeEx.lastBestReps} reps
          </div>
        </div>

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
                    isDone &&
                      "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)] scale-100",
                    isCurrent &&
                      "border-2 border-amber-400 bg-amber-500/20 animate-pulse scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
                    !isDone &&
                      !isCurrent &&
                      "bg-[#151B27] border border-[#1C2436]"
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
                  <span className="font-extrabold text-white">
                    {s.weight} kg
                  </span>
                  <span className="text-slate-400 font-medium">× {s.reps}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Log.Stepper
            label="Weight (kg)"
            value={activeEx.currentWeight}
            step={2.5}
            unit="kg"
            onChange={(val) =>
              setExercises((prev) => {
                const copy = [...prev];
                copy[currentExIndex] = {
                  ...copy[currentExIndex],
                  currentWeight: val,
                };
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
                copy[currentExIndex] = {
                  ...copy[currentExIndex],
                  currentReps: val,
                };
                return copy;
              })
            }
          />
        </div>

        {isExCompleteOrSkipped ? (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl space-y-3 shadow-sm font-body">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <span>How did this lift feel? (Select all that apply)</span>
                </span>
                {(activeEx.feedbackTags && activeEx.feedbackTags.length > 0) ||
                activeEx.feedbackTag ? (
                  <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {activeEx.feedbackTags?.length ||
                      (activeEx.feedbackTag ? 1 : 0)}{" "}
                    selected ✓
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">
                    Multi-select
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {BIOFEEDBACK_OPTIONS.map((tag) => {
                  const isSelected = Boolean(
                    activeEx.feedbackTags?.includes(tag.id) ||
                      (!activeEx.feedbackTags &&
                        activeEx.feedbackTag === tag.id)
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
                        <span className="font-semibold truncate">
                          {tag.label}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="text-xs font-bold text-amber-400 flex-shrink-0">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold font-body">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Setup &amp; Biofeedback Notes (Optional)</span>
                </div>
                <textarea
                  value={activeEx.feedbackNote || ""}
                  onChange={(e) => handleUpdateFeedbackNote(e.target.value)}
                  placeholder="e.g. Pin set to position 4, right elbow felt smooth, micro-plates used..."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-[#090C11] border border-[#1C2436] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition resize-none font-body"
                />
              </div>

              <div className="pt-1">
                <AudioNoteRecorder
                  audioUrl={activeEx.feedbackAudioUrl}
                  transcript={activeEx.feedbackAudioTranscript}
                  onSave={(url, transcript) =>
                    handleUpdateExerciseAudio(url, transcript)
                  }
                  onDelete={() =>
                    handleUpdateExerciseAudio(undefined, undefined)
                  }
                  label={`Voice Note: ${activeEx.name}`}
                  traineeId={currentUser.id}
                  exerciseName={activeEx.name}
                  gymName={selectedGym?.name}
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#090C11] border border-[#1C2436] space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5 font-body">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Equipment / Barbell Setup Photo</span>
                  </span>
                  {activeEx.equipmentPhotoUrl && (
                    <span className="text-[10px] font-mono text-amber-400 font-bold">
                      Photo Attached ✓
                    </span>
                  )}
                </div>

                {activeEx.equipmentPhotoUrl ? (
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedFullPhoto(activeEx.equipmentPhotoUrl!)
                      }
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#182030] border border-[#1C2436] hover:border-amber-500/40 transition group cursor-pointer text-left active:scale-95"
                    >
                      <img
                        src={activeEx.equipmentPhotoUrl}
                        alt="Setup preview"
                        className="w-8 h-8 object-cover rounded-lg border border-[#1C2436] group-hover:scale-105 transition flex-shrink-0"
                      />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-amber-300">
                          Inspect Photo
                        </span>
                        <span className="text-[9px] text-slate-400">
                          Tap to enlarge
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        shareEquipmentPhotoWithGemini({
                          photoUrl: activeEx.equipmentPhotoUrl!,
                          exerciseName: activeEx.name,
                          note: activeEx.feedbackNote,
                          traineeId: currentUser.id,
                          gymName: selectedGym?.name,
                        })
                      }
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

            {isAllExercisesComplete || isFinalExercise ? (
              <button
                type="button"
                onClick={() => handleFinishSession()}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider text-base font-black rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer animate-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>Finish Workout &amp; View Results ✓</span>
                </div>
                <span className="text-[11px] font-sans font-medium text-slate-900/80 normal-case">
                  All prescribed sets complete · Tap to save &amp; view summary
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setCurrentExIndex((prev) =>
                    Math.min(exercises.length - 1, prev + 1)
                  )
                }
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider text-base font-black rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer animate-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-2">
                  <span>Next: {exercises[currentExIndex + 1]?.name} →</span>
                </div>
                <span className="text-[11px] font-sans font-medium text-slate-900/80 normal-case">
                  {activeEx.name} complete ({activeEx.completedSets.length}/
                  {activeEx.targetSets} sets)
                </span>
              </button>
            )}

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
                      <span className="text-amber-400 font-mono font-bold">
                        #{idx + 1}
                      </span>
                      <span className="truncate max-w-[140px] font-semibold">
                        {ex.name}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase">
                        ({ex.equipment || "free"})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleLogDropSet}
                className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-semibold text-amber-300 transition flex items-center justify-center gap-1.5 cursor-pointer font-editorial"
                title="Log immediate drop set with reduced load"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  + Drop Set ({activeEx.currentWeight}kg ×{" "}
                  {activeEx.currentReps})
                </span>
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
                activeEx.currentWeight ===
                  (activeEx.lastBestWeight || activeEx.currentWeight) &&
                activeEx.currentReps >= (activeEx.repLow || 8)
              }
              label={
                activeEx.currentWeight ===
                  (activeEx.lastBestWeight || activeEx.currentWeight) &&
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
                <span>End lift &amp; rate feedback →</span>
              </button>
            </div>

            {activeEx.completedSets.length > 0 && (
              <button
                type="button"
                onClick={handleLogDropSet}
                className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 rounded-xl text-xs font-semibold text-amber-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Log as Drop Set ({activeEx.currentWeight}kg ×{" "}
                  {activeEx.currentReps})
                </span>
              </button>
            )}
          </div>
        )}

        {restTimerSec !== null && (
          <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200 shadow-sm font-body">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Rest:</span>
              <span className="font-display font-black text-amber-400 text-base tabular-nums">
                {restTimerSec}s
              </span>
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
                aria-label={
                  isSoundMuted
                    ? "Unmute rest timer audio"
                    : "Mute rest timer audio"
                }
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
                onClick={cancelOrSkipRest}
                className="text-[11px] font-mono font-semibold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Skip</span>
                <FastForward className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </main>

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
            <span>
              {activeEx.completedSets.length}/{activeEx.targetSets} done · Jump
            </span>
          </button>
        )}

        <button
          type="button"
          disabled={currentExIndex === exercises.length - 1}
          onClick={() =>
            setCurrentExIndex((prev) => Math.min(exercises.length - 1, prev + 1))
          }
          className="p-2 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 text-xs"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>

      <SessionSheets
        activeEx={activeEx}
        exercises={exercises}
        currentExIndex={currentExIndex}
        catalogue={catalogue}
        userId={currentUser.id}
        gymName={selectedGym?.name}
        isTipsOpen={isTipsOpen}
        setIsTipsOpen={setIsTipsOpen}
        isExitAlertOpen={isExitAlertOpen}
        setIsExitAlertOpen={setIsExitAlertOpen}
        isSwapDrawerOpen={isSwapDrawerOpen}
        setIsSwapDrawerOpen={setIsSwapDrawerOpen}
        swapTargetExercise={swapTargetExercise}
        isReorderDrawerOpen={isReorderDrawerOpen}
        setIsReorderDrawerOpen={setIsReorderDrawerOpen}
        isWorkoutCompleteModalOpen={isWorkoutCompleteModalOpen}
        setIsWorkoutCompleteModalOpen={setIsWorkoutCompleteModalOpen}
        isAddExerciseSheetOpen={isAddExerciseSheetOpen}
        setIsAddExerciseSheetOpen={setIsAddExerciseSheetOpen}
        exerciseSearchQuery={exerciseSearchQuery}
        setExerciseSearchQuery={setExerciseSearchQuery}
        selectedMuscleFilter={selectedMuscleFilter}
        setSelectedMuscleFilter={setSelectedMuscleFilter}
        filteredCatalogueExercises={filteredCatalogueExercises}
        selectedFullPhoto={selectedFullPhoto}
        setSelectedFullPhoto={setSelectedFullPhoto}
        onExitToToday={() => router.push("/today")}
        onApplySubstitute={applySubstituteCandidate}
        onFinishSession={() => handleFinishSession()}
        onAddBonusSet={handleAddBonusSet}
        onAddExtraExercise={handleAddExtraExercise}
        onMoveExerciseUp={moveExerciseUp}
        onMoveExerciseDown={moveExerciseDown}
        onJumpToExercise={jumpToExercise}
      />

      <GymSelectorDrawer
        isOpen={isGymDrawerOpen}
        onOpenChange={setIsGymDrawerOpen}
        selectedGymId={selectedGym?.id}
        onSelectGym={(gym) => {
          setSelectedGymOverride(gym);
          persistDraft(exercises, currentExIndex);
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCaptureEquipmentPhoto}
        className="hidden"
      />
    </div>
  );
}

function SessionPageInner() {
  useVyraStoreVersion();
  const searchParams = useSearchParams();
  const dayParam = searchParams.get("day");
  const modeParam = (searchParams.get("mode") as SessionMode) || "preview";

  const currentUser = appStore.getCurrentUser();
  const program = appStore.getActiveProgramForTrainee(currentUser.id);
  const resolved = program
    ? resolveProgramDay(program.startDate)
    : { weekIndex: 1, dayOfWeek: 0, started: true };
  const currentWeek = program?.weeks
    ? program.weeks[Math.min(resolved.weekIndex - 1, program.weeks.length - 1)]
    : undefined;
  const scheduledToday = currentWeek?.days.find(
    (d) => d.dayOfWeek === resolved.dayOfWeek
  );
  const targetDay: ProgramDay | undefined = dayParam
    ? currentWeek?.days.find((d) => d.id === dayParam) ||
      program?.weeks.flatMap((w) => w.days).find((d) => d.id === dayParam)
    : scheduledToday && !scheduledToday.isRestDay
    ? scheduledToday
    : undefined;

  return (
    <SessionFlow
      key={`${currentUser.id}_${targetDay?.id || "none"}`}
      currentUser={currentUser}
      program={program}
      currentWeek={currentWeek}
      targetDay={targetDay}
      dayParam={dayParam}
      initialMode={modeParam}
    />
  );
}

export default function SessionPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-slate-400 text-xs">Loading Session...</div>}
    >
      <SessionPageInner />
    </Suspense>
  );
}
