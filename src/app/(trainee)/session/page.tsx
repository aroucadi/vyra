"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock,
  Check,
  Trophy,
  Plus,
  Minus,
  FastForward,
  Volume2,
  VolumeX,
  Layers,
  Sparkles,
  ArrowLeft,
  Video,
  Info,
  Flame,
  ShieldCheck,
} from "lucide-react";
import { appStore } from "@/lib/store";
import { formatDuration, checkIsPersonalRecord, resolveProgramDay, isSafeUrl } from "@/lib/utils";
import { SetLog, WorkoutSession, EquipmentOption, EquipmentType } from "@/lib/types";
import { saveSessionAction } from "@/lib/actions/session";
import { ExerciseConfidenceCard } from "@/components/trainee/ExerciseConfidenceCard";

interface ExerciseState {
  id: string;
  name: string;
  prescription: string;
  targetRir: number;
  restSeconds: number;
  prevBestWeight: number;
  prevBestReps: number;
  completedSets: {
    setIndex: number;
    weight: number;
    reps: number;
    rir: number;
    isPR: boolean;
    exerciseName: string;
    selectedEquipment?: EquipmentType;
    isDropSet?: boolean;
  }[];
  currentWeight: number;
  currentReps: number;
  currentRir: number;
  equipmentVariations?: EquipmentOption[];
  selectedEquipment?: EquipmentType;
  formCue?: string;
  videoUrl?: string;
  hasDropSet?: boolean;
  dropSetGuidance?: string;
  totalSets?: number;
}

