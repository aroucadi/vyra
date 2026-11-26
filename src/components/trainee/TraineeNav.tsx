"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Dumbbell,
  User as UserIcon,
  BookOpen,
  Zap,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Clock,
  Flame,
} from "lucide-react";
import { clsx } from "clsx";
import { VyraLogo } from "@/components/brand/VyraLogo";
import { appStore } from "@/lib/store";
import { useIsClientHydrated, useVyraAuth } from "@/components/auth/VyraAuthProvider";

export type ChronobiologicalPhase =
  | "morning_anchor"
  | "kinetic_crucible"
  | "somatic_recovery"
  | "deep_rest";

export function getChronoPhase(date = new Date()): {
  phase: ChronobiologicalPhase;
  label: string;
  badge: string;
  accentColor: string;
} {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const timeVal = hour + minute / 60;

  if (timeVal >= 6.0 && timeVal < 11.5) {
    return {
      phase: "morning_anchor",
      label: "Morning Anchor",
      badge: "07:30 ROUTINE",
      accentColor: "#f59e0b", // Amber
    };
  } else if (timeVal >= 11.5 && timeVal < 15.5) {
    return {
      phase: "kinetic_crucible",
      label: "Kinetic Crucible",
      badge: "GYM WINDOW",
      accentColor: "#22c55e", // Kinetic Lime
    };
  } else if (timeVal >= 15.5 && timeVal < 22.5) {
    return {
      phase: "somatic_recovery",
      label: "Somatic Recovery",
      badge: "RECOVERY",
      accentColor: "#06b6d4", // Cyan
    };
  } else {
    return {
      phase: "deep_rest",
      label: "Deep Rest",
      badge: "ANABOLIC SLEEP",
      accentColor: "#818cf8", // Indigo
    };
  }
}

