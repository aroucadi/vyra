"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
import { RagExercise } from "@/types/exercise-rag";
import { ExerciseDetailSheet } from "@/components/trainee/ExerciseDetailSheet";
import { ExerciseVideoModal } from "@/components/trainee/ExerciseVideoModal";
import { AnatomicalBodyMap } from "@/components/trainee/AnatomicalBodyMap";
import { AnatomicalTensionSpotlight } from "@/components/trainee/AnatomicalTensionSpotlight";
import { VyraLogo } from "@/components/brand/VyraLogo";
import { resolveExerciseVideoUrl } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Search,
  Dumbbell,
  ArrowLeft,
  X,
  ChevronRight,
  RotateCcw,
  Zap,
  Video,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";

interface MuscleFilter {
  id: string;
  label: string;
  value: string;
}

interface HardwareFilter {
  id: string;
  label: string;
  value: string;
  badge: string;
}

const MUSCLE_CHAINS: MuscleFilter[] = [
  { id: "all", label: "All Chains", value: "all" },
  { id: "lats", label: "Back & Lats", value: "lats" },
  { id: "chest", label: "Chest & Pecs", value: "chest" },
  { id: "shoulders", label: "Shoulders & Delts", value: "shoulders" },
  { id: "quads", label: "Quads & Thighs", value: "quads" },
  { id: "hamstrings", label: "Hamstrings & Glutes", value: "hamstrings" },
  { id: "biceps", label: "Biceps & Flexors", value: "biceps" },
  { id: "triceps", label: "Triceps & Extensors", value: "triceps" },
  { id: "waist", label: "Core & Pelvis", value: "waist" },
];

const HARDWARE_STATIONS: HardwareFilter[] = [
  { id: "all", label: "All Hardware", value: "all", badge: "ANY" },
  { id: "cable", label: "2:1 Cable Stack", value: "cable", badge: "CABLE" },
  { id: "lever", label: "Supported Machine", value: "lever", badge: "MACHINE" },
  { id: "dumbbell", label: "Dumbbell Free-Weight", value: "dumbbell", badge: "DB" },
  { id: "barbell", label: "Barbell & Rig", value: "barbell", badge: "BB" },
  { id: "body weight", label: "Bodyweight & Calisthenics", value: "body weight", badge: "BW" },
];

