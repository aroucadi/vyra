/**
 * @file structural-balance.ts
 * @description Structural balance and postural strength ratios ported from OpenGym.
 * Implements Poliquin, Thibaudeau, and ATG benchmark ratio evaluations against compound lifts.
 */

import { estimate1RM, FORMULAS, DEFAULT_FORMULA } from './onerm';

function safeGetExerciseById(id: string) {
  if (typeof window !== 'undefined') return null;
  try {
    const { getExerciseById } = require('../rag/catalogue-loader');
    return getExerciseById(id);
  } catch {
    return null;
  }
}

export * from './structural-balance-types';
import {
  EVALUATION_MODES,
  BALANCE_STATUSES,
  BalanceStatus,
  BORDERLINE_BAND_PCT,
  LB_TO_KG,
  RoleDefinition,
  TemplateDefinition,
  ResolvedCurrentLift,
  RoleEvaluationResult,
} from './structural-balance-types';

export const TEMPLATES: Record<string, TemplateDefinition> = {
  poliquin: {
    id: 'poliquin',
    label: 'Poliquin',
    roles: [
      {
        id: 'narrowBench',
        label: 'Close-grip bench press (anchor)',
        evaluationMode: EVALUATION_MODES.LOAD_RATIO,
        exerciseIds: ['0030', '1719'],
        targetPct: 100,
      },
      {
        id: 'inclineBench',
        label: 'Incline bench press',
        evaluationMode: EVALUATION_MODES.LOAD_RATIO,
        anchorRoleId: 'narrowBench',
        exerciseIds: ['0047'],
        targetPct: 91,
      },
      {
        id: 'dips',
        label: 'Dips (bodyweight + load)',
        evaluationMode: EVALUATION_MODES.LOAD_RATIO,
        anchorRoleId: 'narrowBench',
        exerciseIds: ['0251'],
        targetPct: 117,
      },
      {
        id: 'supinePullups',
        label: 'Supine pull-ups (bodyweight + load)',
        evaluationMode: EVALUATION_MODES.LOAD_RATIO,
        anchorRoleId: 'narrowBench',
        exerciseIds: ['0652', '0841'],
        targetPct: 87,
      },
      {
        id: 'barbellCurl',
        label: 'Standing barbell curl',
        evaluationMode: EVALUATION_MODES.LOAD_RATIO,
        anchorRoleId: 'narrowBench',
        exerciseIds: ['0031'],
        targetPct: 40,
      },
      {
        id: 'highBarSquat',
        label: 'High-bar back squat (anchor)',
        evaluationMode: EVALUATION_MODES.LOAD_RATIO,
        exerciseIds: ['1436', '0043'],
        targetPct: 100,
      },
      {
        id: 'frontSquat',
        label: 'Front squat',
        evaluationMode: EVALUATION_MODES.LOAD_RATIO,
        anchorRoleId: 'highBarSquat',
        exerciseIds: ['0042'],
        targetPct: 85,
      },
      {
        id: 'deadlift',
        label: 'Deadlift',
        evaluationMode: EVALUATION_MODES.LOAD_RATIO,
        anchorRoleId: 'highBarSquat',
        exerciseIds: ['0032'],
        targetPct: 125,
      },
      {
        id: 'powerClean',
        label: 'Power clean',
        evaluationMode: EVALUATION_MODES.LOAD_RATIO,
        anchorRoleId: 'highBarSquat',
        exerciseIds: ['0648'],
        targetPct: 61,
      },
    ],
  },
  thibaudeauPowerlifting: {
    id: 'thibaudeauPowerlifting',
    label: 'Thibaudeau (Powerlifting)',
    roles: [
      {
        id: 'squat',
        label: 'Squat (anchor)',
        evaluationMode: EVALUATION_MODES.LOAD_RATIO,
        exerciseIds: ['0043', '1436'],
        targetPct: 100,
      },
      {
        id: 'bench',
        label: 'Bench press',
        evaluationMode: EVALUATION_MODES.LOAD_RATIO,
        anchorRoleId: 'squat',
        exerciseIds: ['0025'],
        targetPct: 75,
      },
      {
        id: 'deadlift',
        label: 'Deadlift',
        evaluationMode: EVALUATION_MODES.LOAD_RATIO,
        anchorRoleId: 'squat',
        exerciseIds: ['0032'],
        targetPct: 120,
      },
      {
        id: 'militaryPress',
        label: 'Military press',
        evaluationMode: EVALUATION_MODES.LOAD_RATIO,
        anchorRoleId: 'squat',
        exerciseIds: ['0091', '1456', '1457', '0086'],
        targetPct: 45,
      },
    ],
  },
  atg: {
    id: 'atg',
    label: 'ATG',
    roles: [
      {
        id: 'romanianDeadlift',
        label: 'Romanian deadlift (12 reps)',
        evaluationMode: EVALUATION_MODES.BODYWEIGHT_RATIO,
        exerciseIds: ['0085'],
        targetPct: 100,
        targetPctFemale: 80,
        reps: 12,
      },
      {
        id: 'goodMorning',
        label: 'Seated good morning (10 reps)',
        evaluationMode: EVALUATION_MODES.BODYWEIGHT_RATIO,
        exerciseIds: ['0090'],
        targetPct: 66,
        targetPctFemale: 40,
        reps: 10,
      },
      {
        id: 'stepUp',
        label: 'Poliquin step-up (15 reps)',
        evaluationMode: EVALUATION_MODES.BODYWEIGHT_RATIO,
        exerciseIds: ['0114', '0431'],
        targetPct: 50,
        targetPctFemale: 40,
        reps: 15,
      },
      {
        id: 'nordicCurl',
        label: 'Nordic curl (1 rep)',
        evaluationMode: EVALUATION_MODES.REP_COUNT,
        exerciseIds: ['3193'],
        repsTarget: 1,
      },
      {
        id: 'pullups',
        label: 'Pull-ups (10 reps, bodyweight)',
        evaluationMode: EVALUATION_MODES.REP_COUNT,
        exerciseIds: ['0652'],
        repsTarget: 10,
        repsTargetFemale: 1,
      },
      {
        id: 'atgDips',
        label: 'Dips (10 reps, bodyweight)',
        evaluationMode: EVALUATION_MODES.REP_COUNT,
        exerciseIds: ['0251'],
        repsTarget: 10,
      },
      {
        id: 'inclineDbPress',
        label: 'Incline DB press (each hand, 8 reps)',
        evaluationMode: EVALUATION_MODES.BODYWEIGHT_RATIO,
        exerciseIds: ['0314', '3545'],
        targetPct: 40,
        targetPctFemale: 20,
        reps: 8,
      },
      {
        id: 'dbShoulderPress',
        label: 'DB shoulder press (each hand, 8 reps)',
        evaluationMode: EVALUATION_MODES.BODYWEIGHT_RATIO,
        exerciseIds: ['0405', '0404', '0361', '0360'],
        targetPct: 33,
        targetPctFemale: 15,
        reps: 8,
      },
    ],
  },
};

