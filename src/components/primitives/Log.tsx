"use client";

import React from "react";
import { clsx } from "clsx";
import { Plus, Minus } from "lucide-react";

export interface LogProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Log({ children, className, ...props }: LogProps) {
  return (
    <div className={clsx("space-y-4", className)} {...props}>
      {children}
    </div>
  );
}

// 1. Stepper Input for numeric values (weight, reps, rir)
export function LogStepper({
  label,
  value,
  step = 1,
  min = 0,
  max = 999,
  unit,
  onChange,
  className,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  onChange: (val: number) => void;
  className?: string;
}) {
  const handleDecrement = () => {
    const next = Math.max(min, Number((value - step).toFixed(2)));
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, Number((value + step).toFixed(2)));
    onChange(next);
  };

  return (
    <div className={clsx("bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center", className)}>
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </span>
      
      <div className="flex items-center justify-between w-full">
        {/* Decrement Button (44x44px target) */}
        <button
          type="button"
          onClick={handleDecrement}
          aria-label={`Decrease ${label}`}
          className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        >
          <Minus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
        </button>

        {/* Display Value (Tabular) */}
        <div className="flex flex-col items-center justify-center px-2">
          <span className="text-xl font-bold text-white tabular tracking-tight">
            {value}
          </span>
          {unit && <span className="text-[10px] text-slate-500 font-mono">{unit}</span>}
        </div>

        {/* Increment Button (44x44px target) */}
        <button
          type="button"
          onClick={handleIncrement}
          aria-label={`Increase ${label}`}
          className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// 2. Big Confirm Action Button
export function LogConfirm({
  label = "Log set",
  subLabel,
  disabled = false,
  onClick,
  className,
}: {
  label?: string;
  subLabel?: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-lg transition-all flex flex-col items-center justify-center gap-0.5",
        "bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span>{label}</span>
      {subLabel && <span className="text-[10px] font-medium opacity-80">{subLabel}</span>}
    </button>
  );
}

Log.Stepper = LogStepper;
Log.Confirm = LogConfirm;
