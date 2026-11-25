"use client";

import React, { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";
import {
  Sparkles,
  Video,
  X,
  FastForward,
  Volume2,
  VolumeX,
  Plus,
  CheckCircle2,
  Flame,
  ArrowUpDown,
  SkipForward,
  Camera,
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  Check,
  ArrowRightLeft,
} from "lucide-react";
import {
  BIOFEEDBACK_OPTIONS,
  type ActiveExercise,
  formatDuration,
} from "./types";
import { AudioNoteRecorder } from "@/components/trainee/AudioNoteRecorder";
import { JitCoachPropositionCard } from "@/components/trainee/JitCoachPropositionCard";
import { AnatomicalTensionSpotlight } from "@/components/trainee/AnatomicalTensionSpotlight";
import { inferPrimaryMuscleFromExerciseName } from "@/lib/ai/sensory-memory";
import { resolveExerciseVideoUrl } from "@/lib/utils";
import type { CoachProposition } from "@/lib/ai/coach-agent";
import type { ExerciseBiofeedbackTag } from "@/lib/types";
import {
  voiceCoach,
  parseVoiceCommand,
  type VoiceCommandAction,
} from "@/lib/in-gym/voice-coach";

export interface KineticFlightHudProps {
  exercise: ActiveExercise;
  currentExIndex: number;
  totalExercises: number;
  sessionDurationSec: number;
  liftingDurationSec: number;
  totalRestDurationSec: number;
  restTimerSec: number | null;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  onSkipRest: () => void;
  onUpdateWeight: (weight: number) => void;
  onUpdateReps: (reps: number) => void;
  onUpdateRir: (rir: number) => void;
  onLogSet: () => void;
  onLogDropSet: () => void;
  onAddBonusSet: () => void;
  onSkipRemainingSets: () => void;
  onFinishSession: () => void;
  onOpenReorder: () => void;
  onOpenGymDrawer: () => void;
  onOpenAddExercise: () => void;
  onOpenSwap: () => void;
  onOpenTips: () => void;
  onExit: () => void;
  selectedGymName?: string;
  selectedPhoto?: string | null;
  onSnapPhotoClick?: () => void;
  onInspectPhoto?: (url: string) => void;
  onSharePhotoWithGemini?: () => void;
  partnerExercise?: ActiveExercise;
  isStraightMode?: boolean;
  onToggleSupersetMode?: () => void;
  isSupersetA?: boolean;
  isSupersetB?: boolean;
  activeJitProposition?: CoachProposition | null;
  onAcceptJitProposition?: (prop: CoachProposition) => void;
  onDismissJitProposition?: (prop: CoachProposition) => void;
  onToggleFeedbackTag: (tag: ExerciseBiofeedbackTag) => void;
  onUpdateFeedbackNote: (note: string) => void;
  onUpdateExerciseAudio: (url?: string, transcript?: string) => void;
  userId: string;
  pendingOtherExercises: { ex: ActiveExercise; idx: number }[];
  onJumpToExercise: (index: number) => void;
  onPrevExercise: () => void;
  onNextExercise: () => void;
  videoDemonstrationUrl?: string;
}

export function KineticFlightHud({
  exercise,
  currentExIndex,
  totalExercises,
  sessionDurationSec,
  restTimerSec,
  isSoundMuted,
  onToggleSound,
  onSkipRest,
  onUpdateWeight,
  onUpdateReps,
  onUpdateRir,
  onLogSet,
  onLogDropSet,
  onAddBonusSet,
  onSkipRemainingSets,
  onFinishSession,
  onOpenReorder,
  onOpenSwap,
  onExit,
  selectedGymName,
  onSnapPhotoClick,
  isStraightMode,
  onToggleSupersetMode,
  activeJitProposition,
  onAcceptJitProposition,
  onDismissJitProposition,
  onToggleFeedbackTag,
  onUpdateFeedbackNote,
  onUpdateExerciseAudio,
  userId,
  onPrevExercise,
  onNextExercise,
}: KineticFlightHudProps) {
  const [isAudioRecordingActive, setIsAudioRecordingActive] = useState(false);
  const [isVoiceCoachActive, setIsVoiceCoachActive] = useState(true);
  const [isHandsFreeListening, setIsHandsFreeListening] = useState(false);
  const [voiceStatusMessage, setVoiceStatusMessage] = useState<string | null>(null);

  const spokenRestSecRef = useRef<number | null>(null);
  const speechRecognizerRef = useRef<any>(null);

  // Real-time audio cues during rest timers
  useEffect(() => {
    if (restTimerSec === null) {
      spokenRestSecRef.current = null;
      return;
    }
    if (!isVoiceCoachActive || isSoundMuted) return;

    if (restTimerSec === 45 && spokenRestSecRef.current !== 45) {
      spokenRestSecRef.current = 45;
      voiceCoach.speakRestPace(
        45,
        exercise.currentWeight,
        exercise.currentReps,
        exercise.targetRir
      );
    } else if (restTimerSec === 15 && spokenRestSecRef.current !== 15) {
      spokenRestSecRef.current = 15;
      voiceCoach.speakRestPace(15);
    } else if (restTimerSec === 1 && spokenRestSecRef.current !== 0) {
      spokenRestSecRef.current = 0;
      voiceCoach.speakRestPace(0);
    }
  }, [
    restTimerSec,
    isVoiceCoachActive,
    isSoundMuted,
    exercise.currentWeight,
    exercise.currentReps,
    exercise.targetRir,
  ]);

  const handleVoiceCommandAction = (
    action: VoiceCommandAction,
    transcript: string
  ) => {
    if (action.type === "LOG_SET") {
      if (action.weightKg !== undefined) onUpdateWeight(action.weightKg);
      if (action.reps !== undefined) onUpdateReps(action.reps);
      if (action.rir !== undefined) onUpdateRir(action.rir);
      onLogSet();
      const finalReps = action.reps ?? exercise.currentReps;
      const finalWeight = action.weightKg ?? exercise.currentWeight;
      setVoiceStatusMessage(`Logged ${finalReps} reps @ ${finalWeight}kg`);
      if (isVoiceCoachActive && !isSoundMuted) {
        voiceCoach.speakSetLogged(finalReps, finalWeight, action.rir);
      }
    } else if (action.type === "SET_WEIGHT") {
      onUpdateWeight(action.weightKg);
      setVoiceStatusMessage(`Weight: ${action.weightKg}kg`);
      if (isVoiceCoachActive && !isSoundMuted) {
        voiceCoach.speak(`Weight set to ${action.weightKg} kilos`);
      }
    } else if (action.type === "ADJUST_WEIGHT") {
      const next = Math.max(0, exercise.currentWeight + action.deltaKg);
      onUpdateWeight(Number(next.toFixed(1)));
      setVoiceStatusMessage(`Weight: ${next}kg`);
    } else if (action.type === "SET_REPS") {
      onUpdateReps(action.reps);
      setVoiceStatusMessage(`Reps: ${action.reps}`);
    } else if (action.type === "SET_RIR") {
      onUpdateRir(action.rir);
      setVoiceStatusMessage(`RIR: ${action.rir}`);
    } else if (action.type === "SKIP_REST") {
      onSkipRest();
      setVoiceStatusMessage("Rest skipped");
    } else if (action.type === "SWAP_EXERCISE") {
      onOpenSwap();
      setVoiceStatusMessage("Opening station swap...");
    } else if (action.type === "ADD_SET") {
      onAddBonusSet();
      setVoiceStatusMessage("Bonus set added");
    } else {
      setVoiceStatusMessage(`Heard: "${transcript}"`);
    }

    setTimeout(() => {
      setVoiceStatusMessage(null);
    }, 3500);
  };

  const startHandsFreeListening = () => {
    if (typeof window === "undefined") return;
    const speechWin = window as unknown as {
      SpeechRecognition?: any;
      webkitSpeechRecognition?: any;
    };
    const SpeechRecognitionCtor =
      speechWin.SpeechRecognition || speechWin.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceStatusMessage("Voice recognition not supported");
      setTimeout(() => setVoiceStatusMessage(null), 2500);
      return;
    }

    try {
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.stop();
      }
      const recognizer = new SpeechRecognitionCtor();
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.lang = "en-US";

      recognizer.onstart = () => {
        setIsHandsFreeListening(true);
        setVoiceStatusMessage("Listening for command...");
      };

      recognizer.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (!transcript) return;
        const action = parseVoiceCommand(transcript);
        handleVoiceCommandAction(action, transcript);
      };

      recognizer.onerror = () => {
        setIsHandsFreeListening(false);
      };

      recognizer.onend = () => {
        setIsHandsFreeListening(false);
      };

      speechRecognizerRef.current = recognizer;
      recognizer.start();
    } catch {
      setIsHandsFreeListening(false);
    }
  };

  const completedSetsCount = exercise.completedSets.length;
  const currentSetNum = completedSetsCount + 1;
  const isAllPrescribedComplete = completedSetsCount >= exercise.targetSets;
  const isExCompleteOrSkipped = isAllPrescribedComplete || exercise.skippedRemaining;
  const isFinalExercise = currentExIndex === totalExercises - 1;

  // Dynamic primary and secondary muscle targeting from DB / inference
  const primaryMuscle =
    exercise.target || inferPrimaryMuscleFromExerciseName(exercise.name);
  const secondaryMuscles = exercise.targetMuscleGroups || [];

  // Guaranteed working video URL for every exercise
  const effectiveVideoUrl = resolveExerciseVideoUrl(exercise.name, {
    explicitVideoUrl: exercise.videoUrl,
  });

  const handleAdjustWeight = (delta: number) => {
    const next = Math.max(0, exercise.currentWeight + delta);
    onUpdateWeight(Number(next.toFixed(1)));
  };

  const handleAdjustReps = (val: number) => {
    const next = Math.max(1, Math.min(30, val));
    onUpdateReps(next);
  };

  return (
    <div className="h-screen bg-[#05080c] text-[#E1E7F0] flex flex-col justify-between max-w-md mx-auto w-full select-none font-body pb-safe overflow-hidden">
      {/* 1. TOP HUD BAR: STATION + EXERCISE + PROMINENT VIDEO TRIGGER */}
      <header className="bg-[#05080c] border-b border-[#1b2d47]/70 px-3 py-2 flex items-center justify-between gap-2 shrink-0 z-30">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onExit}
            className="w-8 h-8 rounded-lg bg-[#0f1724] border border-[#1b2d47] flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition cursor-pointer shrink-0"
            title="Exit Workout"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-black uppercase text-white truncate leading-tight">
                {exercise.name}
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold shrink-0">
                SET {Math.min(currentSetNum, exercise.targetSets)}/{exercise.targetSets}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[#10b981] truncate uppercase">
                Target: {primaryMuscle}
              </span>
              <button
                type="button"
                onClick={onOpenSwap}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[9px] font-mono font-bold hover:bg-cyan-500/25 active:scale-95 transition cursor-pointer shrink-0"
                title="Station occupied? Tap to swap"
              >
                <ArrowRightLeft className="w-2.5 h-2.5" />
                <span>SWAP</span>
              </button>
            </div>
          </div>
        </div>

        {/* PROMINENT VIDEO & UTILITY BUTTONS */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSwap}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0f1724] border border-[#1b2d47] text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 active:scale-95 transition cursor-pointer shrink-0"
            title="Station occupied? Instant exercise swap"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline text-[10px] font-mono font-bold">SWAP</span>
          </button>

          {effectiveVideoUrl && (
            <a
              href={effectiveVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono text-[11px] font-bold hover:bg-cyan-500/30 active:scale-95 transition shadow-[0_0_8px_rgba(6,182,212,0.4)] cursor-pointer"
              title="Watch form video demo"
            >
              <Video className="w-3.5 h-3.5 text-cyan-300" />
              <span>VIDEO</span>
            </a>
          )}

          <button
            type="button"
            onClick={onSnapPhotoClick}
            className={clsx(
              "w-8 h-8 rounded-lg border flex items-center justify-center transition active:scale-95 cursor-pointer",
              exercise.equipmentPhotoUrl
                ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                : "bg-[#0f1724] border-[#1b2d47] text-slate-400 hover:text-white"
            )}
            title="Snap equipment photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !isVoiceCoachActive;
              setIsVoiceCoachActive(next);
              voiceCoach.setEnabled(next);
            }}
            className={clsx(
              "w-8 h-8 rounded-lg border flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0",
              isVoiceCoachActive
                ? "bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981]"
                : "bg-[#0f1724] border-[#1b2d47] text-slate-500 hover:text-slate-300"
            )}
            title={isVoiceCoachActive ? "Voice Coach: Active (audio pacing enabled)" : "Voice Coach: Muted"}
          >
            {isVoiceCoachActive ? (
              <Volume2 className="w-3.5 h-3.5 text-[#10b981]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>

          <div className="text-[11px] font-mono font-bold text-[#10b981] px-2 py-1 rounded bg-[#0f1724] border border-[#1b2d47] shrink-0">
            {Math.floor(sessionDurationSec / 60)}:
            {(sessionDurationSec % 60).toString().padStart(2, "0")}
          </div>
        </div>
      </header>

      {/* Dynamic Voice Status Toast */}
      {voiceStatusMessage && (
        <div className="mx-3 mt-1 px-3 py-1 bg-[#10b981]/15 border border-[#10b981]/40 rounded-lg text-[#10b981] text-xs font-mono flex items-center justify-between animate-in fade-in shrink-0">
          <span className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
            {voiceStatusMessage}
          </span>
          <span className="text-[9px] font-mono text-slate-400 uppercase">VOICE COACH</span>
        </div>
      )}

      {/* 2. DYNAMIC ANATOMICAL TARGETING SPOTLIGHT (HERO OF THE SCREEN) */}
      <main className="flex-1 flex flex-col justify-center items-center px-3 py-1 space-y-1 overflow-hidden min-h-0">
        {/* Superset indicator if applicable */}
        {(exercise.supersetTag || exercise.subMovementOrder?.match(/[AB]$/)) && (
          <div className="w-full px-2 py-1 rounded-lg bg-indigo-950/60 border border-indigo-700/60 flex items-center justify-between text-[10px] shrink-0">
            <span className="font-mono font-bold text-indigo-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {isStraightMode ? "Straight Sets" : "Superset Station"}
            </span>
            <button
              type="button"
              onClick={onToggleSupersetMode}
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded border bg-indigo-600/20 text-indigo-300 transition cursor-pointer"
            >
              {isStraightMode ? "⚡ Re-link" : "📋 Straight"}
            </button>
          </div>
        )}

        {/* JIT Coach Proposition Card */}
        {activeJitProposition && onAcceptJitProposition && onDismissJitProposition && (
          <div className="w-full shrink-0">
            <JitCoachPropositionCard
              proposition={activeJitProposition}
              onAccept={onAcceptJitProposition}
              onDismiss={onDismissJitProposition}
            />
          </div>
        )}

        {/* DYNAMIC ANATOMICAL SPOTLIGHT HIGHLIGHTING TARGET MUSCLES */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <AnatomicalTensionSpotlight
            primaryMuscle={primaryMuscle}
            secondaryMuscles={secondaryMuscles}
            accentColor="emerald"
            showToggle={false}
            className="w-36 h-40"
          />
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-[#10b981] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            <span>{primaryMuscle} // ACTIVE TARGET</span>
          </div>
        </div>

        {/* Set dots progression */}
        <div className="flex items-center justify-center gap-2 py-1 shrink-0">
          {Array.from({ length: exercise.targetSets }).map((_, idx) => {
            const isDone = idx < completedSetsCount;
            const isCurrent = idx === completedSetsCount;
            return (
              <span
                key={idx}
                className={clsx(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  isDone && "bg-[#10b981] shadow-[0_0_6px_rgba(16,185,129,0.8)]",
                  isCurrent && "border-2 border-cyan-400 bg-cyan-400/40 animate-pulse scale-110",
                  !isDone && !isCurrent && "bg-[#142032] border border-[#1b2d47]"
                )}
              />
            );
          })}
        </div>

        {/* Rest Timer Banner */}
        {restTimerSec !== null && (
          <div className="w-full p-2 bg-[#0f1724] border border-[#1b2d47] rounded-xl flex items-center justify-between text-xs animate-in fade-in shrink-0">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-slate-400">Rest:</span>
              <span className="font-display font-black text-cyan-300 text-base tabular-nums">
                {restTimerSec}s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startHandsFreeListening}
                className={clsx(
                  "px-2 py-1 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer",
                  isHandsFreeListening
                    ? "bg-red-500/20 border-red-500 text-red-300 animate-pulse"
                    : "bg-[#142032] border-[#1b2d47] text-[#10b981] hover:text-white"
                )}
                title="Tap to speak (e.g. '8 reps at 60kg')"
              >
                <Mic className={clsx("w-3 h-3", isHandsFreeListening ? "text-red-400" : "text-[#10b981]")} />
                <span>{isHandsFreeListening ? "LISTENING" : "VOICE"}</span>
              </button>

              <button
                type="button"
                onClick={onToggleSound}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                {isSoundMuted ? (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                )}
              </button>
              <button
                type="button"
                onClick={onSkipRest}
                className="text-[11px] font-mono font-bold text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Skip</span>
                <FastForward className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. LOWER CONTROLS: INTUITIVE NUMERIC STEPPERS (NO SCALING LINE, NO EMPTY SPACE) */}
      <section className="bg-[#05080c] border-t border-[#1b2d47] px-3 pt-2 pb-2 space-y-2 shrink-0 z-30">
        {isExCompleteOrSkipped ? (
          /* COMPLETION VIEW */
          <div className="space-y-2 animate-in fade-in">
            <div className="p-3 bg-[#0f1724] border border-[#1b2d47] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="uppercase text-slate-400 font-bold">
                  {exercise.name} Completed
                </span>
                <span className="text-[#10b981] font-bold">
                  {completedSetsCount}/{exercise.targetSets} Sets Logged ✓
                </span>
              </div>

              {/* Biofeedback Tags */}
              <div className="grid grid-cols-3 gap-1">
                {BIOFEEDBACK_OPTIONS.slice(0, 3).map((tag) => {
                  const isSelected = Boolean(
                    exercise.feedbackTags?.includes(tag.id) ||
                      (!exercise.feedbackTags && exercise.feedbackTag === tag.id)
                  );
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => onToggleFeedbackTag(tag.id)}
                      className={clsx(
                        "py-1.5 px-2 rounded-lg border text-center text-[10px] font-mono transition cursor-pointer",
                        isSelected
                          ? tag.activeColor
                          : "bg-[#05080c] border-[#1b2d47] text-slate-300 hover:text-white"
                      )}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>

              {/* Text note */}
              <input
                type="text"
                value={exercise.feedbackNote || ""}
                onChange={(e) => onUpdateFeedbackNote(e.target.value)}
                placeholder="Quick note: Pin #, shoulder feel, tempo..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#05080c] border border-[#1b2d47] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {/* Next or Finish Button */}
            {isFinalExercise ? (
              <button
                type="button"
                onClick={onFinishSession}
                className="w-full h-14 bg-gradient-to-r from-[#10b981] via-emerald-400 to-cyan-400 text-[#05080c] font-display uppercase tracking-wider text-xl font-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                <span>FINISH WORKOUT &amp; DEBRIEF ✓</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onNextExercise}
                className="w-full h-14 bg-gradient-to-r from-[#10b981] via-emerald-400 to-cyan-400 text-[#05080c] font-display uppercase tracking-wider text-xl font-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>NEXT EXERCISE →</span>
              </button>
            )}

            {/* Drop & Bonus Sets */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onLogDropSet}
                className="py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-mono font-bold text-amber-300 transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Drop Set</span>
              </button>
              <button
                type="button"
                onClick={onAddBonusSet}
                className="py-2 bg-[#0f1724] hover:bg-[#142032] border border-[#1b2d47] rounded-lg text-xs font-mono font-bold text-slate-300 transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#10b981]" />
                <span>+ Bonus Set</span>
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE LOGGING CONTROLS: CLEAN TACTILE STEPPERS */
          <div className="space-y-2">
            {/* WEIGHT & REPS SIDE-BY-SIDE STEPPERS */}
            <div className="grid grid-cols-2 gap-2">
              {/* WEIGHT STEPPER */}
              <div className="p-2 bg-[#0f1724] border border-[#1b2d47] rounded-xl flex flex-col justify-between">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                  LOAD (KG)
                </span>
                <div className="text-2xl font-display font-black text-white tabular-nums my-0.5">
                  {exercise.currentWeight}{" "}
                  <span className="text-xs font-mono text-cyan-400 font-bold">KG</span>
                </div>
                <div className="flex items-center gap-1 w-full">
                  <button
                    type="button"
                    onClick={() => handleAdjustWeight(-2.5)}
                    className="flex-1 h-8 rounded-lg bg-[#142032] hover:bg-[#1b2d47] text-xs font-mono font-bold text-slate-300 flex items-center justify-center active:scale-95 transition border border-[#1b2d47] cursor-pointer"
                  >
                    -2.5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustWeight(2.5)}
                    className="flex-1 h-8 rounded-lg bg-[#142032] hover:bg-[#1b2d47] text-xs font-mono font-bold text-slate-300 flex items-center justify-center active:scale-95 transition border border-[#1b2d47] cursor-pointer"
                  >
                    +2.5
                  </button>
                </div>
              </div>

              {/* REPS STEPPER */}
              <div className="p-2 bg-[#0f1724] border border-[#1b2d47] rounded-xl flex flex-col justify-between">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                  REPS (GOAL {exercise.repLow}-{exercise.repHigh})
                </span>
                <div className="text-2xl font-display font-black text-[#10b981] tabular-nums my-0.5">
                  {exercise.currentReps}{" "}
                  <span className="text-xs font-mono text-slate-400 font-normal">REPS</span>
                </div>
                <div className="flex items-center gap-1 w-full">
                  <button
                    type="button"
                    onClick={() => handleAdjustReps(exercise.currentReps - 1)}
                    className="flex-1 h-8 rounded-lg bg-[#142032] hover:bg-[#1b2d47] text-base font-mono font-bold text-slate-300 flex items-center justify-center active:scale-95 transition border border-[#1b2d47] cursor-pointer"
                    aria-label="Decrease reps"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustReps(exercise.currentReps + 1)}
                    className="flex-1 h-8 rounded-lg bg-[#142032] hover:bg-[#1b2d47] text-base font-mono font-bold text-slate-300 flex items-center justify-center active:scale-95 transition border border-[#1b2d47] cursor-pointer"
                    aria-label="Increase reps"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* DIRECT 1-TAP RIR SELECTOR ROW */}
            <div className="p-1.5 bg-[#0f1724] border border-[#1b2d47] rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 px-1">
                <span>REPS IN RESERVE (RIR)</span>
                <span className="text-[#10b981] font-bold">
                  ACTIVE: RIR {exercise.targetRir}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { rir: 0, label: "0 FAIL", activeCls: "bg-rose-600 text-white border-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.8)]" },
                  { rir: 1, label: "1 RIR", activeCls: "bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" },
                  { rir: 2, label: "2 LOCK", activeCls: "bg-[#10b981] text-[#05080c] font-black border-[#34d399] shadow-[0_0_8px_rgba(16,185,129,0.8)]" },
                  { rir: 3, label: "3 RIR", activeCls: "bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" },
                  { rir: 4, label: "4+ SUB", activeCls: "bg-slate-600 text-white border-slate-500" },
                ].map((btn) => (
                  <button
                    key={btn.rir}
                    type="button"
                    onClick={() => onUpdateRir(btn.rir)}
                    className={clsx(
                      "py-1.5 rounded-lg text-[10px] font-mono font-bold transition active:scale-95 cursor-pointer border text-center",
                      exercise.targetRir === btn.rir
                        ? btn.activeCls
                        : "bg-[#05080c] border-[#1b2d47] text-slate-400 hover:text-white"
                    )}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* COACH CUE & HANDS-FREE VOICE LOG BUTTON */}
            <div className="flex items-center justify-between gap-2 px-1 text-xs">
              <div className="text-[11px] font-mono text-slate-400 truncate">
                {exercise.formCue
                  ? `"${exercise.formCue}"`
                  : `"Locked scapulae. Drive through full range."`}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={startHandsFreeListening}
                  className={clsx(
                    "flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-mono font-bold active:scale-95 transition cursor-pointer",
                    isHandsFreeListening
                      ? "bg-red-500/20 border-red-500 text-red-300 animate-pulse"
                      : "bg-[#142032] border-[#1b2d47] text-[#10b981] hover:text-white hover:border-[#10b981]/50"
                  )}
                  title="Hands-free voice logging (e.g. 'Log 8 reps at 60kg')"
                >
                  <Mic className={clsx("w-3 h-3", isHandsFreeListening ? "text-red-400 animate-ping" : "text-[#10b981]")} />
                  <span>{isHandsFreeListening ? "LISTENING..." : "VOICE LOG"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAudioRecordingActive((prev) => !prev)}
                  className="w-6 h-6 rounded bg-[#142032] border border-[#1b2d47] flex items-center justify-center text-cyan-400 active:scale-95 transition cursor-pointer"
                  title="Voice memo"
                >
                  <Sparkles className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Inline Audio Recorder if toggled */}
            {isAudioRecordingActive && (
              <div className="p-2 bg-[#0f1724] border border-cyan-500/40 rounded-xl animate-in fade-in">
                <AudioNoteRecorder
                  audioUrl={exercise.feedbackAudioUrl}
                  transcript={exercise.feedbackAudioTranscript}
                  onSave={(url, transcript) => {
                    onUpdateExerciseAudio(url, transcript);
                    setIsAudioRecordingActive(false);
                  }}
                  onDelete={() => onUpdateExerciseAudio(undefined, undefined)}
                  label={`Voice Note: ${exercise.name}`}
                  traineeId={userId}
                  exerciseName={exercise.name}
                  gymName={selectedGymName}
                  compact
                />
              </div>
            )}

            {/* 3.4 GIANT 60PX PRIMARY CTA: LOG SET & REST (ABSOLUTE BOTTOM ANCHOR) */}
            <button
              type="button"
              onClick={onLogSet}
              className="w-full h-15 py-3 bg-gradient-to-r from-[#10b981] via-emerald-400 to-cyan-400 text-[#05080c] rounded-xl font-display text-2xl tracking-wider uppercase flex items-center justify-between px-4 shadow-[0_0_24px_rgba(16,185,129,0.45)] hover:shadow-[0_0_30px_rgba(0,242,254,0.6)] active:scale-[0.98] transition-all cursor-pointer font-black shrink-0"
            >
              <div className="flex items-center gap-2">
                <Check className="w-6 h-6 stroke-[3]" />
                <span>
                  LOG SET {Math.min(currentSetNum, exercise.targetSets)} &amp; REST
                </span>
              </div>
              <div className="flex items-center gap-1 bg-[#05080c]/90 text-[#10b981] px-3 py-1 rounded-lg border border-[#10b981]/40 font-mono text-xs font-bold tracking-widest">
                <span>{formatDuration(exercise.restSeconds || 90)}</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </div>
            </button>
          </div>
        )}
      </section>

      {/* 4. FOOTER BAR: PREV / STATION / SKIP / NEXT */}
      <footer className="px-3 py-1.5 border-t border-[#1b2d47] flex items-center justify-between bg-[#05080c] text-[11px] font-mono shrink-0">
        <button
          type="button"
          disabled={currentExIndex === 0}
          onClick={onPrevExercise}
          className="text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 cursor-pointer font-bold"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        <button
          type="button"
          onClick={onOpenReorder}
          className="text-slate-400 hover:text-cyan-400 transition flex items-center gap-1 cursor-pointer"
        >
          <ArrowUpDown className="w-3 h-3 text-cyan-400" />
          <span>{currentExIndex + 1}/{totalExercises} Jump</span>
        </button>

        <button
          type="button"
          onClick={onSkipRemainingSets}
          className="text-slate-400 hover:text-amber-400 transition cursor-pointer"
        >
          End early →
        </button>

        <button
          type="button"
          disabled={isFinalExercise}
          onClick={onNextExercise}
          className="text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 cursor-pointer font-bold"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </footer>
    </div>
  );
}
