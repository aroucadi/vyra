"use client";

import React from "react";
import { clsx } from "clsx";
import { Sparkles } from "lucide-react";

export interface InsightProps {
  sentence: string;
  sourcePillars?: string[];
  whyPrompt?: string;
  onWhyClick?: () => void;
  className?: string;
}

export function Insight({
  sentence,
  sourcePillars,
  onWhyClick,
  className,
}: InsightProps) {
  return (
    <div
      className={clsx(
        "p-4 rounded-2xl bg-[#111622] border border-[#1C2436] shadow-sm flex items-start gap-3 transition-colors",
        className
      )}
    >
      <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
            Cross-Pillar Insight
          </span>
          {sourcePillars && sourcePillars.length > 0 && (
            <span className="text-[10px] text-slate-400 font-mono">
              ({sourcePillars.join(" + ")})
            </span>
          )}
        </div>

        <p className="text-xs text-slate-200 leading-relaxed font-body">
          {sentence}
        </p>

        {onWhyClick && (
          <button
            type="button"
            onClick={onWhyClick}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors mt-2 inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 rounded"
          >
            <span>Why?</span>
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
