/**
 * Public Firebase WebApp Configuration for VYRA (`vyra-509011`).
 * Values here are public client identifiers safe for browser bundles and can be
 * overridden per environment via NEXT_PUBLIC_FIREBASE_* variables.
 */

export interface VyraFirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  appId: string;
}

export const FIREBASE_WEB_CONFIG: VyraFirebaseWebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDlxS_P7LBNMm2HoUGrTo9nKsv7drpFang",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "vyra-509011.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vyra-509011",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "vyra-509011.firebasestorage.app",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:592834219346:web:e0fd8fab27801ce337fe8b",
};
