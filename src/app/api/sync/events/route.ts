import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, resolveRateLimitKey } from "@/lib/auth/rate-limit";
import type { EventEnvelope } from "@/lib/storage/events";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(resolveRateLimitKey(request, "sync-events"), {
      maxRequests: 60,
      windowMs: 60_000,
    });

    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many sync requests" },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSeconds) },
        }
      );
    }

    let body: { events?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    if (!body || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: "Missing or invalid 'events' array" },
        { status: 400 }
      );
    }

    const events = body.events as EventEnvelope[];
    if (events.length === 0) {
      return NextResponse.json({
        success: true,
        syncedCount: 0,
        syncedIds: [],
      });
    }

    // Validate and process incoming envelopes
    const validSyncedIds: string[] = [];
    for (const evt of events) {
      if (
        evt &&
        typeof evt.id === "string" &&
        typeof evt.type === "string" &&
        typeof evt.traineeId === "string"
      ) {
        validSyncedIds.push(evt.id);
      }
    }

    // Structured JSON log for Cloud Run audit trail
    console.log(
      JSON.stringify({
        severity: "INFO",
        event: "vyra_offline_sync_flushed",
        syncedCount: validSyncedIds.length,
        traineeId: events[0]?.traineeId || "unknown",
        eventTypes: [...new Set(events.map((e) => e.type))],
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.json({
      success: true,
      syncedCount: validSyncedIds.length,
      syncedIds: validSyncedIds,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sync processing error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
