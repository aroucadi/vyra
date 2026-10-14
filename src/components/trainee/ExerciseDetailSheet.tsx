"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { RagExercise } from "@/types/exercise-rag";
import { PlateCalculatorPopover } from "@/components/trainee/PlateCalculatorPopover";
import { Dumbbell, ShieldCheck, ArrowRight, X, Sparkles, AlertCircle } from "lucide-react";
import { clsx } from "clsx";

interface ExerciseDetailSheetProps {
  exercise: RagExercise | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectAsSubstitute?: (exercise: RagExercise) => void;
}

export function ExerciseDetailSheet({
  exercise,
  isOpen,
  onClose,
  onSelectAsSubstitute,
}: ExerciseDetailSheetProps) {
  const [substitutes, setSubstitutes] = React.useState<RagExercise[]>([]);

  React.useEffect(() => {
    if (!exercise || !isOpen) return;
    let active = true;
    const fetchSubs = async () => {
      try {
        const res = await fetch(`/api/exercises?muscle=${encodeURIComponent(exercise.target)}&limit=4`);
        if (!res.ok) return;
        const data = await res.json();
        if (active) {
          const filtered = (data.exercises || []).filter((e: RagExercise) => e.id !== exercise.id).slice(0, 3);
          setSubstitutes(filtered);
        }
      } catch {
        // fail silently
      }
    };
    fetchSubs();
    return () => {
      active = false;
    };
  }, [exercise?.id, exercise?.target, isOpen]);

  if (!exercise) return null;

  const isBarbellOrSmith =
    exercise.equipment.toLowerCase().includes("barbell") ||
    exercise.equipment.toLowerCase().includes("smith");

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-w-md mx-auto rounded-t-3xl bg-[#0B0F17] border-slate-800 p-6 space-y-5 max-h-[85vh] overflow-y-auto"
      >
        {/* Element 1: Header / Eyebrow (Negative Constraint Ceiling: Max 3 elements per section) */}
        <SheetHeader className="text-left space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {exercise.category || "Strength"}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                {exercise.equipment}
              </span>
            </div>
            {isBarbellOrSmith && (
              <PlateCalculatorPopover
                totalWeight={60}
                unit="kg"
                equipmentType={exercise.equipment}
              />
            )}
          </div>
          <SheetTitle className="text-lg font-bold text-white tracking-tight pt-1">
            {exercise.name}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-400">
            Primary Target: <span className="text-emerald-400 font-semibold">{exercise.target}</span> · Body Part: <span className="text-slate-300">{exercise.bodyPart}</span>
          </SheetDescription>
        </SheetHeader>

        {/* Element 2: Secondary Muscles & Synergists */}
        {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
          <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-2">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Synergists & Stabilizers
            </span>
            <div className="flex flex-wrap gap-1.5">
              {exercise.secondaryMuscles.map((sm, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-950 text-slate-300 border border-slate-800"
                >
                  {sm}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Element 3: Step-by-Step Biomechanical Execution */}
        {exercise.instructions && exercise.instructions.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
              Step-by-Step Biomechanics
            </h4>
            <div className="space-y-2 text-xs leading-relaxed text-slate-300">
              {exercise.instructions.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/40 border border-slate-800/60">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-[11.5px] leading-snug">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Element 4: Direct Biomechanical Swaps (Outside of workout) */}
        {substitutes.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Biomechanical Swap Alternatives
            </span>
            <div className="space-y-1.5">
              {substitutes.map((sub) => (
                <div
                  key={sub.id}
                  className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="font-semibold text-white truncate">{sub.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{sub.equipment} · {sub.target}</div>
                  </div>
                  {onSelectAsSubstitute && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectAsSubstitute(sub);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 text-[10px] font-mono font-bold transition shrink-0 cursor-pointer"
                    >
                      Swap
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single Dominant CTA: Substitute or Close */}
        <div className="pt-2">
          {onSelectAsSubstitute ? (
            <button
              type="button"
              onClick={() => {
                onSelectAsSubstitute(exercise);
                onClose();
              }}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Select as Active Exercise</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
