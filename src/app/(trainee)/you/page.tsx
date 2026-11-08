"use client";

import React from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { DeveloperMenu } from "@/components/DeveloperMenu";
import { WorkoutSession, SetLog } from "@/lib/types";
import { Dumbbell, Trophy, ChevronRight, Moon, Calendar, Clock, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import { WorkoutSessionDetailSheet } from "@/components/trainee/WorkoutSessionDetailSheet";
import { GymSelectorDrawer } from "@/components/trainee/GymSelectorDrawer";

export default function YouPage() {
  const currentUser = appStore.getCurrentUser();
  const sessions = appStore.getSessions(currentUser.id);
  const [selectedSession, setSelectedSession] = React.useState<WorkoutSession | null>(null);
  const [isGymDrawerOpen, setIsGymDrawerOpen] = React.useState(false);
  const [gymListVersion, setGymListVersion] = React.useState(0);
  const defaultGym = appStore.getDefaultGymLocation(currentUser.id);
  const gymsCount = appStore.getUserGymLocations(currentUser.id).length;
  const totalVolume = sessions.reduce((acc: number, s: WorkoutSession) => {
    const sessVol = s.setLogs ? s.setLogs.reduce((sAcc: number, l: SetLog) => sAcc + (l.weightKg || 0) * (l.reps || 0), 0) : 0;
    return acc + sessVol;
  }, 0);

  return (
    <div className="flex-1 pb-24 px-4 pt-6 max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-300 font-body">
      
      {/* Header */}
      <header className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#111622] border border-[#1C2436] flex items-center justify-center text-amber-400 overflow-hidden font-display font-black text-xl shadow-sm">
          {currentUser.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
          ) : (
            currentUser.name.charAt(0)
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-editorial font-bold text-white tracking-tight">{currentUser.name}</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
              ATHLETE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {currentUser.role === "trainer" ? "Head Performance Coach" : "16-Week Hypertrophy Architecture"}
          </p>
        </div>
      </header>

      {/* High-Level Overview Metrics (Max 3 numbers) */}
      <section className="grid grid-cols-3 gap-2">
        <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-2xl text-center shadow-sm">
          <div className="text-2xl font-display font-black text-white tabular-nums">{sessions.length}</div>
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">Sessions</div>
        </div>
        <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-2xl text-center shadow-sm">
          <div className="text-2xl font-display font-black text-white tabular-nums">
            {totalVolume > 0 ? (totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume) : "—"}
          </div>
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">Vol (kg)</div>
        </div>
        <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-2xl text-center shadow-sm">
          <div className="text-2xl font-display font-black text-amber-400 tabular-nums">Week 1</div>
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">Block 1</div>
        </div>
      </section>

      {/* Completed Workout Sessions & Detailed History */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-display font-bold uppercase tracking-wider text-xs text-slate-400">
            Workout History & Session Logs
          </span>
          <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            {sessions.length} Logged
          </span>
        </div>

        {sessions.length > 0 ? (
          <div className="bg-[#111622] border border-[#1C2436] rounded-2xl divide-y divide-[#1C2436] overflow-hidden text-xs shadow-sm">
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
                  className="p-4 hover:bg-[#182030] transition cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate text-xs">
                        {sess.dayLabel || sess.programTitle || "Workout Session"}
                      </span>
                      {prs > 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 flex-shrink-0">
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
          <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl text-center text-xs text-slate-400">
            No completed workouts logged yet.
          </div>
        )}
      </section>

      {/* Navigation List */}
      <section className="space-y-2">
        <div className="text-xs font-display font-bold text-slate-400 uppercase tracking-wider px-1">
          Account & Protocols
        </div>

        <div className="bg-[#111622] border border-[#1C2436] rounded-2xl divide-y divide-[#1C2436] overflow-hidden text-xs shadow-sm">
          <Link
            href="/progress"
            className="flex items-center justify-between p-4 hover:bg-[#182030] transition"
          >
            <div className="flex items-center gap-3 text-slate-200">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="font-medium">Personal Records & Milestones</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>

          <Link
            href="/program"
            className="flex items-center justify-between p-4 hover:bg-[#182030] transition"
          >
            <div className="flex items-center gap-3 text-slate-200">
              <Dumbbell className="w-4 h-4 text-sky-400" />
              <span className="font-medium">16-Week Transformation Blueprint</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>

          <button
            type="button"
            onClick={() => setIsGymDrawerOpen(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-[#182030] transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 text-slate-200 min-w-0">
              <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="font-medium">Salles de Sport & Training Locations</span>
                <p className="text-[10px] text-slate-400 font-normal truncate">
                  {defaultGym?.name || "Punch by Badr Hari Lissasfa"} · {gymsCount} registered
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
          </button>

          <div className="flex items-center justify-between p-4 text-slate-200">
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span className="font-medium">Theme</span>
            </div>
            <span className="text-[11px] font-mono text-amber-400">Basalt Monograph</span>
          </div>

          <Link
            href="/your-data"
            className="flex items-center justify-between p-4 hover:bg-[#182030] transition"
          >
            <div className="flex items-center gap-3 text-slate-200">
              <span className="text-[10px] font-mono font-bold text-slate-400 px-1 py-0.5 rounded bg-[#182030] border border-[#1C2436]">DATA</span>
              <span className="font-medium">Your Data & Privacy</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>

          <Link
            href="/install"
            className="flex items-center justify-between p-4 hover:bg-[#182030] transition"
          >
            <div className="flex items-center gap-3 text-slate-200">
              <span className="text-[10px] font-mono font-bold text-amber-400 px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">PWA</span>
              <span className="font-medium">Install to Home Screen</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>
        </div>
      </section>

      {/* Developer Trigger */}
      <section className="pt-8 pb-4 text-center">
        <DeveloperMenu currentUser={currentUser}>
          <div className="text-[11px] font-mono text-slate-600 hover:text-amber-400 transition select-none cursor-default">
            <p>VYRA · v1.0.0-rc1 (The Alaa Release)</p>
          </div>
        </DeveloperMenu>
      </section>

      <WorkoutSessionDetailSheet
        session={selectedSession}
        isOpen={!!selectedSession}
        onOpenChange={(open) => !open && setSelectedSession(null)}
      />

      <GymSelectorDrawer
        isOpen={isGymDrawerOpen}
        onOpenChange={(open) => {
          setIsGymDrawerOpen(open);
          if (!open) setGymListVersion((v) => v + 1);
        }}
        selectedGymId={defaultGym?.id}
        onSelectGym={(gym) => {
          appStore.setDefaultGymLocation(gym.id, currentUser.id);
          setGymListVersion((v) => v + 1);
        }}
        title="Salles de Sport & Locations"
        subtitle="Manage your main and secondary gyms. Set your default gym for automatic workout attribution."
      />
    </div>
  );
}