const kgOf = (n: number | string, unit?: string): number =>
  unit === 'lb' ? Number(n) * LB_TO_KG : Number(n);

export function bodyweightKgOf(S?: { unit?: string; bodyweight?: { d: string; w: number }[] } | null): number | null {
  const entries = S?.bodyweight || [];
  if (!entries.length) return null;
  const last = entries.slice().sort((a, b) => String(a.d).localeCompare(String(b.d))).at(-1);
  if (!last || !(last.w > 0)) return null;
  return kgOf(last.w, S?.unit);
}

export const loadForReps = (oneRmKg: number, reps: number): number =>
  reps > 1 ? oneRmKg / (1 + reps / 30) : oneRmKg;

export function loadAtReps(loadKg: number | string, setReps: number | string, reps: number): number | null {
  const w = Number(loadKg);
  const r = Math.round(Number(setReps));
  if (!isFinite(w) || w <= 0 || !(r >= 1)) return null;
  if (r >= reps) return w;
  return loadForReps(r === 1 ? w : FORMULAS.epley(w, r), reps);
}

function unrounded1RM(loadKg: number, reps: number): number | null {
  if (estimate1RM(loadKg, reps) === null) return null;
  return reps === 1 ? loadKg : FORMULAS[DEFAULT_FORMULA](loadKg, Math.round(reps));
}

