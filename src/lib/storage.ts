/**
 * Vyra Client Storage & IndexedDB Adapter
 * 
 * Provides client-side durable persistence for workout sessions,
 * set logs, readiness check-ins, and supplement logs with schema migration
 * support for previously stored legacy formats.
 */

export const DB_NAME = "vyra_client_db";
export const DB_VERSION = 1;

export interface ClientStoredPayload {
  version: number;
  sessions: any[];
  readinessLogs: any[];
  supplementLogs: any[];
  metrics: any[];
  lastBackupAt?: string;
}

/**
 * Migrates old/legacy storage format safely without data loss.
 * Handles legacy feeling states ("depleted", "suboptimal", "optimal")
 * and migrates legacy cnsFatigueDetected keys to reducedRecovery.
 */
export function migrateLegacyStoredData(raw: any): ClientStoredPayload {
  if (!raw || typeof raw !== "object") {
    return {
      version: 1,
      sessions: [],
      readinessLogs: [],
      supplementLogs: [],
      metrics: [],
    };
  }

  // If already versioned array structure
  const sessions = Array.isArray(raw.sessions) ? raw.sessions : [];
  const metrics = Array.isArray(raw.metrics) ? raw.metrics : [];
  const supplementLogs = Array.isArray(raw.supplementLogs) ? raw.supplementLogs : [];
  const rawReadiness = Array.isArray(raw.readinessLogs)
    ? raw.readinessLogs
    : Array.isArray(raw.wearableBiometrics)
    ? raw.wearableBiometrics
    : [];

  const migratedReadiness = rawReadiness.map((entry: any) => {
    const migrated: any = {
      id: entry.id || `readiness_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      traineeId: entry.traineeId || "trainee_alaa",
      date: entry.date || new Date().toISOString().split("T")[0],
      source: entry.source || "manual",
      sleepHours: typeof entry.sleepHours === "number" ? entry.sleepHours : 7.0,
      receivedAt: entry.receivedAt || new Date().toISOString(),
    };

    // Migrate feeling/answer
    if (entry.feeling) {
      if (entry.feeling === "depleted") migrated.answer = "light";
      else if (entry.feeling === "suboptimal") migrated.answer = "moderate";
      else if (entry.feeling === "optimal") migrated.answer = "full";
      else migrated.answer = entry.feeling;
    } else if (entry.answer) {
      migrated.answer = entry.answer;
    } else {
      migrated.answer = migrated.sleepHours < 6 ? "light" : migrated.sleepHours < 7.5 ? "moderate" : "full";
    }

    // Migrate cnsFatigueDetected -> reducedRecovery
    if (typeof entry.reducedRecovery === "boolean") {
      migrated.reducedRecovery = entry.reducedRecovery;
    } else if (typeof entry.cnsFatigueDetected === "boolean") {
      migrated.reducedRecovery = entry.cnsFatigueDetected;
    } else {
      migrated.reducedRecovery = migrated.answer === "light" || migrated.answer === "moderate";
    }

    // Only real wearables retain hrvMs and biometric telemetry
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
 * Opens or initializes the client IndexedDB database.
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
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Requests persistent storage via navigator.storage.persist().
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window !== "undefined" && window.navigator && window.navigator.storage && window.navigator.storage.persist) {
    try {
      const isPersisted = await window.navigator.storage.persist();
      return isPersisted;
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
  if (typeof window !== "undefined" && window.navigator && window.navigator.storage && window.navigator.storage.persisted) {
    try {
      return await window.navigator.storage.persisted();
    } catch {
      return false;
    }
  }
  return false;
}
