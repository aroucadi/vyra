/**
 * @file safe-exercise-lookup.ts
 * @description Isomorphic server-safe exercise lookup helper.
 * Loads compiled exercise-catalogue.json synchronously when executing on Node.js
 * without statically importing `node:fs` (so client bundles importing training-math remain clean).
 */

import type { RagExercise } from "@/types/exercise-rag";

type NodeFsLike = typeof import("node:fs");
type NodePathLike = typeof import("node:path");
type ProcessWithBuiltin = NodeJS.Process & {
  getBuiltinModule?: <T = unknown>(id: string) => T | undefined;
};

export interface LookupExerciseRecord extends Partial<RagExercise> {
  eq?: string;
  n?: string;
}

let cachedById: Map<string, LookupExerciseRecord> | null = null;
let cachedAliases: Map<string, string> | null = null;
let attemptedLoad = false;

export function safeGetExerciseById(id: string): LookupExerciseRecord | null {
  if (typeof window !== "undefined") return null;

  if (!attemptedLoad) {
    attemptedLoad = true;
    try {
      const getBuiltin = (process as ProcessWithBuiltin).getBuiltinModule;
      const fsMod = getBuiltin?.<NodeFsLike>("node:fs");
      const pathMod = getBuiltin?.<NodePathLike>("node:path");
      if (fsMod && pathMod) {
        const filePath = pathMod.resolve(
          process.cwd(),
          "public",
          "data",
          "exercise-catalogue.json"
        );
        if (fsMod.existsSync(filePath)) {
          const raw = fsMod.readFileSync(filePath, "utf-8");
          const list = JSON.parse(raw) as LookupExerciseRecord[];
          if (Array.isArray(list)) {
            const byId = new Map<string, LookupExerciseRecord>();
            const aliases = new Map<string, string>();
            for (const ex of list) {
              if (ex.id) {
                const normId = String(ex.id).padStart(4, "0");
                byId.set(normId, ex);
                if (ex.variantOf) {
                  aliases.set(normId, String(ex.variantOf).padStart(4, "0"));
                }
              }
            }
            cachedById = byId;
            cachedAliases = aliases;
          }
        }
      }
    } catch {
      cachedById = null;
      cachedAliases = null;
    }
  }

  if (!cachedById) return null;
  const normalizedId = String(id).padStart(4, "0");
  if (cachedById.has(normalizedId)) {
    return cachedById.get(normalizedId) || null;
  }
  const aliasTarget = cachedAliases?.get(normalizedId);
  if (aliasTarget && cachedById.has(aliasTarget)) {
    return cachedById.get(aliasTarget) || null;
  }
  return null;
}
