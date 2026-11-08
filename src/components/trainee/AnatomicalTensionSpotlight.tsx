"use client";

import React, { useState, useEffect } from "react";
import { clsx } from "clsx";

export type MuscleRegion =
  | "chest"
  | "shoulders"
  | "lats"
  | "quads"
  | "hamstrings"
  | "biceps"
  | "triceps"
  | "calves"
  | "glutes"
  | "core";

interface AnatomicalTensionSpotlightProps {
  primaryMuscle?: string;
  secondaryMuscles?: string[];
  className?: string;
  showToggle?: boolean;
  accentColor?: "amber" | "emerald";
}

// Normalized mapping from RAG/MuscleWiki targets to vector silhouette regions
function mapToRegion(muscleName?: string): MuscleRegion | null {
  if (!muscleName) return null;
  const m = muscleName.toLowerCase();
  if (m.includes("chest") || m.includes("pec")) return "chest";
  if (m.includes("delt") || m.includes("shoulder")) return "shoulders";
  if (m.includes("lat") || m.includes("back") || m.includes("trap") || m.includes("rhomboid") || m.includes("spine"))
    return "lats";
  if (m.includes("quad") || m.includes("thigh")) return "quads";
  if (m.includes("hamstring")) return "hamstrings";
  if (m.includes("bicep") || m.includes("brachii")) return "biceps";
  if (m.includes("tricep")) return "triceps";
  if (m.includes("calf") || m.includes("gastrocnemius") || m.includes("soleus")) return "calves";
  if (m.includes("glute") || m.includes("hip")) return "glutes";
  if (m.includes("abs") || m.includes("abdom") || m.includes("core") || m.includes("oblique")) return "core";
  return null;
}