function formatExerciseName(name: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => {
      if (word.startsWith("(") && word.length > 1) {
        return "(" + word.charAt(1).toUpperCase() + word.slice(2).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function extractShortCue(instructions?: string[]): string {
  if (!instructions || instructions.length === 0) {
    return "Locked scapulae · Controlled 2s eccentric descent.";
  }
  const clean = instructions[0]
    .replace(/^(Lie flat|Stand upright|Sit firmly|Position yourself|Ensure your|Make sure your|Begin by)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const clauses = clean.split(/[,.;]/).map((c) => c.trim()).filter(Boolean);
  if (clauses.length >= 2) {
    return clauses.slice(0, 2).join(" · ");
  }
  return clean.length > 60 ? clean.slice(0, 58) + "..." : clean;
}

export default function TraineeExerciseLibraryPage() {
  const [query, setQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("all");
  const [selectedEquipment, setSelectedEquipment] = useState("all");
  const [isBodyMapSheetOpen, setIsBodyMapSheetOpen] = useState(false);
  const [exercises, setExercises] = useState<RagExercise[]>([]);
  const [totalMatches, setTotalMatches] = useState<number>(731);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<RagExercise | null>(null);
  const [videoModalExercise, setVideoModalExercise] = useState<RagExercise | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [, startTransition] = useTransition();

  const hasActiveFilters = Boolean(
    query.trim() || selectedMuscle !== "all" || selectedEquipment !== "all"
  );

  const resetAllFilters = () => {
    setQuery("");
    setSelectedMuscle("all");
    setSelectedEquipment("all");
  };

  // Fetch exercises from /api/exercises based on query and filters
  useEffect(() => {
    let active = true;
    const fetchExercises = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (selectedMuscle !== "all") params.set("muscle", selectedMuscle);
        if (selectedEquipment !== "all") params.set("equipment", selectedEquipment);
        params.set("limit", "50");

        const res = await fetch(`/api/exercises?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load exercises");
        const data = await res.json();
        if (active) {
          startTransition(() => {
            setExercises(data.exercises || []);
            setTotalMatches(
              typeof data.total === "number"
                ? data.total
                : data.exercises?.length || 0
            );
            setLoading(false);
          });
        }
      } catch {
        if (active) {
          setFetchError("Unable to load movement matrix index right now.");
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchExercises, 90);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, selectedMuscle, selectedEquipment, retryNonce]);

  return (
    <div className="min-h-screen bg-[#05080c] text-slate-100 pb-36 w-full max-w-md lg:max-w-6xl mx-auto flex flex-col font-body select-none overflow-x-hidden">
      {/* 1. STICKY COMMAND HEADER */}
      <header className="sticky top-0 z-30 bg-[#05080c]/95 backdrop-blur-md border-b border-[#1b2d47] px-4 pt-3 pb-3 space-y-3 w-full">
        {/* Tier 1: Brand & Top Beacon */}
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Link
              href="/program"
              aria-label="Back to Program"
              className="w-9 h-9 rounded-xl bg-[#0f1724] border border-[#1b2d47] text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <VyraLogo size="xs" variant="mark" />
                <span className="text-xs font-display font-extrabold text-white tracking-wider uppercase">
                  Vyra
                </span>
                <span className="w-px h-3 bg-[#1b2d47] shrink-0" />
                <span className="text-[10px] font-mono text-[#10b981] font-bold uppercase tracking-wider truncate">
                  Movement Matrix
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                {hasActiveFilters
                  ? `${totalMatches.toLocaleString()} Matching Protocols`
                  : `${totalMatches.toLocaleString()}+ Biomechanical Protocols`}
              </p>
            </div>
          </div>

          {/* Interactive Musculature Map Modal Launcher */}
          <button
            type="button"
            onClick={() => setIsBodyMapSheetOpen(true)}
            className={clsx(
              "h-9 px-2.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 border shrink-0",
              selectedMuscle !== "all"
                ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "bg-[#0f1724] text-slate-300 border-[#1b2d47] hover:bg-[#142032] hover:text-white"
            )}
            title="Open Interactive Musculature Scanner"
          >
            <Zap
              className={clsx(
                "w-3.5 h-3.5",
                selectedMuscle !== "all" ? "text-[#10b981]" : "text-cyan-400"
              )}
            />
            <span>Body Map</span>
            {selectedMuscle !== "all" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping ml-0.5" />
            )}
          </button>
        </div>

        {/* Tier 2: High-Density Search Input Field */}
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises, variations, cues..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#0f1724] border border-[#1b2d47] focus:border-cyan-400/80 focus:bg-[#142032] focus:outline-none text-xs text-white placeholder:text-slate-500 font-mono transition shadow-inner"
          />
          {query.trim() && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#142032] transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tier 3: Tactical Filter Carousel 1 — Target Biomechanical Chain */}
        <div className="w-full overflow-hidden space-y-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full">
            {MUSCLE_CHAINS.map((mc) => {
              const isSelected = selectedMuscle === mc.value;
              return (
                <button
                  key={mc.id}
                  type="button"
                  onClick={() =>
                    setSelectedMuscle((prev) =>
                      prev === mc.value && mc.value !== "all" ? "all" : mc.value
                    )
                  }
                  className={clsx(
                    "min-h-[30px] px-3 rounded-lg text-[11px] font-mono font-semibold whitespace-nowrap shrink-0 border transition-all cursor-pointer active:scale-95 flex items-center justify-center",
                    isSelected
                      ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/50 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      : "bg-[#0f1724] text-slate-300 border-[#1b2d47] hover:bg-[#142032] hover:text-white"
                  )}
                >
                  {mc.label}
                </button>
              );
            })}
          </div>

          {/* Tactical Filter Carousel 2 — Gym Hardware & Station */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full">
            {HARDWARE_STATIONS.map((hw) => {
              const isSelected = selectedEquipment === hw.value;
              return (
                <button
                  key={hw.id}
                  type="button"
                  onClick={() =>
                    setSelectedEquipment((prev) =>
                      prev === hw.value && hw.value !== "all" ? "all" : hw.value
                    )
                  }
                  className={clsx(
                    "min-h-[28px] px-2.5 rounded-lg text-[10px] font-mono font-semibold whitespace-nowrap shrink-0 border transition-all cursor-pointer active:scale-95 flex items-center gap-1",
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      : "bg-[#0f1724] text-slate-400 border-[#1b2d47] hover:bg-[#142032] hover:text-slate-200"
                  )}
                >
                  <Dumbbell className="w-2.5 h-2.5" />
                  <span>{hw.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filter Breadcrumbs & Summary */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1b2d47]/70 text-[10px] font-mono animate-in fade-in duration-150 w-full min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-slate-400 shrink-0">Filtering:</span>
              {selectedMuscle !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-bold">
                  <span>{selectedMuscle.toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedMuscle("all")}
                    className="hover:text-white cursor-pointer ml-0.5"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedEquipment !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                  <span>{selectedEquipment.toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedEquipment("all")}
                    className="hover:text-white cursor-pointer ml-0.5"
                  >
                    ×
                  </button>
                </span>
              )}
              {query.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#142032] text-slate-300 border border-[#1b2d47] max-w-[130px] truncate">
                  <span className="truncate">&quot;{query}&quot;</span>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="hover:text-white cursor-pointer ml-0.5 shrink-0"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={resetAllFilters}
              className="text-cyan-400 hover:text-cyan-300 transition cursor-pointer font-bold shrink-0 flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </header>

      {/* 2. MAIN MOVEMENT MATRIX STREAM */}
      <main className="p-4 flex-1 space-y-3">
        {/* Results Count Header */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono text-slate-400">
            Showing <strong className="text-white font-bold">{exercises.length}</strong> calibrated movements
          </span>
          {loading && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#10b981]">
              <div className="w-3 h-3 border border-[#10b981] border-t-transparent rounded-full animate-spin" />
              <span>Scanning matrix...</span>
            </div>
          )}
        </div>

        {/* Loading / Error / Empty States */}
        {loading && exercises.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
            <p className="text-xs text-slate-400 font-mono">Calibrating biomechanical matrix...</p>
          </div>
        ) : fetchError ? (
          <div className="py-16 text-center space-y-3 p-8 bg-[#0f1724] rounded-2xl border border-rose-500/30 shadow-sm">
            <Dumbbell className="w-10 h-10 text-rose-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                Matrix Index Temporarily Offline
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">{fetchError}</p>
            </div>
            <button
              type="button"
              onClick={() => setRetryNonce((n) => n + 1)}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#142032] hover:bg-[#1b2d47] text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition cursor-pointer active:scale-95"
            >
              Retry Connection
            </button>
          </div>
        ) : exercises.length === 0 ? (
          <div className="py-20 text-center space-y-3 p-8 bg-[#0f1724] rounded-2xl border border-[#1b2d47] shadow-sm">
            <Dumbbell className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                No Movements Matched
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                No exercise found matching your active hardware and muscle criteria.
              </p>
            </div>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#142032] hover:bg-[#1b2d47] text-[#10b981] border border-[#10b981]/40 text-xs font-mono font-bold transition cursor-pointer active:scale-95"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {exercises.map((ex) => {
              const videoUrl = resolveExerciseVideoUrl(ex.name, {
                explicitVideoUrl: (ex as unknown as { videoUrl?: string }).videoUrl,
              });
              const primaryTarget = ex.target || ex.bodyPart || "chest";
              const setupCue = extractShortCue(ex.instructions);

              return (
                <div
                  key={ex.id}
                  className="w-full rounded-2xl bg-[#0f1724] border border-[#1b2d47] hover:border-cyan-500/50 hover:bg-[#142032]/70 transition-all duration-200 p-3.5 space-y-3 shadow-md relative group"
                >
                  <div className="flex items-start gap-3">
                    {/* Integrated Vector Anatomical Spotlight (64x64) */}
                    <div className="w-16 h-18 rounded-xl bg-[#05080c] border border-[#1b2d47] flex items-center justify-center shrink-0 overflow-hidden relative group-hover:border-cyan-500/40 transition">
                      <AnatomicalTensionSpotlight
                        primaryMuscle={primaryTarget}
                        secondaryMuscles={ex.secondaryMuscles || []}
                        accentColor="emerald"
                        showToggle={false}
                        className="w-14 h-16 scale-95"
                      />
                    </div>

                    {/* Main Content Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Tags Bar */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-mono uppercase font-bold text-[#10b981] px-2 py-0.5 rounded bg-[#10b981]/15 border border-[#10b981]/30">
                          {ex.bodyPart}
                        </span>
                        <span className="text-[9px] font-mono uppercase font-semibold text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25">
                          {ex.equipment}
                        </span>
                        {ex.target && (
                          <span className="text-[9px] font-mono text-slate-400 truncate">
                            · {ex.target}
                          </span>
                        )}
                      </div>

                      {/* Movement Name */}
                      <h3
                        onClick={() => {
                          setSelectedExercise(ex);
                          setIsDetailOpen(true);
                        }}
                        className="text-base font-display font-extrabold text-white tracking-wide truncate group-hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        {formatExerciseName(ex.name)}
                      </h3>

                      {/* Distilled Biomechanical Cue */}
                      <p className="text-[11px] text-slate-400 font-mono truncate leading-relaxed">
                        &quot;{setupCue}&quot;
                      </p>

                      {/* Synergists */}
                      {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
                        <p className="text-[10px] text-slate-500 font-mono truncate">
                          Synergists:{" "}
                          <span className="text-slate-400">
                            {ex.secondaryMuscles
                              .slice(0, 3)
                              .map(formatExerciseName)
                              .join(", ")}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Strip: Direct Form Video & Detailed Cues */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#1b2d47]/70 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setVideoModalExercise({ ...ex, videoUrl })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#05080c] hover:bg-[#142032] border border-[#1b2d47] text-cyan-400 hover:text-cyan-300 font-bold transition active:scale-95 cursor-pointer text-[11px]"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Form Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExercise(ex);
                        setIsDetailOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/30 text-[#10b981] font-bold transition active:scale-95 cursor-pointer text-[11px]"
                    >
                      <span>Cues &amp; Swaps</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 3. INTERACTIVE ANATOMICAL BODY MAP (BOTTOM SHEET) */}
      <Sheet open={isBodyMapSheetOpen} onOpenChange={setIsBodyMapSheetOpen}>
        <SheetContent
          side="bottom"
          className="bg-[#05080c] border-t border-[#1b2d47] p-5 max-w-md mx-auto rounded-t-3xl text-slate-100 max-h-[88vh] overflow-y-auto no-scrollbar space-y-4 shadow-2xl"
        >
          <SheetHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base font-display uppercase tracking-wider font-extrabold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#10b981]" />
                <span>Anatomical Musculature Scanner</span>
              </SheetTitle>
              <button
                type="button"
                onClick={() => setIsBodyMapSheetOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#142032] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SheetDescription className="text-xs text-slate-400 font-mono">
              Tap any muscle group to filter the matrix index across anterior or posterior views.
            </SheetDescription>
          </SheetHeader>

          <AnatomicalBodyMap
            selectedMuscle={selectedMuscle}
            onSelectMuscle={(mId) => {
              setSelectedMuscle(mId);
            }}
          />

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsBodyMapSheetOpen(false)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#10b981] via-emerald-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-[#05080c] font-display uppercase tracking-wider font-black text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] transition cursor-pointer active:scale-[0.98]"
            >
              Filter Matrix ({selectedMuscle === "all" ? "All Chains" : selectedMuscle.toUpperCase()})
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* 4. EXERCISE DETAIL SHEET (WITH SUBSTITUTIONS & CUES) */}
      <ExerciseDetailSheet
        exercise={selectedExercise}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      {/* 5. INLINE DEMONSTRATION VIDEO MODAL */}
      <ExerciseVideoModal
        isOpen={Boolean(videoModalExercise)}
        onClose={() => setVideoModalExercise(null)}
        exercise={videoModalExercise}
      />
    </div>
  );
}
