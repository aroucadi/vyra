/**
 * @file biomechanical-metadata.ts
 * @description Biomechanical Classification and Metadata Enrichment Engine for Vyra's Exercise Library.
 * Grounds exercises in kinesiological anatomy, apparatus hardware categorization,
 * resistance profiles, axial spinal loading, and movement pattern mechanics.
 */

import {
  ApparatusGroup,
  HardwareDetail,
  MovementPattern,
  MechanicsType,
  PlaneOfMotion,
  KineticChain,
  ResistanceProfile,
  AxialLoadingLevel,
  JointStressLevel,
  DifficultyTier,
  RagExercise,
} from '@/types/exercise-rag';

const norm = (s?: string) => (s || '').toLowerCase().replace(/[\-_/]/g, ' ').trim();

/**
 * Classifies exercise apparatus into broad apparatus groups and exact hardware details.
 */
export function classifyApparatus(
  rawEquipment: string,
  rawName: string
): { apparatusGroup: ApparatusGroup; hardwareDetail: HardwareDetail } {
  const eq = norm(rawEquipment);
  const n = norm(rawName);

  if (eq.includes('smith') || n.includes('smith machine') || n.includes('smith')) {
    return { apparatusGroup: 'smith_machine', hardwareDetail: 'smith_machine' };
  }

  if (eq.includes('cable') || eq.includes('rope') || n.includes('cable') || n.includes('pulldown') || n.includes('pushdown')) {
    return { apparatusGroup: 'cable', hardwareDetail: 'cable_stack' };
  }

  if (eq.includes('dumbbell') || n.includes('dumbbell') || n.includes('db ')) {
    return { apparatusGroup: 'dumbbell', hardwareDetail: 'dumbbell' };
  }

  if (eq.includes('kettlebell') || n.includes('kettlebell') || n.includes('kb ')) {
    return { apparatusGroup: 'kettlebell', hardwareDetail: 'kettlebell' };
  }

  if (eq.includes('trap bar') || n.includes('trap bar') || n.includes('hex bar')) {
    return { apparatusGroup: 'barbell', hardwareDetail: 'trap_bar' };
  }

  if (eq.includes('ez') || n.includes('ez bar') || n.includes('ez barbell') || n.includes('cambered')) {
    return { apparatusGroup: 'barbell', hardwareDetail: 'ez_barbell' };
  }

  if (eq.includes('barbell') || eq.includes('olympic') || n.includes('barbell') || n.includes('bb ')) {
    return { apparatusGroup: 'barbell', hardwareDetail: 'barbell' };
  }

  if (eq.includes('leverage machine') || eq.includes('sled') || eq.includes('machine') || n.includes('machine')) {
    if (n.includes('plate loaded') || n.includes('leverage') || eq.includes('leverage') || eq.includes('sled')) {
      return { apparatusGroup: 'machine', hardwareDetail: 'plate_loaded' };
    }
    return { apparatusGroup: 'machine', hardwareDetail: 'pin_selectorized' };
  }

  if (eq.includes('band') || n.includes('band') || eq.includes('resistance band')) {
    return { apparatusGroup: 'band', hardwareDetail: 'resistance_band' };
  }

  if (eq.includes('plate') || eq.includes('weighted') || n.includes('plate')) {
    return { apparatusGroup: 'plate', hardwareDetail: 'weight_plate' };
  }

  if (eq.includes('suspension') || n.includes('trx') || n.includes('suspension')) {
    return { apparatusGroup: 'bodyweight', hardwareDetail: 'suspension_trainer' };
  }

  if (
    eq.includes('bike') ||
    eq.includes('ergometer') ||
    eq.includes('elliptical') ||
    eq.includes('skierg') ||
    eq.includes('stepmill') ||
    n.includes('treadmill') ||
    n.includes('rowing machine')
  ) {
    return { apparatusGroup: 'other', hardwareDetail: 'cardio_machine' };
  }

  if (eq.includes('body weight') || eq.includes('assisted') || eq === 'none' || !eq) {
    if (n.includes('pull up') || n.includes('chin up') || n.includes('bar dip') || n.includes('muscle up')) {
      return { apparatusGroup: 'bodyweight', hardwareDetail: 'calisthenic_bar' };
    }
    return { apparatusGroup: 'bodyweight', hardwareDetail: 'bodyweight' };
  }

  return { apparatusGroup: 'other', hardwareDetail: 'other' };
}

