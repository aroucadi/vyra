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
} from "lucide-react";
import { appStore } from "@/lib/store";
import { resolveProgramDay, isSafeUrl } from "@/lib/utils";
import { EquipmentType } from "@/lib/types";

export default function TodayPage() {
  const currentUser = appStore.getCurrentUser();
  const program = appStore.getActiveProgramForTrainee(currentUser.id);

  // Equipment variations override state per exercise ID
  const [equipmentOverrides, setEquipmentOverrides] = useState<{ [exerciseId: string]: EquipmentType }>({});

  // Daily protocol interactive state
  const todayStr = new Date().toISOString().split("T")[0];

  const [mobilityChecked, setMobilityChecked] = useState<{ [key: string]: boolean }>({
    m1: true,
    m2: false,
    m3: false,
  });

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
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-sm font-bold text-[#F8FAFC]">
              {currentDay?.morningRoutine && currentDay.morningRoutine.length > 0
                ? "Morning Alignment Routine"
                : "Warmup & Mobility Routine"}
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {Object.values(mobilityChecked).filter(Boolean).length} of{" "}
            {currentDay?.morningRoutine && currentDay.morningRoutine.length > 0
              ? currentDay.morningRoutine.length
              : 3}{" "}
            complete
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          {(currentDay?.morningRoutine && currentDay.morningRoutine.length > 0
            ? currentDay.morningRoutine.map((drill, idx) => ({ id: `drill_${idx}`, text: drill }))
            : [
                { id: "m1", text: "Thoracic spine foam roller rotations (10x)" },
                { id: "m2", text: "Overhead band pull-aparts (15x)" },
                { id: "m3", text: "Scapular wall slides & wrist extensions" },
              ]
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => toggleMobility(item.id)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-[#0F172A] border border-[#1E293B] hover:border-slate-700 transition text-left"
            >
              <span className={mobilityChecked[item.id] ? "line-through text-slate-500" : "text-slate-300"}>
                {item.text}
              </span>
              {mobilityChecked[item.id] ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Workout Prescription Card */}
      {currentDay?.isRestDay ? (
        <section className="bg-[#162032] rounded-xl border border-[#06B6D4]/30 p-5 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/40 mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6 text-[#06B6D4]" />
          </div>
          <h2 className="text-base font-bold text-slate-100">Scheduled Rest & Regeneration</h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Today is dedicated to muscular rebuilding, parasympathetic tone, and glycogen replenishment.
          </p>
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
              href="/session"
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
                                {displayVideo && (
                                  <a
                                    href={displayVideo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-400 hover:text-[#06B6D4] flex items-center gap-1 text-[10px] bg-[#162032] px-1.5 py-0.5 rounded border border-[#334155]"
                                  >
                                    <Video className="w-3 h-3 text-[#06B6D4]" />
                                    <span>Guide</span>
                                  </a>
                                )}
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

                        {displayVideo && isSafeUrl(displayVideo) && (
                          <a
                            href={displayVideo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-[#06B6D4] flex items-center gap-1 text-[11px] bg-[#162032] px-2 py-1 rounded border border-[#334155]"
                          >
                            <Video className="w-3.5 h-3.5 text-[#06B6D4]" />
                            <span>Guide</span>
                          </a>
                        )}
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
                ? `/session?overrides=${encodeURIComponent(JSON.stringify(equipmentOverrides))}`
                : "/session"
            }
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:opacity-95 transition active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            Start Workout Session
          </Link>
        </div>
      )}
    </div>
  );
}
