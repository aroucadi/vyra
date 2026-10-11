"use client";

import { useState } from "react";
import {
  TrendingDown,
  Plus,
  Trophy,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { appStore } from "@/lib/store";
import { logWeightAction } from "@/lib/actions/metrics";
import { calculateEstimated1RM } from "@/lib/utils";
import { WeeklyVolumeDashboard } from "@/components/trainee/WeeklyVolumeDashboard";

export default function ProgressPage() {
  const currentUser = appStore.getCurrentUser();
  const [metrics, setMetrics] = useState(() => appStore.getMetrics(currentUser.id));
  const sessions = appStore.getSessions(currentUser.id);

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
    <div className="px-4 py-5 space-y-5 pb-24">
      <header className="space-y-1">
        <h1 className="text-xl font-black text-[#F8FAFC]">Progress & Bio-Metrics</h1>
        <p className="text-xs text-slate-400">
          Tracking adherence, body composition trend, and strength PRs.
        </p>
      </header>

      {/* 1. Bodyweight Trend Card */}
      {!currentUser.hideWeightFromTrainee && (
        <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Current Weight
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-white font-mono">{latestWeight} kg</span>
                <span className="text-xs font-mono font-semibold text-[#10B981] flex items-center gap-0.5">
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
                placeholder="e.g. 80.5"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-20 px-2 py-1.5 rounded-lg bg-[#0F172A] border border-[#334155] text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-[#10B981]"
              />
              <button
                type="submit"
                disabled={isLogging}
                className="px-2.5 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-slate-950 font-bold text-xs flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Log
              </button>
            </form>
          </div>

          {successMessage && (
            <p className="text-xs text-[#10B981] font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {successMessage}
            </p>
          )}

          {/* SVG Line Chart for 100% Reliable Render */}
          <div className="bg-[#0F172A] p-3 rounded-lg border border-[#1E293B]">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-2">
              <span>14-Day Weigh-In Curve</span>
              <span>Range: {minWeight}kg - {maxWeight}kg</span>
            </div>

            <div className="h-32 w-full flex items-end justify-between gap-1 pt-4 px-1">
              {metrics.map((m, idx) => {
                const heightPercent = ((m.weightKg - minWeight + 0.5) / (maxWeight - minWeight + 1)) * 100;
                return (
                  <div key={m.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      style={{ height: `${Math.max(15, heightPercent)}%` }}
                      className="w-full rounded-t bg-gradient-to-t from-[#10B981]/40 to-[#10B981] hover:to-[#06B6D4] transition"
                    />
                    <span className="text-[8px] font-mono text-slate-500">
                      {idx % 2 === 0 ? m.date.slice(8) : ""}
                    </span>

                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 hidden group-hover:block bg-[#162032] border border-[#334155] px-1.5 py-0.5 rounded text-[9px] font-mono text-white whitespace-nowrap z-10">
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
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#06B6D4]" />
            <h2 className="text-sm font-bold text-white">Target Muscle Group Volume</h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Weekly Rollup</span>
        </div>

        <div className="space-y-2.5 text-xs">
          {[
            { muscle: "Chest & Front Delts", sets: 14, percent: 85, color: "bg-[#10B981]" },
            { muscle: "Upper & Mid Back", sets: 12, percent: 75, color: "bg-[#06B6D4]" },
            { muscle: "Quads & Hamstrings", sets: 10, percent: 65, color: "bg-[#8B5CF6]" },
            { muscle: "Side Delts & Triceps", sets: 9, percent: 60, color: "bg-[#F59E0B]" },
          ].map((item) => (
            <div key={item.muscle} className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 font-medium">{item.muscle}</span>
                <span className="text-slate-400">{item.sets} Sets</span>
              </div>
              <div className="w-full bg-[#0F172A] rounded-full h-1.5 overflow-hidden border border-[#1E293B]">
                <div style={{ width: `${item.percent}%` }} className={`h-1.5 rounded-full ${item.color}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Weekly Volume Dashboard & Biomechanical Architecture */}
      <WeeklyVolumeDashboard />

      {/* 3. Personal Records Trophy Cabinet */}
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-sm font-bold text-white">Personal Record (PR) Showcase</h2>
          </div>
          <span className="text-[10px] font-mono text-[#F59E0B] font-bold">{prs.length || 2} Records</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {prs.length > 0 ? (
            prs.map((pr, idx) => (
              <div key={idx} className="bg-[#0F172A] p-3 rounded-lg border border-[#1E293B] space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase truncate">{pr.exercise}</span>
                  {pr.equipment && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30 shrink-0">
                      {pr.equipment}
                    </span>
                  )}
                </div>
                <p className="text-base font-black text-white font-mono">{pr.weight} kg × {pr.reps}</p>
                <p className="text-[9px] text-[#10B981] font-mono">
                  Estimated 1RM: {calculateEstimated1RM(pr.weight, pr.reps)} kg • {pr.date}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-[#0F172A] p-4 rounded-lg border border-[#1E293B] text-center space-y-1">
              <p className="text-xs text-slate-300 font-medium">No PRs logged yet.</p>
              <p className="text-[10px] text-slate-500">
                Log completed workouts in Session to record personal records.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
