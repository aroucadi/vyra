"use client";

import React, { useState } from "react";
import { clsx } from "clsx";

export type AnatomicalSubdivisionId =
  // Pectorals
  | "pec_clavicular"
  | "pec_sternal"
  | "pec_costal"
  // Deltoids
  | "delt_anterior"
  | "delt_lateral"
  | "delt_posterior"
  // Arms
  | "biceps_brachii"
  | "brachialis_forearms"
  | "triceps_long_head"
  | "triceps_lateral_head"
  // Back & Scapular
  | "traps_upper"
  | "traps_mid_lower"
  | "lats_iliac"
  | "lats_thoracic"
  | "rhomboids"
  | "infraspinatus_rotator"
  | "erector_spinae"
  // Trunk & Core
  | "rectus_abdominis"
  | "obliques"
  | "serratus_anterior"
  // Lower Body
  | "glute_maximus"
  | "glute_medius"
  | "quad_rectus_femoris"
  | "quad_vastus_lateralis"
  | "quad_vastus_medialis"
  | "hamstrings"
  | "calves_gastrocnemius"
  | "calves_soleus";

export interface MedicalVectorAtlasProps {
  primarySubdivision?: string | AnatomicalSubdivisionId;
  secondarySubdivisions?: string[];
  compensatingSubdivision?: string | null;
  className?: string;
  showToggle?: boolean;
  accentColor?: "emerald" | "amber" | "cyan";
  forceVectorDirection?: "converging_press" | "diverging_pull" | "lateral_arc" | "hip_hinge" | "vertical_push" | "none";
  onMuscleTap?: (subdivisionId: AnatomicalSubdivisionId) => void;
  interactive?: boolean;
}

/**
 * Intelligent mapper from raw exercise string tokens to 32 anatomical subdivisions.
 */
export function mapExerciseToSubdivisions(
  movementOrMuscleName?: string,
  target?: string
): {
  primary: AnatomicalSubdivisionId;
  secondaries: AnatomicalSubdivisionId[];
  view: "front" | "back";
  vectorDirection: MedicalVectorAtlasProps["forceVectorDirection"];
} {
  const text = `${movementOrMuscleName || ""} ${target || ""}`.toLowerCase();

  // Incline Press / Clavicular Chest
  if (text.includes("incline") && (text.includes("press") || text.includes("bench") || text.includes("chest") || text.includes("pec"))) {
    return {
      primary: "pec_clavicular",
      secondaries: ["delt_anterior", "triceps_lateral_head"],
      view: "front",
      vectorDirection: "converging_press",
    };
  }

  // Flat Bench / Sternal Chest
  if (text.includes("bench") || text.includes("chest press") || text.includes("push up") || (text.includes("pec") && !text.includes("incline"))) {
    return {
      primary: "pec_sternal",
      secondaries: ["delt_anterior", "triceps_lateral_head"],
      view: "front",
      vectorDirection: "converging_press",
    };
  }

  // Lateral Raise / Side Delts
  if (text.includes("lateral raise") || text.includes("side delt") || text.includes("abduction")) {
    return {
      primary: "delt_lateral",
      secondaries: ["traps_upper", "delt_anterior"],
      view: "front",
      vectorDirection: "lateral_arc",
    };
  }

  // Overhead Press / Front Delts
  if (text.includes("overhead press") || text.includes("military") || text.includes("shoulder press") || text.includes("ohp")) {
    return {
      primary: "delt_anterior",
      secondaries: ["triceps_long_head", "delt_lateral", "traps_upper"],
      view: "front",
      vectorDirection: "vertical_push",
    };
  }

  // Lat Pulldown / Pullups / Vertical Pull
  if (text.includes("pulldown") || text.includes("pull up") || text.includes("chin") || text.includes("lat")) {
    return {
      primary: "lats_iliac",
      secondaries: ["biceps_brachii", "traps_mid_lower", "lats_thoracic"],
      view: "back",
      vectorDirection: "diverging_pull",
    };
  }

  // Horizontal Rows / T-Bar / Cable Row
  if (text.includes("row") || text.includes("rhomboid") || text.includes("rear delt")) {
    return {
      primary: "traps_mid_lower",
      secondaries: ["rhomboids", "delt_posterior", "biceps_brachii", "lats_thoracic"],
      view: "back",
      vectorDirection: "diverging_pull",
    };
  }

  // Leg Press / Squats / Quads
  if (text.includes("squat") || text.includes("leg press") || text.includes("quad") || text.includes("lunge") || text.includes("extension")) {
    return {
      primary: "quad_vastus_medialis",
      secondaries: ["quad_rectus_femoris", "quad_vastus_lateralis", "glute_maximus"],
      view: "front",
      vectorDirection: "hip_hinge",
    };
  }

  // Romanian Deadlift / Leg Curl / Hamstrings
  if (text.includes("deadlift") || text.includes("rdl") || text.includes("hamstring") || text.includes("curl") && text.includes("leg")) {
    return {
      primary: "hamstrings",
      secondaries: ["glute_maximus", "erector_spinae"],
      view: "back",
      vectorDirection: "hip_hinge",
    };
  }

  // Overhead Triceps Extension
  if (text.includes("tricep") || text.includes("pushdown") || text.includes("skull")) {
    return {
      primary: "triceps_long_head",
      secondaries: ["triceps_lateral_head"],
      view: "back",
      vectorDirection: "vertical_push",
    };
  }

  // Biceps Curl
  if (text.includes("bicep") || text.includes("curl")) {
    return {
      primary: "biceps_brachii",
      secondaries: ["brachialis_forearms"],
      view: "front",
      vectorDirection: "converging_press",
    };
  }

  // Default Front Chest
  return {
    primary: "pec_sternal",
    secondaries: ["delt_anterior"],
    view: "front",
    vectorDirection: "converging_press",
  };
}

