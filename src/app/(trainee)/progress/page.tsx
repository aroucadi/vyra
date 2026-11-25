"use client";

import React, { useState, useMemo } from "react";
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Compass,
  Dumbbell,
  Flame,
  Layers,
  MapPin,
  Plus,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { appStore } from "@/lib/store";
import { WorkoutSession } from "@/lib/types";
import { logWeightAction } from "@/lib/actions/metrics";
import { calculateEstimated1RM } from "@/lib/utils";
import { WeeklyVolumeDashboard } from "@/components/trainee/WeeklyVolumeDashboard";
import { WorkoutSessionDetailSheet } from "@/components/trainee/WorkoutSessionDetailSheet";
import { VisualProgressStudio } from "@/components/trainee/VisualProgressStudio";
import { AnatomicalTensionSpotlight } from "@/components/trainee/AnatomicalTensionSpotlight";
import { athleteModelStore } from "@/lib/ai/athlete-model";
import {
  useIsClientHydrated,
  useVyraStoreVersion,
} from "@/components/auth/VyraAuthProvider";

export default function ProgressPage() {
  useVyraStoreVersion();
  const isHydrated = useIsClientHydrated();
  const currentUser = appStore.getCurrentUser();
  const activeProgram = isHydrated
    ? appStore.getActiveProgramForTrainee(currentUser.id)
    : undefined;
  const athleteModel = isHydrated
    ? athleteModelStore.getAthleteModel(currentUser.id)
    : athleteModelStore.getAthleteModel("anon_visitor");
  const metrics = isHydrated ? appStore.getMetrics(currentUser.id) : [];
  const [, setLocalTick] = useState(0);
  const sessions = isHydrated ? appStore.getSessions(currentUser.id) : [];
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(
    null
  );

  const [weightInput, setWeightInput] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedSymmetrySegment, setSelectedSymmetrySegment] = useState<
    "all" | "arms" | "legs" | "trunk"
  >("all");

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weightInput);
    if (!val || isNaN(val)) return;

    setIsLogging(true);
    await logWeightAction(currentUser.id, val);
    setLocalTick((v) => v + 1);
    setIsLogging(false);
    setWeightInput("");
    setSuccessMessage("Weigh-in recorded to flight telemetry.");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // 1. Biometric & Segmental Hypertrophy Telemetry
  const biometrics = currentUser.biometrics;
  const skeletalMuscleKg = biometrics?.skeletalMuscleMassKg ?? 24.9;
  const bodyFatPercent = biometrics?.bodyFatPercent ?? 10.0;
  const baselineWeightKg = biometrics?.baselineWeightKg ?? 52.05;
  const week12TargetWeightKg = biometrics?.week12TargetWeightKg ?? 55.5;
  const week16TargetWeightKg = biometrics?.week16TargetWeightKg ?? 57.0;
  const apexTargetKg = biometrics?.longTermAthleteTargetKg ?? 59.3;

  const segmental = useMemo(
    () =>
      biometrics?.segmentalSymmetry ?? {
        leftArmKg: 2.5,
        rightArmKg: 2.5,
        leftLegKg: 7.6,
        rightLegKg: 7.5,
        trunkKg: 12.6,
      },
    [biometrics?.segmentalSymmetry]
  );

  // SMM percentage relative to body weight
  const weights = metrics.map((m) => m.weightKg);
  const hasLoggedMetrics = weights.length > 0;
  const modelEnergyField = athleteModel.dynamic.energyBalanceTrend;
  const fallbackModelWeight =
    modelEnergyField.confidence > 0 &&
    modelEnergyField.value.smoothedWeightKg > 0
      ? modelEnergyField.value.smoothedWeightKg
      : baselineWeightKg;

  const latestWeight = hasLoggedMetrics
    ? weights[weights.length - 1]
    : fallbackModelWeight;
  const startWeight = hasLoggedMetrics ? weights[0] : baselineWeightKg;
  const smmPercent = latestWeight > 0 ? ((skeletalMuscleKg / latestWeight) * 100).toFixed(1) : "47.5";

  // Symmetry ratios
  const armTotal = (segmental.leftArmKg ?? 2.5) + (segmental.rightArmKg ?? 2.5);
  const leftArmPercent = armTotal > 0 ? (((segmental.leftArmKg ?? 2.5) / armTotal) * 100).toFixed(1) : "50.0";
  const rightArmPercent = armTotal > 0 ? (((segmental.rightArmKg ?? 2.5) / armTotal) * 100).toFixed(1) : "50.0";

  const legTotal = (segmental.leftLegKg ?? 7.6) + (segmental.rightLegKg ?? 7.5);
  const leftLegPercent = legTotal > 0 ? (((segmental.leftLegKg ?? 7.6) / legTotal) * 100).toFixed(1) : "50.3";
  const rightLegPercent = legTotal > 0 ? (((segmental.rightLegKg ?? 7.5) / legTotal) * 100).toFixed(1) : "49.7";

  // Derive muscle spotlight targets from selected segment
  const spotlightConfig = useMemo(() => {
    switch (selectedSymmetrySegment) {
      case "arms":
        return { primary: "biceps", secondary: ["triceps"] };
      case "legs":
        return { primary: "quads", secondary: ["hamstrings", "calves"] };
      case "trunk":
        return { primary: "lats", secondary: ["core", "chest"] };
      case "all":
      default:
        return { primary: "lats", secondary: ["quads", "shoulders"] };
    }
  }, [selectedSymmetrySegment]);

  // 2. Weight Telemetry & 14-Day Curve
  const minWeight =
    hasLoggedMetrics && weights.length > 0
      ? Math.min(...weights)
      : startWeight - 1;
  const maxWeight =
    hasLoggedMetrics && weights.length > 0
      ? Math.max(...weights)
      : startWeight + 5;
  const weightDiff =
    latestWeight !== undefined && startWeight !== undefined
      ? Math.round((latestWeight - startWeight) * 10) / 10
      : 0;

  // 14-day rolling delta
  const recent14dMetrics = metrics.slice(-14);
  const rolling14dDelta =
    recent14dMetrics.length >= 2
      ? (
          recent14dMetrics[recent14dMetrics.length - 1].weightKg -
          recent14dMetrics[0].weightKg
        ).toFixed(2)
      : "+0.40";

  // Cumulative tonnage across all sessions
  const totalLifetimeTonnage = useMemo(
    () =>
      sessions.reduce(
        (sum, s) =>
          sum +
          (s.setLogs
            ? s.setLogs.reduce(
                (sSum, l) => sSum + (l.weightKg || 0) * (l.reps || 0),
                0
              )
            : 0),
        0
      ),
    [sessions]
  );

  // 3. Extract PRs
  const prs = useMemo(() => {
    const list: {
      exercise: string;
      weight: number;
      reps: number;
      date: string;
      equipment?: string;
      estimated1Rm: number;
    }[] = [];

    sessions.forEach((s) => {
      s.setLogs?.forEach((l) => {
        if (l.isPR) {
          list.push({
            exercise: l.exerciseName,
            weight: l.weightKg,
            reps: l.reps,
            date: s.date,
            equipment: l.selectedEquipment,
            estimated1Rm: calculateEstimated1RM(l.weightKg, l.reps),
          });
        }
      });
    });

    // Sort PRs by estimated 1RM descending
    return list.sort((a, b) => b.estimated1Rm - a.estimated1Rm);
  }, [sessions]);

  return (
    <div className="flex-1 pb-28 px-4 pt-4 max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-300 font-body select-none">
      {/* TOP FLIGHT RECORDER BEACON STRIP */}
      <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#10b981] font-bold">
            FLIGHT RECORDER // ACTIVE
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          LOGGED: {sessions.length} FLIGHTS · {prs.length} PRS
        </span>
      </div>

      {/* HEADER: MISSION TITLE & STATS */}
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 font-bold">
            AEROSPACE BIOMECHANICAL SUITE
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {isHydrated ? currentUser.name : "Athlete"}
          </span>
        </div>
        <h1 className="text-2xl font-display uppercase tracking-wider font-extrabold text-white">
          The Athletic Flight Recorder
        </h1>
        <p className="text-xs text-slate-400">
          Longitudinal telemetry, segmental hypertrophy, and verified 1RM projections.
        </p>
      </header>

      {/* LIFETIME FLIGHT TELEMETRY TILES */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-[#0f1724] border border-[#1b2d47] rounded-xl text-center">
          <div className="text-xl font-display font-black text-white tabular-nums tracking-wide">
            {totalLifetimeTonnage > 1000
              ? `${(totalLifetimeTonnage / 1000).toFixed(1)}k`
              : totalLifetimeTonnage}
            <span className="text-xs font-mono font-normal text-slate-400 ml-1">
              KG
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            Lifetime Volume
          </div>
        </div>

        <div className="p-3 bg-[#0f1724] border border-[#1b2d47] rounded-xl text-center">
          <div className="text-xl font-display font-black text-cyan-300 tabular-nums tracking-wide">
            {sessions.length}
          </div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            Flights Logged
          </div>
        </div>

        <div className="p-3 bg-[#0f1724] border border-[#1b2d47] rounded-xl text-center">
          <div className="text-xl font-display font-black text-[#10b981] tabular-nums tracking-wide">
            {prs.length}
          </div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            Verified PRs
          </div>
        </div>
      </div>

      {/* SECTION 1: SEGMENTAL HYPERTROPHY & BILATERAL SYMMETRY */}
      <section className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#10b981]" />
            <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
              Segmental Hypertrophy &amp; Bilateral Symmetry
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#10b981] font-bold">
            {smmPercent}% SMM Index
          </span>
        </div>

        {/* Hero Body Composition Numbers */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 bg-[#05080c] rounded-xl border border-[#10b981]/30">
            <span className="text-[9px] font-mono text-slate-400 uppercase block">
              Skeletal Muscle
            </span>
            <div className="text-lg font-display font-black text-[#10b981]">
              {skeletalMuscleKg} <span className="text-xs font-normal text-slate-400 font-mono">KG</span>
            </div>
            <span className="text-[9px] font-mono text-[#10b981]/90">Target: 26.5 KG</span>
          </div>

          <div className="p-2.5 bg-[#05080c] rounded-xl border border-cyan-500/30">
            <span className="text-[9px] font-mono text-slate-400 uppercase block">
              Body Fat
            </span>
            <div className="text-lg font-display font-black text-cyan-300">
              {bodyFatPercent}%
            </div>
            <span className="text-[9px] font-mono text-cyan-400/90">Lean Crucible</span>
          </div>

          <div className="p-2.5 bg-[#05080c] rounded-xl border border-amber-500/30">
            <span className="text-[9px] font-mono text-slate-400 uppercase block">
              Current Floor
            </span>
            <div className="text-lg font-display font-black text-amber-300">
              {latestWeight} <span className="text-xs font-normal text-slate-400 font-mono">KG</span>
            </div>
            <span className="text-[9px] font-mono text-amber-400/90">Apex: {apexTargetKg}kg</span>
          </div>
        </div>

        {/* Segment Filter Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#05080c] rounded-xl border border-[#1b2d47] text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setSelectedSymmetrySegment("all")}
            className={`flex-1 py-1 rounded-lg font-bold transition cursor-pointer ${
              selectedSymmetrySegment === "all"
                ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Chains
          </button>
          <button
            type="button"
            onClick={() => setSelectedSymmetrySegment("arms")}
            className={`flex-1 py-1 rounded-lg font-bold transition cursor-pointer ${
              selectedSymmetrySegment === "arms"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Arms ({armTotal}kg)
          </button>
          <button
            type="button"
            onClick={() => setSelectedSymmetrySegment("legs")}
            className={`flex-1 py-1 rounded-lg font-bold transition cursor-pointer ${
              selectedSymmetrySegment === "legs"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Legs ({legTotal.toFixed(1)}kg)
          </button>
          <button
            type="button"
            onClick={() => setSelectedSymmetrySegment("trunk")}
            className={`flex-1 py-1 rounded-lg font-bold transition cursor-pointer ${
              selectedSymmetrySegment === "trunk"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Trunk ({segmental.trunkKg ?? 12.6}kg)
          </button>
        </div>

        {/* Interactive Anatomical Vector Spotlight & Telemetry Gauges */}
        <div className="grid grid-cols-5 gap-3 items-center p-3 bg-[#05080c] rounded-xl border border-[#1b2d47]">
          <div className="col-span-2 flex justify-center py-1">
            <AnatomicalTensionSpotlight
              primaryMuscle={spotlightConfig.primary}
              secondaryMuscles={spotlightConfig.secondary}
              accentColor="emerald"
              showToggle={false}
              className="w-32 h-36"
            />
          </div>

          <div className="col-span-3 space-y-2 text-xs font-mono">
            {/* Arms Symmetry Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-300 font-semibold">Upper Bilateral Arms</span>
                <span className="text-[#10b981] font-bold">100% Equilibrium</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-cyan-300 font-bold">{segmental.leftArmKg ?? 2.5}kg L</span>
                <div className="flex-1 bg-[#142032] rounded-full h-2 flex overflow-hidden border border-[#1b2d47]">
                  <div style={{ width: `${leftArmPercent}%` }} className="bg-cyan-400 h-full" />
                  <div style={{ width: `${rightArmPercent}%` }} className="bg-[#10b981] h-full" />
                </div>
                <span className="text-[#10b981] font-bold">{segmental.rightArmKg ?? 2.5}kg R</span>
              </div>
            </div>

            {/* Legs Symmetry Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-300 font-semibold">Lower Extremities</span>
                <span className="text-cyan-300 font-bold">0.1kg Micro-Delta</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-cyan-300 font-bold">{segmental.leftLegKg ?? 7.6}kg L</span>
                <div className="flex-1 bg-[#142032] rounded-full h-2 flex overflow-hidden border border-[#1b2d47]">
                  <div style={{ width: `${leftLegPercent}%` }} className="bg-cyan-400 h-full" />
                  <div style={{ width: `${rightLegPercent}%` }} className="bg-[#10b981] h-full" />
                </div>
                <span className="text-[#10b981] font-bold">{segmental.rightLegKg ?? 7.5}kg R</span>
              </div>
            </div>

            {/* Trunk Axial Base */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-300 font-semibold">Axial Trunk Base</span>
                <span className="text-indigo-300 font-bold">{segmental.trunkKg ?? 12.6} kg</span>
              </div>
              <div className="w-full bg-[#142032] rounded-full h-2 overflow-hidden border border-[#1b2d47]">
                <div style={{ width: "50.6%" }} className="bg-indigo-400 h-full rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: SURPLUS TRAJECTORY & 14-DAY WEIGH-IN CURVE */}
      {!currentUser.hideWeightFromTrainee && (
        <section className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
                Mass Hypertrophy Trajectory (Surplus Track)
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#10b981] font-bold">
              {rolling14dDelta} kg (14d)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Current Measured Bodyweight
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-display font-black text-white tabular-nums tracking-wide">
                  {latestWeight}
                  <span className="text-xs font-mono font-normal text-slate-400 ml-1">
                    KG
                  </span>
                </span>
                <span className="text-xs font-mono font-bold text-[#10b981] flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {weightDiff >= 0 ? `+${weightDiff}` : weightDiff} kg since baseline
                </span>
              </div>
            </div>

            {/* Quick Log Weigh-In Form */}
            <form onSubmit={handleLogWeight} className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.05"
                placeholder="52.4"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-20 px-2.5 py-2 rounded-xl bg-[#05080c] border border-[#1b2d47] text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={isLogging}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#10b981] to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 active:scale-95 text-[#05080c] font-display uppercase tracking-wider text-xs font-black flex items-center gap-1 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log</span>
              </button>
            </form>
          </div>

          {successMessage && (
            <p className="text-xs text-[#10b981] font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {successMessage}
            </p>
          )}

          {/* 16-Week Milestone Progression Bar */}
          <div className="p-3 bg-[#05080c] border border-[#1b2d47] rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400 uppercase tracking-wider">
                16-Week Mass Target Track
              </span>
              <span className="text-[#10b981] font-bold">
                {baselineWeightKg} kg → {week16TargetWeightKg} kg Goal
              </span>
            </div>
            <div className="w-full bg-[#142032] rounded-full h-2.5 overflow-hidden border border-[#1b2d47]">
              {(() => {
                const span = Math.max(0.1, week16TargetWeightKg - baselineWeightKg);
                const progressPct = Math.round(
                  ((Math.max(baselineWeightKg, Math.min(week16TargetWeightKg, latestWeight)) -
                    baselineWeightKg) /
                    span) *
                    100
                );
                return (
                  <div
                    style={{ width: `${Math.max(6, progressPct)}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-[#10b981] via-emerald-400 to-cyan-400 transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  />
                );
              })()}
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>W1: {baselineWeightKg}kg</span>
              <span>W6: 53.8kg</span>
              <span>W12: {week12TargetWeightKg}kg</span>
              <span className="text-[#10b981] font-bold">
                W16: {week16TargetWeightKg}kg
              </span>
            </div>
          </div>

          {/* 14-Day Micro-Delta Curve */}
          {hasLoggedMetrics ? (
            <div className="bg-[#05080c] p-3 rounded-xl border border-[#1b2d47] space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>14-Day Micro-Delta Curve</span>
                <span className="text-cyan-300 font-bold">
                  Range: {minWeight.toFixed(1)}kg – {maxWeight.toFixed(1)}kg
                </span>
              </div>

              <div className="h-28 w-full flex items-end justify-between gap-1.5 pt-3 px-1">
                {metrics.slice(-14).map((m, idx) => {
                  const heightPercent =
                    ((m.weightKg - minWeight + 0.3) /
                      (maxWeight - minWeight + 0.6)) *
                    100;
                  return (
                    <div
                      key={m.id || idx}
                      className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                    >
                      <div
                        style={{ height: `${Math.max(18, heightPercent)}%` }}
                        className="w-full rounded-t-md bg-gradient-to-t from-[#10b981]/20 via-[#10b981]/60 to-cyan-400 group-hover:to-cyan-300 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.6)] transition"
                      />
                      <span className="text-[8px] font-mono text-slate-500">
                        {idx % 2 === 0 ? m.date.slice(8) : ""}
                      </span>

                      {/* Tooltip on hover */}
                      <div className="absolute -top-7 hidden group-hover:block bg-[#0f1724] border border-cyan-500/40 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 whitespace-nowrap z-10 shadow-md">
                        {m.weightKg} kg · {m.date}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#05080c] border border-[#1b2d47] rounded-xl text-xs font-mono text-slate-400 text-center">
              No daily weigh-ins logged yet. Log your morning weight above to record your high-density trajectory curve.
            </div>
          )}
        </section>
      )}

      {/* SECTION 3: AEROSPACE PR RECORDS BOARD & 1RM PROJECTIONS */}
      <section className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
              Aerospace Personal Records (PR) Showcase
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
            {prs.length} Verified Records
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {prs.length > 0 ? (
            prs.map((pr, idx) => (
              <div
                key={`${pr.exercise}_${idx}`}
                className="bg-[#05080c] p-3 rounded-xl border border-[#1b2d47] space-y-1.5 hover:border-cyan-500/40 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-display uppercase tracking-wider text-slate-200 font-bold truncate">
                    {pr.exercise}
                  </span>
                  {pr.equipment && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 shrink-0">
                      {pr.equipment}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-display font-black text-white tabular-nums tracking-wide">
                    {pr.weight} <span className="text-xs font-normal text-slate-400 font-mono">KG</span>
                    <span className="text-xs font-mono font-semibold text-[#10b981] ml-1.5">
                      × {pr.reps} REPS
                    </span>
                  </p>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
                    Est 1RM {pr.estimated1Rm}kg
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-0.5 border-t border-[#1b2d47]/50">
                  <span>LOGGED: {pr.date}</span>
                  <span className="text-[#10b981] flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    <span>FLIGHT VERIFIED</span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-[#05080c] p-4 rounded-xl border border-[#1b2d47] text-center space-y-1">
              <p className="text-xs text-slate-300 font-medium">No verified PRs in flight log yet.</p>
              <p className="text-[10px] text-slate-500 font-mono">
                Complete a workout in the Living Kinetic Cockpit to establish your baseline 1RM records.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4: VISUAL PROGRESS STUDIO */}
      <VisualProgressStudio />

      {/* SECTION 5: WEEKLY VOLUME DASHBOARD & POSTURAL RATIOS */}
      {activeProgram ? (
        <WeeklyVolumeDashboard program={activeProgram} />
      ) : (
        <section className="bg-[#0f1724] rounded-2xl border border-[#1b2d47] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-display uppercase tracking-wider font-bold text-white">
              Volume &amp; Postural Allocation
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              No active block
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Create or activate a training split to view your weekly push-to-posture set allocation and muscle breakdown.
          </p>
        </section>
      )}

      {/* SECTION 6: COLLIMATED FLIGHT LOG STREAM (WORKOUT HISTORY) */}
      <section className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
              Flight Logs Archive // History
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 font-bold">
            {sessions.length} Recorded
          </span>
        </div>

        {sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.map((sess, idx) => {
              const sessVol = sess.setLogs
                ? sess.setLogs.reduce(
                    (acc, l) => acc + (l.weightKg || 0) * (l.reps || 0),
                    0
                  )
                : 0;
              const durationMin = sess.durationSec
                ? Math.max(1, Math.round(sess.durationSec / 60))
                : 0;
              const prCount = sess.setLogs
                ? sess.setLogs.filter((l) => l.isPR).length
                : 0;
              const dateStr = sess.date
                ? new Date(sess.date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                : "Workout";

              return (
                <div
                  key={sess.id || idx}
                  onClick={() => setSelectedSession(sess)}
                  className="bg-[#05080c] p-3 rounded-xl border border-[#1b2d47] hover:border-cyan-500/50 hover:bg-[#090f18] transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1.5 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#10b981] font-bold">
                        LOG #{sessions.length - idx}-FLIGHT
                      </span>
                      <span className="text-xs font-display uppercase tracking-wider font-bold text-white truncate">
                        {sess.dayLabel || sess.programTitle || "Training Mission"}
                      </span>
                      {prCount > 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 shrink-0">
                          <Trophy className="w-2.5 h-2.5" />
                          <span>+{prCount} PR</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                      <span>{dateStr}</span>
                      <span>·</span>
                      <span className="text-cyan-300 font-bold">
                        {sessVol.toLocaleString()} kg
                      </span>
                      <span>·</span>
                      <span>{sess.setLogs?.length || 0} sets</span>
                      {durationMin > 0 && (
                        <>
                          <span>·</span>
                          <span>{durationMin}m</span>
                        </>
                      )}
                      {sess.gymName && (
                        <>
                          <span>·</span>
                          <span className="text-slate-400 truncate max-w-[100px]">
                            {sess.gymName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition shrink-0" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#05080c] p-4 rounded-xl border border-[#1b2d47] text-center space-y-1">
            <p className="text-xs text-slate-300 font-medium">No workout flights recorded yet.</p>
            <p className="text-[10px] text-slate-500 font-mono">
              When you complete a workout in Session, your full telemetry, volume, and PRs will be archived here.
            </p>
          </div>
        )}
      </section>

      {/* WORKOUT SESSION DETAIL SHEET */}
      <WorkoutSessionDetailSheet
        session={selectedSession}
        isOpen={!!selectedSession}
        onOpenChange={(open) => !open && setSelectedSession(null)}
      />
    </div>
  );
}
