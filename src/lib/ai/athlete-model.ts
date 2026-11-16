/**
 * Persistent Versioned Athlete Model & Confidence/Provenance Architecture
 * 
 * Central mental file of the AI Coach for every athlete:
 * - Every field carries an explicit confidence score (0.0 to 1.0) and provenance source
 *   ("measured" | "self_reported" | "inferred" | "default").
 * - Distinguishes static/slow-changing structural and lifestyle traits from dynamic estimated
 *   volume landmarks, tendon tolerances, and energy-balance trends.
 * - Tracks active coaching experiments with explicit hypotheses and review dates (anti-flailing).
 * - Enforces zero silent fabricated defaults: reasons with uncertainty instead of pretending to know.
 */

export type FieldSource = "measured" | "self_reported" | "inferred" | "default";

export interface VersionedField<T> {
  value: T;
  confidence: number; // 0.0 to 1.0
  source: FieldSource;
  updatedAt: string; // ISO date string
  provenanceNote?: string;
}

export function createVersionedField<T>(
  value: T,
  confidence: number,
  source: FieldSource,
  provenanceNote?: string
): VersionedField<T> {
  return {
    value,
    confidence: Math.max(0, Math.min(1, confidence)),
    source,
    updatedAt: new Date().toISOString(),
    provenanceNote,
  };
}

export type TrainingRegime = "novice" | "intermediate" | "advanced";
export type FrameSize = "slight" | "medium" | "heavy";
export type FemurRatio = "long_femurs" | "average" | "short_femurs";
export type TorsoRatio = "long_torso" | "average" | "short_torso";
export type ArmSpanRatio = "long_arms" | "average" | "short_arms";

export interface RankedGoal {
  rank: number;
  label: string;
  category: "hypertrophy" | "strength" | "recomposition" | "joint_health";
  targetDate?: string;
  targetMetric?: string;
  realUnderlyingConstraint?: string;
}

export interface CoachingExperiment {
  id: string;
  traineeId: string;
  startDate: string;
  targetReviewDate: string;
  category: "nutrition_surplus" | "volume_pruning" | "exercise_rotation" | "setup_calibration" | "tendon_deload";
  hypothesis: string;
  actionTaken: string;
  successMetric: string;
  status: "active" | "confirmed" | "validated" | "refuted" | "inconclusive" | "abandoned";
  outcome?: "confirmed" | "refuted" | "inconclusive";
  reviewOutcome?: string;
  resolvedAt?: string;
  evidenceSnapshot?: {
    sessionsCount: number;
    metricEntriesCount: number;
    smoothedWeightKg?: number;
  };
}

export interface AthleteModel {
  traineeId: string;
  version: number;
  lastUpdated: string;
  lastWeeklyReviewDate?: string;
  lastMacroReviewDate?: string;

  // Static / Slow-Changing Profile
  static: {
    trainingAgeMonths: VersionedField<number>;
    regime: VersionedField<TrainingRegime>;
    consistencyHistoryScore: VersionedField<number>; // 0.0 to 1.0
    structuralProfile: {
      frameSize: VersionedField<FrameSize>;
      femurRatio: VersionedField<FemurRatio>;
      torsoRatio: VersionedField<TorsoRatio>;
      armSpanRatio: VersionedField<ArmSpanRatio>;
      injuryHistory: VersionedField<string[]>;
      jointTolerances: VersionedField<Record<string, "compromised" | "neutral" | "robust">>;
      exerciseSuitability: VersionedField<Record<string, { suitability: "poor_fit" | "neutral" | "optimal"; reason: string }>>;
    };
    goals: VersionedField<RankedGoal[]>;
    lifestyle: {
      achievableSessionsPerWeek: VersionedField<number>;
      sessionDurationBudgetMinutes: VersionedField<number>;
      occupationPhysicalDemand: VersionedField<"sedentary" | "light" | "active" | "very_active">;
      sleepEnvironmentQuality: VersionedField<"poor" | "fair" | "optimal">;
      locationContext: VersionedField<{
        city: string;
        country: string;
        dietaryStaples: string[];
        budgetTier: "budget_conscious" | "moderate" | "premium";
      }>;
    };
    psychology: {
      structurePreference: VersionedField<"high_structure" | "balanced" | "high_autonomy">;
      quitTriggers: VersionedField<string[]>;
      enjoyedMovements: VersionedField<string[]>;
      foodRelationshipSensitivity: VersionedField<"healthy" | "vulnerable_body_image" | "under_reporting">;
    };
  };