/**
 * Classifies fundamental human movement patterns (horizontal push, vertical pull, squat, hinge, etc.).
 */
export function classifyMovementPattern(
  rawName: string,
  rawTarget: string,
  rawBodyPart: string
): MovementPattern {
  const n = norm(rawName);
  const t = norm(rawTarget);
  const bp = norm(rawBodyPart);

  // Cardio / Ergometer
  if (
    bp.includes('cardio') ||
    t.includes('cardio') ||
    n.includes('run') ||
    n.includes('bike') ||
    n.includes('rower') ||
    n.includes('burpee') ||
    n.includes('jump rope')
  ) {
    return 'cardio';
  }

  // Core & Trunk
  if (bp.includes('waist') || t.includes('abs') || t.includes('oblique')) {
    if (n.includes('twist') || n.includes('rotation') || n.includes('woodchop') || n.includes('side bend')) {
      return 'core_rotation';
    }
    if (n.includes('plank') || n.includes('rollout') || n.includes('pallof') || n.includes('hollow') || n.includes('vacuum')) {
      return 'core_stability';
    }
    return 'core_flexion';
  }

  // Loaded Carries
  if (n.includes('carry') || (n.includes('walk') && (n.includes('farmer') || n.includes('suitcase') || n.includes('overhead walk')))) {
    return 'carry';
  }

  // Lunge / Unilateral Knee-Dominant (checked before squat so Bulgarian Split Squat is lunge)
  if (
    n.includes('lunge') ||
    n.includes('split squat') ||
    n.includes('step up') ||
    n.includes('pistol')
  ) {
    return 'lunge';
  }

  // Squat & Knee-Dominant
  if (
    n.includes('squat') ||
    n.includes('leg press') ||
    n.includes('hack') ||
    n.includes('sissy') ||
    (t.includes('quad') && !n.includes('extension') && !n.includes('curl'))
  ) {
    return 'squat';
  }

  // Hip Hinge / Posterior Chain
  if (
    n.includes('deadlift') ||
    n.includes('rdl') ||
    n.includes('good morning') ||
    n.includes('hip thrust') ||
    n.includes('glute bridge') ||
    n.includes('back extension') ||
    n.includes('hyperextension') ||
    n.includes('kettlebell swing') ||
    (t.includes('hamstring') && !n.includes('curl'))
  ) {
    return 'hip_hinge';
  }

  // Vertical Push
  if (
    n.includes('overhead press') ||
    n.includes('shoulder press') ||
    n.includes('military press') ||
    n.includes('push press') ||
    n.includes('arnold press') ||
    n.includes('handstand') ||
    n.includes('pike push') ||
    (t.includes('front delt') && n.includes('press'))
  ) {
    return 'vertical_push';
  }

  // Vertical Pull
  if (
    n.includes('pulldown') ||
    n.includes('pull down') ||
    n.includes('pull up') ||
    n.includes('chin up') ||
    n.includes('lat pull')
  ) {
    return 'vertical_pull';
  }

  // Horizontal Push
  if (
    n.includes('bench press') ||
    n.includes('chest press') ||
    n.includes('push up') ||
    n.includes('dip') ||
    (n.includes('press') && (t.includes('pec') || bp.includes('chest'))) ||
    n.includes('floor press')
  ) {
    return 'horizontal_push';
  }

  // Horizontal Pull
  if (
    n.includes('row') ||
    n.includes('face pull') ||
    n.includes('inverted row') ||
    (t.includes('back') && !n.includes('extension'))
  ) {
    return 'horizontal_pull';
  }

  // Isolation (Curls, Extensions, Raises, Flies)
  return 'isolation';
}

/**
 * Classifies mechanics into compound (multi-joint) or isolation (single-joint).
 */
export function classifyMechanics(
  name: string,
  pattern: MovementPattern,
  target: string
): MechanicsType {
  const n = norm(name);
  const t = norm(target);

  if (
    pattern === 'squat' ||
    pattern === 'hip_hinge' ||
    pattern === 'lunge' ||
    pattern === 'horizontal_push' ||
    pattern === 'horizontal_pull' ||
    pattern === 'vertical_push' ||
    pattern === 'vertical_pull' ||
    pattern === 'carry'
  ) {
    // Check if it's a fly or single-joint variant falsely grouped
    if (n.includes('fly') || n.includes('raise') || n.includes('pullover')) {
      return 'isolation';
    }
    return 'compound';
  }

  if (
    n.includes('curl') ||
    n.includes('extension') ||
    n.includes('raise') ||
    n.includes('fly') ||
    n.includes('kickback') ||
    n.includes('shrug') ||
    t.includes('biceps') ||
    t.includes('triceps') ||
    t.includes('calves') ||
    t.includes('forearms') ||
    t.includes('side delts') ||
    t.includes('rear delts')
  ) {
    return 'isolation';
  }

  return 'compound';
}

