import type { Firestore, WriteBatch } from "firebase-admin/firestore";
import { getFirestoreDb, isFirestoreRuntimeAvailable } from "./admin";
import type {
  User,
  Program,
  ProgramWeek,
  WorkoutSession,
  BodyMetricEntry,
  SupplementProtocol,
  SupplementLog,
  HydrationGoal,
  HydrationLog,
  WearableBiometricSnapshot,
} from "@/lib/types";
import type { EventEnvelope } from "@/lib/storage/events";
import type { AthleteModel, CoachingExperiment } from "@/lib/ai/athlete-model";
import type { LocationEquipmentInventory } from "@/lib/ai/gym-vision-inventory";
import type { SensoryFeedbackEntry } from "@/lib/ai/sensory-memory";
import type { VisualProgressSnapshot } from "@/lib/ai/visual-progress";
import {
  registerCoachDbPersistence,
  CoachDbPersistenceAdapter,
  CoachShadowLogRecord,
} from "@/lib/ai/coach-db-bridge";

export interface UserBootstrapPayload {
  user: User;
  programs: Program[];
  sessions: WorkoutSession[];
  metrics: BodyMetricEntry[];
  supplementProtocols: SupplementProtocol[];
  supplementLogs: SupplementLog[];
  hydrationGoals: HydrationGoal[];
  hydrationLogs: HydrationLog[];
  readinessLogs: WearableBiometricSnapshot[];
  athleteModel: AthleteModel | null;
  coachingExperiments: CoachingExperiment[];
  sensoryMemories?: SensoryFeedbackEntry[];
  gymInventories?: LocationEquipmentInventory[];
}

export interface UserSyncBatchInput {
  user?: Partial<User>;
  programs?: Program[];
  sessions?: WorkoutSession[];
  metrics?: BodyMetricEntry[];
  supplementProtocols?: SupplementProtocol[];
  supplementLogs?: SupplementLog[];
  hydrationGoals?: HydrationGoal[];
  hydrationLogs?: HydrationLog[];
  readinessLogs?: WearableBiometricSnapshot[];
  sensoryMemories?: SensoryFeedbackEntry[];
  gymInventories?: LocationEquipmentInventory[];
  athleteModel?: AthleteModel | null;
}

/**
 * Recursively removes `undefined` fields so Firestore never rejects writes.
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return value;
}

/**
 * Prevents any single WorkoutSession document from approaching Firestore's 1 MiB limit
 * while keeping normal photos/URLs intact.
 */
function sanitizeSessionForFirestore(session: WorkoutSession, uid: string): WorkoutSession {
  const MAX_INLINE_IMAGE_LEN = 180_000;
  const cleanedSetLogs = (session.setLogs || []).map((log) => {
    if (log.photoUrl && log.photoUrl.startsWith("data:") && log.photoUrl.length > MAX_INLINE_IMAGE_LEN) {
      return { ...log, photoUrl: undefined };
    }
    return log;
  });
  const cleanedFeedbacks = (session.exerciseFeedbacks || []).map((fb) => {
    if (fb.photoUrl && fb.photoUrl.startsWith("data:") && fb.photoUrl.length > MAX_INLINE_IMAGE_LEN) {
      return { ...fb, photoUrl: undefined };
    }
    return fb;
  });
  return stripUndefinedDeep({
    ...session,
    traineeId: uid,
    setLogs: cleanedSetLogs,
    exerciseFeedbacks: cleanedFeedbacks,
  });
}

function formatWeekDocId(weekIndex: number): string {
  return `w${String(Math.max(1, weekIndex)).padStart(2, "0")}`;
}

/**
 * Sanitizes client-supplied IDs before passing them into Firestore `.doc(id)`
 * to prevent path traversal (`/` or `..`), empty doc IDs, or oversized IDs.
 */
export function sanitizeFirestoreDocId(rawId: unknown): string | null {
  if (rawId === null || rawId === undefined) return null;
  const cleaned = String(rawId)
    .trim()
    .replace(/\.\.+/g, "_")
    .replace(/[^a-zA-Z0-9_\-\.:]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 128);
  if (!cleaned || cleaned === "." || cleaned === "..") return null;
  return cleaned;
}

export async function commitFirestoreOperationsInChunks(
  db: Firestore,
  ops: Array<(batch: WriteBatch) => void>,
  chunkSize = 400
): Promise<number> {
  if (ops.length === 0) return 0;
  let committed = 0;
  for (let i = 0; i < ops.length; i += chunkSize) {
    const batch = db.batch();
    const slice = ops.slice(i, i + chunkSize);
    for (const apply of slice) {
      apply(batch);
    }
    await batch.commit();
    committed += slice.length;
  }
  return committed;
}

export function buildEmptyUserProfile(params: {
  uid: string;
  email?: string;
  displayName?: string;
  role?: User["role"];
}): User {
  const fallbackName =
    params.displayName?.trim() ||
    (params.email ? params.email.split("@")[0] : "") ||
    "Athlete";

  return {
    id: params.uid,
    role: params.role || "both",
    name: fallbackName,
    email: (params.email || "").trim().toLowerCase(),
    injuries: [],
    goals: [],
    gymLocations: [],
  };
}

