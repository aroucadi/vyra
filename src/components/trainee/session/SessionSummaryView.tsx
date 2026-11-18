"use client";

import React from "react";
import { MapPin, Sparkles, Volume2 } from "lucide-react";
import { appStore } from "@/lib/store";
import { computeExercisePrescription } from "@/lib/progression-adapter";
import { triggerBackupDownload } from "@/lib/storage";
import { OverloadPrescriptionCard } from "@/components/trainee/OverloadPrescriptionCard";
import { MesocycleArchitectCard } from "@/components/trainee/MesocycleArchitectCard";
import { PasskeySyncCard } from "@/components/trainee/PasskeySyncCard";
import { AudioNoteRecorder } from "@/components/trainee/AudioNoteRecorder";
import { GymSelectorDrawer } from "@/components/trainee/GymSelectorDrawer";
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
  const durationMin = Math.max(1, Math.round(sessionDurationSec / 60));
  const userTier: SubscriptionTier =
    (currentUser as User & { tier?: SubscriptionTier }).tier || "PRO";
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
    <div className="flex-1 pb-12 px-4 pt-12 max-w-md mx-auto w-full space-y-8 animate-in zoom-in-95 duration-300">
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

      <div className="grid grid-cols-3 gap-2">
        <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl text-center">
          <div className="text-2xl font-display font-black text-white tabular-nums">
            {totalVolume > 1000
              ? `${(totalVolume / 1000).toFixed(1)}k`
              : totalVolume}
          </div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            Vol (kg)
          </div>
        </div>

        <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl text-center">
          <div className="text-2xl font-display font-black text-white tabular-nums">
            {durationMin}m
          </div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            Duration
          </div>
        </div>

        <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl text-center">
          <div className="text-2xl font-display font-black text-amber-400 tabular-nums">
            {prCount > 0 ? `+${prCount} PR` : "Solid"}
          </div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            Records
          </div>
        </div>
      </div>

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
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition active:scale-95 flex-shrink-0 cursor-pointer"
        >
          Change
        </button>
      </div>

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

      <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed font-body">
          <span className="font-bold text-white">Post-Workout Nutrition: </span>
          Tonnage was high (+{totalVolume} kg). Confirm your recovery shake with
          40g protein and 6.9 g creatine within the next 45 minutes.
        </div>
      </div>

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

      <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5 font-editorial">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>Post-Workout Voice Debrief (Optional)</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Voice Memo
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Record a quick voice note about overall fatigue, pump, joint
          sensations, or football recovery.
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

      <div className="space-y-2">
        <button
          type="button"
          onClick={onReturnToday}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider text-base font-black rounded-2xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          Done · Return to Today
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
          className="w-full py-2.5 bg-[#111622] hover:bg-[#182030] text-slate-400 hover:text-white border border-[#1C2436] text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          Export Full Backup (With Photos &amp; All Data)
        </button>
      </div>

      <GymSelectorDrawer
        isOpen={isGymDrawerOpen}
        onOpenChange={setIsGymDrawerOpen}
        selectedGymId={selectedGym?.id}
        onSelectGym={onSelectGym}
      />
    </div>
  );
}
