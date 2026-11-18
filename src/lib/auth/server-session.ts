import type { DecodedIdToken } from "firebase-admin/auth";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export const ALAA_CANONICAL_EMAIL = "alaaeddineroucadi@gmail.com";
export const ALAA_CANONICAL_UID = "trainee_alaa";
export const SESSION_COOKIE_NAME = "__vyra_session";
export const SESSION_COOKIE_MAX_AGE_SECONDS = 14 * 24 * 60 * 60; // 14 days

export class AlaaEmailUnverifiedError extends Error {
  readonly code = "ALAA_EMAIL_UNVERIFIED";
  constructor() {
    super(
      "Please verify your email address (check your inbox for the verification link) before unlocking the pre-seeded profile."
    );
    this.name = "AlaaEmailUnverifiedError";
  }
}

export interface VerifiedAppSession {
  uid: string;
  firebaseUid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  signInProvider?: string;
  isAlaa: boolean;
}

/**
 * Resolves the canonical VYRA tenant UID from a verified Firebase token.
 *
 * Security Invariant:
 * - ONLY a verified token matching `alaaeddineroucadi@gmail.com` maps to `trainee_alaa`.
 * - Unverified password signups claiming `alaaeddineroucadi@gmail.com` are rejected
 *   (`AlaaEmailUnverifiedError`) so nobody can squat/spoof the pre-seeded profile.
 * - All other users resolve exclusively to their own isolated Firebase `uid`.
 */
export function resolveCanonicalUserIdFromDecodedToken(
  decoded: Pick<DecodedIdToken, "uid" | "email" | "email_verified" | "firebase">
): string {
  const normalizedEmail = (decoded.email || "").trim().toLowerCase();
  if (normalizedEmail === ALAA_CANONICAL_EMAIL) {
    const provider = decoded.firebase?.sign_in_provider;
    const isVerified = decoded.email_verified === true || provider === "google.com";
    if (!isVerified) {
      throw new AlaaEmailUnverifiedError();
    }
    return ALAA_CANONICAL_UID;
  }

  return decoded.uid;
}

function parseCookieHeader(cookieHeader: string | null | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

export async function getAuthenticatedSession(req?: Request): Promise<VerifiedAppSession | null> {
  try {
    let bearerToken: string | null = null;
    let sessionCookie: string | null = null;

    if (req) {
      const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        bearerToken = authHeader.slice(7).trim();
      }
      const cookiesMap = parseCookieHeader(req.headers.get("cookie"));
      if (cookiesMap[SESSION_COOKIE_NAME]) {
        sessionCookie = cookiesMap[SESSION_COOKIE_NAME];
      }
    } else {
      try {
        const { cookies } = await import("next/headers");
        const store = await cookies();
        sessionCookie = store.get(SESSION_COOKIE_NAME)?.value || null;
      } catch {
        // Outside Next.js request context
      }
    }

    const auth = getFirebaseAdminAuth();
    let decoded: DecodedIdToken | null = null;

    if (bearerToken) {
      decoded = await auth.verifyIdToken(bearerToken, false);
    } else if (sessionCookie) {
      try {
        decoded = await auth.verifySessionCookie(sessionCookie, false);
      } catch {
        // Support fallback verification if cookie stores raw ID token in environments
        // where createSessionCookie wasn't permitted.
        decoded = await auth.verifyIdToken(sessionCookie, false);
      }
    }

    if (!decoded) return null;

    const uid = resolveCanonicalUserIdFromDecodedToken(decoded);
    return {
      uid,
      firebaseUid: decoded.uid,
      email: (decoded.email || "").trim().toLowerCase(),
      emailVerified: decoded.email_verified === true,
      name: typeof decoded.name === "string" ? decoded.name : undefined,
      signInProvider: decoded.firebase?.sign_in_provider,
      isAlaa: uid === ALAA_CANONICAL_UID,
    };
  } catch {
    return null;
  }
}

export interface RouteTenantResolution {
  session: VerifiedAppSession | null;
  effectiveTraineeId: string;
  isAllowed: boolean;
  statusCode?: 401 | 403;
  error?: string;
}

export function isAnonymousTraineeId(id: string | null | undefined): boolean {
  const cleaned = (id || "").trim();
  if (!cleaned || cleaned === "anonymous") return true;
  return /^anon_[a-zA-Z0-9_-]{1,64}$/.test(cleaned);
}

/**
 * Resolves the tenant scope for server API routes cleanly while protecting `trainee_alaa`
 * and all registered Firebase accounts:
 * - Authenticated users are strictly locked to `session.uid` (`trainee_alaa` only when verified as `alaaeddineroucadi@gmail.com`).
 * - Unauthenticated requests may only operate on ephemeral `anon_*` IDs (when `allowUnauthenticatedAnon: true`);
 *   targeting `trainee_alaa` or any non-anonymous UID returns 401.
 */
export async function resolveRouteTenantContext(
  req: Request,
  requestedTraineeId?: string | null,
  options?: { allowUnauthenticatedAnon?: boolean; fallbackTraineeId?: string }
): Promise<RouteTenantResolution> {
  const session = await getAuthenticatedSession(req);
  const cleanedRequested = requestedTraineeId ? requestedTraineeId.trim() : "";

  if (session) {
    if (
      cleanedRequested &&
      cleanedRequested !== session.uid &&
      !(session.isAlaa && (cleanedRequested === "trainee_alaa" || cleanedRequested === "trainer_alaa"))
    ) {
      return {
        session,
        effectiveTraineeId: session.uid,
        isAllowed: false,
        statusCode: 403,
        error: "Forbidden: Cross-tenant traineeId access is not permitted.",
      };
    }

    return {
      session,
      effectiveTraineeId: cleanedRequested || session.uid,
      isAllowed: true,
    };
  }

  // Unauthenticated callers cannot target Alaa or any registered non-anonymous UID
  if (cleanedRequested && !isAnonymousTraineeId(cleanedRequested)) {
    return {
      session: null,
      effectiveTraineeId: options?.fallbackTraineeId || "anon_visitor",
      isAllowed: false,
      statusCode: 401,
      error: "Authentication required to access registered account data.",
    };
  }

  if (options?.allowUnauthenticatedAnon) {
    return {
      session: null,
      effectiveTraineeId: cleanedRequested || options.fallbackTraineeId || "anon_visitor",
      isAllowed: true,
    };
  }

  return {
    session: null,
    effectiveTraineeId: cleanedRequested || options?.fallbackTraineeId || "anon_visitor",
    isAllowed: false,
    statusCode: 401,
    error: "Authentication required.",
  };
}
