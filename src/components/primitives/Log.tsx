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
    <div className={clsx("bg-[#111622] border border-[#1C2436] rounded-2xl p-4 flex flex-col items-center shadow-sm", className)}>
      <span className="text-[11px] font-bold font-editorial uppercase tracking-wider text-slate-400 mb-2">
        {label}
      </span>
      
      <div className="flex items-center justify-between w-full">
        {/* Decrement Button (48x48px target for gym-gloved/sweaty hands) */}
        <button
          type="button"
          onClick={handleDecrement}
          aria-label={`Decrease ${label}`}
          className="w-12 h-12 rounded-xl bg-[#090C11] border border-[#1C2436] hover:border-[#2D3A54] active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-amber-500/50 cursor-pointer"
        >
          <Minus className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
        </button>

        {/* Display Value (Tabular font-display) */}
        <div className="flex flex-col items-center justify-center px-3">
          <span className="text-3xl sm:text-4xl font-black font-display text-white tabular tracking-tight">
            {value}
          </span>
          {unit && <span className="text-[11px] text-amber-400 font-mono font-semibold">{unit}</span>}
        </div>

        {/* Increment Button (48x48px target) */}
        <button
          type="button"
          onClick={handleIncrement}
          aria-label={`Increase ${label}`}
          className="w-12 h-12 rounded-xl bg-[#090C11] border border-[#1C2436] hover:border-[#2D3A54] active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-amber-500/50 cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// 2. Big Confirm Action Button (80px Tactile Touch Area for Zero-Cognition Gym Floor Logging)
export function LogConfirm({
  label = "Log set",
  subLabel,
  disabled = false,
  isHitTarget = false,
  onClick,
  className,
}: {
  label?: string;
  subLabel?: string;
  disabled?: boolean;
  isHitTarget?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "w-full min-h-[80px] py-4 px-6 rounded-2xl font-black font-editorial tracking-wide transition-all flex flex-col items-center justify-center gap-1 select-none cursor-pointer",
        isHitTarget
          ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 active:scale-[0.98] text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.45)] ring-2 ring-amber-300/40"
          : "bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className="text-base sm:text-lg flex items-center justify-center gap-1.5 font-display font-black tracking-tight leading-tight">
        {label}
      </span>
      {subLabel && (
        <span className="text-[11px] font-mono font-bold text-slate-950/80 tracking-normal">
          {subLabel}
        </span>
      )}
    </button>
  );
}

Log.Stepper = LogStepper;
Log.Confirm = LogConfirm;
