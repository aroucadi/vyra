"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Camera,
  ShieldCheck,
  Sparkles,
  Calendar,
  Dumbbell,
  ArrowRight,
  CheckCircle2,
  Eye,
  Activity,
  SlidersHorizontal,
  RotateCcw,
  Upload,
  Lock,
  TrendingUp,
} from "lucide-react";
import { clsx } from "clsx";
import { appStore } from "@/lib/store";
import {
  STANDARDIZED_POSE_GUIDES,
  VisualPoseId,
  CheckinCadence,
  VisualProgressSnapshot,
  VisualProgressComparisonReport,
  ProgramAdjustmentSuggestion,
  PhotoMetadataExtractionResult,
  HistoricalPhotoPrefillContext,
  visualProgressStore,
  analyzeVisualProgressEvolution,
  generateAnonymizedMilestoneSilhouetteSvg,
  extractPhotoCaptureDateMetadata,
  resolveHistoricalPhotoPrefill,
  createExifTaggedPhotoDataUri,
} from "@/lib/ai/visual-progress";

export function VisualProgressStudio() {
  const currentUser = appStore.getCurrentUser();
  const sessions = appStore.getSessions(currentUser.id);
  const metrics = appStore.getMetrics(currentUser.id);

  const [activePose, setActivePose] = useState<VisualPoseId>("front_relaxed");
  const [cadence, setCadence] = useState<CheckinCadence>(() =>
    visualProgressStore.getCadence()
  );
  const [snapshots, setSnapshots] = useState<VisualProgressSnapshot[]>(() =>
    visualProgressStore.getSnapshots(currentUser.id, "front_relaxed")
  );

  const [selectedIdA, setSelectedIdA] = useState<string>("");
  const [selectedIdB, setSelectedIdB] = useState<string>("");
  const [report, setReport] = useState<VisualProgressComparisonReport | null>(null);
  const [activeTab, setActiveTab] = useState<"insights" | "workout_bridge" | "actions">(
    "insights"
  );

  // Guided Capture & Historical Photo Import State
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [captureDateInput, setCaptureDateInput] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [captureMilestoneLabel, setCaptureMilestoneLabel] = useState("Week 8 Check-In");
  const [captureWeightInput, setCaptureWeightInput] = useState("54.4");
  const [captureNoteInput, setCaptureNoteInput] = useState("");
  const [uploadedRawUri, setUploadedRawUri] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | undefined>(undefined);
  const [uploadedFileMtime, setUploadedFileMtime] = useState<number | undefined>(undefined);
  const [detectedMetadata, setDetectedMetadata] =
    useState<PhotoMetadataExtractionResult | null>(null);
  const [historicalPrefill, setHistoricalPrefill] =
    useState<HistoricalPhotoPrefillContext | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Program Adjustment 1-Tap Apply & Undo State
  const [appliedAdjustmentIds, setAppliedAdjustmentIds] = useState<Record<string, boolean>>({});
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Refresh snapshots when pose changes
  useEffect(() => {
    const poseSnaps = visualProgressStore.getSnapshots(currentUser.id, activePose);
    setSnapshots(poseSnaps);
    if (poseSnaps.length >= 2) {
      setSelectedIdA(poseSnaps[0].id);
      setSelectedIdB(poseSnaps[poseSnaps.length - 1].id);
    } else if (poseSnaps.length === 1) {
      setSelectedIdA(poseSnaps[0].id);
      setSelectedIdB(poseSnaps[0].id);
    }
  }, [activePose, currentUser.id]);

  const snapshotA = useMemo(
    () => snapshots.find((s) => s.id === selectedIdA) || snapshots[0],
    [snapshots, selectedIdA]
  );
  const snapshotB = useMemo(
    () =>
      snapshots.find((s) => s.id === selectedIdB) ||
      snapshots[snapshots.length - 1],
    [snapshots, selectedIdB]
  );

  // Compute AI comparison report whenever snapshotA or snapshotB changes
  useEffect(() => {
    let active = true;
    if (!snapshotA || !snapshotB) return;

    analyzeVisualProgressEvolution({
      traineeId: currentUser.id,
      snapshotA,
      snapshotB,
      sessions,
      metrics,
      traineeGoals: currentUser.goals,
    })
      .then((res) => {
        if (active) setReport(res);
      })
      .catch(() => {
        // ignore
      });

    return () => {
      active = false;
    };
  }, [snapshotA, snapshotB, currentUser.id, sessions.length, metrics.length]);

  const handleCadenceChange = (next: CheckinCadence) => {
    setCadence(next);
    visualProgressStore.setCadence(next);
  };

  const applyDateAndPrefillContext = (
    dateStr: string,
    meta?: PhotoMetadataExtractionResult | null
  ) => {
    setCaptureDateInput(dateStr);
    const earliestSnapDate = snapshots[0]?.date;
    const prefill = resolveHistoricalPhotoPrefill({
      captureDate: dateStr,
      programStartDate: earliestSnapDate,
      metrics,
      sessions,
    });
    setHistoricalPrefill(prefill);
    setCaptureMilestoneLabel(prefill.suggestedMilestoneLabel);
    setCaptureWeightInput(String(prefill.closestWeightKg));
    if (meta !== undefined) {
      setDetectedMetadata(meta);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setUploadedFileMtime(file.lastModified);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const dataUri = reader.result;
        setUploadedRawUri(dataUri);

        // Extract EXIF / filename / file timestamp BEFORE anonymizing
        const meta = extractPhotoCaptureDateMetadata({
          rawImageDataUri: dataUri,
          fileName: file.name,
          fileLastModifiedMs: file.lastModified,
        });
        const resolvedDate =
          meta.detectedDate || new Date().toISOString().split("T")[0];
        applyDateAndPrefillContext(resolvedDate, meta);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSimulatePastExifPhoto = () => {
    // Simulate a photo taken ~20 days ago (Week 2 of Alaa's first month of training)
    const pastDateObj = new Date(Date.now() - 20 * 86400000);
    const yyyy = pastDateObj.getUTCFullYear();
    const mm = String(pastDateObj.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(pastDateObj.getUTCDate()).padStart(2, "0");
    const exifTimestamp = `${yyyy}:${mm}:${dd} 08:45:12`;
    const mockFileName = `IMG_${yyyy}${mm}${dd}_084512.jpg`;

    const exifDataUri = createExifTaggedPhotoDataUri(exifTimestamp);
    setUploadedRawUri(exifDataUri);
    setUploadedFileName(mockFileName);
    setUploadedFileMtime(pastDateObj.getTime());

    const meta = extractPhotoCaptureDateMetadata({
      rawImageDataUri: exifDataUri,
      fileName: mockFileName,
      fileLastModifiedMs: pastDateObj.getTime(),
    });
    applyDateAndPrefillContext(
      meta.detectedDate || `${yyyy}-${mm}-${dd}`,
      meta
    );
  };

  const handleSaveAnonymizedPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCapturing(true);
    try {
      const weightVal = parseFloat(captureWeightInput) || 53.5;
      const inferredWeek =
        historicalPrefill?.inferredWeekIndex ??
        Math.max(1, ...snapshots.map((s) => s.weekIndex + 1));

      // If user uploaded a non-SVG raw image or simulated EXIF, generate a clean standardized silhouette
      // if the raw URI is a tiny synthetic EXIF header stub so it renders visually in the studio
      const isExifStub =
        uploadedRawUri &&
        uploadedRawUri.startsWith("data:image/jpeg;base64,RXhpZg");
      const rawUri =
        uploadedRawUri && !isExifStub
          ? uploadedRawUri
          : generateAnonymizedMilestoneSilhouetteSvg({
              poseId: activePose,
              weekIndex: Math.max(1, inferredWeek),
              milestoneLabel:
                captureMilestoneLabel || `Week ${inferredWeek} Check-In`,
              weightKg: weightVal,
              shoulderWidthFactor: 1 + Math.min(0.15, Math.max(0, inferredWeek - 1) * 0.015),
              pelvicTiltDegrees: Math.max(5, 14 - Math.max(0, inferredWeek - 1) * 1.1),
              latSpreadFactor: 1 + Math.min(0.17, Math.max(0, inferredWeek - 1) * 0.018),
            });

      const created = await visualProgressStore.addAnonymizedSnapshot({
        traineeId: currentUser.id,
        poseId: activePose,
        rawImageDataUri: uploadedRawUri || rawUri,
        date: captureDateInput,
        milestoneLabel:
          captureMilestoneLabel || `Week ${inferredWeek} Check-In`,
        weekIndex: inferredWeek,
        weightKg: weightVal,
        fileName: uploadedFileName,
        fileLastModifiedMs: uploadedFileMtime,
        programStartDate: snapshots[0]?.date,
        metrics,
        sessions,
        traineeNote:
          captureNoteInput ||
          historicalPrefill?.contextNoteForAi ||
          "Standardized check-in captured with on-device face anonymization.",
      });

      // If we used the synthetic EXIF stub for metadata extraction, ensure the displayable SVG is attached
      if (isExifStub) {
        created.anonymizedImageUrl = rawUri;
      }

      const updated = visualProgressStore.getSnapshots(currentUser.id, activePose);
      setSnapshots(updated);
      if (updated.length >= 2) {
        setSelectedIdA(updated[0].id);
      }
      setSelectedIdB(created.id);
      setIsCaptureOpen(false);
      setUploadedRawUri(null);
      setUploadedFileName(undefined);
      setUploadedFileMtime(undefined);
      setDetectedMetadata(null);
      setCaptureNoteInput("");
      setStatusBanner(
        created.isHistoricalImport
          ? `Imported past photo "${created.milestoneLabel}" (${created.date}) via ${created.metadataDateSource === "exif_datetime_original" ? "EXIF Metadata" : "Historical Date"} & Anonymized Face.`
          : `Saved "${created.milestoneLabel}" (${created.date}) with On-Device Face Anonymization.`
      );
      setTimeout(() => setStatusBanner(null), 4500);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleApplyProgramAdjustment = (adj: ProgramAdjustmentSuggestion) => {
    const alreadyApplied = appliedAdjustmentIds[adj.id];
    if (alreadyApplied) {
      // 1-Tap Undo (Law 11: Show Reasoning, Keep Control)
      if (adj.currentExerciseName) {
        appStore.swapExerciseInActiveProgram(
          currentUser.id,
          adj.recommendedExerciseName,
          adj.currentExerciseName
        );
      }
      setAppliedAdjustmentIds((prev) => ({ ...prev, [adj.id]: false }));
      setStatusBanner(`Reverted program adjustment: restored ${adj.currentExerciseName || "previous setup"}.`);
      setTimeout(() => setStatusBanner(null), 3500);
      return;
    }

    if (adj.currentExerciseName) {
      appStore.swapExerciseInActiveProgram(
        currentUser.id,
        adj.currentExerciseName,
        adj.recommendedExerciseName
      );
    }
    setAppliedAdjustmentIds((prev) => ({ ...prev, [adj.id]: true }));
    setStatusBanner(
      `Applied "${adj.recommendedExerciseName}" (${adj.prescribedSetsReps}) to your active training blueprint.`
    );
    setTimeout(() => setStatusBanner(null), 4000);
  };

  const poseGuide = STANDARDIZED_POSE_GUIDES[activePose];

  return (
    <section
      aria-label="AI-Powered Visual Progress Tracking Studio"
      className="bg-[#111622] rounded-2xl border border-[#1C2436] p-4 space-y-4 shadow-sm"
    >
      {/* 1. Studio Header + Privacy Guarantee + Capture Trigger */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>AI Visual Evolution Studio</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Face Auto-Anonymized</span>
            </span>
          </div>
          <h2 className="text-base font-bold text-white font-editorial tracking-tight">
            Visual Progress & Workout Correlation
          </h2>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Standardized side-by-side posture milestones linked directly to the training sessions, volume, and consistency behind every change.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCaptureOpen((v) => !v)}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-display uppercase tracking-wider text-[11px] font-black flex items-center gap-1.5 transition shadow-sm shrink-0 cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Check-In</span>
        </button>
      </div>

      {/* Status Toast Banner */}
      {statusBanner && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{statusBanner}</span>
        </div>
      )}

      {/* Guided Privacy-First Photo Capture & Historical Upload Drawer (Collapsible) */}
      {isCaptureOpen && (
        <form
          onSubmit={handleSaveAnonymizedPhoto}
          className="p-3.5 rounded-2xl bg-[#090C11] border border-amber-500/40 space-y-3"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                Check-In or Import Past Photo ({poseGuide.shortLabel})
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">
              Reads EXIF Date First → Then Blurs Face
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#111622] border border-[#1C2436] text-[11px] text-slate-300 space-y-1">
            <div>
              <span className="text-amber-400 font-mono font-bold">1. Camera:</span>{" "}
              {poseGuide.cameraHeightCue}
            </div>
            <div>
              <span className="text-amber-400 font-mono font-bold">2. Stance:</span>{" "}
              {poseGuide.stanceCue}
            </div>
            <div>
              <span className="text-amber-400 font-mono font-bold">3. Historical Backfill:</span>{" "}
              Upload any photo from your past training weeks—Vyra automatically reads EXIF metadata to detect the date taken and prefills your week & weight (or let you specify the date manually).
            </div>
          </div>

          {/* Upload Photo or 1-Tap Simulate Past EXIF Photo */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111622] border border-[#1C2436] hover:border-amber-500/50 text-xs text-slate-200 cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {uploadedFileName
                  ? `Selected: ${uploadedFileName}`
                  : "Upload Current or Past Photo"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleSimulatePastExifPhoto}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-[11px] font-mono font-semibold cursor-pointer transition"
            >
              ⚡ Test Past Photo with EXIF Date (Week 2)
            </button>
          </div>

          {/* Live Metadata & Historical Context Detection Banner */}
          {(detectedMetadata || historicalPrefill) && (
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1 text-[11px]">
              {detectedMetadata && (
                <div className="font-mono text-emerald-300 font-semibold flex items-center justify-between gap-2">
                  <span>📅 {detectedMetadata.summaryText}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                    {detectedMetadata.source.replace(/_/g, " ")}
                  </span>
                </div>
              )}
              {historicalPrefill && (
                <p className="text-slate-300 text-[10px] font-mono leading-relaxed">
                  {historicalPrefill.contextNoteForAi}
                </p>
              )}
            </div>
          )}

          {/* Editable Date Taken, Milestone Label & Historical Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Date Photo Was Taken
              </label>
              <input
                type="date"
                value={captureDateInput}
                onChange={(e) =>
                  applyDateAndPrefillContext(e.target.value, {
                    detectedDate: e.target.value,
                    capturedAtIso: `${e.target.value}T09:00:00.000Z`,
                    source: "manual_entry",
                    confidence: 1,
                    summaryText: `Manual date selected (${e.target.value}) — prefilled training week & weight.`,
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#111622] border border-[#1C2436] text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Milestone / Week Label
              </label>
              <input
                type="text"
                value={captureMilestoneLabel}
                onChange={(e) => setCaptureMilestoneLabel(e.target.value)}
                placeholder="e.g. Week 2 Historical"
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#111622] border border-[#1C2436] text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Weight at Date (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={captureWeightInput}
                onChange={(e) => setCaptureWeightInput(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#111622] border border-[#1C2436] text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCaptureOpen(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCapturing}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {isCapturing ? "Anonymizing..." : "Anonymize Face & Save to Timeline"}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* 2. Standardized Posture Selector + Check-In Cadence */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(Object.keys(STANDARDIZED_POSE_GUIDES) as VisualPoseId[]).map((poseKey) => {
            const g = STANDARDIZED_POSE_GUIDES[poseKey];
            const isSelected = activePose === poseKey;
            return (
              <button
                key={poseKey}
                type="button"
                onClick={() => setActivePose(poseKey)}
                className={clsx(
                  "px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border cursor-pointer",
                  isSelected
                    ? "bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-sm"
                    : "bg-[#090C11] border-[#1C2436] text-slate-400 hover:text-slate-200"
                )}
              >
                {g.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 self-end sm:self-auto">
          <span className="text-[10px] font-mono text-slate-400 mr-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            Cadence:
          </span>
          {(["weekly", "biweekly", "monthly"] as CheckinCadence[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleCadenceChange(c)}
              className={clsx(
                "px-2 py-0.5 rounded-lg text-[10px] font-mono uppercase transition border cursor-pointer",
                cadence === c
                  ? "bg-slate-800 border-amber-500/40 text-amber-400 font-bold"
                  : "bg-[#090C11] border-[#1C2436] text-slate-500 hover:text-slate-300"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Visual Evolution Timeline Strip (Milestone Selector) */}
      <div className="p-3 bg-[#090C11] border border-[#1C2436] rounded-xl space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-400 uppercase tracking-wider">
            Evolution Timeline ({snapshots.length} Standardized Milestones)
          </span>
          <span className="text-amber-400">
            Select Milestone A & Milestone B to Compare
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {snapshots.map((snap, idx) => {
            const isA = snapshotA?.id === snap.id;
            const isB = snapshotB?.id === snap.id;
            return (
              <div
                key={snap.id}
                onClick={() => {
                  if (idx === 0) {
                    setSelectedIdA(snap.id);
                  } else if (isB && !isA) {
                    setSelectedIdA(snap.id);
                  } else {
                    setSelectedIdB(snap.id);
                  }
                }}
                className={clsx(
                  "p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-1",
                  isA || isB
                    ? "bg-[#111622] border-amber-500/50 shadow-sm"
                    : "bg-[#0B0F17] border-[#1C2436] opacity-75 hover:opacity-100"
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-white truncate">
                    {snap.milestoneLabel}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {isA && (
                      <span className="px-1.5 py-0.2 rounded bg-sky-500/20 border border-sky-500/40 text-sky-300 font-mono text-[9px] font-bold">
                        A
                      </span>
                    )}
                    {isB && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[9px] font-bold">
                        B
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <span>{snap.date.slice(5)}</span>
                    {snap.isHistoricalImport && (
                      <span className="text-[8px] px-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {snap.metadataDateSource === "exif_datetime_original" ? "EXIF" : "PAST"}
                      </span>
                    )}
                  </span>
                  <span className="text-amber-400 font-semibold">
                    {snap.weightKg ? `${snap.weightKg}kg` : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Side-by-Side Standardized Visual Comparison Viewport */}
      {snapshotA && snapshotB && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { tag: "MILESTONE A (BASELINE)", snap: snapshotA, badgeColor: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
            { tag: "MILESTONE B (CURRENT)", snap: snapshotB, badgeColor: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
          ].map(({ tag, snap, badgeColor }) => (
            <div
              key={`${tag}_${snap.id}`}
              className="bg-[#090C11] border border-[#1C2436] rounded-2xl p-2.5 space-y-2 flex flex-col"
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={clsx(
                    "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border truncate",
                    badgeColor
                  )}
                >
                  {tag}
                </span>
                <span className="text-[9px] font-mono text-slate-400 shrink-0">
                  {snap.date}
                </span>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-[#0B0F17] border border-slate-800/80 aspect-[12/17] flex items-center justify-center">
                <img
                  src={snap.anonymizedImageUrl}
                  alt={`${snap.milestoneLabel} - ${poseGuide.label} (Anonymized)`}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
                <span className="text-slate-300 font-semibold truncate">
                  {snap.milestoneLabel}
                </span>
                <span className="text-emerald-400 shrink-0">
                  Align: {snap.postureAlignmentScore}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Empathetic AI Synthesis Banner */}
      {report && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#090C11] to-emerald-500/10 border border-amber-500/30 space-y-1.5">
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>What Your Pictures Represent</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                {report.modelUsed} • {report.mediaResolution?.toUpperCase() || "HIGH"}-RES SCAN
              </span>
              <span className="text-[9px] font-mono text-emerald-400">
                🔒 Zero Facial PII Shared
              </span>
            </div>
          </div>
          <p className="text-xs font-bold text-white leading-snug">
            {report.empatheticHeadline}
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {report.executiveSummary}
          </p>
        </div>
      )}

      {/* 6. Progressive Disclosure 3-Tab Analysis Deck */}
      {report && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#090C11] border border-[#1C2436] rounded-xl">
            {[
              { id: "insights", label: "Visual Changes", icon: Eye },
              { id: "workout_bridge", label: "Work Behind It", icon: Dumbbell },
              { id: "actions", label: "Next Focus", icon: SlidersHorizontal },
            ].map((t) => {
              const Icon = t.icon;
              const isTabActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  className={clsx(
                    "py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer",
                    isTabActive
                      ? "bg-[#111622] text-amber-400 border border-amber-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Visual Evolution & Micro-Changes */}
          {activeTab === "insights" && (
            <div className="space-y-2.5">
              {report.visualObservations.map((obs) => (
                <div
                  key={obs.id}
                  className="p-3 bg-[#090C11] border border-[#1C2436] rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                      {obs.region}
                    </span>
                    <span
                      className={clsx(
                        "text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase",
                        obs.magnitude === "subtle_micro"
                          ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                          : obs.magnitude === "major"
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      )}
                    >
                      {obs.magnitude === "subtle_micro"
                        ? "Subtle Micro-Win"
                        : obs.magnitude === "major"
                        ? "Major Shift"
                        : "Visible Progress"}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{obs.headline}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {obs.observation}
                  </p>
                  <div className="pt-1 border-t border-slate-800/80 flex items-start gap-1.5 text-[10px] font-mono text-emerald-400">
                    <Activity className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Training Driver: {obs.linkedTrainingDriver}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: The Work Behind the Picture (Workout History Bridge) */}
          {activeTab === "workout_bridge" && (
            <div className="space-y-3">
              {/* 4 Key Training Telemetry Counters between Date A and Date B */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2.5 bg-[#090C11] border border-[#1C2436] rounded-xl text-center">
                  <div className="text-base font-display font-black text-white tabular-nums">
                    {report.workoutHistoryBridge.sessionsCompleted}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase">
                    Sessions
                  </div>
                </div>
                <div className="p-2.5 bg-[#090C11] border border-[#1C2436] rounded-xl text-center">
                  <div className="text-base font-display font-black text-emerald-400 tabular-nums">
                    {report.workoutHistoryBridge.consistencyPercent}%
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase">
                    Adherence
                  </div>
                </div>
                <div className="p-2.5 bg-[#090C11] border border-[#1C2436] rounded-xl text-center">
                  <div className="text-base font-display font-black text-amber-400 tabular-nums">
                    {report.workoutHistoryBridge.totalSetsCompleted}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase">
                    Sets Done
                  </div>
                </div>
                <div className="p-2.5 bg-[#090C11] border border-[#1C2436] rounded-xl text-center">
                  <div className="text-base font-display font-black text-sky-400 tabular-nums">
                    {(report.workoutHistoryBridge.totalVolumeKg / 1000).toFixed(1)}k
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase">
                    Vol (kg)
                  </div>
                </div>
              </div>

              {/* Target Muscle Volume Breakdown during period */}
              <div className="p-3 bg-[#090C11] border border-[#1C2436] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-300 font-bold uppercase">
                    Muscle Groups Targeted ({report.workoutHistoryBridge.fromDate.slice(5)} → {report.workoutHistoryBridge.toDate.slice(5)})
                  </span>
                  <span className="text-amber-400">
                    {report.workoutHistoryBridge.prsUnlocked} PRs Unlocked
                  </span>
                </div>

                {report.workoutHistoryBridge.muscleGroupBreakdown.length > 0 ? (
                  <div className="space-y-2">
                    {report.workoutHistoryBridge.muscleGroupBreakdown.map((m) => (
                      <div key={m.muscleGroup} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-200 font-medium">
                            {m.muscleGroup}
                          </span>
                          <span className="text-slate-400">
                            {m.setsCompleted} sets · {m.totalVolumeKg.toLocaleString()} kg
                          </span>
                        </div>
                        <div className="w-full bg-[#111622] rounded-full h-1.5 overflow-hidden border border-[#1C2436]">
                          <div
                            style={{ width: `${Math.max(12, m.sharePercent)}%` }}
                            className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Log sessions to populate muscle volume between milestones.
                  </p>
                )}
              </div>

              {/* Top Exercises Performed Between Snapshot A & B */}
              {report.workoutHistoryBridge.topExerciseHighlights.length > 0 && (
                <div className="p-3 bg-[#090C11] border border-[#1C2436] rounded-xl space-y-2">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                    Key Lifts Driving This Visual Evolution
                  </div>
                  <div className="space-y-1.5">
                    {report.workoutHistoryBridge.topExerciseHighlights.map((ex) => (
                      <div
                        key={ex.exerciseName}
                        className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-none"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-white truncate text-[11px]">
                            {ex.exerciseName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {ex.setsCompleted} sets across {ex.sessionsPerformed} sessions
                          </div>
                        </div>
                        <div className="text-right font-mono shrink-0">
                          <div className="text-[11px] text-amber-400 font-bold">
                            {ex.endBestSet}
                          </div>
                          <div className="text-[9px] text-emerald-400 flex items-center justify-end gap-0.5">
                            <TrendingUp className="w-2.5 h-2.5" />
                            <span>{ex.tonnageKg.toLocaleString()} kg total</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Actionable Next-Block Program Adjustments */}
          {activeTab === "actions" && (
            <div className="space-y-2.5">
              {report.programAdjustments.map((adj) => {
                const isApplied = Boolean(appliedAdjustmentIds[adj.id]);
                return (
                  <div
                    key={adj.id}
                    className="p-3.5 bg-[#090C11] border border-amber-500/30 rounded-2xl space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-amber-400 font-bold uppercase">
                        {adj.targetMuscleOrPosture}
                      </span>
                      <span className="text-slate-400">{adj.prescribedSetsReps}</span>
                    </div>

                    <h4 className="text-xs font-bold text-white">{adj.title}</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {adj.rationale}
                    </p>

                    <div className="p-2 rounded-xl bg-[#111622] border border-[#1C2436] text-[11px] font-mono text-emerald-300">
                      Prescription: {adj.recommendedExerciseName}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyProgramAdjustment(adj)}
                      className={clsx(
                        "w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer",
                        isApplied
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                          : "bg-amber-400 hover:bg-amber-300 text-slate-950"
                      )}
                    >
                      {isApplied ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span>Applied to Program ✓ (Tap to Undo)</span>
                        </>
                      ) : (
                        <>
                          <span>Apply Adjustment to My Program</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
