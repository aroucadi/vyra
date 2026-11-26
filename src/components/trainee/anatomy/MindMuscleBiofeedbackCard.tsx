"use client";

import React, { useState } from "react";
import { clsx } from "clsx";
import { CheckCircle2, AlertTriangle, Sparkles, RefreshCw, Eye } from "lucide-react";
import { AnatomicalSubdivisionId } from "./MedicalVectorAtlas";

export interface SensationFeedbackOption {
  id: string;
  label: string;
  shortLabel: string;
  isOptimal: boolean;
  compensatingSubdivision: AnatomicalSubdivisionId | null;
  correctionCue: string;
}

export interface MindMuscleDiagnostic {
  exerciseKey: string;
  targetLabel: string;
  targetSubdivision: AnatomicalSubdivisionId;
  mentalIntention: string;
  options: SensationFeedbackOption[];
}

const DIAGNOSTIC_RULES: MindMuscleDiagnostic[] = [
  {
    exerciseKey: "incline_press",
    targetLabel: "Upper Clavicular Chest",
    targetSubdivision: "pec_clavicular",
    mentalIntention: "Drive upper arms diagonally across torso; squeeze upper chest fibers below the collarbone.",
    options: [
      {
        id: "locked_in",
        label: "Upper Chest Locked In (Prime Burn)",
        shortLabel: "Target Pec (100%)",
        isOptimal: true,
        compensatingSubdivision: null,
        correctionCue: "Perfect mind-muscle focus. Maintain 2-second eccentric lower into the stretch.",
      },
      {
        id: "front_delt",
        label: "Front Shoulders Taking Over",
        shortLabel: "Front Shoulders",
        isOptimal: false,
        compensatingSubdivision: "delt_anterior",
        correctionCue: "Shoulder Stealing Tension! Drop bench angle from 45° to 30°, tuck elbows to 45°, and retract scapulae.",
      },
      {
        id: "biceps_triceps",
        label: "Biceps / Arms Burning Before Chest",
        shortLabel: "Biceps / Arms",
        isOptimal: false,
        compensatingSubdivision: "biceps_brachii",
        correctionCue: "Grip Compensation! Relax your death-grip on the handles and drive upward through the palm heel.",
      },
      {
        id: "lower_back",
        label: "Lower Back Arching Off Pad",
        shortLabel: "Lower Back Arch",
        isOptimal: false,
        compensatingSubdivision: "erector_spinae",
        correctionCue: "Spinal Arch Fault! Flatten lower back into the pad, engage core, and lock ribs over pelvis.",
      },
    ],
  },
  {
    exerciseKey: "pulldown",
    targetLabel: "Iliac Lats & Scapular Depressors",
    targetSubdivision: "lats_iliac",
    mentalIntention: "Pull upper arm down toward hip pockets; feel lats flare and squeeze at the bottom.",
    options: [
      {
        id: "locked_in",
        label: "Lats & V-Taper Wings Locked In",
        shortLabel: "Target Lats (100%)",
        isOptimal: true,
        compensatingSubdivision: null,
        correctionCue: "Flawless lat recruitment. Hold the contraction for 1 full second without leaning back.",
      },
      {
        id: "biceps_forearms",
        label: "Biceps / Forearms Burning First",
        shortLabel: "Biceps / Forearms",
        isOptimal: false,
        compensatingSubdivision: "biceps_brachii",
        correctionCue: "Biceps Overtaking Lats! Switch to a thumbless hook grip and think 'pull with elbows, not hands'.",
      },
      {
        id: "upper_traps",
        label: "Neck / Upper Traps Shrugging Up",
        shortLabel: "Neck / Traps Shrug",
        isOptimal: false,
        compensatingSubdivision: "traps_upper",
        correctionCue: "Traps Shrugging! Keep neck long, depress shoulder blades downward BEFORE pulling the bar.",
      },
      {
        id: "lower_back_rock",
        label: "Swinging Torso Backward to Move Weight",
        shortLabel: "Torso Swing",
        isOptimal: false,
        compensatingSubdivision: "erector_spinae",
        correctionCue: "Momentum Cheating! Reduce weight 10%, sit upright with 10° fixed lean, and lock thighs under pads.",
      },
    ],
  },
  {
    exerciseKey: "lateral_raise",
    targetLabel: "Lateral Deltoid Mid-Fibers",
    targetSubdivision: "delt_lateral",
    mentalIntention: "Cast dumbbells out wide toward the walls; lead with the elbows in the scapular plane.",
    options: [
      {
        id: "locked_in",
        label: "Side Delts On Fire (Zero Neck Strain)",
        shortLabel: "Side Delts (100%)",
        isOptimal: true,
        compensatingSubdivision: null,
        correctionCue: "Optimal isolation. Stop 5 degrees below parallel to maintain continuous tension.",
      },
      {
        id: "traps_neck",
        label: "Upper Traps / Neck Straining",
        shortLabel: "Upper Traps",
        isOptimal: false,
        compensatingSubdivision: "traps_upper",
        correctionCue: "Traps Taking Over! Raise 30° forward in the scapular plane and keep shoulders pinned down.",
      },
      {
        id: "front_delt_swing",
        label: "Front Delts / Body Momentum",
        shortLabel: "Front Delt Swing",
        isOptimal: false,
        compensatingSubdivision: "delt_anterior",
        correctionCue: "Front Delt Swing! Pour elbows out like a pitcher; do not let palms rotate upward.",
      },
    ],
  },
  {
    exerciseKey: "rdl_hamstring",
    targetLabel: "Hamstring Tendons & Glutes",
    targetSubdivision: "hamstrings",
    mentalIntention: "Push hips straight back like closing a car door with your glutes; keep shins perpendicular.",
    options: [
      {
        id: "locked_in",
        label: "Deep Hamstring & Glute Stretch",
        shortLabel: "Hamstrings (100%)",
        isOptimal: true,
        compensatingSubdivision: null,
        correctionCue: "Superb posterior chain hinge. Drive through heels to return to standing lockout.",
      },
      {
        id: "lower_back_strain",
        label: "Lower Back / Spinal Erectors Aching",
        shortLabel: "Lower Back Ache",
        isOptimal: false,
        compensatingSubdivision: "erector_spinae",
        correctionCue: "Lumbar Overload Warning! Stop reaching for the floor; stop descent when hips stop moving backward.",
      },
      {
        id: "quad_dominant",
        label: "Knees Bending Too Much (Squatting It)",
        shortLabel: "Knees Bending",
        isOptimal: false,
        compensatingSubdivision: "quad_rectus_femoris",
        correctionCue: "Knees Bending! Keep shins vertical; this is a hip hinge, not a squat.",
      },
    ],
  },
  {
    exerciseKey: "leg_press_squat",
    targetLabel: "Quadriceps (Rectus Femoris & Vastus Medialis)",
    targetSubdivision: "quad_vastus_medialis",
    mentalIntention: "Drive feet through the platform; feel the burn directly above the knee caps in the teardrop.",
    options: [
      {
        id: "locked_in",
        label: "Quads Deep Tension (Clean Depth)",
        shortLabel: "Quads (100%)",
        isOptimal: true,
        compensatingSubdivision: null,
        correctionCue: "Maximum quad recruitment. Control the 3-second descent without bouncing off joints.",
      },
      {
        id: "butt_wink",
        label: "Pelvis Tucking / Butt Lifting Off Pad",
        shortLabel: "Pelvis Lifting",
        isOptimal: false,
        compensatingSubdivision: "erector_spinae",
        correctionCue: "Lumbar Curvature Warning! Grip side handles hard to glue pelvis to backpad; don't go deeper than pelvic neutrality.",
      },
      {
        id: "knee_pinch",
        label: "Knees Caving Inward on Drive",
        shortLabel: "Knees Caving",
        isOptimal: false,
        compensatingSubdivision: "glute_medius",
        correctionCue: "Valgus Collapse! Actively push knees outward in line with your 2nd and 3rd toes.",
      },
    ],
  },
];

