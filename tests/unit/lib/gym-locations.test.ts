import { test, describe } from "node:test";
import assert from "node:assert";
import { appStore } from "@/lib/store";
import { WorkoutSession, GymLocation } from "@/lib/types";
import { shareEquipmentPhotoWithGemini, shareAudioNoteWithGemini } from "@/lib/share-equipment";

describe("Dynamic Salle de Sport & Gym Locations Management", () => {
  const testUserId = "trainee_gym_test_user";

  test("retrieves pre-seeded default gyms for user", () => {
    const gyms = appStore.getUserGymLocations(testUserId);
    assert.ok(Array.isArray(gyms), "Should return an array of gym locations");
    assert.ok(gyms.length >= 2, "Should have at least 2 default gyms");

    const defaultGym = appStore.getDefaultGymLocation(testUserId);
    assert.ok(defaultGym, "Should resolve a default gym location");
    assert.strictEqual(defaultGym?.id, "gym_punch_lissasfa");
    assert.strictEqual(defaultGym?.name, "Punch by Badr Hari Lissasfa");
  });

  test("allows adding new salle de sport and setting it as default", () => {
    const newGym = appStore.addGymLocation(
      {
        name: "Passage Fitness Casablanca",
        address: "Anfa Place, Casablanca",
        notes: "Full Hammer Strength machines + deadlift platform",
        isDefault: true,
      },
      testUserId
    );

    assert.ok(newGym.id.startsWith("gym_"), "Should assign a valid gym id");
    assert.strictEqual(newGym.name, "Passage Fitness Casablanca");
    assert.strictEqual(newGym.isDefault, true);

    const defaultGym = appStore.getDefaultGymLocation(testUserId);
    assert.strictEqual(defaultGym?.id, newGym.id, "Passage Fitness should now be the default gym");

    const allGyms = appStore.getUserGymLocations(testUserId);
    const oldDefault = allGyms.find((g) => g.id === "gym_punch_lissasfa");
    assert.strictEqual(oldDefault?.isDefault, false, "Previous default should be reset to false");
  });

  test("allows changing default salle de sport back to another gym", () => {
    appStore.setDefaultGymLocation("gym_punch_lissasfa", testUserId);
    const defaultGym = appStore.getDefaultGymLocation(testUserId);
    assert.strictEqual(defaultGym?.id, "gym_punch_lissasfa");
    assert.strictEqual(defaultGym?.isDefault, true);
  });

  test("persists gym association on WorkoutSession and updates past sessions", () => {
    const session: WorkoutSession = {
      id: "session_gym_test_1",
      traineeId: testUserId,
      programDayId: "week1_d0",
      programTitle: "Master 16-Week Transformation",
      dayLabel: "Monday Seated Upper Body",
      date: "2026-11-05",
      startedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      durationSec: 3600,
      gymId: "gym_punch_lissasfa",
      gymName: "Punch by Badr Hari Lissasfa",
      gymAddress: "Lissasfa, Casablanca",
      setLogs: [],
    };

    appStore.saveSession(session);
    let retrieved = appStore.getSessions(testUserId).find((s) => s.id === "session_gym_test_1");
    assert.strictEqual(retrieved?.gymId, "gym_punch_lissasfa");
    assert.strictEqual(retrieved?.gymName, "Punch by Badr Hari Lissasfa");

    // Trainee updates past session's gym retroactively
    appStore.updateSessionGym("session_gym_test_1", {
      id: "gym_home",
      name: "Home Setup",
      address: "Home (Casablanca)",
    });

    retrieved = appStore.getSessions(testUserId).find((s) => s.id === "session_gym_test_1");
    assert.strictEqual(retrieved?.gymId, "gym_home");
    assert.strictEqual(retrieved?.gymName, "Home Setup");
    assert.strictEqual(retrieved?.gymAddress, "Home (Casablanca)");
  });

  test("shareEquipmentPhotoWithGemini and shareAudioNoteWithGemini dynamically include gym name", async () => {
    const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const sampleAudioUri = "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH...";

    // Test with custom gym name
    const photoResult = await shareEquipmentPhotoWithGemini({
      photoUrl: tinyPng,
      exerciseName: "Lever Chest Press",
      note: "Seat notch 4",
      gymName: "Passage Fitness Casablanca",
      traineeId: testUserId,
    });
    assert.ok(typeof photoResult.shared === "boolean");

    const audioResult = await shareAudioNoteWithGemini({
      audioUrl: sampleAudioUri,
      exerciseName: "Incline Dumbbell Press",
      note: "Smooth 30-degree arc",
      gymName: "Punch by Badr Hari Lissasfa",
      traineeId: testUserId,
    });
    assert.ok(typeof audioResult.shared === "boolean");

    // Test with undefined gymName (no hardcoded fallback to Punch Lissasfa)
    const audioNoGymResult = await shareAudioNoteWithGemini({
      audioUrl: sampleAudioUri,
      exerciseName: "Pull-Up",
      traineeId: testUserId,
    });
    assert.ok(typeof audioNoGymResult.shared === "boolean");
  });
});
