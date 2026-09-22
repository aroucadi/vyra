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
        "p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex items-start gap-3 transition-colors",
        className
      )}
    >
      <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
            Cross-Pillar Insight
          </span>
          {sourcePillars && sourcePillars.length > 0 && (
            <span className="text-[10px] text-slate-500 font-mono">
              ({sourcePillars.join(" + ")})
            </span>
          )}
        </div>

        <p className="text-xs text-slate-200 leading-relaxed font-normal">
          {sentence}
        </p>

        {onWhyClick && (
          <button
            type="button"
            onClick={onWhyClick}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors mt-2 inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 rounded"
          >
            <span>Why?</span>
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
