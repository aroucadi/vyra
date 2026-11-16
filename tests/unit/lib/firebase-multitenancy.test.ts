import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { Store } from "../../../src/lib/store";
import { seedExercises } from "../../../src/db/seed/exercises";
import {
  ALAA_CANONICAL_EMAIL,
  ALAA_CANONICAL_UID,
  AlaaEmailUnverifiedError,
  SESSION_COOKIE_NAME,
  resolveCanonicalUserIdFromDecodedToken,
} from "../../../src/lib/auth/server-session";
import { __setMockFirebaseAdminForTesting } from "../../../src/lib/firebase/admin";
import {
  loadBootstrapForUser,
  createFirestoreCoachDbAdapter,
} from "../../../src/lib/firebase/firestore-repository";
import { seedAlaaToFirestore } from "../../../src/db/seed/seed-firestore-alaa";
import { canTraineeUploadProgressPhotos } from "../../../src/lib/ai/visual-progress";
import {
  GET as getSessionRoute,
  POST as postSessionRoute,
  DELETE as deleteSessionRoute,
} from "../../../src/app/api/auth/session/route";
import { GET as getBootstrapRoute } from "../../../src/app/api/me/bootstrap/route";
import { POST as postSyncRoute } from "../../../src/app/api/me/sync/route";
import { POST as postSyncEventsRoute } from "../../../src/app/api/sync/events/route";
import { POST as postVisualProgressRoute } from "../../../src/app/api/ai/visual-progress/route";
import { POST as postAdaptDayRoute } from "../../../src/app/api/ai/adapt-day/route";
import { POST as postEquipmentPhotoRoute } from "../../../src/app/api/upload/equipment-photo/route";
import { POST as postPasskeyRoute } from "../../../src/app/api/auth/passkey/route";

function createInMemoryFirestoreMock() {
  const docs = new Map<string, Record<string, unknown>>();

  const makeSnap = (path: string) => {
    const data = docs.get(path);
    const id = path.split("/").pop() || "";
    return {
      id,
      exists: data !== undefined,
      ref: makeDocRef(path),
      data: () => (data ? structuredClone(data) : undefined),
    };
  };

  const makeDocRef = (path: string): any => ({
    id: path.split("/").pop() || "",
    path,
    collection: (name: string) => makeColRef(`${path}/${name}`),
    get: async () => makeSnap(path),
    set: async (data: Record<string, unknown>, opts?: { merge?: boolean }) => {
      if (opts?.merge && docs.has(path)) {
        docs.set(path, { ...docs.get(path)!, ...structuredClone(data) });
      } else {
        docs.set(path, structuredClone(data));
      }
    },
    delete: async () => {
      docs.delete(path);
    },
  });

  const makeColRef = (prefix: string): any => ({
    path: prefix,
    doc: (id: string) => makeDocRef(`${prefix}/${id}`),
    get: async () => {
      const prefixWithSlash = `${prefix}/`;
      const matched = Array.from(docs.keys())
        .filter((k) => {
          if (!k.startsWith(prefixWithSlash)) return false;
          const rest = k.slice(prefixWithSlash.length);
          return !rest.includes("/");
        })
        .sort()
        .map((k) => makeSnap(k));
      return {
        docs: matched,
        empty: matched.length === 0,
        size: matched.length,
      };
    },
  });

  const firestore: any = {
    collection: (name: string) => makeColRef(name),
    batch: () => {
      const ops: Array<() => void> = [];
      return {
        set: (ref: any, data: Record<string, unknown>, opts?: { merge?: boolean }) => {
          ops.push(() => {
            if (opts?.merge && docs.has(ref.path)) {
              docs.set(ref.path, { ...docs.get(ref.path)!, ...structuredClone(data) });
            } else {
              docs.set(ref.path, structuredClone(data));
            }
          });
        },
        delete: (ref: any) => {
          ops.push(() => {
            docs.delete(ref.path);
          });
        },
        commit: async () => {
          for (const op of ops) op();
        },
      };
    },
  };

  return { firestore, docs };
}

