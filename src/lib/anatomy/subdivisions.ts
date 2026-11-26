/**
 * @file subdivisions.ts
 * @description Pure server/client-agnostic 32 anatomical subdivisions and biomechanical mapping.
 */

export type AnatomicalSubdivisionId =
  // Pectorals
  | "pec_clavicular"
  | "pec_sternal"
  | "pec_costal"
  // Deltoids
  | "delt_anterior"
  | "delt_lateral"
  | "delt_posterior"
  // Arms
  | "biceps_brachii"
  | "brachialis_forearms"
  | "triceps_long_head"
  | "triceps_lateral_head"
  // Back & Scapular
  | "traps_upper"
  | "traps_mid_lower"
  | "lats_iliac"
  | "lats_thoracic"
  | "rhomboids"
  | "infraspinatus_rotator"
  | "erector_spinae"
  // Trunk & Core
  | "rectus_abdominis"
  | "obliques"
  | "serratus_anterior"
  // Lower Body
  | "glute_maximus"
  | "glute_medius"
  | "quad_rectus_femoris"
  | "quad_vastus_lateralis"
  | "quad_vastus_medialis"
  | "hamstrings"
  | "calves_gastrocnemius"
  | "calves_soleus";

export type ForceVectorDirection =
  | "converging_press"
  | "diverging_pull"
  | "lateral_arc"
  | "hip_hinge"
  | "vertical_push"
  | "none";

/**
 * Intelligent mapper from raw exercise string tokens to 32 anatomical subdivisions.
 */
export function mapExerciseToSubdivisions(
  movementOrMuscleName?: string,
  target?: string
): {
  primary: AnatomicalSubdivisionId;
  secondaries: AnatomicalSubdivisionId[];
  view: "front" | "back";
  vectorDirection: ForceVectorDirection;
} {
  const text = `${movementOrMuscleName || ""} ${target || ""}`.toLowerCase();

  // Incline Press / Clavicular Chest
  if (text.includes("incline") && (text.includes("press") || text.includes("bench") || text.includes("chest") || text.includes("pec"))) {
    return {
      primary: "pec_clavicular",
      secondaries: ["delt_anterior", "triceps_lateral_head"],
      view: "front",
      vectorDirection: "converging_press",
    };
  }

  // Flat Bench / Sternal Chest
  if (text.includes("bench") || text.includes("chest press") || text.includes("push up") || (text.includes("pec") && !text.includes("incline"))) {
    return {
      primary: "pec_sternal",
      secondaries: ["delt_anterior", "triceps_lateral_head"],
      view: "front",
      vectorDirection: "converging_press",
    };
  }

  // Lateral Raise / Side Delts
  if (text.includes("lateral raise") || text.includes("side delt") || text.includes("abduction")) {
    return {
      primary: "delt_lateral",
      secondaries: ["traps_upper", "delt_anterior"],
      view: "front",
      vectorDirection: "lateral_arc",
    };
  }

  // Overhead Press / Front Delts
  if (text.includes("overhead press") || text.includes("military") || text.includes("shoulder press") || text.includes("ohp")) {
    return {
      primary: "delt_anterior",
      secondaries: ["triceps_long_head", "delt_lateral", "traps_upper"],
      view: "front",
      vectorDirection: "vertical_push",
    };
  }

  // Lat Pulldown / Pullups / Vertical Pull
  if (text.includes("pulldown") || text.includes("pull up") || text.includes("chin") || text.includes("lat")) {
    return {
      primary: "lats_iliac",
      secondaries: ["biceps_brachii", "traps_mid_lower", "lats_thoracic"],
      view: "back",
      vectorDirection: "diverging_pull",
    };
  }

  // Horizontal Rows / T-Bar / Cable Row
  if (text.includes("row") || text.includes("rhomboid") || text.includes("rear delt")) {
    return {
      primary: "traps_mid_lower",
      secondaries: ["rhomboids", "delt_posterior", "biceps_brachii", "lats_thoracic"],
      view: "back",
      vectorDirection: "diverging_pull",
    };
  }

  // Leg Press / Squats / Quads
  if (text.includes("squat") || text.includes("leg press") || text.includes("quad") || text.includes("lunge") || text.includes("extension")) {
    return {
      primary: "quad_vastus_medialis",
      secondaries: ["quad_rectus_femoris", "quad_vastus_lateralis", "glute_maximus"],
      view: "front",
      vectorDirection: "hip_hinge",
    };
  }

  // Romanian Deadlift / Leg Curl / Hamstrings
  if (text.includes("deadlift") || text.includes("rdl") || text.includes("hamstring") || (text.includes("curl") && text.includes("leg"))) {
    return {
      primary: "hamstrings",
      secondaries: ["glute_maximus", "erector_spinae"],
      view: "back",
      vectorDirection: "hip_hinge",
    };
  }

  // Overhead Triceps Extension
  if (text.includes("tricep") || text.includes("pushdown") || text.includes("skull")) {
    return {
      primary: "triceps_long_head",
      secondaries: ["triceps_lateral_head"],
      view: "back",
      vectorDirection: "vertical_push",
    };
  }

  // Biceps Curl
  if (text.includes("bicep") || text.includes("curl")) {
    return {
      primary: "biceps_brachii",
      secondaries: ["brachialis_forearms"],
      view: "front",
      vectorDirection: "converging_press",
    };
  }

  // Default Front Chest
  return {
    primary: "pec_sternal",
    secondaries: ["delt_anterior"],
    view: "front",
    vectorDirection: "converging_press",
  };
}
