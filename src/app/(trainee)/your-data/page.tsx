"use client";

import React, { useState } from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { ArrowLeft, Shield, Download, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

export default function YourDataPage() {
  const currentUser = appStore.getCurrentUser();
  const [copied, setCopied] = useState(false);
  const [deleted, setDeleted] = useState(false);

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
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vyra-export-${currentUser.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDelete = () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("Are you sure you want to delete all locally stored session data?");
      if (confirmed) {
        localStorage.clear();
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

      {/* Export */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-white">Export Your Data</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Download a complete JSON export of your logged history</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copied ? "Exported" : "Export"}</span>
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
