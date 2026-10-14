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

const catalogue = [];
let skipped = 0;

for (const file of files) {
  try {
    const raw = fs.readFileSync(path.join(OPEN_GYM_CATALOGUE, file), 'utf-8');
    const item = JSON.parse(raw);

    // Strip bulky translation text if not needed in core retrieval index, keep compact
    catalogue.push({
      id: String(item.id).padStart(4, '0'),
      name: item.name || '',
      bodyPart: item.bodyPart || '',
      equipment: item.equipment || '',
      target: item.target || '',
      secondaryMuscles: Array.isArray(item.secondaryMuscles) ? item.secondaryMuscles : [],
      category: item.category || 'strength',
      description: item.description || '',
      instructions: Array.isArray(item.instructions) ? item.instructions.slice(0, 4) : [],
      muscleMap: item.muscleMap || undefined,
    });
  } catch (err) {
    skipped++;
  }
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalogue), 'utf-8');
console.log(`[RAG Indexer] Successfully indexed ${catalogue.length} exercises (skipped: ${skipped}) -> ${OUTPUT_FILE}`);