export interface MindMuscleBiofeedbackCardProps {
  exerciseName?: string;
  movementName?: string;
  targetMuscle?: string;
  onCompensationChange?: (compensatingSubdivision: AnatomicalSubdivisionId | null, cue: string | null) => void;
  onSelectSensation?: (sensationId: string, compensatingSubdivision: AnatomicalSubdivisionId | null, cue?: string) => void;
  onOpen3DLab?: () => void;
  className?: string;
}

export function getBiofeedbackDiagnostic(exerciseName?: string, targetMuscle?: string): MindMuscleDiagnostic {
  const nameLower = `${exerciseName || ""} ${targetMuscle || ""}`.toLowerCase();
  const matchedRule = DIAGNOSTIC_RULES.find((r) => {
    if (r.exerciseKey === "incline_press") return nameLower.includes("incline") && (nameLower.includes("press") || nameLower.includes("chest") || nameLower.includes("bench"));
    if (r.exerciseKey === "pulldown") return nameLower.includes("pulldown") || nameLower.includes("pull up") || nameLower.includes("lat") || nameLower.includes("row");
    if (r.exerciseKey === "lateral_raise") return nameLower.includes("lateral raise") || nameLower.includes("side delt") || nameLower.includes("raise");
    if (r.exerciseKey === "rdl_hamstring") return nameLower.includes("deadlift") || nameLower.includes("rdl") || nameLower.includes("hamstring");
    if (r.exerciseKey === "leg_press_squat") return nameLower.includes("squat") || nameLower.includes("leg press") || nameLower.includes("quad");
    return false;
  });

  return matchedRule || DIAGNOSTIC_RULES[0];
}

