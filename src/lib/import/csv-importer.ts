/**
 * @file csv-importer.ts
 * @description Spec 020: Historical Workout Log Importer.
 * Deterministic CSV and pasted table parser supporting Hevy, Strong, and Fitbod export formats.
 * Extracts workout sessions, exercise sets, weights, reps, and RPE into structured WorkoutSession entities
 * with user verification preview before committing to persistent storage.
 */

import { WorkoutSession, SetLog } from "../types";
import { appStore } from "../store";
import { checkIsPersonalRecord } from "../utils";

export type SupportedImportFormat = "hevy" | "strong" | "fitbod" | "generic";

export interface ParsedSetRow {
  date: string; // YYYY-MM-DD
  workoutName: string;
  exerciseName: string;
  setOrder: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  durationSec?: number;
  notes?: string;
  isWarmup?: boolean;
}

export interface ImportParseResult {
  detectedFormat: SupportedImportFormat;
  totalWorkouts: number;
  totalSets: number;
  totalVolumeKg: number;
  uniqueExercises: string[];
  dateRange: { start: string; end: string };
  sessions: WorkoutSession[];
  errors: string[];
}

/**
 * Normalizes common gym date formats (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY) into ISO YYYY-MM-DD.
 */
export function normalizeDateString(dateStr: string): string {
  const clean = dateStr.trim().replace(/"/g, "");
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    return clean.slice(0, 10);
  }
  // MM/DD/YYYY or M/D/YYYY
  const mdyMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(clean);
  if (mdyMatch) {
    const month = mdyMatch[1].padStart(2, "0");
    const day = mdyMatch[2].padStart(2, "0");
    const year = mdyMatch[3];
    return `${year}-${month}-${day}`;
  }
  // Fallback to Date parsing
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return new Date().toISOString().split("T")[0];
}

/**
 * Splits a CSV line taking quotes and commas into account.
 */
export function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

/**
 * Detects the specific export format from CSV header columns.
 */
export function detectCsvFormat(headerLine: string): SupportedImportFormat {
  const lower = headerLine.toLowerCase();
  if (lower.includes("fitbod") || (lower.includes("duration(s)") && !lower.includes("workout name"))) {
    return "fitbod";
  }
  if (lower.includes("workout name") && (lower.includes("seconds") || lower.includes("notes") || lower.includes("distance"))) {
    return "strong";
  }
  if (lower.includes("workout name") && (lower.includes("set order") || lower.includes("rpe") || lower.includes("weight unit"))) {
    return "hevy";
  }
  if (lower.includes("workout") && lower.includes("exercise") && lower.includes("weight")) {
    return "strong";
  }
  return "generic";
}

/**
 * Parses raw CSV text (Hevy, Strong, Fitbod, or standard delimited) into structured workouts.
 */
