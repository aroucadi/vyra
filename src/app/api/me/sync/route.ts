import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import {
  ensureFirestoreCoachBridgeRegistered,
  saveUserSyncBatch,
  UserSyncBatchInput,
} from "@/lib/firebase/firestore-repository";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to sync cloud vault." },
        { status: 401 }
      );
    }

    ensureFirestoreCoachBridgeRegistered();

    const body = (await req.json().catch(() => ({}))) as UserSyncBatchInput;
    const { writtenDocs } = await saveUserSyncBatch(session.uid, body);

    return NextResponse.json(
      {
        ok: true,
        uid: session.uid,
        writtenDocs,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Cloud sync failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
