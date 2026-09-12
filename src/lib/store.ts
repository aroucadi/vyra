import {
  User,
  Program,
  WorkoutSession,
  BodyMetricEntry,
  TraineeRosterItem,
  Exercise,
} from "./types";
import { seedExercises } from "@/db/seed/exercises";
import { checkIsPersonalRecord, resolveProgramDay } from "./utils";

// In-memory single-source-of-truth state for realistic local/preview runs
export interface AppDatabase {
  currentUser: User;
  users: User[];
  exercises: Exercise[];
  programs: Program[];
  sessions: WorkoutSession[];
  metrics: BodyMetricEntry[];
}

const coachUser: User = {
  id: "trainer_1",
  role: "trainer",
  name: "Coach Marcus, CSCS",
  email: "marcus@newme.fit",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
  injuries: [],
  goals: ["Coach 50+ athletes to competitive totals"],
};

const traineeAlex: User = {
  id: "trainee_1",
  role: "trainee",
  name: "Alex Rivera",
  email: "alex@example.com",
  avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop",
  heightCm: 182,
  dob: "1998-05-14",
  sex: "male",
  injuries: ["Left shoulder mild impingement (avoid behind-neck pressing)"],
  goals: ["Hypertrophy", "Add 5kg lean mass", "Bench Press 100kg"],
  hideWeightFromTrainee: false,
};

const traineeSarah: User = {
  id: "trainee_2",
  role: "trainee",
  name: "Sarah Chen",
  email: "sarah@example.com",
  avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop",
  heightCm: 168,
  sex: "female",
  injuries: [],
  goals: ["Powerlifting strength base", "Squat 120kg"],
  hideWeightFromTrainee: false,
};

const traineeMarcusV: User = {
  id: "trainee_3",
  role: "trainee",
  name: "Marcus Vance",
  email: "marcus.v@example.com",
  avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop",
  heightCm: 175,
  sex: "male",
  injuries: ["Lower back tightness"],
  goals: ["Mobility & Deload"],
  hideWeightFromTrainee: false,
};

// Start date: 9 days ago so that today lands on Week 2, Day 3 (Push Day)
const getStartDateNineDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 9);
  return d.toISOString().split("T")[0];
};

const getEndDateTwentyDaysAhead = () => {
  const d = new Date();
  d.setDate(d.getDate() + 19);
  return d.toISOString().split("T")[0];
};

const defaultProgram: Program = {
  id: "prog_hypertrophy_1",
  trainerId: "trainer_1",
  traineeId: "trainee_1",
  title: "Hypertrophy Block 1",
  startDate: getStartDateNineDaysAgo(),
  endDate: getEndDateTwentyDaysAhead(),
  durationWeeks: 4,
  status: "published",
  version: 1,
  createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  weeks: [
    {
      id: "week_1",
      programId: "prog_hypertrophy_1",
      weekIndex: 1,
      days: [], // generated in helper
    },
    {
      id: "week_2",
      programId: "prog_hypertrophy_1",
      weekIndex: 2,
      days: [], // generated in helper
    },
    {
      id: "week_3",
      programId: "prog_hypertrophy_1",
      weekIndex: 3,
      days: [],
    },
    {
      id: "week_4",
      programId: "prog_hypertrophy_1",
      weekIndex: 4,
      days: [],
    },
  ],
};

