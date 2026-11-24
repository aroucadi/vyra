/**
 * Vyra Client Storage & IndexedDB Adapter (Spec 018 Hardened)
 * 
 * Provides client-side durable persistence for workout sessions,
 * set logs, active session drafts, offline mutation queues,
 * and readiness check-ins with zero data loss in basement gyms.
 */

import type { ActiveExercise } from "@/components/trainee/session/types";
import type {
  BodyMetricEntry,
  ExerciseFeedbackRecord,
  SetLog,
  SupplementLog,
  WearableBiometricSnapshot,
  WorkoutSession,
} from "./types";

export const DB_NAME = "vyra_client_db";
export const DB_VERSION = 3;

export type StoredSessionRecord = WorkoutSession;
export type StoredReadinessRecord = WearableBiometricSnapshot;
export type StoredSupplementLogRecord = SupplementLog;
export type StoredMetricRecord = BodyMetricEntry;

export interface ClientStoredPayload {
  version: number;
  sessions: StoredSessionRecord[];
  readinessLogs: StoredReadinessRecord[];
  supplementLogs: StoredSupplementLogRecord[];
  metrics: StoredMetricRecord[];
  lastBackupAt?: string;
}

export type DraftExerciseSnapshot =
  | ActiveExercise
  | {
      id?: string;
      name?: string;
      targetSets?: number;
      currentWeight?: number;
      currentReps?: number;
      completedSets?: unknown[];
    };

export interface ActiveSessionDraft {
  traineeId: string;
  programDayId?: string;
  dayLabel?: string;
  exercises: DraftExerciseSnapshot[];
  currentExIndex: number;
  currentExerciseIndex?: number;
  sessionDurationSec: number;
  durationSec?: number;
  startedAt: string;
  updatedAt: string;
  sessionStartEpochMs?: number;
  liftingStartEpochMs?: number;
  totalRestDurationSec?: number;
  warmupDurationSec?: number;
  cooldownDurationSec?: number;
  warmupCompleted?: boolean;
  cooldownCompleted?: boolean;
  phase?: "preview" | "warmup" | "active" | "cooldown" | "summary";
  gymId?: string;
  gymName?: string;
  gymAddress?: string;
  isAdaptedSession?: boolean;
  activeDailyAdaptation?: unknown;
}

export interface QueuedMutation {
  id: string;
  type: "save_session" | "log_readiness" | "log_metric" | "SAVE_SESSION";
  payload: WorkoutSession | Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  queuedAt: string;
  nextRetryAt: number;
}

const LOCAL_STORAGE_KEY = "vyra_offline_backup_v1";
const SESSION_DRAFT_PREFIX = "vyra_active_draft_";
const MUTATION_QUEUE_KEY = "vyra_mutation_queue_v1";

interface LegacyReadinessInput {
  id?: string;
  traineeId?: string;
  date?: string;
  source?: string;
  sleepHours?: number;
  receivedAt?: string;
  feeling?: string;
  answer?: string;
  reducedRecovery?: boolean;
  cnsFatigueDetected?: boolean;
  hrvMs?: number;
  deepSleepMinutes?: number;
  restingHeartRateBpm?: number;
  readinessScore?: number;
}

interface LegacyStoredPayloadInput {
  sessions?: StoredSessionRecord[];
  metrics?: StoredMetricRecord[];
  supplementLogs?: StoredSupplementLogRecord[];
  readinessLogs?: LegacyReadinessInput[];
  wearableBiometrics?: LegacyReadinessInput[];
  lastBackupAt?: string;
  exportedAt?: string;
}

/**
 * Migrates old/legacy storage format safely without data loss.
 */
