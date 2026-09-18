import { config } from "dotenv";
config();

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../schema";
import {
  userAlaa,
  userAlaaPro,
  linkAlaa,
  generateMaster16WeekProgram,
  masterSupplementProtocols,
  masterHydrationGoal,
  seedMetricsAlaa,
} from "./master-transformation-program";
import { seedExercises } from "./exercises";

export async function runSeed(customDbUrl?: string) {
  const dbUrl = customDbUrl || process.env.DATABASE_URL;

  console.log("------------------------------------------------------------");
  console.log("[NewME Cloud DB Seeding] Master Transformation Protocol");
  console.log("------------------------------------------------------------");

  if (!dbUrl) {
    console.warn("[Notice] DATABASE_URL environment variable is not set.");
    console.warn("  In-memory store is already pre-seeded with Alaa and Alaa Pro.");
    console.warn("  To seed PostgreSQL in Google Cloud Run / Cloud SQL, set DATABASE_URL.");
    return { success: false, reason: "DATABASE_URL_NOT_SET" };
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });

  const db = drizzle(pool, { schema });

  try {
    console.log("[PostgreSQL] Connected successfully.");

    // 1. Seed Users (Alaa Pro & Alaa)
    console.log("[Users] Seeding Trainer Alaa Pro & Trainee Alaa...");
    await db
      .insert(schema.users)
      .values([
        {
          id: userAlaaPro.id,
          role: userAlaaPro.role,
          name: userAlaaPro.name,
          email: userAlaaPro.email,
          avatarUrl: userAlaaPro.avatarUrl,
          goals: userAlaaPro.goals,
          injuries: userAlaaPro.injuries,
        },
        {
          id: userAlaa.id,
          role: userAlaa.role,
          name: userAlaa.name,
          email: userAlaa.email,
          avatarUrl: userAlaa.avatarUrl,
          dob: userAlaa.dob,
          sex: userAlaa.sex,
          heightCm: userAlaa.heightCm,
          injuries: userAlaa.injuries,
          goals: userAlaa.goals,
          hideWeightFromTrainee: userAlaa.hideWeightFromTrainee,
        },
      ])
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          name: schema.users.name,
          email: schema.users.email,
          goals: schema.users.goals,
          injuries: schema.users.injuries,
        },
      });

    // 2. Seed Trainer Link
    console.log("[TrainerLink] Linking Coach Alaa Pro to Trainee Alaa...");
    await db
      .insert(schema.trainerLinks)
      .values({
        id: "link_alaa_trainer_trainee",
        trainerId: linkAlaa.trainerId,
        traineeId: linkAlaa.traineeId,
        status: linkAlaa.status,
      })
      .onConflictDoUpdate({
        target: schema.trainerLinks.id,
        set: { status: linkAlaa.status },
      });

    // 3. Seed Base Exercise Catalog
    console.log("[Exercises] Seeding Exercise Catalog (" + seedExercises.length + " movements)...");
    for (const ex of seedExercises) {
      await db
        .insert(schema.exercises)
        .values({
          id: ex.id,
          name: ex.name,
          primaryMuscle: ex.primaryMuscle,
          secondaryMuscles: ex.secondaryMuscles,
          equipment: ex.equipment,
          videoUrl: ex.videoUrl,
          wikiUrl: ex.wikiUrl,
          muscleWikiId: ex.muscleWikiId,
          difficulty: ex.difficulty,
          steps: ex.steps,
          mediaUrls: ex.mediaUrls,
          muscleWikiUrl: ex.muscleWikiUrl,
        })
        .onConflictDoUpdate({
          target: schema.exercises.id,
          set: {
            name: ex.name,
            primaryMuscle: ex.primaryMuscle,
            equipment: ex.equipment,
            muscleWikiId: ex.muscleWikiId,
            difficulty: ex.difficulty,
            steps: ex.steps,
            mediaUrls: ex.mediaUrls,
            muscleWikiUrl: ex.muscleWikiUrl,
          },
        });
    }

    // 4. Seed Master 16-Week Program
    console.log("[Program] Generating & Seeding Master 16-Week Blueprint...");
    const masterProg = generateMaster16WeekProgram();

    await db
      .insert(schema.programs)
      .values({
        id: masterProg.id,
        trainerId: masterProg.trainerId,
        traineeId: masterProg.traineeId,
        title: masterProg.title,
        startDate: masterProg.startDate,
        endDate: masterProg.endDate,
        durationWeeks: masterProg.durationWeeks,
        status: masterProg.status,
        version: masterProg.version,
      })
      .onConflictDoUpdate({
        target: schema.programs.id,
        set: {
          title: masterProg.title,
          status: masterProg.status,
          version: masterProg.version,
        },
      });

    let totalPrescriptions = 0;
    for (const week of masterProg.weeks) {
      await db
        .insert(schema.programWeeks)
        .values({
          id: week.id,
          programId: week.programId,
          weekIndex: week.weekIndex,
        })
        .onConflictDoNothing();

      for (const day of week.days) {
        await db
          .insert(schema.programDays)
          .values({
            id: day.id,
            weekId: day.weekId,
            dayOfWeek: day.dayOfWeek,
            label: day.label,
            isRestDay: day.isRestDay,
            morningRoutine: day.morningRoutine,
            nutrition: day.nutrition,
          })
          .onConflictDoUpdate({
            target: schema.programDays.id,
            set: {
              label: day.label,
              isRestDay: day.isRestDay,
              morningRoutine: day.morningRoutine,
              nutrition: day.nutrition,
            },
          });

        for (const block of day.blocks) {
          await db
            .insert(schema.blocks)
            .values({
              id: block.id,
              dayId: day.id,
              order: block.order,
              type: block.type,
            })
            .onConflictDoNothing();

          for (const ep of block.exercises) {
            totalPrescriptions++;
            await db
              .insert(schema.exercisePrescriptions)
              .values({
                id: ep.id,
                blockId: block.id,
                exerciseId: ep.exerciseId,
                exerciseName: ep.exerciseName,
                sets: ep.sets,
                repRangeLow: ep.repRangeLow,
                repRangeHigh: ep.repRangeHigh,
                rirScheme: ep.rirScheme,
                restSeconds: ep.restSeconds,
                loadGuidance: ep.loadGuidance,
                formCueText: ep.formCueText,
                videoUrl: ep.videoUrl,
                wikiMuscleUrl: ep.wikiMuscleUrl,
                targetMuscleGroups: ep.targetMuscleGroups,
                equipmentVariations: ep.equipmentVariations,
                selectedEquipment: ep.selectedEquipment,
                hasDropSet: ep.hasDropSet,
                dropSetGuidance: ep.dropSetGuidance,
              })
              .onConflictDoUpdate({
                target: schema.exercisePrescriptions.id,
                set: {
                  sets: ep.sets,
                  repRangeLow: ep.repRangeLow,
                  repRangeHigh: ep.repRangeHigh,
                  rirScheme: ep.rirScheme,
                  restSeconds: ep.restSeconds,
                  equipmentVariations: ep.equipmentVariations,
                  hasDropSet: ep.hasDropSet,
                  dropSetGuidance: ep.dropSetGuidance,
                },
              });
          }
        }
      }
    }
    console.log("  [Done] 16 weeks, 112 days, " + totalPrescriptions + " exercise prescriptions seeded.");

    // 5. Seed Supplement Protocols
    console.log("[Supplements] Seeding Master Supplement Protocols...");
    for (const sp of masterSupplementProtocols) {
      await db
        .insert(schema.supplementProtocols)
        .values({
          id: sp.id,
          programId: sp.programId,
          name: sp.name,
          category: sp.category,
          phases: sp.phases,
        })
        .onConflictDoUpdate({
          target: schema.supplementProtocols.id,
          set: {
            name: sp.name,
            category: sp.category,
            phases: sp.phases,
          },
        });
    }

    // 6. Seed Hydration Goal
    console.log("[Hydration] Seeding Hydration Architecture...");
    await db
      .insert(schema.hydrationGoals)
      .values({
        id: masterHydrationGoal.id,
        programId: masterHydrationGoal.programId,
        traineeId: masterHydrationGoal.traineeId,
        dailyTargetMl: masterHydrationGoal.dailyTargetMl,
        workoutDayBonusMl: masterHydrationGoal.workoutDayBonusMl,
      })
      .onConflictDoUpdate({
        target: schema.hydrationGoals.id,
        set: {
          dailyTargetMl: masterHydrationGoal.dailyTargetMl,
          workoutDayBonusMl: masterHydrationGoal.workoutDayBonusMl,
        },
      });

    // 7. Seed Initial Bodyweight Metrics
    console.log("[Metrics] Seeding " + seedMetricsAlaa.length + " baseline bodyweight entries...");
    for (const bm of seedMetricsAlaa) {
      await db
        .insert(schema.bodyMetricEntries)
        .values({
          id: bm.id,
          traineeId: bm.traineeId,
          date: bm.date,
          weightKg: bm.weightKg,
          source: bm.source,
        })
        .onConflictDoUpdate({
          target: schema.bodyMetricEntries.id,
          set: { weightKg: bm.weightKg },
        });
    }

    console.log("------------------------------------------------------------");
    console.log("[Success] Seeding complete! Alaa & Alaa Pro ready for production.");
    console.log("------------------------------------------------------------");
    return { success: true };
  } catch (error) {
    console.error("[Error] Database seeding failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Direct CLI execution
if (require.main === module) {
  runSeed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
