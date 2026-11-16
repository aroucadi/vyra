import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import {
  AlaaEmailUnverifiedError,
  ALAA_CANONICAL_UID,
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  getAuthenticatedSession,
  resolveCanonicalUserIdFromDecodedToken,
} from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

function isSecureRequest(req: NextRequest): boolean {
  const proto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol;
  return proto.startsWith("https") || process.env.NODE_ENV === "production";
}

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json(
      { authenticated: false, uid: null, email: null, isAlaa: false },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      uid: session.uid,
      firebaseUid: session.firebaseUid,
      email: session.email,
      emailVerified: session.emailVerified,
      name: session.name,
      isAlaa: session.isAlaa,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { idToken?: string };
    const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";

    if (!idToken) {
      return NextResponse.json(
        { ok: false, error: "Firebase ID token is required." },
        { status: 400 }
      );
    }

    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(idToken, true);
    const uid = resolveCanonicalUserIdFromDecodedToken(decoded);
    const email = (decoded.email || "").trim().toLowerCase();

    const expiresInMs = SESSION_COOKIE_MAX_AGE_SECONDS * 1000;
    let cookieValue = idToken;
    try {
      cookieValue = await auth.createSessionCookie(idToken, { expiresIn: expiresInMs });
    } catch {
      // Fallback to verified ID token if session cookie minting is unavailable in local/test env
    }

    const res = NextResponse.json(
      {
        ok: true,
        uid,
        firebaseUid: decoded.uid,
        email,
        emailVerified: decoded.email_verified === true,
        isAlaa: uid === ALAA_CANONICAL_UID,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );

    res.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: isSecureRequest(req),
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    });

    return res;
  } catch (err: unknown) {
    if (err instanceof AlaaEmailUnverifiedError) {
      return NextResponse.json(
        { ok: false, code: err.code, error: err.message },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : "Failed to verify authentication token.";
    return NextResponse.json({ ok: false, error: msg }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json(
    { ok: true, authenticated: false },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );

  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