const EDGE_TOLERANCE_PCT = 1e-9;

export function classify(actualPct?: number | null, targetPct: number = 100): string {
  if (actualPct === null || actualPct === undefined || !isFinite(actualPct)) return BALANCE_STATUSES.NO_DATA;
  if (actualPct >= targetPct - EDGE_TOLERANCE_PCT) return BALANCE_STATUSES.BALANCED;
  if (actualPct >= targetPct - BORDERLINE_BAND_PCT - EDGE_TOLERANCE_PCT) return BALANCE_STATUSES.BORDERLINE;
  return BALANCE_STATUSES.WEAK;
}

export function targetFor(role: RoleDefinition, S?: { body?: string } | null): number {
  const female = S?.body === 'female';
  if (role.evaluationMode === EVALUATION_MODES.REP_COUNT) {
    return female && role.repsTargetFemale != null ? role.repsTargetFemale : (role.repsTarget ?? 10);
  }
  return female && role.targetPctFemale != null ? role.targetPctFemale : (role.targetPct ?? 100);
}

export function overrideKey(template: TemplateDefinition, role: RoleDefinition): string {
  return `${template.id}:${role.id}`;
}

export function overrideIdOf(value: unknown): string | null {
  if (typeof value === 'string') return value || null;
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === 'string' && id ? id : null;
  }
  return null;
}

export function withOverride(
  overrides: Record<string, unknown> | undefined,
  key: string,
  exId?: string | null,
  now: number = Date.now()
): Record<string, unknown> {
  return { ...(overrides || {}), [key]: { id: exId || null, _ts: now } };
}

const LIFTER_MOVEMENT = /\b(pull[- ]?ups?|chin[- ]?ups?|muscle[- ]?ups?|dips?)\b/i;
const BENCH_DIP_IDS = new Set(['1755']);

const isWarmupRow = (set: any): boolean => {
  if (!set) return false;
  if (set.warmup === true) return true;
  const phase = typeof set.phase === 'string' ? set.phase.trim().toLowerCase() : '';
  return phase === 'warmup' || phase === 'warm-up' || phase === 'warm_up';
};

const isSideSet = (set: any): boolean => Boolean(set && set.sides && (set.sides.L || set.sides.R));
const liftsOf = (set: any): any[] => {
  if (isSideSet(set)) {
    const sides: any[] = [];
    if (set.sides.L) sides.push(set.sides.L);
    if (set.sides.R) sides.push(set.sides.R);
    return sides;
  }
  return [set];
};

const isBw = (cfgOrId?: any): boolean => {
  if (!cfgOrId) return false;
  if (typeof cfgOrId === 'object' && typeof cfgOrId.bodyweight === 'boolean') return cfgOrId.bodyweight;
  const id = typeof cfgOrId === 'string' ? cfgOrId : cfgOrId.id;
  if (!id) return false;
  const ex = safeGetExerciseById(id);
  return Boolean(ex && (ex.equipment === 'body weight' || (ex as any).eq === 'body weight'));
};

const beltOnLifter = (id?: string | null): boolean => {
  if (!id) return false;
  const ex = safeGetExerciseById(id);
  const eq = ex?.equipment || (ex as any)?.eq;
  const n = ex?.name || (ex as any)?.n || '';
  return eq === 'weighted' && LIFTER_MOVEMENT.test(n) && !/\bbench/i.test(n) && !BENCH_DIP_IDS.has(id);
};

