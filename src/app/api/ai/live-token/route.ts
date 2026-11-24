import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import { checkRateLimit, resolveRateLimitKey } from "@/lib/auth/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(resolveRateLimitKey(req, "live-token"), {
      maxRequests: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many token requests. Please wait." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const session = await getAuthenticatedSession(req);
    const apiKey = process.env.GEMINI_API_KEY || "";

    // Return the configuration for Gemini 3.8 Live WebSocket session
    return NextResponse.json({
      ok: true,
      model: "gemini-3.8-live",
      endpoint: "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent",
      hasServerKey: Boolean(apiKey),
      authenticated: Boolean(session),
      traineeId: session?.uid || "anon_trainee",
      audioConfig: {
        inputFormat: "audio/pcm;rate=16000",
        outputFormat: "audio/pcm;rate=24000",
        inputSampleRate: 16000,
        outputSampleRate: 24000,
      },
      instructions: "You are Vyra's live athletic voice coach in the lifter's ear during rest intervals. Keep replies brief, punchy, and under 25 words. Acknowledge logged sets immediately, enforce correct RIR, and offer one sharp technical cue for the next set.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to provision Live session";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
