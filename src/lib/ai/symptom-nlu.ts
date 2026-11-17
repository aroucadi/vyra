/**
 * Structured Symptom NLU & Lexicon Tokenizer (`src/lib/ai/symptom-nlu.ts`)
 *
 * Replaces brittle multi-hundred-character regex walls with:
 * 1. Structured UI tag / object ingestion (`StructuredSymptomInput`) requiring zero text guessing.
 * 2. LLM Semantic Extractor (`extractStructuredSymptomsViaLlm`) with strict JSON schema for
 *    temporal tense ("used to hurt last month"), negation, and code-switched EN/FR/Darija notes.
 * 3. Clean Unicode word-token table (`parseSymptomsFromTokenTable`) for offline fallback —
 *    exact token-set lookup (no lookbehind regex soup, no substring collisions like "avocados" -> "dos").
 */

import {
  buildGeminiGenerationConfig,
  extractCandidateText,
  getActiveGeminiModel,
  resolveGeminiTransport,
} from "../gemini";

export type AnatomicalJoint =
  | "shoulder"
  | "elbow"
  | "wrist"
  | "lumbar"
  | "knee"
  | "unspecified";

export type SymptomPolarity =
  | "active_pain"
  | "resolved_or_negated"
  | "uncertain"
  | "no_symptom";

export interface StructuredSymptomInput {
  joint: AnatomicalJoint;
  polarity: SymptomPolarity;
  note?: string;
}

export interface ParsedSymptomAssessment {
  symptoms: string[];
  isAmbiguous: boolean;
  clarifyingQuestions: string[];
  structuredReports: Array<{
    rawInput: string;
    joint: AnatomicalJoint;
    polarity: SymptomPolarity;
    canonicalSymptoms: string[];
    extractionMethod: "structured_tag" | "llm_semantic" | "offline_token_table";
  }>;
}

const CANONICAL_SYMPTOM_TOKENS = new Set<string>([
  "anterior_shoulder_pinch",
  "glenohumeral_friction",
  "lumbar_axial_strain",
  "patellar_tracking_friction",
  "wrist_valgus_strain",
  "elbow_tendon_strain",
]);

const JOINT_TO_CANONICAL_SYMPTOMS: Record<
  Exclude<AnatomicalJoint, "unspecified">,
  string[]
> = {
  shoulder: ["anterior_shoulder_pinch", "glenohumeral_friction"],
  lumbar: ["lumbar_axial_strain"],
  knee: ["patellar_tracking_friction"],
  wrist: ["wrist_valgus_strain"],
  elbow: ["elbow_tendon_strain"],
};

/**
 * Exact word tokens per joint across English, French (accented & unaccented),
 * Moroccan Darija (Arabizi), and Arabic script.
 * Matched strictly against tokenized words so "avocados" never matches "dos".
 */
const JOINT_WORD_TOKENS: Record<
  Exclude<AnatomicalJoint, "unspecified">,
  ReadonlySet<string>
> = {
  shoulder: new Set([
    "shoulder",
    "shoulders",
    "impingement",
    "subacromial",
    "épaule",
    "epaule",
    "épaules",
    "epaules",
    "coiffe",
    "ktef",
    "ktf",
    "ktfi",
    "ketfi",
    "ktafi",
    "lktef",
    "كتف",
    "كتفي",
    "الكتف",
    "كتافي",
  ]),
  lumbar: new Set([
    "lumbar",
    "sciatica",
    "sciatique",
    "spine",
    "lombaire",
    "lombaires",
    "dos",
    "dhar",
    "dhari",
    "dahri",
    "dehri",
    "ldhar",
    "ظهر",
    "ظهري",
    "ضهر",
    "ضهري",
    "الظهر",
  ]),
  knee: new Set([
    "knee",
    "knees",
    "patella",
    "patellar",
    "meniscus",
    "ménisque",
    "acl",
    "genou",
    "genoux",
    "rotule",
    "rokba",
    "rkba",
    "rokbti",
    "rkabti",
    "rkabi",
    "lrokba",
    "ركبة",
    "ركبتي",
    "الركبة",
    "ركابي",
  ]),
  wrist: new Set([
    "wrist",
    "wrists",
    "poignet",
    "poignets",
    "carpal",
    "tfcc",
    "ma3sam",
    "m3sem",
    "معصم",
    "معصمي",
    "المعصم",
  ]),
  elbow: new Set([
    "elbow",
    "elbows",
    "epicondylitis",
    "epicondyl",
    "épicondylite",
    "epicondylite",
    "tendonitis",
    "tendinitis",
    "tendinite",
    "coude",
    "coudes",
    "merfeq",
    "mrfq",
    "marfaq",
    "mrafqi",
    "مرفق",
    "مرفقي",
    "المرفق",
    "الكوع",
  ]),
};