/**
 * Classifies anatomical plane of motion (sagittal, frontal, transverse, multiplanar).
 */
export function classifyPlaneOfMotion(name: string, pattern: MovementPattern): PlaneOfMotion {
  const n = norm(name);

  // Transverse (rotational, horizontal adduction/abduction)
  if (
    n.includes('twist') ||
    n.includes('rotation') ||
    n.includes('woodchop') ||
    n.includes('fly') ||
    n.includes('reverse fly') ||
    n.includes('pec deck') ||
    n.includes('crossover') ||
    pattern === 'core_rotation'
  ) {
    return 'transverse';
  }

  // Frontal (abduction / adduction / lateral flexion)
  if (
    n.includes('lateral raise') ||
    n.includes('side raise') ||
    n.includes('side bend') ||
    n.includes('jumping jack') ||
    n.includes('wide grip pulldown') ||
    n.includes('abduction') ||
    n.includes('adduction')
  ) {
    return 'frontal';
  }

  // Multiplanar
  if (
    n.includes('clean') ||
    n.includes('snatch') ||
    n.includes('burpee') ||
    n.includes('turkish') ||
    pattern === 'carry'
  ) {
    return 'multiplanar';
  }

  // Sagittal (flexion / extension - majority of squats, hinges, presses, curls, extensions)
  return 'sagittal';
}

/**
 * Classifies kinetic chain type (open kinetic chain vs closed kinetic chain).
 */
export function classifyKineticChain(
  name: string,
  apparatusGroup: ApparatusGroup,
  mechanics: MechanicsType
): KineticChain {
  const n = norm(name);

  // Closed chain: hand or foot is fixed against surface/ground
  if (
    n.includes('push up') ||
    n.includes('pull up') ||
    n.includes('chin up') ||
    n.includes('dip') ||
    n.includes('squat') ||
    n.includes('lunge') ||
    n.includes('deadlift') ||
    n.includes('step up') ||
    n.includes('plank')
  ) {
    return 'closed_chain';
  }

  // Open chain: distal extremity moves freely (leg curl, leg extension, db press, cable fly, curl)
  return 'open_chain';
}

/**
 * Classifies resistance profile (lengthened, shortened, constant, ascending).
 */
export function classifyResistanceProfile(
  name: string,
  apparatusGroup: ApparatusGroup
): ResistanceProfile {
  const n = norm(name);

  if (apparatusGroup === 'cable' || apparatusGroup === 'band') {
    return 'constant';
  }

  if (apparatusGroup === 'machine') {
    if (n.includes('leg extension') || n.includes('leg curl') || n.includes('pec deck') || n.includes('hip thrust')) {
      return 'shortened';
    }
    return 'constant';
  }

  // Free weights & Bodyweight
  if (
    n.includes('incline') ||
    n.includes('rdl') ||
    n.includes('romanian') ||
    n.includes('good morning') ||
    n.includes('overhead triceps') ||
    n.includes('skull') ||
    n.includes('sissy') ||
    n.includes('preacher') ||
    n.includes('bulgarian') ||
    n.includes('fly')
  ) {
    return 'lengthened';
  }

  if (
    n.includes('glute bridge') ||
    n.includes('hip thrust') ||
    n.includes('kickback') ||
    n.includes('spider curl') ||
    n.includes('lateral raise')
  ) {
    return 'shortened';
  }

  return 'ascending';
}

/**
 * Evaluates axial compressive spinal loading.
 */
