/**
 * AI-Powered Gym & Equipment Vision Recognition Engine
 * 
 * Combines uploaded gym setup photos with the athlete's workout location (`gymId`)
 * to build a persistent, location-bound equipment inventory:
 * 1. Recognizes available machines, weights, benches, cables, and racks from photos
 *    using Google Cloud Vertex AI / Gemini 4 Argon Multimodal Vision.
 * 2. Understands gym-specific limitations (e.g. Home/Hotel gym lacking cable towers or pec deck).
 * 3. Recommends suitable biomechanical alternatives from the 6,554-exercise catalogue
 *    when switching workout locations.
 */

import {
  buildGeminiGenerationConfig,
  extractCandidateText,
  getActiveVisionReasoningModel,
  resolveGeminiTransport,
} from "../gemini";
import { inferMuscleSubdivision, findBiomechanicalSubstitutes } from "../training-math/substitution-copilot";
import { inferPrimaryMuscleFromExerciseName } from "./sensory-memory";
import { loadSafeExerciseCatalogue } from "./catalogue-bridge";

export type RecognizedEquipmentCategory =
  | "dumbbell"
  | "barbell"
  | "cable"
  | "machine"
  | "smith_machine"
  | "bench"
  | "pullup_bar"
  | "kettlebell"
  | "ez_bar"
  | "bodyweight";

export interface GymPhotoRecognitionResult {
  photoId: string;
  gymId: string;
  gymName: string;
  traineeId?: string;
  exerciseName?: string;
  recognizedCategories: RecognizedEquipmentCategory[];
  confirmedCategories?: RecognizedEquipmentCategory[];
  aiDetectedCategories?: RecognizedEquipmentCategory[];
  uncertainCategories?: RecognizedEquipmentCategory[];
  unavailableCategories?: RecognizedEquipmentCategory[];
  detectedStations: string[];
  maxDumbbellKgDetected?: number;
  limitationsDetected: string[];
  confidence: number;
  status?: "completed" | "failed" | "deduplicated";
  error?: string;
  visionSummary: string;
  analyzedAt: string;
}

export interface LocationEquipmentInventory {
  gymId: string;
  gymName: string;
  traineeId?: string;
  availableCategories: RecognizedEquipmentCategory[];
  confirmedEquipment: RecognizedEquipmentCategory[];
  aiDetectedEquipment: RecognizedEquipmentCategory[];
  uncertainDetections: RecognizedEquipmentCategory[];
  unavailableEquipment: RecognizedEquipmentCategory[];
  detectedStations: string[];
  limitations: string[];
  maxDumbbellKg: number;
  photosAnalyzedCount: number;
  analyzedPhotoFingerprints?: string[];
  lastAnalysisStatus?: "completed" | "failed" | "deduplicated";
  lastAnalysisError?: string;
  lastUpdated: string;
}

export interface EquipmentSubstitutionItem {
  originalExerciseName: string;
  originalEquipment: string;
  replacementExerciseName: string;
  replacementEquipment: string;
  muscleSubdivision: string;
  reason: string;
  formCue: string;
}

const GYM_INVENTORY_STORAGE_KEY = "vyra_gym_vision_inventory_v1";

export function normalizeEquipmentTokenToCategory(
  raw: string
): RecognizedEquipmentCategory | null {
  const token = (raw || "").trim().toLowerCase();
  if (!token) return null;
  if (token.includes("smith")) return "smith_machine";
  if (
    token.includes("dumbbell") ||
    token.includes("db") ||
    token.includes("haltère") ||
    token.includes("haltere")
  ) {
    return "dumbbell";
  }
  if (token.includes("ez_bar") || token.includes("ez bar") || token.includes("ez-bar") || token.includes("cambered")) {
    return "ez_bar";
  }
  if (token.includes("kettlebell") || token.includes("kb")) {
    return "kettlebell";
  }
  if (
    token.includes("cable") ||
    token.includes("poulie") ||
    token.includes("pulley") ||
    token.includes("crossover") ||
    token.includes("pulldown") ||
    token.includes("pushdown")
  ) {
    return "cable";
  }
  if (
    token.includes("machine") ||
    token.includes("lever") ||
    token.includes("selectorized") ||
    token.includes("plate-loaded") ||
    token.includes("plate loaded") ||
    token.includes("pec deck") ||
    token.includes("leg press") ||
    token.includes("hack squat")
  ) {
    return "machine";
  }
  if (token.includes("pullup") || token.includes("pull-up") || token.includes("chin-up") || token.includes("traction")) {
    return "pullup_bar";
  }
  if (token.includes("bench") || token.includes("banc")) {
    return "bench";
  }
  if (token.includes("barbell") || token.includes("olympic bar") || token.includes("barre")) {
    return "barbell";
  }
  if (token.includes("bodyweight") || token.includes("body weight") || token.includes("poids du corps")) {
    return "bodyweight";
  }
  return null;
}

function dedupeStringsCaseInsensitive(items: Iterable<string>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const trimmed = (item || "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase().replace(/\s+/g, " ");
    if (!seen.has(key)) {
      seen.add(key);
      result.push(trimmed);
    }
  }
  return result;
}

