/**
 * Trend Analytics & Physiological Signal Processor
 * 
 * Computes robust multi-week trends rather than reacting to single-session noise:
 * 1. Smoothed Bodyweight Trend (EWMA 7-14d) & rate of gain/loss (%/week).
 * 2. Estimated 1RM (e1RM) trajectories per movement pattern with confidence intervals.
 * 3. Weekly direct and indirect volume accounting per muscle group.
 * 4. Adherence reality tracking over 7, 14, and 28 days.
 * 5. Symptom trajectories with recency decay and resolution states.
 */

import { BodyMetricEntry, WorkoutSession, SetLog } from "../types";
import { inferPrimaryMuscleFromExerciseName } from "../ai/sensory-memory";
import { inferMuscleSubdivision } from "../training-math/substitution-copilot";

export interface SmoothedBodyweightTrend {
  dataPointsCount: number;
  latestRawKg?: number;
  smoothedKg?: number;
  weeklyDeltaKg: number;
  weeklyRatePct: number; // e.g. +0.35% bodyweight / week
  trajectory: "surplus" | "maintenance" | "deficit" | "unmeasured";
  confidence: number;
  trendSummary: string;
}

export interface ExerciseE1RMTrend {
  exerciseName: string;
  sessionsLogged: number;
  baselineE1RMKg: number;
  latestE1RMKg: number;
  netDeltaE1RMKg: number;
  deltaPct: number;
  slopeKgPerWeek: number;
  status: "progressing" | "stagnant" | "regressing" | "insufficient_data";
  confidence: number;
}

export interface WeeklyMuscleVolumeReport {
  weekKey: string; // e.g. "Week 1", "Week 2"
  directSetsByMuscle: Record<string, number>;
  totalEffectiveSetsByMuscle: Record<string, number>; // includes fractional indirect volume
}

export interface AdherenceTrendReport {
  last7DaysPlanned: number;
  last7DaysCompleted: number;
  last7DaysPct: number;
  last28DaysPlanned: number;
  last28DaysCompleted: number;
  last28DaysPct: number;
  consistencyGrade: "elite" | "solid" | "inconsistent" | "adherence_risk";
  isPrimaryBottleneck: boolean;
  bottleneckExplanation?: string;
}

export interface SymptomTrajectory {
  joint: string;
  status: "active" | "subsiding" | "resolved" | "dormant";
  firstLoggedDate: string;
  latestLoggedDate: string;
  occurrencesCount: number;
  aggravatingExercises: string[];
  daysSinceLastSymptom: number;
  currentFrictionLevel: "none" | "mild_monitoring" | "significant_intervention_required";
}

/**
 * Calculates Exponentially Weighted Moving Average (EWMA) of bodyweight to strip
 * single-day glycogen, sodium, and hydration noise.
 */
export function calculateSmoothedBodyweightTrend(
  entries: BodyMetricEntry[],
  alpha: number = 0.25 // Standard smoothing factor (~7-day half-life)
): SmoothedBodyweightTrend {
  if (!entries || entries.length === 0) {
    return {
      dataPointsCount: 0,
      weeklyDeltaKg: 0,
      weeklyRatePct: 0,
      trajectory: "unmeasured",
      confidence: 0,
      trendSummary: "No scale weight logs recorded; bodyweight trend is unmeasured.",
    };
  }

  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let smoothed = sorted[0].weightKg;
  const smoothedHistory: Array<{ date: string; weight: number }> = [];

  for (const e of sorted) {
    smoothed = alpha * e.weightKg + (1 - alpha) * smoothed;
    smoothedHistory.push({ date: e.date, weight: smoothed });
  }

  const latestRaw = sorted[sorted.length - 1].weightKg;
  const currentSmoothed = Number(smoothed.toFixed(2));

  // Compute 14-day or available window delta
  const firstPoint = smoothedHistory[0];
  const lastPoint = smoothedHistory[smoothedHistory.length - 1];
  const msSpan = Math.max(1, new Date(lastPoint.date).getTime() - new Date(firstPoint.date).getTime());
  const daysSpan = Math.max(1, msSpan / (1000 * 60 * 60 * 24));
  const weeksSpan = daysSpan / 7;

  const totalDeltaKg = lastPoint.weight - firstPoint.weight;
  const weeklyDeltaKg = weeksSpan >= 1 ? Number((totalDeltaKg / weeksSpan).toFixed(2)) : 0;
  const weeklyRatePct = currentSmoothed > 0 ? Number(((weeklyDeltaKg / currentSmoothed) * 100).toFixed(2)) : 0;

  const confidence = Math.min(1, Number((sorted.length / 14).toFixed(2)));

  let trajectory: SmoothedBodyweightTrend["trajectory"] = "maintenance";
  if (weeklyRatePct >= 0.2) trajectory = "surplus";
  else if (weeklyRatePct <= -0.2) trajectory = "deficit";

  let trendSummary = `Smoothed bodyweight is ${currentSmoothed}kg (${weeklyDeltaKg >= 0 ? "+" : ""}${weeklyDeltaKg}kg/wk, ${weeklyRatePct >= 0 ? "+" : ""}${weeklyRatePct}%/wk across ${sorted.length} logs).`;
  if (trajectory === "maintenance") {
    trendSummary += " Weight is holding flat in energy maintenance.";
  } else if (trajectory === "surplus") {
    trendSummary += " Accreting mass in a steady caloric surplus.";
  } else {
    trendSummary += " Bodyweight is declining in an energy deficit.";
  }

  return {
    dataPointsCount: sorted.length,
    latestRawKg: latestRaw,
    smoothedKg: currentSmoothed,
    weeklyDeltaKg,
    weeklyRatePct,
    trajectory,
    confidence,
    trendSummary,
  };
}

