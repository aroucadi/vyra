import { NextRequest, NextResponse } from "next/server";
import { EventEnvelope } from "@/lib/storage/events";
import { resolveRouteTenantContext } from "@/lib/auth/server-session";
import {
  ensureFirestoreCoachBridgeRegistered,
  saveAthleticEventsToFirestore,
} from "@/lib/firebase/firestore-repository";

export const dynamic = "force-dynamic";

interface SyncEventsRequestBody {
  traineeId: string;
  events: EventEnvelope[];
}

export async function POST(req: NextRequest) {
  try {
    const body: SyncEventsRequestBody = await req.json();
    const { traineeId, events } = body;

    if (!traineeId || typeof traineeId !== "string" || !Array.isArray(events)) {
      return NextResponse.json(
        { error: "Invalid payload: traineeId and events array required" },
        { status: 400 }
      );
    }

    const tenant = await resolveRouteTenantContext(req, traineeId, {
      allowUnauthenticatedAnon: true,
    });
    if (!tenant.isAllowed) {
      return NextResponse.json(
        { error: tenant.error || "Unauthorized" },
        { status: tenant.statusCode || 401 }
      );
    }

    const effectiveTraineeId = tenant.effectiveTraineeId;

    // Limit batch size to 250 events per request to protect memory & prevent DoS
    const boundedEvents = events.slice(0, 250);
    const validEventIds: string[] = [];
    const validEvents: EventEnvelope[] = [];
    const debriefSummaries: Array<{
      sessionId: string;
      gymName?: string;
      totalVolumeKg: number;
      prCount: number;
      durationMin: number;
    }> = [];

    for (const evt of boundedEvents) {
      if (!evt || typeof evt !== "object" || !evt.id || !evt.type) continue;

      // Clean string IDs and sanitize
      const cleanId = String(evt.id).slice(0, 128);
      validEventIds.push(cleanId);
      validEvents.push({
        ...evt,
        id: cleanId,
        traineeId: effectiveTraineeId,
      });

      // Asymmetric Coach Debrief dispatch trigger:
      // When a completed workout arrives, synthesize the 3-bullet debrief
      if (evt.type === "WORKOUT_COMPLETED" && evt.payload) {
        const p = evt.payload;
        debriefSummaries.push({
          sessionId: p.sessionId || cleanId,
          gymName: p.gymName || "Gym Floor",
          totalVolumeKg: Number(p.totalVolumeKg) || 0,
          prCount: Number(p.prCount) || 0,
          durationMin: Math.round((Number(p.durationSec) || 0) / 60),
        });
      }
    }

    let persistedToFirestore = false;
    if (tenant.session && validEvents.length > 0) {
      ensureFirestoreCoachBridgeRegistered();
      await saveAthleticEventsToFirestore(effectiveTraineeId, validEvents).catch(() => {});
      persistedToFirestore = true;
    }

    // Structured JSON log line for Google Cloud Logging & Stackdriver automated collection
    const logEntry = {
      severity: "INFO",
      message: `[FlightRecorder] Ingested ${validEventIds.length} athletic events for athlete ${effectiveTraineeId}`,
      traineeId: effectiveTraineeId,
      syncedCount: validEventIds.length,
      persistedToFirestore,
      eventIds: validEventIds,
      debriefCount: debriefSummaries.length,
      debriefs: debriefSummaries,
      timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(logEntry));

    return NextResponse.json({
      success: true,
      traineeId: effectiveTraineeId,
      syncedCount: validEventIds.length,
      syncedEventIds: validEventIds,
      persistedToFirestore,
      debriefDispatched: debriefSummaries.length > 0,
      debriefSummaries,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync processing error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
