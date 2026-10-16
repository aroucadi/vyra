"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { appStore } from "@/lib/store";
import { deriveDayTimeline, TimelineMoment } from "@/lib/timeline";
import { Card } from "@/components/primitives/Card";
import { Insight } from "@/components/primitives/Insight";
import { Plan } from "@/components/primitives/Plan";
import { SupplementStackDrawer } from "@/components/trainee/SupplementStackDrawer";
import { ReadinessCheckin } from "@/components/trainee/ReadinessCheckin";
import { SessionAdjustmentSheet } from "@/components/trainee/SessionAdjustmentSheet";
import { DayZeroOnboardingCard } from "@/components/trainee/DayZeroOnboardingCard";
import { ArrowRight, SlidersHorizontal, Sparkles } from "lucide-react";

export default function TodayPage() {
  const router = useRouter();
  const currentUser = appStore.getCurrentUser();
  const [isSuppDrawerOpen, setIsSuppDrawerOpen] = useState(false);
  const [isAdjustSheetOpen, setIsAdjustSheetOpen] = useState(false);
  const [forceDayZero, setForceDayZero] = useState<boolean>(() => {
    return appStore.getSessions(currentUser.id).length === 0;
  });
  const [tick, setTick] = useState(0);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const search = window.location.search;
    if (search.includes("supplements=open")) {
      setIsSuppDrawerOpen(true);
    }
    if (search.includes("user=alaa") || search.includes("view=program") || search.includes("mode=program")) {
      localStorage.setItem("vyra_user_view", "program");
      setForceDayZero(false);
    } else if (search.includes("onboarding=day0") || search.includes("anchor=")) {
      localStorage.setItem("vyra_user_view", "day0");
      setForceDayZero(true);
    } else {
      const savedView = localStorage.getItem("vyra_user_view");
      if (savedView === "program") {
        setForceDayZero(false);
      }
    }
  }, []);

  // Derive clock-aware Day timeline from current state
  const { moments, heroMoment, insight, readinessStatus, hasReadinessInput, isRestDay, isDayZero } = React.useMemo(
    () => deriveDayTimeline(currentUser.id, undefined, undefined, { forceDayZero }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser.id, tick, forceDayZero]
  );

  const handleMomentClick = (moment: TimelineMoment) => {
    if (moment.learnType === "supplements" || moment.learnType === "hydration") {
      setIsSuppDrawerOpen(true);
    } else if (moment.actionHref) {
      router.push(moment.actionHref);
    }
  };

  const handleWhyClick = () => {
    if (insight?.whyPrompt) {
      setIsAdjustSheetOpen(true);
    }
  };

  return (
    <div className="flex-1 pb-24 px-4 pt-6 max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header: Date greeting + quiet readiness / Day-1 calibration chip */}
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-400">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {isDayZero ? "Day 1 Session" : `Good morning, ${currentUser.name.split(" ")[0]}`}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setForceDayZero((prev) => {
                const next = prev === undefined ? !isDayZero : !prev;
                if (typeof window !== "undefined") {
                  localStorage.setItem("vyra_user_view", next ? "day0" : "program");
                }
                return next;
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full shadow-sm text-xs transition cursor-pointer"
            title="Toggle between Day-1 Setup and Active Program"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium text-slate-300">
              {isDayZero ? "View Active Program" : "Calibrate Day 1"}
            </span>
          </button>

          {!isDayZero && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full shadow-sm text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  readinessStatus.includes("Light")
                    ? "bg-amber-400 animate-pulse"
                    : readinessStatus.includes("Moderate")
                    ? "bg-amber-300"
                    : readinessStatus.includes("Full")
                    ? "bg-emerald-400"
                    : "bg-slate-500"
                }`}
              />
              <span className="font-medium text-slate-300">{readinessStatus}</span>
            </div>
          )}
        </div>
      </header>

      {/* DAY-0 FOCUS FLOW (Spec 019: Couch-to-Rack Proxy) */}
      {isDayZero ? (
        <DayZeroOnboardingCard
          userId={currentUser.id}
          onCalibrated={() => setTick((t) => t + 1)}
        />
      ) : (
        <>
          {/* 2. Morning Readiness Check-in (Prominently displayed until answered) */}
          {!hasReadinessInput && (
            <ReadinessCheckin
              userId={currentUser.id}
              onCheckedIn={() => setTick((t) => t + 1)}
            />
          )}

          {/* 3. Cross-Pillar Insight (ONLY displayed when real data exists) */}
          {insight && (
            <Insight
              sentence={insight.sentence}
              sourcePillars={insight.sources}
              whyPrompt={insight.whyPrompt}
              onWhyClick={handleWhyClick}
            />
          )}

          {/* 4. Hero Moment: Today's Immediate Action */}
          {heroMoment && (
            <Card variant="hero">
              <Card.Glance
                eyebrow={heroMoment.status === "now" ? "Current Focus" : "Next Focus"}
                time={heroMoment.time}
                title={heroMoment.title}
                status={heroMoment.glance}
              />

              <Card.Action>
                {heroMoment.actionHref ? (
                  <div className="space-y-2">
                    <Link
                      href={heroMoment.actionHref}
                      className="w-full py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <span>{heroMoment.actionLabel || "Start Workout"}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </Link>

                    {!isRestDay && (
                      <button
                        type="button"
                        onClick={() => setIsAdjustSheetOpen(true)}
                        className="w-full py-2 px-3 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Adjust session (swap machine, short on time)</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setIsSuppDrawerOpen(true)}
                      className="w-full py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{heroMoment.actionLabel || "Log Protocols"}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    <Link
                      href="/session?day=prog_master_w1_d0&mode=preview"
                      className="w-full py-2 px-3 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Start Monday Upper A Workout →</span>
                    </Link>
                  </div>
                )}
              </Card.Action>
            </Card>
          )}

          {/* 5. The Day Timeline: Chronological Stream of Moments */}
          <section className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-semibold text-xs text-slate-300">
                Today&apos;s Schedule
              </span>
              <button
                type="button"
                onClick={() => setIsSuppDrawerOpen(true)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
              >
                All protocols →
              </button>
            </div>

            <Plan.Timeline
              moments={moments.filter((m) => m.id !== heroMoment?.id)}
              onMomentClick={handleMomentClick}
            />
          </section>
        </>
      )}

      {/* Interactive Protocol Drawer */}
      <SupplementStackDrawer
        isOpen={isSuppDrawerOpen}
        onOpenChange={setIsSuppDrawerOpen}
        userId={currentUser.id}
        onUpdate={() => setTick((t) => t + 1)}
      />

      {/* 1-Tap Session Adjustment Sheet */}
      <SessionAdjustmentSheet
        isOpen={isAdjustSheetOpen}
        onOpenChange={setIsAdjustSheetOpen}
        userId={currentUser.id}
      />

    </div>
  );
}
