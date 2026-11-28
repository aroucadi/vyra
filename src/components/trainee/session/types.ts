import { appStore } from "@/lib/store";
import { resolveExerciseVideoUrl } from "@/lib/utils";
import { inferPrimaryMuscleFromExerciseName } from "@/lib/ai/sensory-memory";
import type {
  EquipmentOption,
  ExerciseBiofeedbackTag,
  ExerciseConfidenceGuide,
  ExercisePrescription,
  ProgramDay,
} from "@/lib/types";

export type SessionMode = "preview" | "warmup" | "active" | "cooldown" | "summary";

export interface CompletedSetEntry {
  weight: number;
  reps: number;
  isPR: boolean;
  isDropSet?: boolean;
}

export interface ActiveExercise {
  id: string;
  exerciseId?: string;
  name: string;
  category?: string;
  subMovementOrder?: string;
  supersetTag?: string;
  interSetRestSeconds?: number;
  targetSets: number;
  repLow: number;
  repHigh: number;
  targetRir: number;
  restSeconds: number;
  lastBestWeight: number;
  lastBestReps: number;
  formCue?: string;
  videoUrl?: string;
  clipUrl?: string;
  stillUrl?: string;
  imageUrl?: string;
  loadGuidance?: string;
  completedSets: CompletedSetEntry[];
  currentWeight: number;
  currentReps: number;
  target?: string;
  equipment?: string;
  isExtra?: boolean;
  equipmentVariations?: EquipmentOption[];
  confidenceGuide?: ExerciseConfidenceGuide;
  targetMuscleGroups?: string[];
  feedbackTag?: ExerciseBiofeedbackTag;
  feedbackTags?: ExerciseBiofeedbackTag[];
  feedbackNote?: string;
  feedbackAudioUrl?: string;
  feedbackAudioTranscript?: string;
  equipmentPhotoUrl?: string;
  skippedRemaining?: boolean;
  supersetMode?: "superset" | "straight";
  targetWeightKg?: number;
  warmupSets?: number;
}

export const BIOFEEDBACK_OPTIONS: {
  id: ExerciseBiofeedbackTag;
  icon: string;
  label: string;
  activeColor: string;
}[] = [
  {
    id: "optimal",
    icon: "🎯",
    label: "Optimal Form",
    activeColor: "border-amber-500/50 bg-amber-500/20 text-amber-300",
  },
  {
    id: "heavy",
    icon: "🥵",
    label: "Heavy / Fatigue",
    activeColor: "border-amber-500/50 bg-amber-500/20 text-amber-300",
  },
  {
    id: "balance_issue",
    icon: "⚖️",
    label: "Balance / Unstable",
    activeColor: "border-cyan-500/50 bg-cyan-500/20 text-cyan-300",
  },
  {
    id: "joint_strain",
    icon: "⚡",
    label: "Joint Discomfort",
    activeColor: "border-rose-500/50 bg-rose-500/20 text-rose-300",
  },
  {
    id: "light",
    icon: "🪶",
    label: "Too Light",
    activeColor: "border-slate-500/50 bg-slate-500/20 text-slate-200",
  },
];

export function formatDuration(sec?: number): string {
  if (!sec || sec <= 0) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

export function compressImage(
  file: File,
  maxDim = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const ImgCtor = window.Image;
      const img = new ImgCtor();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function mapDayPrescriptionsToExercises(
  userId: string,
  targetDay?: ProgramDay
): ActiveExercise[] {
  if (!targetDay || !targetDay.blocks) return [];
  const exPrescriptions: ExercisePrescription[] = targetDay.blocks.flatMap(
    (b) => b.exercises
  );
  return exPrescriptions.map((ex) => {
    const pb = appStore.getPersonalBestForExercise(userId, ex.exerciseName);
    const defaultWeight = pb
      ? pb.weightKg
      : ex.targetWeightKg !== undefined
      ? ex.targetWeightKg
      : ex.selectedEquipment === "bodyweight"
      ? 0
      : 25;
    const defaultReps = pb
      ? pb.reps
      : Math.round((ex.repRangeLow + ex.repRangeHigh) / 2);

    return {
      id: ex.id,
      exerciseId: ex.exerciseId,
      name: ex.exerciseName,
      category: ex.category,
      subMovementOrder: ex.subMovementOrder,
      supersetTag: ex.supersetTag,
      interSetRestSeconds: ex.interSetRestSeconds,
      targetSets: ex.sets || 3,
      repLow: ex.repRangeLow,
      repHigh: ex.repRangeHigh,
      targetRir: ex.rirScheme?.[0] ?? 2,
      restSeconds: ex.restSeconds !== undefined ? ex.restSeconds : 90,
      lastBestWeight: defaultWeight,
      lastBestReps: defaultReps,
      formCue: ex.formCueText,
      videoUrl: resolveExerciseVideoUrl(ex.exerciseName, {
        explicitVideoUrl: ex.videoUrl,
      }),
      clipUrl: ex.clipUrl,
      imageUrl: ex.imageUrl,
      loadGuidance:
        ex.loadGuidance ||
        "Double progression: add 2.5 kg once top rep target is reached.",
      completedSets: [],
      currentWeight: defaultWeight,
      currentReps: defaultReps,
      target:
        ex.targetMuscleGroups?.[0] ||
        inferPrimaryMuscleFromExerciseName(ex.exerciseName),
      equipment: ex.selectedEquipment || "barbell",
      equipmentVariations: ex.equipmentVariations,
      confidenceGuide: ex.confidenceGuide,
      targetMuscleGroups: ex.targetMuscleGroups,
      targetWeightKg: ex.targetWeightKg,
      warmupSets: ex.warmupSets,
    };
  });
}
