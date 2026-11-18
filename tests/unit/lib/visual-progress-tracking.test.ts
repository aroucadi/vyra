import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { __setMockFirebaseAdminForTesting } from "../../../src/lib/firebase/admin";
import { ALAA_CANONICAL_EMAIL } from "../../../src/lib/auth/server-session";
import {
  STANDARDIZED_POSE_GUIDES,
  detectStandardizedFaceBoundingBox,
  anonymizeProgressPhoto,
  verifySnapshotPrivacyCompliance,
  aggregateWorkoutHistoryBetweenSnapshots,
  analyzeVisualProgressEvolution,
  visualProgressStore,
  VisualProgressStore,
  VisualProgressSnapshot,
  extractPhotoCaptureDateMetadata,
  resolveHistoricalPhotoPrefill,
  createExifTaggedPhotoDataUri,
  extractMultimodalSnapshotPart,
  VISUAL_EVOLUTION_RESPONSE_SCHEMA,
  stripBinaryExifAndMetadata,
  containsExifOrGpsMetadata,
  expandFaceBoundingBoxWithMargin,
  registerCrossBrowserWasmFaceDetector,
} from "../../../src/lib/ai/visual-progress";
import { getStoredSnapshotBlob } from "../../../src/lib/storage";
import {
  GET as getVisualProgressRoute,
  POST as postVisualProgressRoute,
  DELETE as deleteVisualProgressRoute,
} from "../../../src/app/api/ai/visual-progress/route";
import { WorkoutSession, BodyMetricEntry } from "../../../src/lib/types";

function createTestSession(
  id: string,
  date: string,
  sets: Array<{ exerciseName: string; weightKg: number; reps: number; isPR?: boolean }>
): WorkoutSession {
  return {
    id,
    traineeId: "trainee_alaa",
    programDayId: "day_1",
    programTitle: "16-Week Hypertrophy Architecture",
    dayLabel: "Upper Push & Delts",
    date,
    startedAt: `${date}T18:00:00.000Z`,
    endedAt: `${date}T18:50:00.000Z`,
    durationSec: 3000,
    setLogs: sets.map((s, idx) => ({
      id: `${id}_set_${idx + 1}`,
      exercisePrescriptionId: `ep_${idx + 1}`,
      exerciseName: s.exerciseName,
      setIndex: idx + 1,
      weightKg: s.weightKg,
      reps: s.reps,
      rirAchieved: 1,
      isPR: s.isPR ?? false,
    })),
  };
}

