"use client";

import React, { useState } from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { Dumbbell, Utensils, Moon, Shirt, Users, ArrowRight, Lock, Bell, Check } from "lucide-react";
import { clsx } from "clsx";

export default function LifePage() {
  const currentUser = appStore.getCurrentUser();
  const [notifiedPillars, setNotifiedPillars] = useState<{ [key: string]: boolean }>({});

  const handleNotifyToggle = (pillarKey: string) => {
    setNotifiedPillars((prev) => ({ ...prev, [pillarKey]: !prev[pillarKey] }));
  };

  return (
    <div className="flex-1 pb-24 px-4 pt-6 max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-white tracking-tight">Life Pillars</h1>
        <p className="text-xs text-slate-400">
          The 5 domains of human vitality. Master one; unlock the rest as your habits compound.
        </p>
      </header>

      <div className="space-y-4">
        
        {/* Pillar 1: Train (Active Room) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Dumbbell className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Train Well</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  16-Week Periodized Blueprint · Block 1 Hypertrophy
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/program"
              className="p-3 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl text-left transition"
            >
              <div className="text-xs font-bold text-white">Program Calendar</div>
              <div className="text-[11px] text-slate-400 mt-0.5">7-Day Week Strip →</div>
            </Link>

            <Link
              href="/progress"
              className="p-3 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl text-left transition"
            >
              <div className="text-xs font-bold text-white">Progress & PRs</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Volume Trends →</div>
            </Link>
          </div>
        </div>

        {/* Pillar 2: Eat / Nutrition + Supplements (Active Room) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Utensils className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Eat Well</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-mono font-bold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Micronutrient architecture, hydration & creatine loading
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/today"
            className="block p-3 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl text-left transition"
          >
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white">Daily Supplement Protocol</span>
              <span className="text-cyan-400 text-[11px] font-medium">View Stacks →</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Morning Stack · Intra-Workout Sodium · Evening Magnesium
            </p>
          </Link>
        </div>

        {/* Pillar 3: Sleep / Rest (Locked Tile) */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Moon className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-300">Sleep Well</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> COMING SOON
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  "Wake up ready." Circadian rest, NREM repair & HRV recovery.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleNotifyToggle("sleep")}
            className={clsx(
              "w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
              notifiedPillars["sleep"]
                ? "bg-indigo-950/60 border-indigo-700 text-indigo-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            )}
          >
            {notifiedPillars["sleep"] ? (
              <>
                <Check className="w-3.5 h-3.5 text-indigo-400" />
                <span>Notification set for Sleep launch</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" />
                <span>Notify me when ready</span>
              </>
            )}
          </button>
        </div>

        {/* Pillar 4: Style / Dress (Locked Tile) */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Shirt className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-300">Dress Well</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> COMING SOON
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  "Look like you meant it." V-taper styling, weather & capsule wardrobe.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleNotifyToggle("style")}
            className={clsx(
              "w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
              notifiedPillars["style"]
                ? "bg-violet-950/60 border-violet-700 text-violet-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            )}
          >
            {notifiedPillars["style"] ? (
              <>
                <Check className="w-3.5 h-3.5 text-violet-400" />
                <span>Notification set for Style launch</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" />
                <span>Notify me when ready</span>
              </>
            )}
          </button>
        </div>

        {/* Pillar 5: Network / Social (Locked Tile) */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Users className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-300">Network Well</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> COMING SOON
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  "Grow with the right people." Curated athletic circles & gym radar.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleNotifyToggle("network")}
            className={clsx(
              "w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
              notifiedPillars["network"]
                ? "bg-amber-950/60 border-amber-700 text-amber-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            )}
          >
            {notifiedPillars["network"] ? (
              <>
                <Check className="w-3.5 h-3.5 text-amber-400" />
                <span>Notification set for Network launch</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" />
                <span>Notify me when ready</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
