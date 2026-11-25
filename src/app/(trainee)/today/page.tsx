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
import { VyraLogo } from "@/components/brand/VyraLogo";
import { runAutonomousCoachingLifecycleCheck } from "@/lib/ai/coaching-cycle";
import {
  useIsClientHydrated,
  useVyraAuth,
  useVyraStoreVersion,
} from "@/components/auth/VyraAuthProvider";
import { getChronoPhase } from "@/components/trainee/TraineeNav";
import { resolveProgramDay } from "@/lib/utils";
import type { ExercisePrescription, WorkoutSession } from "@/lib/types";
import {
  Activity,
  ArrowRight,
  ChevronRight,
  Clock,
  Dumbbell,
  Eye,
  Flame,
  Play,
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

  const sessions = isHydrated ? appStore.getSessions(currentUser.id) : [];
  const metricEntries = isHydrated ? appStore.getMetrics(currentUser.id) : [];

  const program = isHydrated
    ? appStore.getActiveProgramForTrainee(currentUser.id)
    : undefined;
  const effectiveForceDayZero = isHydrated
    ? forceDayZero !== undefined
      ? forceDayZero
      : !program && sessions.length === 0
    : true;
  const resolved = program
    ? resolveProgramDay(program.startDate)
    : { weekIndex: 1, dayOfWeek: 0, started: true };
  const currentWeek = program?.weeks
    ? program.weeks[
        Math.min(resolved.weekIndex - 1, program.weeks.length - 1)
      ]
    : undefined;
  const todaySession = currentWeek?.days
    ? currentWeek.days.find((d) => d.dayOfWeek === resolved.dayOfWeek)
    : undefined;
  const todayExercises = todaySession?.blocks
    ? todaySession.blocks.flatMap((b) => b.exercises)
    : [];

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
    isRestDay,
    isDayZero,
  } = useMemo(
    () =>
      deriveDayTimeline(currentUser.id, undefined, undefined, {
        forceDayZero: effectiveForceDayZero,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isHydrated, currentUser.id, tick, effectiveForceDayZero, storeVersion]
  );

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

  const isWorkoutDone = heroMoment?.badge === "Done";

  return (
    <div className="flex-1 pb-28 px-4 pt-4 max-w-md mx-auto w-full space-y-5 animate-in fade-in duration-300 font-body select-none">
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

          <span className="text-slate-400">
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
              {chrono.label} // {chrono.badge}
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

        <h1 className="text-2xl font-display uppercase tracking-wider font-extrabold text-white">
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
        <>
          {/* 3. 24-HOUR CHRONOBIOLOGICAL ARC & READINESS MATRIX */}
          <section className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
                  Circadian Hypertrophy Arc
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
                  12:15 – 14:30 // 37 MIN PACE
                </span>
                <span className="text-[10px] font-mono text-[#10b981] block">
                  Scapular &amp; Pelvic Switch Locked
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/25 font-bold">
                  CNS 94.8%
                </span>
                <span className="text-[9px] font-mono text-slate-400 mt-1 block">
                  Optimal recruitment
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

          {/* 4. NUTRITIONAL FUEL GAUGES (AEROSPACE TELEMETRY CELLS) */}
          <section className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
                  Nutritional Energy Cells (Mass Stack)
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
                +250 KCAL SURPLUS
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

          {/* 5. TODAY'S TRAINING DIRECTIVE & MASSIVE PRIMARY CTA */}
          <section className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#10b981]" />
                <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
                  Training Directive // 01 of 01
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/15 px-2 py-0.5 rounded border border-[#10b981]/30 font-bold">
                {isRestDay ? "REST DAY" : isWorkoutDone ? "COMPLETED" : "SCHEDULED"}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-display uppercase tracking-wider font-extrabold text-white">
                {todaySession?.label || (isRestDay ? "Somatic Adaptation & Rest" : "High Mechanical Tension Split")}
              </h2>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                <span>{todayExercises.length} Movements</span>
                <span>·</span>
                <span>37 Min Target Pace</span>
                <span>·</span>
                <span className="text-[#10b981] font-bold">RIR 2 Lock</span>
              </div>
            </div>

            {/* Overload Delta Callout */}
            <div className="p-2.5 bg-[#05080c] rounded-xl border border-[#1b2d47] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 text-[11px]">
                Progression Target:
              </span>
              <span className="text-[#10b981] font-bold">
                +450 KG Ballast Overload Hit Goal
              </span>
            </div>

            {/* Lifts Chip Queue */}
            {todayExercises.length > 0 && !isRestDay && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                  Collimated Movement Queue:
                </span>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {todayExercises.map((ex, idx) => (
                    <div
                      key={ex.id || idx}
                      className="p-2 bg-[#05080c] rounded-lg border border-[#1b2d47] flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="text-[10px] text-[#10b981] font-bold w-4">
                          {idx + 1}.
                        </span>
                        <span className="text-slate-200 truncate font-semibold">
                          {ex.exerciseName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ex.sets}×{ex.repRangeLow}-{ex.repRangeHigh}
                        </span>
                        {ex.videoUrl && (
                          <a
                            href={ex.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-[#0f1724] border border-[#1b2d47] text-cyan-400 hover:text-cyan-300 transition"
                            title="Form preview"
                          >
                            <Video className="w-3 h-3" />
                          </a>
                        )}
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
                    const dateStr = new Date().toISOString().split("T")[0];
                    const todaySess =
                      sessions.find((s) => s.date === dateStr) || sessions[0];
                    if (todaySess) setSelectedSession(todaySess);
                    else router.push("/progress");
                  }}
                  className="w-full h-15 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 active:scale-[0.98] text-[#05080c] font-display uppercase tracking-wider text-xl font-black rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.45)] transition-all cursor-pointer flex items-center justify-between px-4"
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 stroke-[2.5]" />
                    <span>VIEW COMPLETED STATS</span>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : heroMoment?.actionHref ? (
                <Link
                  href={heroMoment.actionHref}
                  className="w-full h-15 py-3.5 bg-gradient-to-r from-[#10b981] via-emerald-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 active:scale-[0.98] text-[#05080c] font-display uppercase tracking-wider text-xl font-black rounded-xl shadow-[0_0_24px_rgba(16,185,129,0.45)] hover:shadow-[0_0_32px_rgba(0,242,254,0.6)] transition-all cursor-pointer flex items-center justify-between px-4"
                >
                  <div className="flex items-center gap-2">
                    <Play className="w-6 h-6 fill-current" />
                    <span>{heroMoment.actionLabel || "COMMENCE SESSION"}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#05080c]/80 text-[#10b981] px-2.5 py-1 rounded-lg border border-[#10b981]/40 font-mono text-xs font-bold">
                    <span>37 MIN</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSuppDrawerOpen(true)}
                  className="w-full h-14 py-3 bg-[#10b981] hover:bg-emerald-400 active:scale-[0.98] text-[#05080c] font-display uppercase tracking-wider text-lg font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{heroMoment?.actionLabel || "LOG DAILY PROTOCOLS"}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}

              {/* Secondary Utility Controls */}
              {!isRestDay && heroMoment?.actionHref && !isWorkoutDone && (
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <Link
                    href={
                      heroMoment.actionHref.includes("mode=")
                        ? heroMoment.actionHref.replace(/mode=[^&]+/, "mode=preview")
                        : `${heroMoment.actionHref}${heroMoment.actionHref.includes("?") ? "&" : "?"}mode=preview`
                    }
                    className="p-2.5 bg-[#05080c] hover:bg-[#142032] border border-[#1b2d47] text-slate-300 hover:text-white rounded-xl text-center transition flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Preview &amp; Cues</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsAdjustSheetOpen(true)}
                    className="p-2.5 bg-[#05080c] hover:bg-[#142032] border border-[#1b2d47] text-slate-300 hover:text-white rounded-xl text-center transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Adjust Session</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 6. DAY TIMELINE & DAILY MOMENTS STREAM */}
          <section className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
              <span className="font-semibold text-slate-300">
                DAILY CHRONO PROTOCOLS
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
        </>
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
    </div>
  );
}
