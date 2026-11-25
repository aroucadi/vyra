import fs from 'node:fs';
import path from 'node:path';

const OPEN_GYM_CATALOGUE = path.resolve('..', 'openGym', 'catalogue', 'exercises');
const OUTPUT_FILE = path.resolve('public', 'data', 'exercise-catalogue.json');
const OUTPUT_DIR = path.dirname(OUTPUT_FILE);

console.log(`[Catalogue Compiler] Reading exercises from: ${OPEN_GYM_CATALOGUE}`);

if (!fs.existsSync(OPEN_GYM_CATALOGUE)) {
  console.error(`Error: openGym catalogue directory not found at ${OPEN_GYM_CATALOGUE}`);
  process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const files = fs.readdirSync(OPEN_GYM_CATALOGUE).filter(f => f.endsWith('.json'));
console.log(`[Catalogue Compiler] Found ${files.length} exercise files.`);

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
    ? item.instructions.slice(0, 5)
    : (Array.isArray(base?.instructions) ? base.instructions.slice(0, 5) : []);

  const muscleMap = item.muscleMap || base?.muscleMap || undefined;
  const clipUrl = `https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/${id}.mp4`;
  const imageUrl = `https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/still/${id}.webp`;

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
  });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalogue), 'utf-8');
const stats = fs.statSync(OUTPUT_FILE);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`[Catalogue Compiler] Compiled ${catalogue.length} exercises into ${OUTPUT_FILE} (${sizeMb} MB)`);
