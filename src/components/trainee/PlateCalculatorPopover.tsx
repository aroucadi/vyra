"use client";

import React, { useState } from "react";
import { calculateBarbellPlates, DEFAULT_BAR_KG, DEFAULT_BAR_LB, WeightUnit } from "@/lib/training-math/plates";
import { Disc, ChevronDown, Check, X } from "lucide-react";
import { clsx } from "clsx";

interface PlateCalculatorPopoverProps {
  totalWeight: number;
  unit?: WeightUnit;
  equipmentType?: string;
  onWeightSelect?: (weight: number) => void;
}

export function PlateCalculatorPopover({
  totalWeight,
  unit = "kg",
  equipmentType = "barbell",
}: PlateCalculatorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [barWeight, setBarWeight] = useState<number>(() => {
    const isLb = unit === "lb";
    const lookup = isLb ? DEFAULT_BAR_LB : DEFAULT_BAR_KG;
    const key = equipmentType.toLowerCase();
    return lookup[key] ?? (isLb ? 45 : 20);
  });

  const plateResult = React.useMemo(() => {
    return calculateBarbellPlates(totalWeight, unit, barWeight);
  }, [totalWeight, unit, barWeight]);

  // Color coding by standard Olympic bumper colors
  const getPlateBadgeStyle = (w: number) => {
    if (unit === "kg") {
      if (w >= 25) return "bg-red-600 text-white border-red-500";
      if (w >= 20) return "bg-blue-600 text-white border-blue-500";
      if (w >= 15) return "bg-amber-500 text-slate-950 border-amber-400";
      if (w >= 10) return "bg-emerald-600 text-white border-emerald-500";
      if (w >= 5) return "bg-slate-100 text-slate-900 border-slate-300";
      return "bg-slate-800 text-slate-200 border-slate-700";
    } else {
      if (w >= 45) return "bg-blue-600 text-white border-blue-500";
      if (w >= 35) return "bg-amber-500 text-slate-950 border-amber-400";
      if (w >= 25) return "bg-emerald-600 text-white border-emerald-500";
      if (w >= 10) return "bg-slate-100 text-slate-900 border-slate-300";
      return "bg-slate-800 text-slate-200 border-slate-700";
    }
  };

  return (
    <div className="relative inline-block">
      {/* 1-Tap Quick Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open plate loading calculator"
        className={clsx(
          "px-2.5 py-1.5 rounded-lg border text-[11px] font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer",
          isOpen
            ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-sm"
            : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
        )}
      >
        <Disc className="w-3.5 h-3.5 text-emerald-400" />
        <span className="tabular-nums">
          {plateResult.platesPerSide.length > 0
            ? `${plateResult.weightPerSide}${unit}/side`
            : "Plates"}
        </span>
        <ChevronDown className={clsx("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Floating Plate Breakdown Card (Ceiling compliant: 3 elements) */}
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-72 bg-[#0B0F17] border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 space-y-3">
          {/* Element 1: Eyebrow + Close */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5">
              <Disc className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                Rack Math · {totalWeight} {unit}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Element 2: Value / Plate Loading Stack */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Bar: <span className="font-bold text-slate-200 font-mono">{barWeight}{unit}</span></span>
              <span>Per side: <span className="font-bold text-emerald-400 font-mono tabular-nums">{plateResult.weightPerSide}{unit}</span></span>
            </div>

            {plateResult.platesPerSide.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl">
                <span className="text-[10px] uppercase font-mono text-slate-500 mr-1">Load:</span>
                {plateResult.platesPerSide.map((w, idx) => (
                  <span
                    key={idx}
                    className={clsx(
                      "px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border shadow-xs tabular-nums",
                      getPlateBadgeStyle(w)
                    )}
                  >
                    {w}
                  </span>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-center text-xs text-slate-400 font-mono">
                {totalWeight <= barWeight ? "Bar weight only (no plates needed)" : "No matching plates in inventory"}
              </div>
            )}

            {plateResult.remainder > 0 && (
              <div className="text-[10px] font-mono text-amber-400/90 text-right">
                ⚠️ Remainder: {plateResult.remainder} {unit} unallocated
              </div>
            )}
          </div>

          {/* Element 3: Barbell Type Selector (Smith / Olympic / Trap) */}
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1 text-[10px] font-mono">
            <span className="text-slate-500">Bar:</span>
            <div className="flex items-center gap-1">
              {[
                { label: "20kg Std", val: unit === "lb" ? 45 : 20 },
                { label: "15kg Bar", val: unit === "lb" ? 35 : 15 },
                { label: "Smith (9kg)", val: unit === "lb" ? 20 : 9 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setBarWeight(opt.val)}
                  className={clsx(
                    "px-1.5 py-0.5 rounded border transition",
                    barWeight === opt.val
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
