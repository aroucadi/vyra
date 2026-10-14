"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import { RagExercise } from "@/types/exercise-rag";
import { ExerciseDetailSheet } from "@/components/trainee/ExerciseDetailSheet";
import { AnatomicalBodyMap } from "@/components/trainee/AnatomicalBodyMap";
import { TraineeNav } from "@/components/trainee/TraineeNav";
import { Search, Dumbbell, Filter, ArrowLeft, Disc, Sparkles, ChevronRight, User } from "lucide-react";
import { clsx } from "clsx";

const MUSCLE_GROUPS = [
  { id: "all", label: "All Muscles" },
  { id: "chest", label: "Chest" },
  { id: "lats", label: "Back / Lats" },
  { id: "shoulders", label: "Shoulders" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "quads", label: "Quads" },
  { id: "hamstrings", label: "Hamstrings" },
  { id: "waist", label: "Core / Abs" },
];

const EQUIPMENT_TYPES = [
  { id: "all", label: "All Equipment" },
  { id: "barbell", label: "Barbell" },
  { id: "dumbbell", label: "Dumbbell" },
  { id: "cable", label: "Cable" },
  { id: "lever", label: "Machine" },
  { id: "body weight", label: "Bodyweight" },
  { id: "smith", label: "Smith Machine" },
];

export default function TraineeExerciseLibraryPage() {
  const [query, setQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("all");
  const [selectedEquipment, setSelectedEquipment] = useState("all");
  const [showBodyMap, setShowBodyMap] = useState(false);
  const [exercises, setExercises] = useState<RagExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<RagExercise | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [, startTransition] = useTransition();

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
        params.set("limit", "40");

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

    const timer = setTimeout(fetchExercises, 120);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, selectedMuscle, selectedEquipment]);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 pb-24 max-w-md mx-auto flex flex-col font-sans">
      {/* 1. Header (Negative constraint ceiling compliant) */}
      <header className="sticky top-0 z-30 bg-[#0B0F17]/95 backdrop-blur-md p-4 border-b border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/program"
              aria-label="Back to Program"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Movement Library</h1>
              <p className="text-[10px] font-mono text-slate-400">6,554 Biomechanical Movements</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowBodyMap((prev) => !prev)}
              className={clsx(
                "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition flex items-center gap-1 cursor-pointer",
                showBodyMap
                  ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm"
                  : "bg-slate-900 text-slate-300 border-slate-800 hover:text-white"
              )}
            >
              <User className="w-2.5 h-2.5" />
              <span>{showBodyMap ? "Hide Map" : "Body Map"}</span>
            </button>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold hidden sm:inline">
              Sub-1ms Engine
            </span>
          </div>
        </div>

        {/* Search Bar with Gym Shorthands Callout */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search (e.g., db, rdl, ohp, lat pulldown)..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500/60 focus:outline-none text-xs font-mono placeholder:text-slate-500 text-slate-100 transition"
          />
        </div>

        {/* Filter Chips: Muscle Groups */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {MUSCLE_GROUPS.map((m) => {
            const isSelected = selectedMuscle === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMuscle(m.id)}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition whitespace-nowrap shrink-0 border cursor-pointer",
                  isSelected
                    ? "bg-emerald-500 text-slate-950 border-emerald-500"
                    : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200"
                )}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Filter Chips: Equipment */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {EQUIPMENT_TYPES.map((eq) => {
            const isSelected = selectedEquipment === eq.id;
            return (
              <button
                key={eq.id}
                type="button"
                onClick={() => setSelectedEquipment(eq.id)}
                className={clsx(
                  "px-2 py-0.5 rounded-md text-[10px] font-mono transition whitespace-nowrap shrink-0 border cursor-pointer",
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                    : "bg-slate-950 text-slate-500 border-slate-800/80 hover:text-slate-300"
                )}
              >
                {eq.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* 2. Main List of Exercises */}
      <main className="p-4 flex-1 space-y-3">
        {/* Interactive Anatomical Silhouette (Progressive Disclosure) */}
        {showBodyMap && (
          <AnatomicalBodyMap
            selectedMuscle={selectedMuscle}
            onSelectMuscle={(mId) => setSelectedMuscle(mId)}
          />
        )}
        {loading && exercises.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Indexing catalogue...</p>
          </div>
        ) : exercises.length === 0 ? (
          <div className="py-12 text-center space-y-2 p-6 bg-slate-900/40 rounded-2xl border border-slate-800/80">
            <Dumbbell className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">No exercises found</p>
            <p className="text-[11px] text-slate-500">
              Try adjusting your query or resetting muscle/equipment filters.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  setSelectedExercise(ex);
                  setIsDetailOpen(true);
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between gap-3 group cursor-pointer"
              >
                {/* 3-Element Vertical Ceiling: Category Eyebrow, Hero Name, Target/Equipment */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono uppercase font-bold text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/10">
                      {ex.bodyPart}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      · {ex.equipment}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white tracking-tight truncate group-hover:text-emerald-300 transition">
                    {ex.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Target: <span className="text-slate-300">{ex.target}</span>
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition shrink-0" />
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
