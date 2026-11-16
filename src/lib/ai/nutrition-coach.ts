/**
 * Culturally Grounded Nutrition & Energy-Balance Coaching Module
 * 
 * Elevates nutrition to a first-class coaching domain:
 * - Derives true maintenance calories from smoothed bodyweight trend + logged intake.
 * - Detects when caloric deficit or inadequate protein is the #1 rate-limiting bottleneck capping strength and muscle hypertrophy.
 * - Formulates culturally practical, accessible whole-food solutions (e.g. Moroccan staples in Casablanca: whole eggs, olive oil, sardines, lentils/harira, tajines, almond/banana shakes) rather than generic US meal-prep cliches.
 * - Calibrated with compassion to avoid triggering body image distress or disordered eating.
 */

import { AthleteModel } from "./athlete-model";
import { SmoothedBodyweightTrend } from "../training-math/trend-analytics";

export interface NutritionDiagnosticReport {
  isCaloricBottleneck: boolean;
  currentEstimatedMaintenanceKcal: number;
  prescribedDailyKcal: number;
  surplusDeltaKcal: number;
  prescribedDailyProteinGrams: number;
  proteinGramsPerKg: number;
  targetWeeklyGainKg: number;
  primaryDiagnosis: string;
  culturallyPracticalMealStrategies: string[];
  coachingActionSummary: string;
}

/**
 * Diagnoses whether an athlete's stall or lack of progression is primarily driven by an energy bottleneck.
 */