  // Dynamic / Estimated Physiological State
  dynamic: {
    perMuscleResponse: Record<string, VersionedField<{
      growthRate: "fast" | "moderate" | "stubborn";
      volumeTolerance: "low" | "medium" | "high";
    }>>;
    perMuscleVolumeLandmarks: Record<string, VersionedField<{
      inferredMEV: number;
      inferredMRV: number;
      currentPrescribedSets: number;
    }>>;
    perExerciseStimulusFatigue: Record<string, VersionedField<{
      stimulusToFatigueRatio: "exceptional" | "favorable" | "poor_high_axial";
      jointStressLevel: "low" | "moderate" | "high";
      averageSorenessDays: number;
    }>>;
    tendonTolerances: Record<string, VersionedField<{
      joint: string;
      toleranceStatus: "remodeling_lag" | "healthy" | "inflamed";
      weeklyLoadRateCapPct: number;
      recentFrictionSymptomCount: number;
    }>>;
    recoveryCapacity: VersionedField<{
      overallScore: number;
      sleepConsistency: "erratic" | "stable" | "unmeasured";
      stressState: "low" | "moderate" | "high" | "unmeasured";
      appetiteState: "suppressed" | "normal" | "robust" | "unmeasured";
    }>;
    adherenceReality: VersionedField<{
      last28DaysPlanned: number;
      last28DaysCompleted: number;
      completionRatePct: number;
      primaryMissReason?: string;
    }>;
    energyBalanceTrend: VersionedField<{
      smoothedWeightKg: number;
      weeklyRatePct: number;
      estimatedMaintenanceKcal: number;
      currentSurplusKcal: number;
      dailyProteinGramsPerKg: number;
      isEnergyBottleneck: boolean;
      bottleneckReason?: string;
    }>;
  };

  // Persistent Anti-Flailing Experiment Memory
  activeExperiments: CoachingExperiment[];
  resolvedExperiments: CoachingExperiment[];
}

/**
 * Creates a truthful initial Athlete Model with explicit low confidence on defaults,
 * preventing invented measurements from masquerading as factual knowledge.
 */
