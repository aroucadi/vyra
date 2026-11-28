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

export type ApparatusGroup =
  | 'bodyweight'
  | 'dumbbell'
  | 'barbell'
  | 'cable'
  | 'machine'
  | 'smith_machine'
  | 'kettlebell'
  | 'band'
  | 'plate'
  | 'other';

export type HardwareDetail =
  | 'bodyweight'
  | 'dumbbell'
  | 'barbell'
  | 'pin_selectorized'
  | 'plate_loaded'
  | 'cable_stack'
  | 'smith_machine'
  | 'kettlebell'
  | 'resistance_band'
  | 'ez_barbell'
  | 'trap_bar'
  | 'landmine'
  | 'weight_plate'
  | 'suspension_trainer'
  | 'cardio_machine'
  | 'calisthenic_bar'
  | 'bench'
  | 'other';

export type MovementPattern =
  | 'horizontal_push'
  | 'horizontal_pull'
  | 'vertical_push'
  | 'vertical_pull'
  | 'squat'
  | 'hip_hinge'
  | 'lunge'
  | 'isolation'
  | 'carry'
  | 'core_flexion'
  | 'core_rotation'
  | 'core_stability'
  | 'cardio';

export type MechanicsType = 'compound' | 'isolation';
export type PlaneOfMotion = 'sagittal' | 'frontal' | 'transverse' | 'multiplanar';
export type KineticChain = 'open_chain' | 'closed_chain';
export type ResistanceProfile = 'lengthened' | 'shortened' | 'constant' | 'ascending';
export type AxialLoadingLevel = 'none' | 'low' | 'moderate' | 'high';
export type JointStressLevel = 'low' | 'moderate' | 'high';
export type DifficultyTier = 'beginner' | 'intermediate' | 'advanced';

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
  videoUrl?: string;
  clipUrl?: string;
  stillUrl?: string;
  imageUrl?: string;

  // Enriched Biomechanical Metadata for Agentic Swapping & AI Reasoning
  apparatusGroup?: ApparatusGroup;
  hardwareDetail?: HardwareDetail;
  primaryMuscles?: string[];
  muscleSubdivision?: string;
  movementPattern?: MovementPattern;
  mechanics?: MechanicsType;
  planeOfMotion?: PlaneOfMotion;
  kineticChain?: KineticChain;
  resistanceProfile?: ResistanceProfile;
  axialLoading?: AxialLoadingLevel;
  jointStress?: JointStressLevel;
  difficultyTier?: DifficultyTier;
  unilateral?: boolean;
  tempoRecommendation?: string;
  coachingCues?: string[];
  commonMistakes?: string[];
  swapSynergyKeys?: string[];
}

export interface ExerciseQueryConstraints {
  availableEquipment?: string[];
  apparatusGroups?: ApparatusGroup[];
  hardwareDetails?: HardwareDetail[];
  targetMuscle?: string;
  secondaryMuscles?: string[];
  muscleSubdivision?: string;
  movementPattern?: MovementPattern;
  mechanics?: MechanicsType;
  resistanceProfile?: ResistanceProfile;
  maxAxialLoading?: AxialLoadingLevel;
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
