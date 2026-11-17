import type { Firestore, WriteBatch } from "firebase-admin/firestore";
import { getFirestoreDb } from "./admin";
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
  const db = params.db || getFirestoreDb();
  const safeUid = sanitizeFirestoreDocId(params.uid) || "anon_visitor";
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
  const db = dbInput || getFirestoreDb();
  const safeUid = sanitizeFirestoreDocId(uid);
  const safeProgId = sanitizeFirestoreDocId(program?.id);
  if (!safeUid || !safeProgId) return;

  const progRef = db.collection("users").doc(safeUid).collection("programs").doc(safeProgId);
  const { weeks, ...headerFields } = program;
  const ops: Array<(batch: WriteBatch) => void> = [];

  ops.push((batch) => {
    batch.set(
      progRef,
      stripUndefinedDeep({
        ...headerFields,
        id: safeProgId,
        traineeId: safeUid,
        updatedAt: program.updatedAt || new Date().toISOString(),
      }),
      { merge: true }
    );
  });

  const validWeekDocIds = new Set<string>();
  if (Array.isArray(weeks)) {
    for (const week of weeks) {
      const weekDocId = formatWeekDocId(week.weekIndex);
      validWeekDocIds.add(weekDocId);
      const weekRef = progRef.collection("weeks").doc(weekDocId);
      ops.push((batch) => {
        batch.set(weekRef, stripUndefinedDeep(week), { merge: true });
      });
    }
    try {
      const existingWeeksSnap = await progRef.collection("weeks").get();
      for (const existingDoc of existingWeeksSnap.docs) {
        if (!validWeekDocIds.has(existingDoc.id)) {
          ops.push((batch) => batch.delete(existingDoc.ref));
        }
      }
    } catch {
      // Non-fatal if week subcollection listing is mocked or unavailable
    }
  }

  await commitFirestoreOperationsInChunks(db, ops);
}

export async function loadProgramsFromFirestore(
  uid: string,
  dbInput?: Firestore
): Promise<Program[]> {
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
  };
}

export async function saveUserSyncBatch(
  uid: string,
  payload: UserSyncBatchInput,
  dbInput?: Firestore
): Promise<{ writtenDocs: number }> {
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
      const safeProgId = sanitizeFirestoreDocId(prog?.id);
      if (!safeProgId) continue;
      const { weeks, ...headerFields } = prog;
      const progRef = userRef.collection("programs").doc(safeProgId);
      ops.push((batch) => {
        batch.set(
          progRef,
          stripUndefinedDeep({
            ...headerFields,
            id: safeProgId,
            traineeId: safeUid,
            updatedAt: prog.updatedAt || new Date().toISOString(),
          }),
          { merge: true }
        );
      });
      if (Array.isArray(weeks)) {
        for (const week of weeks.slice(0, 52)) {
          const weekRef = progRef.collection("weeks").doc(formatWeekDocId(week.weekIndex));
          ops.push((batch) => {
            batch.set(weekRef, stripUndefinedDeep(week), { merge: true });
          });
        }
      }
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

  const writtenDocs = await commitFirestoreOperationsInChunks(db, ops);
  return { writtenDocs };
}

export async function saveAthleticEventsToFirestore(
  uid: string,
  events: EventEnvelope[],
  dbInput?: Firestore
): Promise<number> {
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
  const getDb = () => dbInput || getFirestoreDb();

  return {
    async upsertAthleteModelInDb(model: AthleteModel): Promise<boolean> {
      try {
        const db = getDb();
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
