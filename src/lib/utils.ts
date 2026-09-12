import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves current week index (1-based) and day of week (0=Mon..6=Sun)
 * given a program's start date (YYYY-MM-DD) and a reference date (default: today).
 */
export function resolveProgramDay(startDateStr: string, refDateStr?: string) {
  const start = new Date(startDateStr);
  const now = refDateStr ? new Date(refDateStr) : new Date();

  // Reset to midnight UTC/local comparison
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffMs = now.getTime() - start.getTime();
  const elapsedDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (elapsedDays < 0) {
    // Program hasn't started yet
    return {
      started: false,
      weekIndex: 1,
      dayOfWeek: 0,
      elapsedDays,
    };
  }

  const weekIndex = Math.floor(elapsedDays / 7) + 1;
  const dayOfWeek = elapsedDays % 7; // 0 = Day 1 of the program (Monday convention)

  return {
    started: true,
    weekIndex,
    dayOfWeek,
    elapsedDays,
  };
}

/**
 * Calculates estimated 1 Rep Max using Epley formula:
 * 1RM = Weight * (1 + Reps / 30)
 */
export function calculateEstimated1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

/**
 * Detects if a new set qualifies as a Personal Record (PR)
 * compared against a previous best.
 */
export function checkIsPersonalRecord(
  currentWeight: number,
  currentReps: number,
  prevBestWeight: number,
  prevBestReps: number
): boolean {
  if (currentWeight <= 0 || currentReps <= 0) return false;
  if (prevBestWeight <= 0 || prevBestReps <= 0) return true;

  const current1RM = calculateEstimated1RM(currentWeight, currentReps);
  const prev1RM = calculateEstimated1RM(prevBestWeight, prevBestReps);

  return current1RM > prev1RM;
}

/**
 * Format seconds into mm:ss string
 */
export function formatDuration(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format date string into human friendly format
 */
export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  } catch {
    return dateStr;
  }
}
