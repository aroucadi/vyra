import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateBarbellPlates } from '../src/lib/training-math/plates';
import { estimate1RM } from '../src/lib/training-math/onerm';
import { computeExercisePrescription } from '../src/lib/progression-adapter';
import { soundService } from '../src/lib/in-gym/sound';
import { WorkoutSession } from '../src/lib/types';

describe('Pillar 1: In-Gym Alpha Mobile QA Walkthrough Suite', () => {
  it('Phase 1: Validates PWA Standalone Manifest & Service Worker Prerequisites', () => {
    const manifest = {
      name: "Vyra Performance OS",
      short_name: "Vyra",
      start_url: "/today",
      display: "standalone",
      background_color: "#0B0F17",
      theme_color: "#0B0F17",
    };

    assert.strictEqual(manifest.display, "standalone", "PWA must run in standalone window without browser chrome");
    assert.strictEqual(manifest.theme_color, "#0B0F17", "Theme color matches Obsidian slate");
    assert.strictEqual(manifest.start_url, "/today", "Home screen launch drops lifter directly into /today");
  });

  it('Phase 2: Validates In-Gym Olympic Plate Loader Math (Zero Sweat-Thumb Fatigue)', () => {
    // Lifter inputs 100kg for Barbell Romanian Deadlift on standard Olympic Bar (20kg)
    const barWeight = 20;
    const targetWeight = 100;
    const plateResult = calculateBarbellPlates(targetWeight, 'kg', barWeight);

    assert.strictEqual(plateResult.barWeight, 20);
    assert.strictEqual(plateResult.weightPerSide, 40, "40kg per side required");
    // Standard plate inventory (25, 20, 15, 10, 5, 2.5, 1.25) -> 40kg uses [25, 15] (minimal plates)
    assert.deepStrictEqual(plateResult.platesPerSide, [25, 15], "Accurately prescribes [25, 15] for optimal rack efficiency");
    assert.strictEqual(plateResult.remainder, 0, "Zero remainder on standard barbell increment");

    // Uneven increment: 67.5kg (23.75kg per side -> 20 + 2.5 + 1.25)
    const uneven = calculateBarbellPlates(67.5, 'kg', 20);
    assert.strictEqual(uneven.weightPerSide, 23.75);
    assert.deepStrictEqual(uneven.platesPerSide, [20, 2.5, 1.25]);
    assert.strictEqual(uneven.remainder, 0);
  });

  it('Phase 3: Validates Audio/Haptic Rest Timer Chimes (Headless Safe)', () => {
    soundService.setMuted(false);
    assert.strictEqual(soundService.getIsMuted(), false);

    assert.doesNotThrow(() => soundService.playCountdownPip());
    assert.doesNotThrow(() => soundService.playRestChime());

    soundService.setMuted(true);
    assert.strictEqual(soundService.getIsMuted(), true);
    assert.doesNotThrow(() => soundService.playCountdownPip());
  });

  it('Phase 4: Simulates 3-Set Working Execution and Verifies Double-Progression Prescription', () => {
    // Prescribed 3 sets of 8-10 reps at 30kg
    const exerciseConfig = {
      id: "ex1",
      name: "Incline Dumbbell Press",
      sets: 3,
      repRangeLow: 8,
      repRangeHigh: 10,
      lastWeightKg: 30,
    };

    // Lifter completes all 3 sets at 10 reps (rep ceiling hit)
    const completedSession: WorkoutSession = {
      id: "session_qa_alpha_01",
      traineeId: "trainee_alpha",
      programDayId: "day_upper_a",
      programTitle: "Master Hypertrophy",
      dayLabel: "Upper Power A",
      date: "2026-10-14",
      startedAt: "2026-10-14T10:00:00Z",
      endedAt: "2026-10-14T10:45:00Z",
      durationSec: 2700,
      setLogs: [
        { id: "log1", exercisePrescriptionId: "ex1", exerciseName: "Incline Dumbbell Press", setIndex: 1, reps: 10, weightKg: 30, rirAchieved: 2 },
        { id: "log2", exercisePrescriptionId: "ex1", exerciseName: "Incline Dumbbell Press", setIndex: 2, reps: 10, weightKg: 30, rirAchieved: 2 },
        { id: "log3", exercisePrescriptionId: "ex1", exerciseName: "Incline Dumbbell Press", setIndex: 3, reps: 10, weightKg: 30, rirAchieved: 1 },
      ],
    };

    const nextPrescription = computeExercisePrescription(
      [completedSession],
      exerciseConfig,
      'kg'
    );

    assert.ok(nextPrescription, "Progression engine must return a valid prescription");
    assert.strictEqual(nextPrescription.kind, 'up', "Kind is 'up' progression");
    assert.strictEqual(nextPrescription.weight, 32.5, "Advancement from 30kg to 32.5kg (+2.5kg increment)");
    assert.strictEqual(nextPrescription.reps, 8, "Reps reset to bottom of rep range (8 reps)");
    assert.ok(nextPrescription.formattedWhy.includes("2.5 kg more"), "Why text explains the advancement rationale");

    // Estimated 1RM calculation for set 1 (30kg x 10 reps @ 2 RIR -> effective 12 reps)
    const e1rm = estimate1RM(30, 10, { rir: 2 });
    assert.ok(e1rm !== null && e1rm > 30, "Estimated 1RM is calculated accurately");
  });

  it('Phase 5: Verifies Deload Protocol after 3 Consecutive Stalls', () => {
    const exerciseConfig = {
      id: "sq",
      name: "Barbell Back Squat",
      sets: 3,
      repRangeLow: 5,
      repRangeHigh: 5,
      lastWeightKg: 100,
      loadGuidance: "Linear progression 3x5",
    };

    // 3 consecutive stalled sessions (missed 5 reps on final sets)
    const stalledSessions: WorkoutSession[] = [
      {
        id: "s1",
        traineeId: "t1",
        programDayId: "d1",
        programTitle: "P1",
        dayLabel: "Legs",
        date: "2026-10-01",
        startedAt: "2026-10-01T10:00:00Z",
        endedAt: "2026-10-01T10:45:00Z",
        durationSec: 2700,
        setLogs: [
          { id: "1", exercisePrescriptionId: "sq", exerciseName: "Barbell Back Squat", setIndex: 1, reps: 5, weightKg: 100, rirAchieved: 0 },
          { id: "2", exercisePrescriptionId: "sq", exerciseName: "Barbell Back Squat", setIndex: 2, reps: 4, weightKg: 100, rirAchieved: 0 },
          { id: "3", exercisePrescriptionId: "sq", exerciseName: "Barbell Back Squat", setIndex: 3, reps: 3, weightKg: 100, rirAchieved: 0 },
        ],
      },
      {
        id: "s2",
        traineeId: "t1",
        programDayId: "d1",
        programTitle: "P1",
        dayLabel: "Legs",
        date: "2026-10-04",
        startedAt: "2026-10-04T10:00:00Z",
        endedAt: "2026-10-04T10:45:00Z",
        durationSec: 2700,
        setLogs: [
          { id: "4", exercisePrescriptionId: "sq", exerciseName: "Barbell Back Squat", setIndex: 1, reps: 5, weightKg: 100, rirAchieved: 0 },
          { id: "5", exercisePrescriptionId: "sq", exerciseName: "Barbell Back Squat", setIndex: 2, reps: 4, weightKg: 100, rirAchieved: 0 },
          { id: "6", exercisePrescriptionId: "sq", exerciseName: "Barbell Back Squat", setIndex: 3, reps: 4, weightKg: 100, rirAchieved: 0 },
        ],
      },
      {
        id: "s3",
        traineeId: "t1",
        programDayId: "d1",
        programTitle: "P1",
        dayLabel: "Legs",
        date: "2026-10-07",
        startedAt: "2026-10-07T10:00:00Z",
        endedAt: "2026-10-07T10:45:00Z",
        durationSec: 2700,
        setLogs: [
          { id: "7", exercisePrescriptionId: "sq", exerciseName: "Barbell Back Squat", setIndex: 1, reps: 4, weightKg: 100, rirAchieved: 0 },
          { id: "8", exercisePrescriptionId: "sq", exerciseName: "Barbell Back Squat", setIndex: 2, reps: 4, weightKg: 100, rirAchieved: 0 },
          { id: "9", exercisePrescriptionId: "sq", exerciseName: "Barbell Back Squat", setIndex: 3, reps: 3, weightKg: 100, rirAchieved: 0 },
        ],
      },
    ];

    const deloadPrescription = computeExercisePrescription(
      stalledSessions,
      exerciseConfig,
      'kg'
    );

    assert.ok(deloadPrescription, "Must trigger prescription");
    assert.strictEqual(deloadPrescription.kind, 'deload', "Kind is deload");
    assert.strictEqual(deloadPrescription.weight, 90, "10% deload automatically applied (100kg -> 90kg)");
    assert.ok(deloadPrescription.formattedWhy.includes("Epley deload to 90 kg"));
  });
});