export function TraineeNav() {
  const pathname = usePathname();
  const isHydrated = useIsClientHydrated();
  const { isAuthenticated, authEmail } = useVyraAuth();
  const [chrono, setChrono] = useState(() => getChronoPhase());

  const currentUser = isHydrated ? appStore.getCurrentUser() : null;
  const displayName = currentUser?.name?.split(" ")[0] || "Athlete";

  // Update chronobiological rhythm periodically
  useEffect(() => {
    const updatePhase = () => setChrono(getChronoPhase());
    const interval = setInterval(updatePhase, 60000);
    return () => clearInterval(interval);
  }, []);

  // Hide navigation during active workout sessions
  if (pathname.startsWith("/session")) {
    return null;
  }

  const navItems = [
    {
      label: "Today",
      href: "/today",
      icon: chrono.phase === "kinetic_crucible" ? Zap : Calendar,
      shortcut: "⌘1",
      isChronoActive: true,
      description: "Flight directive & circadian arc",
    },
    {
      label: "Program",
      href: "/program",
      icon: Dumbbell,
      shortcut: "⌘2",
      description: "16-week mesocycle & blueprint",
    },
    {
      label: "Progress",
      href: "/progress",
      icon: TrendingUp,
      shortcut: "⌘3",
      description: "Telemetry, PRs & 14d curve",
    },
    {
      label: "Exercises",
      href: "/exercises",
      icon: BookOpen,
      shortcut: "⌘4",
      description: "6,554 RAG exercise vault",
    },
    {
      label: "AI Coach",
      href: "/coach",
      icon: Sparkles,
      shortcut: "⌘5",
      description: "Gemini 4 Argon & Claude MCP",
    },
    {
      label: "You",
      href: "/you",
      icon: UserIcon,
      shortcut: "⌘6",
      description: "Biometric truths & passport",
    },
  ];

  return (
    <>
      {/* =========================================================================
          DESKTOP COMMAND RAIL (Visible on lg: screens >= 1024px)
          Frees desktop from the narrow 480px box into a high-taste sovereign studio
         ========================================================================= */}
      <aside
        aria-label="Desktop Navigation Rail"
        className="hidden lg:flex flex-col justify-between w-64 shrink-0 h-screen sticky top-0 bg-[#090D14]/95 border-r border-[#1C2436] p-5 select-none z-30 backdrop-blur-xl"
      >
        {/* Brand Header + Chrono Pill */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C2436]">
            <VyraLogo size="sm" variant="wordmark" href="/today" showTagline={false} />
            <span
              className="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1.5"
              style={{
                backgroundColor: `${chrono.accentColor}15`,
                color: chrono.accentColor,
                borderColor: `${chrono.accentColor}35`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-ping"
                style={{ backgroundColor: chrono.accentColor }}
              />
              <span>LIVE</span>
            </span>
          </div>

          {/* Chrono Phase Card */}
          <div className="p-3 bg-[#0F1420] border border-[#1C2436] rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Circadian Window
              </span>
              <span
                className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded"
                style={{ color: chrono.accentColor }}
              >
                {chrono.badge}
              </span>
            </div>
            <div className="text-sm font-display uppercase tracking-wider font-bold text-white">
              {chrono.label}
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="space-y-1 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === "/today" && pathname === "/") ||
                (item.href === "/you" && pathname === "/profile") ||
                (item.href === "/exercises" && pathname === "/library");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={clsx(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group font-body text-sm",
                    isActive
                      ? "bg-gradient-to-r from-amber-500/15 to-transparent text-amber-300 font-bold border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                      : "text-slate-400 hover:text-white hover:bg-[#121826]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={clsx(
                        "w-4 h-4 transition-transform group-hover:scale-110",
                        isActive ? "text-amber-400 stroke-[2.25]" : "stroke-[1.75]"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={clsx(
                      "text-[10px] font-mono",
                      isActive ? "text-amber-400/80" : "text-slate-400"
                    )}
                  >
                    {item.shortcut}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Athlete Passport Status */}
        <div className="pt-4 border-t border-[#1C2436] space-y-2">
          <Link
            href="/you"
            className="flex items-center justify-between p-2.5 bg-[#0F1420] hover:bg-[#141C2C] border border-[#1C2436] rounded-xl transition group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-display font-black text-sm">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate group-hover:text-amber-300 transition">
                  {displayName}
                </div>
                <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span>Sovereign Synced</span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
          </Link>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE BOTTOM DOCK (Visible on < lg screens)
          Ergonomic thumb-zone navigation with chronobiological glow track
         ========================================================================= */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090C11]/95 backdrop-blur-xl border-t border-[#1C2436] max-w-lg mx-auto pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_24px_rgba(0,0,0,0.6)] select-none"
      >
        {/* 24-Hour Adaptive Chronobiological Glow Track */}
        <div className="h-[2px] w-full bg-[#182030] overflow-hidden flex">
          <div
            className={clsx(
              "h-full transition-all duration-700",
              chrono.phase === "morning_anchor" &&
                "w-1/4 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
              chrono.phase === "kinetic_crucible" &&
                "w-1/2 bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.8)]",
              chrono.phase === "somatic_recovery" &&
                "w-3/4 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]",
              chrono.phase === "deep_rest" &&
                "w-full bg-indigo-500 shadow-[0_0_8px_rgba(129,140,248,0.8)]"
            )}
          />
        </div>

        <div className="flex items-center justify-around h-16 px-2">
          {navItems
            .filter((item) => item.label !== "AI Coach") // Coach accessible via Today header & prompt chips on mobile
            .map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === "/today" && pathname === "/") ||
                (item.href === "/you" && pathname === "/profile") ||
                (item.href === "/exercises" && pathname === "/library");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={clsx(
                    "flex flex-col items-center justify-center flex-1 py-1 transition-all rounded-xl relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:scale-95 cursor-pointer",
                    isActive
                      ? item.isChronoActive && chrono.phase === "kinetic_crucible"
                        ? "text-[#4be277] font-bold"
                        : "text-amber-400 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <div className="relative">
                    <Icon
                      className={clsx(
                        "w-5 h-5 transition-transform group-hover:scale-105",
                        isActive
                          ? item.isChronoActive && chrono.phase === "kinetic_crucible"
                            ? "stroke-[2.5] text-[#4be277]"
                            : "stroke-[2.25] text-amber-400"
                          : "stroke-[1.75]"
                      )}
                      aria-hidden="true"
                    />

                    {/* Kinetic Crucible Active Ping Indicator on Today tab */}
                    {item.isChronoActive && chrono.phase === "kinetic_crucible" && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#22c55e] animate-ping" />
                    )}
                  </div>

                  <span className="text-[10px] mt-1 tracking-wider uppercase font-editorial font-bold">
                    {item.label}
                  </span>

                  {/* Active Bottom Glow Puck */}
                  {isActive && (
                    <span
                      className={clsx(
                        "absolute -bottom-1 w-1.5 h-1.5 rounded-full transition-all",
                        item.isChronoActive && chrono.phase === "kinetic_crucible"
                          ? "bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.9)]"
                          : "bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                      )}
                    />
                  )}
                </Link>
              );
            })}
        </div>
      </nav>
    </>
  );
}
