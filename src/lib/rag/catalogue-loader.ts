/**
 * @file catalogue-loader.ts
 * @description High-performance ingestion loader for OpenGym's 6,554-exercise catalogue.
 * Imports and normalizes all exercise definitions, preserving IDs, names, muscle targets,
 * equipment, categories, instructions, and female/male variants.
 */

import fs from 'node:fs';
import path from 'node:path';
import { RagExercise } from '@/types/exercise-rag';

const DEFAULT_OPEN_GYM_PATHS = [
  path.resolve(process.cwd(), '..', 'openGym', 'catalogue', 'exercises'),
  'D:\\rouca\\DVM\\workPlace\\openGym\\catalogue\\exercises',
];

const COMPILED_CATALOGUE_PATH = path.resolve(process.cwd(), 'public', 'data', 'exercise-catalogue.json');

export interface CatalogueIngestionResult {
  exercises: RagExercise[];
  byId: Map<string, RagExercise>;
  aliases: Map<string, string>; // variantId -> baseId
  totalCount: number;
  durationMs: number;
  source: 'filesystem_json_files' | 'compiled_cache';
}

let inMemoryCatalogue: CatalogueIngestionResult | null = null;

/**
 * Finds the OpenGym exercise directory across common workspace paths.
 */
export function findOpenGymDirectory(customPath?: string): string | null {
  if (customPath && fs.existsSync(/*turbopackIgnore: true*/ customPath)) {
    return customPath;
  }
  for (const candidate of DEFAULT_OPEN_GYM_PATHS) {
    if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Parses and ingests all 6,554 exercise definitions from OpenGym catalogue.
 * Preserves IDs, names, muscle targets, equipment, categories, instructions, descriptions,
 * female variants, and resolves variantOf relationships.
 */
export function ingestCatalogueFromDirectory(dirPath: string): CatalogueIngestionResult {
  const t0 = performance.now();
  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json')).sort();
  
  const rawMap = new Map<string, Record<string, unknown>>();

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
      const item = JSON.parse(content);
      const id = String(item.id || file.replace('.json', '')).padStart(4, '0');
      rawMap.set(id, item);
    } catch (err) {
      console.error(`[Ingestion] Failed to parse ${file}:`, err);
    }
  }

  const byId = new Map<string, RagExercise>();
  const aliases = new Map<string, string>();
  const exercises: RagExercise[] = [];

  // Pass 1: Build base exercises
  for (const [id, item] of rawMap.entries()) {
    if (item.variantOf) {
      const targetId = String(item.variantOf).padStart(4, '0');
      aliases.set(id, targetId);
    }
  }

  // Pass 2: Complete all records with variant inheritance
  for (const [id, item] of rawMap.entries()) {
    const parentId = item.variantOf ? String(item.variantOf).padStart(4, '0') : null;
    const base = parentId ? rawMap.get(parentId) : null;

    const name = typeof item.name === 'string' && item.name
      ? item.name
      : (base && typeof base.name === 'string' ? `${base.name} (variant)` : `Exercise ${id}`);

    const bodyPart = String(item.bodyPart || base?.bodyPart || '');
    const equipment = String(item.equipment || base?.equipment || '');
    const target = String(item.target || base?.target || '');
    
    const secondaryMuscles: string[] = Array.isArray(item.secondaryMuscles)
      ? (item.secondaryMuscles as string[])
      : (base && Array.isArray(base.secondaryMuscles) ? (base.secondaryMuscles as string[]) : []);

    const category = String(item.category || base?.category || 'strength');
    const description = String(item.description || base?.description || '');
    
    const instructions: string[] = Array.isArray(item.instructions)
      ? (item.instructions as string[])
      : (base && Array.isArray(base.instructions) ? (base.instructions as string[]) : []);

    const femaleVariant = item.femaleVariant
      ? String(item.femaleVariant).padStart(4, '0')
      : undefined;

    const maleVariant = item.maleVariant
      ? String(item.maleVariant).padStart(4, '0')
      : undefined;

    const variantOf = item.variantOf
      ? String(item.variantOf).padStart(4, '0')
      : undefined;

    const textSource = typeof item.textSource === 'string' ? item.textSource : undefined;

    const muscleMap = (item.muscleMap as RagExercise['muscleMap']) || 
      (base?.muscleMap ? (base.muscleMap as RagExercise['muscleMap']) : undefined);

    const exercise: RagExercise = {
      id,
      name,
      bodyPart,
      equipment,
      target,
      secondaryMuscles,
      category,
      description,
      instructions,
      femaleVariant,
      maleVariant,
      variantOf,
      textSource,
      muscleMap,
    };

    byId.set(id, exercise);
    exercises.push(exercise);
  }

  const durationMs = performance.now() - t0;

  // Persist to compiled cache for Next.js runtime / production
  try {
    const outDir = path.dirname(COMPILED_CATALOGUE_PATH);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(COMPILED_CATALOGUE_PATH, JSON.stringify(exercises), 'utf-8');
  } catch (err) {
    // Non-fatal if filesystem is read-only
  }

  const result: CatalogueIngestionResult = {
    exercises,
    byId,
    aliases,
    totalCount: exercises.length,
    durationMs,
    source: 'filesystem_json_files',
  };

  inMemoryCatalogue = result;
  return result;
}

/**
 * Loads the catalogue either from the compiled JSON cache or directly from OpenGym catalogue.
 */
export function loadExerciseCatalogue(forceReload = false): CatalogueIngestionResult {
  if (inMemoryCatalogue && !forceReload) {
    return inMemoryCatalogue;
  }

  if (!forceReload && fs.existsSync(COMPILED_CATALOGUE_PATH)) {
    const t0 = performance.now();
    const raw = fs.readFileSync(COMPILED_CATALOGUE_PATH, 'utf-8');
    const exercises: RagExercise[] = JSON.parse(raw);
    const byId = new Map<string, RagExercise>();
    const aliases = new Map<string, string>();

    for (const ex of exercises) {
      byId.set(ex.id, ex);
      if (ex.variantOf) {
        aliases.set(ex.id, ex.variantOf);
      }
    }

    const result: CatalogueIngestionResult = {
      exercises,
      byId,
      aliases,
      totalCount: exercises.length,
      durationMs: performance.now() - t0,
      source: 'compiled_cache',
    };

    inMemoryCatalogue = result;
    return result;
  }

  const openGymDir = findOpenGymDirectory();
  if (openGymDir) {
    return ingestCatalogueFromDirectory(openGymDir);
  }

  throw new Error(
    `Cannot load OpenGym catalogue: Directory not found at ${DEFAULT_OPEN_GYM_PATHS.join(' or ')} and no compiled cache exists at ${COMPILED_CATALOGUE_PATH}`
  );
}

/**
 * Get an exercise by ID, automatically resolving drawing aliases if needed.
 */
export function getExerciseById(id: string): RagExercise | null {
  const catalogue = loadExerciseCatalogue();
  const normalizedId = String(id).padStart(4, '0');
  
  if (catalogue.byId.has(normalizedId)) {
    return catalogue.byId.get(normalizedId)!;
  }

  if (catalogue.aliases.has(normalizedId)) {
    const canonicalId = catalogue.aliases.get(normalizedId)!;
    return catalogue.byId.get(canonicalId) || null;
  }

  return null;
}
