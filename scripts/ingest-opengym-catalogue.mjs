import fs from 'node:fs';
import path from 'node:path';

const OPEN_GYM_CATALOGUE = path.resolve('..', 'openGym', 'catalogue', 'exercises');
const OUTPUT_FILE = path.resolve('public', 'data', 'exercise-catalogue.json');
const OUTPUT_DIR = path.dirname(OUTPUT_FILE);

console.log(`[Catalogue Ingestion] Reading exercises from: ${OPEN_GYM_CATALOGUE}`);

if (!fs.existsSync(OPEN_GYM_CATALOGUE)) {
  console.error(`Error: openGym catalogue directory not found at ${OPEN_GYM_CATALOGUE}`);
  process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const files = fs.readdirSync(OPEN_GYM_CATALOGUE).filter(f => f.endsWith('.json')).sort();
console.log(`[Catalogue Ingestion] Found ${files.length} exercise files.`);

const rawExercises = new Map();

for (const file of files) {
  try {
    const raw = fs.readFileSync(path.join(OPEN_GYM_CATALOGUE, file), 'utf-8');
    const item = JSON.parse(raw);
    const id = String(item.id || file.replace('.json', '')).padStart(4, '0');
    rawExercises.set(id, item);
  } catch (err) {
    console.error(`Error parsing ${file}:`, err);
  }
}

console.log(`[Catalogue Ingestion] Successfully parsed ${rawExercises.size} raw files.`);

const catalogue = [];

for (const [id, item] of rawExercises.entries()) {
  const base = item.variantOf ? rawExercises.get(String(item.variantOf).padStart(4, '0')) : null;

  const exercise = {
    id,
    name: item.name || (base ? `${base.name} (variant)` : ''),
    bodyPart: item.bodyPart || base?.bodyPart || '',
    equipment: item.equipment || base?.equipment || '',
    target: item.target || base?.target || '',
    secondaryMuscles: Array.isArray(item.secondaryMuscles)
      ? item.secondaryMuscles
      : (base && Array.isArray(base.secondaryMuscles) ? base.secondaryMuscles : []),
    category: item.category || base?.category || 'strength',
    description: item.description || base?.description || '',
    instructions: Array.isArray(item.instructions)
      ? item.instructions
      : (base && Array.isArray(base.instructions) ? base.instructions : []),
    ...(item.femaleVariant ? { femaleVariant: String(item.femaleVariant).padStart(4, '0') } : {}),
    ...(item.maleVariant ? { maleVariant: String(item.maleVariant).padStart(4, '0') } : {}),
    ...(item.variantOf ? { variantOf: String(item.variantOf).padStart(4, '0') } : {}),
    ...(item.textSource ? { textSource: item.textSource } : {}),
    ...(item.muscleMap ? { muscleMap: item.muscleMap } : (base?.muscleMap ? { muscleMap: base.muscleMap } : {})),
  };

  catalogue.push(exercise);
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalogue, null, 2), 'utf-8');
const stats = fs.statSync(OUTPUT_FILE);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`[Catalogue Ingestion] Wrote 100% of ${catalogue.length} exercises to ${OUTPUT_FILE} (${sizeMb} MB)`);