export async function ensureUserProfileDoc(params: {
  uid: string;
  email?: string;
  displayName?: string;
  db?: Firestore;
}): Promise<User> {
  const safeUid = sanitizeFirestoreDocId(params.uid) || "anon_visitor";
  if (!isFirestoreRuntimeAvailable() && !params.db) {
    return buildEmptyUserProfile({
      uid: safeUid,
      email: params.email,
      displayName: params.displayName,
    });
  }
  const db = params.db || getFirestoreDb();
  const userRef = db.collection("users").doc(safeUid);
  const snap = await userRef.get();

  if (snap.exists) {
    const data = snap.data() as User;
    const normalizedEmail = (params.email || data.email || "").trim().toLowerCase();
    return {
      ...data,
      id: safeUid,
      role: data.role || "both",
      email: normalizedEmail,
    };
  }

  const fresh = buildEmptyUserProfile({
    uid: safeUid,
    email: params.email,
    displayName: params.displayName,
  });

  await userRef.set(
    stripUndefinedDeep({
      ...fresh,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  );

  return fresh;
}

export async function saveProgramToFirestore(
  uid: string,
  program: Program,
  dbInput?: Firestore
): Promise<void> {
  if (!isFirestoreRuntimeAvailable() && !dbInput) return;
  const db = dbInput || getFirestoreDb();
  const safeUid = sanitizeFirestoreDocId(uid);
  const safeProgId = sanitizeFirestoreDocId(program?.id);
  if (!safeUid || !safeProgId) return;

  const progRef = db.collection("users").doc(safeUid).collection("programs").doc(safeProgId);
  const { weeks, ...headerFields } = program;

  // 1. Write the program header document
  await progRef.set(
    stripUndefinedDeep({
      ...headerFields,
      id: safeProgId,
      traineeId: safeUid,
      updatedAt: program.updatedAt || new Date().toISOString(),
    }),
    { merge: true }
  );

  // 2. Write program weeks in controlled concurrent chunks rather than a single monolithic
  //    WriteBatch. A full 16-week mesocycle is ~1.8 MB of deeply nested JSON. Committing all
  //    weeks in one batch exceeds gRPC deadlines (60s) over WAN and triggers DEADLINE_EXCEEDED.
  const validWeekDocIds = new Set<string>();
  if (Array.isArray(weeks)) {
    const CONCURRENCY = 2;
    for (let i = 0; i < weeks.length; i += CONCURRENCY) {
      const chunk = weeks.slice(i, i + CONCURRENCY);
      await Promise.all(
        chunk.map((week) => {
          const weekDocId = formatWeekDocId(week.weekIndex);
          validWeekDocIds.add(weekDocId);
          const weekRef = progRef.collection("weeks").doc(weekDocId);
          return weekRef.set(stripUndefinedDeep(week), { merge: true });
        })
      );
    }
    try {
      const existingWeeksSnap = await progRef.collection("weeks").get();
      const deleteOps = existingWeeksSnap.docs
        .filter((existingDoc) => !validWeekDocIds.has(existingDoc.id))
        .map((existingDoc) => (batch: WriteBatch) => batch.delete(existingDoc.ref));
      if (deleteOps.length > 0) {
        await commitFirestoreOperationsInChunks(db, deleteOps, 100);
      }
    } catch {
      // Non-fatal if week subcollection listing is mocked or unavailable
    }
  }
}

export async function loadProgramsFromFirestore(
  uid: string,
  dbInput?: Firestore
): Promise<Program[]> {
  if (!isFirestoreRuntimeAvailable() && !dbInput) return [];
  const db = dbInput || getFirestoreDb();
  const progSnap = await db.collection("users").doc(uid).collection("programs").get();
  if (progSnap.empty) return [];

  const programs: Program[] = [];
  for (const doc of progSnap.docs) {
    const header = doc.data() as Omit<Program, "weeks">;
    const weeksSnap = await doc.ref.collection("weeks").get();
    const weeks: ProgramWeek[] = weeksSnap.docs
      .map((wDoc) => wDoc.data() as ProgramWeek)
      .sort((a, b) => (a.weekIndex || 0) - (b.weekIndex || 0));

    programs.push({
      ...(header as Program),
      id: header.id || doc.id,
      traineeId: uid,
      weeks,
    });
  }

  return programs.sort((a, b) => {
    if (a.status === "published" && b.status !== "published") return -1;
    if (b.status === "published" && a.status !== "published") return 1;
    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
  });
}

export async function loadBootstrapForUser(params: {
  uid: string;
  email?: string;
  displayName?: string;
  db?: Firestore;
}): Promise<UserBootstrapPayload> {
  const safeUid = sanitizeFirestoreDocId(params.uid) || "anon_visitor";
  if (!isFirestoreRuntimeAvailable() && !params.db) {
    const user = buildEmptyUserProfile({
      uid: safeUid,
      email: params.email,
      displayName: params.displayName,
    });
    return {
      user,
      programs: [],
      sessions: [],
      metrics: [],
      supplementProtocols: [],
      supplementLogs: [],
      hydrationGoals: [],
      hydrationLogs: [],
      readinessLogs: [],
      athleteModel: null,
      coachingExperiments: [],
    };
  }
  const db = params.db || getFirestoreDb();
  const user = await ensureUserProfileDoc(params);
  const userDoc = db.collection("users").doc(params.uid);

  const [
    programs,
    sessionsSnap,
    metricsSnap,
    protocolsSnap,
    suppLogsSnap,
    hydGoalsSnap,
    hydLogsSnap,
    readinessSnap,
    athleteModelSnap,
    experimentsSnap,
    sensoryMemories,
    gymInventories,
  ] = await Promise.all([
    loadProgramsFromFirestore(params.uid, db),
    userDoc.collection("sessions").get(),
    userDoc.collection("metrics").get(),
    userDoc.collection("supplementProtocols").get(),
    userDoc.collection("supplementLogs").get(),
    userDoc.collection("hydrationGoals").get(),
    userDoc.collection("hydrationLogs").get(),
    userDoc.collection("readiness").get(),
    userDoc.collection("athleteModels").doc("current").get(),
    userDoc.collection("coachingExperiments").get(),
    loadSensoryEntriesFromFirestore(params.uid, db),
    loadGymInventoriesFromFirestore(params.uid, db),
  ]);

  const sessions = sessionsSnap.docs
    .map((d) => d.data() as WorkoutSession)
    .sort((a, b) => (b.startedAt || b.date || "").localeCompare(a.startedAt || a.date || ""));

  const metrics = metricsSnap.docs
    .map((d) => d.data() as BodyMetricEntry)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  const supplementProtocols = protocolsSnap.docs.map((d) => d.data() as SupplementProtocol);
  const supplementLogs = suppLogsSnap.docs.map((d) => d.data() as SupplementLog);
  const hydrationGoals = hydGoalsSnap.docs.map((d) => d.data() as HydrationGoal);
  const hydrationLogs = hydLogsSnap.docs.map((d) => d.data() as HydrationLog);
  const readinessLogs = readinessSnap.docs
    .map((d) => d.data() as WearableBiometricSnapshot)
    .sort((a, b) => (b.receivedAt || b.date || "").localeCompare(a.receivedAt || a.date || ""));

  const coachingExperiments = experimentsSnap.docs.map((d) => d.data() as CoachingExperiment);

  let athleteModel: AthleteModel | null = null;
  if (athleteModelSnap.exists) {
    athleteModel = athleteModelSnap.data() as AthleteModel;
    if (coachingExperiments.length > 0) {
      athleteModel.activeExperiments = coachingExperiments.filter((e) => e.status === "active");
      athleteModel.resolvedExperiments = coachingExperiments.filter((e) => e.status !== "active");
    }
  }

  return {
    user,
    programs,
    sessions,
    metrics,
    supplementProtocols,
    supplementLogs,
    hydrationGoals,
    hydrationLogs,
    readinessLogs,
    athleteModel,
    coachingExperiments,
    sensoryMemories,
    gymInventories,
  };
}

export async function saveUserSyncBatch(
  uid: string,
  payload: UserSyncBatchInput,
  dbInput?: Firestore
): Promise<{ writtenDocs: number }> {
  if (!isFirestoreRuntimeAvailable() && !dbInput) return { writtenDocs: 0 };
  const db = dbInput || getFirestoreDb();
  const safeUid = sanitizeFirestoreDocId(uid);
  if (!safeUid) return { writtenDocs: 0 };

  const userRef = db.collection("users").doc(safeUid);
  const ops: Array<(batch: WriteBatch) => void> = [];

  if (payload.user) {
    const safeUserPatch = stripUndefinedDeep({
      ...payload.user,
      id: safeUid,
      updatedAt: new Date().toISOString(),
    });
    // Never allow client payload to self-promote or reassign uid
    delete (safeUserPatch as Record<string, unknown>).role;
    delete (safeUserPatch as Record<string, unknown>).email;
    ops.push((batch) => {
      batch.set(userRef, safeUserPatch, { merge: true });
    });
  }

  if (Array.isArray(payload.programs)) {
    for (const prog of payload.programs.slice(0, 20)) {
      await saveProgramToFirestore(safeUid, prog, db);
    }
  }

  if (Array.isArray(payload.sessions)) {
    for (const sess of payload.sessions.slice(0, 200)) {
      const safeSessId = sanitizeFirestoreDocId(sess?.id);
      if (!safeSessId) continue;
      const ref = userRef.collection("sessions").doc(safeSessId);
      ops.push((batch) => {
        batch.set(ref, sanitizeSessionForFirestore({ ...sess, id: safeSessId }, safeUid), { merge: true });
      });
    }
  }

  if (Array.isArray(payload.metrics)) {
    // Keep most recent 365 entries (since store.metrics is sorted oldest-first)
    for (const m of payload.metrics.slice(-365)) {
      const safeMetricId = sanitizeFirestoreDocId(m?.id);
      if (!safeMetricId) continue;
      const ref = userRef.collection("metrics").doc(safeMetricId);
      ops.push((batch) => {
        batch.set(ref, stripUndefinedDeep({ ...m, id: safeMetricId, traineeId: safeUid }), { merge: true });
      });
    }
  }

  if (Array.isArray(payload.supplementProtocols)) {
    for (const sp of payload.supplementProtocols.slice(0, 50)) {
      const safeSpId = sanitizeFirestoreDocId(sp?.id);
      if (!safeSpId) continue;
      const ref = userRef.collection("supplementProtocols").doc(safeSpId);
      ops.push((batch) => {
        batch.set(ref, stripUndefinedDeep({ ...sp, id: safeSpId }), { merge: true });
      });
    }
  }

  if (Array.isArray(payload.supplementLogs)) {
    for (const sl of payload.supplementLogs.slice(-250)) {
      const safeSlId = sanitizeFirestoreDocId(sl?.id);
      if (!safeSlId) continue;
      const ref = userRef.collection("supplementLogs").doc(safeSlId);
      ops.push((batch) => {
        batch.set(ref, stripUndefinedDeep({ ...sl, id: safeSlId, traineeId: safeUid }), { merge: true });
      });
    }
  }

  if (Array.isArray(payload.hydrationGoals)) {
    for (const hg of payload.hydrationGoals.slice(0, 10)) {
      const safeHgId = sanitizeFirestoreDocId(hg?.id);
      if (!safeHgId) continue;
      const ref = userRef.collection("hydrationGoals").doc(safeHgId);
      ops.push((batch) => {
        batch.set(ref, stripUndefinedDeep({ ...hg, id: safeHgId, traineeId: safeUid }), { merge: true });
      });
    }
  }

  if (Array.isArray(payload.hydrationLogs)) {
    for (const hl of payload.hydrationLogs.slice(-250)) {
      const safeHlId = sanitizeFirestoreDocId(hl?.id);
      if (!safeHlId) continue;
      const ref = userRef.collection("hydrationLogs").doc(safeHlId);
      ops.push((batch) => {
        batch.set(ref, stripUndefinedDeep({ ...hl, id: safeHlId, traineeId: safeUid }), { merge: true });
      });
    }
  }

  if (Array.isArray(payload.readinessLogs)) {
    for (const rl of payload.readinessLogs.slice(0, 100)) {
      const safeRlId = sanitizeFirestoreDocId(rl?.id);
      if (!safeRlId) continue;
      const ref = userRef.collection("readiness").doc(safeRlId);
      ops.push((batch) => {
        batch.set(ref, stripUndefinedDeep({ ...rl, id: safeRlId, traineeId: safeUid }), { merge: true });
      });
    }
  }

  if (Array.isArray(payload.sensoryMemories)) {
    for (const sm of payload.sensoryMemories.slice(-200)) {
      await saveSensoryEntryToFirestore(safeUid, sm, db);
    }
  }

  if (Array.isArray(payload.gymInventories)) {
    for (const gi of payload.gymInventories.slice(0, 20)) {
      await saveGymInventoryToFirestore(safeUid, gi, db);
    }
  }

  if (payload.athleteModel) {
    const coachAdapter = createFirestoreCoachDbAdapter(db);
    await coachAdapter.upsertAthleteModelInDb({
      ...payload.athleteModel,
      traineeId: safeUid,
    });
  }

  const writtenDocs = await commitFirestoreOperationsInChunks(db, ops);
  return { writtenDocs };
}

export async function saveAthleticEventsToFirestore(
  uid: string,
  events: EventEnvelope[],
  dbInput?: Firestore
): Promise<number> {
  if (!isFirestoreRuntimeAvailable() && !dbInput) return 0;
  const db = dbInput || getFirestoreDb();
  const safeUid = sanitizeFirestoreDocId(uid);
  if (!safeUid) return 0;

  const userRef = db.collection("users").doc(safeUid);
  const ops: Array<(batch: WriteBatch) => void> = [];

  for (const evt of events.slice(0, 250)) {
    const safeEvtId = sanitizeFirestoreDocId(evt?.id);
    if (!safeEvtId || !evt?.type) continue;
    const ref = userRef.collection("events").doc(safeEvtId);
    ops.push((batch) => {
      batch.set(
        ref,
        stripUndefinedDeep({
          ...evt,
          id: safeEvtId,
          traineeId: safeUid,
          syncedToCloud: true,
          cloudSyncEpochMs: evt.cloudSyncEpochMs || Date.now(),
        }),
        { merge: true }
      );
    });
  }

  return await commitFirestoreOperationsInChunks(db, ops);
}

export function createFirestoreCoachDbAdapter(dbInput?: Firestore): CoachDbPersistenceAdapter {
  const getDb = (): Firestore | null => {
    if (dbInput) return dbInput;
    if (!isFirestoreRuntimeAvailable()) return null;
    try {
      return getFirestoreDb();
    } catch {
      return null;
    }
  };

  return {
    async upsertAthleteModelInDb(model: AthleteModel): Promise<boolean> {
      try {
        const db = getDb();
        if (!db) return false;
        const safeUid = sanitizeFirestoreDocId(model.traineeId);
        if (!safeUid) return false;
        const userRef = db.collection("users").doc(safeUid);
        const ops: Array<(batch: WriteBatch) => void> = [];

        ops.push((batch) => {
          batch.set(
            userRef.collection("athleteModels").doc("current"),
            stripUndefinedDeep({
              ...model,
              traineeId: safeUid,
              lastUpdated: model.lastUpdated || new Date().toISOString(),
            }),
            { merge: true }
          );
        });

        const allExps = [
          ...(model.activeExperiments || []),
          ...(model.resolvedExperiments || []),
        ];
        for (const exp of allExps) {
          const safeExpId = sanitizeFirestoreDocId(exp?.id);
          if (!safeExpId) continue;
          ops.push((batch) => {
            batch.set(
              userRef.collection("coachingExperiments").doc(safeExpId),
              stripUndefinedDeep({ ...exp, id: safeExpId, traineeId: safeUid }),
              { merge: true }
            );
          });
        }

        await commitFirestoreOperationsInChunks(db, ops);
        return true;
      } catch (err) {
        console.warn("[FirestoreCoachAdapter] upsertAthleteModelInDb error:", err);
        return false;
      }
    },

    async loadAthleteModelFromDb(traineeId: string): Promise<AthleteModel | null> {
      try {
        const db = getDb();
        if (!db) return null;
        const safeUid = sanitizeFirestoreDocId(traineeId);
        if (!safeUid) return null;
        const userRef = db.collection("users").doc(safeUid);
        const [modelSnap, expSnap] = await Promise.all([
          userRef.collection("athleteModels").doc("current").get(),
          userRef.collection("coachingExperiments").get(),
        ]);

        if (!modelSnap.exists) return null;
        const model = modelSnap.data() as AthleteModel;
        const exps = expSnap.docs.map((d) => d.data() as CoachingExperiment);
        if (exps.length > 0) {
          model.activeExperiments = exps.filter((e) => e.status === "active");
          model.resolvedExperiments = exps.filter((e) => e.status !== "active");
        }
        return model;
      } catch (err) {
        console.warn("[FirestoreCoachAdapter] loadAthleteModelFromDb error:", err);
        return null;
      }
    },

    async insertShadowLogInDb(entry: CoachShadowLogRecord): Promise<boolean> {
      try {
        const db = getDb();
        if (!db) return false;
        const safeUid = sanitizeFirestoreDocId(entry.traineeId);
        const safeId = sanitizeFirestoreDocId(entry.id);
        if (!safeUid || !safeId) return false;
        await db
          .collection("users")
          .doc(safeUid)
          .collection("coachShadowLogs")
          .doc(safeId)
          .set(stripUndefinedDeep({ ...entry, id: safeId, traineeId: safeUid }), { merge: true });
        return true;
      } catch (err) {
        console.warn("[FirestoreCoachAdapter] insertShadowLogInDb error:", err);
        return false;
      }
    },

    async loadShadowLogsFromDb(traineeId?: string): Promise<CoachShadowLogRecord[]> {
      try {
        const safeUid = sanitizeFirestoreDocId(traineeId);
        if (!safeUid) return [];
        const db = getDb();
        if (!db) return [];
        const snap = await db
          .collection("users")
          .doc(safeUid)
          .collection("coachShadowLogs")
          .get();
        return snap.docs
          .map((d) => d.data() as CoachShadowLogRecord)
          .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
      } catch (err) {
        console.warn("[FirestoreCoachAdapter] loadShadowLogsFromDb error:", err);
        return [];
      }
    },

    async deleteShadowLogsMatchingSnapshotFromDb(params: {
      snapshotId: string;
      traineeId?: string;
      base64Snippet?: string;
    }): Promise<number> {
      try {
        const safeUid = sanitizeFirestoreDocId(params.traineeId);
        if (!safeUid) return 0;
        const db = getDb();
        if (!db) return 0;
        const snap = await db
          .collection("users")
          .doc(safeUid)
          .collection("coachShadowLogs")
          .get();

        const ops: Array<(batch: WriteBatch) => void> = [];
        for (const doc of snap.docs) {
          const text = JSON.stringify(doc.data() || {});
          const matchesId = Boolean(params.snapshotId && text.includes(params.snapshotId));
          const matchesSnippet = Boolean(params.base64Snippet && text.includes(params.base64Snippet));
          if (matchesId || matchesSnippet) {
            ops.push((batch) => batch.delete(doc.ref));
          }
        }
        await commitFirestoreOperationsInChunks(db, ops);
        return ops.length;
      } catch (err) {
        console.warn("[FirestoreCoachAdapter] deleteShadowLogsMatchingSnapshotFromDb error:", err);
        return 0;
      }
    },
  };
}

let cachedFirestoreCoachAdapter: CoachDbPersistenceAdapter | null = null;

/**
 * Registers the Firestore Coach persistence adapter into `coach-db-bridge.ts`
 * unless an explicit PostgreSQL `DATABASE_URL` already handles persistence.
 */
export function ensureFirestoreCoachBridgeRegistered(): void {
  if (typeof window !== "undefined") return;
  if (process.env.DATABASE_URL) return;
  if (!cachedFirestoreCoachAdapter) {
    cachedFirestoreCoachAdapter = createFirestoreCoachDbAdapter();
  }
  registerCoachDbPersistence(cachedFirestoreCoachAdapter);
}

// ============================================================================
// Gap #1: Firestore Persistence for Gym Inventories, Sensory Memory & Visual Snapshots
// ============================================================================

export async function saveGymInventoryToFirestore(
  uid: string,
  inventory: LocationEquipmentInventory,
  dbInput?: Firestore
): Promise<boolean> {
  const safeUid = sanitizeFirestoreDocId(uid);
  const safeGymId = sanitizeFirestoreDocId(inventory?.gymId);
  if (!safeUid || !safeGymId || (!isFirestoreRuntimeAvailable() && !dbInput)) return false;
  try {
    const db = dbInput || getFirestoreDb();
    await db
      .collection("users")
      .doc(safeUid)
      .collection("gymInventories")
      .doc(safeGymId)
      .set(
        stripUndefinedDeep({
          ...inventory,
          gymId: safeGymId,
          traineeId: safeUid,
          lastUpdated: inventory.lastUpdated || new Date().toISOString(),
        }),
        { merge: true }
      );
    return true;
  } catch (err) {
    console.warn("[Firestore] saveGymInventoryToFirestore error:", err);
    return false;
  }
}

export async function loadGymInventoriesFromFirestore(
  uid: string,
  dbInput?: Firestore
): Promise<LocationEquipmentInventory[]> {
  const safeUid = sanitizeFirestoreDocId(uid);
  if (!safeUid || (!isFirestoreRuntimeAvailable() && !dbInput)) return [];
  try {
    const db = dbInput || getFirestoreDb();
    const snap = await db.collection("users").doc(safeUid).collection("gymInventories").get();
    return snap.docs.map((d) => ({
      ...(d.data() as LocationEquipmentInventory),
      traineeId: safeUid,
    }));
  } catch (err) {
    console.warn("[Firestore] loadGymInventoriesFromFirestore error:", err);
    return [];
  }
}

export async function saveSensoryEntryToFirestore(
  uid: string,
  entry: SensoryFeedbackEntry,
  dbInput?: Firestore
): Promise<boolean> {
  const safeUid = sanitizeFirestoreDocId(uid);
  const safeId = sanitizeFirestoreDocId(entry?.id);
  if (!safeUid || !safeId || (!isFirestoreRuntimeAvailable() && !dbInput)) return false;
  try {
    const db = dbInput || getFirestoreDb();
    const MAX_INLINE_URI_LEN = 120_000;
    const cleanedAudio =
      entry.audioNoteUrl && entry.audioNoteUrl.startsWith("data:") && entry.audioNoteUrl.length > MAX_INLINE_URI_LEN
        ? undefined
        : entry.audioNoteUrl;
    const cleanedPhoto =
      entry.equipmentPhotoUrl &&
      entry.equipmentPhotoUrl.startsWith("data:") &&
      entry.equipmentPhotoUrl.length > MAX_INLINE_URI_LEN
        ? undefined
        : entry.equipmentPhotoUrl;

    await db
      .collection("users")
      .doc(safeUid)
      .collection("sensoryMemory")
      .doc(safeId)
      .set(
        stripUndefinedDeep({
          ...entry,
          id: safeId,
          traineeId: safeUid,
          audioNoteUrl: cleanedAudio,
          equipmentPhotoUrl: cleanedPhoto,
        }),
        { merge: true }
      );
    return true;
  } catch (err) {
    console.warn("[Firestore] saveSensoryEntryToFirestore error:", err);
    return false;
  }
}

export async function loadSensoryEntriesFromFirestore(
  uid: string,
  dbInput?: Firestore
): Promise<SensoryFeedbackEntry[]> {
  const safeUid = sanitizeFirestoreDocId(uid);
  if (!safeUid || (!isFirestoreRuntimeAvailable() && !dbInput)) return [];
  try {
    const db = dbInput || getFirestoreDb();
    const snap = await db.collection("users").doc(safeUid).collection("sensoryMemory").get();
    return snap.docs
      .map((d) => ({ ...(d.data() as SensoryFeedbackEntry), traineeId: safeUid }))
      .sort((a, b) => (a.epochMs || 0) - (b.epochMs || 0))
      .slice(-200);
  } catch (err) {
    console.warn("[Firestore] loadSensoryEntriesFromFirestore error:", err);
    return [];
  }
}

export async function saveVisualSnapshotToFirestore(
  uid: string,
  snapshot: VisualProgressSnapshot,
  dbInput?: Firestore
): Promise<boolean> {
  const safeUid = sanitizeFirestoreDocId(uid);
  const safeSnapId = sanitizeFirestoreDocId(snapshot?.id);
  if (!safeUid || !safeSnapId || (!isFirestoreRuntimeAvailable() && !dbInput)) return false;

  // Respect Firestore 1 MiB document size ceiling
  const MAX_SNAPSHOT_URI_CHARS = 750_000;
  if (
    typeof snapshot.anonymizedImageUrl === "string" &&
    snapshot.anonymizedImageUrl.length > MAX_SNAPSHOT_URI_CHARS
  ) {
    console.warn(
      `[Firestore] Visual snapshot ${safeSnapId} exceeds safe document size (${snapshot.anonymizedImageUrl.length} chars); skipping inline cloud persistence.`
    );
    return false;
  }

  try {
    const db = dbInput || getFirestoreDb();
    await db
      .collection("users")
      .doc(safeUid)
      .collection("visualSnapshots")
      .doc(safeSnapId)
      .set(
        stripUndefinedDeep({
          ...snapshot,
          id: safeSnapId,
          traineeId: safeUid,
        }),
        { merge: true }
      );
    return true;
  } catch (err) {
    console.warn("[Firestore] saveVisualSnapshotToFirestore error:", err);
    return false;
  }
}

export async function loadVisualSnapshotsFromFirestore(
  uid: string,
  dbInput?: Firestore
): Promise<VisualProgressSnapshot[]> {
  const safeUid = sanitizeFirestoreDocId(uid);
  if (!safeUid || (!isFirestoreRuntimeAvailable() && !dbInput)) return [];
  try {
    const db = dbInput || getFirestoreDb();
    const snap = await db.collection("users").doc(safeUid).collection("visualSnapshots").get();
    return snap.docs
      .map((d) => ({ ...(d.data() as VisualProgressSnapshot), traineeId: safeUid }))
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  } catch (err) {
    console.warn("[Firestore] loadVisualSnapshotsFromFirestore error:", err);
    return [];
  }
}

export async function deleteVisualSnapshotFromFirestore(
  uid: string,
  snapshotId: string,
  base64Snippet?: string,
  dbInput?: Firestore
): Promise<boolean> {
  const safeUid = sanitizeFirestoreDocId(uid);
  const safeSnapId = sanitizeFirestoreDocId(snapshotId);
  if (!safeUid || !safeSnapId || (!isFirestoreRuntimeAvailable() && !dbInput)) return false;
  try {
    const db = dbInput || getFirestoreDb();
    await db
      .collection("users")
      .doc(safeUid)
      .collection("visualSnapshots")
      .doc(safeSnapId)
      .delete();

    const adapter = createFirestoreCoachDbAdapter(db);
    await adapter.deleteShadowLogsMatchingSnapshotFromDb({
      snapshotId: safeSnapId,
      traineeId: safeUid,
      base64Snippet,
    });
    return true;
  } catch (err) {
    console.warn("[Firestore] deleteVisualSnapshotFromFirestore error:", err);
    return false;
  }
}

// ============================================================================
// Gap #7: Server-Backed B2B2C Coach Invites & Client Roster Persistence
// ============================================================================

export interface FirestoreCoachInviteRecord {
  inviteId: string;
  coachId: string;
  coachName: string;
  programTitle: string;
  weeks: number;
  anchorLift: "barbell_bench" | "dumbbell_bench";
  startingBenchKg: number;
  unit: "kg" | "lb";
  customNote?: string;
  traineeName?: string;
  traineeEmail?: string;
  status: "pending" | "accepted";
  createdAt: string;
  acceptedAt?: string;
  acceptedByUid?: string;
}

export interface FirestoreClientLinkRecord {
  traineeId: string;
  coachId: string;
  coachName?: string;
  name: string;
  email?: string;
  programId?: string;
  programTitle?: string;
  weeks?: number;
  status: "active" | "invited";
  joinedAt: string;
  adherencePercentage?: number;
  lastSessionDate?: string;
  sessionsCount?: number;
}

export async function saveCoachInviteToFirestore(
  invite: FirestoreCoachInviteRecord,
  dbInput?: Firestore
): Promise<FirestoreCoachInviteRecord | null> {
  const safeInviteId = sanitizeFirestoreDocId(invite?.inviteId);
  const safeCoachId = sanitizeFirestoreDocId(invite?.coachId);
  if (!safeInviteId || !safeCoachId || (!isFirestoreRuntimeAvailable() && !dbInput)) return null;

  try {
    const db = dbInput || getFirestoreDb();
    const record: FirestoreCoachInviteRecord = stripUndefinedDeep({
      ...invite,
      inviteId: safeInviteId,
      coachId: safeCoachId,
      createdAt: invite.createdAt || new Date().toISOString(),
    });
    const ops: Array<(batch: WriteBatch) => void> = [
      (batch) => batch.set(db.collection("coachInvites").doc(safeInviteId), record, { merge: true }),
      (batch) =>
        batch.set(
          db.collection("users").doc(safeCoachId).collection("sentInvites").doc(safeInviteId),
          record,
          { merge: true }
        ),
    ];
    await commitFirestoreOperationsInChunks(db, ops);
    return record;
  } catch (err) {
    console.warn("[Firestore] saveCoachInviteToFirestore error:", err);
    return null;
  }
}

export async function loadCoachInviteFromFirestore(
  inviteId: string,
  dbInput?: Firestore
): Promise<FirestoreCoachInviteRecord | null> {
  const safeInviteId = sanitizeFirestoreDocId(inviteId);
  if (!safeInviteId || (!isFirestoreRuntimeAvailable() && !dbInput)) return null;
  try {
    const db = dbInput || getFirestoreDb();
    const snap = await db.collection("coachInvites").doc(safeInviteId).get();
    return snap.exists ? (snap.data() as FirestoreCoachInviteRecord) : null;
  } catch (err) {
    console.warn("[Firestore] loadCoachInviteFromFirestore error:", err);
    return null;
  }
}

export async function acceptCoachInviteInFirestore(params: {
  traineeId: string;
  traineeName?: string;
  traineeEmail?: string;
  coachId: string;
  coachName: string;
  program: Program;
  inviteId?: string;
  db?: Firestore;
}): Promise<FirestoreClientLinkRecord | null> {
  const safeTraineeId = sanitizeFirestoreDocId(params.traineeId);
  const safeCoachId = sanitizeFirestoreDocId(params.coachId);
  if (!safeTraineeId || !safeCoachId || (!isFirestoreRuntimeAvailable() && !params.db)) return null;

  try {
    const db = params.db || getFirestoreDb();
    await ensureUserProfileDoc({
      uid: safeTraineeId,
      email: params.traineeEmail,
      displayName: params.traineeName,
      db,
    });
    await saveProgramToFirestore(safeTraineeId, { ...params.program, traineeId: safeTraineeId }, db);

    const nowIso = new Date().toISOString();
    const clientLink: FirestoreClientLinkRecord = stripUndefinedDeep({
      traineeId: safeTraineeId,
      coachId: safeCoachId,
      coachName: params.coachName,
      name: params.traineeName?.trim() || "New Athlete",
      email: params.traineeEmail?.trim().toLowerCase() || undefined,
      programId: params.program.id,
      programTitle: params.program.title,
      weeks: params.program.durationWeeks,
      status: "active",
      joinedAt: nowIso,
    });

    const ops: Array<(batch: WriteBatch) => void> = [
      (batch) =>
        batch.set(
          db.collection("users").doc(safeTraineeId),
          stripUndefinedDeep({
            id: safeTraineeId,
            trainerId: safeCoachId,
            updatedAt: nowIso,
          }),
          { merge: true }
        ),
      (batch) =>
        batch.set(
          db.collection("users").doc(safeCoachId).collection("clients").doc(safeTraineeId),
          clientLink,
          { merge: true }
        ),
    ];

    if (params.inviteId) {
      const safeInviteId = sanitizeFirestoreDocId(params.inviteId);
      if (safeInviteId) {
        const patch = stripUndefinedDeep({
          status: "accepted",
          acceptedAt: nowIso,
          acceptedByUid: safeTraineeId,
        });
        ops.push(
          (batch) => batch.set(db.collection("coachInvites").doc(safeInviteId), patch, { merge: true }),
          (batch) =>
            batch.set(
              db.collection("users").doc(safeCoachId).collection("sentInvites").doc(safeInviteId),
              patch,
              { merge: true }
            )
        );
      }
    }

    await commitFirestoreOperationsInChunks(db, ops);
    return clientLink;
  } catch (err) {
    console.warn("[Firestore] acceptCoachInviteInFirestore error:", err);
    return null;
  }
}

export async function loadCoachRosterFromFirestore(
  coachId: string,
  dbInput?: Firestore
): Promise<{
  clients: FirestoreClientLinkRecord[];
  sentInvites: FirestoreCoachInviteRecord[];
}> {
  const safeCoachId = sanitizeFirestoreDocId(coachId);
  if (!safeCoachId || (!isFirestoreRuntimeAvailable() && !dbInput)) return { clients: [], sentInvites: [] };
  try {
    const db = dbInput || getFirestoreDb();
    const coachRef = db.collection("users").doc(safeCoachId);
    const [clientsSnap, invitesSnap] = await Promise.all([
      coachRef.collection("clients").get(),
      coachRef.collection("sentInvites").get(),
    ]);

    const clients: FirestoreClientLinkRecord[] = [];
    for (const doc of clientsSnap.docs) {
      const record = doc.data() as FirestoreClientLinkRecord;
      // Enrich with latest session stats if client profile exists
      try {
        const sessSnap = await db.collection("users").doc(record.traineeId).collection("sessions").get();
        const sessions = sessSnap.docs
          .map((d) => d.data() as WorkoutSession)
          .sort((a, b) => (b.startedAt || b.date || "").localeCompare(a.startedAt || a.date || ""));
        record.sessionsCount = sessions.length;
        if (sessions[0]) {
          record.lastSessionDate = sessions[0].date || sessions[0].startedAt?.split("T")[0];
        }
      } catch {
        // Non-fatal
      }
      clients.push(record);
    }

    const sentInvites = invitesSnap.docs
      .map((d) => d.data() as FirestoreCoachInviteRecord)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return { clients, sentInvites };
  } catch (err) {
    console.warn("[Firestore] loadCoachRosterFromFirestore error:", err);
    return { clients: [], sentInvites: [] };
  }
}
