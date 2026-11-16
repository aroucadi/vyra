"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { FIREBASE_WEB_CONFIG } from "./config";

let clientApp: FirebaseApp | null = null;
let clientAuth: Auth | null = null;

export function getFirebaseClientApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (clientApp) return clientApp;
  clientApp = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_WEB_CONFIG);
  return clientApp;
}

export function getFirebaseClientAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  if (clientAuth) return clientAuth;
  const app = getFirebaseClientApp();
  if (!app) return null;
  clientAuth = getAuth(app);
  return clientAuth;
}

export interface ServerSessionExchangeResult {
  ok: boolean;
  uid?: string;
  email?: string;
  emailVerified?: boolean;
  isAlaa?: boolean;
  error?: string;
  code?: string;
}

export async function exchangeFirebaseIdTokenForSession(
  user: FirebaseUser
): Promise<ServerSessionExchangeResult> {
  const idToken = await user.getIdToken(true);
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  const data = (await res.json().catch(() => ({}))) as ServerSessionExchangeResult;
  if (!res.ok) {
    return {
      ok: false,
      error: data.error || `Session exchange failed (${res.status})`,
      code: data.code,
    };
  }
  return { ...data, ok: true };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<ServerSessionExchangeResult> {
  const auth = getFirebaseClientAuth();
  if (!auth) throw new Error("Firebase client auth is only available in the browser.");

  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return await exchangeFirebaseIdTokenForSession(cred.user);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<ServerSessionExchangeResult & { verificationEmailSent?: boolean }> {
  const auth = getFirebaseClientAuth();
  if (!auth) throw new Error("Firebase client auth is only available in the browser.");

  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName?.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() }).catch(() => {});
  }

  let verificationEmailSent = false;
  try {
    await sendEmailVerification(cred.user);
    verificationEmailSent = true;
  } catch {
    // Non-fatal if rate limited
  }

  const sessionRes = await exchangeFirebaseIdTokenForSession(cred.user);
  return { ...sessionRes, verificationEmailSent };
}

export async function signInWithGoogle(): Promise<ServerSessionExchangeResult> {
  const auth = getFirebaseClientAuth();
  if (!auth) throw new Error("Firebase client auth is only available in the browser.");

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  return await exchangeFirebaseIdTokenForSession(cred.user);
}

export async function sendFirebasePasswordReset(email: string): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (!auth) throw new Error("Firebase client auth is only available in the browser.");
  await sendPasswordResetEmail(auth, email.trim());
}

export async function resendFirebaseEmailVerification(): Promise<boolean> {
  const auth = getFirebaseClientAuth();
  if (!auth?.currentUser) return false;
  await sendEmailVerification(auth.currentUser);
  return true;
}

export async function signOutFirebaseAndServer(): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (auth) {
    await signOut(auth).catch(() => {});
  }
  await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
}

export function subscribeFirebaseAuthState(
  cb: (user: FirebaseUser | null) => void
): () => void {
  const auth = getFirebaseClientAuth();
  if (!auth) return () => {};
  return onAuthStateChanged(auth, cb);
}
