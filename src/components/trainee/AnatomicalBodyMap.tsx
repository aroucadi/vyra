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

export function AnatomicalBodyMap({
  selectedMuscle,
  onSelectMuscle,
  secondaryMuscles = [],
  mode = "filter",
  className,
}: AnatomicalBodyMapProps) {
  // Normalize muscle key
  const normalizedPrimary = (selectedMuscle || "").toLowerCase();
  const normalizedSecondaries = secondaryMuscles.map((m) => m.toLowerCase());

  const isBackDominant =
    normalizedPrimary.includes("lat") ||
    normalizedPrimary.includes("back") ||
    normalizedPrimary.includes("hamstring") ||
    normalizedPrimary.includes("tricep") ||
    normalizedPrimary.includes("glute") ||
    normalizedPrimary.includes("rear");

  const [view, setView] = useState<"front" | "back">(isBackDominant ? "back" : "front");

  useEffect(() => {
    if (mode === "visualizer") {
      setView(isBackDominant ? "back" : "front");
    }
  }, [normalizedPrimary, mode, isBackDominant]);

  const musclesFront = [
    { id: "chest", label: "Chest", x: 100, y: 70, width: 60, height: 28, rx: 8 },
    { id: "shoulders", label: "Shoulders", x: 60, y: 55, width: 140, height: 20, rx: 6, isSpanned: true },
    { id: "biceps", label: "Biceps", x: 45, y: 85, width: 25, height: 40, rx: 8 },
    { id: "biceps", label: "Biceps", x: 190, y: 85, width: 25, height: 40, rx: 8 },
    { id: "waist", label: "Abs / Core", x: 105, y: 105, width: 50, height: 45, rx: 8 },
    { id: "quads", label: "Quads", x: 92, y: 160, width: 34, height: 65, rx: 10 },
    { id: "quads", label: "Quads", x: 134, y: 160, width: 34, height: 65, rx: 10 },
  ];

  const musclesBack = [
    { id: "lats", label: "Lats / Back", x: 95, y: 65, width: 70, height: 48, rx: 10 },
    { id: "shoulders", label: "Rear Delts", x: 60, y: 55, width: 140, height: 20, rx: 6, isSpanned: true },
    { id: "triceps", label: "Triceps", x: 45, y: 85, width: 25, height: 40, rx: 8 },
    { id: "triceps", label: "Triceps", x: 190, y: 85, width: 25, height: 40, rx: 8 },
    { id: "hamstrings", label: "Hamstrings", x: 92, y: 160, width: 34, height: 65, rx: 10 },
    { id: "hamstrings", label: "Hamstrings", x: 134, y: 160, width: 34, height: 65, rx: 10 },
  ];

  const activeRegions = view === "front" ? musclesFront : musclesBack;

  const isPrimary = (muscleId: string) => {
    return (
      normalizedPrimary.includes(muscleId) ||
      (muscleId === "chest" && normalizedPrimary.includes("pec")) ||
      (muscleId === "lats" && (normalizedPrimary.includes("back") || normalizedPrimary.includes("lat"))) ||
      (muscleId === "waist" && (normalizedPrimary.includes("abs") || normalizedPrimary.includes("core"))) ||
      (muscleId === "quads" && normalizedPrimary.includes("quad")) ||
      (muscleId === "hamstrings" && (normalizedPrimary.includes("ham") || normalizedPrimary.includes("glute"))) ||
      (muscleId === "shoulders" && (normalizedPrimary.includes("delt") || normalizedPrimary.includes("shoulder")))
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
        (muscleId === "biceps" && sec.includes("bicep"))
    );
  };

  return (
    <div className={clsx("p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2.5", className)}>
      {/* 1. Header & Front/Back View Selector */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
            {mode === "visualizer" ? "Biomechanical Target" : "Interactive Anatomy"}
          </span>
          <h4 className="text-xs font-bold text-white tracking-tight">
            {mode === "visualizer" ? "Active Muscle Activation" : "Anatomical Body Map"}
          </h4>
        </div>
        <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
          <button
            type="button"
            onClick={() => setView("front")}
            className={clsx(
              "px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md transition",
              view === "front"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setView("back")}
            className={clsx(
              "px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md transition",
              view === "back"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Posterior
          </button>
        </div>
      </div>

      {/* 2. Interactive Stylized Anatomical SVG Silhouette */}
      <div className="relative w-full max-w-[220px] mx-auto aspect-[1.15] select-none">
        <svg viewBox="0 0 260 240" className="w-full h-full">
          {/* Head & Neck silhouette */}
          <circle cx="130" cy="28" r="16" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <path d="M124 44 L136 44 L138 52 L122 52 Z" fill="#1e293b" />

          {/* Interactive Muscle Regions */}
          {activeRegions.map((m, idx) => {
            const activePrimary = isPrimary(m.id);
            const activeSec = isSecondary(m.id);

            return (
              <g
                key={`${m.id}_${idx}`}
                onClick={() => onSelectMuscle && onSelectMuscle(activePrimary ? "all" : m.id)}
                className={clsx(onSelectMuscle ? "cursor-pointer group" : "")}
              >
                <rect
                  x={m.x}
                  y={m.y}
                  width={m.width}
                  height={m.height}
                  rx={m.rx}
                  className={clsx(
                    "transition-all duration-200 stroke-1",
                    activePrimary
                      ? "fill-emerald-500 stroke-emerald-300 shadow-lg"
                      : activeSec
                      ? "fill-cyan-500/60 stroke-cyan-400"
                      : "fill-slate-800/80 stroke-slate-700/80"
                  )}
                />
                <text
                  x={m.x + m.width / 2}
                  y={m.y + m.height / 2 + 3}
                  textAnchor="middle"
                  className={clsx(
                    "text-[8.5px] font-mono uppercase font-bold pointer-events-none transition-colors",
                    activePrimary
                      ? "fill-slate-950 font-black"
                      : activeSec
                      ? "fill-slate-950 font-bold"
                      : "fill-slate-400"
                  )}
                >
                  {m.label.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 3. Legend / Status Indicator */}
      <div className="flex items-center justify-between text-[10px] font-mono px-1 text-slate-400 pt-1 border-t border-slate-800/60">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="text-slate-300">Primary</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            <span className="text-slate-400">Synergist</span>
          </span>
        </div>
        <span className="text-emerald-400 font-bold uppercase truncate max-w-[100px]">
          {selectedMuscle || "Neutral"}
        </span>
      </div>
    </div>
  );
}
