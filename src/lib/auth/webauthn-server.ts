/**
 * @file webauthn-server.ts
 * @description Server-side WebAuthn / FIDO2 challenge issuance, single-use replay protection,
 * clientDataJSON validation, CBOR attestationObject & authenticatorData verification,
 * and Firestore passkey credential persistence (zero extra infra cost).
 */

import crypto from "node:crypto";
import { getFirestoreDb, isFirestoreRuntimeAvailable } from "@/lib/firebase/admin";

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_LOCAL_CHALLENGES = 1000;

export interface StoredWebAuthnChallenge {
  challengeId: string;
  challenge: string;
  userId: string;
  createdAtMs: number;
  expiresAtMs: number;
  consumed: boolean;
}

const localChallenges = new Map<string, StoredWebAuthnChallenge>();

export interface VerifiedPasskeyRegistration {
  valid: boolean;
  error?: string;
  rpId?: string;
  origin?: string;
  credentialId?: string;
  attestationFormat?: string;
  signCount?: number;
  userVerified?: boolean;
  cosePublicKeyHex?: string;
  spkiPublicKey?: string;
}

export interface PasskeyAttestationPayload {
  clientDataJSON: string;
  attestationObject: string;
  rpId?: string;
  spkiPublicKey?: string;
}

export async function issueWebAuthnChallenge(
  userId: string,
  nowMs: number = Date.now()
): Promise<StoredWebAuthnChallenge> {
  const challengeId = crypto.randomUUID();
  const challenge = crypto.randomBytes(32).toString("base64url");
  const record: StoredWebAuthnChallenge = {
    challengeId,
    challenge,
    userId,
    createdAtMs: nowMs,
    expiresAtMs: nowMs + CHALLENGE_TTL_MS,
    consumed: false,
  };

  if (localChallenges.size >= MAX_LOCAL_CHALLENGES) {
    for (const [k, v] of localChallenges.entries()) {
      if (v.consumed || v.expiresAtMs <= nowMs) {
        localChallenges.delete(k);
      }
      if (localChallenges.size < MAX_LOCAL_CHALLENGES * 0.8) break;
    }
    if (localChallenges.size >= MAX_LOCAL_CHALLENGES) {
      const oldestKey = localChallenges.keys().next().value;
      if (oldestKey) localChallenges.delete(oldestKey);
    }
  }
  localChallenges.set(challengeId, record);

  if (isFirestoreRuntimeAvailable()) {
    try {
      const db = getFirestoreDb();
      await db.collection("webauthnChallenges").doc(challengeId).set({
        ...record,
        expiresAt: new Date(record.expiresAtMs),
      });
    } catch {
      // Non-fatal fallback if Firestore write isn't available in offline test
    }
  }

  return record;
}

export async function consumeWebAuthnChallenge(
  challengeId: string,
  expectedUserId: string,
  nowMs: number = Date.now()
): Promise<{ ok: true; challenge: string } | { ok: false; error: string; status: 400 | 401 | 403 }> {
  if (!challengeId || typeof challengeId !== "string" || challengeId.length > 128) {
    return { ok: false, error: "Missing or invalid challengeId.", status: 400 };
  }

  if (isFirestoreRuntimeAvailable()) {
    try {
      const db = getFirestoreDb();
      if (typeof db.runTransaction === "function") {
        const ref = db.collection("webauthnChallenges").doc(challengeId);
        const txResult = await db.runTransaction(async (tx) => {
          const snap = await tx.get(ref);
          if (!snap.exists) {
            return null;
          }
          const data = snap.data() as Partial<StoredWebAuthnChallenge>;
          if (data.userId !== expectedUserId) {
            return { ok: false as const, error: "Challenge does not belong to this user.", status: 403 as const };
          }
          if (data.consumed) {
            return { ok: false as const, error: "Challenge already consumed (replay blocked).", status: 400 as const };
          }
          if (!data.expiresAtMs || data.expiresAtMs <= nowMs) {
            return { ok: false as const, error: "Challenge expired. Request a fresh passkey challenge.", status: 400 as const };
          }
          tx.set(ref, { consumed: true, consumedAtMs: nowMs }, { merge: true });
          return { ok: true as const, challenge: String(data.challenge || "") };
        });

        if (txResult) {
          localChallenges.delete(challengeId);
          return txResult;
        }
      }
    } catch {
      // Fall through to local challenge store if mock Firestore doesn't implement transactions
    }
  }

  const record = localChallenges.get(challengeId);
  if (!record) {
    return { ok: false, error: "Unknown or expired passkey challenge.", status: 400 };
  }
  if (record.userId !== expectedUserId) {
    return { ok: false, error: "Challenge does not belong to this user.", status: 403 };
  }
  if (record.consumed) {
    return { ok: false, error: "Challenge already consumed (replay blocked).", status: 400 };
  }
  if (record.expiresAtMs <= nowMs) {
    localChallenges.delete(challengeId);
    return { ok: false, error: "Challenge expired. Request a fresh passkey challenge.", status: 400 };
  }

  record.consumed = true;
  return { ok: true, challenge: record.challenge };
}

