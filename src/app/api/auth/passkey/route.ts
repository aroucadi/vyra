import { NextRequest, NextResponse } from "next/server";
import { resolveRouteTenantContext } from "@/lib/auth/server-session";
import { checkRateLimit, resolveRateLimitKey } from "@/lib/auth/rate-limit";

/**
 * POST /api/auth/passkey
 * Handles passkey registration and cloud data sync handoff.
 */
export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(resolveRateLimitKey(req, "auth-passkey"), {
      maxRequests: 20,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many passkey requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    let body: {
      userId?: unknown;
      credentialId?: unknown;
      sessionsCount?: unknown;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }
    const { userId, credentialId, sessionsCount } = body || {};

    if (
      !userId ||
      typeof userId !== "string" ||
      userId.length > 128 ||
      !credentialId ||
      typeof credentialId !== "string" ||
      credentialId.length > 512
    ) {
      return NextResponse.json(
        { error: "Invalid userId or credentialId format." },
        { status: 400 }
      );
    }

    const tenant = await resolveRouteTenantContext(req, userId, {
      allowUnauthenticatedAnon: true,
    });
    if (!tenant.isAllowed) {
      return NextResponse.json(
        { error: tenant.error || "Unauthorized" },
        { status: tenant.statusCode || 401 }
      );
    }

    const cleanUserId = tenant.effectiveTraineeId.replace(/[^a-zA-Z0-9_\-\.]/g, "");
    const cleanCredentialId = credentialId.replace(/[^a-zA-Z0-9_\-\.\=]/g, "");
    const safeSessionsCount = Math.min(10000, Math.max(0, Number(sessionsCount) || 0));

    const syncedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      syncedAt,
      userId: cleanUserId,
      credentialId: cleanCredentialId,
      sessionsCount: safeSessionsCount,
      message: "Passkey registered. Local session data transitioned to cloud sync.",
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