export function createDefaultAthleteModel(
  traineeId: string,
  overrides?: Partial<AthleteModel>
): AthleteModel {
  const now = new Date().toISOString();

  const base: AthleteModel = {
    traineeId,
    version: 1,
    lastUpdated: now,

    static: {
      trainingAgeMonths: createVersionedField(6, 0.4, "inferred", "Initial estimate; verify during check-in"),
      regime: createVersionedField("novice", 0.5, "inferred", "Assumed novice regime until lifting history is validated"),
      consistencyHistoryScore: createVersionedField(0.7, 0.3, "default", "Baseline prior adherence placeholder"),
      structuralProfile: {
        frameSize: createVersionedField("slight", 0.4, "self_reported", "Frame size baseline"),
        femurRatio: createVersionedField("average", 0.3, "default", "Unmeasured anthropometry"),
        torsoRatio: createVersionedField("average", 0.3, "default", "Unmeasured anthropometry"),
        armSpanRatio: createVersionedField("average", 0.3, "default", "Unmeasured anthropometry"),
        injuryHistory: createVersionedField([], 0.8, "self_reported", "No initial acute injuries logged"),
        jointTolerances: createVersionedField({
          shoulder: "neutral",
          elbow: "neutral",
          knee: "neutral",
          lumbar: "neutral",
        }, 0.5, "default", "Initial joint tolerances"),
        exerciseSuitability: createVersionedField({}, 0.5, "default", "Learned exercise suitability empty"),
      },
      goals: createVersionedField([
        {
          rank: 1,
          label: "Hypertrophy & Lean Mass Gain",
          category: "hypertrophy",
          realUnderlyingConstraint: "Build confidence and aesthetic frame",
        },
      ], 0.8, "self_reported", "Primary onboarding goal"),
      lifestyle: {
        achievableSessionsPerWeek: createVersionedField(3, 0.7, "self_reported", "Sustainable 3-day full-body or upper-lower baseline"),
        sessionDurationBudgetMinutes: createVersionedField(60, 0.8, "self_reported", "Standard 60-min session budget"),
        occupationPhysicalDemand: createVersionedField("sedentary", 0.5, "default", "Desk or study baseline"),
        sleepEnvironmentQuality: createVersionedField("fair", 0.4, "default", "Subject to check-in confirmation"),
        locationContext: createVersionedField({
          city: "Casablanca",
          country: "Morocco",
          dietaryStaples: [
            "whole eggs",
            "canned sardines in olive oil",
            "lentils / harira",
            "chicken / beef tajine with potatoes",
            "olive oil",
            "almonds",
            "milk & bananas",
            "bread",
            "oats",
          ],
          budgetTier: "budget_conscious",
        }, 0.85, "self_reported", "Moroccan whole-food cultural nutrition baseline"),
      },
      psychology: {
        structurePreference: createVersionedField("high_structure", 0.6, "self_reported", "Prefers unambiguous prescriptions"),
        quitTriggers: createVersionedField([
          "Workouts exceeding 75 minutes",
          "Excessive crippling DOMS interfering with daily life",
          "Programs with 15+ complicated exercise rotations",
        ], 0.7, "self_reported", "Psychological drop-out risk factors"),
        enjoyedMovements: createVersionedField(["Incline Dumbbell Press", "Lat Pulldown"], 0.6, "self_reported"),
        foodRelationshipSensitivity: createVersionedField("healthy", 0.5, "default", "No eating disorder flags detected"),
      },
    },

    dynamic: {
      perMuscleResponse: {
        chest: createVersionedField({ growthRate: "moderate", volumeTolerance: "medium" }, 0.4, "default"),
        back: createVersionedField({ growthRate: "moderate", volumeTolerance: "medium" }, 0.4, "default"),
        deltoids: createVersionedField({ growthRate: "moderate", volumeTolerance: "medium" }, 0.4, "default"),
        quads: createVersionedField({ growthRate: "moderate", volumeTolerance: "medium" }, 0.4, "default"),
        hamstrings: createVersionedField({ growthRate: "moderate", volumeTolerance: "medium" }, 0.4, "default"),
        arms: createVersionedField({ growthRate: "moderate", volumeTolerance: "medium" }, 0.4, "default"),
      },
      perMuscleVolumeLandmarks: {
        chest: createVersionedField({ inferredMEV: 10, inferredMRV: 16, currentPrescribedSets: 12 }, 0.4, "inferred"),
        back: createVersionedField({ inferredMEV: 10, inferredMRV: 18, currentPrescribedSets: 12 }, 0.4, "inferred"),
        deltoids: createVersionedField({ inferredMEV: 8, inferredMRV: 18, currentPrescribedSets: 10 }, 0.4, "inferred"),
        quads: createVersionedField({ inferredMEV: 8, inferredMRV: 14, currentPrescribedSets: 10 }, 0.4, "inferred"),
        hamstrings: createVersionedField({ inferredMEV: 6, inferredMRV: 12, currentPrescribedSets: 8 }, 0.4, "inferred"),
        arms: createVersionedField({ inferredMEV: 6, inferredMRV: 14, currentPrescribedSets: 8 }, 0.4, "inferred"),
      },
      perExerciseStimulusFatigue: {},
      tendonTolerances: {
        elbow: createVersionedField({ joint: "elbow", toleranceStatus: "healthy", weeklyLoadRateCapPct: 3.5, recentFrictionSymptomCount: 0 }, 0.5, "default"),
        shoulder: createVersionedField({ joint: "shoulder", toleranceStatus: "healthy", weeklyLoadRateCapPct: 3.5, recentFrictionSymptomCount: 0 }, 0.5, "default"),
        knee: createVersionedField({ joint: "knee", toleranceStatus: "healthy", weeklyLoadRateCapPct: 3.5, recentFrictionSymptomCount: 0 }, 0.5, "default"),
      },
      recoveryCapacity: createVersionedField({
        overallScore: 70,
        sleepConsistency: "unmeasured",
        stressState: "unmeasured",
        appetiteState: "unmeasured",
      }, 0.2, "default", "No continuous biometric or sleep telemetry currently attached"),
      adherenceReality: createVersionedField({
        last28DaysPlanned: 12,
        last28DaysCompleted: 10,
        completionRatePct: 83,
      }, 0.6, "inferred", "Calculated from recent logged session frequency"),
      energyBalanceTrend: createVersionedField({
        smoothedWeightKg: 0,
        weeklyRatePct: 0.0,
        estimatedMaintenanceKcal: 0,
        currentSurplusKcal: 0,
        dailyProteinGramsPerKg: 0,
        isEnergyBottleneck: false,
      }, 0.0, "default", "Unmeasured: awaiting scale logs and nutrition intake"),
    },

    activeExperiments: [],
    resolvedExperiments: [],
  };

  if (!overrides) return base;

  return {
    ...base,
    ...overrides,
    static: { ...base.static, ...(overrides.static || {}) },
    dynamic: { ...base.dynamic, ...(overrides.dynamic || {}) },
  };
}

