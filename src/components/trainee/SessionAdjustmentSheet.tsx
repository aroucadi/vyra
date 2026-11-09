"use client";

import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { resolveCoachQuery, CoachSmartActionCardData } from "@/lib/coach-engine";
import { CoachSmartActionCard } from "@/components/coach/CoachSmartActionCard";
import { Sparkles, SlidersHorizontal, ArrowRight, Zap, Check } from "lucide-react";
import { clsx } from "clsx";

interface SessionAdjustmentSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function SessionAdjustmentSheet({
  isOpen,
  onOpenChange,
  userId,
}: SessionAdjustmentSheetProps) {
  const [activeCard, setActiveCard] = useState<CoachSmartActionCardData | null>(null);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  const chips = [
    { label: "Short on time (30 min)", query: "I am short on time today, condense my workout to 30 min." },
    { label: "Swap machine press", query: "I need an alternative exercise for the machine press." },
    { label: "Go lighter on legs", query: "My lower body feels fatigued today, adjust leg loads by 10%." },
    { label: "Why this weight?", query: "Why was this specific weight prescribed for my sets?" },
  ];

  const handleChipClick = (query: string) => {
    const resolved = resolveCoachQuery(userId, query);
    setActiveMessage(resolved.text);
    setActiveCard(resolved.card || null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-w-md mx-auto rounded-t-3xl bg-[#090C11] border-[#1C2436] p-6 max-h-[85vh] overflow-y-auto font-body text-slate-100 shadow-2xl">
        <SheetHeader className="text-left space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-amber-400" />
              <span>COACH ADJUSTMENT</span>
            </span>
          </div>
          <SheetTitle className="text-xl font-editorial font-bold text-white tracking-tight pt-1">
            Adjust Today&apos;s Session
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-400 font-body">
            One-tap deterministic adjustments. No freeform typing required.
          </SheetDescription>
        </SheetHeader>

        {/* Action Chips */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => handleChipClick(c.query)}
              className="p-3.5 bg-[#111622] border border-[#1C2436] hover:border-slate-700 hover:bg-[#182030] active:scale-[0.98] rounded-xl text-left transition cursor-pointer font-body"
            >
              <div className="text-xs font-semibold text-white">{c.label}</div>
              <div className="text-[10px] text-amber-400 font-mono mt-0.5">Apply adjustment →</div>
            </button>
          ))}
        </div>

        {/* Feedback message and resolved card */}
        {activeMessage && (
          <div className="space-y-3 pt-2 border-t border-[#1C2436] animate-in fade-in duration-200">
            <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-xl text-xs text-slate-300 leading-relaxed font-body">
              {activeMessage}
            </div>

            {activeCard && (
              <CoachSmartActionCard
                card={activeCard}
                traineeId={userId}
                onApplied={() => {
                  setTimeout(() => {
                    onOpenChange(false);
                  }, 800);
                }}
              />
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
