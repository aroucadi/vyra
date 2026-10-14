"use client";

import React, { useState } from "react";
import { clsx } from "clsx";

export interface AnatomicalBodyMapProps {
  selectedMuscle: string;
  onSelectMuscle: (muscleId: string) => void;
  className?: string;
}

export function AnatomicalBodyMap({
  selectedMuscle,
  onSelectMuscle,
  className,
}: AnatomicalBodyMapProps) {
  const [view, setView] = useState<"front" | "back">("front");

  const musclesFront = [
    { id: "chest", label: "Chest", x: 100, y: 70, width: 60, height: 28, rx: 8 },
    { id: "shoulders", label: "Shoulders", x: 60, y: 55, width: 140, height: 20, rx: 6, isSpanned: true },
    { id: "biceps", label: "Arms / Biceps", x: 45, y: 85, width: 25, height: 40, rx: 8 },
    { id: "biceps", label: "Arms / Biceps", x: 190, y: 85, width: 25, height: 40, rx: 8 },
    { id: "waist", label: "Core / Abs", x: 105, y: 105, width: 50, height: 45, rx: 8 },
    { id: "quads", label: "Quads", x: 92, y: 160, width: 34, height: 65, rx: 10 },
    { id: "quads", label: "Quads", x: 134, y: 160, width: 34, height: 65, rx: 10 },
  ];

  const musclesBack = [
    { id: "lats", label: "Upper Back / Lats", x: 95, y: 65, width: 70, height: 48, rx: 10 },
    { id: "shoulders", label: "Rear Delts", x: 60, y: 55, width: 140, height: 20, rx: 6, isSpanned: true },
    { id: "triceps", label: "Triceps", x: 45, y: 85, width: 25, height: 40, rx: 8 },
    { id: "triceps", label: "Triceps", x: 190, y: 85, width: 25, height: 40, rx: 8 },
    { id: "hamstrings", label: "Hamstrings", x: 92, y: 160, width: 34, height: 65, rx: 10 },
    { id: "hamstrings", label: "Hamstrings", x: 134, y: 160, width: 34, height: 65, rx: 10 },
  ];

  const activeRegions = view === "front" ? musclesFront : musclesBack;

  return (
    <div className={clsx("p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3", className)}>
      {/* 1. Header & Front/Back View Selector */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
            Interactive Anatomy
          </span>
          <h4 className="text-xs font-bold text-white tracking-tight">Anatomical Body Map</h4>
        </div>
        <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
          <button
            type="button"
            onClick={() => setView("front")}
            className={clsx(
              "px-2.5 py-1 text-[10px] font-mono font-semibold rounded-md transition",
              view === "front"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Anterior (Front)
          </button>
          <button
            type="button"
            onClick={() => setView("back")}
            className={clsx(
              "px-2.5 py-1 text-[10px] font-mono font-semibold rounded-md transition",
              view === "back"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Posterior (Back)
          </button>
        </div>
      </div>

      {/* 2. Interactive Stylized Anatomical SVG Silhouette */}
      <div className="relative w-full max-w-[260px] mx-auto aspect-[1.1] select-none">
        <svg viewBox="0 0 260 240" className="w-full h-full">
          {/* Head & Neck silhouette */}
          <circle cx="130" cy="28" r="16" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <path d="M124 44 L136 44 L138 52 L122 52 Z" fill="#1e293b" />

          {/* Interactive Muscle Regions */}
          {activeRegions.map((m, idx) => {
            const isSelected = selectedMuscle === m.id;
            return (
              <g
                key={`${m.id}_${idx}`}
                onClick={() => onSelectMuscle(isSelected ? "all" : m.id)}
                className="cursor-pointer group"
              >
                <rect
                  x={m.x}
                  y={m.y}
                  width={m.width}
                  height={m.height}
                  rx={m.rx}
                  className={clsx(
                    "transition-all duration-200 stroke-1",
                    isSelected
                      ? "fill-emerald-500/80 stroke-emerald-400 shadow-lg"
                      : "fill-slate-800/80 stroke-slate-700/80 group-hover:fill-emerald-500/30 group-hover:stroke-emerald-500/60"
                  )}
                />
                <text
                  x={m.x + m.width / 2}
                  y={m.y + m.height / 2 + 3}
                  textAnchor="middle"
                  className={clsx(
                    "text-[8.5px] font-mono uppercase font-bold pointer-events-none transition-colors",
                    isSelected ? "fill-slate-950" : "fill-slate-300 group-hover:fill-emerald-300"
                  )}
                >
                  {m.label.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 3. Active Target Indicator */}
      <div className="flex items-center justify-between text-[10px] font-mono px-1 text-slate-400">
        <span>Tap muscle region to filter library</span>
        <span className="text-emerald-400 font-bold">
          {selectedMuscle !== "all" ? `Active: ${selectedMuscle.toUpperCase()}` : "Showing All Muscles"}
        </span>
      </div>
    </div>
  );
}
