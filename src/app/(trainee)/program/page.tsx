"use client";

import React, { useState } from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { resolveProgramDay } from "@/lib/utils";
import { ProgramDay, ExercisePrescription } from "@/lib/types";
import { Plan } from "@/components/primitives/Plan";
import { Card } from "@/components/primitives/Card";
import { Dumbbell, Clock, ArrowRight, ShieldCheck, Moon, Flame, Activity, Eye } from "lucide-react";
import { clsx } from "clsx";
import { WeeklyVolumeDashboard } from "@/components/trainee/WeeklyVolumeDashboard";

export default function ProgramCalendarPage() {
  const currentUser = appStore.getCurrentUser();
  const program = appStore.getActiveProgramForTrainee(currentUser.id);
  const resolved = program ? resolveProgramDay(program.startDate) : { weekIndex: 1, dayOfWeek: 0, started: true };

  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(() => resolved.dayOfWeek);

  if (!program) {
    return (
      <div className="p-8 text-center space-y-3 max-w-md mx-auto my-auto">
        <Dumbbell className="w-8 h-8 text-slate-500 mx-auto" />
        <p className="text-xs text-slate-400">No active program found.</p>
      </div>
    );
  }

  const currentWeek = program.weeks[Math.min(resolved.weekIndex - 1, program.weeks.length - 1)] || program.weeks[0];
  const daysOfWeekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const weekStripDays = currentWeek.days.map((day, idx) => ({
    dayName: daysOfWeekLabels[day.dayOfWeek] || `D${idx + 1}`,
    dayNumber: idx + 1,
    isRest: day.isRestDay,
  }));

  const selectedDay = currentWeek.days.find((d) => d.dayOfWeek === selectedDayOfWeek) || currentWeek.days[0];
  const exercises: ExercisePrescription[] = selectedDay.blocks ? selectedDay.blocks.flatMap((b) => b.exercises) : [];
  const isSelectedToday = resolved.dayOfWeek === selectedDay.dayOfWeek;

  return (
    <div className="flex-1 pb-24 px-4 pt-6 max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-300 font-body">
      
      {/* Header */}
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Week {resolved.weekIndex} of {program.durationWeeks}
          </span>
          <span className="text-[11px] font-mono text-slate-400">Block 1: Accumulation</span>
        </div>
        <h1 className="text-2xl font-editorial font-bold text-white tracking-tight">Program Schedule</h1>
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-400 font-body">
            Periodized progression calibrated to your recovery curve.
          </p>
          <Link
            href="/posture"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111622] border border-[#1C2436] text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition flex-shrink-0"
          >
            <Activity className="w-3 h-3" />
            <span>Posture Radar</span>
          </Link>
        </div>
      </header>

      {/* 7-Day Calendar Strip */}
      <Plan.WeekStrip
        days={weekStripDays}
        selectedDayIndex={selectedDayOfWeek}
        todayDayIndex={resolved.dayOfWeek}
        onSelectDay={setSelectedDayOfWeek}
      />

      {/* Day Details Card */}
      {selectedDay.isRestDay || exercises.length === 0 ? (
        <div className="p-6 rounded-2xl bg-[#111622] border border-[#1C2436] space-y-3 text-center">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-editorial">Active Recovery Day</h3>
            <p className="text-xs text-slate-400 mt-1">
              No heavy loading scheduled. Focus on 20-minute restorative walk, hydration, and tissue remodeling.
            </p>
          </div>
          <div className="p-3 bg-[#090C11] border border-[#1C2436] rounded-xl text-left text-xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Mobility Cue</span>
            <p className="text-slate-300">Half-kneeling hip flexor stretch & 10 supine chin tucks.</p>
          </div>
        </div>
      ) : (
        <Card variant={isSelectedToday ? "hero" : "default"}>
          <Card.Glance
            eyebrow={isSelectedToday ? "Today's Prescription" : `Scheduled Day ${selectedDayOfWeek + 1}`}
            title={selectedDay.label}
            status={`${exercises.length} exercises · ~34 min · Target RIR 2`}
          />

          {/* Compact Exercise List (name + target reps only) */}
          <div className="mt-4 pt-3 border-t border-[#1C2436] space-y-2">
            {exercises.map((ex, idx) => (
              <div
                key={ex.id || idx}
                className="flex items-center justify-between py-1.5 text-xs text-slate-300 border-b border-[#1C2436]/50 last:border-b-0"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="font-mono text-[10px] text-slate-500 w-4">{idx + 1}.</span>
                  <span className="font-medium text-slate-200 truncate">{ex.exerciseName}</span>
                </div>
                <span className="font-mono text-[11px] text-amber-400/90 flex-shrink-0 tabular-nums">
                  {ex.sets} × {ex.repRangeLow}-{ex.repRangeHigh}
                </span>
              </div>
            ))}
          </div>

          <Card.Action>
            <div className="space-y-2 w-full">
              <Link
                href={`/session?day=${selectedDay.id}`}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider text-sm font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isSelectedToday ? "Start Today's Session" : "Start Session"}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
              <Link
                href={`/session?day=${selectedDay.id}&mode=preview`}
                className="w-full py-2.5 px-4 bg-[#111622] hover:bg-[#182030] border border-[#1C2436] hover:border-slate-700 text-slate-300 hover:text-white font-editorial font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Preview Exercises & Videos</span>
              </Link>
            </div>
          </Card.Action>
        </Card>
      )}

      {/* 16-Week Mesocycle Roadmap (Category B) */}
      <div className="p-4 rounded-2xl bg-[#111622] border border-[#1C2436] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            16-Week Mesocycle Roadmap
          </span>
          <span className="text-[10px] font-mono text-amber-400 font-semibold">
            Alaa Periodization
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-[#182030] border border-amber-500/40 space-y-1">
            <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 block font-bold">
              Block 1 · Active
            </span>
            <div className="font-editorial font-bold text-white text-xs">Accumulation</div>
            <div className="text-[10px] text-slate-400 font-mono">W1–W6 · RIR 2</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#090C11] border border-[#1C2436] space-y-1 opacity-70">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
              Block 2
            </span>
            <div className="font-editorial font-bold text-white text-xs">Intensification</div>
            <div className="text-[10px] text-slate-400 font-mono">W7–W12 · RIR 1</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#090C11] border border-[#1C2436] space-y-1 opacity-70">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
              Block 3
            </span>
            <div className="font-editorial font-bold text-white text-xs">Realization</div>
            <div className="text-[10px] text-slate-400 font-mono">W13–W16 · 57kg</div>
          </div>
        </div>
      </div>

      {/* Weekly Volume & Postural Allocation Dashboard */}
      <WeeklyVolumeDashboard />

    </div>
  );
}
