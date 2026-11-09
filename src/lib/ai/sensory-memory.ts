/**
 * Athlete Sensory Memory & Multimodal Feedback RAG Engine
 * 
 * Implements:
 * 1. Canonical Dual-Representation Ingestion (French / Darija / English Audio & Text -> Canonical CSCS English Entities)
 * 2. Deterministic Exercise & Anatomical Subdivision Binding (inferMuscleSubdivision)
 * 3. L2-Normalized Vector Space Embedding & Cosine Similarity Retrieval (RAG)
 */

import { ExerciseBiofeedbackTag } from "../types";
import { inferMuscleSubdivision, inferResistanceProfile, MuscleSubdivision } from "../training-math/substitution-copilot";
import { getStorageAdapter } from "../storage/adapter";
import { computeBiomechanicalEmbedding, cosineSimilarity } from "./vector-engine";

export interface BiomechanicalEntities {
  symptoms: string[];
  compensations: string[];
  phase?: "eccentric" | "concentric" | "lockout" | "stretch" | "isometric";
  severity: "none" | "mild" | "moderate" | "acute";
}

export interface SensoryFeedbackEntry {
  id: string;
  traineeId: string;
  sessionId: string;
  date: string;
  exerciseId?: string;
  exerciseName: string;
  primaryMuscle: string;
  muscleSubdivision: MuscleSubdivision;
  tags: ExerciseBiofeedbackTag[];
  freeTextNote?: string;
  audioNoteUrl?: string;
  originalLanguage: "fr" | "en" | "ar" | "mixed";
  rawTranscription?: string;
  canonicalEnglishSummary: string;
  biomechanicalEntities: BiomechanicalEntities;
  embeddingVector: number[];
  gymId: string;
  gymName?: string;
  epochMs: number;
}

export interface IngestFeedbackInput {
  traineeId: string;
  sessionId: string;
  date?: string;
  exerciseId?: string;
  exerciseName: string;
  primaryMuscle?: string;
  tags?: ExerciseBiofeedbackTag[];
  freeTextNote?: string;
  audioNoteUrl?: string;
  audioTranscript?: string;
  gymId?: string;
  gymName?: string;
}

export interface SensoryRagQuery {
  traineeId: string;
  exerciseName?: string;
  primaryMuscle?: string;
  muscleSubdivision?: MuscleSubdivision;
  searchQuery?: string;
  symptomsFilter?: string[];
  limit?: number;
}

export interface SensoryRagMatch {
  entry: SensoryFeedbackEntry;
  cosineSimilarity: number;
  relevanceScore: number;
  matchReasons: string[];
}

// Multilingual dictionary for French / Darija / English biomechanical entity extraction
const MULTILINGUAL_SYMPTOM_MAP: Array<{ pattern: RegExp; canonical: string }> = [
  { pattern: /pincement|pinch|impingement|coincement|accrochage/i, canonical: "anterior_shoulder_pinch" },
  { pattern: /claquement|clic|click|craquement|popping/i, canonical: "joint_clicking" },
  { pattern: /douleur|pain|mal|ache|brule|brûlure|lancinant|dârni|darni/i, canonical: "acute_joint_discomfort" },
  { pattern: /coude|elbow|épicondylite|tendinite/i, canonical: "elbow_tendon_strain" },
  { pattern: /lombaire|bas du dos|lower back|lumbar|sciatique/i, canonical: "lumbar_axial_strain" },
  { pattern: /poignet|wrist/i, canonical: "wrist_valgus_strain" },
  { pattern: /genou|knee|rotule/i, canonical: "patellar_tracking_friction" },
  { pattern: /épaule|shoulder|deltoïde|deltoid|coiffe/i, canonical: "glenohumeral_friction" },
];

