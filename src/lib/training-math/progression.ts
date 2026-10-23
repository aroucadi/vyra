/**
 * @file progression.ts
 * @description Automatic progression and deload engine ported from OpenGym.
 * Implements linear progression, Greyskull LP, double progression, triple progression,
 * stall streak tracking, and automated deload triggers.
 */

export const POLICIES = ['off', 'linear', 'greyskull', 'double', 'triple', 'time'] as const;
export type ProgressionPolicy = (typeof POLICIES)[number];

export const POLICIES_FOR: Record<string, ProgressionPolicy[]> = {
  reps: ['off', 'linear', 'greyskull', 'double', 'triple'],
  time: ['off', 'time'],
  cardio: ['off'],
};

export const POLICY_NAME: Record<ProgressionPolicy, string> = {
  off: 'No automatic progression',
  linear: 'Linear progression',
  greyskull: 'Greyskull LP',
  double: 'Double progression',
  triple: 'Triple progression',
  time: 'Add time',
};

export const POLICY_DESC: Record<ProgressionPolicy, string> = {
  off: 'Targets stay where you set them.',
  linear: 'Hit every rep in every set and the weight goes up. Repeated misses trigger a deload.',
  greyskull:
    'Two straight sets plus a final set taken to failure. Beat the target on that set and the weight goes up (twice as much if you double the reps). One failure resets 10 %.',
  double:
    'Work up through a rep range at the same weight. Reach the top of the range in every set and the weight goes up, reps back to the bottom.',
  triple:
    'Reps climb to the top of the range, then a set is added, up to your most sets. All of them at the top and the weight goes up, back to your first sets and reps.',
  time: 'Hold every set for the full duration and the target goes up.',
};

export const DELOAD_FACTOR = 0.9;
export const DELOAD_AFTER: Record<ProgressionPolicy, number> = {
  off: 999,
  linear: 3,
  greyskull: 1,
  double: 3,
  triple: 3,
  time: 3,
};
export const DELOAD_FACTOR_MIN = 0.5;
export const DELOAD_FACTOR_MAX = 0.95;
export const DEFAULT_SEC_INCREMENT = 5;
export const MAX_BW_SETS = 6;
export const MAX_TRIPLE_SETS = 10;

const HEAVY_BP = ['upper legs', 'lower legs', 'back', 'hips', 'glutes'];

export function isValidDeloadFactor(value: unknown): boolean {
  const factor = Number(value);
  return Number.isFinite(factor) && factor >= DELOAD_FACTOR_MIN && factor <= DELOAD_FACTOR_MAX;
}

export function deloadFactorOf(cfg?: { deloadFactor?: number | null } | null): number {
  return isValidDeloadFactor(cfg?.deloadFactor) ? Number(cfg!.deloadFactor) : DELOAD_FACTOR;
}

const round1 = (v: number): number => Math.round(v * 10) / 10;

export function epley1RM(weight: number | string, reps: number | string): number | null {
  const w = Number(weight);
  const r = Number(reps);
  if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r < 1) return null;
  const result = w * (1 + r / 30);
  return Number.isFinite(result) && result > 0 ? round1(result) : null;
}

export function deloadTarget1RM(
  weight: number | string,
  reps: number | string,
  factor: number = DELOAD_FACTOR,
  perSide: boolean = false
): number | null {
  const base = epley1RM(weight, perSide ? Number(reps) / 2 : reps);
  const f = isValidDeloadFactor(factor) ? Number(factor) : DELOAD_FACTOR;
  return base == null ? null : round1(base * f);
}

function safeGetExerciseById(id: string) {
  if (typeof window !== 'undefined') return null;
  try {
    const { getExerciseById } = require('../rag/catalogue-loader');
    return getExerciseById(id);
  } catch {
    return null;
  }
}

