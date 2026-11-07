"use client";

import React, { useState, useEffect } from "react";
import { clsx } from "clsx";

export interface AnatomicalBodyMapProps {
  selectedMuscle: string;
  onSelectMuscle?: (muscleId: string) => void;
  secondaryMuscles?: string[];
  mode?: "filter" | "visualizer";
  className?: string;
}

export type AnatomicalRegion =
  | "chest"
  | "shoulders"
  | "lats"
  | "biceps"
  | "triceps"
  | "waist"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

interface MuscleMeta {
  id: AnatomicalRegion;
  label: string;
  scientificName: string;
  biomechanicalAction: string;
  view: "front" | "back";
}

const MUSCLE_METADATA: Record<AnatomicalRegion, MuscleMeta> = {
  chest: {
    id: "chest",
    label: "Pectorals (Chest)",
    scientificName: "Pectoralis Major & Minor",
    biomechanicalAction: "Horizontal adduction, shoulder flexion & internal rotation",
    view: "front",
  },
  shoulders: {
    id: "shoulders",
    label: "Deltoids (Shoulders)",
    scientificName: "Anterior, Lateral & Posterior Deltoid",
    biomechanicalAction: "Glenohumeral abduction, flexion & horizontal abduction",
    view: "front",
  },
  lats: {
    id: "lats",
    label: "Lats & Upper Back",
    scientificName: "Latissimus Dorsi, Rhomboids & Trapezius",
    biomechanicalAction: "Shoulder extension, scapular retraction & depression",
    view: "back",
  },
  biceps: {
    id: "biceps",
    label: "Biceps Brachii",
    scientificName: "Biceps Brachii & Brachialis",
    biomechanicalAction: "Elbow flexion & radioulnar supination",
    view: "front",
  },
  triceps: {
    id: "triceps",
    label: "Triceps Brachii",
    scientificName: "Triceps (Long, Lateral & Medial Heads)",
    biomechanicalAction: "Elbow extension & shoulder stabilization",
    view: "back",
  },
  waist: {
    id: "waist",
    label: "Core & Abdominals",
    scientificName: "Rectus Abdominis & Obliques",
    biomechanicalAction: "Spinal flexion, anti-rotation & intra-abdominal pressure",
    view: "front",
  },
  quads: {
    id: "quads",
    label: "Quadriceps (Front Thigh)",
    scientificName: "Rectus Femoris, Vastus Medialis & Lateralis",
    biomechanicalAction: "Knee extension & hip flexion stabilization",
    view: "front",
  },
  hamstrings: {
    id: "hamstrings",
    label: "Hamstrings (Rear Thigh)",
    scientificName: "Biceps Femoris & Semitendinosus",
    biomechanicalAction: "Knee flexion & hip hinge extension",
    view: "back",
  },
  glutes: {
    id: "glutes",
    label: "Gluteal Complex",
    scientificName: "Gluteus Maximus, Medius & Minimus",
    biomechanicalAction: "Hip extension, abduction & external rotation",
    view: "back",
  },
  calves: {
    id: "calves",
    label: "Calves",
    scientificName: "Gastrocnemius & Soleus",
    biomechanicalAction: "Ankle plantarflexion & kinetic force transfer",
    view: "back",
  },
};

