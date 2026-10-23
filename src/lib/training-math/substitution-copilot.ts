/**
 * @file substitution-copilot.ts
 * @description Intelligent Biomechanical Substitution Copilot (Spec 017).
 * Deterministically ranks exercise substitutions based on muscular subdivision,
 * joint line of action, and resistance profile matching with human-readable coach rationales.
 */

import { RagExercise } from '@/types/exercise-rag';

export type MuscleSubdivision =
  | 'chest_clavicular' // Upper chest
  | 'chest_sternal'    // Mid chest
  | 'chest_costal'     // Lower chest
  | 'lat_iliac'        // Lower lat (horizontal/tucked elbow)
  | 'back_rhomboids'   // Upper back / mid trap
  | 'deltoid_lateral'  // Side delt
  | 'deltoid_anterior' // Front delt
  | 'deltoid_posterior'// Rear delt
  | 'quad_lengthened'  // Deep knee flexion
  | 'quad_shortened'   // Terminal extension
  | 'hamstring_hip'    // Hip hinge / RDL
  | 'hamstring_knee'   // Knee flexion / Leg curl
  | 'tricep_long_head' // Overhead extension
  | 'tricep_lateral'   // Pressdown / lockout
  | 'bicep_short_head' // Preacher / supinated
  | 'bicep_long_head'  // Incline / neutral
  | 'general';

export type ResistanceProfile = 'lengthened' | 'shortened' | 'constant' | 'ascending';

export interface SubstitutionCandidate {
  exercise: RagExercise;
  similarityScore: number; // 0 to 1.0
  subdivision: MuscleSubdivision;
  resistanceProfile: ResistanceProfile;
  biomechanicalRationale: string;
  setupAdjustmentCue: string;
}

/**
 * Infer the specific functional subdivision based on exercise name and target.
 */
export function inferMuscleSubdivision(name: string, target: string): MuscleSubdivision {
  const n = name.toLowerCase().replace(/-/g, ' ');
  const t = target.toLowerCase().replace(/-/g, ' ');

  // Pectorals
  if (t.includes('chest') || t.includes('pec')) {
    if (n.includes('incline') || n.includes('low to high') || n.includes('reverse grip')) {
      return 'chest_clavicular';
    }
    if (n.includes('decline') || n.includes('high to low') || n.includes('dip')) {
      return 'chest_costal';
    }
    return 'chest_sternal';
  }

  // Back / Lats
  if (t.includes('lat') || t.includes('back')) {
    if (n.includes('close') || n.includes('neutral') || n.includes('pulldown') || n.includes('single arm') || n.includes('underhand')) {
      return 'lat_iliac';
    }
    return 'back_rhomboids';
  }

  // Deltoids
  if (t.includes('shoulder') || t.includes('delt')) {
    if (n.includes('rear') || n.includes('face pull') || n.includes('reverse') || n.includes('horizontal adduction')) {
      return 'deltoid_posterior';
    }
    if (n.includes('front') || n.includes('overhead') || n.includes('military') || n.includes('press')) {
      return 'deltoid_anterior';
    }
    return 'deltoid_lateral';
  }

  // Quads
  if (t.includes('quad')) {
    if (n.includes('extension') || n.includes('terminal')) {
      return 'quad_shortened';
    }
    return 'quad_lengthened';
  }

  // Hamstrings
  if (t.includes('hamstring') || t.includes('glute')) {
    if (n.includes('curl')) {
      return 'hamstring_knee';
    }
    return 'hamstring_hip';
  }

  // Triceps
  if (t.includes('tricep')) {
    if (n.includes('overhead') || n.includes('french') || n.includes('behind')) {
      return 'tricep_long_head';
    }
    return 'tricep_lateral';
  }

  // Biceps
  if (t.includes('bicep')) {
    if (n.includes('preacher') || n.includes('spider') || n.includes('concentration')) {
      return 'bicep_short_head';
    }
    return 'bicep_long_head';
  }

  return 'general';
}

/**
 * Infer the primary resistance curve overload point.
 */
