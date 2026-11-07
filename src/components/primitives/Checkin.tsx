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
        "group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 font-body",
        checked
          ? "bg-[#090C11] border-amber-500/30 text-slate-400 opacity-80"
          : "bg-[#111622] border-[#1C2436] hover:bg-[#182030] hover:border-slate-700 shadow-sm",
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
              ? "bg-amber-400 border-amber-400 text-slate-950 font-bold shadow-sm"
              : "border-[#1C2436] bg-[#090C11] group-hover:border-slate-600 text-transparent"
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
                checked ? "line-through text-slate-500" : "text-white"
              )}
            >
              {title}
            </span>
            {badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#182030] text-amber-300/90 border border-[#1C2436] font-mono">
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
        <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">
          {time}
        </span>
      )}
    </div>
  );
}
