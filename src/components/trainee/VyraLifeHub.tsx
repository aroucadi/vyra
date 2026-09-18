"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Dumbbell,
  Utensils,
  HeartPulse,
  Sparkles,
  Compass,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export interface LifePillar {
  id: "fitness" | "nutrition" | "health" | "style" | "social";
  title: string;
  tagline: string;
  icon: typeof Dumbbell;
  status: "active" | "preview" | "coming_soon";
  statusBadge: string;
  badgeColor: string;
  headlineMetric: string;
  highlights: string[];
  ctaLabel: string;
  ctaHref: string;
}

export const VYRA_PILLARS: LifePillar[] = [
  {
    id: "fitness",
    title: "Movement & Strength",
    tagline: "Hypertrophy, Biomechanical Cues & Exercise Confidence",
    icon: Dumbbell,
    status: "active",
    statusBadge: "Active Protocol",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    headlineMetric: "16-Wk Transformation",
    highlights: [
      "Exercise Confidence Card (ECC) with Stealth Gym Mode",
      "MuscleWiki biomechanical database (1,900+ movements)",
      "4-Option equipment matrix (Commercial, DB, Cable, Bodyweight)",
    ],
    ctaLabel: "Open Workout Logger",
    ctaHref: "/session",
  },
  {
    id: "nutrition",
    title: "Nutrition & Fueling",
    tagline: "8-Milestone Nutrient Architecture & Hydration",
    icon: Utensils,
    status: "active",
    statusBadge: "Active Protocol",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    headlineMetric: "2,750 kcal / 175g P",
    highlights: [
      "Phase-based Creatine Saturation (20.7g loading / 5g maint)",
      "3.5L Daily Hydration target with workout replenishment",
      "Circadian nutrient distribution across daily waking anchors",
    ],
    ctaLabel: "View Daily Milestones",
    ctaHref: "/today",
  },
  {
    id: "health",
    title: "Health & Medical Context",
    tagline: "Biomarker Tracking, Recovery & Sleep Optimization",
    icon: HeartPulse,
    status: "preview",
    statusBadge: "Integrated Life OS",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    headlineMetric: "HRV & Recovery 92%",
    highlights: [
      "Gemini 3.8 Flash medical context & physiological synthesis",
      "Resting heart rate, sleep cycles & central nervous fatigue",
      "Quarterly blood panel integration & supplement alignment",
    ],
    ctaLabel: "Review Biometrics",
    ctaHref: "/profile",
  },
  {
    id: "style",
    title: "Style & Posture Architecture",
    tagline: "V-Taper Aesthetics, Cervical Alignment & Wardrobe",
    icon: Sparkles,
    status: "preview",
    statusBadge: "Life Optimization",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    headlineMetric: "2:1 Pull-to-Push",
    highlights: [
      "Upper-cross syndrome correction (Scapular retraction focus)",
      "V-Taper shoulder circumference progression tracking",
      "Aesthetic fit & athletic posture confidence coaching",
    ],
    ctaLabel: "Explore Posture Guide",
    ctaHref: "/program",
  },
  {
    id: "social",
    title: "Local Experiences & Social",
    tagline: "Curated Gym Hotspots, Athletic Circles & Wellness",
    icon: Compass,
    status: "coming_soon",
    statusBadge: "Super App Hub",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    headlineMetric: "Local Athletic Hub",
    highlights: [
      "Community gym equipment ratings & peak-hour crowd meters",
      "Curated local running clubs, padel & athletic meetups",
      "Verified peer training circles with zero gym intimidation",
    ],
    ctaLabel: "Explore Experiences",
    ctaHref: "#",
  },
];

