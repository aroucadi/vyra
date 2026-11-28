"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { appStore } from "@/lib/store";
import { deriveDayTimeline, TimelineMoment } from "@/lib/timeline";
import { Insight } from "@/components/primitives/Insight";
import { Plan } from "@/components/primitives/Plan";
import { SupplementStackDrawer } from "@/components/trainee/SupplementStackDrawer";
import { ReadinessCheckin } from "@/components/trainee/ReadinessCheckin";
import { SessionAdjustmentSheet } from "@/components/trainee/SessionAdjustmentSheet";
import { DayZeroOnboardingCard } from "@/components/trainee/DayZeroOnboardingCard";
import { WorkoutSessionDetailSheet } from "@/components/trainee/WorkoutSessionDetailSheet";
import { SubstitutionCopilotDrawer } from "@/components/trainee/SubstitutionCopilotDrawer";
import { ExerciseVideoModal } from "@/components/trainee/ExerciseVideoModal";
import { ExerciseThumbnail } from "@/components/trainee/ExerciseThumbnail";
import { VyraLogo } from "@/components/brand/VyraLogo";
import { runAutonomousCoachingLifecycleCheck } from "@/lib/ai/coaching-cycle";
import { soundService } from "@/lib/in-gym/sound";
import { inferPrimaryMuscleFromExerciseName } from "@/lib/ai/sensory-memory";
import type { RagExercise } from "@/types/exercise-rag";
import {
  useIsClientHydrated,
  useVyraAuth,
  useVyraStoreVersion,
} from "@/components/auth/VyraAuthProvider";
import { getChronoPhase } from "@/components/trainee/TraineeNav";
import { resolveProgramDay, getOpenGymClipUrl, getOpenGymStillUrl } from "@/lib/utils";
import type { ExercisePrescription, WorkoutSession } from "@/lib/types";
import { haptics } from "@/lib/haptics";
import { clsx } from "clsx";
import {
  Activity,
  ArrowRight,
  ArrowRightLeft,
  Calendar,
  ChevronRight,
  Clock,
  Dumbbell,
  Eye,
  Flame,
  Play,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Video,
  Zap,
} from "lucide-react";