function createStandardDays(weekId: string) {
  return [
    {
      id: `${weekId}_d0`,
      weekId,
      dayOfWeek: 0,
      label: "Push Hypertrophy A",
      isRestDay: false,
      morningRoutine: ["750ml water + electrolytes", "Thoracic spine rotations (10x)", "Band pull-aparts (15x)"],
      nutrition: {
        targetProteinGrams: 180,
        preWorkoutTiming: "60-90m prior to session",
        preWorkoutFoods: "40g carbs + 25g protein (e.g. Oats + Whey isolate)",
        supplements: [
          { name: "Creatine Monohydrate", dosage: "5g", timing: "Post-workout", checked: true },
          { name: "Electrolytes", dosage: "1 packet", timing: "Intra-workout", checked: false },
        ],
      },
      blocks: [
        {
          id: "b1",
          order: 1,
          type: "straight" as const,
          exercises: [
            {
              id: "ep1",
              exerciseId: "ex_bench_press",
              exerciseName: "Barbell Bench Press",
              sets: 3,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: [2, 1, 0],
              restSeconds: 90,
              loadGuidance: "Double progression: add 2.5kg when hitting 10 reps across all 3 sets.",
              formCueText: "Pause on sternum, stack wrists over elbows, retract scapulae.",
              videoUrl: "https://www.youtube.com/results?search_query=barbell+bench+press+form",
              targetMuscleGroups: ["Chest", "Triceps", "Front Deltoids"],
            },
            {
              id: "ep2",
              exerciseId: "ex_incline_db_press",
              exerciseName: "Incline Dumbbell Press",
              sets: 3,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: [2, 1, 1],
              restSeconds: 90,
              loadGuidance: "Maintain 30° bench incline; prioritize deep pec stretch.",
              formCueText: "Full range of motion, control 3-second eccentric lower.",
              videoUrl: "https://www.youtube.com/results?search_query=incline+dumbbell+press+form",
              targetMuscleGroups: ["Upper Chest", "Front Deltoids"],
            },
          ],
        },
        {
          id: "b2",
          order: 2,
          type: "superset" as const,
          exercises: [
            {
              id: "ep3",
              exerciseId: "ex_lateral_raise",
              exerciseName: "Cable Lateral Raise",
              sets: 3,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: [1, 0, 0],
              restSeconds: 0,
              loadGuidance: "Continuous tension, lead with elbows.",
              formCueText: "Slight forward torso lean, raise in scapular plane.",
              videoUrl: "https://www.youtube.com/results?search_query=cable+lateral+raise+form",
              targetMuscleGroups: ["Side Deltoids"],
            },
            {
              id: "ep4",
              exerciseId: "ex_cable_triceps_ext",
              exerciseName: "Overhead Cable Triceps Extension",
              sets: 3,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: [1, 0, 0],
              restSeconds: 60,
              loadGuidance: "Lock elbows in place; stretch triceps at bottom.",
              formCueText: "Flared elbows out slightly, full lockout at extension.",
              videoUrl: "https://www.youtube.com/results?search_query=overhead+cable+triceps+extension+form",
              targetMuscleGroups: ["Triceps (Long Head)"],
            },
          ],
        },
      ],
    },
    {
      id: `${weekId}_d1`,
      weekId,
      dayOfWeek: 1,
      label: "Pull Hypertrophy A",
      isRestDay: false,
      morningRoutine: ["750ml water + electrolytes", "Dead hangs 3x30s"],
      nutrition: {
        targetProteinGrams: 180,
        supplements: [{ name: "Creatine", dosage: "5g", timing: "Post-workout" }],
      },
      blocks: [
        {
          id: "b_pull_1",
          order: 1,
          type: "straight" as const,
          exercises: [
            {
              id: "ep_row",
              exerciseId: "ex_barbell_row",
              exerciseName: "Barbell Bent-Over Row",
              sets: 4,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: [2, 2, 1, 0],
              restSeconds: 90,
              loadGuidance: "Explosive pull to navel, controlled 2-second negative.",
              formCueText: "Torso at 45 degrees, hinge at hips.",
              targetMuscleGroups: ["Upper Back", "Lats"],
            },
            {
              id: "ep_lat",
              exerciseId: "ex_lat_pulldown",
              exerciseName: "Wide-Grip Lat Pulldown",
              sets: 3,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: [2, 1, 0],
              restSeconds: 75,
              loadGuidance: "Drive elbows down and back.",
              formCueText: "Chest proud, slight lean back.",
              targetMuscleGroups: ["Lats"],
            },
          ],
        },
      ],
    },
    {
      id: `${weekId}_d2`,
      weekId,
      dayOfWeek: 2,
      label: "Active Recovery & Mobility",
      isRestDay: true,
      morningRoutine: ["Hydration 1L", "20-minute brisk walk in sunlight", "Full body foam roll"],
      nutrition: {
        targetProteinGrams: 170,
        notes: "Maintenance calories, prioritize gut health and hydration.",
        supplements: [{ name: "Magnesium Glycinate", dosage: "400mg", timing: "Before sleep" }],
      },
      blocks: [],
    },
    {
      id: `${weekId}_d3`,
      weekId,
      dayOfWeek: 3,
      label: "Push Hypertrophy B",
      isRestDay: false,
      morningRoutine: ["750ml water + electrolytes", "Band dislocates 2x15"],
      nutrition: {
        targetProteinGrams: 180,
        preWorkoutTiming: "60m prior",
        preWorkoutFoods: "Banana + Whey Protein",
        supplements: [{ name: "Creatine", dosage: "5g", timing: "Post-workout" }],
      },
      blocks: [
        {
          id: "b_push_b1",
          order: 1,
          type: "straight" as const,
          exercises: [
            {
              id: "ep_db_bench",
              exerciseId: "ex_incline_db_press",
              exerciseName: "Incline Dumbbell Press",
              sets: 4,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: [2, 1, 1, 0],
              restSeconds: 90,
              loadGuidance: "Pyramid load if feel strong on 2nd set.",
              formCueText: "Arch upper back, plant feet firmly.",
              targetMuscleGroups: ["Upper Chest"],
            },
          ],
        },
      ],
    },
    {
      id: `${weekId}_d4`,
      weekId,
      dayOfWeek: 4,
      label: "Legs & Posterior Chain",
      isRestDay: false,
      morningRoutine: ["Warmup: 5 min stationary bike, hip 90/90s"],
      nutrition: {
        targetProteinGrams: 185,
        preWorkoutFoods: "Cream of Rice + Protein (high carb fueling)",
        supplements: [{ name: "Creatine", dosage: "5g", timing: "Post-workout" }],
      },
      blocks: [
        {
          id: "b_legs_1",
          order: 1,
          type: "straight" as const,
          exercises: [
            {
              id: "ep_squat",
              exerciseId: "ex_barbell_squat",
              exerciseName: "Barbell Back Squat",
              sets: 4,
              repRangeLow: 6,
              repRangeHigh: 8,
              rirScheme: [3, 2, 1, 0],
              restSeconds: 120,
              loadGuidance: "Focus on depth at parallel, brace core before descent.",
              formCueText: "Knees track over toes, drive floor away.",
              targetMuscleGroups: ["Quads", "Glutes"],
            },
          ],
        },
      ],
    },
    {
      id: `${weekId}_d5`,
      weekId,
      dayOfWeek: 5,
      label: "Rest & Parasympathetic Recovery",
      isRestDay: true,
      morningRoutine: ["Sleep 8+ hours, light stretching"],
      nutrition: {
        targetProteinGrams: 170,
        supplements: [],
      },
      blocks: [],
    },
    {
      id: `${weekId}_d6`,
      weekId,
      dayOfWeek: 6,
      label: "Arms & Core Conditioning",
      isRestDay: false,
      morningRoutine: ["Dynamic warmup"],
      nutrition: {
        targetProteinGrams: 180,
        supplements: [{ name: "Creatine", dosage: "5g", timing: "Post-workout" }],
      },
      blocks: [],
    },
  ];
}

