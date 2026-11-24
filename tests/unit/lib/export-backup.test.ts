import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { appStore } from "../../../src/lib/store";
import { serializeBackupJson } from "../../../src/lib/storage";
import {
  buildFullTraineeExportPayload,
  buildFullTraineeExportPayloadAsync,
  isBase64ImageDataUri,
} from "../../../src/lib/export-backup";
import { WorkoutSession } from "../../../src/lib/types";

describe("Complete Backup Export & Per-Set Equipment Photo Persistence", () => {
  const sampleTinyPngBase64 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const sampleLargeJpegBase64 = `data:image/jpeg;base64,${"A".repeat(48_000)}`;

  it("propagates equipment photo (including Base64) onto EVERY SetLog and never truncates multi-session exports", () => {
    const testUserId = "trainee_alaa";

    // Simulate Monday session where only exerciseFeedbacks had the photo on lever chest press,
    // and Set 1/Set 2 of lever incline chest press missed photoUrl while Set 3 had it,
    // plus Thursday session so we verify no mid-Monday cutoff occurs.
    const mondaySession: WorkoutSession = {
      id: "sess_export_mon_test",
      traineeId: testUserId,
      programDayId: "prog_master_w1_d0",
      programTitle: "5-Day Custom Protocol",
      dayLabel: "Monday Upper Push",
      date: "2026-11-23",
      startedAt: "2026-11-23T12:05:00.000Z",
      endedAt: "2026-11-23T12:42:00.000Z",
      durationSec: 2220,
      setLogs: [
        {
          id: "mon_s1",
          exercisePrescriptionId: "prog_master_w1_d0_ep1",
          exerciseName: "lever chest press",
          setIndex: 1,
          reps: 10,
          weightKg: 40,
          rirAchieved: 2,
          feedbackTag: "optimal",
          // intentionally missing photoUrl on Set 1
        },
        {
          id: "mon_s2",
          exercisePrescriptionId: "prog_master_w1_d0_ep1",
          exerciseName: "lever chest press",
          setIndex: 2,
          reps: 12,
          weightKg: 40,
          rirAchieved: 1,
          isPR: true,
          feedbackTag: "optimal",
          // intentionally missing photoUrl on Set 2
        },
        {
          id: "mon_s3",
          exercisePrescriptionId: "prog_master_w1_d0_ep2",
          exerciseName: "lever incline chest press",
          setIndex: 1,
          reps: 8,
          weightKg: 20,
          rirAchieved: 3,
          // intentionally missing photoUrl; Set 2 below carries it
        },
        {
          id: "mon_s4",
          exercisePrescriptionId: "prog_master_w1_d0_ep2",
          exerciseName: "lever incline chest press",
          setIndex: 2,
          reps: 9,
          weightKg: 20,
          rirAchieved: 2,
          photoUrl: sampleTinyPngBase64,
        },
      ],
      exerciseFeedbacks: [
        {
          exerciseName: "lever chest press",
          tag: "optimal",
          photoUrl: sampleLargeJpegBase64,
        },
      ],
    };

    const thursdaySession: WorkoutSession = {
      id: "sess_export_thu_test",
      traineeId: testUserId,
      programDayId: "prog_master_w1_d3",
      programTitle: "5-Day Custom Protocol",
      dayLabel: "Thursday Hinge & Glutes",
      date: "2026-11-26",
      startedAt: "2026-11-26T12:05:00.000Z",
      endedAt: "2026-11-26T12:42:00.000Z",
      durationSec: 2220,
      setLogs: [
        {
          id: "thu_s1",
          exercisePrescriptionId: "prog_master_w1_d3_ep1",
          exerciseName: "dumbbell romanian deadlift",
          setIndex: 1,
          reps: 12,
          weightKg: 30,
          rirAchieved: 2,
          photoUrl: sampleLargeJpegBase64,
        },
      ],
    };

    // Log a supplement dose & hydration entry so full data coverage can be checked
    appStore.logHydration(testUserId, 500, "2026-11-23");

    const payload = buildFullTraineeExportPayload(testUserId, {
      extraSessions: [mondaySession, thursdaySession],
    });

    // 1. Verify full data categories are included
    assert.equal(payload.schemaVersion, "2.1.0");
    assert.equal(payload.user.id, testUserId);
    assert.ok(payload.activeProgram, "Export must include activeProgram");
    assert.equal(payload.activeProgram?.id, "prog_master_5day_v2");
    assert.ok(payload.programs.length >= 1, "Export must include programs");
    assert.ok(payload.metrics.length >= 14, "Export must include body weight metrics");
    assert.ok(payload.supplementProtocols.length >= 1, "Export must include supplementProtocols");
    assert.ok(payload.hydrationGoals.length >= 1, "Export must include hydrationGoals");
    assert.ok(payload.hydrationLogs.length >= 1, "Export must include hydrationLogs");
    assert.ok(payload.gymLocations.length >= 1, "Export must include gymLocations");
    assert.ok(payload.athleteModel, "Export must include athleteModel");

    // 2. Verify both Monday AND Thursday sessions exist cleanly without cutoff
    const exportedMon = payload.sessions.find((s) => s.id === "sess_export_mon_test");
    const exportedThu = payload.sessions.find((s) => s.id === "sess_export_thu_test");
    assert.ok(exportedMon, "Monday session must be exported");
    assert.ok(exportedThu, "Thursday session must NOT be truncated after Monday sets");
    assert.equal(exportedMon.setLogs.length, 4, "All 4 Monday sets must be present");

    // 3. Verify EVERY set has its equipment picture when available for that exercise
    for (const set of exportedMon.setLogs) {
      assert.ok(set.photoUrl, `Set ${set.id} (${set.exerciseName}) must carry photoUrl`);
      assert.ok(set.equipmentPhotoUrl, `Set ${set.id} must carry equipmentPhotoUrl`);
      assert.ok(
        isBase64ImageDataUri(set.equipmentPhotoBase64),
        `Set ${set.id} must carry equipmentPhotoBase64 when Base64 image is available`
      );
    }

    assert.equal(exportedMon.setLogs[0].photoUrl, sampleLargeJpegBase64);
    assert.equal(exportedMon.setLogs[1].photoUrl, sampleLargeJpegBase64);
    assert.equal(exportedMon.setLogs[2].photoUrl, sampleTinyPngBase64);
    assert.equal(exportedMon.setLogs[3].photoUrl, sampleTinyPngBase64);
    assert.equal(exportedThu.setLogs[0].photoUrl, sampleLargeJpegBase64);

    // 4. Verify serialized JSON is compact (no 2-space whitespace bloat on Base64 media) and 100% parseable
    const serialized = serializeBackupJson(payload);
    assert.equal(serialized.includes("\n  \"schemaVersion\""), false, "Media-containing export should serialize compactly to prevent truncation");
    const reparsed = JSON.parse(serialized);
    assert.equal(
      reparsed.sessions.find((s: WorkoutSession) => s.id === "sess_export_thu_test").setLogs[0].weightKg,
      30
    );
    assert.ok(payload.equipmentPhotosCatalog.length >= 2);
    assert.equal(payload.exportSummary.setsWithEquipmentPhotoCount >= 5, true);
  });

  it("async export converts cloud photo URLs into Base64 per set with single-pass deduplication cache", async () => {
    const cloudPhotoUrl = "https://storage.googleapis.com/vyra-bucket/trainee_alaa/chest_press.jpg";
    const resolvedBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/";

    let resolverCalls = 0;
    const sessionWithCloudUrl: WorkoutSession = {
      id: "sess_cloud_url_export",
      traineeId: "trainee_alaa",
      programDayId: "prog_master_w1_d0",
      programTitle: "5-Day Custom Protocol",
      dayLabel: "Monday Upper Push",
      date: "2026-11-24",
      startedAt: "2026-11-24T12:05:00.000Z",
      durationSec: 1900,
      setLogs: [
        {
          id: "c_s1",
          exercisePrescriptionId: "prog_master_w1_d0_ep1",
          exerciseName: "lever chest press",
          setIndex: 1,
          reps: 10,
          weightKg: 40,
          rirAchieved: 2,
          photoUrl: cloudPhotoUrl,
        },
        {
          id: "c_s2",
          exercisePrescriptionId: "prog_master_w1_d0_ep1",
          exerciseName: "lever chest press",
          setIndex: 2,
          reps: 10,
          weightKg: 40,
          rirAchieved: 2,
          // no photoUrl originally, should inherit from Set 1 AND resolve to Base64
        },
      ],
    };

    const payload = await buildFullTraineeExportPayloadAsync("trainee_alaa", {
      extraSessions: [sessionWithCloudUrl],
      photoDataResolver: async (uri) => {
        if (uri === cloudPhotoUrl) {
          resolverCalls++;
          return resolvedBase64;
        }
        return uri;
      },
    });

    assert.equal(resolverCalls, 1, "Unique photo URL must only be resolved once via cache even across multiple sets");

    const exportedSess = payload.sessions.find((s) => s.id === "sess_cloud_url_export");
    assert.ok(exportedSess);
    assert.equal(exportedSess.setLogs[0].photoUrl, resolvedBase64);
    assert.equal(exportedSess.setLogs[0].equipmentPhotoBase64, resolvedBase64);
    assert.equal(exportedSess.setLogs[0].equipmentPhotoUrl, cloudPhotoUrl);
    assert.equal(exportedSess.setLogs[1].photoUrl, resolvedBase64);
    assert.equal(exportedSess.setLogs[1].equipmentPhotoBase64, resolvedBase64);
  });

  it("losslessly preserves set notes, voice notes, embedded transcripts, and generates audioNotesCatalog", async () => {
    const testUserId = "trainee_alaa";
    const sampleAudioUri = "data:audio/webm;codecs=opus;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwE=";
    const sampleAudioTranscript = "Excellente contraction sur la dernière rep avec 2s d'arrêt";

    const partialSessionA: WorkoutSession = {
      id: "sess_voice_notes_merge_test",
      traineeId: testUserId,
      programDayId: "prog_master_w1_d1",
      programTitle: "5-Day Custom Protocol",
      dayLabel: "Tuesday Pull Focus",
      date: "2026-11-24",
      startedAt: "2026-11-24T12:19:00.000Z",
      endedAt: "2026-11-24T12:45:00.000Z",
      durationSec: 1569,
      notes: "Workout felt strong overall, left elbow stable",
      sessionNote: "Workout felt strong overall, left elbow stable",
      audioNoteUrl: sampleAudioUri,
      audioTranscript: "Séance terminée en 26 minutes sans douleur",
      setLogs: [
        {
          id: "s_vn_1",
          exercisePrescriptionId: "ep_pull_1",
          exerciseName: "lat pulldown",
          setIndex: 1,
          reps: 10,
          weightKg: 40,
          rirAchieved: 2,
          // Missing note and audio in this copy
        },
        {
          id: "s_vn_2",
          exercisePrescriptionId: "ep_pull_1",
          exerciseName: "lat pulldown",
          setIndex: 2,
          reps: 10,
          weightKg: 40,
          rirAchieved: 1,
          note: "Form felt dialed, scapular retraction held 1s",
        },
      ],
      exerciseFeedbacks: [
        {
          exerciseName: "lat pulldown",
          tag: "optimal",
          note: "Scapular depression initiator worked wonders",
          audioNoteUrl: sampleAudioUri,
          audioTranscript: sampleAudioTranscript,
        },
      ],
    };

    const partialSessionB: WorkoutSession = {
      id: "sess_voice_notes_merge_test",
      traineeId: testUserId,
      programDayId: "prog_master_w1_d1",
      programTitle: "5-Day Custom Protocol",
      dayLabel: "Tuesday Pull Focus",
      date: "2026-11-24",
      startedAt: "2026-11-24T12:19:00.000Z",
      endedAt: "2026-11-24T12:45:00.000Z",
      durationSec: 1569,
      setLogs: [
        {
          id: "s_vn_1",
          exercisePrescriptionId: "ep_pull_1",
          exerciseName: "lat pulldown",
          setIndex: 1,
          reps: 10,
          weightKg: 40,
          rirAchieved: 2,
          note: "Warmup set felt easy",
          audioNoteUrl: sampleAudioUri,
          audioTranscript: "Première série propre",
        },
        {
          id: "s_vn_2",
          exercisePrescriptionId: "ep_pull_1",
          exerciseName: "lat pulldown",
          setIndex: 2,
          reps: 10,
          weightKg: 40,
          rirAchieved: 1,
          // Missing note in this copy; should be retained from partialSessionA
        },
      ],
    };

    const payload = await buildFullTraineeExportPayloadAsync(testUserId, {
      extraSessions: [partialSessionA, partialSessionB],
    });

    const exported = payload.sessions.find((s) => s.id === "sess_voice_notes_merge_test");
    assert.ok(exported, "Merged session must be exported");
    assert.equal(exported.notes, "Workout felt strong overall, left elbow stable");
    assert.equal(exported.audioTranscript, "Séance terminée en 26 minutes sans douleur");

    // Check set 1: retains audioNoteUrl & note from copy B
    const set1 = exported.setLogs.find((s) => s.setIndex === 1);
    assert.ok(set1);
    assert.equal(set1.note, "Warmup set felt easy");
    assert.ok(set1.audioNoteUrl);
    assert.equal(set1.audioTranscript, "Première série propre");

    // Check set 2: retains note from copy A
    const set2 = exported.setLogs.find((s) => s.setIndex === 2);
    assert.ok(set2);
    assert.equal(set2.note, "Form felt dialed, scapular retraction held 1s");

    // Audio catalog check
    assert.ok(payload.audioNotesCatalog.length >= 2, "Must catalog session and set/feedback audio notes");
    const sessionAudioEntry = payload.audioNotesCatalog.find((a) => a.source === "session");
    assert.ok(sessionAudioEntry);
    assert.equal(sessionAudioEntry.sessionId, "sess_voice_notes_merge_test");
    assert.equal(sessionAudioEntry.transcript, "Séance terminée en 26 minutes sans douleur");

    // Summary counts check
    assert.ok(payload.exportSummary.setsWithNotesCount >= 2, "Must count sets with text notes");
    assert.ok(payload.exportSummary.setsWithAudioNotesCount >= 1, "Must count sets with voice notes");
    assert.ok(payload.exportSummary.uniqueAudioNotesCount >= 1, "Must count unique voice notes");
  });
});
