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
  sanitizeFirestoreDocId,
  buildEmptyUserProfile,
  saveUserSyncBatch,
  saveProgramToFirestore,
  loadGymInventoriesFromFirestore,
  loadSensoryEntriesFromFirestore,
  saveVisualSnapshotToFirestore,
  loadVisualSnapshotsFromFirestore,
} from "../../../src/lib/firebase/firestore-repository";
import { seedAlaaToFirestore } from "../../../src/db/seed/seed-firestore-alaa";
import {
  canTraineeUploadProgressPhotos,
  visualProgressStore,
} from "../../../src/lib/ai/visual-progress";
import { gymVisionInventoryStore } from "../../../src/lib/ai/gym-vision-inventory";
import { sensoryMemoryStore } from "../../../src/lib/ai/sensory-memory";
import {
  GET as getSessionRoute,
  POST as postSessionRoute,
  DELETE as deleteSessionRoute,
} from "../../../src/app/api/auth/session/route";
import { GET as getBootstrapRoute } from "../../../src/app/api/me/bootstrap/route";
import { POST as postSyncRoute } from "../../../src/app/api/me/sync/route";
import { POST as postSyncEventsRoute } from "../../../src/app/api/sync/events/route";
import {
  GET as getVisualProgressRoute,
  POST as postVisualProgressRoute,
  DELETE as deleteVisualProgressRoute,
} from "../../../src/app/api/ai/visual-progress/route";
import { POST as postAdaptDayRoute } from "../../../src/app/api/ai/adapt-day/route";
import { POST as postEvolveRoute } from "../../../src/app/api/ai/evolve/route";
import { POST as postEquipmentPhotoRoute } from "../../../src/app/api/upload/equipment-photo/route";
import { POST as postPasskeyRoute } from "../../../src/app/api/auth/passkey/route";
import {
  GET as getInvitesRoute,
  POST as postInvitesRoute,
} from "../../../src/app/api/invites/route";

interface MockDocSnap {
  id: string;
  exists: boolean;
  ref: MockDocRef;
  data: () => Record<string, unknown> | undefined;
}

interface MockDocRef {
  id: string;
  path: string;
  collection: (name: string) => MockColRef;
  get: () => Promise<MockDocSnap>;
  set: (data: Record<string, unknown>, opts?: { merge?: boolean }) => Promise<void>;
  delete: () => Promise<void>;
}

interface MockColRef {
  path: string;
  doc: (id: string) => MockDocRef;
  get: () => Promise<{ docs: MockDocSnap[]; empty: boolean; size: number }>;
}

interface MockDecodedToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  firebase?: { sign_in_provider?: string };
}

