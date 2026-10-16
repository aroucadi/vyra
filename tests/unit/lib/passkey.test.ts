import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isPasskeySupported,
  registerPasskey,
  hasSavedPasskey,
  setSavedPasskey,
  syncLocalDataToCloud,
} from "../../../src/lib/auth/passkey";
import { POST } from "../../../src/app/api/auth/passkey/route";
import { NextRequest } from "next/server";

describe("Spec 021: Post-Session 1 Passkey Registration & Cloud Sync", () => {
  describe("WebAuthn Environment Detection", () => {
    it("safely evaluates passkey capability without throwing in Node.js environment", () => {
      const supported = isPasskeySupported();
      assert.equal(typeof supported, "boolean");
      assert.equal(supported, false); // in Node.js, window.PublicKeyCredential is not available
    });
  });

  describe("Passkey Registration Fallback & Generation", () => {
    it("returns a deterministic mock passkey credential in headless test environment", async () => {
      const result = await registerPasskey("athlete_test_123", "Test Athlete");
      assert.equal(result.success, true);
      assert.ok(result.credentialId);
      assert.equal(result.isMock, true);
      assert.ok(result.credentialId.startsWith("mock_passkey_"));
    });
  });

  describe("Cloud Sync Handoff API Route", () => {
    it("accepts valid passkey payload and confirms cloud transition", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_test_passkey",
          credentialId: "cred_abc_123",
          sessionsCount: 3,
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.userId, "user_test_passkey");
      assert.equal(json.credentialId, "cred_abc_123");
      assert.equal(json.sessionsCount, 3);
      assert.ok(json.syncedAt);
    });

    it("rejects request if userId or credentialId is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "",
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.ok(json.error);
    });
  });
});
