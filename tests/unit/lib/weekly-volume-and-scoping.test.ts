import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeWeeklyVolumeFromProgram } from "../../../src/lib/training-math/weekly-volume.ts";
import { resolveCoachQuery } from "../../../src/lib/coach-engine.ts";
import { appStore } from "../../../src/lib/store.ts";
import { Program } from "../../../src/lib/types.ts";

describe("Multi-Tenant Dynamic Volume & Zero-Alaa-Leakage Guarantees", () => {
  it("computes weekly volume breakdown dynamically for custom programs without Alaa hardcoded numbers", () => {
    const customProgram: Program = {
      id: "prog_custom_user_ppl",
      traineeId: "trainee_other_123",
      trainerId: "trainee_other_123",
      title: "Custom 3-Day PPL",
      durationWeeks: 8,
      startDate: "2026-11-01",
      version: 1,
      status: "published",
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
      weeks: [
        {
          id: "w1",
          programId: "prog_custom_user_ppl",
          weekIndex: 1,
          days: [
            {
              id: "d0",
              weekId: "w1",
              dayOfWeek: 0,
              label: "Push A",
              isRestDay: false,
              morningRoutine: [],
              nutrition: { targetProteinGrams: 160, supplements: [] },
              blocks: [
                {
                  id: "b1",
                  order: 1,
                  type: "straight",
                  exercises: [
                    {
                      id: "e1",
                      exerciseId: "bench",
                      exerciseName: "Barbell Bench Press",
                      sets: 4,
                      repRangeLow: 6,
                      repRangeHigh: 8,
                      rirScheme: [2, 2, 1, 1],
                      restSeconds: 120,
                      targetMuscleGroups: ["Chest"],
                    },
                    {
                      id: "e2",
                      exerciseId: "lat",
                      exerciseName: "Cable Lateral Raise",
                      sets: 3,
                      repRangeLow: 12,
                      repRangeHigh: 15,
                      rirScheme: [2, 1, 0],
                      restSeconds: 60,
                      targetMuscleGroups: ["Lateral Delts"],
                    },
                  ],
                },
              ],
            },
            {
              id: "d2",
              weekId: "w1",
              dayOfWeek: 2,
              label: "Pull A",
              isRestDay: false,
              morningRoutine: [],
              nutrition: { targetProteinGrams: 160, supplements: [] },
              blocks: [
                {
                  id: "b2",
                  order: 1,
                  type: "straight",
                  exercises: [
                    {
                      id: "e3",
                      exerciseId: "row",
                      exerciseName: "Chest-Supported Machine Row",
                      sets: 4,
                      repRangeLow: 8,
                      repRangeHigh: 12,
                      rirScheme: [2, 2, 1, 1],
                      restSeconds: 90,
                      targetMuscleGroups: ["Upper Back"],
                    },
                  ],
                },
              ],
            },
            {
              id: "d4",
              weekId: "w1",
              dayOfWeek: 4,
              label: "Legs A",
              isRestDay: false,
              morningRoutine: [],
              nutrition: { targetProteinGrams: 160, supplements: [] },
              blocks: [
                {
                  id: "b3",
                  order: 1,
                  type: "straight",
                  exercises: [
                    {
                      id: "e4",
                      exerciseId: "squat",
                      exerciseName: "Barbell Back Squat",
                      sets: 5,
                      repRangeLow: 5,
                      repRangeHigh: 8,
                      rirScheme: [2, 2, 2, 1, 1],
                      restSeconds: 150,
                      targetMuscleGroups: ["Quadriceps"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const vol = computeWeeklyVolumeFromProgram(customProgram);
    assert.equal(vol.upperPressingSets, 4);
    assert.equal(vol.upperDynamicPullingSets, 4);
    assert.equal(vol.quadricepsSets, 5);
    assert.equal(vol.lateralDeltExposures, 1);
    assert.equal(vol.splitLabel, "3-Day Split");
    assert.ok(vol.pressingSummary?.includes("Barbell Bench Press (4)"));
    assert.ok(vol.pullingSummary?.includes("Chest-Supported Machine Row (4)"));
    assert.ok(vol.quadsSummary?.includes("Barbell Back Squat (5)"));
    assert.equal(vol.isCustomProgram, true);
  });

  it("never leaks Alaa-specific weights, exercises, or Casablanca food staples to other trainees", () => {
    const otherTraineeId = "trainee_non_alaa_test";
    appStore.addUser({
      id: otherTraineeId,
      role: "trainee",
      name: "Alex Mercer",
      email: "alex@example.com",
      injuries: [],
      goals: ["Strength"],
    });

    const nutReply = resolveCoachQuery(otherTraineeId, "Am I eating enough calories?");
    assert.equal(/casablanca|harira|sardines/i.test(nutReply.text), false);

    const loadReply = resolveCoachQuery(otherTraineeId, "Why this weight prescribed?");
    assert.equal(loadReply.text.includes("140 kg"), false);
  });
});