export default function TodayPage() {
  const router = useRouter();
  const storeVersion = useVyraStoreVersion();
  const isHydrated = useIsClientHydrated();
  const { isAuthenticated, isAlaa, authEmail } = useVyraAuth();

  const rawUser = appStore.getCurrentUser();
  const currentUser = isHydrated
    ? rawUser
    : { ...rawUser, id: "anon_visitor", name: "Athlete", role: "both" as const };

  const [isSuppDrawerOpen, setIsSuppDrawerOpen] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      window.location.search.includes("supplements=open")
  );
  const [isAdjustSheetOpen, setIsAdjustSheetOpen] = useState(false);
  const [forceDayZero, setForceDayZero] = useState<boolean | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const search = window.location.search;
    if (search.includes("view=program") || search.includes("mode=program")) {
      return false;
    }
    if (search.includes("onboarding=day0") || search.includes("anchor=")) {
      return true;
    }
    return localStorage.getItem("vyra_user_view") === "program" ? false : undefined;
  });
  const [tick, setTick] = useState(0);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [inspectedDayOfWeek, setInspectedDayOfWeek] = useState<number | null>(null);
  const [swapExerciseTarget, setSwapExerciseTarget] = useState<{
    id?: string;
    name: string;
    target: string;
    equipment: string;
  } | null>(null);
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState(false);
  const [videoModalExercise, setVideoModalExercise] = useState<{
    id?: string;
    name: string;
    target?: string;
    equipment?: string;
    videoUrl?: string;
    clipUrl?: string;
    stillUrl?: string;
    formCue?: string;
  } | null>(null);

  const handleApplyTodaySwap = (candidate: RagExercise) => {
    if (!swapExerciseTarget) return;
    const res = appStore.swapExerciseInActiveProgram(
      currentUser.id,
      swapExerciseTarget.name,
      candidate.name,
      currentInspectedDay
    );
    if (res.success) {
      soundService.playTargetHitFeedback(true);
      setTick((t) => t + 1);
    }
    setIsSwapDrawerOpen(false);
    setSwapExerciseTarget(null);
  };

  const sessions = isHydrated ? appStore.getSessions(currentUser.id) : [];
  const metricEntries = isHydrated ? appStore.getMetrics(currentUser.id) : [];

  const program = isHydrated
    ? appStore.getActiveProgramForTrainee(currentUser.id)
    : undefined;
  const effectiveForceDayZero = isHydrated
    ? forceDayZero !== undefined
      ? forceDayZero
      : Boolean(!program && sessions.length === 0)
    : false;
  const resolved = program
    ? resolveProgramDay(program.startDate)
    : { weekIndex: 1, dayOfWeek: 0, started: true };
  const currentWeek = program?.weeks
    ? program.weeks[
        Math.min(resolved.weekIndex - 1, program.weeks.length - 1)
      ]
    : undefined;

  const currentInspectedDay = inspectedDayOfWeek ?? resolved.dayOfWeek;
  const todaySession = currentWeek?.days
    ? currentWeek.days.find((d) => d.dayOfWeek === resolved.dayOfWeek)
    : undefined;
  const displaySession = currentWeek?.days
    ? currentWeek.days.find((d) => d.dayOfWeek === currentInspectedDay) ||
      todaySession ||
      currentWeek.days[0]
    : todaySession;
  const displayExercises = displaySession?.blocks
    ? displaySession.blocks.flatMap((b) => b.exercises)
    : [];
  const todayExercises = displayExercises;
  const estimatedPaceMin = Math.round(
    Math.max(25, displayExercises.reduce((sum, e) => sum + e.sets, 0) * 2.5)
  );
  const displayScheduledSets = displayExercises.reduce((sum, e) => sum + e.sets, 0);
  const isInspectingDifferentDay = Boolean(
    currentWeek?.days && currentInspectedDay !== resolved.dayOfWeek
  );

  // Chronobiological phase
  const chrono = useMemo(() => getChronoPhase(), [tick]);

  // Daily Nutritional Fuel targets
  const targetKcal =
    currentUser.baselineMetrics?.dailyTargetKcal || 2710;
  const targetProtein =
    currentUser.baselineMetrics?.dailyMacrosTarget?.proteinG || 173.6;
  const targetCarbs =
    currentUser.baselineMetrics?.dailyMacrosTarget?.carbsG || 317.4;
  const targetFat =
    currentUser.baselineMetrics?.dailyMacrosTarget?.fatG || 72.2;

  useEffect(() => {
    runAutonomousCoachingLifecycleCheck({
      traineeId: currentUser.id,
      sessions,
      metricEntries,
    });
  }, [currentUser.id, sessions.length, metricEntries.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = window.location.search;
    if (search.includes("view=program") || search.includes("mode=program")) {
      localStorage.setItem("vyra_user_view", "program");
    } else if (search.includes("onboarding=day0") || search.includes("anchor=")) {
      localStorage.setItem("vyra_user_view", "day0");
    }
  }, []);

  const {
    moments,
    heroMoment,
    insight,
    readinessStatus,
    hasReadinessInput,
    isRestDay: timelineRestDay,
    isDayZero,
  } = useMemo(
    () =>
      deriveDayTimeline(currentUser.id, undefined, undefined, {
        forceDayZero: effectiveForceDayZero,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isHydrated, currentUser.id, tick, effectiveForceDayZero, storeVersion]
  );

  const isDisplayRestDay = displaySession
    ? Boolean(displaySession.isRestDay || displayExercises.length === 0)
    : timelineRestDay;
  const isRestDay = isDisplayRestDay;

  const handleMomentClick = (moment: TimelineMoment) => {
    if (moment.learnType === "supplements" || moment.learnType === "hydration") {
      setIsSuppDrawerOpen(true);
    } else if (
      moment.learnType === "football" ||
      moment.id === "moment_football"
    ) {
      const dateStr = new Date().toISOString().split("T")[0];
      const key = `vyra_football_done_${dateStr}`;
      const current = localStorage.getItem(key) === "true";
      localStorage.setItem(key, (!current).toString());
      setTick((t) => t + 1);
    } else if (
      moment.learnType === "workout" &&
      (moment.badge === "Done" || moment.status === "past")
    ) {
      const dateStr = new Date().toISOString().split("T")[0];
      const todaySess =
        sessions.find((s) => s.date === dateStr) || sessions[0];
      if (todaySess) {
        setSelectedSession(todaySess);
        return;
      }
      router.push(moment.actionHref || "/progress");
    } else if (moment.actionHref) {
      router.push(moment.actionHref);
    }
  };

  const handleWhyClick = () => {
    if (insight?.whyPrompt) {
      setIsAdjustSheetOpen(true);
    }
  };

  const todayDateStr = isHydrated ? new Date().toISOString().split("T")[0] : "";
  const completedTodaySession = isHydrated
    ? sessions.find((s) => s.date === todayDateStr)
    : undefined;
  const completedVolumeKg =
    completedTodaySession?.setLogs?.reduce(
      (sum, l) => sum + l.weightKg * l.reps,
      0
    ) || 0;
  const isCalendarWorkoutDone = Boolean(
    completedTodaySession ||
      heroMoment?.badge === "Done" ||
      moments.find((m) => m.id === "moment_workout")?.badge === "Done"
  );
  const isWorkoutDone = !isInspectingDifferentDay && isCalendarWorkoutDone;
  const latestBiometrics = isHydrated
    ? appStore.getLatestWearableBiometrics(currentUser.id)
    : undefined;
  const readinessScore = latestBiometrics?.readinessScore ?? 92;
  const readinessLabel =
    readinessScore >= 80
      ? "Optimal drive"
      : readinessScore >= 60
      ? "Moderate drive"
      : "Deload recommended";

  return (
    <div className="flex-1 pb-28 px-3 sm:px-4 lg:px-6 pt-2 lg:pt-4 max-w-md lg:max-w-6xl mx-auto w-full space-y-6 animate-in fade-in duration-300 font-body select-none">
      {/* 1. TOP TELEMETRY STATUS STRIP */}
      <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2.5">
        <div className="flex items-center gap-2">
          <VyraLogo
            size="sm"
            variant="wordmark"
            href="/today"
            showTagline={false}
          />
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
            <span>COMMAND DECK</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono">
          {(currentUser.role === "trainer" ||
            currentUser.role === "both") && (
            <Link
              href="/roster"
              className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 hover:bg-cyan-500/20 transition"
            >
              Coach
            </Link>
          )}

          {!isAuthenticated ? (
            <Link
              href="/login"
              className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition font-bold"
            >
              Sign In
            </Link>
          ) : (
            <Link
              href="/you"
              title={authEmail || "Signed in"}
              className="px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-bold"
            >
              Synced
            </Link>
          )}

          <span suppressHydrationWarning className="text-slate-400">
            {isHydrated
              ? new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : "Today"}
          </span>
        </div>
      </div>

      {/* 2. CHRONOBIOLOGICAL PHASE HEADER */}
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded border"
              style={{
                backgroundColor: `${chrono.accentColor}15`,
                color: chrono.accentColor,
                borderColor: `${chrono.accentColor}40`,
              }}
            >
              {`${chrono.label} // ${chrono.badge}`}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {program
                ? `W${resolved.weekIndex} / ${program.durationWeeks || 16}`
                : "Calibration"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setForceDayZero((prev) => {
                const next = prev === undefined ? !isDayZero : !prev;
                if (typeof window !== "undefined") {
                  localStorage.setItem(
                    "vyra_user_view",
                    next ? "day0" : "program"
                  );
                }
                return next;
              });
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#0f1724] hover:bg-[#152232] border border-[#1b2d47] rounded-lg text-[10px] font-mono text-slate-300 transition cursor-pointer"
            title="Toggle setup / active program"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{isDayZero ? "Active Program" : "Day 1 Setup"}</span>
          </button>
        </div>

        <h1 suppressHydrationWarning className="text-2xl lg:text-3xl font-display uppercase tracking-wider font-extrabold text-white">
          {isDayZero
            ? "Day 1 Calibration"
            : `System Primed, ${currentUser.name.split(" ")[0]}.`}
        </h1>
      </header>

      {/* DAY-0 ONBOARDING PROXY */}
      {isDayZero ? (
        <DayZeroOnboardingCard
          userId={currentUser.id}
          onCalibrated={() => setTick((t) => t + 1)}
        />
      ) : (
        /* RESPONSIVE COMMAND DECK GRID (Hero on Left/Top, Ambient Telemetry on Right) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* =========================================================================
              MAIN OPERATIONAL STAGE (Left 8 cols on desktop)
              The workout directive is front-and-center without clutter
             ========================================================================= */}
          <div className="lg:col-span-8 space-y-6 order-1">
            
            {/* MULTI-DAY PROGRAM WORKOUT SELECTOR (PILL TABS) */}
            {currentWeek?.days && currentWeek.days.length > 0 && (
              <div className="p-2 bg-[#0c121e] border border-[#1b2d47] rounded-2xl flex items-center justify-between gap-1 shadow-lg overflow-x-auto">
                {currentWeek.days.map((day, idx) => {
                  const isSelected = day.dayOfWeek === currentInspectedDay;
                  const isToday = day.dayOfWeek === resolved.dayOfWeek;
                  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                  const dayLabel = dayNames[day.dayOfWeek] || `D${idx + 1}`;
                  const isRest = day.isRestDay;

                  return (
                    <button
                      key={day.id || idx}
                      type="button"
                      data-day-of-week={day.dayOfWeek}
                      data-selected={isSelected}
                      data-is-today={isToday}
                      onClick={() => {
                        haptics.selection();
                        setInspectedDayOfWeek(day.dayOfWeek === resolved.dayOfWeek ? null : day.dayOfWeek);
                      }}
                      className={clsx(
                        "flex-1 py-2 px-1 rounded-xl flex flex-col items-center gap-0.5 transition-all cursor-pointer relative ios-press-state min-w-0 select-none",
                        isSelected
                          ? "bg-gradient-to-b from-[#10b981] to-[#059669] text-[#05080c] font-black shadow-lg shadow-emerald-500/30 scale-[1.03] z-10"
                          : isToday
                          ? "bg-[#111e33] hover:bg-[#162744] text-white border border-[#10b981]/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                          : "bg-[#070b14] hover:bg-[#101726] text-slate-400 hover:text-slate-200 border border-[#1b2d47]/50"
                      )}
                      title={`${day.label}${isToday ? " (Today)" : ""}`}
                    >
                      {/* Glowing Active Calendar Day Badge */}
                      {isToday && (
                        <span
                          className={clsx(
                            "text-[8px] font-mono uppercase tracking-wider font-extrabold px-1 py-0 rounded leading-tight flex items-center gap-0.5 mb-0.5",
                            isSelected
                              ? "bg-[#05080c]/85 text-[#10b981]"
                              : "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                          )}
                        >
                          <span className="w-1 h-1 rounded-full bg-[#10b981] animate-ping" />
                          TODAY
                        </span>
                      )}

                      <span
                        className={clsx(
                          "text-xs font-display uppercase tracking-wider font-bold truncate max-w-full",
                          isSelected ? "text-[#05080c]" : "text-slate-200"
                        )}
                      >
                        {dayLabel}
                      </span>

                      <span
                        className={clsx(
                          "text-[9px] font-mono truncate max-w-full leading-none",
                          isSelected
                            ? "text-[#05080c]/80 font-bold"
                            : isRest
                            ? "text-slate-500"
                            : "text-emerald-400/80"
                        )}
                      >
                        {isRest ? "REST" : `D${idx + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. TODAY'S TRAINING DIRECTIVE & HERO CTA */}
            <section className="p-4 sm:p-5 bg-gradient-to-b from-[#111624] to-[#0c1018] border border-[#1b2d47] rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-[#10b981]" />
                  <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
                    {isInspectingDifferentDay
                      ? `Inspecting Day ${(currentWeek?.days.findIndex((d) => d.dayOfWeek === currentInspectedDay) ?? currentInspectedDay) + 1} (${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][currentInspectedDay] || ""})`
                      : "Training Directive // 01 of 01"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isInspectingDifferentDay && (
                    <button
                      type="button"
                      onClick={() => {
                        haptics.light();
                        setInspectedDayOfWeek(null);
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold transition flex items-center gap-1 cursor-pointer ios-press-state"
                      title="Return to active calendar today"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Return to Today</span>
                    </button>
                  )}
                  <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/15 px-2 py-0.5 rounded border border-[#10b981]/30 font-bold">
                    {isInspectingDifferentDay
                      ? isRestDay
                        ? "REST DAY // PREVIEW"
                        : "PREVIEW // SCHEDULED"
                      : isRestDay
                      ? "REST DAY"
                      : isWorkoutDone
                      ? "COMPLETED TODAY ✓"
                      : "SCHEDULED"}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-display uppercase tracking-wider font-extrabold text-white">
                  {displaySession?.label || (isRestDay ? "Somatic Adaptation & Rest" : "High Mechanical Tension Split")}
                </h2>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                  <span>{displayExercises.length} Movements</span>
                  <span>·</span>
                  <span>~{estimatedPaceMin} Min Pace</span>
                  <span>·</span>
                  <span className="text-[#10b981] font-bold">RIR 2 Lock</span>
                </div>
              </div>

              {/* Overload Delta Callout */}
              <div className="p-3 bg-[#05080c] rounded-xl border border-[#1b2d47] flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 text-[11px]">
                  {isInspectingDifferentDay ? "Scheduled Target:" : "Progression Target:"}
                </span>
                <span className="text-[#10b981] font-bold">
                  {!isInspectingDifferentDay && completedTodaySession
                    ? `${completedVolumeKg > 0 ? completedVolumeKg.toLocaleString() + " KG Volume Logged" : "Completed"}`
                    : displayExercises.length > 0
                    ? `${displayScheduledSets} Working Sets Scheduled`
                    : "Active Recovery"}
                </span>
              </div>

              {/* Collimated Movement Queue */}
              {todayExercises.length > 0 && !isRestDay && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                      Movement Queue ({todayExercises.length}):
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">
                      1-Tap Video &amp; Swap Active
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {todayExercises.map((ex, idx) => (
                      <div
                        key={ex.id || idx}
                        className="p-3 bg-[#070b12] rounded-xl border border-[#1b2d47] flex items-center justify-between text-xs font-mono hover:border-cyan-500/40 transition group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="text-[11px] text-[#10b981] font-bold w-5 shrink-0">
                            {idx + 1}.
                          </span>
                          <ExerciseThumbnail
                            exerciseId={ex.exerciseId || ex.id}
                            exerciseName={ex.exerciseName}
                            stillUrl={ex.stillUrl}
                            size="sm"
                          />
                          <span className="text-slate-200 truncate font-semibold text-sm">
                            {ex.exerciseName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            {ex.sets}×{ex.repRangeLow}-{ex.repRangeHigh}
                          </span>

                          {/* Video Demo Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setVideoModalExercise({
                                id: ex.exerciseId || ex.id,
                                name: ex.exerciseName,
                                target: ex.targetMuscleGroups?.[0],
                                equipment: ex.selectedEquipment,
                                videoUrl: ex.videoUrl,
                                clipUrl:
                                  ex.clipUrl ||
                                  (ex.exerciseId
                                    ? getOpenGymClipUrl(ex.exerciseId)
                                    : undefined),
                                stillUrl:
                                  ex.imageUrl ||
                                  (ex.exerciseId
                                    ? getOpenGymStillUrl(ex.exerciseId)
                                    : undefined),
                                formCue: ex.formCueText,
                              })
                            }
                            className="p-1.5 rounded-lg bg-[#0f1724] border border-[#1b2d47] text-cyan-400 hover:text-cyan-300 hover:bg-[#142032] transition cursor-pointer"
                            title="Preview form video"
                          >
                            <Video className="w-3.5 h-3.5" />
                          </button>

                          {/* 1-Tap Biomechanical Swap Button */}
                          <button
                            type="button"
                            onClick={() => {
                              haptics.medium();
                              setSwapExerciseTarget({
                                id: ex.id,
                                name: ex.exerciseName,
                                target:
                                  ex.targetMuscleGroups?.[0] ||
                                  inferPrimaryMuscleFromExerciseName(ex.exerciseName),
                                equipment: ex.selectedEquipment || "machine",
                              });
                              setIsSwapDrawerOpen(true);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/30 text-[#10b981] text-[10px] font-mono font-bold transition cursor-pointer ios-press-state"
                            title="Swap exercise with biomechanical alternative"
                          >
                            <ArrowRightLeft className="w-3 h-3 stroke-[2.5]" />
                            <span>SWAP</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PRIMARY ACTION TRIGGER */}
              <div className="pt-2 space-y-2">
                {isWorkoutDone ? (
                  <button
                    type="button"
                    onClick={() => {
                      haptics.light();
                      const todaySess =
                        completedTodaySession ||
                        sessions.find((s) => s.date === todayDateStr) ||
                        sessions[0];
                      if (todaySess) setSelectedSession(todaySess);
                      else router.push("/progress");
                    }}
                    className="w-full h-15 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 ios-press-state text-[#05080c] font-display uppercase tracking-wider text-xl font-black rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.45)] transition-all cursor-pointer flex items-center justify-between px-4"
                  >
                    <div className="flex items-center gap-2">
                      <Trophy className="w-6 h-6 stroke-[2.5]" />
                      <span>VIEW COMPLETED STATS</span>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : isRestDay ? (
                  <button
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setIsSuppDrawerOpen(true);
                    }}
                    className="w-full h-14 py-3 bg-[#0f1724] hover:bg-[#142032] border border-[#1b2d47] text-slate-300 hover:text-white font-display uppercase tracking-wider text-base font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ios-press-state"
                  >
                    <span>REST DAY PROTOCOL // LOG NUTRITION</span>
                    <ArrowRight className="w-4 h-4 stroke-[2]" />
                  </button>
                ) : (
                  <Link
                    href={`/session?day=${displaySession?.id || "day_1"}`}
                    onClick={() => haptics.heavy()}
                    className="w-full h-15 py-3.5 bg-gradient-to-r from-[#10b981] via-emerald-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 ios-press-state text-[#05080c] font-display uppercase tracking-wider text-xl font-black rounded-xl shadow-[0_0_24px_rgba(16,185,129,0.45)] hover:shadow-[0_0_32px_rgba(0,242,254,0.6)] transition-all cursor-pointer flex items-center justify-between px-4"
                  >
                    <div className="flex items-center gap-2">
                      <Play className="w-6 h-6 fill-current" />
                      <span>{isInspectingDifferentDay ? "START INSPECTED SESSION" : "COMMENCE SESSION"}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-[#05080c]/80 text-[#10b981] px-2.5 py-1 rounded-lg border border-[#10b981]/40 font-mono text-xs font-bold">
                      <span>~{estimatedPaceMin} MIN</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  </Link>
                )}

                {/* Secondary Utility Controls */}
                {!isRestDay && !isWorkoutDone && (
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                    <Link
                      href={`/session?day=${displaySession?.id || "day_1"}&mode=preview`}
                      onClick={() => haptics.light()}
                      className="p-2.5 bg-[#05080c] hover:bg-[#142032] border border-[#1b2d47] text-slate-300 hover:text-white rounded-xl text-center transition flex items-center justify-center gap-1.5 ios-press-state"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Preview &amp; Cues</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        haptics.medium();
                        setIsAdjustSheetOpen(true);
                      }}
                      className="p-2.5 bg-[#05080c] hover:bg-[#142032] border border-[#1b2d47] text-slate-300 hover:text-white rounded-xl text-center transition flex items-center justify-center gap-1.5 cursor-pointer ios-press-state"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                      <span>Adjust Session</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* 4. DAY TIMELINE & DAILY MOMENTS STREAM */}
            <section className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                <span className="font-semibold text-slate-300">
                  CIRCADIAN DAY TIMELINE
                </span>
                <button
                  type="button"
                  onClick={() => setIsSuppDrawerOpen(true)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                >
                  All protocols →
                </button>
              </div>

              <Plan.Timeline
                moments={moments.filter((m) => m.id !== heroMoment?.id)}
                onMomentClick={handleMomentClick}
              />
            </section>
          </div>

          {/* =========================================================================
              CONTEXT SIDEBAR (Right 4 cols on desktop; cleanly stacks below on mobile)
              Readiness score, Nutritional Mass Stack, and AI Sentinel
             ========================================================================= */}
          <div className="lg:col-span-4 space-y-6 order-2">
            
            {/* 5. 24-HOUR CIRCADIAN ARC & READINESS MATRIX */}
            <section className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
                    Circadian Readiness
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      readinessStatus.includes("Light")
                        ? "bg-amber-400 animate-pulse"
                        : readinessStatus.includes("Moderate")
                        ? "bg-amber-300"
                        : readinessStatus.includes("Full")
                        ? "bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                        : "bg-slate-500"
                    }`}
                  />
                  <span className="font-mono text-[11px] text-slate-300 font-bold">
                    {readinessStatus}
                  </span>
                </div>
              </div>

              {/* Visual Arc Dial Representation */}
              <div className="p-3 bg-[#05080c] rounded-xl border border-[#1b2d47] flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Target Prime Window
                  </span>
                  <span className="text-sm font-mono font-bold text-white tracking-tight">
                    {`${chrono.label} // ~${estimatedPaceMin} MIN PACE`}
                  </span>
                  <span className="text-[10px] font-mono text-[#10b981] block">
                    Scapular &amp; Pelvic Switch Locked
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/25 font-bold">
                    DRIVE {readinessScore}%
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 mt-1 block">
                    {readinessLabel}
                  </span>
                </div>
              </div>

              {/* Prompt for Readiness Check-in if not yet answered */}
              {!hasReadinessInput && (
                <ReadinessCheckin
                  userId={currentUser.id}
                  onCheckedIn={() => setTick((t) => t + 1)}
                />
              )}

              {/* Cross-Pillar Insight if exists */}
              {insight && (
                <Insight
                  sentence={insight.sentence}
                  sourcePillars={insight.sources}
                  whyPrompt={insight.whyPrompt}
                  onWhyClick={handleWhyClick}
                />
              )}
            </section>

            {/* 6. NUTRITIONAL FUEL GAUGES (AEROSPACE TELEMETRY CELLS) */}
            <section className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
                    Nutritional Fuel (Mass Stack)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSuppDrawerOpen(true)}
                  className="text-[10px] font-mono text-cyan-300 hover:text-cyan-200 transition cursor-pointer"
                >
                  Protocols &amp; Jumbo →
                </button>
              </div>

              {/* Caloric Banner */}
              <div className="p-2.5 bg-[#05080c] rounded-xl border border-[#1b2d47] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">
                    Daily Hypertrophy Surplus
                  </span>
                  <span className="text-lg font-display font-black text-white tracking-wide">
                    {targetKcal}{" "}
                    <span className="text-xs font-mono font-normal text-slate-400">
                      TARGET KCAL / DAY
                    </span>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                  {currentUser.goals?.[0]?.toUpperCase() || "HYPERTROPHY"} TARGET
                </span>
              </div>

              {/* Macro Triad */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2.5 bg-[#05080c] rounded-xl border border-[#1b2d47]">
                  <div className="text-base font-display font-black text-[#10b981]">
                    {targetProtein}g
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">
                    Protein
                  </div>
                </div>

                <div className="p-2.5 bg-[#05080c] rounded-xl border border-[#1b2d47]">
                  <div className="text-base font-display font-black text-cyan-300">
                    {targetCarbs}g
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">
                    Carbs
                  </div>
                </div>

                <div className="p-2.5 bg-[#05080c] rounded-xl border border-[#1b2d47]">
                  <div className="text-base font-display font-black text-amber-300">
                    {targetFat}g
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">
                    Fats
                  </div>
                </div>
              </div>
            </section>

            {/* 7. QUICK AI COACH SENTINEL ACCESS */}
            <section className="p-4 bg-[#0a0e17] border border-[#1b2d47] rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
                    AI Sovereign Coach
                  </span>
                </div>
                <Link
                  href="/coach"
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition"
                >
                  Open Chat →
                </Link>
              </div>
              <p className="text-xs text-slate-400">
                Connected to Claude MCP &amp; Gemini 4 Argon with full RAG over your 6,554 exercises and telemetry.
              </p>
            </section>

          </div>
        </div>
      )}

      {/* MODALS & DRAWERS */}
      <SupplementStackDrawer
        isOpen={isSuppDrawerOpen}
        onOpenChange={setIsSuppDrawerOpen}
        userId={currentUser.id}
        onUpdate={() => setTick((t) => t + 1)}
      />

      <SessionAdjustmentSheet
        isOpen={isAdjustSheetOpen}
        onOpenChange={setIsAdjustSheetOpen}
        userId={currentUser.id}
      />

      <WorkoutSessionDetailSheet
        session={selectedSession}
        isOpen={!!selectedSession}
        onOpenChange={(open) => !open && setSelectedSession(null)}
      />

      {/* 1-Tap Biomechanical Substitution Drawer */}
      <SubstitutionCopilotDrawer
        isOpen={isSwapDrawerOpen}
        onClose={() => {
          setIsSwapDrawerOpen(false);
          setSwapExerciseTarget(null);
        }}
        currentExercise={swapExerciseTarget}
        onApplySubstitute={handleApplyTodaySwap}
      />

      {/* Inline Movement Video Demonstration Modal */}
      <ExerciseVideoModal
        isOpen={Boolean(videoModalExercise)}
        onClose={() => setVideoModalExercise(null)}
        exercise={videoModalExercise}
      />
    </div>
  );
}
