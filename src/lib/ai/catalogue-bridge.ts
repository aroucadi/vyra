/**
 * Universal Isomorphic Exercise Catalogue Bridge
 *
 * Safely provides the 6,554-exercise OpenGym RAG dataset on Node.js server/test runtimes
 * without pulling `node:fs` into Next.js Turbopack browser client chunks, and asynchronously
 * preloads `/data/exercise-catalogue.json` (6,554 exercises) on browser clients.
 */

import { RagExercise } from "@/types/exercise-rag";
import { appStore } from "../store";
import { enrichExerciseWithBiomechanics } from "@/lib/rag/biomechanical-metadata";

let cachedExercises: RagExercise[] | null = null;
let fullCatalogueLoaded = false;
let browserPreloadPromise: Promise<RagExercise[]> | null = null;

/**
 * Asynchronously preloads the full 6,554-exercise OpenGym dataset in browser runtimes
 * from `/data/exercise-catalogue.json` so client-side RAG and JIT evaluation operate
 * on the complete 6,554-exercise knowledge base rather than a subset.
 */
export async function preloadFullOpenGymCatalogue(): Promise<RagExercise[]> {
  if (fullCatalogueLoaded && cachedExercises && cachedExercises.length > 1000) {
    return cachedExercises;
  }
  if (typeof window === "undefined") {
    return loadSafeExerciseCatalogue();
  }
  if (browserPreloadPromise) {
    return browserPreloadPromise;
  }
  browserPreloadPromise = (async () => {
    try {
      const res = await fetch("/data/exercise-catalogue.json");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.exercises)
            ? data.exercises
            : [];
        if (list.length > 0) {
          cachedExercises = list as RagExercise[];
          fullCatalogueLoaded = true;
          return cachedExercises;
        }
      }
    } catch {
      // Keep store fallback when offline
    }
    return cachedExercises || [];
  })();

  return browserPreloadPromise;
}

export function loadSafeExerciseCatalogue(): RagExercise[] {
  if (fullCatalogueLoaded && cachedExercises && cachedExercises.length > 0) {
    return cachedExercises;
  }

  // 1. Server / Node.js runtime: load full 6,554-exercise catalogue synchronously via process.getBuiltinModule
  if (typeof window === "undefined") {
    try {
      const getBuiltin = (process as unknown as { getBuiltinModule?: <T = unknown>(id: string) => T | undefined }).getBuiltinModule;
      const fsMod = getBuiltin?.<{ existsSync: (p: string) => boolean; readFileSync: (p: string, enc: string) => string }>("node:fs");
      const pathMod = getBuiltin?.<{ resolve: (...args: string[]) => string }>("node:path");
      if (fsMod && pathMod) {
        const filePath = pathMod.resolve(process.cwd(), "public", "data", "exercise-catalogue.json");
        if (fsMod.existsSync(filePath)) {
          const raw = fsMod.readFileSync(filePath, "utf-8");
          const list = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) {
            cachedExercises = list as RagExercise[];
            fullCatalogueLoaded = true;
            return cachedExercises;
          }
        }
      }
    } catch {
      // Fallback to appStore catalogue below
    }
  } else if (!browserPreloadPromise) {
    // Trigger background hydration of all 6,554 OpenGym exercises in browser
    void preloadFullOpenGymCatalogue();
  }

  if (cachedExercises && cachedExercises.length > 0) {
    return cachedExercises;
  }

  // 2. Immediate synchronous fallback while browser fetch resolves
  try {
    const storeExercises = appStore.getExercises();
    cachedExercises = storeExercises.map((ex) => {
      const enriched = enrichExerciseWithBiomechanics({
        id: ex.id,
        name: ex.name,
        target: ex.primaryMuscle.toLowerCase(),
        bodyPart: ex.primaryMuscle.toLowerCase(),
        equipment: ex.equipment.toLowerCase(),
        secondaryMuscles: (ex.secondaryMuscles || []).map((m) => m.toLowerCase()),
        instructions: ex.steps || [],
        description: ex.steps?.join(" ") || ex.name,
        category: "strength",
      });
      return {
        ...enriched,
        clipUrl: ex.videoUrl || `https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/${ex.id}.mp4`,
        imageUrl: ex.imageUrl || `https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/still/${ex.id}.webp`,
        videoUrl: ex.videoUrl || `https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/${ex.id}.mp4`,
      } as RagExercise;
    });
    return cachedExercises;
  } catch {
    return [];
  }
}
