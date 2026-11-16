import "dotenv/config";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { getFirebaseAdminAuth, getFirestoreDb } from "@/lib/firebase/admin";
import {
  saveProgramToFirestore,
  saveUserSyncBatch,
  createFirestoreCoachDbAdapter,
  stripUndefinedDeep,
} from "@/lib/firebase/firestore-repository";
import {
  userAlaa,
  generateMaster16WeekProgram,
  masterSupplementProtocols,
  masterHydrationGoal,
  seedMetricsAlaa,
} from "@/db/seed/master-transformation-program";
import { createDefaultAthleteModel, createVersionedField } from "@/lib/ai/athlete-model";
import { ALAA_CANONICAL_EMAIL, ALAA_CANONICAL_UID } from "@/lib/auth/server-session";

export interface SeedFirestoreResult {
  success: boolean;
  uid: string;
  email: string;
  authUserUid: string;
  authCreated: boolean;
  programId: string;
  weeksWritten: number;
  metricsWritten: number;
  supplementProtocolsWritten: number;
  hydrationGoalsWritten: number;
  athleteModelSynced: boolean;
}

async function ensureAlaaFirebaseAuthUser(auth: Auth): Promise<{ authUid: string; created: boolean }> {
  try {
    const existingByEmail = await auth.getUserByEmail(ALAA_CANONICAL_EMAIL);
    if (!existingByEmail.emailVerified) {
      await auth.updateUser(existingByEmail.uid, {
        emailVerified: true,
        displayName: existingByEmail.displayName || "Alaa",
      });
    }
    return { authUid: existingByEmail.uid, created: false };
  } catch {
    // Email not registered yet
  }

  try {
    const existingByUid = await auth.getUser(ALAA_CANONICAL_UID);
    await auth.updateUser(existingByUid.uid, {
      email: ALAA_CANONICAL_EMAIL,
      emailVerified: true,
      displayName: "Alaa",
    });
    return { authUid: existingByUid.uid, created: false };
  } catch {
    // UID not registered yet
  }

  const createdUser = await auth.createUser({
    uid: ALAA_CANONICAL_UID,
    email: ALAA_CANONICAL_EMAIL,
    emailVerified: true,
    displayName: "Alaa",
  });
  return { authUid: createdUser.uid, created: true };
}

export function buildAlaaSeedAthleteModel() {
  const model = createDefaultAthleteModel(ALAA_CANONICAL_UID);
  model.static.trainingAgeMonths = createVersionedField(6, 0.9, "measured", "Consistent multi-week VYRA tracking");
  model.static.regime = createVersionedField("novice", 0.9, "measured", "Linear + double progression novice/early-intermediate");
  model.static.structuralProfile.injuryHistory = createVersionedField(
    [...userAlaa.injuries],
    0.95,
    "measured",
    "Verified biomechanical constraints from VYRA Master Profile"
  );
  model.static.goals = createVersionedField(
    [
      {
        rank: 1,
        label: "Gain +0.20 to +0.40 kg/week cleanly to 55.5 kg (Week 12) and 57.0 kg (Week 16)",
        category: "hypertrophy",
        targetDate: "2027-03-15",
        targetMetric: "57.0 kg @ ~10-12% BF",
        realUnderlyingConstraint: "Energy surplus consistency (2,710 kcal/day | 173.6g P / 317.4g C / 72.2g F)",
      },
      {
        rank: 2,
        label: "Reverse anterior pelvic tilt & rib flare + protect supraspinatus tendon",
        category: "joint_health",
        targetMetric: "0 joint_strain flags",
      },
    ],
    0.95,
    "measured"
  );
  model.dynamic.energyBalanceTrend = createVersionedField(
    {
      smoothedWeightKg: 52.05,
      weeklyRatePct: 0.35,
      estimatedMaintenanceKcal: 2350,
      currentSurplusKcal: 360,
      dailyProteinGramsPerKg: 3.3,
      isEnergyBottleneck: false,
    },
    0.9,
    "measured",
    "52.05 kg morning floor climbing from 51.75 kg baseline"
  );
  return model;
}

export async function seedAlaaToFirestore(options?: {
  db?: Firestore;
  auth?: Auth;
  skipAuth?: boolean;
}): Promise<SeedFirestoreResult> {
  const db = options?.db || getFirestoreDb();
  const auth = options?.auth || (options?.skipAuth ? undefined : getFirebaseAdminAuth());

  let authUserUid = ALAA_CANONICAL_UID;
  let authCreated = false;
  if (auth) {
    const authRes = await ensureAlaaFirebaseAuthUser(auth);
    authUserUid = authRes.authUid;
    authCreated = authRes.created;
  }

  const masterProgram = generateMaster16WeekProgram();
  masterProgram.trainerId = ALAA_CANONICAL_UID;
  masterProgram.traineeId = ALAA_CANONICAL_UID;
  masterProgram.supplementProtocols = masterSupplementProtocols;
  masterProgram.hydrationGoal = masterHydrationGoal;

  // 1. Write user profile doc explicitly preserving role: "both" & canonical email
  await db
    .collection("users")
    .doc(ALAA_CANONICAL_UID)
    .set(
      stripUndefinedDeep({
        ...userAlaa,
        id: ALAA_CANONICAL_UID,
        email: ALAA_CANONICAL_EMAIL,
        role: "both",
        seededBy: "seed-firestore-alaa",
        seededAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );

  // 2. Write 16-week Nov 23 Master Program split across weeks/w01..w16 subcollection docs
  await saveProgramToFirestore(ALAA_CANONICAL_UID, masterProgram, db);

  // 3. Write supplement protocols, hydration goals, and bodyweight metrics idempotently
  //    (intentionally omits sessions so any live logged sessions remain untouched)
  await saveUserSyncBatch(
    ALAA_CANONICAL_UID,
    {
      metrics: seedMetricsAlaa,
      supplementProtocols: masterSupplementProtocols,
      hydrationGoals: [masterHydrationGoal],
    },
    db
  );

  // 4. Write Alaa's seeded AthleteModel
  const coachAdapter = createFirestoreCoachDbAdapter(db);
  const athleteModelSynced = await coachAdapter.upsertAthleteModelInDb(buildAlaaSeedAthleteModel());

  return {
    success: true,
    uid: ALAA_CANONICAL_UID,
    email: ALAA_CANONICAL_EMAIL,
    authUserUid,
    authCreated,
    programId: masterProgram.id,
    weeksWritten: masterProgram.weeks.length,
    metricsWritten: seedMetricsAlaa.length,
    supplementProtocolsWritten: masterSupplementProtocols.length,
    hydrationGoalsWritten: 1,
    athleteModelSynced,
  };
}

async function main() {
  console.log("🚀 Seeding Alaa's exclusive profile & Nov 23 5-Day Program into Firestore (vyra-509011)...");
  const result = await seedAlaaToFirestore();
  console.log("✅ Seed completed:", JSON.stringify(result, null, 2));
}

if (typeof process !== "undefined" && process.argv[1]?.includes("seed-firestore-alaa")) {
  main().catch((err) => {
    console.error("❌ Failed to seed Firestore for Alaa:", err);
    process.exit(1);
  });
}
