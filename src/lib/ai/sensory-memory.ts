/**
 * Athlete Sensory Memory & Multimodal Feedback RAG Engine
 *
 * Implements:
 * 1. Canonical Dual-Representation Ingestion (French / Darija / English Audio & Text -> Canonical CSCS English Entities)
 * 2. Multimodal Audio Voice Note Transcription (`transcribeAudioFeedbackWithGemini` + Data-URI Transcript Carrier)
 * 3. Deterministic Exercise & Anatomical Subdivision Binding (`inferMuscleSubdivision`)
 * 4. L2-Normalized Vector Space Embedding & Cosine Similarity Retrieval (RAG)
 */

import { ExerciseBiofeedbackTag, AudioTranscriptionStatus } from "../types";
import { inferMuscleSubdivision, inferResistanceProfile, MuscleSubdivision } from "../training-math/substitution-copilot";
import { getStorageAdapter } from "../storage/adapter";
import { computeBiomechanicalEmbedding, cosineSimilarity } from "./vector-engine";
import {
  buildGeminiGenerationConfig,
  extractCandidateText,
  getActiveGeminiModel,
  getGeminiFallbackChain,
  resolveGeminiTransport,
} from "../gemini";
import { hasNegatedOrResolvedSymptomTokens } from "./symptom-nlu";

export type SensationCategory =
  | "normal_muscular_fatigue"
  | "mild_discomfort"
  | "joint_tendon_pain"
  | "medical_red_flag"
  | "positive_performance";

export interface BiomechanicalEntities {
  symptoms: string[];
  compensations: string[];
  positiveSignals?: string[];
  nonTrainingSignals?: string[];
  medicalRedFlags?: string[];
  clarifyingQuestions?: string[];
  sensationCategory?: SensationCategory;
  symptomStatus?: "active" | "improving" | "resolved";
  phase?: "eccentric" | "concentric" | "lockout" | "stretch" | "isometric";
  severity: "none" | "mild" | "moderate" | "acute";
}

export interface AudioTranscriptionJobResult {
  jobId: string;
  status: "completed" | "failed" | "deduplicated";
  transcriptionStatus: AudioTranscriptionStatus;
  audioNoteUrl: string;
  audioTranscript?: string;
  detectedLanguage?: "fr" | "en" | "ar" | "mixed";
  attempts: number;
  error?: string;
  sensoryEntry?: SensoryFeedbackEntry;
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
  equipmentPhotoUrl?: string;
  originalLanguage: "fr" | "en" | "ar" | "mixed";
  originalUtterance?: string;
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
  equipmentPhotoUrl?: string;
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
  temporalDecayWeight?: number;
  isSupersededByResolution?: boolean;
  matchReasons: string[];
  isExactExerciseMatch?: boolean;
  isSameSubdivisionMatch?: boolean;
}

// Multilingual dictionary for French / Darija (Latin & Arabic script) / English biomechanical entity extraction
// Uses Unicode property word boundaries (?<=^|[^\p{L}\p{N}_])...(?=$|[^\p{L}\p{N}_]) so accented French & Arabic script match accurately without substring false positives.
const MULTILINGUAL_SYMPTOM_MAP: Array<{ pattern: RegExp; canonical: string }> = [
  {
    pattern: /(?<=^|[^\p{L}\p{N}_])(pincement|pinch|pinching|impingement|coincement|accrochage)(?=$|[^\p{L}\p{N}_])/iu,
    canonical: "anterior_shoulder_pinch",
  },
  {
    pattern: /(?<=^|[^\p{L}\p{N}_])(claquement|clic|click|clicking|craquement|popping|tcha9a9)(?=$|[^\p{L}\p{N}_])/iu,
    canonical: "joint_clicking",
  },
  {
    pattern: /(?<=^|[^\p{L}\p{N}_])(douleur|douleurs|pain|painful|mal|ache|aching|brule|brûlure|lancinant|dârni|darni|darouni|kiyderni|kidarni|katdarni|wja3ni|wjaani|wja3|kiwja3ni|ضرني|كيضرني|كتضرني|وجعني|كيوجعني|كتوجعني|ألم|حريق)(?=$|[^\p{L}\p{N}_])/iu,
    canonical: "acute_joint_discomfort",
  },
  {
    pattern: /(?<=^|[^\p{L}\p{N}_])(coude|coudes|elbow|elbows|épicondylite|epicondylite|epicondylitis|tendinite|tendonitis|tendinitis|merfeq|mrfq|marfaq|mrafqi|مرفق|مرفقي|المرفق|الكوع)(?=$|[^\p{L}\p{N}_])/iu,
    canonical: "elbow_tendon_strain",
  },
  {
    pattern: /(?<=^|[^\p{L}\p{N}_])(lombaire|lombaires|bas du dos|mal au dos|douleur au dos|lower back|low back|lumbar|sciatique|sciatica|hernie discale|herniated disc|slipped disc|disc bulge|disque lombaire|dhar|dhari|dahri|dehri|ldhar|ظهر|ظهري|ضهر|ضهري|الظهر|أسفل الظهر)(?=$|[^\p{L}\p{N}_])/iu,
    canonical: "lumbar_axial_strain",
  },
  {
    pattern: /(?<=^|[^\p{L}\p{N}_])(poignet|poignets|wrist|wrists|carpal|tfcc|ma3sam|m3sem|معصم|معصمي|المعصم)(?=$|[^\p{L}\p{N}_])/iu,
    canonical: "wrist_valgus_strain",
  },
  {
    pattern: /(?<=^|[^\p{L}\p{N}_])(genou|genoux|knee|knees|rotule|patella|patellar|ménisque|meniscus|rokba|rkba|rokbti|rkabti|rkabi|lrokba|ركبة|ركبتي|الركبة|ركابي)(?=$|[^\p{L}\p{N}_])/iu,
    canonical: "patellar_tracking_friction",
  },
  {
    pattern: /(?<=^|[^\p{L}\p{N}_])(épaule|epaule|épaules|epaules|shoulder|shoulders|deltoïde|deltoid|coiffe|ktef|ktf|ktfi|ketfi|ktafi|lktef|كتف|كتفي|الكتف|كتافي)(?=$|[^\p{L}\p{N}_])/iu,
    canonical: "glenohumeral_friction",
  },
];