export const isAssistedEntry = (entry?: any): boolean => {
  if (!entry) return false;
  if (typeof entry.assisted === 'boolean') return entry.assisted;
  if (typeof entry.target?.assisted === 'boolean') return entry.target.assisted;
  const id = entry.id;
  if (!id) return false;
  const ex = safeGetExerciseById(id);
  if (!ex) return false;
  const eq = ex.equipment || (ex as any).eq;
  const name = ex.name || (ex as any).n || '';
  return eq === 'leverage machine' && /\bassist(ed)?\b/i.test(name);
};

const onLifter = (entry: any): boolean => {
  const bodyweight = entry.target?.bodyweight ?? entry.bodyweight;
  return bodyweight == null ? isBw(entry) || beltOnLifter(entry.id) : Boolean(bodyweight);
};

function setLoadKg(
  S: { unit?: string } | undefined,
  workout: { bw?: number } | undefined,
  entry: any,
  set: any,
  bodyweightKg: number | null
): number | null {
  const logged = kgOf(set.w || 0, S?.unit);
  const stamped = workout?.bw && Number(workout.bw) > 0 ? kgOf(workout.bw, S?.unit) : null;
  const body = stamped ?? bodyweightKg;

  if (isAssistedEntry(entry)) {
    if (!(logged > 0) || !(body && body > 0)) return null;
    return body - logged > 0 ? body - logged : null;
  }
  if (!onLifter(entry)) return logged > 0 ? logged : null;
  return body && body > 0 ? body + logged : null;
}

function waitsOnBodyweight(
  S: any,
  role: RoleDefinition,
  exerciseIds: string[],
  current: any,
  bodyweightKg: number | null
): boolean {
  if ((bodyweightKg && bodyweightKg > 0) || role.evaluationMode === EVALUATION_MODES.REP_COUNT) {
    return false;
  }
  if (current) {
    return role.evaluationMode === EVALUATION_MODES.BODYWEIGHT_RATIO;
  }
  return (S?.workouts || []).some((workout: any) =>
    !(workout?.bw && Number(workout.bw) > 0) &&
    (workout.entries || []).some(
      (entry: any) =>
        exerciseIds.includes(entry.id) &&
        (isAssistedEntry(entry) || onLifter(entry)) &&
        (entry.sets || []).some(
          (set: any) =>
            set.done &&
            !isWarmupRow(set) &&
            (!isAssistedEntry(entry) || kgOf(set.w || 0, S?.unit) > 0)
        )
    )
  );
}

export function resolveCurrent(
  S: {
    unit?: string;
    workouts?: {
      d: string;
      start?: number;
      bw?: number;
      entries?: {
        id?: string;
        target?: any;
        bodyweight?: boolean;
        sets?: any[];
      }[];
    }[];
  },
  exerciseIds: string[],
  bodyweightKg?: number | null,
  reps: number | null = null
): ResolvedCurrentLift | null {
  const key = reps && reps > 1 ? 'repsKg' : 'estKg';
  let best: ResolvedCurrentLift | null = null;

  for (const exId of exerciseIds) {
    for (const workout of S.workouts || []) {
      const entry = (workout.entries || []).find((e) => e && e.id === exId);
      if (!entry) continue;
      for (const set of entry.sets || []) {
        if (!set.done || isWarmupRow(set)) continue;
        for (const lift of liftsOf(set)) {
          if (isSideSet(set) && lift.done === false) continue;
          const loadKg = setLoadKg(S, workout, entry, lift, bodyweightKg ?? null);
          if (loadKg === null) continue;
          const setR = Math.round(Number(lift.r || 0));
          if (setR < 1) continue;

          const kg = reps && reps > 1 ? loadAtReps(loadKg, setR, reps) : unrounded1RM(loadKg, setR);
          if (kg === null) continue;

          if (!best || (best[key] ?? 0) < kg) {
            best = {
              [key]: kg,
              w: Number(lift.w) || 0,
              r: setR,
              d: workout.d,
              t: workout.start,
              exId,
            };
          }
        }
      }
    }
  }

  return best;
}

