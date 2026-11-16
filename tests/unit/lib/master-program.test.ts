import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { appStore } from "../../../src/lib/store.ts";
import { resolveProgramDay, toLocalDateString } from "../../../src/lib/utils.ts";

describe("Master Transformation 12-Week Blueprint & 4-Option Equipment Matrix", () => {
  it("verifies Alaa Pro and Alaa personas exist and are actively linked", () => {
    const trainer = appStore.getUser("trainer_alaa");
    assert.ok(trainer, "Trainer Alaa Pro must exist in store");
    assert.equal(trainer?.role, "trainer");
    assert.equal(trainer?.name, "Alaa Pro");

    const trainee = appStore.getUser("trainee_alaa");
    assert.ok(trainee, "Trainee Alaa must exist in store");
    assert.equal(trainee?.role, "both");
    assert.equal(trainee?.name, "Alaa");
    assert.ok(trainee?.injuries.some((i) => i.includes("52.05") || i.includes("Underweight")));
    assert.ok(trainee?.injuries.some((i) => i.includes("Left-Arm")));
  });

  it("verifies Master Transformation 16-Week 5-Day Split launching Nov 23, 2026 (112 days)", () => {
    const program = appStore.getActiveProgramForTrainee("trainee_alaa");
    assert.ok(program, "Master program must be published for trainee_alaa");
    assert.equal(program?.id, "prog_master_5day_v2");
    assert.equal(program?.title, "The Definitive 5-Day Custom 360° Hypertrophy, Long-Length Stretch & Posture Protocol");
    assert.equal(program?.startDate, "2026-11-23");
    assert.equal(program?.launchDate, "2026-11-23");
    assert.equal(program?.durationWeeks, 16);
    assert.equal(program?.weeks.length, 16);

    let totalDays = 0;
    program?.weeks.forEach((w) => {
      assert.equal(w.days.length, 7);
      totalDays += w.days.length;
    });
    assert.equal(totalDays, 112, "16 weeks must contain exactly 112 program days");
  });

  it("verifies 4-Option Equipment Matrix is present on every workout exercise slot (24 catalogue movements)", () => {
    const program = appStore.getActiveProgramForTrainee("trainee_alaa");
    assert.ok(program);

    const week1 = program?.weeks[0];
    assert.ok(week1);

    let exerciseCount = 0;
    // Days 0..3 are training days (Monday through Thursday)
    for (const dayIdx of [0, 1, 2, 3, 5]) {
      const day = week1.days[dayIdx];
      assert.equal(day.isRestDay, false, `Day ${dayIdx} must be a workout day`);
      assert.ok(day.blocks.length > 0, `Day ${dayIdx} must have workout blocks`);

      day.blocks.forEach((block) => {
        block.exercises.forEach((ex) => {
          exerciseCount++;
          assert.ok(
            ex.equipmentVariations && ex.equipmentVariations.length === 4,
            `Exercise ${ex.exerciseName} in Day ${dayIdx} must contain exactly 4 equipment options`
          );

          const types = ex.equipmentVariations.map((v) => v.equipmentType);
          assert.ok(types.includes("machine"), "Must include machine option");
          assert.ok(types.includes("dumbbell"), "Must include dumbbell option");
          assert.ok(types.includes("cable"), "Must include cable option");
          assert.ok(types.includes("bodyweight"), "Must include bodyweight option");

          ex.equipmentVariations.forEach((v) => {
            assert.ok(v.exerciseName.length > 0, "Variation must have exerciseName");
            assert.ok(v.formCue.length > 0, "Variation must have formCue");
            assert.ok(v.videoUrl && v.videoUrl.startsWith("http"), "Variation must have valid videoUrl");
            assert.ok(v.targetFocus && v.targetFocus.length > 0, "Variation must have targetFocus");
          });
        });
      });
    }
    assert.equal(exerciseCount, 28, "5-day split must contain exactly 28 exercise slots (Mon 5, Tue 6, Wed 5, Thu 6, Sat 6)");
  });

  it("verifies zero leg loading on Monday and Tuesday for football match deconfliction", () => {
    const program = appStore.getActiveProgramForTrainee("trainee_alaa");
    assert.ok(program);

    const week1 = program.weeks[0];
    const mon = week1.days[0]; // Monday
    const tue = week1.days[1]; // Tuesday

    // Monday: 100% upper body & abs (Push, Rear Delt, Triceps & Abs)
    mon.blocks.forEach((block) => {
      block.exercises.forEach((ex) => {
        assert.ok(
          !ex.targetMuscleGroups.includes("Glutes") && !ex.targetMuscleGroups.includes("Quads") && !ex.targetMuscleGroups.includes("Hamstrings"),
          `Monday exercise ${ex.exerciseName} must not load legs before 19:15 match`
        );
      });
    });

    // Tuesday: Zero quad / leg loading post-football (100% seated/supported pulls)
    tue.blocks.forEach((block) => {
      block.exercises.forEach((ex) => {
        assert.ok(
          !ex.targetMuscleGroups.includes("Quadriceps") && !ex.targetMuscleGroups.includes("Hamstrings") && !ex.targetMuscleGroups.includes("Quads"),
          `Tuesday exercise ${ex.exerciseName} must not load legs (100% upper body post-football)`
        );
      });
    });
  });

  it("verifies Creatine protocol (2.82g daily from 4 scoops Scitec Jumbo Hardcore across AM + 19:00)", () => {
    const program = appStore.getActiveProgramForTrainee("trainee_alaa");
    assert.ok(program);

    const day3Doses = appStore.getActiveSupplementDosesForDay(program.id, 3);
    const day3Creatine = day3Doses.filter((d) => d.dose.notes?.includes("2.82g Creatine"));
    assert.equal(day3Creatine.length, 1, "Day 3 must prescribe 1 Jumbo afternoon dose completing 2.82g creatine");
    assert.equal(day3Creatine[0].dose.amount, 2.82, "Creatine dose from 4 scoops Jumbo must be 2.82g");

    const day10Doses = appStore.getActiveSupplementDosesForDay(program.id, 10);
    const day10Creatine = day10Doses.filter((d) => d.dose.notes?.includes("2.82g Creatine"));
    assert.equal(day10Creatine.length, 1, "Day 10 must prescribe 1 Jumbo dose completing 2.82g creatine");
    assert.equal(day10Creatine[0].dose.amount, 2.82, "Maintenance dose from 4 scoops Jumbo must be 2.82g");
  });

  it("verifies hydration architecture (3500ml base + 500ml workout bonus)", () => {
    const goal = appStore.getHydrationGoal("trainee_alaa");
    assert.ok(goal, "Hydration goal for Alaa must exist");
    assert.equal(goal?.dailyTargetMl, 3500);
    assert.equal(goal?.workoutDayBonusMl, 500);
  });

  it("verifies per-set equipment swapping, PR isolation, and dynamic adherence evolution", () => {
    // 1. Initially Alex has 15 completed sessions out of 16 scheduled -> 94%
    const alexInitialAdherence = appStore.calculateWorkoutAdherence("trainee_1");
    assert.equal(alexInitialAdherence, 94);

    // Marcus Vance has 3 completed sessions out of 6 scheduled -> 50%
    const marcusAdherence = appStore.calculateWorkoutAdherence("trainee_3");
    assert.equal(marcusAdherence, 50);

    // Check personal best for Barbell Bench Press
    const barbellBest = appStore.getPersonalBestForExercise("trainee_1", "Barbell Bench Press", "barbell");
    assert.ok(barbellBest);
    assert.ok(barbellBest.weightKg > 0);

    // Check personal best for Dumbbell variant (should be isolated / independent)
    const dumbbellBest = appStore.getPersonalBestForExercise("trainee_1", "Incline Dumbbell Press", "dumbbell");
    const initialDbWeight = dumbbellBest ? dumbbellBest.weightKg : 0;

    // Log a new 16th session with Dumbbell variant at higher weight (38kg)
    const testSession = appStore.saveSession({
      id: "sess_test_db_1",
      traineeId: "trainee_1",
      programDayId: "test_day",
      programTitle: "Test Program",
      dayLabel: "Chest Day",
      date: new Date().toISOString().split("T")[0],
      startedAt: new Date().toISOString(),
      durationSec: 1800,
      setLogs: [
        {
          id: "sl_test_db",
          exercisePrescriptionId: "ep1",
          exerciseName: "Incline Dumbbell Press",
          setIndex: 1,
          weightKg: 38,
          reps: 10,
          rirAchieved: 1,
          isPR: true,
          selectedEquipment: "dumbbell",
        },
      ],
    });
    assert.ok(testSession.id);

    // Equipment-isolated PR detection: dumbbell PR updated to 38kg
    const updatedDbBest = appStore.getPersonalBestForExercise("trainee_1", "Incline Dumbbell Press", "dumbbell");
    assert.ok(updatedDbBest);
    assert.equal(updatedDbBest.weightKg, 38);

    // Dynamic adherence evolution: with 16 sessions completed out of 16 scheduled, adherence becomes 100%
    const alexUpdatedAdherence = appStore.calculateWorkoutAdherence("trainee_1");
    assert.equal(alexUpdatedAdherence, 100);

    // Roster reflects Marcus's adherence and alert flags
    const roster = appStore.getRoster();
    const marcusRoster = roster.find((r) => r.trainee.id === "trainee_3");
    assert.ok(marcusRoster);
    assert.equal(marcusRoster.adherencePercentage, 50);
    assert.ok(marcusRoster.alerts.some((a) => a.type === "missed_sessions"));
  });

  it("verifies opening session directly on Wednesday resolves Day 2 without falling back to Day 0", () => {
    const program = appStore.getActiveProgramForTrainee("trainee_alaa");
    assert.ok(program, "Active program must exist");
    const week1 = program.weeks[0];
    assert.ok(week1, "Week 1 must exist");

    // Wednesday is dayOfWeek 2
    const wednesdayDay = week1.days.find((d) => d.dayOfWeek === 2 && !d.isRestDay);
    assert.ok(wednesdayDay, "Wednesday training day must exist");
    assert.equal(wednesdayDay.id, "prog_master_w1_d2");
    assert.ok(wednesdayDay.label.toLowerCase().includes("wednesday") || wednesdayDay.label.toLowerCase().includes("legs a"));

    // Verify resolving by day ID directly (simulating /session?day=prog_master_w1_d2)
    const dayParam = "prog_master_w1_d2";
    const targetDay = week1.days.find((d) => d.id === dayParam);
    assert.ok(targetDay, "Direct query targetDay must be found");
    assert.equal(targetDay.id, "prog_master_w1_d2");
    assert.equal(targetDay.dayOfWeek, 2);
    assert.notEqual(targetDay.id, week1.days[0].id, "Target day must NOT fallback to Day 0 (Monday)");

    // Verify resolving with simulated Wednesday date (2 days after startDate)
    const [sY, sM, sD] = program.startDate.split("-").map(Number);
    const wedObj = new Date(sY, sM - 1, sD + 2, 0, 0, 0, 0);
    const simWedStr = toLocalDateString(wedObj);

    const friObj = new Date(sY, sM - 1, sD + 4, 0, 0, 0, 0);
    const simFriStr = toLocalDateString(friObj);

    const resolvedWed = resolveProgramDay(program.startDate, simWedStr);
    assert.equal(resolvedWed.dayOfWeek, 2);
    assert.equal(resolvedWed.weekIndex, 1);

    const autoResolvedWed = week1.days.find((d) => d.dayOfWeek === resolvedWed.dayOfWeek && !d.isRestDay);
    assert.ok(autoResolvedWed, "Auto-resolved day for Wednesday clock must exist");
    assert.equal(autoResolvedWed.id, "prog_master_w1_d2");
    assert.equal(autoResolvedWed.label, wednesdayDay.label);

    // Verify rest day (Friday = 4 days after startDate) resolves to undefined instead of silently falling back to Day 0
    const resolvedFri = resolveProgramDay(program.startDate, simFriStr);
    assert.equal(resolvedFri.dayOfWeek, 4);
    const scheduledFri = week1.days.find((d) => d.dayOfWeek === resolvedFri.dayOfWeek);
    assert.ok(scheduledFri?.isRestDay);
    const targetDayOnRest = (scheduledFri && !scheduledFri.isRestDay) ? scheduledFri : undefined;
    assert.equal(targetDayOnRest, undefined, "Rest days must resolve to undefined to prompt day selection instead of silent Day 0 fallback");
  });
});
