"use client";

import React, { useState } from "react";
import { clsx } from "clsx";
import {
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
  Mic,
  Activity,
  Sliders,
  Maximize2,
  Check,
} from "lucide-react";
import {
  BIOFEEDBACK_OPTIONS,
  type ActiveExercise,
  formatDuration,
} from "./types";
import { AudioNoteRecorder } from "@/components/trainee/AudioNoteRecorder";
import { JitCoachPropositionCard } from "@/components/trainee/JitCoachPropositionCard";
import type { CoachProposition } from "@/lib/ai/coach-agent";
import type { ExerciseBiofeedbackTag } from "@/lib/types";

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
  onSnapPhotoClick: () => void;
  onInspectPhoto: (url: string) => void;
  onSharePhotoWithGemini: () => void;
  partnerExercise?: ActiveExercise | null;
  isStraightMode: boolean;
  onToggleSupersetMode: () => void;
  isSupersetA: boolean;
  isSupersetB: boolean;
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
  liftingDurationSec,
  totalRestDurationSec,
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
  onOpenGymDrawer,
  onOpenAddExercise,
  onOpenSwap,
  onOpenTips,
  onExit,
  selectedGymName,
  onSnapPhotoClick,
  onInspectPhoto,
  onSharePhotoWithGemini,
  partnerExercise,
  isStraightMode,
  onToggleSupersetMode,
  isSupersetA,
  isSupersetB,
  activeJitProposition,
  onAcceptJitProposition,
  onDismissJitProposition,
  onToggleFeedbackTag,
  onUpdateFeedbackNote,
  onUpdateExerciseAudio,
  userId,
  pendingOtherExercises,
  onJumpToExercise,
  onPrevExercise,
  onNextExercise,
}: KineticFlightHudProps) {
  // View mode toggle: Concentric HUD Cockpit vs 3D Living Anatomy
  const [hudViewMode, setHudViewMode] = useState<"cockpit" | "anatomy">("cockpit");
  const [isAudioRecordingActive, setIsAudioRecordingActive] = useState(false);

  const completedSetsCount = exercise.completedSets.length;
  const currentSetNum = completedSetsCount + 1;
  const isAllPrescribedComplete = completedSetsCount >= exercise.targetSets;
  const isExCompleteOrSkipped = isAllPrescribedComplete || exercise.skippedRemaining;
  const isFinalExercise = currentExIndex === totalExercises - 1;

  // Concentric SVG Ring Math
  // Radius = 138, Circumference = 2 * PI * 138 ≈ 867.08
  const CIRCUMFERENCE = 867;
  const targetReps = exercise.repHigh || 10;
  const repProgress = Math.min(1.2, exercise.currentReps / targetReps);
  const targetArcOffset = CIRCUMFERENCE * (1 - Math.min(1, repProgress));

  // Biomechanical inferences
  const isPull =
    exercise.name.toLowerCase().includes("pull") ||
    exercise.name.toLowerCase().includes("row") ||
    exercise.name.toLowerCase().includes("chin") ||
    exercise.name.toLowerCase().includes("lat");
  const isPress =
    exercise.name.toLowerCase().includes("press") ||
    exercise.name.toLowerCase().includes("push") ||
    exercise.name.toLowerCase().includes("bench");
  const isLegs =
    exercise.name.toLowerCase().includes("leg") ||
    exercise.name.toLowerCase().includes("squat") ||
    exercise.name.toLowerCase().includes("curl") ||
    exercise.name.toLowerCase().includes("thrust") ||
    exercise.name.toLowerCase().includes("rdl") ||
    exercise.name.toLowerCase().includes("deadlift");
  const isShoulders =
    exercise.name.toLowerCase().includes("lateral") ||
    exercise.name.toLowerCase().includes("delt") ||
    exercise.name.toLowerCase().includes("overhead");

  // Dynamic Biomechanical Telemetry Strings
  const targetMuscleLabel = isPull
    ? "LATISSIMUS DORSI // POSTERIOR CHAIN"
    : isPress
    ? "PECTORALIS MAJOR // ANTERIOR CHAIN"
    : isLegs
    ? "BICEPS FEMORIS & GLUTEUS // HINGE/SQUAT"
    : isShoulders
    ? "LATERAL DELTOID // SCAPULAR PLANE"
    : "SKELETAL MUSCLE KINETIC CHAIN";

  const bioLockTitle = isPull
    ? "SCAPULAR DEPRESSION: 94% LOCK | LAT ENGAGEMENT OPTIMAL"
    : isPress
    ? "RETRACTION & ARCH: 92% LOCK | STERNOCIRCULAR PEAK"
    : isLegs
    ? "PELVIC MASTER SWITCH: 96% LOCKED | FASCIAL STACK"
    : isShoulders
    ? "30° SCAPULAR PLANE: 95% ALIGNED | SUPRASPINATUS SAFE"
    : "BIOMECHANICAL TENSION: 95% ALIGNED";

  // Tactical metrics calculations
  const estimatedVelocity = (
    0.58 -
    Math.min(0.25, (exercise.currentWeight / (exercise.lastBestWeight || 40)) * 0.15)
  ).toFixed(2);
  const tutSec = (exercise.currentReps * 4.2).toFixed(1);
  const estimatedTorqueNm = Math.round(exercise.currentWeight * 4.6);

  // Quick weight adjustment helpers
  const handleAdjustWeight = (delta: number) => {
    const next = Math.max(0, exercise.currentWeight + delta);
    onUpdateWeight(Number(next.toFixed(1)));
  };

  const handleAdjustReps = (val: number) => {
    const next = Math.max(1, Math.min(30, val));
    onUpdateReps(next);
  };

  return (
    <div className="min-h-screen bg-[#090C11] text-[#E1E2EA] flex flex-col justify-between max-w-md mx-auto w-full select-none font-body pb-safe">
      {/* 1. KINETIC FLIGHT TELEMETRY TOP COCKPIT HEADER */}
      <header className="sticky top-0 z-40 bg-[#090C11]/90 backdrop-blur-xl border-b border-[#1C2436] px-3 pt-2 pb-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExit}
              className="w-10 h-10 rounded-xl bg-[#111622] border border-[#1C2436] hover:border-amber-500/50 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
              title="Exit Workout"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111622] border border-[#22c55e]/30">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="font-mono-tabular text-xs font-bold text-[#4be277] tracking-wider">
                {Math.floor(sessionDurationSec / 60)}:
                {(sessionDurationSec % 60).toString().padStart(2, "0")}
              </span>
              <span className="text-[9px] font-mono font-bold text-[#22c55e]/70 uppercase">
                ACTIVE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenGymDrawer}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#111622] hover:bg-[#182030] border border-[#1C2436] hover:border-amber-500/40 rounded-full text-[11px] font-medium text-slate-300 hover:text-amber-300 transition active:scale-95 cursor-pointer max-w-[120px]"
              title="Salle de sport active"
            >
              <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="truncate">{selectedGymName || "Gym"}</span>
            </button>

            <button
              type="button"
              onClick={onOpenReorder}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#111622] hover:bg-[#182030] border border-[#1C2436] hover:border-amber-500/40 rounded-full text-xs font-mono font-bold text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
              title="Station Jump / Reorder"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {currentExIndex + 1}/{totalExercises}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenAddExercise}
              className="w-8 h-8 rounded-full bg-[#111622] hover:bg-[#182030] border border-[#1C2436] flex items-center justify-center text-amber-400 transition active:scale-95 cursor-pointer"
              title="Add Extra Lift"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* 3-Track Duration Telemetry */}
        <div className="grid grid-cols-3 gap-1.5 py-1.5 px-3 bg-[#111622]/80 border border-[#1C2436] rounded-xl text-center">
          <div>
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">
              Total Gym
            </span>
            <span className="font-mono-tabular font-extrabold text-amber-400 text-xs sm:text-sm">
              {Math.floor(sessionDurationSec / 60)}:
              {(sessionDurationSec % 60).toString().padStart(2, "0")}
            </span>
          </div>
          <div className="border-x border-[#1C2436]">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">
              Lifting
            </span>
            <span className="font-mono-tabular font-extrabold text-white text-xs sm:text-sm">
              {Math.floor(liftingDurationSec / 60)}:
              {(liftingDurationSec % 60).toString().padStart(2, "0")}
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">
              Rest
            </span>
            <span className="font-mono-tabular font-extrabold text-sky-400 text-xs sm:text-sm">
              {Math.floor(totalRestDurationSec / 60)}:
              {(totalRestDurationSec % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </header>

      {/* 2. MAIN ACTIVE COCKPIT AREA (UPPER 58% PASSIVE TELEMETRY & CENTER HUD) */}
      <main className="flex-1 flex flex-col justify-start px-3 py-3 space-y-3.5">
        {/* Superset Station Indicator Banner */}
        {(exercise.supersetTag || exercise.subMovementOrder?.match(/[AB]$/)) && (
          <div
            className={clsx(
              "p-2.5 rounded-xl space-y-1.5 transition-colors border",
              isStraightMode
                ? "bg-slate-900/90 border-slate-700/80"
                : "bg-indigo-950/60 border-indigo-700/60"
            )}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span
                  className={clsx(
                    "text-[10px] font-mono uppercase tracking-wider font-bold flex items-center gap-1.5",
                    isStraightMode ? "text-slate-300" : "text-indigo-300"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isStraightMode
                    ? "Straight Sets Mode (One-by-One)"
                    : "Station-Locked Superset"}
                </span>
                {exercise.supersetTag && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Group {exercise.supersetTag}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onToggleSupersetMode}
                className="text-[10px] font-semibold px-2 py-0.5 rounded border bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-300 transition active:scale-95 cursor-pointer"
              >
                {isStraightMode ? "⚡ Re-link Superset" : "📋 Machine Busy? Straight Sets"}
              </button>
            </div>
            <div className="text-[11px] text-slate-300">
              {isStraightMode ? (
                <span>
                  Complete all {exercise.targetSets} sets of{" "}
                  <strong>{exercise.name}</strong> before moving.
                </span>
              ) : isSupersetA ? (
                <span>
                  👉 <strong>{exercise.subMovementOrder || "Movement A"}</strong>:{" "}
                  {exercise.name} · 0s rest → immediately transition to partner.
                </span>
              ) : (
                <span>
                  👉 <strong>{exercise.subMovementOrder || "Movement B"}</strong>:{" "}
                  {exercise.name} · {exercise.restSeconds || 60}s rest before next round.
                </span>
              )}
            </div>
          </div>
        )}

        {/* JIT Coach Proposition Card */}
        {activeJitProposition && onAcceptJitProposition && onDismissJitProposition && (
          <JitCoachPropositionCard
            proposition={activeJitProposition}
            onAccept={onAcceptJitProposition}
            onDismiss={onDismissJitProposition}
          />
        )}

        {/* Exercise Header & Action Icons */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {exercise.subMovementOrder && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {exercise.subMovementOrder}
                </span>
              )}
              <h2 className="text-xl sm:text-2xl font-black font-display uppercase text-white tracking-tight leading-tight truncate">
                {exercise.name}
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Target:{" "}
              <span className="font-bold text-amber-400">
                {exercise.targetSets} sets × {exercise.repLow}-{exercise.repHigh} reps
              </span>{" "}
              {exercise.targetWeightKg ? `· ${exercise.targetWeightKg}kg ` : ""}
              · RIR {exercise.targetRir}
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {exercise.videoUrl && (
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 hover:text-amber-300 transition active:scale-95 cursor-pointer shadow-sm"
                title="Watch Exercise Demo Video"
              >
                <Video className="w-3.5 h-3.5 stroke-[2.5]" />
              </a>
            )}

            <button
              type="button"
              onClick={onOpenSwap}
              className="w-8 h-8 rounded-lg bg-[#111622] border border-[#1C2436] hover:border-[#2D3A54] flex items-center justify-center text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
              title="Swap Machine / Equipment"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
            </button>

            <button
              type="button"
              onClick={onSnapPhotoClick}
              className={clsx(
                "w-8 h-8 rounded-lg border flex items-center justify-center transition active:scale-95 cursor-pointer",
                exercise.equipmentPhotoUrl
                  ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                  : "bg-[#111622] border-[#1C2436] hover:border-[#2D3A54] text-slate-300 hover:text-white"
              )}
              title="Snap Equipment Photo"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
            </button>

            <button
              type="button"
              onClick={onOpenTips}
              className="w-8 h-8 rounded-lg bg-[#111622] border border-[#1C2436] hover:border-[#2D3A54] flex items-center justify-center text-slate-400 hover:text-slate-200 transition active:scale-95 cursor-pointer"
              title="Form Tips & Biofeedback"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() =>
                setHudViewMode((prev) => (prev === "cockpit" ? "anatomy" : "cockpit"))
              }
              className={clsx(
                "px-2 h-8 rounded-lg border flex items-center gap-1 text-[10px] font-mono font-bold transition active:scale-95 cursor-pointer",
                hudViewMode === "anatomy"
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  : "bg-[#111622] border-[#1C2436] text-slate-400 hover:text-white"
              )}
              title="Toggle HUD vs 3D Anatomy Map"
            >
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>{hudViewMode === "anatomy" ? "HUD" : "Anatomy"}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Biomechanical Telemetry Banner */}
        <div className="bg-[#111622] border border-[#1C2436] rounded-xl p-2.5 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-ping" />
              <span className="text-[10px] font-mono font-bold text-[#4be277] uppercase tracking-wider">
                {targetMuscleLabel}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-[#182030] px-2 py-0.5 rounded text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              <span>REST: {formatDuration(exercise.restSeconds || 90)}</span>
            </div>
          </div>

          {/* Scapular Depression / Biomechanical Lock Gauge */}
          <div className="flex flex-col gap-1 bg-[#090C11] p-2 rounded-lg border border-[#1C2436]/60">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
              <span className="flex items-center gap-1 text-slate-300 font-semibold truncate mr-2">
                <span className="text-amber-400">⚡</span>
                {bioLockTitle}
              </span>
              <span className="text-[#4be277] font-bold flex-shrink-0">PEAK 95%</span>
            </div>

            {/* 12-Segment Tension Arc Bar */}
            <div className="grid grid-cols-12 gap-0.5 h-2 w-full bg-[#182030] rounded-full overflow-hidden p-0.5">
              {Array.from({ length: 12 }).map((_, i) => {
                const isOverload = i >= 10;
                const isPeak = i === 11;
                return (
                  <div
                    key={i}
                    className={clsx(
                      "h-full rounded-sm transition-all",
                      isPeak
                        ? "bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                        : isOverload
                        ? "bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.8)]"
                        : "bg-[#22c55e]/80"
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* Tactical Metrics Trio */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-center">
            <div className="bg-[#182030] px-2 py-1 rounded-lg">
              <span className="text-[9px] font-mono text-slate-400 uppercase block font-semibold">
                VELOCITY
              </span>
              <span className="font-mono text-xs font-extrabold text-[#4be277]">
                {estimatedVelocity} <span className="text-[9px] text-slate-400 font-normal">m/s</span>
              </span>
            </div>
            <div className="bg-[#182030] px-2 py-1 rounded-lg">
              <span className="text-[9px] font-mono text-slate-400 uppercase block font-semibold">
                TUT
              </span>
              <span className="font-mono text-xs font-extrabold text-white">
                {tutSec} <span className="text-[9px] text-slate-400 font-normal">s</span>
              </span>
            </div>
            <div className="bg-[#182030] px-2 py-1 rounded-lg">
              <span className="text-[9px] font-mono text-slate-400 uppercase block font-semibold">
                PEAK TORQUE
              </span>
              <span className="font-mono text-xs font-extrabold text-amber-400">
                {estimatedTorqueNm} <span className="text-[9px] text-slate-400 font-normal">Nm</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3. CENTERPIECE: TACTILE CONCENTRIC HUD RING OR 3D LIVING ANATOMY */}
        {hudViewMode === "cockpit" ? (
          <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[300px] mx-auto flex items-center justify-center my-1">
            {/* SVG Concentric Telemetry Target Ring */}
            <svg
              className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none"
              viewBox="0 0 320 320"
            >
              {/* Outer Track Background */}
              <circle
                cx="160"
                cy="160"
                fill="none"
                r="148"
                stroke="#1d2025"
                strokeDasharray="3 5"
                strokeWidth="2"
              />
              <circle
                cx="160"
                cy="160"
                fill="none"
                r="138"
                stroke="#191c21"
                strokeWidth="12"
              />

              {/* Dynamic Target Arc (Reps completed vs target ceiling) */}
              <circle
                className="filter drop-shadow-[0_0_12px_rgba(34,197,94,0.6)] transition-all duration-300"
                cx="160"
                cy="160"
                fill="none"
                r="138"
                stroke="#22c55e"
                strokeDasharray="867"
                strokeDashoffset={targetArcOffset}
                strokeLinecap="round"
                strokeWidth="12"
              />

              {/* Hot Amber Stress Marker (Top of Rep Range) */}
              <circle
                cx="160"
                cy="160"
                fill="none"
                r="138"
                stroke="#ee9800"
                strokeDasharray="28 839"
                strokeDashoffset="-700"
                strokeLinecap="butt"
                strokeWidth="14"
              />

              {/* Inner Precision Tick Marks */}
              <circle
                cx="160"
                cy="160"
                fill="none"
                r="120"
                stroke="#32353b"
                strokeDasharray="1 7"
                strokeWidth="1"
              />
              <circle
                cx="160"
                cy="160"
                fill="none"
                r="108"
                stroke="#272a30"
                strokeDasharray="60 4"
                strokeWidth="4"
              />

              {/* Reticle Crosshairs */}
              <line stroke="#4be277" strokeWidth="2" x1="160" x2="160" y1="6" y2="18" />
              <line stroke="#869585" strokeWidth="1" x1="160" x2="160" y1="302" y2="314" />
              <line stroke="#869585" strokeWidth="1" x1="6" x2="18" y1="160" y2="160" />
              <line stroke="#869585" strokeWidth="1" x1="302" x2="314" y1="160" y2="160" />
            </svg>

            {/* Center Cockpit Telemetry Readout */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center p-2 max-w-[220px]">
              <div className="flex items-center gap-1 bg-[#182030] px-2 py-0.5 rounded-full mb-1 border border-[#1C2436]">
                <Sliders className="w-2.5 h-2.5 text-[#4be277]" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-300 font-bold truncate max-w-[140px]">
                  {exercise.name}
                </span>
              </div>

              {/* Massive Bold Displays: WEIGHT KG / REPS */}
              <div className="flex items-baseline justify-center gap-1 my-0.5">
                <span className="text-4xl sm:text-5xl font-black font-display text-white tracking-normal leading-none">
                  {exercise.currentWeight}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase -ml-0.5">
                  KG
                </span>
                <span className="text-2xl font-light text-slate-600 px-1">/</span>
                <span className="text-4xl sm:text-5xl font-black font-display text-[#4be277] tracking-normal leading-none filter drop-shadow-[0_0_12px_rgba(75,226,119,0.5)]">
                  {String(exercise.currentReps).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-mono font-bold text-[#4be277] uppercase -ml-0.5">
                  REPS
                </span>
              </div>

              {/* Target Threshold Indicator */}
              <div className="flex items-center gap-1 my-0.5 bg-[#111622]/80 px-2 py-0.5 rounded-full border border-[#1C2436]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="font-mono text-[9px] text-amber-400 uppercase font-bold tracking-wider">
                  CEILING: {exercise.repHigh} REPS · RIR {exercise.targetRir}
                </span>
              </div>

              {/* Biomechanical Rhythm Cadence */}
              <div className="w-full bg-[#090C11]/90 px-2 py-1 rounded-lg border border-[#1C2436] flex flex-col gap-0.5 mt-1">
                <div className="flex items-center justify-between font-mono text-[8px] uppercase text-slate-400 font-semibold">
                  <span>ECC 3.0s</span>
                  <span className="text-cyan-400">ISO 1.0s</span>
                  <span className="text-[#4be277] font-bold">CONC EXP</span>
                </div>
                <div className="flex h-1 w-full rounded-full overflow-hidden bg-[#182030]">
                  <div className="w-3/5 bg-amber-400" />
                  <div className="w-1/5 bg-cyan-400" />
                  <div className="w-1/5 bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.9)]" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 3D LIVING ANATOMY VECTOR VISUALIZER */
          <div className="relative w-full rounded-xl bg-gradient-to-b from-[#08101a] via-[#0b1522] to-[#070b12] border border-cyan-500/30 p-2.5 overflow-hidden shadow-[inset_0_0_24px_rgba(0,242,254,0.08)] my-1">
            <div className="flex items-center justify-between border-b border-[#1C2436] pb-1.5 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest">
                  POSTERIOR KINETIC CHAIN // 3D FIBER MAP
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold text-[#4be277] bg-[#22c55e]/10 border border-[#22c55e]/30 px-2 py-0.5 rounded">
                94% LOCK
              </span>
            </div>

            {/* Anatomical Vector Silhouette */}
            <div className="relative w-full h-[180px] flex items-center justify-center">
              <svg
                className="w-full h-full max-h-[180px]"
                viewBox="0 0 360 220"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <radialGradient id="latGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                  </radialGradient>
                  <filter id="glowNeon" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Coordinate Grid */}
                <circle cx="180" cy="110" r="95" stroke="#162940" strokeDasharray="2 4" strokeWidth="1" />
                <line x1="180" y1="10" x2="180" y2="210" stroke="#162940" strokeDasharray="2 3" strokeWidth="1" />

                {/* Spine & Cranium */}
                <ellipse cx="180" cy="28" rx="12" ry="14" fill="#0d1b2a" stroke="#2a4365" strokeWidth="1.2" />
                <line x1="180" y1="44" x2="180" y2="180" stroke="#00f2fe" strokeDasharray="3 3" strokeWidth="1" />

                {/* Vertebral Nodes */}
                <circle cx="180" cy="65" r="2.5" fill="#00f2fe" />
                <circle cx="180" cy="95" r="2.5" fill="#34d399" />
                <circle cx="180" cy="125" r="3" fill="#10b981" />
                <circle cx="180" cy="155" r="2.5" fill="#00f2fe" />

                {/* Arm Vectors */}
                <path d="M140 60 Q 180 50 220 60 L 260 90 L 290 140 L 280 146 L 250 100 Z" fill="#0b1726" stroke="#254366" strokeWidth="1.2" />
                <path d="M140 60 L 100 90 L 70 140 L 80 146 L 110 100 Z" fill="#0b1726" stroke="#254366" strokeWidth="1.2" />

                {/* Hero Latissimus Glowing Heatmap Wings */}
                <path
                  d="M180 90 Q 150 85 130 75 Q 125 105 135 135 Q 155 160 180 170 Z"
                  fill="url(#latGlow)"
                  filter="url(#glowNeon)"
                  opacity="0.9"
                />
                <path
                  d="M180 90 Q 210 85 230 75 Q 235 105 225 135 Q 205 160 180 170 Z"
                  fill="url(#latGlow)"
                  filter="url(#glowNeon)"
                  opacity="0.9"
                />

                {/* Striation Tension Lines */}
                <path d="M178 100 C 160 98 145 92 136 82" stroke="#00f2fe" strokeWidth="1.2" />
                <path d="M178 115 C 158 113 142 107 134 100" stroke="#00f2fe" strokeWidth="1.2" />
                <path d="M182 100 C 200 98 215 92 224 82" stroke="#00f2fe" strokeWidth="1.2" />
                <path d="M182 115 C 202 113 218 107 226 100" stroke="#00f2fe" strokeWidth="1.2" />
              </svg>

              {/* Callout Chips */}
              <div className="absolute top-2 left-2 bg-[#090C11]/90 border border-cyan-500/40 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-cyan-300">
                GLENOHUMERAL: 114°
              </div>
              <div className="absolute bottom-2 right-2 bg-[#090C11]/90 border border-[#22c55e]/40 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-[#4be277]">
                T7-L1: 96% TENSION
              </div>
            </div>
          </div>
        )}

        {/* Set Progress Indicators & Completed Sets Chips */}
        <div className="space-y-1.5 py-0.5">
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: exercise.targetSets }).map((_, idx) => {
              const isDone = idx < completedSetsCount;
              const isCurrent = idx === completedSetsCount;

              return (
                <span
                  key={idx}
                  className={clsx(
                    "w-3.5 h-3.5 rounded-full transition-all",
                    isDone && "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)] scale-100",
                    isCurrent &&
                      "border-2 border-amber-400 bg-amber-500/20 animate-pulse scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
                    !isDone && !isCurrent && "bg-[#151B27] border border-[#1C2436]"
                  )}
                />
              );
            })}
          </div>

          {completedSetsCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 justify-center">
              {exercise.completedSets.map((s, idx) => (
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

          <div className="text-center text-[10px] font-mono text-slate-500">
            Previous Best: {exercise.lastBestWeight} kg × {exercise.lastBestReps} reps
          </div>
        </div>

        {/* Rest Timer Countdown Banner (if rest active) */}
        {restTimerSec !== null && (
          <div className="p-3 bg-[#111622] border border-[#1C2436] rounded-xl flex items-center justify-between text-xs shadow-md animate-in fade-in">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-semibold">Rest Interval:</span>
              <span className="font-display font-black text-amber-400 text-lg tabular-nums">
                {restTimerSec}s
              </span>
              <span className="text-[10px] font-mono text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                Chime Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleSound}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition active:scale-95 cursor-pointer"
                title={isSoundMuted ? "Unmute" : "Mute"}
              >
                {isSoundMuted ? (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                )}
              </button>
              <button
                type="button"
                onClick={onSkipRest}
                className="text-[11px] font-mono font-bold text-amber-400 hover:underline flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <span>Skip</span>
                <FastForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 4. LOWER 42% ERGONOMIC THUMB EXECUTION ZONE */}
      <section className="bg-[#090C11] border-t border-[#1C2436] px-3 pt-3 pb-2 space-y-3">
        {isExCompleteOrSkipped ? (
          /* ALL SETS COMPLETE: BIOFEEDBACK & NEXT STATION DECK */
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="p-3 bg-[#111622] border border-[#1C2436] rounded-2xl space-y-2.5 shadow-md">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">
                  How did this lift feel?
                </span>
                {(exercise.feedbackTags && exercise.feedbackTags.length > 0) ||
                exercise.feedbackTag ? (
                  <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {exercise.feedbackTags?.length || (exercise.feedbackTag ? 1 : 0)} selected ✓
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">Multi-select</span>
                )}
              </div>

              {/* Biofeedback Tag Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {BIOFEEDBACK_OPTIONS.map((tag) => {
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
                        "py-2 px-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between gap-1.5 cursor-pointer active:scale-95",
                        isSelected
                          ? tag.activeColor
                          : "bg-[#090C11] border-[#1C2436] text-slate-300 hover:text-white hover:bg-[#182030]"
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm">{tag.icon}</span>
                        <span className="font-semibold truncate">{tag.label}</span>
                      </div>
                      {isSelected && (
                        <span className="text-xs font-bold text-amber-400 flex-shrink-0">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Optional Text Notes */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Setup &amp; Biofeedback Notes</span>
                </div>
                <textarea
                  value={exercise.feedbackNote || ""}
                  onChange={(e) => onUpdateFeedbackNote(e.target.value)}
                  placeholder="e.g. Pin 4, right elbow smooth, 2.5kg micro-plates used..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-[#090C11] border border-[#1C2436] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition resize-none"
                />
              </div>

              {/* Voice Note Recorder */}
              <AudioNoteRecorder
                audioUrl={exercise.feedbackAudioUrl}
                transcript={exercise.feedbackAudioTranscript}
                onSave={(url, transcript) => onUpdateExerciseAudio(url, transcript)}
                onDelete={() => onUpdateExerciseAudio(undefined, undefined)}
                label={`Voice Note: ${exercise.name}`}
                traineeId={userId}
                exerciseName={exercise.name}
                gymName={selectedGymName}
              />

              {/* Equipment Photo Attachment & Gemini Share */}
              <div className="p-3 rounded-xl bg-[#090C11] border border-[#1C2436] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Equipment / Barbell Setup Photo</span>
                  </span>
                  {exercise.equipmentPhotoUrl && (
                    <span className="text-[10px] font-mono text-amber-400 font-bold">
                      Attached ✓
                    </span>
                  )}
                </div>

                {exercise.equipmentPhotoUrl ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onInspectPhoto(exercise.equipmentPhotoUrl!)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#182030] border border-[#1C2436] hover:border-amber-500/40 transition group cursor-pointer text-left active:scale-95"
                    >
                      <img
                        src={exercise.equipmentPhotoUrl}
                        alt="Setup preview"
                        className="w-8 h-8 object-cover rounded-lg border border-[#1C2436]"
                      />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-amber-300">
                          Inspect Photo
                        </span>
                        <span className="text-[9px] text-slate-400">Tap to enlarge</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={onSharePhotoWithGemini}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-900/80 to-cyan-900/80 border border-indigo-700/70 hover:border-indigo-500 text-white transition text-[11px] font-semibold cursor-pointer active:scale-95 shadow-sm"
                      title="Share with Google Gemini for biomechanical analysis"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>Gemini Biomechanics</span>
                      <Share2 className="w-3 h-3 ml-0.5" />
                    </button>

                    <button
                      type="button"
                      onClick={onSnapPhotoClick}
                      className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-[#182030] transition cursor-pointer"
                    >
                      Retake
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onSnapPhotoClick}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#1C2436] hover:border-amber-400/60 bg-[#111622] hover:bg-[#182030] transition flex items-center justify-center gap-2 text-xs text-slate-300 cursor-pointer active:scale-98"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Snap Machine / Seat Setting / Barbell Photo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Next Lift or Finish Workout Button */}
            {isFinalExercise ? (
              <button
                type="button"
                onClick={onFinishSession}
                className="w-full h-16 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider text-lg font-black rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer"
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
                onClick={onNextExercise}
                className="w-full h-16 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider text-lg font-black rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span>Next Exercise →</span>
                </div>
                <span className="text-[11px] font-sans font-medium text-slate-900/80 normal-case">
                  {exercise.name} complete ({completedSetsCount}/{exercise.targetSets} sets)
                </span>
              </button>
            )}

            {/* Jump to Available Machine */}
            {pendingOtherExercises.length > 0 && (
              <div className="p-2.5 bg-[#111622] border border-[#1C2436] rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Machine busy? Jump to station:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {pendingOtherExercises.map(({ ex, idx }) => (
                    <button
                      key={ex.id || idx}
                      type="button"
                      onClick={() => onJumpToExercise(idx)}
                      className="py-1 px-2.5 rounded-lg bg-[#090C11] hover:bg-[#182030] border border-[#1C2436] hover:border-amber-500/50 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span className="text-amber-400 font-mono font-bold">#{idx + 1}</span>
                      <span className="truncate max-w-[120px] font-semibold">{ex.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bonus Set & Drop Set */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onLogDropSet}
                className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-semibold text-amber-300 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Drop Set ({exercise.currentWeight}kg × {exercise.currentReps})</span>
              </button>
              <button
                type="button"
                onClick={onAddBonusSet}
                className="py-2.5 px-3 bg-[#111622] hover:bg-[#182030] border border-[#1C2436] rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Bonus Set</span>
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE SET EXECUTION: TACTILE LOAD, REP SWEEP & 1-TAP RIR LOCK */
          <div className="space-y-3">
            {/* Quick Weight Micro-Adjusters */}
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                Load: {exercise.currentWeight} kg
              </span>
              <div className="flex items-center gap-1">
                {[-5, -2.5, 2.5, 5].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => handleAdjustWeight(delta)}
                    className="px-2.5 py-1 rounded-lg bg-[#111622] hover:bg-[#182030] border border-[#1C2436] hover:border-amber-500/40 text-[11px] font-mono font-bold text-slate-300 hover:text-white active:scale-95 transition cursor-pointer"
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>
            </div>

            {/* Ergonomic Rep Sweep (1 to 15) */}
            <div className="bg-[#111622] p-2 rounded-xl flex flex-col gap-1 border border-[#1C2436]">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
                  <span>ERGONOMIC REP SWEEP (1-15)</span>
                </span>
                <span className="text-[10px] font-mono text-[#4be277] font-bold">
                  {exercise.currentReps >= exercise.repLow ? "TARGET IN RANGE ✓" : "SUB-RANGE"}
                </span>
              </div>

              {/* Tactile Rep Puck Track */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleAdjustReps(exercise.currentReps - 1)}
                  className="w-11 h-11 bg-[#182030] text-slate-200 hover:text-[#4be277] active:scale-95 rounded-lg flex items-center justify-center transition cursor-pointer flex-shrink-0"
                  aria-label="Decrease reps"
                >
                  <span className="text-xl font-bold font-mono">−</span>
                </button>

                <div className="flex-1 bg-[#090C11] rounded-lg p-1 flex items-center justify-between gap-0.5 overflow-x-auto no-scrollbar">
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((r) => {
                    const isActive = r === exercise.currentReps;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleAdjustReps(r)}
                        className={clsx(
                          "h-8 min-w-[22px] flex items-center justify-center font-mono rounded transition-all cursor-pointer",
                          isActive
                            ? "bg-[#22c55e] text-slate-950 font-extrabold text-xs shadow-[0_0_12px_rgba(34,197,94,0.7)] scale-110 z-10"
                            : "text-[10px] text-slate-500 hover:text-slate-300"
                        )}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handleAdjustReps(exercise.currentReps + 1)}
                  className="w-11 h-11 bg-[#182030] text-slate-200 hover:text-[#4be277] active:scale-95 rounded-lg flex items-center justify-center transition cursor-pointer flex-shrink-0"
                  aria-label="Increase reps"
                >
                  <span className="text-xl font-bold font-mono">+</span>
                </button>
              </div>
            </div>

            {/* Instant 1-Tap RIR Tactical Lock Selector */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  REPS IN RESERVE (RIR LOCK)
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                  TARGET: RIR {exercise.targetRir}
                </span>
              </div>

              {/* 5 Segmented RIR Tactical Pills */}
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { rir: 0, label: "FAIL", color: "error" },
                  { rir: 1, label: "RIR", color: "standard" },
                  { rir: 2, label: "LOCKED", color: "target" },
                  { rir: 3, label: "RIR", color: "standard" },
                  { rir: 4, label: "SUB", color: "standard" },
                ].map((item) => {
                  const isSelected = exercise.targetRir === item.rir;
                  return (
                    <button
                      key={item.rir}
                      type="button"
                      onClick={() => onUpdateRir(item.rir)}
                      className={clsx(
                        "h-13 rounded-lg flex flex-col items-center justify-center p-1 transition-all active:scale-95 cursor-pointer font-mono",
                        isSelected
                          ? item.color === "error"
                            ? "bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.6)] font-bold"
                            : "bg-amber-500 text-slate-950 font-extrabold shadow-[0_0_14px_rgba(245,158,11,0.6)] scale-[1.02]"
                          : "bg-[#111622] hover:bg-[#182030] border border-[#1C2436] text-slate-400 hover:text-slate-200"
                      )}
                    >
                      <span className="text-sm font-bold leading-none">{item.rir}</span>
                      <span className="text-[8px] uppercase tracking-wider font-bold mt-0.5">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Execution Action Button: LOG SET & REST (64px Haptic Trigger) */}
            <button
              type="button"
              onClick={onLogSet}
              className="w-full h-16 bg-gradient-to-r from-[#22c55e] to-[#4be277] hover:from-[#16a34a] hover:to-[#22c55e] text-slate-950 rounded-2xl font-display text-xl sm:text-2xl tracking-wider uppercase flex items-center justify-between px-4 shadow-[0_0_24px_rgba(34,197,94,0.4)] active:scale-[0.98] transition-all cursor-pointer font-black"
            >
              <div className="flex items-center gap-2">
                <Check className="w-6 h-6 stroke-[3]" />
                <span>
                  LOG SET {Math.min(currentSetNum, exercise.targetSets)} &amp; REST
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-950/80 text-[#4be277] px-3 py-1 rounded-xl font-mono text-xs font-bold tracking-widest">
                <span>{formatDuration(exercise.restSeconds || 90)}</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </div>
            </button>

            {/* Floating Gemini Live Audio Debrief Pill */}
            <div className="w-full bg-[#111622] border border-[#1C2436] rounded-xl px-3 py-2 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2 truncate">
                <div className="flex items-center gap-0.5 h-4 w-4 flex-shrink-0">
                  <span className="w-1 bg-[#4be277] rounded-full h-2 animate-pulse" />
                  <span className="w-1 bg-cyan-400 rounded-full h-3.5 animate-bounce" />
                  <span className="w-1 bg-[#4be277] rounded-full h-2.5 animate-pulse" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-[8.5px] font-mono uppercase text-cyan-400 font-bold tracking-wider flex items-center gap-1">
                    GEMINI LIVE COACH
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  </span>
                  <span className="text-[11px] text-slate-200 truncate">
                    {exercise.formCue
                      ? `"${exercise.formCue}"`
                      : `"Hold the stretch at the top of rep ${exercise.repHigh}"`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAudioRecordingActive((prev) => !prev)}
                className="w-8 h-8 rounded-lg bg-[#182030] hover:bg-[#22c55e]/20 border border-[#1C2436] hover:border-[#22c55e]/50 flex items-center justify-center text-slate-300 hover:text-[#4be277] flex-shrink-0 active:scale-95 ml-2 cursor-pointer transition"
                title="Voice Biofeedback Note"
              >
                <Mic className="w-4 h-4 text-cyan-400" />
              </button>
            </div>

            {/* Inline Voice Recorder Drawer (if toggled) */}
            {isAudioRecordingActive && (
              <div className="p-2.5 bg-[#111622] border border-cyan-500/40 rounded-xl animate-in fade-in">
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

            {/* Secondary Controls: Reorder, Skip Remaining, Log Drop Set */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 px-1">
              <button
                type="button"
                onClick={onOpenReorder}
                className="hover:text-cyan-400 flex items-center gap-1 transition cursor-pointer"
              >
                <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                <span>Station Jump</span>
              </button>
              <button
                type="button"
                onClick={onSkipRemainingSets}
                className="hover:text-amber-400 flex items-center gap-1 transition cursor-pointer"
              >
                <SkipForward className="w-3 h-3 text-amber-400" />
                <span>End lift early →</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 5. FOOTER NAVIGATION */}
      <footer className="px-3 py-2 border-t border-[#1C2436] flex items-center justify-between">
        <button
          type="button"
          disabled={currentExIndex === 0}
          onClick={onPrevExercise}
          className="p-2 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 text-xs cursor-pointer font-display uppercase tracking-wider font-bold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        <button
          type="button"
          onClick={onOpenReorder}
          className="px-3 py-1.5 rounded-lg bg-[#111622] hover:bg-[#182030] border border-[#1C2436] text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          title="Jump station"
        >
          <ArrowUpDown className="w-3 h-3 text-amber-400" />
          <span>
            {completedSetsCount}/{exercise.targetSets} done · Station Jump
          </span>
        </button>

        <button
          type="button"
          disabled={isFinalExercise}
          onClick={onNextExercise}
          className="p-2 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 text-xs cursor-pointer font-display uppercase tracking-wider font-bold"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}
