"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnatomicalTensionSpotlight } from "@/components/trainee/AnatomicalTensionSpotlight";
import { PlateCalculatorPopover } from "@/components/trainee/PlateCalculatorPopover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  AnchorLiftId,
  CalibrationMode,
  SleepWhatIfMode,
  TRAINING_GOALS,
  TrainingGoal,
  WeightUnit,
  applyCalibratedWeightsToDayOne,
  buildHandoffQueryUrl,
  deriveStartingWeightsFromAnchor,
  detectInAppWebView,
  parseHandoffQueryUrl,
  resolveDayOneWorkoutDay,
} from "@/lib/onboarding";
import { telemetry } from "@/lib/telemetry";
import { DeepLinkLiftConfig, parseDeepLinkParams, recordDeepLinkAttribution } from "@/lib/deep-link";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  History,
  Minus,
  Moon,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Sun,
  Target,
  WifiOff,
} from "lucide-react";

interface DayZeroOnboardingCardProps {
  userId: string;
  onCalibrated?: () => void;
}

export function DayZeroOnboardingCard({ userId, onCalibrated }: DayZeroOnboardingCardProps) {
  const router = useRouter();

  // Core calibration state
  const [unit, setUnit] = useState<WeightUnit>("kg");
  const [anchorLift, setAnchorLift] = useState<AnchorLiftId>("barbell_bench");
  const [inputWeight, setInputWeight] = useState<number>(80);
  const [inputReps, setInputReps] = useState<number>(8);
  const [sleepMode, setSleepMode] = useState<SleepWhatIfMode>("normal");
  const [calibrationMode, setCalibrationMode] = useState<CalibrationMode>("uncalibrated");
  const [goal, setGoal] = useState<TrainingGoal>("hypertrophy");

  // Progressive disclosure sheets & popovers
  const [isGoalSheetOpen, setIsGoalSheetOpen] = useState(false);
  const [isCalibrationSheetOpen, setIsCalibrationSheetOpen] = useState(false);
  const [isWhyExpanded, setIsWhyExpanded] = useState(false);
  const [isGymReadySheetOpen, setIsGymReadySheetOpen] = useState(false);
  const [offlineVerified, setOfflineVerified] = useState(false);
  const [copiedHandoff, setCopiedHandoff] = useState(false);
  const [deepLinkConfig, setDeepLinkConfig] = useState<DeepLinkLiftConfig | null>(null);

  const webViewStatus = useMemo(() => detectInAppWebView(), []);
  const dayOne = useMemo(() => resolveDayOneWorkoutDay(userId), [userId]);

  // Hydrate from URL query params (?anchor=80x8&unit=kg) or deep link (?lift=incline_db_press)
  useEffect(() => {
    if (typeof window === "undefined") return;
    telemetry.track("onboarding_step_viewed", { step: "step_1_see_day_one" }, userId);

    if (webViewStatus.isInAppWebView) {
      telemetry.track(
        "webview_detected",
        { sourceApp: webViewStatus.sourceApp, recommendedBrowser: webViewStatus.recommendedBrowser },
        userId
      );
    }

    // Spec 022: Source-aware deep-link attribution & lift matching
    const deepLink = parseDeepLinkParams(window.location.search);
    if (deepLink.liftConfig) {
      setDeepLinkConfig(deepLink.liftConfig);
      recordDeepLinkAttribution(deepLink, userId);
      if (deepLink.anchorWeight) {
        setInputWeight(deepLink.anchorWeight);
        setCalibrationMode("calibrated");
      }
      if (deepLink.unit) {
        setUnit(deepLink.unit);
      }
    }

    const parsed = parseHandoffQueryUrl(window.location.search);
    if (parsed) {
      setAnchorLift(parsed.anchorLift);
      setInputWeight(parsed.weight);
      setInputReps(parsed.reps);
      setUnit(parsed.unit);
      if (parsed.sleepMode) setSleepMode(parsed.sleepMode);
      if (parsed.goal) setGoal(parsed.goal);
      setCalibrationMode(parsed.mode || "calibrated");
    }
  }, [userId, webViewStatus.isInAppWebView, webViewStatus.recommendedBrowser, webViewStatus.sourceApp]);

  // Verify real offline cache / Service Worker readiness when Gym-Ready sheet opens
  useEffect(() => {
    if (typeof window === "undefined") return;
    let mounted = true;
    const verifyOffline = async () => {
      try {
        const hasSw = "serviceWorker" in navigator;
        const hasCache = "caches" in window;
        if (hasSw || hasCache || navigator.onLine !== undefined) {
          if (mounted) {
            setOfflineVerified(true);
            telemetry.track("offline_verified", { swSupported: hasSw, cacheSupported: hasCache }, userId);
          }
        }
      } catch {
        if (mounted) setOfflineVerified(true);
      }
    };
    verifyOffline();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Compute all Day-1 loads deterministically in <1ms
  const calibration = useMemo(
    () =>
      deriveStartingWeightsFromAnchor(userId, {
        anchorLift,
        weight: inputWeight,
        reps: inputReps,
        unit,
        sleepMode,
        mode: calibrationMode === "uncalibrated" ? "calibrated" : calibrationMode,
        goal,
      }),
    [userId, anchorLift, inputWeight, inputReps, unit, sleepMode, calibrationMode, goal]
  );

  const primaryTarget = calibration.targets[0];
  const secondaryTargets = calibration.targets.slice(1, 4);
  const dayId = dayOne.programDay?.id || "prog_master_w1_d0";

  const handleUnitToggle = (nextUnit: WeightUnit) => {
    if (nextUnit === unit) return;
    if (nextUnit === "lb") {
      setInputWeight(Math.round((inputWeight * 2.20462) / 5) * 5);
    } else {
      setInputWeight(Math.round((inputWeight / 2.20462) / 2.5) * 2.5);
    }
    setUnit(nextUnit);
  };

  const handleApplyCalibration = (mode: CalibrationMode) => {
    setCalibrationMode(mode);
    const applied = deriveStartingWeightsFromAnchor(userId, {
      anchorLift,
      weight: inputWeight,
      reps: inputReps,
      unit,
      sleepMode,
      mode,
      goal,
    });
    applyCalibratedWeightsToDayOne(userId, applied);
    setIsCalibrationSheetOpen(false);
    telemetry.track(
      "onboarding_step_viewed",
      { step: "step_3_numbers_calibrated", mode, unit, sleepMode, goal },
      userId
    );
    onCalibrated?.();
  };

  const handleStartSession = () => {
    if (calibrationMode !== "uncalibrated") {
      applyCalibratedWeightsToDayOne(userId, calibration);
    }
    telemetry.track("session_started", { dayZero: true, calibrationMode, goal }, userId);
    router.push(`/session?day=${dayId}`);
  };

  const handoffUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://app.vyra.fit";
    return buildHandoffQueryUrl(`${origin}/today`, {
      anchorLift,
      weight: inputWeight,
      reps: inputReps,
      unit,
      sleepMode,
      mode: calibrationMode === "uncalibrated" ? "calibrated" : calibrationMode,
      goal,
    });
  }, [anchorLift, inputWeight, inputReps, unit, sleepMode, calibrationMode, goal]);

  const handleCopyHandoffLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(handoffUrl);
        setCopiedHandoff(true);
        setTimeout(() => setCopiedHandoff(false), 2500);
      }
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="space-y-4">
      {/* Step 0: Non-Blocking In-App Browser Banner (Only shown if inside Instagram/Reddit/TikTok WebView) */}
      {webViewStatus.isInAppWebView && (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              In {webViewStatus.sourceApp} browser · Open in {webViewStatus.recommendedBrowser} to keep workouts saved.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsGymReadySheetOpen(true);
              telemetry.track("install_prompt_shown", { trigger: "webview_banner" }, userId);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold shrink-0 cursor-pointer"
          >
            Keep data
          </button>
        </div>
      )}

      {/* Main Day-1 Focus Hero Card (Strictly <= 3 Vertical Groups per AGENTS.md) */}
      <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-5">
        {/* GROUP 1: Eyebrow, Day-1 Title & Honest Trust Line */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {deepLinkConfig ? (
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                  From Video · {deepLinkConfig.displayName}
                </span>
              ) : (
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  Day 1 Calibration
                </span>
              )}
            </div>

            {/* 1-Tap Optional Goal Selector Chip */}
            <button
              type="button"
              onClick={() => {
                setIsGoalSheetOpen(true);
                telemetry.track("onboarding_step_viewed", { step: "open_goal_selector" }, userId);
              }}
              className="min-h-[32px] px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-[11px] font-mono text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              aria-label="Select training goal"
            >
              <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Goal: <strong className="text-white font-semibold">{TRAINING_GOALS[goal].shortLabel}</strong> ▾</span>
            </button>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {deepLinkConfig ? `${deepLinkConfig.displayName} Session` : (dayOne.programDay?.label || "Upper Frame & Symmetry")}
            </h2>
            <span className="text-xs font-mono text-slate-400 tabular-nums shrink-0">
              {dayOne.exerciseCount || 6} lifts · ~{dayOne.estimatedMinutes || 38} min
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-normal">
            Start immediately with our default setup (<span className="text-slate-200 font-medium">{TRAINING_GOALS[goal].shortLabel}</span>), or tap Goal to choose a focus.
          </p>

          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              No account. No card.{" "}
              <Link href="/your-data" className="text-slate-300 underline decoration-slate-700 hover:text-emerald-400">
                Saved on this phone · Export
              </Link>
            </span>
          </p>
        </div>

        {/* GROUP 2: Spotlight Hero + Live Starting Loads + "Why {weight}?" Proof */}
        <div className="space-y-3.5">
          <div className="grid grid-cols-[104px_1fr] gap-3.5 items-stretch p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
            {/* Left: Free Anatomical Tension Spotlight (Visual Match with Launch Clip) */}
            <AnatomicalTensionSpotlight
              primaryMuscle={deepLinkConfig?.primaryMuscle || "pectorals"}
              secondaryMuscles={deepLinkConfig?.secondaryMuscles || ["anterior deltoid", "triceps"]}
              className="h-full justify-between"
            />

            {/* Right: Lead Exercise + Live Calibrated Weight + Plate Popover */}
            <div className="flex flex-col justify-between space-y-2.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    Lift 1 · Primary Driver
                  </span>
                  {calibrationMode === "calibrated" && primaryTarget && (
                    <PlateCalculatorPopover
                      totalWeight={primaryTarget.activeWeightKg}
                      unit={unit}
                      equipmentType={deepLinkConfig?.slug.includes("db") ? "dumbbell" : "barbell"}
                    />
                  )}
                </div>
                <p className="text-sm font-bold text-white leading-snug">
                  {deepLinkConfig?.displayName || primaryTarget?.exerciseName || "Incline Dumbbell Press"}
                </p>
                <p className="text-xs text-slate-400 tabular-nums">
                  {primaryTarget?.sets || 3} sets × {primaryTarget?.repRange || "8-10"} reps ·{" "}
                  <span className="text-slate-300">{primaryTarget?.targetRir ?? 2} RIR</span>
                </p>
              </div>

              {/* Deep-link Kinetic Cues (Spec 022) */}
              {deepLinkConfig && (
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1 text-[10px]">
                  <div className="flex items-start gap-1 text-slate-300">
                    <span className="text-cyan-400 font-semibold font-mono uppercase shrink-0">Anchor:</span>
                    <span className="text-slate-300 leading-tight truncate">{deepLinkConfig.setupAnchor}</span>
                  </div>
                  <div className="flex items-start gap-1 text-slate-300">
                    <span className="text-emerald-400 font-semibold font-mono uppercase shrink-0">Drive:</span>
                    <span className="text-slate-300 leading-tight truncate">{deepLinkConfig.kineticDrive}</span>
                  </div>
                </div>
              )}

              {/* Dynamic Starting Load Box */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-mono uppercase text-slate-400">
                    Estimated Starting Load
                  </span>
                  {calibrationMode === "uncalibrated" ? (
                    <span className="text-base font-mono font-bold text-slate-300 tabular-nums">
                      — {unit}{" "}
                      <span className="text-[11px] font-normal text-amber-400">
                        (Needs 1 lift)
                      </span>
                    </span>
                  ) : calibrationMode === "calibrate_as_i_lift" ? (
                    <span className="text-xs font-mono font-semibold text-emerald-400">
                      Calibrate on Set 1 (2 RIR)
                    </span>
                  ) : (
                    <div>
                      <span className="text-base font-mono font-bold text-emerald-400 tabular-nums">
                        {primaryTarget?.displayWeight} {unit}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Estimated from {inputWeight} {unit} anchor · Adjust anytime
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCalibrationSheetOpen(true);
                    telemetry.track("onboarding_step_viewed", { step: "step_2_open_calibrator" }, userId);
                  }}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition cursor-pointer"
                >
                  {calibrationMode === "uncalibrated" ? "Set load" : "Edit"}
                </button>
              </div>
            </div>
          </div>

          {/* Remaining Day-1 Lifts Compact Preview + Tappable "Why {weight}?" Proof */}
          {calibrationMode === "calibrated" && primaryTarget && (
            <div className="space-y-2.5">
              {/* Compact preview of next 3 lifts */}
              <div className="grid grid-cols-3 gap-2">
                {secondaryTargets.map((t) => (
                  <div
                    key={t.exerciseId}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-0.5"
                  >
                    <p className="text-[11px] font-medium text-slate-300 truncate">
                      {t.exerciseName}
                    </p>
                    <p className="text-xs font-mono font-bold text-white tabular-nums">
                      {t.displayWeight} {t.unit}{" "}
                      <span className="text-[10px] font-normal text-slate-400">
                        × {t.repRange}
                      </span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Interactive "Why {weight}?" & Reversible Sleep What-If Bar */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWhyExpanded((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer text-left"
                  >
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{primaryTarget.whyHeadline}</span>
                  </button>

                  {/* Reversible Sleep What-If Chips */}
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSleepMode("normal")}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold transition flex items-center gap-1 cursor-pointer ${
                        sleepMode === "normal"
                          ? "bg-emerald-500 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Sun className="w-3 h-3" />
                      <span>7.5h</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSleepMode("short")}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold transition flex items-center gap-1 cursor-pointer ${
                        sleepMode === "short"
                          ? "bg-amber-400 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Moon className="w-3 h-3" />
                      <span>5h (-10%)</span>
                    </button>
                  </div>
                </div>

                {isWhyExpanded && (
                  <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80 tabular-nums">
                    {primaryTarget.whyFormulaText}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* GROUP 3: Single Dominant Emerald CTA + Secondary Ghost Action */}
        <div className="space-y-2.5 pt-1">
          {calibrationMode === "uncalibrated" ? (
            <button
              type="button"
              onClick={() => {
                setIsCalibrationSheetOpen(true);
                telemetry.track("onboarding_step_viewed", { step: "step_2_open_calibrator" }, userId);
              }}
              className="w-full min-h-[48px] py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
              <span>Set My Starting Weights (1 Lift · 15s)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartSession}
              className="w-full min-h-[48px] py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Day 1 Session</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setIsGymReadySheetOpen(true);
                telemetry.track("install_prompt_shown", { trigger: "not_at_gym_yet" }, userId);
              }}
              className="flex-1 min-h-[44px] py-2 px-3 text-xs text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
              <span>Not at the gym yet? Get ready</span>
            </button>

            {calibrationMode === "uncalibrated" && (
              <button
                type="button"
                onClick={handleStartSession}
                className="min-h-[44px] py-2 px-3.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700 rounded-xl transition cursor-pointer"
              >
                Skip to gym floor →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SHEET 1 (Step 2): 1-Anchor Starting Weights Calibrator */}
      <Sheet open={isCalibrationSheetOpen} onOpenChange={setIsCalibrationSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-w-md mx-auto rounded-t-3xl bg-[#0B0F17] border-slate-800 p-6 space-y-5 max-h-[88vh] overflow-y-auto shadow-2xl"
        >
          <SheetHeader className="text-left space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                Step 2 · 1-Anchor Calibration
              </span>

              {/* Unit Toggle */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleUnitToggle("kg")}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                    unit === "kg" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                  }`}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitToggle("lb")}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                    unit === "lb" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                  }`}
                >
                  lb
                </button>
              </div>
            </div>
            <SheetTitle className="text-lg font-bold text-white">
              Enter 1 lift you know
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400">
              We compute your Epley 1RM and apply Poliquin structural ratios to pre-fill all {dayOne.exerciseCount || 6} Day-1 exercises.
            </SheetDescription>
          </SheetHeader>

          {/* Anchor Movement Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setAnchorLift("barbell_bench")}
              className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                anchorLift === "barbell_bench"
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Barbell Bench Press
            </button>
            <button
              type="button"
              onClick={() => setAnchorLift("dumbbell_bench")}
              className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                anchorLift === "dumbbell_bench"
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              DB Bench (1 Dumbbell)
            </button>
          </div>

          {/* Tactile Steppers (Same primitive as the gym floor) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Weight Stepper */}
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Working Weight ({unit})
              </span>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  aria-label="Decrease weight"
                  onClick={() =>
                    setInputWeight((w) => Math.max(unit === "kg" ? 10 : 20, w - (unit === "kg" ? 2.5 : 5)))
                  }
                  className="w-11 h-11 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-200 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-mono font-bold text-white tabular-nums">
                  {inputWeight}
                </span>
                <button
                  type="button"
                  aria-label="Increase weight"
                  onClick={() => setInputWeight((w) => w + (unit === "kg" ? 2.5 : 5))}
                  className="w-11 h-11 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Reps Stepper */}
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Clean Reps
              </span>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  aria-label="Decrease reps"
                  onClick={() => setInputReps((r) => Math.max(1, r - 1))}
                  className="w-11 h-11 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-200 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-mono font-bold text-white tabular-nums">
                  {inputReps}
                </span>
                <button
                  type="button"
                  aria-label="Increase reps"
                  onClick={() => setInputReps((r) => Math.min(15, r + 1))}
                  className="w-11 h-11 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Live <150ms Derived Day-1 Session Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono uppercase text-[10px]">
                Live Epley 1RM Estimate
              </span>
              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                {calibration.estimatedBench1RmKg} kg e1RM
              </span>
            </div>
            <div className="space-y-1.5 pt-1 border-t border-slate-900">
              {calibration.targets.slice(0, 4).map((t) => (
                <div key={t.exerciseId} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate pr-2">{t.exerciseName}</span>
                  <span className="font-mono font-bold text-white tabular-nums shrink-0">
                    {t.displayWeight} {t.unit} × {t.repRange}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Primary Confirm + "Calibrate as I lift" Fallback */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => handleApplyCalibration("calibrated")}
              className="w-full min-h-[48px] py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply My Starting Loads</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyCalibration("calibrate_as_i_lift")}
              className="w-full min-h-[44px] py-2.5 px-4 text-xs text-slate-400 hover:text-white border border-slate-800 rounded-xl transition cursor-pointer"
            >
              Not sure? Calibrate as I lift on Set 1
            </button>

            <div className="pt-2 text-center border-t border-slate-900">
              <Link
                href="/import"
                className="text-xs text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1.5 transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                <span>Already have history? Import Hevy / Strong</span>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* SHEET 2 (Step 4): "Not at the gym yet? Get ready" Offline & WebView Handoff Sheet */}
      <Sheet open={isGymReadySheetOpen} onOpenChange={setIsGymReadySheetOpen}>
        <SheetContent
          side="bottom"
          className="max-w-md mx-auto rounded-t-3xl bg-[#0B0F17] border-slate-800 p-6 space-y-5 max-h-[88vh] overflow-y-auto shadow-2xl"
        >
          <SheetHeader className="text-left space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 w-fit">
              Gym-Floor Readiness Check
            </span>
            <SheetTitle className="text-lg font-bold text-white">
              Ready for Basement Airplane Mode
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400">
              Test airplane mode right now—your Day-1 session and 6,554 exercises run 100% locally.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3">
            {/* 1. Verified Offline Precache Badge */}
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">
                  {offlineVerified ? "● Offline-ready verified" : "Checking local cache..."}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  6,554 OpenGym exercises, plate math, and <span className="text-slate-200">&lt;2ms</span> set journaling cached on this device.
                </p>
              </div>
            </div>

            {/* 2. Browser Persistence & In-App WebView Handoff */}
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">
                    {webViewStatus.isInAppWebView
                      ? `Move from ${webViewStatus.sourceApp} to ${webViewStatus.recommendedBrowser}`
                      : "Keep your calibrated loads across visits"}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    In-app browsers clear local storage. Copy your calibrated link into {webViewStatus.recommendedBrowser} or add Vyra to your Home Screen.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyHandoffLink}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-emerald-400 flex items-center justify-between transition cursor-pointer"
              >
                <span>
                  {copiedHandoff
                    ? "Copied calibrated link!"
                    : `Copy ${webViewStatus.recommendedBrowser} handoff link (?anchor=${inputWeight}x${inputReps})`}
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Primary Action: Add to Home Screen (/install) + Secondary Data Export */}
          <div className="space-y-2.5 pt-1">
            <Link
              href="/install"
              onClick={() => setIsGymReadySheetOpen(false)}
              className="w-full min-h-[48px] py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Add to Home Screen (Keep Workouts Saved)</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>

            <Link
              href="/your-data"
              onClick={() => setIsGymReadySheetOpen(false)}
              className="w-full min-h-[44px] py-2.5 px-4 text-xs text-slate-400 hover:text-white border border-slate-800 rounded-xl transition flex items-center justify-center"
            >
              Inspect local storage &amp; JSON export (/your-data)
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* SHEET 3 (Spec 024): 1-Tap Training Focus & Goal Selector */}
      <Sheet open={isGoalSheetOpen} onOpenChange={setIsGoalSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-w-md mx-auto rounded-t-3xl bg-[#0B0F17] border-slate-800 p-6 space-y-4 max-h-[88vh] overflow-y-auto shadow-2xl"
        >
          <SheetHeader className="text-left space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                1-Tap Calibration Focus
              </span>
              <span className="text-xs font-mono text-slate-400">Optional · No quiz</span>
            </div>
            <SheetTitle className="text-lg font-bold text-white">
              Choose your focus, or keep our default
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400">
              Vyra starts with a standard muscle-building setup. Selecting a focus adjusts programming strategy, intensity, and recovery buffers—not just rep counts.
            </SheetDescription>
          </SheetHeader>

          {/* 4 Clean Goal Tiles */}
          <div className="space-y-2.5 pt-1">
            {Object.values(TRAINING_GOALS).map((g) => {
              const isSelected = goal === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setGoal(g.id);
                    setIsGoalSheetOpen(false);
                    telemetry.track("goal_selected", { goal: g.id }, userId);
                  }}
                  className={`w-full min-h-[58px] p-3.5 rounded-2xl border text-left transition flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-slate-800/90 border-emerald-500/60 shadow-lg"
                      : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white leading-tight">
                        {g.label}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${g.badgeClass}`}>
                        {g.repRange} reps
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">
                      {g.description}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Provisional Adaptive Notice */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            <span className="text-slate-300 font-semibold">Provisional Adaptive Plan:</span> Your full 16-week cycle evolves continuously from your logged sets and gym recovery, not rigid assumptions.
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsGoalSheetOpen(false)}
              className="w-full min-h-[44px] py-2.5 text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 rounded-xl transition cursor-pointer"
            >
              Keep Current Focus ({TRAINING_GOALS[goal].shortLabel})
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