/**
 * Computes RIR-adjusted Estimated 1RM (e1RM) using the proven Epley formula:
 * e1RM = load * (1 + (reps + rir) / 30)
 */
export function estimateSet1RM(weightKg: number, reps: number, rir: number = 1): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1 && rir === 0) return weightKg;
  const effectiveReps = reps + Math.max(0, Math.min(5, rir));
  return Number((weightKg * (1 + effectiveReps / 30)).toFixed(1));
}

/**
 * Calculates e1RM trajectory per exercise across historical logged sessions.
 */
export function calculateE1RMTrends(
  sessions: WorkoutSession[],
  exerciseName: string
): ExerciseE1RMTrend {
  const normName = exerciseName.trim().toLowerCase();
  const relevantSessions = sessions
    .filter((s) => s.setLogs.some((l) => l.exerciseName.trim().toLowerCase() === normName && l.reps > 0))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (relevantSessions.length === 0) {
    return {
      exerciseName,
      sessionsLogged: 0,
      baselineE1RMKg: 0,
      latestE1RMKg: 0,
      netDeltaE1RMKg: 0,
      deltaPct: 0,
      slopeKgPerWeek: 0,
      status: "insufficient_data",
      confidence: 0,
    };
  }

  const sessionE1RMs: Array<{ date: string; maxE1RM: number }> = [];

  for (const s of relevantSessions) {
    const logs = s.setLogs.filter(
      (l) => l.exerciseName.trim().toLowerCase() === normName && l.weightKg > 0 && l.reps > 0
    );
    if (logs.length === 0) continue;

    let bestSetE1RM = 0;
    for (const l of logs) {
      const e = estimateSet1RM(l.weightKg, l.reps, l.rirAchieved ?? (l as any).rir ?? 1);
      if (e > bestSetE1RM) bestSetE1RM = e;
    }
    sessionE1RMs.push({ date: s.date, maxE1RM: bestSetE1RM });
  }

  if (sessionE1RMs.length === 0) {
    return {
      exerciseName,
      sessionsLogged: 0,
      baselineE1RMKg: 0,
      latestE1RMKg: 0,
      netDeltaE1RMKg: 0,
      deltaPct: 0,
      slopeKgPerWeek: 0,
      status: "insufficient_data",
      confidence: 0,
    };
  }

  const baseline = sessionE1RMs[0].maxE1RM;
  const latest = sessionE1RMs[sessionE1RMs.length - 1].maxE1RM;
  const netDelta = Number((latest - baseline).toFixed(1));
  const deltaPct = baseline > 0 ? Number(((netDelta / baseline) * 100).toFixed(1)) : 0;

  const msSpan = Math.max(
    1,
    new Date(sessionE1RMs[sessionE1RMs.length - 1].date).getTime() - new Date(sessionE1RMs[0].date).getTime()
  );
  const weeks = Math.max(1, msSpan / (1000 * 60 * 60 * 24 * 7));
  const slope = Number((netDelta / weeks).toFixed(2));

  let status: ExerciseE1RMTrend["status"] = "stagnant";
  if (sessionE1RMs.length >= 2) {
    if (netDelta >= 2.0) status = "progressing";
    else if (netDelta <= -2.0) status = "regressing";
  } else {
    status = "insufficient_data";
  }

  const confidence = Math.min(1, Number((sessionE1RMs.length / 6).toFixed(2)));

  return {
    exerciseName,
    sessionsLogged: sessionE1RMs.length,
    baselineE1RMKg: baseline,
    latestE1RMKg: latest,
    netDeltaE1RMKg: netDelta,
    deltaPct,
    slopeKgPerWeek: slope,
    status,
    confidence,
  };
}

