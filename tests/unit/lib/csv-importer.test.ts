import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  detectCsvFormat,
  normalizeDateString,
  parseHistoricalWorkoutCsv,
  parsePastedWorkoutText,
  commitImportedSessions,
} from "../../../src/lib/import/csv-importer";
import { appStore } from "../../../src/lib/store";

describe("Spec 020: Historical Workout Log Importer", () => {
  describe("Format Detection & Date Normalization", () => {
    it("correctly identifies Hevy CSV export headers", () => {
      const header = `"Date","Workout Name","Exercise Name","Set Order","Weight","Reps","RPE"`;
      assert.equal(detectCsvFormat(header), "hevy");
    });

    it("correctly identifies Strong CSV export headers", () => {
      const header = `"Date","Workout Name","Exercise Name","Set Order","Weight","Reps","RPE","Distance","Seconds","Notes"`;
      assert.equal(detectCsvFormat(header), "strong");
    });

    it("correctly identifies Fitbod export headers", () => {
      const header = `"Date","Exercise","Reps","Weight","Duration(s)","Fitbod"`;
      assert.equal(detectCsvFormat(header), "fitbod");
    });

    it("falls back to generic for unknown column headers", () => {
      const header = `"Timestamp","Movement","Load","Count"`;
      assert.equal(detectCsvFormat(header), "generic");
    });

    it("normalizes diverse date string formats to ISO YYYY-MM-DD", () => {
      assert.equal(normalizeDateString("2026-10-15"), "2026-10-15");
      assert.equal(normalizeDateString("10/15/2026"), "2026-10-15");
      assert.equal(normalizeDateString("5/4/2025"), "2025-05-04");
    });
  });

  describe("CSV Parsing (Hevy & Strong sample exports)", () => {
    it("parses Hevy multi-set multi-exercise export cleanly", () => {
      const csv = `Date,Workout Name,Exercise Name,Set Order,Weight,Reps,RPE
2026-09-01,Push Day,Incline Dumbbell Press,1,32,10,8
2026-09-01,Push Day,Incline Dumbbell Press,2,32,9,8.5
2026-09-01,Push Day,Cable Lateral Raise,1,12.5,15,9
2026-09-03,Pull Day,Lat Pulldown,1,75,10,8`;

      const result = parseHistoricalWorkoutCsv(csv);
      assert.equal(result.detectedFormat, "hevy");
      assert.equal(result.totalWorkouts, 2);
      assert.equal(result.totalSets, 4);
      assert.equal(result.uniqueExercises.length, 3);
      assert.equal(result.dateRange.start, "2026-09-01");
      assert.equal(result.dateRange.end, "2026-09-03");

      const pushSession = result.sessions.find((s) => s.dayLabel === "Push Day");
      assert.ok(pushSession);
      assert.equal(pushSession.setLogs.length, 3);
      assert.equal(pushSession.setLogs[0].exerciseName, "Incline Dumbbell Press");
      assert.equal(pushSession.setLogs[0].weightKg, 32);
      assert.equal(pushSession.setLogs[0].reps, 10);
      assert.equal(pushSession.setLogs[0].rirAchieved, 2); // 10 - 8 RPE
    });

    it("handles quoted CSV fields with commas and skips malformed rows gracefully", () => {
      const csv = `"Date","Workout Name","Exercise Name","Set Order","Weight","Reps","RPE"
"2026-09-05","Legs & Abs","Barbell Squat",1,120,5,8.5
"bad-row"
"2026-09-05","Legs & Abs","Romanian Deadlift",1,100,8,8`;

      const result = parseHistoricalWorkoutCsv(csv);
      assert.equal(result.totalSets, 2);
      assert.equal(result.totalWorkouts, 1);
      assert.equal(result.errors.length, 0); // malformed skipped without throwing
    });
  });

  describe("Pasted Workout Notes Parsing", () => {
    it("parses shorthand workout notes into a structured session", () => {
      const pasted = `Bench Press: 80kg x 8, 80kg x 8, 85kg x 6
Incline DB Press: 30kg x 10, 32kg x 8
Tricep Pushdown: 25kg x 12, 25kg x 12`;

      const result = parsePastedWorkoutText(pasted);
      assert.equal(result.totalWorkouts, 1);
      assert.equal(result.totalSets, 7);
      assert.equal(result.uniqueExercises.length, 3);
      assert.ok(result.totalVolumeKg > 0);
    });
  });

  describe("Commit Imported Sessions to Store with PR Tracking", () => {
    it("commits sessions chronologically and flags personal records accurately", () => {
      const testUserId = "imp_test_user_" + Date.now();
      const csv = `Date,Workout Name,Exercise Name,Set Order,Weight,Reps,RPE
2026-08-01,Push A,Bench Press,1,80,5,8
2026-08-15,Push A,Bench Press,1,85,5,8
2026-09-01,Push A,Bench Press,1,90,5,8`;

      const parsed = parseHistoricalWorkoutCsv(csv);
      const { committedSessions, prsDetected } = commitImportedSessions(testUserId, parsed.sessions);

      assert.equal(committedSessions, 3);
      assert.ok(prsDetected >= 3); // Each progression was a new PR

      const saved = appStore.getSessions(testUserId);
      assert.equal(saved.length, 3);
      assert.equal(saved[0].setLogs[0].isPR, true);
    });
  });
});