export function classifyAxialLoading(
  name: string,
  apparatusGroup: ApparatusGroup,
  pattern: MovementPattern
): AxialLoadingLevel {
  const n = norm(name);

  // High axial spinal compression: Barbell squats, heavy deadlifts, standing overhead press
  if (
    (apparatusGroup === 'barbell' || apparatusGroup === 'smith_machine') &&
    (n.includes('back squat') ||
      n.includes('overhead press') ||
      n.includes('military press') ||
      n.includes('good morning') ||
      (n.includes('deadlift') && !n.includes('trap bar') && !n.includes('romanian dumbbell')))
  ) {
    return 'high';
  }

  // Moderate axial compression
  if (
    n.includes('front squat') ||
    n.includes('trap bar deadlift') ||
    n.includes('barbell row') ||
    n.includes('standing dumbbell press') ||
    n.includes('farmers walk')
  ) {
    return 'moderate';
  }

  // Low axial compression
  if (
    n.includes('leg press') ||
    n.includes('hack squat') ||
    n.includes('lunge') ||
    n.includes('split squat') ||
    n.includes('seated dumbbell press') ||
    n.includes('chest supported row')
  ) {
    return 'low';
  }

  // None: Cables, lying, seated supported, isolation
  return 'none';
}

/**
 * Evaluates joint stress level.
 */
export function classifyJointStress(name: string, axial: AxialLoadingLevel): JointStressLevel {
  const n = norm(name);
  if (
    axial === 'high' ||
    n.includes('behind the neck') ||
    n.includes('upright row') ||
    n.includes('heavy clean')
  ) {
    return 'high';
  }
  if (axial === 'moderate' || n.includes('dip') || n.includes('bench press')) {
    return 'moderate';
  }
  return 'low';
}

/**
 * Evaluates difficulty tier (beginner, intermediate, advanced).
 */
export function classifyDifficulty(
  name: string,
  mechanics: MechanicsType,
  apparatusGroup: ApparatusGroup
): DifficultyTier {
  const n = norm(name);
  if (
    n.includes('snatch') ||
    n.includes('clean and jerk') ||
    n.includes('muscle up') ||
    n.includes('pistol squat') ||
    n.includes('handstand') ||
    n.includes('dragon flag')
  ) {
    return 'advanced';
  }

  if (mechanics === 'compound' && (apparatusGroup === 'barbell' || apparatusGroup === 'dumbbell')) {
    return 'intermediate';
  }

  if (apparatusGroup === 'machine' || apparatusGroup === 'cable') {
    return 'beginner';
  }

  return 'intermediate';
}

/**
 * Infers if exercise is unilateral (single arm or single leg).
 */
export function isUnilateral(name: string): boolean {
  const n = norm(name);
  return (
    n.includes('single arm') ||
    n.includes('one arm') ||
    n.includes('single leg') ||
    n.includes('one leg') ||
    n.includes('unilateral') ||
    n.includes('alternating') ||
    n.includes('bulgarian') ||
    n.includes('step up') ||
    n.includes('lunge') ||
    n.includes('split squat') ||
    n.includes('pistol')
  );
}

/**
 * Infers prime movers, muscular subdivision, and secondary synergists.
 */
