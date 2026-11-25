"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Dumbbell, User as UserIcon, BookOpen, Zap, Moon, Sun, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";

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
  const [chrono, setChrono] = useState(() => getChronoPhase());

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
      isChronoActive: true,
    },
    { label: "Program", href: "/program", icon: Dumbbell },
    { label: "Exercises", href: "/exercises", icon: BookOpen },
    { label: "You", href: "/you", icon: UserIcon },
  ];

  return (
    <nav
      aria-label="Primary Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#090C11]/95 backdrop-blur-xl border-t border-[#1C2436] max-w-[480px] mx-auto pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] select-none"
    >
      {/* 24-Hour Adaptive Chronobiological Glow Track */}
      <div className="h-[2px] w-full bg-[#182030] overflow-hidden flex">
        <div
          className={clsx(
            "h-full transition-all duration-700",
            chrono.phase === "morning_anchor" && "w-1/4 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
            chrono.phase === "kinetic_crucible" && "w-1/2 bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.8)]",
            chrono.phase === "somatic_recovery" && "w-3/4 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]",
            chrono.phase === "deep_rest" && "w-full bg-indigo-500 shadow-[0_0_8px_rgba(129,140,248,0.8)]"
          )}
        />
      </div>

      <div className="flex items-center justify-around h-16 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === "/today" && pathname === "/") ||
            (item.href === "/you" && pathname === "/profile");

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
  );
}