export function inferResistanceProfile(name: string, equipment: string): ResistanceProfile {
  const n = name.toLowerCase();
  const eq = equipment.toLowerCase();

  if (eq.includes('cable') || eq.includes('band')) {
    return 'constant';
  }
  if (eq.includes('lever') || eq.includes('machine')) {
    if (n.includes('extension') || n.includes('fly') || n.includes('deck') || n.includes('curl')) {
      return 'shortened';
    }
    return 'constant';
  }
  if (n.includes('incline') || n.includes('rdl') || n.includes('squat') || n.includes('lunge') || n.includes('dip')) {
    return 'lengthened';
  }
  return 'ascending';
}

/**
 * Generates human-readable, deterministic sports science coach rationale.
 */
export function generateBiomechanicalRationale(
  sourceName: string,
  candidate: RagExercise,
  subdivision: MuscleSubdivision,
  sourceProfile: ResistanceProfile,
  candidateProfile: ResistanceProfile
): { rationale: string; setupCue: string } {
  const cName = candidate.name;
  const cEq = candidate.equipment;

  switch (subdivision) {
    case 'chest_sternal':
      return {
        rationale: `Replicates sternal fiber adduction with free ${cEq} motor path and 2s active stretch.`,
        setupCue: 'Tuck elbows 45° and retract scapulae to protect the anterior capsule.',
      };
    case 'chest_clavicular':
      return {
        rationale: `Preserves high-angle clavicular recruitment matching ${sourceName}'s vertical line of action.`,
        setupCue: 'Set bench to 30° incline; drive upward along the clavicular plane.',
      };
    case 'chest_costal':
      return {
        rationale: `Maintains downward adduction vector for lower costal pec development.`,
        setupCue: 'Slight forward torso lean with elbows flared 30°.',
      };
    case 'lat_iliac':
      return {
        rationale: `Aligns elbow path directly along the iliac lat line of action without upper back compensation.`,
        setupCue: 'Keep elbows pinned tight to hip; pull towards pocket rather than chest.',
      };
    case 'back_rhomboids':
      return {
        rationale: `Substitutes horizontal pull vector to maximize scapular retraction and mid-trap thickness.`,
        setupCue: 'Flare elbows 60° to 75° and emphasize a 1-second peak squeeze at full contraction.',
      };
    case 'deltoid_lateral':
      return {
        rationale: `Isolates lateral deltoid in the scapular plane with minimal upper trap takeover.`,
        setupCue: 'Lean torso 15° forward and lead with elbows to optimize middle delt alignment.',
      };
    case 'deltoid_posterior':
      return {
        rationale: `Preserves transverse abduction for posterior deltoid stability and rotator cuff balance.`,
        setupCue: 'Keep thumbs facing inward; sweep arms wide with a soft elbow bend.',
      };
    case 'quad_lengthened':
      return {
        rationale: `Transfers quad loading through deep knee flexion while managing axial spinal compression.`,
        setupCue: 'Elevate heels or maintain upright torso to maximize quad knee-over-toe excursion.',
      };
    case 'quad_shortened':
      return {
        rationale: `Isolates the rectus femoris and terminal lockout without hip extensor fatigue.`,
        setupCue: 'Pause for 1 second at top lockout before controlled 3-second descent.',
      };
    case 'hamstring_hip':
      return {
        rationale: `Preserves posterior chain hip hinge loading through lengthened hamstring tension.`,
        setupCue: 'Push hips straight back with soft knees until deep hamstring stretch is felt.',
      };
    case 'hamstring_knee':
      return {
        rationale: `Direct knee flexion substitute targeting distal hamstring fibers without lower back strain.`,
        setupCue: 'Keep toes pointed forward and avoid arching the lower back.',
      };
    default:
      return {
        rationale: `Direct motor pattern transfer matching ${candidate.target} recruitment and ${cEq} availability.`,
        setupCue: 'Control the eccentric phase for 2 seconds to match previous loading stimulus.',
      };
  }
}

export interface SubstitutionOptions {
  excludedEquipment?: string[];
  preferredEquipment?: string[];
  limit?: number;
}

/**
 * Deterministically ranks and returns the top biomechanical substitutes for an exercise.
 */
