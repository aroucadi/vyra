/**
 * @file plates.ts
 * @description Plate loading and rack distribution calculator ported from OpenGym.
 * Calculates exact per-side plate breakdowns for standard Olympic bars (20kg), Women's bars (15kg),
 * and Smith machines (0-15kg) based on available plate inventory.
 */

import { weightIncrement } from './progression';

function safeGetExerciseById(id: string) {
  if (typeof window !== 'undefined') return null;
  try {
    const { getExerciseById } = require('../rag/catalogue-loader');
    return getExerciseById(id);
  } catch {
    return null;
  }
}

export type WeightUnit = 'kg' | 'lb';

export interface PlateItem {
  w: number;
  n: number;
}

export const PLATE_SIZES: Record<WeightUnit, number[]> = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25, 0.5],
  lb: [45, 35, 25, 15, 10, 5, 2.5, 1.25],
};

const UNCOMMON: Record<WeightUnit, Set<number>> = {
  kg: new Set([0.5]),
  lb: new Set([15, 1.25]),
};

export const DEFAULT_PAIRS = 6;

export const DEFAULT_BAR_KG: Record<string, number> = {
  barbell: 20,
  'olympic barbell': 20,
  'womens barbell': 15,
  'ez barbell': 10,
  'smith machine': 9,
  'trap bar': 25,
};

export const DEFAULT_BAR_LB: Record<string, number> = {
  barbell: 45,
  'olympic barbell': 45,
  'womens barbell': 35,
  'ez barbell': 25,
  'smith machine': 20,
  'trap bar': 55,
};

export const DEFAULT_BAR_WEIGHT: Record<WeightUnit, number> = {
  kg: 20,
  lb: 45,
};

const SINGLE_EQ = new Set(['weighted', 'sled machine']);
const BAR_EQ = new Set(['barbell', 'olympic barbell', 'womens barbell', 'ez barbell', 'smith machine', 'trap bar']);

const num = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0;

const unitOf = (S?: { unit?: string } | null): WeightUnit =>
  S?.unit === 'lb' ? 'lb' : 'kg';

export interface PlateState {
  unit?: string;
  plates?: Record<string, Record<string | number, number | string | undefined>>;
  loadKind?: Record<string, string | { kind?: string | null; _ts?: number }>;
  barWeights?: Record<string, number>;
}

const sizesOf = (entry?: Record<string | number, unknown>): [string, unknown][] =>
  entry && typeof entry === 'object' && !Array.isArray(entry)
    ? Object.entries(entry).filter(([k]) => num(k) > 0)
    : [];

export const ownsPlates = (S?: PlateState | null): boolean =>
  sizesOf(S?.plates?.[unitOf(S)]).length > 0;

export function inventoryFor(S?: PlateState | null): PlateItem[] {
  const unit = unitOf(S);
  const own = sizesOf(S?.plates?.[unit]);
  const out: PlateItem[] = [];

  if (own.length) {
    for (const [k, v] of own) {
      const w = num(k);
      const n = Math.floor(num(v));
      if (w > 0 && n > 0) out.push({ w, n });
    }
  } else {
    for (const w of PLATE_SIZES[unit]) {
      if (!UNCOMMON[unit].has(w)) out.push({ w, n: DEFAULT_PAIRS });
    }
  }

  return out.sort((a, b) => b.w - a.w);
}

export function withPlatePairs(
  S: PlateState | undefined,
  w: number,
  n: number,
  now: number = Date.now()
): Record<string, unknown> {
  const unit = unitOf(S);
  const list = ownsPlates(S)
    ? Object.fromEntries(sizesOf(S?.plates?.[unit]))
    : Object.fromEntries(inventoryFor(S).map((p) => [p.w, p.n]));

  list[w] = Math.max(0, Math.round(num(n)));
  return { ...(S?.plates || {}), [unit]: { ...list, _ts: now } };
}

export const withStandardPlates = (
  S: PlateState | undefined,
  now: number = Date.now()
): Record<string, unknown> => ({
  ...(S?.plates || {}),
  [unitOf(S)]: { _ts: now },
});

