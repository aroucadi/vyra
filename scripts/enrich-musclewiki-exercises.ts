#!/usr/bin/env node

/**
 * MuscleWiki Database Enrichment & Migration Script
 * 
 * Fetches and caches high-fidelity exercise metadata (steps, difficulty, target muscles,
 * animated media, and MuscleWiki IDs) for NewME exercise library while strictly protecting
 * the Basic Tier quota (500 requests/month).
 * 
 * Usage:
 *   npx tsx scripts/enrich-musclewiki-exercises.ts
 *   npx tsx scripts/enrich-musclewiki-exercises.ts --api-key <KEY>
 *   npx tsx scripts/enrich-musclewiki-exercises.ts --offline
 *   npx tsx scripts/enrich-musclewiki-exercises.ts --dry-run
 */

import { Exercise } from "../src/lib/types";
import { alaaProgramMuscleWikiExercises } from "../src/db/seed/musclewiki-enriched-exercises";
import { seedExercises } from "../src/db/seed/exercises";

interface MuscleWikiApiExercise {
  id: number;
  name: string;
  category?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  target?: {
    primary?: string;
    secondary?: string[];
  };
  steps?: string[];
  media?: {
    male?: string[];
    female?: string[];
    og_image?: string;
  };
  url?: string;
}

interface EnrichmentOptions {
  apiKey?: string;
  offline: boolean;
  dryRun: boolean;
  limit: number;
}

// Parse CLI arguments
function parseArgs(): EnrichmentOptions {
  const args = process.argv.slice(2);
  const options: EnrichmentOptions = {
    apiKey: process.env.MUSCLEWIKI_API_KEY,
    offline: false,
    dryRun: false,
    limit: 50, // Strict quota safety guard (max 50 requests per execution)
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--api-key" && args[i + 1]) {
      options.apiKey = args[++i];
    } else if (arg === "--offline") {
      options.offline = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--limit" && args[i + 1]) {
      options.limit = parseInt(args[++i], 10) || 50;
    }
  }

  // Default to offline mode if no API key is provided
  if (!options.apiKey) {
    options.offline = true;
  }

  return options;
}

/**
 * Fetch exercise data from MuscleWiki API with quota safety tracking
 */
async function fetchMuscleWikiExercise(
  exerciseName: string,
  apiKey: string
): Promise<MuscleWikiApiExercise | null> {
  const endpoint = `https://api.musclewiki.com/v1/exercises?name=${encodeURIComponent(exerciseName)}`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`[Quota Warning] MuscleWiki rate limit reached (Status 429).`);
      }
      return null;
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0] as MuscleWikiApiExercise;
    }
    return null;
  } catch (error) {
    console.warn(`[Network Warning] Could not fetch ${exerciseName} from MuscleWiki:`, error);
    return null;
  }
}

/**
 * Main enrichment process
 */
export async function runEnrichment(options = parseArgs()): Promise<{
  totalEvaluated: number;
  totalEnriched: number;
  apiCallsMade: number;
  enrichedExercises: Exercise[];
}> {
  console.log("============================================================");
  console.log("🏋️ NewME × MuscleWiki Database Enrichment & Migration Engine");
  console.log(`   Mode: ${options.offline ? "Offline (Pre-Cached Dataset)" : "Live API"}`);
  console.log(`   Dry Run: ${options.dryRun ? "YES (Preview Only)" : "NO"}`);
  console.log(`   Quota Guard Limit: ${options.limit} calls max`);
  console.log("============================================================\n");

  let apiCallsMade = 0;
  let newlyEnrichedCount = 0;
  let alreadyEnrichedCount = 0;
  const enrichedExercises: Exercise[] = [];

  // Build offline lookup dictionary from pre-cached Alaa dataset
  const offlineMap = new Map<string, Exercise>();
  alaaProgramMuscleWikiExercises.forEach((ex) => {
    offlineMap.set(ex.name.toLowerCase().trim(), ex);
    if (ex.id) offlineMap.set(ex.id, ex);
  });

  for (const ex of seedExercises) {
    // If already has MuscleWiki ID, skip to protect quota
    if (ex.muscleWikiId) {
      alreadyEnrichedCount++;
      enrichedExercises.push(ex);
      console.log(`  ✓ Cached: "${ex.name}" (MuscleWiki ID: ${ex.muscleWikiId}, Steps: ${ex.steps?.length || 0})`);
      continue;
    }

    let enrichedData: Partial<Exercise> | null = null;

    if (options.offline) {
      // Check offline dictionary
      const match = offlineMap.get(ex.name.toLowerCase().trim());
      if (match) {
        enrichedData = {
          muscleWikiId: match.muscleWikiId,
          difficulty: match.difficulty,
          steps: match.steps,
          mediaUrls: match.mediaUrls,
          muscleWikiUrl: match.muscleWikiUrl,
        };
      }
    } else if (options.apiKey && apiCallsMade < options.limit) {
      console.log(`[API Call ${apiCallsMade + 1}/${options.limit}] Querying MuscleWiki for: "${ex.name}"...`);
      apiCallsMade++;
      const liveData = await fetchMuscleWikiExercise(ex.name, options.apiKey);
      if (liveData) {
        enrichedData = {
          muscleWikiId: liveData.id,
          difficulty: liveData.difficulty,
          steps: liveData.steps,
          mediaUrls: liveData.media?.male || liveData.media?.female,
          muscleWikiUrl: liveData.url,
        };
      }
    }

    if (enrichedData) {
      newlyEnrichedCount++;
      const merged: Exercise = {
        ...ex,
        ...enrichedData,
      };
      enrichedExercises.push(merged);
      console.log(`  ✓ Enriched "${ex.name}" (MuscleWiki ID: ${enrichedData.muscleWikiId}, Steps: ${enrichedData.steps?.length || 0})`);
    } else {
      enrichedExercises.push(ex);
    }
  }

  console.log("\n------------------------------------------------------------");
  console.log("📊 Migration & Seeding Summary:");
  console.log(`   • Total Exercises Evaluated: ${seedExercises.length}`);
  console.log(`   • Previously Cached & Protected: ${alreadyEnrichedCount}`);
  console.log(`   • Newly Enriched in this Run: ${newlyEnrichedCount}`);
  console.log(`   • MuscleWiki API Calls Made: ${apiCallsMade} (Quota remaining: ${500 - apiCallsMade}/500)`);
  console.log("------------------------------------------------------------\n");

  return {
    totalEvaluated: seedExercises.length,
    totalEnriched: newlyEnrichedCount + alreadyEnrichedCount,
    apiCallsMade,
    enrichedExercises,
  };
}

// Direct CLI entry point
if (require.main === module || process.argv[1]?.includes("enrich-musclewiki-exercises")) {
  runEnrichment()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Enrichment script failed:", err);
      process.exit(1);
    });
}
