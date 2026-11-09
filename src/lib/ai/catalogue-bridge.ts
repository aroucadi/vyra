/**
 * Universal Isomorphic Exercise Catalogue Bridge
 * 
 * Safely provides the 6,554-exercise OpenGym RAG dataset on Node.js server/test runtimes
 * without pulling `node:fs` into Next.js Turbopack browser client chunks.
 */

import { RagExercise } from "@/types/exercise-rag";
import { appStore } from "../store";

let cachedExercises: RagExercise[] | null = null;

export function loadSafeExerciseCatalogue(): RagExercise[] {
  if (cachedExercises && cachedExercises.length > 0) {
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
          return cachedExercises!;
        }
      }
    } catch {
      // Fallback to appStore catalogue below
    }
  }

  // 2. Browser Client / Fallback: map appStore exercises into RagExercise format
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
