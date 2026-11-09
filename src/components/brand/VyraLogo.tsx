"use client";

import React from "react";
import Link from "next/link";
import { clsx } from "clsx";

export type VyraLogoVariant = "mark" | "wordmark" | "full" | "badge";
export type VyraLogoSize = "xs" | "sm" | "md" | "lg" | "xl";

interface VyraLogoProps {
  variant?: VyraLogoVariant;
  size?: VyraLogoSize;
  className?: string;
  href?: string;
  showTagline?: boolean;
  tagline?: string;
  glow?: boolean;
}

const SIZE_CONFIG: Record<
  VyraLogoSize,
  {
    markSize: number;
    titleSize: string;
    taglineSize: string;
    gap: string;
    badgePadding: string;
  }
> = {
  xs: {
    markSize: 18,
    titleSize: "text-xs tracking-[0.2em]",
    taglineSize: "text-[7px]",
    gap: "gap-1.5",
    badgePadding: "px-2 py-0.5",
  },
  sm: {
    markSize: 22,
    titleSize: "text-sm tracking-[0.22em]",
    taglineSize: "text-[8px]",
    gap: "gap-2",
    badgePadding: "px-2.5 py-1",
  },
  md: {
    markSize: 28,
    titleSize: "text-base tracking-[0.25em]",
    taglineSize: "text-[9px]",
    gap: "gap-2.5",
    badgePadding: "px-3 py-1.5",
  },
  lg: {
    markSize: 36,
    titleSize: "text-xl tracking-[0.28em]",
    taglineSize: "text-[10px]",
    gap: "gap-3",
    badgePadding: "px-4 py-2",
  },
  xl: {
    markSize: 48,
    titleSize: "text-2xl sm:text-3xl tracking-[0.3em]",
    taglineSize: "text-[11px]",
    gap: "gap-3.5",
    badgePadding: "px-5 py-2.5",
  },
};

/**
 * Pure SVG Vector Monogram for VYRA (Basalt Monolith + Solar Ascent Vector)
 */
export function VyraVectorMark({
  size = 28,
  glow = true,
  className,
}: {
  size?: number;
  glow?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("shrink-0 select-none", className)}
      aria-hidden="true"
    >
      <defs>
        {/* Basalt Pillar Gradient */}
        <linearGradient id="vyraBasaltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="50%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Solar Amber Kinetic Vector Gradient */}
        <linearGradient id="vyraAmberGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>

        {/* Ambient Subtle Amber Drop Shadow */}
        {glow && (
          <filter id="vyraMarkGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="3"
              floodColor="#F59E0B"
              floodOpacity="0.45"
            />
          </filter>
        )}
      </defs>

      {/* Left Monolith Stem (Structural Basalt) */}
      <path
        d="M 20 22 
           L 36 22 
           L 50 64 
           L 50 78 
           L 42 78 
           L 20 22 Z"
        fill="url(#vyraBasaltGrad)"
        stroke="#334155"
        strokeWidth="1"
      />

      {/* Center Negative Energy Aperture */}
      <polygon points="50,60 52.5,67 50,74 47.5,67" fill="#090C11" opacity="0.9" />

      {/* Right Ascending Vector (Solar Amber Kinetic Thrust) */}
      <path
        d="M 50 78 
           L 50 64 
           L 70 16 
           L 82 16 
           L 79 26 
           L 58 78 
           Z"
        fill="url(#vyraAmberGrad)"
        stroke="#FBBF24"
        strokeWidth="1"
        filter={glow ? "url(#vyraMarkGlow)" : undefined}
      />

      {/* Vector Apex Highlight Accent */}
      <polygon points="70,16 82,16 79,26" fill="#FFFBEB" opacity="0.95" />

      {/* Grounding Horizon Anchor Bar */}
      <rect x="40" y="82" width="20" height="2" rx="1" fill="#F59E0B" opacity="0.8" />
    </svg>
  );
}

export function VyraLogo({
  variant = "wordmark",
  size = "md",
  className,
  href,
  showTagline = false,
  tagline = "LIFE OS",
  glow = true,
}: VyraLogoProps) {
  const cfg = SIZE_CONFIG[size];

  const content = (
    <div
      className={clsx(
        "inline-flex items-center select-none font-body transition group",
        cfg.gap,
        variant === "badge" && [
          "rounded-full bg-[#111622] border border-[#1C2436] hover:border-amber-500/40 shadow-xs",
          cfg.badgePadding,
        ],
        className
      )}
    >
      {/* 1. Vector Monogram */}
      <VyraVectorMark size={cfg.markSize} glow={glow} />

      {/* 2. Typographic Wordmark */}
      {variant !== "mark" && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={clsx(
                "font-display font-black uppercase text-white tracking-widest leading-none drop-shadow-xs group-hover:text-amber-300 transition-colors",
                cfg.titleSize
              )}
            >
              VYRA
            </span>
            <span className="w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_4px_#F59E0B]" />
          </div>

          {(variant === "full" || showTagline) && (
            <span
              className={clsx(
                "font-mono uppercase font-bold tracking-[0.25em] text-slate-400 mt-0.5 leading-none",
                cfg.taglineSize
              )}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition active:scale-[0.98]"
        aria-label="VYRA Home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