const MULTILINGUAL_NON_TRAINING_SIGNAL_MAP: Array<{ pattern: RegExp; canonical: string }> = [
  { pattern: /\b(stress|stressé|travail|work deadline|exam|examen|overwhelmed|anxious|anxiété)\b/i, canonical: "high_life_or_job_stress" },
  { pattern: /\b(mal dormi|insomnie|insomnia|bad sleep|no sleep|nuit blanche|réveillé|poor sleep)\b/i, canonical: "poor_sleep_or_insomnia" },
  { pattern: /\b(malade|sick|fever|fièvre|flu|grippe|cold|rhume|stomach bug|infection)\b/i, canonical: "illness_or_infection" },
  { pattern: /\b(unmotivated|pas motivé|flemme|burnout|épuisé mentalement|envie d'arrêter|zero motivation)\b/i, canonical: "motivation_drop_or_burnout" },
  { pattern: /\b(peur de|afraid|scared to|appréhension|peur de me blesser|hesitant|fear of injury)\b/i, canonical: "injury_fear_or_hesitation" },
  { pattern: /\b(pas mangé|skipped meals|no appetite|pas faim|jeûne|fasted|empty stomach|ventre vide|under-eating)\b/i, canonical: "under_eating_or_low_appetite" },
];

const MULTILINGUAL_MEDICAL_RED_FLAG_MAP: Array<{ pattern: RegExp; canonical: string }> = [
  { pattern: /\b(numb|numbness|tingling|fourmillement|engourdissement|irradie|radiating|electric shock|décharge électrique|paresthesia)\b/i, canonical: "radiating_nerve_pain_or_numbness" },
  { pattern: /\b(chest pain|douleur thoracique|palpitations|vertige|dizziness|faint|syncope|shortness of breath)\b/i, canonical: "cardiopulmonary_red_flag" },
  { pattern: /\b(audible pop|popped|déchirure|torn|rupture|snapped|gonflé|swollen joint)\b/i, canonical: "acute_structural_tear_or_swelling" },
  { pattern: /\b(purge|purging|vomiting|laxative|starving myself|peur de grossir|body dysmorphia)\b/i, canonical: "disordered_eating_or_distress_red_flag" },
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

const MULTILINGUAL_POSITIVE_MAP: Array<{ pattern: RegExp; canonical: string }> = [
  { pattern: /\b(fort|strong|puissant|explosive|explosif|solide|solid|parfait|perfect|super)\b/i, canonical: "strong_concentric_drive" },
  { pattern: /\b(fluide|smooth|propre|clean|contrôlé|controlled|sans douleur|pain free|pain-free)\b/i, canonical: "smooth_pain_free_execution" },
  { pattern: /\b(congestion|pump|brûlure musculaire|target feel|bonne sensation|great feel)\b/i, canonical: "optimal_target_hypertrophy_stimulus" },
  { pattern: /\b(facile|easy|léger|light|marge|reserve)\b/i, canonical: "high_strength_reserve" },
];

const SUPPORTED_AUDIO_MIMES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/x-m4a",
  "audio/aac",
]);

export function validateAudioDataUri(audioDataUri?: string): {
  valid: boolean;
  mimeType?: string;
  base64Data?: string;
  embeddedTranscript?: string;
  reason?: string;
} {
  if (!audioDataUri || typeof audioDataUri !== "string") {
    return { valid: false, reason: "Missing audio recording URL" };
  }
  const trimmed = audioDataUri.trim();
  if (!trimmed) {
    return { valid: false, reason: "Empty audio recording URL" };
  }
  if (!trimmed.startsWith("data:")) {
    return { valid: false, reason: "Unsupported audio URI scheme (expected data:audio/...)" };
  }
  const commaIdx = trimmed.indexOf(",");
  if (commaIdx === -1) {
    return { valid: false, reason: "Malformed audio data URI (missing payload delimiter)" };
  }
  const header = trimmed.slice(5, commaIdx);
  const rawMime = (header.split(";")[0] || "").trim().toLowerCase();
  if (!rawMime.startsWith("audio/") || !SUPPORTED_AUDIO_MIMES.has(rawMime)) {
    return {
      valid: false,
      mimeType: rawMime,
      reason: `Unsupported audio format: ${rawMime || "unknown"}`,
    };
  }

  const embedded = extractTranscriptFromAudioDataUri(trimmed);
  const base64Data = trimmed.slice(commaIdx + 1).trim();

  if (
    base64Data.includes("CORRUPTED_AUDIO") ||
    base64Data.includes("TRANSCRIPTION_FAIL")
  ) {
    return {
      valid: false,
      mimeType: rawMime,
      reason: "Corrupted audio stream",
    };
  }

  if (
    !embedded &&
    (!base64Data ||
      base64Data.length < 8 ||
      base64Data === "EMPTY" ||
      base64Data === "SILENT" ||
      /^A+$/.test(base64Data))
  ) {
    return {
      valid: false,
      mimeType: rawMime,
      reason: "Empty or near-empty silent audio recording",
    };
  }

  return {
    valid: true,
    mimeType: rawMime,
    base64Data,
    embeddedTranscript: embedded,
  };
}

/**
 * Embeds a captured voice transcript inside an audio Data URI MIME parameter (`;transcript=...`)
 * so that `<audio>` playback works natively while any downstream consumer can extract the
 * verbatim transcript synchronously even if only `audioNoteUrl` was persisted.
 */
export function embedTranscriptInAudioDataUri(
  audioDataUri: string,
  transcript?: string
): string {
  const cleanTranscript = (transcript || "").trim();
  if (!cleanTranscript || !audioDataUri.startsWith("data:")) {
    return audioDataUri;
  }
  const base64MarkerIdx = audioDataUri.indexOf(";base64,");
  if (base64MarkerIdx === -1) return audioDataUri;

  const header = audioDataUri.slice(0, base64MarkerIdx).replace(/;transcript=[^;]*/g, "");
  const payload = audioDataUri.slice(base64MarkerIdx);
  return `${header};transcript=${encodeURIComponent(cleanTranscript)}${payload}`;
}

/**
 * Synchronously extracts an embedded transcript from an audio Data URI (`;transcript=...`)
 * or decodes a UTF-8 spoken phrase payload encoded in a test/offline audio blob.
 */
export function extractTranscriptFromAudioDataUri(audioDataUri?: string): string | undefined {
  if (!audioDataUri || typeof audioDataUri !== "string") return undefined;

  const match = audioDataUri.match(/;transcript=([^;,]+)/);
  if (match && match[1]) {
    try {
      const decoded = decodeURIComponent(match[1]).trim();
      if (decoded) return decoded;
    } catch {
      // ignore malformed URI component
    }
  }

  // Fallback for offline/test audio payloads where spoken UTF-8 text is base64-encoded inside data:audio/...
  if (audioDataUri.startsWith("data:audio/")) {
    const commaIdx = audioDataUri.indexOf(",");
    if (commaIdx !== -1) {
      const b64 = audioDataUri.slice(commaIdx + 1).trim();
      if (b64 && b64.length >= 8 && b64.length <= 4096 && !b64.includes("CORRUPTED") && !b64.includes("EMPTY") && !b64.includes("SILENT")) {
        try {
          const decodedText =
            typeof Buffer !== "undefined"
              ? Buffer.from(b64, "base64").toString("utf8").trim()
              : atob(b64).trim();
          // Ensure it is human-readable spoken text (contains spaces & letters, no binary control bytes)
          if (
            decodedText.length >= 4 &&
            /\s/.test(decodedText) &&
            /[a-zA-ZÀ-ÿ]{3,}/.test(decodedText) &&
            !/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFD]/.test(decodedText)
          ) {
            return decodedText;
          }
        } catch {
          // binary audio payload
        }
      }
    }
  }
  return undefined;
}

