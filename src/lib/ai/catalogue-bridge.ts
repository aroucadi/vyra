/**
 * Universal Isomorphic Exercise Catalogue Bridge
 *
 * Safely provides the 6,554-exercise OpenGym RAG dataset on Node.js server/test runtimes
 * without pulling `node:fs` into Next.js Turbopack browser client chunks, and asynchronously
 * preloads `/data/exercise-catalogue.json` (6,554 exercises) on browser clients.
 */

import { RagExercise } from "@/types/exercise-rag";
import { appStore } from "../store";

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

  // 1. Server / Node.js runtime: load full 6,554-exercise catalogue via non-bundled require
  if (typeof window === "undefined") {
    try {
      const dynamicRequire = eval("require");
      const loader = dynamicRequire("../rag/catalogue-loader");
      if (loader && typeof loader.loadExerciseCatalogue === "function") {
        const res = loader.loadExerciseCatalogue();
        if (res && Array.isArray(res.exercises) && res.exercises.length > 0) {
          cachedExercises = res.exercises;
          fullCatalogueLoaded = true;
          return cachedExercises!;
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
    cachedExercises = storeExercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      bodyPart: ex.primaryMuscle.toLowerCase(),
      target: ex.primaryMuscle.toLowerCase(),
      equipment: ex.equipment.toLowerCase(),
      secondaryMuscles: (ex.secondaryMuscles || []).map((m) => m.toLowerCase()),
      instructions: ex.steps || [],
      description: ex.steps?.join(" ") || ex.name,
      category: "strength",
    }));
    return cachedExercises;
  } catch {
    return [];
  }
}