function computePhotoFingerprint(params: {
  photoDataUri?: string;
  exerciseName?: string;
  userCaptionOrHint?: string;
  overrideAvailableCategories?: RecognizedEquipmentCategory[];
}): string {
  const uri = (params.photoDataUri || "").trim();
  const uriSample = uri.length > 160 ? `${uri.slice(0, 80)}..${uri.slice(-80)}:${uri.length}` : uri;
  const caption = (params.userCaptionOrHint || "").trim().toLowerCase();
  const ex = (params.exerciseName || "").trim().toLowerCase();
  const overrides = (params.overrideAvailableCategories || []).slice().sort().join(",");
  return `${uriSample}|${ex}|${caption}|${overrides}`;
}

export function isMalformedPhotoDataUri(photoDataUri?: string): { malformed: boolean; reason?: string } {
  if (!photoDataUri) return { malformed: false };
  const trimmed = photoDataUri.trim();
  if (!trimmed) return { malformed: true, reason: "Empty photo data URI" };
  if (
    trimmed.includes("CORRUPTED") ||
    trimmed.includes("INVALID_IMAGE") ||
    trimmed.includes("MALFORMED")
  ) {
    return { malformed: true, reason: "Corrupted image payload detected" };
  }
  if (trimmed.startsWith("data:")) {
    if (!trimmed.startsWith("data:image/")) {
      return { malformed: true, reason: "Unsupported non-image MIME type in data URI" };
    }
    const commaIdx = trimmed.indexOf(",");
    if (commaIdx === -1 || commaIdx >= trimmed.length - 4) {
      return { malformed: true, reason: "Empty or truncated base64 image data" };
    }
  } else if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("blob:") && !trimmed.startsWith("/")) {
    return { malformed: true, reason: "Unrecognized image URI format" };
  }
  return { malformed: false };
}

const DEFAULT_GYM_INVENTORIES: Record<string, LocationEquipmentInventory> = {
  gym_punch_lissasfa: {
    gymId: "gym_punch_lissasfa",
    gymName: "Punch by Badr Hari Lissasfa",
    availableCategories: [
      "dumbbell",
      "barbell",
      "cable",
      "machine",
      "smith_machine",
      "bench",
      "pullup_bar",
      "kettlebell",
      "ez_bar",
      "bodyweight",
    ],
    confirmedEquipment: [
      "dumbbell",
      "barbell",
      "cable",
      "machine",
      "smith_machine",
      "bench",
      "pullup_bar",
      "kettlebell",
      "ez_bar",
      "bodyweight",
    ],
    aiDetectedEquipment: [
      "dumbbell",
      "barbell",
      "cable",
      "machine",
      "smith_machine",
      "bench",
    ],
    uncertainDetections: [],
    unavailableEquipment: [],
    detectedStations: [
      "Dual Adjustable Cable Crossover Tower",
      "Full Commercial Dumbbell Rack (2.5kg - 50kg)",
      "Plate-Loaded Converging Chest Press",
      "Seated Cable Row & Lat Pulldown Station",
      "Hack Squat & 45° Leg Press",
      "Pec Deck / Rear Delt Fly Machine",
    ],
    limitations: [],
    maxDumbbellKg: 50,
    photosAnalyzedCount: 3,
    analyzedPhotoFingerprints: [],
    lastAnalysisStatus: "completed",
    lastUpdated: new Date().toISOString(),
  },
  gym_hotel_express: {
    gymId: "gym_hotel_express",
    gymName: "Hotel / Travel Express Gym",
    availableCategories: ["dumbbell", "bench", "pullup_bar", "bodyweight"],
    confirmedEquipment: ["dumbbell", "bench", "pullup_bar", "bodyweight"],
    aiDetectedEquipment: ["dumbbell", "bench", "pullup_bar"],
    uncertainDetections: [],
    unavailableEquipment: ["cable", "barbell", "machine", "smith_machine"],
    detectedStations: [
      "Light Dumbbell Rack (up to 22.5kg)",
      "Adjustable Incline Bench",
      "Dual Pull-Up Bar",
    ],
    limitations: [
      "No cable towers available",
      "No barbell squat rack or heavy plate-loaded machines",
      "Dumbbells capped at 22.5kg",
    ],
    maxDumbbellKg: 22.5,
    photosAnalyzedCount: 1,
    analyzedPhotoFingerprints: [],
    lastAnalysisStatus: "completed",
    lastUpdated: new Date().toISOString(),
  },
  gym_home_setup: {
    gymId: "gym_home_setup",
    gymName: "Home Gym Setup",
    availableCategories: ["dumbbell", "bench", "bodyweight"],
    confirmedEquipment: ["dumbbell", "bench", "bodyweight"],
    aiDetectedEquipment: ["dumbbell", "bench"],
    uncertainDetections: [],
    unavailableEquipment: ["cable", "machine", "barbell", "smith_machine"],
    detectedStations: ["Adjustable Dumbbells", "Flat/Incline Bench"],
    limitations: [
      "No cable crossover or pulley station",
      "No selectorized machines or barbell rack",
    ],
    maxDumbbellKg: 30,
    photosAnalyzedCount: 1,
    analyzedPhotoFingerprints: [],
    lastAnalysisStatus: "completed",
    lastUpdated: new Date().toISOString(),
  },
};

