/**
 * @file substitution-copilot.ts
 * @description Intelligent Biomechanical Substitution Copilot (Spec 017).
 * Deterministically ranks exercise substitutions based on muscular subdivision,
 * joint line of action, and resistance profile matching with human-readable coach rationales.
 */

import { RagExercise } from '@/types/exercise-rag';
import { resolveExerciseVideoUrl } from '@/lib/utils';

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

function getSubdivisionFamily(sub: MuscleSubdivision): string {
  if (sub.startsWith('chest_')) return 'chest';
  if (sub === 'lat_iliac' || sub === 'back_rhomboids') return 'back';
  if (sub.startsWith('deltoid_')) return 'shoulders';
  if (sub.startsWith('quad_')) return 'quads';
  if (sub.startsWith('hamstring_')) return 'hamstrings';
  if (sub.startsWith('tricep_')) return 'triceps';
  if (sub.startsWith('bicep_')) return 'biceps';
  return 'general';
}

/**
 * Infer the specific functional subdivision based on exercise name and target.
 * Movement-specific patterns in `name` take precedence over generic `target` strings
 * so "Reverse Fly" / "Reverse Pec Deck" / "Chest-Supported Row" are never misclassified as chest.
 */
export function inferMuscleSubdivision(name: string, target: string): MuscleSubdivision {
  const n = (name || '').toLowerCase().replace(/-/g, ' ');
  const t = (target || '').toLowerCase().replace(/-/g, ' ');

  // 1. Explicit Rear Delt / Posterior Shoulder movement patterns
  if (
    n.includes('reverse fly') ||
    n.includes('reverse pec') ||
    n.includes('reverse cable') ||
    n.includes('reverse machine') ||
    n.includes('rear delt') ||
    n.includes('rear fly') ||
    n.includes('face pull') ||
    n.includes('band pull apart') ||
    n.includes('powell') ||
    n.includes('y t w') ||
    n.includes('ytw') ||
    t.includes('rear delt') ||
    t.includes('posterior delt') ||
    t.includes('infraspinatus')
  ) {
    return 'deltoid_posterior';
  }

  // 2. Explicit Lateral Deltoid movement patterns
  if (
    n.includes('lateral raise') ||
    n.includes('side raise') ||
    n.includes('lu raise') ||
    t.includes('side delt') ||
    t.includes('lateral delt')
  ) {
    return 'deltoid_lateral';
  }

  // 3. Explicit Row / Pulldown / Vertical Pull movement patterns (precedes "chest" so "chest-supported row" is back)
  if (
    n.includes('row') ||
    n.includes('pulldown') ||
    n.includes('pull up') ||
    n.includes('chin up') ||
    n.includes('lat pull')
  ) {
    if (n.includes('upright row')) {
      return 'deltoid_lateral';
    }
    if (
      n.includes('close') ||
      n.includes('neutral') ||
      n.includes('pulldown') ||
      n.includes('single arm') ||
      n.includes('one arm') ||
      n.includes('underhand') ||
      n.includes('supinated') ||
      n.includes('pull up') ||
      n.includes('chin up')
    ) {
      return 'lat_iliac';
    }
    return 'back_rhomboids';
  }

  // 4. Deltoids (by target or explicit shoulder press/raise name)
  if (
    t.includes('shoulder') ||
    t.includes('delt') ||
    n.includes('shoulder press') ||
    n.includes('overhead press') ||
    n.includes('military press') ||
    n.includes('arnold press') ||
    n.includes('front raise')
  ) {
    if (n.includes('rear') || n.includes('face pull') || n.includes('reverse') || n.includes('horizontal adduction')) {
      return 'deltoid_posterior';
    }
    if (
      n.includes('front') ||
      n.includes('overhead') ||
      n.includes('military') ||
      n.includes('press') ||
      n.includes('arnold') ||
      t.includes('front delt') ||
      t.includes('anterior delt')
    ) {
      return 'deltoid_anterior';
    }
    return 'deltoid_lateral';
  }

  // 5. Back / Lats (by target)
  if (t.includes('lat') || t.includes('back') || t.includes('rhomboid') || t.includes('trap')) {
    if (n.includes('close') || n.includes('neutral') || n.includes('pulldown') || n.includes('single arm') || n.includes('underhand')) {
      return 'lat_iliac';
    }
    return 'back_rhomboids';
  }

  // 6. Pectorals
  if (t.includes('chest') || t.includes('pec')) {
    if (n.includes('incline') || n.includes('low to high') || n.includes('reverse grip')) {
      return 'chest_clavicular';
    }
    if (n.includes('decline') || n.includes('high to low') || n.includes('dip')) {
      return 'chest_costal';
    }
    return 'chest_sternal';
  }

  // 7. Quads
  if (t.includes('quad') || n.includes('squat') || n.includes('leg press') || n.includes('leg extension')) {
    if (n.includes('extension') || n.includes('terminal') || n.includes('sissy')) {
      return 'quad_shortened';
    }
    return 'quad_lengthened';
  }

  // 8. Hamstrings / Glutes
  if (t.includes('hamstring') || t.includes('glute') || n.includes('rdl') || n.includes('deadlift') || n.includes('leg curl')) {
    if (n.includes('curl')) {
      return 'hamstring_knee';
    }
    return 'hamstring_hip';
  }

  // 9. Triceps
  if (t.includes('tricep') || n.includes('tricep') || n.includes('pushdown') || n.includes('skull')) {
    if (n.includes('overhead') || n.includes('french') || n.includes('behind') || n.includes('skull')) {
      return 'tricep_long_head';
    }
    return 'tricep_lateral';
  }

  // 10. Biceps
  if (t.includes('bicep') || n.includes('bicep') || n.includes('preacher') || n.includes('curl')) {
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
  const currentFamily = getSubdivisionFamily(currentSubdivision);
  const currentProfile = inferResistanceProfile(currentExercise.name, currentExercise.equipment);
  const currentId = currentExercise.id ? String(currentExercise.id).padStart(4, '0') : null;
  const currentEqLower = (currentExercise.equipment || '').toLowerCase();
  const currentTargetLower = (currentExercise.target || '').toLowerCase();

  const candidates: SubstitutionCandidate[] = [];

  for (const ex of catalogue) {
    // Exclude current exercise
    if (currentId && String(ex.id).padStart(4, '0') === currentId) continue;
    if (ex.name.toLowerCase() === currentExercise.name.toLowerCase()) continue;

    const candTargetLower = (ex.target || '').toLowerCase();
    const candEqLower = (ex.equipment || '').toLowerCase();

    // Check equipment exclusion filter
    if (options.excludedEquipment?.some((eq) => candEqLower.includes(eq.toLowerCase()))) {
      continue;
    }

    const candSubdivision = inferMuscleSubdivision(ex.name, ex.target);
    const candFamily = getSubdivisionFamily(candSubdivision);

    // Prevent cross-family contamination (e.g. Rear Delt / Back never matches Chest)
    if (
      currentFamily !== 'general' &&
      candFamily !== 'general' &&
      currentFamily !== candFamily
    ) {
      continue;
    }

    // Specifically for deltoids: rear delt (deltoid_posterior) must not be replaced by front delt presses
    if (currentSubdivision === 'deltoid_posterior' && candSubdivision === 'deltoid_anterior') {
      continue;
    }

    // Must share same primary target, subdivision, or muscle family
    const isTargetMatch =
      (currentSubdivision !== 'general' && candSubdivision === currentSubdivision) ||
      (currentFamily !== 'general' && candFamily === currentFamily) ||
      candTargetLower === currentTargetLower ||
      (currentTargetLower.includes('pec') && candTargetLower.includes('chest')) ||
      (currentTargetLower.includes('chest') && candTargetLower.includes('pec')) ||
      (currentTargetLower.includes('lat') && candTargetLower.includes('back')) ||
      (currentTargetLower.includes('back') && candTargetLower.includes('lat')) ||
      ((currentTargetLower.includes('delt') || currentTargetLower.includes('shoulder')) &&
        (candTargetLower.includes('delt') || candTargetLower.includes('shoulder')));

    if (!isTargetMatch) continue;

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
      exercise: {
        ...ex,
        videoUrl: resolveExerciseVideoUrl(ex.name, { explicitVideoUrl: ex.videoUrl }),
      },
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
