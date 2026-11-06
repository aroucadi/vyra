"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Dumbbell, User as UserIcon, BookOpen } from "lucide-react";
import { clsx } from "clsx";

export function TraineeNav() {
  const pathname = usePathname();

  // Hide the navigation bar completely during active workout sessions
  if (pathname.startsWith("/session")) {
    return null;
  }

  const navItems = [
    { label: "Today", href: "/today", icon: Calendar },
    { label: "Program", href: "/program", icon: Dumbbell },
    { label: "Exercises", href: "/exercises", icon: BookOpen },
    { label: "You", href: "/you", icon: UserIcon },
  ];

  return (
    <nav
      aria-label="Primary Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#090C11]/95 backdrop-blur-md border-t border-[#1C2436] max-w-[480px] mx-auto pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="flex items-center justify-around h-16 px-4">
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
                "flex flex-col items-center justify-center flex-1 py-1 transition-all rounded-xl relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                isActive
                  ? "text-amber-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon className={clsx("w-5 h-5", isActive ? "stroke-[2.25] text-amber-400" : "stroke-[1.75]")} aria-hidden="true" />
              <span className="text-[10px] mt-1 tracking-wider uppercase font-editorial font-bold">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