export function loadKindOf(value: unknown): 'pairs' | 'single' | 'none' | null {
  const k = value && typeof value === 'object' ? (value as { kind?: unknown }).kind : value;
  return k === 'pairs' || k === 'single' || k === 'none' ? k : null;
}

export const withLoadKind = (
  map: Record<string, unknown> | undefined,
  exId: string,
  kind: unknown,
  now: number = Date.now()
): Record<string, unknown> => ({
  ...(map || {}),
  [exId]: { kind: loadKindOf(kind), _ts: now },
});

export const pairsOf = (S: PlateState | undefined, w: number): number =>
  inventoryFor(S).find((p) => p.w === w)?.n || 0;

// Quarter-unit scaling factor for exact floating point math
const Q = 4;
const q = (w: number) => Math.round(w * Q);

export interface PlateStackResult {
  plates: number[];
  missing: number;
}

/**
 * Computes exact plate layout for target weight given inventory.
 */
export function plateStack(weight: number | null | undefined, inv?: PlateItem[]): PlateStackResult {
  const requested = Math.max(0, num(weight));
  const target = Math.floor(requested * Q);
  if (target === 0) return { plates: [], missing: requested };

  const items = (inv || []).filter((p) => p.w > 0 && p.n > 0).sort((a, b) => b.w - a.w);

  // 1. Greedy search
  const greedy: number[] = [];
  let left = target;
  for (const p of items) {
    const unit = q(p.w);
    let k = Math.min(p.n, Math.floor(left / unit));
    while (k-- > 0) {
      greedy.push(p.w);
      left -= unit;
    }
  }

  const all = items.reduce((sum, p) => sum + q(p.w) * p.n, 0);
  if (left === 0 || target >= all) {
    return { plates: greedy, missing: requested - (target - left) / Q };
  }

  // 2. Exact fit dynamic programming: f[i][s] = min plates using sizes i.. to make s
  const n = items.length;
  const INF = 1e9;
  const f: Int32Array[] = Array.from({ length: n + 1 }, () => new Int32Array(target + 1).fill(INF));
  f[n][0] = 0;

  for (let i = n - 1; i >= 0; i--) {
    const unit = q(items[i].w);
    const cap = items[i].n;
    for (let s = 0; s <= target; s++) {
      let best = f[i + 1][s];
      for (let k = 1; k <= cap && k * unit <= s; k++) {
        const v = f[i + 1][s - k * unit];
        if (v + k < best) best = v + k;
      }
      f[i][s] = best;
    }
  }

  let sum = target;
  while (sum > 0 && f[0][sum] >= INF) sum--;

  const plates: number[] = [];
  let s = sum;
  for (let i = 0; i < n; i++) {
    const unit = q(items[i].w);
    const cap = items[i].n;
    for (let k = Math.min(cap, Math.floor(s / unit)); k >= 0; k--) {
      if (f[i + 1][s - k * unit] + k === f[i][s]) {
        for (let j = 0; j < k; j++) plates.push(items[i].w);
        s -= k * unit;
        break;
      }
    }
  }

  return { plates, missing: requested - sum / Q };
}

export function plateDelta(
  prev: number[] | undefined,
  next: number[] | undefined
): { strip: number[]; add: number[] } {
  const count = (arr?: number[]) => {
    const m = new Map<number, number>();
    for (const w of arr || []) m.set(w, (m.get(w) || 0) + 1);
    return m;
  };

  const a = count(prev);
  const b = count(next);
  const strip: number[] = [];
  const add: number[] = [];

  for (const [w, n] of a) {
    for (let i = 0; i < n - (b.get(w) || 0); i++) strip.push(w);
  }
  for (const [w, n] of b) {
    for (let i = 0; i < n - (a.get(w) || 0); i++) add.push(w);
  }

  const desc = (x: number, y: number) => y - x;
  return { strip: strip.sort(desc), add: add.sort(desc) };
}