export function matchesEquipmentCategory(equipment: string, preferredCategory: string): boolean {
  const eq = (equipment || '').toLowerCase();
  const pref = (preferredCategory || '').toLowerCase();
  if (pref === 'machine') {
    return eq.includes('machine') || eq.includes('leverage') || eq.includes('smith') || eq.includes('sled') || eq.includes('lever');
  }
  if (pref === 'barbell') {
    return eq.includes('barbell') || eq.includes('olympic') || eq.includes('ez') || eq.includes('trap');
  }
  if (pref === 'dumbbell') {
    return eq.includes('dumbbell');
  }
  if (pref === 'cable') {
    return eq.includes('cable') || eq.includes('rope');
  }
  if (pref === 'body weight' || pref === 'bodyweight') {
    return eq.includes('body weight') || eq.includes('assisted') || eq.includes('bodyweight');
  }
  return eq.includes(pref);
}

export function findBiomechanicalSubstitutes(
  currentExercise: {
    id?: string;
    name: string;
    target: string;
    equipment: string;
    bodyPart?: string;
    category?: string;
    secondaryMuscles?: string[];
  },
  catalogue: RagExercise[],
  options: SubstitutionOptions = {}
): SubstitutionCandidate[] {
  const limit = options.limit || 3;
  const currentSubdivision = inferMuscleSubdivision(currentExercise.name, currentExercise.target);
  const currentProfile = inferResistanceProfile(currentExercise.name, currentExercise.equipment);
  const currentId = currentExercise.id ? String(currentExercise.id).padStart(4, '0') : null;
  const currentEqLower = currentExercise.equipment.toLowerCase();
  const currentTargetLower = currentExercise.target.toLowerCase();

  const candidates: SubstitutionCandidate[] = [];

  for (const ex of catalogue) {
    // Exclude current exercise
    if (currentId && String(ex.id).padStart(4, '0') === currentId) continue;
    if (ex.name.toLowerCase() === currentExercise.name.toLowerCase()) continue;

    const candTargetLower = ex.target.toLowerCase();
    const candEqLower = ex.equipment.toLowerCase();

    // Check equipment exclusion filter
    if (options.excludedEquipment?.some((eq) => candEqLower.includes(eq.toLowerCase()))) {
      continue;
    }

    // Must share same primary target or overlapping body part
    const isTargetMatch =
      candTargetLower === currentTargetLower ||
      (currentTargetLower.includes('pec') && candTargetLower.includes('chest')) ||
      (currentTargetLower.includes('chest') && candTargetLower.includes('pec')) ||
      (currentTargetLower.includes('lat') && candTargetLower.includes('back')) ||
      (currentTargetLower.includes('back') && candTargetLower.includes('lat'));

    if (!isTargetMatch) continue;

    const candSubdivision = inferMuscleSubdivision(ex.name, ex.target);
    const candProfile = inferResistanceProfile(ex.name, ex.equipment);

    // Compute deterministic similarity score (0.0 to 1.0)
    let score = 0.5; // Base target match

    // 1. Muscular subdivision match
    if (candSubdivision === currentSubdivision) {
      score += 0.25;
    }

    // 2. Resistance profile match
    if (candProfile === currentProfile) {
      score += 0.15;
    }

    // 3. Equipment differentiation (if current equipment is busy, different equipment is prioritized)
    if (candEqLower !== currentEqLower) {
      score += 0.1;
    }

    // 4. Preferred equipment bonus (strong weighting for trainee equipment selection)
    const matchesPreferred = options.preferredEquipment && options.preferredEquipment.length > 0
      ? options.preferredEquipment.some((pref) => matchesEquipmentCategory(candEqLower, pref))
      : false;

    if (matchesPreferred) {
      score += 0.35;
    }

    // Generate deterministic coach rationale
    const { rationale, setupCue } = generateBiomechanicalRationale(
      currentExercise.name,
      ex,
      currentSubdivision,
      currentProfile,
      candProfile
    );

    candidates.push({
      exercise: ex,
      similarityScore: Math.round(score * 100) / 100,
      subdivision: candSubdivision,
      resistanceProfile: candProfile,
      biomechanicalRationale: rationale,
      setupAdjustmentCue: setupCue,
    });
  }

  // Sort descending by similarity score, with stable fallback
  candidates.sort((a, b) => {
    if (b.similarityScore !== a.similarityScore) {
      return b.similarityScore - a.similarityScore;
    }
    return a.exercise.name.localeCompare(b.exercise.name);
  });

  return candidates.slice(0, limit);
}