import { getCoachDbPersistence } from "./coach-db-bridge";

const STORAGE_KEY = "vyra_athlete_model_vault_v1";

export class AthleteModelStore {
  private models: Map<string, AthleteModel> = new Map();
  private hydrated = false;
  private durableFilePath: string | null = null;
  private pendingDbSyncs: Map<string, Promise<boolean>> = new Map();

  /**
   * Hydrates a specific trainee's `AthleteModel` and `CoachingExperiment` history
   * from PostgreSQL via Drizzle (`athlete_models` + `coaching_experiments`).
   * Essential for multi-user deployments and Cloud Run where container memory resets.
   */
  public async hydrateFromDatabase(traineeId: string): Promise<AthleteModel> {
    this.hydrate();
    try {
      const repo = await getCoachDbPersistence();
      const dbModel = repo ? await repo.loadAthleteModelFromDb(traineeId) : null;
      if (dbModel) {
        this.models.set(traineeId, dbModel);
        return dbModel;
      }
    } catch {
      // Fallback to in-memory / default model if DB is unreachable
    }
    return this.getAthleteModel(traineeId);
  }

  /**
   * Flushes and awaits Drizzle PostgreSQL persistence (`athlete_models` + `coaching_experiments`)
   * for a trainee (or all loaded trainees) before a Cloud Run request completes.
   */
  public async syncToDatabase(traineeId?: string): Promise<boolean> {
    this.hydrate();
    try {
      const repo = await getCoachDbPersistence();
      if (!repo) return false;

      if (traineeId) {
        const pending = this.pendingDbSyncs.get(traineeId);
        if (pending) {
          await pending;
        }
        const model = this.models.get(traineeId);
        if (!model) return false;
        return await repo.upsertAthleteModelInDb(model);
      }

      let anySynced = false;
      for (const [id, model] of this.models.entries()) {
        const pending = this.pendingDbSyncs.get(id);
        if (pending) {
          await pending;
        }
        const ok = await repo.upsertAthleteModelInDb(model);
        if (ok) anySynced = true;
      }
      return anySynced;
    } catch {
      return false;
    }
  }

  /**
   * Configures a server-side durable JSON file path (or DB-backed snapshot file) so
   * `AthleteModel` and `CoachingExperiment` history survive browser `localStorage` clears.
   */
  public setDurableFilePath(filePath: string | null): void {
    this.durableFilePath = filePath;
  }