export function resolveCurrentReps(
  S: {
    workouts?: {
      d: string;
      start?: number;
      entries?: {
        id?: string;
        sets?: any[];
      }[];
    }[];
  },
  exerciseIds: string[]
): ResolvedCurrentLift | null {
  let best: ResolvedCurrentLift | null = null;
  for (const exId of exerciseIds) {
    for (const workout of S.workouts || []) {
      const entry = (workout.entries || []).find((e) => e && e.id === exId);
      if (!entry || isAssistedEntry(entry)) continue;
      for (const set of entry.sets || []) {
        if (!set.done || isWarmupRow(set)) continue;
        const reps = Math.round(
          isSideSet(set)
            ? Math.max(
                set.sides?.L?.done !== false ? Number(set.sides?.L?.r) || 0 : 0,
                set.sides?.R?.done !== false ? Number(set.sides?.R?.r) || 0 : 0
              )
            : Number(set.r || 0)
        );
        if (!isFinite(reps) || reps < 1) continue;
        if (!best || best.r < reps) {
          best = {
            r: reps,
            w: Number(set.w) || 0,
            d: workout.d,
            t: workout.start,
            exId,
          };
        }
      }
    }
  }
  return best;
}

export function ratioFor(
  role: RoleDefinition,
  current: ResolvedCurrentLift,
  ctx: { anchorCurrent?: ResolvedCurrentLift | null; bodyweightKg?: number | null; targetPct?: number }
): number | null {
  if (role.evaluationMode === EVALUATION_MODES.LOAD_RATIO) {
    if (!ctx.anchorCurrent || !((ctx.anchorCurrent.estKg ?? 0) > 0)) return null;
    return ((current.estKg ?? 0) / ctx.anchorCurrent.estKg!) * 100;
  }
  if (role.evaluationMode === EVALUATION_MODES.BODYWEIGHT_RATIO) {
    if (!(ctx.bodyweightKg && ctx.bodyweightKg > 0)) return null;
    const kg = role.reps && role.reps > 1 ? current.repsKg : current.estKg;
    return kg && kg > 0 ? (kg / ctx.bodyweightKg) * 100 : null;
  }
  return (current.r / (ctx.targetPct || 10)) * 100;
}

export function computeBalance(
  S: {
    unit?: string;
    body?: string;
    bodyweight?: { d: string; w: number }[];
    balanceOverrides?: Record<string, unknown>;
    workouts?: { d: string; start?: number; bw?: number; entries?: { id?: string; sets?: any[] }[] }[];
  },
  template: TemplateDefinition
): RoleEvaluationResult[] {
  const bodyweightKg = bodyweightKgOf(S);
  const currentByRoleId = new Map<string, ResolvedCurrentLift | null>();

  for (const role of template.roles) {
    const override = overrideIdOf(S.balanceOverrides?.[overrideKey(template, role)]);
    const ids = override ? [override] : role.exerciseIds;
    const current =
      role.evaluationMode === EVALUATION_MODES.REP_COUNT
        ? resolveCurrentReps(S, ids)
        : resolveCurrent(S, ids, bodyweightKg, role.evaluationMode === EVALUATION_MODES.BODYWEIGHT_RATIO ? (role.reps ?? null) : null);
    currentByRoleId.set(role.id, current);
  }

  return template.roles.map((role) => {
    const current = currentByRoleId.get(role.id) || null;
    const targetPct = targetFor(role, S);
    const classifyTarget = role.evaluationMode === EVALUATION_MODES.REP_COUNT ? 100 : targetPct;
    const override = overrideIdOf(S.balanceOverrides?.[overrideKey(template, role)]);
    const configuredExerciseId = override || role.exerciseIds[0] || null;
    const ids = override ? [override] : role.exerciseIds;
    const needsBodyweight = waitsOnBodyweight(S, role, ids, current, bodyweightKg);

    if (!current) {
      return {
        roleId: role.id,
        configuredExerciseId,
        mappedExerciseId: null,
        targetPct,
        actualPct: null,
        status: BALANCE_STATUSES.NO_DATA,
        current: null,
        isOverridden: Boolean(override),
        needsBodyweight,
        needsAnchor: false,
      };
    }

    const anchorCurrent = role.anchorRoleId ? currentByRoleId.get(role.anchorRoleId) : current;
    const actualPct = ratioFor(role, current, { anchorCurrent, bodyweightKg, targetPct });
    const needsAnchor = Boolean(
      role.anchorRoleId &&
        role.evaluationMode === EVALUATION_MODES.LOAD_RATIO &&
        !((anchorCurrent?.estKg ?? 0) > 0)
    );

    return {
      roleId: role.id,
      configuredExerciseId,
      mappedExerciseId: current.exId || null,
      targetPct,
      actualPct,
      status: classify(actualPct, classifyTarget),
      current,
      isOverridden: Boolean(override),
      needsBodyweight,
      needsAnchor,
    };
  });
}