export function defaultIncrement(exId?: string | null, unit: string = 'kg'): number {
  let isHeavy = false;
  if (exId) {
    const lower = exId.toLowerCase();
    isHeavy =
      lower.includes('squat') ||
      lower.includes('deadlift') ||
      lower.includes('leg') ||
      HEAVY_BP.some((bp) => lower.includes(bp));

    if (!isHeavy) {
      const found = safeGetExerciseById(exId);
      if (found) {
        const bp = (found.bodyPart || '').toLowerCase();
        const target = (found.target || '').toLowerCase();
        const name = (found.name || '').toLowerCase();
        isHeavy =
          name.includes('squat') ||
          name.includes('deadlift') ||
          HEAVY_BP.some((p) => bp.includes(p) || target.includes(p));
      }
    }
  }
  if (unit === 'lb') return isHeavy ? 10 : 5;
  return isHeavy ? 5 : 2.5;
}

export function weightIncrement(cfg?: { id?: string; inc?: number } | null, unit: string = 'kg'): number {
  return cfg && cfg.inc && cfg.inc > 0 ? cfg.inc : defaultIncrement(cfg?.id, unit);
}

export function plannedOf(cfg?: ExercisePlanConfig | null): Record<string, unknown> {
  const c = cfg || {};
  const mode = c.sec ? 'time' : 'reps';
  const out: Record<string, unknown> = { sets: Math.max(1, c.sets || 1) };
  if (mode === 'reps' && c.reps && c.reps > 0) out.reps = c.reps;
  if (mode === 'reps' && c.repsMin && c.repsMin > 0) out.repsMin = c.repsMin;
  if (mode === 'time' && c.sec && c.sec > 0) out.sec = c.sec;
  if (mode === 'reps' && c.setsMax && c.setsMax > 0) out.setsMax = c.setsMax;
  if (c.weight != null) out.weight = c.weight;
  return out;
}

const PLAN_KEYS = ['sets', 'reps', 'repsMin', 'sec', 'setsMax'] as const;
const samePlan = (a: Record<string, unknown>, b: Record<string, unknown>): boolean =>
  PLAN_KEYS.every((k) => (a[k] ?? null) === (b[k] ?? null));

export function planChanged(planned?: Record<string, unknown> | null, cfg?: ExercisePlanConfig | null): boolean {
  return Boolean(planned && !samePlan(planned, plannedOf(cfg)));
}

const positiveGridAround = (ideal: number, step: number, maxWeight: number, strictLower: boolean): number[] => {
  if (!(ideal > 0) || !(step > 0) || !(maxWeight > 0)) return [];
  const low = Math.floor(ideal / step) * step;
  const high = Math.ceil(ideal / step) * step;
  const values = [...new Set([low, high].map((v) => snapWeight(v, step)))];
  return values
    .filter((v) => v > 0 && v <= maxWeight + 1e-9 && (!strictLower || v < maxWeight - 1e-9))
    .sort((a, b) => a - b);
};

export interface DeloadCandidateParams {
  currentWeight: number | string;
  targetWeight: number | string;
  targetReps: number | string;
  step: number;
  factor?: number;
  reps?: number;
  repsMin?: number | null;
  perSide?: boolean;
}

export interface DeloadCandidateResult {
  weight: number;
  reps: number;
  epley: number | null;
  error: number;
  repChange: number;
  fallback: boolean;
  target1RM: number;
  factor: number;
  upper: number;
  bottom: number;
}

