/**
 * @file onerm.ts
 * @description Estimated one-rep max calculation suite ported from OpenGym.
 * Implements standard submaximal formulas (Epley, Brzycki, Lombardi, O'Conner, Mayhew, Wathan, Lander)
 * and Mike Tuchscherer / RTS weighted ensemble with RIR attenuation.
 */

import { getExerciseById } from '../rag/catalogue-loader';

export const REP_CAP = 12;
export const WEIGHTED_REP_CAP = 15;

export type SingleFormula =
  | 'epley'
  | 'brzycki'
  | 'lombardi'
  | 'oconner'
  | 'mayhew'
  | 'wathan'
  | 'lander';

export type OneRmFormula = SingleFormula | 'weighted';

export const FORMULAS: Record<SingleFormula, (w: number, r: number) => number> = {
  epley: (w, r) => w * (1 + r / 30),
  brzycki: (w, r) => (w * 36) / (37 - r),
  lombardi: (w, r) => w * Math.pow(r, 0.1),
  oconner: (w, r) => w * (1 + r / 40),
  mayhew: (w, r) => (w * 100) / (52.2 + 41.9 * Math.exp(-0.055 * r)),
  wathan: (w, r) => (w * 100) / (48.8 + 53.8 * Math.exp(-0.075 * r)),
  lander: (w, r) => (w * 100) / (101.3 - 2.67123 * r),
};

export const DEFAULT_FORMULA: SingleFormula = 'epley';

export const FORMULA_NAMES: Record<OneRmFormula, string> = {
  epley: 'Epley',
  brzycki: 'Brzycki',
  lombardi: 'Lombardi',
  oconner: 'O’Conner',
  mayhew: 'Mayhew',
  wathan: 'Wathan',
  lander: 'Lander',
  weighted: 'Weighted Ensemble',
};

export function formulaOf(S?: { oneRmFormula?: string } | null): string {
  const f = S?.oneRmFormula;
  return f === 'weighted' || (f && Object.hasOwn(FORMULAS, f)) ? f : DEFAULT_FORMULA;
}

// RIR %1RM map (Mike Tuchscherer / RTS scale)
// Index 0 = 1 rep to failure, index 14 = 15 reps to failure
const RIR_PCT = [
  100, 95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9,
  71.7, 69.5, 67.5, 65.5, 63.6,
];

function rirEstimate(w: number, effectiveReps: number): number {
  const idx = Math.min(Math.max(Math.round(effectiveReps) - 1, 0), RIR_PCT.length - 1);
  return (w * 100) / RIR_PCT[idx];
}

const WEIGHTS: Record<string, { a: number; v: (r: number) => number }> = {
  epley: { a: 0.95, v: (r) => (r <= 6 ? 1 : Math.max(0.4, 1 - (r - 6) * 0.12)) },
  brzycki: { a: 1.1, v: (r) => (r <= 8 ? 1 : Math.max(0.3, 1 - (r - 8) * 0.18)) },
  lombardi: { a: 0.85, v: (r) => (r <= 5 ? 1 : Math.max(0.4, 1 - (r - 5) * 0.1)) },
  oconner: { a: 0.9, v: (r) => (r <= 6 ? 1 : Math.max(0.4, 1 - (r - 6) * 0.12)) },
  mayhew: { a: 0.95, v: (r) => (r <= 8 ? 1 : Math.max(0.5, 1 - (r - 8) * 0.1)) },
  wathan: { a: 0.9, v: (r) => (r <= 7 ? 1 : Math.max(0.4, 1 - (r - 7) * 0.12)) },
  lander: { a: 0.85, v: (r) => (r <= 7 ? 1 : Math.max(0.35, 1 - (r - 7) * 0.15)) },
  rir: { a: 1.0, v: (r) => (r <= 10 ? 1 : Math.max(0.4, 1 - (r - 10) * 0.15)) },
};

function ensembleCV(w: number, effectiveReps: number): number {
  const vals = (Object.keys(FORMULAS) as SingleFormula[]).map((f) => FORMULAS[f](w, effectiveReps));
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, e) => a + (e - mean) ** 2, 0) / vals.length;
  return Math.sqrt(variance) / mean;
}

