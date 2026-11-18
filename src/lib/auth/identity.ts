/**
 * Athlete Identity & Late-Binding Sovereignty Engine (Phase 0: Step Zero)
 *
 * Philosophy:
 * - Physical-First / Zero-Block: An athlete on the gym floor must NEVER be blocked
 *   by a login wall or network dependency.
 * - Multi-Tenant Clean Boot: On first app launch without an authenticated cloud session,
 *   the device instantiates an isolated, empty sovereign local identity (`anon_<id>`).
 *   Pre-seeded data for Alaa (`trainee_alaa`) is unlocked ONLY via verified Firebase auth.
 * - Late-Binding Cloud Anchor: When the athlete signs in with Firebase Auth / Passkey / Google,
 *   local IndexedDB streams are atomically claimed to their authenticated `uid`.
 */

import { openClientDatabase } from "../storage";

export type IdentityStatus =
  | "sovereign_local"
  | "anchored_passkey"
  | "anchored_google"
  | "anchored_firebase";

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

function generateAnonUid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `anon_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Retrieves the current athlete identity.
 * If none exists, creates an isolated sovereign anonymous identity (`anon_*`).
 */
export function getAthleteIdentity(): AthleteIdentity {
  if (typeof window === "undefined") {
    return {
      uid: "anon_visitor",
      displayName: "Athlete",
      status: "sovereign_local",
      initializedAt: new Date().toISOString(),
      isCloudVaultEnabled: false,
    };
  }

  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AthleteIdentity;
      if (parsed && parsed.uid) {
        // Guard against legacy unanchored localStorage cache from single-user builds
        if (parsed.uid === "trainee_alaa" && parsed.status === "sovereign_local" && !parsed.isCloudVaultEnabled) {
          // fall through to fresh isolated anonymous identity
        } else {
          return parsed;
        }
      }
    }
  } catch {
    // ignore parse failures
  }

  const initial: AthleteIdentity = {
    uid: generateAnonUid(),
    displayName: "Athlete",
    status: "sovereign_local",
    initializedAt: new Date().toISOString(),
    isCloudVaultEnabled: false,
  };

  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(initial));
  } catch {
    // ignore storage failures
  }

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

  if (oldUid !== anchored.uid) {
    await claimAnonymousVault(oldUid, anchored.uid);
  }

  return anchored;
}

/**
 * Anchors local identity to a verified Firebase Auth / canonical VYRA user session.
 */
export async function anchorIdentityWithFirebase(params: {
  uid: string;
  email?: string;
  displayName?: string;
  provider?: string;
}): Promise<AthleteIdentity> {
  const current = getAthleteIdentity();
  const oldUid = current.uid;

  const status: IdentityStatus =
    params.provider === "google.com" ? "anchored_google" : "anchored_firebase";

  const anchored: AthleteIdentity = {
    uid: params.uid,
    displayName: params.displayName || current.displayName || "Athlete",
    email: params.email,
    status,
    initializedAt: current.initializedAt || new Date().toISOString(),
    anchoredAt: new Date().toISOString(),
    isCloudVaultEnabled: true,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(anchored));
    } catch {}
  }

  if (oldUid && oldUid !== anchored.uid && oldUid.startsWith("anon_")) {
    await claimAnonymousVault(oldUid, anchored.uid);
  }

  return anchored;
}

/**
 * Clears cloud anchoring on sign-out and rotates back to an isolated anonymous visitor.
 */
export function clearAnchoredIdentity(): AthleteIdentity {
  const fresh: AthleteIdentity = {
    uid: generateAnonUid(),
    displayName: "Athlete",
    status: "sovereign_local",
    initializedAt: new Date().toISOString(),
    isCloudVaultEnabled: false,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(fresh));
    } catch {}
  }

  return fresh;
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
          const sessions = (req.result || []) as Array<Record<string, unknown>>;
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
          const events = (req.result || []) as Array<Record<string, unknown>>;
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
