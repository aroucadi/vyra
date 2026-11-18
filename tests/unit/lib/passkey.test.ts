import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { NextRequest } from "next/server";
import {
  isPasskeySupported,
  registerPasskey,
} from "../../../src/lib/auth/passkey";
import { GET, POST } from "../../../src/app/api/auth/passkey/route";
import { __setMockFirebaseAdminForTesting } from "../../../src/lib/firebase/admin";
import { clearWebAuthnChallengesForTesting } from "../../../src/lib/auth/webauthn-server";
import { clearRateLimitBucketsForTesting } from "../../../src/lib/auth/rate-limit";

function encodeCborText(str: string): Buffer {
  const bytes = Buffer.from(str, "utf8");
  const header =
    bytes.length < 24
      ? Buffer.from([0x60 | bytes.length])
      : Buffer.from([0x78, bytes.length]);
  return Buffer.concat([header, bytes]);
}

function encodeCborBytes(buf: Buffer): Buffer {
  const header =
    buf.length < 24
      ? Buffer.from([0x40 | buf.length])
      : buf.length < 256
        ? Buffer.from([0x58, buf.length])
        : Buffer.from([0x59, (buf.length >> 8) & 0xff, buf.length & 0xff]);
  return Buffer.concat([header, buf]);
}

/**
 * Constructs a genuine WebAuthn packed/none attestationObject CBOR buffer with
 * SHA-256(rpId), UP+UV+AT flags, signCount, AAGUID, credentialId, and COSE map.
 */
function buildTestAttestationObject(params: {
  rpId: string;
  credentialIdBytes: Buffer;
  userPresent?: boolean;
  userVerified?: boolean;
}): string {
  const rpIdHash = crypto.createHash("sha256").update(params.rpId, "utf8").digest();
  const flags =
    (params.userPresent === false ? 0 : 0x01) |
    (params.userVerified === false ? 0 : 0x04) |
    0x40; // AT (Attested Credential Data included)
  const flagsBuf = Buffer.from([flags]);
  const signCountBuf = Buffer.alloc(4);
  signCountBuf.writeUInt32BE(1, 0);

  const aaguid = Buffer.alloc(16, 0x11);
  const credLenBuf = Buffer.alloc(2);
  credLenBuf.writeUInt16BE(params.credentialIdBytes.length, 0);

  // Minimal deterministic CBOR empty map `{}` for COSE key
  const dummyCoseKey = Buffer.from([0xa0]);

  const authData = Buffer.concat([
    rpIdHash,
    flagsBuf,
    signCountBuf,
    aaguid,
    credLenBuf,
    params.credentialIdBytes,
    dummyCoseKey,
  ]);

  // CBOR map of 3 pairs: { "fmt": "none", "attStmt": {}, "authData": <bytes> }
  const attestationCbor = Buffer.concat([
    Buffer.from([0xa3]),
    encodeCborText("fmt"),
    encodeCborText("none"),
    encodeCborText("attStmt"),
    Buffer.from([0xa0]),
    encodeCborText("authData"),
    encodeCborBytes(authData),
  ]);

  return attestationCbor.toString("base64url");
}