export function inferDetailedMuscles(
  name: string,
  target: string,
  secondaryMuscles: string[] = []
): { primaryMuscles: string[]; secondaryMuscles: string[]; subdivision: string } {
  const n = norm(name);
  const t = norm(target);

  let subdivision = 'general';
  const primaries: string[] = [];
  const secondaries: string[] = [...secondaryMuscles];

  // Chest / Pectorals
  if (t.includes('pec') || t.includes('chest') || n.includes('bench press') || n.includes('chest')) {
    if (n.includes('incline') || n.includes('low to high') || n.includes('reverse grip')) {
      subdivision = 'chest_clavicular';
      primaries.push('Pectoralis Major (Clavicular Head)', 'Anterior Deltoid');
      secondaries.push('Triceps Brachii', 'Serratus Anterior');
    } else if (n.includes('decline') || n.includes('high to low') || n.includes('dip')) {
      subdivision = 'chest_costal';
      primaries.push('Pectoralis Major (Costal/Abdominal Head)');
      secondaries.push('Triceps Brachii', 'Anterior Deltoid');
    } else {
      subdivision = 'chest_sternal';
      primaries.push('Pectoralis Major (Sternal Head)');
      secondaries.push('Anterior Deltoid', 'Triceps Brachii');
    }
  }
  // Lats & Back
  else if (t.includes('lat') || t.includes('back') || n.includes('row') || n.includes('pulldown') || n.includes('pull up')) {
    if (n.includes('face pull') || n.includes('rear delt') || n.includes('reverse fly')) {
      subdivision = 'deltoid_posterior';
      primaries.push('Posterior Deltoid', 'Infraspinatus', 'Rhomboids');
    } else if (n.includes('close grip') || n.includes('neutral') || n.includes('pulldown') || n.includes('single arm lat')) {
      subdivision = 'lat_iliac';
      primaries.push('Latissimus Dorsi (Iliac / Thoracolumbar Fibers)');
      secondaries.push('Biceps Brachii', 'Brachialis', 'Teres Major');
    } else if (n.includes('shrug') || t.includes('trap')) {
      subdivision = 'traps_upper';
      primaries.push('Trapezius (Upper / Descending Fibers)');
      secondaries.push('Levator Scapulae');
    } else {
      subdivision = 'back_rhomboids';
      primaries.push('Rhomboids Major/Minor', 'Trapezius (Middle/Lower)', 'Latissimus Dorsi');
      secondaries.push('Rear Deltoid', 'Biceps Brachii');
    }
  }
  // Deltoids / Shoulders
  else if (t.includes('delt') || t.includes('shoulder')) {
    if (n.includes('lateral') || n.includes('side raise') || n.includes('upright row') || t.includes('side')) {
      subdivision = 'deltoid_lateral';
      primaries.push('Lateral Deltoid (Middle Fibers)');
      secondaries.push('Supraspinatus', 'Upper Trapezius');
    } else if (n.includes('rear') || n.includes('reverse') || t.includes('rear')) {
      subdivision = 'deltoid_posterior';
      primaries.push('Posterior Deltoid');
      secondaries.push('Infraspinatus', 'Teres Minor');
    } else {
      subdivision = 'deltoid_anterior';
      primaries.push('Anterior Deltoid');
      secondaries.push('Triceps Brachii', 'Upper Pectoralis');
    }
  }
  // Quads
  else if (t.includes('quad') || n.includes('squat') || n.includes('leg press') || n.includes('leg extension')) {
    if (n.includes('extension') || n.includes('terminal')) {
      subdivision = 'quad_shortened';
      primaries.push('Rectus Femoris (Terminal Knee Extension)');
      secondaries.push('Vastus Lateralis', 'Vastus Medialis');
    } else {
      subdivision = 'quad_lengthened';
      primaries.push('Vastus Lateralis', 'Vastus Medialis', 'Vastus Intermedius');
      secondaries.push('Gluteus Maximus', 'Adductor Magnus');
    }
  }
  // Hamstrings & Glutes
  else if (t.includes('hamstring') || t.includes('glute') || n.includes('deadlift') || n.includes('rdl') || n.includes('hip thrust')) {
    if (n.includes('curl')) {
      subdivision = 'hamstring_knee';
      primaries.push('Biceps Femoris (Short/Long Head)', 'Semitendinosus');
      secondaries.push('Gastrocnemius');
    } else if (n.includes('hip thrust') || n.includes('glute bridge') || n.includes('kickback')) {
      subdivision = 'glute_max_shortened';
      primaries.push('Gluteus Maximus (Upper/Lower Fibers)');
      secondaries.push('Adductor Magnus', 'Hamstrings');
    } else if (n.includes('abduction') || n.includes('clam')) {
      subdivision = 'glute_medius';
      primaries.push('Gluteus Medius', 'Gluteus Minimus');
      secondaries.push('Tensor Fasciae Latae');
    } else {
      subdivision = 'hamstring_hip';
      primaries.push('Semitendinosus', 'Semimembranosus', 'Biceps Femoris (Long Head)');
      secondaries.push('Gluteus Maximus', 'Erector Spinae');
    }
  }
  // Arms: Triceps & Biceps
  else if (t.includes('tricep') || n.includes('pushdown') || n.includes('skull')) {
    if (n.includes('overhead') || n.includes('french') || n.includes('skull') || n.includes('incline')) {
      subdivision = 'tricep_long_head';
      primaries.push('Triceps Brachii (Long Head)');
      secondaries.push('Triceps Brachii (Lateral & Medial Heads)');
    } else {
      subdivision = 'tricep_lateral';
      primaries.push('Triceps Brachii (Lateral & Medial Heads)');
      secondaries.push('Anconeus');
    }
  } else if (t.includes('bicep') || n.includes('curl')) {
    if (n.includes('preacher') || n.includes('spider') || n.includes('concentration')) {
      subdivision = 'bicep_short_head';
      primaries.push('Biceps Brachii (Short Head / Distal Peak)');
      secondaries.push('Brachialis');
    } else if (n.includes('hammer') || n.includes('reverse') || t.includes('forearm')) {
      subdivision = 'brachialis_forearms';
      primaries.push('Brachialis', 'Brachioradialis');
      secondaries.push('Pronator Teres');
    } else {
      subdivision = 'bicep_long_head';
      primaries.push('Biceps Brachii (Long Head / Outer)');
      secondaries.push('Brachialis');
    }
  }
  // Calves
  else if (t.includes('calf') || t.includes('calves')) {
    if (n.includes('seated')) {
      subdivision = 'calves_soleus';
      primaries.push('Soleus');
    } else {
      subdivision = 'calves_gastrocnemius';
      primaries.push('Gastrocnemius (Medial & Lateral Heads)');
      secondaries.push('Soleus');
    }
  }
  // Core / Abs
  else if (t.includes('abs') || t.includes('oblique')) {
    if (n.includes('twist') || n.includes('woodchop') || n.includes('side bend')) {
      subdivision = 'abs_obliques_rotation';
      primaries.push('External & Internal Obliques');
      secondaries.push('Transverse Abdominis');
    } else if (n.includes('plank') || n.includes('rollout') || n.includes('pallof')) {
      subdivision = 'core_anti_extension';
      primaries.push('Transverse Abdominis', 'Rectus Abdominis');
      secondaries.push('Quadratus Lumborum');
    } else {
      subdivision = 'abs_rectus_flexion';
      primaries.push('Rectus Abdominis');
      secondaries.push('Pyramidalis');
    }
  } else {
    primaries.push(target || 'Primary Muscle');
  }

  return {
    primaryMuscles: Array.from(new Set(primaries)),
    secondaryMuscles: Array.from(new Set(secondaries)),
    subdivision,
  };
}

