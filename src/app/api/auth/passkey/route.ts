import { NextRequest, NextResponse } from "next/server";
import { resolveRouteTenantContext } from "@/lib/auth/server-session";
import { checkDistributedRateLimit, resolveRateLimitKey } from "@/lib/auth/rate-limit";
import {
  consumeWebAuthnChallenge,
  issueWebAuthnChallenge,
  PasskeyAttestationPayload,
  saveVerifiedPasskeyToFirestore,
  verifyPasskeyRegistrationResponse,
} from "@/lib/auth/webauthn-server";

/**
 * GET /api/auth/passkey?userId=<uid>
 * Issues a single-use cryptographic WebAuthn challenge bound to the caller's tenant identity.
 */
export async function GET(req: NextRequest) {
  try {
    const requestedUserId = req.nextUrl.searchParams.get("userId");
    const rl = await checkDistributedRateLimit(
      resolveRateLimitKey(req, "auth-passkey-challenge", requestedUserId || undefined),
      { maxRequests: 30, windowMs: 60_000 }
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many passkey challenge requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const tenant = await resolveRouteTenantContext(req, requestedUserId, {
      allowUnauthenticatedAnon: true,
    });
    if (!tenant.isAllowed) {
      return NextResponse.json(
        { error: tenant.error || "Unauthorized" },
        { status: tenant.statusCode || 401 }
      );
    }

    const cleanUserId = tenant.effectiveTraineeId.replace(/[^a-zA-Z0-9_\-\.]/g, "");
    const issued = await issueWebAuthnChallenge(cleanUserId);

    return NextResponse.json({
      ok: true,
      userId: cleanUserId,
      challengeId: issued.challengeId,
      challenge: issued.challenge,
      expiresAtMs: issued.expiresAtMs,
      rp: { name: "Vyra Performance Engine" },
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/auth/passkey
 * Verifies a server-issued WebAuthn challenge + CBOR attestationObject & clientDataJSON,
 * persists the verified passkey credential in Firestore, and returns cloud sync status.
 */
export async function POST(req: NextRequest) {
  try {
    const rl = await checkDistributedRateLimit(resolveRateLimitKey(req, "auth-passkey"), {
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
      challengeId?: unknown;
      attestation?: unknown;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }
    const { userId, credentialId, sessionsCount, challengeId, attestation } = body || {};

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

    if (typeof challengeId !== "string" || !challengeId) {
      return NextResponse.json(
        { error: "Server-issued WebAuthn challengeId is required." },
        { status: 400 }
      );
    }

    const challengeCheck = await consumeWebAuthnChallenge(challengeId, cleanUserId);
    if (!challengeCheck.ok) {
      return NextResponse.json(
        { error: challengeCheck.error },
        { status: challengeCheck.status }
      );
    }

    const attestationPayload = attestation as PasskeyAttestationPayload | undefined;
    const verification = verifyPasskeyRegistrationResponse({
      expectedChallenge: challengeCheck.challenge,
      expectedOriginHost: req.nextUrl.hostname || undefined,
      expectedCredentialId: cleanCredentialId,
      attestation: attestationPayload as PasskeyAttestationPayload,
    });

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || "WebAuthn cryptographic verification failed." },
        { status: 400 }
      );
    }

    const syncedAt = new Date().toISOString();
    const persistedFirestore = await saveVerifiedPasskeyToFirestore({
      userId: cleanUserId,
      credentialId: verification.credentialId || cleanCredentialId,
      rpId: verification.rpId || req.nextUrl.hostname || "app.vyra.fit",
      origin: verification.origin || req.nextUrl.origin,
      attestationFormat: verification.attestationFormat || "none",
      signCount: verification.signCount ?? 0,
      userVerified: Boolean(verification.userVerified),
      cosePublicKeyHex: verification.cosePublicKeyHex,
      spkiPublicKey: verification.spkiPublicKey,
      sessionsCount: safeSessionsCount,
      syncedAt,
    });

    return NextResponse.json({
      success: true,
      verifiedWebAuthn: true,
      persistedFirestore,
      syncedAt,
      userId: cleanUserId,
      credentialId: verification.credentialId || cleanCredentialId,
      attestationFormat: verification.attestationFormat,
      userVerified: Boolean(verification.userVerified),
      sessionsCount: safeSessionsCount,
      message: "WebAuthn passkey verified and registered. Cloud vault anchored.",
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
