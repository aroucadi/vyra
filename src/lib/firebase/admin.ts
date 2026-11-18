import { initializeApp, getApps, applicationDefault, App } from "firebase-admin/app";
import { getAuth, Auth, DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

const DEFAULT_PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "vyra-509011";

export interface FirebaseAdminMock {
  auth?: Partial<Auth> & {
    verifyIdToken?: (token: string, checkRevoked?: boolean) => Promise<DecodedIdToken>;
    verifySessionCookie?: (cookie: string, checkRevoked?: boolean) => Promise<DecodedIdToken>;
    createSessionCookie?: (idToken: string, options: { expiresIn: number }) => Promise<string>;
  };
  firestore?: Firestore;
}

const ADMIN_GLOBAL_KEY = "__vyraFirebaseAdminMock";

export function __setMockFirebaseAdminForTesting(mock: FirebaseAdminMock | null): void {
  (globalThis as Record<string, unknown>)[ADMIN_GLOBAL_KEY] = mock;
}

function getMockAdmin(): FirebaseAdminMock | null {
  return ((globalThis as Record<string, unknown>)[ADMIN_GLOBAL_KEY] as FirebaseAdminMock | null | undefined) || null;
}

export function getFirebaseAdminApp(): App {
  if (typeof window !== "undefined") {
    throw new Error("Firebase Admin SDK must never be initialized in the browser.");
  }

  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }

  // In offline, unit-test, or CI environments without GCP credentials, avoid calling
  // applicationDefault() which spawns unhandled background credential-lookup rejections.
  if (!isFirestoreRuntimeAvailable()) {
    return initializeApp({
      projectId: DEFAULT_PROJECT_ID,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId: DEFAULT_PROJECT_ID,
  });
}

export function getFirebaseAdminAuth(): Auth {
  const mock = getMockAdmin();
  if (mock?.auth) {
    return mock.auth as Auth;
  }
  return getAuth(getFirebaseAdminApp());
}

export function getFirestoreDb(): Firestore {
  const mock = getMockAdmin();
  if (mock?.firestore) {
    return mock.firestore;
  }
  return getFirestore(getFirebaseAdminApp());
}

/**
 * Returns true only when Firestore is explicitly available either via a unit-test mock,
 * Firestore emulator, explicit credentials, or GCP Cloud Run runtime (`K_SERVICE`).
 * Prevents unit tests from hanging on GCE metadata fetches when no mock is installed.
 */
export function isFirestoreRuntimeAvailable(): boolean {
  const mock = getMockAdmin();
  if (mock?.firestore) return true;
  if (typeof window !== "undefined") return false;
  return Boolean(
    process.env.K_SERVICE ||
      process.env.CLOUD_RUN_JOB ||
      process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}
