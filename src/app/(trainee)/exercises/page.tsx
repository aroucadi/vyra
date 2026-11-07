"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import { RagExercise } from "@/types/exercise-rag";
import { ExerciseDetailSheet } from "@/components/trainee/ExerciseDetailSheet";
import { AnatomicalBodyMap } from "@/components/trainee/AnatomicalBodyMap";
import { TraineeNav } from "@/components/trainee/TraineeNav";
import { VyraLogo } from "@/components/brand/VyraLogo";
import {
  Search,
  Dumbbell,
  Filter,
  ArrowLeft,
  X,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  RotateCcw,
  Layers,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";

// Tactile Gym Muscle Hubs (Mapped to biomechanical kinetic chains)
const MUSCLE_CHAINS = [
  { id: "all", label: "All Chains", short: "All" },
  { id: "chest", label: "Pectorals (Chest)", short: "Chest" },
  { id: "lats", label: "Back & Lats", short: "Back" },
  { id: "shoulders", label: "Deltoids (Shoulders)", short: "Delts" },
  { id: "quads", label: "Quadriceps & Thighs", short: "Quads" },
  { id: "hamstrings", label: "Hamstrings & Glutes", short: "Hams" },
  { id: "biceps", label: "Biceps Brachii", short: "Biceps" },
  { id: "triceps", label: "Triceps Brachii", short: "Triceps" },
  { id: "waist", label: "Core & Abdominals", short: "Core" },
  { id: "calves", label: "Calves & Posterior Chain", short: "Calves" },
];

// Gym Floor Equipment Types
const EQUIPMENT_HUBS = [
  { id: "all", label: "All Equipment", icon: "⚡" },
  { id: "barbell", label: "Barbell", icon: "🏋️" },
  { id: "dumbbell", label: "Dumbbell", icon: "🦾" },
  { id: "cable", label: "Cable & Pulley", icon: "🔗" },
  { id: "lever", label: "Plate Loaded Machine", icon: "⚙️" },
  { id: "body weight", label: "Bodyweight & Calisthenics", icon: "🤸" },
  { id: "smith", label: "Smith Machine", icon: "📐" },
];

// Quick Gym Intent Shortcuts (One-tap searches between sets)
const GYM_SHORTHANDS = [
  { label: "RDL", query: "rdl" },
  { label: "Lat Pulldown", query: "lat pulldown" },
  { label: "Incline Press", query: "incline" },
  { label: "Lateral Raise", query: "lateral raise" },
  { label: "Squat", query: "squat" },
  { label: "Pushdown", query: "pushdown" },
  { label: "Cable Fly", query: "cable fly" },
  { label: "Leg Curl", query: "leg curl" },
];

export default function TraineeExerciseLibraryPage() {
  const [query, setQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("all");
  const [selectedEquipment, setSelectedEquipment] = useState("all");
  const [showBodyMap, setShowBodyMap] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<"quick" | "muscle" | "equipment">("quick");
  const [exercises, setExercises] = useState<RagExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<RagExercise | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Active filter counting
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
            setLoading(false);
          });
        }
      } catch (err) {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(fetchExercises, 90);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, selectedMuscle, selectedEquipment]);

  const activeMuscleMeta = MUSCLE_CHAINS.find((m) => m.id === selectedMuscle);
  const activeEquipMeta = EQUIPMENT_HUBS.find((e) => e.id === selectedEquipment);

  return (
    <div className="min-h-screen bg-[#090C11] text-slate-100 pb-28 max-w-md mx-auto flex flex-col font-body selection:bg-amber-500/20">
      {/* 1. Tactical Gym Header */}
      <header className="sticky top-0 z-30 bg-[#090C11]/95 backdrop-blur-md border-b border-[#1C2436] px-4 pt-3 pb-2.5 space-y-2.5">
        {/* Brand & Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/program"
              aria-label="Back to Program"
              className="min-w-[40px] min-h-[40px] rounded-xl bg-[#111622] border border-[#1C2436] text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <VyraLogo size="xs" variant="wordmark" />
                <span className="w-px h-3 bg-[#1C2436]" />
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                  Movement Index
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                6,554 Biomechanical Protocols
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 1-Tap Anatomical Body Map Toggle */}
            <button
              type="button"
              onClick={() => setShowBodyMap((prev) => !prev)}
              className={clsx(
                "min-h-[36px] px-3 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 border",
                showBodyMap
                  ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                  : selectedMuscle !== "all"
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                  : "bg-[#111622] text-slate-300 border-[#1C2436] hover:bg-[#182030]"
              )}
              title="Toggle Interactive Anatomical Musculature Map"
            >
              <Zap className={clsx("w-3.5 h-3.5", showBodyMap ? "fill-slate-950" : "text-amber-400")} />
              <span>{showBodyMap ? "Close Map" : "Body Map"}</span>
              {selectedMuscle !== "all" && !showBodyMap && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* 2. Tactical Search Input Field with Clear Button */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises, variations, mechanics..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#111622] border border-[#1C2436] focus:border-amber-400/80 focus:bg-[#141B2B] focus:outline-none text-xs text-white placeholder:text-slate-500 font-mono transition-all shadow-inner"
          />
          {query.trim() && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#182030] transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3. Tactical Mode Switcher (Quick Staples / Muscle Chains / Equipment) */}
        <div className="grid grid-cols-3 gap-1 p-0.5 rounded-xl bg-[#090C11] border border-[#1C2436]">
          <button
            type="button"
            onClick={() => setActiveFilterTab("quick")}
            className={clsx(
              "py-1 text-[11px] font-mono font-semibold rounded-lg transition cursor-pointer text-center",
              activeFilterTab === "quick"
                ? "bg-[#182030] text-amber-300 font-bold border border-amber-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Quick Picks
          </button>
          <button
            type="button"
            onClick={() => setActiveFilterTab("muscle")}
            className={clsx(
              "py-1 text-[11px] font-mono font-semibold rounded-lg transition cursor-pointer text-center flex items-center justify-center gap-1",
              activeFilterTab === "muscle"
                ? "bg-[#182030] text-amber-300 font-bold border border-amber-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <span>Muscles</span>
            {selectedMuscle !== "all" && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilterTab("equipment")}
            className={clsx(
              "py-1 text-[11px] font-mono font-semibold rounded-lg transition cursor-pointer text-center flex items-center justify-center gap-1",
              activeFilterTab === "equipment"
                ? "bg-[#182030] text-amber-300 font-bold border border-amber-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <span>Equipment</span>
            {selectedEquipment !== "all" && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>
        </div>

        {/* 4. Filter Tray Carousel based on Active Tab */}
        <div className="pt-0.5">
          {/* TAB 1: Quick Gym Staples */}
          {activeFilterTab === "quick" && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {GYM_SHORTHANDS.map((item) => {
                const isActive = query.toLowerCase() === item.query.toLowerCase();
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setQuery(isActive ? "" : item.query)}
                    className={clsx(
                      "px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold whitespace-nowrap shrink-0 border transition cursor-pointer active:scale-95",
                      isActive
                        ? "bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-xs"
                        : "bg-[#111622] text-slate-300 border-[#1C2436] hover:bg-[#182030] hover:text-white"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: Muscle Groups */}
          {activeFilterTab === "muscle" && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {MUSCLE_CHAINS.map((m) => {
                const isSelected = selectedMuscle === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMuscle(m.id)}
                    className={clsx(
                      "px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold whitespace-nowrap shrink-0 border transition cursor-pointer active:scale-95",
                      isSelected
                        ? "bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-xs"
                        : "bg-[#111622] text-slate-300 border-[#1C2436] hover:bg-[#182030] hover:text-white"
                    )}
                  >
                    {m.short}
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 3: Equipment Types */}
          {activeFilterTab === "equipment" && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {EQUIPMENT_HUBS.map((eq) => {
                const isSelected = selectedEquipment === eq.id;
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => setSelectedEquipment(eq.id)}
                    className={clsx(
                      "px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold whitespace-nowrap shrink-0 border transition cursor-pointer active:scale-95 flex items-center gap-1.5",
                      isSelected
                        ? "bg-sky-500/20 text-sky-300 border-sky-400 font-bold shadow-xs"
                        : "bg-[#111622] text-slate-300 border-[#1C2436] hover:bg-[#182030] hover:text-white"
                    )}
                  >
                    <span>{eq.icon}</span>
                    <span>{eq.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Active Filters Breadcrumb & Count Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1C2436] text-[10px] font-mono animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-slate-400">Filtering:</span>
              {selectedMuscle !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                  <span>{activeMuscleMeta?.short || selectedMuscle}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedMuscle("all")}
                    className="hover:text-white cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedEquipment !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold">
                  <span>{activeEquipMeta?.label || selectedEquipment}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedEquipment("all")}
                    className="hover:text-white cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {query.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#182030] text-slate-300 border border-[#1C2436]">
                  <span>&quot;{query}&quot;</span>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="hover:text-white cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={resetAllFilters}
              className="text-amber-400 hover:text-amber-300 transition cursor-pointer font-bold shrink-0 flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </header>

      {/* 2. Main Content View */}
      <main className="p-4 flex-1 space-y-3">
        {/* Interactive Anatomical Silhouette (Progressive Disclosure) */}
        {showBodyMap && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <AnatomicalBodyMap
              selectedMuscle={selectedMuscle}
              onSelectMuscle={(mId) => setSelectedMuscle(mId)}
            />
          </div>
        )}

        {/* Results Count & Biomechanical Scope */}
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="text-[11px] font-mono text-slate-400">
            Showing <strong className="text-white">{exercises.length}</strong> movements
          </span>
          {loading && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400">
              <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>Searching...</span>
            </div>
          )}
        </div>

        {/* Exercise Card List */}
        {loading && exercises.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Calibrating biomechanical index...</p>
          </div>
        ) : exercises.length === 0 ? (
          <div className="py-16 text-center space-y-3 p-6 bg-[#111622] rounded-3xl border border-[#1C2436] shadow-sm">
            <Dumbbell className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white font-editorial">No movements matched</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-body">
                We couldn&apos;t find an exercise matching your active search and equipment criteria.
              </p>
            </div>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-[#182030] hover:bg-[#222D42] text-amber-300 border border-amber-500/40 text-xs font-mono font-bold transition cursor-pointer active:scale-95"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  setSelectedExercise(ex);
                  setIsDetailOpen(true);
                }}
                className="w-full text-left p-4 rounded-2xl bg-[#111622] hover:bg-[#182030] active:scale-[0.99] border border-[#1C2436] hover:border-amber-500/40 transition-all duration-150 flex items-center justify-between gap-3 group cursor-pointer shadow-sm relative overflow-hidden"
              >
                {/* Active Hover Accent Strip */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-1.5 min-w-0 flex-1">
                  {/* Category Eyebrow & Equipment Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-mono uppercase font-bold text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25">
                      {ex.bodyPart}
                    </span>
                    <span className="text-[9px] font-mono uppercase text-slate-300 px-2 py-0.5 rounded-md bg-[#182030] border border-[#1C2436]">
                      {ex.equipment}
                    </span>
                    {ex.target && (
                      <span className="text-[9px] font-mono text-slate-400 truncate">
                        · {ex.target}
                      </span>
                    )}
                  </div>

                  {/* Movement Name */}
                  <h3 className="text-sm font-bold text-white tracking-tight truncate group-hover:text-amber-300 transition-colors font-editorial">
                    {ex.name}
                  </h3>

                  {/* Secondary Muscle Involvement */}
                  {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      Synergists:{" "}
                      <span className="text-slate-300">
                        {ex.secondaryMuscles.slice(0, 2).join(", ")}
                      </span>
                    </p>
                  )}
                </div>

                {/* Right Arrow Action Icon */}
                <div className="w-8 h-8 rounded-xl bg-[#090C11] border border-[#1C2436] flex items-center justify-center shrink-0 group-hover:border-amber-500/50 group-hover:bg-[#141B2B] transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* 3. Slide-Up Exercise Detail Sheet */}
      <ExerciseDetailSheet
        exercise={selectedExercise}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      {/* 4. Bottom Trainee Navigation */}
      <TraineeNav />
    </div>
  );
}