defaultProgram.weeks.forEach((w) => {
  w.days = createStandardDays(w.id);
});

// Seed sample past workout sessions for Alex
const seedSessions: WorkoutSession[] = [
  {
    id: "sess_1",
    traineeId: "trainee_1",
    programDayId: "week_1_d0",
    programTitle: "Hypertrophy Block 1",
    dayLabel: "Push Hypertrophy A",
    date: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
    startedAt: new Date(Date.now() - 7 * 86400000 - 3600000).toISOString(),
    endedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    durationSec: 3240, // 54 mins
    notes: "Felt strong. Bench paused easily at 80kg.",
    setLogs: [
      { id: "sl1", exercisePrescriptionId: "ep1", exerciseName: "Barbell Bench Press", setIndex: 1, weightKg: 80, reps: 10, rirAchieved: 2, isPR: false },
      { id: "sl2", exercisePrescriptionId: "ep1", exerciseName: "Barbell Bench Press", setIndex: 2, weightKg: 80, reps: 9, rirAchieved: 1, isPR: false },
      { id: "sl3", exercisePrescriptionId: "ep1", exerciseName: "Barbell Bench Press", setIndex: 3, weightKg: 80, reps: 8, rirAchieved: 0, isPR: false },
      { id: "sl4", exercisePrescriptionId: "ep2", exerciseName: "Incline Dumbbell Press", setIndex: 1, weightKg: 28, reps: 12, rirAchieved: 2, isPR: false },
      { id: "sl5", exercisePrescriptionId: "ep2", exerciseName: "Incline Dumbbell Press", setIndex: 2, weightKg: 28, reps: 11, rirAchieved: 1, isPR: false },
      { id: "sl6", exercisePrescriptionId: "ep2", exerciseName: "Incline Dumbbell Press", setIndex: 3, weightKg: 28, reps: 10, rirAchieved: 0, isPR: false },
    ],
  },
  {
    id: "sess_2",
    traineeId: "trainee_1",
    programDayId: "week_1_d1",
    programTitle: "Hypertrophy Block 1",
    dayLabel: "Pull Hypertrophy A",
    date: new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0],
    startedAt: new Date(Date.now() - 6 * 86400000 - 3300000).toISOString(),
    endedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    durationSec: 3000,
    setLogs: [
      { id: "sl7", exercisePrescriptionId: "ep_row", exerciseName: "Barbell Bent-Over Row", setIndex: 1, weightKg: 75, reps: 10, rirAchieved: 2, isPR: true },
      { id: "sl8", exercisePrescriptionId: "ep_row", exerciseName: "Barbell Bent-Over Row", setIndex: 2, weightKg: 75, reps: 10, rirAchieved: 1, isPR: false },
    ],
  },
];

