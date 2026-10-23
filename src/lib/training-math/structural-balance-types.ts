/**
 * @file structural-balance-types.ts
 * @description Pure types and constants for structural balance and postural symmetry.
 * Decoupled from node runtime and catalogue loading so client components can import safely.
 */

export const EVALUATION_MODES = Object.freeze({
  LOAD_RATIO: 'load-ratio',
  BODYWEIGHT_RATIO: 'bodyweight-ratio',
  REP_COUNT: 'rep-count',
});

export const BALANCE_STATUSES = Object.freeze({
  BALANCED: 'balanced',
  BORDERLINE: 'borderline',
  WEAK: 'weak',
  NO_DATA: 'no-data',
});

export type BalanceStatus = (typeof BALANCE_STATUSES)[keyof typeof BALANCE_STATUSES] | 'insufficient_data';

export const BORDERLINE_BAND_PCT = 5;
export const LB_TO_KG = 0.45359237;

export interface RoleDefinition {
  id: string;
  label: string;
  evaluationMode: string;
  exerciseIds: string[];
  anchorRoleId?: string;
  targetPct?: number;
  targetPctFemale?: number;
  reps?: number;
  repsTarget?: number;
  repsTargetFemale?: number;
}

export interface TemplateDefinition {
  id: string;
  label: string;
  roles: RoleDefinition[];
}

export interface ResolvedCurrentLift {
  estKg?: number;
  repsKg?: number;
  w: number;
  r: number;
  d: string;
  t?: number;
  exId?: string;
}

export interface RoleEvaluationResult {
  roleId: string;
  configuredExerciseId: string | null;
  mappedExerciseId?: string | null;
  targetPct: number;
  actualPct: number | null;
  status: string;
  current: ResolvedCurrentLift | null;
  isOverridden: boolean;
  needsBodyweight: boolean;
  needsAnchor: boolean;
}
