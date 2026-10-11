"use client";

import React, { useState } from "react";
import { appStore } from "@/lib/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Checkin } from "@/components/primitives/Checkin";
import { Pill } from "lucide-react";

export function SupplementStackDrawer({
  isOpen,
  onOpenChange,
  userId,
  onUpdate,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onUpdate?: () => void;
}) {
  const todayStr = new Date().toISOString().split("T")[0];
  const program = appStore.getActiveProgramForTrainee(userId);
  const programId = program?.id || "prog_hypertrophy_1";

  // Load existing logs
  const [logs, setLogs] = useState<{ [doseId: string]: boolean }>(() => {
    const existing = appStore.getSupplementLogsForDate(userId, todayStr);
    const map: { [doseId: string]: boolean } = {};
    existing.forEach((l) => {
      if (l.status === "taken") map[l.doseId] = true;
    });
    return map;
  });

  const handleToggle = (protocolId: string, doseId: string, name: string, checked: boolean) => {
    setLogs((prev) => ({ ...prev, [doseId]: checked }));
    appStore.toggleSupplementDose(
      userId,
      programId,
      protocolId,
      doseId,
      todayStr,
      name
    );
    onUpdate?.();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-w-md mx-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 text-cyan-400">
            <Pill className="w-4 h-4" />
            <SheetTitle>Daily Supplement Protocols</SheetTitle>
          </div>
          <SheetDescription>
            Targeted micronutrient timing for peak performance and recovery.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pt-2 pb-6">
          
          {/* Group 1: Morning Micronutrient Stack */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Morning Stack (With Meal)
              </span>
              <span className="text-[11px] font-mono text-slate-500">08:00</span>
            </div>
            
            <div className="space-y-2">
              <Checkin
                id="supp_d3_k2"
                checked={!!logs["m1_d3_k2"]}
                onToggle={(checked) => handleToggle("supp_proto_foundational", "m1_d3_k2", "Vitamin D3 + K2", checked)}
                title="Vitamin D3 + K2"
                subtitle="5,000 IU D3 + 100 mcg K2 · Fat-soluble absorption"
                badge="Vital"
              />
              <Checkin
                id="supp_omega3"
                checked={!!logs["m2_omega3"]}
                onToggle={(checked) => handleToggle("supp_proto_foundational", "m2_omega3", "Triple-Strength Omega-3", checked)}
                title="Triple-Strength Omega-3"
                subtitle="2,000 mg EPA/DHA · Systemic inflammation control"
              />
              <Checkin
                id="supp_b_complex"
                checked={!!logs["m3_b_complex"]}
                onToggle={(checked) => handleToggle("supp_proto_foundational", "m3_b_complex", "Bioactive B-Complex", checked)}
                title="Bioactive B-Complex"
                subtitle="Methylated B12/Folate · Cellular energy co-factors"
              />
            </div>
          </div>

          {/* Group 2: Workout Nutrition Stack */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                Workout Performance Stack
              </span>
              <span className="text-[11px] font-mono text-slate-500">12:15</span>
            </div>

            <div className="space-y-2">
              <Checkin
                id="supp_creatine"
                checked={!!logs["creatine_dose_1"]}
                onToggle={(checked) => handleToggle("supp_proto_creatine", "creatine_dose_1", "Creatine Monohydrate", checked)}
                title="Creapure Creatine Monohydrate"
                subtitle="Loading Phase: 6.9 g (Dose 1 of 3) with water"
                badge="6.9 g"
              />
              <Checkin
                id="supp_electrolytes"
                checked={!!logs["electrolytes_intra"]}
                onToggle={(checked) => handleToggle("supp_proto_electrolytes", "electrolytes_intra", "Intra-Workout Electrolytes", checked)}
                title="Intra-Workout Electrolytes"
                subtitle="500 mg Sodium + 200 mg Potassium in 750 ml water"
              />
            </div>
          </div>

          {/* Group 3: Evening Wind-Down Stack */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
                Evening Wind-Down Stack
              </span>
              <span className="text-[11px] font-mono text-slate-500">21:30</span>
            </div>

            <div className="space-y-2">
              <Checkin
                id="supp_magnesium"
                checked={!!logs["m7_magnesium"]}
                onToggle={(checked) => handleToggle("supp_proto_sleep", "m7_magnesium", "Magnesium Bisglycinate", checked)}
                title="Magnesium Bisglycinate"
                subtitle="400 mg elemental magnesium · Supports evening wind-down"
                badge="Sleep"
              />
              <Checkin
                id="supp_theanine"
                checked={!!logs["m8_theanine"]}
                onToggle={(checked) => handleToggle("supp_proto_sleep", "m8_theanine", "L-Theanine", checked)}
                title="L-Theanine"
                subtitle="200 mg · Supports calm sleep onset"
              />
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}
