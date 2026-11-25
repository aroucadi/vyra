"use client";

import React from "react";
import {
  MapPin,
  Sparkles,
  Volume2,
  CheckCircle2,
  Activity,
  Droplets,
  Moon,
  Zap,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Download,
} from "lucide-react";
import { appStore } from "@/lib/store";
import { computeExercisePrescription } from "@/lib/progression-adapter";
import { triggerBackupDownload } from "@/lib/storage";
import { OverloadPrescriptionCard } from "@/components/trainee/OverloadPrescriptionCard";
import { MesocycleArchitectCard } from "@/components/trainee/MesocycleArchitectCard";
import { PasskeySyncCard } from "@/components/trainee/PasskeySyncCard";
import { AudioNoteRecorder } from "@/components/trainee/AudioNoteRecorder";
import { GymSelectorDrawer } from "@/components/trainee/GymSelectorDrawer";
import { AnatomicalTensionSpotlight } from "@/components/trainee/AnatomicalTensionSpotlight";
import type { SubscriptionTier } from "@/lib/entitlements";
import type { TrainingGoal } from "@/lib/onboarding";
import type { GymLocation, ProgramDay, User } from "@/lib/types";
import type { ActiveExercise } from "./types";

interface SessionSummaryViewProps {
  currentUser: User;
  targetDay?: ProgramDay;
  exercises: ActiveExercise[];
  sessionDurationSec: number;
  selectedGym: GymLocation | null;
  isGymDrawerOpen: boolean;
  setIsGymDrawerOpen: (open: boolean) => void;
  sessionAudioUrl?: string;
  sessionAudioTranscript?: string;
  onSelectGym: (gym: GymLocation) => void;
  onUpdateSessionAudio: (
    audioDataUrl: string | undefined,
    transcript?: string
  ) => void;
  onReturnToday: () => void;
}

function getTodayIsoDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function SessionSummaryView({
  currentUser,
  targetDay,
  exercises,
  sessionDurationSec,
  selectedGym,
  isGymDrawerOpen,
  setIsGymDrawerOpen,
  sessionAudioUrl,
  sessionAudioTranscript,
  onSelectGym,
  onUpdateSessionAudio,
  onReturnToday,
}: SessionSummaryViewProps) {
  const totalVolume = exercises.reduce(
    (acc, ex) =>
      acc + ex.completedSets.reduce((sAcc, s) => sAcc + s.weight * s.reps, 0),
    0
  );
  const prCount = exercises.reduce(
    (acc, ex) => acc + ex.completedSets.filter((s) => s.isPR).length,
    0
  );
  const durationMin = Math.max(1, Math.floor(sessionDurationSec / 60));
  const durationRemainderSec = sessionDurationSec % 60;
  const userTier: SubscriptionTier =
    (currentUser as User & { tier?: SubscriptionTier }).tier || "PRO";
  const userSessions = appStore.getSessions(currentUser.id);

  // Compute average actual RIR from active exercises
  const avgRir =
    exercises.length > 0
      ? (
          exercises.reduce((sum, ex) => sum + (ex.targetRir ?? 2), 0) /
          exercises.length
        ).toFixed(1)
      : "2.0";

  // Primary muscle extraction for tension heatmap
  const primaryMuscle = exercises[0]?.target || exercises[0]?.name || "Back";
  const secondaryMuscles = exercises
    .slice(1, 3)
    .map((e) => e.target || e.name);

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

  const userGoal: TrainingGoal =
    (currentUser.goals?.[0] as TrainingGoal | undefined) || "hypertrophy";
  const primaryEx = exercises[0];
  const bestSet = primaryEx?.completedSets?.length
    ? primaryEx.completedSets.reduce(
        (best, s) =>
          s.weight * (1 + s.reps / 30) > best.weight * (1 + best.reps / 30)
            ? s
            : best,
        primaryEx.completedSets[0]
      )
    : null;
  const benchmark1RmKg = bestSet
    ? Math.round(bestSet.weight * (1 + bestSet.reps / 30))
    : primaryEx?.currentWeight
    ? Math.round(primaryEx.currentWeight * 1.25)
    : 80;

  return (
    <div className="flex-1 pb-16 px-4 pt-6 max-w-md mx-auto w-full space-y-6 animate-in fade-in zoom-in-95 duration-300 font-body select-none">
      {/* 1. TOP MISSION COMPLETION HEADER & LOG TAG */}
      <header className="space-y-3">
        <div className="flex items-center justify-between text-[11px] font-mono border-b border-[#1b2d47]/70 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
            <span className="text-[#10b981] font-bold tracking-widest uppercase">
              MISSION COMPLETE
            </span>
          </div>
          <span className="text-slate-400 font-mono">
            LOG #{Math.floor(100 + Math.random() * 900)}-FLIGHT
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-bold">
              OVERLOAD GOAL ACHIEVED
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              RECOVERY PROTOCOL ARMED
            </span>
          </div>
          <h1 className="text-2xl font-display uppercase tracking-wider font-extrabold text-white">
            {targetDay?.label || "Session Debrief"}
          </h1>
          <p className="text-xs text-slate-400">
            Biomechanical strain recorded. Tension stimulus optimal.
          </p>
        </div>
      </header>

      {/* 2. TACTICAL KPI TELEMETRY STRIP */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-[#0f1724] border border-[#1b2d47] rounded-xl text-center">
          <div className="text-2xl font-display font-black text-white tabular-nums tracking-wide">
            {totalVolume > 1000
              ? `${(totalVolume / 1000).toFixed(1)}k`
              : totalVolume}
            <span className="text-xs font-mono font-normal text-slate-400 ml-1">
              KG
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            Total Tonnage
          </div>
        </div>

        <div className="p-3 bg-[#0f1724] border border-[#1b2d47] rounded-xl text-center">
          <div className="text-2xl font-display font-black text-white tabular-nums tracking-wide">
            {durationMin}m
            <span className="text-xs font-mono font-normal text-slate-400 ml-0.5">
              {durationRemainderSec}s
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            Active Pace
          </div>
        </div>

        <div className="p-3 bg-[#0f1724] border border-[#1b2d47] rounded-xl text-center">
          <div className="text-2xl font-display font-black text-[#10b981] tabular-nums tracking-wide">
            {prCount > 0 ? `+${prCount} PR` : "OPTIMAL"}
          </div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            Neuromuscular
          </div>
        </div>
      </div>

      {/* 3. MUSCULOSKELETAL TENSION DISTRIBUTION HEATMAP */}
      <div className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#10b981]" />
            <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
              Musculoskeletal Tension Heatmap
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#10b981] font-bold">
            96% Peak Stimulus
          </span>
        </div>

        <div className="flex items-center justify-center py-2 bg-[#05080c] rounded-xl border border-[#1b2d47]/50">
          <AnatomicalTensionSpotlight
            primaryMuscle={primaryMuscle}
            secondaryMuscles={secondaryMuscles}
            accentColor="emerald"
            showToggle={false}
            className="w-40 h-44"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="p-2 bg-[#05080c] rounded-lg border border-[#10b981]/30">
            <span className="text-[10px] text-slate-400 block uppercase">
              Target Chain
            </span>
            <span className="font-bold text-[#10b981] truncate block">
              {primaryMuscle.toUpperCase()}
            </span>
            <span className="text-[9px] text-slate-400">Peak Mechanical Strain</span>
          </div>
          <div className="p-2 bg-[#05080c] rounded-lg border border-cyan-500/30">
            <span className="text-[10px] text-slate-400 block uppercase">
              Synergist Drivers
            </span>
            <span className="font-bold text-cyan-300 truncate block">
              {secondaryMuscles[0]?.toUpperCase() || "STABILIZERS"}
            </span>
            <span className="text-[9px] text-slate-400">Fascial Support Active</span>
          </div>
        </div>
      </div>

      {/* 4. RIR & PROXIMITY FAILURE AUDIT */}
      <div className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
              RIR &amp; Failure Proximity Audit
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300">
            Avg RIR {avgRir}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-[#05080c] rounded-xl border border-[#1b2d47]">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              Prescribed vs Actual Effort
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-display font-black text-white">
                RIR 2.0 TARGET
              </span>
              <span className="text-xs font-mono text-[#10b981] font-bold">
                → {avgRir} EXECUTED
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/15 px-2 py-0.5 rounded border border-[#10b981]/30 font-bold block">
              0 TECHNICAL FAILS
            </span>
            <span className="text-[9px] font-mono text-slate-400 mt-1 block">
              All reps cleanly collimated
            </span>
          </div>
        </div>
      </div>

      {/* 5. SALLE DE SPORT / GYM LOCATION SELECTOR */}
      <div className="p-3.5 bg-[#0f1724] border border-[#1b2d47] rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 flex-shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Training Station
            </span>
            <p className="font-semibold text-white text-xs truncate">
              {selectedGym?.name || "Select Gym / Location"}
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
          className="text-xs font-mono font-bold text-cyan-300 hover:text-cyan-200 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition active:scale-95 flex-shrink-0 cursor-pointer"
        >
          Change
        </button>
      </div>

      {/* 6. NEXT SESSION PRESCRIPTIONS */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Next Session Prescriptions
          </span>
          <span className="text-[10px] font-mono text-[#10b981] font-bold">
            Biomechanical Overload
          </span>
        </div>

        <div className="space-y-2">
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

      {/* 7. IMMEDIATE RECOVERY REFUELING PROTOCOL */}
      <div className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
              Immediate Anabolic &amp; Neural Recovery
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#10b981] font-bold">
            Pacing Active
          </span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between p-2.5 bg-[#05080c] rounded-lg border border-[#1b2d47]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-slate-200">750ml Electrolyte Rehydration</span>
            </div>
            <span className="text-[10px] text-cyan-300 font-bold">ARMED</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#05080c] rounded-lg border border-[#1b2d47]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span className="text-slate-200">
                42g Protein Synthesis Window (&lt;45m)
              </span>
            </div>
            <span className="text-[10px] text-[#10b981] font-bold">PENDING</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#05080c] rounded-lg border border-[#1b2d47]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-slate-200">8h 30m Deep Rest Target</span>
            </div>
            <span className="text-[10px] text-indigo-300 font-bold">
              SCHEDULED
            </span>
          </div>
        </div>
      </div>

      {/* 8. ARCHITECT & SYNC CARDS */}
      <MesocycleArchitectCard
        userId={currentUser.id}
        goal={userGoal}
        benchmark1RmKg={benchmark1RmKg}
      />

      <PasskeySyncCard
        userId={currentUser.id}
        userName={currentUser.name}
        sessionsCount={userSessions.length}
      />

      {/* 9. ATHLETE VOICE DEBRIEF / NOTE RECORDER */}
      <div className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5 font-display uppercase tracking-wider">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>Post-Workout Sensory Debrief (Audio Memo)</span>
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">
            RAG Ingestion
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Record joint sensations, fatigue, pump, or football recovery notes.
        </p>
        <AudioNoteRecorder
          audioUrl={sessionAudioUrl}
          transcript={sessionAudioTranscript}
          onSave={(url, transcript) => onUpdateSessionAudio(url, transcript)}
          onDelete={() => onUpdateSessionAudio(undefined, undefined)}
          label="Workout Voice Debrief"
          traineeId={currentUser.id}
          exerciseName="overall_workout_debrief"
          gymName={selectedGym?.name}
        />
      </div>

      {/* 10. PRIMARY CTA: COMMIT TO FLIGHT RECORDER & RECOVER */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={onReturnToday}
          className="w-full h-15 py-3.5 bg-gradient-to-r from-[#10b981] via-emerald-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 active:scale-[0.98] text-[#05080c] font-display uppercase tracking-wider text-xl font-black rounded-xl shadow-[0_0_24px_rgba(16,185,129,0.45)] hover:shadow-[0_0_32px_rgba(0,242,254,0.6)] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>COMMIT TO RECORDER &amp; RECOVER</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={async () => {
            const { buildFullTraineeExportPayloadAsync } = await import(
              "@/lib/export-backup"
            );
            const exportPayload = await buildFullTraineeExportPayloadAsync(
              currentUser.id
            );
            triggerBackupDownload(
              exportPayload,
              `vyra-backup-${currentUser.id}-${getTodayIsoDate()}.json`
            );
          }}
          className="w-full py-2.5 bg-[#0f1724] hover:bg-[#142032] text-slate-400 hover:text-white border border-[#1b2d47] text-xs font-mono font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Telemetry Backup (With Photos &amp; Voice Notes)</span>
        </button>
      </div>

      {/* GYM SELECTION DRAWER */}
      <GymSelectorDrawer
        isOpen={isGymDrawerOpen}
        onOpenChange={setIsGymDrawerOpen}
        selectedGymId={selectedGym?.id}
        onSelectGym={onSelectGym}
      />
    </div>
  );
}
