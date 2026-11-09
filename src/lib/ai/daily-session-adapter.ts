/**
 * Real-Time Ephemeral Daily Workout Adaptation Engine
 * 
 * Allows the athlete to dynamically adapt TODAY'S workout session via voice message,
 * text prompt, or gym equipment photo without modifying their long-term 16-week
 * training program, goals, or progression baselines.
 * 
 * Supported Real-Life Scenarios (Combinable):
 * 1. Poor Recovery: "I didn't sleep well last night, so let's make today's workout lighter."
 * 2. Acute Soreness / Injury: "I hurt my abdominals playing football yesterday, avoid exercises that could aggravate the pain."
 * 3. Time Constraints: "I have an unexpected meeting, so I only have 20 minutes today. Let's focus on the most important exercises."
 * 4. Low Energy: "I'm feeling exhausted today. Let's adjust the intensity and keep things manageable."
 * 5. Gym & Equipment Recognition: Adapts to the equipment visually recognized at the active workout location.
 */

import {
  gymVisionInventoryStore,
  LocationEquipmentInventory,
  RecognizedEquipmentCategory,
} from "./gym-vision-inventory";

export type DailyConstraintCategory =
  | "poor_recovery"
  | "acute_injury_or_soreness"
  | "time_constraint"
  | "low_energy"
  | "gym_equipment_limitation";

export type AnatomicalPainRegion =
  | "abdominals"
  | "lower_back"
  | "hamstrings"
  | "knees"
  | "shoulders"
  | "groin"
  | "elbows"
  | "wrists";

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
  detectedPainRegions: AnatomicalPainRegion[];
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

// Replacements for exercises that aggravate abdominal / core strain (e.g. from football)
const ABDOMINAL_SAFE_REPLACEMENTS: Array<{
  pattern: RegExp;
  replacementName: string;
  replacementEquipment: string;
  formCue: string;
  reason: string;
}> = [
  {
    pattern: /overhead press|military press|standing.*press|push press/i,
    replacementName: "Seated Back-Supported Dumbbell Shoulder Press (80° Bench)",
    replacementEquipment: "dumbbell",
    formCue: "Keep thoracic spine and lower back glued to the 80° pad; exhale smoothly without abdominal bracing.",
    reason: "Standing overhead pressing demands high anti-extension abdominal wall tension. Switched to a seated back-supported press to zero out abdominal strain.",
  },
  {
    pattern: /barbell.*row|bent.*over.*row|pendlay|t-bar row|standing.*row/i,
    replacementName: "Chest-Supported Machine / Incline Bench Row",
    replacementEquipment: "machine",
    formCue: "Rest chest fully on the pad so your torso and abdominal wall remain completely unloaded.",
    reason: "Hinged rows require heavy isometric core and abdominal stabilization. Replaced with a chest-supported row to isolate the back safely.",
  },
  {
    pattern: /back squat|front squat|deadlift|rdl|romanian deadlift/i,
    replacementName: "Seated Leg Extension & Seated Leg Curl Superset",
    replacementEquipment: "machine",
    formCue: "Remain seated against the backrest; avoid Valsalva breath-holding.",
    reason: "Heavy axial squats and deadlifts require intense intra-abdominal pressure (IAP). Swapped to seated machine isolation to protect sore abdominals.",
  },
  {
    pattern: /pull-up|chin-up|hanging|ab |crunch|plank|sit-up|core|woodchop|pushdown|tricep pushdown/i,
    replacementName: "Seated Overhead Rope / Dumbbell Extension (Back Supported)",
    replacementEquipment: "dumbbell",
    formCue: "Sit upright against bench support to avoid anterior core tension.",
    reason: "Hanging, direct abdominal work, and standing cable pushdowns recruit the rectus abdominis for ribcage stabilization. Replaced with a seated supported variation.",
  },
];

const LOWER_BODY_FOOTBALL_SAFE_REPLACEMENTS: Array<{
  pattern: RegExp;
  replacementName: string;
  replacementEquipment: string;
  formCue: string;
  reason: string;
}> = [
  {
    pattern: /squat|lunge|split squat|leg press|deadlift|rdl/i,
    replacementName: "Seated Upper-Body / Machine Chest-Supported Focus",
    replacementEquipment: "machine",
    formCue: "Keep lower body completely rested today following yesterday's football match.",
    reason: "Lower-body compound loading removed for today to prevent hamstring/groin/knee strain after football.",
  },
];

/**
 * Parses a natural-language voice or text check-in (English, French, or Darija)
 * into structured daily constraints.
 */