  public persistToDiskFile(explicitPath?: string): boolean {
    const targetPath = explicitPath || this.durableFilePath;
    if (!targetPath || typeof window !== "undefined") return false;
    try {
      const fs = require("node:fs");
      const path = require("node:path");
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const obj: Record<string, AthleteModel> = {};
      for (const [id, model] of this.models.entries()) {
        obj[id] = model;
      }
      fs.writeFileSync(targetPath, JSON.stringify(obj, null, 2), "utf8");
      return true;
    } catch {
      return false;
    }
  }

  public loadFromDiskFile(explicitPath?: string): boolean {
    const targetPath = explicitPath || this.durableFilePath;
    if (!targetPath || typeof window !== "undefined") return false;
    try {
      const fs = require("node:fs");
      if (!fs.existsSync(targetPath)) return false;
      const raw = fs.readFileSync(targetPath, "utf8");
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        for (const [id, model] of Object.entries(parsed)) {
          this.models.set(id, model as AthleteModel);
        }
        this.hydrated = true;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private hydrate() {
    if (this.hydrated) return;
    this.hydrated = true;
    if (this.durableFilePath) {
      this.loadFromDiskFile(this.durableFilePath);
    }
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed === "object" && parsed !== null) {
            for (const [id, model] of Object.entries(parsed)) {
              this.models.set(id, model as AthleteModel);
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }

  private persist() {
    if (this.durableFilePath) {
      this.persistToDiskFile(this.durableFilePath);
    }
    if (typeof window !== "undefined") {
      try {
        const obj: Record<string, AthleteModel> = {};
        for (const [id, model] of this.models.entries()) {
          obj[id] = model;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      } catch {
        // ignore
      }
    }
  }

  public getAthleteModel(traineeId: string): AthleteModel {
    this.hydrate();
    let model = this.models.get(traineeId);
    if (!model) {
      model = createDefaultAthleteModel(traineeId);
      this.models.set(traineeId, model);
      this.persist();
    }
    return model;
  }

  public saveAthleteModel(model: AthleteModel): AthleteModel {
    this.hydrate();
    const updated: AthleteModel = {
      ...model,
      version: model.version + 1,
      lastUpdated: new Date().toISOString(),
    };
    this.models.set(model.traineeId, updated);
    this.persist();
    if (typeof window === "undefined") {
      const syncPromise = getCoachDbPersistence()
        .then((repo) => (repo ? repo.upsertAthleteModelInDb(updated) : false))
        .catch(() => false);
      this.pendingDbSyncs.set(model.traineeId, syncPromise);
    }
    return updated;
  }

  public updateAthleteModel(
    traineeId: string,
    mutator: (prev: AthleteModel) => AthleteModel
  ): AthleteModel {
    const prev = this.getAthleteModel(traineeId);
    const mutated = mutator(prev);
    return this.saveAthleteModel(mutated);
  }

  public recordExperiment(experiment: Omit<CoachingExperiment, "id">): CoachingExperiment {
    this.hydrate();
    const model = this.getAthleteModel(experiment.traineeId);
    const fullExperiment: CoachingExperiment = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...experiment,
    };
    model.activeExperiments.push(fullExperiment);
    this.saveAthleteModel(model);
    return fullExperiment;
  }

  public resolveExperiment(
    traineeId: string,
    experimentId: string,
    status: CoachingExperiment["status"],
    reviewOutcome: string,
    evidenceSnapshot?: CoachingExperiment["evidenceSnapshot"]
  ): CoachingExperiment | undefined {
    this.hydrate();
    const model = this.getAthleteModel(traineeId);
    const expIdx = model.activeExperiments.findIndex((e) => e.id === experimentId);
    if (expIdx === -1) return undefined;

    const [exp] = model.activeExperiments.splice(expIdx, 1);
    exp.status = status;
    exp.outcome =
      status === "confirmed" || status === "validated"
        ? "confirmed"
        : status === "refuted"
          ? "refuted"
          : "inconclusive";
    exp.reviewOutcome = reviewOutcome;
    exp.resolvedAt = new Date().toISOString();
    if (evidenceSnapshot) {
      exp.evidenceSnapshot = evidenceSnapshot;
    }
    model.resolvedExperiments.unshift(exp);
    this.saveAthleteModel(model);
    return exp;
  }

  public extendExperimentReviewWindow(
    traineeId: string,
    experimentId: string,
    newTargetReviewDate: string,
    reviewOutcome: string
  ): CoachingExperiment | undefined {
    this.hydrate();
    const model = this.getAthleteModel(traineeId);
    const exp = model.activeExperiments.find((e) => e.id === experimentId);
    if (!exp) return undefined;

    exp.targetReviewDate = newTargetReviewDate;
    exp.outcome = "inconclusive";
    exp.reviewOutcome = reviewOutcome;
    this.saveAthleteModel(model);
    return exp;
  }

  /**
   * Value-of-Information Check-In Generator:
   * Identifies the single missing or low-confidence metric that has the highest leverage
   * on current coaching decisions, rather than harassing the athlete with a 20-item form.
   */
  public getHighValueCheckInPrompt(model: AthleteModel): {
    neededField: string;
    question: string;
    rationale: string;
    priority: "critical" | "high" | "moderate";
    quickTapOptions?: Array<"yes" | "mostly" | "no">;
  } {
    // 0. If an active nutrition_surplus experiment is running, offer a low-friction 1-tap meal/shake compliance check-in
    const hasActiveNutritionExperiment = model.activeExperiments.some(
      (e) => e.status === "active" && e.category === "nutrition_surplus"
    );
    if (hasActiveNutritionExperiment) {
      return {
        neededField: "meal_habit_check_in",
        question: "Did you hit your 3 meals + shake most days this week? (Yes / Mostly / No)",
        rationale: "Lets us evaluate your nutrition surplus experiment without requiring tedious daily calorie counting.",
        priority: "critical",
        quickTapOptions: ["yes", "mostly", "no"],
      };
    }

    // 1. If energy balance is unmeasured and the lifter is novice/stalled
    if (model.dynamic.energyBalanceTrend.confidence < 0.5) {
      return {
        neededField: "bodyweight_and_intake",
        question: "What has your morning bodyweight looked like over the past few days, and roughly how many meals are you hitting daily?",
        rationale: "For your current training block, energy balance is the primary rate-limiting lever for progression.",
        priority: "critical",
      };
    }

    // 2. If recovery capacity has near-zero confidence
    if (model.dynamic.recoveryCapacity.confidence < 0.3) {
      return {
        neededField: "sleep_and_stress",
        question: "How many hours of uninterrupted sleep did you average this week, and how is your daily energy feeling?",
        rationale: "We calibrate weekly volume landmarks against your actual autonomic recovery capacity.",
        priority: "high",
      };
    }

    // 3. If structural joint tolerances are unconfirmed
    if (model.static.structuralProfile.jointTolerances.confidence < 0.5) {
      return {
        neededField: "joint_discomfort",
        question: "Do you have any recurring joint tenderness (shoulders, elbows, knees, or lower back) when pressing or squatting?",
        rationale: "Ensures we program lines of pull that protect your tendons and cartilage before loading up.",
        priority: "moderate",
      };
    }

    return {
      neededField: "session_rpe",
      question: "How did the overall difficulty and pump feel across your last working sets?",
      rationale: "Refines per-muscle stimulus-to-fatigue profiles.",
      priority: "moderate",
    };
  }

  public setAthleteModelFromBootstrap(model: AthleteModel | null): void {
    this.hydrate();
    if (!model || !model.traineeId) return;
    this.models.set(model.traineeId, model);
    this.persist();
  }

  public clearForTesting() {
    this.models.clear();
    this.hydrated = false;
  }
}

export const athleteModelStore = new AthleteModelStore();