export function selectDeloadCandidate(params: DeloadCandidateParams): DeloadCandidateResult | null {
  const current = Number(params.currentWeight);
  const baseWeight = Number(params.targetWeight);
  const baseReps = Number(params.targetReps);
  const stride = params.perSide ? 2 : 1;
  const upper = Math.max(stride, Math.ceil(baseReps / stride) * stride);
  const range = params.repsMin == null ? null : normalizeRepRange(params.reps || baseReps, params.repsMin, stride);
  const top = range ? Math.min(range.reps, Math.max(range.repsMin, upper)) : upper;
  const bottom = range ? range.repsMin : top;
  const repValues: number[] = [];
  for (let r = top; r >= bottom; r -= stride) repValues.push(r);
  const target1RM = deloadTarget1RM(baseWeight, upper, params.factor ?? DELOAD_FACTOR, params.perSide);
  if (!(current > 0) || target1RM == null || !repValues.length || !(params.step > 0)) return null;

  const candidates: {
    weight: number;
    reps: number;
    epley: number | null;
    error: number;
    repChange: number;
    fallback: boolean;
  }[] = [];

  repValues.forEach((candidateReps) => {
    const ideal = target1RM / (1 + (params.perSide ? candidateReps / 2 : candidateReps) / 30);
    const allowCurrent = params.repsMin != null && candidateReps < upper;
    const grid = positiveGridAround(ideal, params.step, current, !allowCurrent);
    if (allowCurrent && !grid.includes(current)) grid.push(current);
    grid.forEach((candidateWeight) => {
      const epley = epley1RM(candidateWeight, params.perSide ? candidateReps / 2 : candidateReps);
      if (epley !== null) {
        candidates.push({
          weight: candidateWeight,
          reps: candidateReps,
          epley,
          error: Math.abs(epley - target1RM),
          repChange: Math.abs(candidateReps - upper),
          fallback: false,
        });
      }
    });
  });

  if (!candidates.length) {
    repValues.forEach((candidateReps) => {
      const epley = epley1RM(current, params.perSide ? candidateReps / 2 : candidateReps);
      if (epley !== null) {
        candidates.push({
          weight: current,
          reps: candidateReps,
          epley,
          error: Math.abs(epley - target1RM),
          repChange: Math.abs(candidateReps - upper),
          fallback: true,
        });
      }
    });
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => a.error - b.error || a.repChange - b.repChange || b.weight - a.weight || b.reps - a.reps);
  return {
    ...candidates[0],
    target1RM,
    factor: deloadFactorOf({ deloadFactor: params.factor }),
    upper,
    bottom,
  };
}

export function snapWeight(v: number, step: number): number {
  if (!(step > 0)) return round1(v);
  const snapped = Math.round(v / step) * step;
  if ((step * 10) % 1 !== 0) {
    return Math.round(snapped * 100) / 100;
  }
  return round1(snapped);
}

export function addStep(w: number | string, step: number, inc: number): number {
  const v = +w || 0;
  const onGrid = inc > 0 && Math.abs(v - Math.round(v / inc) * inc) <= 0.1;
  const next = v + step;
  return Math.max(0, onGrid ? snapWeight(next, inc) : round1(next));
}

export function stepWeight(value: number | string, step: number, direction: number): number {
  const v = Number(value) || 0;
  return addStep(v, direction * step, step);
}

export function deloadTo(cur: number, step: number, factor: number = DELOAD_FACTOR): number {
  let next = snapWeight(cur * factor, step);
  if (next >= cur) next = snapWeight(cur - step, step);
  return Math.max(step, next);
}

export function normalizeRepRange(
  reps: number | string | undefined | null,
  repsMin?: number | string | null,
  stride: number = 1
): { reps: number; repsMin: number } {
  const step = Number.isInteger(stride) && stride > 0 ? stride : 1;
  const align = (value: number, s: number) => Math.max(s, Math.ceil(value / s) * s);
  const positiveInt = (value: unknown, fallback: number) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.max(1, Math.round(n)) : fallback;
  };

  const upper = align(positiveInt(reps, 10), step);
  const lower = align(positiveInt(repsMin, Math.max(1, upper - 2)), step);
  return lower >= upper
    ? { reps: lower + step, repsMin: lower }
    : { reps: upper, repsMin: lower };
}

