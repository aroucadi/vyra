"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  sendFirebasePasswordReset,
  resendFirebaseEmailVerification,
} from "@/lib/firebase/client";
import { useVyraAuth } from "@/components/auth/VyraAuthProvider";
import {
  ArrowRight,
  Lock,
  Mail,
  KeyRound,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type AuthMode = "signin" | "signup" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isAlaa, authEmail, refreshBootstrap, signOutAll } = useVyraAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setNeedsVerification(false);

    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "reset") {
        await sendFirebasePasswordReset(email);
        setInfoMsg(
          `Password setup/reset email sent to ${email.trim()}. Check your inbox (and spam folder), click the link, then return here to sign in.`
        );
        setMode("signin");
        return;
      }

      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        return;
      }

      if (mode === "signup") {
        const res = await signUpWithEmail(email, password, name);
        if (!res.ok) {
          if (res.code === "ALAA_EMAIL_UNVERIFIED") {
            setNeedsVerification(true);
          }
          setErrorMsg(res.error || "Sign-up failed.");
          return;
        }
        await refreshBootstrap();
        router.push("/today");
        return;
      }

      // Sign in
      const res = await signInWithEmail(email, password);
      if (!res.ok) {
        if (res.code === "ALAA_EMAIL_UNVERIFIED") {
          setNeedsVerification(true);
        }
        setErrorMsg(res.error || "Sign-in failed.");
        return;
      }

      await refreshBootstrap();
      router.push("/today");
    } catch (err: unknown) {
      const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code?: string }).code) : "";
      const rawMessage = err instanceof Error ? err.message : "Authentication error.";
      if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
        setErrorMsg(
          "Invalid email or password. If this is your first login on a pre-seeded account, click 'First-time / Forgot password?' below to set your password."
        );
      } else if (code.includes("email-already-in-use")) {
        setErrorMsg("An account with this email already exists. Switch to Sign In or use Password Reset.");
      } else {
        setErrorMsg(rawMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (!res.ok) {
        setErrorMsg(res.error || "Google sign-in could not complete.");
        return;
      }
      await refreshBootstrap();
      router.push("/today");
    } catch (err: unknown) {
      const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code?: string }).code) : "";
      if (code.includes("operation-not-allowed") || code.includes("unauthorized-domain")) {
        setErrorMsg("Google Sign-In provider is not yet activated. Please use Email & Password sign-in.");
      } else if (!code.includes("popup-closed-by-user")) {
        setErrorMsg(err instanceof Error ? err.message : "Google Sign-In failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const sent = await resendFirebaseEmailVerification();
      if (sent) {
        setInfoMsg("Verification link resent! Please check your inbox and verify before signing in.");
      } else {
        setErrorMsg("Please sign in first before resending the verification email.");
      }
    } catch {
      setErrorMsg("Unable to resend verification email right now. Please wait a minute and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#090C11] flex flex-col justify-center items-center p-5 text-slate-100">
      <div className="w-full max-w-sm bg-[#111622] border border-[#1C2436] rounded-3xl p-6 space-y-5 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 stroke-[2.25]" />
          </div>
          <h1 className="text-xl font-editorial font-bold tracking-tight text-white">VYRA Cloud Vault</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sync your training blocks, workout logs, and body metrics across devices with isolated per-athlete cloud storage.
          </p>
        </div>

        {isAuthenticated && authEmail && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Signed in as {authEmail}</span>
            </div>
            {isAlaa && (
              <div className="text-[11px] text-amber-300 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Owner Account · Nov 23 Master Program Unlocked</span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Link
                href="/today"
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs text-center"
              >
                Open App
              </Link>
              <button
                type="button"
                onClick={signOutAll}
                className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#090C11] border border-[#1C2436] rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition cursor-pointer ${
              mode === "signin" || mode === "reset"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition cursor-pointer ${
              mode === "signup"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <div className="space-y-1">
              <label htmlFor="auth-name" className="text-xs font-semibold text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#090C11] border border-[#1C2436] focus:border-amber-400 rounded-xl text-white text-sm outline-none transition"
                />
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="auth-email" className="text-xs font-semibold text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="athlete@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#090C11] border border-[#1C2436] focus:border-amber-400 rounded-xl text-white text-sm outline-none transition"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          {mode !== "reset" && (
            <div className="space-y-1">
              <label htmlFor="auth-password" className="text-xs font-semibold text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#090C11] border border-[#1C2436] focus:border-amber-400 rounded-xl text-white text-sm outline-none transition"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          {needsVerification && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={loading}
              className="w-full py-2 px-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-semibold hover:bg-sky-500/25 transition cursor-pointer"
            >
              Resend Verification Email
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] disabled:opacity-60 text-slate-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>
                  {mode === "signup"
                    ? "Create Empty Account"
                    : mode === "reset"
                    ? "Send Password Setup / Reset Email"
                    : "Sign In & Sync Vault"}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "reset" ? "signin" : "reset");
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className="text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
          >
            {mode === "reset" ? "Back to Sign In" : "First-time / Forgot password?"}
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="text-slate-300 hover:text-white font-medium cursor-pointer"
          >
            Google Sign-In
          </button>
        </div>

        <div className="border-t border-[#1C2436] pt-4 space-y-2.5 text-center">
          <Link
            href="/today"
            className="block w-full py-2.5 px-4 rounded-xl bg-[#090C11] hover:bg-[#161D2C] border border-[#1C2436] text-xs font-semibold text-slate-300 transition"
          >
            Continue Locally Without Account (Day-0 Mode)
          </Link>
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400/80" />
            <span>New accounts start empty with full features unlocked</span>
          </p>
        </div>
      </div>
    </div>
  );
}