describe("Multi-Tenant Firebase Auth & Firestore Isolation Suite", () => {
  let mockStore: ReturnType<typeof createInMemoryFirestoreMock>;
  const tokenRegistry = new Map<string, any>();

  beforeEach(() => {
    mockStore = createInMemoryFirestoreMock();
    tokenRegistry.clear();

    tokenRegistry.set("tok_alaa_verified", {
      uid: "fb_alaa_real",
      email: "AlaaEddineRoucadi@gmail.com",
      email_verified: true,
      name: "Alaa",
      firebase: { sign_in_provider: "password" },
    });
    tokenRegistry.set("tok_alaa_google", {
      uid: "fb_alaa_google",
      email: ALAA_CANONICAL_EMAIL,
      email_verified: false,
      name: "Alaa Google",
      firebase: { sign_in_provider: "google.com" },
    });
    tokenRegistry.set("tok_alaa_unverified", {
      uid: "fb_attacker_1",
      email: ALAA_CANONICAL_EMAIL,
      email_verified: false,
      name: "Attacker",
      firebase: { sign_in_provider: "password" },
    });
    tokenRegistry.set("tok_stranger", {
      uid: "fb_stranger_99",
      email: "new.athlete@example.com",
      email_verified: true,
      name: "New Athlete",
      firebase: { sign_in_provider: "password" },
    });

    const verifyTokenFn = async (token: string) => {
      const found = tokenRegistry.get(token);
      if (!found) throw new Error("Invalid Firebase token");
      return found;
    };

    __setMockFirebaseAdminForTesting({
      auth: {
        verifyIdToken: verifyTokenFn,
        verifySessionCookie: verifyTokenFn,
        createSessionCookie: async (idToken: string) => idToken,
      },
      firestore: mockStore.firestore,
    });
  });

  afterEach(() => {
    __setMockFirebaseAdminForTesting(null);
  });

  it("1. Store({ forceEmpty: true }) boots completely empty with zero Alaa leaks and full exercise catalogue", () => {
    const cleanStore = new Store({ forceEmpty: true });
    const user = cleanStore.getCurrentUser();

    assert.ok(user.id.startsWith("anon_"));
    assert.notEqual(user.id, ALAA_CANONICAL_UID);
    assert.equal(cleanStore.getPrograms().length, 0);
    assert.equal(cleanStore.getSessions(user.id).length, 0);
    assert.equal(cleanStore.getMetrics(user.id).length, 0);
    assert.equal(cleanStore.getUserGymLocations(user.id).length, 0);
    assert.equal(cleanStore.getExercises().length, seedExercises.length);
    assert.ok(cleanStore.getExercises().length > 0, "Exercise catalogue remains available on empty boot");
  });

  it("2. Enforces verified-email identity resolution so ONLY verified alaaeddineroucadi@gmail.com unlocks trainee_alaa", () => {
    assert.throws(
      () =>
        resolveCanonicalUserIdFromDecodedToken({
          uid: "fb_attacker",
          email: ALAA_CANONICAL_EMAIL,
          email_verified: false,
          firebase: { identities: {}, sign_in_provider: "password" },
        }),
      AlaaEmailUnverifiedError
    );

    const resolvedVerified = resolveCanonicalUserIdFromDecodedToken({
      uid: "fb_alaa_uid",
      email: "ALAAEDDINEROUCADI@GMAIL.COM",
      email_verified: true,
      firebase: { identities: {}, sign_in_provider: "password" },
    });
    assert.equal(resolvedVerified, ALAA_CANONICAL_UID);

    const resolvedGoogle = resolveCanonicalUserIdFromDecodedToken({
      uid: "fb_alaa_google_uid",
      email: ALAA_CANONICAL_EMAIL,
      email_verified: false,
      firebase: { identities: {}, sign_in_provider: "google.com" },
    });
    assert.equal(resolvedGoogle, ALAA_CANONICAL_UID);

    const resolvedStranger = resolveCanonicalUserIdFromDecodedToken({
      uid: "fb_stranger_99",
      email: "stranger@example.com",
      email_verified: true,
      firebase: { identities: {}, sign_in_provider: "password" },
    });
    assert.equal(resolvedStranger, "fb_stranger_99");
  });

  it("3. Seeds Alaa idempotently into Firestore without clobbering logged sessions and loads clean bootstrap", async () => {
    // Pre-populate one logged session to prove idempotent re-seed never overwrites workouts
    await mockStore.firestore
      .collection("users")
      .doc(ALAA_CANONICAL_UID)
      .collection("sessions")
      .doc("sess_existing_1")
      .set({
        id: "sess_existing_1",
        traineeId: ALAA_CANONICAL_UID,
        programId: "prog_master_5day_v2",
        dayId: "m_w1_d0",
        date: "2026-11-23",
        setLogs: [{ id: "sl_1", exerciseName: "lever chest press", weightKg: 40, reps: 12 }],
      });

    const seedRes = await seedAlaaToFirestore({
      db: mockStore.firestore,
      skipAuth: true,
    });
    assert.equal(seedRes.success, true);
    assert.equal(seedRes.uid, ALAA_CANONICAL_UID);
    assert.equal(seedRes.email, ALAA_CANONICAL_EMAIL);
    assert.equal(seedRes.weeksWritten, 16);
    assert.equal(seedRes.athleteModelSynced, true);

    const alaaBoot = await loadBootstrapForUser(
      { uid: ALAA_CANONICAL_UID, email: ALAA_CANONICAL_EMAIL, displayName: "Alaa" },
      mockStore.firestore
    );
    assert.equal(alaaBoot.user.id, ALAA_CANONICAL_UID);
    assert.equal(alaaBoot.user.role, "both");
    assert.equal(alaaBoot.programs.length, 1);
    assert.equal(alaaBoot.programs[0].id, "prog_master_5day_v2");
    assert.equal(alaaBoot.programs[0].weeks.length, 16);
    assert.equal(alaaBoot.sessions.length, 1, "Existing logged sessions must survive re-seeding");
    assert.ok(alaaBoot.athleteModel, "Seeded AthleteModel must hydrate");

    // Non-Alaa user gets completely empty tenant profile & zero access to Alaa data
    const strangerBoot = await loadBootstrapForUser(
      { uid: "fb_stranger_99", email: "new.athlete@example.com", displayName: "Stranger" },
      mockStore.firestore
    );
    assert.equal(strangerBoot.user.id, "fb_stranger_99");
    assert.equal(strangerBoot.programs.length, 0);
    assert.equal(strangerBoot.sessions.length, 0);
    assert.equal(strangerBoot.metrics.length, 0);
  });

  it("4. /api/auth/session, /api/me/bootstrap & /api/me/sync enforce email verification, cookie session & tenant isolation", async () => {
    await seedAlaaToFirestore({ db: mockStore.firestore, skipAuth: true });

    // A) Unverified Alaa email signup blocked with 403
    const unverifiedRes = await postSessionRoute(
      new NextRequest("http://localhost:3000/api/auth/session", {
        method: "POST",
        body: JSON.stringify({ idToken: "tok_alaa_unverified" }),
        headers: { "Content-Type": "application/json" },
      })
    );
    assert.equal(unverifiedRes.status, 403);
    const unverifiedJson = await unverifiedRes.json();
    assert.equal(unverifiedJson.code, "ALAA_EMAIL_UNverified".replace("verified", "VERIFIED"));

    // B) Verified Alaa login succeeds and mints session cookie
    const alaaRes = await postSessionRoute(
      new NextRequest("http://localhost:3000/api/auth/session", {
        method: "POST",
        body: JSON.stringify({ idToken: "tok_alaa_verified" }),
        headers: { "Content-Type": "application/json" },
      })
    );
    assert.equal(alaaRes.status, 200);
    const alaaJson = await alaaRes.json();
    assert.equal(alaaJson.uid, ALAA_CANONICAL_UID);
    assert.equal(alaaJson.isAlaa, true);
    assert.ok(alaaRes.cookies.get(SESSION_COOKIE_NAME)?.value);

    // C) GET /api/me/bootstrap without auth returns unauthenticated empty state
    const anonBootRes = await getBootstrapRoute(
      new NextRequest("http://localhost:3000/api/me/bootstrap")
    );
    assert.equal(anonBootRes.status, 200);
    const anonBootJson = await anonBootRes.json();
    assert.equal(anonBootJson.authenticated, false);
    assert.equal(anonBootJson.bootstrap, null);

    // D) GET /api/me/bootstrap for Alaa returns seeded Nov 23 5-day program
    const alaaBootRes = await getBootstrapRoute(
      new NextRequest("http://localhost:3000/api/me/bootstrap", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=tok_alaa_verified` },
      })
    );
    assert.equal(alaaBootRes.status, 200);
    const alaaBootJson = await alaaBootRes.json();
    assert.equal(alaaBootJson.authenticated, true);
    assert.equal(alaaBootJson.isAlaa, true);
    assert.equal(alaaBootJson.bootstrap.programs[0].id, "prog_master_5day_v2");

    // E) POST /api/me/sync rejects unauthenticated callers (401) & writes strictly under caller uid
    const unauthSync = await postSyncRoute(
      new NextRequest("http://localhost:3000/api/me/sync", {
        method: "POST",
        body: JSON.stringify({ metrics: [{ id: "bm_hack", traineeId: ALAA_CANONICAL_UID, date: "2026-11-23", weightKg: 99 }] }),
      })
    );
    assert.equal(unauthSync.status, 401);

    const strangerSync = await postSyncRoute(
      new NextRequest("http://localhost:3000/api/me/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer tok_stranger",
        },
        body: JSON.stringify({
          metrics: [{ id: "bm_s1", traineeId: ALAA_CANONICAL_UID, date: "2026-11-23", weightKg: 70 }],
        }),
      })
    );
    assert.equal(strangerSync.status, 200);
    // Stored under stranger UID, NOT Alaa's collection
    assert.equal(mockStore.docs.has(`users/fb_stranger_99/metrics/bm_s1`), true);
    assert.equal(mockStore.docs.has(`users/${ALAA_CANONICAL_UID}/metrics/bm_s1`), false);

    // F) GET & DELETE session cookie lifecycle
    const sessionCheckRes = await getSessionRoute(
      new NextRequest("http://localhost:3000/api/auth/session", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=tok_stranger` },
      })
    );
    assert.equal((await sessionCheckRes.json()).uid, "fb_stranger_99");

    const delRes = await deleteSessionRoute(
      new NextRequest("http://localhost:3000/api/auth/session", { method: "DELETE" })
    );
    assert.equal(delRes.cookies.get(SESSION_COOKIE_NAME)?.value, "");
  });

  it("5. Blocks unauthenticated or cross-tenant spoofing of trainee_alaa on /api/sync/events and /api/ai/visual-progress", async () => {
    const spoofSyncRes = await postSyncEventsRoute(
      new NextRequest("http://localhost:3000/api/sync/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vyra-enforce-auth": "true",
        },
        body: JSON.stringify({
          traineeId: ALAA_CANONICAL_UID,
          events: [{ id: "ev_1", type: "WORKOUT_COMPLETED", timestampEpochMs: Date.now() }],
        }),
      })
    );
    assert.equal(spoofSyncRes.status, 401);

    const strangerVisualRes = await postVisualProgressRoute(
      new NextRequest("http://localhost:3000/api/ai/visual-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vyra-enforce-auth": "true",
          Authorization: "Bearer tok_stranger",
        },
        body: JSON.stringify({
          action: "capture",
          traineeId: ALAA_CANONICAL_UID,
          rawImageDataUri: "data:image/png;base64,iVBORw0KGgo=",
        }),
      })
    );
    assert.equal(strangerVisualRes.status, 403);

    assert.equal(canTraineeUploadProgressPhotos(ALAA_CANONICAL_UID).allowed, true);
    assert.equal(canTraineeUploadProgressPhotos(ALAA_CANONICAL_EMAIL).allowed, true);
    assert.equal(canTraineeUploadProgressPhotos("fb_stranger_99").allowed, false);
  });

  it("6. Firestore Coach DB adapter persists and loads Shadow Logs without cross-tenant contamination", async () => {
    const adapter = createFirestoreCoachDbAdapter(mockStore.firestore);
    await adapter.insertShadowLogInDb({
      id: "slog_1",
      traineeId: ALAA_CANONICAL_UID,
      timestamp: new Date().toISOString(),
      sourceRoute: "unit-test",
      promptSummary: "Elbow check",
      decision: { action: "swap" },
    });

    const alaaLogs = await adapter.loadShadowLogsFromDb(ALAA_CANONICAL_UID);
    const strangerLogs = await adapter.loadShadowLogsFromDb("fb_stranger_99");
    assert.equal(alaaLogs.length, 1);
    assert.equal(strangerLogs.length, 0);
  });

  it("7. Enforces tenant guards on /api/ai/adapt-day, /api/upload/equipment-photo, /api/auth/passkey and claims local anon data on bootstrap", async () => {
    const adaptSpoof = await postAdaptDayRoute(
      new NextRequest("http://localhost:3000/api/ai/adapt-day", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-vyra-enforce-auth": "true" },
        body: JSON.stringify({ traineeId: ALAA_CANONICAL_UID, exercises: [] }),
      })
    );
    assert.equal(adaptSpoof.status, 401);

    const equipSpoof = await postEquipmentPhotoRoute(
      new NextRequest("http://localhost:3000/api/upload/equipment-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-vyra-enforce-auth": "true" },
        body: JSON.stringify({ traineeId: ALAA_CANONICAL_UID, imageBase64: "data:image/png;base64,iVBORw0KGgo=" }),
      })
    );
    assert.equal(equipSpoof.status, 401);

    const passkeySpoof = await postPasskeyRoute(
      new NextRequest("http://localhost:3000/api/auth/passkey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vyra-enforce-auth": "true",
          Authorization: "Bearer tok_stranger",
        },
        body: JSON.stringify({ userId: ALAA_CANONICAL_UID, credentialId: "cred_123" }),
      })
    );
    assert.equal(passkeySpoof.status, 403);

    // Local anon workout/metric claiming into authenticated tenant on hydrateFromBootstrap
    const store = new Store({ forceEmpty: true });
    const anonId = store.getCurrentUser().id;
    store.addMetric(anonId, 71.4, "2026-11-16");

    const strangerBoot = await loadBootstrapForUser(
      { uid: "fb_stranger_99", email: "new.athlete@example.com", displayName: "New Athlete" },
      mockStore.firestore
    );
    store.hydrateFromBootstrap(strangerBoot);

    const claimedMetrics = store.getMetrics("fb_stranger_99");
    assert.equal(claimedMetrics.length, 1);
    assert.equal(claimedMetrics[0].weightKg, 71.4);
  });
});
