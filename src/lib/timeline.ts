import { appStore } from "./store";
import { resolveProgramDay } from "./utils";
import { WorkoutSession } from "./types";

export type PillarId = "train" | "eat" | "sleep" | "style" | "network";

export interface TimelineMoment {
  id: string;
  pillar: PillarId;
  time: string; // "07:00", "12:15"
  title: string;
  glance?: string;
  status: "past" | "now" | "upcoming";
  badge?: string;
  actionLabel?: string;
  actionHref?: string;
  learnType?: "supplements" | "workout" | "hydration" | "readiness";
}

export interface PresentationSignal {
  pillar: PillarId;
  type: string;
  label: string;
  value: string;
}

export interface PresentationInsight {
  id: string;
  sources: PillarId[];
  sentence: string;
  whyPrompt: string;
}

/**
 * Clean data sanitization helper (no 20.7000000000000003g, no Phase Phase)
 */
export function formatDoseGram(val: number): string {
  return `${Number(val.toFixed(1))} g`;
}

export interface DayTimelineResult {
  moments: TimelineMoment[];
  heroMoment?: TimelineMoment;
  insight?: PresentationInsight; // undefined if no real data exists
  readinessStatus: string;
  hasReadinessInput: boolean;
  isRestDay: boolean;
}

/**
 * Derives the unified Day Timeline from current user, program, logs, and device clock
 */