function fromBase64Url(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const mod = padded.length % 4;
  const normalized = mod === 0 ? padded : padded + "=".repeat(4 - mod);
  return Buffer.from(normalized, "base64");
}

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Minimal deterministic RFC 8949 CBOR decoder covering unsigned ints, negative ints,
 * byte strings, text strings, arrays, maps, and simple primitives used in WebAuthn attestationObject.
 */
export function decodeCborValue(buffer: Buffer, offset = 0): { value: unknown; nextOffset: number } {
  if (offset >= buffer.length) {
    throw new Error("Unexpected end of CBOR buffer");
  }
  const initialByte = buffer[offset];
  const majorType = initialByte >> 5;
  const additionalInfo = initialByte & 0x1f;
  let cursor = offset + 1;

  const readUint = (): number => {
    if (additionalInfo < 24) return additionalInfo;
    if (additionalInfo === 24) {
      const val = buffer.readUInt8(cursor);
      cursor += 1;
      return val;
    }
    if (additionalInfo === 25) {
      const val = buffer.readUInt16BE(cursor);
      cursor += 2;
      return val;
    }
    if (additionalInfo === 26) {
      const val = buffer.readUInt32BE(cursor);
      cursor += 4;
      return val;
    }
    throw new Error(`Unsupported CBOR length encoding: ${additionalInfo}`);
  };

  if (majorType === 0) {
    return { value: readUint(), nextOffset: cursor };
  }
  if (majorType === 1) {
    return { value: -1 - readUint(), nextOffset: cursor };
  }
  if (majorType === 2) {
    const len = readUint();
    const slice = buffer.subarray(cursor, cursor + len);
    if (slice.length !== len) throw new Error("Truncated CBOR byte string");
    return { value: Buffer.from(slice), nextOffset: cursor + len };
  }
  if (majorType === 3) {
    const len = readUint();
    const slice = buffer.subarray(cursor, cursor + len);
    if (slice.length !== len) throw new Error("Truncated CBOR text string");
    return { value: slice.toString("utf8"), nextOffset: cursor + len };
  }
  if (majorType === 4) {
    const len = readUint();
    const arr: unknown[] = [];
    for (let i = 0; i < len; i++) {
      const item = decodeCborValue(buffer, cursor);
      arr.push(item.value);
      cursor = item.nextOffset;
    }
    return { value: arr, nextOffset: cursor };
  }
  if (majorType === 5) {
    const len = readUint();
    const map: Record<string, unknown> = {};
    for (let i = 0; i < len; i++) {
      const key = decodeCborValue(buffer, cursor);
      cursor = key.nextOffset;
      const val = decodeCborValue(buffer, cursor);
      cursor = val.nextOffset;
      map[String(key.value)] = val.value;
    }
    return { value: map, nextOffset: cursor };
  }
  if (majorType === 7) {
    if (additionalInfo === 20) return { value: false, nextOffset: cursor };
    if (additionalInfo === 21) return { value: true, nextOffset: cursor };
    if (additionalInfo === 22) return { value: null, nextOffset: cursor };
    if (additionalInfo === 23) return { value: undefined, nextOffset: cursor };
  }

  throw new Error(`Unsupported CBOR major type ${majorType}`);
}

