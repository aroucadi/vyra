"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, Dumbbell, ArrowLeft, ExternalLink, Video, CheckCircle2 } from "lucide-react";
import { appStore } from "@/lib/store";
import { Exercise } from "@/lib/types";

export default function ExercisesPage() {
  const [exercises, setExercises] = useState(appStore.getExercises());
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // New exercise form
  const [name, setName] = useState("");
  const [primaryMuscle, setPrimaryMuscle] = useState("Chest");
  const [equipment, setEquipment] = useState("Barbell");
  const [videoUrl, setVideoUrl] = useState("");

  const muscles = ["all", "Chest", "Upper Chest", "Lats", "Upper Back", "Side Deltoids", "Quads", "Hamstrings", "Triceps", "Biceps"];

  const filtered = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = selectedMuscle === "all" || ex.primaryMuscle.toLowerCase() === selectedMuscle.toLowerCase();
    return matchesSearch && matchesMuscle;
  });

  const handleCreateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newEx = appStore.addExercise({
      name,
      primaryMuscle,
      secondaryMuscles: [],
      equipment,
      videoUrl: videoUrl || undefined,
    });

    setExercises([...appStore.getExercises()]);
    setShowAddModal(false);
    setName("");
    setVideoUrl("");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/roster"
            className="p-2 rounded-lg bg-[#162032] border border-[#334155] text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Exercise & Movement Library</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Standardized biomechanical movement patterns with video cues.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] text-slate-950 font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Movement
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search exercises by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#162032] border border-[#334155] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#10B981]"
          />
        </div>

        {/* Muscle group chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
          {muscles.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMuscle(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition ${
                selectedMuscle === m
                  ? "bg-[#10B981] text-slate-950 font-bold"
                  : "bg-[#162032] text-slate-400 hover:text-white border border-[#1E293B]"
              }`}
            >
              {m === "all" ? "All Muscles" : m}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((ex) => (
          <div
            key={ex.id}
            className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] hover:border-slate-700 transition space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-white">{ex.name}</h3>
                <span className="px-2 py-0.5 rounded bg-[#0F172A] border border-[#334155] text-[10px] font-mono text-[#06B6D4]">
                  {ex.equipment}
                </span>
              </div>
              <p className="text-xs text-[#10B981] font-mono mt-1">{ex.primaryMuscle}</p>
              {ex.secondaryMuscles.length > 0 && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Assisting: {ex.secondaryMuscles.join(", ")}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-[#1E293B]/60 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[10px]">ID: {ex.id}</span>
              {ex.videoUrl && (
                <a
                  href={ex.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#06B6D4] hover:underline text-[11px]"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Exercise Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#162032] border border-[#334155] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-white">Add Custom Movement</h3>
            <form onSubmit={handleCreateExercise} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-mono text-[10px] uppercase">Exercise Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bulgarian Split Squat"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-mono text-[10px] uppercase">Primary Muscle</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quads"
                    value={primaryMuscle}
                    onChange={(e) => setPrimaryMuscle(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-mono text-[10px] uppercase">Equipment</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dumbbells"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-mono text-[10px] uppercase">Video Guide URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-slate-950 font-black text-xs uppercase tracking-wider"
                >
                  Save Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
