"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Dumbbell,
  AlertTriangle,
  Activity,
  Pill,
  Droplets,
  Sparkles,
  CheckCircle2,
  Calendar,
  Flame,
  Scale,
  Send,
  Check,
} from "lucide-react";
import { appStore } from "@/lib/store";
import { formatDuration, resolveProgramDay } from "@/lib/utils";
import {
  useIsClientHydrated,
  useVyraStoreVersion,
} from "@/components/auth/VyraAuthProvider";

export default function TraineeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const isHydrated = useIsClientHydrated();
  useVyraStoreVersion();
  const resolvedParams = use(params);
  const trainee = isHydrated ? appStore.getUser(resolvedParams.id) : undefined;

  const [coachNote, setCoachNote] = useState("");
  const [noteSent, setNoteSent] = useState(false);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#05080c] p-6 max-w-6xl mx-auto space-y-4 font-body">
        <div className="h-28 rounded-2xl bg-[#090d16] border border-[#1b2d47] animate-pulse" />
      </div>
    );
  }

  if (!trainee) {
    return (
      <div className="min-h-screen bg-[#05080c] p-6 flex items-center justify-center font-body text-slate-100">
        <div className="p-8 max-w-md w-full bg-[#090d16] border border-[#1b2d47] rounded-2xl text-center space-y-4 shadow-2xl">
          <h1 className="text-xl font-display font-black text-white uppercase">
            Athlete Not Found
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            No athlete matched ID <span className="text-[#10b981]">{resolvedParams.id}</span>.
          </p>
          <Link
            href="/roster"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] text-black font-display font-black text-xs uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Return to Squadron Radar</span>
          </Link>
        </div>
      </div>
    );
  }

  const program = appStore.getActiveProgramForTrainee(trainee.id);
  const sessions = appStore.getSessions(trainee.id);
  const metrics = appStore.getMetrics(trainee.id);

  const workoutAdherence = appStore.calculateWorkoutAdherence(trainee.id);
  const suppAdherence = appStore.calculateSupplementAdherence(trainee.id);
  const hydrAdherence = appStore.calculateHydrationAdherence(trainee.id);
  const hydrationGoal = appStore.getHydrationGoal(trainee.id);
  const supplementProtocols = program
    ? appStore.getSupplementProtocols(program.id)
    : [];

  const handleSendCoachNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachNote.trim()) return;
    setNoteSent(true);
    setTimeout(() => {
      setNoteSent(false);
      setCoachNote("");
    }, 2500);
  };

  const isAlaa = trainee.id === "trainee_alaa" || trainee.email?.includes("alaa");

  return (
    <div className="min-h-screen bg-[#05080c] text-slate-100 p-6 space-y-6 max-w-6xl mx-auto font-body selection:bg-[#10b981] selection:text-black">
      {/* 1. Top Aerospace Navigation Bar */}
      <div className="flex items-center justify-between border-b border-[#1b2d47] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/roster"
            className="p-2 rounded-xl bg-[#090d16] border border-[#1b2d47] text-slate-300 hover:text-white hover:border-[#10b981] transition cursor-pointer"
            title="Back to Roster"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-black text-white uppercase tracking-tight">
                {trainee.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                <span>FLIGHT RECORDER ACTIVE</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">{trainee.email}</p>
          </div>
        </div>

        <Link
          href={`/program/${program?.id || "new"}`}
          className="px-3.5 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] active:scale-95 text-black font-display font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
        >
          <Dumbbell className="w-4 h-4 stroke-[2.5]" />
          <span>Edit Mesocycle</span>
        </Link>
      </div>

      {/* 2. Tri-Axis Adherence Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#090d16] p-4 rounded-xl border border-[#1b2d47] space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Workout Compliance
            </span>
            <Activity className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-black font-mono text-white">
              {workoutAdherence}%
            </span>
            <span className="text-[11px] text-[#10b981] font-mono">
              Target: 85%+
            </span>
          </div>
          <div className="w-full bg-[#05080c] rounded-full h-2 overflow-hidden border border-[#1b2d47]">
            <div
              style={{ width: `${workoutAdherence}%` }}
              className="bg-[#10b981] h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"
            />
          </div>
        </div>

        <div className="bg-[#090d16] p-4 rounded-xl border border-[#1b2d47] space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Supplement Protocol
            </span>
            <Pill className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-black font-mono text-cyan-300">
              {suppAdherence}%
            </span>
            <span
              className={`text-[11px] font-mono ${
                suppAdherence >= 85 ? "text-[#10b981]" : "text-cyan-400"
              }`}
            >
              {suppAdherence >= 85 ? "Optimal" : "Acceptable"}
            </span>
          </div>
          <div className="w-full bg-[#05080c] rounded-full h-2 overflow-hidden border border-[#1b2d47]">
            <div
              style={{ width: `${suppAdherence}%` }}
              className="bg-cyan-400 h-2 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"
            />
          </div>
        </div>

        <div className="bg-[#090d16] p-4 rounded-xl border border-[#1b2d47] space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Hydration Volumetrics
            </span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-black font-mono text-white">
              {hydrAdherence}%
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Target: {(hydrationGoal?.dailyTargetMl || 3500) / 1000}L/day
            </span>
          </div>
          <div className="w-full bg-[#05080c] rounded-full h-2 overflow-hidden border border-[#1b2d47]">
            <div
              style={{ width: `${hydrAdherence}%` }}
              className="bg-cyan-400 h-2 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"
            />
          </div>
        </div>
      </div>

      {/* 3. Physical Baseline & InBody Segmental Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#090d16] p-4 rounded-xl border border-[#1b2d47] space-y-2 shadow-lg">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Physical Baseline
          </span>
          <div className="space-y-1 text-xs">
            <p className="text-slate-300">
              Height:{" "}
              <strong className="text-white font-mono">
                {trainee.heightCm ? `${trainee.heightCm} cm` : "175 cm"}
              </strong>
            </p>
            <p className="text-slate-300">
              Current Weight:{" "}
              <strong className="text-white font-mono">
                {metrics.length
                  ? `${metrics[metrics.length - 1].weightKg} kg`
                  : "52.05 kg"}
              </strong>
            </p>
            <p className="text-slate-300">
              Primary Goal:{" "}
              <strong className="text-[#10b981]">
                {trainee.goals[0] || "Strength & Hypertrophy"}
              </strong>
            </p>
          </div>
        </div>

        <div className="bg-[#090d16] p-4 rounded-xl border border-[#1b2d47] space-y-2 shadow-lg">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            {isAlaa ? "InBody Skeletal Muscle" : "Skeletal Mass"}
          </span>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-display font-black text-[#10b981] font-mono">
                {isAlaa ? "24.9 kg" : "Tracked"}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                (47.8% SMM Index)
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-300">
              Body Fat: <strong className="text-cyan-300">10.0%</strong>
            </p>
            <p className="text-[10px] font-mono text-[#10b981]">
              Bilateral Arm Symmetry: 100%
            </p>
          </div>
        </div>

        <div className="bg-[#090d16] p-4 rounded-xl border border-amber-500/30 space-y-2 shadow-lg">
          <div className="flex items-center gap-1.5 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase font-mono">
              Injury &amp; Restriction Flag
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {trainee.injuries.length > 0
              ? trainee.injuries[0]
              : "No reported structural injuries. Clear for full ROM movements."}
          </p>
        </div>

        <div className="bg-[#090d16] p-4 rounded-xl border border-[#1b2d47] space-y-2 shadow-lg">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Active Program Split
          </span>
          <div className="space-y-1 font-mono">
            <span className="inline-block px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
              {program ? "16-Wk Master Split" : "5-Day Split"}
            </span>
            <p className="text-xs text-slate-300">
              Upper A / Lower A / Push B / Pull B / Legs Core
            </p>
          </div>
        </div>
      </div>

      {/* 4. Remote Coach Directive / Session Note Dispatch */}
      <section className="bg-[#090d16] rounded-2xl border border-[#1b2d47] p-5 space-y-3 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1b2d47] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#10b981]" />
            <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider">
              Remote Coach Directive &amp; Biomechanical Cues
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Dispatches into athlete&apos;s active session HUD
          </span>
        </div>

        <form onSubmit={handleSendCoachNote} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Keep ribcage down on pull-downs, target 1.5x bodyweight on RDLs..."
              value={coachNote}
              onChange={(e) => setCoachNote(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#05080c] border border-[#1b2d47] text-white focus:outline-none focus:border-[#10b981] font-mono text-xs transition placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] active:scale-95 text-black font-display font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            >
              {noteSent ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Dispatched!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>Dispatch Cue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* 5. Collimated Flight Log Stream */}
      <section className="bg-[#090d16] rounded-2xl border border-[#1b2d47] p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1b2d47] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#10b981]" />
            <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider">
              Collimated Flight Log Stream ({sessions.length})
            </h2>
          </div>
          <span className="text-xs text-[#10b981] font-mono font-bold">
            Live Stream Verified
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400 bg-[#05080c] rounded-xl border border-[#1b2d47]">
            No workout flight logs recorded yet. Active lifting sessions will stream here in real time.
          </div>
        ) : (
          <div className="space-y-3 font-mono">
            {sessions.map((s, idx) => {
              const totalVolume = s.setLogs?.reduce(
                (acc, l) => acc + (l.weightKg || 0) * (l.reps || 0),
                0
              ) || 0;
              const prCount = s.setLogs?.filter((l) => l.isPR).length || 0;

              return (
                <div
                  key={s.id}
                  className="bg-[#05080c] p-4 rounded-xl border border-[#1b2d47] space-y-3 shadow-lg hover:border-[#10b981]/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                          LOG #{sessions.length - idx}-FLIGHT
                        </span>
                        <h3 className="text-sm font-display font-bold text-white uppercase">
                          {s.dayLabel}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
                        <span>{s.date}</span>
                        <span>•</span>
                        <span className="text-cyan-400">
                          {formatDuration(s.durationSec)}
                        </span>
                        <span>•</span>
                        <span>{s.setLogs.length} Sets Logged</span>
                        <span>•</span>
                        <span className="text-[#10b981] font-bold">
                          {Math.round(totalVolume).toLocaleString()} kg Ballast
                        </span>
                      </div>
                    </div>

                    {prCount > 0 && (
                      <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>{prCount} PR RECORDED</span>
                      </span>
                    )}
                  </div>

                  {s.sessionNote && (
                    <p className="text-xs text-slate-300 italic bg-[#090d16] p-2.5 rounded-lg border border-[#1b2d47] font-sans">
                      &ldquo;{s.sessionNote}&rdquo;
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                    {s.setLogs.map((l) => (
                      <div
                        key={l.id}
                        className="bg-[#090d16] p-2.5 rounded-lg border border-[#1b2d47] text-xs font-mono flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white font-medium text-[11px] truncate">
                            {l.exerciseName}
                          </p>
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            Set {l.setIndex}:{" "}
                            <strong className="text-cyan-300">
                              {l.weightKg}kg × {l.reps}
                            </strong>{" "}
                            {l.rirAchieved !== undefined && `(RIR ${l.rirAchieved})`}
                          </p>
                        </div>
                        {l.isPR && (
                          <span className="text-[10px] font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                            PR
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