describe("AI-Powered Visual Progress Tracking, Privacy-First Face Anonymization & Workout Correlation Suite", () => {
  beforeEach(() => {
    visualProgressStore.resetForTesting("trainee_alaa");
    __setMockFirebaseAdminForTesting({
      auth: {
        verifyIdToken: async (token: string) => {
          if (token === "tok_alaa_visual") {
            return {
              uid: "fb_alaa_visual",
              email: ALAA_CANONICAL_EMAIL,
              email_verified: true,
              firebase: { identities: {}, sign_in_provider: "password" },
            };
          }
          if (token === "tok_omar_visual") {
            return {
              uid: "trainee_friend_omar",
              email: "omar@example.com",
              email_verified: true,
              firebase: { identities: {}, sign_in_provider: "password" },
            };
          }
          throw new Error("Invalid token");
        },
        verifySessionCookie: async () => {
          throw new Error("Invalid cookie");
        },
      },
    });
  });

  afterEach(() => {
    __setMockFirebaseAdminForTesting(null);
  });

  it("1. defines all 4 standardized posture guides and supports cadence intervals (weekly, biweekly, monthly)", () => {
    const poseKeys = Object.keys(STANDARDIZED_POSE_GUIDES);
    assert.deepEqual(poseKeys, [
      "front_relaxed",
      "side_posture",
      "back_relaxed",
      "front_double_biceps",
    ]);

    for (const key of poseKeys) {
      const guide = STANDARDIZED_POSE_GUIDES[key as keyof typeof STANDARDIZED_POSE_GUIDES];
      assert.ok(guide.cameraHeightCue.length > 10);
      assert.ok(guide.stanceCue.length > 10);
      assert.ok(guide.whatItTracks.length >= 3);
    }

    assert.equal(visualProgressStore.getCadence(), "biweekly");
    visualProgressStore.setCadence("weekly");
    assert.equal(visualProgressStore.getCadence(), "weekly");
    visualProgressStore.setCadence("monthly");
    assert.equal(visualProgressStore.getCadence(), "monthly");
  });

  it("2. enforces privacy-first face anonymization preprocessing and blocks un-anonymized snapshots", async () => {
    const rawUnmaskedDataUri = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/";
    const { anonymizedImageUrl, proof } = await anonymizeProgressPhoto({
      rawImageDataUri: rawUnmaskedDataUri,
      poseId: "front_relaxed",
      milestoneLabel: "Week 6 Check-In",
      weightKg: 53.8,
    });

    assert.equal(proof.isAnonymized, true);
    assert.equal(proof.scrubbedExif, true);
    assert.ok(proof.faceRegionRedacted.width >= 0.2);
    assert.ok(proof.faceRegionRedacted.height >= 0.15);
    assert.ok(
      anonymizedImageUrl.includes("FACE%20ANONYMIZED") ||
        anonymizedImageUrl.includes("privacy-face-shield")
    );

    // Verify compliance passes on anonymized snapshot
    const compliantSnap: VisualProgressSnapshot = {
      id: "snap_valid",
      traineeId: "trainee_alaa",
      date: "2026-11-01",
      capturedAt: "2026-11-01T08:00:00Z",
      poseId: "front_relaxed",
      milestoneLabel: "Week 6",
      weekIndex: 6,
      anonymizedImageUrl,
      anonymization: proof,
      lightingScore: 95,
      postureAlignmentScore: 88,
    };
    assert.equal(verifySnapshotPrivacyCompliance(compliantSnap).compliant, true);

    // Tampered / un-anonymized snapshot must be rejected by the privacy gate
    const unAnonymizedSnap: VisualProgressSnapshot = {
      ...compliantSnap,
      id: "snap_unsafe",
      anonymization: {
        ...proof,
        isAnonymized: false,
      },
    };
    const check = verifySnapshotPrivacyCompliance(unAnonymizedSnap);
    assert.equal(check.compliant, false);
    assert.ok(check.reason?.includes("missing mandatory on-device face anonymization"));

    await assert.rejects(
      async () => {
        await analyzeVisualProgressEvolution({
          traineeId: "trainee_alaa",
          snapshotA: compliantSnap,
          snapshotB: unAnonymizedSnap,
          sessions: [],
        });
      },
      /Privacy Gate Violation/
    );
  });

  it("3. connects visual milestones to exact workout history, volume, muscle groups, and consistency between Date A and Date B", () => {
    const sessions: WorkoutSession[] = [
      // Outside window (before Date A)
      createTestSession("s_before", "2026-09-15", [
        { exerciseName: "Barbell Bench Press", weightKg: 40, reps: 8 },
      ]),
      // Inside window [2026-10-01 -> 2026-10-29]
      createTestSession("s_1", "2026-10-03", [
        { exerciseName: "Incline Dumbbell Press", weightKg: 24, reps: 10 },
        { exerciseName: "Incline Dumbbell Press", weightKg: 24, reps: 10 },
        { exerciseName: "Cable Lateral Raise", weightKg: 10, reps: 14 },
        { exerciseName: "Cable Lateral Raise", weightKg: 10, reps: 14 },
      ]),
      createTestSession("s_2", "2026-10-12", [
        { exerciseName: "Incline Dumbbell Press", weightKg: 26, reps: 10, isPR: true },
        { exerciseName: "Incline Dumbbell Press", weightKg: 26, reps: 10 },
        { exerciseName: "Seated Cable Row", weightKg: 45, reps: 12 },
        { exerciseName: "Seated Cable Row", weightKg: 45, reps: 12 },
      ]),
      createTestSession("s_3", "2026-10-25", [
        { exerciseName: "Incline Dumbbell Press", weightKg: 28, reps: 10, isPR: true },
        { exerciseName: "Cable Lateral Raise", weightKg: 12.5, reps: 15, isPR: true },
        { exerciseName: "Standing Cable Face Pull", weightKg: 25, reps: 15 },
      ]),
      // Outside window (after Date B)
      createTestSession("s_after", "2026-11-08", [
        { exerciseName: "Barbell Back Squat", weightKg: 80, reps: 8 },
      ]),
    ];

    const metrics: BodyMetricEntry[] = [
      { id: "m1", traineeId: "trainee_alaa", date: "2026-10-01", weightKg: 51.8, source: "manual" },
      { id: "m2", traineeId: "trainee_alaa", date: "2026-10-28", weightKg: 53.4, source: "manual" },
    ];

    const summary = aggregateWorkoutHistoryBetweenSnapshots({
      fromDate: "2026-10-01",
      toDate: "2026-10-29",
      sessions,
      metrics,
      plannedSessionsPerWeek: 1,
    });

    assert.equal(summary.sessionsCompleted, 3, "Must only count sessions inside [fromDate, toDate]");
    assert.equal(summary.totalSetsCompleted, 11);
    assert.equal(summary.prsUnlocked, 3);
    assert.equal(summary.weightStartKg, 51.8);
    assert.equal(summary.weightEndKg, 53.4);
    assert.equal(summary.weightDeltaKg, 1.6);
    assert.ok(summary.totalVolumeKg > 2500);
    assert.ok(summary.muscleGroupBreakdown.length >= 3);

    const topHighlight = summary.topExerciseHighlights.find(
      (h) => h.exerciseName === "Incline Dumbbell Press"
    );
    assert.ok(topHighlight, "Must track Incline Dumbbell Press progression across sessions");
    assert.equal(topHighlight.sessionsPerformed, 3);
    assert.equal(topHighlight.setsCompleted, 5);
    assert.equal(topHighlight.loadDeltaKg, 4);
  });

  it("4. generates empathetic visual comparison reports highlighting major shifts, subtle micro-wins, causal training links, and 1-tap program adjustments", async () => {
    const snapshots = visualProgressStore.getSnapshots("trainee_alaa", "side_posture");
    assert.ok(snapshots.length >= 3);

    const sessions: WorkoutSession[] = [
      createTestSession("s_w2", snapshots[0].date, [
        { exerciseName: "Incline Dumbbell Press", weightKg: 24, reps: 10 },
        { exerciseName: "Seated Cable Row", weightKg: 40, reps: 12 },
        { exerciseName: "Cable Lateral Raise", weightKg: 10, reps: 15 },
      ]),
      createTestSession("s_w6", snapshots[1].date, [
        { exerciseName: "Incline Dumbbell Press", weightKg: 28, reps: 10, isPR: true },
        { exerciseName: "Seated Cable Row", weightKg: 47.5, reps: 12, isPR: true },
        { exerciseName: "Cable Lateral Raise", weightKg: 12.5, reps: 15, isPR: true },
      ]),
    ];

    const report = await analyzeVisualProgressEvolution({
      traineeId: "trainee_alaa",
      snapshotA: snapshots[0],
      snapshotB: snapshots[snapshots.length - 1],
      sessions,
    });

    assert.equal(report.privacyVerification.bothSnapshotsAnonymized, true);
    assert.equal(report.privacyVerification.zeroFacialDataShared, true);
    assert.ok(report.visualObservations.length >= 3);

    // Must include subtle micro-level change detection
    const microWin = report.visualObservations.find((o) => o.magnitude === "subtle_micro");
    assert.ok(microWin, "Must detect subtle micro-level physical evolution");
    assert.ok(microWin.linkedTrainingDriver.length > 10);

    // Must include postural evolution analysis
    assert.ok(report.posturalEvolutionSummary.alignmentScoreDelta > 0);
    assert.ok(report.causalLinks.length >= 2);
    assert.ok(report.programAdjustments.length >= 2);
  });

  it("5. exposes GET and POST /api/ai/visual-progress routes for timeline retrieval, anonymized capture, and milestone comparison", async () => {
    const getReq = new NextRequest(
      "http://localhost:3000/api/ai/visual-progress?traineeId=trainee_alaa&poseId=front_relaxed",
      { headers: { Authorization: "Bearer tok_alaa_visual" } }
    );
    const getRes = await getVisualProgressRoute(getReq);
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.ok, true);
    assert.equal(getData.poseId, "front_relaxed");
    assert.ok(Array.isArray(getData.snapshots));
    assert.ok(getData.snapshots.length >= 3);
    assert.ok(getData.comparisonReport);

    // Test POST action="capture" with raw image -> verifies automatic anonymization
    const captureReq = new Request("http://localhost:3000/api/ai/visual-progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer tok_alaa_visual",
      },
      body: JSON.stringify({
        action: "capture",
        traineeId: "trainee_alaa",
        poseId: "front_relaxed",
        rawImageDataUri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        milestoneLabel: "Week 12 Milestone",
        weekIndex: 12,
        weightKg: 55.6,
      }),
    });

    const captureRes = await postVisualProgressRoute(captureReq);
    assert.equal(captureRes.status, 200);
    const captureData = await captureRes.json();
    assert.equal(captureData.ok, true);
    assert.equal(captureData.capturedSnapshot.anonymization.isAnonymized, true);
    assert.equal(captureData.capturedSnapshot.anonymization.scrubbedExif, true);
    assert.equal(captureData.comparisonReport.snapshotB.milestoneLabel, "Week 12 Milestone");
  });

  it("6. extracts photo capture date from embedded EXIF DateTimeOriginal, camera roll filenames, and file timestamps before scrubbing EXIF", () => {
    // A. Genuine binary EXIF DateTimeOriginal header inside JPEG Data URI
    const exifDataUri = createExifTaggedPhotoDataUri("2026:10:18 09:42:15");
    const exifResult = extractPhotoCaptureDateMetadata({
      rawImageDataUri: exifDataUri,
      fileName: "random_upload.jpg",
    });
    assert.equal(exifResult.detectedDate, "2026-10-18");
    assert.equal(exifResult.source, "exif_datetime_original");
    assert.ok(exifResult.confidence >= 0.95);

    // B. Mobile camera roll filename pattern when EXIF was stripped by messaging app
    const filenameResult = extractPhotoCaptureDateMetadata({
      rawImageDataUri: "data:image/png;base64,iVBORw0KGgo=",
      fileName: "IMG_20261014_073011.jpg",
    });
    assert.equal(filenameResult.detectedDate, "2026-10-14");
    assert.equal(filenameResult.source, "filename_pattern");

    // C. Browser File.lastModified epoch timestamp fallback
    const mtimeEpoch = new Date("2026-10-21T10:15:00.000Z").getTime();
    const mtimeResult = extractPhotoCaptureDateMetadata({
      rawImageDataUri: "data:image/png;base64,iVBORw0KGgo=",
      fileName: "photo.png",
      fileLastModifiedMs: mtimeEpoch,
    });
    assert.equal(mtimeResult.detectedDate, "2026-10-21");
    assert.equal(mtimeResult.source, "file_last_modified");

    // D. Manual required when no metadata exists
    const manualResult = extractPhotoCaptureDateMetadata({
      rawImageDataUri: "data:image/png;base64,iVBORw0KGgo=",
      fileName: "avatar.png",
    });
    assert.equal(manualResult.detectedDate, null);
    assert.equal(manualResult.source, "manual_required");
  });

  it("7. prefills historical training week, closest logged bodyweight, and cumulative workouts when uploading past photos", async () => {
    const metrics: BodyMetricEntry[] = [
      { id: "m_w1", traineeId: "trainee_alaa", date: "2026-10-12", weightKg: 51.8, source: "manual" },
      { id: "m_w2", traineeId: "trainee_alaa", date: "2026-10-19", weightKg: 52.4, source: "manual" },
      { id: "m_w4", traineeId: "trainee_alaa", date: "2026-11-02", weightKg: 53.5, source: "manual" },
    ];
    const sessions: WorkoutSession[] = [
      createTestSession("s1", "2026-10-13", [{ exerciseName: "Incline Dumbbell Press", weightKg: 24, reps: 10 }]),
      createTestSession("s2", "2026-10-16", [{ exerciseName: "Seated Cable Row", weightKg: 45, reps: 12 }]),
      createTestSession("s3", "2026-10-28", [{ exerciseName: "Incline Dumbbell Press", weightKg: 28, reps: 10 }]),
    ];

    const prefill = resolveHistoricalPhotoPrefill({
      captureDate: "2026-10-18",
      programStartDate: "2026-10-12",
      metrics,
      sessions,
    });

    assert.equal(prefill.inferredWeekIndex, 1);
    assert.equal(prefill.isHistoricalBackfill, true);
    assert.equal(prefill.closestWeightKg, 52.4, "Should match nearest weigh-in on 2026-10-19");
    assert.equal(prefill.weightMatchSource, "nearest_weigh_in");
    assert.equal(prefill.sessionsCompletedUpToDate, 2, "Should count only the 2 sessions completed on or before Oct 18");

    // Verify POST /api/ai/visual-progress with action="extract_metadata"
    const metaReq = new Request("http://localhost:3000/api/ai/visual-progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer tok_alaa_visual",
      },
      body: JSON.stringify({
        action: "extract_metadata",
        traineeId: "trainee_alaa",
        rawImageDataUri: createExifTaggedPhotoDataUri("2026:10:18 08:15:00"),
        programStartDate: "2026-10-12",
        metrics,
        sessions,
      }),
    });
    const metaRes = await postVisualProgressRoute(metaReq);
    assert.equal(metaRes.status, 200);
    const metaJson = await metaRes.json();
    assert.equal(metaJson.ok, true);
    assert.equal(metaJson.metadata.detectedDate, "2026-10-18");
    assert.equal(metaJson.metadata.source, "exif_datetime_original");
    assert.equal(metaJson.prefill.closestWeightKg, 52.4);

    // Verify uploading a past photo with EXIF auto-populates date/weight/week, anonymizes face, and sorts chronologically
    const pastExifCaptureReq = new Request("http://localhost:3000/api/ai/visual-progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer tok_alaa_visual",
      },
      body: JSON.stringify({
        action: "capture",
        traineeId: "trainee_alaa",
        poseId: "front_relaxed",
        rawImageDataUri: createExifTaggedPhotoDataUri("2026:10:18 08:15:00"),
        programStartDate: "2026-10-12",
        metrics,
        sessions,
      }),
    });
    const pastCaptureRes = await postVisualProgressRoute(pastExifCaptureReq);
    assert.equal(pastCaptureRes.status, 200);
    const pastCaptureData = await pastCaptureRes.json();
    assert.equal(pastCaptureData.capturedSnapshot.date, "2026-10-18");
    assert.equal(pastCaptureData.capturedSnapshot.weightKg, 52.4);
    assert.equal(pastCaptureData.capturedSnapshot.isHistoricalImport, true);
    assert.equal(pastCaptureData.capturedSnapshot.metadataDateSource, "exif_datetime_original");
    assert.equal(pastCaptureData.capturedSnapshot.anonymization.isAnonymized, true);
    assert.equal(pastCaptureData.capturedSnapshot.anonymization.scrubbedExif, true);

    // Confirm snapshots array is sorted chronologically
    const dates = pastCaptureData.snapshots.map((s: VisualProgressSnapshot) => s.date);
    const sortedDates = [...dates].sort((a, b) => a.localeCompare(b));
    assert.deepEqual(dates, sortedDates, "Historical photos must be inserted in strict chronological order");
  });

  it("8. [Plumbing Test — Mock Vision Analyzer, Vision Quality Untested] builds gemini-4-argon high-resolution request payload and parses structured multimodal JSON schema", async () => {
    const snapshots = visualProgressStore.getSnapshots("trainee_alaa", "front_relaxed");
    const snapA = snapshots[0];
    const snapB = snapshots[snapshots.length - 1];

    const partA = extractMultimodalSnapshotPart(snapA, "high");
    const partB = extractMultimodalSnapshotPart(snapB, "high");
    assert.equal(partA.resolution, "high");
    assert.equal(partB.resolution, "high");
    assert.ok(partA.base64Data.length > 50);
    assert.ok(
      (partB.extractedFrameGeometry.shoulderHalfWidthPx ?? 0) >
        (partA.extractedFrameGeometry.shoulderHalfWidthPx ?? 0),
      "Must extract actual silhouette shoulder width expansion from frame geometry"
    );

    const sessions: WorkoutSession[] = [
      createTestSession("s_auto_1", snapA.date, [
        { exerciseName: "Incline Dumbbell Press", weightKg: 26, reps: 10 },
      ]),
    ];

    const report = await analyzeVisualProgressEvolution({
      traineeId: "trainee_alaa",
      snapshotA: snapA,
      snapshotB: snapB,
      sessions,
      visionAnalyzer: async (req) => {
        assert.equal(req.model, "gemini-4-argon");
        assert.equal(req.mediaResolution, "high");
        assert.equal(req.responseSchema, VISUAL_EVOLUTION_RESPONSE_SCHEMA);
        assert.ok(req.prompt.includes("Gemini 4 Argon"));
        assert.ok(req.snapshotAPart.base64Data.length > 0);
        assert.ok(req.snapshotBPart.base64Data.length > 0);

        return JSON.stringify({
          empatheticHeadline:
            "Autonomous Gemini 4 Argon Scan: +11.4% Clavicular Width & Corrected Left Scapular Tilt",
          executiveSummary:
            "Multimodal spatial comparison confirms upper-chest shelf hypertrophy and resolved left-side acromial drop.",
          visualObservations: [
            {
              id: "argon_obs_1",
              category: "muscle_development",
              region: "Clavicular Pectoralis & Side Deltoid",
              headline: "Autonomous Detection: Upper-Sternal Shelf Expansion",
              observation:
                "Frame-to-frame contour registration shows a +11.4% increase in clavicular width and rounder lateral deltoid caps.",
              magnitude: "major",
              linkedTrainingDriver: "Progressive overload on Incline Dumbbell Press (26 kg × 10).",
              confidenceScore: 0.97,
            },
          ],
          posturalEvolutionSummary: {
            pelvicTiltTrend: "Neutral pelvic lock achieved (-6° anterior tilt)",
            ribCageStackTrend: "Costal arch stacked cleanly over pelvis",
            shoulderSymmetryTrend: "Left acromion elevated +4mm to match right side",
            alignmentScoreDelta: 15,
          },
          causalLinks: [
            {
              visualOutcome: "+11.4% clavicular width",
              trainingEvidence: "Incline Dumbbell Press progression",
              consistencyImpact: "100% session adherence",
            },
          ],
          programAdjustments: [
            {
              id: "argon_adj_1",
              title: "Target Lengthened-Range Posterior Deltoid Sweep",
              targetMuscleOrPosture: "Posterior Deltoid & Rhomboids",
              rationale: "Front shelf grew rapidly; add reverse cable flyes to maintain 3D shoulder balance.",
              actionType: "add_corrective_sets",
              currentExerciseName: "Standing Cable Face Pull",
              recommendedExerciseName: "Single-Arm Cross-Body Cable Rear Delt Fly",
              prescribedSetsReps: "3 Sets × 15 Reps (Left-Arm Leader)",
            },
          ],
        });
      },
    });

    assert.equal(report.modelUsed, "gemini-4-argon");
    assert.equal(report.mediaResolution, "high");
    assert.equal(report.analysisEngine, "gemini_4_argon_live_multimodal");
    assert.equal(report.visualObservations[0].id, "argon_obs_1");
    assert.equal(
      report.visualObservations[0].headline,
      "Autonomous Detection: Upper-Sternal Shelf Expansion"
    );
    assert.equal(report.posturalEvolutionSummary.alignmentScoreDelta, 15);
    assert.equal(
      report.programAdjustments[0].recommendedExerciseName,
      "Single-Arm Cross-Body Cable Rear Delt Fly"
    );
  });

  it("9. Task 1 Honesty Audit: starts VisualProgressStore empty for real users, blocks non-owner uploads until MediaPipe is verified, never fabricates 51.8kg when unlogged, and outputs 'No photo analysis available' for real photos offline", async () => {
    const freshStore = new VisualProgressStore();
    assert.equal(freshStore.getSnapshots("real_user_123").length, 0, "Real user store must start empty");
    assert.equal(freshStore.getSnapshots("trainee_alaa").length, 0, "Fresh store with demo mode off starts empty");

    // Non-owner (`real_user_123`) must be blocked from uploading photos until MediaPipe is benchmarked on 10-20 real photos
    await assert.rejects(
      async () => {
        await freshStore.addAnonymizedSnapshot({
          traineeId: "real_user_123",
          poseId: "front_relaxed",
          rawImageDataUri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          date: "2026-10-01",
          milestoneLabel: "Blocked Non-Owner Upload",
        });
      },
      /PhotoUploadRestrictedError/
    );

    // Unlogged metrics must not fabricate 51.8kg
    const unloggedPrefill = resolveHistoricalPhotoPrefill({
      captureDate: "2026-10-18",
      programStartDate: "2026-10-12",
      metrics: [],
      sessions: [],
    });
    assert.equal(unloggedPrefill.closestWeightKg, undefined);
    assert.equal(unloggedPrefill.weightMatchSource, "unlogged");

    // Real uploaded photos (by owner `trainee_alaa`) without vision analysis must return honest 'No photo analysis available'
    const realPhotoA = await freshStore.addAnonymizedSnapshot({
      traineeId: "trainee_alaa",
      poseId: "front_relaxed",
      rawImageDataUri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      date: "2026-10-01",
      milestoneLabel: "Baseline Upload",
    });
    const realPhotoB = await freshStore.addAnonymizedSnapshot({
      traineeId: "trainee_alaa",
      poseId: "front_relaxed",
      rawImageDataUri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      date: "2026-10-29",
      milestoneLabel: "Check-In Upload",
    });

    assert.equal(realPhotoA.lightingScore, undefined, "Must not fabricate lightingScore");
    assert.equal(realPhotoA.postureAlignmentScore, undefined, "Must not fabricate postureAlignmentScore");

    const offlineRealPhotoReport = await analyzeVisualProgressEvolution({
      traineeId: "trainee_alaa",
      snapshotA: realPhotoA,
      snapshotB: realPhotoB,
      sessions: [],
    });

    assert.equal(offlineRealPhotoReport.analysisEngine, "no_vision_analysis_available");
    assert.equal(offlineRealPhotoReport.empatheticHeadline, "No photo analysis available");
    assert.equal(offlineRealPhotoReport.visualObservations.length, 0);
    assert.equal(offlineRealPhotoReport.causalLinks.length, 0);
    assert.equal(offlineRealPhotoReport.programAdjustments.length, 0);
    assert.equal(offlineRealPhotoReport.posturalEvolutionSummary.alignmentScoreDelta, 0);
  });

  it("10. Task 2 Privacy & Fail-Closed Face Handling: rejects 0 faces, >1 faces, low confidence, unconfirmed back_relaxed, strips binary EXIF/GPS for real, and deletes snapshots", async () => {
    const sampleUri = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/";

    // 1. Fail closed when 0 faces detected
    await assert.rejects(
      async () => {
        await anonymizeProgressPhoto({
          rawImageDataUri: sampleUri,
          poseId: "front_relaxed",
          customFaceDetector: () => [],
        });
      },
      /No face detected/
    );

    // 2. Fail closed when >1 faces detected
    await assert.rejects(
      async () => {
        await anonymizeProgressPhoto({
          rawImageDataUri: sampleUri,
          poseId: "front_relaxed",
          customFaceDetector: () => [
            { boundingBox: { x: 0.2, y: 0.05, width: 0.15, height: 0.15 }, confidence: 0.95 },
            { boundingBox: { x: 0.6, y: 0.05, width: 0.15, height: 0.15 }, confidence: 0.91 },
          ],
        });
      },
      /Multiple faces detected/
    );

    // 3. Fail closed when confidence < 0.75
    await assert.rejects(
      async () => {
        await anonymizeProgressPhoto({
          rawImageDataUri: sampleUri,
          poseId: "front_relaxed",
          customFaceDetector: () => [
            { boundingBox: { x: 0.38, y: 0.04, width: 0.2, height: 0.14 }, confidence: 0.52 },
          ],
        });
      },
      /below the 0\.75 threshold/
    );

    // 4. Fail closed on back_relaxed unless confirmNoFaceVisible === true
    await assert.rejects(
      async () => {
        await anonymizeProgressPhoto({
          rawImageDataUri: sampleUri,
          poseId: "back_relaxed",
        });
      },
      /No face detected/
    );

    const confirmedBack = await anonymizeProgressPhoto({
      rawImageDataUri: sampleUri,
      poseId: "back_relaxed",
      confirmNoFaceVisible: true,
    });
    assert.equal(confirmedBack.proof.isAnonymized, true);
    assert.equal(confirmedBack.proof.confirmedNoFaceVisible, true);
    assert.equal(confirmedBack.proof.pixelsModifiedVerified, true);

    // 5. Verify margin expansion covers hair, ears, and neck
    const rawBox = { x: 0.39, y: 0.04, width: 0.22, height: 0.14 };
    const expanded = expandFaceBoundingBoxWithMargin(rawBox);
    assert.ok(expanded.width > rawBox.width, "Margin must expand width for ears/hair");
    assert.ok(expanded.height > rawBox.height, "Margin must expand height for crown/neck");

    // 6. Prove binary EXIF/APP1 and GPS tags are stripped for real from the output
    const exifAndGpsPayload =
      "Exif\x00\x00II*\x00\x08\x00\x00\x00DateTimeOriginal\x002026:10:18 09:42:15\x00GPSLatitude\x0033.5731N\x00GPSLongitude\x007.5898W\x00IMAGE_BODY_PIXELS_1234567890";
    const exifGpsUri = `data:image/jpeg;base64,${Buffer.from(exifAndGpsPayload, "binary").toString("base64")}`;
    assert.equal(containsExifOrGpsMetadata(exifGpsUri), true, "Input fixture must contain EXIF & GPS tags");

    const { scrubbedDataUri, strippedSegmentsCount } = stripBinaryExifAndMetadata(exifGpsUri);
    assert.ok(strippedSegmentsCount >= 1);
    assert.equal(containsExifOrGpsMetadata(scrubbedDataUri), false, "Scrubbed URI must contain zero EXIF or GPS tags");

    const anonFromExif = await anonymizeProgressPhoto({
      rawImageDataUri: exifGpsUri,
      poseId: "front_relaxed",
    });
    assert.equal(
      containsExifOrGpsMetadata(anonFromExif.anonymizedImageUrl),
      false,
      "Anonymized output must contain zero EXIF or GPS metadata bytes"
    );
    assert.equal(anonFromExif.proof.scrubbedExif, true);
    assert.equal(anonFromExif.proof.pixelsModifiedVerified, true);

    // 7. Verify deleteSnapshot removes from store and via API route
    visualProgressStore.clearForRealUser();
    const snapToDelete = await visualProgressStore.addAnonymizedSnapshot({
      traineeId: "trainee_alaa",
      poseId: "front_relaxed",
      rawImageDataUri: sampleUri,
    });
    assert.equal(visualProgressStore.getSnapshots("trainee_alaa").length, 1);

    const delReq = new Request("http://localhost:3000/api/ai/visual-progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer tok_alaa_visual",
      },
      body: JSON.stringify({
        action: "delete",
        traineeId: "trainee_alaa",
        snapshotId: snapToDelete.id,
      }),
    });
    const delRes = await postVisualProgressRoute(delReq);
    assert.equal(delRes.status, 200);
    const delJson = await delRes.json();
    assert.equal(delJson.ok, true);
    assert.equal(delJson.deleted, true);
    assert.equal(visualProgressStore.getSnapshots("trainee_alaa").length, 0);
  });

  it("11. Review Hardening: blocks non-owner uploads (HTTP 403), blocks mixed demo+real photo pairs, prevents manual box from bypassing 0-face detection, and verifies complete multi-layer deletion receipt", async () => {
    const sampleUri = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/";

    // 0. Non-owner photo uploads via POST /api/ai/visual-progress must be blocked with HTTP 403 until MediaPipe is verified on 10-20 real photos
    const friendUploadReq = new Request("http://localhost:3000/api/ai/visual-progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer tok_omar_visual",
      },
      body: JSON.stringify({
        action: "capture",
        traineeId: "trainee_friend_omar",
        poseId: "front_relaxed",
        rawImageDataUri: sampleUri,
      }),
    });
    const friendUploadRes = await postVisualProgressRoute(friendUploadReq);
    assert.equal(friendUploadRes.status, 403, "Non-owner photo upload must be rejected with HTTP 403");
    const friendUploadJson = await friendUploadRes.json();
    assert.equal(friendUploadJson.ok, false);
    assert.ok(friendUploadJson.error.includes("PhotoUploadRestrictedError"));

    // 1. Mixed demo (`isSyntheticDemo: true`) + real photo (`isSyntheticDemo: false`) must NEVER output synthetic observations
    visualProgressStore.resetForTesting("trainee_alaa");
    const demoSnaps = visualProgressStore.getSnapshots("trainee_alaa", "front_relaxed");
    const demoSnap = demoSnaps[0];
    assert.equal(demoSnap.isSyntheticDemo, true);

    const realSnap = await visualProgressStore.addAnonymizedSnapshot({
      traineeId: "trainee_alaa",
      poseId: "front_relaxed",
      rawImageDataUri: sampleUri,
      date: "2026-11-12",
      milestoneLabel: "Real User Upload",
    });
    assert.equal(realSnap.isSyntheticDemo, false);

    const mixedReport = await analyzeVisualProgressEvolution({
      traineeId: "trainee_alaa",
      snapshotA: demoSnap,
      snapshotB: realSnap,
      sessions: [],
    });
    assert.equal(
      mixedReport.analysisEngine,
      "no_vision_analysis_available",
      "Mixed demo + real snapshot pair must never run synthetic demo fallback"
    );
    assert.equal(mixedReport.visualObservations.length, 0);
    assert.ok(mixedReport.executiveSummary.includes("synthetic demo silhouettes cannot be compared against real user photos"));

    // 2. Mirror selfie / background poster (`multiFacePolicy: "redact_all_detected_faces"`): redacts ALL detected faces
    const mirrorRedacted = await anonymizeProgressPhoto({
      rawImageDataUri: sampleUri,
      poseId: "front_relaxed",
      multiFacePolicy: "redact_all_detected_faces",
      customFaceDetector: () => [
        { boundingBox: { x: 0.22, y: 0.05, width: 0.16, height: 0.14 }, confidence: 0.94 },
        { boundingBox: { x: 0.62, y: 0.06, width: 0.14, height: 0.12 }, confidence: 0.88 },
      ],
    });
    assert.equal(mirrorRedacted.proof.isAnonymized, true);
    assert.equal(mirrorRedacted.proof.facesDetectedCount, 2);
    assert.equal(mirrorRedacted.proof.allRedactedFaceRegions?.length, 2);
    assert.ok(mirrorRedacted.proof.multiFaceNotice?.includes("Redacted all 2"));

    // 3. Manual redaction box MUST NOT bypass automated face detection when 0 faces are detected
    await assert.rejects(
      async () => {
        await anonymizeProgressPhoto({
          rawImageDataUri: sampleUri,
          poseId: "front_relaxed",
          manualFaceRedactionBox: { x: 0.35, y: 0.02, width: 0.3, height: 0.22 },
          customFaceDetector: () => [],
        });
      },
      /No face detected/,
      "Manual redaction box is a supplemental fallback, never a bypass when automated face detection fails"
    );

    // When automated face detection succeeds, manualFaceRedactionBox adds a supplemental redaction region
    const supplementalManualRedacted = await anonymizeProgressPhoto({
      rawImageDataUri: sampleUri,
      poseId: "front_relaxed",
      manualFaceRedactionBox: { x: 0.35, y: 0.02, width: 0.3, height: 0.22 },
    });
    assert.equal(supplementalManualRedacted.proof.isAnonymized, true);
    assert.equal(supplementalManualRedacted.proof.allRedactedFaceRegions?.length, 2);

    registerCrossBrowserWasmFaceDetector(() => [
      { boundingBox: { x: 0.38, y: 0.04, width: 0.22, height: 0.15 }, confidence: 0.96 },
    ]);
    try {
      const wasmRedacted = await anonymizeProgressPhoto({
        rawImageDataUri: sampleUri,
        poseId: "front_relaxed",
      });
      assert.equal(wasmRedacted.proof.detectorUsed, "mediapipe_wasm_face_detector");
    } finally {
      registerCrossBrowserWasmFaceDetector(null);
    }

    // 4. Complete deletion across store, storage.ts bucket, and cached comparison reports via DELETE route
    visualProgressStore.clearForRealUser();
    const snapA = await visualProgressStore.addAnonymizedSnapshot({
      traineeId: "trainee_alaa",
      poseId: "front_relaxed",
      rawImageDataUri: sampleUri,
      date: "2026-10-01",
    });
    const snapB = await visualProgressStore.addAnonymizedSnapshot({
      traineeId: "trainee_alaa",
      poseId: "front_relaxed",
      rawImageDataUri: sampleUri,
      date: "2026-10-29",
    });
    assert.ok(getStoredSnapshotBlob(snapA.id), "Blob must be registered in storage.ts before deletion");

    await analyzeVisualProgressEvolution({
      traineeId: "trainee_alaa",
      snapshotA: snapA,
      snapshotB: snapB,
      sessions: [],
    });
    assert.equal(visualProgressStore.getCachedComparisonReports("trainee_alaa").length, 1);

    const deleteHttpReq = new NextRequest(
      `http://localhost:3000/api/ai/visual-progress?traineeId=trainee_alaa&snapshotId=${snapA.id}`,
      {
        method: "DELETE",
        headers: { Authorization: "Bearer tok_alaa_visual" },
      }
    );
    const deleteHttpRes = await deleteVisualProgressRoute(deleteHttpReq);
    assert.equal(deleteHttpRes.status, 200);
    const deleteHttpJson = await deleteHttpRes.json();
    assert.equal(deleteHttpJson.ok, true);
    assert.equal(deleteHttpJson.receipt.purgedFromMemoryStore, true);
    assert.equal(deleteHttpJson.receipt.purgedFromStorageBucket, true);
    assert.equal(deleteHttpJson.receipt.purgedCachedReportsCount, 1);
    assert.equal(getStoredSnapshotBlob(snapA.id), undefined, "Blob must be purged from storage.ts");
    assert.equal(visualProgressStore.getCachedComparisonReports("trainee_alaa").length, 0);
  });
});
