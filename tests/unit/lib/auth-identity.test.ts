import test from "node:test";
import assert from "node:assert/strict";
import {
  getAthleteIdentity,
  anchorIdentityWithPasskey,
  anchorIdentityWithGoogle,
  anchorIdentityWithFirebase,
  clearAnchoredIdentity,
  claimAnonymousVault,
} from "../../../src/lib/auth/identity";

test("Phase 0: Athlete Identity & Late-Binding Sovereignty Engine", async (t) => {
  // Mock localStorage for test environment
  const storageMap = new Map<string, string>();
  const globalMock = globalThis as unknown as {
    window?: unknown;
    localStorage?: {
      getItem: (key: string) => string | null;
      setItem: (key: string, val: string) => unknown;
      removeItem: (key: string) => void;
      clear: () => void;
    };
  };
  const originalLocalStorage = globalMock.localStorage;
  const originalWindow = globalMock.window;

  t.beforeEach(() => {
    storageMap.clear();
    globalMock.window = {};
    globalMock.localStorage = {
      getItem: (key: string) => storageMap.get(key) || null,
      setItem: (key: string, val: string) => storageMap.set(key, val),
      removeItem: (key: string) => storageMap.delete(key),
      clear: () => storageMap.clear(),
    };
  });

  t.afterEach(() => {
    globalMock.localStorage = originalLocalStorage;
    globalMock.window = originalWindow;
  });

  await t.test("getAthleteIdentity returns isolated anonymous sovereign identity on clean first boot", () => {
    const identity = getAthleteIdentity();
    assert.equal(identity.status, "sovereign_local");
    assert.ok(identity.uid.startsWith("anon_"), `Expected anonymous uid, got ${identity.uid}`);
    assert.notEqual(identity.uid, "trainee_alaa");
    assert.equal(identity.displayName, "Athlete");
    assert.equal(identity.isCloudVaultEnabled, false);
    assert.ok(identity.initializedAt);
  });

  await t.test("anchorIdentityWithFirebase binds canonical uid & clearAnchoredIdentity rotates back to isolated anon", async () => {
    const anchored = await anchorIdentityWithFirebase({
      uid: "trainee_alaa",
      email: "alaaeddineroucadi@gmail.com",
      displayName: "Alaa",
      provider: "password",
    });
    assert.equal(anchored.status, "anchored_firebase");
    assert.equal(anchored.uid, "trainee_alaa");
    assert.equal(anchored.isCloudVaultEnabled, true);

    const signedOut = clearAnchoredIdentity();
    assert.equal(signedOut.status, "sovereign_local");
    assert.ok(signedOut.uid.startsWith("anon_"));
    assert.notEqual(signedOut.uid, "trainee_alaa");
    assert.equal(signedOut.isCloudVaultEnabled, false);
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
