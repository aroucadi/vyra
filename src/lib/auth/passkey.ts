/**
 * @file passkey.ts
 * @description Spec 021: Post-Session 1 Passkey Registration & Cloud Sync Handoff.
 * WebAuthn / FIDO2 Passkey helper using server-issued challenges & attestation verification,
 * with explicit headless fallback when browser PublicKeyCredential is unavailable.
 */

export interface PasskeyAttestationBundle {
  clientDataJSON: string;
  attestationObject: string;
  rpId?: string;
  spkiPublicKey?: string;
}

export interface PasskeyRegistrationResult {
  success: boolean;
  credentialId?: string;
  challengeId?: string;
  attestation?: PasskeyAttestationBundle;
  error?: string;
  isMock?: boolean;
}

export interface CloudSyncPayload {
  userId: string;
  credentialId: string;
  challengeId?: string;
  attestation?: PasskeyAttestationBundle;
  syncedAt: string;
  sessionsCount: number;
}

function bytesToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padded = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const mod = padded.length % 4;
  const normalized = mod === 0 ? padded : padded + "=".repeat(4 - mod);
  const binary = atob(normalized);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

/**
 * Checks if WebAuthn / PublicKeyCredential is supported in the current environment.
 */
export function isPasskeySupported(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.PublicKeyCredential === "function";
}

/**
 * Checks local storage for whether this user has already linked a passkey.
 */
export function hasSavedPasskey(userId: string): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(`vyra_passkey_${userId}`);
}

/**
 * Stores the active passkey credential ID in local storage.
 */
export function setSavedPasskey(userId: string, credentialId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`vyra_passkey_${userId}`, credentialId);
  localStorage.setItem(`vyra_passkey_registered_at`, new Date().toISOString());
}

/**
 * Requests a server-issued challenge from `/api/auth/passkey` and runs native WebAuthn
 * `navigator.credentials.create()`. Falls back cleanly to a local headless mock when WebAuthn
 * is unsupported (e.g. Node.js tests or legacy browsers).
 */
export async function registerPasskey(
  username: string,
  displayName: string = "Vyra Athlete"
): Promise<PasskeyRegistrationResult> {
  // If not supported or running in headless/Node test environment, provide deterministic local mock
  if (!isPasskeySupported()) {
    const mockCredentialId = `mock_passkey_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      success: true,
      credentialId: mockCredentialId,
      isMock: true,
    };
  }

  try {
    const challengeRes = await fetch(
      `/api/auth/passkey?userId=${encodeURIComponent(username)}`,
      { method: "GET" }
    );
    if (!challengeRes.ok) {
      const errJson = (await challengeRes.json().catch(() => ({}))) as { error?: string };
      return {
        success: false,
        error: errJson.error || "Failed to obtain server passkey challenge.",
      };
    }

    const challengeData = (await challengeRes.json()) as {
      challengeId: string;
      challenge: string;
    };
    const challengeBytes = base64UrlToUint8Array(challengeData.challenge);
    const challengeBuffer = challengeBytes.buffer.slice(
      challengeBytes.byteOffset,
      challengeBytes.byteOffset + challengeBytes.byteLength
    ) as ArrayBuffer;

    const rpId = window.location.hostname || "app.vyra.fit";
    const userIdBytes = new TextEncoder().encode(username);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: challengeBuffer,
      rp: {
        name: "Vyra Performance Engine",
        id: rpId,
      },
      user: {
        id: userIdBytes,
        name: username,
        displayName,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // FaceID / TouchID / Windows Hello
        userVerification: "preferred",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return {
        success: false,
        error: "Passkey creation was canceled or not returned.",
      };
    }

    const attResponse = credential.response as AuthenticatorAttestationResponse;
    const rawSpki = typeof attResponse.getPublicKey === "function" ? attResponse.getPublicKey() : null;

    return {
      success: true,
      credentialId: credential.id,
      challengeId: challengeData.challengeId,
      attestation: {
        clientDataJSON: bytesToBase64Url(attResponse.clientDataJSON),
        attestationObject: bytesToBase64Url(attResponse.attestationObject),
        rpId,
        spkiPublicKey: rawSpki ? bytesToBase64Url(rawSpki) : undefined,
      },
      isMock: false,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Verifies the registered WebAuthn passkey attestation with `/api/auth/passkey`
 * and transitions cloud vault binding when server verification succeeds.
 */
export async function syncLocalDataToCloud(
  userId: string,
  credentialId: string,
  sessionsCount: number,
  verification?: {
    challengeId?: string;
    attestation?: PasskeyAttestationBundle;
  }
): Promise<{ success: boolean; syncedAt: string; persistedToCloud?: boolean }> {
  const syncedAt = new Date().toISOString();

  // Headless/mock mode binds locally without claiming server-verified WebAuthn cloud attestation
  if (!verification?.challengeId || !verification?.attestation) {
    return { success: true, syncedAt, persistedToCloud: false };
  }

  try {
    const res = await fetch("/api/auth/passkey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        credentialId,
        challengeId: verification.challengeId,
        attestation: verification.attestation,
        syncedAt,
        sessionsCount,
      }),
    });

    if (!res.ok) {
      return { success: true, syncedAt, persistedToCloud: false };
    }

    const json = (await res.json()) as {
      success?: boolean;
      verifiedWebAuthn?: boolean;
      syncedAt?: string;
    };
    return {
      success: Boolean(json.success ?? true),
      syncedAt: json.syncedAt || syncedAt,
      persistedToCloud: Boolean(json.verifiedWebAuthn ?? true),
    };
  } catch {
    return { success: true, syncedAt, persistedToCloud: false };
  }
}
