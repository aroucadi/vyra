/**
 * Curated Versioned Sports Science Knowledge Base
 * 
 * Encodes peer-reviewed training and nutrition principles with explicit evidence ratings:
 * - "strong": Multi-study systematic reviews & meta-analyses (e.g. Schoenfeld, Morton, Helms).
 * - "moderate": Replicated randomized controlled trials with robust physiological mechanisms.
 * - "emerging": Modern pilot trials or biomechanical modeling (e.g. lengthened partials).
 * - "practitioner_consensus": Decades of elite CSCS & IFBB coaching practice across competitive athletes.
 * 
 * Replaces decorative pseudoscience with principled, plain-language athletic truths.
 */

import { AthleteModel } from "./athlete-model";

export type EvidenceStrength = "strong" | "moderate" | "emerging" | "practitioner_consensus";
export type EvidenceRating = EvidenceStrength;

export interface CoachingPrinciple {
  id: string;
  category:
    | "nutrition_energy_balance"
    | "progressive_overload"
    | "volume_landmarks"
    | "recovery_and_tendons"
    | "biomechanics_and_anthropometry"
    | "adherence_and_psychology";
  title: string;
  evidenceStrength: EvidenceStrength;
  coreRule: string;
  plainEnglishExplanation: string;
  lastReviewed: string;
  reviewedBy: string;
  sources: string[];
  appliesTo: (athlete: AthleteModel) => boolean;
}

