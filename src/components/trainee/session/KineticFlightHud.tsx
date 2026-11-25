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
  Camera,
  FileText,
  Share2,
  ChevronLeft,
  ChevronRight,
  Mic,
  Activity,
  Sliders,
  Check,
  Zap,
  Layers,
  Heart,
  Droplets,
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
  // Concept B (Living Kinetic Anatomy) locked as the primary, default Cockpit view
  const [hudViewMode, setHudViewMode] = useState<"anatomy" | "cockpit">("anatomy");
  const [isAudioRecordingActive, setIsAudioRecordingActive] = useState(false);

  const completedSetsCount = exercise.completedSets.length;
  const currentSetNum = completedSetsCount + 1;
  const isAllPrescribedComplete = completedSetsCount >= exercise.targetSets;
  const isExCompleteOrSkipped = isAllPrescribedComplete || exercise.skippedRemaining;
  const isFinalExercise = currentExIndex === totalExercises - 1;

  // Concentric SVG Ring Math (for HUD cockpit view)
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
    <div className="min-h-screen bg-[#05080c] text-[#E1E7F0] flex flex-col justify-between max-w-md mx-auto w-full select-none font-body pb-safe">
      {/* 1. TOP REAL-TIME NAVIGATION & BIOMECHANICAL HEADER */}
      <header className="sticky top-0 z-40 bg-[#05080c]/90 backdrop-blur-xl border-b border-[#1b2d47]/70 px-3 pt-2 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExit}
              className="w-9 h-9 rounded-lg bg-[#0f1724] border border-[#1b2d47] hover:border-cyan-400/60 flex items-center justify-center text-slate-300 hover:text-cyan-300 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer"
              title="Exit Workout"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0f1724] border border-[#10b981]/40">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="font-mono text-xs font-bold text-[#10b981] tracking-wider">
                {Math.floor(sessionDurationSec / 60)}:
                {(sessionDurationSec % 60).toString().padStart(2, "0")}
              </span>
              <span className="text-[9px] font-mono font-bold text-[#10b981]/80 uppercase">
                BIO-SYNC
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenGymDrawer}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#0f1724] hover:bg-[#142032] border border-[#1b2d47] hover:border-cyan-400/40 rounded-full text-[11px] font-medium text-slate-300 hover:text-cyan-300 transition active:scale-95 cursor-pointer max-w-[120px]"
              title="Salle de sport active"
            >
              <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="truncate">{selectedGymName || "Gym"}</span>
            </button>

            <button
              type="button"
              onClick={onOpenReorder}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#0f1724] hover:bg-[#142032] border border-[#1b2d47] hover:border-cyan-400/40 rounded-full text-xs font-mono font-bold text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
              title="Station Jump / Reorder"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {currentExIndex + 1}/{totalExercises}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenAddExercise}
              className="w-8 h-8 rounded-full bg-[#0f1724] hover:bg-[#142032] border border-[#1b2d47] flex items-center justify-center text-cyan-400 transition active:scale-95 cursor-pointer"
              title="Add Extra Lift"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Title & Set State Tag */}
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl sm:text-2xl tracking-wider uppercase text-white font-black">
              LIVING KINETIC ANATOMY
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-1 bg-[#142032] border border-[#1b2d47] px-2 py-0.5 rounded text-[10px] font-mono tracking-widest text-slate-300 font-bold uppercase">
            SET <span className="text-cyan-400">{Math.min(currentSetNum, exercise.targetSets)}</span> OF {exercise.targetSets}
          </div>
        </div>
      </header>

      {/* 2. MAIN ACTIVE COCKPIT AREA (CONCEPT B HEROIC LIVING ANATOMY CANVAS) */}
      <main className="flex-1 flex flex-col justify-start px-3 py-2 space-y-2.5">
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

        {/* Top Biometric Stream: SmO2, Neural Drive, Fatigue Index */}
        <div className="grid grid-cols-3 gap-1.5">
          {/* SmO2 Oxygen Resupply Meter */}
          <div className="bg-[#0f1724]/90 border border-[#1b2d47] rounded-lg p-2 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                SmO2 OXYGEN
              </span>
              <Droplets className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-cyan-300 font-mono">68</span>
              <span className="text-[9px] text-cyan-400/70 font-mono">%</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-400 to-[#10b981] h-full w-[68%] rounded-full shadow-[0_0_6px_rgba(0,242,254,0.8)]" />
            </div>
            <span className="text-[8px] font-mono text-slate-400 mt-0.5 uppercase tracking-tight">
              LAT RESUPPLY OK
            </span>
          </div>

          {/* Neural Drive & Alpha Recruitment */}
          <div className="bg-[#0f1724]/90 border border-[#1b2d47] rounded-lg p-2 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                NEURAL DRIVE
              </span>
              <Zap className="w-3 h-3 text-[#10b981]" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-[#10b981] font-mono">94.2</span>
              <span className="text-[9px] text-[#10b981]/70 font-mono">%</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-[#10b981] h-full w-[94%] rounded-full shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
            </div>
            <span className="text-[8px] font-mono text-[#10b981]/90 mt-0.5 uppercase tracking-tight font-bold">
              MAX ALPHA DRIVE
            </span>
          </div>

          {/* Neuromuscular Fatigue Index */}
          <div className="bg-[#0f1724]/90 border border-[#1b2d47] rounded-lg p-2 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                FATIGUE INDEX
              </span>
              <Heart className="w-3 h-3 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-amber-400 font-mono">22</span>
              <span className="text-[9px] text-amber-400/70 font-mono">NM</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-gradient-to-r from-[#10b981] via-amber-400 to-rose-500 h-full w-[36%] rounded-full" />
            </div>
            <span className="text-[8px] font-mono text-amber-400 mt-0.5 uppercase tracking-tight">
              REST: {formatDuration(exercise.restSeconds || 90)}
            </span>
          </div>
        </div>

        {/* 3. HERO CENTERPIECE: HOLOGRAPHIC MUSCULOSKELETAL ANATOMY VIEW */}
        {hudViewMode === "anatomy" ? (
          <div className="relative w-full rounded-xl bg-gradient-to-b from-[#08101a] via-[#0b1522] to-[#070b12] border border-[#1b2d47] p-2.5 overflow-hidden shadow-[inset_0_0_30px_rgba(0,242,254,0.06)]">
            {/* Hologram Grid & Scanline Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#162a42_1px,transparent_1px)] [background-size:14px_14px] opacity-35 pointer-events-none" />

            {/* Top Anatomy Status Bar & Action Controls */}
            <div className="relative z-10 flex items-center justify-between border-b border-[#1b2d47]/60 pb-1.5 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-widest uppercase">
                  {targetMuscleLabel} // 3D FIBER MAP
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#10b981]/15 border border-[#10b981]/40 rounded text-[9px] text-[#10b981] font-mono font-bold uppercase tracking-wider">
                  94% LOCK
                </span>
                <button
                  type="button"
                  onClick={() => setHudViewMode("cockpit")}
                  className="px-2 py-0.5 bg-[#142032] hover:bg-[#1b2d47] border border-[#1b2d47] rounded text-[9px] font-mono text-slate-300 hover:text-white transition cursor-pointer"
                  title="Switch to Concentric HUD Ring View"
                >
                  Switch to HUD
                </button>
              </div>
            </div>

            {/* 3D Musculoskeletal Silhouette & Glowing Vector Overlay */}
            <div className="relative w-full h-[210px] flex items-center justify-center">
              <svg
                className="w-full h-full max-h-[210px]"
                viewBox="0 0 360 250"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <radialGradient id="latGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.95" />
                    <stop offset="45%" stopColor="#10b981" stopOpacity="0.85" />
                    <stop offset="85%" stopColor="#059669" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                  </radialGradient>
                  <filter id="glowNeon" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Kinetic Axis Coordinate Grid */}
                <circle cx="180" cy="125" r="110" stroke="#162940" strokeDasharray="2 4" strokeWidth="1" />
                <circle cx="180" cy="125" r="80" stroke="#132338" strokeDasharray="3 5" strokeWidth="1" />
                <line x1="180" y1="10" x2="180" y2="240" stroke="#162940" strokeDasharray="2 3" strokeWidth="1" opacity="0.6" />
                <line x1="20" y1="125" x2="340" y2="125" stroke="#162940" strokeDasharray="2 3" strokeWidth="1" opacity="0.6" />

                {/* Cranium & Cervical Wireframe */}
                <ellipse cx="180" cy="30" rx="13" ry="16" fill="#0d1b2a" opacity="0.8" stroke="#2a4365" strokeWidth="1.2" />
                <path d="M174 46 C 174 52, 186 52, 186 46" fill="none" stroke="#3b5982" strokeWidth="1.2" />

                {/* Clavicle / Upper Trapezius Outline */}
                <path
                  d="M145 60 Q 180 48 215 60 L 235 66 L 268 94 L 254 102 L 226 78 L 195 70 L 180 73 L 165 70 L 134 78 L 106 102 L 92 94 L 125 66 Z"
                  fill="#0a1420"
                  opacity="0.75"
                  stroke="#1f3654"
                  strokeWidth="1"
                />

                {/* Arm Vectors (Abducted & Overhead Tension) */}
                <path d="M106 102 L 75 140 L 56 180 L 44 174 L 65 134 L 94 94" fill="#0b1726" stroke="#254366" strokeWidth="1.2" />
                <path d="M254 102 L 285 140 L 304 180 L 316 174 L 295 134 L 266 94" fill="#0b1726" stroke="#254366" strokeWidth="1.2" />

                {/* Biceps Force Vector Lines */}
                <path d="M82 122 Q 92 134 78 150" filter="url(#glowNeon)" stroke="#00f2fe" strokeLinecap="round" strokeWidth="3" />
                <path d="M278 122 Q 268 134 282 150" filter="url(#glowNeon)" stroke="#00f2fe" strokeLinecap="round" strokeWidth="3" />

                {/* Thoracic & Lumbar Spine Column (T1 - L5) with Vertebral Nodes */}
                <g opacity="0.7">
                  <line x1="180" y1="72" x2="180" y2="195" stroke="#00f2fe" strokeDasharray="3 3" strokeWidth="1" />
                  <circle cx="180" cy="78" r="2.5" fill="#00f2fe" />
                  <circle cx="180" cy="96" r="2.5" fill="#00f2fe" />
                  <circle cx="180" cy="116" r="2.5" fill="#34d399" />
                  <circle cx="180" cy="138" r="3" fill="#10b981" />
                  <circle cx="180" cy="160" r="3.5" fill="#10b981" />
                  <circle cx="180" cy="182" r="2.5" fill="#00f2fe" />
                </g>

                {/* Scapula Left & Right Contour */}
                <polygon points="135,86 158,93 145,122" fill="#0b2434" opacity="0.8" stroke="#2dd4bf" strokeWidth="1.2" />
                <polygon points="225,86 202,93 215,122" fill="#0b2434" opacity="0.8" stroke="#2dd4bf" strokeWidth="1.2" />

                {/* HERO MUSCLE: LATISSIMUS DORSI RADIANT HEATMAP (Left & Right Wings) */}
                <path
                  d="M180 112 Q 152 107 134 91 Q 128 121 138 153 Q 156 179 180 193 Z"
                  fill="url(#latGlow)"
                  filter="url(#glowNeon)"
                  opacity="0.95"
                />
                <path
                  d="M180 112 Q 208 107 226 91 Q 232 121 222 153 Q 204 179 180 193 Z"
                  fill="url(#latGlow)"
                  filter="url(#glowNeon)"
                  opacity="0.95"
                />

                {/* Myofibril Tension Lines (Striations) Left Wing */}
                <g opacity="0.9" stroke="#00f2fe" strokeLinecap="round" strokeWidth="1.5">
                  <path d="M178 118 C 160 116 145 108 136 96" />
                  <path d="M178 130 C 158 128 142 122 134 114" />
                  <path d="M178 143 C 158 142 142 138 136 130" />
                  <path d="M178 158 C 162 158 148 152 140 144" />
                </g>

                {/* Myofibril Tension Lines Right Wing */}
                <g opacity="0.9" stroke="#00f2fe" strokeLinecap="round" strokeWidth="1.5">
                  <path d="M182 118 C 200 116 215 108 224 96" />
                  <path d="M182 130 C 202 128 218 122 226 114" />
                  <path d="M182 143 C 202 142 218 138 224 130" />
                  <path d="M182 158 C 198 158 212 152 220 144" />
                </g>

                {/* Peak Contraction Nodes & Force Vectors */}
                <circle cx="150" cy="134" r="3.5" fill="#34d399" filter="url(#glowNeon)" />
                <line x1="150" y1="134" x2="132" y2="122" stroke="#10b981" strokeWidth="2" />
                <circle cx="210" cy="134" r="3.5" fill="#34d399" filter="url(#glowNeon)" />
                <line x1="210" y1="134" x2="228" y2="122" stroke="#10b981" strokeWidth="2" />

                {/* Real-Time Hologram Callout Leaders */}
                <polyline points="106,94 80,80 32,80" fill="none" opacity="0.85" stroke="#00f2fe" strokeWidth="1.2" />
                <circle cx="106" cy="94" r="2.5" fill="#00f2fe" />

                <polyline points="180,163 220,186 285,186" fill="none" opacity="0.85" stroke="#10b981" strokeWidth="1.2" />
                <circle cx="180" cy="163" r="3" fill="#10b981" />

                <polyline points="280,134 308,118 338,118" fill="none" opacity="0.85" stroke="#8b5cf6" strokeWidth="1" />
                <circle cx="280" cy="134" r="2.5" fill="#8b5cf6" />
              </svg>

              {/* Floating Interactive Biomechanical Data Overlays */}
              <div className="absolute top-4 left-1 bg-[#0f1724]/90 border border-cyan-400/40 px-2 py-0.5 rounded shadow-[0_0_12px_rgba(0,242,254,0.25)] flex flex-col backdrop-blur-sm">
                <span className="text-[7.5px] font-mono font-bold text-cyan-300 uppercase tracking-widest">
                  GLENOHUMERAL
                </span>
                <span className="text-[10px] font-mono font-bold text-white tracking-tight flex items-center gap-1">
                  114° <span className="text-[7.5px] text-[#10b981] font-normal">OPTIMAL ARC</span>
                </span>
              </div>

              <div className="absolute bottom-3 right-1 bg-[#0f1724]/90 border border-[#10b981]/40 px-2 py-0.5 rounded shadow-[0_0_12px_rgba(16,185,129,0.25)] flex flex-col backdrop-blur-sm">
                <span className="text-[7.5px] font-mono font-bold text-[#10b981] uppercase tracking-widest">
                  T7-L1 INSERTION
                </span>
                <span className="text-[10px] font-mono font-bold text-white tracking-tight flex items-center gap-1">
                  96% PEAK <span className="text-[7.5px] text-cyan-400">TENSION</span>
                </span>
              </div>

              <div className="absolute top-10 right-1 bg-[#0f1724]/90 border border-purple-500/40 px-2 py-0.5 rounded shadow flex flex-col backdrop-blur-sm">
                <span className="text-[7px] font-mono font-bold text-purple-400 uppercase tracking-widest">
                  BICEPS SYNERGY
                </span>
                <span className="text-[9px] font-mono font-bold text-slate-200">18% RECRUIT</span>
              </div>
            </div>

            {/* Hologram Footer Telemetry Ticker */}
            <div className="relative z-10 pt-1.5 border-t border-[#1b2d47]/50 flex items-center justify-between text-[9px] font-mono">
              <div className="flex items-center gap-1 text-slate-300">
                <Activity className="w-3 h-3 text-[#10b981]" />
                <span>
                  SCAPULAR DEPRESSION: <span className="text-[#10b981] font-bold">94% LOCKED</span>
                </span>
              </div>
              <div className="text-cyan-400 font-bold tracking-wider uppercase">
                LAT ENERGETICS: OPTIMAL
              </div>
            </div>
          </div>
        ) : (
          /* CONCENTRIC TARGET HUD COCKPIT RING VIEW */
          <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[300px] mx-auto flex items-center justify-center my-1">
            <svg
              className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none"
              viewBox="0 0 320 320"
            >
              <circle cx="160" cy="160" fill="none" r="148" stroke="#1d2025" strokeDasharray="3 5" strokeWidth="2" />
              <circle cx="160" cy="160" fill="none" r="138" stroke="#191c21" strokeWidth="12" />
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
              <circle cx="160" cy="160" fill="none" r="138" stroke="#ee9800" strokeDasharray="28 839" strokeDashoffset="-700" strokeLinecap="butt" strokeWidth="14" />
              <circle cx="160" cy="160" fill="none" r="120" stroke="#32353b" strokeDasharray="1 7" strokeWidth="1" />
              <circle cx="160" cy="160" fill="none" r="108" stroke="#272a30" strokeDasharray="60 4" strokeWidth="4" />
              <line stroke="#4be277" strokeWidth="2" x1="160" x2="160" y1="6" y2="18" />
              <line stroke="#869585" strokeWidth="1" x1="160" x2="160" y1="302" y2="314" />
              <line stroke="#869585" strokeWidth="1" x1="6" x2="18" y1="160" y2="160" />
              <line stroke="#869585" strokeWidth="1" x1="302" x2="314" y1="160" y2="160" />
            </svg>

            <div className="relative z-10 flex flex-col items-center justify-center text-center p-2 max-w-[220px]">
              <div className="flex items-center gap-1 bg-[#182030] px-2 py-0.5 rounded-full mb-1 border border-[#1C2436]">
                <Sliders className="w-2.5 h-2.5 text-[#4be277]" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-300 font-bold truncate max-w-[140px]">
                  {exercise.name}
                </span>
              </div>
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
              <button
                type="button"
                onClick={() => setHudViewMode("anatomy")}
                className="mt-1 text-[9px] font-mono text-cyan-400 hover:underline cursor-pointer"
              >
                Switch to 3D Anatomy Map
              </button>
            </div>
          </div>
        )}

        {/* 4. SOMATOSENSORY LOAD & EXECUTION TELEMETRY CARD */}
        <div className="bg-[#0f1724] border border-[#1b2d47] rounded-xl p-2.5 flex flex-col gap-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded bg-cyan-400 flex-shrink-0" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-200 truncate">
                {exercise.name}
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded flex-shrink-0">
              {exercise.currentWeight} KG LOADED
            </span>
          </div>

          {/* Hero Weight & Rep Counter Counterpart */}
          <div className="flex items-center justify-between bg-[#05080c]/80 border border-[#1b2d47]/80 rounded-lg p-2 px-3">
            {/* Resistance Load */}
            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                TENSION MASS
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide">
                  {exercise.currentWeight}
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold">KG</span>
              </div>
            </div>

            <div className="h-7 w-px bg-[#1b2d47]" />

            {/* Real-Time Reps Locked */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                REP COUNT
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-display text-[#10b981] tracking-wide filter drop-shadow-[0_0_10px_rgba(16,185,129,0.7)]">
                  {String(exercise.currentReps).padStart(2, "0")}
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold">/ {exercise.repHigh}</span>
              </div>
            </div>

            <div className="h-7 w-px bg-[#1b2d47]" />

            {/* Bar Velocity */}
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                BAR VELOCITY
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-cyan-300 font-mono">
                  {estimatedVelocity}
                </span>
                <span className="text-[9px] font-mono text-slate-400">m/s</span>
              </div>
            </div>
          </div>

          {/* Biometric Fiber Tension Waveform Bar */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              <span>ECCENTRIC 3.0s</span>
              <span className="text-cyan-400">ISOMETRIC 1.0s</span>
              <span className="text-[#10b981]">CONCENTRIC EXP</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full flex overflow-hidden p-0.5 border border-[#1b2d47]">
              <div className="h-full bg-purple-500 w-[30%] rounded-l-full" />
              <div className="h-full bg-cyan-400 w-[20%]" />
              <div className="h-full bg-[#10b981] w-[50%] rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
            </div>
          </div>
        </div>

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
                      "border-2 border-cyan-400 bg-cyan-500/20 animate-pulse scale-110 shadow-[0_0_10px_rgba(6,182,212,0.5)]",
                    !isDone && !isCurrent && "bg-[#0f1724] border border-[#1b2d47]"
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
                      : "bg-[#0f1724] border-[#1b2d47] text-slate-200"
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

        {/* Rest Timer Countdown Banner (if rest active) */}
        {restTimerSec !== null && (
          <div className="p-3 bg-[#0f1724] border border-[#1b2d47] rounded-xl flex items-center justify-between text-xs shadow-md animate-in fade-in">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-semibold font-mono">Rest Interval:</span>
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

      {/* 5. LOWER 42% ERGONOMIC THUMB EXECUTION ZONE */}
      <section className="bg-[#05080c] border-t border-[#1b2d47] px-3 pt-2.5 pb-2 space-y-2.5">
        {isExCompleteOrSkipped ? (
          /* ALL SETS COMPLETE: BIOFEEDBACK & NEXT STATION DECK */
          <div className="space-y-2.5 animate-in fade-in duration-200">
            <div className="p-3 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-2.5 shadow-md">
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
                          : "bg-[#05080c] border-[#1b2d47] text-slate-300 hover:text-white hover:bg-[#142032]"
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
                  className="w-full p-2.5 rounded-xl bg-[#05080c] border border-[#1b2d47] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition resize-none"
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
              <div className="p-3 rounded-xl bg-[#05080c] border border-[#1b2d47] space-y-2">
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
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#142032] border border-[#1b2d47] hover:border-amber-500/40 transition group cursor-pointer text-left active:scale-95"
                    >
                      <img
                        src={exercise.equipmentPhotoUrl}
                        alt="Setup preview"
                        className="w-8 h-8 object-cover rounded-lg border border-[#1b2d47]"
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
                      className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-[#142032] transition cursor-pointer"
                    >
                      Retake
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onSnapPhotoClick}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#1b2d47] hover:border-amber-400/60 bg-[#0f1724] hover:bg-[#142032] transition flex items-center justify-center gap-2 text-xs text-slate-300 cursor-pointer active:scale-98"
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
              <div className="p-2.5 bg-[#0f1724] border border-[#1b2d47] rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Machine busy? Jump to station:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {pendingOtherExercises.map(({ ex, idx }) => (
                    <button
                      key={ex.id || idx}
                      type="button"
                      onClick={() => onJumpToExercise(idx)}
                      className="py-1 px-2.5 rounded-lg bg-[#05080c] hover:bg-[#142032] border border-[#1b2d47] hover:border-amber-500/50 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
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
                className="py-2.5 px-3 bg-[#0f1724] hover:bg-[#142032] border border-[#1b2d47] rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Bonus Set</span>
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE SET EXECUTION: REFINED ERGONOMIC THUMB CONTROLS */
          <div className="space-y-2.5">
            {/* Quick Weight Micro-Adjusters */}
            <div className="flex items-center justify-between gap-1.5 px-0.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                Load: {exercise.currentWeight} kg
              </span>
              <div className="flex items-center gap-1">
                {[-5, -2.5, 2.5, 5].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => handleAdjustWeight(delta)}
                    className="px-2.5 py-1 rounded-lg bg-[#0f1724] hover:bg-[#142032] border border-[#1b2d47] hover:border-cyan-400/50 text-[11px] font-mono font-bold text-slate-300 hover:text-white active:scale-95 transition cursor-pointer"
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>
            </div>

            {/* Ergonomic Synaptic Pulse Matrix (1 to 15 Reps Stepper) */}
            <div className="bg-[#0f1724] p-2.5 rounded-xl flex flex-col gap-1.5 border border-[#1b2d47]">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase text-slate-300 font-bold flex items-center gap-1">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  <span>SYNAPTIC RECRUITMENT MATRIX (1-15)</span>
                </span>
                <span className="text-[10px] font-mono text-[#10b981] font-bold">
                  {exercise.currentReps >= exercise.repLow ? "TARGET IN RANGE ✓" : "SUB-RANGE"}
                </span>
              </div>

              {/* Tactile Synaptic Steppers & Pulsing Node Rail */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAdjustReps(exercise.currentReps - 1)}
                  className="w-11 h-11 bg-[#142032] text-slate-200 hover:text-cyan-400 active:scale-95 rounded-lg flex items-center justify-center transition cursor-pointer flex-shrink-0 border border-[#1b2d47]"
                  aria-label="Decrease reps"
                >
                  <span className="text-xl font-bold font-mono">−</span>
                </button>

                <div className="flex-1 bg-[#05080c] border border-[#1b2d47] rounded-lg p-1 flex items-center justify-between gap-0.5 overflow-x-auto no-scrollbar">
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
                            ? "bg-[#10b981] text-[#05080c] font-black text-xs border border-[#34d399] shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-110 z-10"
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
                  className="w-11 h-11 bg-[#142032] text-slate-200 hover:text-cyan-400 active:scale-95 rounded-lg flex items-center justify-center transition cursor-pointer flex-shrink-0 border border-[#1b2d47]"
                  aria-label="Increase reps"
                >
                  <span className="text-xl font-bold font-mono">+</span>
                </button>
              </div>
            </div>

            {/* Somatosensory Neuromuscular Reserve (5-Stage 1-Tap RIR Lock) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  NEUROMUSCULAR RESERVE (RIR LOCK)
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
                            : "bg-gradient-to-b from-amber-400 to-amber-600 border border-amber-400 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-[1.02]"
                          : "bg-[#0f1724] hover:bg-[#142032] border border-[#1b2d47] text-slate-400 hover:text-slate-200"
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
              className="w-full h-15 py-3.5 bg-gradient-to-r from-[#10b981] via-emerald-400 to-cyan-400 text-[#05080c] rounded-xl font-display text-2xl tracking-wider uppercase flex items-center justify-between px-4 shadow-[0_0_24px_rgba(16,185,129,0.45)] hover:shadow-[0_0_30px_rgba(0,242,254,0.6)] active:scale-[0.98] transition-all cursor-pointer font-black"
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

            {/* Floating Gemini Biomechanical Coach Debrief Pill */}
            <div className="w-full bg-[#142032]/90 backdrop-blur-md border border-[#1b2d47]/80 rounded-xl px-3 py-2 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2 truncate">
                <div className="flex items-center gap-0.5 h-4 w-4 flex-shrink-0">
                  <span className="w-1 bg-cyan-400 rounded-full h-2 animate-pulse" />
                  <span className="w-1 bg-[#10b981] rounded-full h-3.5 animate-bounce" />
                  <span className="w-1 bg-purple-400 rounded-full h-2.5 animate-pulse" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-[8.5px] font-mono uppercase text-cyan-400 font-bold tracking-wider flex items-center gap-1">
                    GEMINI BIOMECHANICAL COACH
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  </span>
                  <span className="text-[11px] text-slate-200 truncate">
                    {exercise.formCue
                      ? `"${exercise.formCue}"`
                      : `"Lat peak sustained at 94%. Maintain humeral tuck into rep ${exercise.repHigh}."`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAudioRecordingActive((prev) => !prev)}
                className="w-8 h-8 rounded-lg bg-[#0f1724] hover:bg-[#10b981]/20 border border-[#1b2d47] hover:border-[#10b981]/50 flex items-center justify-center text-slate-300 hover:text-[#10b981] flex-shrink-0 active:scale-95 ml-2 cursor-pointer transition"
                title="Voice Biofeedback Note"
              >
                <Mic className="w-4 h-4 text-cyan-400" />
              </button>
            </div>

            {/* Inline Voice Recorder Drawer (if toggled) */}
            {isAudioRecordingActive && (
              <div className="p-2.5 bg-[#0f1724] border border-cyan-500/40 rounded-xl animate-in fade-in">
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

            {/* Secondary Controls: Station Jump & End Lift Early */}
            <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-400 px-1">
              <button
                type="button"
                onClick={onOpenReorder}
                className="hover:text-cyan-400 flex items-center gap-1 transition cursor-pointer font-mono"
              >
                <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                <span>Station Jump</span>
              </button>
              <button
                type="button"
                onClick={onSkipRemainingSets}
                className="hover:text-amber-400 flex items-center gap-1 transition cursor-pointer font-mono"
              >
                <SkipForward className="w-3 h-3 text-amber-400" />
                <span>End lift early →</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 6. FOOTER NAVIGATION */}
      <footer className="px-3 py-2 border-t border-[#1b2d47] flex items-center justify-between bg-[#05080c]">
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
          className="px-3 py-1.5 rounded-lg bg-[#0f1724] hover:bg-[#142032] border border-[#1b2d47] text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          title="Jump station"
        >
          <ArrowUpDown className="w-3 h-3 text-cyan-400" />
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
