/**
 * @file build-biomechanical-catalogue.ts
 * @description Compiles and enriches all 6,554 exercises with deep biomechanical metadata,
 * apparatus hardware classification, and movement vectors.
 */

import fs from 'node:fs';
import path from 'node:path';
import { enrichExerciseWithBiomechanics } from '../src/lib/rag/biomechanical-metadata';

const CATALOGUE_PATH = path.resolve(process.cwd(), 'public', 'data', 'exercise-catalogue.json');
const RAG_INDEX_PATH = path.resolve(process.cwd(), 'public', 'data', 'exercise-rag-index.json');

console.log('[Biomechanical Indexer] Loading exercises from:', CATALOGUE_PATH);

if (!fs.existsSync(CATALOGUE_PATH)) {
  console.error('Error: Catalogue file not found at', CATALOGUE_PATH);
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf-8'));
console.log(`[Biomechanical Indexer] Found ${rawData.length} exercises. Enriching...`);

const enrichedCatalogue = rawData.map((ex: any) => enrichExerciseWithBiomechanics(ex));

fs.writeFileSync(CATALOGUE_PATH, JSON.stringify(enrichedCatalogue), 'utf-8');
fs.writeFileSync(RAG_INDEX_PATH, JSON.stringify(enrichedCatalogue), 'utf-8');

const stats = fs.statSync(CATALOGUE_PATH);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`[Biomechanical Indexer] Successfully enriched ${enrichedCatalogue.length} exercises into:`);
console.log(` - ${CATALOGUE_PATH} (${sizeMb} MB)`);
console.log(` - ${RAG_INDEX_PATH}`);

// Sample check
const sample = enrichedCatalogue.find((e: any) => e.name.toLowerCase().includes('incline dumbbell bench press') || e.name.toLowerCase().includes('incline'));
if (sample) {
  console.log('\nSample Enriched Exercise:', JSON.stringify({
    id: sample.id,
    name: sample.name,
    apparatusGroup: sample.apparatusGroup,
    hardwareDetail: sample.hardwareDetail,
    muscleSubdivision: sample.muscleSubdivision,
    movementPattern: sample.movementPattern,
    mechanics: sample.mechanics,
    resistanceProfile: sample.resistanceProfile,
    axialLoading: sample.axialLoading,
    primaryMuscles: sample.primaryMuscles,
    clipUrl: sample.clipUrl,
  }, null, 2));
}