// Seed bodyweight trend for Alex (last 14 days)
const seedMetrics: BodyMetricEntry[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  const baseWeight = 81.8;
  const variation = Math.sin(i / 2) * 0.4 - (i * 0.08); // Slight downward trend
  return {
    id: `bm_${i}`,
    traineeId: "trainee_1",
    date: d.toISOString().split("T")[0],
    weightKg: Math.round((baseWeight + variation) * 10) / 10,
    source: "manual",
  };
});

// Initial Database Singleton
class Store {
  private db: AppDatabase;

  constructor() {
    this.db = {
      currentUser: traineeAlex, // Default lands on Trainee Today screen
      users: [coachUser, traineeAlex, traineeSarah, traineeMarcusV],
      exercises: seedExercises,
      programs: [defaultProgram],
      sessions: seedSessions,
      metrics: seedMetrics,
    };
  }

  getCurrentUser(): User {
    return this.db.currentUser;
  }

  setCurrentUser(userOrId: User | string): User {
    if (typeof userOrId === "string") {
      const found = this.db.users.find((u) => u.id === userOrId);
      if (found) this.db.currentUser = found;
    } else {
      this.db.currentUser = userOrId;
    }
    return this.db.currentUser;
  }

  getTrainees(): User[] {
    return this.db.users.filter((u) => u.role === "trainee" || u.role === "both");
  }

  getUser(id: string): User | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  getExercises(): Exercise[] {
    return this.db.exercises;
  }

  addExercise(exercise: Omit<Exercise, "id">): Exercise {
    const newEx: Exercise = {
      id: `ex_${Date.now()}`,
      ...exercise,
    };
    this.db.exercises.push(newEx);
    return newEx;
  }

  getActiveProgramForTrainee(traineeId: string): Program | undefined {
    return this.db.programs.find(
      (p) => p.traineeId === traineeId && p.status === "published"
    );
  }

  getProgram(id: string): Program | undefined {
    return this.db.programs.find((p) => p.id === id);
  }

  saveProgram(program: Program): Program {
    const idx = this.db.programs.findIndex((p) => p.id === program.id);
    if (idx >= 0) {
      this.db.programs[idx] = program;
    } else {
      this.db.programs.push(program);
    }
    return program;
  }

