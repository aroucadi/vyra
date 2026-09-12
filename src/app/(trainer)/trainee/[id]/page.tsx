"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Dumbbell,
  AlertTriangle,
  TrendingUp,
  FileText,
  ChevronRight,
  Shield,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { appStore } from "@/lib/store";
import { formatDuration } from "@/lib/utils";

export default function TraineeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const trainee = appStore.getUser(resolvedParams.id) || appStore.getTrainees()[0];
  const program = appStore.getActiveProgramForTrainee(trainee.id);
  const sessions = appStore.getSessions(trainee.id);
  const metrics = appStore.getMetrics(trainee.id);

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

      {/* Trainee Stats & Injury Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Physical Baseline</span>
          <div className="space-y-1 text-xs">
            <p className="text-slate-300">Height: <strong className="text-white font-mono">{trainee.heightCm || 180} cm</strong></p>
            <p className="text-slate-300">Current Weight: <strong className="text-white font-mono">{metrics.length ? metrics[metrics.length - 1].weightKg : 80} kg</strong></p>
            <p className="text-slate-300">Goal: <strong className="text-[#10B981]">{trainee.goals[0] || "Strength Progression"}</strong></p>
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
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Program Version</span>
          <p className="text-sm font-bold text-white">{program?.title || "Hypertrophy Block 1"}</p>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Version: <strong>v{program?.version || 1}.0</strong></span>
            <span>•</span>
            <span>Duration: {program?.durationWeeks || 4} Weeks</span>
          </div>
        </div>
      </div>

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
