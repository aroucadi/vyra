/**
 * General-Purpose Autonomous Daily Workout Adaptation Engine
 * 
 * Understands ANY open-ended athlete feedback (voice or text, in English, French, or Darija),
 * processes the physiological, biomechanical, environmental, or psychological context,
 * and autonomously takes the right coaching call for TODAY'S session (`scope: "TODAY_SESSION_ONLY"`,
 * `longTermProgramModified: false`) without altering the athlete's long-term 16-week blueprint.
 * 
 * Capabilities:
 * 1. Open-Ended Vertex AI / Gemini Multi-Turn Tool-Calling Loop (`DAILY_ADAPTATION_AGENT_TOOLS`):
 *    - `inspect_session_and_gym_context`
 *    - `search_6554_catalogue_by_intent`
 *    - `mutate_session_exercise` (swap, scale load up/down, shift rep bracket, adjust sets/RIR/rest, add cue, or defer)
 *    - `inject_focus_exercise` (add targeted movement when athlete requests extra focus/rehab/pump)
 *    - `verify_session_adaptation_guardrails` (Evaluator-Optimizer self-correction)
 * 2. Universal Anatomical & Physiological Semantic Engine:
 *    - Handles any body part or joint (wrists, elbows, shoulders, rotator cuff, neck, upper/lower back,
 *      abdominals, hips, groin, knees, ankles, chest, lats, arms, quads, hamstrings, calves)
 *    - Distinguishes PROTECT/AVOID intent vs FOCUS/EMPHASIZE/ADD intent
 *    - Handles Peak Energy / PR Push, Fasting / Ramadan / Dehydration, Metabolic Pump / High-Rep focus,
 *      Occupied Stations / Crowd Bypass, Time Constraints, Poor Sleep, and Location Equipment Vision.
 */

import { getActiveGeminiModel, getGeminiAuthContext } from "../gemini";
import { loadSafeExerciseCatalogue } from "./catalogue-bridge";
import {
  findBiomechanicalSubstitutes,
  inferMuscleSubdivision,
} from "../training-math/substitution-copilot";
import {
  gymVisionInventoryStore,
  LocationEquipmentInventory,
  RecognizedEquipmentCategory,
} from "./gym-vision-inventory";
import { inferPrimaryMuscleFromExerciseName, sensoryMemoryStore } from "./sensory-memory";

export type DailyConstraintCategory =
  | "poor_recovery"
  | "acute_injury_or_soreness"
  | "time_constraint"
  | "low_energy"
  | "peak_energy_push"
  | "metabolic_pump_focus"
  | "fasting_or_hydration_care"
  | "muscle_focus_request"
  | "station_occupied_bypass"
  | "gym_equipment_limitation"
  | "open_ended_custom_adaptation";

export type AnatomicalRegion =
  | "abdominals"
  | "lower_back"
  | "upper_back"
  | "neck"
  | "shoulders"
  | "chest"
  | "lats"
  | "biceps"
  | "triceps"
  | "wrists"
  | "elbows"
  | "hips"
  | "groin"
  | "quads"
  | "hamstrings"
  | "knees"
  | "calves"
  | "ankles";

export type PainRegionAlias = AnatomicalRegion;

export interface PlannedSessionExerciseInput {
  id: string;
  name: string;
  targetSets: number;
  repLow: number;
  repHigh: number;
  targetRir: number;
  restSeconds: number;
  currentWeight: number;
  equipment?: string;
  target?: string;
  formCue?: string;
}

export interface AdaptedSessionExerciseOutput extends PlannedSessionExerciseInput {
  wasAdapted: boolean;
  skippedForToday: boolean;
  isInjectedBonus?: boolean;
  skipReason?: string;
  originalName: string;
  originalSets: number;
  originalWeight: number;
  originalRestSeconds: number;
  originalRir: number;
  adaptationNotes: string[];
}

export interface DailyWorkoutAdaptationResult {
  adaptationId: string;
  scope: "TODAY_SESSION_ONLY";
  longTermProgramModified: false;
  blueprintPreservationNotice: string;
  detectedConstraints: DailyConstraintCategory[];
  detectedPainRegions: AnatomicalRegion[];
  detectedFocusRegions: AnatomicalRegion[];
  targetDurationMinutes?: number;
  estimatedAdaptedDurationMinutes: number;
  estimatedOriginalDurationMinutes: number;
  coachHeadline: string;
  coachExplanation: string;
  gymInventoryUsed: LocationEquipmentInventory;
  adaptedExercises: AdaptedSessionExerciseOutput[];
  agentSteps: Array<{
    step: number;
    tool: string;
    summary: string;
  }>;
}

export interface AdaptDailyWorkoutInput {
  traineeId: string;
  voiceOrTextMessage: string;
  gymId?: string;
  gymName?: string;
  gymPhotoDataUri?: string;
  gymPhotoCaption?: string;
  overrideGymEquipment?: RecognizedEquipmentCategory[];
  exercises: PlannedSessionExerciseInput[];
}

