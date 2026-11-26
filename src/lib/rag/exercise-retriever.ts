/**
 * @file exercise-retriever.ts
 * @description Biomechanical retrieval and constraint-satisfaction engine.
 * Implements deterministic pre-filtering (equipment, injury safety) and anatomical scoring.
 */

import { RagExercise, ExerciseQueryConstraints } from '@/types/exercise-rag';
import { loadSafeExerciseCatalogue } from '@/lib/ai/catalogue-bridge';

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

  const apparatusGroups = constraints.apparatusGroups
    ? new Set(constraints.apparatusGroups.map(norm))
    : null;
  const hardwareDetails = constraints.hardwareDetails
    ? new Set(constraints.hardwareDetails.map(norm))
    : null;
  const muscleSubdivision = norm(constraints.muscleSubdivision);
  const movementPattern = norm(constraints.movementPattern);
  const mechanics = norm(constraints.mechanics);
  const resistanceProfile = norm(constraints.resistanceProfile);

  const axialRank: Record<string, number> = { none: 0, low: 1, moderate: 2, high: 3 };
  const maxAxialNum = constraints.maxAxialLoading
    ? axialRank[norm(constraints.maxAxialLoading)] ?? 3
    : null;

  // 1. HARD PRE-FILTERING (Deterministic constraint gate)
  const filtered = pool.filter((ex) => {
    const exEq = norm(ex.equipment);
    const exApp = norm(ex.apparatusGroup);
    const exHard = norm(ex.hardwareDetail);

    // Equipment compliance check
    if (allowedEquipment && !allowedEquipment.has(exEq) && exEq !== 'body weight' && exEq !== 'none') {
      return false;
    }

    if (excludedEquipment.has(exEq)) {
      return false;
    }

    // Apparatus Group check
    if (apparatusGroups && exApp && !apparatusGroups.has(exApp)) {
      return false;
    }

    // Hardware Detail check
    if (hardwareDetails && exHard && !hardwareDetails.has(exHard)) {
      return false;
    }

    // Movement pattern check
    if (movementPattern && norm(ex.movementPattern) !== movementPattern) {
      return false;
    }

    // Mechanics check (compound vs isolation)
    if (mechanics && norm(ex.mechanics) !== mechanics) {
      return false;
    }

    // Resistance profile check
    if (resistanceProfile && norm(ex.resistanceProfile) !== resistanceProfile) {
      return false;
    }

    // Axial spinal load check
    if (maxAxialNum !== null && ex.axialLoading) {
      const curAxialNum = axialRank[norm(ex.axialLoading)] ?? 0;
      if (curAxialNum > maxAxialNum) {
        return false;
      }
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

    // Muscle subdivision requirement if specified
    if (muscleSubdivision && norm(ex.muscleSubdivision) !== muscleSubdivision) {
      return false;
    }

    return true;
  });

  // 2. SCORING & ANATOMICAL RANKING
  const scored = filtered.map((ex) => {
    let score = 0;
    const exTarget = norm(ex.target);
    const exName = norm(ex.name);
    const exSub = norm(ex.muscleSubdivision);

    // Exact muscle subdivision match
    if (muscleSubdivision && exSub === muscleSubdivision) {
      score += 60;
    }

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

/**
 * Returns the compiled exercise catalogue from memory or loads from disk safely.
 */
export function getCompiledCatalogue(): RagExercise[] {
  return loadSafeExerciseCatalogue();
}

