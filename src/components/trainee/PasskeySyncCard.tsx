"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { hasSavedPasskey, setSavedPasskey, registerPasskey, syncLocalDataToCloud } from "@/lib/auth/passkey";
import { anchorIdentityWithPasskey, getAthleteIdentity } from "@/lib/auth/identity";
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
    const identity = getAthleteIdentity();
    if (identity.status === "anchored_passkey" || hasSavedPasskey(userId)) {
      setIsSaved(true);
    }
  }, [userId]);

  const handleCreatePasskey = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await registerPasskey(userId, userName);
      if (res.success && res.credentialId) {
        setSavedPasskey(userId, res.credentialId);
        await anchorIdentityWithPasskey(res.credentialId, userName);
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
      <div className="p-4 rounded-2xl bg-[#111622] border border-amber-500/30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-white block">Passkey Cloud Vault Active</span>
            <span className="text-[11px] text-slate-400">Device biometric bound & synced securely</span>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
          Anchored
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-[#111622] border border-[#1C2436] space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          Sovereign Vault · Zero Password Wall
        </span>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-white">Anchor Vault with Face ID / Fingerprint</h4>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
          Sync your training logs and PRs across phones or tablets. 1-tap cryptographic anchor with zero login barriers on the gym floor.
        </p>
      </div>

      {errorMsg && (
        <p className="text-[11px] text-rose-400 font-mono">{errorMsg}</p>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={handleCreatePasskey}
        className="w-full min-h-[44px] py-2.5 px-4 bg-[#182030] hover:bg-[#1E283D] active:scale-[0.99] text-white text-xs font-semibold rounded-xl border border-[#242F45] transition flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
        ) : (
          <KeyRound className="w-4 h-4 text-amber-400" />
        )}
        <span>{loading ? "Registering Passkey..." : "Anchor Vault with Face ID / Touch ID"}</span>
      </button>
    </div>
  );
}