export function deriveDayTimeline(userId: string, targetDateStr?: string, mockHour?: number): DayTimelineResult {
  const dateStr = targetDateStr || new Date().toISOString().split("T")[0];
  const program = appStore.getActiveProgramForTrainee(userId);
  const currentHour = mockHour !== undefined ? mockHour : new Date().getHours();

  const resolved = program
    ? resolveProgramDay(program.startDate)
    : { started: false, weekIndex: 1, dayOfWeek: 0, elapsedDays: 0 };

  // 1. Check supplement logs for today
  const suppLogs = appStore.getSupplementLogsForDate(userId, dateStr);
  const morningTaken = suppLogs.filter(
    (l) => (l.doseId.includes("m1") || l.doseId.includes("m2") || l.doseId.includes("m3")) && l.status === "taken"
  ).length;
  const isMorningComplete = morningTaken >= 3;

  const eveningTaken = suppLogs.filter(
    (l) => (l.doseId.includes("m7") || l.doseId.includes("m8")) && l.status === "taken"
  ).length;
  const isEveningComplete = eveningTaken >= 2;

  const todayHydration = appStore.getTodayHydrationTotal(userId, dateStr);
  const hydrationChecked = todayHydration >= 500;

  // 2. Today's Training Session
  const weekIdx = resolved.weekIndex - 1;
  const currentWeek = program?.weeks ? program.weeks[Math.min(weekIdx, program.weeks.length - 1)] : undefined;
  const todaySession = currentWeek?.days ? currentWeek.days.find((d) => d.dayOfWeek === resolved.dayOfWeek) : undefined;

  const exCount = todaySession?.blocks ? todaySession.blocks.reduce((acc, b) => acc + b.exercises.length, 0) : 0;
  const hasSession = !!todaySession && !todaySession.isRestDay && exCount > 0;
  const isRestDay = !hasSession;
  
  const userSessions = appStore.getSessions(userId);
  const todaySessionLog = userSessions.find((s: WorkoutSession) => s.date === dateStr);
  const sessionCompleted = !!todaySessionLog;
  const sessionVolume = todaySessionLog?.setLogs
    ? todaySessionLog.setLogs.reduce((acc, log) => acc + log.weightKg * log.reps, 0)
    : 0;

  // 3. Biometric & Readiness Check-in Check
  const latestBiometrics = appStore.getLatestWearableBiometrics(userId);
  const hasReadinessInput = !!(latestBiometrics && latestBiometrics.date === dateStr);
  
  let readinessStatus = "Awaiting check-in";
  if (latestBiometrics) {
    if (latestBiometrics.readinessScore && latestBiometrics.readinessScore < 60) {
      readinessStatus = "Light day suggested";
    } else if (latestBiometrics.readinessScore && latestBiometrics.readinessScore < 80) {
      readinessStatus = "Moderate recovery";
    } else {
      readinessStatus = "Full recovery";
    }
  }

  // 4. Clock-aware moment status calculation
  // Morning hydration: 07:00 (hour 7)
  const hydStatus: "past" | "now" | "upcoming" = hydrationChecked || currentHour > 9 ? "past" : currentHour >= 6 ? "now" : "upcoming";
  
  // Morning stack: 08:00 (hour 8)
  const mornStatus: "past" | "now" | "upcoming" = isMorningComplete || currentHour > 11 ? "past" : currentHour >= 8 ? "now" : "upcoming";
  
  // Midday Workout: 12:15 (hour 12-14)
  const workoutStatus: "past" | "now" | "upcoming" = sessionCompleted || currentHour >= 16 ? "past" : currentHour >= 11 ? "now" : "upcoming";
  
  // Recovery fuel: 13:30 (hour 13-15)
  const fuelStatus: "past" | "now" | "upcoming" = sessionCompleted ? (currentHour >= 15 ? "past" : "now") : currentHour >= 16 ? "past" : "upcoming";
  
  // Evening stack: 21:30 (hour 21+)
  const eveStatus: "past" | "now" | "upcoming" = isEveningComplete ? "past" : currentHour >= 20 ? "now" : "upcoming";

  const moments: TimelineMoment[] = [
    {
      id: "moment_hydration_morning",
      pillar: "eat",
      time: "07:00",
      title: "Mineral Hydration",
      glance: `${todayHydration > 0 ? todayHydration : 500} ml`,
      status: hydStatus,
      learnType: "hydration",
    },
    {
      id: "moment_morning_stack",
      pillar: "eat",
      time: "08:00",
      title: "Morning Stack",
      glance: isMorningComplete
        ? "Completed (3/3 taken)"
        : morningTaken > 0
        ? `${morningTaken}/3 taken · D3, Omega-3, B-Complex`
        : "D3+K2, Omega-3, B-Complex",
      status: mornStatus,
      badge: isMorningComplete ? "Done" : `${morningTaken}/3`,
      learnType: "supplements",
    },
    {
      id: "moment_workout",
      pillar: "train",
      time: "12:15",
      title: hasSession ? todaySession.label : "Active Recovery & Mobility",
      glance: sessionCompleted
        ? `${sessionVolume > 0 ? sessionVolume.toLocaleString() + " kg volume" : "Completed"} · Recorded`
        : hasSession
        ? `${exCount} exercises · ~34 min`
        : "Postural symmetry & light walk",
      status: workoutStatus,
      badge: sessionCompleted ? "Done" : undefined,
      actionLabel: sessionCompleted ? "View Progress" : isRestDay ? "Review Mobility" : "Start Workout",
      actionHref: sessionCompleted ? "/progress" : `/session?day=${todaySession?.id || "day_1"}&mode=preview`,
      learnType: "workout",
    },
    {
      id: "moment_recovery_fuel",
      pillar: "eat",
      time: "13:30",
      title: "Recovery Fuel & Creatine",
      glance: "40 g Protein · 5 g Creatine",
      status: fuelStatus,
      actionLabel: "Log Protocols",
      learnType: "supplements",
    },
    {
      id: "moment_evening_stack",
      pillar: "sleep",
      time: "21:30",
      title: "Evening Wind-Down",
      glance: isEveningComplete
        ? "Completed (2/2 taken)"
        : eveningTaken > 0
        ? `${eveningTaken}/2 taken · Magnesium & Theanine`
        : "Magnesium Glycinate (400 mg)",
      status: eveStatus,
      badge: isEveningComplete ? "Done" : "Sleep",
      learnType: "supplements",
    },
  ];

  // Select hero moment: prioritize current active action
  const heroMoment =
    moments.find((m) => m.status === "now") ||
    moments.find((m) => m.status === "upcoming") ||
    moments[moments.length - 1];

  // Live dynamic cross-pillar insight connecting REAL signals only
  let insight: PresentationInsight | undefined = undefined;
  if (sessionCompleted && sessionVolume > 0) {
    insight = {
      id: "insight_train_recovery_live",
      sources: ["train", "eat", "sleep"],
      sentence: `Completed ${sessionVolume.toLocaleString()} kg load today. 40 g protein and 400 mg evening magnesium prioritized for muscle and overnight recovery.`,
      whyPrompt: `How does my ${sessionVolume.toLocaleString()} kg training load impact my post-workout nutrition and evening sleep recovery?`,
    };
  } else if (latestBiometrics) {
    const isManual = latestBiometrics.source === "manual";
    const isReduced = latestBiometrics.reducedRecovery ?? latestBiometrics.cnsFatigueDetected;
    const modPart = isReduced ? "heavy lifts are lighter today" : "full progression active";

    if (isManual) {
      insight = {
        id: "insight_wearable_sync",
        sources: ["sleep", "train"],
        sentence: `You said ${latestBiometrics.sleepHours} h sleep. ${modPart}.`,
        whyPrompt: `Why does my sleep answer change today's workout?`,
      };
    } else {
      const hrvPart = latestBiometrics.hrvMs ? ` · ${latestBiometrics.hrvMs} ms HRV` : "";
      insight = {
        id: "insight_wearable_sync",
        sources: ["sleep", "train"],
        sentence: `Wearable synced ${latestBiometrics.sleepHours} h sleep${hrvPart}. ${modPart}.`,
        whyPrompt: `Why does my wearable sync change today's workout?`,
      };
    }
  }

  return {
    moments,
    heroMoment,
    insight,
    readinessStatus,
    hasReadinessInput,
    isRestDay,
  };
}
