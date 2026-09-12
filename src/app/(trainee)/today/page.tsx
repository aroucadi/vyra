"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Play,
  CheckCircle2,
  Circle,
  Video,
  Flame,
  Clock,
  Dumbbell,
  Shield,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { appStore } from "@/lib/store";
import { resolveProgramDay } from "@/lib/utils";

export default function TodayPage() {
  const currentUser = appStore.getCurrentUser();
  const program = appStore.getActiveProgramForTrainee(currentUser.id);

  // Daily protocol interactive state
  const [hydrationChecked, setHydrationChecked] = useState(true);
  const [mobilityChecked, setMobilityChecked] = useState<{ [key: string]: boolean }>({
    m1: true,
    m2: false,
    m3: false,
  });

  const [supplementChecked, setSupplementChecked] = useState<{ [key: string]: boolean }>({
    creatine: true,
    electrolytes: false,
  });

  if (!program) {
    return (
      <div className="p-6 text-center space-y-4 my-auto">
        <div className="w-16 h-16 rounded-full bg-[#162032] border border-[#334155] mx-auto flex items-center justify-center">
          <Dumbbell className="w-8 h-8 text-[#10B981]" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">No Active Program</h2>
        <p className="text-sm text-slate-400">
          Your coach has not assigned a published program yet.
        </p>
      </div>
    );
  }

  // Resolve today's program day
  const resolved = resolveProgramDay(program.startDate);
  const currentWeek = program.weeks.find((w) => w.weekIndex === resolved.weekIndex) || program.weeks[0];
  const currentDay = currentWeek?.days.find((d) => d.dayOfWeek === resolved.dayOfWeek) || currentWeek?.days[0];

  const toggleMobility = (key: string) => {
    setMobilityChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSupplement = (key: string) => {
    setSupplementChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="px-4 py-5 space-y-5">
      {/* 1. Top Header & Readiness Bar */}
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#F8FAFC] tracking-tight">
              Good morning, {currentUser.name.split(" ")[0]}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block animate-pulse" />
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#8B5CF6]" />
                Coach Marcus online
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#162032] border border-[#06B6D4]/40 text-[#06B6D4] text-xs font-mono font-semibold">
              <Sparkles className="w-3 h-3" />
              Readiness 92%
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">Optimal Load State</p>
          </div>
        </div>

        {/* Program Pill Bar */}
        <div className="bg-[#162032] border border-[#1E293B] rounded-lg p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-bold text-[11px] uppercase tracking-wide">
              {program.title}
            </span>
            <span className="text-slate-300 font-medium">
              Week {resolved.weekIndex} • Day {resolved.dayOfWeek + 1}
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            {currentDay?.isRestDay ? "Rest" : "Push Focus"}
          </span>
        </div>
      </header>

      {/* 2. Daily Protocol Card */}
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-sm font-bold text-[#F8FAFC]">Daily Protocol & Warmup</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">2 of 4 complete</span>
        </div>

        <div className="space-y-2 text-xs">
          <button
            onClick={() => setHydrationChecked(!hydrationChecked)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-[#0F172A] border border-[#1E293B] hover:border-slate-700 transition text-left"
          >
            <span className={hydrationChecked ? "line-through text-slate-500" : "text-slate-200"}>
              750ml water + electrolyte mineral salts
            </span>
            {hydrationChecked ? (
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-600 shrink-0" />
            )}
          </button>

          <div className="p-2 rounded-lg bg-[#0F172A] border border-[#1E293B] space-y-1.5">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Mobility Checklist:</p>
            {[
              { id: "m1", text: "Thoracic spine foam roller rotations (10x)" },
              { id: "m2", text: "Overhead band pull-aparts (15x)" },
              { id: "m3", text: "Scapular wall slides & wrist extensions" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => toggleMobility(item.id)}
                className="w-full flex items-center justify-between py-1 text-left text-xs"
              >
                <span className={mobilityChecked[item.id] ? "line-through text-slate-500" : "text-slate-300"}>
                  {item.text}
                </span>
                {mobilityChecked[item.id] ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Workout Prescription Card */}
      {currentDay?.isRestDay ? (
        <section className="bg-[#162032] rounded-xl border border-[#06B6D4]/30 p-5 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/40 mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6 text-[#06B6D4]" />
          </div>
          <h2 className="text-base font-bold text-slate-100">Scheduled Rest & Regeneration</h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Today is dedicated to muscular rebuilding, parasympathetic tone, and glycogen replenishment.
          </p>
        </section>
      ) : (
        <section className="bg-[#162032] rounded-xl border border-[#334155] p-4 space-y-4 shadow-lg">
          <div className="flex items-start justify-between border-b border-[#1E293B] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <h2 className="text-base font-black text-[#F8FAFC] tracking-tight">
                  {currentDay?.label || "Push Hypertrophy A"}
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#06B6D4]" />
                  Est. {currentDay?.blocks ? Math.max(30, Math.round(currentDay.blocks.reduce((acc, b) => acc + b.exercises.reduce((sAcc, e) => sAcc + e.sets, 0), 0) * 3.5)) : 52} mins
                </span>
                <span>•</span>
                <span>{currentDay?.blocks?.reduce((acc, b) => acc + b.exercises.length, 0) || 4} Movements</span>
                <span>•</span>
                <span>{currentDay?.blocks?.reduce((acc, b) => acc + b.exercises.reduce((sAcc, e) => sAcc + e.sets, 0), 0) || 12} Sets</span>
              </div>
            </div>

            <Link
              href="/session"
              className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              Start
            </Link>
          </div>

          {/* Exercise Rows */}
          <div className="space-y-3">
            {currentDay?.blocks && currentDay.blocks.length > 0 ? (
              currentDay.blocks.map((b, bIdx) => {
                if (b.type === "superset" || b.type === "circuit") {
                  return (
                    <div key={b.id || bIdx} className="border border-[#06B6D4]/40 bg-[#06B6D4]/5 rounded-xl p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#06B6D4]" />
                          <span className="text-xs font-bold text-[#06B6D4] tracking-wide uppercase">
                            {b.type === "superset" ? "Superset" : "Circuit"} ({b.exercises.length} Movements)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          Shared Rest {b.exercises[b.exercises.length - 1]?.restSeconds || 60}s
                        </span>
                      </div>
                      <div className="space-y-2">
                        {b.exercises.map((ex, exIdx) => (
                          <div key={ex.id || exIdx} className="bg-[#0F172A] p-2.5 rounded-lg border border-[#1E293B]">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                              <span>
                                {bIdx + 1}.{String.fromCharCode(97 + exIdx)} {ex.exerciseName}
                              </span>
                              <span className="text-[#10B981] font-mono">
                                {ex.sets} × {ex.repRangeLow}–{ex.repRangeHigh} @ {ex.rirScheme?.[0] ?? 1} RIR
                              </span>
                            </div>
                            {ex.formCueText && (
                              <p className="text-[10px] text-slate-400 mt-0.5">{ex.formCueText}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                return b.exercises.map((ex, exIdx) => (
                  <div key={ex.id || exIdx} className="bg-[#0F172A] rounded-lg p-3 border border-[#1E293B] space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-[#F8FAFC]">
                          {bIdx + 1}. {ex.exerciseName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono font-semibold text-[#10B981]">
                            {ex.sets} sets × {ex.repRangeLow}–{ex.repRangeHigh} reps
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#162032] border border-[#334155] text-[10px] text-[#06B6D4] font-mono">
                            @ {ex.rirScheme?.[0] ?? 2} RIR
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#162032] border border-[#334155] text-[10px] text-slate-300 font-mono">
                            Rest {ex.restSeconds}s
                          </span>
                        </div>
                      </div>

                      {ex.videoUrl && (
                        <a
                          href={ex.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-[#06B6D4] flex items-center gap-1 text-[11px]"
                        >
                          <Video className="w-3.5 h-3.5 text-[#06B6D4]" />
                          <span>Guide</span>
                        </a>
                      )}
                    </div>

                    {ex.formCueText && (
                      <div className="bg-[#162032]/80 p-2 rounded text-[11px] text-slate-300 border-l-2 border-[#10B981] flex items-start gap-1.5">
                        <Info className="w-3 h-3 text-[#10B981] shrink-0 mt-0.5" />
                        <span>{ex.formCueText}</span>
                      </div>
                    )}
                  </div>
                ));
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No exercises scheduled for this day.</p>
            )}
          </div>
        </section>
      )}

      {/* 4. Nutrition & Fuel Targets Card */}
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#F8FAFC]">Nutrition & Fuel Targets</h2>
          <span className="text-[11px] font-mono text-[#10B981] font-semibold">142g / 180g Protein (79%)</span>
        </div>

        {/* Protein Progress Bar */}
        <div className="w-full bg-[#0F172A] rounded-full h-2.5 overflow-hidden border border-[#1E293B]">
          <div className="bg-gradient-to-r from-[#10B981] to-[#06B6D4] h-2.5 rounded-full w-[79%]" />
        </div>

        <div className="text-xs space-y-2 pt-1">
          <div className="p-2.5 rounded-lg bg-[#0F172A] border border-[#1E293B] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#06B6D4] font-bold">
              Pre-Workout Timing
            </span>
            <p className="text-slate-300 text-xs">
              40g carbs + 25g protein consumed 60–90m prior (e.g. Oatmeal & Whey Isolate).
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">Target Supplements:</span>
            <div className="flex gap-2">
              <button
                onClick={() => toggleSupplement("creatine")}
                className={`px-2 py-1 rounded text-[11px] font-medium border transition ${
                  supplementChecked.creatine
                    ? "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40"
                    : "bg-[#0F172A] text-slate-400 border-[#334155]"
                }`}
              >
                Creatine 5g {supplementChecked.creatine ? "✓" : "+"}
              </button>
              <button
                onClick={() => toggleSupplement("electrolytes")}
                className={`px-2 py-1 rounded text-[11px] font-medium border transition ${
                  supplementChecked.electrolytes
                    ? "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40"
                    : "bg-[#0F172A] text-slate-400 border-[#334155]"
                }`}
              >
                Electrolytes {supplementChecked.electrolytes ? "✓" : "+"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Sticky Floating Start Workout CTA */}
      {!currentDay?.isRestDay && (
        <div className="sticky bottom-20 z-40">
          <Link
            href="/session"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:opacity-95 transition active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            Start Workout Session
          </Link>
        </div>
      )}
    </div>
  );
}
