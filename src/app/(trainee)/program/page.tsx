"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Play, Dumbbell, ChevronRight, X, Layers, Check } from "lucide-react";
import { appStore } from "@/lib/store";
import { resolveProgramDay } from "@/lib/utils";
import { ProgramDay } from "@/lib/types";

export default function ProgramCalendarPage() {
  const currentUser = appStore.getCurrentUser();
  const program = appStore.getActiveProgramForTrainee(currentUser.id);
  const resolved = program ? resolveProgramDay(program.startDate) : { weekIndex: 1, dayOfWeek: 0, started: true };

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(() => resolved.weekIndex || 1);
  const [previewDay, setPreviewDay] = useState<ProgramDay | null>(null);

  if (!program) {
    return (
      <div className="p-6 text-center space-y-3 my-auto">
        <Dumbbell className="w-8 h-8 text-slate-500 mx-auto" />
        <p className="text-sm text-slate-400">No active program found.</p>
      </div>
    );
  }

  const activeWeek = program.weeks.find((w) => w.weekIndex === selectedWeekIndex) || program.weeks[0];

  const daysOfWeekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="px-4 py-5 space-y-5 pb-24">
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-[#F8FAFC]">Program Architecture</h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-bold">
            {program.durationWeeks - resolved.weekIndex + 1} Weeks Remaining
          </span>
        </div>
        <p className="text-xs text-slate-400">
          {program.title} • {program.startDate} to {program.endDate}
        </p>
      </header>

      {/* Week Selector Tabs */}
      <div className="flex gap-2 border-b border-[#1E293B] pb-2 overflow-x-auto">
        {program.weeks.map((week) => (
          <button
            key={week.id}
            onClick={() => setSelectedWeekIndex(week.weekIndex)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition ${
              selectedWeekIndex === week.weekIndex
                ? "bg-[#10B981] text-slate-950 shadow-sm"
                : "bg-[#162032] text-slate-400 hover:text-white border border-[#1E293B]"
            }`}
          >
            Week {week.weekIndex}
            {resolved.weekIndex === week.weekIndex && " (Current)"}
          </button>
        ))}
      </div>

      {/* Week 7-Day Matrix */}
      <div className="space-y-2.5">
        {activeWeek.days.map((day, idx) => {
          const isToday = resolved.weekIndex === selectedWeekIndex && resolved.dayOfWeek === day.dayOfWeek;
          const isPast = resolved.weekIndex > selectedWeekIndex || (resolved.weekIndex === selectedWeekIndex && resolved.dayOfWeek > day.dayOfWeek);

          return (
            <div
              key={day.id}
              onClick={() => setPreviewDay(day)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                isToday
                  ? "bg-[#162032] border-[#10B981] ring-1 ring-[#10B981]/50 shadow-md"
                  : day.isRestDay
                  ? "bg-[#162032]/40 border-[#1E293B] opacity-75"
                  : "bg-[#162032] border-[#1E293B] hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center font-mono text-xs font-black ${
                    isToday
                      ? "bg-[#10B981] text-slate-950"
                      : "bg-[#0F172A] border border-[#1E293B] text-slate-400"
                  }`}
                >
                  <span className="text-[9px] uppercase font-sans tracking-tight">
                    {daysOfWeekLabels[idx % 7]}
                  </span>
                  <span>D{idx + 1}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-100">{day.label}</h3>
                    {isToday && (
                      <span className="px-1.5 py-0.2 rounded bg-[#10B981]/20 text-[#10B981] text-[9px] font-bold uppercase">
                        Today
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {day.isRestDay ? "Recovery & Mobility" : `${day.blocks.length} Blocks Prescribed`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isPast && <Check className="w-4 h-4 text-[#10B981]" />}
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Preview Slide-over Modal */}
      {previewDay && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#162032] border-t sm:border border-[#334155] rounded-t-2xl sm:rounded-2xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#10B981] font-bold">
                  Day Detail Preview
                </span>
                <h3 className="text-base font-black text-white">{previewDay.label}</h3>
              </div>
              <button
                onClick={() => setPreviewDay(null)}
                className="p-1 rounded-lg bg-[#0F172A] border border-[#1E293B] text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {previewDay.isRestDay ? (
              <div className="p-4 bg-[#0F172A] rounded-xl text-center space-y-2 border border-[#1E293B]">
                <Clock className="w-6 h-6 text-[#06B6D4] mx-auto" />
                <p className="text-xs text-slate-300">
                  Rest day: prioritize mobility, parasympathetic breathing, and hydration.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {previewDay.blocks.map((b, bIdx) => (
                  <div key={b.id} className="bg-[#0F172A] p-3 rounded-xl border border-[#1E293B] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#06B6D4]">
                      {b.type === "superset" && <Layers className="w-3.5 h-3.5" />}
                      <span className="uppercase font-mono tracking-wider">
                        Block {bIdx + 1} ({b.type})
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {b.exercises.map((ex) => (
                        <div key={ex.id} className="text-xs flex justify-between items-center py-1 border-t border-[#1E293B]">
                          <span className="text-slate-200 font-medium">{ex.exerciseName}</span>
                          <span className="font-mono text-[#10B981]">
                            {ex.sets} × {ex.repRangeLow}-{ex.repRangeHigh}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/session"
                className="w-full py-3 rounded-xl bg-[#10B981] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                Launch This Session
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