export function AnatomicalBodyMap({
  selectedMuscle,
  onSelectMuscle,
  secondaryMuscles = [],
  mode = "filter",
  className,
}: AnatomicalBodyMapProps) {
  const normalizedPrimary = (selectedMuscle || "").toLowerCase();
  const normalizedSecondaries = secondaryMuscles.map((m) => m.toLowerCase());

  // Determine back-dominance
  const isBackDominant =
    normalizedPrimary.includes("lat") ||
    normalizedPrimary.includes("back") ||
    normalizedPrimary.includes("hamstring") ||
    normalizedPrimary.includes("tricep") ||
    normalizedPrimary.includes("glute") ||
    normalizedPrimary.includes("trap");

  const [view, setView] = useState<"front" | "back">(isBackDominant ? "back" : "front");

  useEffect(() => {
    if (mode === "visualizer" || (selectedMuscle && selectedMuscle !== "all")) {
      const activeMeta = Object.values(MUSCLE_METADATA).find((m) => isPrimary(m.id));
      if (activeMeta) {
        setView(activeMeta.view);
      }
    }
  }, [normalizedPrimary, mode]);

  const isPrimary = (muscleId: string) => {
    if (!normalizedPrimary || normalizedPrimary === "all") return false;
    return (
      normalizedPrimary.includes(muscleId) ||
      (muscleId === "chest" && normalizedPrimary.includes("pec")) ||
      (muscleId === "lats" && (normalizedPrimary.includes("back") || normalizedPrimary.includes("lat") || normalizedPrimary.includes("trap"))) ||
      (muscleId === "waist" && (normalizedPrimary.includes("abs") || normalizedPrimary.includes("core") || normalizedPrimary.includes("abdom"))) ||
      (muscleId === "quads" && (normalizedPrimary.includes("quad") || normalizedPrimary.includes("thigh"))) ||
      (muscleId === "hamstrings" && (normalizedPrimary.includes("ham") || normalizedPrimary.includes("rear thigh"))) ||
      (muscleId === "glutes" && (normalizedPrimary.includes("glute") || normalizedPrimary.includes("hip"))) ||
      (muscleId === "shoulders" && (normalizedPrimary.includes("delt") || normalizedPrimary.includes("shoulder"))) ||
      (muscleId === "biceps" && (normalizedPrimary.includes("bicep") || normalizedPrimary.includes("arm"))) ||
      (muscleId === "triceps" && normalizedPrimary.includes("tricep")) ||
      (muscleId === "calves" && (normalizedPrimary.includes("calf") || normalizedPrimary.includes("calves")))
    );
  };

  const isSecondary = (muscleId: string) => {
    if (isPrimary(muscleId)) return false;
    return normalizedSecondaries.some(
      (sec) =>
        sec.includes(muscleId) ||
        (muscleId === "chest" && sec.includes("pec")) ||
        (muscleId === "lats" && (sec.includes("back") || sec.includes("lat"))) ||
        (muscleId === "waist" && (sec.includes("abs") || sec.includes("core"))) ||
        (muscleId === "shoulders" && (sec.includes("delt") || sec.includes("shoulder"))) ||
        (muscleId === "triceps" && sec.includes("tricep")) ||
        (muscleId === "biceps" && sec.includes("bicep")) ||
        (muscleId === "glutes" && sec.includes("glute")) ||
        (muscleId === "hamstrings" && sec.includes("ham"))
    );
  };

  const activeRegionId = Object.keys(MUSCLE_METADATA).find((k) => isPrimary(k)) as
    | AnatomicalRegion
    | undefined;
  const activeMeta = activeRegionId ? MUSCLE_METADATA[activeRegionId] : null;

  const handleRegionClick = (regionId: AnatomicalRegion) => {
    if (!onSelectMuscle) return;
    if (isPrimary(regionId)) {
      onSelectMuscle("all");
    } else {
      onSelectMuscle(regionId);
    }
  };

  const getMuscleStyle = (regionId: AnatomicalRegion) => {
    const primary = isPrimary(regionId);
    const secondary = isSecondary(regionId);

    if (primary) {
      return {
        fill: "#F59E0B",
        stroke: "#FBBF24",
        strokeWidth: "1.5",
        filter: "url(#amberMuscularGlow)",
        className: "cursor-pointer transition-all duration-300 drop-shadow-md",
      };
    }
    if (secondary) {
      return {
        fill: "#06B6D4",
        stroke: "#22D3EE",
        strokeWidth: "1.2",
        filter: "url(#cyanMuscularGlow)",
        className: "cursor-pointer transition-all duration-300",
      };
    }
    return {
      fill: "#182030",
      stroke: "#26324A",
      strokeWidth: "1",
      className:
        "cursor-pointer hover:fill-[#222D42] hover:stroke-slate-500 transition-all duration-200",
    };
  };

  return (
    <div
      className={clsx(
        "p-4 rounded-3xl bg-[#111622] border border-[#1C2436] space-y-3 font-body shadow-xl relative overflow-hidden",
        className
      )}
    >
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1C2436_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

      {/* 1. Top Header with Anterior / Posterior Toggle */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#F59E0B]" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
              {mode === "visualizer" ? "Biomechanical Activation" : "Tactile Anatomical Selector"}
            </span>
          </div>
          <h4 className="text-sm font-editorial font-bold text-white tracking-tight">
            {mode === "visualizer" ? "Target Muscle Spotlight" : "Interactive Musculature Map"}
          </h4>
        </div>

        {/* View Switcher Pill */}
        <div className="flex items-center rounded-xl bg-[#090C11] p-1 border border-[#1C2436] shadow-inner">
          <button
            type="button"
            onClick={() => setView("front")}
            className={clsx(
              "px-3 py-1 text-[10px] font-mono font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5",
              view === "front"
                ? "bg-amber-400 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
            title="Switch to Anterior (Front) View"
          >
            <span>Anterior</span>
          </button>
          <button
            type="button"
            onClick={() => setView("back")}
            className={clsx(
              "px-3 py-1 text-[10px] font-mono font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5",
              view === "back"
                ? "bg-amber-400 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
            title="Switch to Posterior (Back) View"
          >
            <span>Posterior</span>
          </button>
        </div>
      </div>

      {/* 2. Precision Sculpted SVG Silhouette */}
      <div className="relative z-10 w-full max-w-[240px] mx-auto aspect-[1.1] select-none flex items-center justify-center py-1">
        <svg
          viewBox="0 0 100 135"
          className="w-full h-full max-h-[220px] transition-all duration-300 drop-shadow-lg"
          role="img"
          aria-label={`Interactive musculature body map showing ${view} anatomy`}
        >
          <defs>
            <filter id="amberMuscularGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F59E0B" floodOpacity="0.85" />
            </filter>
            <filter id="cyanMuscularGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#06B6D4" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* Cranium & Cervical Spine (Neutral Architectural Base) */}
          <circle cx="50" cy="11" r="7" fill="#090C11" stroke="#1C2436" strokeWidth="1" />
          <rect x="47" y="18" width="6" height="5" rx="1" fill="#090C11" stroke="#1C2436" strokeWidth="1" />

          {/* ---------------- ANTERIOR (FRONT) VIEW ---------------- */}
          {view === "front" && (
            <g id="anterior-view-group" className="animate-in fade-in-50 duration-200">
              {/* Shoulders / Deltoids */}
              <g onClick={() => handleRegionClick("shoulders")}>
                <title>Shoulders (Anterior & Lateral Deltoids)</title>
                <path d="M 28 26 C 22 26 21 34 22 39 C 24 39 29 37 31 34 Z" {...getMuscleStyle("shoulders")} />
                <path d="M 72 26 C 78 26 79 34 78 39 C 76 39 71 37 69 34 Z" {...getMuscleStyle("shoulders")} />
              </g>

              {/* Chest / Pectoralis Major */}
              <g onClick={() => handleRegionClick("chest")}>
                <title>Chest (Pectoralis Major)</title>
                <path d="M 32 27 C 42 27 49 29 49 39 C 43 42 35 42 31 37 Z" {...getMuscleStyle("chest")} />
                <path d="M 68 27 C 58 27 51 29 51 39 C 57 42 65 42 69 37 Z" {...getMuscleStyle("chest")} />
              </g>

              {/* Biceps Brachii */}
              <g onClick={() => handleRegionClick("biceps")}>
                <title>Biceps Brachii</title>
                <path d="M 19 39 C 18 45 19 53 23 55 C 25 53 26 46 25 40 Z" {...getMuscleStyle("biceps")} />
                <path d="M 81 39 C 82 45 81 53 77 55 C 75 53 74 46 75 40 Z" {...getMuscleStyle("biceps")} />
              </g>

              {/* Forearms (Neutral Kinematics) */}
              <path d="M 18 57 C 16 64 16 72 19 75 C 21 74 23 66 22 58 Z" fill="#090C11" stroke="#1C2436" strokeWidth="1" />
              <path d="M 82 57 C 84 64 84 72 81 75 C 79 74 77 66 78 58 Z" fill="#090C11" stroke="#1C2436" strokeWidth="1" />

              {/* Core / Abdominals */}
              <g onClick={() => handleRegionClick("waist")}>
                <title>Core & Abdominals</title>
                <path d="M 38 43 C 44 43 49 43 49 61 C 44 62 38 60 38 52 Z" {...getMuscleStyle("waist")} />
                <path d="M 62 43 C 56 43 51 43 51 61 C 56 62 62 60 62 52 Z" {...getMuscleStyle("waist")} />
              </g>

              {/* Pelvis / Hip Hinge Neutral Frame */}
              <path d="M 39 63 H 61 L 57 73 H 43 Z" fill="#090C11" stroke="#1C2436" strokeWidth="1" />

              {/* Quadriceps */}
              <g onClick={() => handleRegionClick("quads")}>
                <title>Quadriceps Femoris</title>
                <path d="M 37 75 C 36 84 35 96 38 103 C 43 103 46 95 47 75 Z" {...getMuscleStyle("quads")} />
                <path d="M 63 75 C 64 84 65 96 62 103 C 57 103 54 95 53 75 Z" {...getMuscleStyle("quads")} />
              </g>

              {/* Calves (Anterior Tibialis / Calves) */}
              <g onClick={() => handleRegionClick("calves")}>
                <title>Calves & Tibialis</title>
                <path d="M 37 106 C 36 113 38 122 41 125 C 44 122 45 113 44 106 Z" {...getMuscleStyle("calves")} />
                <path d="M 63 106 C 64 113 62 122 59 125 C 56 122 55 113 56 106 Z" {...getMuscleStyle("calves")} />
              </g>
            </g>
          )}

          {/* ---------------- POSTERIOR (BACK) VIEW ---------------- */}
          {view === "back" && (
            <g id="posterior-view-group" className="animate-in fade-in-50 duration-200">
              {/* Upper Back / Traps / Lats */}
              <g onClick={() => handleRegionClick("lats")}>
                <title>Upper Back & Lats</title>
                <path d="M 32 23 C 43 21 57 21 68 23 C 65 31 35 31 32 23 Z" {...getMuscleStyle("lats")} />
                <path d="M 33 32 C 40 32 47 34 47 52 C 38 52 32 44 31 37 Z" {...getMuscleStyle("lats")} />
                <path d="M 67 32 C 60 32 53 34 53 52 C 62 52 68 44 69 37 Z" {...getMuscleStyle("lats")} />
              </g>

              {/* Rear Deltoids */}
              <g onClick={() => handleRegionClick("shoulders")}>
                <title>Rear Deltoids</title>
                <path d="M 28 26 C 22 26 21 34 22 39 C 24 39 29 37 31 34 Z" {...getMuscleStyle("shoulders")} />
                <path d="M 72 26 C 78 26 79 34 78 39 C 76 39 71 37 69 34 Z" {...getMuscleStyle("shoulders")} />
              </g>

              {/* Triceps Brachii */}
              <g onClick={() => handleRegionClick("triceps")}>
                <title>Triceps Brachii</title>
                <path d="M 19 39 C 18 45 19 53 23 55 C 25 53 26 46 25 40 Z" {...getMuscleStyle("triceps")} />
                <path d="M 81 39 C 82 45 81 53 77 55 C 75 53 74 46 75 40 Z" {...getMuscleStyle("triceps")} />
              </g>

              {/* Forearms (Posterior) */}
              <path d="M 18 57 C 16 64 16 72 19 75 C 21 74 23 66 22 58 Z" fill="#090C11" stroke="#1C2436" strokeWidth="1" />
              <path d="M 82 57 C 84 64 84 72 81 75 C 79 74 77 66 78 58 Z" fill="#090C11" stroke="#1C2436" strokeWidth="1" />

              {/* Glutes */}
              <g onClick={() => handleRegionClick("glutes")}>
                <title>Gluteal Complex</title>
                <path d="M 36 60 C 44 59 48 64 48 74 C 41 75 35 70 35 62 Z" {...getMuscleStyle("glutes")} />
                <path d="M 64 60 C 56 59 52 64 52 74 C 59 75 65 70 65 62 Z" {...getMuscleStyle("glutes")} />
              </g>

              {/* Hamstrings */}
              <g onClick={() => handleRegionClick("hamstrings")}>
                <title>Hamstrings Complex</title>
                <path d="M 36 76 C 36 86 36 97 39 103 C 44 103 46 95 47 76 Z" {...getMuscleStyle("hamstrings")} />
                <path d="M 64 76 C 64 86 64 97 61 103 C 56 103 54 95 53 76 Z" {...getMuscleStyle("hamstrings")} />
              </g>

              {/* Calves (Soleus & Gastrocnemius) */}
              <g onClick={() => handleRegionClick("calves")}>
                <title>Gastrocnemius & Soleus</title>
                <path d="M 37 106 C 36 113 38 122 41 125 C 44 122 45 113 44 106 Z" {...getMuscleStyle("calves")} />
                <path d="M 63 106 C 64 113 62 122 59 125 C 56 122 55 113 56 106 Z" {...getMuscleStyle("calves")} />
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* 3. Dynamic Muscle Readout HUD */}
      <div className="relative z-10 p-3 rounded-2xl bg-[#090C11] border border-[#1C2436] flex items-center justify-between gap-3 text-xs">
        {activeMeta ? (
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#F59E0B]" />
              <span className="font-bold text-white tracking-tight truncate font-editorial text-xs">
                {activeMeta.label}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {activeMeta.biomechanicalAction}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              Global Kinetic State
            </span>
            <span className="text-xs text-slate-300 font-semibold">
              Tap any muscle group to filter
            </span>
          </div>
        )}

        {onSelectMuscle && activeMeta && (
          <button
            type="button"
            onClick={() => onSelectMuscle("all")}
            className="px-2.5 py-1 rounded-lg bg-[#182030] hover:bg-[#222D42] text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold shrink-0 cursor-pointer transition active:scale-95"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* 4. Kinetic Legend */}
      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono px-1 text-slate-400 pt-0.5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_4px_#F59E0B]" />
            <span>Target ({selectedMuscle === "all" || !selectedMuscle ? "None" : selectedMuscle})</span>
          </span>
          {secondaryMuscles.length > 0 && (
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_4px_#06B6D4]" />
              <span>Synergist</span>
            </span>
          )}
        </div>
        <span className="text-slate-500">10 Muscle Chains</span>
      </div>
    </div>
  );
}