/**
 * Generates tailored coaching execution cues, mistake watchpoints, and tempo advice.
 */
export function generateCoachingCues(
  name: string,
  subdivision: string,
  pattern: MovementPattern
): { cues: string[]; mistakes: string[]; tempo: string } {
  const n = norm(name);

  const cues: string[] = [];
  const mistakes: string[] = [];
  let tempo = '3-0-1-0'; // 3s eccentric, 0s pause, 1s concentric, 0s hold

  if (pattern === 'horizontal_push') {
    cues.push('Retract and depress scapulae to create a stable thoracic shelf.');
    cues.push('Tuck elbows 45° to 60° relative to torso to protect the anterior glenohumeral capsule.');
    cues.push('Drive feet hard into the floor for leg drive.');
    mistakes.push('Elbow flare past 80° causing anterior shoulder impingement.');
    mistakes.push('Bouncing load off ribcage sacrificing eccentric mechanical tension.');
    tempo = '3-1-1-0';
  } else if (pattern === 'vertical_pull') {
    cues.push('Initiate the pull by depressing the scapulae before bending the elbows.');
    cues.push('Drive elbows straight down towards hip pockets.');
    cues.push('Maintain slight thoracic extension throughout.');
    mistakes.push('Excessive backward torso swing turning the movement into a low row.');
    mistakes.push('Rounding shoulders forward at the bottom contraction.');
    tempo = '2-1-1-1';
  } else if (pattern === 'horizontal_pull') {
    cues.push('Pull elbows back along the ribcage; squeeze shoulder blades together at peak.');
    cues.push('Keep ribcage stacked over pelvis without hyper-extending the lumbar spine.');
    mistakes.push('Jerking momentum from the lower back.');
    mistakes.push('Shrugging upper traps instead of engaging lats and rhomboids.');
    tempo = '2-1-1-1';
  } else if (pattern === 'squat') {
    cues.push('Brace 360° abdominal intra-abdominal pressure into the belt before descending.');
    cues.push('Descend with knees tracking over the second and third toes.');
    cues.push('Drive whole foot through the floor, keeping tripod contact (heel, big toe, pinky toe).');
    mistakes.push('Knee valgus collapse inward under heavy load.');
    mistakes.push('Losing abdominal brace causing lumbar rounding (butt wink).');
    tempo = '3-1-1-0';
  } else if (pattern === 'hip_hinge') {
    cues.push('Push hips backwards as if tapping a wall behind you with the glutes.');
    cues.push('Keep bar or weights tracking tight against the shins.');
    cues.push('Maintain neutral cervical spine; avoid cranking neck up at bottom.');
    mistakes.push('Squatting the weight down with excessive forward knee travel.');
    mistakes.push('Rounding the lower back in lumbar flexion during the stretch.');
    tempo = '3-1-1-0';
  } else if (pattern === 'vertical_push') {
    cues.push('Lock core and glutes firmly to prevent lumbar hyperextension.');
    cues.push('Press vertically along the scapular plane, clearing face with chin tucked.');
    mistakes.push('Over-arching lower back to turn the press into an incline bench.');
    mistakes.push('Pressing too far forward in front of the center of gravity.');
    tempo = '2-1-1-0';
  } else {
    cues.push('Control the eccentric lowering phase for 2 to 3 seconds.');
    cues.push('Focus on deep active muscle stretch under tension.');
    mistakes.push('Using swinging momentum rather than isolated muscular tension.');
    tempo = '2-0-1-1';
  }

  return { cues, mistakes, tempo };
}

