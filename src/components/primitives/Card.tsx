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
          variant === "hero" && "bg-slate-900 border-2 border-emerald-500/30 p-5 shadow-lg relative overflow-hidden",
          variant === "default" && "bg-slate-900/80 border border-slate-800/80 p-5 shadow-sm",
          variant === "subtle" && "bg-slate-900/30 border border-slate-800/40 p-4",
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
    <div className={clsx("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        {eyebrow && (
          <span
            className={clsx(
              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
              variant === "hero" ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400"
            )}
          >
            {eyebrow}
          </span>
        )}
        {time && <span className="font-mono text-slate-500 text-[11px]">{time}</span>}
      </div>
      <h3 className={clsx("font-bold text-white tracking-tight", variant === "hero" ? "text-base" : "text-sm")}>
        {title}
      </h3>
      {status && <p className="text-xs text-slate-400 font-normal leading-relaxed">{status}</p>}
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
        "text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 rounded",
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