export function defaultBarWeight(eq?: string, unit?: string): number | null {
  if (!eq) return null;
  const map = unit === 'lb' ? DEFAULT_BAR_LB : DEFAULT_BAR_KG;
  return map[eq] ?? null;
}

interface ResolvedEx {
  id?: string;
  eq?: string;
  bodyweight?: boolean;
}

function resolveExercise(
  exOrId?: { id?: string; eq?: string; equipment?: string; bodyweight?: boolean } | string | null
): ResolvedEx | null {
  if (!exOrId) return null;
  if (typeof exOrId === 'object') {
    let eq = exOrId.eq || exOrId.equipment || '';
    if (!eq && exOrId.id && BAR_EQ.has(exOrId.id)) {
      eq = exOrId.id;
    }
    if (exOrId.id && (!eq || typeof exOrId.bodyweight !== 'boolean')) {
      const found = safeGetExerciseById(exOrId.id);
      if (found) {
        return {
          id: exOrId.id,
          eq: eq || found.equipment || '',
          bodyweight: typeof exOrId.bodyweight === 'boolean' ? exOrId.bodyweight : found.equipment === 'body weight',
        };
      }
    }
    return { id: exOrId.id, eq, bodyweight: exOrId.bodyweight };
  }

  // String argument: could be an equipment name (e.g. 'barbell', 'dumbbell') OR an exercise ID (e.g. '0032')
  const str = String(exOrId);
  const found = safeGetExerciseById(str);
  if (found) {
    return {
      id: found.id,
      eq: found.equipment || '',
      bodyweight: found.equipment === 'body weight',
    };
  }

  return { id: str, eq: str, bodyweight: false };
}

export const isNoBar = (S: PlateState | undefined, exId: string): boolean =>
  (S?.barWeights || {})[exId] === 0;

export const hasBarOverride = (S: PlateState | undefined, exId: string): boolean => {
  const own = (S?.barWeights || {})[exId];
  return own === 0 || (typeof own === 'number' && own > 0);
};

export function barWeightFor(
  S: PlateState | undefined,
  exOrId?: { id?: string; eq?: string; equipment?: string } | string | null
): number | null {
  const resolved = resolveExercise(exOrId);
  if (!resolved || !BAR_EQ.has(resolved.eq || '')) return null;
  const own = resolved.id ? (S?.barWeights || {})[resolved.id] : undefined;
  if (own === 0) return 0;
  if (typeof own === 'number' && own > 0) return own;
  return defaultBarWeight(resolved.eq, S?.unit);
}

export function plateSplit(total: number | null | undefined, bar: number | null | undefined): number | null {
  const tot = num(total);
  const b = num(bar);
  if (!(tot > 0) || !(b >= 0) || bar === null || bar === undefined || tot <= b) return null;
  return Math.round(((tot - b) / 2) * 100) / 100;
}

export function usesBar(
  exOrId?: { id?: string; eq?: string; equipment?: string } | string | null
): boolean {
  const resolved = resolveExercise(exOrId);
  return Boolean(resolved?.eq && BAR_EQ.has(resolved.eq));
}

export function loadKindFor(
  S: PlateState | undefined,
  cfgOrId: { id?: string; eq?: string; equipment?: string; bodyweight?: boolean } | string | null | undefined
): 'pairs' | 'single' | 'none' {
  const cfg = typeof cfgOrId === 'string' ? { id: cfgOrId } : cfgOrId || {};
  const own = cfg.id ? loadKindOf(S?.loadKind?.[cfg.id]) : null;
  if (own) return own;

  const resolved = resolveExercise(cfgOrId);
  const eq = resolved?.eq || '';

  if (usesBar(resolved)) return 'pairs';
  if (eq === 'band' || eq === 'resistance band') return 'none';

  const isBw = typeof cfg.bodyweight === 'boolean' ? cfg.bodyweight : eq === 'body weight';
  if (SINGLE_EQ.has(eq) || isBw) return 'single';

  return 'none';
}

