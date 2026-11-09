"use client";

import React, { useEffect, useState } from "react";
import { Timer, Volume2, VolumeX, Plus, X } from "lucide-react";
import { soundService } from "@/lib/in-gym/sound";

interface RestIntervalBarProps {
  initialSeconds?: number;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export function RestIntervalBar({
  initialSeconds = 90,
  onComplete,
  onDismiss,
}: RestIntervalBarProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isMuted, setIsMuted] = useState(soundService.getIsMuted());

  useEffect(() => {
    setSecondsRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      soundService.playRestChime();
      if (onComplete) onComplete();
      return;
    }

    if (secondsRemaining <= 3 && secondsRemaining > 0) {
      soundService.playCountdownPip();
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, onComplete]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundService.setMuted(next);
  };

  const addTime = (delta: number) => {
    setSecondsRemaining((prev) => Math.max(0, prev + delta));
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isCompleted = secondsRemaining <= 0;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div
        className={`px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex items-center justify-between transition-all ${
          isCompleted
            ? "bg-[#10B981]/20 border-[#10B981] text-[#10B981]"
            : "bg-[#090C11]/95 border-[#1C2436] text-slate-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              isCompleted
                ? "bg-[#10B981] text-slate-950 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                : "bg-[#111622] border border-[#2D3A54] text-[#38BDF8]"
            }`}
          >
            <Timer className="w-5 h-5 stroke-[2.25]" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-lg font-black tracking-wider tabular-nums">
                {isCompleted ? "READY" : formattedTime}
              </span>
              <span className="text-[10px] text-slate-400 font-editorial uppercase tracking-wider font-bold">
                Rest Interval
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-body">
              {isCompleted ? "Interval finished. Start next set!" : "Muscle recovery active"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!isCompleted && (
            <button
              type="button"
              onClick={() => addTime(30)}
              className="px-2.5 py-1.5 rounded-lg bg-[#111622] border border-[#1C2436] hover:border-[#2D3A54] text-[11px] font-mono font-bold text-slate-300 hover:text-white flex items-center gap-0.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>30s</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-lg bg-[#111622] border border-[#1C2436] hover:border-[#2D3A54] text-slate-400 hover:text-white cursor-pointer active:scale-95"
            title={isMuted ? "Unmute chime" : "Mute chime"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#38BDF8]" />}
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-2 rounded-lg bg-[#111622] border border-[#1C2436] hover:border-[#2D3A54] text-slate-400 hover:text-white cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