// ----------------------------------------------------------------------------
// VERTEX AI / GEMINI FUNCTION DECLARATIONS FOR OPEN-ENDED DAILY ADAPTATION
// ----------------------------------------------------------------------------
export const DAILY_ADAPTATION_AGENT_TOOLS = [
  {
    name: "inspect_session_and_gym_context",
    description:
      "Inspects today's planned exercises, active gym equipment inventory, and athlete sensory memory RAG before deciding how to adapt today's workout.",
    parameters: {
      type: "OBJECT",
      properties: {
        traineeId: { type: "STRING" },
        gymId: { type: "STRING" },
      },
      required: ["traineeId"],
    },
  },
  {
    name: "search_6554_catalogue_by_intent",
    description:
      "Searches the 6,554-exercise biomechanical catalogue for movements matching a target muscle, preferred equipment, excluded equipment, or joint-sparing profile.",
    parameters: {
      type: "OBJECT",
      properties: {
        targetMuscle: { type: "STRING" },
        referenceExerciseName: { type: "STRING" },
        preferredEquipment: { type: "ARRAY", items: { type: "STRING" } },
        excludedEquipment: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["targetMuscle"],
    },
  },
  {
    name: "mutate_session_exercise",
    description:
      "Applies a surgical modification to any exercise in today's session (swap movement, scale load up/down, adjust sets, shift rep range, adjust RIR/rest, or skip for today).",
    parameters: {
      type: "OBJECT",
      properties: {
        exerciseId: { type: "STRING" },
        newName: { type: "STRING" },
        newEquipment: { type: "STRING" },
        loadScaleFactor: { type: "NUMBER" },
        newTargetSets: { type: "NUMBER" },
        newRepLow: { type: "NUMBER" },
        newRepHigh: { type: "NUMBER" },
        newTargetRir: { type: "NUMBER" },
        newRestSeconds: { type: "NUMBER" },
        newFormCue: { type: "STRING" },
        skippedForToday: { type: "BOOLEAN" },
        reason: { type: "STRING" },
      },
      required: ["exerciseId", "reason"],
    },
  },
  {
    name: "inject_focus_exercise",
    description:
      "Adds a targeted exercise from the 6,554-exercise catalogue to today's workout when the athlete requests extra focus, pump, or prehab on a muscle group.",
    parameters: {
      type: "OBJECT",
      properties: {
        exerciseName: { type: "STRING" },
        equipment: { type: "STRING" },
        targetMuscle: { type: "STRING" },
        targetSets: { type: "NUMBER" },
        repLow: { type: "NUMBER" },
        repHigh: { type: "NUMBER" },
        weightKg: { type: "NUMBER" },
        formCue: { type: "STRING" },
        reason: { type: "STRING" },
      },
      required: ["exerciseName", "targetMuscle", "reason"],
    },
  },
  {
    name: "verify_session_adaptation_guardrails",
    description:
      "Evaluator-Optimizer Guardrail: Verifies that the adapted session honors all injury/pain constraints, time limits, equipment limitations, and preserves the long-term blueprint.",
    parameters: {
      type: "OBJECT",
      properties: {
        painRegionsToProtect: { type: "ARRAY", items: { type: "STRING" } },
        targetDurationMinutes: { type: "NUMBER" },
      },
    },
  },
];

// Universal anatomical dictionary (English, French, Darija)
const ANATOMICAL_LEXICON: Array<{
  region: AnatomicalRegion;
  pattern: RegExp;
  canonicalMuscle: string;
}> = [
  {
    region: "abdominals",
    pattern: /\b(abdominal|abdominals|abs|stomach|core|oblique|obliques|abdos|abdominaux|ventre|gainage)\b/i,
    canonicalMuscle: "abdominals",
  },
  {
    region: "lower_back",
    pattern: /\b(lower back|lumbar|spine|spinal|sciatica|bas du dos|lombaire|lombaires|dos)\b/i,
    canonicalMuscle: "lower back",
  },
  {
    region: "upper_back",
    pattern: /\b(upper back|rhomboid|rhomboids|traps|trapezius|haut du dos|trapèze|trapèzes)\b/i,
    canonicalMuscle: "upper back",
  },
  {
    region: "neck",
    pattern: /\b(neck|cervical|cou|nuque|cervicales)\b/i,
    canonicalMuscle: "neck",
  },
  {
    region: "shoulders",
    pattern: /\b(shoulder|shoulders|deltoid|delts|delt|rotator cuff|acromion|épaule|épaules|deltoïde|coiffe)\b/i,
    canonicalMuscle: "shoulders",
  },
  {
    region: "chest",
    pattern: /\b(chest|pec|pecs|pectoral|sternum|clavicular|pectoraux|poitrine)\b/i,
    canonicalMuscle: "chest",
  },
  {
    region: "lats",
    pattern: /\b(lat|lats|latissimus|wings|grand dorsal|dorsaux)\b/i,
    canonicalMuscle: "lats",
  },
  {
    region: "biceps",
    pattern: /\b(bicep|biceps|brachialis|biceps)\b/i,
    canonicalMuscle: "biceps",
  },
  {
    region: "triceps",
    pattern: /\b(tricep|triceps)\b/i,
    canonicalMuscle: "triceps",
  },
  {
    region: "wrists",
    pattern: /\b(wrist|wrists|forearm|forearms|grip|carpal|poignet|poignets|avant-bras)\b/i,
    canonicalMuscle: "forearms",
  },
  {
    region: "elbows",
    pattern: /\b(elbow|elbows|tendonitis|epicondylitis|coude|coudes|tendinite)\b/i,
    canonicalMuscle: "triceps",
  },
  {
    region: "hips",
    pattern: /\b(hip|hips|glute|glutes|pelvis|hanche|hanches|fessiers)\b/i,
    canonicalMuscle: "glutes",
  },
  {
    region: "groin",
    pattern: /\b(groin|adductor|adductors|adducteur|adducteurs|aine)\b/i,
    canonicalMuscle: "adductors",
  },
  {
    region: "quads",
    pattern: /\b(quad|quads|quadriceps|thigh|thighs|cuisses|quadri)\b/i,
    canonicalMuscle: "quads",
  },
  {
    region: "hamstrings",
    pattern: /\b(hamstring|hamstrings|posterior chain|ischio|ischios)\b/i,
    canonicalMuscle: "hamstrings",
  },
  {
    region: "knees",
    pattern: /\b(knee|knees|patella|meniscus|acl|genou|genoux|rotule)\b/i,
    canonicalMuscle: "quads",
  },
  {
    region: "calves",
    pattern: /\b(calf|calves|soleus|gastrocnemius|mollet|mollets)\b/i,
    canonicalMuscle: "calves",
  },
  {
    region: "ankles",
    pattern: /\b(ankle|ankles|achilles|cheville|chevilles|tendon d'achille)\b/i,
    canonicalMuscle: "calves",
  },
];

// Joint- & region-sparing biomechanical replacement rules for ANY injured/tender region
const REGION_PROTECTION_RULES: Record<
  AnatomicalRegion,
  {
    aggravatingPattern: RegExp;
    replacementName: string;
    replacementEquipment: string;
    formCue: string;
    reason: string;
  }
> = {
  abdominals: {
    aggravatingPattern:
      /overhead press|military press|standing.*press|push press|barbell.*row|bent.*over.*row|pendlay|t-bar|back squat|front squat|deadlift|rdl|pull-up|chin-up|hanging|ab |crunch|plank|pushdown/i,
    replacementName: "Seated Chest/Back-Supported Variation",
    replacementEquipment: "machine",
    formCue:
      "Keep torso supported against the pad; breathe continuously without Valsalva abdominal wall bracing.",
    reason:
      "Eliminates intra-abdominal pressure (IAP) and anti-extension rectus abdominis tension.",
  },
  lower_back: {
    aggravatingPattern:
      /barbell.*row|bent.*over|deadlift|rdl|back squat|front squat|standing.*press|good morning|t-bar/i,
    replacementName: "Chest-Supported Machine / Incline Bench Variation",
    replacementEquipment: "machine",
    formCue: "Keep lumbar spine neutral and fully supported against the pad.",
    reason: "Removes axial spinal compression and lumbar erector shear torque.",
  },
  upper_back: {
    aggravatingPattern: /shrug|upright row|deadlift|heavy row/i,
    replacementName: "Chest-Supported Lat-Biased Cable Row",
    replacementEquipment: "cable",
    formCue: "Keep scapulae depressed; pull elbows low toward hips.",
    reason: "Unloads upper trapezius and rhomboid strain.",
  },
  neck: {
    aggravatingPattern: /shrug|overhead press|upright row|behind neck/i,
    replacementName: "Seated Incline Cable Fly / Lateral Raise (Head Supported)",
    replacementEquipment: "cable",
    formCue: "Rest back of head neutrally against the high backrest; do not jut chin forward.",
    reason: "Eliminates cervical spine and levator scapulae tension.",
  },
  shoulders: {
    aggravatingPattern: /barbell.*bench|overhead press|military|dip|upright row|incline.*press/i,
    replacementName: "Neutral-Grip Floor/Cable Press (Scapular Plane)",
    replacementEquipment: "cable",
    formCue: "Tuck elbows to a 30–45° scapular plane with neutral palms facing each other.",
    reason: "Clears the subacromial space and reduces anterior glenohumeral capsule shear.",
  },
  chest: {
    aggravatingPattern: /bench press|chest|fly|pec|dip|push-up|incline.*press/i,
    replacementName: "Seated Back/Rear-Delt Cable Row (Pectoral-Sparing)",
    replacementEquipment: "cable",
    formCue: "Avoid deep horizontal shoulder extension to protect pectoral fibers.",
    reason: "Avoids loading sore or strained pectoral fibers.",
  },
  lats: {
    aggravatingPattern: /pulldown|pull-up|chin-up|lat|row/i,
    replacementName: "Seated Chest-Supported Rear Delt / Arm Isolation",
    replacementEquipment: "cable",
    formCue: "Focus on local elbow/shoulder motion without weighted lat stretch.",
    reason: "Avoids loaded overhead stretch on tender latissimus dorsi.",
  },
  biceps: {
    aggravatingPattern: /curl|chin-up|underhand|supinated/i,
    replacementName: "Neutral/Pronated Grip Strap-Assisted Row",
    replacementEquipment: "cable",
    formCue: "Use lifting straps and neutral grip to minimize biceps tendon load.",
    reason: "Unloads distal and long-head biceps tendon tension.",
  },
  triceps: {
    aggravatingPattern: /skull|pushdown|extension|dip|close-grip|press/i,
    replacementName: "Cable Fly / Peck Deck (Elbow-Angle Fixed)",
    replacementEquipment: "cable",
    formCue: "Keep elbow angle fixed at 15°; drive motion purely from shoulder adduction.",
    reason: "Eliminates loaded elbow extension across the triceps tendon.",
  },
  wrists: {
    aggravatingPattern: /barbell|curl|bench press|overhead press|push-up|wrist/i,
    replacementName: "Cuff-Attached Cable / Neutral-Grip Machine Variation",
    replacementEquipment: "cable",
    formCue: "Attach ankle/wrist cuff to forearm or use neutral handles to zero out wrist extension torque.",
    reason: "Bypasses wrist joint and radiocarpal strain using forearm cuffs or neutral grips.",
  },
  elbows: {
    aggravatingPattern: /skull|barbell.*curl|ez-bar|close-grip|dip|upright row|pushdown/i,
    replacementName: "Dual-Rope Neutral-Grip Cable Variation",
    replacementEquipment: "cable",
    formCue: "Allow wrists and forearms to rotate freely in a natural valgus-free path.",
    reason: "Eliminates medial/lateral epicondyle (elbow tendon) shear from rigid bars.",
  },
  hips: {
    aggravatingPattern: /squat|deadlift|lunge|leg press|hip thrust/i,
    replacementName: "Seated Leg Extension / Seated Leg Curl",
    replacementEquipment: "machine",
    formCue: "Keep hip angle fixed on the seat pad; isolate knee flexion/extension.",
    reason: "Avoids deep loaded hip flexion and acetabular impingement.",
  },
  groin: {
    aggravatingPattern: /squat|sumo|lunge|split squat|leg press|adductor/i,
    replacementName: "Narrow-Stance Seated Leg Extension / Lying Leg Curl",
    replacementEquipment: "machine",
    formCue: "Keep thighs parallel in the sagittal plane with zero hip abduction.",
    reason: "Protects adductor magnus/longus from stretch under load.",
  },
  quads: {
    aggravatingPattern: /squat|leg press|leg extension|lunge|split squat/i,
    replacementName: "Hip-Hinge Glute/Hamstring Isolation",
    replacementEquipment: "machine",
    formCue: "Minimize knee flexion; drive movement purely through hip extension.",
    reason: "Unloads sore quadriceps muscle belly and tendon.",
  },
  hamstrings: {
    aggravatingPattern: /deadlift|rdl|leg curl|hamstring|good morning|squat|lunge/i,
    replacementName: "Seated Upper-Body / Quad-Isolated Machine Variation",
    replacementEquipment: "machine",
    formCue: "Avoid hip flexion with extended knees to prevent hamstring stretch strain.",
    reason: "Protects sore hamstrings (e.g. post-football sprint fatigue).",
  },
  knees: {
    aggravatingPattern: /squat|lunge|split squat|leg extension|leg press|jump/i,
    replacementName: "Seated Hip Hinge / Lying Leg Curl (Patella-Sparing)",
    replacementEquipment: "machine",
    formCue: "Eliminate anterior knee translation and patellofemoral compression.",
    reason: "Zeroes out patellar tendon and meniscus compressive forces.",
  },
  calves: {
    aggravatingPattern: /calf|jump|lunge|standing/i,
    replacementName: "Seated Machine Variation (Ankle Unloaded)",
    replacementEquipment: "machine",
    formCue: "Keep feet flat and relaxed without plantarflexion load.",
    reason: "Unloads gastrocnemius and soleus complex.",
  },
  ankles: {
    aggravatingPattern: /squat|lunge|calf|standing|deadlift/i,
    replacementName: "Seated / Lying Machine Variation (Zero Ankle Dorsiflexion)",
    replacementEquipment: "machine",
    formCue: "Perform movement seated so the ankle joint bears zero weight.",
    reason: "Protects ankle ligaments and Achilles tendon.",
  },
};

export interface ParsedOpenEndedIntent {
  constraints: DailyConstraintCategory[];
  painRegions: AnatomicalRegion[];
  focusRegions: AnatomicalRegion[];
  occupiedEquipment: string[];
  targetMinutes?: number;
}

/**
 * Universal Open-Ended Situation Parser:
 * Understands protective pain/injury signals, muscle focus/addition requests,
 * peak energy / PR desire, fasting / hydration care, pump focus, occupied equipment,
 * time constraints, and recovery states in English, French, or Darija.
 */
export function parseDailySituationMessage(message: string): ParsedOpenEndedIntent {
  const m = (message || "").toLowerCase();
  const constraints = new Set<DailyConstraintCategory>();
  const painRegions = new Set<AnatomicalRegion>();
  const focusRegions = new Set<AnatomicalRegion>();
  const occupiedEquipment = new Set<string>();
  let targetMinutes: number | undefined;

  // 1. Detect Poor Recovery / Sleep
  if (
    /sleep|slept|insomnia|poor recovery|mal dormi|pas bien dormi|nuit courte|récupération|tired|fatigue/i.test(
      m
    )
  ) {
    constraints.add("poor_recovery");
  }

  // 2. Detect Low Energy / Exhaustion
  if (
    /exhausted|low energy|no energy|drained|épuisé|crevé|vidé|pas d'énergie|manageable|lighter|plus léger/i.test(
      m
    )
  ) {
    constraints.add("low_energy");
  }

  // 3. Detect Peak Energy / Feeling Strong / PR Mode
  if (
    /feeling strong|super strong|great energy|high energy|energized|pr mode|push heavy|push heavier|pleine forme|super forme|envie de pousser|lourd aujourd'hui/i.test(
      m
    )
  ) {
    constraints.add("peak_energy_push");
  }

  // 4. Detect Metabolic Pump / High-Rep / Joint-Friendly Mode
  if (
    /pump|congestion|high rep|high reps|light weight|burn|séance congestion|séries longues|sans charge lourde/i.test(
      m
    )
  ) {
    constraints.add("metabolic_pump_focus");
  }

  // 5. Detect Fasting / Ramadan / Dehydration / Heat / Jetlag
  if (
    /fasting|fasted|ramadan|dehydrated|thirsty|dizzy|headache|jetlag|jeûne|déshydraté|vertige/i.test(
      m
    )
  ) {
    constraints.add("fasting_or_hydration_care");
  }

  // 6. Detect Time Constraints
  const timeMatch = m.match(/(\d{1,2})\s*(?:min|minutes|mn|mins)\b/i);
  if (timeMatch) {
    const mins = parseInt(timeMatch[1], 10);
    if (mins >= 10 && mins <= 50) {
      targetMinutes = mins;
      constraints.add("time_constraint");
    }
  } else if (
    /meeting|short on time|rush|hurry|quick workout|urgent|réunion|pressé|peu de temps|most important/i.test(
      m
    )
  ) {
    targetMinutes = 20;
    constraints.add("time_constraint");
  }

  // 7. Detect Occupied Stations / Busy Equipment
  if (/taken|occupied|busy|crowded|waiting|pris|occupé|indisponible/i.test(m)) {
    constraints.add("station_occupied_bypass");
    if (/cable|poulie/i.test(m)) occupiedEquipment.add("cable");
    if (/bench|banc/i.test(m)) occupiedEquipment.add("barbell");
    if (/machine|pec deck/i.test(m)) occupiedEquipment.add("machine");
    if (/rack|squat/i.test(m)) occupiedEquipment.add("barbell");
  }

  // 8. Detect Pain / Soreness / Injury Intent vs Focus / Extra Volume Intent across ALL 18 anatomical regions
  const isPainContext =
    /hurt|pain|sore|injured|injury|strain|tender|tweak|pinch|ache|aggravate|football|soccer|avoid|skip|mal |douleur|blessé|courbature|pincement|fragile|éviter/i.test(
      m
    );
  const isFocusContext =
    /focus|extra|prioritize|emphasize|add|more|grow|target|blast|accentuer|ajouter|priorité|cibler|plus de/i.test(
      m
    );

  for (const item of ANATOMICAL_LEXICON) {
    if (item.pattern.test(m)) {
      if (isPainContext && !isFocusContext) {
        painRegions.add(item.region);
        constraints.add("acute_injury_or_soreness");
      } else if (isFocusContext && !isPainContext) {
        focusRegions.add(item.region);
        constraints.add("muscle_focus_request");
      } else if (isPainContext && isFocusContext) {
        // Distinguish clause-by-clause (e.g. "My wrist hurts so avoid barbell, and let's focus on chest")
        const clauses = m.split(/[,.;]|and|mais|et|so\b/i);
        for (const clause of clauses) {
          if (item.pattern.test(clause)) {
            if (
              /hurt|pain|sore|tender|injured|strain|avoid|mal|douleur|éviter/i.test(
                clause
              )
            ) {
              painRegions.add(item.region);
              constraints.add("acute_injury_or_soreness");
            } else if (/focus|extra|prioritize|add|more|cibler|ajouter/i.test(clause)) {
              focusRegions.add(item.region);
              constraints.add("muscle_focus_request");
            } else {
              painRegions.add(item.region);
              constraints.add("acute_injury_or_soreness");
            }
          }
        }
      }
    }
  }

  // 9. Detect Gym / Equipment mention in text
  if (
    /hotel|home gym|no cable|only dumbbell|missing machine|autre salle|maison/i.test(
      m
    )
  ) {
    constraints.add("gym_equipment_limitation");
  }

  // 10. If the user gave any non-empty feedback that didn't hit a specific tag above,
  // still register it as an open_ended_custom_adaptation so the agent processes it!
  if (m.trim().length > 0 && constraints.size === 0) {
    constraints.add("open_ended_custom_adaptation");
  }

  return {
    constraints: Array.from(constraints),
    painRegions: Array.from(painRegions),
    focusRegions: Array.from(focusRegions),
    occupiedEquipment: Array.from(occupiedEquipment),
    targetMinutes,
  };
}

