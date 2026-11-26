import fs from 'node:fs';
import path from 'node:path';

const OPEN_GYM_CATALOGUE = path.resolve('..', 'openGym', 'catalogue', 'exercises');
const OUTPUT_FILE = path.resolve('public', 'data', 'exercise-rag-index.json');
const OUTPUT_DIR = path.dirname(OUTPUT_FILE);

console.log(`[RAG Indexer] Reading exercises from: ${OPEN_GYM_CATALOGUE}`);

if (!fs.existsSync(OPEN_GYM_CATALOGUE)) {
  console.error(`Error: openGym catalogue directory not found at ${OPEN_GYM_CATALOGUE}`);
  process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const files = fs.readdirSync(OPEN_GYM_CATALOGUE).filter(f => f.endsWith('.json'));
console.log(`[RAG Indexer] Found ${files.length} exercise files.`);

const rawMap = new Map();
for (const file of files) {
  try {
    const raw = fs.readFileSync(path.join(OPEN_GYM_CATALOGUE, file), 'utf-8');
    const item = JSON.parse(raw);
    const id = String(item.id || file.replace('.json', '')).padStart(4, '0');
    rawMap.set(id, item);
  } catch (err) {
    // skip
  }
}

// Biomechanical Inference Helpers
function norm(s) { return (s || '').toLowerCase().replace(/[\-_/]/g, ' ').trim(); }

function classifyApparatus(rawEquipment, rawName) {
  const eq = norm(rawEquipment);
  const n = norm(rawName);
  if (eq.includes('smith') || n.includes('smith')) return { apparatusGroup: 'smith_machine', hardwareDetail: 'smith_machine' };
  if (eq.includes('cable') || eq.includes('rope') || n.includes('cable') || n.includes('pulldown') || n.includes('pushdown')) return { apparatusGroup: 'cable', hardwareDetail: 'cable_stack' };
  if (eq.includes('dumbbell') || n.includes('dumbbell') || n.includes('db ')) return { apparatusGroup: 'dumbbell', hardwareDetail: 'dumbbell' };
  if (eq.includes('kettlebell') || n.includes('kettlebell') || n.includes('kb ')) return { apparatusGroup: 'kettlebell', hardwareDetail: 'kettlebell' };
  if (eq.includes('trap bar') || n.includes('trap bar') || n.includes('hex bar')) return { apparatusGroup: 'barbell', hardwareDetail: 'trap_bar' };
  if (eq.includes('ez') || n.includes('ez bar') || n.includes('ez barbell')) return { apparatusGroup: 'barbell', hardwareDetail: 'ez_barbell' };
  if (eq.includes('barbell') || eq.includes('olympic') || n.includes('barbell')) return { apparatusGroup: 'barbell', hardwareDetail: 'barbell' };
  if (eq.includes('leverage machine') || eq.includes('sled') || eq.includes('machine') || n.includes('machine')) {
    if (n.includes('plate loaded') || n.includes('leverage') || eq.includes('leverage')) return { apparatusGroup: 'machine', hardwareDetail: 'plate_loaded' };
    return { apparatusGroup: 'machine', hardwareDetail: 'pin_selectorized' };
  }
  if (eq.includes('band') || n.includes('band')) return { apparatusGroup: 'band', hardwareDetail: 'resistance_band' };
  if (eq.includes('plate') || eq.includes('weighted')) return { apparatusGroup: 'plate', hardwareDetail: 'weight_plate' };
  if (eq.includes('suspension') || n.includes('trx')) return { apparatusGroup: 'bodyweight', hardwareDetail: 'suspension_trainer' };
  if (eq.includes('body weight') || eq.includes('assisted') || eq === 'none' || !eq) {
    if (n.includes('pull up') || n.includes('chin up') || n.includes('dip')) return { apparatusGroup: 'bodyweight', hardwareDetail: 'calisthenic_bar' };
    return { apparatusGroup: 'bodyweight', hardwareDetail: 'bodyweight' };
  }
  return { apparatusGroup: 'other', hardwareDetail: 'other' };
}

function classifyMovementPattern(name, target, bodyPart) {
  const n = norm(name);
  const t = norm(target);
  const bp = norm(bodyPart);
  if (bp.includes('cardio') || t.includes('cardio') || n.includes('run') || n.includes('bike')) return 'cardio';
  if (bp.includes('waist') || t.includes('abs')) {
    if (n.includes('twist') || n.includes('woodchop')) return 'core_rotation';
    if (n.includes('plank') || n.includes('rollout')) return 'core_stability';
    return 'core_flexion';
  }
  if (n.includes('squat') || n.includes('leg press') || n.includes('hack')) return 'squat';
  if (n.includes('lunge') || n.includes('split squat')) return 'lunge';
  if (n.includes('deadlift') || n.includes('rdl') || n.includes('hip thrust') || n.includes('good morning')) return 'hip_hinge';
  if (n.includes('overhead press') || n.includes('shoulder press') || n.includes('military press')) return 'vertical_push';
  if (n.includes('pulldown') || n.includes('pull up') || n.includes('chin up') || n.includes('lat pull')) return 'vertical_pull';
  if (n.includes('bench press') || n.includes('chest press') || n.includes('push up') || n.includes('dip')) return 'horizontal_push';
  if (n.includes('row') || n.includes('face pull')) return 'horizontal_pull';
  return 'isolation';
}

function inferSubdivision(name, target) {
  const n = norm(name);
  const t = norm(target);
  if (t.includes('pec') || t.includes('chest') || n.includes('bench')) {
    if (n.includes('incline')) return 'chest_clavicular';
    if (n.includes('decline') || n.includes('dip')) return 'chest_costal';
    return 'chest_sternal';
  }
  if (t.includes('lat') || n.includes('pulldown') || n.includes('pull up')) {
    if (n.includes('close') || n.includes('neutral') || n.includes('pulldown')) return 'lat_iliac';
    return 'back_rhomboids';
  }
  if (t.includes('delt') || t.includes('shoulder')) {
    if (n.includes('lateral') || n.includes('side')) return 'deltoid_lateral';
    if (n.includes('rear') || n.includes('reverse') || n.includes('face pull')) return 'deltoid_posterior';
    return 'deltoid_anterior';
  }
  if (t.includes('quad') || n.includes('squat') || n.includes('leg press')) {
    if (n.includes('extension')) return 'quad_shortened';
    return 'quad_lengthened';
  }
  if (t.includes('hamstring') || t.includes('glute') || n.includes('deadlift')) {
    if (n.includes('curl')) return 'hamstring_knee';
    if (n.includes('thrust') || n.includes('bridge')) return 'glute_max_shortened';
    return 'hamstring_hip';
  }
  if (t.includes('tricep')) {
    if (n.includes('overhead') || n.includes('french') || n.includes('skull')) return 'tricep_long_head';
    return 'tricep_lateral';
  }
  if (t.includes('bicep')) {
    if (n.includes('preacher') || n.includes('spider')) return 'bicep_short_head';
    return 'bicep_long_head';
  }
  return 'general';
}

const catalogue = [];
for (const [id, item] of rawMap.entries()) {
  const parentId = item.variantOf ? String(item.variantOf).padStart(4, '0') : null;
  const base = parentId ? rawMap.get(parentId) : null;

  const name = typeof item.name === 'string' && item.name
    ? item.name
    : (base && typeof base.name === 'string' ? `${base.name}` : `Exercise ${id}`);

  const bodyPart = String(item.bodyPart || base?.bodyPart || '');
  const equipment = String(item.equipment || base?.equipment || '');
  const target = String(item.target || base?.target || '');
  const secondaryMuscles = Array.isArray(item.secondaryMuscles) && item.secondaryMuscles.length > 0
    ? item.secondaryMuscles
    : (Array.isArray(base?.secondaryMuscles) ? base.secondaryMuscles : []);

  const category = String(item.category || base?.category || 'strength');
  const description = String(item.description || base?.description || '');
  const instructions = Array.isArray(item.instructions) && item.instructions.length > 0
    ? item.instructions.slice(0, 4)
    : (Array.isArray(base?.instructions) ? base.instructions.slice(0, 4) : []);

  const muscleMap = item.muscleMap || base?.muscleMap || undefined;
  const clipUrl = `https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/${id}.mp4`;
  const imageUrl = `https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/still/${id}.webp`;

  const app = classifyApparatus(equipment, name);
  const pattern = classifyMovementPattern(name, target, bodyPart);
  const subdivision = inferSubdivision(name, target);

  catalogue.push({
    id,
    name,
    bodyPart,
    equipment,
    target,
    secondaryMuscles,
    category,
    description,
    instructions,
    muscleMap,
    femaleVariant: item.femaleVariant ? String(item.femaleVariant).padStart(4, '0') : undefined,
    maleVariant: item.maleVariant ? String(item.maleVariant).padStart(4, '0') : undefined,
    variantOf: item.variantOf ? String(item.variantOf).padStart(4, '0') : undefined,
    clipUrl,
    imageUrl,
    videoUrl: clipUrl,
    apparatusGroup: app.apparatusGroup,
    hardwareDetail: app.hardwareDetail,
    movementPattern: pattern,
    muscleSubdivision: subdivision,
    mechanics: pattern === 'isolation' ? 'isolation' : 'compound',
    resistanceProfile: app.apparatusGroup === 'cable' ? 'constant' : (name.includes('incline') || name.includes('rdl') ? 'lengthened' : 'ascending'),
    axialLoading: (app.apparatusGroup === 'barbell' && (name.includes('squat') || name.includes('overhead'))) ? 'high' : 'none',
  });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalogue), 'utf-8');
console.log(`[RAG Indexer] Successfully indexed ${catalogue.length} exercises -> ${OUTPUT_FILE}`);