export function MedicalVectorAtlas({
  primarySubdivision = "pec_clavicular",
  secondarySubdivisions = ["delt_anterior"],
  compensatingSubdivision = null,
  className,
  showToggle = true,
  accentColor = "emerald",
  forceVectorDirection,
  onMuscleTap,
  interactive = true,
}: MedicalVectorAtlasProps) {
  // Infer view from active muscle if posterior-dominant
  const posteriorMuscles: string[] = [
    "lats_iliac",
    "lats_thoracic",
    "traps_mid_lower",
    "delt_posterior",
    "rhomboids",
    "infraspinatus_rotator",
    "erector_spinae",
    "triceps_long_head",
    "triceps_lateral_head",
    "glute_maximus",
    "glute_medius",
    "hamstrings",
    "calves_soleus",
  ];

  const defaultView = posteriorMuscles.includes(String(primarySubdivision)) ? "back" : "front";
  const [view, setView] = useState<"front" | "back">(defaultView);

  const isEmerald = accentColor === "emerald";
  const primeGlowColor = isEmerald ? "#10b981" : "#f59e0b";
  const primeStrokeColor = isEmerald ? "#34d399" : "#fbbf24";
  const primeShadow = isEmerald
    ? "drop-shadow(0 0 10px rgba(16,185,129,0.9))"
    : "drop-shadow(0 0 10px rgba(245,158,11,0.9))";

  const getSubdivisionState = (id: AnatomicalSubdivisionId): "prime" | "synergist" | "compensation" | "neutral" => {
    if (compensatingSubdivision === id) return "compensation";
    if (primarySubdivision === id) return "prime";
    if (secondarySubdivisions.includes(id)) return "synergist";
    return "neutral";
  };

  const getSubdivisionStyle = (state: "prime" | "synergist" | "compensation" | "neutral") => {
    if (state === "compensation") {
      return {
        fill: "url(#compensation-hazard-pattern)",
        stroke: "#ef4444",
        strokeWidth: 2,
        filter: "drop-shadow(0 0 8px rgba(239,68,68,0.95))",
        className: "animate-pulse cursor-pointer transition-all",
      };
    }
    if (state === "prime") {
      return {
        fill: "url(#prime-striation-gradient)",
        stroke: primeStrokeColor,
        strokeWidth: 1.8,
        filter: primeShadow,
        className: "cursor-pointer transition-all duration-300",
      };
    }
    if (state === "synergist") {
      return {
        fill: "url(#synergist-gradient)",
        stroke: "#22d3ee",
        strokeWidth: 1.2,
        filter: "drop-shadow(0 0 5px rgba(6,182,212,0.7))",
        className: "cursor-pointer transition-all duration-300 opacity-90",
      };
    }
    return {
      fill: "#101622",
      stroke: "#1e293b",
      strokeWidth: 0.8,
      opacity: 0.75,
      className: "cursor-pointer transition-all hover:opacity-100 hover:stroke-slate-500",
    };
  };

  const handleHeadClick = (id: AnatomicalSubdivisionId) => {
    if (!interactive) return;
    onMuscleTap?.(id);
  };

  return (
    <div
      className={clsx(
        "relative flex flex-col items-center justify-between p-3 rounded-2xl bg-[#06090e] border border-[#1b2d47] shadow-2xl select-none font-body overflow-hidden",
        className
      )}
    >
      {/* Background Tech Hex Grid & Scanning Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0c1626_0%,#04070b_80%)] pointer-events-none" />

      {/* Header Bar: View Indicator & Toggle */}
      <div className="relative z-10 w-full flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
          <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#10b981]">
            {view === "front" ? "ANTERIOR // FRONTAL" : "POSTERIOR // DORSAL"}
          </span>
        </div>

        {showToggle && (
          <div className="flex bg-[#0b121e] border border-[#1c2c44] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setView("front")}
              className={clsx(
                "px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded transition-all",
                view === "front"
                  ? "bg-[#10b981] text-black font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => setView("back")}
              className={clsx(
                "px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded transition-all",
                view === "back"
                  ? "bg-[#10b981] text-black font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Back
            </button>
          </div>
        )}
      </div>

      {/* SCIENCE-GRADE MEDICAL SVG ATLAS */}
      <div className="relative z-10 w-full flex-1 flex items-center justify-center min-h-[200px]">
        <svg
          viewBox="0 0 240 380"
          className="w-full h-full max-h-[300px] drop-shadow-md overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Prime Target Gradient (Emerald / Amber) */}
            <linearGradient id="prime-striation-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isEmerald ? "#34d399" : "#fde047"} />
              <stop offset="60%" stopColor={primeGlowColor} />
              <stop offset="100%" stopColor={isEmerald ? "#059669" : "#d97706"} />
            </linearGradient>

            {/* Synergist Gradient (Cyan) */}
            <linearGradient id="synergist-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>

            {/* Compensation Hazard Warning Pattern (Crimson / Hazard Stripes) */}
            <pattern id="compensation-hazard-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="4" height="8" fill="#ef4444" />
              <rect x="4" width="4" height="8" fill="#7f1d1d" />
            </pattern>

            {/* Kinetic Force Vector Arrow Marker */}
            <marker
              id="kinetic-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
          </defs>

          {/* ========================================================================= */}
          {/* VIEW A: ANTERIOR (FRONTAL ANATOMICAL COMPOSITION)                          */}
          {/* ========================================================================= */}
          {view === "front" && (
            <g id="anterior-anatomy-layer">
              {/* Head & Neck Base Reference */}
              <path
                d="M108 30 C108 20 132 20 132 30 C132 45 128 54 128 62 L124 64 L116 64 L112 62 C112 54 108 45 108 30 Z"
                fill="#0d1420"
                stroke="#1b283d"
                strokeWidth="1"
              />

              {/* Trapezius Upper Clavicular Anchors */}
              <path
                d="M102 62 C110 58 116 64 120 64 C124 64 130 58 138 62 L144 70 L96 70 Z"
                {...getSubdivisionStyle(getSubdivisionState("traps_upper"))}
                onClick={() => handleHeadClick("traps_upper")}
              />

              {/* 1. CLAVICULAR PECTORAL HEAD (UPPER CHEST) */}
              <g id="head-pec-clavicular">
                <path
                  d="M118 72 L96 73 C86 76 80 84 82 92 C88 94 102 88 118 84 Z"
                  {...getSubdivisionStyle(getSubdivisionState("pec_clavicular"))}
                  onClick={() => handleHeadClick("pec_clavicular")}
                />
                <path
                  d="M122 72 L144 73 C154 76 160 84 158 92 C152 94 138 88 122 84 Z"
                  {...getSubdivisionStyle(getSubdivisionState("pec_clavicular"))}
                  onClick={() => handleHeadClick("pec_clavicular")}
                />
                {/* Real Fiber Striations for Clavicular Line of Pull */}
                <path d="M100 76 L114 81 M92 82 L112 83 M140 76 L126 81 M148 82 L128 83" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" strokeLinecap="round" />
              </g>

              {/* 2. STERNOCOSTAL PECTORAL HEAD (MID / LOWER CHEST) */}
              <g id="head-pec-sternal">
                <path
                  d="M118 86 C102 90 88 95 84 94 C82 104 90 114 104 116 C112 118 118 112 118 86 Z"
                  {...getSubdivisionStyle(getSubdivisionState("pec_sternal"))}
                  onClick={() => handleHeadClick("pec_sternal")}
                />
                <path
                  d="M122 86 C138 90 152 95 156 94 C158 104 150 114 136 116 C128 118 122 112 122 86 Z"
                  {...getSubdivisionStyle(getSubdivisionState("pec_sternal"))}
                  onClick={() => handleHeadClick("pec_sternal")}
                />
                {/* Horizontal Sternal Striation Lines */}
                <path d="M92 98 L114 100 M96 106 L114 106 M148 98 L126 100 M144 106 L126 106" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" strokeLinecap="round" />
              </g>

              {/* 3. ANTERIOR DELTOID (FRONT DELT) */}
              <path
                d="M78 72 C84 72 86 80 84 92 C80 98 72 102 70 94 C68 84 72 74 78 72 Z"
                {...getSubdivisionStyle(getSubdivisionState("delt_anterior"))}
                onClick={() => handleHeadClick("delt_anterior")}
              />
              <path
                d="M162 72 C156 72 154 80 156 92 C160 98 168 102 170 94 C172 84 168 74 162 72 Z"
                {...getSubdivisionStyle(getSubdivisionState("delt_anterior"))}
                onClick={() => handleHeadClick("delt_anterior")}
              />

              {/* 4. LATERAL DELTOID (SIDE DELT) */}
              <path
                d="M68 76 C72 74 74 82 72 94 C68 100 62 102 60 94 C58 84 62 78 68 76 Z"
                {...getSubdivisionStyle(getSubdivisionState("delt_lateral"))}
                onClick={() => handleHeadClick("delt_lateral")}
              />
              <path
                d="M172 76 C168 74 166 82 168 94 C172 100 178 102 180 94 C182 84 178 78 172 76 Z"
                {...getSubdivisionStyle(getSubdivisionState("delt_lateral"))}
                onClick={() => handleHeadClick("delt_lateral")}
              />

              {/* 5. BICEPS BRACHII & BRACHIALIS */}
              <path
                d="M62 104 C68 104 70 114 68 126 C64 132 58 132 56 124 C54 114 58 106 62 104 Z"
                {...getSubdivisionStyle(getSubdivisionState("biceps_brachii"))}
                onClick={() => handleHeadClick("biceps_brachii")}
              />
              <path
                d="M178 104 C172 104 170 114 172 126 C176 132 182 132 184 124 C186 114 182 106 178 104 Z"
                {...getSubdivisionStyle(getSubdivisionState("biceps_brachii"))}
                onClick={() => handleHeadClick("biceps_brachii")}
              />

              {/* Forearms */}
              <path
                d="M54 132 C60 132 62 144 58 162 C56 166 50 166 48 158 C46 146 50 134 54 132 Z"
                {...getSubdivisionStyle(getSubdivisionState("brachialis_forearms"))}
                onClick={() => handleHeadClick("brachialis_forearms")}
              />
              <path
                d="M186 132 C180 132 178 144 182 162 C184 166 190 166 192 158 C194 146 190 134 186 132 Z"
                {...getSubdivisionStyle(getSubdivisionState("brachialis_forearms"))}
                onClick={() => handleHeadClick("brachialis_forearms")}
              />

              {/* 6. CORE: RECTUS ABDOMINIS & SERRATUS */}
              <path
                d="M110 120 L110 164 L130 164 L130 120 Z"
                {...getSubdivisionStyle(getSubdivisionState("rectus_abdominis"))}
                onClick={() => handleHeadClick("rectus_abdominis")}
              />
              {/* 6-pack segment dividers */}
              <line x1="110" y1="134" x2="130" y2="134" stroke="#04070b" strokeWidth="1.5" />
              <line x1="110" y1="148" x2="130" y2="148" stroke="#04070b" strokeWidth="1.5" />
              <line x1="120" y1="120" x2="120" y2="164" stroke="#04070b" strokeWidth="1.5" />

              {/* External Obliques */}
              <path
                d="M96 122 C104 120 108 126 108 160 C98 158 92 148 94 132 Z"
                {...getSubdivisionStyle(getSubdivisionState("obliques"))}
                onClick={() => handleHeadClick("obliques")}
              />
              <path
                d="M144 122 C136 120 132 126 132 160 C142 158 148 148 146 132 Z"
                {...getSubdivisionStyle(getSubdivisionState("obliques"))}
                onClick={() => handleHeadClick("obliques")}
              />

              {/* 7. QUADRICEPS COMPLEX (RECTUS FEMORIS + VASTUS TEARDROP) */}
              <g id="head-quads">
                {/* Rectus Femoris (Central Core of Thigh) */}
                <path
                  d="M102 186 C108 184 116 186 114 240 C108 244 104 240 100 232 C98 214 100 196 102 186 Z"
                  {...getSubdivisionStyle(getSubdivisionState("quad_rectus_femoris"))}
                  onClick={() => handleHeadClick("quad_rectus_femoris")}
                />
                <path
                  d="M138 186 C132 184 124 186 126 240 C132 244 136 240 140 232 C142 214 140 196 138 186 Z"
                  {...getSubdivisionStyle(getSubdivisionState("quad_rectus_femoris"))}
                  onClick={() => handleHeadClick("quad_rectus_femoris")}
                />

                {/* Vastus Medialis (Teardrop Muscle at Knee) */}
                <path
                  d="M108 234 C116 236 116 250 110 252 C106 252 104 242 108 234 Z"
                  {...getSubdivisionStyle(getSubdivisionState("quad_vastus_medialis"))}
                  onClick={() => handleHeadClick("quad_vastus_medialis")}
                />
                <path
                  d="M132 234 C124 236 124 250 130 252 C134 252 136 242 132 234 Z"
                  {...getSubdivisionStyle(getSubdivisionState("quad_vastus_medialis"))}
                  onClick={() => handleHeadClick("quad_vastus_medialis")}
                />

                {/* Vastus Lateralis (Outer Quad Sweep) */}
                <path
                  d="M92 188 C98 188 100 206 98 236 C92 238 86 226 88 206 Z"
                  {...getSubdivisionStyle(getSubdivisionState("quad_vastus_lateralis"))}
                  onClick={() => handleHeadClick("quad_vastus_lateralis")}
                />
                <path
                  d="M148 188 C142 188 140 206 142 236 C148 238 154 226 152 206 Z"
                  {...getSubdivisionStyle(getSubdivisionState("quad_vastus_lateralis"))}
                  onClick={() => handleHeadClick("quad_vastus_lateralis")}
                />
              </g>

              {/* Tibialis & Calves (Front View) */}
              <path
                d="M98 266 C104 266 106 286 102 322 C96 322 92 306 94 286 Z"
                {...getSubdivisionStyle(getSubdivisionState("calves_gastrocnemius"))}
                onClick={() => handleHeadClick("calves_gastrocnemius")}
              />
              <path
                d="M142 266 C136 266 134 286 138 322 C144 322 148 306 146 286 Z"
                {...getSubdivisionStyle(getSubdivisionState("calves_gastrocnemius"))}
                onClick={() => handleHeadClick("calves_gastrocnemius")}
              />
            </g>
          )}

          {/* ========================================================================= */}
          {/* VIEW B: POSTERIOR (DORSAL ANATOMICAL COMPOSITION)                          */}
          {/* ========================================================================= */}
          {view === "back" && (
            <g id="posterior-anatomy-layer">
              {/* Head & Neck Base Reference */}
              <path
                d="M108 30 C108 20 132 20 132 30 C132 45 128 54 128 62 L124 64 L116 64 L112 62 C112 54 108 45 108 30 Z"
                fill="#0d1420"
                stroke="#1b283d"
                strokeWidth="1"
              />

              {/* 1. UPPER TRAPEZIUS */}
              <path
                d="M104 62 C114 58 126 58 136 62 L150 78 C136 84 124 88 120 96 C116 88 104 84 90 78 Z"
                {...getSubdivisionStyle(getSubdivisionState("traps_upper"))}
                onClick={() => handleHeadClick("traps_upper")}
              />

              {/* 2. MID / LOWER TRAPS & RHOMBOIDS */}
              <path
                d="M120 96 C128 104 136 112 134 136 L120 148 L106 136 C104 112 112 104 120 96 Z"
                {...getSubdivisionStyle(getSubdivisionState("traps_mid_lower"))}
                onClick={() => handleHeadClick("traps_mid_lower")}
              />

              {/* 3. POSTERIOR DELTOID (REAR DELT) */}
              <path
                d="M74 74 C82 74 88 84 86 94 C82 98 74 98 70 92 C68 84 70 76 74 74 Z"
                {...getSubdivisionStyle(getSubdivisionState("delt_posterior"))}
                onClick={() => handleHeadClick("delt_posterior")}
              />
              <path
                d="M166 74 C158 74 152 84 154 94 C158 98 166 98 170 92 C172 84 170 76 166 74 Z"
                {...getSubdivisionStyle(getSubdivisionState("delt_posterior"))}
                onClick={() => handleHeadClick("delt_posterior")}
              />

              {/* Infraspinatus & Teres Minor (Rotator Cuff) */}
              <path
                d="M86 94 C92 92 100 96 98 106 C92 110 84 108 84 98 Z"
                {...getSubdivisionStyle(getSubdivisionState("infraspinatus_rotator"))}
                onClick={() => handleHeadClick("infraspinatus_rotator")}
              />
              <path
                d="M154 94 C148 92 140 96 142 106 C148 110 156 108 156 98 Z"
                {...getSubdivisionStyle(getSubdivisionState("infraspinatus_rotator"))}
                onClick={() => handleHeadClick("infraspinatus_rotator")}
              />

              {/* 4. LATISSIMUS DORSI (V-TAPER WINGS & ILIAC INSERTION) */}
              <g id="head-lats">
                {/* Thoracic Upper Lats */}
                <path
                  d="M98 108 C108 114 108 126 104 148 C94 142 84 124 88 112 Z"
                  {...getSubdivisionStyle(getSubdivisionState("lats_thoracic"))}
                  onClick={() => handleHeadClick("lats_thoracic")}
                />
                <path
                  d="M142 108 C132 114 132 126 136 148 C146 142 156 124 152 112 Z"
                  {...getSubdivisionStyle(getSubdivisionState("lats_thoracic"))}
                  onClick={() => handleHeadClick("lats_thoracic")}
                />
                {/* Iliac Lower Lat Sweep */}
                <path
                  d="M104 148 C108 154 112 162 110 172 C98 170 92 160 96 148 Z"
                  {...getSubdivisionStyle(getSubdivisionState("lats_iliac"))}
                  onClick={() => handleHeadClick("lats_iliac")}
                />
                <path
                  d="M136 148 C132 154 128 162 130 172 C142 170 148 160 144 148 Z"
                  {...getSubdivisionStyle(getSubdivisionState("lats_iliac"))}
                  onClick={() => handleHeadClick("lats_iliac")}
                />
                {/* Striation lines showing downward/inward line of action */}
                <path d="M92 116 L106 136 M96 130 L108 152 M148 116 L134 136 M144 130 L132 152" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" strokeLinecap="round" />
              </g>

              {/* 5. TRICEPS BRACHII (LONG & LATERAL HEADS) */}
              <path
                d="M62 102 C68 102 70 114 66 128 C62 132 56 130 56 120 Z"
                {...getSubdivisionStyle(getSubdivisionState("triceps_long_head"))}
                onClick={() => handleHeadClick("triceps_long_head")}
              />
              <path
                d="M178 102 C172 102 170 114 174 128 C178 132 184 130 184 120 Z"
                {...getSubdivisionStyle(getSubdivisionState("triceps_long_head"))}
                onClick={() => handleHeadClick("triceps_long_head")}
              />

              {/* 6. GLUTEAL COMPLEX (GLUTEUS MAXIMUS & MEDIUS) */}
              <path
                d="M96 176 C106 172 118 176 118 206 C108 214 96 210 92 196 Z"
                {...getSubdivisionStyle(getSubdivisionState("glute_maximus"))}
                onClick={() => handleHeadClick("glute_maximus")}
              />
              <path
                d="M144 176 C134 172 122 176 122 206 C132 214 144 210 148 196 Z"
                {...getSubdivisionStyle(getSubdivisionState("glute_maximus"))}
                onClick={() => handleHeadClick("glute_maximus")}
              />

              {/* 7. HAMSTRINGS (BICEPS FEMORIS & SEMITENDINOSUS) */}
              <g id="head-hamstrings">
                <path
                  d="M94 214 C104 214 112 220 110 252 C104 254 96 250 92 238 Z"
                  {...getSubdivisionStyle(getSubdivisionState("hamstrings"))}
                  onClick={() => handleHeadClick("hamstrings")}
                />
                <path
                  d="M146 214 C136 214 128 220 130 252 C136 254 144 250 148 238 Z"
                  {...getSubdivisionStyle(getSubdivisionState("hamstrings"))}
                  onClick={() => handleHeadClick("hamstrings")}
                />
                {/* Vertical fiber striation lines */}
                <path d="M98 222 L100 246 M104 222 L106 248 M142 222 L140 246 M136 222 L134 248" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" strokeLinecap="round" />
              </g>

              {/* 8. CALVES (GASTROCNEMIUS DIAMOND HEADS) */}
              <path
                d="M92 266 C104 264 108 280 102 312 C96 312 90 298 90 282 Z"
                {...getSubdivisionStyle(getSubdivisionState("calves_gastrocnemius"))}
                onClick={() => handleHeadClick("calves_gastrocnemius")}
              />
              <path
                d="M148 266 C136 264 132 280 138 312 C144 312 150 298 150 282 Z"
                {...getSubdivisionStyle(getSubdivisionState("calves_gastrocnemius"))}
                onClick={() => handleHeadClick("calves_gastrocnemius")}
              />
            </g>
          )}

          {/* ========================================================================= */}
          {/* KINETIC FORCE VECTOR OVERLAYS (Directional line-of-drive arrow)            */}
          {/* ========================================================================= */}
          {forceVectorDirection === "converging_press" && view === "front" && (
            <g id="vector-converging-press" className="animate-pulse">
              <path
                d="M74 96 Q96 90 114 84"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="4,3"
                markerEnd="url(#kinetic-arrow)"
              />
              <path
                d="M166 96 Q144 90 126 84"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="4,3"
                markerEnd="url(#kinetic-arrow)"
              />
            </g>
          )}

          {forceVectorDirection === "diverging_pull" && view === "back" && (
            <g id="vector-diverging-pull" className="animate-pulse">
              <path
                d="M120 72 Q108 104 102 144"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="4,3"
                markerEnd="url(#kinetic-arrow)"
              />
              <path
                d="M120 72 Q132 104 138 144"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="4,3"
                markerEnd="url(#kinetic-arrow)"
              />
            </g>
          )}

          {forceVectorDirection === "lateral_arc" && view === "front" && (
            <g id="vector-lateral-arc" className="animate-pulse">
              <path
                d="M56 124 Q60 90 74 74"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="4,3"
                markerEnd="url(#kinetic-arrow)"
              />
              <path
                d="M184 124 Q180 90 166 74"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="4,3"
                markerEnd="url(#kinetic-arrow)"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Footer Legend Bar */}
      <div className="relative z-10 w-full flex items-center justify-between text-[9px] font-mono border-t border-[#152338] pt-1.5 mt-1 px-1 text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-[#10b981] shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          <span className="text-white font-bold uppercase">{String(primarySubdivision).replace(/_/g, " ")}</span>
        </div>
        {compensatingSubdivision ? (
          <div className="flex items-center gap-1 text-[#ef4444] font-bold animate-pulse">
            <span>⚠️ COMPENSATION DETECTED</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-sm bg-[#06b6d4]" />
            <span>Synergist</span>
          </div>
        )}
      </div>
    </div>
  );
}
