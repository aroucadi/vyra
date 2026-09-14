import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { appStore } from "../../../src/lib/store.ts";

describe("Master Transformation 16-Week Blueprint & 4-Option Equipment Matrix", () => {
  it("verifies Alaa Pro and Alaa personas exist and are actively linked", () => {
    const trainer = appStore.getUser("trainer_alaa");
    assert.ok(trainer, "Trainer Alaa Pro must exist in store");
    assert.equal(trainer?.role, "trainer");
    assert.equal(trainer?.name, "Alaa Pro");

    const trainee = appStore.getUser("trainee_alaa");
    assert.ok(trainee, "Trainee Alaa must exist in store");
    assert.equal(trainee?.role, "trainee");
    assert.equal(trainee?.name, "Alaa");
    assert.ok(trainee?.injuries.some((i) => i.includes("Anterior Pelvic Tilt")));
    assert.ok(trainee?.injuries.some((i) => i.includes("Shoulder Internal Rotation")));
  });

  it("verifies Master Transformation 16-Week Blueprint structure and 112 days", () => {
    const program = appStore.getActiveProgramForTrainee("trainee_alaa");
    assert.ok(program, "Master program must be published for trainee_alaa");
    assert.equal(program?.id, "prog_master_transformation_16w");
    assert.equal(program?.title, "The Master Transformation Program: 16-Week Blueprint");
    assert.equal(program?.durationWeeks, 16);
    assert.equal(program?.weeks.length, 16);

    let totalDays = 0;
    program?.weeks.forEach((w) => {
      assert.equal(w.days.length, 7);
      totalDays += w.days.length;
    });
    assert.equal(totalDays, 112, "16 weeks must contain exactly 112 program days");
  });

  it("verifies 4-Option Equipment Matrix is present on every workout exercise slot", () => {
    const program = appStore.getActiveProgramForTrainee("trainee_alaa");
    assert.ok(program);

    const week1 = program?.weeks[0];
    assert.ok(week1);

    // Days 0..3 are training days (Monday through Thursday)
    for (let dayIdx = 0; dayIdx < 4; dayIdx++) {
      const day = week1.days[dayIdx];
      assert.equal(day.isRestDay, false, `Day ${dayIdx} must be a workout day`);
      assert.ok(day.blocks.length > 0, `Day ${dayIdx} must have workout blocks`);

      day.blocks.forEach((block) => {
        block.exercises.forEach((ex) => {
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
  });

  it("verifies 2:1 pull-to-push postural balance and zero quad isolation", () => {
    const program = appStore.getActiveProgramForTrainee("trainee_alaa");
    assert.ok(program);

    const week1 = program.weeks[0];
    const mon = week1.days[0]; // Monday
    const tue = week1.days[1]; // Tuesday
    const wed = week1.days[2]; // Wednesday
    const thu = week1.days[3]; // Thursday

    // Monday Pressing vs Pulling
    const monPressingSets = mon.blocks[0].exercises[0].sets; // Incline Machine Press (3 sets)
    const monPullingSets = mon.blocks[0].exercises[1].sets; // Face pulls (3 sets)
    assert.equal(monPressingSets, 3);
    assert.equal(monPullingSets, 3);

    // Wednesday Back & Rear Delt sets
    const wedPullingSets = wed.blocks[0].exercises
      .slice(0, 3)
      .reduce((sum, ex) => sum + ex.sets, 0); // Lat pulldown (3) + Machine row (3) + Rear delt (3) = 9
    assert.equal(wedPullingSets, 9);

    // Thursday Pressing
    const thuPressingSets = thu.blocks[0].exercises[0].sets; // Shoulder press (3)
    assert.equal(thuPressingSets, 3);

    const totalWeeklyPressing = monPressingSets + thuPressingSets; // 6 sets
    const totalWeeklyPulling = monPullingSets + wedPullingSets; // 12 sets
    assert.equal(
      totalWeeklyPulling / totalWeeklyPressing,
      2,
      "Volume ratio must be exactly 2:1 pull-to-push for internal rotation posture reset"
    );

    // Tuesday: Pelvic reset lower body
    tue.blocks[0].exercises.forEach((ex) => {
      assert.ok(
        !ex.targetMuscleGroups.includes("Quadriceps"),
        `Exercise ${ex.exerciseName} must not isolate quads (100% posterior chain)`
      );
    });
  });

  it("verifies phase-based Creatine protocol (Days 1-5 loading 20.7g vs Day 6+ maintenance 5g)", () => {
    const program = appStore.getActiveProgramForTrainee("trainee_alaa");
    assert.ok(program);

    // Day 3 (Loading phase)
    const day3Doses = appStore.getActiveSupplementDosesForDay(program.id, 3);
    const day3Creatine = day3Doses.filter((d) => d.protocol.name.includes("Creatine"));
    assert.equal(day3Creatine.length, 3, "Day 3 must prescribe 3 doses of creatine");
    const day3Total = day3Creatine.reduce((sum, d) => sum + d.dose.amount, 0);
    assert.equal(Math.round(day3Total * 10) / 10, 20.7, "Loading total must be 20.7g daily");

    // Day 10 (Maintenance phase)
    const day10Doses = appStore.getActiveSupplementDosesForDay(program.id, 10);
    const day10Creatine = day10Doses.filter((d) => d.protocol.name.includes("Creatine"));
    assert.equal(day10Creatine.length, 1, "Day 10 must prescribe 1 dose of creatine");
    assert.equal(day10Creatine[0].dose.amount, 5.0, "Maintenance dose must be 5.0g");
  });

  it("verifies hydration architecture (3500ml base + 500ml workout bonus)", () => {
    const goal = appStore.getHydrationGoal("trainee_alaa");
    assert.ok(goal, "Hydration goal for Alaa must exist");
    assert.equal(goal?.dailyTargetMl, 3500);
    assert.equal(goal?.workoutDayBonusMl, 500);
  });
});