function createInMemoryFirestoreMock() {
  const docs = new Map<string, Record<string, unknown>>();

  const makeSnap = (path: string): MockDocSnap => {
    const data = docs.get(path);
    const id = path.split("/").pop() || "";
    return {
      id,
      exists: data !== undefined,
      ref: makeDocRef(path),
      data: () => (data ? structuredClone(data) : undefined),
    };
  };

  const makeDocRef = (path: string): MockDocRef => ({
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

  const makeColRef = (prefix: string): MockColRef => ({
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

  const firestore = {
    collection: (name: string) => makeColRef(name),
    batch: () => {
      const ops: Array<() => void> = [];
      return {
        set: (ref: MockDocRef, data: Record<string, unknown>, opts?: { merge?: boolean }) => {
          ops.push(() => {
            if (opts?.merge && docs.has(ref.path)) {
              docs.set(ref.path, { ...docs.get(ref.path)!, ...structuredClone(data) });
            } else {
              docs.set(ref.path, structuredClone(data));
            }
          });
        },
        delete: (ref: MockDocRef) => {
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
  const tokenRegistry = new Map<string, MockDecodedToken>();

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traineeId: ALAA_CANONICAL_UID, exercises: [] }),
      })
    );
    assert.equal(adaptSpoof.status, 401);

    const equipSpoof = await postEquipmentPhotoRoute(
      new NextRequest("http://localhost:3000/api/upload/equipment-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traineeId: ALAA_CANONICAL_UID, imageBase64: "data:image/png;base64,iVBORw0KGgo=" }),
      })
    );
    assert.equal(equipSpoof.status, 401);

    const passkeySpoof = await postPasskeyRoute(
      new NextRequest("http://localhost:3000/api/auth/passkey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

  it("8. /gstack-review regressions: blocks arbitrary non-anon UID spoofing, sanitizes path traversal IDs, keeps newest 365 metrics, cleans orphaned program weeks, and grants role=both to new users", async () => {
    // A) Unauthenticated caller targeting a non-Alaa registered Firebase UID ("fb_stranger_99") is rejected (401)
    const strangerSpoofRes = await postSyncEventsRoute(
      new NextRequest("http://localhost:3000/api/sync/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traineeId: "fb_stranger_99",
          events: [{ id: "ev_1", type: "WORKOUT_COMPLETED", timestampEpochMs: Date.now() }],
        }),
      })
    );
    assert.equal(strangerSpoofRes.status, 401);

    // B) Malicious doc ID containing path traversal (`/` and `..`) is sanitized and cannot escape user collection
    assert.equal(sanitizeFirestoreDocId("../../users/trainee_alaa/metrics/hack"), "users_trainee_alaa_metrics_hack");
    assert.equal(sanitizeFirestoreDocId(".."), null);
    await saveUserSyncBatch(
      "fb_stranger_99",
      {
        metrics: [
          {
            id: "../trainee_alaa/metrics/injected",
            traineeId: "fb_stranger_99",
            date: "2026-11-23",
            weightKg: 75,
            source: "manual",
          },
        ],
      },
      mockStore.firestore
    );
    assert.equal(mockStore.docs.has("users/trainee_alaa/metrics/injected"), false);
    assert.equal(
      mockStore.docs.has("users/fb_stranger_99/metrics/trainee_alaa_metrics_injected"),
      true
    );

    // C) Newly registered non-Alaa user gets role="both" so Coach Studio & Program Builder are unlocked
    const emptyProfile = buildEmptyUserProfile({
      uid: "fb_new_coach_athlete",
      email: "newbie@example.com",
    });
    assert.equal(emptyProfile.role, "both");

    // D) saveUserSyncBatch keeps the newest 365 metrics (not oldest 365)
    const manyMetrics = Array.from({ length: 370 }, (_, i) => ({
      id: `bm_day_${i + 1}`,
      traineeId: "fb_stranger_99",
      date: "2026-11-23",
      weightKg: 60 + i * 0.1,
      source: "manual" as const,
    }));
    await saveUserSyncBatch("fb_stranger_99", { metrics: manyMetrics }, mockStore.firestore);
    assert.equal(mockStore.docs.has("users/fb_stranger_99/metrics/bm_day_370"), true);
    assert.equal(mockStore.docs.has("users/fb_stranger_99/metrics/bm_day_1"), false);

    // E) saveProgramToFirestore deletes orphaned week docs when a program is shortened
    await saveProgramToFirestore(
      "fb_stranger_99",
      {
        id: "prog_shorten_test",
        trainerId: "fb_stranger_99",
        traineeId: "fb_stranger_99",
        title: "4-Week Test",
        status: "published",
        updatedAt: new Date().toISOString(),
        weeks: [
          { weekIndex: 1, days: [] },
          { weekIndex: 2, days: [] },
          { weekIndex: 3, days: [] },
          { weekIndex: 4, days: [] },
        ],
      },
      mockStore.firestore
    );
    assert.equal(mockStore.docs.has("users/fb_stranger_99/programs/prog_shorten_test/weeks/w04"), true);

    await saveProgramToFirestore(
      "fb_stranger_99",
      {
        id: "prog_shorten_test",
        trainerId: "fb_stranger_99",
        traineeId: "fb_stranger_99",
        title: "2-Week Shortened",
        status: "published",
        updatedAt: new Date().toISOString(),
        weeks: [
          { weekIndex: 1, days: [] },
          { weekIndex: 2, days: [] },
        ],
      },
      mockStore.firestore
    );
    assert.equal(mockStore.docs.has("users/fb_stranger_99/programs/prog_shorten_test/weeks/w02"), true);
    assert.equal(mockStore.docs.has("users/fb_stranger_99/programs/prog_shorten_test/weeks/w04"), false);

    // F) GymVisionInventoryStore never leaks Alaa's gym name to non-Alaa athletes
    assert.equal(
      gymVisionInventoryStore.getInventoryForGym(undefined, undefined, "fb_stranger_99").gymName,
      "Commercial Gym"
    );
    assert.equal(
      gymVisionInventoryStore.getInventoryForGym(undefined, undefined, ALAA_CANONICAL_UID).gymName,
      "Punch by Badr Hari Lissasfa"
    );
  });

  it("9. Gap #1: Persists & rehydrates gym inventories, sensory memory, and visual snapshots in Firestore across container resets", async () => {
    // A) /api/ai/adapt-day persists updated gym inventory to Firestore
    const adaptRes = await postAdaptDayRoute(
      new NextRequest("http://localhost:3000/api/ai/adapt-day", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer tok_stranger",
        },
        body: JSON.stringify({
          traineeId: "fb_stranger_99",
          gymId: "gym_boutique_casa",
          gymName: "Boutique Studio Casablanca",
          overrideGymEquipment: ["dumbbell", "kettlebell", "bodyweight"],
          voiceOrTextMessage: "Train using dumbbells only today",
          exercises: [
            {
              id: "ex_1",
              name: "Barbell Bench Press",
              targetSets: 3,
              repLow: 8,
              repHigh: 10,
              targetRir: 1,
              restSeconds: 120,
              currentWeight: 60,
              equipment: "barbell",
            },
          ],
        }),
      })
    );
    assert.equal(adaptRes.status, 200);
    const savedInventories = await loadGymInventoriesFromFirestore("fb_stranger_99", mockStore.firestore);
    assert.equal(savedInventories.some((inv) => inv.gymId === "gym_boutique_casa"), true);

    // Wipe in-memory store to simulate cold Cloud Run container start
    gymVisionInventoryStore.clearForTesting();
    assert.equal(
      gymVisionInventoryStore.getInventoriesForTrainee("fb_stranger_99").length,
      0
    );

    // B) /api/ai/evolve persists ingested sensory feedback and rehydrates cloud gym inventory
    const evolveRes = await postEvolveRoute(
      new NextRequest("http://localhost:3000/api/ai/evolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer tok_stranger",
        },
        body: JSON.stringify({
          traineeId: "fb_stranger_99",
          exerciseName: "Barbell Bench Press",
          currentWeightKg: 60,
          targetSets: 3,
          repLow: 8,
          repHigh: 10,
          gymId: "gym_boutique_casa",
          feedbackToIngest: {
            traineeId: "fb_stranger_99",
            sessionId: "sess_fs_1",
            date: "2026-11-17",
            exerciseName: "Barbell Bench Press",
            tags: ["optimal"],
            freeTextNote: "Smooth tempo in studio today",
          },
        }),
      })
    );
    assert.equal(evolveRes.status, 200);
    // Gym inventory rehydrated back into singleton from Firestore!
    assert.equal(
      gymVisionInventoryStore.getInventoriesForTrainee("fb_stranger_99").some((g) => g.gymId === "gym_boutique_casa"),
      true
    );
    const savedSensory = await loadSensoryEntriesFromFirestore("fb_stranger_99", mockStore.firestore);
    assert.equal(savedSensory.length, 1);
    assert.equal(savedSensory[0].exerciseName, "Barbell Bench Press");

    // C) Visual snapshots persist, rehydrate across store wipe on GET, and purge cleanly from Firestore on DELETE
    await saveVisualSnapshotToFirestore(
      ALAA_CANONICAL_UID,
      {
        id: "snap_cloud_persist_1",
        traineeId: ALAA_CANONICAL_UID,
        date: "2026-11-17",
        capturedAt: "2026-11-17T09:00:00.000Z",
        poseId: "front_relaxed",
        milestoneLabel: "Week 4 Check-In",
        weekIndex: 4,
        weightKg: 76.2,
        anonymizedImageUrl: "data:image/svg+xml;utf8,%3Csvg%3E%3Crect/%3E%3C/svg%3E",
        anonymization: {
          isAnonymized: true,
          method: "on_device_canvas_blur",
          faceRegionRedacted: { x: 0.35, y: 0.05, width: 0.3, height: 0.25 },
          scrubbedExif: true,
          confidence: 0.99,
          verifiedAt: "2026-11-17T09:00:00.000Z",
        },
        isSyntheticDemo: false,
      },
      mockStore.firestore
    );
    visualProgressStore.clearForRealUser();
    assert.equal(visualProgressStore.getSnapshots(ALAA_CANONICAL_UID).length, 0);

    const getVisualRes = await getVisualProgressRoute(
      new NextRequest(
        `http://localhost:3000/api/ai/visual-progress?traineeId=${ALAA_CANONICAL_UID}&poseId=front_relaxed`,
        {
          headers: { Authorization: "Bearer tok_alaa_verified" },
        }
      )
    );
    assert.equal(getVisualRes.status, 200);
    const getVisualJson = await getVisualRes.json();
    assert.equal(getVisualJson.snapshots.some((s: { id: string }) => s.id === "snap_cloud_persist_1"), true);

    const delVisualRes = await deleteVisualProgressRoute(
      new NextRequest(
        `http://localhost:3000/api/ai/visual-progress?traineeId=${ALAA_CANONICAL_UID}&snapshotId=snap_cloud_persist_1`,
        {
          method: "DELETE",
          headers: { Authorization: "Bearer tok_alaa_verified" },
        }
      )
    );
    assert.equal(delVisualRes.status, 200);
    const delVisualJson = await delVisualRes.json();
    assert.equal(delVisualJson.receipt.purgedFromFirestore, true);
    const afterDeleteCloud = await loadVisualSnapshotsFromFirestore(ALAA_CANONICAL_UID, mockStore.firestore);
    assert.equal(afterDeleteCloud.length, 0);

    sensoryMemoryStore.clearForTesting();
    visualProgressStore.clearForRealUser();
  });

  it("10. Gap #7: Server-backed B2B2C /api/invites creates invites, enrolls calibrated 16-week clients to Firestore, and isolates coach rosters", async () => {
    // 1. Authenticated coach creates invite
    const createRes = await postInvitesRoute(
      new NextRequest("http://localhost:3000/api/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer tok_alaa_verified",
        },
        body: JSON.stringify({
          action: "create",
          coachId: ALAA_CANONICAL_UID,
          inviteId: "inv_test_casa_1",
          traineeName: "Jordan Lee",
          invite: {
            coachName: "Coach Alaa",
            programTitle: "16-Week Hypertrophy Foundation",
            weeks: 16,
            anchorLift: "barbell_bench",
            startingBenchKg: 85,
            unit: "kg",
          },
        }),
      })
    );
    assert.equal(createRes.status, 200);
    const createJson = await createRes.json();
    assert.equal(createJson.persistedToCloud, true);
    assert.equal(mockStore.docs.has("coachInvites/inv_test_casa_1"), true);

    // 2. Public invite lookup returns non-PII metadata
    const lookupRes = await getInvitesRoute(
      new NextRequest("http://localhost:3000/api/invites?inviteId=inv_test_casa_1")
    );
    assert.equal(lookupRes.status, 200);
    const lookupJson = await lookupRes.json();
    assert.equal(lookupJson.invite.programTitle, "16-Week Hypertrophy Foundation");

    // 3. Stranger accepts invite -> persists calibrated 16-week program + coach client link
    const acceptRes = await postInvitesRoute(
      new NextRequest("http://localhost:3000/api/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer tok_stranger",
        },
        body: JSON.stringify({
          action: "accept",
          inviteId: "inv_test_casa_1",
          coachId: ALAA_CANONICAL_UID,
          traineeId: "fb_stranger_99",
          traineeName: "New Client",
          invite: {
            coachId: ALAA_CANONICAL_UID,
            coachName: "Coach Alaa",
            programTitle: "16-Week Hypertrophy Foundation",
            weeks: 16,
            anchorLift: "barbell_bench",
            startingBenchKg: 85,
            unit: "kg",
          },
        }),
      })
    );
    assert.equal(acceptRes.status, 200);
    const acceptJson = await acceptRes.json();
    assert.equal(acceptJson.persistedToCloud, true);
    assert.equal(acceptJson.program.weeks.length, 16);
    assert.equal(mockStore.docs.has(`users/${ALAA_CANONICAL_UID}/clients/fb_stranger_99`), true);

    // 4. Coach loads roster cleanly; stranger trying to read Coach Alaa's roster gets 403
    const coachRosterRes = await getInvitesRoute(
      new NextRequest(`http://localhost:3000/api/invites?coachId=${ALAA_CANONICAL_UID}`, {
        headers: { Authorization: "Bearer tok_alaa_verified" },
      })
    );
    assert.equal(coachRosterRes.status, 200);
    const coachRosterJson = await coachRosterRes.json();
    assert.equal(coachRosterJson.clients.some((c: { traineeId: string }) => c.traineeId === "fb_stranger_99"), true);

    const crossCoachBlocked = await getInvitesRoute(
      new NextRequest(`http://localhost:3000/api/invites?coachId=${ALAA_CANONICAL_UID}`, {
        headers: { Authorization: "Bearer tok_stranger" },
      })
    );
    assert.equal(crossCoachBlocked.status, 403);
  });
});
