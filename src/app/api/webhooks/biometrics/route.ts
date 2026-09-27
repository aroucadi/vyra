import { NextRequest, NextResponse } from "next/server";
import { appStore } from "@/lib/store";
import { calculateReadinessScore } from "@/lib/autoregulation";
import { telemetry } from "@/lib/telemetry";
import { InboundBiometricsPayload, WearableDeviceSource } from "@/lib/types";

// Fallback webhook secret for zero-friction development & iOS shortcut onboarding
const DEFAULT_WEBHOOK_SECRET = "vyra_biometrics_key_2026";

function isAuthorized(req: NextRequest, bodySecret?: string): boolean {
  const configuredSecret = process.env.BIOMETRICS_WEBHOOK_SECRET || DEFAULT_WEBHOOK_SECRET;

  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token === configuredSecret) return true;
  }

  const customHeader = req.headers.get("x-webhook-secret");
  if (customHeader && customHeader === configuredSecret) return true;

  if (bodySecret && bodySecret === configuredSecret) return true;

  return false;
}

export async function GET() {
  return NextResponse.json(
    {
      status: "ready",
      endpoint: "/api/webhooks/biometrics",
      supportedSources: ["apple_health", "whoop", "oura", "garmin", "manual"],
      version: "1.0.0",
      description: "Vyra Inbound Wearable Biometrics Aggregator Webhook",
      docs: "/specs/008-apple-health-biometric-webhook/spec.md",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body: InboundBiometricsPayload = await req.json();

    if (!isAuthorized(req, body.secretKey)) {
      return NextResponse.json(
        { error: "Unauthorized. Provide valid Bearer token or secretKey." },
        { status: 401 }
      );
    }

    const {
      traineeId,
      sleepHours,
      deepSleepMinutes,
      remSleepMinutes,
      hrvMs,
      restingHeartRateBpm,
      activeEnergyBurnedKcal,
      date,
      source = "apple_health",
    } = body;

    if (!traineeId || typeof sleepHours !== "number" || isNaN(sleepHours) || sleepHours < 0 || sleepHours > 24) {
      return NextResponse.json(
        {
          error: "Invalid payload: 'traineeId' (string) and 'sleepHours' (number between 0 and 24) are required.",
        },
        { status: 400 }
      );
    }

    // Determine target calendar date (YYYY-MM-DD)
    const targetDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : new Date().toISOString().split("T")[0];

    // Compute deterministic readiness score & CNS fatigue state
    const readiness = calculateReadinessScore({
      sleepHours,
      hrvMs,
      deepSleepMinutes,
      restingHeartRateBpm,
    });

    // Persist snapshot in Vyra memory / persistence store
    const snapshot = appStore.saveWearableBiometrics({
      traineeId,
      date: targetDate,
      source: (source as WearableDeviceSource) || "apple_health",
      sleepHours,
      deepSleepMinutes,
      remSleepMinutes,
      hrvMs,
      restingHeartRateBpm,
      activeEnergyBurnedKcal,
      readinessScore: readiness.score,
      cnsFatigueDetected: readiness.state !== "optimal",
    });

    // Record non-blocking telemetry for autoregulation activation
    telemetry.track("workout_recalibration_applied", {
      traineeId,
      readinessScore: readiness.score,
      readinessState: readiness.state,
      sleepHours,
      hrvMs,
      deepSleepMinutes,
      source: snapshot.source,
      date: targetDate,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Biometrics snapshot ingested and autoregulation computed successfully.",
        snapshot,
        autoregulation: {
          score: readiness.score,
          state: readiness.state,
          cnsFatigueDetected: readiness.state !== "optimal",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Malformed JSON or server error processing webhook payload.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}
