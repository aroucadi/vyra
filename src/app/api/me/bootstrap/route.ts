import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import {
  ensureFirestoreCoachBridgeRegistered,
  loadBootstrapForUser,
} from "@/lib/firebase/firestore-repository";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session) {
      return NextResponse.json(
        {
          ok: true,
          authenticated: false,
          isAlaa: false,
          bootstrap: null,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    ensureFirestoreCoachBridgeRegistered();

    const bootstrap = await loadBootstrapForUser({
      uid: session.uid,
      email: session.email,
      displayName: session.name,
    });

    return NextResponse.json(
      {
        ok: true,
        authenticated: true,
        isAlaa: session.isAlaa,
        bootstrap,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bootstrap failed";
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