export function parseHistoricalWorkoutCsv(csvContent: string): ImportParseResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      detectedFormat: "generic",
      totalWorkouts: 0,
      totalSets: 0,
      totalVolumeKg: 0,
      uniqueExercises: [],
      dateRange: { start: "", end: "" },
      sessions: [],
      errors: ["CSV content is empty or contains no data rows."],
    };
  }

  const header = lines[0];
  const detectedFormat = detectCsvFormat(header);
  const rows: ParsedSetRow[] = [];
  const errors: string[] = [];

  // Parse header column indexes
  const headerCols = splitCsvLine(header).map((c) => c.toLowerCase().replace(/^"|"$/g, ""));
  const dateIdx = headerCols.findIndex((c) => c.includes("date"));
  const workoutIdx = headerCols.findIndex((c) => c.includes("workout"));
  const exerciseIdx = headerCols.findIndex((c) => c.includes("exercise"));
  const weightIdx = headerCols.findIndex((c) => c.includes("weight"));
  const repsIdx = headerCols.findIndex((c) => c === "reps" || c.includes("rep"));
  const setOrderIdx = headerCols.findIndex((c) => c.includes("set") || c.includes("order"));
  const rpeIdx = headerCols.findIndex((c) => c.includes("rpe"));

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cleanCols = splitCsvLine(line).map((c) => c.replace(/^"|"$/g, ""));

    if (cleanCols.length < 3) continue;

    try {
      const rawDate = dateIdx >= 0 ? cleanCols[dateIdx] : cleanCols[0];
      const date = normalizeDateString(rawDate);
      const workoutName = (workoutIdx >= 0 && cleanCols[workoutIdx] ? cleanCols[workoutIdx] : "Workout").slice(0, 100);
      const exerciseName = (exerciseIdx >= 0 && cleanCols[exerciseIdx] ? cleanCols[exerciseIdx] : cleanCols[1] || "Exercise").slice(0, 100);
      const parsedWeight = weightIdx >= 0 ? Number(cleanCols[weightIdx]) || 0 : 0;
      const weightKg = Math.min(1000, Math.max(0, parsedWeight));
      const parsedReps = repsIdx >= 0 ? Number(cleanCols[repsIdx]) || 1 : 10;
      const reps = Math.min(200, Math.max(1, Math.round(parsedReps)));
      const setOrder = setOrderIdx >= 0 ? Math.min(100, Math.max(1, Number(cleanCols[setOrderIdx]) || 1)) : rows.length + 1;
      const rpe = rpeIdx >= 0 && cleanCols[rpeIdx] ? Math.min(10, Math.max(1, Number(cleanCols[rpeIdx]))) : undefined;

      rows.push({
        date,
        workoutName,
        exerciseName,
        setOrder,
        weightKg,
        reps,
        rpe,
      });
    } catch {
      errors.push(`Row ${i + 1}: Malformed row skipped.`);
    }
  }

  // Group rows by Date + Workout Name into distinct sessions
  const sessionMap = new Map<string, ParsedSetRow[]>();
  for (const row of rows) {
    const key = `${row.date}::${row.workoutName}`;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, []);
    }
    sessionMap.get(key)!.push(row);
  }

  const sessions: WorkoutSession[] = [];
  let totalVolumeKg = 0;
  const exerciseSet = new Set<string>();
  const dates: string[] = [];

  let sessionCount = 0;
  for (const [key, sessionRows] of sessionMap.entries()) {
    sessionCount++;
    const [date, workoutName] = key.split("::");
    dates.push(date);

    const setLogs: SetLog[] = sessionRows.map((sr, sIdx) => {
      exerciseSet.add(sr.exerciseName);
      totalVolumeKg += sr.weightKg * sr.reps;
      const rirAchieved = sr.rpe ? Math.max(0, 10 - sr.rpe) : 2;

      return {
        id: `set_imp_${Date.now()}_${sessionCount}_${sIdx + 1}`,
        exercisePrescriptionId: `ep_imp_${sIdx + 1}`,
        exerciseName: sr.exerciseName,
        setIndex: sr.setOrder || sIdx + 1,
        weightKg: sr.weightKg,
        reps: sr.reps,
        rirAchieved,
        isPR: false, // will be evaluated against cumulative history
      };
    });

    sessions.push({
      id: `session_imp_${Date.now()}_${sessionCount}`,
      traineeId: "current_user",
      programDayId: `day_imp_${sessionCount}`,
      programTitle: "Imported History",
      dayLabel: workoutName,
      date,
      startedAt: `${date}T10:00:00.000Z`,
      durationSec: Math.max(1800, setLogs.length * 150),
      setLogs,
    });
  }

  dates.sort();
  const dateRange = {
    start: dates.length > 0 ? dates[0] : "",
    end: dates.length > 0 ? dates[dates.length - 1] : "",
  };

  return {
    detectedFormat,
    totalWorkouts: sessions.length,
    totalSets: rows.length,
    totalVolumeKg: Math.round(totalVolumeKg),
    uniqueExercises: Array.from(exerciseSet),
    dateRange,
    sessions,
    errors,
  };
}

/**
 * Parses freeform copy-pasted text (e.g., from Apple Notes or Google Sheets).
 * Handles lines formatted like: "Bench Press 80kg x 8, 80kg x 8, 85kg x 6"
 */