export function baseWeightFor(
  S: PlateState | undefined,
  exOrId?: { id?: string; eq?: string; equipment?: string } | string | null
): number {
  const resolved = resolveExercise(exOrId);
  if (!resolved) return 0;

  if (resolved.id && S?.barWeights && resolved.id in S.barWeights) {
    const own = S.barWeights[resolved.id];
    if (typeof own === 'number' && own >= 0) return own;
  }

  if (resolved.eq) {
    return defaultBarWeight(resolved.eq, S?.unit) ?? 0;
  }
  return 0;
}

export interface RowLoadResult {
  kind: 'pairs' | 'single';
  barOnly: boolean;
  perSide: number;
  plates: number[];
  missing: number;
}

export function rowLoad(
  kind: 'pairs' | 'single' | 'none' | null | undefined,
  weight: number | string | null | undefined,
  base: number | string | null | undefined,
  inv?: PlateItem[]
): RowLoadResult | null {
  if (kind !== 'pairs' && kind !== 'single') return null;
  const w = num(weight);
  if (!(w > 0)) return null;

  const b = Math.max(0, num(base));
  if (w <= b) return { kind, barOnly: true, perSide: 0, plates: [], missing: 0 };

  const perSide = Math.round(((w - b) / (kind === 'pairs' ? 2 : 1)) * 100) / 100;
  const stock = kind === 'single' ? (inv || []).map((p) => ({ ...p, n: p.n * 2 })) : inv;
  const { plates, missing } = plateStack(perSide, stock);

  return { kind, barOnly: false, perSide, plates, missing };
}

export const sameLoad = (a?: RowLoadResult | null, b?: RowLoadResult | null): boolean =>
  Boolean(
    a &&
      b &&
      a.barOnly === b.barOnly &&
      a.missing === b.missing &&
      a.plates.length === b.plates.length &&
      a.plates.every((w, i) => w === b.plates[i])
  );

export function dropGrid(
  S: PlateState | undefined,
  cfg?: { id?: string; eq?: string; inc?: number }
): number | ((w: number) => number) {
  const kind = loadKindFor(S, cfg);
  if (ownsPlates(S) && (kind === 'pairs' || kind === 'single')) {
    const base = baseWeightFor(S, cfg);
    const inv = inventoryFor(S);
    const per = kind === 'pairs' ? 2 : 1;
    return (w: number) => {
      if (w <= base) return base > 0 ? base : w;
      const res = rowLoad(kind, w, base, inv);
      if (!res) return w;
      return base + per * Math.max(0, res.perSide - res.missing);
    };
  }
  return weightIncrement(cfg, S?.unit === 'lb' ? 'lb' : 'kg');
}

export interface PlateLoadResult {
  barWeight: number;
  weightPerSide: number;
  platesPerSide: number[];
  remainder: number;
}

/**
 * Convenient barbell plate calculator used by UI components and tests.
 */
export function calculateBarbellPlates(
  targetTotalWeight: number,
  unit: WeightUnit = 'kg',
  barWeight?: number,
  availablePlates?: number[]
): PlateLoadResult {
  const bar = barWeight ?? DEFAULT_BAR_WEIGHT[unit];
  const inv: PlateItem[] = availablePlates && availablePlates.length > 0
    ? availablePlates.map((w) => ({ w, n: DEFAULT_PAIRS }))
    : PLATE_SIZES[unit].filter((w) => !UNCOMMON[unit].has(w)).map((w) => ({ w, n: DEFAULT_PAIRS }));

  if (targetTotalWeight <= bar) {
    return {
      barWeight: bar,
      weightPerSide: 0,
      platesPerSide: [],
      remainder: 0,
    };
  }

  const res = rowLoad('pairs', targetTotalWeight, bar, inv);
  return {
    barWeight: bar,
    weightPerSide: (targetTotalWeight - bar) / 2,
    platesPerSide: res ? res.plates : [],
    remainder: res ? Math.round(res.missing * 2 * 100) / 100 : 0,
  };
}
