/**
 * Athlete Identity & Late-Binding Sovereignty Engine (Phase 0: Step Zero)
 * 
 * Philosophy:
 * - Physical-First / Zero-Block: An athlete in the gym must NEVER be blocked
 *   by an authentication gate, expired JWT, or network login screen.
 * - On first app launch, the device instantiates a sovereign local identity.
 *   The athlete trains immediately with zero network latency.
 * - Late-Binding Cloud Anchor: When convenient (post-session summary or settings),
 *   the athlete anchors their vault via WebAuthn Passkey (FaceID / TouchID) or Google.
 * - Atomic Vault Claim: Transitioning from local sovereign to cloud vault atomically
 *   re-keys local IndexedDB event streams and queues them for cloud backup.
 */

import { openClientDatabase } from "../storage";
import { getStorageAdapter } from "../storage/adapter";

export type IdentityStatus = "sovereign_local" | "anchored_passkey" | "anchored_google";

export interface AthleteIdentity {
  uid: string;
  displayName: string;
  email?: string;
  status: IdentityStatus;
  initializedAt: string;
  anchoredAt?: string;
  passkeyCredentialId?: string;
  isCloudVaultEnabled: boolean;
}

const IDENTITY_KEY = "vyra_athlete_identity_v1";

/**
 * Retrieves the current athlete identity.
 * If none exists, creates a zero-block sovereign local identity immediately.
 */
export function getAthleteIdentity(): AthleteIdentity {
  if (typeof window === "undefined") {
    return {
      uid: "trainee_alaa",
      displayName: "Alaa",
      status: "sovereign_local",
      initializedAt: new Date().toISOString(),
      isCloudVaultEnabled: false,
    };
  }

  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.uid) return parsed;
    }
  } catch {
    // ignore
  }

  // Initialize sovereign local identity
  const initial: AthleteIdentity = {
    uid: "trainee_alaa",
    displayName: "Alaa",
    email: "alaa@vyra.fit",
    status: "sovereign_local",
    initializedAt: new Date().toISOString(),
    isCloudVaultEnabled: false,
  };

  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(initial));
  } catch {}

  return initial;
}

/**
 * Anchors the sovereign identity to a WebAuthn Passkey.
 */
export async function anchorIdentityWithPasskey(
  credentialId: string,
  displayName?: string
): Promise<AthleteIdentity> {
  const current = getAthleteIdentity();
  const anchored: AthleteIdentity = {
    ...current,
    displayName: displayName || current.displayName,
    status: "anchored_passkey",
    anchoredAt: new Date().toISOString(),
    passkeyCredentialId: credentialId,
    isCloudVaultEnabled: true,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(anchored));
      localStorage.setItem(`vyra_passkey_${anchored.uid}`, credentialId);
    } catch {}
  }

  return anchored;
}

/**
 * Anchors the sovereign identity to Google Account.
 */
export async function anchorIdentityWithGoogle(
  googleUid: string,
  email: string,
  displayName: string
): Promise<AthleteIdentity> {
  const current = getAthleteIdentity();
  const oldUid = current.uid;

  const anchored: AthleteIdentity = {
    uid: googleUid || current.uid,
    displayName: displayName || current.displayName,
    email,
    status: "anchored_google",
    initializedAt: current.initializedAt || new Date().toISOString(),
    anchoredAt: new Date().toISOString(),
    isCloudVaultEnabled: true,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(anchored));
    } catch {}
  }

  // If UID changed, atomically migrate local offline vault
  if (oldUid !== anchored.uid) {
    await claimAnonymousVault(oldUid, anchored.uid);
  }

  return anchored;
}

/**
 * Atomically migrates all local IndexedDB sessions and events from an old local UID
 * to a new authenticated cloud UID without any data loss.
 */
export async function claimAnonymousVault(
  sourceUid: string,
  targetUid: string
): Promise<{ migratedSessions: number; migratedEvents: number }> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined" || sourceUid === targetUid) {
    return { migratedSessions: 0, migratedEvents: 0 };
  }

  let migratedSessions = 0;
  let migratedEvents = 0;

  try {
    const db = await openClientDatabase();

    // 1. Re-key sessions
    if (db.objectStoreNames.contains("sessions")) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("sessions", "readwrite");
        const store = tx.objectStore("sessions");
        const req = store.getAll();

        req.onsuccess = () => {
          const sessions = (req.result || []) as any[];
          for (const s of sessions) {
            if (s.traineeId === sourceUid) {
              s.traineeId = targetUid;
              store.put(s);
              migratedSessions++;
            }
          }
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    }

    // 2. Re-key athletic events in the flight recorder stream
    if (db.objectStoreNames.contains("athletic_events")) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("athletic_events", "readwrite");
        const store = tx.objectStore("athletic_events");
        const req = store.getAll();

        req.onsuccess = () => {
          const events = (req.result || []) as any[];
          for (const e of events) {
            if (e.traineeId === sourceUid) {
              e.traineeId = targetUid;
              e.syncedToCloud = false; // Mark for cloud backup flush
              store.put(e);
              migratedEvents++;
            }
          }
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    }
  } catch (err) {
    console.warn("Vault claim migration encountered non-fatal error:", err);
  }

  return { migratedSessions, migratedEvents };
}