export function parsePastedWorkoutText(text: string): ImportParseResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const rows: ParsedSetRow[] = [];
  const today = new Date().toISOString().split("T")[0];

  for (const line of lines) {
    // Pattern: Exercise name followed by sets like "80x8" or "80kg 8 reps"
    const match = /^([A-Za-z\s\-]+?)\s*[:\-–]?\s*(.+)$/.exec(line);
    if (!match) continue;

    const exerciseName = match[1].trim();
    const setsPart = match[2].trim();

    // Find all weight x reps tokens e.g. "80x8", "80kg x 8", "80 8"
    const setMatches = setsPart.matchAll(/(\d+(?:\.\d+)?)\s*(?:kg|lbs|lb)?\s*(?:x|×|\*|\s)\s*(\d+)/gi);
    let order = 1;
    for (const sm of setMatches) {
      const weightKg = Number(sm[1]) || 0;
      const reps = Math.max(1, Number(sm[2]) || 1);
      rows.push({
        date: today,
        workoutName: "Pasted Workout",
        exerciseName,
        setOrder: order++,
        weightKg,
        reps,
      });
    }
  }

  if (rows.length === 0) {
    // Attempt standard CSV parsing fallback
    return parseHistoricalWorkoutCsv(text);
  }

  // Construct single workout session from pasted notes
  const setLogs: SetLog[] = rows.map((r, idx) => ({
    id: `set_paste_${Date.now()}_${idx}`,
    exercisePrescriptionId: `ep_paste_${idx + 1}`,
    exerciseName: r.exerciseName,
    setIndex: r.setOrder,
    weightKg: r.weightKg,
    reps: r.reps,
    rirAchieved: 2,
  }));

  const session: WorkoutSession = {
    id: `session_paste_${Date.now()}`,
    traineeId: "current_user",
    programDayId: "day_paste",
    programTitle: "Pasted Workout Session",
    dayLabel: "Pasted Workout",
    date: today,
    startedAt: `${today}T10:00:00.000Z`,
    durationSec: Math.max(1800, setLogs.length * 150),
    setLogs,
  };

  const uniqueExercises = Array.from(new Set(rows.map((r) => r.exerciseName)));
  const totalVolumeKg = rows.reduce((acc, r) => acc + r.weightKg * r.reps, 0);

  return {
    detectedFormat: "generic",
    totalWorkouts: 1,
    totalSets: rows.length,
    totalVolumeKg: Math.round(totalVolumeKg),
    uniqueExercises,
    dateRange: { start: today, end: today },
    sessions: [session],
    errors: [],
  };
}

/**
 * Commits parsed workout sessions to appStore with user validation and PR calculation.
 */
export function commitImportedSessions(
  userId: string,
  sessions: WorkoutSession[]
): { committedSessions: number; prsDetected: number } {
  let committedSessions = 0;
  let prsDetected = 0;

  // Track personal bests during sequential import
  const pbMap = new Map<string, { weightKg: number; reps: number }>();

  // Initialize with any existing records in store
  const existingSessions = appStore.getSessions(userId);
  for (const s of existingSessions) {
    for (const l of s.setLogs) {
      const prev = pbMap.get(l.exerciseName);
      if (!prev || checkIsPersonalRecord(l.weightKg, l.reps, prev.weightKg, prev.reps)) {
        pbMap.set(l.exerciseName, { weightKg: l.weightKg, reps: l.reps });
      }
    }
  }

  // Sort sessions chronologically before saving
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  for (const sess of sorted) {
    sess.traineeId = userId;
    for (const log of sess.setLogs) {
      const currentPb = pbMap.get(log.exerciseName);
      if (checkIsPersonalRecord(log.weightKg, log.reps, currentPb?.weightKg || 0, currentPb?.reps || 0)) {
        log.isPR = true;
        prsDetected++;
        pbMap.set(log.exerciseName, { weightKg: log.weightKg, reps: log.reps });
      }
    }
    appStore.saveSession(sess);
    committedSessions++;
  }

  return { committedSessions, prsDetected };
}
