"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { hasSavedPasskey, setSavedPasskey, registerPasskey, syncLocalDataToCloud } from "@/lib/auth/passkey";
import { telemetry } from "@/lib/telemetry";

interface PasskeySyncCardProps {
  userId: string;
  userName?: string;
  sessionsCount?: number;
  onRegistered?: () => void;
}

export function PasskeySyncCard({
  userId,
  userName = "Athlete",
  sessionsCount = 1,
  onRegistered,
}: PasskeySyncCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsSaved(hasSavedPasskey(userId));
  }, [userId]);

  const handleCreatePasskey = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await registerPasskey(userId, userName);
      if (res.success && res.credentialId) {
        setSavedPasskey(userId, res.credentialId);
        await syncLocalDataToCloud(userId, res.credentialId, sessionsCount);
        setIsSaved(true);
        telemetry.track("passkey_registered", { userId, isMock: res.isMock }, userId);
        onRegistered?.();
      } else {
        setErrorMsg(res.error || "Unable to register passkey on this device.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error initiating passkey.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isSaved) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-white block">Passkey Cloud Sync Active</span>
            <span className="text-[11px] text-slate-400">Saved to phone & synced seamlessly</span>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
          Synced
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          Saved on this phone · Zero signup wall
        </span>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-white">Save with Face ID or Fingerprint</h4>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
          Sync your logs to your second phone or tablet with 1 tap. No passwords or email verification required.
        </p>
      </div>

      {errorMsg && (
        <p className="text-[11px] text-rose-400 font-mono">{errorMsg}</p>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={handleCreatePasskey}
        className="w-full min-h-[44px] py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-white text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
        ) : (
          <KeyRound className="w-4 h-4 text-emerald-400" />
        )}
        <span>{loading ? "Registering Passkey..." : "Create Passkey with Face ID / Touch ID"}</span>
      </button>
    </div>
  );
}
