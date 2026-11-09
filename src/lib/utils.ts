import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a Date object to YYYY-MM-DD in local time without UTC offset drift.
 */
export function toLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a local midnight Date object.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Resolves current week index (1-based) and day of week (0=Mon..6=Sun)
 * given a program's start date (YYYY-MM-DD) and a reference date (default: today).
 */
export function resolveProgramDay(startDateStr: string, refDateStr?: string) {
  const start = parseLocalDate(startDateStr);
  const now = refDateStr ? parseLocalDate(refDateStr) : parseLocalDate(toLocalDateString());

  const diffMs = now.getTime() - start.getTime();
  const elapsedDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

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

/**
 * Validate URL to prevent XSS (e.g. javascript: pseudo-protocols)
 */
export function isSafeUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Builds a high-precision YouTube form demonstration search URL using:
 * 1. Catalogue-to-Real-Gym terminology normalization (e.g., translating OpenGym "lever" -> "machine")
 * 2. Exact-phrase quoting on the core movement + extracted setup modifiers (e.g., "Chest-Supported", "Cuff")
 * 3. Anatomical & equipment disambiguation so movements like "Reverse Fly" lock onto "rear delt" (never chest)
 * 4. Google/YouTube boolean & negative search operators (`(form OR technique OR tutorial) -vlog -podcast -CrossFit -fail`)
 * 5. YouTube's official Short Duration protobuf filter (`&sp=EgIYAQ%3D%3D`, < 4 minutes) so athletes only get quick demos
 */
export function buildExerciseVideoUrl(
  exerciseName: string,
  options?: {
    equipment?: string;
    targetMuscle?: string;
  }
): string {
  const raw = (exerciseName || "exercise").trim();

  // Extract parenthetical setup cues (e.g. "(Chest-Supported)", "(Cuff)", "(30° Incline Bench)")
  const modifierMatches = Array.from(raw.matchAll(/\(([^)]+)\)/g)).map((m) =>
    m[1]
      .replace(/°/g, " degree ")
      .replace(/\bpeg\s*#?\d+\b/gi, "")
      .replace(/\s+/g, " ")
      .trim()
  );

  // Strip parentheticals and secondary "or ..." clauses from the core movement name
  let coreName = raw
    .replace(/\([^)]*\)/g, " ")
    .split(/\s+or\s+/i)[0]
    .replace(/°/g, " degree ")
    .replace(/\blever\b/gi, "machine")
    .replace(/\s+/g, " ")
    .trim();

  if (!coreName) {
    coreName = "exercise";
  }

  const lowerAll = `${coreName} ${modifierMatches.join(" ")} ${options?.targetMuscle || ""}`.toLowerCase();

  // Infer anatomical disambiguator so ambiguous movement names (e.g., "Reverse Fly") lock onto the exact muscle
  let anatomicalCue = "";
  if (
    lowerAll.includes("reverse fly") ||
    lowerAll.includes("reverse pec") ||
    lowerAll.includes("reverse cable") ||
    lowerAll.includes("rear delt") ||
    lowerAll.includes("face pull")
  ) {
    anatomicalCue = "rear delt";
  } else if (lowerAll.includes("lateral raise") || lowerAll.includes("side delt")) {
    anatomicalCue = "side delt";
  } else if (lowerAll.includes("incline") && (lowerAll.includes("press") || lowerAll.includes("fly"))) {
    anatomicalCue = "upper chest";
  } else if (lowerAll.includes("pulldown") || lowerAll.includes("lat row") || lowerAll.includes("pull-up") || lowerAll.includes("pull up")) {
    anatomicalCue = "lats";
  } else if (lowerAll.includes("row")) {
    anatomicalCue = "back";
  } else if (lowerAll.includes("tricep") || lowerAll.includes("pushdown") || lowerAll.includes("skull")) {
    anatomicalCue = "triceps";
  } else if (lowerAll.includes("bicep") || lowerAll.includes("preacher") || lowerAll.includes("bayesian") || lowerAll.includes("curl")) {
    anatomicalCue = "biceps";
  }

  // Include equipment if provided and not already in coreName or modifiers
  const eqClean = (options?.equipment || "")
    .replace(/\blever\b/gi, "machine")
    .trim()
    .toLowerCase();
  const equipmentCue =
    eqClean && !lowerAll.includes(eqClean) && eqClean !== "body weight" && eqClean !== "bodyweight"
      ? eqClean
      : "";

  const modifierCue = modifierMatches.filter(Boolean).join(" ");

  const queryParts = [
    `"${coreName}"`,
    modifierCue,
    equipmentCue,
    anatomicalCue,
    "(form OR technique OR tutorial)",
    "-vlog -podcast -CrossFit -fail",
  ].filter(Boolean);

  const searchQuery = queryParts.join(" ").replace(/\s+/g, " ").trim();

  // sp=EgIYAQ%3D%3D is YouTube's official protobuf filter for Short videos (< 4 minutes)
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}&sp=EgIYAQ%3D%3D`;
}

function isGenericYoutubeSearchUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes("youtube.com") &&
      parsed.pathname.includes("/results") &&
      !parsed.searchParams.has("sp")
    );
  } catch {
    return false;
  }
}

/**
 * Resolves the authoritative video demonstration URL for an exercise, ensuring
 * that whenever an exercise is swapped or evolved, its video URL always matches
 * the current exercise name, and automatically upgrades generic YouTube search
 * queries with precision operators and short-duration (<4m) filtering.
 */
export function resolveExerciseVideoUrl(
  exerciseName: string,
  options?: {
    explicitVideoUrl?: string;
    previousExerciseName?: string;
    previousVideoUrl?: string;
    equipment?: string;
    targetMuscle?: string;
    catalogue?: Array<{ name: string; videoUrl?: string; mediaUrls?: string[] }>;
  }
): string {
  const normName = (exerciseName || "").trim().toLowerCase();
  const prevNorm = options?.previousExerciseName?.trim().toLowerCase();
  const isSwapped = Boolean(prevNorm && prevNorm !== normName);

  // 1. If an explicit non-generic video URL (e.g. direct MP4 / watch?v= / already-upgraded search URL) is provided for the current exercise
  if (
    options?.explicitVideoUrl &&
    isSafeUrl(options.explicitVideoUrl) &&
    (!isSwapped || options.explicitVideoUrl !== options?.previousVideoUrl) &&
    !isGenericYoutubeSearchUrl(options.explicitVideoUrl)
  ) {
    return options.explicitVideoUrl;
  }

  // 2. Check the exercise catalogue for an exact match with a dedicated direct video (e.g. MuscleWiki MP4 or watch URL)
  if (options?.catalogue && options.catalogue.length > 0) {
    const exactMatch = options.catalogue.find(
      (c) => c.name.trim().toLowerCase() === normName
    );
    if (exactMatch?.mediaUrls && exactMatch.mediaUrls.length > 0 && isSafeUrl(exactMatch.mediaUrls[0])) {
      return exactMatch.mediaUrls[0];
    }
    if (
      exactMatch?.videoUrl &&
      isSafeUrl(exactMatch.videoUrl) &&
      !isGenericYoutubeSearchUrl(exactMatch.videoUrl)
    ) {
      return exactMatch.videoUrl;
    }
  }

  // 3. If not swapped and previousVideoUrl is a direct non-generic video link (e.g. watch?v= or MP4), keep it
  if (
    !isSwapped &&
    options?.previousVideoUrl &&
    isSafeUrl(options.previousVideoUrl) &&
    !isGenericYoutubeSearchUrl(options.previousVideoUrl)
  ) {
    try {
      const parsed = new URL(options.previousVideoUrl);
      const q = (parsed.searchParams.get("search_query") || "").toLowerCase();
      if (q) {
        const keyTokens = normName
          .replace(/\blever\b/g, "machine")
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter(
            (t) =>
              t.length >= 3 &&
              !["with", "and", "the", "for", "proper", "form", "exercise"].includes(t)
          );
        const hasTokenOverlap =
          keyTokens.length === 0 || keyTokens.some((tok) => q.includes(tok));
        if (hasTokenOverlap) {
          return options.previousVideoUrl;
        }
      } else {
        return options.previousVideoUrl;
      }
    } catch {
      return options.previousVideoUrl;
    }
  }

  // 4. Construct high-precision YouTube search URL with exact phrase, anatomical cue, negative filters & <4m filter
  return buildExerciseVideoUrl(exerciseName, {
    equipment: options?.equipment,
    targetMuscle: options?.targetMuscle,
  });
}
