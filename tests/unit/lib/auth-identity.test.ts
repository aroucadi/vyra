import test from "node:test";
import assert from "node:assert/strict";
import {
  getAthleteIdentity,
  anchorIdentityWithPasskey,
  anchorIdentityWithGoogle,
  claimAnonymousVault,
  AthleteIdentity,
} from "../../../src/lib/auth/identity";

test("Phase 0: Athlete Identity & Late-Binding Sovereignty Engine", async (t) => {
  // Mock localStorage for test environment
  const storageMap = new Map<string, string>();
  const originalLocalStorage = (globalThis as any).localStorage;
  const originalWindow = (globalThis as any).window;

  t.beforeEach(() => {
    storageMap.clear();
    (globalThis as any).window = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => storageMap.get(key) || null,
      setItem: (key: string, val: string) => storageMap.set(key, val),
      removeItem: (key: string) => storageMap.delete(key),
      clear: () => storageMap.clear(),
    };
  });

  t.afterEach(() => {
    (globalThis as any).localStorage = originalLocalStorage;
    (globalThis as any).window = originalWindow;
  });

  await t.test("getAthleteIdentity returns zero-block sovereign local identity on first boot", () => {
    const identity = getAthleteIdentity();
    assert.equal(identity.status, "sovereign_local");
    assert.equal(identity.uid, "trainee_alaa");
    assert.equal(identity.displayName, "Alaa");
    assert.equal(identity.isCloudVaultEnabled, false);
    assert.ok(identity.initializedAt);
  });

  await t.test("anchorIdentityWithPasskey anchors local vault to WebAuthn credential without blocking", async () => {
    const credId = "cred_webauthn_touchid_mock_999";
    const anchored = await anchorIdentityWithPasskey(credId, "Alaa Punch Fighter");

    assert.equal(anchored.status, "anchored_passkey");
    assert.equal(anchored.passkeyCredentialId, credId);
    assert.equal(anchored.displayName, "Alaa Punch Fighter");
    assert.equal(anchored.isCloudVaultEnabled, true);
    assert.ok(anchored.anchoredAt);

    // Verify persisted in identity store
    const stored = getAthleteIdentity();
    assert.equal(stored.status, "anchored_passkey");
    assert.equal(stored.passkeyCredentialId, credId);
  });

  await t.test("anchorIdentityWithGoogle anchors sovereign identity and preserves creation date", async () => {
    const initial = getAthleteIdentity();
    const googleUid = "google_usr_123456789";
    const email = "alaa@punch-lissasfa.ma";

    const anchored = await anchorIdentityWithGoogle(googleUid, email, "Alaa G.");

    assert.equal(anchored.status, "anchored_google");
    assert.equal(anchored.uid, googleUid);
    assert.equal(anchored.email, email);
    assert.equal(anchored.isCloudVaultEnabled, true);
    assert.equal(anchored.initializedAt, initial.initializedAt);
    assert.ok(anchored.anchoredAt);
  });

  await t.test("claimAnonymousVault safely handles no-op when source and target are identical", async () => {
    const res = await claimAnonymousVault("trainee_alaa", "trainee_alaa");
    assert.equal(res.migratedSessions, 0);
    assert.equal(res.migratedEvents, 0);
  });
});
