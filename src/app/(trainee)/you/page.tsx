"use client";

import React from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { DeveloperMenu } from "@/components/DeveloperMenu";
import { WorkoutSession, SetLog } from "@/lib/types";
import { Dumbbell, Trophy, ChevronRight, Moon, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { WorkoutSessionDetailSheet } from "@/components/trainee/WorkoutSessionDetailSheet";

export default function YouPage() {
  const currentUser = appStore.getCurrentUser();
  const sessions = appStore.getSessions(currentUser.id);
  const [selectedSession, setSelectedSession] = React.useState<WorkoutSession | null>(null);
  const totalVolume = sessions.reduce((acc: number, s: WorkoutSession) => {
    const sessVol = s.setLogs ? s.setLogs.reduce((sAcc: number, l: SetLog) => sAcc + (l.weightKg || 0) * (l.reps || 0), 0) : 0;
    return acc + sessVol;
  }, 0);

  return (
    <div className="flex-1 pb-24 px-4 pt-6 max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 overflow-hidden font-bold text-lg">
          {currentUser.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
          ) : (
            currentUser.name.charAt(0)
          )}
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">{currentUser.name}</h1>
          <p className="text-xs text-slate-400">
            {currentUser.role === "trainer" ? "Head Performance Coach" : "Athletic Optimization Protocol"}
          </p>
        </div>
      </header>

      {/* High-Level Overview Metrics (Max 3 numbers) */}
      <section className="grid grid-cols-3 gap-2">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <div className="text-base font-bold text-white tabular">{sessions.length}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Sessions</div>
        </div>
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <div className="text-base font-bold text-white tabular">
            {totalVolume > 0 ? (totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume) : "—"}
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Vol (kg)</div>
        </div>
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <div className="text-base font-bold text-emerald-400 tabular">Week 1</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Block 1</div>
        </div>
      </section>

      {/* Completed Workout Sessions & Detailed History */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
            Workout History & Session Logs
          </span>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold">
            {sessions.length} Logged
          </span>
        </div>

        {sessions.length > 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden text-xs">
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
                  className="p-4 hover:bg-slate-800/40 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate text-xs">
                        {sess.dayLabel || sess.programTitle || "Workout Session"}
                      </span>
                      {prs > 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 flex-shrink-0">
                          <Trophy className="w-2.5 h-2.5" />
                          <span>+{prs} PR</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                      <span>{dateStr}</span>
                      <span>·</span>
                      <span className="text-emerald-400 font-semibold">{sessVol.toLocaleString()} kg</span>
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
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
            No completed workouts logged yet.
          </div>
        )}
      </section>

      {/* Navigation List */}
      <section className="space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Account & Preferences
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden text-xs">
          <Link
            href="/progress"
            className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition"
          >
            <div className="flex items-center gap-3 text-slate-200">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>Personal Records & Milestones</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>

          <Link
            href="/program"
            className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition"
          >
            <div className="flex items-center gap-3 text-slate-200">
              <Dumbbell className="w-4 h-4 text-cyan-400" />
              <span>16-Week Transformation Blueprint</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>

          <div className="flex items-center justify-between p-4 text-slate-200">
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Theme</span>
            </div>
            <span className="text-[11px] text-slate-400">Dark (Obsidian)</span>
          </div>

          <Link
            href="/your-data"
            className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition"
          >
            <div className="flex items-center gap-3 text-slate-200">
              <span className="text-xs font-bold text-slate-400">DATA</span>
              <span>Your Data & Privacy</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>

          <Link
            href="/install"
            className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition"
          >
            <div className="flex items-center gap-3 text-slate-200">
              <span className="text-xs font-bold text-emerald-400">PWA</span>
              <span>Install to Home Screen</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>
        </div>
      </section>

      {/* Hidden Developer Trigger - Clean Gesture on Version String */}
      <section className="pt-8 pb-4 text-center">
        <DeveloperMenu currentUser={currentUser}>
          <div className="text-[11px] text-slate-600 hover:text-slate-500 transition select-none cursor-default">
            <p>VYRA · v1.0.0-rc1</p>
          </div>
        </DeveloperMenu>
      </section>

    </div>
  );
}