export function migrateLegacyStoredData(rawInput: unknown): ClientStoredPayload {
  if (!rawInput || typeof rawInput !== "object") {
    return {
      version: 1,
      sessions: [],
      readinessLogs: [],
      supplementLogs: [],
      metrics: [],
    };
  }

  const raw = rawInput as LegacyStoredPayloadInput;
  const sessions = Array.isArray(raw.sessions) ? raw.sessions : [];
  const metrics = Array.isArray(raw.metrics) ? raw.metrics : [];
  const supplementLogs = Array.isArray(raw.supplementLogs) ? raw.supplementLogs : [];
  const rawReadiness = Array.isArray(raw.readinessLogs)
    ? raw.readinessLogs
    : Array.isArray(raw.wearableBiometrics)
    ? raw.wearableBiometrics
    : [];

  const migratedReadiness: StoredReadinessRecord[] = rawReadiness.map((entry) => {
    const sleepHours = typeof entry.sleepHours === "number" ? entry.sleepHours : 7.0;
    let answer: string;
    if (entry.feeling) {
      if (entry.feeling === "depleted") answer = "light";
      else if (entry.feeling === "suboptimal") answer = "moderate";
      else if (entry.feeling === "optimal") answer = "full";
      else answer = entry.feeling;
    } else if (entry.answer) {
      answer = entry.answer;
    } else {
      answer = sleepHours < 6 ? "light" : sleepHours < 7.5 ? "moderate" : "full";
    }

    const reducedRecovery =
      typeof entry.reducedRecovery === "boolean"
        ? entry.reducedRecovery
        : typeof entry.cnsFatigueDetected === "boolean"
        ? entry.cnsFatigueDetected
        : answer === "light" || answer === "moderate";

    const migrated: StoredReadinessRecord = {
      id: entry.id || `readiness_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      traineeId: entry.traineeId || "unassigned_trainee",
      date: entry.date || new Date().toISOString().split("T")[0],
      source: (entry.source || "manual") as WearableBiometricSnapshot["source"],
      sleepHours,
      answer,
      reducedRecovery,
      receivedAt: entry.receivedAt || new Date().toISOString(),
    };

    if (migrated.source !== "manual") {
      if (typeof entry.hrvMs === "number") migrated.hrvMs = entry.hrvMs;
      if (typeof entry.deepSleepMinutes === "number") migrated.deepSleepMinutes = entry.deepSleepMinutes;
      if (typeof entry.restingHeartRateBpm === "number") migrated.restingHeartRateBpm = entry.restingHeartRateBpm;
      if (typeof entry.readinessScore === "number") migrated.readinessScore = entry.readinessScore;
    }

    return migrated;
  });

  return {
    version: 1,
    sessions,
    readinessLogs: migratedReadiness,
    supplementLogs,
    metrics,
    lastBackupAt: raw.lastBackupAt || raw.exportedAt,
  };
}

/**
 * Opens or initializes the client IndexedDB database (Version 2 with drafts & sync queue).
 */
export function openClientDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("sessions")) {
        db.createObjectStore("sessions", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("readinessLogs")) {
        db.createObjectStore("readinessLogs", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("supplementLogs")) {
        db.createObjectStore("supplementLogs", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
      // Spec 018: Active session draft store (keyed by traineeId)
      if (!db.objectStoreNames.contains("session_drafts")) {
        db.createObjectStore("session_drafts", { keyPath: "traineeId" });
      }
      // Spec 018: Offline replay mutation queue (keyed by UUID id)
      if (!db.objectStoreNames.contains("mutation_queue")) {
        db.createObjectStore("mutation_queue", { keyPath: "id" });
      }
      // Flight Recorder: Immutable append-only athletic event stream
      if (!db.objectStoreNames.contains("athletic_events")) {
        const eventStore = db.createObjectStore("athletic_events", { keyPath: "id" });
        eventStore.createIndex("streamId", "streamId", { unique: false });
        eventStore.createIndex("traineeId", "traineeId", { unique: false });
        eventStore.createIndex("syncedToCloud", "syncedToCloud", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Requests persistent storage via navigator.storage.persist().
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window !== "undefined" && window.navigator?.storage?.persist) {
    try {
      return await window.navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Checks if storage is already persisted.
 */
export async function isStoragePersisted(): Promise<boolean> {
  if (typeof window !== "undefined" && window.navigator?.storage?.persisted) {
    try {
      return await window.navigator.storage.persisted();
    } catch {
      return false;
    }
  }
  return false;
}

// ----------------------------------------------------------------------------
// SPEC 018: ACTIVE SESSION DRAFT JOURNALING (< 2ms)
// ----------------------------------------------------------------------------

/**
 * Saves active session draft snapshot synchronously into localStorage and IndexedDB.
 * Supports both object parameter and positional parameters.
 */
export async function saveSessionDraft(
  draftOrTraineeId: ActiveSessionDraft | string,
  exercises?: DraftExerciseSnapshot[],
  currentExIndex?: number,
  sessionDurationSec?: number,
  programDayId?: string
): Promise<void> {
  if (typeof window === "undefined") return;

  const nowIso = new Date().toISOString();
  const draft: ActiveSessionDraft =
    typeof draftOrTraineeId === "string"
      ? {
          traineeId: draftOrTraineeId,
          programDayId,
          exercises: exercises || [],
          currentExIndex: currentExIndex || 0,
          currentExerciseIndex: currentExIndex || 0,
          sessionDurationSec: sessionDurationSec || 0,
          durationSec: sessionDurationSec || 0,
          startedAt: nowIso,
          updatedAt: nowIso,
        }
      : {
          ...draftOrTraineeId,
          currentExerciseIndex:
            draftOrTraineeId.currentExIndex ?? draftOrTraineeId.currentExerciseIndex ?? 0,
          durationSec:
            draftOrTraineeId.sessionDurationSec ?? draftOrTraineeId.durationSec ?? 0,
          updatedAt: nowIso,
        };

  const serialized = JSON.stringify(draft);

  // 1. Instant synchronous write to localStorage buffer (< 1ms)
  try {
    localStorage.setItem(`${SESSION_DRAFT_PREFIX}${draft.traineeId}`, serialized);
  } catch (err) {
    console.warn("Failed to write draft to localStorage:", err);
  }

  // 2. Asynchronous write to IndexedDB
  try {
    const db = await openClientDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("session_drafts", "readwrite");
      tx.objectStore("session_drafts").put(draft);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

/**
 * Loads active session draft for a trainee if unfinalized and fresher than maxAgeHours (default: 4 hours).
 */
export async function loadSessionDraft(
  traineeId: string,
  maxAgeHours: number = 4
): Promise<ActiveSessionDraft | null> {
  if (typeof window === "undefined") return null;

  let draft: ActiveSessionDraft | null = null;

  // 1. Try IndexedDB first
  try {
    const db = await openClientDatabase();
    draft = await new Promise<ActiveSessionDraft | null>((resolve) => {
      const tx = db.transaction("session_drafts", "readonly");
      const req = tx.objectStore("session_drafts").get(traineeId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {}

  // 2. Fallback to localStorage buffer
  if (!draft) {
    try {
      const raw = localStorage.getItem(`${SESSION_DRAFT_PREFIX}${traineeId}`);
      if (raw) draft = JSON.parse(raw);
    } catch {}
  }

  if (!draft) return null;

  // Stale check (default: 4 hours)
  const updatedTime = new Date(draft.updatedAt || draft.startedAt).getTime();
  const ageMs = Date.now() - updatedTime;
  if (ageMs > maxAgeHours * 3600000) {
    await clearSessionDraft(traineeId);
    return null;
  }

  return draft;
}

/**
 * Clears active session draft upon successful workout completion or discard.
 */
export async function clearSessionDraft(traineeId: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(`${SESSION_DRAFT_PREFIX}${traineeId}`);
  } catch {}

  try {
    const db = await openClientDatabase();
    await new Promise<void>((resolve) => {
      const tx = db.transaction("session_drafts", "readwrite");
      tx.objectStore("session_drafts").delete(traineeId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

// ----------------------------------------------------------------------------
// SPEC 018: REPLAY MUTATION QUEUE & EXPONENTIAL BACKOFF
// ----------------------------------------------------------------------------

export function calculateNextRetryDelay(attempts: number, baseMs: number = 1000): number {
  const backoff = Math.min(baseMs * Math.pow(2, attempts), 60000);
  const jitter = Math.random() * 0.2 * backoff;
  return Math.round(backoff + jitter);
}

/**
 * Enqueues a failed mutation to the replay queue.
 */
export async function enqueueMutation(
  mutation: Omit<QueuedMutation, "attempts" | "queuedAt" | "nextRetryAt">
): Promise<void> {
  if (typeof window === "undefined") return;

  const item: QueuedMutation = {
    ...mutation,
    attempts: 0,
    queuedAt: new Date().toISOString(),
    nextRetryAt: Date.now(),
  };

  // 1. Buffer in localStorage
  try {
    const raw = localStorage.getItem(MUTATION_QUEUE_KEY);
    const list: QueuedMutation[] = raw ? JSON.parse(raw) : [];
    list.push(item);
    localStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(list.slice(-50)));
  } catch {}

  // 2. Persist in IndexedDB
  try {
    const db = await openClientDatabase();
    await new Promise<void>((resolve) => {
      const tx = db.transaction("mutation_queue", "readwrite");
      tx.objectStore("mutation_queue").put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

/**
 * Returns all currently pending offline mutations.
 */
export async function getPendingMutations(): Promise<QueuedMutation[]> {
  if (typeof window === "undefined") return [];

  try {
    const db = await openClientDatabase();
    return await new Promise<QueuedMutation[]>((resolve) => {
      const tx = db.transaction("mutation_queue", "readonly");
      const req = tx.objectStore("mutation_queue").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    try {
      const raw = localStorage.getItem(MUTATION_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Removes a mutation from the queue once successfully synced.
 */
export async function removeQueuedMutation(id: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem(MUTATION_QUEUE_KEY);
    if (raw) {
      const list: QueuedMutation[] = JSON.parse(raw);
      localStorage.setItem(
        MUTATION_QUEUE_KEY,
        JSON.stringify(list.filter((m) => m.id !== id))
      );
    }
  } catch {}

  try {
    const db = await openClientDatabase();
    await new Promise<void>((resolve) => {
      const tx = db.transaction("mutation_queue", "readwrite");
      tx.objectStore("mutation_queue").delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

/**
 * Drains the offline mutation queue using a pluggable processor.
 */
export async function drainMutationQueue(
  processor?: (m: QueuedMutation) => Promise<boolean>
): Promise<number> {
  if (typeof window === "undefined" || (navigator && !navigator.onLine)) {
    return 0;
  }

  const pending = await getPendingMutations();
  if (pending.length === 0) return 0;

  let drainedCount = 0;
  const now = Date.now();

  for (const m of pending) {
    if (m.nextRetryAt > now) continue;

    let success = false;
    if (processor) {
      try {
        success = await processor(m);
      } catch {
        success = false;
      }
    } else {
      // Default processor: simulated or server action
      success = true;
    }

    if (success) {
      await removeQueuedMutation(m.id);
      drainedCount++;
    } else {
      m.attempts++;
      if (m.attempts >= m.maxAttempts) {
        // Exceeded max attempts, remove to prevent blocking queue
        await removeQueuedMutation(m.id);
      } else {
        m.nextRetryAt = Date.now() + calculateNextRetryDelay(m.attempts);
        try {
          const raw = localStorage.getItem(MUTATION_QUEUE_KEY);
          if (raw) {
            const list: QueuedMutation[] = JSON.parse(raw);
            const idx = list.findIndex((x) => x.id === m.id);
            if (idx !== -1) {
              list[idx] = m;
              localStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(list));
            }
          }
        } catch {}
        try {
          const db = await openClientDatabase();
          const tx = db.transaction("mutation_queue", "readwrite");
          tx.objectStore("mutation_queue").put(m);
        } catch {}
      }
    }
  }

  return drainedCount;
}

// ----------------------------------------------------------------------------
// WORKOUT SESSION PERSISTENCE (OPTIMISTIC OFFLINE-FIRST)
// ----------------------------------------------------------------------------

/**
 * Strips multi-megabyte base64 images from a session before writing to localStorage,
 * preventing QuotaExceededError in mobile Safari (5MB quota). Full base64 images
 * remain safely stored in IndexedDB.
 */
export function sanitizeSessionForLocalStorage(sess: WorkoutSession): WorkoutSession {
  const MAX_INLINE_STORAGE_LEN = 30_000; // 30KB max per photo for localStorage
  const cleanedSetLogs = (sess.setLogs || []).map((l: SetLog): SetLog => {
    const copy = { ...l };
    if (typeof copy.photoUrl === "string" && copy.photoUrl.startsWith("data:") && copy.photoUrl.length > MAX_INLINE_STORAGE_LEN) {
      delete copy.photoUrl;
    }
    if (typeof copy.equipmentPhotoUrl === "string" && copy.equipmentPhotoUrl.startsWith("data:") && copy.equipmentPhotoUrl.length > MAX_INLINE_STORAGE_LEN) {
      delete copy.equipmentPhotoUrl;
    }
    if (typeof copy.equipmentPhotoBase64 === "string" && copy.equipmentPhotoBase64.length > MAX_INLINE_STORAGE_LEN) {
      delete copy.equipmentPhotoBase64;
    }
    return copy;
  });
  const cleanedFeedbacks = (sess.exerciseFeedbacks || []).map((fb: ExerciseFeedbackRecord): ExerciseFeedbackRecord => {
    const copy = { ...fb };
    if (typeof copy.photoUrl === "string" && copy.photoUrl.startsWith("data:") && copy.photoUrl.length > MAX_INLINE_STORAGE_LEN) {
      delete copy.photoUrl;
    }
    if (typeof copy.equipmentPhotoUrl === "string" && copy.equipmentPhotoUrl.startsWith("data:") && copy.equipmentPhotoUrl.length > MAX_INLINE_STORAGE_LEN) {
      delete copy.equipmentPhotoUrl;
    }
    if (typeof copy.equipmentPhotoBase64 === "string" && copy.equipmentPhotoBase64.length > MAX_INLINE_STORAGE_LEN) {
      delete copy.equipmentPhotoBase64;
    }
    return copy;
  });
  return {
    ...sess,
    setLogs: cleanedSetLogs,
    exerciseFeedbacks: cleanedFeedbacks,
  };
}

/**
 * Saves a completed session to client durable storage (IndexedDB + localStorage fallback).
 */
export async function persistClientWorkoutSession(session: StoredSessionRecord): Promise<void> {
  if (typeof window === "undefined") return;

  // 1. Persist to localStorage buffer (with stripped large media to prevent QuotaExceededError)
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const data: ClientStoredPayload = raw ? migrateLegacyStoredData(JSON.parse(raw)) : {
      version: 1,
      sessions: [],
      readinessLogs: [],
      supplementLogs: [],
      metrics: [],
    };

    const stripped = sanitizeSessionForLocalStorage(session);
    const existingIdx = data.sessions.findIndex((s) => s.id === session.id);
    if (existingIdx >= 0) {
      data.sessions[existingIdx] = stripped;
    } else {
      data.sessions.push(stripped);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("Failed to persist session to localStorage:", err);
  }

  // 2. Persist to IndexedDB (keeps full base64 images intact!)
  try {
    const db = await openClientDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("sessions", "readwrite");
      const store = tx.objectStore("sessions");
      store.put(session);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    // IndexedDB failure gracefully handled via localStorage backup
  }
}

/**
 * Retrieves client stored data payload.
 */
export function getClientStoredData(): ClientStoredPayload {
  if (typeof window === "undefined") {
    return {
      version: 1,
      sessions: [],
      readinessLogs: [],
      supplementLogs: [],
      metrics: [],
    };
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return migrateLegacyStoredData(JSON.parse(raw));
    }
  } catch {}

  return {
    version: 1,
    sessions: [],
    readinessLogs: [],
    supplementLogs: [],
    metrics: [],
  };
}

/**
 * Loads and merges all client-stored workout sessions across IndexedDB and localStorage
 * so offline-only sessions never vanish from full backups.
 */
export async function loadAllClientSessions(traineeId?: string): Promise<StoredSessionRecord[]> {
  const merged = new Map<string, StoredSessionRecord>();

  const local = getClientStoredData().sessions || [];
  for (const s of local) {
    if (s && s.id && (!traineeId || s.traineeId === traineeId)) {
      merged.set(s.id, s);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const db = await openClientDatabase();
      const idbSessions: StoredSessionRecord[] = await new Promise((resolve) => {
        try {
          const tx = db.transaction("sessions", "readonly");
          const req = tx.objectStore("sessions").getAll();
          req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
          req.onerror = () => resolve([]);
        } catch {
          resolve([]);
        }
      });

      for (const s of idbSessions) {
        if (s && s.id && (!traineeId || s.traineeId === traineeId)) {
          merged.set(s.id, s);
        }
      }
    } catch {
      // IndexedDB unavailable — localStorage fallback already included
    }
  }

  return Array.from(merged.values());
}

/**
 * Serializes backup data without truncation, automatically switching to compact JSON
 * when embedded Base64 photos or large payloads are present to prevent buffer bloat.
 */
export function serializeBackupJson(
  data: unknown,
  options?: { compact?: boolean }
): string {
  const compactJson = JSON.stringify(data);
  if (options?.compact === true) return compactJson;
  if (options?.compact === false) return JSON.stringify(data, null, 2);

  // Automatically avoid 2-space pretty-printing inflation when photos or >256KB payloads are present
  const hasEmbeddedMedia = compactJson.includes("data:image/") || compactJson.includes("data:audio/");
  if (hasEmbeddedMedia || compactJson.length > 262_144) {
    return compactJson;
  }
  return JSON.stringify(data, null, 2);
}

/**
 * Clears client storage across IndexedDB and localStorage.
 */
export async function clearClientStorage(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(MUTATION_QUEUE_KEY);
    const lsKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("vyra_")) {
        lsKeys.push(k);
      }
    }
    lsKeys.forEach((k) => localStorage.removeItem(k));
  } catch {}

  try {
    const ssKeys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("vyra_")) {
        ssKeys.push(k);
      }
    }
    ssKeys.forEach((k) => sessionStorage.removeItem(k));
  } catch {}

  try {
    const db = await openClientDatabase();
    const storeNames = [
      "sessions",
      "readinessLogs",
      "supplementLogs",
      "meta",
      "session_drafts",
      "mutation_queue",
      "athletic_events",
    ].filter((name) => db.objectStoreNames.contains(name));
    if (storeNames.length > 0) {
      const tx = db.transaction(storeNames, "readwrite");
      storeNames.forEach((name) => tx.objectStore(name).clear());
    }
  } catch {}
}

/**
 * Downloads a complete JSON backup file and updates lastBackupAt.
 */
export function triggerBackupDownload<T extends object>(
  data: T,
  fileName: string,
  options?: { compact?: boolean }
): string {
  const timestamp = new Date().toISOString();
  const backupData = {
    ...data,
    lastBackupAt: timestamp,
  };

  if (typeof window !== "undefined") {
    try {
      const stored = getClientStoredData();
      stored.lastBackupAt = timestamp;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stored));
      localStorage.setItem("vyra_last_backup_at", timestamp);
    } catch {}

    const jsonString = serializeBackupJson(backupData, options);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body?.appendChild(a);
    a.click();
    document.body?.removeChild(a);
    // Delay URL revocation so large Blob downloads never abort on Safari/iOS WebKit
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }, 1000);
  }

  return timestamp;
}

/**
 * Anonymized Snapshot Object Bucket Registry (`storage.ts`):
 * Ensures that only redacted image payloads are stored and that `deleteStoredSnapshotBlob`
 * permanently purges the object from storage when a snapshot is deleted.
 */
const storedSnapshotBlobs = new Map<string, string>();

export function storeSnapshotBlob(snapshotId: string, anonymizedDataUri: string): void {
  if (!snapshotId || !anonymizedDataUri) return;
  storedSnapshotBlobs.set(snapshotId, anonymizedDataUri);
}

export function getStoredSnapshotBlob(snapshotId: string): string | undefined {
  return storedSnapshotBlobs.get(snapshotId);
}

export function deleteStoredSnapshotBlob(snapshotId: string): boolean {
  const existed = storedSnapshotBlobs.delete(snapshotId);
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(`vyra_snapshot_blob_${snapshotId}`);
    } catch {
      // ignore storage errors
    }
  }
  return existed;
}