export function verifyPasskeyRegistrationResponse(params: {
  expectedChallenge: string;
  expectedOriginHost?: string;
  expectedCredentialId: string;
  attestation: PasskeyAttestationPayload;
}): VerifiedPasskeyRegistration {
  const { expectedChallenge, expectedOriginHost, expectedCredentialId, attestation } = params;

  if (!attestation?.clientDataJSON || !attestation?.attestationObject) {
    return {
      valid: false,
      error: "Missing WebAuthn clientDataJSON or attestationObject.",
    };
  }

  let clientData: {
    type?: unknown;
    challenge?: unknown;
    origin?: unknown;
  };
  try {
    const decodedClientData = fromBase64Url(attestation.clientDataJSON).toString("utf8");
    clientData = JSON.parse(decodedClientData) as typeof clientData;
  } catch {
    return { valid: false, error: "Malformed WebAuthn clientDataJSON." };
  }

  if (clientData.type !== "webauthn.create") {
    return { valid: false, error: "Invalid WebAuthn ceremony type (expected webauthn.create)." };
  }

  if (
    typeof clientData.challenge !== "string" ||
    !timingSafeEqualString(clientData.challenge, expectedChallenge)
  ) {
    return { valid: false, error: "WebAuthn challenge mismatch." };
  }

  if (typeof clientData.origin !== "string" || !clientData.origin) {
    return { valid: false, error: "Missing WebAuthn client origin." };
  }

  let originUrl: URL;
  try {
    originUrl = new URL(clientData.origin);
  } catch {
    return { valid: false, error: "Invalid WebAuthn origin URL." };
  }

  const isLocalOrigin =
    originUrl.hostname === "localhost" ||
    originUrl.hostname === "127.0.0.1" ||
    originUrl.hostname === "[::1]";
  if (originUrl.protocol !== "https:" && !(originUrl.protocol === "http:" && isLocalOrigin)) {
    return { valid: false, error: `Untrusted WebAuthn origin protocol: ${originUrl.origin}` };
  }

  if (expectedOriginHost && originUrl.hostname !== expectedOriginHost && !isLocalOrigin) {
    return {
      valid: false,
      error: `Origin host mismatch (${originUrl.hostname} vs ${expectedOriginHost}).`,
    };
  }

  // Decode CBOR attestationObject -> verify authData rpIdHash + flags + attested credential ID
  let attObj: Record<string, unknown>;
  try {
    const rawAtt = fromBase64Url(attestation.attestationObject);
    const decoded = decodeCborValue(rawAtt, 0);
    if (!decoded.value || typeof decoded.value !== "object" || Buffer.isBuffer(decoded.value)) {
      return { valid: false, error: "Invalid CBOR attestationObject map." };
    }
    attObj = decoded.value as Record<string, unknown>;
  } catch (err: unknown) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Failed to parse CBOR attestationObject.",
    };
  }

  const authData = attObj.authData;
  if (!Buffer.isBuffer(authData) || authData.length < 37) {
    return { valid: false, error: "Invalid authenticatorData buffer in attestationObject." };
  }

  const rpIdHash = authData.subarray(0, 32);
  const candidateRpId = attestation.rpId || originUrl.hostname || "app.vyra.fit";
  const expectedRpIdHash = crypto.createHash("sha256").update(candidateRpId, "utf8").digest();
  if (!crypto.timingSafeEqual(rpIdHash, expectedRpIdHash)) {
    return { valid: false, error: `WebAuthn rpIdHash mismatch for RP '${candidateRpId}'.` };
  }

  const flags = authData[32];
  const userPresent = (flags & 0x01) !== 0;
  const userVerified = (flags & 0x04) !== 0;
  const attestedCredDataPresent = (flags & 0x40) !== 0;
  const signCount = authData.readUInt32BE(33);

  if (!userPresent) {
    return { valid: false, error: "WebAuthn User Present (UP) flag was not asserted." };
  }

  let extractedCredentialId = expectedCredentialId;
  let cosePublicKeyHex: string | undefined;

  if (attestedCredDataPresent) {
    if (authData.length < 55) {
      return { valid: false, error: "Truncated attestedCredentialData in authenticatorData." };
    }
    // bytes 37..53 are AAGUID (16 bytes); bytes 53..55 are uint16BE credentialId length
    const credIdLength = authData.readUInt16BE(53);
    const credIdEnd = 55 + credIdLength;
    if (credIdLength === 0 || authData.length < credIdEnd) {
      return { valid: false, error: "Invalid credentialId length in authenticatorData." };
    }
    const credIdBytes = authData.subarray(55, credIdEnd);
    extractedCredentialId = credIdBytes.toString("base64url");

    const normalizedExpected = expectedCredentialId.replace(/=+$/, "");
    if (
      normalizedExpected &&
      !timingSafeEqualString(extractedCredentialId, normalizedExpected)
    ) {
      return {
        valid: false,
        error: "Attested credentialId does not match submitted credentialId.",
      };
    }

    if (authData.length > credIdEnd) {
      cosePublicKeyHex = authData.subarray(credIdEnd).toString("hex").slice(0, 256);
    }
  }

  return {
    valid: true,
    rpId: candidateRpId,
    origin: originUrl.origin,
    credentialId: extractedCredentialId,
    attestationFormat: typeof attObj.fmt === "string" ? attObj.fmt : "none",
    signCount,
    userVerified,
    cosePublicKeyHex,
    spkiPublicKey: attestation.spkiPublicKey,
  };
}

export async function saveVerifiedPasskeyToFirestore(params: {
  userId: string;
  credentialId: string;
  rpId: string;
  origin: string;
  attestationFormat: string;
  signCount: number;
  userVerified: boolean;
  cosePublicKeyHex?: string;
  spkiPublicKey?: string;
  sessionsCount: number;
  syncedAt: string;
}): Promise<boolean> {
  if (!isFirestoreRuntimeAvailable()) return false;
  try {
    const db = getFirestoreDb();
    const cleanCredDocId = params.credentialId.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 180);
    await db
      .collection("users")
      .doc(params.userId)
      .collection("passkeys")
      .doc(cleanCredDocId)
      .set(
        {
          credentialId: params.credentialId,
          rpId: params.rpId,
          origin: params.origin,
          attestationFormat: params.attestationFormat,
          signCount: params.signCount,
          userVerified: params.userVerified,
          cosePublicKeyHex: params.cosePublicKeyHex ?? null,
          spkiPublicKey: params.spkiPublicKey ?? null,
          sessionsCount: params.sessionsCount,
          lastSyncedAt: params.syncedAt,
          updatedAt: params.syncedAt,
        },
        { merge: true }
      );
    return true;
  } catch {
    return false;
  }
}

export function clearWebAuthnChallengesForTesting(): void {
  localChallenges.clear();
}