export const COACHING_KNOWLEDGE_BASE: CoachingPrinciple[] = [
  {
    id: "kb_energy_balance_novice",
    category: "nutrition_energy_balance",
    title: "Caloric Surplus is the Primary Lever for Novice Hypertrophy",
    evidenceStrength: "strong",
    coreRule:
      "In underweight or novice lifters (< 1 year consistent training), net muscle tissue accretion requires a caloric surplus of +250–450 kcal/day (targeting +0.25–0.5% bodyweight gain per week) and 1.6–2.2 g/kg protein. Stalls in the first 12 months are primarily nutrition or recovery bottlenecks rather than exercise selection failures.",
    plainEnglishExplanation:
      "When you are lean and starting out, your body cannot build muscle out of thin air. Swapping exercises when you aren't eating enough is like changing spark plugs on an empty gas tank. Fuel comes first.",
    lastReviewed: "2026-11-12",
    reviewedBy: "UNREVIEWED",
    sources: [
      "Morton RW et al. (2018). A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. British Journal of Sports Medicine, 52(6), 376-384.",
      "Slater GJ et al. (2019). Is an Energy Surplus Required to Maximize Skeletal Muscle Hypertrophy Associated With Resistance Training. Frontiers in Nutrition, 6, 131.",
    ],
    appliesTo: (athlete) =>
      athlete.static.regime.value === "novice" || athlete.dynamic.energyBalanceTrend.value.isEnergyBottleneck,
  },
  {
    id: "kb_tendon_adaptation_discrepancy",
    category: "recovery_and_tendons",
    title: "Tendon Collagen Remodeling Lags Muscle Contractile Force",
    evidenceStrength: "strong",
    coreRule:
      "Muscular contractile strength adapts within 8–12 weeks in novices, but dense fibrous connective tissue (patellar, triceps, and biceps tendons) remodels on a 6–12 month biological cadence. Weekly load jumps exceeding 3–5% induce subacute microtrauma and tendon strain.",
    plainEnglishExplanation:
      "Your muscles get stronger faster than your tendons can reinforce themselves. If you add heavy weight too quickly every week, your joints will hurt before your muscles reach their limit. Progress reps first, then add load conservatively.",
    lastReviewed: "2026-11-12",
    reviewedBy: "UNREVIEWED",
    sources: [
      "Bohm S, Mersmann F, Arampatzis A. (2015). Human tendon adaptation in response to mechanical loading: a systematic review and meta-analysis of exercise intervention studies on healthy adults. Sports Medicine - Open, 1(1), 7.",
      "Magnusson SP, Langberg H, Kjaer M. (2010). The pathogenesis of tendinopathy: balancing the response to loading. Nature Reviews Rheumatology, 6(5), 262-268.",
    ],
    appliesTo: (athlete) =>
      athlete.static.regime.value === "novice" ||
      Object.values(athlete.dynamic.tendonTolerances).some((t) => t.value.toleranceStatus === "remodeling_lag"),
  },
  {
    id: "kb_volume_diminishing_returns",
    category: "volume_landmarks",
    title: "Inverted-U Volume Dose-Response & Junk Volume Limits",
    evidenceStrength: "strong",
    coreRule:
      "Hypertrophic stimulus follows a dose-response curve with diminishing returns. For novices, 8–12 direct sets per muscle per week captures the majority of hypertrophy. Sets performed well beyond an athlete's recoverable volume add systemic fatigue and joint wear without proportional muscle growth.",
    plainEnglishExplanation:
      "More is not better; better is better. Doing 20 sets when 10 sets produces full growth just wears out your recovery capacity and stops your progress. Keep sets high quality and stop when quality drops.",
    lastReviewed: "2026-11-12",
    reviewedBy: "UNREVIEWED",
    sources: [
      "Schoenfeld BJ, Ogborn D, Krieger JW. (2017). Dose-response relationship between weekly resistance training volume and increases in muscle mass: A systematic review and meta-analysis. Journal of Sports Sciences, 35(11), 1073-1082.",
    ],
    appliesTo: () => true,
  },
  {
    id: "kb_proximity_to_failure_rir",
    category: "progressive_overload",
    title: "1–3 RIR Matches 0 RIR Failure Hypertrophy with Lower Systemic Fatigue",
    evidenceStrength: "strong",
    coreRule:
      "Training at 1–3 Reps in Reserve (RIR) achieves comparable hypertrophy to absolute failure (0 RIR) while producing less neuromuscular fatigue and lower connective tissue strain. Reserve 0 RIR for final sets on stable isolation or machine movements.",
    plainEnglishExplanation:
      "Leaving 1 to 2 reps in the tank on heavy sets builds just as much muscle as grinding to complete failure, while leaving you fresh enough to train hard again two days later.",
    lastReviewed: "2026-11-12",
    reviewedBy: "UNREVIEWED",
    sources: [
      "Refalo MC et al. (2023). Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy: A Systematic Review with Meta-Analysis. Sports Medicine, 53(3), 649-665.",
      "Zourdos MC et al. (2016). Novel Resistance Training-Specific Rating of Perceived Exertion Scale Measuring Repetitions in Reserve. Journal of Strength and Conditioning Research, 30(1), 267-275.",
    ],
    appliesTo: () => true,
  },
  {
    id: "kb_novelty_cost_of_change",
    category: "progressive_overload",
    title: "Exercise Rotation Resets Skill and Masks True Progressive Overload",
    evidenceStrength: "moderate",
    coreRule:
      "Every new exercise incurs a motor learning phase and increased unaccustomed eccentric muscle soreness (DOMS) during early exposures. A coach changes an exercise only when it is contraindicated by joint pain, missing equipment, or a verified multi-week plateau under adequate nutrition.",
    plainEnglishExplanation:
      "Changing exercises every couple weeks feels exciting, but it resets your skill and makes it impossible to tell if you're actually getting stronger. Master a movement for months before rotating it.",
    lastReviewed: "2026-11-12",
    reviewedBy: "UNREVIEWED",
    sources: [
      "Damas F et al. (2016). Resistance training-induced changes in integrated myofibrillar protein synthesis are related to hypertrophy only after attenuation of muscle damage. Journal of Physiology, 594(18), 5209-5222.",
    ],
    appliesTo: () => true,
  },
  {
    id: "kb_adherence_over_optimality",
    category: "adherence_and_psychology",
    title: "Consistency Reality Trumps Theoretical Program Optimality",
    evidenceStrength: "practitioner_consensus",
    coreRule:
      "A 3-day routine completed with high adherence produces substantially better long-term progress than a 5-day split executed inconsistently. Sustainability and schedule fit are primary coaching variables.",
    plainEnglishExplanation:
      "The best program in the world is useless if your work schedule makes you miss two workouts every week. A simpler schedule you hit without fail beats a complex one you struggle to attend.",
    lastReviewed: "2026-11-12",
    reviewedBy: "UNREVIEWED",
    sources: [],
    appliesTo: (athlete) => athlete.dynamic.adherenceReality.value.completionRatePct < 80,
  },
  {
    id: "kb_anthropometric_leverages",
    category: "biomechanics_and_anthropometry",
    title: "Limb Proportions Dictate Biomechanical Exercise Fit",
    evidenceStrength: "practitioner_consensus",
    coreRule:
      "Lifters with long femurs relative to torso experience greater forward trunk lean on conventional back squats, often making leg presses, hack squats, or heel-elevated squats better suited for quad loading. Long-armed lifters may benefit from neutral-grip dumbbell or convergent machine pressing to manage shoulder comfort.",
    plainEnglishExplanation:
      "Your bone lengths determine what an exercise feels like on your joints. If a movement inherently fights your body proportions, we adapt the stance, use external support, or pick a variation that matches your levers.",
    lastReviewed: "2026-11-12",
    reviewedBy: "UNREVIEWED",
    sources: [],
    appliesTo: (athlete) =>
      athlete.static.structuralProfile.femurRatio.value === "long_femurs" ||
      athlete.static.structuralProfile.armSpanRatio.value === "long_arms",
  },
];

