/**
 * @file deep-link.ts
 * @description Spec 022: Source-Aware Deep-Link Entry & Reel Attribution Engine.
 * Normalizes inbound URL parameters (?lift=incline_db_press&source=reel_spotlight)
 * to match promotional video clips 1:1 with zero landing ambiguity.
 */

import { telemetry } from "./telemetry";

export interface DeepLinkLiftConfig {
  slug: string;
  displayName: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  preferredView: "front" | "back";
  setupAnchor: string;
  kineticDrive: string;
  defaultWeightKg: number;
  category: "chest" | "shoulders" | "back" | "legs" | "arms";
}

export const KNOWN_DEEP_LINK_LIFTS: Record<string, DeepLinkLiftConfig> = {
  incline_db_press: {
    slug: "incline_db_press",
    displayName: "Incline Dumbbell Press",
    primaryMuscle: "Clavicular Pectoralis Major",
    secondaryMuscles: ["Anterior Deltoid", "Triceps"],
    preferredView: "front",
    setupAnchor: "Retract scapulae & set bench at 30° incline",
    kineticDrive: "Drive elbows inward toward upper sternum",
    defaultWeightKg: 32,
    category: "chest",
  },
  cable_lateral_raise: {
    slug: "cable_lateral_raise",
    displayName: "Cable Lateral Raise",
    primaryMuscle: "Lateral Deltoid",
    secondaryMuscles: ["Supraspinatus", "Trapezius"],
    preferredView: "front",
    setupAnchor: "Set cable pulley at wrist height with cuff",
    kineticDrive: "Lead with lateral elbow in the scapular plane",
    defaultWeightKg: 10,
    category: "shoulders",
  },
  lat_pulldown: {
    slug: "lat_pulldown",
    displayName: "Lat Pulldown",
    primaryMuscle: "Latissimus Dorsi",
    secondaryMuscles: ["Biceps", "Rhomboids"],
    preferredView: "back",
    setupAnchor: "Depress scapulae before initiating elbow bend",
    kineticDrive: "Drive elbows down and back toward rear pockets",
    defaultWeightKg: 70,
    category: "back",
  },
  romanian_deadlift: {
    slug: "romanian_deadlift",
    displayName: "Romanian Deadlift",
    primaryMuscle: "Hamstrings",
    secondaryMuscles: ["Glutes", "Erector Spinae"],
    preferredView: "back",
    setupAnchor: "Slight knee bend, hinge hips straight back horizontally",
    kineticDrive: "Push the gym floor away through midfoot to lock out",
    defaultWeightKg: 100,
    category: "legs",
  },
  barbell_squat: {
    slug: "barbell_squat",
    displayName: "Barbell Back Squat",
    primaryMuscle: "Quadriceps",
    secondaryMuscles: ["Glutes", "Adductor Magnus"],
    preferredView: "front",
    setupAnchor: "Root tripod foot contact and brace core 360°",
    kineticDrive: "Drive knees over midfoot with vertical torso ascent",
    defaultWeightKg: 100,
    category: "legs",
  },
  pec_deck: {
    slug: "pec_deck",
    displayName: "Pec Deck Flye",
    primaryMuscle: "Sternal Pectoralis Major",
    secondaryMuscles: ["Anterior Deltoid"],
    preferredView: "front",
    setupAnchor: "Adjust seat so handles align with mid-sternum",
    kineticDrive: "Drive inner elbows together into peak contraction",
    defaultWeightKg: 60,
    category: "chest",
  },
  barbell_bench: {
    slug: "barbell_bench",
    displayName: "Barbell Bench Press",
    primaryMuscle: "Pectoralis Major",
    secondaryMuscles: ["Anterior Deltoid", "Triceps"],
    preferredView: "front",
    setupAnchor: "Pinch shoulder blades tight and plant heels flat",
    kineticDrive: "Leg drive upward as bar touches mid-chest",
    defaultWeightKg: 80,
    category: "chest",
  },
  tricep_pushdown: {
    slug: "tricep_pushdown",
    displayName: "Cable Tricep Pushdown",
    primaryMuscle: "Triceps",
    secondaryMuscles: ["Anconeus"],
    preferredView: "back",
    setupAnchor: "Lock elbows firmly against lateral ribcage",
    kineticDrive: "Fully extend forearms with neutral locked wrists",
    defaultWeightKg: 25,
    category: "arms",
  },
};

