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
    role: params.role || "trainee",
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
  const userRef = db.collection("users").doc(params.uid);
  const snap = await userRef.get();

  if (snap.exists) {
    const data = snap.data() as User;
    const normalizedEmail = (params.email || data.email || "").trim().toLowerCase();
    return {
      ...data,
      id: params.uid,
      email: normalizedEmail,
    };
  }

  const fresh = buildEmptyUserProfile({
    uid: params.uid,
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
  const progRef = db.collection("users").doc(uid).collection("programs").doc(program.id);
  const { weeks, ...headerFields } = program;
  const ops: Array<(batch: WriteBatch) => void> = [];

  ops.push((batch) => {
    batch.set(
      progRef,
      stripUndefinedDeep({
        ...headerFields,
        traineeId: uid,
        updatedAt: program.updatedAt || new Date().toISOString(),
      }),
      { merge: true }
    );
  });

  if (Array.isArray(weeks)) {
    for (const week of weeks) {
      const weekRef = progRef.collection("weeks").doc(formatWeekDocId(week.weekIndex));
      ops.push((batch) => {
        batch.set(weekRef, stripUndefinedDeep(week), { merge: true });
      });
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
  const userRef = db.collection("users").doc(uid);
  const ops: Array<(batch: WriteBatch) => void> = [];

  if (payload.user) {
    const safeUserPatch = stripUndefinedDeep({
      ...payload.user,
      id: uid,
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
      if (!prog?.id) continue;
      const { weeks, ...headerFields } = prog;
      const progRef = userRef.collection("programs").doc(prog.id);
      ops.push((batch) => {
        batch.set(
          progRef,
          stripUndefinedDeep({
            ...headerFields,
            traineeId: uid,
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
      if (!sess?.id) continue;
      const ref = userRef.collection("sessions").doc(sess.id);
      ops.push((batch) => {
        batch.set(ref, sanitizeSessionForFirestore(sess, uid), { merge: true });
      });
    }
  }

  if (Array.isArray(payload.metrics)) {
    for (const m of payload.metrics.slice(0, 365)) {
      if (!m?.id) continue;
      const ref = userRef.collection("metrics").doc(m.id);
      ops.push((batch) => {
        batch.set(ref, stripUndefinedDeep({ ...m, traineeId: uid }), { merge: true });
      });
    }
  }

  if (Array.isArray(payload.supplementProtocols)) {
    for (const sp of payload.supplementProtocols.slice(0, 50)) {
      if (!sp?.id) continue;
      const ref = userRef.collection("supplementProtocols").doc(sp.id);
      ops.push((batch) => {
        batch.set(ref, stripUndefinedDeep(sp), { merge: true });
      });
    }
  }

  if (Array.isArray(payload.supplementLogs)) {
    for (const sl of payload.supplementLogs.slice(0, 250)) {
      if (!sl?.id) continue;
      const ref = userRef.collection("supplementLogs").doc(sl.id);
      ops.push((batch) => {
        batch.set(ref, stripUndefinedDeep({ ...sl, traineeId: uid }), { merge: true });
      });
    }
  }

  if (Array.isArray(payload.hydrationGoals)) {
    for (const hg of payload.hydrationGoals.slice(0, 10)) {
      if (!hg?.id) continue;
      const ref = userRef.collection("hydrationGoals").doc(hg.id);
      ops.push((batch) => {
        batch.set(ref, stripUndefinedDeep({ ...hg, traineeId: uid }), { merge: true });
      });
    }
  }

  if (Array.isArray(payload.hydrationLogs)) {
    for (const hl of payload.hydrationLogs.slice(0, 250)) {
      if (!hl?.id) continue;
      const ref = userRef.collection("hydrationLogs").doc(hl.id);
      ops.push((batch) => {
        batch.set(ref, stripUndefinedDeep({ ...hl, traineeId: uid }), { merge: true });
      });
    }
  }

  if (Array.isArray(payload.readinessLogs)) {
    for (const rl of payload.readinessLogs.slice(0, 100)) {
      if (!rl?.id) continue;
      const ref = userRef.collection("readiness").doc(rl.id);
      ops.push((batch) => {
        batch.set(ref, stripUndefinedDeep({ ...rl, traineeId: uid }), { merge: true });
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
  const userRef = db.collection("users").doc(uid);
  const ops: Array<(batch: WriteBatch) => void> = [];

  for (const evt of events.slice(0, 250)) {
    if (!evt?.id || !evt?.type) continue;
    const ref = userRef.collection("events").doc(String(evt.id).slice(0, 128));
    ops.push((batch) => {
      batch.set(
        ref,
        stripUndefinedDeep({
          ...evt,
          traineeId: uid,
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
        const userRef = db.collection("users").doc(model.traineeId);
        const ops: Array<(batch: WriteBatch) => void> = [];

        ops.push((batch) => {
          batch.set(
            userRef.collection("athleteModels").doc("current"),
            stripUndefinedDeep({
              ...model,
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
          if (!exp?.id) continue;
          ops.push((batch) => {
            batch.set(
              userRef.collection("coachingExperiments").doc(exp.id),
              stripUndefinedDeep({ ...exp, traineeId: model.traineeId }),
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
        const userRef = db.collection("users").doc(traineeId);
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
        await db
          .collection("users")
          .doc(entry.traineeId)
          .collection("coachShadowLogs")
          .doc(entry.id)
          .set(stripUndefinedDeep(entry), { merge: true });
        return true;
      } catch (err) {
        console.warn("[FirestoreCoachAdapter] insertShadowLogInDb error:", err);
        return false;
      }
    },

    async loadShadowLogsFromDb(traineeId?: string): Promise<CoachShadowLogRecord[]> {
      try {
        if (!traineeId) return [];
        const db = getDb();
        const snap = await db
          .collection("users")
          .doc(traineeId)
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
        if (!params.traineeId) return 0;
        const db = getDb();
        const snap = await db
          .collection("users")
          .doc(params.traineeId)
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

let firestoreBridgeRegistered = false;

/**
 * Registers the Firestore Coach persistence adapter into `coach-db-bridge.ts`
 * unless an explicit PostgreSQL `DATABASE_URL` already handles persistence.
 */
export function ensureFirestoreCoachBridgeRegistered(): void {
  if (typeof window !== "undefined") return;
  if (firestoreBridgeRegistered || process.env.DATABASE_URL) return;
  registerCoachDbPersistence(createFirestoreCoachDbAdapter());
  firestoreBridgeRegistered = true;
}
