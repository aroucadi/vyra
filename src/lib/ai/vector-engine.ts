/**
 * Biomechanical & Semantic Vector Embedding Engine
 * 
 * Provides authentic L2-normalized vector representations and Cosine Similarity math:
 * 1. Hybrid 64-Dimensional Biomechanical + Semantic Subword Vectorizer (Sub-millisecond offline & deterministic)
 * 2. Google Cloud Vertex AI `text-embedding-004` Integration (When cloud credentials / API key are active)
 */

import { MuscleSubdivision, ResistanceProfile } from "../training-math/substitution-copilot";

export const VECTOR_DIMENSIONS = 64;

const SUBDIVISION_INDEX: Record<MuscleSubdivision, number> = {
  deltoid_lateral: 0,
  deltoid_anterior: 1,
  deltoid_posterior: 2,
  chest_clavicular: 3,
  chest_sternal: 4,
  chest_costal: 5,
  lat_iliac: 6,
  back_rhomboids: 7,
  quad_lengthened: 8,
  quad_shortened: 9,
  hamstring_hip: 10,
  hamstring_knee: 11,
  tricep_long_head: 12,
  tricep_lateral: 13,
  bicep_short_head: 14,
  bicep_long_head: 15,
  general: 15,
};

const PROFILE_INDEX: Record<ResistanceProfile, number> = {
  lengthened: 16,
  shortened: 17,
  constant: 18,
  ascending: 19,
};

const EQUIPMENT_KEYWORDS: Array<{ match: string; dim: number }> = [
  { match: "cable", dim: 20 },
  { match: "dumbbell", dim: 21 },
  { match: "barbell", dim: 22 },
  { match: "machine", dim: 23 },
  { match: "leverage", dim: 23 },
];

const BIOMECHANICAL_ENTITY_INDEX: Record<string, number> = {
  anterior_shoulder_pinch: 24,
  joint_clicking: 25,
  acute_joint_discomfort: 26,
  elbow_tendon_strain: 27,
  lumbar_axial_strain: 28,
  wrist_valgus_strain: 29,
  patellar_tracking_friction: 30,
  glenohumeral_friction: 31,
  upper_trap_shrugging: 32,
  momentum_cheating: 33,
  lumbar_hyperextension: 34,
  bilateral_asymmetry: 35,
  anterior_delt_takeover: 36,
  high_neural_fatigue: 37,
  stability_breakdown: 38,
  joint_strain_flagged: 39,
};

/**
 * L2-normalizes a numeric vector so that dot product equals Cosine Similarity.
 */
export function l2Normalize(vec: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  const mag = Math.sqrt(sumSq);
  if (mag < 1e-12) return vec.map(() => 0);
  return vec.map((v) => Number((v / mag).toFixed(6)));
}

/**
 * Computes exact Cosine Similarity between two vectors in [-1.0, 1.0].
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const len = Math.min(vecA.length, vecB.length);
  if (len === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom < 1e-12) return 0;
  return Number((dot / denom).toFixed(4));
}

/**
 * Deterministic feature hashing for character 3-grams and tokens into dimensions [40..63].
 */
function hashTokenToDimension(token: string): { dim: number; sign: number } {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const unsigned = h >>> 0;
  const dim = 40 + (unsigned % 24);
  const sign = (unsigned & 1) === 0 ? 1 : -1;
  return { dim, sign };
}

export interface BiomechanicalVectorInput {
  text: string;
  muscleSubdivision?: MuscleSubdivision;
  resistanceProfile?: ResistanceProfile;
  equipment?: string;
  symptoms?: string[];
  compensations?: string[];
}

/**
 * Computes a 64-dimensional L2-normalized biomechanical & semantic embedding vector.
 */
export function computeBiomechanicalEmbedding(input: BiomechanicalVectorInput): number[] {
  const vec = new Array<number>(VECTOR_DIMENSIONS).fill(0);

  // 1. Anatomical Subdivision Coordinate (High weight: 3.0)
  if (input.muscleSubdivision && input.muscleSubdivision in SUBDIVISION_INDEX) {
    vec[SUBDIVISION_INDEX[input.muscleSubdivision]] += 3.0;
  }

  // 2. Resistance Profile Coordinate (Weight: 2.0)
  if (input.resistanceProfile && input.resistanceProfile in PROFILE_INDEX) {
    vec[PROFILE_INDEX[input.resistanceProfile]] += 2.0;
  }

  // 3. Equipment Coordinate (Weight: 1.5)
  if (input.equipment) {
    const eqLower = input.equipment.toLowerCase();
    for (const eq of EQUIPMENT_KEYWORDS) {
      if (eqLower.includes(eq.match)) {
        vec[eq.dim] += 1.5;
      }
    }
  }

  // 4. Biomechanical Symptoms & Compensations Coordinates (Weight: 2.5)
  for (const sym of input.symptoms || []) {
    if (sym in BIOMECHANICAL_ENTITY_INDEX) {
      vec[BIOMECHANICAL_ENTITY_INDEX[sym]] += 2.5;
    }
  }
  for (const comp of input.compensations || []) {
    if (comp in BIOMECHANICAL_ENTITY_INDEX) {
      vec[BIOMECHANICAL_ENTITY_INDEX[comp]] += 2.5;
    }
  }

  // 5. Semantic Token & Character N-Gram Projection into Dimensions [40..63]
  const cleanText = (input.text || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, " ")
    .trim();

  if (cleanText) {
    const words = cleanText.split(/\s+/).filter((w) => w.length >= 2);
    for (const word of words) {
      // Also check if word matches any biomechanical entity
      for (const [entityKey, dimIdx] of Object.entries(BIOMECHANICAL_ENTITY_INDEX)) {
        if (entityKey.includes(word) && word.length >= 4) {
          vec[dimIdx] += 1.2;
        }
      }

      const { dim, sign } = hashTokenToDimension(word);
      vec[dim] += sign * 1.0;

      // Character tri-grams for morphological robustness
      if (word.length >= 4) {
        for (let i = 0; i <= word.length - 3; i++) {
          const trigram = word.slice(i, i + 3);
          const tg = hashTokenToDimension(trigram);
          vec[tg.dim] += tg.sign * 0.4;
        }
      }
    }
  }

  return l2Normalize(vec);
}

/**
 * Optional Google Cloud Vertex AI / Gemini Embedding API (`text-embedding-004`).
 * Falls back seamlessly to the 64-D Biomechanical Embedding when offline or in local evaluation.
 */
export async function computeVertexOrLocalEmbedding(
  input: BiomechanicalVectorInput
): Promise<{ vector: number[]; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && input.text) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: input.text }] },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.embedding?.values)) {
          return {
            vector: l2Normalize(data.embedding.values),
            model: "text-embedding-004",
          };
        }
      }
    } catch {
      // Fallback to local biomechanical vector
    }
  }

  return {
    vector: computeBiomechanicalEmbedding(input),
    model: "vyra-biomechanical-vec-64d",
  };
}
