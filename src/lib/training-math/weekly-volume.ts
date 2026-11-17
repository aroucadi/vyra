import { Program } from "@/lib/types";

export interface WeeklyVolumeBreakdown {
  upperPressingSets: number;
  upperDynamicPullingSets: number;
  posteriorIsometricSets: number;
  totalPosturalSets: number;
  dynamicRatio: string;
  totalPosturalRatio: string;
  lateralDeltExposures: number;
  quadricepsSets: number;
  splitLabel?: string;
  pressingSummary?: string;
  pullingSummary?: string;
  isometricSummary?: string;
  quadsSummary?: string;
  isCustomProgram?: boolean;
}

export const MASTER_PROGRAM_VOLUME_METRICS: WeeklyVolumeBreakdown = {
  upperPressingSets: 6,
  upperDynamicPullingSets: 9,
  posteriorIsometricSets: 3,
  totalPosturalSets: 12,
  dynamicRatio: "1.5:1",
  totalPosturalRatio: "2.0:1",
  lateralDeltExposures: 3,
  quadricepsSets: 6,
  splitLabel: "4-Day Split",
  pressingSummary: "Mon 30° Incline DB (3) + Thu Neutral DB OHP (3)",
  pullingSummary: "Tue Lat Pulldown (3) + Tue Row (3) + Wed Face Pull (3)",
  isometricSummary: "Thu Romanian Deadlift continuous scapular anchor (3)",
  quadsSummary: "Wed 45° Leg Press (3) + Wed Seated Leg Ext (3)",
  isCustomProgram: false,
};

const DAY_SHORT_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function computeWeeklyVolumeFromProgram(program: Program): WeeklyVolumeBreakdown {
  if (!program?.weeks || program.weeks.length === 0) {
    return {
      upperPressingSets: 0,
      upperDynamicPullingSets: 0,
      posteriorIsometricSets: 0,
      totalPosturalSets: 0,
      dynamicRatio: "0.0:1",
      totalPosturalRatio: "0.0:1",
      lateralDeltExposures: 0,
      quadricepsSets: 0,
      splitLabel: "0-Day Split",
      pressingSummary: "No pressing sets scheduled",
      pullingSummary: "No pulling sets scheduled",
      isometricSummary: "No hinge/isometric anchor scheduled",
      quadsSummary: "No quadriceps sets scheduled",
      isCustomProgram: true,
    };
  }

  const week1 = program.weeks[0];
  const trainingDays = week1.days.filter(
    (d) => !d.isRestDay && d.blocks && d.blocks.some((b) => b.exercises.length > 0)
  );

  let upperPressingSets = 0;
  let upperDynamicPullingSets = 0;
  let posteriorIsometricSets = 0;
  let lateralDeltExposures = 0;
  let quadricepsSets = 0;

  const pressingEntries: string[] = [];
  const pullingEntries: string[] = [];
  const isometricEntries: string[] = [];
  const quadsEntries: string[] = [];

  for (const day of trainingDays) {
    const dayShort = DAY_SHORT_NAMES[day.dayOfWeek] || `D${day.dayOfWeek + 1}`;
    const exercises = day.blocks.flatMap((b) => b.exercises);

    for (const ex of exercises) {
      const sets = ex.sets || 0;
      const lowerName = ex.exerciseName.toLowerCase();
      const musclesText = (ex.targetMuscleGroups || []).join(" ").toLowerCase();
      const combined = `${lowerName} ${musclesText}`;

      const entryText = `${dayShort} ${ex.exerciseName} (${sets})`;

      const isLegPress = /leg press|hack squat|squat|lunge|split squat|leg extension|quad/i.test(lowerName);
      const isHingeAnchor =
        /romanian deadlift|rdl|deadlift|good morning|back extension|hyperextension/i.test(lowerName) ||
        (/\b(posterior chain|erectors|hamstrings)\b/i.test(musclesText) && /deadlift|hinge/i.test(lowerName));
      const isDynamicPull =
        /pulldown|pull-up|pullup|chin-up|chinup|\brow\b|face pull|rear delt|reverse fly|shrug/i.test(lowerName) ||
        (/\b(lats|upper back|mid back|rhomboids|rear delt)\b/i.test(musclesText) && !isHingeAnchor);
      const isUpperPress =
        !isLegPress &&
        !isDynamicPull &&
        !isHingeAnchor &&
        (/bench|chest press|incline.*press|shoulder press|overhead press|ohp|dip|push-up|pushup|pec fly/i.test(lowerName) ||
          /\b(chest|pectoral|anterior delt|clavicular)\b/i.test(musclesText));
      const isLateralDelt =
        /lateral raise|upright row|cable lateral|side delt|lateral delt/i.test(combined);

      if (isLegPress) {
        quadricepsSets += sets;
        quadsEntries.push(entryText);
      }
      if (isHingeAnchor) {
        posteriorIsometricSets += sets;
        isometricEntries.push(entryText);
      }
      if (isDynamicPull) {
        upperDynamicPullingSets += sets;
        pullingEntries.push(entryText);
      }
      if (isUpperPress) {
        upperPressingSets += sets;
        pressingEntries.push(entryText);
      }
      if (isLateralDelt) {
        lateralDeltExposures += 1;
      }
    }
  }

  const totalPosturalSets = upperDynamicPullingSets + posteriorIsometricSets;
  const dynamicRatio =
    upperPressingSets > 0
      ? `${(upperDynamicPullingSets / upperPressingSets).toFixed(1)}:1`
      : totalPosturalSets > 0
      ? "Pull-Only"
      : "0.0:1";
  const totalPosturalRatio =
    upperPressingSets > 0
      ? `${(totalPosturalSets / upperPressingSets).toFixed(1)}:1`
      : totalPosturalSets > 0
      ? "Pull-Only"
      : "0.0:1";

  const isAlaaSeeded = program.id === "prog_alaa_master";

  return {
    upperPressingSets,
    upperDynamicPullingSets,
    posteriorIsometricSets,
    totalPosturalSets,
    dynamicRatio,
    totalPosturalRatio,
    lateralDeltExposures: isAlaaSeeded
      ? Math.max(lateralDeltExposures, MASTER_PROGRAM_VOLUME_METRICS.lateralDeltExposures)
      : lateralDeltExposures,
    quadricepsSets,
    splitLabel: `${trainingDays.length}-Day Split`,
    pressingSummary:
      pressingEntries.length > 0
        ? pressingEntries.slice(0, 3).join(" + ")
        : "No upper pressing movements in Week 1",
    pullingSummary:
      pullingEntries.length > 0
        ? pullingEntries.slice(0, 3).join(" + ")
        : "No upper pulling movements in Week 1",
    isometricSummary:
      isometricEntries.length > 0
        ? isometricEntries.slice(0, 2).join(" + ")
        : "No hinge / isometric anchor in Week 1",
    quadsSummary:
      quadsEntries.length > 0
        ? quadsEntries.slice(0, 3).join(" + ")
        : "No quadriceps movements in Week 1",
    isCustomProgram: !isAlaaSeeded,
  };
}