export function diagnoseNutritionAndEnergyBalance(
  athlete: AthleteModel,
  weightTrend: SmoothedBodyweightTrend,
  averageLoggedCalories?: number
): NutritionDiagnosticReport {
  const measuredWeight =
    weightTrend.smoothedKg ||
    weightTrend.latestRawKg ||
    athlete.dynamic.energyBalanceTrend.value.smoothedWeightKg ||
    0;
  const hasWeightData = measuredWeight > 0;
  const isNovice = athlete.static.regime.value === "novice";
  const isHypertrophyGoal = athlete.static.goals.value.some(
    (g) => g.category === "hypertrophy" || g.category === "recomposition"
  );

  // Culturally practical Moroccan meal strategies for Casablanca context
  const culturallyPracticalMealStrategies: string[] = [
    "🍳 Morning Calorie Density: 3–4 whole eggs cooked in 1.5 tablespoons of extra virgin olive oil with traditional whole-grain bread (khobz) or warm oats with milk.",
    "🐟 High-Protein Convenience: Canned Moroccan sardines in olive oil (cheap, highly bioavailable, packed with 22g protein + omega-3s per tin). Eat with bread as an afternoon anchor.",
    "🍲 Traditional Legume Power: A warm bowl of lentils (3dess) or chickpea harira paired with a piece of chicken breast or boiled eggs.",
    "🥩 Evening Solid Fuel: Beef or chicken tajine with potatoes and seasonal vegetables, using olive oil and bread to soak up calorie-dense nutrient juices.",
    "🥤 Easy Liquid Shake (Zero Bloat): Blend 400ml whole milk, 2 ripe bananas, 30g almonds or peanut butter, and 40g oats. Provides ~650 kcal and 28g protein without filling your stomach for hours.",
  ];

  // Missing data != bad data: when weight is unlogged and no intake is provided, never fabricate a weight or declare a caloric bottleneck
  if (!hasWeightData) {
    return {
      isCaloricBottleneck: false,
      currentEstimatedMaintenanceKcal: 0,
      prescribedDailyKcal: 0,
      surplusDeltaKcal: 0,
      prescribedDailyProteinGrams: 0,
      proteinGramsPerKg: 0,
      targetWeeklyGainKg: 0,
      primaryDiagnosis:
        "Insufficient weight and nutrition data — log at least 2 bodyweight weigh-ins to evaluate energy balance and calculate maintenance targets.",
      culturallyPracticalMealStrategies,
      coachingActionSummary:
        "No caloric adjustment prescribed until baseline bodyweight is logged.",
    };
  }

  const currentWeight = measuredWeight;

  // If average logged calories is provided and we have weight trend, derive maintenance:
  // 1 kg of body tissue ≈ 7,700 kcal
  let estimatedMaintenance: number;
  if (averageLoggedCalories && weightTrend.confidence >= 0.4 && weightTrend.weeklyDeltaKg !== 0) {
    const dailyCaloricImbalance = (weightTrend.weeklyDeltaKg * 7700) / 7;
    estimatedMaintenance = Math.round(averageLoggedCalories - dailyCaloricImbalance);
  } else {
    // Standard Katch-McArdle or Mifflin heuristic with sedentary-to-moderate multiplier (~34 kcal/kg)
    estimatedMaintenance = Math.round(currentWeight * 34);
  }

  // Target gain rate for lean mass:
  // Novices: ~0.35% of bodyweight / week
  // Intermediates: ~0.15–0.25% of bodyweight / week
  const targetWeeklyRatePct = isNovice ? 0.35 : 0.2;
  const targetWeeklyGainKg = Number(((currentWeight * targetWeeklyRatePct) / 100).toFixed(2));

  // Daily surplus needed for target gain rate (~500 kcal/day = ~0.45 kg/week, so scale linearly)
  const targetDailySurplus = Math.round((targetWeeklyGainKg / 0.45) * 500);
  const targetCalories = estimatedMaintenance + targetDailySurplus;

  // Protein targets: 1.8–2.0 g/kg for optimal MPS in a surplus
  const proteinPerKg = isNovice ? 1.8 : 2.0;
  const targetProteinGrams = Math.round(currentWeight * proteinPerKg);

  // Check if weight is stagnant or losing despite a hypertrophy goal
  // Require either multi-point weight trend confidence (>= 0.4) or explicit model energy bottleneck confirmation
  const hasTrendEvidence =
    weightTrend.confidence >= 0.4 ||
    Boolean(athlete.dynamic.energyBalanceTrend.value.isEnergyBottleneck);
  const isLosingOrFlat = hasTrendEvidence && weightTrend.weeklyRatePct <= 0.1;
  const isCaloricBottleneck = isHypertrophyGoal && isLosingOrFlat;

  let primaryDiagnosis = "";
  if (isCaloricBottleneck) {
    primaryDiagnosis = isNovice
      ? `Energy deficit bottleneck detected: At ${currentWeight}kg, your smoothed bodyweight has been holding flat (${weightTrend.weeklyDeltaKg >= 0 ? "+" : ""}${weightTrend.weeklyDeltaKg}kg/wk). For a novice lifter, muscular hypertrophy and progressive overload are capped by energy availability. Changing exercises will not build muscle without surplus fuel.`
      : `Nutritional ceiling detected: Weight gain rate (${weightTrend.weeklyRatePct}%/wk) is below the threshold needed to sustain intermediate progressive overload.`;
  } else if (!hasTrendEvidence) {
    primaryDiagnosis = `Single bodyweight log (${currentWeight}kg) recorded — log additional weekly weigh-ins to establish a smoothed energy-balance trend.`;
  } else {
    primaryDiagnosis = `Energy balance is on track: Gaining at ${weightTrend.weeklyRatePct}%/week (+${weightTrend.weeklyDeltaKg}kg/week), supporting ongoing tissue accretion.`;
  }

  const coachingActionSummary = isCaloricBottleneck
    ? `Action: Increase daily intake by +${targetDailySurplus} kcal to target ${targetCalories} kcal/day with ${targetProteinGrams}g protein (${proteinPerKg}g/kg). Prioritize whole-food density (olive oil, whole eggs, sardines, milk/banana shake) before modifying training exercises.`
    : `Action: Maintain current nutritional intake (${targetCalories} kcal/day, ${targetProteinGrams}g protein).`;

  return {
    isCaloricBottleneck,
    currentEstimatedMaintenanceKcal: estimatedMaintenance,
    prescribedDailyKcal: targetCalories,
    surplusDeltaKcal: targetDailySurplus,
    prescribedDailyProteinGrams: targetProteinGrams,
    proteinGramsPerKg: proteinPerKg,
    targetWeeklyGainKg,
    primaryDiagnosis,
    culturallyPracticalMealStrategies,
    coachingActionSummary,
  };
}