const MULTI_WORD_JOINT_PHRASES: Array<{
  joint: Exclude<AnatomicalJoint, "unspecified">;
  phraseTokens: string[];
}> = [
  { joint: "shoulder", phraseTokens: ["rotator", "cuff"] },
  { joint: "lumbar", phraseTokens: ["lower", "back"] },
  { joint: "lumbar", phraseTokens: ["low", "back"] },
  { joint: "lumbar", phraseTokens: ["herniated", "disc"] },
  { joint: "lumbar", phraseTokens: ["slipped", "disc"] },
  { joint: "lumbar", phraseTokens: ["disc", "bulge"] },
  { joint: "lumbar", phraseTokens: ["disque", "lombaire"] },
  { joint: "lumbar", phraseTokens: ["hernie", "discale"] },
  { joint: "lumbar", phraseTokens: ["أسفل", "الظهر"] },
  { joint: "elbow", phraseTokens: ["golfer's", "elbow"] },
  { joint: "elbow", phraseTokens: ["tennis", "elbow"] },
];

const PATHOLOGY_TOKENS = new Set([
  "impingement",
  "subacromial",
  "sciatica",
  "sciatique",
  "lumbar",
  "lombaire",
  "lombaires",
  "patellar",
  "meniscus",
  "ménisque",
  "acl",
  "carpal",
  "tfcc",
  "epicondylitis",
  "epicondyl",
  "épicondylite",
  "epicondylite",
  "tendonitis",
  "tendinitis",
  "tendinite",
]);

const PAIN_OR_STRAIN_TOKENS = new Set([
  "pain",
  "painful",
  "ache",
  "aching",
  "hurt",
  "hurts",
  "hurting",
  "pinch",
  "pinching",
  "strain",
  "strained",
  "sore",
  "clicking",
  "popping",
  "discomfort",
  "stiff",
  "raide",
  "irritated",
  "inflammation",
  "douleur",
  "douleurs",
  "douloureux",
  "mal",
  "pincement",
  "coincement",
  "accrochage",
  "claquement",
  "craquement",
  "brûlure",
  "lancinant",
  "gêne",
  "blessure",
  "darni",
  "dârni",
  "darouni",
  "kiyderni",
  "kidarni",
  "katdarni",
  "wja3ni",
  "wjaani",
  "wja3",
  "kiwja3ni",
  "ضرني",
  "كيضرني",
  "كتضرني",
  "وجعني",
  "كيوجعني",
  "كتوجعني",
  "ألم",
  "حريق",
  "mfasel",
  "مفاصل",
]);

const NEGATION_SINGLE_TOKENS = new Set([
  "no",
  "zero",
  "without",
  "painless",
  "pain-free",
  "resolved",
  "healed",
  "disparu",
  "guéri",
  "sans",
  "aucune",
  "aucun",
  "mab9ach",
  "mabqach",
  "madarnich",
  "makatdarnich",
  "makiydernich",
  "مبقاش",
  "مابقاش",
  "بدون",
  "ماكاين",
  "ماكاينش",
]);

const NEGATION_TOKEN_SEQUENCES: string[][] = [
  ["pain", "free"],
  ["not", "hurting"],
  ["didn't", "hurt"],
  ["does", "not", "hurt"],
  ["used", "to", "hurt"],
  ["pas", "de", "douleur"],
  ["pas", "de", "gêne"],
  ["pas", "de", "mal"],
  ["plus", "de", "douleur"],
  ["plus", "mal"],
  ["went", "away"],
  ["bla", "alam"],
  ["bla", "hri9"],
  ["ma", "darni"],
  ["ma", "darnich"],
  ["ma", "katdarnich"],
  ["ma", "kiydernich"],
  ["kan", "kiyderni"],
  ["ما", "كيضرنيش"],
  ["ما", "كتضرنيش"],
  ["ما", "ضرنيش"],
];

const BENIGN_NON_INJURY_CONTEXT_TOKENS = new Set([
  "pump",
  "congestion",
  "séance",
  "seance",
  "workout",
  "day",
  "strong",
  "fort",
  "fluide",
  "sleeves",
]);