function resolveReferenceDate(sessions: WorkoutSession[], referenceDate?: string | Date): Date {
  if (referenceDate) {
    return new Date(referenceDate);
  }
  if (sessions.length > 0) {
    let latestMs = -Infinity;
    for (const s of sessions) {
      const ms = new Date(s.date).getTime();
      if (Number.isFinite(ms) && ms > latestMs) {
        latestMs = ms;
      }
    }
    if (latestMs > -Infinity) {
      return new Date(latestMs);
    }
  }
  return new Date();
}

/**
 * Calculates direct and indirect weekly volume distribution across all logged sessions.
 */
export function calculateWeeklyMuscleVolume(
  sessions: WorkoutSession[],
  weeksBack: number = 4,
  referenceDate?: string | Date
): WeeklyMuscleVolumeReport[] {
  const reports: WeeklyMuscleVolumeReport[] = [];
  const cutoff = resolveReferenceDate(sessions, referenceDate);
  cutoff.setDate(cutoff.getDate() - weeksBack * 7);

  const filtered = sessions.filter((s) => new Date(s.date) >= cutoff);

  // Group by 7-day windows
  for (let w = 0; w < weeksBack; w++) {
    const wStart = new Date(cutoff);
    wStart.setDate(wStart.getDate() + w * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 7);

    const weekSessions = filtered.filter((s) => {
      const d = new Date(s.date);
      return d >= wStart && d < wEnd;
    });

    const directSets: Record<string, number> = {};
    const effectiveSets: Record<string, number> = {};

    for (const s of weekSessions) {
      for (const log of s.setLogs) {
        if (!log || log.reps <= 0) continue;
        const target = inferPrimaryMuscleFromExerciseName(log.exerciseName);
        const sub = inferMuscleSubdivision(log.exerciseName, target);

        directSets[sub] = (directSets[sub] || 0) + 1;
        effectiveSets[sub] = (effectiveSets[sub] || 0) + 1;

        // Indirect synergy volume accounting
        const nameLower = log.exerciseName.toLowerCase();
        if (nameLower.includes("bench") || nameLower.includes("chest press")) {
          effectiveSets["tricep_lateral"] = (effectiveSets["tricep_lateral"] || 0) + 0.5;
          effectiveSets["deltoid_anterior"] = (effectiveSets["deltoid_anterior"] || 0) + 0.5;
        } else if (nameLower.includes("pull") || nameLower.includes("row") || nameLower.includes("chin")) {
          effectiveSets["bicep_short_head"] = (effectiveSets["bicep_short_head"] || 0) + 0.5;
          effectiveSets["deltoid_posterior"] = (effectiveSets["deltoid_posterior"] || 0) + 0.5;
        } else if (nameLower.includes("squat") || nameLower.includes("leg press")) {
          effectiveSets["glute_max"] = (effectiveSets["glute_max"] || 0) + 0.5;
        }
      }
    }

    reports.push({
      weekKey: `Week ${w + 1}`,
      directSetsByMuscle: directSets,
      totalEffectiveSetsByMuscle: effectiveSets,
    });
  }

  return reports;
}

/**
 * Calculates adherence reality over 7 and 28 days to determine whether missed workouts
 * are the root-cause bottleneck rather than program or exercise design.
 */
