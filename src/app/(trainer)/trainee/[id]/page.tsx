"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Dumbbell,
  AlertTriangle,
  Activity,
  Pill,
  Droplets,
} from "lucide-react";
import { appStore } from "@/lib/store";
import { formatDuration, resolveProgramDay } from "@/lib/utils";

export default function TraineeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const trainee = appStore.getUser(resolvedParams.id) || appStore.getTrainees()[0];
  const program = appStore.getActiveProgramForTrainee(trainee.id);
  const sessions = appStore.getSessions(trainee.id);
  const metrics = appStore.getMetrics(trainee.id);

  const workoutAdherence = appStore.calculateWorkoutAdherence(trainee.id);
  const suppAdherence = appStore.calculateSupplementAdherence(trainee.id);
  const hydrAdherence = appStore.calculateHydrationAdherence(trainee.id);
  const hydrationGoal = appStore.getHydrationGoal(trainee.id);
  const supplementProtocols = program ? appStore.getSupplementProtocols(program.id) : [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/roster"
            className="p-1.5 rounded-lg bg-[#162032] border border-[#334155] text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">{trainee.name}</h1>
              <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-mono text-[10px] font-bold uppercase">
                Active Client
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">{trainee.email}</p>
          </div>
        </div>

        <Link
          href={`/program/${program?.id || "new"}`}
          className="px-3.5 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
        >
          <Dumbbell className="w-4 h-4" />
          Edit Active Program
        </Link>
      </div>

      {/* Tri-Axis Adherence KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Workout Adherence</span>
            <Activity className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">{workoutAdherence}%</span>
            <span className="text-[11px] text-[#10B981] font-mono">Target: 85%+</span>
          </div>
          <div className="w-full bg-[#0F172A] rounded-full h-2 overflow-hidden border border-[#1E293B]">
            <div style={{ width: `${workoutAdherence}%` }} className="bg-[#10B981] h-2 rounded-full" />
          </div>
        </div>

        <div className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Supplement Compliance</span>
            <Pill className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">{suppAdherence}%</span>
            <span className={`text-[11px] font-mono ${suppAdherence >= 85 ? "text-[#10B981]" : suppAdherence >= 70 ? "text-[#06B6D4]" : "text-[#EF4444]"}`}>
              {suppAdherence >= 85 ? "Optimal" : suppAdherence >= 70 ? "Acceptable" : "Needs Review"}
            </span>
          </div>
          <div className="w-full bg-[#0F172A] rounded-full h-2 overflow-hidden border border-[#1E293B]">
            <div style={{ width: `${suppAdherence}%` }} className={`h-2 rounded-full ${suppAdherence >= 85 ? "bg-[#10B981]" : suppAdherence >= 70 ? "bg-[#06B6D4]" : "bg-[#EF4444]"}`} />
          </div>
        </div>

        <div className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Hydration Target Avg</span>
            <Droplets className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">{hydrAdherence}%</span>
            <span className="text-[11px] text-slate-400 font-mono">
              Target: {(hydrationGoal?.dailyTargetMl || 3500) / 1000}L/day
            </span>
          </div>
          <div className="w-full bg-[#0F172A] rounded-full h-2 overflow-hidden border border-[#1E293B]">
            <div style={{ width: `${hydrAdherence}%` }} className={`h-2 rounded-full ${hydrAdherence >= 85 ? "bg-[#10B981]" : hydrAdherence >= 60 ? "bg-[#06B6D4]" : "bg-[#EF4444]"}`} />
          </div>
        </div>
      </div>

      {/* Trainee Stats & Injury Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Physical Baseline</span>
          <div className="space-y-1 text-xs">
            <p className="text-slate-300">Height: <strong className="text-white font-mono">{trainee.heightCm || 180} cm</strong></p>
            <p className="text-slate-300">Current Weight: <strong className="text-white font-mono">{metrics.length ? metrics[metrics.length - 1].weightKg : 80} kg</strong></p>
            <p className="text-slate-300">Goal: <strong className="text-[#10B981]">{trainee.goals[0] || "Strength Progression"}</strong></p>
          </div>
        </div>

        <div className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Weight Trend (14d)</span>
          <div className="space-y-1">
            <p className="text-xs font-mono text-slate-300">
              {metrics.length >= 2
                ? `${metrics[metrics.length - 1].weightKg - metrics[0].weightKg > 0 ? "+" : ""}${Math.round((metrics[metrics.length - 1].weightKg - metrics[0].weightKg) * 10) / 10} kg net`
                : "Stable Baseline"}
            </p>
            <div className="h-10 flex items-end gap-1 pt-1">
              {metrics.slice(-7).map((m, i) => (
                <div
                  key={m.id || i}
                  title={`${m.date}: ${m.weightKg}kg`}
                  style={{ height: `${Math.max(20, Math.min(100, (m.weightKg - 70) * 5))}%` }}
                  className="flex-1 bg-[#10B981] rounded-t hover:bg-[#06B6D4] transition"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#162032] p-4 rounded-xl border border-[#F59E0B]/30 space-y-2">
          <div className="flex items-center gap-1.5 text-[#F59E0B]">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase font-mono">Injury & Restriction Flag</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {trainee.injuries.length > 0 ? trainee.injuries[0] : "No reported structural injuries. Clear for full ROM movements."}
          </p>
        </div>

        <div className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Protocol Phase Status</span>
          {(() => {
            if (!program) {
              return (
                <div className="space-y-1">
                  <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[11px] font-bold">
                    No Active Program
                  </span>
                  <p className="text-xs text-slate-400">Assign a program to activate tracking.</p>
                </div>
              );
            }
            const resolved = resolveProgramDay(program.startDate);
            const dayNum = Math.max(1, resolved.elapsedDays + 1);
            const activeDoses = appStore.getActiveSupplementDosesForDay(program.id, dayNum);
            const creatineEntry = activeDoses.find((d) => d.protocol.name.toLowerCase().includes("creatine"));
            const phaseName = creatineEntry?.phase.name || "Active";
            const isMaintenance = phaseName.toLowerCase().includes("maintenance");

            return (
              <div className="space-y-1">
                <span className="inline-block px-2 py-0.5 rounded bg-[#06B6D4]/20 text-[#06B6D4] font-mono text-[11px] font-bold">
                  Creatine: {phaseName}
                </span>
                <p className="text-xs text-slate-300">
                  {isMaintenance
                    ? `Maintenance phase stable on Day ${dayNum}. 1x 5g daily dose.`
                    : `Saturation loading active (Day ${dayNum} of 5). 3 doses / 20.7g daily.`}
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Active Supplement Stack Prescriptions */}
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-[#06B6D4]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Active Supplement Protocol Prescriptions ({supplementProtocols.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Program-Scoped</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {supplementProtocols.map((proto) => {
            const activePhase = proto.phases[proto.phases.length - 1];
            return (
              <div key={proto.id} className="bg-[#0F172A] p-3 rounded-lg border border-[#1E293B] space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="text-xs font-bold text-slate-100">{proto.name}</h3>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#162032] text-[#06B6D4] border border-[#334155]">
                    {proto.category}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] font-mono text-slate-400">
                  <p className="text-[#10B981]">Phase: {activePhase?.name || "Active"}</p>
                  {activePhase?.doses.map((d) => (
                    <p key={d.id} className="text-slate-300">
                      • {d.amount}{d.unit} ({d.timingType === "meal_linked" ? d.mealLabel : d.standaloneTiming})
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Logged Workout Sessions History */}
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#10B981]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Completed Session Logs ({sessions.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Live Sync</span>
        </div>

        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="bg-[#0F172A] p-4 rounded-xl border border-[#1E293B] space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{s.dayLabel}</h3>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                    <span>{s.date}</span>
                    <span>•</span>
                    <span className="text-[#06B6D4]">{formatDuration(s.durationSec)}</span>
                    <span>•</span>
                    <span>{s.setLogs.length} Sets Total</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] text-[10px] font-mono font-bold">
                  Verified Complete
                </span>
              </div>

              {s.notes && (
                <p className="text-xs text-slate-400 italic bg-[#162032] p-2 rounded border border-[#1E293B]">
                  &ldquo;{s.notes}&rdquo;
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                {s.setLogs.map((l) => (
                  <div key={l.id} className="bg-[#162032] p-2 rounded border border-[#1E293B] text-xs font-mono flex items-center justify-between">
                    <div>
                      <p className="text-slate-200 font-medium text-[11px] truncate">{l.exerciseName}</p>
                      <p className="text-slate-400 text-[10px]">
                        Set {l.setIndex}: <strong className="text-white">{l.weightKg}kg × {l.reps}</strong> (RIR {l.rirAchieved})
                      </p>
                    </div>
                    {l.isPR && (
                      <span className="text-[10px] font-bold text-[#F59E0B] px-1 rounded bg-[#F59E0B]/20">
                        PR
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
