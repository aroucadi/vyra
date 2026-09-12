"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CalendarDays, Dumbbell, TrendingUp, User as UserIcon } from "lucide-react";

export function TraineeNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Today", href: "/today", icon: Calendar },
    { label: "Program", href: "/program", icon: CalendarDays },
    { label: "Log Session", href: "/session", icon: Dumbbell },
    { label: "Progress", href: "/progress", icon: TrendingUp },
    { label: "Profile", href: "/profile", icon: UserIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0F17]/95 backdrop-blur-md border-t border-[#1E293B] max-w-md mx-auto">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === "/today" && pathname === "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive
                  ? "text-[#10B981] font-semibold"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
                {item.href === "/session" && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#06B6D4] animate-ping" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
