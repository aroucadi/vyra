/**
 * @file agentic-evaluator.ts
 * @description Industry-standard Evaluation Harness for Agentic Program Generation.
 * Asserts equipment compliance, absence of hallucinated IDs, and RP periodization sanity.
 */

import { RagExercise, EvaluationReport } from '@/types/exercise-rag';

export interface GeneratedPrescriptionItem {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
}

export interface GeneratedDayPlan {
  dayLabel: string;
  exercises: GeneratedPrescriptionItem[];
}

export interface GeneratedMesocycle {
  title: string;
  days: GeneratedDayPlan[];
}

// Renaissance Periodization Weekly Hypertrophy Landmark Bounds
export const VOLUME_BOUNDS = {
  MEV: 6,  // Minimum Effective Volume
  MRV: 22, // Maximum Recoverable Volume
};

/**
 * Runs deterministic evaluators across generated training programs.
 */
export function evaluateGeneratedProgram(
  mesocycle: GeneratedMesocycle,
  validCatalogue: Map<string, RagExercise>,
  allowedEquipment: string[]
): EvaluationReport {
  const allowedSet = new Set(allowedEquipment.map((e) => e.trim().toLowerCase()));
  const errors: string[] = [];
  const hallucinatedIds: string[] = [];
  let totalPrescribed = 0;
  let compliantEquipmentCount = 0;

  const weeklySetsPerMuscle: Record<string, number> = {};
  let pushSets = 0;
  let pullSets = 0;

  for (const day of mesocycle.days) {
    for (const item of day.exercises) {
      totalPrescribed++;
      const exercise = validCatalogue.get(item.exerciseId);

      if (!exercise) {
        hallucinatedIds.push(item.exerciseId);
        errors.push(`Hallucinated exercise ID detected: ${item.exerciseId} (${item.name})`);
        continue;
      }

      const eq = exercise.equipment.toLowerCase();
      if (allowedSet.has(eq) || eq === 'body weight' || eq === 'none') {
        compliantEquipmentCount++;
      } else {
        errors.push(
          `Equipment violation: Exercise "${exercise.name}" requires "${exercise.equipment}", which is not in trainee inventory.`
        );
      }

      // Track weekly sets per muscle
      const muscle = exercise.target.toLowerCase();
      weeklySetsPerMuscle[muscle] = (weeklySetsPerMuscle[muscle] || 0) + item.sets;

      // Classify push vs pull for structural balance
      const bodyPart = exercise.bodyPart.toLowerCase();
      if (bodyPart === 'chest' || bodyPart === 'shoulders') {
        pushSets += item.sets;
      } else if (bodyPart === 'back') {
        pullSets += item.sets;
      }
    }
  }

  const equipmentComplianceRate =
    totalPrescribed > 0 ? compliantEquipmentCount / totalPrescribed : 1.0;

  const volumeViolations: EvaluationReport['volumeViolations'] = [];
  for (const [muscle, sets] of Object.entries(weeklySetsPerMuscle)) {
    if (sets < VOLUME_BOUNDS.MEV) {
      volumeViolations.push({ muscle, totalWeeklySets: sets, violationType: 'under_mev' });
    } else if (sets > VOLUME_BOUNDS.MRV) {
      volumeViolations.push({ muscle, totalWeeklySets: sets, violationType: 'over_mrv' });
      errors.push(`Volume overload: ${muscle} has ${sets} sets, exceeding MRV ceiling of ${VOLUME_BOUNDS.MRV}.`);
    }
  }

  const structuralBalanceScore = pullSets > 0 ? Math.round((pushSets / pullSets) * 100) / 100 : 1.0;

  const isCompliant =
    equipmentComplianceRate === 1.0 &&
    hallucinatedIds.length === 0 &&
    volumeViolations.every((v) => v.violationType !== 'over_mrv');

  return {
    isCompliant,
    equipmentComplianceRate,
    hallucinatedIds,
    structuralBalanceScore,
    volumeViolations,
    errors,
  };
}
