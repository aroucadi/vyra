"use client";

import React from "react";
import { WorkoutSession, SetLog } from "@/lib/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dumbbell, Clock, Trophy, Flame, CheckCircle2, Calendar } from "lucide-react";

interface WorkoutSessionDetailSheetProps {
  session: WorkoutSession | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkoutSessionDetailSheet({
  session,
  isOpen,
  onOpenChange,
}: WorkoutSessionDetailSheetProps) {
  if (!session) return null;

  // Calculate high-level summary metrics
  const totalVolume = session.setLogs
    ? session.setLogs.reduce((acc, l) => acc + (l.weightKg || 0) * (l.reps || 0), 0)
    : 0;

  const prCount = session.setLogs
    ? session.setLogs.filter((l) => l.isPR).length
    : 0;

  const dropSetCount = session.setLogs
    ? session.setLogs.filter((l) => l.isDropSet).length
    : 0;

  const durationMin = session.durationSec
    ? Math.max(1, Math.round(session.durationSec / 60))
    : 0;

  // Group set logs by exercise name preserving order of appearance
  const exerciseGroups: {
    name: string;
    equipment?: string;
    sets: SetLog[];
    totalVolume: number;
  }[] = [];

  if (session.setLogs) {
    session.setLogs.forEach((log) => {
      let group = exerciseGroups.find((g) => g.name === log.exerciseName);
      if (!group) {
        group = {
          name: log.exerciseName,
          equipment: log.selectedEquipment,
          sets: [],
          totalVolume: 0,
        };
        exerciseGroups.push(group);
      }
      group.sets.push(log);
      group.totalVolume += (log.weightKg || 0) * (log.reps || 0);
    });
  }

  // Format date display (e.g. Monday, Oct 20, 2026)
  const formattedDate = session.date
    ? new Date(session.date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : "Completed Workout";

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-w-md mx-auto max-h-[88vh] overflow-y-auto rounded-t-3xl bg-[#0B0F17] border-slate-800 p-6 space-y-5 shadow-2xl"
      >
        <SheetHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>LOGGED WORKOUT</span>
            </span>
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
            </span>
          </div>

          <SheetTitle className="text-lg font-bold text-white tracking-tight">
            {session.dayLabel || session.programTitle || "Workout Session"}
          </SheetTitle>

          <SheetDescription className="text-xs text-slate-400">
            {session.setLogs?.length || 0} total sets recorded · {exerciseGroups.length} exercises performed
          </SheetDescription>
        </SheetHeader>

        {/* Overview Metric Matrix (Max 3 numbers per AGENTS.md) */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
            <div className="text-base font-bold text-white tabular">
              {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5 font-medium">Vol (kg)</div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
            <div className="text-base font-bold text-white tabular">
              {durationMin > 0 ? `${durationMin}m` : "—"}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5 font-medium">Duration</div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
            <div className="text-base font-bold text-emerald-400 tabular flex items-center justify-center gap-1">
              {prCount > 0 ? (
                <>
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>+{prCount}</span>
                </>
              ) : (
                <span>{session.setLogs?.length || 0} Sets</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5 font-medium">
              {prCount > 0 ? "PRs Broken" : "Total Sets"}
            </div>
          </div>
        </div>

        {/* Exercise-by-Exercise Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
              Exercise Breakdown
            </span>
            {dropSetCount > 0 && (
              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                <span>{dropSetCount} Drop Sets</span>
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {exerciseGroups.map((group, gIdx) => (
              <div
                key={gIdx}
                className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-mono text-slate-500 text-[10px] w-5">
                      {gIdx + 1}.
                    </span>
                    <span className="font-semibold text-white text-xs truncate">
                      {group.name}
                    </span>
                    {group.equipment && (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {group.equipment}
                      </span>
                    )}
                    {(() => {
                      const tagsFromSets = group.sets.flatMap((s) => s.feedbackTags || (s.feedbackTag ? [s.feedbackTag] : []));
                      const tagsFromSession = session.exerciseFeedbacks?.find((f) => f.exerciseName === group.name)?.tags ||
                        (session.exerciseFeedbacks?.find((f) => f.exerciseName === group.name)?.tag ? [session.exerciseFeedbacks.find((f) => f.exerciseName === group.name)!.tag!] : []);
                      const combined = Array.from(new Set([...tagsFromSets, ...tagsFromSession]));
                      if (combined.length === 0) return null;
                      const labelMap: Record<string, string> = {
                        balance_issue: "⚖️ Balance",
                        joint_strain: "⚡ Joint",
                        heavy: "🥵 Heavy",
                        light: "🪶 Light",
                        optimal: "🎯 Optimal",
                      };
                      return (
                        <div className="flex items-center gap-1 flex-wrap">
                          {combined.map((tag) => (
                            <span key={tag} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                              {labelMap[tag] || tag}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold tabular flex-shrink-0">
                    {group.totalVolume > 0 ? `${group.totalVolume.toLocaleString()} kg` : ""}
                  </span>
                </div>

                {/* Set Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {group.sets.map((s, sIdx) => (
                    <div
                      key={sIdx}
                      className={`px-2 py-1 rounded-lg text-xs font-mono border flex items-center gap-1.5 ${
                        s.isDropSet
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          : s.isPR
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-slate-950 border-slate-800 text-slate-200"
                      }`}
                    >
                      <span className="text-[10px] text-slate-400">
                        {s.isDropSet ? "🔥 Drop" : `S${sIdx + 1}`}
                      </span>
                      <span className="font-bold tabular">{s.weightKg}kg</span>
                      <span className="text-slate-400 tabular">× {s.reps}</span>
                      {s.isPR && (
                        <Trophy className="w-3 h-3 text-amber-400 ml-0.5" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
