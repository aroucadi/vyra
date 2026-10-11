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
      <SheetContent side="bottom" className="max-w-md mx-auto rounded-t-3xl bg-[#0B0F17] border-slate-800 p-6 max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <SheetTitle className="text-base font-bold text-white">Adjust Today&apos;s Session</SheetTitle>
          </div>
          <SheetDescription className="text-xs text-slate-400">
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
              className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-[0.98] rounded-xl text-left transition cursor-pointer"
            >
              <div className="text-xs font-semibold text-white">{c.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Apply adjustment →</div>
            </button>
          ))}
        </div>

        {/* Feedback message and resolved card */}
        {activeMessage && (
          <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-in fade-in duration-200">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
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
