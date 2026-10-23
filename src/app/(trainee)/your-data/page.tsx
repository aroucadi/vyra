"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { ArrowLeft, Shield, Download, Trash2, CheckCircle2, AlertCircle, HardDrive, RefreshCw, History } from "lucide-react";
import { isStoragePersisted, requestPersistentStorage, clearClientStorage, triggerBackupDownload } from "@/lib/storage";
import { PasskeySyncCard } from "@/components/trainee/PasskeySyncCard";

export default function YourDataPage() {
  const currentUser = appStore.getCurrentUser();
  const [copied, setCopied] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  useEffect(() => {
    isStoragePersisted().then((res) => setIsPersisted(res));
    if (typeof window !== "undefined") {
      const ts = localStorage.getItem("vyra_last_backup_at");
      if (ts) setLastBackup(ts);
    }
  }, []);

  const handleRequestPersist = async () => {
    const granted = await requestPersistentStorage();
    setIsPersisted(granted);
  };

  const handleExport = () => {
    const data = {
      user: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      },
      sessions: appStore.getSessions(currentUser.id),
      metrics: appStore.getMetrics(currentUser.id),
      readinessLogs: appStore.getWearableBiometricsHistory(currentUser.id),
    };

    const ts = triggerBackupDownload(data, `vyra-export-${currentUser.id}.json`);
    setLastBackup(ts);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDelete = async () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("Are you sure you want to delete all locally stored session data?");
      if (confirmed) {
        await clearClientStorage();
        setDeleted(true);
      }
    }
  };

  return (
    <div className="flex-1 pb-16 px-4 pt-6 max-w-[480px] mx-auto w-full space-y-6 animate-in fade-in duration-200">
      <header className="flex items-center gap-3">
        <Link
          href="/you"
          className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Your Data & Privacy</h1>
          <p className="text-xs text-slate-400">Complete control over what is stored</p>
        </div>
      </header>

      {/* What is stored */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>What VYRA Stores</span>
        </div>
        <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
          <li>Logged workout sets (weight, reps, timestamp)</li>
          <li>Daily sleep hours entered during readiness check-in</li>
          <li>Hydration and supplement dose completions</li>
          <li>Personal records and 1RM progression formulas</li>
        </ul>
        <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
          No external ad trackers. No personal biometric or body weight data is ever sent to third-party ad networks or public AI prompts.
        </p>
      </section>

      {/* Storage Durability & Eviction Protection */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>Offline Storage Durability</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isPersisted === true
                ? "Persistent storage granted. Safari will not evict your data."
                : isPersisted === false
                ? "Best-effort storage. iOS may clear data after 7 days without use."
                : "Checking browser storage status..."}
            </p>
          </div>
          {isPersisted === false && (
            <button
              type="button"
              onClick={handleRequestPersist}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/60 text-xs font-semibold text-cyan-300 transition"
            >
              Protect
            </button>
          )}
        </div>
      </section>

      {/* Multi-Device Passkey Sync (Spec 021) */}
      <PasskeySyncCard
        userId={currentUser.id}
        userName={currentUser.name}
        sessionsCount={appStore.getSessions(currentUser.id).length}
      />

      {/* Historical Log Importer (Spec 020) */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Import Workout History</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Load past workouts from Hevy, Strong, or Fitbod CSV exports.
            </p>
          </div>
          <Link
            href="/import"
            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400 transition flex items-center gap-1.5"
          >
            <span>Import</span>
          </Link>
        </div>
      </section>

      {/* Export & Backup */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-white">Export & Backup</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lastBackup
                ? `Last backup: ${new Date(lastBackup).toLocaleDateString()} ${new Date(lastBackup).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : "No backups downloaded yet"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copied ? "Exported" : "Export backup"}</span>
          </button>
        </div>
      </section>

      {/* Delete */}
      <section className="bg-slate-900 border border-rose-950/60 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-rose-400">Reset Local Storage</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Purge locally cached offline workout queue and check-in history</p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 text-xs font-semibold text-rose-300 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleted ? "Cleared" : "Clear"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