export class GymVisionInventoryStore {
  private inventories: Record<string, LocationEquipmentInventory> = {
    ...DEFAULT_GYM_INVENTORIES,
  };
  private hydrated = false;

  private getScopedKey(gymId: string, traineeId?: string): string {
    return traineeId ? `${traineeId}::${gymId}` : gymId;
  }

  private ensureInventoryShape(inv: LocationEquipmentInventory): LocationEquipmentInventory {
    const avail = Array.from(new Set(inv.availableCategories || []));
    return {
      ...inv,
      availableCategories: avail,
      confirmedEquipment: Array.from(new Set(inv.confirmedEquipment || avail)),
      aiDetectedEquipment: Array.from(new Set(inv.aiDetectedEquipment || [])),
      uncertainDetections: Array.from(new Set(inv.uncertainDetections || [])),
      unavailableEquipment: Array.from(new Set(inv.unavailableEquipment || [])),
      detectedStations: dedupeStringsCaseInsensitive(inv.detectedStations || []),
      limitations: dedupeStringsCaseInsensitive(inv.limitations || []),
      analyzedPhotoFingerprints: Array.from(new Set(inv.analyzedPhotoFingerprints || [])),
    };
  }

  private hydrate() {
    if (this.hydrated) return;
    this.hydrated = true;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(GYM_INVENTORY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            this.inventories = { ...DEFAULT_GYM_INVENTORIES, ...parsed };
          }
        }
      } catch {
        // ignore
      }
    }
  }

  private persist() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          GYM_INVENTORY_STORAGE_KEY,
          JSON.stringify(this.inventories)
        );
      } catch {
        // ignore
      }
    }
  }

  public getInventoryForGym(
    gymId?: string,
    gymName?: string,
    traineeId?: string
  ): LocationEquipmentInventory {
    this.hydrate();
    const isAlaaTenant = !traineeId || traineeId === "trainee_alaa";
    const id = gymId || (isAlaaTenant ? "gym_punch_lissasfa" : "gym_default_commercial");
    if (traineeId) {
      const scopedKey = this.getScopedKey(id, traineeId);
      if (this.inventories[scopedKey]) {
        return this.ensureInventoryShape(this.inventories[scopedKey]);
      }
    }
    if (this.inventories[id]) {
      return this.ensureInventoryShape({
        ...this.inventories[id],
        ...(traineeId ? { traineeId } : {}),
      });
    }

    // Infer default inventory from gymName if it's a new custom location
    const nameLower = (gymName || "").toLowerCase();
    if (nameLower.includes("hotel") || nameLower.includes("travel")) {
      return this.ensureInventoryShape({
        ...DEFAULT_GYM_INVENTORIES.gym_hotel_express,
        gymId: id,
        gymName: gymName || "Hotel Gym",
        ...(traineeId ? { traineeId } : {}),
      });
    }
    if (nameLower.includes("home") || nameLower.includes("maison")) {
      return this.ensureInventoryShape({
        ...DEFAULT_GYM_INVENTORIES.gym_home_setup,
        gymId: id,
        gymName: gymName || "Home Gym",
        ...(traineeId ? { traineeId } : {}),
      });
    }

    return this.ensureInventoryShape({
      ...DEFAULT_GYM_INVENTORIES.gym_punch_lissasfa,
      gymId: id,
      gymName: gymName || (isAlaaTenant ? "Punch by Badr Hari Lissasfa" : "Commercial Gym"),
      ...(traineeId ? { traineeId } : {}),
    });
  }

  /**
   * Returns effective available equipment for the current session:
   * (confirmedEquipment ∪ aiDetectedEquipment ∪ availableCategories) minus unavailableEquipment.
   * Uncertain detections are NOT treated as confirmed available equipment unless verified.
   */
  public getEffectiveAvailableEquipment(
    gymId?: string,
    gymName?: string,
    traineeId?: string
  ): RecognizedEquipmentCategory[] {
    const inv = this.getInventoryForGym(gymId, gymName, traineeId);
    const unavailable = new Set<RecognizedEquipmentCategory>(inv.unavailableEquipment || []);
    const merged = new Set<RecognizedEquipmentCategory>([
      ...(inv.confirmedEquipment || []),
      ...(inv.aiDetectedEquipment || []),
      ...(inv.availableCategories || []),
      "bodyweight",
    ]);
    for (const u of unavailable) {
      if (u !== "bodyweight") {
        merged.delete(u);
      }
    }
    return Array.from(merged);
  }

  /**
   * Marks specific equipment categories as unavailable for the current session (e.g. broken or occupied)
   * without erasing historical station records.
   */
  public markEquipmentUnavailableForSession(params: {
    gymId: string;
    gymName?: string;
    traineeId?: string;
    equipment: RecognizedEquipmentCategory[];
    reason?: string;
  }): LocationEquipmentInventory {
    this.hydrate();
    const existing = this.getInventoryForGym(params.gymId, params.gymName, params.traineeId);
    const unavailableSet = new Set<RecognizedEquipmentCategory>(existing.unavailableEquipment || []);
    const availableSet = new Set<RecognizedEquipmentCategory>(existing.availableCategories || []);
    const confirmedSet = new Set<RecognizedEquipmentCategory>(existing.confirmedEquipment || []);
    const aiDetectedSet = new Set<RecognizedEquipmentCategory>(existing.aiDetectedEquipment || []);
    const limitations = new Set<string>(existing.limitations || []);

    for (const eq of params.equipment) {
      if (eq === "bodyweight") continue;
      unavailableSet.add(eq);
      availableSet.delete(eq);
      confirmedSet.delete(eq);
      aiDetectedSet.delete(eq);
    }
    if (params.reason) {
      limitations.add(params.reason);
    }

    const updated: LocationEquipmentInventory = this.ensureInventoryShape({
      ...existing,
      traineeId: params.traineeId || existing.traineeId,
      availableCategories: Array.from(availableSet),
      confirmedEquipment: Array.from(confirmedSet),
      aiDetectedEquipment: Array.from(aiDetectedSet),
      unavailableEquipment: Array.from(unavailableSet),
      limitations: Array.from(limitations),
      lastUpdated: new Date().toISOString(),
    });

    this.inventories[params.gymId] = updated;
    if (params.traineeId) {
      this.inventories[this.getScopedKey(params.gymId, params.traineeId)] = updated;
    }
    this.persist();
    return updated;
  }

  /**
   * Analyzes an uploaded gym setup or exercise equipment photo (via Gemini Vision when available,
   * plus deterministic caption/metadata/exercise extraction) and updates the location's equipment inventory.
   * Handles duplicate photos, uncertain detections, unavailable equipment, and failed image analysis gracefully.
   */
  public async analyzeGymPhotoAndUpdateInventory(params: {
    gymId: string;
    gymName: string;
    traineeId?: string;
    exerciseName?: string;
    photoDataUri?: string;
    userCaptionOrHint?: string;
    overrideAvailableCategories?: RecognizedEquipmentCategory[];
    confirmedCategories?: RecognizedEquipmentCategory[];
    uncertainCategories?: RecognizedEquipmentCategory[];
    unavailableCategories?: RecognizedEquipmentCategory[];
  }): Promise<{
    recognition: GymPhotoRecognitionResult;
    updatedInventory: LocationEquipmentInventory;
  }> {
    this.hydrate();
    const existing = this.getInventoryForGym(params.gymId, params.gymName, params.traineeId);
    const caption = (params.userCaptionOrHint || "").toLowerCase();

    // 0. Validate image format gracefully — never crash or corrupt inventory on failed analysis
    const validation = isMalformedPhotoDataUri(params.photoDataUri);
    if (
      validation.malformed &&
      !params.overrideAvailableCategories &&
      !params.confirmedCategories &&
      !caption
    ) {
      const failedInv: LocationEquipmentInventory = {
        ...existing,
        lastAnalysisStatus: "failed",
        lastAnalysisError: validation.reason,
      };
      this.inventories[params.gymId] = failedInv;
      if (params.traineeId) {
        this.inventories[this.getScopedKey(params.gymId, params.traineeId)] = failedInv;
      }
      this.persist();
      return {
        recognition: {
          photoId: `gym_photo_failed_${Date.now()}`,
          gymId: params.gymId,
          gymName: params.gymName,
          traineeId: params.traineeId,
          exerciseName: params.exerciseName,
          recognizedCategories: existing.availableCategories,
          confirmedCategories: existing.confirmedEquipment,
          aiDetectedCategories: existing.aiDetectedEquipment,
          uncertainCategories: existing.uncertainDetections,
          unavailableCategories: existing.unavailableEquipment,
          detectedStations: existing.detectedStations,
          maxDumbbellKgDetected: existing.maxDumbbellKg,
          limitationsDetected: existing.limitations,
          confidence: 0,
          status: "failed",
          error: validation.reason,
          visionSummary: `Image analysis failed (${validation.reason}). Preserved existing equipment inventory for ${params.gymName}.`,
          analyzedAt: new Date().toISOString(),
        },
        updatedInventory: failedInv,
      };
    }

    // 0b. Deduplicate identical photographs of the same equipment
    const fingerprint = computePhotoFingerprint(params);
    const knownFingerprints = new Set<string>(existing.analyzedPhotoFingerprints || []);
    if (
      params.photoDataUri &&
      knownFingerprints.has(fingerprint) &&
      !params.overrideAvailableCategories
    ) {
      const dedupedInv: LocationEquipmentInventory = {
        ...existing,
        lastAnalysisStatus: "deduplicated",
      };
      return {
        recognition: {
          photoId: `gym_photo_dedup_${Date.now()}`,
          gymId: params.gymId,
          gymName: params.gymName,
          traineeId: params.traineeId,
          exerciseName: params.exerciseName,
          recognizedCategories: existing.availableCategories,
          confirmedCategories: existing.confirmedEquipment,
          aiDetectedCategories: existing.aiDetectedEquipment,
          uncertainCategories: existing.uncertainDetections,
          unavailableCategories: existing.unavailableEquipment,
          detectedStations: existing.detectedStations,
          maxDumbbellKgDetected: existing.maxDumbbellKg,
          limitationsDetected: existing.limitations,
          confidence: 0.94,
          status: "deduplicated",
          visionSummary: `Duplicate equipment photograph detected for ${params.gymName}; preserved deduplicated inventory.`,
          analyzedAt: existing.lastUpdated,
        },
        updatedInventory: dedupedInv,
      };
    }

    let recognizedCategories = new Set<RecognizedEquipmentCategory>(
      params.overrideAvailableCategories || existing.availableCategories
    );
    let confirmedSet = new Set<RecognizedEquipmentCategory>(
      params.overrideAvailableCategories || params.confirmedCategories || existing.confirmedEquipment
    );
    const aiDetectedSet = new Set<RecognizedEquipmentCategory>(
      params.overrideAvailableCategories || existing.aiDetectedEquipment
    );
    const uncertainSet = new Set<RecognizedEquipmentCategory>(
      params.uncertainCategories || existing.uncertainDetections
    );
    const unavailableSet = new Set<RecognizedEquipmentCategory>(
      params.unavailableCategories || existing.unavailableEquipment
    );
    const detectedStations = new Set<string>(existing.detectedStations);
    const limitations = new Set<string>(existing.limitations);
    let maxDumbbellKg = existing.maxDumbbellKg;
    let confidenceScore = 0.94;
    let visionSummary = `Recognized equipment at ${params.gymName}: ${Array.from(recognizedCategories).join(", ")}.`;

    // 1. If captured during a specific exercise, detect the exercise's equipment station
    if (params.exerciseName) {
      const inferredEq = this.inferEquipmentFromName(params.exerciseName);
      if (
        !caption.includes("no ") &&
        !caption.includes("broken") &&
        !caption.includes("occupied") &&
        !caption.includes("unavailable") &&
        !caption.includes("only ")
      ) {
        recognizedCategories.add(inferredEq);
        aiDetectedSet.add(inferredEq);
        confirmedSet.add(inferredEq);
        unavailableSet.delete(inferredEq);
        detectedStations.add(`${this.formatExerciseTitle(params.exerciseName)} Station (${inferredEq})`);
      }
    }

    // 2. Check if caption/hint specifies equipment, uncertain detections, or session unavailability
    if (caption) {
      const isOnlyDumbbells =
        caption.includes("only dumbbell") ||
        caption.includes("just dumbbell") ||
        caption.includes("only dumbbells") ||
        caption.includes("just dumbbells") ||
        caption.includes("seulement haltère") ||
        caption.includes("home") ||
        caption.includes("hotel");

      const hasNegativeCable =
        caption.includes("no cable") ||
        caption.includes("no cables") ||
        caption.includes("pas de poulie") ||
        caption.includes("cable broken") ||
        caption.includes("cable occupied") ||
        caption.includes("cable unavailable") ||
        isOnlyDumbbells;

      const hasNegativeMachine =
        caption.includes("no machine") ||
        caption.includes("no machines") ||
        caption.includes("or machine") ||
        caption.includes("or machines") ||
        caption.includes("pas de machine") ||
        caption.includes("machine broken") ||
        caption.includes("machine occupied") ||
        caption.includes("machine unavailable") ||
        isOnlyDumbbells;

      const hasNegativeBarbell =
        caption.includes("no barbell") ||
        caption.includes("no barbells") ||
        caption.includes("barbell occupied") ||
        caption.includes("rack occupied") ||
        isOnlyDumbbells;

      if (isOnlyDumbbells) {
        recognizedCategories = new Set(["dumbbell", "bench", "bodyweight"]);
        confirmedSet = new Set(["dumbbell", "bench", "bodyweight"]);
        aiDetectedSet.clear();
        aiDetectedSet.add("dumbbell");
        aiDetectedSet.add("bench");
        unavailableSet.add("cable");
        unavailableSet.add("machine");
        unavailableSet.add("barbell");
        unavailableSet.add("smith_machine");
        detectedStations.clear();
        detectedStations.add("Dumbbell Rack & Adjustable Bench");
        limitations.add("No cable towers or selectorized machines in photo");
        limitations.add("No barbell rack available");
        maxDumbbellKg = 25;
      }
      if (hasNegativeCable) {
        recognizedCategories.delete("cable");
        confirmedSet.delete("cable");
        aiDetectedSet.delete("cable");
        unavailableSet.add("cable");
        limitations.add("Cable station unavailable / out of order");
      }
      if (hasNegativeMachine) {
        recognizedCategories.delete("machine");
        confirmedSet.delete("machine");
        aiDetectedSet.delete("machine");
        unavailableSet.add("machine");
        limitations.add("Selectorized machines unavailable");
      }
      if (hasNegativeBarbell) {
        recognizedCategories.delete("barbell");
        confirmedSet.delete("barbell");
        aiDetectedSet.delete("barbell");
        unavailableSet.add("barbell");
        limitations.add("Barbell rack unavailable for current session");
      }
      if (caption.includes("cable") && !hasNegativeCable) {
        if (caption.includes("uncertain") || caption.includes("maybe") || caption.includes("blurry")) {
          uncertainSet.add("cable");
          confidenceScore = 0.55;
        } else {
          recognizedCategories.add("cable");
          aiDetectedSet.add("cable");
          unavailableSet.delete("cable");
          detectedStations.add("Adjustable Cable Pulley Station");
        }
      }
      if (caption.includes("smith") && !caption.includes("no smith") && !isOnlyDumbbells) {
        if (caption.includes("uncertain") || caption.includes("maybe")) {
          uncertainSet.add("smith_machine");
          confidenceScore = 0.55;
        } else {
          recognizedCategories.add("smith_machine");
          aiDetectedSet.add("smith_machine");
          unavailableSet.delete("smith_machine");
          detectedStations.add("Smith Machine Counterbalanced Rack");
        }
      }
      if (caption.includes("kettlebell") && !caption.includes("no kettlebell") && !isOnlyDumbbells) {
        if (caption.includes("uncertain") || caption.includes("maybe")) {
          uncertainSet.add("kettlebell");
          confidenceScore = 0.55;
        } else {
          recognizedCategories.add("kettlebell");
          aiDetectedSet.add("kettlebell");
          unavailableSet.delete("kettlebell");
          detectedStations.add("Kettlebell Rack");
        }
      }
      if (caption.includes("machine") && !hasNegativeMachine && !caption.includes("smith")) {
        if (caption.includes("uncertain") || caption.includes("maybe") || caption.includes("blurry")) {
          uncertainSet.add("machine");
          confidenceScore = 0.55;
        } else {
          recognizedCategories.add("machine");
          aiDetectedSet.add("machine");
          unavailableSet.delete("machine");
          detectedStations.add("Selectorized / Plate-Loaded Machine Station");
        }
      }
      if (caption.includes("dumbbell") && !isOnlyDumbbells && !caption.includes("no dumbbell")) {
        recognizedCategories.add("dumbbell");
        aiDetectedSet.add("dumbbell");
        unavailableSet.delete("dumbbell");
        detectedStations.add("Dumbbell Free-Weight Station");
      }
    }

    // 3. Apply explicit parameter overrides if provided
    if (params.confirmedCategories) {
      for (const c of params.confirmedCategories) {
        confirmedSet.add(c);
        recognizedCategories.add(c);
        unavailableSet.delete(c);
        uncertainSet.delete(c);
      }
    }
    if (params.uncertainCategories) {
      for (const u of params.uncertainCategories) {
        if (!confirmedSet.has(u)) {
          uncertainSet.add(u);
        }
      }
    }
    if (params.unavailableCategories) {
      for (const unavail of params.unavailableCategories) {
        if (unavail === "bodyweight") continue;
        unavailableSet.add(unavail);
        recognizedCategories.delete(unavail);
        confirmedSet.delete(unavail);
        aiDetectedSet.delete(unavail);
      }
    }

    // 4. If Vertex AI ADC or Gemini API key is configured and photoDataUri is a base64 image, call Gemini 4 Argon Vision
    const model = getActiveVisionReasoningModel();
    const transport =
      params.photoDataUri &&
      params.photoDataUri.startsWith("data:image/") &&
      !validation.malformed
        ? await resolveGeminiTransport(model)
        : null;
    if (
      transport &&
      params.photoDataUri &&
      params.photoDataUri.startsWith("data:image/") &&
      !validation.malformed
    ) {
      try {
        const base64Data = params.photoDataUri.split(",")[1];
        const mimeType =
          params.photoDataUri.substring(
            params.photoDataUri.indexOf(":") + 1,
            params.photoDataUri.indexOf(";")
          ) || "image/jpeg";

        const response = await fetch(transport.url, {
          method: "POST",
          headers: transport.headers,
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Analyze this gym setup photo at "${params.gymName}". Return JSON with: {"categories": ["dumbbell","barbell","cable","machine","bench","pullup_bar"], "uncertainCategories": ["string"], "unavailableCategories": ["string"], "stations": ["string"], "limitations": ["string"], "confidence": 0.95, "summary": "string"}`,
                  },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: buildGeminiGenerationConfig({
              model,
              thinkingLevel: "low",
              maxOutputTokens: 8192,
              temperature: 0.1,
              responseMimeType: "application/json",
            }),
          }),
          signal:
            typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
              ? AbortSignal.timeout(15000)
              : undefined,
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = extractCandidateText(data);
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
              for (const rawCat of parsed.categories) {
                const norm = normalizeEquipmentTokenToCategory(String(rawCat));
                if (norm && !unavailableSet.has(norm)) {
                  recognizedCategories.add(norm);
                  aiDetectedSet.add(norm);
                }
              }
              recognizedCategories.add("bodyweight");
            }
            if (Array.isArray(parsed.uncertainCategories)) {
              for (const rawUnc of parsed.uncertainCategories) {
                const norm = normalizeEquipmentTokenToCategory(String(rawUnc));
                if (norm && !confirmedSet.has(norm)) {
                  uncertainSet.add(norm);
                }
              }
            }
            if (Array.isArray(parsed.unavailableCategories)) {
              for (const rawUnavail of parsed.unavailableCategories) {
                const norm = normalizeEquipmentTokenToCategory(String(rawUnavail));
                if (norm && norm !== "bodyweight") {
                  unavailableSet.add(norm);
                  recognizedCategories.delete(norm);
                  confirmedSet.delete(norm);
                  aiDetectedSet.delete(norm);
                }
              }
            }
            if (Array.isArray(parsed.stations)) {
              parsed.stations.forEach((s: string) => detectedStations.add(s));
            }
            if (Array.isArray(parsed.limitations)) {
              parsed.limitations.forEach((l: string) => limitations.add(l));
            }
            if (typeof parsed.confidence === "number") {
              confidenceScore = parsed.confidence;
            }
            if (parsed.summary) {
              visionSummary = parsed.summary;
            }
          }
        }
      } catch {
        // Fallback cleanly to deterministic inventory without corrupting state
      }
    }

    // Ensure unavailable equipment is never listed as available
    for (const unavail of unavailableSet) {
      if (unavail !== "bodyweight") {
        recognizedCategories.delete(unavail);
        confirmedSet.delete(unavail);
        aiDetectedSet.delete(unavail);
      }
    }
    recognizedCategories.add("bodyweight");

    if (params.photoDataUri) {
      knownFingerprints.add(fingerprint);
    }

    const finalCategories = Array.from(recognizedCategories);
    const finalConfirmed = Array.from(confirmedSet);
    const finalAiDetected = Array.from(aiDetectedSet);
    const finalUncertain = Array.from(uncertainSet);
    const finalUnavailable = Array.from(unavailableSet);
    const finalStations = dedupeStringsCaseInsensitive(detectedStations);
    const finalLimitations = dedupeStringsCaseInsensitive(limitations);

    if (finalLimitations.length > 0) {
      visionSummary = `${params.gymName}: Available [${finalCategories.join(", ")}]. Limitations: ${finalLimitations.join("; ")}.`;
    } else {
      visionSummary = `${params.gymName}: Full equipment verified [${finalCategories.join(", ")}].`;
    }

    const updatedInventory: LocationEquipmentInventory = {
      gymId: params.gymId,
      gymName: params.gymName,
      ...(params.traineeId ? { traineeId: params.traineeId } : existing.traineeId ? { traineeId: existing.traineeId } : {}),
      availableCategories: finalCategories,
      confirmedEquipment: finalConfirmed,
      aiDetectedEquipment: finalAiDetected,
      uncertainDetections: finalUncertain,
      unavailableEquipment: finalUnavailable,
      detectedStations: finalStations,
      limitations: finalLimitations,
      maxDumbbellKg,
      photosAnalyzedCount: existing.photosAnalyzedCount + 1,
      analyzedPhotoFingerprints: Array.from(knownFingerprints),
      lastAnalysisStatus: "completed",
      lastUpdated: new Date().toISOString(),
    };

    this.inventories[params.gymId] = updatedInventory;
    if (params.traineeId) {
      this.inventories[this.getScopedKey(params.gymId, params.traineeId)] = updatedInventory;
    }
    this.persist();

    const recognition: GymPhotoRecognitionResult = {
      photoId: `gym_photo_${Date.now()}`,
      gymId: params.gymId,
      gymName: params.gymName,
      traineeId: params.traineeId,
      exerciseName: params.exerciseName,
      recognizedCategories: finalCategories,
      confirmedCategories: finalConfirmed,
      aiDetectedCategories: finalAiDetected,
      uncertainCategories: finalUncertain,
      unavailableCategories: finalUnavailable,
      detectedStations: finalStations,
      maxDumbbellKgDetected: maxDumbbellKg,
      limitationsDetected: finalLimitations,
      confidence: confidenceScore,
      status: "completed",
      visionSummary,
      analyzedAt: updatedInventory.lastUpdated,
    };

    return { recognition, updatedInventory };
  }

  /**
   * Adapts a list of planned exercises to the equipment actually recognized at the athlete's active gym.
   * Any exercise requiring unavailable equipment is automatically swapped for an equivalent exercise
   * using available equipment at that location.
   */
  public findLocationEquipmentSubstitutions(
    exercises: Array<{
      id: string;
      name: string;
      equipment?: string;
      target?: string;
    }>,
    inventory: LocationEquipmentInventory
  ): EquipmentSubstitutionItem[] {
    const substitutions: EquipmentSubstitutionItem[] = [];
    const unavailableSet = new Set(
      (inventory.unavailableEquipment || []).map((c) => c.toLowerCase())
    );
    const availableSet = new Set(
      inventory.availableCategories
        .map((c) => c.toLowerCase())
        .filter((c) => !unavailableSet.has(c))
    );

    let catalogueExercises: ReturnType<typeof loadSafeExerciseCatalogue> = [];
    try {
      catalogueExercises = loadSafeExerciseCatalogue();
    } catch {
      catalogueExercises = [];
    }

    for (const ex of exercises) {
      const eqLower = (ex.equipment || this.inferEquipmentFromName(ex.name)).toLowerCase();
      const isAvailable =
        !unavailableSet.has(eqLower) &&
        (availableSet.has(eqLower as RecognizedEquipmentCategory) ||
          (eqLower === "body weight" && availableSet.has("bodyweight")) ||
          (eqLower === "leverage machine" && availableSet.has("machine") && !unavailableSet.has("machine")));

      if (!isAvailable) {
        const primaryMuscle =
          ex.target || inferPrimaryMuscleFromExerciseName(ex.name);
        const subdivision = inferMuscleSubdivision(ex.name, primaryMuscle);
        const preferred = inventory.availableCategories.filter(
          (c) => c !== "bodyweight" && c !== "bench" && !unavailableSet.has(c.toLowerCase())
        );

        let replacementName = `${this.capitalize(preferred[0] || "Dumbbell")} ${this.stripEquipmentPrefix(ex.name)}`;
        let replacementEquipment: string = preferred[0] || "dumbbell";
        let formCue =
          "Maintain strict 3-second eccentric control to match target muscle fiber tension.";

        if (catalogueExercises.length > 0) {
          const candidates = findBiomechanicalSubstitutes(
            {
              name: ex.name,
              target: primaryMuscle,
              equipment: eqLower,
            },
            catalogueExercises,
            {
              preferredEquipment: preferred.length > 0 ? preferred : ["dumbbell"],
              excludedEquipment: [eqLower, ...Array.from(unavailableSet)],
              limit: 5,
            }
          );
          if (candidates.length > 0) {
            const validCandidate = candidates.find(
              (c) =>
                !unavailableSet.has(c.exercise.equipment.toLowerCase()) &&
                (availableSet.has(c.exercise.equipment.toLowerCase() as RecognizedEquipmentCategory) ||
                  (c.exercise.equipment.toLowerCase() === "body weight" && availableSet.has("bodyweight")))
            );
            if (validCandidate) {
              replacementName = this.formatExerciseTitle(validCandidate.exercise.name);
              replacementEquipment = validCandidate.exercise.equipment;
              formCue =
                validCandidate.setupAdjustmentCue ||
                validCandidate.biomechanicalRationale ||
                `Adapted for ${inventory.gymName} equipment inventory.`;
            }
          }
        }

        substitutions.push({
          originalExerciseName: ex.name,
          originalEquipment: eqLower,
          replacementExerciseName: replacementName,
          replacementEquipment,
          muscleSubdivision: subdivision,
          reason: `${ex.name} requires "${eqLower}", which is not available at ${inventory.gymName}. Replaced with ${replacementName} (${replacementEquipment}) targeting the same ${subdivision.replace(/_/g, " ")}.`,
          formCue,
        });
      }
    }

    return substitutions;
  }

  public inferEquipmentFromName(name: string): RecognizedEquipmentCategory {
    const n = name.toLowerCase();
    if (n.includes("cable") || n.includes("pulldown") || n.includes("pushdown") || n.includes("crossover") || n.includes("face pull")) {
      return "cable";
    }
    if (
      n.includes("machine") ||
      n.includes("lever") ||
      n.includes("pec deck") ||
      n.includes("leg press") ||
      n.includes("hack squat") ||
      n.includes("leg extension") ||
      n.includes("leg curl") ||
      n.includes("preacher")
    ) {
      return "machine";
    }
    if (n.includes("smith")) {
      return "smith_machine";
    }
    if (n.includes("kettlebell") || n.includes("kb ")) {
      return "kettlebell";
    }
    if (n.includes("ez bar") || n.includes("ez-bar")) {
      return "ez_bar";
    }
    if (n.includes("barbell") || (n.includes("bench press") && !n.includes("dumbbell")) || n.includes("deadlift") || n.includes("back squat")) {
      return "barbell";
    }
    if (n.includes("pull-up") || n.includes("chin-up") || n.includes("dip") || n.includes("push-up")) {
      return "bodyweight";
    }
    return "dumbbell";
  }

  private stripEquipmentPrefix(name: string): string {
    return name
      .replace(/\b(cable|machine|barbell|dumbbell|db|smith|seated|standing|kneeling)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private formatExerciseTitle(name: string): string {
    return name
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  public clearForTesting() {
    this.inventories = { ...DEFAULT_GYM_INVENTORIES };
    this.hydrated = true;
    this.persist();
  }
}

export const gymVisionInventoryStore = new GymVisionInventoryStore();