export function parseDailySituationMessage(message: string): {
  constraints: DailyConstraintCategory[];
  painRegions: AnatomicalPainRegion[];
  targetMinutes?: number;
} {
  const m = (message || "").toLowerCase();
  const constraints = new Set<DailyConstraintCategory>();
  const painRegions = new Set<AnatomicalPainRegion>();
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

  // 3. Detect Time Constraints (e.g. "only have 20 minutes", "30 min", "unexpected meeting")
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

  // 4. Detect Acute Soreness / Injury (e.g. "hurt my abdominals playing football")
  if (
    /hurt|pain|sore|injured|injury|strain|aggravate|football|soccer|foot|mal aux|douleur|blessé|courbature/i.test(
      m
    )
  ) {
    constraints.add("acute_injury_or_soreness");
  }

  if (/abdominal|abs|stomach|core|oblique|abdos|abdominaux|ventre/i.test(m)) {
    painRegions.add("abdominals");
    constraints.add("acute_injury_or_soreness");
  }
  if (/lower back|lumbar|back hurt|bas du dos|lombaire/i.test(m)) {
    painRegions.add("lower_back");
    constraints.add("acute_injury_or_soreness");
  }
  if (/hamstring|ischio|cuisse/i.test(m)) {
    painRegions.add("hamstrings");
    constraints.add("acute_injury_or_soreness");
  }
  if (/knee|genou|meniscus|patella/i.test(m)) {
    painRegions.add("knees");
    constraints.add("acute_injury_or_soreness");
  }
  if (/shoulder|rotator|épaule|coiffe/i.test(m)) {
    painRegions.add("shoulders");
    constraints.add("acute_injury_or_soreness");
  }
  if (/groin|adductor|adducteur/i.test(m)) {
    painRegions.add("groin");
    constraints.add("acute_injury_or_soreness");
  }
  if (/elbow|coude/i.test(m)) {
    painRegions.add("elbows");
    constraints.add("acute_injury_or_soreness");
  }

  // 5. Detect Gym / Equipment mention in text
  if (
    /hotel|home gym|no cable|only dumbbell|missing machine|autre salle|maison/i.test(
      m
    )
  ) {
    constraints.add("gym_equipment_limitation");
  }

  return {
    constraints: Array.from(constraints),
    painRegions: Array.from(painRegions),
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
  let totalSec = 120; // 2 min transition overhead
  for (const ex of exercises) {
    if (ex.skippedForToday) continue;
    const setWorkSec = 40;
    const restSec = ex.restSeconds || 60;
    totalSec += ex.targetSets * (setWorkSec + restSec);
  }
  return Math.max(5, Math.round(totalSec / 60));
}

/**
 * Executes the Real-Time Ephemeral Daily Session Adaptation.
 * Adjusts ONLY today's workout while leaving the long-term 16-week blueprint untouched.
 */
export async function adaptDailyWorkoutSession(
  input: AdaptDailyWorkoutInput
): Promise<DailyWorkoutAdaptationResult> {
  const agentSteps: DailyWorkoutAdaptationResult["agentSteps"] = [];

  // Step 1: Parse the athlete's voice/text situation check-in
  const parsed = parseDailySituationMessage(input.voiceOrTextMessage);
  agentSteps.push({
    step: 1,
    tool: "parse_daily_situation_checkin",
    summary: `Detected constraints: [${parsed.constraints.join(", ") || "general_check_in"}], Pain regions: [${parsed.painRegions.join(", ") || "none"}], Time cap: ${parsed.targetMinutes ? `${parsed.targetMinutes}m` : "none"}.`,
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
      summary: `Loaded equipment profile for "${gymInventory.gymName}": [${gymInventory.availableCategories.join(", ")}].`,
    });
  }

  const uniqueConstraints = Array.from(new Set(parsed.constraints));
  const originalMinutes = estimateWorkoutMinutes(input.exercises);

  // Clone exercises for ephemeral today-only transformation
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

  // Step 3: Apply Acute Injury / Soreness Protection (e.g. Abdominals from Football)
  if (parsed.painRegions.length > 0) {
    for (const ex of adapted) {
      if (parsed.painRegions.includes("abdominals")) {
        for (const rule of ABDOMINAL_SAFE_REPLACEMENTS) {
          if (rule.pattern.test(ex.name)) {
            ex.name = rule.replacementName;
            ex.equipment = rule.replacementEquipment;
            ex.formCue = rule.formCue;
            ex.wasAdapted = true;
            ex.adaptationNotes.push(`⚽ Abdominal Protection: ${rule.reason}`);
            break;
          }
        }
        // Even for seated/supported exercises, add anti-Valsalva breathing cue
        if (!ex.wasAdapted) {
          ex.formCue =
            "Keep back supported against bench/pad and breathe continuously to avoid abdominal wall strain.";
          ex.wasAdapted = true;
          ex.adaptationNotes.push(
            "⚽ Added abdominal-sparing breathing & back-support cue."
          );
        }
      }

      if (
        parsed.painRegions.includes("hamstrings") ||
        parsed.painRegions.includes("knees") ||
        parsed.painRegions.includes("groin")
      ) {
        for (const rule of LOWER_BODY_FOOTBALL_SAFE_REPLACEMENTS) {
          if (rule.pattern.test(ex.name)) {
            ex.name = rule.replacementName;
            ex.equipment = rule.replacementEquipment;
            ex.formCue = rule.formCue;
            ex.wasAdapted = true;
            ex.adaptationNotes.push(`⚽ Lower-Body Protection: ${rule.reason}`);
            break;
          }
        }
      }

      if (parsed.painRegions.includes("lower_back")) {
        if (/barbell|deadlift|squat|bent|standing/i.test(ex.name)) {
          ex.name = `Chest-Supported / Seated ${ex.name.replace(/barbell|standing|bent-over/gi, "").trim()}`;
          ex.equipment = "machine";
          ex.formCue = "Keep spine unloaded against chest or back pad.";
          ex.wasAdapted = true;
          ex.adaptationNotes.push(
            "🛡️ Lumbar Protection: Swapped to externally supported variation."
          );
        }
      }
    }

    agentSteps.push({
      step: agentSteps.length + 1,
      tool: "apply_injury_protection_filter",
      summary: `Protected [${parsed.painRegions.join(", ")}] by replacing high-bracing/aggravating movements with externally stabilized variations.`,
    });
  }

  // Step 4: Apply Poor Recovery & Low Energy Intensity/Volume Modulation
  if (
    uniqueConstraints.includes("poor_recovery") ||
    uniqueConstraints.includes("low_energy")
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
        `😴 Recovery/Energy Modulation: Load adjusted to ${newWeight}kg (-${Math.round((1 - loadFactor) * 100)}%), ${newSets} sets, RIR ${newRir} (zero failure sets today).`
      );
    }

    agentSteps.push({
      step: agentSteps.length + 1,
      tool: "modulate_session_intensity_and_volume",
      summary: `Scaled working loads by -${Math.round((1 - loadFactor) * 100)}%, trimmed 1 set per movement, and buffered RIR to +2 to prevent CNS overreaching.`,
    });
  }

  // Step 5: Apply Time-Constraint Compression (e.g. "Only 20 minutes today — focus on most important exercises")
  if (uniqueConstraints.includes("time_constraint") && parsed.targetMinutes) {
    const budgetMins = parsed.targetMinutes;
    // Keep at most 2 exercises for <=15m, 3 exercises for <=25m, 4 exercises for <=35m
    const maxExercisesToKeep =
      budgetMins <= 15 ? 2 : budgetMins <= 25 ? 3 : 4;

    let keptCount = 0;
    for (let i = 0; i < adapted.length; i++) {
      const ex = adapted[i];
      const isPriority = isPrimaryCompoundExercise(ex.name, i);

      if (keptCount < maxExercisesToKeep && (isPriority || i < maxExercisesToKeep)) {
        keptCount++;
        ex.targetSets = Math.min(ex.targetSets, 2); // 2 high-efficiency Minimum Effective Dose sets
        ex.restSeconds = Math.min(ex.restSeconds || 60, 45); // 45s dense rest
        ex.wasAdapted = true;
        ex.adaptationNotes.push(
          `⏱️ ${budgetMins}-Min Express Focus: Prioritized as a core compound movement (2 MED sets × 45s rest).`
        );
      } else {
        ex.skippedForToday = true;
        ex.wasAdapted = true;
        ex.skipReason = `Deferred for today to fit your ${budgetMins}-minute schedule; priority compounds preserved.`;
        ex.adaptationNotes.push(`⏱️ Deferred today to meet ${budgetMins}-min cap.`);
      }
    }

    agentSteps.push({
      step: agentSteps.length + 1,
      tool: "compress_workout_for_time_budget",
      summary: `Compressed session into ${keptCount} priority compound exercises (2 Minimum Effective Dose sets × 45s rest) to fit strictly within ${budgetMins} minutes.`,
    });
  }

  // Step 6: Cross-Check Against Location-Bound Gym Equipment Inventory
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
      tool: "substitute_unavailable_gym_equipment",
      summary: `Adapted ${eqSubstitutions.length} exercise(s) to match available equipment at "${gymInventory.gymName}".`,
    });
  }

  const estimatedAdaptedMinutes = estimateWorkoutMinutes(adapted);

  // Build Personal Trainer Headline & Coaching Explanation
  const headlineParts: string[] = [];
  if (parsed.painRegions.includes("abdominals")) {
    headlineParts.push("Abdominal-Safe Football Recovery");
  } else if (parsed.painRegions.length > 0) {
    headlineParts.push(`${parsed.painRegions.join("/")} Pain-Protected`);
  }
  if (parsed.targetMinutes) {
    headlineParts.push(`${parsed.targetMinutes}-Min Priority Express`);
  }
  if (
    uniqueConstraints.includes("poor_recovery") ||
    uniqueConstraints.includes("low_energy")
  ) {
    headlineParts.push("Lighter CNS-Friendly Intensity");
  }
  if (eqSubstitutions.length > 0) {
    headlineParts.push(`Adapted for ${gymInventory.gymName}`);
  }

  const coachHeadline =
    headlineParts.length > 0
      ? `Today's Session Adapted: ${headlineParts.join(" · ")}`
      : `Today's Session Tuned for ${gymInventory.gymName}`;

  const activeCount = adapted.filter((e) => !e.skippedForToday).length;
  const skippedCount = adapted.filter((e) => e.skippedForToday).length;

  const coachExplanation = [
    `I've tailored today's workout around your current situation (${activeCount} active exercises, ~${estimatedAdaptedMinutes} mins${skippedCount > 0 ? `, ${skippedCount} accessory movement(s) deferred for today` : ""}).`,
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