export interface LiftRecord {
  weight: number;
  reps: number;
  rir?: number;
}

export interface PostureRatioCheck {
  id: string;
  label: string;
  targetRatioPct: number;
  observedRatioPct: number | null;
  status: BalanceStatus;
  primaryAnchor1RM: number | null;
  secondaryLift1RM: number | null;
  feedback: string;
}

/**
 * Direct evaluation helper for two lifts, backwards compatible with tests and UI.
 */
export function evaluateStructuralRatio(
  anchorRecord: LiftRecord | null,
  secondaryRecord: LiftRecord | null,
  targetRatioPct: number,
  label: string,
  id: string
): PostureRatioCheck {
  if (!anchorRecord || !secondaryRecord) {
    return {
      id,
      label,
      targetRatioPct,
      observedRatioPct: null,
      status: 'insufficient_data',
      primaryAnchor1RM: null,
      secondaryLift1RM: null,
      feedback: 'Log at least one working set for both lifts to calculate ratio balance.',
    };
  }

  const anchor1RM = estimate1RM(anchorRecord.weight, anchorRecord.reps, { rir: anchorRecord.rir });
  const secondary1RM = estimate1RM(secondaryRecord.weight, secondaryRecord.reps, { rir: secondaryRecord.rir });

  if (!anchor1RM || !secondary1RM || anchor1RM <= 0) {
    return {
      id,
      label,
      targetRatioPct,
      observedRatioPct: null,
      status: 'insufficient_data',
      primaryAnchor1RM: anchor1RM,
      secondaryLift1RM: secondary1RM,
      feedback: 'Sets fall outside predictable 1RM calculation boundaries.',
    };
  }

  const observedRatioPct = Math.round((secondary1RM / anchor1RM) * 100);
  const diff = observedRatioPct - targetRatioPct;

  let status: BalanceStatus = 'balanced';
  let feedback = 'Optimal structural balance. Postural injury risk low.';

  if (diff < -10) {
    status = 'weak';
    feedback = `Lagging behind optimal balance by ${Math.abs(diff)}%. Prioritize this movement pattern to prevent postural imbalance.`;
  } else if (diff < -4) {
    status = 'borderline';
    feedback = `Borderline structural ratio. Near target (${targetRatioPct}%).`;
  } else if (diff > 15) {
    feedback = 'Stronger than baseline relative to anchor. Solid posture support.';
  }

  return {
    id,
    label,
    targetRatioPct,
    observedRatioPct,
    status,
    primaryAnchor1RM: anchor1RM,
    secondaryLift1RM: secondary1RM,
    feedback,
  };
}
