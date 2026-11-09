/**
 * Athletic Event Sourcing Engine (The Flight Recorder Model)
 * 
 * In an athletic operating system, the barbell and nervous system on the gym floor
 * are the physical source of truth. The cloud is an archival observer.
 * 
 * Every set logged, load adjusted, rest skipped, or note recorded is modeled as an
 * immutable, append-only event with wall-clock epoch timestamps.
 * 
 * Benefits:
 * 1. Zero Write-Write Merge Conflicts: Events interleave deterministically.
 * 2. Immutable Audit Trail: Typos generate compensation events (SET_AMENDED), not destructive overwrites.
 * 3. Retroactive Projection Replay: Mesocycle fatigue and 1RM progression can be re-calculated
 *    retroactively with new algorithms from raw physical history.
 */

export type AthleticEventType =
  | "WORKOUT_INITIALIZED"
  | "SET_LOGGED"
  | "SET_AMENDED"
  | "DROP_SET_LOGGED"
  | "REST_STARTED"
  | "REST_SKIPPED"
  | "EXERCISE_FEEDBACK_RECORDED"
  | "EQUIPMENT_PHOTO_ATTACHED"
  | "AUDIO_NOTE_ATTACHED"
  | "WORKOUT_COMPLETED"
  | "WORKOUT_ABORTED"
  | "METRIC_RECORDED"
  | "READINESS_SUBMITTED"
  | "GYM_SELECTED"
  | "PROGRAM_EVOLVED";

export interface EventEnvelope<T = any> {
  id: string;                    // UUID for idempotency
  streamId: string;              // e.g. "session_1794028800" or "trainee_alaa"
  traineeId: string;
  type: AthleticEventType;
  payload: T;
  epochMs: number;               // Physical wall-clock timestamp
  recordedAt: string;            // ISO String
  syncedToCloud: boolean;
  cloudSyncEpochMs?: number;
}

// ----------------------------------------------------------------------------
// SPECIFIC ATHLETIC EVENT PAYLOADS
// ----------------------------------------------------------------------------

export interface WorkoutInitializedPayload {
  sessionId: string;
  programDayId?: string;
  dayLabel?: string;
  gymId?: string;
  gymName?: string;
  plannedExerciseIds: string[];
}

export interface SetLoggedPayload {
  sessionId: string;
  exercisePrescriptionId?: string;
  exerciseName: string;
  setIndex: number;
  weightKg: number;
  reps: number;
  targetRir?: number;
  rirAchieved?: number;
  isPR: boolean;
  isDropSet?: boolean;
  selectedEquipment?: string;
  note?: string;
  photoUrl?: string;
  audioNoteUrl?: string;
}

export interface SetAmendedPayload {
  sessionId: string;
  exerciseName: string;
  setIndex: number;
  previousWeightKg: number;
  previousReps: number;
  amendedWeightKg: number;
  amendedReps: number;
  reason?: string;
}

export interface WorkoutCompletedPayload {
  sessionId: string;
  programDayId?: string;
  dayLabel?: string;
  programTitle?: string;
  durationSec: number;
  liftingDurationSec: number;
  totalRestDurationSec: number;
  warmupDurationSec?: number;
  cooldownDurationSec?: number;
  gymId?: string;
  gymName?: string;
  gymAddress?: string;
  totalVolumeKg: number;
  prCount: number;
  sessionNote?: string;
  audioNoteUrl?: string;
}

export interface MetricRecordedPayload {
  metricId: string;
  weightKg: number;
  date: string;
  bodyFatPercent?: number;
}

export interface ReadinessSubmittedPayload {
  readinessId: string;
  sleepHours: number;
  answer: "light" | "moderate" | "full" | string;
  reducedRecovery: boolean;
  date: string;
}

export interface ProgramEvolvedPayload {
  propositionId: string;
  tier: string;
  decision: "ACCEPTED" | "DISMISSED";
  targetExerciseName: string;
  evolvedExerciseName?: string;
  previousSets?: number;
  evolvedSets?: number;
  previousWeightKg?: number;
  evolvedWeightKg?: number;
  sensoryRagSummary?: string;
  agentTurnCount?: number;
}

/**
 * Creates an immutable event envelope with deterministic UUID and physical timestamp.
 */
export function createEventEnvelope<T>(
  traineeId: string,
  streamId: string,
  type: AthleticEventType,
  payload: T
): EventEnvelope<T> {
  const now = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  return {
    id: `evt_${now}_${randomSuffix}`,
    streamId,
    traineeId,
    type,
    payload,
    epochMs: now,
    recordedAt: new Date(now).toISOString(),
    syncedToCloud: false,
  };
}