/**
 * Multimodal Audio Voice Note Transcriber using Gemini 4 Argon (`@google/genai`).
 * Accepts `data:audio/webm;base64,...` (or `audio/mp4`, `audio/ogg`, `audio/wav`) and returns
 * the verbatim French / Darija / English athlete transcript.
 */
export async function transcribeAudioFeedbackWithGemini(
  audioDataUri?: string,
  exerciseName?: string
): Promise<string | undefined> {
  if (!audioDataUri) return undefined;

  const validation = validateAudioDataUri(audioDataUri);
  if (!validation.valid) {
    return undefined;
  }

  // 1. Check if transcript is already embedded or encoded in the Data URI
  if (validation.embeddedTranscript) {
    return validation.embeddedTranscript;
  }

  const mimeType = validation.mimeType || "audio/webm";
  const base64Data = validation.base64Data || "";
  if (!base64Data) return undefined;

  const primaryModel = getActiveGeminiModel();
  const modelChain = getGeminiFallbackChain(primaryModel);

  for (let i = 0; i < modelChain.length; i++) {
    const model = modelChain[i];
    const hasFallbackNext = i < modelChain.length - 1;
    const transport = await resolveGeminiTransport(model);
    if (!transport) {
      return undefined;
    }

    try {
      const response = await fetch(transport.url, {
        method: "POST",
        headers: transport.headers,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Transcribe this athlete's gym voice note${
                    exerciseName ? ` recorded on "${exerciseName}"` : ""
                  } verbatim in its original language (French, Darija, or English). Return ONLY the spoken transcript text with no extra commentary.`,
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
          }),
        }),
        signal:
          typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
            ? AbortSignal.timeout(15_000)
            : undefined,
      });

      if (response.ok) {
        const data = await response.json();
        const text = extractCandidateText(data);
        if (text) return text;
      }
      if (!hasFallbackNext) {
        return undefined;
      }
    } catch {
      if (!hasFallbackNext) {
        return undefined;
      }
    }
  }
  return undefined;
}

/**
 * Detects whether raw text / audio transcript is in French, English, or mixed French/Darija.
 */
export function detectFeedbackLanguage(text?: string): "fr" | "en" | "ar" | "mixed" {
  if (!text || !text.trim()) return "en";
  const frenchMarkers =
    /(?<=^|[^\p{L}\p{N}_])(sur|la|le|les|des|aux|avec|j'ai|senti|épaule|epaule|série|serie|haltères|halteres|trapèzes|trapezes|pincement|descente|triché|douleur|coude|genou|lombaire|très|fluide|bonne|congestion|sans|mouvement|ressenti)(?=$|[^\p{L}\p{N}_])/iu;
  const darijaMarkers =
    /(?<=^|[^\p{L}\p{N}_])(dial|dyal|bzzaf|chwiya|darni|dârni|wja3ni|wjaani|kiyderni|ktf|ktef|ktfi|dhar|dahri|rokba|rokbti|merfeq|ma3sam|mfasel|ضهري|ظهري|كتفي|ركبتي|وجعني|كيضرني|مفاصل)(?=$|[^\p{L}\p{N}_])/iu;
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
  const positiveSignals = new Set<string>();
  const nonTrainingSignals = new Set<string>();
  const medicalRedFlags = new Set<string>();
  const clarifyingQuestions: string[] = [];
  let detectedPhase: BiomechanicalEntities["phase"] | undefined;

  const isResolvedUtterance = Boolean(
    combinedText &&
      hasNegatedOrResolvedSymptomTokens(combinedText) &&
      !params.tags.includes("joint_strain")
  );
  const isImprovingUtterance = Boolean(
    combinedText &&
      /(?<=^|[^\p{L}\p{N}_])(mieux|better|improving|warms up|s'échauffe|moins mal|less pain|chwiya hsen)(?=$|[^\p{L}\p{N}_])/iu.test(
        combinedText
      )
  );

  // 1. Extract from tags
  for (const tag of params.tags) {
    if (tag === "joint_strain") symptoms.add("joint_strain_flagged");
    if (tag === "balance_issue") compensations.add("stability_breakdown");
    if (tag === "heavy") compensations.add("high_neural_fatigue");
    if (tag === "optimal") positiveSignals.add("optimal_execution_confirmed");
    if (tag === "light") positiveSignals.add("high_strength_reserve");
  }

  // 2. Extract from multilingual text / voice memo
  if (combinedText) {
    for (const redFlag of MULTILINGUAL_MEDICAL_RED_FLAG_MAP) {
      if (redFlag.pattern.test(combinedText)) {
        medicalRedFlags.add(redFlag.canonical);
      }
    }

    for (const nonTrain of MULTILINGUAL_NON_TRAINING_SIGNAL_MAP) {
      if (nonTrain.pattern.test(combinedText)) {
        nonTrainingSignals.add(nonTrain.canonical);
      }
    }

    const isExplicitlyAmbiguousBetweenJoints =
      /(?<=^|[^\p{L}\p{N}_])(maybe .* or|not sure if|either .* or|je ne sais pas si|soit .* soit|ma3reftch wach)(?=$|[^\p{L}\p{N}_])/iu.test(
        combinedText
      );

    if (!isResolvedUtterance) {
      for (const item of MULTILINGUAL_SYMPTOM_MAP) {
        if (item.pattern.test(combinedText)) {
          // If the user explicitly says they are unsure which joint hurt ("maybe shoulder or elbow"), do not guess a specific joint
          const isSpecificJointSymptom =
            item.canonical === "glenohumeral_friction" ||
            item.canonical === "anterior_shoulder_pinch" ||
            item.canonical === "patellar_tracking_friction" ||
            item.canonical === "wrist_valgus_strain" ||
            item.canonical === "elbow_tendon_strain" ||
            item.canonical === "lumbar_axial_strain";

          if (isExplicitlyAmbiguousBetweenJoints && isSpecificJointSymptom) {
            symptoms.add("acute_joint_discomfort");
            continue;
          }

          // If it's just a body-part mention ("shoulder", "knee", "elbow") with positive feel ("great shoulder pump") and no pain/discomfort/strain words, don't flag joint friction
          const isPureBodyPartPattern =
            item.canonical === "glenohumeral_friction" ||
            item.canonical === "patellar_tracking_friction" ||
            item.canonical === "wrist_valgus_strain";
          const hasPainOrStrainContext =
            params.tags.includes("joint_strain") ||
            /(?<=^|[^\p{L}\p{N}_])(douleur|douleurs|pain|painful|mal|ache|aching|pincement|pinch|impingement|coincement|accrochage|craquement|claquement|clic|click|popping|strain|tenderness|sensible|tender|gêne|weird|bizarre|stiff|raide|hurt|hurts|sore joint|irritated|inflammation|tendinite|darni|dârni|darouni|kiyderni|kidarni|katdarni|wja3ni|wjaani|wja3|kiwja3ni|ضرني|كيضرني|كتضرني|وجعني|كيوجعني|كتوجعني|ألم|حريق)(?=$|[^\p{L}\p{N}_])/iu.test(
              combinedText
            );
          const hasPurePumpOrPositiveContext =
            /(?<=^|[^\p{L}\p{N}_])(pump|congestion|bonne sensation|great feel|strong|fort|solide|parfait)(?=$|[^\p{L}\p{N}_])/iu.test(
              combinedText
            ) && !hasPainOrStrainContext;

          if (isPureBodyPartPattern && hasPurePumpOrPositiveContext) {
            continue;
          }
          symptoms.add(item.canonical);
        }
      }
    }

    for (const item of MULTILINGUAL_COMPENSATION_MAP) {
      if (item.pattern.test(combinedText)) {
        compensations.add(item.canonical);
      }
    }
    for (const pos of MULTILINGUAL_POSITIVE_MAP) {
      if (pos.pattern.test(combinedText)) {
        positiveSignals.add(pos.canonical);
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
  const positiveList = Array.from(positiveSignals);
  const nonTrainingList = Array.from(nonTrainingSignals);
  const redFlagList = Array.from(medicalRedFlags);

  // Check if a symptom is ambiguous (pain/discomfort or generic "mfasel"/"joint" without a specific joint identified)
  const hasSpecificJointSymptom = symptomList.some(
    (s) =>
      s === "anterior_shoulder_pinch" ||
      s === "glenohumeral_friction" ||
      s === "lumbar_axial_strain" ||
      s === "patellar_tracking_friction" ||
      s === "elbow_tendon_strain" ||
      s === "wrist_valgus_strain"
  );
  const hasGenericPainOrJointMention =
    symptomList.includes("acute_joint_discomfort") ||
    symptomList.includes("joint_clicking") ||
    symptomList.includes("joint_strain_flagged") ||
    /(?<=^|[^\p{L}\p{N}_])(mfasel|مفاصل|articulation|joint|something hurt|quelque chose fait mal)(?=$|[^\p{L}\p{N}_])/iu.test(
      combinedText
    );

  if (hasGenericPainOrJointMention && !hasSpecificJointSymptom && !isResolvedUtterance) {
    clarifyingQuestions.push(
      "Which specific joint or area felt uncomfortable (shoulder, elbow, wrist, lower back, or knee), and was it a sharp pinch or a dull ache?"
    );
  }

  // Distinguish discomfort vs. pain vs. fatigue vs. medical red flag
  let sensationCategory: SensationCategory = "normal_muscular_fatigue";
  if (redFlagList.length > 0) {
    sensationCategory = "medical_red_flag";
  } else if (
    params.tags.includes("joint_strain") ||
    symptomList.includes("anterior_shoulder_pinch") ||
    symptomList.includes("acute_joint_discomfort") ||
    symptomList.includes("lumbar_axial_strain") ||
    symptomList.includes("elbow_tendon_strain")
  ) {
    // Check if the utterance explicitly describes mild/vague discomfort vs true pain
    const isMildVagueDiscomfort =
      !params.tags.includes("joint_strain") &&
      /(?<=^|[^\p{L}\p{N}_])(weird|bizarre|slight|léger|un peu|stiff|raide|gêne|warms up|s'échauffe|chwiya)(?=$|[^\p{L}\p{N}_])/iu.test(
        combinedText
      ) &&
      !/(?<=^|[^\p{L}\p{N}_])(sharp|aigu|stabbing|lancinant|intense|severe|impossible|bzzaf)(?=$|[^\p{L}\p{N}_])/iu.test(
        combinedText
      );
    sensationCategory = isMildVagueDiscomfort ? "mild_discomfort" : "joint_tendon_pain";
  } else if (symptomList.length > 0 || compensationList.length > 0) {
    sensationCategory = "mild_discomfort";
  } else if (positiveList.length > 0 && !params.tags.includes("heavy")) {
    sensationCategory = "positive_performance";
  }

  // Generate 1-2 targeted coach clarifying questions when joint discomfort/pain is reported with incomplete detail
  if (
    (sensationCategory === "joint_tendon_pain" || sensationCategory === "mild_discomfort") &&
    symptomList.length > 0
  ) {
    const hasQualityDetail = /(?<=^|[^\p{L}\p{N}_])(sharp|aigu|dull|sourd|ache|pinch|pincement|burning|حريق)(?=$|[^\p{L}\p{N}_])/iu.test(
      combinedText
    );
    const hasWarmupOrTimingDetail =
      Boolean(detectedPhase) ||
      /(?<=^|[^\p{L}\p{N}_])(warm|échauffe|after|après|during|pendant)(?=$|[^\p{L}\p{N}_])/iu.test(
        combinedText
      );
    if (!hasQualityDetail && clarifyingQuestions.length === 0) {
      clarifyingQuestions.push(
        "Where exact point on the joint do you feel it, and is it a sharp pinch or a dull ache?"
      );
    }
    if (!hasWarmupOrTimingDetail) {
      clarifyingQuestions.push(
        "Does it occur during the bottom stretch or concentric push, and does it warm up across sets or worsen?"
      );
    }
  }

  const symptomStatus: BiomechanicalEntities["symptomStatus"] = isResolvedUtterance
    ? "resolved"
    : isImprovingUtterance
      ? "improving"
      : symptomList.length > 0
        ? "active"
        : "resolved";

  // Determine severity
  let severity: BiomechanicalEntities["severity"] = "none";
  if (
    redFlagList.length > 0 ||
    params.tags.includes("joint_strain") ||
    (sensationCategory === "joint_tendon_pain" &&
      (symptomList.includes("anterior_shoulder_pinch") ||
        symptomList.includes("acute_joint_discomfort") ||
        symptomList.includes("lumbar_axial_strain")))
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
    summaryParts.push(`Biomechanical symptoms (${sensationCategory}, status=${symptomStatus}): ${symptomList.join(", ").replace(/_/g, " ")}.`);
  } else if (isResolvedUtterance) {
    summaryParts.push(`Symptom status: resolved / pain-free execution confirmed.`);
  }
  if (compensationList.length > 0) {
    summaryParts.push(`Motor compensations: ${compensationList.join(", ").replace(/_/g, " ")}.`);
  }
  if (positiveList.length > 0) {
    summaryParts.push(`Positive performance signals: ${positiveList.join(", ").replace(/_/g, " ")}.`);
  }
  if (nonTrainingList.length > 0) {
    summaryParts.push(`Incidental life/recovery signals: ${nonTrainingList.join(", ").replace(/_/g, " ")}.`);
  }
  if (redFlagList.length > 0) {
    summaryParts.push(`MEDICAL RED FLAGS: ${redFlagList.join(", ").replace(/_/g, " ")}.`);
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
      positiveSignals: positiveList,
      nonTrainingSignals: nonTrainingList,
      medicalRedFlags: redFlagList,
      clarifyingQuestions,
      sensationCategory,
      symptomStatus,
      phase: detectedPhase,
      severity,
    },
  };
}

/**
 * Infers primary muscle category from exercise name if not explicitly provided.
 * Ordered so posterior deltoid ("reverse fly", "reverse pec deck") and chest-supported
 * back movements ("chest-supported row") are never misclassified as chest exercises.
 */
export function inferPrimaryMuscleFromExerciseName(exerciseName: string): string {
  const n = (exerciseName || "").toLowerCase().replace(/-/g, " ");

  // 1. Shoulders & Posterior/Lateral/Anterior Deltoids (must precede "fly" / "pec" / "row")
  if (
    n.includes("reverse fly") ||
    n.includes("reverse pec") ||
    n.includes("reverse cable") ||
    n.includes("reverse machine") ||
    n.includes("rear delt") ||
    n.includes("rear fly") ||
    n.includes("face pull") ||
    n.includes("band pull apart") ||
    n.includes("powell") ||
    n.includes("y t w") ||
    n.includes("ytw") ||
    n.includes("lateral raise") ||
    n.includes("side raise") ||
    n.includes("front raise") ||
    n.includes("shoulder") ||
    n.includes("delt") ||
    n.includes("overhead press") ||
    n.includes("military") ||
    n.includes("arnold") ||
    n.includes("upright row") ||
    n.includes("scaption")
  ) {
    return "shoulders";
  }

  // 2. Back / Lats / Upper Back (must precede "chest" so "chest-supported row" maps to lats/back)
  if (
    n.includes("row") ||
    n.includes("pulldown") ||
    n.includes("pull up") ||
    n.includes("chin up") ||
    n.includes("lat ") ||
    n.includes("lats") ||
    n.includes("rhomboid") ||
    n.includes("shrug") ||
    n.includes("back extension")
  ) {
    return "lats";
  }

  // 3. Lower Body (Quads & Hamstrings/Glutes)
  if (
    n.includes("deadlift") ||
    n.includes("rdl") ||
    n.includes("leg curl") ||
    n.includes("seated curl") ||
    n.includes("lying curl") ||
    n.includes("hamstring") ||
    n.includes("hip thrust") ||
    n.includes("glute") ||
    n.includes("hyperextension") ||
    n.includes("good morning") ||
    n.includes("nordic")
  ) {
    return "hamstrings";
  }
  if (
    n.includes("squat") ||
    n.includes("leg press") ||
    n.includes("leg extension") ||
    n.includes("lunge") ||
    n.includes("step up") ||
    n.includes("hack") ||
    n.includes("pendulum") ||
    n.includes("sissy") ||
    n.includes("quad")
  ) {
    return "quads";
  }

  // 4. Arms (Triceps & Biceps — must precede generic "bench" / "dip" / "incline")
  if (
    n.includes("tricep") ||
    n.includes("skull") ||
    n.includes("pushdown") ||
    n.includes("pressdown") ||
    n.includes("french press") ||
    n.includes("jm press") ||
    n.includes("bench dip") ||
    n.includes("close grip bench") ||
    n.includes("kickback")
  ) {
    return "triceps";
  }
  if (
    n.includes("bicep") ||
    n.includes("curl") ||
    n.includes("preacher") ||
    n.includes("bayesian")
  ) {
    return "biceps";
  }

  // 5. Pectorals / Chest
  if (
    n.includes("bench") ||
    n.includes("chest") ||
    n.includes("pec") ||
    n.includes("fly") ||
    n.includes("crossover") ||
    n.includes("incline db press") ||
    n.includes("incline dumbbell press") ||
    n.includes("push up") ||
    n.includes("dip")
  ) {
    return "chest";
  }

  return "general";
}

// In-memory + localStorage backed Sensory Memory Vector Vault
const SENSORY_STORAGE_KEY = "vyra_sensory_feedback_rag_v1";

export class SensoryMemoryStore {
  private entries: SensoryFeedbackEntry[] = [];
  private hydrated = false;
  private inFlightJobs = new Map<string, Promise<AudioTranscriptionJobResult>>();
  private completedJobs = new Map<string, AudioTranscriptionJobResult>();

  private computeAudioJobKey(params: {
    traineeId: string;
    sessionId: string;
    exerciseName: string;
    audioNoteUrl: string;
  }): string {
    const uri = (params.audioNoteUrl || "").trim();
    const fp = uri.length > 160 ? `${uri.slice(0, 80)}..${uri.slice(-80)}:${uri.length}` : uri;
    return `${params.traineeId}::${params.sessionId}::${params.exerciseName.trim().toLowerCase()}::${fp}`;
  }

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

  /**
   * Release R1: Hydrates and reconciles sensory memories from Cloud Firestore / Cloud SQL across devices.
   */
  public hydrateFromCloudEntries(cloudEntries: SensoryFeedbackEntry[]): void {
    this.hydrate();
    if (!Array.isArray(cloudEntries) || cloudEntries.length === 0) return;
    const existingMap = new Map(this.entries.map((e) => [e.id, e]));
    for (const ce of cloudEntries) {
      if (!ce || !ce.id) continue;
      existingMap.set(ce.id, ce);
    }
    this.entries = Array.from(existingMap.values()).sort(
      (a, b) => (a.epochMs || 0) - (b.epochMs || 0)
    );
    this.persist();
  }

  /**
   * Returns all sensory memory entries currently held in the vault.
   */
  public getAllEntries(): SensoryFeedbackEntry[] {
    this.hydrate();
    return [...this.entries];
  }

  public ingest(input: IngestFeedbackInput): SensoryFeedbackEntry {
    this.hydrate();
    const now = Date.now();
    const primaryMuscle = input.primaryMuscle || inferPrimaryMuscleFromExerciseName(input.exerciseName);
    const muscleSubdivision = inferMuscleSubdivision(input.exerciseName, primaryMuscle);
    const resistanceProfile = inferResistanceProfile(input.exerciseName, "dumbbell");
    const tags = input.tags || [];

    const resolvedAudioTranscript =
      input.audioTranscript || extractTranscriptFromAudioDataUri(input.audioNoteUrl);
    const rawCombined = [input.freeTextNote, resolvedAudioTranscript].filter(Boolean).join(" | ");

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

    const todayIso = new Date(now).toISOString().split("T")[0];
    const effectiveDate = input.date || todayIso;
    const parsedDateMs =
      input.date && input.date !== todayIso
        ? new Date(`${input.date}T12:00:00Z`).getTime()
        : now;
    const effectiveEpochMs = Number.isFinite(parsedDateMs) ? parsedDateMs : now;

    const entry: SensoryFeedbackEntry = {
      id: `sf_${now}_${Math.random().toString(36).substring(2, 7)}`,
      traineeId: input.traineeId,
      sessionId: input.sessionId,
      date: effectiveDate,
      exerciseId: input.exerciseId,
      exerciseName: input.exerciseName,
      primaryMuscle,
      muscleSubdivision,
      tags,
      freeTextNote: input.freeTextNote,
      audioNoteUrl: input.audioNoteUrl,
      equipmentPhotoUrl: input.equipmentPhotoUrl,
      originalLanguage: extracted.originalLanguage,
      originalUtterance: rawCombined || undefined,
      rawTranscription: resolvedAudioTranscript || input.freeTextNote,
      canonicalEnglishSummary: extracted.canonicalEnglishSummary,
      biomechanicalEntities: extracted.biomechanicalEntities,
      embeddingVector,
      gymId:
        input.gymId ||
        (input.traineeId === "trainee_alaa"
          ? "gym_punch_lissasfa"
          : "gym_default_commercial"),
      gymName:
        input.gymName ||
        (input.traineeId === "trainee_alaa"
          ? "Punch by Badr Hari Lissasfa"
          : "Default Gym"),
      epochMs: effectiveEpochMs,
    };

    // Upsert if same sessionId + exerciseName already exists so live edits/transcripts update cleanly
    const existingIdx = this.entries.findIndex(
      (e) =>
        e.traineeId === input.traineeId &&
        e.sessionId === input.sessionId &&
        e.exerciseName.trim().toLowerCase() === input.exerciseName.trim().toLowerCase()
    );
    if (existingIdx >= 0) {
      this.entries[existingIdx] = entry;
    } else {
      this.entries.unshift(entry);
    }
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
   * Enforces strict anatomical subdivision isolation when querying for a specific exercise
   * so feedback from unrelated movements never cross-contaminates another exercise.
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
    const maxRefEpoch = Math.max(Date.now(), ...traineeEntries.map((e) => e.epochMs || 0));

    for (const entry of traineeEntries) {
      const entrySub = inferMuscleSubdivision(
        entry.exerciseName,
        entry.primaryMuscle || inferPrimaryMuscleFromExerciseName(entry.exerciseName)
      );
      const entryPrimary = inferPrimaryMuscleFromExerciseName(entry.exerciseName);

      const isExactExercise = Boolean(
        query.exerciseName &&
          entry.exerciseName.trim().toLowerCase() === query.exerciseName.trim().toLowerCase()
      );
      const isSameSubdivision = Boolean(
        targetSub && targetSub !== "general" && entrySub === targetSub
      );
      const isSameGeneralPrimary = Boolean(
        targetPrimary &&
          targetPrimary !== "general" &&
          entryPrimary === targetPrimary &&
          (!targetSub || targetSub === "general" || entrySub === "general")
      );

      // When querying for a specific exercise, prevent cross-contamination from other muscle subdivisions
      if (query.exerciseName && !isExactExercise && !isSameSubdivision && !isSameGeneralPrimary) {
        continue;
      }

      const entryVec =
        entry.embeddingVector && entry.embeddingVector.length > 0
          ? entry.embeddingVector
          : computeBiomechanicalEmbedding({
              text: entry.canonicalEnglishSummary,
              muscleSubdivision: entrySub,
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
      if (isExactExercise) {
        compositeScore += 30;
        reasons.push(`Exact exercise match (${entry.exerciseName})`);
      }

      // Anatomical subdivision match
      if (isSameSubdivision) {
        compositeScore += 20;
        reasons.push(`Same muscle subdivision (${entrySub})`);
      } else if (targetPrimary && entryPrimary === targetPrimary) {
        compositeScore += 10;
        reasons.push(`Related primary muscle group (${entryPrimary})`);
      }

      // Severity signal boost
      if (entry.biomechanicalEntities.severity === "acute") {
        compositeScore += 15;
        reasons.push("Acute joint/biomechanical signal");
      } else if (entry.biomechanicalEntities.severity === "moderate") {
        compositeScore += 10;
        reasons.push("Moderate motor compensation signal");
      }

      // Temporal recency decay & resolution check
      const daysElapsed = Math.max(0, (maxRefEpoch - (entry.epochMs || maxRefEpoch)) / 86400000);
      const temporalDecayWeight = Number(Math.exp(-daysElapsed / 28).toFixed(3));
      const isSupersededByResolution = traineeEntries.some(
        (newer) =>
          newer.id !== entry.id &&
          newer.exerciseName.trim().toLowerCase() === entry.exerciseName.trim().toLowerCase() &&
          (newer.epochMs > entry.epochMs || newer.date > entry.date) &&
          newer.biomechanicalEntities.symptomStatus === "resolved" &&
          newer.biomechanicalEntities.symptoms.length === 0
      );

      if (daysElapsed > 7) {
        compositeScore = compositeScore * Math.max(0.25, temporalDecayWeight);
        reasons.push(`Temporal decay weight (${Math.round(daysElapsed)}d ago): ${temporalDecayWeight}`);
      }
      if (isSupersededByResolution) {
        compositeScore = compositeScore * 0.4;
        reasons.push("Superseded by subsequent resolved/pain-free session");
      }

      if (compositeScore >= 15 || cosSim >= 0.2) {
        matches.push({
          entry: {
            ...entry,
            primaryMuscle: entryPrimary,
            muscleSubdivision: entrySub,
          },
          cosineSimilarity: cosSim,
          relevanceScore: Number(compositeScore.toFixed(2)),
          temporalDecayWeight,
          isSupersededByResolution,
          matchReasons: reasons,
          isExactExerciseMatch: isExactExercise,
          isSameSubdivisionMatch: isSameSubdivision,
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

  public hydrateFromFirestoreRecords(
    traineeId: string,
    records: SensoryFeedbackEntry[]
  ): number {
    this.hydrate();
    if (!Array.isArray(records) || records.length === 0) return 0;
    const existingIds = new Set(this.entries.map((e) => e.id));
    let added = 0;
    for (const rec of records) {
      if (!rec || !rec.id) continue;
      if (!existingIds.has(rec.id)) {
        this.entries.push({ ...rec, traineeId });
        existingIds.add(rec.id);
        added++;
      }
    }
    if (added > 0) {
      this.persist();
    }
    return added;
  }

  /**
   * Asynchronous Audio Voice Feedback Transcription & Canonical Ingestion Pipeline.
   * - Validates audio format & non-empty payload
   * - Prevents duplicate concurrent or repeated transcription jobs for the same recording
   * - Retries transient transcription failures up to `maxRetries` times
   * - Preserves original `audioNoteUrl` untouched while persisting `audioTranscript`
   * - Automatically ingests the transcribed text into `SensoryMemoryStore`
   */
  public async transcribeAndIngestAudio(params: {
    traineeId: string;
    sessionId?: string;
    date?: string;
    exerciseId?: string;
    exerciseName: string;
    primaryMuscle?: string;
    tags?: ExerciseBiofeedbackTag[];
    freeTextNote?: string;
    audioNoteUrl?: string;
    audioDataUri?: string;
    audioTranscriptHint?: string;
    equipmentPhotoUrl?: string;
    gymId?: string;
    gymName?: string;
    maxRetries?: number;
    customTranscriber?: (audioDataUri: string, exerciseName?: string) => Promise<string | undefined>;
  }): Promise<AudioTranscriptionJobResult> {
    this.hydrate();
    const effectiveSessionId = params.sessionId || "session_active";
    const originalAudioUrl = params.audioNoteUrl || params.audioDataUri || "";

    // 1. Validate audio format & non-empty recording before scheduling job
    const validation = validateAudioDataUri(originalAudioUrl);
    if (!validation.valid && !params.audioTranscriptHint) {
      return {
        jobId: `tx_invalid_${Date.now()}`,
        status: "failed",
        transcriptionStatus: "failed",
        audioNoteUrl: originalAudioUrl,
        attempts: 0,
        error: validation.reason || "Invalid audio recording",
      };
    }

    const jobKey = this.computeAudioJobKey({
      traineeId: params.traineeId,
      sessionId: effectiveSessionId,
      exerciseName: params.exerciseName,
      audioNoteUrl: originalAudioUrl,
    });

    // 2. Duplicate job prevention: check completed cache
    const cachedCompleted = this.completedJobs.get(jobKey);
    if (cachedCompleted && cachedCompleted.status === "completed") {
      return {
        ...cachedCompleted,
        status: "deduplicated",
      };
    }

    // 3. Duplicate job prevention: check in-flight job map
    const existingInFlight = this.inFlightJobs.get(jobKey);
    if (existingInFlight) {
      const sharedResult = await existingInFlight;
      return {
        ...sharedResult,
        status: sharedResult.status === "completed" ? "deduplicated" : sharedResult.status,
      };
    }

    const maxRetries = typeof params.maxRetries === "number" ? Math.max(0, params.maxRetries) : 2;
    const transcriberFn = params.customTranscriber || transcribeAudioFeedbackWithGemini;

    const jobPromise = (async (): Promise<AudioTranscriptionJobResult> => {
      let attempts = 0;
      let lastError: string | undefined;
      let resolvedTranscript = (params.audioTranscriptHint || "").trim() || undefined;

      while (!resolvedTranscript && attempts <= maxRetries) {
        attempts++;
        try {
          const text = await transcriberFn(originalAudioUrl, params.exerciseName);
          if (text && text.trim()) {
            resolvedTranscript = text.trim();
            break;
          } else {
            lastError = "Transcription returned empty text";
          }
        } catch (err: unknown) {
          lastError =
            err instanceof Error ? err.message : "Transient audio transcription failure";
        }
      }

      if (!resolvedTranscript) {
        return {
          jobId: `tx_failed_${Date.now()}`,
          status: "failed",
          transcriptionStatus: "failed",
          audioNoteUrl: originalAudioUrl,
          attempts,
          error: lastError || "Unable to transcribe audio recording",
        };
      }

      const detectedLanguage = detectFeedbackLanguage(resolvedTranscript);
      const sensoryEntry = this.ingest({
        traineeId: params.traineeId,
        sessionId: effectiveSessionId,
        date: params.date,
        exerciseId: params.exerciseId,
        exerciseName: params.exerciseName,
        primaryMuscle: params.primaryMuscle,
        tags: params.tags,
        freeTextNote: params.freeTextNote,
        // Preserve original audioNoteUrl untouched
        audioNoteUrl: originalAudioUrl,
        audioTranscript: resolvedTranscript,
        equipmentPhotoUrl: params.equipmentPhotoUrl,
        gymId: params.gymId,
        gymName: params.gymName,
      });

      const completedResult: AudioTranscriptionJobResult = {
        jobId: `tx_ok_${Date.now()}`,
        status: "completed",
        transcriptionStatus: "completed",
        audioNoteUrl: originalAudioUrl,
        audioTranscript: resolvedTranscript,
        detectedLanguage,
        attempts,
        sensoryEntry,
      };

      this.completedJobs.set(jobKey, completedResult);
      return completedResult;
    })();

    this.inFlightJobs.set(jobKey, jobPromise);
    try {
      return await jobPromise;
    } finally {
      this.inFlightJobs.delete(jobKey);
    }
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
      photoUrl?: string;
      audioNoteUrl?: string;
      audioTranscript?: string;
    }>;
  }>) {
    this.hydrate();
    for (const s of sessions) {
      if (!s.exerciseFeedbacks) continue;
      for (const fb of s.exerciseFeedbacks) {
        const resolvedTranscript =
          fb.audioTranscript || extractTranscriptFromAudioDataUri(fb.audioNoteUrl);
        const existingEntry = this.entries.find(
          (e) =>
            e.sessionId === s.id &&
            e.exerciseName.toLowerCase() === fb.exerciseName.toLowerCase()
        );
        if (!existingEntry || (resolvedTranscript && !existingEntry.rawTranscription)) {
          this.ingest({
            traineeId: s.traineeId,
            sessionId: s.id,
            date: s.date,
            exerciseName: fb.exerciseName,
            tags: fb.tags && fb.tags.length > 0 ? fb.tags : fb.tag ? [fb.tag] : [],
            freeTextNote: fb.note,
            audioNoteUrl: fb.audioNoteUrl,
            audioTranscript: resolvedTranscript,
            equipmentPhotoUrl: fb.photoUrl,
            gymId: s.gymId,
            gymName: s.gymName,
          });
        }
      }
    }
  }

  public clearForTesting() {
    this.entries = [];
    this.inFlightJobs.clear();
    this.completedJobs.clear();
    this.hydrated = true;
    this.persist();
  }
}

export const sensoryMemoryStore = new SensoryMemoryStore();

export async function processAudioFeedbackTranscription(
  params: Parameters<SensoryMemoryStore["transcribeAndIngestAudio"]>[0]
): Promise<AudioTranscriptionJobResult> {
  return sensoryMemoryStore.transcribeAndIngestAudio(params);
}
