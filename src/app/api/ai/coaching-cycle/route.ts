import { NextResponse } from "next/server";
import "@/db/coach-repository";
import {
  runAutonomousCoachingLifecycleCheck,
  evaluateCommittedExperiments,
  assembleAthleteCaseFile,
  executeMacroBlockReview,
  executeWeeklyMesoReview,
} from "@/lib/ai/coaching-cycle";
import { athleteModelStore } from "@/lib/ai/athlete-model";
import { WorkoutSession, BodyMetricEntry } from "@/lib/types";

export interface CoachingCycleRequestBody {
  traineeId: string;
  sessions?: WorkoutSession[];
  metricEntries?: BodyMetricEntry[];
  averageLoggedCalories?: number;
  currentDate?: string;
  action?: "lifecycle_check" | "evaluate_experiments" | "macro_review" | "weekly_review";
  forceMacroReview?: boolean;
  forceWeeklyReview?: boolean;
}

/**
 * POST /api/ai/coaching-cycle
 *
 * Executes the multi-timescale coaching loops:
 * - `evaluateCommittedExperiments`: evaluates due experiments against `successMetric`, sets outcome to `confirmed` / `refuted` / `inconclusive`, and updates `AthleteModel`.
 * - `executeMacroBlockReview` (Loop A, 4-8 weeks)
 * - `executeWeeklyMesoReview` (Loop B, 7 days)
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CoachingCycleRequestBody>;
    if (!body || !body.traineeId) {
      return NextResponse.json(
        { ok: false, error: "Missing required field: traineeId" },
        { status: 400 }
      );
    }

    const sessions = Array.isArray(body.sessions) ? body.sessions : [];
    const metricEntries = Array.isArray(body.metricEntries) ? body.metricEntries : [];

    // Hydrate athlete model & experiment history from Drizzle PostgreSQL before running
    await athleteModelStore.hydrateFromDatabase(body.traineeId);

    if (body.action === "evaluate_experiments") {
      const evaluated = evaluateCommittedExperiments({
        traineeId: body.traineeId,
        sessions,
        metricEntries,
        currentDate: body.currentDate,
      });
      await athleteModelStore.syncToDatabase(body.traineeId);
      return NextResponse.json({ ok: true, evaluatedExperiments: evaluated }, { status: 200 });
    }

    if (body.action === "macro_review") {
      const caseFile = assembleAthleteCaseFile({
        traineeId: body.traineeId,
        sessions,
        metricEntries,
        averageLoggedCalories: body.averageLoggedCalories,
      });
      const macroBlockPlan = executeMacroBlockReview(caseFile);
      await athleteModelStore.syncToDatabase(body.traineeId);
      return NextResponse.json({ ok: true, macroBlockPlan }, { status: 200 });
    }

    if (body.action === "weekly_review") {
      const evaluated = evaluateCommittedExperiments({
        traineeId: body.traineeId,
        sessions,
        metricEntries,
        currentDate: body.currentDate,
      });
      const caseFile = assembleAthleteCaseFile({
        traineeId: body.traineeId,
        sessions,
        metricEntries,
        averageLoggedCalories: body.averageLoggedCalories,
      });
      const weeklyReview = executeWeeklyMesoReview(caseFile, {
        hasNewEvidence: sessions.length > 0 || metricEntries.length > 0,
      });
      await athleteModelStore.syncToDatabase(body.traineeId);
      return NextResponse.json(
        { ok: true, evaluatedExperiments: evaluated, weeklyReview },
        { status: 200 }
      );
    }

    const lifecycle = runAutonomousCoachingLifecycleCheck({
      traineeId: body.traineeId,
      sessions,
      metricEntries,
      averageLoggedCalories: body.averageLoggedCalories,
      currentDate: body.currentDate,
      forceMacroReview: body.forceMacroReview,
      forceWeeklyReview: body.forceWeeklyReview,
    });
    await athleteModelStore.syncToDatabase(body.traineeId);

    return NextResponse.json({ ok: true, ...lifecycle }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to execute autonomous coaching cycle.",
      },
      { status: 500 }
    );
  }
}
