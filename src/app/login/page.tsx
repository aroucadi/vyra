"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { appStore } from "@/lib/store";
import { ArrowRight, Lock, KeyRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Deterministic gate: passcode 1989 (founder birth year) or 'demo'
    if (passcode.trim() === "1989" || passcode.trim() === "demo" || passcode.trim() === "alaa") {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("vyra_session", "active");
      }
      router.push("/today");
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0B0F17] flex flex-col justify-center items-center p-6 text-slate-100">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-7 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">VYRA Session Access</h1>
          <p className="text-xs text-slate-400">
            Private athletic protocol. Enter your passkey to initialize today&apos;s session.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="passcode" className="text-xs font-semibold text-slate-300">
              Passkey
            </label>
            <div className="relative">
              <input
                id="passcode"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                placeholder="Enter passkey"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setError(false);
                }}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-base outline-none transition"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
            </div>
            {error && (
              <p className="text-[11px] text-rose-400 pt-1">Incorrect passkey. Please check your credentials.</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>Open Protocol</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500 border-t border-slate-800/80 pt-4">
          <span>Protected profile · Zero third-party ad tracking</span>
        </div>
      </div>
    </div>
  );
}
