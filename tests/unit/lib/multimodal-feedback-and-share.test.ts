import { test, describe } from "node:test";
import assert from "node:assert";
import { appStore } from "@/lib/store";
import { WorkoutSession } from "@/lib/types";
import { shareEquipmentPhotoWithGemini, shareAudioNoteWithGemini, urlToFile } from "@/lib/share-equipment";

describe("Multi-Modal Feedback (Audio Notes) & Gemini Photo/Audio Sharing", () => {
  test("persists exercise audio feedback and overall session audio debrief in WorkoutSession", () => {
    const sampleAudioUri = "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH...";
    const samplePhotoUri = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...";

    const sessionWithAudioAndPhoto: WorkoutSession = {
      id: "session_audio_share_test_1",
      traineeId: "trainee_alaa",
      programDayId: "week1_d0",
      programTitle: "Master 16-Week Protocol",
      dayLabel: "Monday Seated Upper Body",
      date: "2026-11-05",
      startedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      durationSec: 3600,
      liftingDurationSec: 2400,
      totalRestDurationSec: 800,
      warmupDurationSec: 300,
      cooldownDurationSec: 100,
      warmupCompleted: true,
      cooldownCompleted: true,
      // Overall session audio debrief recorded by trainee
      audioNoteUrl: sampleAudioUri,
      sessionNote: "Felt strong on pressing; left elbow was painless with 45-degree tuck.",
      setLogs: [
        {
          id: "set_chest_multimodal_1",
          exercisePrescriptionId: "ex_chest",
          exerciseName: "lever chest press",
          setIndex: 1,
          reps: 10,
          weightKg: 25,
          rirAchieved: 2,
          note: "Seat pin 4, grip handles low.",
          photoUrl: samplePhotoUri,
          audioNoteUrl: sampleAudioUri, // Exercise specific voice note
        },
      ],
      exerciseFeedbacks: [
        {
          exerciseName: "lever chest press",
          tag: "optimal",
          tags: ["optimal"],
          note: "Seat pin 4, grip handles low.",
          photoUrl: samplePhotoUri,
          audioNoteUrl: sampleAudioUri,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    appStore.saveSession(sessionWithAudioAndPhoto);
    const retrieved = appStore.getSessions("trainee_alaa").find((s) => s.id === "session_audio_share_test_1");

    assert.ok(retrieved, "Session must be stored in appStore");
    assert.strictEqual(retrieved?.audioNoteUrl, sampleAudioUri, "Session-level audio debrief must be preserved");
    assert.strictEqual(retrieved?.setLogs[0].audioNoteUrl, sampleAudioUri, "SetLog audioNoteUrl must be preserved");
    assert.strictEqual(retrieved?.exerciseFeedbacks?.[0].audioNoteUrl, sampleAudioUri, "ExerciseFeedback audioNoteUrl must be preserved");
  });

  test("urlToFile converts Base64 Data URL to real binary File for native OS sharing", async () => {
    // 1x1 transparent PNG data URI
    const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const file = await urlToFile(tinyPng, "lever_chest_press_setup.png");

    assert.ok(file instanceof File, "Must produce a real File instance");
    assert.strictEqual(file.name, "lever_chest_press_setup.png");
    assert.strictEqual(file.type, "image/png");
    assert.ok(file.size > 0, "File size must be greater than zero bytes");
  });

  test("shareEquipmentPhotoWithGemini falls back gracefully in non-browser/test environments", async () => {
    const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    
    const res = await shareEquipmentPhotoWithGemini({
      photoUrl: tinyPng,
      exerciseName: "0597: Lever Seated Hip Abduction",
      note: "Pad set on outer knee, pin 30kg",
      traineeId: "trainee_alaa",
    });

    assert.ok(typeof res.shared === "boolean");
    assert.ok(res.method === "native_share" || res.method === "clipboard_gemini" || res.method === "download_gemini");
  });

  test("shareAudioNoteWithGemini converts voice note to audio File and falls back gracefully", async () => {
    const sampleAudioUri = "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH...";

    const res = await shareAudioNoteWithGemini({
      audioUrl: sampleAudioUri,
      exerciseName: "lever chest press",
      note: "Elbow path felt pain free",
      traineeId: "trainee_alaa",
    });

    assert.ok(typeof res.shared === "boolean");
    assert.ok(res.method === "native_share" || res.method === "download_gemini");
  });

  test("shareAudioNoteWithGemini handles overall workout debrief sharing", async () => {
    const sampleAudioUri = "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH...";

    const res = await shareAudioNoteWithGemini({
      audioUrl: sampleAudioUri,
      sessionTitle: "Thursday Glute & Hamstring Session",
      traineeId: "trainee_alaa",
    });

    assert.ok(typeof res.shared === "boolean");
    assert.ok(res.method === "native_share" || res.method === "download_gemini");
  });
});
