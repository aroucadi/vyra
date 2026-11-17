import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import { checkRateLimit, resolveRateLimitKey } from "@/lib/auth/rate-limit";
import {
  ensureFirestoreCoachBridgeRegistered,
  saveUserSyncBatch,
  UserSyncBatchInput,
} from "@/lib/firebase/firestore-repository";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(resolveRateLimitKey(req, "me-sync"), {
      maxRequests: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many sync requests. Please retry shortly." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const session = await getAuthenticatedSession(req);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to sync cloud vault." },
        { status: 401 }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return NextResponse.json(
        { ok: false, error: "Sync payload must be a JSON object." },
        { status: 400 }
      );
    }

    ensureFirestoreCoachBridgeRegistered();

    const { writtenDocs } = await saveUserSyncBatch(
      session.uid,
      rawBody as UserSyncBatchInput
    );

    return NextResponse.json(
      {
        ok: true,
        uid: session.uid,
        writtenDocs,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Cloud sync failed" }, { status: 500 });
  }
}
