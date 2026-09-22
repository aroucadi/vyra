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
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";

export default function TodayPage() {
  const router = useRouter();
  const currentUser = appStore.getCurrentUser();
  const [isSuppDrawerOpen, setIsSuppDrawerOpen] = useState(false);
  const [tick, setTick] = useState(0);

  // Derive unified Day timeline from current state (reactive to tick)
  const { moments, heroMoment, insight, readinessStatus } = React.useMemo(
    () => deriveDayTimeline(currentUser.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser.id, tick]
  );

  const handleMomentClick = (moment: TimelineMoment) => {
    if (moment.learnType === "supplements" || moment.learnType === "hydration") {
      setIsSuppDrawerOpen(true);
    } else if (moment.actionHref) {
      router.push(moment.actionHref);
    }
  };

  const handleWhyClick = () => {
    router.push(`/coach?prompt=${encodeURIComponent(insight.whyPrompt)}`);
  };

  return (
    <div className="flex-1 pb-24 px-4 pt-6 max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header: One-line greeting + quiet readiness chip */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Good morning, {currentUser.name.split(" ")[0]}
          </h1>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">{readinessStatus}</span>
        </div>
      </header>

      {/* 2. Single Cross-Pillar Insight (Max 1 visible) */}
      <Insight
        sentence={insight.sentence}
        sourcePillars={insight.sources}
        whyPrompt={insight.whyPrompt}
        onWhyClick={handleWhyClick}
      />

      {/* 3. Hero Moment: Today's Training Focus */}
      {heroMoment && (
        <Card variant="hero">
          <Card.Glance
            eyebrow="Current Focus"
            time={heroMoment.time}
            title={heroMoment.title}
            status={heroMoment.glance}
          />
          <Card.Action>
            {heroMoment.actionHref ? (
              <Link
                href={heroMoment.actionHref}
                className="w-full py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>{heroMoment.actionLabel || "Start Workout"}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setIsSuppDrawerOpen(true)}
                className="w-full py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{heroMoment.actionLabel || "Log Protocols"}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </Card.Action>
        </Card>
      )}

      {/* 4. The Day Timeline: Chronological Stream of Moments */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
            Today&apos;s Timeline
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

      {/* Interactive Protocol Drawer */}
      <SupplementStackDrawer
        isOpen={isSuppDrawerOpen}
        onOpenChange={setIsSuppDrawerOpen}
        userId={currentUser.id}
        onUpdate={() => setTick((t) => t + 1)}
      />

    </div>
  );
}
