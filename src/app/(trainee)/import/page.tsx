"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle, Dumbbell, History, Sparkles } from "lucide-react";
import {
  parseHistoricalWorkoutCsv,
  parsePastedWorkoutText,
  commitImportedSessions,
  ImportParseResult,
} from "@/lib/import/csv-importer";
import { appStore } from "@/lib/store";

export default function ImportWorkoutsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = appStore.getCurrentUser();

  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [pasteText, setPasteText] = useState("");
  const [parseResult, setParseResult] = useState<ImportParseResult | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "committed">("idle");
  const [commitSummary, setCommitSummary] = useState<{ committedSessions: number; prsDetected: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds the 10MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseHistoricalWorkoutCsv(content);
        setParseResult(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (val: string) => {
    setPasteText(val);
    if (val.trim().length > 10) {
      const parsed = parsePastedWorkoutText(val);
      setParseResult(parsed);
    } else {
      setParseResult(null);
    }
  };

  const handleCommit = () => {
    if (!parseResult || parseResult.sessions.length === 0) return;
    const summary = commitImportedSessions(currentUser.id, parseResult.sessions);
    setCommitSummary(summary);
    setImportStatus("committed");
  };

  return (
    <div className="flex-1 pb-16 px-4 pt-6 max-w-[480px] mx-auto w-full space-y-6 animate-in fade-in duration-200">
      <header className="flex items-center gap-3">
        <Link
          href="/today"
          className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          aria-label="Back to Today"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-semibold block">
            Phase 4B · Data Ownership
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">Import Workout History</h1>
        </div>
      </header>

      {importStatus === "committed" && commitSummary ? (
        <section className="bg-slate-900/60 border border-emerald-500/30 rounded-xl p-6 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Import Verified & Saved</h2>
            <p className="text-xs text-slate-400 mt-1">
              {commitSummary.committedSessions} workouts imported to local storage.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[11px] text-slate-500 block">Sessions Saved</span>
              <span className="text-lg font-bold text-white tabular-nums">{commitSummary.committedSessions}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[11px] text-slate-500 block">PRs Detected</span>
              <span className="text-lg font-bold text-emerald-400 tabular-nums">+{commitSummary.prsDetected}</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/today"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors"
            >
              <Dumbbell className="w-4 h-4" />
              View Today&apos;s Protocol
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Segmented input mode selector */}
          <div className="flex bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab("file")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
                activeTab === "file" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload CSV
            </button>
            <button
              onClick={() => setActiveTab("paste")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
                activeTab === "paste" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Paste Notes
            </button>
          </div>

          {activeTab === "file" ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/40 rounded-xl p-8 text-center cursor-pointer transition-colors space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-300">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Upload Hevy, Strong, or Fitbod CSV</p>
                <p className="text-xs text-slate-400">Tap to select your export file from your device</p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <span className="text-[10px] font-mono uppercase bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  Hevy
                </span>
                <span className="text-[10px] font-mono uppercase bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  Strong
                </span>
                <span className="text-[10px] font-mono uppercase bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  Fitbod
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="pasted-workout-input" className="text-xs text-slate-400 block">
                Paste workout logs or notes (e.g. &ldquo;Bench Press 80kg x 8, 85kg x 6&rdquo;):
              </label>
              <textarea
                id="pasted-workout-input"
                rows={6}
                value={pasteText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder="Bench Press 80kg x 8, 80kg x 8&#10;Incline DB Press 30kg x 10, 32kg x 8&#10;Tricep Pushdown 25kg x 12"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono resize-none"
              />
            </div>
          )}

          {/* Parsed Verification Summary */}
          {parseResult && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">Parsed Preview</span>
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                    {parseResult.detectedFormat}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                  {parseResult.totalWorkouts} sessions · {parseResult.totalSets} sets
                </span>
              </div>

              {/* Metric density cap: 3-4 metrics */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Workouts</span>
                  <span className="text-sm font-bold text-white tabular-nums">{parseResult.totalWorkouts}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Volume</span>
                  <span className="text-sm font-bold text-white tabular-nums">
                    {(parseResult.totalVolumeKg / 1000).toFixed(1)}k kg
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Movements</span>
                  <span className="text-sm font-bold text-white tabular-nums">{parseResult.uniqueExercises.length}</span>
                </div>
              </div>

              {/* Sample preview */}
              <div className="bg-slate-950/80 rounded-lg border border-slate-800/80 p-3 space-y-2">
                <span className="text-[11px] text-slate-400 font-medium block">Recent Movements Detected:</span>
                <div className="flex flex-wrap gap-1.5">
                  {parseResult.uniqueExercises.slice(0, 6).map((ex) => (
                    <span
                      key={ex}
                      className="text-[11px] text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded"
                    >
                      {ex}
                    </span>
                  ))}
                  {parseResult.uniqueExercises.length > 6 && (
                    <span className="text-[11px] text-slate-500 px-1 py-0.5">
                      +{parseResult.uniqueExercises.length - 6} more
                    </span>
                  )}
                </div>
              </div>

              {/* Single Primary CTA */}
              <button
                onClick={handleCommit}
                className="w-full py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <History className="w-4 h-4" />
                Commit {parseResult.totalWorkouts} Workouts to History
              </button>
            </div>
          )}

          {/* Privacy & Storage Guarantee */}
          <div className="p-3 bg-slate-900/30 rounded-lg border border-slate-800/50 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Parsed 100% locally on your phone. No data leaves your device without an explicit cloud sync.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