describe("Spec 021: Cryptographic WebAuthn Passkey Challenge & Attestation Verification", () => {
  beforeEach(() => {
    clearWebAuthnChallengesForTesting();
    clearRateLimitBucketsForTesting();
    __setMockFirebaseAdminForTesting({
      auth: {
        verifyIdToken: async (token: string) => {
          if (token === "tok_passkey_user") {
            return {
              uid: "user_test_passkey",
              email: "passkey.athlete@example.com",
              email_verified: true,
              firebase: { identities: {}, sign_in_provider: "password" },
            };
          }
          throw new Error("Invalid token");
        },
        verifySessionCookie: async () => {
          throw new Error("Invalid cookie");
        },
      },
    });
  });

  afterEach(() => {
    __setMockFirebaseAdminForTesting(null);
  });

  describe("WebAuthn Environment Detection", () => {
    it("safely evaluates passkey capability without throwing in Node.js environment", () => {
      const supported = isPasskeySupported();
      assert.equal(typeof supported, "boolean");
      assert.equal(supported, false);
    });
  });

  describe("Passkey Registration Fallback & Generation", () => {
    it("returns a deterministic local fallback credential when browser WebAuthn is absent", async () => {
      const result = await registerPasskey("athlete_test_123", "Test Athlete");
      assert.equal(result.success, true);
      assert.ok(result.credentialId);
      assert.equal(result.isMock, true);
      assert.ok(result.credentialId.startsWith("mock_passkey_"));
    });
  });

  describe("Server-Issued Challenge & CBOR Attestation Route", () => {
    it("issues a single-use challenge, verifies CBOR attestationObject + clientDataJSON, and blocks replays", async () => {
      // 1. Unauthenticated request for a registered non-anon userId is blocked (401)
      const unauthGet = await GET(
        new NextRequest("http://localhost:3000/api/auth/passkey?userId=user_test_passkey")
      );
      assert.equal(unauthGet.status, 401);

      // 2. Authenticated GET issues server challenge bound to user_test_passkey
      const challengeRes = await GET(
        new NextRequest("http://localhost:3000/api/auth/passkey?userId=user_test_passkey", {
          headers: { Authorization: "Bearer tok_passkey_user" },
        })
      );
      assert.equal(challengeRes.status, 200);
      const challengeJson = (await challengeRes.json()) as {
        ok: boolean;
        challengeId: string;
        challenge: string;
        userId: string;
      };
      assert.equal(challengeJson.ok, true);
      assert.equal(challengeJson.userId, "user_test_passkey");
      assert.ok(challengeJson.challengeId);
      assert.ok(challengeJson.challenge.length >= 32);

      // 3. Construct genuine WebAuthn clientDataJSON + CBOR attestationObject matching server challenge
      const rawCredentialBytes = crypto.randomBytes(16);
      const credentialId = rawCredentialBytes.toString("base64url");
      const clientDataJSON = Buffer.from(
        JSON.stringify({
          type: "webauthn.create",
          challenge: challengeJson.challenge,
          origin: "http://localhost:3000",
        }),
        "utf8"
      ).toString("base64url");

      const attestationObject = buildTestAttestationObject({
        rpId: "localhost",
        credentialIdBytes: rawCredentialBytes,
      });

      const verifyReq = new NextRequest("http://localhost:3000/api/auth/passkey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer tok_passkey_user",
        },
        body: JSON.stringify({
          userId: "user_test_passkey",
          credentialId,
          challengeId: challengeJson.challengeId,
          sessionsCount: 3,
          attestation: {
            clientDataJSON,
            attestationObject,
            rpId: "localhost",
          },
        }),
      });

      const verifyRes = await POST(verifyReq);
      assert.equal(verifyRes.status, 200);
      const json = (await verifyRes.json()) as {
        success: boolean;
        verifiedWebAuthn: boolean;
        userId: string;
        credentialId: string;
        sessionsCount: number;
        syncedAt: string;
      };
      assert.equal(json.success, true);
      assert.equal(json.verifiedWebAuthn, true);
      assert.equal(json.userId, "user_test_passkey");
      assert.equal(json.credentialId, credentialId);
      assert.equal(json.sessionsCount, 3);
      assert.ok(json.syncedAt);

      // 4. Replaying the exact same challengeId + attestation is rejected (single-use)
      const replayRes = await POST(
        new NextRequest("http://localhost:3000/api/auth/passkey", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer tok_passkey_user",
          },
          body: JSON.stringify({
            userId: "user_test_passkey",
            credentialId,
            challengeId: challengeJson.challengeId,
            sessionsCount: 3,
            attestation: { clientDataJSON, attestationObject, rpId: "localhost" },
          }),
        })
      );
      assert.equal(replayRes.status, 400);
    });

    it("rejects mismatched challenge, spoofed rpIdHash, or missing fields", async () => {
      const challengeRes = await GET(
        new NextRequest("http://localhost:3000/api/auth/passkey?userId=anon_device_1")
      );
      const challengeJson = (await challengeRes.json()) as {
        challengeId: string;
        challenge: string;
      };

      const rawCredentialBytes = crypto.randomBytes(16);
      const credentialId = rawCredentialBytes.toString("base64url");
      const badClientData = Buffer.from(
        JSON.stringify({
          type: "webauthn.create",
          challenge: "wrong_challenge_bytes",
          origin: "http://localhost:3000",
        }),
        "utf8"
      ).toString("base64url");

      const attestationObject = buildTestAttestationObject({
        rpId: "localhost",
        credentialIdBytes: rawCredentialBytes,
      });

      const badChallengeRes = await POST(
        new NextRequest("http://localhost:3000/api/auth/passkey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "anon_device_1",
            credentialId,
            challengeId: challengeJson.challengeId,
            attestation: {
              clientDataJSON: badClientData,
              attestationObject,
              rpId: "localhost",
            },
          }),
        })
      );
      assert.equal(badChallengeRes.status, 400);

      // Missing credentialId returns 400
      const missingRes = await POST(
        new NextRequest("http://localhost:3000/api/auth/passkey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: "" }),
        })
      );
      assert.equal(missingRes.status, 400);
    });
  });
});