const CLARIFYING_QUESTION_PROMPT =
  "Which specific joint or area felt uncomfortable (shoulder, elbow, wrist, lower back, or knee), and was it a sharp pinch or a dull ache?";

/**
 * Splits any multilingual utterance into normalized lowercase Unicode word tokens.
 */
export function tokenizeUnicodeWords(text: string): string[] {
  return (
    text
      .toLowerCase()
      .replace(/['’]/g, "'")
      .match(/[\p{L}\p{N}_'-]+/gu) || []
  );
}

function containsTokenSequence(tokens: string[], seq: string[]): boolean {
  if (seq.length === 0 || tokens.length < seq.length) return false;
  for (let i = 0; i <= tokens.length - seq.length; i++) {
    let allMatch = true;
    for (let j = 0; j < seq.length; j++) {
      if (tokens[i + j] !== seq[j]) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return true;
  }
  return false;
}

export function isUtteranceNegatedOrResolved(tokens: string[]): boolean {
  for (const t of tokens) {
    if (NEGATION_SINGLE_TOKENS.has(t)) return true;
  }
  for (const seq of NEGATION_TOKEN_SEQUENCES) {
    if (containsTokenSequence(tokens, seq)) return true;
  }
  return false;
}

export function hasNegatedOrResolvedSymptomTokens(text: string): boolean {
  if (!text || !text.trim()) return false;
  return isUtteranceNegatedOrResolved(tokenizeUnicodeWords(text));
}

function isUtteranceExplicitlyUncertainBetweenJoints(tokens: string[]): boolean {
  const joined = tokens.join(" ");
  if (
    containsTokenSequence(tokens, ["not", "sure", "if"]) ||
    containsTokenSequence(tokens, ["je", "ne", "sais", "pas", "si"]) ||
    containsTokenSequence(tokens, ["ma3reftch", "wach"])
  ) {
    return true;
  }
  if (
    (tokens.includes("maybe") && tokens.includes("or")) ||
    (tokens.includes("either") && tokens.includes("or")) ||
    (tokens.includes("soit") && joined.indexOf("soit") !== joined.lastIndexOf("soit"))
  ) {
    return true;
  }
  return false;
}

function matchJointsFromTokens(
  tokens: string[]
): Array<Exclude<AnatomicalJoint, "unspecified">> {
  const matched = new Set<Exclude<AnatomicalJoint, "unspecified">>();

  for (const [joint, tokenSet] of Object.entries(JOINT_WORD_TOKENS) as Array<
    [Exclude<AnatomicalJoint, "unspecified">, ReadonlySet<string>]
  >) {
    for (const t of tokens) {
      // Strip French/Darija leading elisions like "l'épaule" -> "épaule", "l'exercice" -> "exercice"
      const stripped = t.replace(/^[ldjquns]'/i, "");
      if (tokenSet.has(t) || tokenSet.has(stripped)) {
        matched.add(joint);
      }
    }
  }

  for (const item of MULTI_WORD_JOINT_PHRASES) {
    if (containsTokenSequence(tokens, item.phraseTokens)) {
      matched.add(item.joint);
    }
  }

  return Array.from(matched);
}

/**
 * Synchronous, deterministic token-table parser (zero giant regexes).
 */
export function parseSymptomsFromTokenTable(
  inputs?: Array<string | StructuredSymptomInput>
): ParsedSymptomAssessment {
  if (!inputs || inputs.length === 0) {
    return {
      symptoms: [],
      isAmbiguous: false,
      clarifyingQuestions: [],
      structuredReports: [],
    };
  }

  const mapped = new Set<string>();
  const clarifyingQuestions = new Set<string>();
  const structuredReports: ParsedSymptomAssessment["structuredReports"] = [];
  let isAmbiguous = false;

  for (const item of inputs) {
    if (!item) continue;

    // 1. Structured input object (from UI chip / structured form or LLM extractor)
    if (typeof item === "object" && "joint" in item && "polarity" in item) {
      if (item.polarity === "active_pain" && item.joint !== "unspecified") {
        const canonicals = JOINT_TO_CANONICAL_SYMPTOMS[item.joint] || [];
        canonicals.forEach((c) => mapped.add(c));
        structuredReports.push({
          rawInput: item.note || `${item.joint}:${item.polarity}`,
          joint: item.joint,
          polarity: item.polarity,
          canonicalSymptoms: canonicals,
          extractionMethod: "structured_tag",
        });
      } else if (item.polarity === "uncertain" || item.joint === "unspecified") {
        isAmbiguous = true;
        clarifyingQuestions.add(CLARIFYING_QUESTION_PROMPT);
        structuredReports.push({
          rawInput: item.note || `${item.joint}:${item.polarity}`,
          joint: item.joint,
          polarity: "uncertain",
          canonicalSymptoms: [],
          extractionMethod: "structured_tag",
        });
      } else {
        structuredReports.push({
          rawInput: item.note || `${item.joint}:${item.polarity}`,
          joint: item.joint,
          polarity: item.polarity,
          canonicalSymptoms: [],
          extractionMethod: "structured_tag",
        });
      }
      continue;
    }

    const text = String(item).trim();
    if (!text) continue;

    // 2. Direct canonical token pass-through
    if (CANONICAL_SYMPTOM_TOKENS.has(text)) {
      mapped.add(text);
      structuredReports.push({
        rawInput: text,
        joint: text.includes("shoulder") || text.includes("glenohumeral")
          ? "shoulder"
          : text.includes("lumbar")
            ? "lumbar"
            : text.includes("patellar")
              ? "knee"
              : text.includes("wrist")
                ? "wrist"
                : "elbow",
        polarity: "active_pain",
        canonicalSymptoms: [text],
        extractionMethod: "structured_tag",
      });
      continue;
    }

    const tokens = tokenizeUnicodeWords(text);
    if (tokens.length === 0) continue;

    // 3. Check negation / resolution tokens
    if (isUtteranceNegatedOrResolved(tokens)) {
      structuredReports.push({
        rawInput: text,
        joint: matchJointsFromTokens(tokens)[0] || "unspecified",
        polarity: "resolved_or_negated",
        canonicalSymptoms: [],
        extractionMethod: "offline_token_table",
      });
      continue;
    }

    // 4. Check pathology / pain / short profile tag
    const isShortProfileTag =
      tokens.length <= 3 &&
      !tokens.some((t) => BENIGN_NON_INJURY_CONTEXT_TOKENS.has(t));
    const hasPathology =
      tokens.some((t) => PATHOLOGY_TOKENS.has(t)) ||
      MULTI_WORD_JOINT_PHRASES.some(
        (p) =>
          p.phraseTokens[0] !== "lower" &&
          p.phraseTokens[0] !== "low" &&
          containsTokenSequence(tokens, p.phraseTokens)
      );
    const hasPainWord = tokens.some((t) => PAIN_OR_STRAIN_TOKENS.has(t));

    if (!isShortProfileTag && !hasPathology && !hasPainWord) {
      structuredReports.push({
        rawInput: text,
        joint: "unspecified",
        polarity: "no_symptom",
        canonicalSymptoms: [],
        extractionMethod: "offline_token_table",
      });
      continue;
    }

    // 5. Check explicit uncertainty between joints
    if (isUtteranceExplicitlyUncertainBetweenJoints(tokens)) {
      isAmbiguous = true;
      clarifyingQuestions.add(CLARIFYING_QUESTION_PROMPT);
      structuredReports.push({
        rawInput: text,
        joint: "unspecified",
        polarity: "uncertain",
        canonicalSymptoms: [],
        extractionMethod: "offline_token_table",
      });
      continue;
    }

    // 6. Match anatomical joints from token table
    const matchedJoints = matchJointsFromTokens(tokens);
    if (matchedJoints.length > 0) {
      for (const joint of matchedJoints) {
        const canonicals = JOINT_TO_CANONICAL_SYMPTOMS[joint];
        canonicals.forEach((c) => mapped.add(c));
        structuredReports.push({
          rawInput: text,
          joint,
          polarity: "active_pain",
          canonicalSymptoms: canonicals,
          extractionMethod: "offline_token_table",
        });
      }
    } else if (hasPainWord) {
      isAmbiguous = true;
      clarifyingQuestions.add(CLARIFYING_QUESTION_PROMPT);
      structuredReports.push({
        rawInput: text,
        joint: "unspecified",
        polarity: "uncertain",
        canonicalSymptoms: [],
        extractionMethod: "offline_token_table",
      });
    }
  }

  return {
    symptoms: Array.from(mapped),
    isAmbiguous,
    clarifyingQuestions: Array.from(clarifyingQuestions),
    structuredReports,
  };
}

/**
 * Async LLM Semantic Symptom Extractor:
 * Parses natural-language workout notes in any language (English, French, Moroccan Darija, Arabizi)
 * into structured `{ joint, polarity, clarifyingQuestion }` JSON via Gemini when `GEMINI_API_KEY`
 * or `fetchImpl` is available, falling back to `parseSymptomsFromTokenTable` offline.
 */
export async function extractStructuredSymptomsViaLlm(
  notes: string[],
  options?: { fetchImpl?: typeof fetch; apiKey?: string }
): Promise<ParsedSymptomAssessment> {
  const fetchFn = options?.fetchImpl || fetch;
  const model = getActiveGeminiModel();
  const explicitKey =
    options?.apiKey ||
    (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);

  const transport = explicitKey
    ? {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": explicitKey,
        },
      }
    : (await resolveGeminiTransport(model, { fetchImpl: options?.fetchImpl })) ||
      (options?.fetchImpl
        ? {
            url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": "test-key",
            },
          }
        : null);

  if (!transport) {
    return parseSymptomsFromTokenTable(notes);
  }

  try {
    const res = await fetchFn(transport.url, {
      method: "POST",
      headers: transport.headers,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Extract structured joint symptom assessments from the following athlete notes (which may be in English, French, Moroccan Darija, or Arabizi).
Distinguish active pain ("active_pain") from negated or past-resolved pain ("resolved_or_negated"), ambiguous/unspecified pain ("uncertain"), and benign non-pain notes ("no_symptom").
Notes: ${JSON.stringify(notes)}`,
              },
            ],
          },
        ],
        generationConfig: buildGeminiGenerationConfig({
          model,
          thinkingLevel: "low",
          maxOutputTokens: 8192,
          temperature: 0.0,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              items: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    rawInput: { type: "STRING" },
                    joint: {
                      type: "STRING",
                      enum: [
                        "shoulder",
                        "elbow",
                        "wrist",
                        "lumbar",
                        "knee",
                        "unspecified",
                      ],
                    },
                    polarity: {
                      type: "STRING",
                      enum: [
                        "active_pain",
                        "resolved_or_negated",
                        "uncertain",
                        "no_symptom",
                      ],
                    },
                    clarifyingQuestion: { type: "STRING" },
                  },
                  required: ["rawInput", "joint", "polarity"],
                },
              },
            },
            required: ["items"],
          },
        }),
      }),
      signal:
        !options?.fetchImpl &&
        typeof AbortSignal !== "undefined" &&
        typeof AbortSignal.timeout === "function"
          ? AbortSignal.timeout(10000)
          : undefined,
    });

    if (!res.ok) {
      return parseSymptomsFromTokenTable(notes);
    }

    const data = await res.json();
    const rawText = extractCandidateText(data);
    if (!rawText) {
      return parseSymptomsFromTokenTable(notes);
    }

    const parsed = JSON.parse(rawText) as {
      items?: Array<{
        rawInput: string;
        joint: AnatomicalJoint;
        polarity: SymptomPolarity;
        clarifyingQuestion?: string;
      }>;
    };

    if (!Array.isArray(parsed.items)) {
      return parseSymptomsFromTokenTable(notes);
    }

    const mapped = new Set<string>();
    const clarifyingQuestions = new Set<string>();
    const structuredReports: ParsedSymptomAssessment["structuredReports"] = [];
    let isAmbiguous = false;

    for (const item of parsed.items) {
      if (item.polarity === "active_pain" && item.joint !== "unspecified") {
        const canonicals = JOINT_TO_CANONICAL_SYMPTOMS[item.joint] || [];
        canonicals.forEach((c) => mapped.add(c));
        structuredReports.push({
          rawInput: item.rawInput,
          joint: item.joint,
          polarity: "active_pain",
          canonicalSymptoms: canonicals,
          extractionMethod: "llm_semantic",
        });
      } else if (
        item.polarity === "uncertain" ||
        (item.polarity === "active_pain" && item.joint === "unspecified")
      ) {
        isAmbiguous = true;
        clarifyingQuestions.add(
          item.clarifyingQuestion || CLARIFYING_QUESTION_PROMPT
        );
        structuredReports.push({
          rawInput: item.rawInput,
          joint: item.joint,
          polarity: "uncertain",
          canonicalSymptoms: [],
          extractionMethod: "llm_semantic",
        });
      } else {
        structuredReports.push({
          rawInput: item.rawInput,
          joint: item.joint,
          polarity: item.polarity,
          canonicalSymptoms: [],
          extractionMethod: "llm_semantic",
        });
      }
    }

    return {
      symptoms: Array.from(mapped),
      isAmbiguous,
      clarifyingQuestions: Array.from(clarifyingQuestions),
      structuredReports,
    };
  } catch {
    return parseSymptomsFromTokenTable(notes);
  }
}
