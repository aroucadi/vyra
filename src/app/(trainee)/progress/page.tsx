"use client";

import { useState } from "react";
import {
  TrendingDown,
  Plus,
  Trophy,
  Activity,
  CheckCircle2,
  Dumbbell,
  ChevronRight,
} from "lucide-react";
import { appStore } from "@/lib/store";
import { WorkoutSession } from "@/lib/types";
import { logWeightAction } from "@/lib/actions/metrics";
import { calculateEstimated1RM } from "@/lib/utils";
import { WeeklyVolumeDashboard } from "@/components/trainee/WeeklyVolumeDashboard";
import { WorkoutSessionDetailSheet } from "@/components/trainee/WorkoutSessionDetailSheet";

export default function ProgressPage() {
  const currentUser = appStore.getCurrentUser();
  const [metrics, setMetrics] = useState(() => appStore.getMetrics(currentUser.id));
  const sessions = appStore.getSessions(currentUser.id);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

  const [weightInput, setWeightInput] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weightInput);
    if (!val || isNaN(val)) return;

    setIsLogging(true);
    await logWeightAction(currentUser.id, val);
    setMetrics(appStore.getMetrics(currentUser.id));
    setIsLogging(false);
    setWeightInput("");
    setSuccessMessage("Weight logged successfully.");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Calculate high and low weight
  const weights = metrics.map((m) => m.weightKg);
  const minWeight = weights.length ? Math.min(...weights) : 75;
  const maxWeight = weights.length ? Math.max(...weights) : 85;
  const latestWeight = weights.length ? weights[weights.length - 1] : 80;
  const startWeight = weights.length ? weights[0] : 82;
  const diff = Math.round((latestWeight - startWeight) * 10) / 10;

  // Extract PRs
  const prs: { exercise: string; weight: number; reps: number; date: string; equipment?: string }[] = [];
  sessions.forEach((s) => {
    s.setLogs.forEach((l) => {
      if (l.isPR) {
        prs.push({
          exercise: l.exerciseName,
          weight: l.weightKg,
          reps: l.reps,
          date: s.date,
          equipment: l.selectedEquipment,
        });
      }
    });
  });

  return (
    <div className="px-4 py-5 space-y-5 pb-24 font-body">
      <header className="space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
          Telemetry & Adaptation
        </span>
        <h1 className="text-2xl font-editorial font-bold text-white tracking-tight">Progress & Bio-Metrics</h1>
        <p className="text-xs text-slate-400 font-body">
          Tracking adherence, body composition trend, and verified strength PRs.
        </p>
      </header>

      {/* 1. Bodyweight Trend & Calibrated Surplus Curve */}
      {!currentUser.hideWeightFromTrainee && (
        <section className="bg-[#111622] rounded-2xl border border-[#1C2436] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Current Weight
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-display font-black text-white tabular-nums">{latestWeight} kg</span>
                <span className="text-xs font-mono font-semibold text-sky-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {diff} kg (14d)
                </span>
              </div>
            </div>

            {/* Log Weight Toggle Form */}
            <form onSubmit={handleLogWeight} className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 52.4"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-20 px-2.5 py-1.5 rounded-xl bg-[#090C11] border border-[#1C2436] text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={isLogging}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-display uppercase tracking-wider text-xs font-black flex items-center gap-1 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Log
              </button>
            </form>
          </div>

          {successMessage && (
            <p className="text-xs text-amber-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {successMessage}
            </p>
          )}

          {/* 16-Week Surplus Milestone Trajectory (Category B) */}
          <div className="p-3 bg-[#090C11] border border-[#1C2436] rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400 uppercase tracking-wider">16-Week Surplus Target</span>
              <span className="text-amber-400 font-bold">51.8 kg → 57.0 kg Goal</span>
            </div>
            <div className="w-full bg-[#111622] rounded-full h-2 overflow-hidden border border-[#1C2436]">
              {(() => {
                const baseline = 51.8;
                const target = 57.0;
                const current = Math.max(baseline, Math.min(target, latestWeight));
                const progressPct = Math.round(((current - baseline) / (target - baseline)) * 100);
                return (
                  <div
                    style={{ width: `${Math.max(5, progressPct)}%` }}
                    className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                  />
                );
              })()}
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>W1: 51.8kg (Baseline)</span>
              <span>W6: 53.5kg</span>
              <span>W12: 55.5kg</span>
              <span className="text-amber-400 font-semibold">W16: 57.0kg</span>
            </div>
          </div>

          {/* SVG Line Chart for 100% Reliable Render */}
          <div className="bg-[#090C11] p-3 rounded-xl border border-[#1C2436]">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-2">
              <span>14-Day Weigh-In Curve</span>
              <span>Range: {minWeight}kg - {maxWeight}kg</span>
            </div>

            <div className="h-28 w-full flex items-end justify-between gap-1 pt-4 px-1">
              {metrics.map((m, idx) => {
                const heightPercent = ((m.weightKg - minWeight + 0.5) / (maxWeight - minWeight + 1)) * 100;
                return (
                  <div key={m.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      style={{ height: `${Math.max(15, heightPercent)}%` }}
                      className="w-full rounded-t bg-gradient-to-t from-amber-500/30 to-amber-400 hover:to-amber-300 transition"
                    />
                    <span className="text-[8px] font-mono text-slate-500">
                      {idx % 2 === 0 ? m.date.slice(8) : ""}
                    </span>

                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 hidden group-hover:block bg-[#111622] border border-[#1C2436] px-1.5 py-0.5 rounded text-[9px] font-mono text-white whitespace-nowrap z-10">
                      {m.weightKg} kg
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 2. Muscle Group Volume Distribution */}
      <section className="bg-[#111622] rounded-2xl border border-[#1C2436] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white font-editorial">Target Muscle Group Volume</h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Weekly Rollup</span>
        </div>

        <div className="space-y-2.5 text-xs">
          {[
            { muscle: "Chest & Front Delts", sets: 14, percent: 85, color: "bg-amber-400" },
            { muscle: "Upper & Mid Back", sets: 12, percent: 75, color: "bg-sky-400" },
            { muscle: "Quads & Hamstrings", sets: 10, percent: 65, color: "bg-sky-500" },
            { muscle: "Side Delts & Triceps", sets: 9, percent: 60, color: "bg-amber-500" },
          ].map((item) => (
            <div key={item.muscle} className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 font-medium">{item.muscle}</span>
                <span className="text-slate-400">{item.sets} Sets</span>
              </div>
              <div className="w-full bg-[#090C11] rounded-full h-1.5 overflow-hidden border border-[#1C2436]">
                <div style={{ width: `${item.percent}%` }} className={`h-1.5 rounded-full ${item.color}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Weekly Volume Dashboard & Biomechanical Architecture */}
      <WeeklyVolumeDashboard />

      {/* 3. Personal Records Trophy Cabinet */}
      <section className="bg-[#111622] rounded-2xl border border-[#1C2436] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white font-editorial">Personal Record (PR) Showcase</h2>
          </div>
          <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
            {prs.length || 2} Records
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {prs.length > 0 ? (
            prs.map((pr, idx) => (
              <div key={idx} className="bg-[#090C11] p-3 rounded-xl border border-[#1C2436] space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase truncate">{pr.exercise}</span>
                  {pr.equipment && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
                      {pr.equipment}
                    </span>
                  )}
                </div>
                <p className="text-lg font-display font-black text-white tabular-nums">{pr.weight} kg × {pr.reps}</p>
                <p className="text-[9px] text-amber-400 font-mono">
                  Estimated 1RM: {calculateEstimated1RM(pr.weight, pr.reps)} kg • {pr.date}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-[#090C11] p-4 rounded-xl border border-[#1C2436] text-center space-y-1">
              <p className="text-xs text-slate-300 font-medium">No PRs logged yet.</p>
              <p className="text-[10px] text-slate-500">
                Log completed workouts in Session to record personal records.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. Completed Workout Sessions & Logs */}
      <section className="bg-[#111622] rounded-2xl border border-[#1C2436] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white font-editorial">Completed Workouts & Session History</h2>
          </div>
          <span className="text-[10px] font-mono text-amber-400 font-bold">{sessions.length} Logged</span>
        </div>

        {sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.map((sess) => {
              const sessVol = sess.setLogs
                ? sess.setLogs.reduce((acc, l) => acc + (l.weightKg || 0) * (l.reps || 0), 0)
                : 0;
              const durationMin = sess.durationSec ? Math.max(1, Math.round(sess.durationSec / 60)) : 0;
              const prs = sess.setLogs ? sess.setLogs.filter((l) => l.isPR).length : 0;
              const dateStr = sess.date
                ? new Date(sess.date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                : "Workout";

              return (
                <div
                  key={sess.id}
                  onClick={() => setSelectedSession(sess)}
                  className="bg-[#090C11] p-3 rounded-xl border border-[#1C2436] hover:border-amber-500/50 hover:bg-[#182030] transition cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate text-xs font-editorial">
                        {sess.dayLabel || sess.programTitle || "Workout Session"}
                      </span>
                      {prs > 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 flex-shrink-0">
                          <Trophy className="w-2.5 h-2.5" />
                          <span>+{prs} PR</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                      <span>{dateStr}</span>
                      <span>·</span>
                      <span className="text-amber-400 font-semibold">{sessVol.toLocaleString()} kg</span>
                      <span>·</span>
                      <span>{sess.setLogs?.length || 0} sets</span>
                      {durationMin > 0 && (
                        <>
                          <span>·</span>
                          <span>{durationMin}m</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#090C11] p-4 rounded-xl border border-[#1C2436] text-center space-y-1">
            <p className="text-xs text-slate-300 font-medium">No workout sessions logged yet.</p>
            <p className="text-[10px] text-slate-500">
              When you complete a workout in Session, your full set logs, total volume, and PRs will appear here.
            </p>
          </div>
        )}
      </section>

      {/* Workout Session Detail Sheet */}
      <WorkoutSessionDetailSheet
        session={selectedSession}
        isOpen={!!selectedSession}
        onOpenChange={(open) => !open && setSelectedSession(null)}
      />
    </div>
  );
}
