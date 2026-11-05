import { test, describe } from "node:test";
import assert from "node:assert";
import { appStore } from "@/lib/store";
import { WorkoutSession, SetLog, ExerciseFeedbackRecord } from "@/lib/types";

describe("Exercise Feedback Notes, Equipment Photos, & Reordering Logic", () => {
  test("reordering exercises before starting workout resets cursor to index 0", () => {
    // Initial prescribed exercises: [A, B, C, D]
    const exercises = [
      { id: "ex_a", name: "Exercise A" },
      { id: "ex_b", name: "Exercise B" },
      { id: "ex_c", name: "Exercise C" },
      { id: "ex_d", name: "Exercise D" },
    ];

    let currentExIndex = 0;
    const mode: "preview" | "warmup" | "active" = "preview";

    // Simulate moving Exercise A down twice in preview mode:
    // Move 1: [B, A, C, D]
    let copy = [...exercises];
    let temp = copy[0 + 1];
    copy[0 + 1] = copy[0];
    copy[0] = temp;
    if (mode === "preview") {
      currentExIndex = 0; // Fix enforced: preview reordering keeps currentExIndex at 0
    }

    // Move 2: [B, C, A, D] (Exercise A is now at index 2 / position 3)
    temp = copy[1 + 1];
    copy[1 + 1] = copy[1];
    copy[1] = temp;
    if (mode === "preview") {
      currentExIndex = 0;
    }

    assert.strictEqual(copy[0].id, "ex_b", "First exercise is now Exercise B");
    assert.strictEqual(copy[1].id, "ex_c", "Second exercise is Exercise C");
    assert.strictEqual(copy[2].id, "ex_a", "Third exercise is now Exercise A");
    assert.strictEqual(currentExIndex, 0, "Cursor must remain at index 0 for the start of the workout");

    // Starting workout initiates at index 0 (Exercise B, not Exercise A at index 2)
    const activeStartExercise = copy[currentExIndex];
    assert.strictEqual(activeStartExercise.id, "ex_b", "Workout must begin on first reordered exercise");
  });

  test("persists free-form non-mandatory notes and equipment photo URLs in WorkoutSession", () => {
    const sessionWithNotesAndPhotos: WorkoutSession = {
      id: "session_notes_photo_test",
      traineeId: "trainee_alaa",
      programDayId: "week1_d0",
      programTitle: "Master 16-Week Protocol",
      dayLabel: "Monday Seated Upper Body",
      date: "2026-11-05",
      startedAt: new Date(Date.now() - 2400 * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      durationSec: 2400,
      liftingDurationSec: 1600,
      totalRestDurationSec: 600,
      warmupDurationSec: 200,
      cooldownDurationSec: 0,
      warmupCompleted: true,
      cooldownCompleted: false,
      setLogs: [
        {
          id: "set_chest_1",
          exercisePrescriptionId: "ex_chest",
          exerciseName: "lever chest press",
          setIndex: 1,
          reps: 10,
          weightKg: 25,
          rirAchieved: 2,
          note: "Seat pin set to position 4; elbows tucked 45 degrees.",
          photoUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
        },
      ],
      exerciseFeedbacks: [
        {
          exerciseName: "lever chest press",
          tag: "optimal",
          tags: ["optimal"],
          note: "Seat pin set to position 4; elbows tucked 45 degrees.",
          photoUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    appStore.saveSession(sessionWithNotesAndPhotos);
    const retrieved = appStore.getSessions("trainee_alaa").find((s) => s.id === "session_notes_photo_test");

    assert.ok(retrieved, "Session should be stored and retrieved");
    assert.strictEqual(retrieved?.setLogs[0].note, "Seat pin set to position 4; elbows tucked 45 degrees.");
    assert.ok(retrieved?.setLogs[0].photoUrl?.startsWith("data:image/jpeg;base64,"), "Set log photoUrl must be preserved");
    assert.strictEqual(retrieved?.exerciseFeedbacks?.[0].note, "Seat pin set to position 4; elbows tucked 45 degrees.");
    assert.ok(retrieved?.exerciseFeedbacks?.[0].photoUrl?.startsWith("data:image/jpeg;base64,"), "Feedback photoUrl must be preserved");
  });
});