export function weightedEstimate(w: number, effectiveReps: number): number {
  let total = 0;
  let wsum = 0;
  for (const [name, fn] of Object.entries(FORMULAS)) {
    const wt = WEIGHTS[name].a * WEIGHTS[name].v(effectiveReps);
    total += fn(w, effectiveReps) * wt;
    wsum += wt;
  }
  const rirWt = WEIGHTS.rir.a * WEIGHTS.rir.v(effectiveReps);
  total += rirEstimate(w, effectiveReps) * rirWt;
  wsum += rirWt;
  return total / wsum;
}

export interface EstimateOptions {
  formula?: string;
  rir?: number | null;
}

/**
 * Estimates 1RM from a completed set load and reps.
 * Compatible with OpenGym positional arguments and options object.
 */
export function estimate1RM(
  w: number | string | null | undefined,
  r: number | string | null | undefined,
  formulaOrOptions: string | EstimateOptions = DEFAULT_FORMULA,
  rirArg: number | null = null
): number | null {
  const weight = Number(w);
  const reps = Number(r);
  if (!isFinite(weight) || !isFinite(reps)) return null;
  if (weight <= 0 || reps < 1) return null;

  let formula: OneRmFormula = DEFAULT_FORMULA;
  let rir: number | null = rirArg;

  if (typeof formulaOrOptions === 'object' && formulaOrOptions !== null) {
    if (formulaOrOptions.formula) {
      formula = formulaOrOptions.formula as OneRmFormula;
    } else if (formulaOrOptions.rir != null) {
      formula = 'weighted';
    }
    if (formulaOrOptions.rir != null) {
      rir = formulaOrOptions.rir;
    }
  } else if (typeof formulaOrOptions === 'string') {
    formula = (formulaOrOptions as OneRmFormula) || DEFAULT_FORMULA;
  }

  const validRir = rir != null && Number(rir) >= 0;

  // 1 rep to failure is a direct measurement, not an estimate
  if (reps === 1 && (!validRir || Number(rir) === 0)) {
    return Math.round(weight * 10) / 10;
  }

  if (formula === 'weighted') {
    const effectiveReps = validRir ? reps + Number(rir) : reps;
    if (effectiveReps > WEIGHTED_REP_CAP) return null;
    const est = weightedEstimate(weight, effectiveReps);
    if (!isFinite(est) || est <= 0) return null;
    return Math.round(est * 10) / 10;
  }

  // Individual formulas ignore RIR parameter per OpenGym specification
  if (reps > REP_CAP) return null;

  const singleKey = (formula in FORMULAS ? formula : DEFAULT_FORMULA) as SingleFormula;
  const fn = FORMULAS[singleKey];
  const est = reps === 1 ? weight : fn(weight, Math.round(reps));
  if (!isFinite(est) || est <= 0) return null;
  return Math.round(est * 10) / 10;
}

export function calculate1RMAccuracy(
  reps: number | string,
  rir: number | null = null,
  formula: string = 'weighted'
): number {
  const r = Number(reps);
  if (!isFinite(r) || r < 1) return 0;
  if (r === 1 && rir === 0) return 1;
  if (r > WEIGHTED_REP_CAP) return 0;

  const repFactor = r === 1 ? 1 : 1 - (0.5 * (r - 1)) / (WEIGHTED_REP_CAP - 1);
  const rirVal = Number(rir);
  const rirFactor = rir != null && isFinite(rirVal) && rirVal > 0 ? 0.92 : 1;

  let spreadFactor = 1;
  if (formula === 'weighted' && r >= 2) {
    const cv = ensembleCV(100, r);
    spreadFactor = Math.max(0.5, 1 - (cv / 0.15) * 0.5);
  }

  return Math.round(repFactor * rirFactor * spreadFactor * 100) / 100;
}

export interface WorkoutSetRecord {
  w?: number | string;
  r?: number | string;
  done?: boolean;
  warmup?: boolean;
  type?: string;
  rir?: number | null;
  sides?: {
    L?: { w?: number; r?: number; done?: boolean };
    R?: { w?: number; r?: number; done?: boolean };
  };
}

export interface WorkoutEntryRecord {
  id?: string;
  topW?: number;
  sets?: WorkoutSetRecord[];
  target?: { mode?: string; side?: boolean; assisted?: boolean };
}

