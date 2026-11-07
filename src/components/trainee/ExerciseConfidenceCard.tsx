"use client";

import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Flame,
  AlertTriangle,
  HelpCircle,
  Video,
  CheckCircle2,
  Wrench,
  Sparkles,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { EquipmentOption, EquipmentType, ExerciseConfidenceGuide } from "@/lib/types";
import { getConfidenceGuide } from "@/lib/exercise-confidence-data";
import { isSafeUrl } from "@/lib/utils";

interface ExerciseConfidenceCardProps {
  exerciseName: string;
  selectedEquipment?: EquipmentType;
  equipmentVariations?: EquipmentOption[];
  videoUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectEquipment?: (equipment: EquipmentType) => void;
}

export function ExerciseConfidenceCard({
  exerciseName,
  selectedEquipment = "machine",
  equipmentVariations = [],
  videoUrl,
  isOpen,
  onClose,
  onSelectEquipment,
}: ExerciseConfidenceCardProps) {
  const [activeEquipment, setActiveEquipment] = useState<EquipmentType>(selectedEquipment);

  if (!isOpen) return null;

  // Resolve current active guide
  const guide: ExerciseConfidenceGuide = getConfidenceGuide(exerciseName, activeEquipment);

  const handleEquipmentClick = (eq: EquipmentType) => {
    setActiveEquipment(eq);
    if (onSelectEquipment) {
      onSelectEquipment(eq);
    }
  };

  const getHardwareIconBadge = (type: string) => {
    switch (type) {
      case "pin_selectorized":
        return "Pin-Stack Machine";
      case "plate_loaded":
        return "Plate-Loaded Machine";
      case "cable_tower":
        return "Cable Column Station";
      case "free_weight":
        return "Free Weights / Bench";
      case "bodyweight_station":
        return "Calisthenics / Mat";
      default:
        return "Gym Station";
    }
  };

  const getGripVisualLabel = (grip: string) => {
    switch (grip) {
      case "thumbless":
        return "Thumbless / False Grip (Hooks)";
      case "overhand":
        return "Overhand (Pronated)";
      case "underhand":
        return "Underhand (Supinated)";
      case "neutral":
        return "Neutral (Palms Facing)";
      case "mixed":
        return "Mixed Grip";
      default:
        return grip;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Confidence Guide: ${guide.exerciseName}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#090C11]/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-150 font-body"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#090C11] border border-[#1C2436] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-200">
        
        {/* 1. Header & Stealth Gym Mode Pill */}
        <div className="p-4 border-b border-[#1C2436] bg-[#111622] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-editorial text-white tracking-tight">
                  {guide.exerciseName}
                </h3>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {activeEquipment}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Stealth Gym Blueprint • 5-Second Scan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Guide"
            className="p-1.5 rounded-lg bg-[#090C11] border border-[#1C2436] text-slate-400 hover:text-white hover:bg-[#182030] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1-Tap Machine Fallback Swapper */}
        {equipmentVariations.length > 1 && (
          <div className="px-4 py-2 bg-[#111622] border-b border-[#1C2436] flex items-center justify-between gap-2 overflow-x-auto">
            <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
              Machine busy? Swap tool:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {equipmentVariations.map((v) => {
                const isSelected = v.equipmentType === activeEquipment;
                return (
                  <button
                    key={v.equipmentType}
                    type="button"
                    onClick={() => handleEquipmentClick(v.equipmentType)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition tracking-wider border font-mono cursor-pointer ${
                      isSelected
                        ? "bg-amber-400 text-slate-950 border-amber-400 shadow-sm"
                        : "bg-[#090C11] text-slate-400 border-[#1C2436] hover:text-slate-200"
                    }`}
                  >
                    {v.equipmentType}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable Content Card */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          
          {/* Section 1: Hardware Identification & Setup */}
          <div className="bg-[#111622] border border-[#1C2436] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Wrench className="w-3.5 h-3.5" />
                1. Machine & Hardware Blueprint
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#090C11] text-slate-300 border border-[#1C2436]">
                {getHardwareIconBadge(guide.hardware.type)}
              </span>
            </div>

            <div className="bg-[#090C11] p-2.5 rounded-lg border border-[#1C2436] space-y-1">
              <div className="text-[11px] text-slate-300">
                <strong className="text-white">Look for: </strong>
                {guide.hardware.commonAliases.join(" • ")}
              </div>
              {guide.hardware.requiredAttachment && (
                <div className="text-[11px] text-amber-400 flex items-center gap-1 font-mono">
                  <span>Attachment needed:</span>
                  <span className="font-bold underline">{guide.hardware.requiredAttachment}</span>
                </div>
              )}
            </div>

            {/* 3-Step Setup Checklist */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Ergonomic Setup Checklist:
              </p>
              {guide.hardware.setupSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-200">
                  <span className="w-4 h-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-[11px] leading-tight text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Grip & 3 Micro-Cues */}
          <div className="bg-[#111622] border border-[#1C2436] rounded-xl p-3.5 space-y-2.5">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-display">
              <Sparkles className="w-3.5 h-3.5" />
              2. Grip & Posture Mechanics
            </span>

            {/* Grip Badges */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#090C11] p-2 rounded-lg border border-[#1C2436]">
                <span className="text-[9px] font-mono uppercase text-slate-400 block">Grip Style</span>
                <span className="text-xs font-bold text-slate-100">
                  {getGripVisualLabel(guide.mechanics.gripType)}
                </span>
              </div>
              <div className="bg-[#090C11] p-2 rounded-lg border border-[#1C2436]">
                <span className="text-[9px] font-mono uppercase text-slate-400 block">Grip Width</span>
                <span className="text-xs font-bold text-slate-100 capitalize">
                  {guide.mechanics.gripWidth.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Wrist Guidance */}
            <div className="bg-[#090C11] p-2.5 rounded text-[11px] text-slate-300 border-l-2 border-emerald-400">
              <strong className="text-white">Wrist Cue: </strong>
              {guide.mechanics.wristCue}
            </div>

            {/* Rule of 3 Form Cues */}
            <div className="space-y-1 pt-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                The 3 Golden Rules:
              </p>
              {guide.mechanics.threeCues.map((cue, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[11px] font-medium">{cue}</span>
                </div>
              ))}
            </div>

            {/* Mental Movement Metaphor */}
            <div className="bg-gradient-to-r from-sky-500/10 to-transparent p-2.5 rounded border border-sky-500/30 text-[11px] text-sky-400 flex items-center gap-1.5">
              <span className="font-bold shrink-0">💡 Metaphor:</span>
              <span className="italic text-slate-200 font-normal">"{guide.mechanics.mentalCue}"</span>
            </div>
          </div>

          {/* Section 3: Proprioception & "The Feel It Meter" */}
          <div className="bg-[#111622] border border-[#1C2436] rounded-xl p-3.5 space-y-2.5">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-display">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              3. Sensory Calibration ("Feel It" Meter)
            </span>

            {/* Target Burn Heatmap */}
            <div className="bg-[#090C11] p-3 rounded-lg border border-[#1C2436] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Target Burn Zone ({guide.proprioception.primaryMuscle})
                </span>
              </div>
              <p className="text-xs text-slate-100 font-medium">
                {guide.proprioception.targetFeel}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Normal sensation: {guide.proprioception.normalSensations.join(" • ")}
              </p>
            </div>

            {/* Red Flag Stop Signal */}
            <div className="bg-rose-500/10 border border-rose-500/40 rounded-lg p-2.5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider block font-display">
                  Red Flag (Stop Immediately):
                </span>
                <p className="text-[11px] text-slate-200 mt-0.5">
                  {guide.proprioception.redFlagStop}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-[#111622] border-t border-[#1C2436] flex items-center justify-between shrink-0">
          {videoUrl && isSafeUrl(videoUrl) ? (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-[#090C11] border border-[#1C2436] hover:border-slate-700 transition"
            >
              <Video className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Video</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          ) : (
            <div></div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-display font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
          >
            <span>Got It • Ready to Lift</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
