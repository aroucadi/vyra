/**
 * @file progression-adapter.ts
 * @description Bridges Vyra's WorkoutSession and SetLog data structures into the
 * OpenGym deterministic biomechanical progression engine.
 */

import {
  nextPrescription,
  PrescriptionResult,
  ProgressionPolicy,
  SessionRecord,
  ExercisePlanConfig,
  POLICY_NAME,
} from './training-math/progression';
import { WorkoutSession, SetLog, ExercisePrescription } from './types';

/**
 * Formats OpenGym parameterized rationale array into human-readable text.
 * E.g. ['Top of the rep range in every set. {0} {1} more, back to {2} reps.', 2.5, 'kg', 8]
 * => "Top of the rep range in every set. 2.5 kg more, back to 8 reps."
 */
export function formatPrescriptionWhy(why?: (string | number)[]): string {
  if (!why || !why.length) return 'Targets maintained according to progression policy.';
  const template = String(why[0]);
  const args = why.slice(1);
  return template.replace(/\{(\d+)\}/g, (_, index) => {
    const idx = Number(index);
    return args[idx] !== undefined ? String(args[idx]) : '';
  });
}

/**
 * Infers appropriate progression policy for an exercise prescription.
 * - Rep range (e.g. 8–10 or 10–12): 'double' progression (work up rep range, then add weight)
 * - Fixed reps (e.g. 5 reps): 'linear' progression
 */
export function inferProgressionPolicy(ex: {
  repRangeLow?: number;
  repRangeHigh?: number;
  loadGuidance?: string;
}): ProgressionPolicy {
  const guidance = (ex.loadGuidance || '').toLowerCase();
  if (guidance.includes('greyskull')) return 'greyskull';
  if (guidance.includes('triple')) return 'triple';
  if (guidance.includes('linear')) return 'linear';
  if (guidance.includes('double')) return 'double';

  if (ex.repRangeLow && ex.repRangeHigh && ex.repRangeHigh > ex.repRangeLow) {
    return 'double';
  }
  return 'linear';
}

/**
 * Maps Vyra's WorkoutSessions into OpenGym SessionRecord array for a specific exercise.
 */
export function mapVyraSessionsToRecords(
  sessions: WorkoutSession[],
  exerciseNameOrId: string,
  targetReps: number = 10,
  targetSets: number = 3
): SessionRecord[] {
  const needle = exerciseNameOrId.toLowerCase();
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const records: SessionRecord[] = [];

  for (const session of sorted) {
    const matchingLogs = (session.setLogs || []).filter(
      (log) =>
        log.exerciseName.toLowerCase() === needle ||
        log.exercisePrescriptionId.toLowerCase() === needle
    );

    if (!matchingLogs.length) continue;

    const completed = matchingLogs.filter((s) => s.reps > 0 && s.weightKg >= 0);
    if (!completed.length) continue;

    const weights = completed.map((s) => s.weightKg);
    const maxWeight = Math.max(...weights);
    const reps = completed.map((s) => s.reps);
    const low = Math.min(...reps);
    const amrap = reps[reps.length - 1];

    // Success check: did lifter complete at least targetSets and hit targetReps on all sets?
    const enough = completed.length >= targetSets;
    const ok = enough && reps.every((r) => r >= targetReps);

    records.push({
      d: session.date,
      mode: 'reps',
      weight: maxWeight,
      reps,
      goal: targetReps,
      low,
      count: reps.length,
      amrap,
      ok,
      target: {
        sets: targetSets,
        reps: targetReps,
        weight: maxWeight,
      },
    });
  }

  return records;
}

/**
 * Computes the next session's target load and reps using OpenGym biomechanics.
 */
export function computeExercisePrescription(
  sessions: WorkoutSession[],
  exercise: {
    id: string;
    name: string;
    sets?: number;
    repRangeLow?: number;
    repRangeHigh?: number;
    lastWeightKg?: number;
    loadGuidance?: string;
  },
  unit: string = 'kg'
): PrescriptionResult & { formattedWhy: string; policyName: string } {
  const policy = inferProgressionPolicy(exercise);
  const targetSets = exercise.sets || 3;
  const targetReps = exercise.repRangeHigh || exercise.repRangeLow || 10;
  const repsMin = exercise.repRangeLow && exercise.repRangeLow < targetReps ? exercise.repRangeLow : targetReps - 2;

  const records = mapVyraSessionsToRecords(sessions, exercise.name, targetReps, targetSets);

  const cfg: ExercisePlanConfig = {
    id: exercise.id,
    weight: exercise.lastWeightKg || 0,
    sets: targetSets,
    reps: targetReps,
    repsMin,
    prog: policy,
  };

  const rawPrescription = nextPrescription(
    { unit, workouts: [] },
    cfg,
    null,
    records
  );

  return {
    ...rawPrescription,
    formattedWhy: formatPrescriptionWhy(rawPrescription.why),
    policyName: POLICY_NAME[rawPrescription.policy] || rawPrescription.policy,
  };
}