export function isAssisted(
  idOrEx?: { id?: string; eq?: string; equipment?: string; assisted?: boolean; target?: { assisted?: boolean } } | string | null
): boolean {
  if (!idOrEx) return false;
  if (typeof idOrEx === 'string') {
    const ex = getExerciseById(idOrEx);
    return Boolean(
      ex &&
        (ex.equipment === 'leverage machine' || (ex as any).eq === 'leverage machine') &&
        /\bassist(ed)?\b/i.test(ex.name || (ex as any).n || '')
    );
  }
  if (typeof (idOrEx as any).assisted === 'boolean') return (idOrEx as any).assisted;
  if (typeof idOrEx.target?.assisted === 'boolean') return idOrEx.target.assisted;
  const id = idOrEx.id;
  if (!id) return false;
  const ex = getExerciseById(id);
  if (!ex) return false;
  const eq = ex.equipment || (ex as any).eq;
  const name = ex.name || (ex as any).n || '';
  return eq === 'leverage machine' && /\bassist(ed)?\b/i.test(name);
}

export function bestSetOf(
  entry?: WorkoutEntryRecord | null,
  formula: string = DEFAULT_FORMULA
): { est: number; w: number; r: number } | null {
  if (!entry || !Array.isArray(entry.sets)) return null;

  // Assistance machines have no one-rep max to estimate
  if (isAssisted(entry.id ? { id: entry.id } : entry)) return null;

  // Timed and cardio entries drop out of 1RM calculation
  const targetMode = entry.target?.mode || (entry as any).mode;
  if (targetMode && targetMode !== 'reps') return null;

  let best: { est: number; w: number; r: number } | null = null;

  for (const set of entry.sets) {
    if (
      set.warmup === true ||
      (set as any).phase === 'warmup' ||
      (set as any).phase === 'warm-up' ||
      (set as any).phase === 'warm_up'
    ) {
      continue;
    }

    if ((set as any).sec != null && set.r == null) continue;
    if ((set as any).min != null && set.r == null) continue;

    const candidateSets: { w?: number | string; r?: number | string; rir?: number | null }[] = [];
    if (set.sides) {
      if (set.sides.L?.done) candidateSets.push(set.sides.L);
      if (set.sides.R?.done) candidateSets.push(set.sides.R);
    } else if (set.done) {
      candidateSets.push(set);
    }

    for (const s of candidateSets) {
      if (s.w == null || s.r == null) continue;
      const est = estimate1RM(s.w, s.r, formula, s.rir ?? null);
      if (est !== null && (!best || est > best.est)) {
        best = { est, w: Number(s.w), r: Math.round(Number(s.r)) };
      }
    }
  }

  return best;
}

export interface WorkoutHistoryState {
  oneRmFormula?: string;
  workouts?: {
    d: string;
    start?: number;
    entries?: WorkoutEntryRecord[];
  }[];
}

export function e1rmSeries(
  S: WorkoutHistoryState,
  exId: string,
  formula: string = formulaOf(S)
): { t?: number; d: string; y: number; w: number; r: number }[] {
  if (isAssisted(exId)) return [];
  const pts: { t?: number; d: string; y: number; w: number; r: number }[] = [];
  for (const w of S.workouts || []) {
    const entries = (w.entries || []).filter((e) => e && e.id === exId);
    let bestForWorkout: { est: number; w: number; r: number } | null = null;
    for (const entry of entries) {
      const candidate = bestSetOf(entry, formula);
      if (candidate && (!bestForWorkout || candidate.est > bestForWorkout.est)) {
        bestForWorkout = candidate;
      }
    }

    if (bestForWorkout) {
      pts.push({
        t: w.start,
        d: w.d,
        y: bestForWorkout.est,
        w: bestForWorkout.w,
        r: bestForWorkout.r,
      });
    }
  }
  return pts;
}

export function best1RM(
  S: WorkoutHistoryState,
  exId: string,
  formula: string = formulaOf(S)
): { est: number; w: number; r: number; d: string; t?: number } | null {
  let best: { est: number; w: number; r: number; d: string; t?: number } | null = null;
  for (const p of e1rmSeries(S, exId, formula)) {
    if (!best || p.y > best.est) {
      best = { est: p.y, w: p.w, r: p.r, d: p.d, t: p.t };
    }
  }
  return best;
}

export function is1RMRecord(
  S: WorkoutHistoryState,
  exId: string,
  entry: WorkoutEntryRecord,
  formula: string = formulaOf(S)
): { est: number; w: number; r: number; prev: number } | null {
  const now = bestSetOf(entry, formula);
  if (!now) return null;
  const prev = best1RM(S, exId, formula);
  return !prev || now.est > prev.est
    ? { ...now, prev: prev ? prev.est : 0 }
    : null;
}
