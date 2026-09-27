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

/**
 * Derives the unified Day Timeline from current user, program, and logs
 */
export function deriveDayTimeline(userId: string, targetDateStr?: string): {
  moments: TimelineMoment[];
  heroMoment?: TimelineMoment;
  insight: PresentationInsight;
  readinessStatus: string;
} {
  const dateStr = targetDateStr || new Date().toISOString().split("T")[0];
  const program = appStore.getActiveProgramForTrainee(userId);

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
  
  const userSessions = appStore.getSessions(userId);
  const todaySessionLog = userSessions.find((s: WorkoutSession) => s.date === dateStr);
  const sessionCompleted = !!todaySessionLog;
  const sessionVolume = todaySessionLog?.setLogs
    ? todaySessionLog.setLogs.reduce((acc, log) => acc + log.weightKg * log.reps, 0)
    : 0;

  const moments: TimelineMoment[] = [
    {
      id: "moment_hydration_morning",
      pillar: "eat",
      time: "07:00",
      title: "Mineral Hydration",
      glance: `${todayHydration > 0 ? todayHydration : 500} ml`,
      status: hydrationChecked ? "past" : "upcoming",
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
      status: isMorningComplete ? "past" : morningTaken > 0 ? "now" : "upcoming",
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
        ? `${exCount} exercises · ~55 min`
        : "Postural symmetry & light walk",
      status: sessionCompleted ? "past" : "now",
      badge: sessionCompleted ? "Done" : undefined,
      actionLabel: sessionCompleted ? "View Progress" : "Start Workout",
      actionHref: sessionCompleted ? "/progress" : `/session?day=${todaySession?.id || "day_1"}&mode=preview`,
      learnType: "workout",
    },
    {
      id: "moment_recovery_fuel",
      pillar: "eat",
      time: "13:30",
      title: "Recovery Fuel & Creatine",
      glance: "40g Protein · 6.9 g Creatine",
      status: sessionCompleted ? "now" : "upcoming",
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
      status: isEveningComplete ? "past" : "upcoming",
      badge: isEveningComplete ? "Done" : "Sleep",
      learnType: "supplements",
    },
  ];

  // Select hero moment: prioritize current active action
  const heroMoment =
    moments.find((m) => m.status === "now") ||
    moments.find((m) => m.status === "upcoming") ||
    moments[moments.length - 1];

  // Check latest biometric snapshot for today
  const latestBiometrics = appStore.getLatestWearableBiometrics(userId);
  let readinessStatus = "Ready";
  if (latestBiometrics) {
    if (latestBiometrics.readinessScore && latestBiometrics.readinessScore < 60) {
      readinessStatus = "Fatigued (CNS)";
    } else if (latestBiometrics.readinessScore && latestBiometrics.readinessScore < 80) {
      readinessStatus = "Suboptimal";
    } else {
      readinessStatus = "Optimal";
    }
  }

  // Live dynamic cross-pillar insight connecting signals
  let insight: PresentationInsight;
  if (sessionCompleted && sessionVolume > 0) {
    insight = {
      id: "insight_train_recovery_live",
      sources: ["train", "eat", "sleep"],
      sentence: `Completed ${sessionVolume.toLocaleString()} kg load today. 40g protein and 400mg evening magnesium prioritized for myofibrillar and CNS recovery.`,
      whyPrompt: `How does my ${sessionVolume.toLocaleString()} kg training load impact my post-workout nutrition and evening sleep recovery?`,
    };
  } else if (!hasSession) {
    insight = {
      id: "insight_rest_recovery",
      sources: ["sleep", "eat"],
      sentence: "Scheduled recovery day. Parasympathetic tone prioritized — focus on 3L hydration and 8+ hours restorative sleep.",
      whyPrompt: "Why is parasympathetic recovery emphasized today?",
    };
  } else if (latestBiometrics) {
    const srcName = latestBiometrics.source === "apple_health" ? "Apple Watch" : "Wearable";
    const hrvPart = latestBiometrics.hrvMs ? ` with ${latestBiometrics.hrvMs}ms HRV` : "";
    const modPart = latestBiometrics.cnsFatigueDetected ? "axial loads auto-calibrated" : "full overload target prescribed";
    insight = {
      id: "insight_wearable_sync",
      sources: ["sleep", "train"],
      sentence: `Slept ${latestBiometrics.sleepHours}h${hrvPart} via ${srcName}. Autonomic recovery is ${readinessStatus.toLowerCase()} — ${modPart}.`,
      whyPrompt: `How does my ${latestBiometrics.sleepHours}h sleep and HRV from ${srcName} determine my workout load?`,
    };
  } else {
    insight = {
      id: "insight_sleep_train_1",
      sources: ["sleep", "train"],
      sentence: "Slept 7h 20m with 82ms HRV. Autonomic recovery is high — full training volume prescribed.",
      whyPrompt: "Why was full volume prescribed for today based on my recovery metrics?",
    };
  }

  return {
    moments,
    heroMoment,
    insight,
    readinessStatus,
  };
}