export function VyraLifeHub({ compact = false }: { compact?: boolean }) {
  const [selectedPillarId, setSelectedPillarId] = useState<string>("fitness");
  const selectedPillar = VYRA_PILLARS.find((p) => p.id === selectedPillarId) || VYRA_PILLARS[0];
  const IconComponent = selectedPillar.icon;

  if (compact) {
    return (
      <div className="bg-[#162032]/80 border border-[#1E293B] rounded-2xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#10B981] via-[#06B6D4] to-[#8B5CF6] flex items-center justify-center font-black text-slate-950 text-xs">
              VY
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Vyra Life OS</h3>
              <p className="text-[10px] text-slate-400">Personal Life Optimization Super App</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[#0B0F17] border border-[#334155] text-cyan-400">
            5 Core Pillars
          </span>
        </div>

        {/* 5 Pillar Micro-Selector */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {VYRA_PILLARS.map((p) => {
            const PIcon = p.icon;
            const isSelected = p.id === selectedPillarId;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPillarId(p.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                  isSelected
                    ? "bg-[#0F172A] border border-[#10B981] text-[#10B981] shadow-sm"
                    : "bg-[#0B0F17]/50 border border-transparent text-slate-400 hover:text-slate-200"
                }`}
                title={p.title}
              >
                <PIcon className="w-4 h-4 mb-1" />
                <span className="text-[9px] font-medium truncate max-w-full">
                  {p.id.charAt(0).toUpperCase() + p.id.slice(1)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Pillar Snippet */}
        <div className="mt-3 p-3 bg-[#0B0F17] rounded-xl border border-[#1E293B]">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <IconComponent className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">{selectedPillar.title}</span>
            </div>
            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono ${selectedPillar.badgeColor}`}>
              {selectedPillar.statusBadge}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">{selectedPillar.tagline}</p>

          <Link
            href={selectedPillar.ctaHref}
            className="flex items-center justify-between text-xs text-emerald-400 hover:text-emerald-300 font-semibold pt-1 border-t border-[#1E293B]"
          >
            <span>{selectedPillar.ctaLabel}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#162032] border border-[#1E293B] rounded-2xl p-5 shadow-xl">
      {/* Super App Header */}
      <div className="flex items-start justify-between pb-4 border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#10B981] via-[#06B6D4] to-[#8B5CF6] flex items-center justify-center font-black text-slate-950 text-sm shadow-md">
            VYRA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-100 tracking-tight">Vyra Life OS</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-medium">
                Super App Hub
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Single unified center for health, fitness, style, biometrics & experiences
            </p>
          </div>
        </div>
      </div>

      {/* Pillar Selector Pills */}
      <div className="flex gap-2 overflow-x-auto py-3.5 scrollbar-none">
        {VYRA_PILLARS.map((p) => {
          const PIcon = p.icon;
          const isSelected = p.id === selectedPillarId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPillarId(p.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-gradient-to-r from-[#10B981]/20 to-[#06B6D4]/20 border border-[#10B981] text-emerald-300 shadow-sm"
                  : "bg-[#0B0F17] border border-[#1E293B] text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }`}
            >
              <PIcon className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-400" : "text-slate-400"}`} />
              <span>{p.title}</span>
            </button>
          );
        })}
      </div>

      {/* Focused Pillar Details Card */}
      <div className="bg-[#0B0F17] rounded-xl border border-[#1E293B] p-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#162032] border border-[#334155] flex items-center justify-center">
              <IconComponent className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{selectedPillar.title}</h3>
              <p className="text-xs text-slate-400">{selectedPillar.tagline}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-block text-[10px] px-2.5 py-1 rounded-full border font-mono ${selectedPillar.badgeColor}`}>
              {selectedPillar.statusBadge}
            </span>
          </div>
        </div>

        <div className="bg-[#162032]/60 rounded-lg p-3 border border-[#1E293B] mb-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-medium">Core Metric</span>
            <span className="font-mono font-bold text-emerald-400">{selectedPillar.headlineMetric}</span>
          </div>
          <ul className="space-y-1.5">
            {selectedPillar.highlights.map((h, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#06B6D4] shrink-0 mt-0.5" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Vyra Engine v1.0 • Privacy Guarded</span>
          </div>

          <Link
            href={selectedPillar.ctaHref}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-slate-950 font-bold text-xs transition"
          >
            <span>{selectedPillar.ctaLabel}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
