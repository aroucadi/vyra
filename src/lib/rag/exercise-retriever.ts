/**
 * @file exercise-retriever.ts
 * @description Biomechanical retrieval and constraint-satisfaction engine.
 * Implements deterministic pre-filtering (equipment, injury safety) and anatomical scoring.
 */

import { RagExercise, ExerciseQueryConstraints } from '@/types/exercise-rag';

// Normalize strings for matching
const norm = (s?: string) => (s ? s.trim().toLowerCase() : '');

/**
 * Deterministically filters and scores exercises according to equipment, injury safety, and anatomical targets.
 */
export function filterAndRankExercises(
  pool: RagExercise[],
  constraints: ExerciseQueryConstraints
): RagExercise[] {
  const allowedEquipment = constraints.availableEquipment
    ? new Set(constraints.availableEquipment.map(norm))
    : null;

  const excludedEquipment = constraints.excludedEquipment
    ? new Set(constraints.excludedEquipment.map(norm))
    : new Set<string>();

  const injuryFlags = new Set((constraints.injuryFlags || []).map(norm));
  const targetMuscle = norm(constraints.targetMuscle);
  const bodyPart = norm(constraints.bodyPart);
  const category = constraints.category ? norm(constraints.category) : null;
  const searchTerm = norm(constraints.searchTerm);

  // 1. HARD PRE-FILTERING (Deterministic constraint gate)
  const filtered = pool.filter((ex) => {
    const exEq = norm(ex.equipment);

    // Equipment compliance check
    if (allowedEquipment && !allowedEquipment.has(exEq) && exEq !== 'body weight' && exEq !== 'none') {
      return false;
    }

    if (excludedEquipment.has(exEq)) {
      return false;
    }

    // Category check
    if (category && norm(ex.category) !== category) {
      return false;
    }

    // Body part check
    if (bodyPart && norm(ex.bodyPart) !== bodyPart) {
      return false;
    }

    // INJURY SAFETY RULES (Hard guardrails)
    if (injuryFlags.has('shoulder_impingement') || injuryFlags.has('shoulder_pain')) {
      const name = norm(ex.name);
      if (
        name.includes('behind neck') ||
        name.includes('upright row') ||
        (name.includes('overhead') && exEq === 'barbell')
      ) {
        return false;
      }
    }

    if (injuryFlags.has('lower_back_pain') || injuryFlags.has('lumbar_disc')) {
      const name = norm(ex.name);
      // Exclude heavy spinal axial compression movements
      if (
        (name.includes('deadlift') && !name.includes('trap bar')) ||
        (name.includes('good morning')) ||
        (name.includes('barbell squat') && !name.includes('hack'))
      ) {
        return false;
      }
    }

    // Target muscle requirement if specified
    if (targetMuscle) {
      const matchesTarget =
        norm(ex.target) === targetMuscle ||
        ex.secondaryMuscles.some((m) => norm(m) === targetMuscle);
      if (!matchesTarget) return false;
    }

    return true;
  });

  // 2. SCORING & ANATOMICAL RANKING
  const scored = filtered.map((ex) => {
    let score = 0;
    const exTarget = norm(ex.target);
    const exName = norm(ex.name);

    // Exact or partial target muscle match
    if (targetMuscle) {
      if (exTarget === targetMuscle) {
        score += 50;
      } else if (ex.secondaryMuscles.some((m) => norm(m) === targetMuscle)) {
        score += 25;
      }
      // Leverage muscleMap weights if present
      if (ex.muscleMap?.weights && ex.muscleMap.weights[targetMuscle]) {
        score += Math.round(ex.muscleMap.weights[targetMuscle] * 30);
      }
    }

    // Search term relevance
    if (searchTerm) {
      if (exName.includes(searchTerm)) {
        score += 40;
      } else if (exTarget.includes(searchTerm)) {
        score += 20;
      }
    }

    return { ex, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  const limit = constraints.limit ?? 20;
  return scored.slice(0, limit).map((s) => s.ex);
}

let cachedCatalogue: RagExercise[] | null = null;

/**
 * Returns the compiled exercise catalogue from memory or loads from disk (Node/server environment).
 */
export function getCompiledCatalogue(): RagExercise[] {
  if (cachedCatalogue && cachedCatalogue.length > 0) {
    return cachedCatalogue;
  }

  try {
    // Dynamic require in Node environment
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('node:path');
    const filePath = path.resolve(process.cwd(), 'public', 'data', 'exercise-catalogue.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      cachedCatalogue = data;
      return cachedCatalogue || [];
    }
  } catch {
    // Fallback if running client-side or during bundle
  }

  return [];
}