/**
 * Returns true ONLY when a human coach/exercise-scientist has reviewed and signed off on the principle.
 */
export function isPrincipleHumanReviewed(principle?: CoachingPrinciple): boolean {
  return Boolean(
    principle &&
      principle.reviewedBy &&
      principle.reviewedBy.trim().toUpperCase() !== "UNREVIEWED"
  );
}

/**
 * Returns `"unreviewed"` for any principle where `reviewedBy === "UNREVIEWED"` so unreviewed entries
 * never expose an active `"strong"` evidence rating until a human reviewer signs off.
 */
export function getEffectiveEvidenceStrength(
  principle?: CoachingPrinciple
): EvidenceStrength | "unreviewed" {
  if (!principle || !isPrincipleHumanReviewed(principle)) {
    return "unreviewed";
  }
  return principle.evidenceStrength;
}

/**
 * Formats a knowledge-base principle for UI and explainability output.
 * Rule: If `reviewedBy === "UNREVIEWED"`, do NOT display an evidence rating badge or claim a citation —
 * just state the principle in plain language.
 */
export function formatPrincipleForExplainability(principle?: CoachingPrinciple): {
  plainLanguagePrinciple: string;
  citedPrincipleId?: string;
  citedPrincipleTitle?: string;
  evidenceRating?: EvidenceStrength;
  showEvidenceBadge: boolean;
} {
  const fallbackText =
    "Keep movements consistent and progress load or reps gradually while joints feel comfortable.";
  if (!principle) {
    return {
      plainLanguagePrinciple: fallbackText,
      showEvidenceBadge: false,
    };
  }

  if (!isPrincipleHumanReviewed(principle)) {
    return {
      plainLanguagePrinciple: principle.plainEnglishExplanation,
      citedPrincipleId: undefined,
      citedPrincipleTitle: undefined,
      evidenceRating: undefined,
      showEvidenceBadge: false,
    };
  }

  return {
    plainLanguagePrinciple: principle.plainEnglishExplanation,
    citedPrincipleId: principle.id,
    citedPrincipleTitle: principle.title,
    evidenceRating: principle.evidenceStrength,
    showEvidenceBadge: true,
  };
}

/**
 * Retrieves the most relevant scientific principles for an athlete's current context.
 */
export function retrieveApplicablePrinciples(athlete: AthleteModel): CoachingPrinciple[] {
  return COACHING_KNOWLEDGE_BASE.filter((principle) => principle.appliesTo(athlete));
}
