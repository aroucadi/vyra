"use client";

import React, { useId } from "react";
import { clsx } from "clsx";
import { Check } from "lucide-react";

export interface CheckinProps {
  id?: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  title: string;
  subtitle?: string;
  time?: string;
  badge?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkin({
  id: customId,
  checked,
  onToggle,
  title,
  subtitle,
  time,
  badge,
  disabled = false,
  className,
}: CheckinProps) {
  const generatedId = useId();
  const id = customId || generatedId;

  return (
    <div
      onClick={() => !disabled && onToggle(!checked)}
      className={clsx(
        "group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        checked
          ? "bg-slate-900/40 border-slate-800/60 opacity-80"
          : "bg-slate-900 border-slate-800 hover:border-slate-700 shadow-sm",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          if (!disabled) onToggle(!checked);
        }
      }}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        {/* Accessible 44x44px Touch Target Button / Indicator */}
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          className={clsx(
            "w-7 h-7 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 focus:outline-none",
            checked
              ? "bg-emerald-500 border-emerald-500 text-slate-950 font-bold"
              : "border-slate-700 bg-slate-950/60 group-hover:border-slate-600 text-transparent"
          )}
          aria-hidden="true"
        >
          <Check className={clsx("w-4 h-4 stroke-[3]", checked ? "scale-100" : "scale-0 transition-transform")} />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              id={`${id}-title`}
              className={clsx(
                "text-xs font-semibold tracking-tight truncate",
                checked ? "line-through text-slate-500" : "text-slate-200"
              )}
            >
              {title}
            </span>
            {badge && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p id={`${id}-sub`} className="text-[11px] text-slate-400 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {time && (
        <span className="text-[11px] font-mono text-slate-500 flex-shrink-0">
          {time}
        </span>
      )}
    </div>
  );
}
