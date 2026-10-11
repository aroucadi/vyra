"use client";

import React from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { DeveloperMenu } from "@/components/DeveloperMenu";
import { WorkoutSession, SetLog } from "@/lib/types";
import { Dumbbell, Trophy, ChevronRight, Moon } from "lucide-react";

export default function YouPage() {
  const currentUser = appStore.getCurrentUser();
  const sessions = appStore.getSessions(currentUser.id);
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

          <div className="flex items-center justify-between p-4 text-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">KG</span>
              <span>Weight Units</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Kilograms (Metric)</span>
          </div>
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