const MULTILINGUAL_COMPENSATION_MAP: Array<{ pattern: RegExp; canonical: string }> = [
  { pattern: /trapèze|trapeze|trap|haussement|shrug/i, canonical: "upper_trap_shrugging" },
  { pattern: /élan|elan|triche|triché|momentum|swing|balancier/i, canonical: "momentum_cheating" },
  { pattern: /cambrer|cambrure|arch|hyperextension/i, canonical: "lumbar_hyperextension" },
  { pattern: /asymétrie|asymetrie|unilatéral|gauche|droite|imbalance|instable/i, canonical: "bilateral_asymmetry" },
  { pattern: /avant de l'épaule|deltoïde antérieur|front delt/i, canonical: "anterior_delt_takeover" },
];

const MULTILINGUAL_PHASE_MAP: Array<{ pattern: RegExp; phase: BiomechanicalEntities["phase"] }> = [
  { pattern: /descente|excentrique|eccentric|negative|négative|lowering/i, phase: "eccentric" },
  { pattern: /montée|concentrique|concentric|push|pull|poussée|tirage/i, phase: "concentric" },
  { pattern: /haut|verrouillage|lockout|top|contraction/i, phase: "lockout" },
  { pattern: /bas|étirement|etirement|stretch|bottom/i, phase: "stretch" },
];

/**
 * Detects whether raw text / audio transcript is in French, English, or mixed French/Darija.
 */
export function detectFeedbackLanguage(text?: string): "fr" | "en" | "ar" | "mixed" {
  if (!text || !text.trim()) return "en";
  const frenchMarkers = /\b(sur|la|le|les|des|aux|avec|j'ai|senti|épaule|epaule|série|serie|haltères|halteres|trapèzes|trapezes|pincement|descente|triché|douleur|coude|genou|lombaire)\b/i;
  const darijaMarkers = /\b(dial|dyal|bzzaf|chwiya|darni|ktf|dhar)\b/i;
  const hasFr = frenchMarkers.test(text);
  const hasAr = darijaMarkers.test(text);
  if (hasFr && hasAr) return "mixed";
  if (hasFr) return "fr";
  if (hasAr) return "ar";
  return "en";
}

/**
 * Canonical Dual-Representation Extractor:
 * Converts raw French/Darija/English notes and voice transcripts into normalized CSCS English entities.
 */
export function extractCanonicalAthleticRepresentation(params: {
  exerciseName: string;
  tags: ExerciseBiofeedbackTag[];
  rawText?: string;
}): {
  originalLanguage: "fr" | "en" | "ar" | "mixed";
  canonicalEnglishSummary: string;
  biomechanicalEntities: BiomechanicalEntities;
} {
  const combinedText = (params.rawText || "").trim();
  const originalLanguage = detectFeedbackLanguage(combinedText);

  const symptoms = new Set<string>();
  const compensations = new Set<string>();
  let detectedPhase: BiomechanicalEntities["phase"] | undefined;

  // 1. Extract from tags
  for (const tag of params.tags) {
    if (tag === "joint_strain") symptoms.add("joint_strain_flagged");
    if (tag === "balance_issue") compensations.add("stability_breakdown");
    if (tag === "heavy") compensations.add("high_neural_fatigue");
  }

  // 2. Extract from multilingual text / voice memo
  if (combinedText) {
    for (const item of MULTILINGUAL_SYMPTOM_MAP) {
      if (item.pattern.test(combinedText)) {
        symptoms.add(item.canonical);
      }
    }
    for (const item of MULTILINGUAL_COMPENSATION_MAP) {
      if (item.pattern.test(combinedText)) {
        compensations.add(item.canonical);
      }
    }
    for (const p of MULTILINGUAL_PHASE_MAP) {
      if (p.pattern.test(combinedText)) {
        detectedPhase = p.phase;
        break;
      }
    }
  }

  const symptomList = Array.from(symptoms);
  const compensationList = Array.from(compensations);

  // Determine severity
  let severity: BiomechanicalEntities["severity"] = "none";
  if (
    params.tags.includes("joint_strain") ||
    symptomList.includes("anterior_shoulder_pinch") ||
    symptomList.includes("acute_joint_discomfort") ||
    symptomList.includes("lumbar_axial_strain")
  ) {
    severity = "acute";
  } else if (symptomList.length > 0 || compensationList.length > 0) {
    severity = "moderate";
  } else if (params.tags.includes("heavy") || params.tags.includes("balance_issue")) {
    severity = "mild";
  }

  // Build canonical English CSCS summary for high-precision RAG vector matching
  const summaryParts: string[] = [`Exercise: ${params.exerciseName}.`];
  if (params.tags.length > 0) {
    summaryParts.push(`Biofeedback tags: ${params.tags.join(", ")}.`);
  }
  if (symptomList.length > 0) {
    summaryParts.push(`Biomechanical symptoms: ${symptomList.join(", ").replace(/_/g, " ")}.`);
  }
  if (compensationList.length > 0) {
    summaryParts.push(`Motor compensations: ${compensationList.join(", ").replace(/_/g, " ")}.`);
  }
  if (detectedPhase) {
    summaryParts.push(`Phase of occurrence: ${detectedPhase} phase.`);
  }
  if (originalLanguage === "en" && combinedText) {
    summaryParts.push(`Athlete note: "${combinedText}".`);
  }

  return {
    originalLanguage,
    canonicalEnglishSummary: summaryParts.join(" "),
    biomechanicalEntities: {
      symptoms: symptomList,
      compensations: compensationList,
      phase: detectedPhase,
      severity,
    },
  };
}

/**
 * Infers primary muscle category from exercise name if not explicitly provided.
 */
export function inferPrimaryMuscleFromExerciseName(exerciseName: string): string {
  const n = exerciseName.toLowerCase();
  if (n.includes("lateral raise") || n.includes("shoulder") || n.includes("delt") || n.includes("overhead press") || n.includes("military") || n.includes("face pull")) {
    return "shoulders";
  }
  if (n.includes("bench") || n.includes("chest") || n.includes("pec") || n.includes("fly") || n.includes("incline db press") || n.includes("incline dumbbell press") || n.includes("push-up")) {
    return "chest";
  }
  if (n.includes("row") || n.includes("pulldown") || n.includes("pull-up") || n.includes("lat ")) {
    return "lats";
  }
  if (n.includes("squat") || n.includes("leg press") || n.includes("leg extension") || n.includes("lunge")) {
    return "quads";
  }
  if (n.includes("deadlift") || n.includes("rdl") || n.includes("leg curl") || n.includes("hamstring") || n.includes("hip thrust")) {
    return "hamstrings";
  }
  if (n.includes("tricep") || n.includes("skull") || n.includes("pushdown")) {
    return "triceps";
  }
  if (n.includes("bicep") || n.includes("curl") || n.includes("preacher")) {
    return "biceps";
  }
  return "general";
}

// In-memory + localStorage backed Sensory Memory Vector Vault
const SENSORY_STORAGE_KEY = "vyra_sensory_feedback_rag_v1";

export class SensoryMemoryStore {
  private entries: SensoryFeedbackEntry[] = [];
  private hydrated = false;

  private hydrate() {
    if (this.hydrated) return;
    this.hydrated = true;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(SENSORY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.entries = parsed;
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
        localStorage.setItem(SENSORY_STORAGE_KEY, JSON.stringify(this.entries));
      } catch {
        // ignore
      }
    }
  }

  public ingest(input: IngestFeedbackInput): SensoryFeedbackEntry {
    this.hydrate();
    const now = Date.now();
    const primaryMuscle = input.primaryMuscle || inferPrimaryMuscleFromExerciseName(input.exerciseName);
    const muscleSubdivision = inferMuscleSubdivision(input.exerciseName, primaryMuscle);
    const resistanceProfile = inferResistanceProfile(input.exerciseName, "dumbbell");
    const tags = input.tags || [];
    const rawCombined = [input.freeTextNote, input.audioTranscript].filter(Boolean).join(" | ");

    const extracted = extractCanonicalAthleticRepresentation({
      exerciseName: input.exerciseName,
      tags,
      rawText: rawCombined,
    });

    // Compute 64-D L2-normalized vector embedding
    const embeddingVector = computeBiomechanicalEmbedding({
      text: extracted.canonicalEnglishSummary,
      muscleSubdivision,
      resistanceProfile,
      symptoms: extracted.biomechanicalEntities.symptoms,
      compensations: extracted.biomechanicalEntities.compensations,
    });

    const entry: SensoryFeedbackEntry = {
      id: `sf_${now}_${Math.random().toString(36).substring(2, 7)}`,
      traineeId: input.traineeId,
      sessionId: input.sessionId,
      date: input.date || new Date(now).toISOString().split("T")[0],
      exerciseId: input.exerciseId,
      exerciseName: input.exerciseName,
      primaryMuscle,
      muscleSubdivision,
      tags,
      freeTextNote: input.freeTextNote,
      audioNoteUrl: input.audioNoteUrl,
      originalLanguage: extracted.originalLanguage,
      rawTranscription: input.audioTranscript || input.freeTextNote,
      canonicalEnglishSummary: extracted.canonicalEnglishSummary,
      biomechanicalEntities: extracted.biomechanicalEntities,
      embeddingVector,
      gymId: input.gymId || "gym_punch_lissasfa",
      gymName: input.gymName || "Punch by Badr Hari Lissasfa",
      epochMs: now,
    };

    this.entries.unshift(entry);
    this.persist();

    // Append immutable event to Flight Recorder
    try {
      getStorageAdapter()
        .appendEvent(input.traineeId, input.sessionId, "EXERCISE_FEEDBACK_RECORDED", entry)
        .catch(() => {});
    } catch {}

    return entry;
  }

  /**
   * Executes Vector Space Cosine Similarity + Anatomical RAG retrieval.
   */
  public queryRAG(query: SensoryRagQuery): SensoryRagMatch[] {
    this.hydrate();
    const traineeEntries = this.entries.filter((e) => e.traineeId === query.traineeId);
    if (traineeEntries.length === 0) return [];

    const targetPrimary =
      query.primaryMuscle?.toLowerCase() ||
      (query.exerciseName ? inferPrimaryMuscleFromExerciseName(query.exerciseName) : undefined);

    const targetSub =
      query.muscleSubdivision ||
      (query.exerciseName
        ? inferMuscleSubdivision(
            query.exerciseName,
            targetPrimary || "general"
          )
        : undefined);

    // Construct query vector in the same 64-D space
    const queryVector = computeBiomechanicalEmbedding({
      text: [query.exerciseName, query.searchQuery, targetPrimary].filter(Boolean).join(" "),
      muscleSubdivision: targetSub,
      symptoms: query.symptomsFilter,
    });

    const matches: SensoryRagMatch[] = [];

    for (const entry of traineeEntries) {
      const entryVec =
        entry.embeddingVector && entry.embeddingVector.length > 0
          ? entry.embeddingVector
          : computeBiomechanicalEmbedding({
              text: entry.canonicalEnglishSummary,
              muscleSubdivision: entry.muscleSubdivision,
              symptoms: entry.biomechanicalEntities.symptoms,
              compensations: entry.biomechanicalEntities.compensations,
            });

      const cosSim = cosineSimilarity(queryVector, entryVec);
      const reasons: string[] = [];
      let compositeScore = Math.max(0, cosSim) * 60; // Vector similarity contributes up to 60 pts

      if (cosSim >= 0.25) {
        reasons.push(`Vector cosine similarity: ${cosSim.toFixed(3)}`);
      }

      // Exact exercise match boost
      if (
        query.exerciseName &&
        entry.exerciseName.toLowerCase() === query.exerciseName.toLowerCase()
      ) {
        compositeScore += 30;
        reasons.push(`Exact exercise match (${entry.exerciseName})`);
      }

      // Anatomical subdivision match
      if (targetSub && entry.muscleSubdivision === targetSub) {
        compositeScore += 20;
        reasons.push(`Same muscle subdivision (${entry.muscleSubdivision})`);
      } else if (targetPrimary && entry.primaryMuscle.toLowerCase() === targetPrimary) {
        compositeScore += 10;
        reasons.push(`Related primary muscle group (${entry.primaryMuscle})`);
      }

      // Severity signal boost
      if (entry.biomechanicalEntities.severity === "acute") {
        compositeScore += 15;
        reasons.push("Acute joint/biomechanical signal");
      } else if (entry.biomechanicalEntities.severity === "moderate") {
        compositeScore += 10;
        reasons.push("Moderate motor compensation signal");
      }

      if (compositeScore >= 15 || cosSim >= 0.2) {
        matches.push({
          entry,
          cosineSimilarity: cosSim,
          relevanceScore: Number(compositeScore.toFixed(2)),
          matchReasons: reasons,
        });
      }
    }

    matches.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
      return b.entry.epochMs - a.entry.epochMs;
    });

    return matches.slice(0, query.limit || 5);
  }

  public getAllForTrainee(traineeId: string): SensoryFeedbackEntry[] {
    this.hydrate();
    return this.entries.filter((e) => e.traineeId === traineeId);
  }

  public ingestFromSessionHistory(sessions: Array<{
    id: string;
    traineeId: string;
    date: string;
    gymId?: string;
    gymName?: string;
    exerciseFeedbacks?: Array<{
      exerciseName: string;
      tag?: ExerciseBiofeedbackTag;
      tags?: ExerciseBiofeedbackTag[];
      note?: string;
      audioNoteUrl?: string;
    }>;
  }>) {
    this.hydrate();
    for (const s of sessions) {
      if (!s.exerciseFeedbacks) continue;
      for (const fb of s.exerciseFeedbacks) {
        const exists = this.entries.some(
          (e) =>
            e.sessionId === s.id &&
            e.exerciseName.toLowerCase() === fb.exerciseName.toLowerCase()
        );
        if (!exists) {
          this.ingest({
            traineeId: s.traineeId,
            sessionId: s.id,
            date: s.date,
            exerciseName: fb.exerciseName,
            tags: fb.tags && fb.tags.length > 0 ? fb.tags : fb.tag ? [fb.tag] : [],
            freeTextNote: fb.note,
            audioNoteUrl: fb.audioNoteUrl,
            gymId: s.gymId,
            gymName: s.gymName,
          });
        }
      }
    }
  }

  public clearForTesting() {
    this.entries = [];
    this.hydrated = true;
    this.persist();
  }
}

export const sensoryMemoryStore = new SensoryMemoryStore();
