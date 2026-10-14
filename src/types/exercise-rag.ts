/**
 * @file exercise-rag.ts
 * @description Type definitions for Vyra's Agentic Biomechanical RAG Engine
 */

export type ExerciseCategory = 
  | 'strength' 
  | 'stretching' 
  | 'mobility' 
  | 'yoga' 
  | 'calisthenics' 
  | 'cardio' 
  | 'plyometrics'
  | 'olympic'
  | 'pilates'
  | 'combat'
  | 'isometric'
  | 'rehab'
  | string;

export interface ExerciseMuscleMap {
  primaries?: string[];
  secondaries?: string[];
  weights?: Record<string, number>;
  bodyPart?: string;
}

export interface RagExercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondaryMuscles: string[];
  category: ExerciseCategory;
  description: string;
  instructions: string[];
  muscleMap?: ExerciseMuscleMap;
  femaleVariant?: string;
  maleVariant?: string;
  variantOf?: string;
  textSource?: string;
}

export interface ExerciseQueryConstraints {
  availableEquipment?: string[];
  targetMuscle?: string;
  secondaryMuscles?: string[];
  bodyPart?: string;
  category?: ExerciseCategory;
  excludedEquipment?: string[];
  injuryFlags?: string[]; // e.g. 'shoulder_impingement', 'lower_back_pain'
  searchTerm?: string;
  limit?: number;
}

export interface EvaluationReport {
  isCompliant: boolean;
  equipmentComplianceRate: number; // 0 to 1.0 (must be 1.0)
  hallucinatedIds: string[];
  structuralBalanceScore: number; // Ratio of push to pull volume
  volumeViolations: {
    muscle: string;
    totalWeeklySets: number;
    violationType: 'under_mev' | 'over_mrv';
  }[];
  errors: string[];
}