export function AnatomicalTensionSpotlight({
  primaryMuscle,
  secondaryMuscles = [],
  className,
  showToggle = true,
  accentColor = "emerald",
}: AnatomicalTensionSpotlightProps) {
  const isAmber = accentColor === "amber";
  const primaryFill = isAmber ? "#F59E0B" : "#10B981";
  const primaryStroke = isAmber ? "#FBBF24" : "#34D399";
  const primaryGlow = isAmber ? "rgba(245, 158, 11, 0.85)" : "rgba(16, 185, 129, 0.85)";

  const primaryRegion = mapToRegion(primaryMuscle);
  const secondaryRegions = secondaryMuscles
    .map(mapToRegion)
    .filter((r): r is MuscleRegion => Boolean(r && r !== primaryRegion));

  // Determine intelligent default anatomical view
  const isPosteriorDominant = Boolean(
    primaryRegion && ["lats", "hamstrings", "glutes", "triceps"].includes(primaryRegion)
  );

  const [view, setView] = useState<"front" | "back">(isPosteriorDominant ? "back" : "front");

  useEffect(() => {
    setView(isPosteriorDominant ? "back" : "front");
  }, [primaryMuscle, isPosteriorDominant]);

  const getRegionState = (region: MuscleRegion): "primary" | "secondary" | "inactive" => {
    if (primaryRegion === region) return "primary";
    if (secondaryRegions.includes(region)) return "secondary";
    return "inactive";
  };

  const getPathStyle = (state: "primary" | "secondary" | "inactive") => {
    if (state === "primary") {
      return {
        fill: primaryFill,
        stroke: primaryStroke,
        strokeWidth: "1.5",
        filter: `drop-shadow(0px 0px 5px ${primaryGlow})`,
      };
    }
    if (state === "secondary") {
      return {
        fill: "#06B6D4",
        stroke: "#22D3EE",
        strokeWidth: "1.2",
        filter: "drop-shadow(0px 0px 4px rgba(6, 182, 212, 0.7))",
      };
    }
    return {
      fill: "#182030",
      stroke: "#1C2436",
      strokeWidth: "1",
      opacity: 0.7,
    };
  };

  return (
    <div
      className={clsx(
        "relative flex flex-col items-center justify-between p-2 rounded-2xl bg-[#090C11] border border-[#1C2436] shadow-inner select-none font-body overflow-hidden",
        className
      )}
      role="img"
      aria-label={`Anatomical tension spotlight showing ${primaryMuscle || "target muscle"}`}
    >
      {/* 1. Anterior / Posterior Micro-Segmented Selector (Ultra-compact Front / Back) */}
      {showToggle && (
        <div className="flex items-center rounded-full bg-[#111622] p-0.5 border border-[#1C2436] max-w-full">
          <button
            type="button"
            onClick={() => setView("front")}
            aria-label="Anterior"
            className={clsx(
              "px-2 py-0.5 text-[9px] font-mono font-semibold rounded-full transition cursor-pointer flex items-center gap-1",
              view === "front"
                ? "bg-amber-400 text-slate-950 font-bold shadow-xs"
                : "text-slate-400 hover:text-white"
            )}
            title="View anterior (front) anatomy"
          >
            <span>Front</span>
            <span className="sr-only">Anterior</span>
          </button>
          <button
            type="button"
            onClick={() => setView("back")}
            aria-label="Posterior"
            className={clsx(
              "px-2 py-0.5 text-[9px] font-mono font-semibold rounded-full transition cursor-pointer flex items-center gap-1",
              view === "back"
                ? "bg-amber-400 text-slate-950 font-bold shadow-xs"
                : "text-slate-400 hover:text-white"
            )}
            title="View posterior (back) anatomy"
          >
            <span>Back</span>
            <span className="sr-only">Posterior</span>
          </button>
        </div>
      )}

      {/* 2. Athletic Vector Silhouette (ViewBox 0 0 100 130) */}
      <svg
        viewBox="0 0 100 130"
        className="w-20 h-24 my-1 transition-all duration-300 drop-shadow-sm"
      >
        {/* Head & Neck (Neutral contour) */}
        <circle cx="50" cy="11" r="7" fill="#111622" stroke="#1C2436" strokeWidth="1" />
        <rect x="47" y="18" width="6" height="5" rx="1" fill="#111622" stroke="#1C2436" strokeWidth="1" />

        {/* --- FRONT VIEW (ANTERIOR) --- */}
        {view === "front" && (
          <g id="anterior-muscles">
            {/* Shoulders / Deltoids (Left & Right) */}
            <path
              d="M 28 26 C 22 26 21 34 22 39 C 24 39 29 37 31 34 Z"
              style={getPathStyle(getRegionState("shoulders"))}
            />
            <path
              d="M 72 26 C 78 26 79 34 78 39 C 76 39 71 37 69 34 Z"
              style={getPathStyle(getRegionState("shoulders"))}
            />

            {/* Chest / Pectorals */}
            <path
              d="M 32 27 C 42 27 49 29 49 39 C 43 42 35 42 31 37 Z"
              style={getPathStyle(getRegionState("chest"))}
            />
            <path
              d="M 68 27 C 58 27 51 29 51 39 C 57 42 65 42 69 37 Z"
              style={getPathStyle(getRegionState("chest"))}
            />

            {/* Biceps */}
            <path
              d="M 19 39 C 18 45 19 53 23 55 C 25 53 26 46 25 40 Z"
              style={getPathStyle(getRegionState("biceps"))}
            />
            <path
              d="M 81 39 C 82 45 81 53 77 55 C 75 53 74 46 75 40 Z"
              style={getPathStyle(getRegionState("biceps"))}
            />

            {/* Forearms (Neutral Anchor) */}
            <path
              d="M 18 57 C 16 64 16 72 19 75 C 21 74 23 66 22 58 Z"
              fill="#111622"
              stroke="#1C2436"
              strokeWidth="1"
            />
            <path
              d="M 82 57 C 84 64 84 72 81 75 C 79 74 77 66 78 58 Z"
              fill="#111622"
              stroke="#1C2436"
              strokeWidth="1"
            />

            {/* Core / Abdominals */}
            <path
              d="M 38 43 C 44 43 49 43 49 61 C 44 62 38 60 38 52 Z"
              style={getPathStyle(getRegionState("core"))}
            />
            <path
              d="M 62 43 C 56 43 51 43 51 61 C 56 62 62 60 62 52 Z"
              style={getPathStyle(getRegionState("core"))}
            />

            {/* Pelvis / Hips (Neutral) */}
            <path
              d="M 39 63 H 61 L 57 73 H 43 Z"
              fill="#111622"
              stroke="#1C2436"
              strokeWidth="1"
            />

            {/* Quads (Left & Right) */}
            <path
              d="M 37 75 C 36 84 35 96 38 103 C 43 103 46 95 47 75 Z"
              style={getPathStyle(getRegionState("quads"))}
            />
            <path
              d="M 63 75 C 64 84 65 96 62 103 C 57 103 54 95 53 75 Z"
              style={getPathStyle(getRegionState("quads"))}
            />

            {/* Calves (Anterior Tibialis / Calves) */}
            <path
              d="M 37 106 C 36 113 38 122 41 125 C 44 122 45 113 44 106 Z"
              style={getPathStyle(getRegionState("calves"))}
            />
            <path
              d="M 63 106 C 64 113 62 122 59 125 C 56 122 55 113 56 106 Z"
              style={getPathStyle(getRegionState("calves"))}
            />
          </g>
        )}

        {/* --- BACK VIEW (POSTERIOR) --- */}
        {view === "back" && (
          <g id="posterior-muscles">
            {/* Upper Back / Traps / Rear Delts */}
            <path
              d="M 32 23 C 43 21 57 21 68 23 C 65 31 35 31 32 23 Z"
              style={getPathStyle(getRegionState("lats"))}
            />
            <path
              d="M 28 26 C 22 26 21 34 22 39 C 24 39 29 37 31 34 Z"
              style={getPathStyle(getRegionState("shoulders"))}
            />
            <path
              d="M 72 26 C 78 26 79 34 78 39 C 76 39 71 37 69 34 Z"
              style={getPathStyle(getRegionState("shoulders"))}
            />

            {/* Lats (Left & Right Wings) */}
            <path
              d="M 33 32 C 40 32 47 34 47 52 C 38 52 32 44 31 37 Z"
              style={getPathStyle(getRegionState("lats"))}
            />
            <path
              d="M 67 32 C 60 32 53 34 53 52 C 62 52 68 44 69 37 Z"
              style={getPathStyle(getRegionState("lats"))}
            />

            {/* Triceps (Left & Right) */}
            <path
              d="M 19 39 C 18 45 19 53 23 55 C 25 53 26 46 25 40 Z"
              style={getPathStyle(getRegionState("triceps"))}
            />
            <path
              d="M 81 39 C 82 45 81 53 77 55 C 75 53 74 46 75 40 Z"
              style={getPathStyle(getRegionState("triceps"))}
            />

            {/* Forearms (Neutral) */}
            <path
              d="M 18 57 C 16 64 16 72 19 75 C 21 74 23 66 22 58 Z"
              fill="#111622"
              stroke="#1C2436"
              strokeWidth="1"
            />
            <path
              d="M 82 57 C 84 64 84 72 81 75 C 79 74 77 66 78 58 Z"
              fill="#111622"
              stroke="#1C2436"
              strokeWidth="1"
            />

            {/* Glutes (Left & Right) */}
            <path
              d="M 36 60 C 44 59 48 64 48 74 C 41 75 35 70 35 62 Z"
              style={getPathStyle(getRegionState("glutes"))}
            />
            <path
              d="M 64 60 C 56 59 52 64 52 74 C 59 75 65 70 65 62 Z"
              style={getPathStyle(getRegionState("glutes"))}
            />

            {/* Hamstrings (Left & Right) */}
            <path
              d="M 36 76 C 36 86 36 97 39 103 C 44 103 46 95 47 76 Z"
              style={getPathStyle(getRegionState("hamstrings"))}
            />
            <path
              d="M 64 76 C 64 86 64 97 61 103 C 56 103 54 95 53 76 Z"
              style={getPathStyle(getRegionState("hamstrings"))}
            />

            {/* Calves (Posterior Gastrocnemius) */}
            <path
              d="M 36 106 C 34 113 36 122 41 125 C 44 122 46 113 45 106 Z"
              style={getPathStyle(getRegionState("calves"))}
            />
            <path
              d="M 64 106 C 66 113 64 122 59 125 C 56 122 54 113 55 106 Z"
              style={getPathStyle(getRegionState("calves"))}
            />
          </g>
        )}
      </svg>

      {/* 3. Tension Glow Legend */}
      <div className="flex items-center justify-center gap-2 pt-1 border-t border-[#1C2436] w-full text-[9px] font-mono">
        <span
          className={clsx(
            "flex items-center gap-1 font-semibold",
            isAmber ? "text-amber-400" : "text-emerald-400"
          )}
        >
          <span
            className={clsx(
              "w-1.5 h-1.5 rounded-full",
              isAmber ? "bg-amber-400 shadow-[0_0_4px_#F59E0B]" : "bg-emerald-400 shadow-[0_0_4px_#10B981]"
            )}
          />
          Target
        </span>
        {secondaryRegions.length > 0 && (
          <span className="flex items-center gap-1 text-sky-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_3px_#38BDF8]" />
            Synergist
          </span>
        )}
      </div>
    </div>
  );
}