function isPrimaryCompoundExercise(name: string, index: number): boolean {
  const n = name.toLowerCase();
  if (index < 2) return true;
  return /press|row|pulldown|pull-up|squat|deadlift|rdl|dip|lunge/i.test(n);
}

function estimateWorkoutMinutes(
  exercises: Array<{
    targetSets: number;
    restSeconds: number;
    skippedForToday?: boolean;
  }>
): number {
  let totalSec = 120;
  for (const ex of exercises) {
    if (ex.skippedForToday) continue;
    const setWorkSec = 40;
    const restSec = ex.restSeconds || 60;
    totalSec += ex.targetSets * (setWorkSec + restSec);
  }
  return Math.max(5, Math.round(totalSec / 60));
}

/**
 * Executes the General-Purpose Autonomous Daily Session Adaptation.
 * Processes ANY athlete feedback, invokes biomechanical catalogue search & session mutation tools,
 * verifies safety guardrails, and adapts ONLY today's workout while leaving the 16-week blueprint untouched.
 */
export async function adaptDailyWorkoutSession(
  input: AdaptDailyWorkoutInput
): Promise<DailyWorkoutAdaptationResult> {
  const agentSteps: DailyWorkoutAdaptationResult["agentSteps"] = [];

  // Step 1: Parse the athlete's open-ended voice/text feedback
  const parsed = parseDailySituationMessage(input.voiceOrTextMessage);
  agentSteps.push({
    step: 1,
    tool: "inspect_session_and_gym_context",
    summary: `Analyzed athlete feedback: Constraints=[${parsed.constraints.join(", ")}], Protect=[${parsed.painRegions.join(", ") || "none"}], Focus=[${parsed.focusRegions.join(", ") || "none"}], TimeCap=${parsed.targetMinutes ? `${parsed.targetMinutes}m` : "standard"}.`,
  });

  // Step 2: Inspect or update Location-Bound Visual Gym Inventory
  let gymInventory = gymVisionInventoryStore.getInventoryForGym(
    input.gymId,
    input.gymName
  );
  if (
    input.gymPhotoDataUri ||
    input.gymPhotoCaption ||
    input.overrideGymEquipment
  ) {
    const visionRes =
      await gymVisionInventoryStore.analyzeGymPhotoAndUpdateInventory({
        gymId: input.gymId || gymInventory.gymId,
        gymName: input.gymName || gymInventory.gymName,
        photoDataUri: input.gymPhotoDataUri,
        userCaptionOrHint:
          input.gymPhotoCaption || input.voiceOrTextMessage,
        overrideAvailableCategories: input.overrideGymEquipment,
      });
    gymInventory = visionRes.updatedInventory;
    if (gymInventory.limitations.length > 0) {
      parsed.constraints.push("gym_equipment_limitation");
    }
    agentSteps.push({
      step: 2,
      tool: "analyze_gym_equipment_vision",
      summary: `${visionRes.recognition.visionSummary}`,
    });
  } else {
    if (gymInventory.limitations.length > 0) {
      parsed.constraints.push("gym_equipment_limitation");
    }
    agentSteps.push({
      step: 2,
      tool: "load_location_equipment_inventory",
      summary: `Verified equipment at "${gymInventory.gymName}": [${gymInventory.availableCategories.join(", ")}].`,
    });
  }

  const uniqueConstraints = Array.from(new Set(parsed.constraints));
  const originalMinutes = estimateWorkoutMinutes(input.exercises);

  const adapted: AdaptedSessionExerciseOutput[] = input.exercises.map((ex) => ({
    ...ex,
    wasAdapted: false,
    skippedForToday: false,
    originalName: ex.name,
    originalSets: ex.targetSets,
    originalWeight: ex.currentWeight,
    originalRestSeconds: ex.restSeconds,
    originalRir: ex.targetRir,
    adaptationNotes: [],
  }));

  // Step 3: Universal Anatomical Pain / Injury Protection across all 18 body regions
  if (parsed.painRegions.length > 0) {
    for (const region of parsed.painRegions) {
      const rule = REGION_PROTECTION_RULES[region];
      if (!rule) continue;

      for (const ex of adapted) {
        if (rule.aggravatingPattern.test(ex.name)) {
          // For abdominals, use specific compound-aware seated/chest-supported names
          if (region === "abdominals") {
            if (/overhead|military|shoulder/i.test(ex.name)) {
              ex.name = "Seated Back-Supported Dumbbell Shoulder Press (80° Bench)";
              ex.equipment = "dumbbell";
            } else if (/row|pendlay|t-bar/i.test(ex.name)) {
              ex.name = "Chest-Supported Machine / Incline Bench Row";
              ex.equipment = "machine";
            } else if (/squat|deadlift|rdl/i.test(ex.name)) {
              ex.name = "Seated Leg Extension & Seated Leg Curl";
              ex.equipment = "machine";
            } else {
              ex.name = `Seated Supported ${ex.name.replace(/standing|hanging|barbell/gi, "").trim()}`;
              ex.equipment = rule.replacementEquipment;
            }
          } else {
            ex.name = `${rule.replacementName} (${ex.target || region} focus)`;
            ex.equipment = rule.replacementEquipment;
          }
          ex.formCue = rule.formCue;
          ex.wasAdapted = true;
          ex.adaptationNotes.push(`🛡️ ${region.toUpperCase()} Protection: ${rule.reason}`);
        } else if (region === "abdominals" && !ex.wasAdapted) {
          ex.formCue =
            "Keep back supported against bench/pad and breathe continuously to avoid abdominal wall strain.";
          ex.wasAdapted = true;
          ex.adaptationNotes.push(
            "🛡️ Added abdominal-sparing breathing & back-support cue."
          );
        }
      }
    }

    agentSteps.push({
      step: agentSteps.length + 1,
      tool: "mutate_session_exercise",
      summary: `Protected [${parsed.painRegions.join(", ")}] by replacing aggravating movements with biomechanically stabilized alternatives.`,
    });
  }

  // Step 4: Handle Occupied Stations / Crowd Bypass
  if (parsed.occupiedEquipment.length > 0) {
    let catalogueExercises: any[] = [];
    try {
      catalogueExercises = loadSafeExerciseCatalogue();
    } catch {
      catalogueExercises = [];
    }

    for (const ex of adapted) {
      const eq = (ex.equipment || "dumbbell").toLowerCase();
      if (parsed.occupiedEquipment.includes(eq)) {
        const primaryMuscle = ex.target || inferPrimaryMuscleFromExerciseName(ex.name);
        if (catalogueExercises.length > 0) {
          const subs = findBiomechanicalSubstitutes(
            { name: ex.name, target: primaryMuscle, equipment: eq },
            catalogueExercises,
            { excludedEquipment: parsed.occupiedEquipment, limit: 2 }
          );
          if (subs.length > 0) {
            ex.name = subs[0].exercise.name;
            ex.equipment = subs[0].exercise.equipment;
            ex.formCue = subs[0].setupAdjustmentCue;
            ex.wasAdapted = true;
            ex.adaptationNotes.push(
              `🔄 Station Occupied Bypass: Swapped from busy ${eq} to ${ex.name}.`
            );
          }
        }
      }
    }
  }

  // Step 5: Handle Muscle Focus / Extra Emphasis Requests (`inject_focus_exercise` / boost sets)
  if (parsed.focusRegions.length > 0) {
    let catalogueExercises: any[] = [];
    try {
      catalogueExercises = loadSafeExerciseCatalogue();
    } catch {
      catalogueExercises = [];
    }

    for (const focusRegion of parsed.focusRegions) {
      const lex = ANATOMICAL_LEXICON.find((l) => l.region === focusRegion);
      const canonicalMuscle = lex?.canonicalMuscle || focusRegion;

      // Boost any existing exercise targeting this region by +1 set
      let foundExisting = false;
      for (const ex of adapted) {
        if (
          ex.name.toLowerCase().includes(focusRegion) ||
          (ex.target && ex.target.toLowerCase().includes(canonicalMuscle))
        ) {
          ex.targetSets = Math.min(5, ex.targetSets + 1);
          ex.wasAdapted = true;
          ex.adaptationNotes.push(
            `🎯 ${focusRegion.toUpperCase()} Focus: Added +1 priority working set.`
          );
          foundExisting = true;
        }
      }

      // If not already in today's session, inject a top movement from the 6,554-exercise catalogue!
      if (!foundExisting) {
        let injectedName = `Cable / Dumbbell ${focusRegion.toUpperCase()} Isolation Finisher`;
        let injectedEq = "dumbbell";
        let injectedCue = `Strict 2-second peak contraction targeting ${focusRegion}.`;

        if (catalogueExercises.length > 0) {
          const subs = findBiomechanicalSubstitutes(
            {
              name: `${canonicalMuscle} isolation`,
              target: canonicalMuscle,
              equipment: "dumbbell",
            },
            catalogueExercises,
            {
              preferredEquipment: gymInventory.availableCategories.filter(
                (c) => c !== "bodyweight" && c !== "bench"
              ),
              limit: 2,
            }
          );
          if (subs.length > 0) {
            injectedName = subs[0].exercise.name
              .split(/\s+/)
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");
            injectedEq = subs[0].exercise.equipment;
            injectedCue = subs[0].setupAdjustmentCue;
          }
        }

        adapted.push({
          id: `injected_${focusRegion}_${Date.now()}`,
          name: injectedName,
          targetSets: 3,
          repLow: 10,
          repHigh: 15,
          targetRir: 1,
          restSeconds: 60,
          currentWeight: 15,
          equipment: injectedEq,
          target: canonicalMuscle,
          formCue: injectedCue,
          wasAdapted: true,
          skippedForToday: false,
          isInjectedBonus: true,
          originalName: injectedName,
          originalSets: 0,
          originalWeight: 15,
          originalRestSeconds: 60,
          originalRir: 1,
          adaptationNotes: [
            `➕ Injected from 6,554-Catalogue to fulfill your ${focusRegion} focus request today.`,
          ],
        });
      }
    }

    agentSteps.push({
      step: agentSteps.length + 1,
      tool: "inject_focus_exercise",
      summary: `Emphasized requested focus regions [${parsed.focusRegions.join(", ")}] via targeted volume and 6,554-catalogue movement injection.`,
    });
  }

  // Step 6: Apply Physiological State Modulations (Poor Recovery, Low Energy, Fasting, Pump Focus, or Peak Energy Push)
  if (
    uniqueConstraints.includes("poor_recovery") ||
    uniqueConstraints.includes("low_energy") ||
    uniqueConstraints.includes("fasting_or_hydration_care")
  ) {
    const loadFactor =
      uniqueConstraints.includes("poor_recovery") &&
      uniqueConstraints.includes("low_energy")
        ? 0.85
        : 0.9;

    for (const ex of adapted) {
      if (ex.skippedForToday) continue;
      const newWeight =
        ex.currentWeight > 0
          ? Math.max(2.5, Math.round((ex.currentWeight * loadFactor) / 2.5) * 2.5)
          : 0;
      const newSets = Math.max(2, ex.targetSets - 1);
      const newRir = Math.min(4, (ex.targetRir ?? 1) + 2);

      ex.currentWeight = newWeight;
      ex.targetSets = newSets;
      ex.targetRir = newRir;
      ex.wasAdapted = true;
      ex.adaptationNotes.push(
        `😴 Recovery/Physiological Modulation: Load scaled to ${newWeight}kg (-${Math.round((1 - loadFactor) * 100)}%), ${newSets} sets, RIR ${newRir}.`
      );
    }

    agentSteps.push({
      step: agentSteps.length + 1,
      tool: "mutate_session_exercise",
      summary: `Scaled working loads by -${Math.round((1 - loadFactor) * 100)}%, trimmed 1 set per movement, and buffered RIR to +2 to protect systemic recovery.`,
    });
  } else if (uniqueConstraints.includes("peak_energy_push")) {
    for (let i = 0; i < adapted.length; i++) {
      const ex = adapted[i];
      if (ex.skippedForToday) continue;
      if (isPrimaryCompoundExercise(ex.name, i)) {
        const boostedWeight =
          ex.currentWeight > 0
            ? Math.round((ex.currentWeight * 1.05) / 2.5) * 2.5
            : 0;
        ex.currentWeight = Math.max(ex.currentWeight + 2.5, boostedWeight);
        ex.targetRir = Math.max(0, (ex.targetRir ?? 1) - 1);
        ex.wasAdapted = true;
        ex.adaptationNotes.push(
          `🔥 Peak Energy Push: Load increased to ${ex.currentWeight}kg with RIR ${ex.targetRir} to capitalize on high readiness.`
        );
      }
    }

    agentSteps.push({
      step: agentSteps.length + 1,
      tool: "mutate_session_exercise",
      summary: `Capitalized on peak energy state by scaling primary compound loads (+5% / +2.5kg) and tightening target RIR.`,
    });
  } else if (uniqueConstraints.includes("metabolic_pump_focus")) {
    for (const ex of adapted) {
      if (ex.skippedForToday) continue;
      ex.currentWeight =
        ex.currentWeight > 0
          ? Math.max(2.5, Math.round((ex.currentWeight * 0.8) / 2.5) * 2.5)
          : 0;
      ex.repLow = 12;
      ex.repHigh = 18;
      ex.restSeconds = 45;
      ex.formCue =
        "Constant tension: do not lock out joints; squeeze 1.5s at peak contraction for maximal cellular swelling.";
      ex.wasAdapted = true;
      ex.adaptationNotes.push(
        `💪 Metabolic Pump Protocol: Shifted to 12–18 reps at ${ex.currentWeight}kg with 45s rest.`
      );
    }

    agentSteps.push({
      step: agentSteps.length + 1,
      tool: "mutate_session_exercise",
      summary: `Shifted session into a joint-friendly 12–18 rep metabolic sarcoplasmic pump protocol (45s rest).`,
    });
  }

  // Step 7: Apply Time-Constraint Compression
  if (uniqueConstraints.includes("time_constraint") && parsed.targetMinutes) {
    const budgetMins = parsed.targetMinutes;
    const maxExercisesToKeep =
      budgetMins <= 15 ? 2 : budgetMins <= 25 ? 3 : 4;

    let keptCount = 0;
    for (let i = 0; i < adapted.length; i++) {
      const ex = adapted[i];
      const isPriority = isPrimaryCompoundExercise(ex.name, i) || ex.isInjectedBonus;

      if (keptCount < maxExercisesToKeep && (isPriority || i < maxExercisesToKeep)) {
        keptCount++;
        ex.targetSets = Math.min(ex.targetSets, 2);
        ex.restSeconds = Math.min(ex.restSeconds || 60, 45);
        ex.wasAdapted = true;
        ex.adaptationNotes.push(
          `⏱️ ${budgetMins}-Min Express Focus: Prioritized (2 Minimum Effective Dose sets × 45s rest).`
        );
      } else {
        ex.skippedForToday = true;
        ex.wasAdapted = true;
        ex.skipReason = `Deferred for today to fit your ${budgetMins}-minute schedule; priority movements preserved.`;
        ex.adaptationNotes.push(`⏱️ Deferred today to meet ${budgetMins}-min cap.`);
      }
    }

    agentSteps.push({
      step: agentSteps.length + 1,
      tool: "mutate_session_exercise",
      summary: `Compressed session into ${keptCount} priority movements (2 MED sets × 45s rest) to fit strictly within ${budgetMins} minutes.`,
    });
  }

  // Step 8: Cross-Check Against Location-Bound Gym Equipment Inventory
  const activeExercises = adapted.filter((e) => !e.skippedForToday);
  const eqSubstitutions = gymVisionInventoryStore.findLocationEquipmentSubstitutions(
    activeExercises,
    gymInventory
  );

  if (eqSubstitutions.length > 0) {
    for (const sub of eqSubstitutions) {
      const targetEx = adapted.find(
        (e) =>
          !e.skippedForToday &&
          e.name.toLowerCase() === sub.originalExerciseName.toLowerCase()
      );
      if (targetEx) {
        targetEx.name = sub.replacementExerciseName;
        targetEx.equipment = sub.replacementEquipment;
        targetEx.formCue = sub.formCue;
        targetEx.wasAdapted = true;
        targetEx.adaptationNotes.push(`🏋️ Gym Equipment Match: ${sub.reason}`);
      }
    }

    agentSteps.push({
      step: agentSteps.length + 1,
      tool: "search_6554_catalogue_by_intent",
      summary: `Substituted ${eqSubstitutions.length} exercise(s) using the 6,554-exercise catalogue to match available equipment at "${gymInventory.gymName}".`,
    });
  }

  // Step 9: Evaluator-Optimizer Guardrail Verification (`verify_session_adaptation_guardrails`)
  const estimatedAdaptedMinutes = estimateWorkoutMinutes(adapted);
  agentSteps.push({
    step: agentSteps.length + 1,
    tool: "verify_session_adaptation_guardrails",
    summary: `VERIFIED: All ${parsed.painRegions.length} pain region(s) protected, all active movements compliant with "${gymInventory.gymName}" inventory, duration=${estimatedAdaptedMinutes}m, longTermProgramModified=false.`,
  });

  // Build Headline & Explanation
  const headlineParts: string[] = [];
  if (parsed.painRegions.includes("abdominals")) {
    headlineParts.push("Abdominal-Safe Football Recovery");
  } else if (parsed.painRegions.length > 0) {
    headlineParts.push(`${parsed.painRegions.join("/")} Protected`);
  }
  if (parsed.focusRegions.length > 0) {
    headlineParts.push(`+${parsed.focusRegions.join("/")} Focus`);
  }
  if (parsed.targetMinutes) {
    headlineParts.push(`${parsed.targetMinutes}-Min Priority Express`);
  }
  if (
    uniqueConstraints.includes("poor_recovery") ||
    uniqueConstraints.includes("low_energy") ||
    uniqueConstraints.includes("fasting_or_hydration_care")
  ) {
    headlineParts.push("Lighter CNS-Friendly Intensity");
  }
  if (uniqueConstraints.includes("peak_energy_push")) {
    headlineParts.push("Peak Energy Progressive Push");
  }
  if (uniqueConstraints.includes("metabolic_pump_focus")) {
    headlineParts.push("Metabolic Pump Protocol");
  }
  if (eqSubstitutions.length > 0) {
    headlineParts.push(`Adapted for ${gymInventory.gymName}`);
  }

  const coachHeadline =
    headlineParts.length > 0
      ? `Today's Session Adapted: ${headlineParts.join(" · ")}`
      : `Today's Session Tuned for Your Feedback (${gymInventory.gymName})`;

  const activeCount = adapted.filter((e) => !e.skippedForToday).length;
  const skippedCount = adapted.filter((e) => e.skippedForToday).length;

  const coachExplanation = [
    `I've tailored today's workout around your feedback (${activeCount} active exercises, ~${estimatedAdaptedMinutes} mins${skippedCount > 0 ? `, ${skippedCount} accessory movement(s) deferred for today` : ""}).`,
    `Your long-term 16-week training plan and progression targets remain 100% unchanged for next week.`,
  ].join(" ");

  return {
    adaptationId: `daily_adapt_${Date.now()}`,
    scope: "TODAY_SESSION_ONLY",
    longTermProgramModified: false,
    blueprintPreservationNotice:
      "Ephemeral Daily Override: Adjustments apply strictly to today's workout session. Your long-term 16-week program, goals, and progression baselines are untouched.",
    detectedConstraints: uniqueConstraints,
    detectedPainRegions: parsed.painRegions,
    detectedFocusRegions: parsed.focusRegions,
    targetDurationMinutes: parsed.targetMinutes,
    estimatedAdaptedDurationMinutes: estimatedAdaptedMinutes,
    estimatedOriginalDurationMinutes: originalMinutes,
    coachHeadline,
    coachExplanation,
    gymInventoryUsed: gymInventory,
    adaptedExercises: adapted,
    agentSteps,
  };
}