export function policyFor(
  cfg?: { prog?: ProgressionPolicy; id?: string } | null,
  routine?: { prog?: ProgressionPolicy } | null,
  mode: string = 'reps'
): ProgressionPolicy {
  const allowed = POLICIES_FOR[mode] || ['off'];
  const pick = cfg?.prog || routine?.prog || (mode === 'reps' ? 'linear' : 'off');
  return allowed.includes(pick) ? pick : 'off';
}

export interface SessionRecord {
  d?: string;
  rid?: string;
  mode?: string;
  weight: number;
  reps?: number[];
  held?: number[];
  goal: number;
  low?: number;
  count?: number;
  amrap?: number;
  ok: boolean;
  planned?: {
    sets?: number;
    reps?: number;
    repsMin?: number;
    sec?: number;
    setsMax?: number;
    weight?: number;
    routineId?: string;
  };
  target?: {
    sets?: number;
    reps?: number;
    repsMin?: number;
    sec?: number;
    weight?: number;
    side?: boolean;
    rowReps?: number[];
  };
}

const isWarmupRow = (s: any): boolean =>
  Boolean(s && (s.warmup === true || s.phase === 'warmup' || s.phase === 'warm-up' || s.phase === 'warm_up'));

function modeOf(targetOrEntry: any): string {
  if (targetOrEntry?.mode) return targetOrEntry.mode;
  if (targetOrEntry?.sec != null && targetOrEntry.sec > 0) return 'time';
  return 'reps';
}

function loadOf(entry: any, sets: any[]): number {
  const done = sets.filter((s) => s && s.done).map((s) => Number(s.w) || 0);
  return done.length ? Math.max(0, ...done) : 0;
}

export function readSession(entry: any, fallback?: any): SessionRecord {
  const target = entry?.target || fallback || {};
  const mode = modeOf({ ...target, id: entry?.id });
  const logged = ((entry && entry.sets) || []).filter((s: any) => !isWarmupRow(s));

  const rowGoals =
    mode === 'reps' && entry?.target && Array.isArray(target.rowReps) && target.rowReps.length
      ? target.rowReps.map((r: any) => Math.max(0, Number(r) || 0))
      : null;
  const plannedRows = rowGoals ? rowGoals.length : target.sets || logged.length;
  const planned = mode === 'time' && (target.side || target.perSide) ? plannedRows * 2 : plannedRows;
  const enough = logged.length >= planned;
  const sets = entry && entry.target ? logged.slice(0, Math.max(1, planned)) : logged;

  if (mode === 'time') {
    const goal = Number(target.sec) || 0;
    const held = sets.map((s: any) => (s.done ? Number(s.sec) || 0 : 0));
    return {
      mode,
      target,
      goal,
      held,
      weight: loadOf(entry, sets),
      ok: goal > 0 && enough && held.length > 0 && held.every((h: number) => h >= goal),
    };
  }

  const goal = rowGoals ? Math.max(...rowGoals) : Number(target.reps) || 0;
  const reps = sets.map((s: any) => (s.done ? Number(s.r) || 0 : 0));
  const low = reps.length ? Math.min(...reps) : 0;
  const amrap = reps.length ? reps[reps.length - 1] : 0;
  const ok =
    goal > 0 &&
    enough &&
    reps.length > 0 &&
    reps.every((r: number, k: number) => r >= (rowGoals ? rowGoals[k] ?? goal : goal));

  return {
    mode,
    target,
    goal,
    reps,
    weight: loadOf(entry, sets),
    count: reps.length,
    low,
    amrap,
    ok,
  };
}

export function sessionsFor(S: any, exId?: string | null, fallback?: any, rid?: string | null): SessionRecord[] {
  if (!S || !Array.isArray(S.workouts) || !exId) return [];
  const out: SessionRecord[] = [];

  for (const w of S.workouts) {
    const entry = (w.entries || []).find(
      (e: any) => e && e.id === exId && (!rid || e.routineId === rid || (e.planned && e.planned.routineId === rid))
    );
    if (!entry) continue;
    if (w.excludeFromProgression || entry.noProg) continue;
    if (!(entry.sets || []).some((s: any) => s.done && !isWarmupRow(s))) continue;

    out.push({
      d: w.d,
      ...(entry.routineId ? { rid: entry.routineId } : {}),
      ...(entry.planned ? { planned: entry.planned } : {}),
      ...readSession(entry, fallback),
    });
  }

  return out;
}

