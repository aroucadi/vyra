import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { appStore } from "../../../src/lib/store.ts";

describe("NewME Supplement & Hydration Tracking Module", () => {
  const testProgramId = "prog_hypertrophy_1";
  const traineeId = "trainee_1";

  it("resolves phase-based supplement dosing without trainer daily re-authoring", () => {
    // Day 3 is within Loading Phase (Days 1–7)
    const day3Doses = appStore.getActiveSupplementDosesForDay(testProgramId, 3);
    const day3CreatineDoses = day3Doses.filter(
      (d) => d.protocol.id === "sp_creatine"
    );

    // Creatine loading requires 4 doses of 5g (20g total)
    assert.equal(day3CreatineDoses.length, 4);
    assert.ok(day3CreatineDoses[0].phase.name.includes("Loading Phase"));
    day3CreatineDoses.forEach((d) => {
      assert.equal(d.dose.amount, 5);
      assert.equal(d.dose.unit, "g");
    });

    // Total daily creatine during loading = 20g
    const totalLoadingGrams = day3CreatineDoses.reduce(
      (acc, d) => acc + d.dose.amount,
      0
    );
    assert.equal(totalLoadingGrams, 20);

    // Day 10 is within Maintenance Phase (Days 8+)
    const day10Doses = appStore.getActiveSupplementDosesForDay(testProgramId, 10);
    const day10CreatineDoses = day10Doses.filter(
      (d) => d.protocol.id === "sp_creatine"
    );

    // Maintenance drops automatically to 1 dose of 5g
    assert.equal(day10CreatineDoses.length, 1);
    assert.ok(day10CreatineDoses[0].phase.name.includes("Maintenance Phase"));
    assert.equal(day10CreatineDoses[0].dose.amount, 5);
    assert.equal(day10CreatineDoses[0].dose.unit, "g");
  });

  it("supports both meal-linked and standalone physiological timing anchors", () => {
    const day10Doses = appStore.getActiveSupplementDosesForDay(testProgramId, 10);

    // Meal-linked doses (e.g. Vitamin D3+K2 and Omega-3 tied to Meal 1: Breakfast)
    const d3Dose = day10Doses.find((d) => d.protocol.id === "sp_d3k2");
    assert.ok(d3Dose);
    assert.equal(d3Dose.dose.timingType, "meal_linked");
    assert.equal(d3Dose.dose.mealLabel, "Meal 1: Breakfast");
    assert.equal(d3Dose.dose.amount, 5000);
    assert.equal(d3Dose.dose.unit, "IU");

    const omega3Dose = day10Doses.find((d) => d.protocol.id === "sp_omega3");
    assert.ok(omega3Dose);
    assert.equal(omega3Dose.dose.timingType, "meal_linked");
    assert.equal(omega3Dose.dose.mealLabel, "Meal 1: Breakfast");

    // Standalone dose (e.g. Magnesium Glycinate pre-bed)
    const magDose = day10Doses.find((d) => d.protocol.id === "sp_magnesium");
    assert.ok(magDose);
    assert.equal(magDose.dose.timingType, "standalone");
    assert.equal(magDose.dose.standaloneTiming, "pre_bed");
    assert.equal(magDose.dose.amount, 400);
    assert.equal(magDose.dose.unit, "mg");
  });

  it("orders daily supplement doses chronologically by targetTime", () => {
    const day10Doses = appStore.getActiveSupplementDosesForDay(testProgramId, 10);
    assert.ok(day10Doses.length >= 3);

    // Verify chronological order: Breakfast (08:30) -> Post-workout (17:30) -> Pre-bed (22:00)
    for (let i = 0; i < day10Doses.length - 1; i++) {
      const timeA = day10Doses[i].dose.targetTime || "00:00";
      const timeB = day10Doses[i + 1].dose.targetTime || "00:00";
      assert.ok(
        timeA.localeCompare(timeB) <= 0,
        `Dose ${day10Doses[i].protocol.name} (${timeA}) should precede ${day10Doses[i + 1].protocol.name} (${timeB})`
      );
    }
  });

  it("logs supplement dose completions and toggles status in SupplementLog", () => {
    const testDate = "2026-11-01";
    const testDoseId = "sp_mag_d1";
    const testProtocolId = "sp_magnesium";

    // Toggle to taken
    const log1 = appStore.toggleSupplementDose(
      traineeId,
      testProgramId,
      testProtocolId,
      testDoseId,
      testDate,
      "Magnesium Glycinate"
    );
    assert.equal(log1.status, "taken");
    assert.ok(log1.takenAt);

    const logs = appStore.getSupplementLogsForDate(traineeId, testDate);
    assert.ok(logs.some((l) => l.doseId === testDoseId && l.status === "taken"));

    // Toggle back to pending
    const log2 = appStore.toggleSupplementDose(
      traineeId,
      testProgramId,
      testProtocolId,
      testDoseId,
      testDate,
      "Magnesium Glycinate"
    );
    assert.equal(log2.status, "pending");
    assert.equal(log2.takenAt, undefined);
  });

  it("tracks hydration goal, running-total logging, and quick-add increments", () => {
    const testDate = "2026-11-02";
    const goal = appStore.getHydrationGoal(traineeId);
    assert.ok(goal);
    assert.equal(goal.dailyTargetMl, 3500); // 3.5 Liters target

    // Initial total for new date should be 0
    const initialTotal = appStore.getTodayHydrationTotal(traineeId, testDate);
    assert.equal(initialTotal, 0);

    // Quick-add +250ml (glass)
    appStore.logHydration(traineeId, 250, testDate);
    assert.equal(appStore.getTodayHydrationTotal(traineeId, testDate), 250);

    // Quick-add +500ml (bottle)
    appStore.logHydration(traineeId, 500, testDate);
    assert.equal(appStore.getTodayHydrationTotal(traineeId, testDate), 750);

    // Quick-add +750ml (shaker)
    appStore.logHydration(traineeId, 750, testDate);
    assert.equal(appStore.getTodayHydrationTotal(traineeId, testDate), 1500);

    // Quick-add +1000ml (jug)
    appStore.logHydration(traineeId, 1000, testDate);
    assert.equal(appStore.getTodayHydrationTotal(traineeId, testDate), 2500);

    // Verify percentage calculation against 3500ml
    const totalMl = appStore.getTodayHydrationTotal(traineeId, testDate);
    const percentage = Math.round((totalMl / goal.dailyTargetMl) * 100);
    assert.equal(percentage, 71); // 2500 / 3500 = 71.4% -> 71%
  });

  it("surfaces supplement and hydration adherence columns and alerts in Trainer Roster", () => {
    const roster = appStore.getRoster();
    assert.ok(roster.length >= 3);

    // Trainee 1 (Alex) has high adherence across all 3 dimensions
    const alex = roster.find((r) => r.trainee.id === "trainee_1");
    assert.ok(alex);
    assert.equal(alex.adherencePercentage, 94);
    assert.equal(alex.supplementAdherencePercentage, 92);
    assert.equal(alex.hydrationAdherencePercentage, 86);

    // Trainee 3 (Marcus V) has low adherence and triggers alerts
    const marcus = roster.find((r) => r.trainee.id === "trainee_3");
    assert.ok(marcus);
    assert.ok((marcus.supplementAdherencePercentage ?? 100) < 70);
    assert.ok((marcus.hydrationAdherencePercentage ?? 100) < 60);

    // Verify alerts fired for Marcus V
    const alertMessages = marcus.alerts.map((a) => a.message);
    assert.ok(
      alertMessages.some((m) => m.toLowerCase().includes("supplement")),
      "Expected supplement adherence alert for trainee 3"
    );
    assert.ok(
      alertMessages.some((m) => m.toLowerCase().includes("hydration")),
      "Expected hydration adherence alert for trainee 3"
    );
  });
});