export default function SessionLoggingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = appStore.getCurrentUser();
  const activeProgram = appStore.getActiveProgramForTrainee(currentUser.id);
  const resolved = activeProgram ? resolveProgramDay(activeProgram.startDate) : null;
  const currentWeek = activeProgram?.weeks.find((w) => w.weekIndex === resolved?.weekIndex) || activeProgram?.weeks[0];
  const currentDay = currentWeek?.days.find((d) => d.dayOfWeek === resolved?.dayOfWeek) || currentWeek?.days[0];

  // Elapsed session timer
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Active rest timer countdown
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [restTotalSeconds, setRestTotalSeconds] = useState(90);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // PR Celebration Modal / Toast
  const [recentPR, setRecentPR] = useState<{ exercise: string; weight: number; reps: number } | null>(null);

  // Session summary dialog on finish
  const [showSummary, setShowSummary] = useState(false);

  // Active Exercise Confidence Card Modal
  const [activeConfidenceModalIndex, setActiveConfidenceModalIndex] = useState<number | null>(null);

  // Parse any passed equipment overrides from Today page
  const initialOverrides = (() => {
    try {
      const p = searchParams.get("overrides");
      if (p) {
        const parsed = JSON.parse(p);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as Record<string, EquipmentType>;
        }
      }
    } catch {
      // ignore
    }
    return {} as Record<string, EquipmentType>;
  })();

  // Workout Exercises state dynamically derived from active program day
  const [exercises, setExercises] = useState<ExerciseState[]>(() => {
    if (currentDay && currentDay.blocks && currentDay.blocks.length > 0) {
      const list: ExerciseState[] = [];
      const validEquipments: EquipmentType[] = ["machine", "dumbbell", "cable", "bodyweight"];
      currentDay.blocks.forEach((b) => {
        b.exercises.forEach((ex, exIdx) => {
          const isSuperset = b.type === "superset" || b.type === "circuit";
          const suffix = isSuperset
            ? ` (${b.type === "superset" ? "Superset" : "Circuit"} ${String.fromCharCode(65 + exIdx)})`
            : "";
          const overrideVal = initialOverrides[ex.id];
          const activeEquipment = (overrideVal && validEquipments.includes(overrideVal))
            ? overrideVal
            : ex.selectedEquipment || (ex.equipmentVariations && ex.equipmentVariations[0]?.equipmentType) || "machine";
          const activeVariant = ex.equipmentVariations?.find((v) => v.equipmentType === activeEquipment);
          const initialName = activeVariant ? `${activeVariant.exerciseName}${suffix}` : `${ex.exerciseName}${suffix}`;
          const initialFormCue = activeVariant ? activeVariant.formCue : ex.formCueText;
          const initialVideo = activeVariant?.videoUrl || ex.videoUrl;

          const pb = appStore.getPersonalBestForExercise(
            currentUser.id,
            activeVariant ? activeVariant.exerciseName : ex.exerciseName,
            activeEquipment
          );
          const initialWeight = pb?.weightKg || 60;
          const initialReps = ex.repRangeLow || 8;

          list.push({
            id: ex.id,
            name: initialName,
            prescription: `${ex.sets} sets × ${ex.repRangeLow}–${ex.repRangeHigh} reps @ ${ex.rirScheme?.[0] ?? 2} RIR`,
            targetRir: ex.rirScheme?.[0] ?? 2,
            restSeconds: ex.restSeconds,
            prevBestWeight: pb?.weightKg || 0,
            prevBestReps: pb?.reps || 0,
            completedSets: [],
            currentWeight: initialWeight,
            currentReps: initialReps,
            currentRir: ex.rirScheme?.[0] ?? 2,
            equipmentVariations: ex.equipmentVariations,
            selectedEquipment: activeEquipment,
            formCue: initialFormCue,
            videoUrl: initialVideo,
            hasDropSet: ex.hasDropSet,
            dropSetGuidance: ex.dropSetGuidance,
            totalSets: ex.sets,
          });
        });
      });
      if (list.length > 0) return list;
    }
    return [
      {
        id: "ep1",
        name: "Barbell Bench Press",
        prescription: "3 sets × 8–10 reps @ 2 RIR",
        targetRir: 2,
        restSeconds: 90,
        prevBestWeight: 80,
        prevBestReps: 10,
        completedSets: [],
        currentWeight: 80,
        currentReps: 10,
        currentRir: 2,
      },
      {
        id: "ep2",
        name: "Incline Dumbbell Press",
        prescription: "3 sets × 10–12 reps @ 1 RIR",
        targetRir: 1,
        restSeconds: 90,
        prevBestWeight: 28,
        prevBestReps: 12,
        completedSets: [],
        currentWeight: 28,
        currentReps: 10,
        currentRir: 1,
      },
      {
        id: "ep3",
        name: "Cable Lateral Raise (Superset A)",
        prescription: "3 sets × 12–15 reps @ 0 RIR",
        targetRir: 0,
        restSeconds: 0,
        prevBestWeight: 12.5,
        prevBestReps: 15,
        completedSets: [],
        currentWeight: 12.5,
        currentReps: 12,
        currentRir: 0,
      },
      {
        id: "ep4",
        name: "Overhead Cable Triceps Extension (Superset B)",
        prescription: "3 sets × 12–15 reps @ 0 RIR",
        targetRir: 0,
        restSeconds: 60,
        prevBestWeight: 25,
        prevBestReps: 12,
        completedSets: [],
        currentWeight: 25,
        currentReps: 12,
        currentRir: 0,
      },
    ];
  });

  // Session elapsed timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rest countdown ticker
  useEffect(() => {
    if (restSecondsLeft === null || restSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restSecondsLeft]);

  const handleLogSet = (exerciseIndex: number) => {
    const ex = exercises[exerciseIndex];
    const isPrSet = checkIsPersonalRecord(
      ex.currentWeight,
      ex.currentReps,
      ex.prevBestWeight,
      ex.prevBestReps
    );

    const totalSetsTarget = ex.totalSets || 3;
    const nextSetIndex = ex.completedSets.length + 1;
    const isThisSetDropSet = !!(ex.hasDropSet && nextSetIndex === totalSetsTarget);
    const newCompletedSet = {
      setIndex: nextSetIndex,
      weight: ex.currentWeight,
      reps: ex.currentReps,
      rir: ex.currentRir,
      isPR: isPrSet,
      exerciseName: ex.name,
      selectedEquipment: ex.selectedEquipment,
      isDropSet: isThisSetDropSet,
    };

    // Auto-calculate 30% drop for the final set if this exercise has drop set!
    const willNextBeDropSet = !!(ex.hasDropSet && nextSetIndex === totalSetsTarget - 1);
    const nextWeight = willNextBeDropSet
      ? Math.max(1, Math.round(ex.currentWeight * 0.7 * 2) / 2)
      : ex.currentWeight;
    const nextRir = willNextBeDropSet ? 0 : (ex.targetRir ?? 1);

    const updated = [...exercises];
    updated[exerciseIndex] = {
      ...ex,
      completedSets: [...ex.completedSets, newCompletedSet],
      prevBestWeight: isPrSet ? ex.currentWeight : ex.prevBestWeight,
      prevBestReps: isPrSet ? ex.currentReps : ex.prevBestReps,
      currentWeight: nextWeight,
      currentRir: nextRir,
    };

    setExercises(updated);

    if (isPrSet) {
      setRecentPR({
        exercise: ex.name,
        weight: ex.currentWeight,
        reps: ex.currentReps,
      });
      setTimeout(() => setRecentPR(null), 5000);
    }

    // Trigger Rest Timer
    if (ex.restSeconds > 0) {
      setRestTotalSeconds(ex.restSeconds);
      setRestSecondsLeft(ex.restSeconds);
    }
  };

  const handleConfidenceEquipmentSwap = (newEq: EquipmentType) => {
    if (activeConfidenceModalIndex === null) return;
    const exIdx = activeConfidenceModalIndex;
    const ex = exercises[exIdx];
    if (!ex) return;
    const isSuperset = ex.name.includes("Superset") || ex.name.includes("Circuit");
    const suffix = isSuperset
      ? ` (${ex.name.includes("Superset") ? "Superset" : "Circuit"}${ex.name.match(/\([A-Za-z0-9 ]+\)/)?.[0] ? ` ${ex.name.match(/\([A-Za-z0-9 ]+\)/)?.[0]}` : ""})`
      : "";
    const variant = ex.equipmentVariations?.find((v) => v.equipmentType === newEq);
    const newName = variant ? (suffix ? `${variant.exerciseName} ${suffix.trim()}` : variant.exerciseName) : ex.name;
    const pb = appStore.getPersonalBestForExercise(
      currentUser.id,
      variant ? variant.exerciseName : ex.name,
      newEq
    );
    const updated = [...exercises];
    updated[exIdx] = {
      ...ex,
      selectedEquipment: newEq,
      name: newName,
      formCue: variant ? variant.formCue : ex.formCue,
      videoUrl: variant?.videoUrl || ex.videoUrl,
      prevBestWeight: pb?.weightKg || 0,
      prevBestReps: pb?.reps || 0,
      currentWeight: pb?.weightKg || ex.currentWeight,
    };
    setExercises(updated);
  };

  const handleFinishWorkout = async () => {
    const allSetLogs: SetLog[] = [];
    exercises.forEach((ex) => {
      ex.completedSets.forEach((s) => {
        allSetLogs.push({
          id: `sl_${Date.now()}_${ex.id}_${s.setIndex}`,
          exercisePrescriptionId: ex.id,
          exerciseName: s.exerciseName || ex.name,
          setIndex: s.setIndex,
          reps: s.reps,
          weightKg: s.weight,
          rirAchieved: s.rir,
          isPR: s.isPR,
          selectedEquipment: s.selectedEquipment || ex.selectedEquipment,
          isDropSet: s.isDropSet,
        });
      });
    });

    const newSession: WorkoutSession = {
      id: `sess_${Date.now()}`,
      traineeId: currentUser.id,
      programDayId: currentDay?.id || "week_2_d0",
      programTitle: activeProgram?.title || "Hypertrophy Block 1",
      dayLabel: currentDay?.label || "Push Hypertrophy A",
      date: new Date().toISOString().split("T")[0],
      startedAt: new Date(Date.now() - sessionSeconds * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      durationSec: sessionSeconds,
      setLogs: allSetLogs,
      notes: "High intensity session logged with NewME.",
    };

    await saveSessionAction(newSession);
    setShowSummary(true);
  };

  // Calculate totals
  const totalVolumeKg = exercises.reduce((acc, ex) => {
    return acc + ex.completedSets.reduce((sAcc, s) => sAcc + s.weight * s.reps, 0);
  }, 0);

  const totalCompletedSets = exercises.reduce((acc, ex) => acc + ex.completedSets.length, 0);
  const totalPRs = exercises.reduce((acc, ex) => acc + ex.completedSets.filter((s) => s.isPR).length, 0);

  return (
    <div className="px-4 py-4 space-y-4 pb-28">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/today")}
            className="p-1.5 rounded-lg bg-[#162032] border border-[#1E293B] text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-black text-[#F8FAFC]">
              {currentDay?.label || "Workout Session"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-[#10B981]">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(sessionSeconds)}
              </span>
              <span>•</span>
              <span>{totalCompletedSets} Sets Logged</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleFinishWorkout}
          className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-slate-950 font-black text-xs transition uppercase tracking-wider"
        >
          Finish
        </button>
      </div>

      {/* 2. Floating Live Rest Timer Banner */}
      {restSecondsLeft !== null && (
        <div className="sticky top-2 z-40 bg-[#162032]/95 backdrop-blur-md border border-[#06B6D4]/50 rounded-xl p-3 shadow-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full border-2 border-[#06B6D4] flex items-center justify-center font-mono font-black text-xs text-[#06B6D4] bg-[#0F172A]">
              {restSecondsLeft}s
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
                Rest Interval Active
              </p>
              <p className="text-[10px] text-slate-400">Target: {restTotalSeconds}s recovery</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRestSecondsLeft((prev) => (prev ? prev + 30 : 30))}
              className="px-2 py-1 rounded bg-[#0F172A] border border-[#334155] text-slate-300 text-xs font-mono hover:bg-[#1E293B]"
            >
              +30s
            </button>
            <button
              onClick={() => setRestSecondsLeft(null)}
              className="px-2.5 py-1 rounded bg-[#06B6D4] text-slate-950 text-xs font-bold hover:bg-[#0891B2] flex items-center gap-1"
            >
              <FastForward className="w-3 h-3" />
              Skip
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* PR Celebration Alert */}
      {recentPR && (
        <div className="bg-gradient-to-r from-[#F59E0B]/20 to-[#F59E0B]/10 border border-[#F59E0B]/50 rounded-xl p-3 flex items-center gap-3 animate-in zoom-in-95">
          <div className="w-9 h-9 rounded-full bg-[#F59E0B] text-slate-950 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <span className="text-xs font-black text-[#F59E0B] tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Personal Record Achieved!
            </span>
            <p className="text-xs text-slate-200 mt-0.5">
              <strong>{recentPR.exercise}</strong>: {recentPR.weight}kg × {recentPR.reps} reps!
            </p>
          </div>
        </div>
      )}

      {/* 3. Exercises Logging List */}
      <div className="space-y-5">
        {exercises.map((ex, exIdx) => {
          const isSuperset = ex.name.includes("Superset");

          return (
            <section
              key={ex.id}
              className={`rounded-xl p-4 space-y-3 ${
                isSuperset
                  ? "bg-[#06B6D4]/5 border border-[#06B6D4]/30"
                  : "bg-[#162032] border border-[#1E293B]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {isSuperset && <Layers className="w-3.5 h-3.5 text-[#06B6D4]" />}
                    <h2 className="text-sm font-black text-[#F8FAFC]">{ex.name}</h2>
                    {ex.selectedEquipment && (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20">
                        {ex.selectedEquipment}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#10B981] font-mono mt-0.5">{ex.prescription}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveConfidenceModalIndex(exIdx)}
                    className="text-slate-300 hover:text-[#06B6D4] hover:border-[#06B6D4]/50 flex items-center gap-1 text-[11px] bg-[#0F172A] px-2 py-0.5 rounded border border-[#334155] font-semibold transition"
                    title="Open Stealth Gym Confidence Guide"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>Guide</span>
                  </button>
                  {ex.videoUrl && isSafeUrl(ex.videoUrl) && (
                    <a
                      href={ex.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-[#06B6D4] flex items-center gap-1 text-[11px] bg-[#0F172A] px-2 py-0.5 rounded border border-[#334155]"
                    >
                      <Video className="w-3.5 h-3.5 text-[#06B6D4]" />
                      <span>Form</span>
                    </a>
                  )}
                  <div className="text-right ml-1">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Best: {ex.prevBestWeight}kg × {ex.prevBestReps}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4-Option Equipment Matrix Pill Bar in Live Session */}
              {ex.equipmentVariations && ex.equipmentVariations.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Swap Tool (Same Target):
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {ex.equipmentVariations.map((v) => {
                      const isSelected = (ex.selectedEquipment || "machine") === v.equipmentType;
                      return (
                        <button
                          key={v.equipmentType}
                          type="button"
                          onClick={() => {
                            const updated = [...exercises];
                            const suffix = isSuperset
                              ? ` (${ex.name.includes("Superset") ? "Superset" : "Circuit"}${ex.name.match(/\([A-Za-z0-9 ]+\)/)?.[0] ? ` ${ex.name.match(/\([A-Za-z0-9 ]+\)/)?.[0]}` : ""})`
                              : "";
                            const newName = suffix ? `${v.exerciseName} ${suffix.trim()}` : v.exerciseName;
                            const pb = appStore.getPersonalBestForExercise(
                              currentUser.id,
                              v.exerciseName,
                              v.equipmentType
                            );
                            updated[exIdx] = {
                              ...ex,
                              selectedEquipment: v.equipmentType,
                              name: newName,
                              formCue: v.formCue,
                              videoUrl: v.videoUrl,
                              prevBestWeight: pb?.weightKg || 0,
                              prevBestReps: pb?.reps || 0,
                              currentWeight: pb?.weightKg || ex.currentWeight,
                            };
                            setExercises(updated);
                          }}
                          className={`px-1.5 py-1 rounded text-center text-[10px] font-semibold uppercase tracking-wider transition border ${
                            isSelected
                              ? "bg-[#10B981] text-slate-950 border-[#10B981] font-bold shadow-sm"
                              : "bg-[#0F172A] text-slate-400 border-[#334155] hover:text-slate-200 hover:border-slate-500"
                          }`}
                        >
                          {v.equipmentType}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {ex.formCue && (
                <div className="bg-[#0F172A]/80 p-2 rounded text-[11px] text-slate-300 border-l-2 border-[#10B981] flex items-start gap-1.5">
                  <Info className="w-3 h-3 text-[#10B981] shrink-0 mt-0.5" />
                  <span>{ex.formCue}</span>
                </div>
              )}

              {/* Completed Sets Table */}
              {ex.completedSets.length > 0 && (
                <div className="space-y-1.5 border-t border-[#1E293B] pt-2">
                  {ex.completedSets.map((s) => (
                    <div
                      key={s.setIndex}
                      className="flex items-center justify-between p-2 rounded bg-[#0F172A] border border-[#1E293B] text-xs font-mono"
                    >
                      <span className="text-slate-400 font-medium">Set {s.setIndex}</span>
                      <span className="text-slate-100 font-bold">
                        {s.weight} kg × {s.reps} reps
                      </span>
                      <span className="text-[#06B6D4]">RIR {s.rir}</span>
                      {s.isDropSet ? (
                        <span className="px-1.5 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] text-[10px] font-bold flex items-center gap-0.5">
                          <Flame className="w-3 h-3 fill-[#EF4444]" /> DROP SET
                        </span>
                      ) : s.isPR ? (
                        <span className="px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-bold flex items-center gap-0.5">
                          <Trophy className="w-3 h-3" /> PR
                        </span>
                      ) : (
                        <Check className="w-4 h-4 text-[#10B981]" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Set Input Form */}
              <div className="bg-[#0F172A] p-3 rounded-lg border border-[#334155] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span>Log Set {ex.completedSets.length + 1}</span>
                    {ex.hasDropSet && ex.completedSets.length + 1 === (ex.totalSets || 3) && (
                      <span className="px-1.5 py-0.2 rounded bg-[#EF4444]/20 text-[#EF4444] text-[10px] font-mono font-bold uppercase tracking-wider">
                        Drop Set (0 RIR)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Rest: {ex.restSeconds}s</span>
                </div>

                {/* Drop Set Highlight Banner */}
                {ex.hasDropSet && ex.completedSets.length + 1 === (ex.totalSets || 3) && (
                  <div className="bg-gradient-to-r from-[#EF4444]/20 to-[#F59E0B]/20 border border-[#EF4444]/50 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#EF4444] uppercase tracking-wide">
                      <Flame className="w-3.5 h-3.5 fill-[#EF4444]" />
                      <span>Set {ex.completedSets.length + 1} Drop Set Protocol Active</span>
                    </div>
                    <p className="text-[11px] text-slate-200">
                      {ex.dropSetGuidance || "Immediately drop weight ~30% and take set to absolute 0 RIR technical failure."}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {/* Weight Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-slate-400">Weight (kg)</label>
                    <div className="flex items-center rounded-lg bg-[#162032] border border-[#334155]">
                      <button
                        onClick={() => {
                          const updated = [...exercises];
                          updated[exIdx].currentWeight = Math.max(0, updated[exIdx].currentWeight - 2.5);
                          setExercises(updated);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        step="0.5"
                        value={ex.currentWeight}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[exIdx].currentWeight = parseFloat(e.target.value) || 0;
                          setExercises(updated);
                        }}
                        className="w-full text-center bg-transparent text-sm font-mono font-bold text-slate-100 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const updated = [...exercises];
                          updated[exIdx].currentWeight = updated[exIdx].currentWeight + 2.5;
                          setExercises(updated);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Reps Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-slate-400">Reps</label>
                    <div className="flex items-center rounded-lg bg-[#162032] border border-[#334155]">
                      <button
                        onClick={() => {
                          const updated = [...exercises];
                          updated[exIdx].currentReps = Math.max(1, updated[exIdx].currentReps - 1);
                          setExercises(updated);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        value={ex.currentReps}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[exIdx].currentReps = parseInt(e.target.value) || 0;
                          setExercises(updated);
                        }}
                        className="w-full text-center bg-transparent text-sm font-mono font-bold text-slate-100 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const updated = [...exercises];
                          updated[exIdx].currentReps = updated[exIdx].currentReps + 1;
                          setExercises(updated);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* RIR Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-slate-400">RIR</label>
                    <div className="flex items-center rounded-lg bg-[#162032] border border-[#334155]">
                      <button
                        onClick={() => {
                          const updated = [...exercises];
                          updated[exIdx].currentRir = Math.max(0, updated[exIdx].currentRir - 1);
                          setExercises(updated);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        value={ex.currentRir}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[exIdx].currentRir = parseInt(e.target.value) || 0;
                          setExercises(updated);
                        }}
                        className="w-full text-center bg-transparent text-sm font-mono font-bold text-[#06B6D4] focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const updated = [...exercises];
                          updated[exIdx].currentRir = updated[exIdx].currentRir + 1;
                          setExercises(updated);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleLogSet(exIdx)}
                  className={`w-full py-2.5 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                    ex.hasDropSet && ex.completedSets.length === 3
                      ? "bg-[#EF4444]/20 hover:bg-[#EF4444]/30 border-[#EF4444]/60 text-[#EF4444] shadow-md animate-pulse"
                      : "bg-[#10B981]/20 hover:bg-[#10B981]/30 border-[#10B981]/50 text-[#10B981]"
                  }`}
                >
                  {ex.hasDropSet && ex.completedSets.length === 3 ? (
                    <>
                      <Flame className="w-3.5 h-3.5 fill-[#EF4444]" />
                      Log Set 4: Drop Set (0 RIR Burnout)
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Log Set {ex.completedSets.length + 1}
                    </>
                  )}
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {/* Finish Session Summary Dialog */}
      {showSummary && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#162032] border border-[#334155] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-[#10B981]/20 border border-[#10B981]/50 mx-auto flex items-center justify-center text-[#10B981]">
              <Trophy className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Workout Completed!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Logged to {activeProgram?.trainerId ? appStore.getUser(activeProgram.trainerId)?.name || "your coach" : "your coach"}&apos;s console in real time.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-[#0F172A] p-3 rounded-xl border border-[#1E293B] font-mono text-center">
              <div>
                <span className="text-[10px] text-slate-400">Duration</span>
                <p className="text-sm font-bold text-slate-100">{formatDuration(sessionSeconds)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Volume</span>
                <p className="text-sm font-bold text-[#10B981]">{totalVolumeKg.toLocaleString()} kg</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">PRs</span>
                <p className="text-sm font-bold text-[#F59E0B]">{totalPRs}</p>
              </div>
            </div>

            <button
              onClick={() => router.push("/progress")}
              className="w-full py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-slate-950 font-black text-xs uppercase tracking-wider transition"
            >
              View Progress Charts
            </button>
          </div>
        </div>
      )}

      {/* Exercise Confidence Card Modal (Stealth Gym Shield) */}
      {activeConfidenceModalIndex !== null && exercises[activeConfidenceModalIndex] && (
        <ExerciseConfidenceCard
          isOpen={true}
          onClose={() => setActiveConfidenceModalIndex(null)}
          exerciseName={exercises[activeConfidenceModalIndex].name}
          selectedEquipment={exercises[activeConfidenceModalIndex].selectedEquipment || "machine"}
          equipmentVariations={exercises[activeConfidenceModalIndex].equipmentVariations}
          videoUrl={exercises[activeConfidenceModalIndex].videoUrl}
          onSelectEquipment={handleConfidenceEquipmentSwap}
        />
      )}
    </div>
  );
}