export function calculateAdherenceMetrics(
  sessions: WorkoutSession[],
  plannedSessionsPerWeek: number = 3,
  modelAdherenceOverride?: { completionRatePct: number },
  referenceDate?: string | Date
): AdherenceTrendReport {
  if (
    modelAdherenceOverride &&
    modelAdherenceOverride.completionRatePct >= 75 &&
    sessions.length < plannedSessionsPerWeek * 3
  ) {
    const rate = modelAdherenceOverride.completionRatePct;
    return {
      last7DaysPlanned: plannedSessionsPerWeek,
      last7DaysCompleted: plannedSessionsPerWeek,
      last7DaysPct: 100,
      last28DaysPlanned: plannedSessionsPerWeek * 4,
      last28DaysCompleted: Math.round((plannedSessionsPerWeek * 4 * rate) / 100),
      last28DaysPct: rate,
      consistencyGrade: rate >= 90 ? "elite" : "solid",
      isPrimaryBottleneck: false,
    };
  }

  const refDate = resolveReferenceDate(sessions, referenceDate);
  const d7 = new Date(refDate);
  d7.setDate(d7.getDate() - 7);
  const d28 = new Date(refDate);
  d28.setDate(d28.getDate() - 28);

  const completed7 = sessions.filter((s) => new Date(s.date) >= d7).length;
  const completed28 = sessions.filter((s) => new Date(s.date) >= d28).length;

  const planned7 = plannedSessionsPerWeek;
  const planned28 = plannedSessionsPerWeek * 4;

  const pct7 = planned7 > 0 ? Math.round((completed7 / planned7) * 100) : 100;
  const pct28 = planned28 > 0 ? Math.round((completed28 / planned28) * 100) : 100;

  let consistencyGrade: AdherenceTrendReport["consistencyGrade"] = "solid";
  let isPrimaryBottleneck = false;
  let bottleneckExplanation: string | undefined;

  if (pct28 >= 90) {
    consistencyGrade = "elite";
  } else if (pct28 >= 75) {
    consistencyGrade = "solid";
  } else if (pct28 >= 50) {
    consistencyGrade = "inconsistent";
    isPrimaryBottleneck = true;
    bottleneckExplanation = `Adherence is ${pct28}% (${completed28}/${planned28} sessions completed). Missing sessions is the primary bottleneck capping adaptation.`;
  } else {
    consistencyGrade = "adherence_risk";
    isPrimaryBottleneck = true;
    bottleneckExplanation = `Adherence has collapsed to ${pct28}% (${completed28}/${planned28} sessions completed). Re-structuring into a lower-frequency sustainable schedule is required.`;
  }

  return {
    last7DaysPlanned: planned7,
    last7DaysCompleted: completed7,
    last7DaysPct: pct7,
    last28DaysPlanned: planned28,
    last28DaysCompleted: completed28,
    last28DaysPct: pct28,
    consistencyGrade,
    isPrimaryBottleneck,
    bottleneckExplanation,
  };
}

/**
 * Computes symptom trajectories with temporal decay so a single off-day note
 * does not permanently ban an exercise family.
 */
export function calculateSymptomTrajectories(
  sessions: WorkoutSession[],
  referenceDate?: string | Date
): SymptomTrajectory[] {
  const jointEvents = new Map<string, { dates: string[]; exercises: Set<string> }>();

  for (const s of sessions) {
    for (const fb of s.exerciseFeedbacks || []) {
      const hasJointTag = fb.tag === "joint_strain" || fb.tags?.includes("joint_strain");
      const note = (fb.note || "").toLowerCase();
      const isNegatedNote =
        !hasJointTag &&
        (/\b(no|not|zero|without|free of|resolved|aucune|sans|pas de|ma\s+darni|mab9ach|machi)\b/i.test(note) ||
          note.includes("مبقاش") ||
          note.includes("ماشي") ||
          note.includes("ما كيضرنيش"));

      if (
        hasJointTag ||
        (!isNegatedNote &&
          (note.includes("pain") ||
            note.includes("pinch") ||
            note.includes("tendon") ||
            note.includes("douleur") ||
            note.includes("clicking")))
      ) {
        let joint = "general";
        if (note.includes("shoulder") || note.includes("épaule")) joint = "shoulder";
        else if (note.includes("elbow") || note.includes("coude")) joint = "elbow";
        else if (note.includes("knee") || note.includes("genou")) joint = "knee";
        else if (note.includes("back") || note.includes("lombaire")) joint = "lumbar";
        else if (note.includes("wrist") || note.includes("poignet")) joint = "wrist";

        if (!jointEvents.has(joint)) {
          jointEvents.set(joint, { dates: [], exercises: new Set() });
        }
        const data = jointEvents.get(joint)!;
        data.dates.push(s.date);
        data.exercises.add(fb.exerciseName);
      }
    }
  }

  const results: SymptomTrajectory[] = [];
  const nowMs = resolveReferenceDate(sessions, referenceDate).getTime();

  for (const [joint, data] of jointEvents.entries()) {
    const sortedDates = [...data.dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const firstDate = sortedDates[0];
    const latestDate = sortedDates[sortedDates.length - 1];
    const daysSince = Math.round((nowMs - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24));

    let status: SymptomTrajectory["status"] = "active";
    let frictionLevel: SymptomTrajectory["currentFrictionLevel"] = "significant_intervention_required";

    if (daysSince > 28) {
      status = "resolved";
      frictionLevel = "none";
    } else if (daysSince > 14) {
      status = "subsiding";
      frictionLevel = "mild_monitoring";
    } else if (data.dates.length === 1) {
      status = "dormant";
      frictionLevel = "mild_monitoring";
    }

    results.push({
      joint,
      status,
      firstLoggedDate: firstDate,
      latestLoggedDate: latestDate,
      occurrencesCount: data.dates.length,
      aggravatingExercises: Array.from(data.exercises),
      daysSinceLastSymptom: daysSince,
      currentFrictionLevel: frictionLevel,
    });
  }

  return results;
}