/**
 * Normalizes raw lift name or query param slug to matching DeepLinkLiftConfig.
 */
export function resolveDeepLinkLift(rawLift: string | null | undefined): DeepLinkLiftConfig | null {
  if (!rawLift) return null;
  const clean = rawLift.toLowerCase().trim().replace(/[\s-]+/g, "_");

  // Direct key lookup
  if (KNOWN_DEEP_LINK_LIFTS[clean]) {
    return KNOWN_DEEP_LINK_LIFTS[clean];
  }

  // Alias lookups
  if (clean.includes("incline") && (clean.includes("db") || clean.includes("dumbbell"))) {
    return KNOWN_DEEP_LINK_LIFTS.incline_db_press;
  }
  if (clean.includes("lateral") || clean.includes("side_delt")) {
    return KNOWN_DEEP_LINK_LIFTS.cable_lateral_raise;
  }
  if (clean.includes("pulldown") || clean.includes("lat_pull")) {
    return KNOWN_DEEP_LINK_LIFTS.lat_pulldown;
  }
  if (clean.includes("rdl") || (clean.includes("romanian") && clean.includes("deadlift"))) {
    return KNOWN_DEEP_LINK_LIFTS.romanian_deadlift;
  }
  if (clean.includes("squat")) {
    return KNOWN_DEEP_LINK_LIFTS.barbell_squat;
  }
  if (clean.includes("pec_deck") || clean.includes("flye") || clean.includes("fly")) {
    return KNOWN_DEEP_LINK_LIFTS.pec_deck;
  }
  if (clean.includes("bench")) {
    return KNOWN_DEEP_LINK_LIFTS.barbell_bench;
  }
  if (clean.includes("tricep") || clean.includes("pushdown")) {
    return KNOWN_DEEP_LINK_LIFTS.tricep_pushdown;
  }

  return null;
}

export interface ParsedDeepLink {
  liftConfig: DeepLinkLiftConfig | null;
  source: string | null;
  campaign: string | null;
  unit: "kg" | "lb";
  anchorWeight?: number;
}

/**
 * Extracts and attributes deep link parameters from URL search params.
 */
export function parseDeepLinkParams(
  urlOrParams: string | URLSearchParams
): ParsedDeepLink {
  const searchParams =
    typeof urlOrParams === "string"
      ? new URLSearchParams(urlOrParams.startsWith("?") ? urlOrParams : `?${urlOrParams}`)
      : urlOrParams;

  const rawLift = (searchParams.get("lift") || searchParams.get("exercise") || "").slice(0, 100);
  const rawSource = searchParams.get("source") || searchParams.get("utm_source");
  const source = rawSource ? rawSource.slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, "") : null;
  const rawCampaign = searchParams.get("campaign") || searchParams.get("utm_campaign");
  const campaign = rawCampaign ? rawCampaign.slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, "") : null;
  const rawUnit = searchParams.get("unit");
  const unit: "kg" | "lb" = rawUnit === "lb" ? "lb" : "kg";

  const rawAnchor = searchParams.get("anchor") || searchParams.get("weight");
  let anchorWeight: number | undefined;
  if (rawAnchor) {
    const num = parseFloat(rawAnchor);
    if (!isNaN(num) && num > 0) anchorWeight = Math.min(500, Math.max(1, num));
  }

  const liftConfig = resolveDeepLinkLift(rawLift);

  return {
    liftConfig,
    source,
    campaign,
    unit,
    anchorWeight,
  };
}

/**
 * Emits non-PII attribution telemetry for marketing campaign tracking.
 */
export function recordDeepLinkAttribution(
  parsed: ParsedDeepLink,
  userId: string = "day_zero_anon"
): void {
  if (!parsed.source && !parsed.liftConfig) return;

  telemetry.track(
    "deep_link_arrived",
    {
      source: parsed.source || "organic",
      campaign: parsed.campaign || "direct",
      liftSlug: parsed.liftConfig?.slug || "default_day_one",
      category: parsed.liftConfig?.category || "general",
    },
    userId
  );
}
