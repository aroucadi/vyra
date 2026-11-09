"use client";

import React, { useState } from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { resolveProgramDay } from "@/lib/utils";
import { ProgramDay, ExercisePrescription } from "@/lib/types";
import { RagExercise } from "@/types/exercise-rag";
import { ExerciseDetailSheet } from "@/components/trainee/ExerciseDetailSheet";
import { WeeklyVolumeDashboard } from "@/components/trainee/WeeklyVolumeDashboard";
import {
  Dumbbell,
  Clock,
  ArrowRight,
  ShieldCheck,
  Moon,
  Flame,
  Activity,
  Eye,
  Sparkles,
  ChevronRight,
  Layers,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";

const DAY_FOCUS_META: Record<number, { title: string; subtitle: string; tag: string }> = {
  0: { title: "Upper Power Hypertrophy", subtitle: "Incline Clavicular Bias & Chest Support", tag: "Upper Push" },
  1: { title: "Lat Width & Posterior Core", subtitle: "Vertical Pull & Scapular Depression", tag: "Back Width" },
  2: { title: "Quadriceps & Deceleration Armor", subtitle: "45° Machine Loading & Superset Face Pull", tag: "Knee Armor" },
  3: { title: "Shoulder Geometry & Scapular Base", subtitle: "Neutral Overhead Drive & Hinge Anchor", tag: "Delts & Hinge" },
  4: { title: "Active Recovery & Mobility", subtitle: "Tissue Remodeling & Parasympathetic Tone", tag: "Rest" },
  5: { title: "Restorative Cardio & Hydration", subtitle: "Mitochondrial Flush & Joint Decompression", tag: "Rest" },
  6: { title: "Weekly Mesocycle Reset", subtitle: "Preparation for Progressive Overload Jump", tag: "Reset" },
};

function formatExerciseName(name: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => {
      if (word.startsWith("(") && word.length > 1) {
        return "(" + word.charAt(1).toUpperCase() + word.slice(2).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export default function ProgramCalendarPage() {
  const currentUser = appStore.getCurrentUser();
  const program = appStore.getActiveProgramForTrainee(currentUser.id);
  const resolved = program ? resolveProgramDay(program.startDate) : { weekIndex: 1, dayOfWeek: 0, started: true };

  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(() => resolved.dayOfWeek);
  const [selectedRagExercise, setSelectedRagExercise] = useState<RagExercise | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  if (!program) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto my-auto select-none">
        <div className="w-14 h-14 rounded-2xl bg-[#111622] border border-[#1C2436] flex items-center justify-center text-amber-400 mx-auto shadow-inner">
          <Dumbbell className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-editorial font-bold text-white">No Active Blueprint</h2>
          <p className="text-xs text-slate-400">Initialize your 16-week mesocycle to begin periodized loading.</p>
        </div>
      </div>
    );
  }

  const currentWeek = program.weeks[Math.min(resolved.weekIndex - 1, program.weeks.length - 1)] || program.weeks[0];
  const daysOfWeekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const selectedDay = currentWeek.days.find((d) => d.dayOfWeek === selectedDayOfWeek) || currentWeek.days[0];
  const exercises: ExercisePrescription[] = selectedDay.blocks ? selectedDay.blocks.flatMap((b) => b.exercises) : [];
  const isSelectedToday = resolved.dayOfWeek === selectedDay.dayOfWeek;
  const dayMeta = DAY_FOCUS_META[selectedDay.dayOfWeek] || {
    title: selectedDay.label,
    subtitle: "Biomechanical Protocol",
    tag: "Training",
  };

  // Inspect exercise in detail modal
  const handleInspectExercise = async (ex: ExercisePrescription) => {
    try {
      const res = await fetch(`/api/exercises?q=${encodeURIComponent(ex.exerciseName)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.exercises && data.exercises.length > 0) {
          setSelectedRagExercise(data.exercises[0]);
          setIsDetailOpen(true);
          return;
        }
      }
    } catch {
      // Fallback synthetic exercise
    }

    const primaryTarget = ex.targetMuscleGroups?.[0] || "Target Motor Pattern";
    setSelectedRagExercise({
      id: ex.exerciseId || ex.exerciseName.toLowerCase().replace(/\s+/g, "_"),
      name: ex.exerciseName,
      target: primaryTarget,
      bodyPart: "Upper Body",
      equipment: (ex.selectedEquipment as string) || "Gym Equipment",
      category: ex.category || "strength",
      secondaryMuscles: ex.targetMuscleGroups?.slice(1) || [],
      description: ex.formCueText || "Biomechanical compound movement.",
      instructions: [
        ex.formCueText || "Position yourself with a stable, locked base of support and neutral spine.",
        "Initiate movement through the target muscle group with a strict 3-second eccentric tempo.",
        "Contract powerfully through the concentric phase while maintaining joint alignment.",
      ],
    });
    setIsDetailOpen(true);
  };

  return (
    <div className="flex-1 pb-28 px-4 pt-5 max-w-md mx-auto w-full space-y-5 animate-in fade-in duration-300 font-body select-none">
      
      {/* 1. Header: Brand Eyebrow + Mesocycle Block Status */}
      <header className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Week {resolved.weekIndex} of {program.durationWeeks}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Block 1 · Accumulation
            </span>
          </div>

          <Link
            href="/posture"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#111622] border border-[#1C2436] hover:border-amber-500/40 text-[10px] font-mono font-bold text-amber-400 hover:text-amber-300 transition shrink-0 shadow-sm"
          >
            <Activity className="w-3 h-3" />
            <span>Radar</span>
          </Link>
        </div>

        <div className="pt-1">
          <h1 className="text-2xl font-editorial font-bold text-white tracking-tight">
            Program Architecture
          </h1>
          <p className="text-xs text-slate-400 font-body leading-relaxed mt-0.5">
            Strict 3-slot split engineered for clavicular width and joint longevity.
          </p>
        </div>
      </header>

      {/* 2. Tactical 7-Day Split Navigator (High-Speed Touch Carousel) */}
      <div className="p-2 bg-[#111622] border border-[#1C2436] rounded-2xl flex items-center justify-between gap-1 shadow-sm">
        {currentWeek.days.map((day, idx) => {
          const isSelected = selectedDayOfWeek === day.dayOfWeek;
          const isToday = resolved.dayOfWeek === day.dayOfWeek;
          const label = daysOfWeekLabels[day.dayOfWeek] || `D${idx + 1}`;
          const isRest = day.isRestDay;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedDayOfWeek(day.dayOfWeek)}
              className={clsx(
                "flex-1 py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer relative",
                isSelected
                  ? "bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/25 scale-[1.03]"
                  : "hover:bg-[#182030] text-slate-400 hover:text-white"
              )}
            >
              <span
                className={clsx(
                  "text-[9px] uppercase font-mono tracking-wider",
                  isSelected ? "text-slate-950 font-bold" : "text-slate-400"
                )}
              >
                {label}
              </span>
              <span
                className={clsx(
                  "text-xs font-bold font-mono tabular-nums",
                  isSelected ? "text-slate-950" : "text-white"
                )}
              >
                {idx + 1}
              </span>

              {/* Day State Indicator: Rest vs Training vs Today */}
              {isRest ? (
                <span
                  className={clsx(
                    "text-[8px] font-mono",
                    isSelected ? "text-slate-950" : "text-slate-500"
                  )}
                >
                  REST
                </span>
              ) : isToday ? (
                <span
                  className={clsx(
                    "w-1.5 h-1.5 rounded-full animate-pulse",
                    isSelected ? "bg-slate-950" : "bg-amber-400"
                  )}
                  title="Scheduled Today"
                />
              ) : (
                <span
                  className={clsx(
                    "w-1 h-1 rounded-full",
                    isSelected ? "bg-slate-950" : "bg-slate-600"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. HERO SESSION CARD / REST DAY PROTOCOL */}
      {selectedDay.isRestDay || exercises.length === 0 ? (
        <div className="p-6 rounded-3xl bg-[#111622] border border-[#1C2436] space-y-4 text-center shadow-lg relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto shadow-inner">
            <Moon className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-400 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
              Cellular Remodeling
            </span>
            <h3 className="text-lg font-editorial font-bold text-white pt-1">
              Active Recovery & Tissue Repair
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Zero heavy axial loading today. Target 20 minutes of parasympathetic walking, hydration, and myofascial release.
            </p>
          </div>

          <div className="p-3.5 bg-[#090C11] border border-[#1C2436] rounded-2xl text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono uppercase text-sky-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-sky-400" />
                Prescribed Mobility Protocols
              </span>
              <span className="text-[10px] font-mono text-slate-500">10 Min</span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Half-kneeling hip flexor stretch (2 × 45s) + 12 supine chin tucks to decompress the cervical spine.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#111622] border border-[#1C2436] p-5 sm:p-6 space-y-4 shadow-xl relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Session Header Slot */}
          <div className="flex items-start justify-between gap-3 border-b border-[#1C2436] pb-3.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    isSelectedToday
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse"
                      : "bg-[#182030] text-slate-300 border-[#1C2436]"
                  )}
                >
                  {isSelectedToday ? "Scheduled Today" : `Day ${selectedDay.dayOfWeek + 1} Protocol`}
                </span>
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  {dayMeta.tag}
                </span>
              </div>
              <h3 className="text-xl font-editorial font-bold text-white tracking-tight pt-0.5">
                {dayMeta.title}
              </h3>
              <p className="text-xs text-slate-400">
                {dayMeta.subtitle}
              </p>
            </div>

            <div className="text-right flex-shrink-0 space-y-0.5 pt-1">
              <span className="text-xs font-mono font-bold text-amber-400 block tabular-nums">
                {exercises.length} Exercises
              </span>
              <span className="text-[10px] font-mono text-slate-500 block">~34 min floor</span>
            </div>
          </div>

          {/* High-Performance Exercise Stack */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider px-1">
              <span>Movement Sequence</span>
              <span>Prescription</span>
            </div>

            <div className="space-y-1.5">
              {exercises.map((ex, idx) => (
                <div
                  key={ex.id || idx}
                  onClick={() => handleInspectExercise(ex)}
                  className="p-3 rounded-2xl bg-[#090C11] border border-[#1C2436] hover:border-amber-500/40 hover:bg-[#141B2A] transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-lg bg-[#182030] border border-[#1C2436] text-[10px] font-mono font-bold text-amber-400 flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <span className="font-semibold text-white truncate text-xs block group-hover:text-amber-300 transition-colors">
                        {formatExerciseName(ex.exerciseName)}
                      </span>
                      {ex.targetMuscleGroups && ex.targetMuscleGroups.length > 0 && (
                        <span className="text-[10px] font-mono text-slate-500 block capitalize">
                          {ex.targetMuscleGroups.join(" · ")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-1 rounded-lg bg-[#111622] border border-[#1C2436] text-[11px] font-mono font-bold text-amber-400 tabular-nums">
                      {ex.sets} × {ex.repRangeLow}-{ex.repRangeHigh}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Primary Action Controls */}
          <div className="space-y-2 pt-2">
            <Link
              href={`/session?day=${selectedDay.id}`}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider text-sm font-black rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSelectedToday ? "Start Today's Session" : "Start Day Protocol"}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>

            <Link
              href={`/session?day=${selectedDay.id}&mode=preview`}
              className="w-full py-2.5 px-4 bg-[#090C11] hover:bg-[#182030] border border-[#1C2436] hover:border-slate-700 text-slate-300 hover:text-white font-editorial font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Preview Setup & Video Cues</span>
            </Link>
          </div>
        </div>
      )}

      {/* 4. 16-Week Mesocycle Pipeline */}
      <div className="p-5 rounded-3xl bg-[#111622] border border-[#1C2436] space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-editorial font-bold text-white uppercase tracking-wider">
              16-Week Periodization Pipeline
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            Phase 1
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {/* Block 1 */}
          <div className="p-3 rounded-2xl bg-[#182030] border border-amber-500/40 space-y-1 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-full blur-xl" />
            <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 block font-bold">
              Active Block
            </span>
            <div className="font-editorial font-bold text-white text-xs">Accumulation</div>
            <div className="text-[10px] text-slate-400 font-mono">W1–W6 · RIR 2</div>
          </div>

          {/* Block 2 */}
          <div className="p-3 rounded-2xl bg-[#090C11] border border-[#1C2436] space-y-1 opacity-60">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block font-bold">
              Block 2
            </span>
            <div className="font-editorial font-bold text-white text-xs">Intensify</div>
            <div className="text-[10px] text-slate-400 font-mono">W7–W12 · RIR 1</div>
          </div>

          {/* Block 3 */}
          <div className="p-3 rounded-2xl bg-[#090C11] border border-[#1C2436] space-y-1 opacity-60">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block font-bold">
              Block 3
            </span>
            <div className="font-editorial font-bold text-white text-xs">Realize</div>
            <div className="text-[10px] text-slate-400 font-mono">W13–W16 · 57kg</div>
          </div>
        </div>
      </div>

      {/* 5. Elevated Biomechanical Architecture HUD */}
      <WeeklyVolumeDashboard />

      {/* 6. Biomechanical Exercise Detail Modal */}
      <ExerciseDetailSheet
        exercise={selectedRagExercise}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
