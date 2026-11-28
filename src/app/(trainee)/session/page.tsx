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
import { GymSelectorDrawer } from "@/components/trainee/GymSelectorDrawer";
import { shareEquipmentPhotoWithGemini } from "@/lib/share-equipment";
import { isCloudStorageEnabled } from "@/lib/cloud-storage";
import { getStorageAdapter } from "@/lib/storage/adapter";
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
import { soundService } from "@/lib/in-gym/sound";
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
import { useVyraStoreVersion } from "@/components/auth/VyraAuthProvider";
import { useSessionTimers } from "@/hooks/useSessionTimers";
import {
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
import { KineticFlightHud } from "@/components/trainee/session/KineticFlightHud";
import { Loader2 } from "lucide-react";
import { haptics } from "@/lib/haptics";

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
  const [isFinishingSession, setIsFinishingSession] = useState(false);
  const isFinishingSessionRef = useRef(false);
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

  const isFinalExercise = currentExIndex === exercises.length - 1;
  const pendingOtherExercises = exercises
    .map((e, idx) => ({ ex: e, idx }))
    .filter(
      ({ ex, idx }) =>
        idx !== currentExIndex &&
        ex.completedSets.length < ex.targetSets &&
        !ex.skippedRemaining
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
    if (isFinishingSessionRef.current) return;
    isFinishingSessionRef.current = true;
    setIsFinishingSession(true);
    haptics.heavy();
    try {
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
    } finally {
      isFinishingSessionRef.current = false;
      setIsFinishingSession(false);
    }
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
    id?: string;
    name: string;
    instructions?: string[];
    equipment: string;
    target?: string;
    videoUrl?: string;
    clipUrl?: string;
    imageUrl?: string;
  }) => {
    let replacedOriginalName = "";

    setExercises((prev) => {
      const nextList = prev.map((ex, idx) => {
        const matches =
          (swapTargetExercise?.id && ex.id === swapTargetExercise.id) ||
          (!swapTargetExercise?.id && idx === currentExIndex);
        if (!matches) return ex;

        replacedOriginalName = ex.name;

        const newVideoUrl = resolveExerciseVideoUrl(candidate.name, {
          id: candidate.id,
          clipUrl: candidate.clipUrl,
          explicitVideoUrl: candidate.videoUrl,
          previousExerciseName: ex.name,
          previousVideoUrl: ex.videoUrl,
          catalogue,
        });

        return {
          ...ex,
          id: candidate.id || ex.id,
          exerciseId: candidate.id || ex.exerciseId,
          name: candidate.name,
          formCue: candidate.instructions?.[0] || ex.formCue,
          equipment: candidate.equipment,
          target:
            candidate.target || inferPrimaryMuscleFromExerciseName(candidate.name),
          videoUrl: newVideoUrl,
          clipUrl: candidate.clipUrl,
          imageUrl: candidate.imageUrl,
          currentWeight: candidate.equipment.toLowerCase().includes("body")
            ? 0
            : ex.currentWeight,
        };
      });
      persistDraft(nextList, currentExIndex);
      return nextList;
    });

    const targetNameToSwap = swapTargetExercise?.name || replacedOriginalName;
    if (targetNameToSwap && candidate.name && targetNameToSwap !== candidate.name) {
      try {
        const resolvedDayOfWeek = targetDay?.dayOfWeek ?? (program ? resolveProgramDay(program.startDate).dayOfWeek : undefined);
        appStore.swapExerciseInActiveProgram(
          currentUser.id,
          targetNameToSwap,
          candidate.name,
          resolvedDayOfWeek
        );
      } catch (err) {
        console.warn("[Session] Failed to persist swap to active program:", err);
      }
    }

    soundService.playTargetHitFeedback(true);
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
        isFinishingSession={isFinishingSession}
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

  return (
    <div className="min-h-screen bg-[#090C11]">
      <KineticFlightHud
        exercise={activeEx}
        currentExIndex={currentExIndex}
        totalExercises={exercises.length}
        sessionDurationSec={sessionDurationSec}
        liftingDurationSec={liftingDurationSec}
        totalRestDurationSec={totalRestDurationSec}
        restTimerSec={restTimerSec}
        isSoundMuted={isSoundMuted}
        onToggleSound={() => {
          const next = !isSoundMuted;
          setIsSoundMuted(next);
          soundService.setMuted(next);
        }}
        onSkipRest={cancelOrSkipRest}
        onUpdateWeight={(val) =>
          setExercises((prev) => {
            const copy = [...prev];
            copy[currentExIndex] = {
              ...copy[currentExIndex],
              currentWeight: val,
            };
            return copy;
          })
        }
        onUpdateReps={(val) =>
          setExercises((prev) => {
            const copy = [...prev];
            copy[currentExIndex] = {
              ...copy[currentExIndex],
              currentReps: val,
            };
            return copy;
          })
        }
        onUpdateRir={(rir) =>
          setExercises((prev) => {
            const copy = [...prev];
            copy[currentExIndex] = {
              ...copy[currentExIndex],
              targetRir: rir,
            };
            return copy;
          })
        }
        onLogSet={handleLogSet}
        onLogDropSet={handleLogDropSet}
        onAddBonusSet={handleAddBonusSet}
        onSkipRemainingSets={handleSkipRemainingSets}
        onFinishSession={() => handleFinishSession()}
        isFinishingSession={isFinishingSession}
        onOpenReorder={() => setIsReorderDrawerOpen(true)}
        onOpenGymDrawer={() => setIsGymDrawerOpen(true)}
        onOpenAddExercise={() => setIsAddExerciseSheetOpen(true)}
        onOpenSwap={() => {
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
        onOpenTips={() => setIsTipsOpen(true)}
        onExit={() => setIsExitAlertOpen(true)}
        selectedGymName={selectedGym?.name}
        selectedPhoto={selectedFullPhoto}
        onSnapPhotoClick={() => fileInputRef.current?.click()}
        onInspectPhoto={(url) => setSelectedFullPhoto(url)}
        onSharePhotoWithGemini={() => {
          if (activeEx.equipmentPhotoUrl) {
            shareEquipmentPhotoWithGemini({
              photoUrl: activeEx.equipmentPhotoUrl,
              exerciseName: activeEx.name,
              note: activeEx.feedbackNote,
              traineeId: currentUser.id,
              gymName: selectedGym?.name,
            });
          }
        }}
        partnerExercise={partnerExercise}
        isStraightMode={isStraightMode}
        onToggleSupersetMode={handleToggleSupersetMode}
        isSupersetA={isSupersetA}
        isSupersetB={isSupersetB}
        activeJitProposition={activeJitProposition}
        onAcceptJitProposition={handleAcceptJitProposition}
        onDismissJitProposition={handleDismissJitProposition}
        onToggleFeedbackTag={handleToggleFeedbackTag}
        onUpdateFeedbackNote={handleUpdateFeedbackNote}
        onUpdateExerciseAudio={handleUpdateExerciseAudio}
        userId={currentUser.id}
        pendingOtherExercises={pendingOtherExercises}
        onJumpToExercise={jumpToExercise}
        onPrevExercise={() =>
          setCurrentExIndex((prev) => Math.max(0, prev - 1))
        }
        onNextExercise={() =>
          setCurrentExIndex((prev) =>
            Math.min(exercises.length - 1, prev + 1)
          )
        }
      />

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
        isFinishingSession={isFinishingSession}
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

      {isFinishingSession && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 bg-[#05080c]/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200"
        >
          <div className="relative flex items-center justify-center mb-5">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-[#090d16] border border-[#10b981]/50 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Loader2 className="w-8 h-8 text-[#10b981] animate-spin" />
            </div>
          </div>
          <h3 className="text-xl font-display uppercase tracking-wider font-black text-white mb-1">
            Finalizing Session
          </h3>
          <p className="text-xs font-mono text-emerald-400 mb-2">
            Compiling Biomechanical Logs &amp; Telemetry...
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs font-body">
            Saving sets, updating sensory memory, and preparing your performance debrief.
          </p>
        </div>
      )}
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
