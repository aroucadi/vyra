import { NextResponse } from "next/server";
import {
  adaptDailyWorkoutSession,
  AdaptDailyWorkoutInput,
} from "@/lib/ai/daily-session-adapter";

/**
 * POST /api/ai/adapt-day
 * 
 * Real-Time Ephemeral Daily Workout Adaptation & Gym Photo Equipment Recognition Route.
 * - Accepts a voice transcript or text check-in (e.g. poor sleep, football abdominal injury,
 *   20-minute meeting time crunch, low energy) + optional gym setup photo (`gymPhotoDataUri`).
 * - Recognizes available gym equipment at the user's current workout location (`gymId`).
 * - Adapts ONLY today's workout session (`scope: "TODAY_SESSION_ONLY"`, `longTermProgramModified: false`).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<AdaptDailyWorkoutInput>;

    if (!body || !body.traineeId || !Array.isArray(body.exercises)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing required fields: traineeId and exercises array are required.",
        },
        { status: 400 }
      );
    }

    const result = await adaptDailyWorkoutSession({
      traineeId: body.traineeId,
      voiceOrTextMessage: body.voiceOrTextMessage || "",
      gymId: body.gymId,
      gymName: body.gymName,
      gymPhotoDataUri: body.gymPhotoDataUri,
      gymPhotoCaption: body.gymPhotoCaption,
      overrideGymEquipment: body.overrideGymEquipment,
      exercises: body.exercises,
    });

    return NextResponse.json(
      {
        ok: true,
        adaptation: result,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err?.message || "Failed to execute Real-Time Daily Workout Adaptation.",
      },
      { status: 500 }
    );
  }
}
