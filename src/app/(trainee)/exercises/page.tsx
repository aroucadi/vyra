"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import { RagExercise } from "@/types/exercise-rag";
import { ExerciseDetailSheet } from "@/components/trainee/ExerciseDetailSheet";
import { AnatomicalBodyMap } from "@/components/trainee/AnatomicalBodyMap";
import { VyraLogo } from "@/components/brand/VyraLogo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Search,
  Dumbbell,
  ArrowLeft,
  X,
  ChevronRight,
  RotateCcw,
  Zap,
  SlidersHorizontal,
} from "lucide-react";
import { clsx } from "clsx";

interface QuickFilter {
  id: string;
  label: string;
  type: "muscle" | "equipment" | "all";
  value: string;
}

const PRIMARY_CHANNELS: QuickFilter[] = [
  { id: "all", label: "All", type: "all", value: "all" },
  { id: "chest", label: "Chest", type: "muscle", value: "chest" },
  { id: "lats", label: "Back & Lats", type: "muscle", value: "lats" },
  { id: "shoulders", label: "Shoulders", type: "muscle", value: "shoulders" },
  { id: "quads", label: "Quads", type: "muscle", value: "quads" },
  { id: "hamstrings", label: "Hamstrings", type: "muscle", value: "hamstrings" },
  { id: "biceps", label: "Biceps", type: "muscle", value: "biceps" },
  { id: "triceps", label: "Triceps", type: "muscle", value: "triceps" },
  { id: "waist", label: "Core & Abs", type: "muscle", value: "waist" },
  { id: "barbell", label: "Barbell", type: "equipment", value: "barbell" },
  { id: "dumbbell", label: "Dumbbell", type: "equipment", value: "dumbbell" },
  { id: "cable", label: "Cable", type: "equipment", value: "cable" },
  { id: "lever", label: "Machine", type: "equipment", value: "lever" },
  { id: "body weight", label: "Bodyweight", type: "equipment", value: "body weight" },
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

export default function TraineeExerciseLibraryPage() {
  const [query, setQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("all");
  const [selectedEquipment, setSelectedEquipment] = useState("all");
  const [isBodyMapSheetOpen, setIsBodyMapSheetOpen] = useState(false);
  const [exercises, setExercises] = useState<RagExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<RagExercise | null>(null);
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

  const handleChannelClick = (channel: QuickFilter) => {
    if (channel.type === "all") {
      resetAllFilters();
    } else if (channel.type === "muscle") {
      setSelectedMuscle((prev) => (prev === channel.value ? "all" : channel.value));
    } else if (channel.type === "equipment") {
      setSelectedEquipment((prev) => (prev === channel.value ? "all" : channel.value));
    }
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

  return (
    <div className="min-h-screen bg-[#090C11] text-slate-100 pb-44 w-full max-w-md mx-auto flex flex-col font-body selection:bg-amber-500/20 overflow-x-hidden">
      {/* 1. Spacious, Lightweight Sticky Header */}
      <header className="sticky top-0 z-30 bg-[#090C11]/95 backdrop-blur-md border-b border-[#1C2436] px-4 pt-3.5 pb-3 space-y-2.5 w-full overflow-hidden">
        {/* Tier 1: Brand & Top Bar */}
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Link
              href="/program"
              aria-label="Back to Program"
              className="w-9 h-9 rounded-xl bg-[#111622] border border-[#1C2436] text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <VyraLogo size="xs" variant="mark" />
                <span className="text-xs font-editorial font-bold text-white tracking-tight uppercase">
                  Vyra
                </span>
                <span className="w-px h-3 bg-[#1C2436] shrink-0" />
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider truncate">
                  Index
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                6,554 Protocols
              </p>
            </div>
          </div>

          {/* 1-Tap Body Map Modal Launcher */}
          <button
            type="button"
            onClick={() => setIsBodyMapSheetOpen(true)}
            className={clsx(
              "h-9 px-2.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 border shrink-0",
              selectedMuscle !== "all"
                ? "bg-amber-400 text-slate-950 border-amber-400 shadow-sm shadow-amber-500/20"
                : "bg-[#111622] text-slate-300 border-[#1C2436] hover:bg-[#182030] hover:text-white"
            )}
            title="Open Interactive Musculature Map"
          >
            <Zap className={clsx("w-3.5 h-3.5", selectedMuscle !== "all" ? "fill-slate-950" : "text-amber-400")} />
            <span>Body Map</span>
            {selectedMuscle !== "all" && (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 ml-0.5" />
            )}
          </button>
        </div>

        {/* Tier 2: Search Input Field */}
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises, variations..."
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

        {/* Tier 3: Unified Horizontal Biomechanical Focus Carousel (Single Clean Row) */}
        <div className="w-full overflow-hidden">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full">
            {PRIMARY_CHANNELS.map((ch) => {
              const isSelected =
                ch.type === "all"
                  ? selectedMuscle === "all" && selectedEquipment === "all" && !query.trim()
                  : ch.type === "muscle"
                  ? selectedMuscle === ch.value
                  : selectedEquipment === ch.value;

              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleChannelClick(ch)}
                  className={clsx(
                    "min-h-[34px] px-3 rounded-xl text-xs font-mono font-semibold whitespace-nowrap shrink-0 border transition-all cursor-pointer active:scale-95 flex items-center justify-center",
                    isSelected
                      ? "bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-xs"
                      : "bg-[#111622] text-slate-300 border-[#1C2436] hover:bg-[#182030] hover:text-white"
                  )}
                >
                  {ch.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filter Breadcrumbs & Summary */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1C2436] text-[10px] font-mono animate-in fade-in duration-150 w-full min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-slate-400 shrink-0">Filtering:</span>
              {selectedMuscle !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold">
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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#182030] text-slate-300 border border-[#1C2436] max-w-[130px] truncate">
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
              className="text-amber-400 hover:text-amber-300 transition cursor-pointer font-bold shrink-0 flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </header>

      {/* 2. Main Content Stream */}
      <main className="p-4 flex-1 space-y-3.5">
        {/* Results Count Header */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono text-slate-400">
            Showing <strong className="text-white font-bold">{exercises.length}</strong> movements
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
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Calibrating biomechanical index...</p>
          </div>
        ) : exercises.length === 0 ? (
          <div className="py-20 text-center space-y-3 p-8 bg-[#111622] rounded-3xl border border-[#1C2436] shadow-sm">
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
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#182030] hover:bg-[#222D42] text-amber-300 border border-amber-500/40 text-xs font-mono font-bold transition cursor-pointer active:scale-95"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  setSelectedExercise(ex);
                  setIsDetailOpen(true);
                }}
                className="w-full text-left p-4 sm:p-5 rounded-2xl bg-[#111622] hover:bg-[#161D2E] active:scale-[0.99] border border-[#1C2436] hover:border-amber-500/40 transition-all duration-150 flex items-center justify-between gap-3.5 group cursor-pointer shadow-sm relative overflow-hidden"
              >
                {/* Active Hover Accent Strip */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-2 min-w-0 flex-1">
                  {/* Category Eyebrow & Equipment Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25">
                      {ex.bodyPart}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-300 px-2.5 py-0.5 rounded-full bg-[#182030] border border-[#1C2436]">
                      {ex.equipment}
                    </span>
                    {ex.target && (
                      <span className="text-[10px] font-mono text-slate-400 truncate">
                        · {ex.target}
                      </span>
                    )}
                  </div>

                  {/* Movement Name (Title Cased & Authoritative) */}
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate group-hover:text-amber-300 transition-colors font-editorial">
                    {formatExerciseName(ex.name)}
                  </h3>

                  {/* Secondary Muscle Involvement */}
                  {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      Synergists:{" "}
                      <span className="text-slate-300">
                        {ex.secondaryMuscles.slice(0, 3).map(formatExerciseName).join(", ")}
                      </span>
                    </p>
                  )}
                </div>

                {/* Right Arrow Action Icon */}
                <div className="w-8 h-8 rounded-xl bg-[#090C11] border border-[#1C2436] flex items-center justify-center shrink-0 group-hover:border-amber-400 group-hover:bg-[#182030] transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* 3. Interactive Anatomical Body Map (Slide-Up Modal Sheet) */}
      <Sheet open={isBodyMapSheetOpen} onOpenChange={setIsBodyMapSheetOpen}>
        <SheetContent
          side="bottom"
          className="bg-[#090C11] border-t border-[#1C2436] p-5 max-w-md mx-auto rounded-t-3xl text-slate-100 max-h-[88vh] overflow-y-auto no-scrollbar space-y-4"
        >
          <SheetHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-editorial font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Interactive Musculature Map</span>
              </SheetTitle>
              <button
                type="button"
                onClick={() => setIsBodyMapSheetOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#182030] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SheetDescription className="text-xs text-slate-400 font-body">
              Tap any muscle group to filter the movement index. View anterior or posterior anatomy.
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
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-display font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-[0.98]"
            >
              Show Movements ({selectedMuscle === "all" ? "All" : selectedMuscle.toUpperCase()})
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* 4. Slide-Up Exercise Detail Sheet */}
      <ExerciseDetailSheet
        exercise={selectedExercise}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

    </div>
  );
}
