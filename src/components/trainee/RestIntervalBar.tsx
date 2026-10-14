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
        className={`px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between transition-all ${
          isCompleted
            ? "bg-[#10B981]/25 border-[#10B981] text-[#10B981]"
            : "bg-[#0F172A]/95 border-[#1E293B] text-slate-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              isCompleted
                ? "bg-[#10B981] text-slate-950 animate-pulse"
                : "bg-[#162032] border border-[#334155] text-[#10B981]"
            }`}
          >
            <Timer className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-base font-black tracking-wider tabular-nums">
                {isCompleted ? "READY" : formattedTime}
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Rest Interval
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {isCompleted ? "Interval finished. Start next set!" : "Muscle recovery active"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!isCompleted && (
            <button
              type="button"
              onClick={() => addTime(30)}
              className="px-2 py-1 rounded-lg bg-[#162032] border border-[#334155] text-[10px] font-mono text-slate-300 hover:text-white flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3 text-[#10B981]" />
              <span>30s</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-[#162032] border border-[#334155] text-slate-400 hover:text-white"
            title={isMuted ? "Unmute chime" : "Mute chime"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#10B981]" />}
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 rounded-lg bg-[#162032] border border-[#334155] text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
