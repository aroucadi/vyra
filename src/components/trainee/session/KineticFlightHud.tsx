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
  Check,
  ChevronDown,
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
  // Surgical Refactor: Zero-bloat Living Kinetic Anatomy Cockpit
  const [isRirDrawerOpen, setIsRirDrawerOpen] = useState(false);
  const [isAudioRecordingActive, setIsAudioRecordingActive] = useState(false);

  const completedSetsCount = exercise.completedSets.length;
  const currentSetNum = completedSetsCount + 1;
  const isAllPrescribedComplete = completedSetsCount >= exercise.targetSets;
  const isExCompleteOrSkipped = isAllPrescribedComplete || exercise.skippedRemaining;
  const isFinalExercise = currentExIndex === totalExercises - 1;

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

  // Dynamic Biomechanical Telemetry Strings (Tri-Chroma: Obsidian / Slate / Emerald & Cyan)
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
    ? "SCAPULAR DEPRESSION: 94% LOCKED | LAT ENGAGEMENT OPTIMAL"
    : isPress
    ? "RETRACTION & ARCH: 92% LOCKED | STERNOCIRCULAR PEAK"
    : isLegs
    ? "PELVIC MASTER SWITCH: 96% LOCKED | FASCIAL STACK"
    : isShoulders
    ? "30° SCAPULAR PLANE: 95% ALIGNED | SUPRASPINATUS SAFE"
    : "BIOMECHANICAL TENSION: 95% ALIGNED";

  // Quick weight adjustment helpers
  const handleAdjustWeight = (delta: number) => {
    const next = Math.max(0, exercise.currentWeight + delta);
    onUpdateWeight(Number(next.toFixed(1)));
  };

  const handleAdjustReps = (val: number) => {
    const next = Math.max(1, Math.min(30, val));
    onUpdateReps(next);
  };

  const cycleRir = () => {
    const rirSequence = [2, 1, 0, 3, 4];
    const currentIndex = rirSequence.indexOf(exercise.targetRir);
    const nextRir = rirSequence[(currentIndex + 1) % rirSequence.length];
    onUpdateRir(nextRir);
  };

  return (
    <div className="min-h-screen bg-[#05080c] text-[#E1E7F0] flex flex-col justify-between max-w-md mx-auto w-full select-none font-body pb-safe">
      {/* 1. ULTRA-SLIM 38PX TOP HUD BAR */}
      <header className="sticky top-0 z-40 bg-[#05080c]/95 backdrop-blur-md border-b border-[#1b2d47]/60 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onExit}
            className="w-8 h-8 rounded-lg bg-[#0f1724] border border-[#1b2d47] hover:border-cyan-400/60 flex items-center justify-center text-slate-300 hover:text-cyan-300 active:scale-95 transition cursor-pointer flex-shrink-0"
            title="Exit Workout"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 truncate">
            <span className="font-display text-sm font-black uppercase text-white truncate">
              {exercise.name}
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold flex-shrink-0">
              SET {Math.min(currentSetNum, exercise.targetSets)}/{exercise.targetSets}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#10b981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            <span>
              {Math.floor(sessionDurationSec / 60)}:
              {(sessionDurationSec % 60).toString().padStart(2, "0")}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenReorder}
            className="px-2 py-0.5 rounded-md bg-[#0f1724] border border-[#1b2d47] text-[10px] font-mono text-slate-300 hover:text-white flex items-center gap-1 active:scale-95 cursor-pointer"
            title="Jump station"
          >
            <ArrowUpDown className="w-3 h-3 text-cyan-400" />
            <span>{currentExIndex + 1}/{totalExercises}</span>
          </button>

          <button
            type="button"
            onClick={onSnapPhotoClick}
            className={clsx(
              "w-7 h-7 rounded-md border flex items-center justify-center transition active:scale-95 cursor-pointer",
              exercise.equipmentPhotoUrl
                ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                : "bg-[#0f1724] border-[#1b2d47] text-slate-400 hover:text-white"
            )}
            title="Equipment photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          {exercise.videoUrl && (
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-md bg-[#0f1724] border border-[#1b2d47] flex items-center justify-center text-slate-400 hover:text-cyan-300 transition active:scale-95 cursor-pointer"
              title="Watch form video"
            >
              <Video className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </header>

      {/* 2. MAIN ACTIVE COCKPIT AREA (UPPER 58%: HERO DIGITAL TWIN FLOATING IN VOID) */}
      <main className="flex-1 flex flex-col justify-start px-3 py-1 space-y-1.5 overflow-hidden">
        {/* Superset Station Indicator Banner (if superset) */}
        {(exercise.supersetTag || exercise.subMovementOrder?.match(/[AB]$/)) && (
          <div
            className={clsx(
              "p-2 rounded-lg space-y-1 transition-colors border",
              isStraightMode
                ? "bg-slate-900/90 border-slate-700/80"
                : "bg-indigo-950/60 border-indigo-700/60"
            )}
          >
            <div className="flex items-center justify-between gap-1 flex-wrap text-[10px]">
              <span className="font-mono font-bold text-indigo-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {isStraightMode ? "Straight Sets Mode" : "Station-Locked Superset"}
              </span>
              <button
                type="button"
                onClick={onToggleSupersetMode}
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded border bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-300 transition active:scale-95 cursor-pointer"
              >
                {isStraightMode ? "⚡ Re-link" : "📋 Straight Sets"}
              </button>
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

        {/* 3D HOLOGRAPHIC MUSCULOSKELETAL DIGITAL TWIN FLOATING DIRECTLY IN VOID */}
        <div className="relative w-full h-[240px] sm:h-[260px] flex items-center justify-center overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,242,254,0.06)_0%,transparent_70%)] pointer-events-none" />

          {/* SVG Digital Twin Wireframe */}
          <svg
            className="w-full h-full max-h-[250px]"
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

            {/* Kinetic Axis Coordinate Lines */}
            <circle cx="180" cy="125" r="105" stroke="#162940" strokeDasharray="2 4" strokeWidth="1" opacity="0.6" />
            <circle cx="180" cy="125" r="75" stroke="#132338" strokeDasharray="3 5" strokeWidth="1" opacity="0.6" />

            {/* Cranium & Cervical Wireframe */}
            <ellipse cx="180" cy="28" rx="12" ry="15" fill="#0d1b2a" opacity="0.8" stroke="#2a4365" strokeWidth="1.2" />
            <path d="M174 44 C 174 50, 186 50, 186 44" fill="none" stroke="#3b5982" strokeWidth="1.2" />

            {/* Clavicle / Upper Trapezius Wireframe Outline */}
            <path
              d="M145 58 Q 180 46 215 58 L 235 64 L 268 92 L 254 100 L 226 76 L 195 68 L 180 71 L 165 68 L 134 76 L 106 100 L 92 92 L 125 64 Z"
              fill="#0a1420"
              opacity="0.75"
              stroke="#1f3654"
              strokeWidth="1"
            />

            {/* Arm Vectors (Overhead / Pull tension) */}
            <path d="M106 100 L 75 138 L 56 178 L 44 172 L 65 132 L 94 92" fill="#0b1726" stroke="#254366" strokeWidth="1.2" />
            <path d="M254 100 L 285 138 L 304 178 L 316 172 L 295 132 L 266 92" fill="#0b1726" stroke="#254366" strokeWidth="1.2" />

            {/* Biceps & Forearm Tension Lines */}
            <path d="M82 120 Q 92 132 78 148" filter="url(#glowNeon)" stroke="#00f2fe" strokeLinecap="round" strokeWidth="3" />
            <path d="M278 120 Q 268 132 282 148" filter="url(#glowNeon)" stroke="#00f2fe" strokeLinecap="round" strokeWidth="3" />

            {/* Spine Column (T1 - L5) with Vertebral Nodes */}
            <g opacity="0.7">
              <line x1="180" y1="70" x2="180" y2="190" stroke="#00f2fe" strokeDasharray="3 3" strokeWidth="1" />
              <circle cx="180" cy="76" r="2.5" fill="#00f2fe" />
              <circle cx="180" cy="94" r="2.5" fill="#00f2fe" />
              <circle cx="180" cy="114" r="2.5" fill="#34d399" />
              <circle cx="180" cy="136" r="3" fill="#10b981" />
              <circle cx="180" cy="158" r="3.5" fill="#10b981" />
              <circle cx="180" cy="180" r="2.5" fill="#00f2fe" />
            </g>

            {/* Scapular Polygons */}
            <polygon points="135,84 158,91 145,120" fill="#0b2434" opacity="0.8" stroke="#2dd4bf" strokeWidth="1.2" />
            <polygon points="225,84 202,91 215,120" fill="#0b2434" opacity="0.8" stroke="#2dd4bf" strokeWidth="1.2" />

            {/* HERO RADIANT HEATMAP: LATISSIMUS DORSI WINGS */}
            <path
              d="M180 110 Q 152 105 134 89 Q 128 119 138 151 Q 156 177 180 191 Z"
              fill="url(#latGlow)"
              filter="url(#glowNeon)"
              opacity="0.95"
            />
            <path
              d="M180 110 Q 208 105 226 89 Q 232 119 222 151 Q 204 177 180 191 Z"
              fill="url(#latGlow)"
              filter="url(#glowNeon)"
              opacity="0.95"
            />

            {/* Myofibril Tension Striations */}
            <g opacity="0.9" stroke="#00f2fe" strokeLinecap="round" strokeWidth="1.5">
              <path d="M178 116 C 160 114 145 106 136 94" />
              <path d="M178 128 C 158 126 142 120 134 112" />
              <path d="M178 141 C 158 140 142 136 136 128" />
              <path d="M178 156 C 162 156 148 150 140 142" />

              <path d="M182 116 C 200 114 215 106 224 94" />
              <path d="M182 128 C 202 126 218 120 226 112" />
              <path d="M182 141 C 202 140 218 136 224 128" />
              <path d="M182 156 C 198 156 212 150 220 142" />
            </g>

            {/* Contraction Nodes & Force Vectors */}
            <circle cx="150" cy="132" r="3.5" fill="#34d399" filter="url(#glowNeon)" />
            <line x1="150" y1="132" x2="132" y2="120" stroke="#10b981" strokeWidth="2" />
            <circle cx="210" cy="132" r="3.5" fill="#34d399" filter="url(#glowNeon)" />
            <line x1="210" y1="132" x2="228" y2="120" stroke="#10b981" strokeWidth="2" />

            {/* Minimal Vector Callout Lines */}
            <polyline points="106,92 80,78 32,78" fill="none" opacity="0.85" stroke="#00f2fe" strokeWidth="1.2" />
            <circle cx="106" cy="92" r="2.5" fill="#00f2fe" />

            <polyline points="180,161 220,184 285,184" fill="none" opacity="0.85" stroke="#10b981" strokeWidth="1.2" />
            <circle cx="180" cy="161" r="3" fill="#10b981" />
          </svg>

          {/* Minimal Floating Joint Anchors */}
          <div className="absolute top-4 left-1 bg-[#05080c]/80 border border-cyan-400/40 px-2 py-0.5 rounded text-[8px] font-mono font-bold text-cyan-300 backdrop-blur-sm">
            GLENOHUMERAL: 114°
          </div>

          <div className="absolute bottom-4 right-1 bg-[#05080c]/80 border border-[#10b981]/40 px-2 py-0.5 rounded text-[8px] font-mono font-bold text-[#10b981] backdrop-blur-sm">
            T7-L1: 96% TENSION
          </div>
        </div>

        {/* Quiet Biomechanical Lock Ticker */}
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 px-1">
          <span className="flex items-center gap-1 truncate text-slate-300">
            <span className="text-[#10b981]">●</span>
            {bioLockTitle}
          </span>
          <span className="text-cyan-400 font-bold flex-shrink-0">OPTIMAL</span>
        </div>

        {/* Set Dots Progression */}
        <div className="flex items-center justify-center gap-2 py-0.5">
          {Array.from({ length: exercise.targetSets }).map((_, idx) => {
            const isDone = idx < completedSetsCount;
            const isCurrent = idx === completedSetsCount;
            return (
              <span
                key={idx}
                className={clsx(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  isDone && "bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)] scale-100",
                  isCurrent && "border-2 border-cyan-400 bg-cyan-400/30 animate-pulse scale-110",
                  !isDone && !isCurrent && "bg-[#142032] border border-[#1b2d47]"
                )}
              />
            );
          })}
        </div>

        {/* Rest Interval Active Banner (if rest active) */}
        {restTimerSec !== null && (
          <div className="p-2.5 bg-[#0f1724] border border-[#1b2d47] rounded-xl flex items-center justify-between text-xs animate-in fade-in shadow-md">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="font-mono text-slate-400">Rest:</span>
              <span className="font-display font-black text-amber-400 text-base tabular-nums">
                {restTimerSec}s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleSound}
                className="p-1 rounded text-slate-400 hover:text-white transition"
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
                className="text-[11px] font-mono font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Skip</span>
                <FastForward className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. LOWER 42%: SINGLE-THUMB ERGONOMIC EXECUTION ZONE */}
      <section className="bg-[#05080c] border-t border-[#1b2d47] px-3 pt-2 pb-2 space-y-2">
        {isExCompleteOrSkipped ? (
          /* POST-EXERCISE REFLECTION & COMPLETION DECK */
          <div className="space-y-2.5 animate-in fade-in duration-200">
            <div className="p-3 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-2 shadow-md">
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

              {/* Biofeedback Tags */}
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

              {/* Text Note Input */}
              <textarea
                value={exercise.feedbackNote || ""}
                onChange={(e) => onUpdateFeedbackNote(e.target.value)}
                placeholder="e.g. Pin 4, right elbow smooth, 2.5kg micro-plates used..."
                rows={2}
                className="w-full p-2.5 rounded-xl bg-[#05080c] border border-[#1b2d47] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition resize-none"
              />

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
          <div className="space-y-2">
            {/* 3.1 MERGED UNIFIED LOAD BAR (LOAD · REPS · RIR) */}
            <div className="bg-[#0f1724] border border-[#1b2d47] rounded-xl p-2 flex items-center justify-between gap-1 shadow-sm">
              {/* Load & Quick Micro-Adjusters */}
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col">
                  <span className="text-[8.5px] font-mono text-slate-400 uppercase font-bold">
                    LOAD
                  </span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-black font-display text-white">
                      {exercise.currentWeight}
                    </span>
                    <span className="text-[9px] font-mono text-cyan-400 font-bold">KG</span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 ml-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustWeight(-2.5)}
                    className="w-6 h-6 rounded bg-[#142032] hover:bg-[#1b2d47] text-[10px] font-mono font-bold text-slate-300 flex items-center justify-center active:scale-95 transition cursor-pointer"
                    title="-2.5kg"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustWeight(2.5)}
                    className="w-6 h-6 rounded bg-[#142032] hover:bg-[#1b2d47] text-[10px] font-mono font-bold text-slate-300 flex items-center justify-center active:scale-95 transition cursor-pointer"
                    title="+2.5kg"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="h-7 w-px bg-[#1b2d47]" />

              {/* Rep Target Display */}
              <div className="flex flex-col items-center">
                <span className="text-[8.5px] font-mono text-slate-400 uppercase font-bold">
                  REPS
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black font-display text-[#10b981] filter drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]">
                    {String(exercise.currentReps).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    / {exercise.repHigh}
                  </span>
                </div>
              </div>

              <div className="h-7 w-px bg-[#1b2d47]" />

              {/* RIR Tactical Lock Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRirDrawerOpen((prev) => !prev)}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer",
                    exercise.targetRir === 0
                      ? "bg-rose-600/20 border-rose-500 text-rose-300"
                      : exercise.targetRir === 2
                      ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                      : "bg-[#142032] border-[#1b2d47] text-slate-300 hover:text-white"
                  )}
                  title="Tap to adjust RIR"
                >
                  <span className="text-[9px] text-slate-400 uppercase">RIR</span>
                  <span className="text-sm font-extrabold">{exercise.targetRir}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* 1-Tap RIR Pop-up Strip */}
                {isRirDrawerOpen && (
                  <div className="absolute right-0 bottom-full mb-1 z-50 bg-[#0f1724] border border-cyan-500/40 rounded-xl p-1 shadow-2xl flex items-center gap-1 animate-in zoom-in-95">
                    {[
                      { rir: 0, label: "0 FAIL", cls: "hover:bg-rose-600 hover:text-white text-rose-400" },
                      { rir: 1, label: "1 RIR", cls: "hover:bg-cyan-600 hover:text-white text-slate-300" },
                      { rir: 2, label: "2 LOCK", cls: "bg-amber-500 text-slate-950 font-bold" },
                      { rir: 3, label: "3 RIR", cls: "hover:bg-cyan-600 hover:text-white text-slate-300" },
                      { rir: 4, label: "4+ SUB", cls: "hover:bg-slate-700 text-slate-400" },
                    ].map((btn) => (
                      <button
                        key={btn.rir}
                        type="button"
                        onClick={() => {
                          onUpdateRir(btn.rir);
                          setIsRirDrawerOpen(false);
                        }}
                        className={clsx(
                          "px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold transition active:scale-95 cursor-pointer whitespace-nowrap",
                          exercise.targetRir === btn.rir
                            ? btn.cls
                            : "bg-[#05080c] text-slate-300 hover:text-white"
                        )}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3.2 SYNAPTIC REP SWEEP RAIL (1 - 15) */}
            <div className="bg-[#0f1724] p-1.5 rounded-xl flex items-center gap-1 border border-[#1b2d47]">
              <button
                type="button"
                onClick={() => handleAdjustReps(exercise.currentReps - 1)}
                className="w-10 h-10 bg-[#142032] text-slate-200 hover:text-cyan-400 active:scale-95 rounded-lg flex items-center justify-center transition cursor-pointer flex-shrink-0 border border-[#1b2d47]"
                aria-label="Decrease reps"
              >
                <span className="text-lg font-bold font-mono">−</span>
              </button>

              <div className="flex-1 bg-[#05080c] border border-[#1b2d47] rounded-lg p-0.5 flex items-center justify-between gap-0.5 overflow-x-auto no-scrollbar">
                {Array.from({ length: 15 }, (_, i) => i + 1).map((r) => {
                  const isActive = r === exercise.currentReps;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleAdjustReps(r)}
                      className={clsx(
                        "h-8 min-w-[20px] flex items-center justify-center font-mono rounded transition-all cursor-pointer",
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
                className="w-10 h-10 bg-[#142032] text-slate-200 hover:text-cyan-400 active:scale-95 rounded-lg flex items-center justify-center transition cursor-pointer flex-shrink-0 border border-[#1b2d47]"
                aria-label="Increase reps"
              >
                <span className="text-lg font-bold font-mono">+</span>
              </button>
            </div>

            {/* 3.3 GEMINI COACH 1-LINE QUIET SUB-TICKER (DOCKED ABOVE BUTTON) */}
            <div className="px-1 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <div className="flex items-center gap-0.5 h-3 w-3 flex-shrink-0">
                  <span className="w-0.5 bg-cyan-400 rounded-full h-1.5 animate-pulse" />
                  <span className="w-0.5 bg-[#10b981] rounded-full h-3 animate-bounce" />
                  <span className="w-0.5 bg-cyan-400 rounded-full h-2 animate-pulse" />
                </div>
                <span className="text-[11px] text-slate-400 truncate">
                  {exercise.formCue
                    ? `"${exercise.formCue}"`
                    : `"Lat peak sustained. Maintain humeral tuck into rep ${exercise.repHigh}."`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsAudioRecordingActive((prev) => !prev)}
                className="w-6 h-6 rounded bg-[#142032] hover:bg-[#1b2d47] flex items-center justify-center text-slate-300 hover:text-cyan-400 flex-shrink-0 active:scale-95 transition cursor-pointer"
                title="Voice Biofeedback Note"
              >
                <Mic className="w-3 h-3 text-cyan-400" />
              </button>
            </div>

            {/* Inline Voice Recorder Drawer (if toggled) */}
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

            {/* 3.4 GIANT 64PX PRIMARY CTA: LOG SET & REST (ABSOLUTE BOTTOM ANCHOR) */}
            <button
              type="button"
              onClick={onLogSet}
              className="w-full h-15 py-3 bg-gradient-to-r from-[#10b981] via-emerald-400 to-cyan-400 text-[#05080c] rounded-xl font-display text-2xl tracking-wider uppercase flex items-center justify-between px-4 shadow-[0_0_24px_rgba(16,185,129,0.45)] hover:shadow-[0_0_30px_rgba(0,242,254,0.6)] active:scale-[0.98] transition-all cursor-pointer font-black"
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

      {/* 4. FOOTER NAVIGATION: QUIET STATION CONTROLS */}
      <footer className="px-3 py-1.5 border-t border-[#1b2d47] flex items-center justify-between bg-[#05080c] text-[11px] font-mono">
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
          onClick={onSkipRemainingSets}
          className="text-slate-400 hover:text-amber-400 transition cursor-pointer"
        >
          End lift early →
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