function tripleActive(session: SessionRecord): number {
  const rows = session.target?.rowReps;
  const reps = session.reps || [];
  if (!Array.isArray(rows) || !rows.length) return session.low || 0;
  if (rows.every((r) => r === rows[0])) {
    return Math.min(...rows.map((_, k) => reps[k] || 0));
  }
  return reps[rows.length - 1] || 0;
}

const sameRows = (a: SessionRecord, b: SessionRecord): boolean =>
  JSON.stringify(a.target?.rowReps || null) === JSON.stringify(b.target?.rowReps || null);

export function stallCount(sessions: SessionRecord[], policy: ProgressionPolicy): number {
  let n = 0;
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].ok) break;
    if (i < sessions.length - 1 && sessions[i].weight !== sessions[i + 1].weight) break;
    if (
      i < sessions.length - 1 &&
      sessions[i].planned &&
      sessions[i + 1].planned &&
      JSON.stringify(sessions[i].planned) !== JSON.stringify(sessions[i + 1].planned)
    ) {
      break;
    }

    if (policy === 'double') {
      const run: number[] = [];
      for (let j = i - 1; j >= 0 && sessions[j].weight === sessions[i].weight; j--) {
        if (sessions[j].low != null) run.push(sessions[j].low!);
      }
      if (run.length && (sessions[i].low ?? 0) > Math.max(...run)) break;
    }

    if (policy === 'triple') {
      const run: number[] = [];
      for (
        let j = i - 1;
        j >= 0 && sessions[j].weight === sessions[i].weight && sameRows(sessions[j], sessions[i]);
        j--
      ) {
        run.push(tripleActive(sessions[j]));
      }
      if (run.length && tripleActive(sessions[i]) > Math.max(...run)) break;
    }

    n++;
  }
  return n;
}

export interface ExercisePlanConfig {
  id?: string;
  weight?: number;
  sets?: number;
  reps?: number;
  repsMin?: number;
  repsMax?: number;
  sec?: number;
  inc?: number;
  prog?: ProgressionPolicy;
  deloadFactor?: number;
  setsMax?: number;
}

export interface PrescriptionResult {
  policy: ProgressionPolicy;
  kind: 'first' | 'up' | 'hold' | 'deload' | 'off';
  weight?: number;
  reps?: number;
  sets?: number;
  rowReps?: number[];
  sec?: number;
  target1RM?: number | null;
  deloadFactor?: number;
  why?: (string | number)[];
}

export function applyPrescription(sets: any[], p: PrescriptionResult, step = 2.5, floor = 0): any[] {
  if (!p || p.kind === 'off' || (p.kind === 'first' && !p.rowReps)) return sets;
  return sets.map((s) => {
    if (s.done) return s;
    if (isWarmupRow(s)) {
      if (p.reps != null && s.r != null) return { ...s, r: p.reps };
      if (p.sec != null && s.sec != null) return { ...s, sec: p.sec };
      return s;
    }
    const o = { ...s };
    if (p.weight != null) o.w = p.weight;
    if (p.reps != null) o.r = p.reps;
    if (p.sec != null) o.sec = p.sec;
    return o;
  });
}

export function tripleSetsOf(cfg?: ExercisePlanConfig | null): { setsMin: number; setsMax: number } {
  const setsMin = Math.max(1, Math.round(Number(cfg?.sets)) || 1);
  const setsMax = Math.max(setsMin, Math.min(MAX_TRIPLE_SETS, Math.round(Number(cfg?.setsMax)) || setsMin));
  return { setsMin, setsMax };
}

