import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

// R1: Cloud Persistence & Sync
import { sensoryMemoryStore, SensoryFeedbackEntry } from '../../../src/lib/ai/sensory-memory';
import { gymVisionInventoryStore, LocationEquipmentInventory } from '../../../src/lib/ai/gym-vision-inventory';
import { appStore } from '../../../src/lib/store';

// R3: Multi-Angle Postural Synthesis
import {
  synthesizeMultiAnglePosturalTriad,
  VisualProgressSnapshot,
} from '../../../src/lib/ai/visual-progress';

// R4: Gemini Live Rest-Interval Controller
import { GeminiLiveSessionController } from '../../../src/lib/ai/gemini-live-session';

// Video Form Check Study & Kinematics Engine
import {
  evaluateMovementVideoClip,
  validateVideoClipDataUri,
} from '../../../src/lib/ai/movement-form-check';

describe('Releases R1–R4 & Movement Form Check Verification Suite', () => {
  const testTraineeId = 'trainee_test_r1_r4';

  beforeEach(() => {
    appStore.reset();
  });

  describe('Release R1: Cross-Device Sensory RAG & Inventory Cloud Hydration', () => {
    it('SensoryMemoryStore merges cloud entries with local entries seamlessly without duplicates', () => {
      const mockCloudEntry: SensoryFeedbackEntry = {
        id: 'sf_cloud_101',
        traineeId: testTraineeId,
        sessionId: 'sess_1',
        date: '2026-11-24',
        exerciseName: 'Barbell Incline Press',
        primaryMuscle: 'chest',
        muscleSubdivision: 'chest_clavicular',
        tags: [],
        originalLanguage: 'en',
        canonicalEnglishSummary: 'Exercise: Barbell Incline Press. Felt smooth.',
        biomechanicalEntities: {
          symptoms: [],
          compensations: [],
          severity: 'none',
        },
        embeddingVector: new Array(64).fill(0.12),
        gymId: 'gym_casa_1',
        epochMs: 1795000000000,
      };

      sensoryMemoryStore.hydrateFromCloudEntries([mockCloudEntry]);
      const entries = sensoryMemoryStore.getAllEntries();
      const match = entries.find((e) => e.id === 'sf_cloud_101');

      assert.ok(match, 'Cloud sensory entry must be present in vault');
      assert.strictEqual(match?.canonicalEnglishSummary, 'Exercise: Barbell Incline Press. Felt smooth.');
    });

    it('GymVisionInventoryStore merges cloud location inventories seamlessly', () => {
      const mockCloudInv: LocationEquipmentInventory = {
        gymId: 'gym_casa_cloud',
        gymName: 'Casablanca Fitness Club',
        traineeId: testTraineeId,
        availableCategories: ['dumbbell', 'barbell', 'cable'],
        confirmedEquipment: ['dumbbell', 'barbell'],
        aiDetectedEquipment: ['cable'],
        uncertainDetections: [],
        unavailableEquipment: [],
        detectedStations: ['Dumbbell Area', 'Barbell Rack'],
        limitations: [],
        photosAnalyzedCount: 3,
        lastAnalysisStatus: 'completed',
        lastUpdated: '2026-11-24T10:00:00Z',
      };

      gymVisionInventoryStore.hydrateFromCloudInventories([mockCloudInv]);
      const invs = gymVisionInventoryStore.getAllInventories();
      const match = invs.find((i) => i.gymId === 'gym_casa_cloud');

      assert.ok(match, 'Cloud inventory must be present in store');
      assert.strictEqual(match?.gymName, 'Casablanca Fitness Club');
      assert.ok(match?.availableCategories.includes('cable'));
    });
  });

  describe('Release R2: Salle de Sport Auto-Registration', () => {
    it('automatically records newly photographed machine stations into user GymLocation.equipmentNotes', async () => {
      // Set up a custom gym in appStore for the trainee
      const gym = appStore.addGymLocation(
        {
          name: 'Anfa Fitness Studio',
          equipmentNotes: ['Dumbbell Free Weights (up to 32kg)'],
          isDefault: true,
        },
        testTraineeId
      );

      // Analyze photo that detects a Hack Squat and a Smith Machine
      await gymVisionInventoryStore.analyzeGymPhotoAndUpdateInventory({
        gymId: gym.id,
        gymName: 'Anfa Fitness Studio',
        traineeId: testTraineeId,
        photoDataUri: 'data:image/jpeg;base64,' + 'A'.repeat(300),
        overrideAvailableCategories: ['machine', 'smith_machine', 'dumbbell'],
      });

      // Verify appStore was updated automatically
      const updatedGyms = appStore.getUserGymLocations(testTraineeId);
      const target = updatedGyms.find((g) => g.id === gym.id);

      assert.ok(target, 'Target gym must exist in store');
      assert.ok(target?.equipmentNotes && target.equipmentNotes.length > 1, 'Equipment notes must be expanded');
      const notesText = target.equipmentNotes.join(' ').toLowerCase();
      assert.ok(notesText.includes('smith machine') || notesText.includes('machine'));
    });
  });

  describe('Release R3: Multi-Angle Visual Synthesis (3D Postural Triad)', () => {
    it('synthesizes Front, Side, and Back photos and detects Upper-Crossed Syndrome cues', () => {
      const baseAnonymization = {
        isAnonymized: true,
        method: 'blur' as const,
        faceRegionRedacted: { x: 0.3, y: 0.1, width: 0.4, height: 0.25 },
        anonymizedAt: '2026-11-24T09:00:00Z',
        scrubbedExif: true,
        pixelsModifiedVerified: true,
      };

      const frontSnap: VisualProgressSnapshot = {
        id: 'snap_f1',
        traineeId: testTraineeId,
        date: '2026-11-24',
        poseId: 'front_relaxed',
        anonymizedImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        source: 'camera_capture',
        anonymization: baseAnonymization,
        postureMetrics: {
          leftShoulderElevationDiffMm: 3,
        },
      };

      const sideSnap: VisualProgressSnapshot = {
        id: 'snap_s1',
        traineeId: testTraineeId,
        date: '2026-11-24',
        poseId: 'side_posture',
        anonymizedImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        source: 'camera_capture',
        anonymization: baseAnonymization,
        postureMetrics: {
          forwardHeadPostureMm: 22, // Forward head > 15mm
          thoracicKyphosisAngleDeg: 45, // Hyperkyphosis > 42°
          pelvicTiltAngleDeg: 11,
          ribFlare: 'minimal',
        },
      };

      const backSnap: VisualProgressSnapshot = {
        id: 'snap_b1',
        traineeId: testTraineeId,
        date: '2026-11-24',
        poseId: 'back_relaxed',
        anonymizedImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        source: 'camera_capture',
        anonymization: baseAnonymization,
        postureMetrics: {
          scapularAsymmetryMm: 4,
        },
      };

      const triad = synthesizeMultiAnglePosturalTriad({
        frontSnapshot: frontSnap,
        sideSnapshot: sideSnap,
        backSnapshot: backSnap,
      });

      assert.strictEqual(triad.traineeId, testTraineeId);
      assert.strictEqual(triad.privacyComplianceVerified, true);
      assert.strictEqual(triad.sagittalPlane.cervicalHeadAlignment, 'forward_head');
      assert.strictEqual(triad.sagittalPlane.thoracicKyphosis, 'mild_hyperkyphosis');
      assert.strictEqual(triad.syndromeDiagnosis.upperCrossedSyndrome, 'mild');
      assert.ok(triad.prescribedInterventions.warmupActivationCues.some((c) => c.includes('Face Pull')));
      assert.ok(triad.prescribedInterventions.programmingBiasRecommendation.includes('1.5:1'));
    });
  });

  describe('Release R4: Gemini Live API Rest-Interval Audio Controller', () => {
    it('simulates live set voice logging and receives spoken audio feedback and transcript', () => {
      let loggedResult: unknown = null;
      let lastSpokenCoach = '';

      const controller = new GeminiLiveSessionController({
        onSetLogged: (set) => {
          loggedResult = set;
        },
        onSpokenTranscript: (transcript, role) => {
          if (role === 'coach') {
            lastSpokenCoach = transcript;
          }
        },
      });

      controller.connect();
      assert.strictEqual(controller.active, true);

      const res = controller.logSpokenSet({
        exerciseName: 'Incline Dumbbell Press',
        setNumber: 2,
        weightKg: 32,
        reps: 8,
        estimatedRir: 1,
      });

      assert.strictEqual(res.success, true);
      assert.ok(res.spokenFeedback.includes('Logged 8 reps at 32kg'));
      assert.ok(lastSpokenCoach.includes('32kg'));
      assert.ok(loggedResult !== null);

      controller.disconnect();
      assert.strictEqual(controller.active, false);
    });
  });

  describe('Movement Video Form Check: Kinematics & Biomechanical Critique', () => {
    it('validateVideoClipDataUri rejects empty, corrupted, or non-video payloads', () => {
      const vNull = validateVideoClipDataUri(undefined);
      assert.strictEqual(vNull.valid, false);

      const vCorrupted = validateVideoClipDataUri('data:video/mp4;base64,CORRUPTED_VIDEO_BYTES_DATA');
      assert.strictEqual(vCorrupted.valid, false);

      const vValid = validateVideoClipDataUri('data:video/mp4;base64,' + 'A'.repeat(200));
      assert.strictEqual(vValid.valid, true);
      assert.strictEqual(vValid.mimeType, 'video/mp4');
    });

    it('evaluates corrupted video payloads fail-closed with diagnostic advice', async () => {
      const critique = await evaluateMovementVideoClip({
        videoDataUri: 'data:video/mp4;base64,CORRUPTED_VIDEO',
        exerciseName: 'Barbell Back Squat',
        cameraAngle: 'sagittal_side',
      });

      assert.strictEqual(critique.status, 'corrupted_payload');
      assert.strictEqual(critique.confidenceScore, 0);
      assert.ok(critique.singlePriorityCue.spokenCueText.includes('re-record'));
    });

    it('evaluates valid 10-second squat set video and returns bar path, ROM, tempo, and concise cue', async () => {
      const critique = await evaluateMovementVideoClip({
        videoDataUri: 'data:video/mp4;base64,' + 'A'.repeat(250),
        exerciseName: 'Barbell Back Squat',
        cameraAngle: 'sagittal_side',
      });

      assert.strictEqual(critique.status, 'analyzed');
      assert.ok(critique.confidenceScore >= 0.85);
      assert.ok(critique.repsDetected >= 5);

      // Verify Range of Motion
      assert.strictEqual(critique.rangeOfMotion.achievedFullRom, true);
      assert.ok(critique.rangeOfMotion.depthMeasurementDescription.includes('patella'));

      // Verify Bar Path
      assert.strictEqual(critique.barPath.trajectoryRating, 'optimal_vertical');
      assert.ok(critique.barPath.horizontalDriftCmEstimate < 5.0);

      // Verify Tempo
      assert.ok(critique.tempo.averageEccentricSec >= 2.0);
      assert.ok(critique.tempo.velocityLossPct > 0);

      // Verify Single Priority Cue is under 15 words
      const words = critique.singlePriorityCue.spokenCueText.split(/\s+/).length;
      assert.ok(words <= 15, `Cue must be concise for cognitive clarity: "${critique.singlePriorityCue.spokenCueText}" (${words} words)`);
    });
  });
});