export function MindMuscleBiofeedbackCard({
  exerciseName,
  movementName,
  targetMuscle,
  onCompensationChange,
  onSelectSensation,
  onOpen3DLab,
  className,
}: MindMuscleBiofeedbackCardProps) {
  const effectiveName = movementName || exerciseName || "";
  const matchedRule = getBiofeedbackDiagnostic(effectiveName, targetMuscle);

  const [selectedOptionId, setSelectedOptionId] = useState<string>("locked_in");
  const activeOption = matchedRule.options.find((o) => o.id === selectedOptionId) || matchedRule.options[0];

  const handleSelectOption = (option: SensationFeedbackOption) => {
    setSelectedOptionId(option.id);
    onCompensationChange?.(option.compensatingSubdivision, option.isOptimal ? null : option.correctionCue);
    onSelectSensation?.(option.id, option.compensatingSubdivision, option.correctionCue);
  };

  return (
    <div
      className={clsx(
        "flex flex-col p-3 rounded-2xl bg-[#090d15] border border-[#1b2d47] shadow-lg font-body space-y-2.5",
        className
      )}
    >
      {/* Header: Visual Focus Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Mind-Muscle Target
            </span>
            <h4 className="text-xs font-display font-bold text-white leading-tight">
              {matchedRule.targetLabel}
            </h4>
          </div>
        </div>

        {onOpen3DLab && (
          <button
            type="button"
            onClick={onOpen3DLab}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0f1a2a] hover:bg-[#14233a] border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
          >
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>Inspect 3D</span>
          </button>
        )}
      </div>

      {/* Internal Focus Cue (Zero-Fluff) */}
      <div className="p-2 rounded-xl bg-[#0d1422] border border-[#17253b] text-[11px] text-slate-200 leading-snug">
        <span className="text-[#10b981] font-mono font-bold uppercase text-[9px] mr-1">
          KINETIC INTENTION:
        </span>
        {matchedRule.mentalIntention}
      </div>

      {/* Interactive Sensation Check: "Where are you feeling the burn?" */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400">
            Sensorimotor Sensation Check:
          </span>
          <span className="text-[9px] font-mono text-slate-500">
            Tap where you feel the burn
          </span>
        </div>

        {/* 1-Tap Pills */}
        <div className="grid grid-cols-2 gap-1.5">
          {matchedRule.options.map((opt) => {
            const isSelected = opt.id === selectedOptionId;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className={clsx(
                  "flex items-center justify-between p-2 rounded-xl border text-left text-[11px] font-medium transition-all active:scale-98",
                  isSelected && opt.isOptimal && "bg-[#10b981]/15 border-[#10b981] text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]",
                  isSelected && !opt.isOptimal && "bg-[#ef4444]/15 border-[#ef4444] text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse",
                  !isSelected && "bg-[#0b101a] border-[#162236] text-slate-400 hover:text-slate-200 hover:border-slate-700"
                )}
              >
                <span className="truncate pr-1 font-semibold">{opt.shortLabel}</span>
                {opt.isOptimal ? (
                  <CheckCircle2
                    className={clsx(
                      "w-3.5 h-3.5 shrink-0",
                      isSelected ? "text-[#10b981]" : "text-slate-600"
                    )}
                  />
                ) : (
                  <AlertTriangle
                    className={clsx(
                      "w-3.5 h-3.5 shrink-0",
                      isSelected ? "text-[#ef4444]" : "text-slate-600"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Diagnostic Instant Feedback Banner */}
      <div
        className={clsx(
          "p-2.5 rounded-xl border transition-all text-xs leading-relaxed",
          activeOption.isOptimal
            ? "bg-[#10b981]/10 border-[#10b981]/40 text-emerald-200"
            : "bg-[#ef4444]/10 border-[#ef4444]/50 text-red-100"
        )}
      >
        <div className="flex items-start gap-2">
          {activeOption.isOptimal ? (
            <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5 animate-bounce" />
          )}
          <div className="space-y-0.5">
            <span
              className={clsx(
                "text-[9px] font-mono font-bold uppercase tracking-wider block",
                activeOption.isOptimal ? "text-[#10b981]" : "text-[#ef4444]"
              )}
            >
              {activeOption.isOptimal ? "FORM VERIFIED // TARGET LOCKED" : "COMPENSATION DETECTED // BIOMECHANICAL FIX"}
            </span>
            <p className="text-[11px] font-medium leading-snug">
              {activeOption.correctionCue}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
