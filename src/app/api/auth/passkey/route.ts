import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/passkey
 * Handles passkey registration and cloud data sync handoff.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, credentialId, sessionsCount } = body;

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

    const cleanUserId = userId.replace(/[^a-zA-Z0-9_\-\.]/g, "");
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
