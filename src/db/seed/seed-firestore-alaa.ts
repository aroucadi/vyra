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
  const forceVerify =
    process.argv.includes("--force-verify-owner") ||
    Boolean(process.env.ALAA_INITIAL_PASSWORD);
  try {
    const existingByEmail = await auth.getUserByEmail(ALAA_CANONICAL_EMAIL);
    if (!existingByEmail.emailVerified && (existingByEmail.uid === ALAA_CANONICAL_UID || forceVerify)) {
      await auth.updateUser(existingByEmail.uid, {
        emailVerified: true,
        displayName: existingByEmail.displayName || "Alaa",
        ...(process.env.ALAA_INITIAL_PASSWORD
          ? { password: process.env.ALAA_INITIAL_PASSWORD }
          : {}),
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
    [
      ...userAlaa.injuries,
      "Liver ALAT Watch (41 U/L trending from 20 U/L): Hold Ashwagandha & Shilajit; favor almonds/walnuts over refined sweets; re-test in 8-12w after 48-72h lifting rest",
      "Vitamin D3 Priority: Chronic 10.1 -> 10.2 -> 26.7 ng/mL insufficiency requires mandatory daily D3+K2 with fat-containing lunch (target 40-60 ng/mL)",
      "Creatine & Renal Baseline: Baseline creatinine 8.2 mg/L, DFG 113 mL/min; expect benign 1.5-3.0 mg/L rise from 2.82g/day creatine in Jumbo Hardcore",
    ],
    0.95,
    "measured",
    "Verified 4-year biomarker history (6 panels 2022-2026)"
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
    console.log(`[1/4] Ensuring Firebase Auth account for ${ALAA_CANONICAL_EMAIL}...`);
    const authRes = await ensureAlaaFirebaseAuthUser(auth);
    authUserUid = authRes.authUid;
    authCreated = authRes.created;
    console.log(`  ✔ Auth ready (UID: ${authUserUid}, created: ${authCreated})`);
  }

  const masterProgram = generateMaster16WeekProgram();
  masterProgram.trainerId = ALAA_CANONICAL_UID;
  masterProgram.traineeId = ALAA_CANONICAL_UID;
  masterProgram.supplementProtocols = masterSupplementProtocols;
  masterProgram.hydrationGoal = masterHydrationGoal;

  // 1. Write user profile doc explicitly preserving role: "both" & canonical email
  console.log(`[2/4] Syncing user profile doc (${ALAA_CANONICAL_UID}) with verified v2.1.0 biomarkers...`);
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
  console.log(`  ✔ User profile saved`);

  // 2. Write 16-week Nov 23 Master Program split across weeks/w01..w16 subcollection docs
  console.log(`[3/4] Syncing 16-week Master Program (${masterProgram.id}) across subcollections...`);
  await saveProgramToFirestore(ALAA_CANONICAL_UID, masterProgram, db);
  console.log(`  ✔ 16 weeks saved to subcollection`);

  // 3. Write supplement protocols, hydration goals, and bodyweight metrics idempotently
  //    (intentionally omits sessions so any live logged sessions remain untouched)
  console.log(`[4/4] Syncing supplement protocols, hydration, metrics & AthleteModel...`);
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
  console.log(`  ✔ AthleteModel synchronized with safety rails`);

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