  publishProgram(programId: string): Program {
    const prog = this.getProgram(programId);
    if (!prog) throw new Error("Program not found");

    // Archive previous published program for this trainee
    this.db.programs.forEach((p) => {
      if (p.traineeId === prog.traineeId && p.id !== programId && p.status === "published") {
        p.status = "archived";
      }
    });

    prog.status = "published";
    prog.version = (prog.version || 1) + 1;
    prog.updatedAt = new Date().toISOString();
    return prog;
  }

  getSessions(traineeId: string): WorkoutSession[] {
    return this.db.sessions.filter((s) => s.traineeId === traineeId);
  }

  saveSession(session: WorkoutSession): WorkoutSession {
    const idx = this.db.sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      this.db.sessions[idx] = session;
    } else {
      this.db.sessions.unshift(session);
    }
    return session;
  }

  getPersonalBestForExercise(traineeId: string, exerciseName: string): { weightKg: number; reps: number } | null {
    let best = { weightKg: 0, reps: 0 };
    this.db.sessions
      .filter((s) => s.traineeId === traineeId)
      .forEach((sess) => {
        sess.setLogs.forEach((log) => {
          if (log.exerciseName.toLowerCase() === exerciseName.toLowerCase()) {
            if (checkIsPersonalRecord(log.weightKg, log.reps, best.weightKg, best.reps)) {
              best = { weightKg: log.weightKg, reps: log.reps };
            }
          }
        });
      });
    return best.weightKg > 0 ? best : null;
  }

  getMetrics(traineeId: string): BodyMetricEntry[] {
    return this.db.metrics
      .filter((m) => m.traineeId === traineeId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  addMetric(traineeId: string, weightKg: number, date?: string): BodyMetricEntry {
    const entry: BodyMetricEntry = {
      id: `bm_${Date.now()}`,
      traineeId,
      date: date || new Date().toISOString().split("T")[0],
      weightKg,
      source: "manual",
    };
    this.db.metrics.push(entry);
    return entry;
  }

  getRoster(): TraineeRosterItem[] {
    const trainees = this.getTrainees();
    return trainees.map((trainee) => {
      const activeProgram = this.getActiveProgramForTrainee(trainee.id);
      const sessions = this.getSessions(trainee.id);
      const lastSession = sessions.length > 0 ? sessions[0] : undefined;

      // Calculate adherence
      let currentWeekIndex = 1;
      let adherencePercentage = 85;
      if (activeProgram) {
        const resolved = resolveProgramDay(activeProgram.startDate);
        currentWeekIndex = resolved.weekIndex;
      }

      // Trainee specific realistic variations
      if (trainee.id === "trainee_1") adherencePercentage = 94;
      if (trainee.id === "trainee_2") adherencePercentage = 78;
      if (trainee.id === "trainee_3") adherencePercentage = 50;

      const alerts: TraineeRosterItem["alerts"] = [];
      if (adherencePercentage < 60) {
        alerts.push({
          type: "missed_sessions",
          message: "3 missed sessions in the last 7 days",
        });
      }
      if (trainee.id === "trainee_2") {
        alerts.push({
          type: "plateau",
          message: "Bench Press volume stalled 2 weeks",
        });
      }
      if (alerts.length === 0) {
        alerts.push({
          type: "optimal",
          message: "On track with progressive overload",
        });
      }

      const totalVolumeKg = sessions.reduce((acc, sess) => {
        return (
          acc +
          sess.setLogs.reduce((sAcc, s) => sAcc + s.weightKg * s.reps, 0)
        );
      }, 0);

      return {
        trainee,
        activeProgram,
        currentWeekIndex,
        adherencePercentage,
        lastSessionDate: lastSession ? lastSession.date : undefined,
        alerts,
        totalVolumeKg: totalVolumeKg || 42500,
      };
    });
  }
}

// Global singleton for Next.js hot reload safety
const globalForStore = globalThis as unknown as { appStore: Store };
export const appStore = globalForStore.appStore || new Store();
if (process.env.NODE_ENV !== "production") globalForStore.appStore = appStore;