/**
 * Computes the next prescribed training target based on session history and policy.
 */
export function nextPrescription(
  S: { unit?: string; workouts?: any[] } | undefined,
  cfg: ExercisePlanConfig,
  routine?: { id?: string; prog?: ProgressionPolicy } | null,
  passedSessions?: SessionRecord[]
): PrescriptionResult {
  const mode = cfg.sec ? 'time' : 'reps';
  const policy = policyFor(cfg, routine, mode);
  const unit = S?.unit || 'kg';
  const inc = mode === 'time' ? (cfg.inc && cfg.inc > 0 ? cfg.inc : DEFAULT_SEC_INCREMENT) : weightIncrement(cfg, unit);

  if (policy === 'off') return { policy, kind: 'off' };

  const sessions =
    passedSessions && passedSessions.length > 0
      ? passedSessions
      : S?.workouts
      ? sessionsFor(S, cfg.id, cfg, routine?.id)
      : [];

  const last = sessions[sessions.length - 1];

  if (!last) {
    if (policy === 'triple') {
      const range = normalizeRepRange(cfg.reps || 10, cfg.repsMin);
      const sets = tripleSetsOf(cfg);
      return {
        policy,
        kind: 'first',
        reps: range.repsMin,
        sets: sets.setsMin,
        rowReps: Array(sets.setsMin).fill(range.repsMin),
        why: ['Nothing logged yet, so this session sets the baseline.'],
      };
    }
    return { policy, kind: 'first', why: ['Nothing logged yet, so this session sets the baseline.'] };
  }

  const stalls = stallCount(sessions, policy);
  const deloadAt = DELOAD_AFTER[policy] || 3;

  if (mode === 'time') {
    if (last.ok) {
      const sec = (last.goal || cfg.sec || 0) + inc;
      return { policy, kind: 'up', sec, why: ['Held every set for the full time. Target goes up by {0}s.', inc] };
    }
    if (stalls >= deloadAt) {
      const sec = deloadTo(last.goal || cfg.sec || 0, 5);
      return { policy, kind: 'deload', sec, why: ['Short {0} sessions in a row. Back off to {1}s and build up again.', stalls, sec] };
    }
    return { policy, kind: 'hold', sec: last.goal || cfg.sec, why: ['Came up short last time. Same target again.'] };
  }

  const w = last.weight;

  const epleyDeload = (): PrescriptionResult | null => {
    if (mode !== 'reps' || (policy !== 'linear' && policy !== 'double')) return null;
    const targetReps = Number(last.target?.reps ?? cfg.reps ?? last.goal ?? 5);
    const targetWeight = Number(last.target?.weight ?? cfg.weight ?? w);
    const factor = deloadFactorOf(cfg);

    const candidate = selectDeloadCandidate({
      currentWeight: w,
      targetWeight,
      targetReps,
      step: inc,
      factor,
      reps: Number(cfg.reps ?? targetReps),
      repsMin: policy === 'double' ? (cfg.repsMin != null ? Number(cfg.repsMin) : undefined) : undefined,
      perSide: Boolean(last.target?.side || (cfg as any)?.side || (cfg as any)?.perSide),
    });

    if (!candidate) return null;
    const held = candidate.weight >= w;
    return {
      policy,
      kind: 'deload',
      weight: candidate.weight,
      reps: candidate.reps,
      sets: cfg.sets ?? last.target?.sets,
      target1RM: candidate.target1RM,
      deloadFactor: candidate.factor,
      why: held
        ? ['Stuck for {0} sessions. Hold {1} {2} and use {3} reps.', stalls, candidate.weight, unit, candidate.reps]
        : ['Stuck for {0} sessions. Epley deload to {1} {2} for {3} reps.', stalls, candidate.weight, unit, candidate.reps],
    };
  };

  // Double progression
  if (policy === 'double') {
    const range = normalizeRepRange(cfg.reps || last.goal || 10, cfg.repsMin);
    const top = range.reps;
    const bottom = range.repsMin;

    if (last.ok && (last.low ?? 0) >= top) {
      const up = addStep(w, inc, inc);
      return {
        policy,
        kind: 'up',
        weight: up,
        reps: bottom,
        why: ['Top of the rep range in every set. {0} {1} more, back to {2} reps.', inc, unit, bottom],
      };
    }

    if (stalls >= deloadAt) {
      const selected = epleyDeload();
      if (selected) return selected;
      const dw = deloadTo(w, inc, deloadFactorOf(cfg));
      return {
        policy,
        kind: 'deload',
        weight: dw,
        reps: bottom,
        why: ['Stuck for {0} sessions. Deload to {1} {2}.', stalls, dw, unit],
      };
    }

    const aim = Math.min(top, Math.max(bottom, (last.low ?? bottom) + 1));
    return {
      policy,
      kind: 'hold',
      weight: w,
      reps: aim,
      why: ['Same weight, aim for {0} reps this time.', aim],
    };
  }

  // Triple progression
  if (policy === 'triple') {
    const range = normalizeRepRange(cfg.reps || 10, cfg.repsMin);
    const setsConfig = tripleSetsOf(cfg);
    const top = range.reps;
    const bottom = range.repsMin;

    if (stalls >= deloadAt) {
      const dw = deloadTo(w, inc, deloadFactorOf(cfg));
      return {
        policy,
        kind: 'deload',
        weight: dw,
        reps: bottom,
        sets: setsConfig.setsMin,
        rowReps: Array(setsConfig.setsMin).fill(bottom),
        why: ['Stuck for {0} sessions. Deload to {1} {2}.', stalls, dw, unit],
      };
    }

    if (last.ok && (last.low ?? 0) >= top) {
      const currentSets = last.reps?.length || setsConfig.setsMin;
      if (currentSets < setsConfig.setsMax) {
        return {
          policy,
          kind: 'up',
          weight: w,
          reps: bottom,
          sets: currentSets + 1,
          rowReps: [...Array(currentSets).fill(top), bottom],
          why: ['Top of the range reached! Add a set.', top, bottom],
        };
      }
      const up = addStep(w, inc, inc);
      return {
        policy,
        kind: 'up',
        weight: up,
        reps: bottom,
        sets: setsConfig.setsMin,
        rowReps: Array(setsConfig.setsMin).fill(bottom),
        why: ['Top of the range on all sets. Weight goes up!', inc, unit, bottom],
      };
    }

    return {
      policy,
      kind: 'hold',
      weight: w,
      reps: Math.min(top, (last.low ?? bottom) + 1),
      why: ['Same weight, aim for more reps.'],
    };
  }

  // Linear and Greyskull LP
  if (last.ok) {
    const dbl = policy === 'greyskull' && last.goal > 0 && (last.amrap ?? 0) >= last.goal * 2;
    const jump = dbl ? inc * 2 : inc;
    const up = addStep(w, jump, inc);
    return {
      policy,
      kind: 'up',
      weight: up,
      why: dbl
        ? ['Last set hit {0} reps, twice the target! Take a double jump of {1} {2}.', last.amrap!, jump, unit]
        : ['Every rep last time. {0} {1} more.', jump, unit],
    };
  }

  if (stalls >= deloadAt) {
    const selected = epleyDeload();
    if (selected) return selected;
    const dw = deloadTo(w, inc, deloadFactorOf(cfg));
    return {
      policy,
      kind: 'deload',
      weight: dw,
      why: stalls > 1
        ? ['Missed reps {0} sessions running. Reset to {1} {2} and work back up.', stalls, dw, unit]
        : ['Missed reps. Reset to {0} {1} and work back up.', dw, unit],
    };
  }

  return {
    policy,
    kind: 'hold',
    weight: w,
    why: ['Missed reps last time. Same weight again ({0} of {1} to go).', deloadAt - stalls, deloadAt],
  };
}