/**
 * Generates unique swap synergy keys for rapid drop-in substitution matching.
 */
export function generateSwapSynergyKeys(
  subdivision: string,
  pattern: MovementPattern,
  mechanics: MechanicsType,
  apparatusGroup: ApparatusGroup
): string[] {
  const keys = new Set<string>();
  keys.add(`sub:${subdivision}`);
  keys.add(`pat:${pattern}`);
  keys.add(`mech:${mechanics}`);
  keys.add(`app:${apparatusGroup}`);
  keys.add(`${pattern}__${subdivision}`);
  keys.add(`${subdivision}__${mechanics}`);
  return Array.from(keys);
}

/**
 * Enriches a partial or raw exercise record with the complete biomechanical suite.
 */
export function enrichExerciseWithBiomechanics(exercise: Partial<RagExercise>): RagExercise {
  const name = exercise.name || 'Exercise';
  const target = exercise.target || '';
  const bodyPart = exercise.bodyPart || '';
  const equipment = exercise.equipment || 'body weight';
  const category = exercise.category || 'strength';
  const id = exercise.id || '0000';

  const apparatus = classifyApparatus(equipment, name);
  const pattern = classifyMovementPattern(name, target, bodyPart);
  const mechanics = classifyMechanics(name, pattern, target);
  const plane = classifyPlaneOfMotion(name, pattern);
  const kinetic = classifyKineticChain(name, apparatus.apparatusGroup, mechanics);
  const resistance = classifyResistanceProfile(name, apparatus.apparatusGroup);
  const axial = classifyAxialLoading(name, apparatus.apparatusGroup, pattern);
  const jointStress = classifyJointStress(name, axial);
  const difficulty = classifyDifficulty(name, mechanics, apparatus.apparatusGroup);
  const unilateral = isUnilateral(name);

  const muscles = inferDetailedMuscles(name, target, exercise.secondaryMuscles || []);
  const cuesData = generateCoachingCues(name, muscles.subdivision, pattern);
  const synergy = generateSwapSynergyKeys(muscles.subdivision, pattern, mechanics, apparatus.apparatusGroup);

  const clipUrl = exercise.clipUrl || `https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/${id}.mp4`;
  const imageUrl = exercise.imageUrl || `https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/still/${id}.webp`;

  return {
    id,
    name,
    bodyPart,
    equipment,
    target,
    secondaryMuscles: muscles.secondaryMuscles,
    category,
    description: exercise.description || '',
    instructions: exercise.instructions || [],
    muscleMap: exercise.muscleMap,
    femaleVariant: exercise.femaleVariant,
    maleVariant: exercise.maleVariant,
    variantOf: exercise.variantOf,
    textSource: exercise.textSource,
    clipUrl,
    imageUrl,
    videoUrl: exercise.videoUrl || clipUrl,

    // Enriched Biomechanical Metadata
    apparatusGroup: apparatus.apparatusGroup,
    hardwareDetail: apparatus.hardwareDetail,
    primaryMuscles: muscles.primaryMuscles,
    muscleSubdivision: muscles.subdivision,
    movementPattern: pattern,
    mechanics,
    planeOfMotion: plane,
    kineticChain: kinetic,
    resistanceProfile: resistance,
    axialLoading: axial,
    jointStress,
    difficultyTier: difficulty,
    unilateral,
    tempoRecommendation: cuesData.tempo,
    coachingCues: cuesData.cues,
    commonMistakes: cuesData.mistakes,
    swapSynergyKeys: synergy,
  };
}
