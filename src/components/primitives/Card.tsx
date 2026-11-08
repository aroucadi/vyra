"use client";

import React, { createContext, useContext } from "react";
import { clsx } from "clsx";

interface CardContextValue {
  variant?: "default" | "hero" | "subtle";
}

const CardContext = createContext<CardContextValue>({ variant: "default" });

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hero" | "subtle";
  children: React.ReactNode;
}

export function Card({ variant = "default", className, children, ...props }: CardProps) {
  return (
    <CardContext.Provider value={{ variant }}>
      <div
        className={clsx(
          "rounded-2xl transition-all duration-200",
          variant === "hero" && "bg-[#111622] border-2 border-amber-500/40 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.6)] relative overflow-hidden",
          variant === "default" && "bg-[#111622] border border-[#1C2436] p-5 shadow-sm",
          variant === "subtle" && "bg-[#090C11]/80 border border-[#1C2436]/60 p-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </CardContext.Provider>
  );
}

// 1. Glance Slot: Category eyebrow, title, and single status/detail line
export function CardGlance({
  eyebrow,
  title,
  status,
  time,
  className,
}: {
  eyebrow?: string;
  title: string;
  status?: string;
  time?: string;
  className?: string;
}) {
  const { variant } = useContext(CardContext);

  return (
    <div className={clsx("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        {eyebrow && (
          <span
            className={clsx(
              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono",
              variant === "hero" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400"
            )}
          >
            {eyebrow}
          </span>
        )}
        {time && <span className="font-mono text-slate-400 text-[11px]">{time}</span>}
      </div>
      <h3 className={clsx("font-extrabold text-white tracking-tight", variant === "hero" ? "font-display text-2xl sm:text-3xl uppercase tracking-tight" : "text-sm font-body")}>
        {title}
      </h3>
      {status && <p className="text-xs text-slate-300 font-body leading-relaxed">{status}</p>}
    </div>
  );
}

// 2. Action Slot: Single Primary CTA
export function CardAction({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx("mt-4 pt-1", className)}>{children}</div>;
}

// 3. Learn Slot: Non-blocking trigger to open Sheet/Drawer
export function CardLearn({
  label = "Learn more →",
  onClick,
  className,
}: {
  label?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 rounded",
        className
      )}
    >
      {label}
    </button>
  );
}

Card.Glance = CardGlance;
Card.Action = CardAction;
Card.Learn = CardLearn;
