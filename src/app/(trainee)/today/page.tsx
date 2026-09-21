"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Play,
  CheckCircle2,
  Circle,
  Video,
  Flame,
  Clock,
  Dumbbell,
  Shield,
  Layers,
  Sparkles,
  Info,
  Droplets,
  Pill,
  Utensils,
  ShieldCheck,
  ExternalLink,
  Compass,
} from "lucide-react";
import { appStore } from "@/lib/store";
import { resolveProgramDay, isSafeUrl } from "@/lib/utils";
import { EquipmentType } from "@/lib/types";
import { workdayErgonomicsRoutines } from "@/db/seed/master-transformation-program";
import { ExerciseConfidenceCard } from "@/components/trainee/ExerciseConfidenceCard";
import { VyraLifeHub } from "@/components/trainee/VyraLifeHub";

export default function TodayPage() {
  const currentUser = appStore.getCurrentUser();
  const program = appStore.getActiveProgramForTrainee(currentUser.id);

  // Equipment variations override state per exercise ID
  const [equipmentOverrides, setEquipmentOverrides] = useState<{ [exerciseId: string]: EquipmentType }>({});

  // Active Exercise Confidence Card Preview
  const [previewGuideExercise, setPreviewGuideExercise] = useState<{
    id: string;
    name: string;
    selectedEquipment: EquipmentType;
    equipmentVariations?: any[];
    videoUrl?: string;
  } | null>(null);

  // Daily protocol interactive state
  const todayStr = new Date().toISOString().split("T")[0];

  const [mobilityChecked, setMobilityChecked] = useState<{ [key: string]: boolean }>({
    m1: true,
    m2: false,
    m3: false,
  });

  const [mealsChecked, setMealsChecked] = useState<{ [mealTime: string]: boolean }>({});
  const [ergonomicsChecked, setErgonomicsChecked] = useState<{ [key: string]: boolean }>({});
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  const getMobilityVideoUrl = (drillText: string): string => {
    if (drillText.includes("Chin Tuck")) return "https://www.youtube.com/results?search_query=supine+chin+tuck+exercise+proper+form";
    if (drillText.includes("Vacuum")) return "https://www.youtube.com/results?search_query=stomach+vacuum+exercise+form";
    if (drillText.includes("Glute Bridge")) return "https://www.youtube.com/results?search_query=floor+glute+bridge+form";
    if (drillText.includes("Hip Flexor")) return "https://www.youtube.com/results?search_query=half+kneeling+hip+flexor+stretch+form";
    if (drillText.includes("Pec Minor") || drillText.includes("Doorway Pec")) return "https://www.youtube.com/results?search_query=high+angle+doorway+pec+minor+stretch+form";
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(drillText.split(":")[0])}`;
  };

  // Resolve today's program day
  const resolved = program
    ? resolveProgramDay(program.startDate)
    : { started: false, weekIndex: 1, dayOfWeek: 0, elapsedDays: 0 };
  const programDayNumber = Math.max(1, resolved.elapsedDays + 1);

  // Active supplement doses for today
  const activeDoses = program ? appStore.getActiveSupplementDosesForDay(program.id, programDayNumber) : [];

  // Supplement logs state
  const [suppLogs, setSuppLogs] = useState<{ [doseId: string]: boolean }>(() => {
    const logs = appStore.getSupplementLogsForDate(currentUser.id, todayStr);
    const map: { [doseId: string]: boolean } = {};
    logs.forEach((l) => {
      if (l.status === "taken") map[l.doseId] = true;
    });
    return map;
  });

  // Hydration state
  const hydrationGoal = appStore.getHydrationGoal(currentUser.id) || {
    id: "hg_default",
    programId: program?.id || "prog_hypertrophy_1",
    traineeId: currentUser.id,
    dailyTargetMl: 3500,
    workoutDayBonusMl: 500,
  };

  const [hydrationCurrentMl, setHydrationCurrentMl] = useState<number>(() => {
    return appStore.getTodayHydrationTotal(currentUser.id, todayStr);
  });

  if (!program) {
    return (
      <div className="p-6 text-center space-y-4 my-auto">
        <div className="w-16 h-16 rounded-full bg-[#162032] border border-[#334155] mx-auto flex items-center justify-center">
          <Dumbbell className="w-8 h-8 text-[#10B981]" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">No Active Program</h2>
        <p className="text-sm text-slate-400">
          Your coach has not assigned a published program yet.
        </p>
      </div>
    );
  }

  const currentWeek = program.weeks.find((w) => w.weekIndex === resolved.weekIndex) || program.weeks[0];
  const currentDay = currentWeek?.days.find((d) => d.dayOfWeek === resolved.dayOfWeek) || currentWeek?.days[0];

  const targetHydrationMl = currentDay?.isRestDay
    ? hydrationGoal.dailyTargetMl
    : hydrationGoal.dailyTargetMl + (hydrationGoal.workoutDayBonusMl || 0);

  const toggleMobility = (key: string) => {
    setMobilityChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleSupplement = (doseId: string, protocolId: string, supplementName: string) => {
    const updatedLog = appStore.toggleSupplementDose(
      currentUser.id,
      program.id,
      protocolId,
      doseId,
      todayStr,
      supplementName
    );
    setSuppLogs((prev) => ({
      ...prev,
      [doseId]: updatedLog.status === "taken",
    }));
  };

  const handleAddHydration = (amountMl: number) => {
    appStore.logHydration(currentUser.id, amountMl, todayStr);
    setHydrationCurrentMl((prev) => prev + amountMl);
  };

  return (
    <div className="px-4 py-5 space-y-5">
      {/* 1. Top Header & Readiness Bar */}
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#F8FAFC] tracking-tight">
              Good morning, {currentUser.name.split(" ")[0]}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block animate-pulse" />
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#8B5CF6]" />
                Coach {appStore.getUser(program.trainerId)?.name || "Trainer"} online
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#162032] border border-[#06B6D4]/40 text-[#06B6D4] text-xs font-mono font-semibold">
              <Sparkles className="w-3 h-3" />
              Readiness 92%
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">Optimal Load State</p>
          </div>
        </div>

        {/* Program Pill Bar */}
        <div className="bg-[#162032] border border-[#1E293B] rounded-lg p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-bold text-[11px] uppercase tracking-wide">
              {program.title}
            </span>
            <span className="text-slate-300 font-medium">
              Week {resolved.weekIndex} • Day {resolved.dayOfWeek + 1}
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            {currentDay?.isRestDay ? "Rest" : currentDay?.label || "Training"}
          </span>
        </div>
      </header>

      {/* Vyra Life OS: 5 Core Optimization Pillars */}
      <VyraLifeHub compact={true} />

      {/* 2. Chronological Daily Supplement Checklist Card */}
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-[#06B6D4]" />
            <h2 className="text-sm font-bold text-[#F8FAFC]">Supplement Protocol</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {Object.values(suppLogs).filter(Boolean).length} of {activeDoses.length} taken
          </span>
        </div>

        {/* Phase Notification Banner */}
        {(() => {
          const creatineEntry = activeDoses.find((d) => d.protocol.name.toLowerCase().includes("creatine"));
          const phaseName = creatineEntry?.phase.name || "Active";
          const creatineDoses = activeDoses.filter((d) => d.protocol.name.toLowerCase().includes("creatine"));
          const totalDoseGrams = creatineDoses.reduce((acc, curr) => acc + curr.dose.amount, 0);

          return (
            <div className="px-3 py-2 rounded-lg bg-[#0F172A] border border-[#06B6D4]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
                <span className="text-xs text-slate-200 font-medium">
                  Creatine: {phaseName} Phase (Day {programDayNumber} of {program.durationWeeks * 7})
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/20">
                {creatineDoses.length} {creatineDoses.length === 1 ? "dose" : "doses"} • {totalDoseGrams}g daily
              </span>
            </div>
          );
        })()}

        {/* Time-Ordered Doses Checklist */}
        <div className="space-y-2">
          {activeDoses.map(({ protocol, dose }) => {
            const isTaken = !!suppLogs[dose.id];
            return (
              <button
                key={dose.id}
                onClick={() => handleToggleSupplement(dose.id, protocol.id, protocol.name)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition text-left ${
                  isTaken
                    ? "bg-[#0F172A]/70 border-[#10B981]/40 text-slate-400"
                    : "bg-[#0F172A] border-[#1E293B] hover:border-slate-700 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono font-bold text-[#06B6D4] bg-[#162032] px-1.5 py-0.5 rounded border border-[#334155]">
                    {dose.targetTime || "Daily"}
                  </span>
                  <div>
                    <p className={`text-xs font-bold ${isTaken ? "line-through text-slate-500" : "text-slate-100"}`}>
                      {protocol.name} • {dose.amount}{dose.unit}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {dose.timingType === "meal_linked" ? `Anchor: ${dose.mealLabel}` : `Timing: ${dose.standaloneTiming?.replace("_", " ")}`}
                      {dose.notes ? ` — ${dose.notes}` : ""}
                    </p>
                  </div>
                </div>

                {isTaken ? (
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Hydration Target & Running-Total Card */}
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-[#06B6D4]" />
            <h2 className="text-sm font-bold text-[#F8FAFC]">Hydration Intake</h2>
          </div>
          <span className="text-[11px] font-mono text-[#06B6D4] font-semibold">
            {hydrationCurrentMl} / {targetHydrationMl} ml ({(hydrationCurrentMl / 1000).toFixed(1)}L / {(targetHydrationMl / 1000).toFixed(1)}L)
          </span>
        </div>

        {/* Running Total Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-[#0F172A] rounded-full h-2.5 overflow-hidden border border-[#1E293B]">
            <div
              style={{ width: `${Math.min(100, Math.round((hydrationCurrentMl / targetHydrationMl) * 100))}%` }}
              className="bg-gradient-to-r from-[#06B6D4] to-[#10B981] h-2.5 rounded-full transition-all duration-300"
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>{Math.round((hydrationCurrentMl / targetHydrationMl) * 100)}% of daily target</span>
            <span>{Math.max(0, targetHydrationMl - hydrationCurrentMl)} ml remaining</span>
          </div>
        </div>

        {/* Quick-Add Buttons */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {[
            { label: "+250ml", desc: "Glass", amount: 250 },
            { label: "+500ml", desc: "Bottle", amount: 500 },
            { label: "+750ml", desc: "Shaker", amount: 750 },
            { label: "+1000ml", desc: "Jug", amount: 1000 },
          ].map((btn) => (
            <button
              key={btn.amount}
              onClick={() => handleAddHydration(btn.amount)}
              className="p-2 rounded-lg bg-[#0F172A] border border-[#1E293B] hover:border-[#06B6D4]/50 hover:bg-[#06B6D4]/10 transition text-center group"
            >
              <span className="text-xs font-mono font-bold text-slate-200 group-hover:text-[#06B6D4] block">
                {btn.label}
              </span>
              <span className="text-[10px] text-slate-500 block">{btn.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 4. Warmup & Mobility Protocol Card */}
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#F59E0B]" />
            <div>
              <h2 className="text-sm font-bold text-[#F8FAFC]">
                {currentDay?.morningRoutine && currentDay.morningRoutine.length > 0
                  ? "9-Minute Morning Mobility & Neck Alignment Routine"
                  : "Warmup & Mobility Routine"}
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">Bedroom Mat • 07:15 – 07:24 AM</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {Object.values(mobilityChecked).filter(Boolean).length} of{" "}
            {currentDay?.morningRoutine && currentDay.morningRoutine.length > 0
              ? currentDay.morningRoutine.length
              : 3}{" "}
            done
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {(currentDay?.morningRoutine && currentDay.morningRoutine.length > 0
            ? currentDay.morningRoutine.map((drill, idx) => ({ id: `drill_${idx}`, text: drill }))
            : [
                { id: "m1", text: "Thoracic spine foam roller rotations (10x)" },
                { id: "m2", text: "Overhead band pull-aparts (15x)" },
                { id: "m3", text: "Scapular wall slides & wrist extensions" },
              ]
          ).map((item) => {
            const isChecked = !!mobilityChecked[item.id];
            const videoUrl = getMobilityVideoUrl(item.text);

            return (
              <div
                key={item.id}
                className={`p-2.5 rounded-lg border transition ${
                  isChecked
                    ? "bg-[#0F172A]/60 border-[#10B981]/30 text-slate-400"
                    : "bg-[#0F172A] border-[#1E293B] hover:border-slate-700 text-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() => toggleMobility(item.id)}
                    className="flex items-start gap-2 flex-1 cursor-pointer"
                  >
                    {isChecked ? (
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    )}
                    <span className={`leading-snug ${isChecked ? "line-through text-slate-500" : "text-slate-200"}`}>
                      {item.text}
                    </span>
                  </div>

                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded bg-[#162032] border border-[#334155] text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/50 transition shrink-0"
                    title="Watch Exercise Demonstration Video"
                  >
                    <Video className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4b. Workday Ergonomics & Pre-Bed Decompression Card */}
      {workdayErgonomicsRoutines && workdayErgonomicsRoutines.length > 0 && (
        <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#06B6D4]" />
              <div>
                <h2 className="text-sm font-bold text-[#F8FAFC]">Workday Ergonomics & Pre-Bed Decompression</h2>
                <span className="text-[10px] text-slate-400 font-mono">Posture Reinforcement & Disc Hydration</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {Object.values(ergonomicsChecked).filter(Boolean).length} of {workdayErgonomicsRoutines.length} logged
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {workdayErgonomicsRoutines.map((routine, idx) => {
              const habitId = `ergo_${idx}`;
              const isChecked = !!ergonomicsChecked[habitId];

              return (
                <div
                  key={habitId}
                  onClick={() => setErgonomicsChecked((prev) => ({ ...prev, [habitId]: !prev[habitId] }))}
                  className={`p-2.5 rounded-lg border transition cursor-pointer flex items-start gap-2.5 ${
                    isChecked
                      ? "bg-[#0F172A]/60 border-[#10B981]/30 text-slate-400"
                      : "bg-[#0F172A] border-[#1E293B] hover:border-slate-700 text-slate-200"
                  }`}
                >
                  {isChecked ? (
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <span className={`leading-snug ${isChecked ? "line-through text-slate-500" : "text-slate-200"}`}>
                      {routine}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Daily Schedule & Nutrient Architecture Card */}
      {currentDay?.nutrition?.dailyMeals && currentDay.nutrition.dailyMeals.length > 0 && (
        <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#10B981]" />
              <h2 className="text-sm font-bold text-[#F8FAFC]">Daily Schedule & Nutrient Architecture</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                {Object.values(mealsChecked).filter(Boolean).length} of {currentDay.nutrition.dailyMeals.length} logged
              </span>
              <button
                type="button"
                onClick={() => setShowFullSchedule(!showFullSchedule)}
                className="text-xs text-[#06B6D4] hover:underline"
              >
                {showFullSchedule ? "Compact" : "View All"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0F172A] border border-[#1E293B] text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-300">
                Target: <strong className="text-[#10B981] font-mono">{currentDay.nutrition.targetKcal ?? 2700} kcal</strong>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">
                Protein: <strong className="text-[#06B6D4] font-mono">{currentDay.nutrition.targetProteinGrams}g</strong>
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Precision Milestones</span>
          </div>

          <div className="space-y-2">
            {(showFullSchedule
              ? currentDay.nutrition.dailyMeals
              : currentDay.nutrition.dailyMeals.slice(0, 4)
            ).map((meal) => {
              const isChecked = !!mealsChecked[meal.time];
              return (
                <div
                  key={meal.time}
                  onClick={() => setMealsChecked((prev) => ({ ...prev, [meal.time]: !prev[meal.time] }))}
                  className={`p-2.5 rounded-lg border transition cursor-pointer text-left ${
                    isChecked
                      ? "bg-[#0F172A]/60 border-[#10B981]/40 text-slate-400"
                      : "bg-[#0F172A] border-[#1E293B] hover:border-slate-700 text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-[#10B981] bg-[#162032] px-1.5 py-0.5 rounded border border-[#334155]">
                        {meal.time}
                      </span>
                      <span className={`text-xs font-bold ${isChecked ? "line-through text-slate-500" : "text-slate-100"}`}>
                        {meal.label}
                      </span>
                    </div>
                    {isChecked ? (
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 pl-1">
                    {meal.foods}
                    {meal.calories ? ` (~${meal.calories} kcal, ${meal.proteinGrams}g P)` : ""}
                  </p>
                  {meal.supplements && meal.supplements !== "None" && (
                    <p className="text-[10px] text-[#06B6D4] mt-0.5 pl-1 flex items-center gap-1 font-mono">
                      <span>💊 {meal.supplements}</span>
                    </p>
                  )}
                  {meal.rationale && showFullSchedule && (
                    <p className="text-[10px] text-slate-500 mt-1 pl-1 italic">
                      Rationale: {meal.rationale}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {!showFullSchedule && currentDay.nutrition.dailyMeals.length > 4 && (
            <button
              type="button"
              onClick={() => setShowFullSchedule(true)}
              className="w-full py-1.5 text-center text-xs text-[#06B6D4] hover:text-white bg-[#0F172A] rounded-lg border border-[#1E293B] transition"
            >
              Show all {currentDay.nutrition.dailyMeals.length} milestones (+{currentDay.nutrition.dailyMeals.length - 4} more)
            </button>
          )}
        </section>
      )}

      {/* 3. Workout Prescription Card */}
      {currentDay?.isRestDay ? (
        <section className="bg-[#162032] rounded-xl border border-[#06B6D4]/30 p-5 text-center space-y-4 shadow-lg">
          <div className="w-12 h-12 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/40 mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6 text-[#06B6D4]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Scheduled Rest & Regeneration</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
              Today is dedicated to muscular rebuilding, parasympathetic tone, and glycogen replenishment.
            </p>
          </div>

          <div className="pt-3 border-t border-[#1E293B] text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                Test or Preview Workouts
              </span>
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                Active Protocol
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Select any of your 4 Master Transformation protocols below to test equipment swaps, watch exercise form guides, or log sets:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {currentWeek?.days
                .filter((d) => d.blocks && d.blocks.length > 0)
                .map((d) => (
                  <Link
                    key={d.dayOfWeek}
                    href={`/session?day=${d.dayOfWeek}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#0F172A] border border-[#1E293B] hover:border-[#10B981] hover:bg-[#10B981]/5 transition text-xs group"
                  >
                    <div>
                      <p className="font-bold text-slate-200 group-hover:text-[#10B981] transition">
                        {d.label.split(":")[0]?.trim() || `Day ${d.dayOfWeek + 1}`}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {d.label.split(":")[1]?.trim() || "Workout Protocol"}
                      </p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#162032] border border-[#334155] flex items-center justify-center text-slate-400 group-hover:text-[#10B981] group-hover:border-[#10B981] shrink-0 transition">
                      <Play className="w-3 h-3 fill-current" />
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-[#162032] rounded-xl border border-[#334155] p-4 space-y-4 shadow-lg">
          <div className="flex items-start justify-between border-b border-[#1E293B] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <h2 className="text-base font-black text-[#F8FAFC] tracking-tight">
                  {currentDay?.label || "Push Hypertrophy A"}
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#06B6D4]" />
                  Est. {currentDay?.blocks ? Math.max(30, Math.round(currentDay.blocks.reduce((acc, b) => acc + b.exercises.reduce((sAcc, e) => sAcc + e.sets, 0), 0) * 3.5)) : 52} mins
                </span>
                <span>•</span>
                <span>{currentDay?.blocks?.reduce((acc, b) => acc + b.exercises.length, 0) || 4} Movements</span>
                <span>•</span>
                <span>{currentDay?.blocks?.reduce((acc, b) => acc + b.exercises.reduce((sAcc, e) => sAcc + e.sets, 0), 0) || 12} Sets</span>
              </div>
            </div>

            <Link
              href={
                Object.keys(equipmentOverrides).length > 0
                  ? `/session?day=${currentDay.dayOfWeek}&overrides=${encodeURIComponent(JSON.stringify(equipmentOverrides))}`
                  : `/session?day=${currentDay.dayOfWeek}`
              }
              className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              Start
            </Link>
          </div>

          {/* Exercise Rows */}
          <div className="space-y-3">
            {currentDay?.blocks && currentDay.blocks.length > 0 ? (
              currentDay.blocks.map((b, bIdx) => {
                if (b.type === "superset" || b.type === "circuit") {
                  return (
                    <div key={b.id || bIdx} className="border border-[#06B6D4]/40 bg-[#06B6D4]/5 rounded-xl p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#06B6D4]" />
                          <span className="text-xs font-bold text-[#06B6D4] tracking-wide uppercase">
                            {b.type === "superset" ? "Superset" : "Circuit"} ({b.exercises.length} Movements)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          Shared Rest {b.exercises[b.exercises.length - 1]?.restSeconds || 60}s
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {b.exercises.map((ex, exIdx) => {
                          const activeEquipment = equipmentOverrides[ex.id] || ex.selectedEquipment || (ex.equipmentVariations && ex.equipmentVariations[0]?.equipmentType) || "machine";
                          const activeVariant = ex.equipmentVariations?.find((v) => v.equipmentType === activeEquipment);
                          const displayName = activeVariant ? activeVariant.exerciseName : ex.exerciseName;
                          const displayCue = activeVariant ? activeVariant.formCue : ex.formCueText;
                          const displayVideo = activeVariant?.videoUrl || ex.videoUrl;

                          return (
                            <div key={ex.id || exIdx} className="bg-[#0F172A] p-2.5 rounded-lg border border-[#1E293B] space-y-2">
                              <div className="flex justify-between items-start text-xs font-bold text-slate-200">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span>
                                      {bIdx + 1}.{String.fromCharCode(97 + exIdx)} {displayName}
                                    </span>
                                    {activeVariant && (
                                      <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20">
                                        {activeEquipment}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[#10B981] font-mono text-[11px]">
                                    {ex.sets} × {ex.repRangeLow}–{ex.repRangeHigh} @ {ex.rirScheme?.[0] ?? 1} RIR
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewGuideExercise({
                                        id: ex.id,
                                        name: displayName,
                                        selectedEquipment: activeEquipment,
                                        equipmentVariations: ex.equipmentVariations,
                                        videoUrl: displayVideo,
                                      })
                                    }
                                    className="text-slate-300 hover:text-[#06B6D4] flex items-center gap-1 text-[10px] bg-[#162032] px-1.5 py-0.5 rounded border border-[#334155] font-semibold transition"
                                  >
                                    <ShieldCheck className="w-3 h-3 text-[#06B6D4]" />
                                    <span>Guide</span>
                                  </button>
                                  {displayVideo && (
                                    <a
                                      href={displayVideo}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-slate-400 hover:text-[#06B6D4] flex items-center gap-1 text-[10px] bg-[#162032] px-1.5 py-0.5 rounded border border-[#334155]"
                                    >
                                      <Video className="w-3 h-3 text-[#06B6D4]" />
                                      <span>Video</span>
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Superset 4-Option Equipment Selector */}
                              {ex.equipmentVariations && ex.equipmentVariations.length > 0 && (
                                <div className="grid grid-cols-4 gap-1 pt-0.5">
                                  {ex.equipmentVariations.map((v) => {
                                    const isSelected = activeEquipment === v.equipmentType;
                                    return (
                                      <button
                                        key={v.equipmentType}
                                        type="button"
                                        onClick={() =>
                                          setEquipmentOverrides((prev) => ({
                                            ...prev,
                                            [ex.id]: v.equipmentType,
                                          }))
                                        }
                                        className={`px-1 py-0.5 rounded text-center text-[9px] font-semibold uppercase tracking-wider transition border ${
                                          isSelected
                                            ? "bg-[#10B981] text-slate-950 border-[#10B981] font-bold shadow-sm"
                                            : "bg-[#162032] text-slate-400 border-[#334155] hover:text-slate-200"
                                        }`}
                                      >
                                        {v.equipmentType}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {displayCue && (
                                <p className="text-[10px] text-slate-400 mt-0.5 border-l border-[#10B981] pl-1.5">
                                  {displayCue}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return b.exercises.map((ex, exIdx) => {
                  const activeEquipment = equipmentOverrides[ex.id] || ex.selectedEquipment || (ex.equipmentVariations && ex.equipmentVariations[0]?.equipmentType) || "machine";
                  const activeVariant = ex.equipmentVariations?.find((v) => v.equipmentType === activeEquipment);
                  const displayName = activeVariant ? activeVariant.exerciseName : ex.exerciseName;
                  const displayCue = activeVariant ? activeVariant.formCue : ex.formCueText;
                  const displayVideo = activeVariant?.videoUrl || ex.videoUrl;

                  return (
                    <div key={ex.id || exIdx} className="bg-[#0F172A] rounded-lg p-3 border border-[#1E293B] space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[#F8FAFC]">
                              {bIdx + 1}. {displayName}
                            </h3>
                            {activeVariant && (
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20">
                                {activeEquipment}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono font-semibold text-[#10B981]">
                              {ex.sets} sets × {ex.repRangeLow}–{ex.repRangeHigh} reps
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-[#162032] border border-[#334155] text-[10px] text-[#06B6D4] font-mono">
                              @ {ex.rirScheme?.[0] ?? 2} RIR
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-[#162032] border border-[#334155] text-[10px] text-slate-300 font-mono">
                              Rest {ex.restSeconds}s
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewGuideExercise({
                                id: ex.id,
                                name: displayName,
                                selectedEquipment: activeEquipment,
                                equipmentVariations: ex.equipmentVariations,
                                videoUrl: displayVideo,
                              })
                            }
                            className="text-slate-300 hover:text-[#06B6D4] flex items-center gap-1 text-[11px] bg-[#162032] px-2 py-1 rounded border border-[#334155] font-semibold transition"
                            title="Preview Exercise Confidence Card"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-[#06B6D4]" />
                            <span>Guide</span>
                          </button>
                          {displayVideo && isSafeUrl(displayVideo) && (
                            <a
                              href={displayVideo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-[#06B6D4] flex items-center gap-1 text-[11px] bg-[#162032] px-2 py-1 rounded border border-[#334155]"
                            >
                              <Video className="w-3.5 h-3.5 text-[#06B6D4]" />
                              <span>Video</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* 4-Option Equipment Matrix Selector */}
                      {ex.equipmentVariations && ex.equipmentVariations.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            Equipment Variant (Like-For-Like Swap):
                          </span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {ex.equipmentVariations.map((v) => {
                              const isSelected = activeEquipment === v.equipmentType;
                              return (
                                <button
                                  key={v.equipmentType}
                                  type="button"
                                  onClick={() =>
                                    setEquipmentOverrides((prev) => ({
                                      ...prev,
                                      [ex.id]: v.equipmentType,
                                    }))
                                  }
                                  className={`px-1.5 py-1 rounded text-center text-[10px] font-semibold uppercase tracking-wider transition border ${
                                    isSelected
                                      ? "bg-[#10B981] text-slate-950 border-[#10B981] font-bold shadow-sm"
                                      : "bg-[#162032] text-slate-400 border-[#334155] hover:text-slate-200 hover:border-slate-500"
                                  }`}
                                >
                                  {v.equipmentType}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {displayCue && (
                        <div className="bg-[#162032]/80 p-2 rounded text-[11px] text-slate-300 border-l-2 border-[#10B981] flex items-start gap-1.5">
                          <Info className="w-3 h-3 text-[#10B981] shrink-0 mt-0.5" />
                          <span>{displayCue}</span>
                        </div>
                      )}
                    </div>
                  );
                });
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No exercises scheduled for this day.</p>
            )}
          </div>
        </section>
      )}

      {/* 4. Nutrition & Fuel Targets Card */}
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#F8FAFC]">Nutrition & Fuel Targets</h2>
          <span className="text-[11px] font-mono text-[#10B981] font-semibold">
            142g / {currentDay?.nutrition?.targetProteinGrams || 180}g Protein (
            {Math.round((142 / (currentDay?.nutrition?.targetProteinGrams || 180)) * 100)}%)
          </span>
        </div>

        {/* Protein Progress Bar */}
        <div className="w-full bg-[#0F172A] rounded-full h-2.5 overflow-hidden border border-[#1E293B]">
          <div
            style={{ width: `${Math.min(100, Math.round((142 / (currentDay?.nutrition?.targetProteinGrams || 180)) * 100))}%` }}
            className="bg-gradient-to-r from-[#10B981] to-[#06B6D4] h-2.5 rounded-full transition-all duration-300"
          />
        </div>

        <div className="text-xs space-y-2 pt-1">
          <div className="p-2.5 rounded-lg bg-[#0F172A] border border-[#1E293B] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#06B6D4] font-bold">
              Pre-Workout Timing
            </span>
            <p className="text-slate-300 text-xs">
              40g carbs + 25g protein consumed 60–90m prior (e.g. Oatmeal & Whey Isolate).
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">Intra / Daily Protocol:</span>
            <span className="text-xs font-mono text-[#06B6D4]">
              Tracked via Supplement Protocol card above
            </span>
          </div>
        </div>
      </section>

      {/* 5. Sticky Floating Start Workout CTA */}
      {!currentDay?.isRestDay && (
        <div className="sticky bottom-20 z-40">
          <Link
            href={
              Object.keys(equipmentOverrides).length > 0
                ? `/session?day=${currentDay.dayOfWeek}&overrides=${encodeURIComponent(JSON.stringify(equipmentOverrides))}`
                : `/session?day=${currentDay.dayOfWeek}`
            }
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:opacity-95 transition active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            Start Workout Session
          </Link>
        </div>
      )}

      {/* Exercise Confidence Card Preview Modal */}
      {previewGuideExercise && (
        <ExerciseConfidenceCard
          isOpen={true}
          onClose={() => setPreviewGuideExercise(null)}
          exerciseName={previewGuideExercise.name}
          selectedEquipment={previewGuideExercise.selectedEquipment}
          equipmentVariations={previewGuideExercise.equipmentVariations}
          videoUrl={previewGuideExercise.videoUrl}
          onSelectEquipment={(newEq) => {
            setEquipmentOverrides((prev) => ({
              ...prev,
              [previewGuideExercise.id]: newEq,
            }));
            setPreviewGuideExercise((prev) =>
              prev ? { ...prev, selectedEquipment: newEq } : null
            );
          }}
        />
      )}
    </div>
  );
}
