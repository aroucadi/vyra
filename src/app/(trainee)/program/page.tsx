"use client";

import React, { useState } from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { resolveProgramDay } from "@/lib/utils";
import { ProgramDay, ExercisePrescription } from "@/lib/types";
import { Plan } from "@/components/primitives/Plan";
import { Card } from "@/components/primitives/Card";
import { Dumbbell, Clock, ArrowRight, ShieldCheck, Moon, Flame } from "lucide-react";
import { clsx } from "clsx";

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
    <div className="flex-1 pb-24 px-4 pt-6 max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
            Week {resolved.weekIndex} of {program.durationWeeks}
          </span>
          <span className="text-[11px] font-mono text-slate-500">Block 1 Hypertrophy</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Program Schedule</h1>
        <p className="text-xs text-slate-400">
          Periodized progression calibrated to your recovery curve.
        </p>
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
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-center">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Active Recovery Day</h3>
            <p className="text-xs text-slate-400 mt-1">
              No heavy loading scheduled. Focus on 20-minute restorative walk, hydration, and tissue remodeling.
            </p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-left text-xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Mobility Cue</span>
            <p className="text-slate-300">Half-kneeling hip flexor stretch & 10 supine chin tucks.</p>
          </div>
        </div>
      ) : (
        <Card variant={isSelectedToday ? "hero" : "default"}>
          <Card.Glance
            eyebrow={isSelectedToday ? "Today's Prescription" : `Scheduled Day ${selectedDayOfWeek + 1}`}
            title={selectedDay.label}
            status={`${exercises.length} exercises · ~55 min · Target RIR 2`}
          />

          {/* Compact Exercise List (name + target reps only) */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
            {exercises.map((ex, idx) => (
              <div
                key={ex.id || idx}
                className="flex items-center justify-between py-1.5 text-xs text-slate-300 border-b border-slate-800/40 last:border-b-0"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="font-mono text-[10px] text-slate-500 w-4">{idx + 1}.</span>
                  <span className="font-medium text-slate-200 truncate">{ex.exerciseName}</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400 flex-shrink-0 tabular">
                  {ex.sets} × {ex.repRangeLow}-{ex.repRangeHigh}
                </span>
              </div>
            ))}
          </div>

          <Card.Action>
            <Link
              href={`/session?day=${selectedDay.id}`}
              className="w-full py-3 px-5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{isSelectedToday ? "Start Today's Session" : "Preview Session Flow"}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </Card.Action>
        </Card>
      )}

    </div>
  );
}
