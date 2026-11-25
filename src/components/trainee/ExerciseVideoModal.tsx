"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { isDirectVideoUrl, resolveExerciseVideoUrl } from "@/lib/utils";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  Video,
} from "lucide-react";

export interface ExerciseVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: {
    id?: string;
    name: string;
    target?: string;
    equipment?: string;
    instructions?: string[];
    videoUrl?: string;
    clipUrl?: string;
    formCue?: string;
  } | null;
}

export function ExerciseVideoModal({
  isOpen,
  onClose,
  exercise,
}: ExerciseVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback handled by user interaction
      });
    }
  }, [isOpen, exercise?.name, exercise?.clipUrl, exercise?.videoUrl]);

  if (!exercise) return null;

  const rawUrl =
    exercise.clipUrl ||
    exercise.videoUrl ||
    resolveExerciseVideoUrl(exercise.name, {
      id: exercise.id,
      clipUrl: exercise.clipUrl,
      explicitVideoUrl: exercise.videoUrl,
      equipment: exercise.equipment,
      targetMuscle: exercise.target,
    });

  const isDirect = isDirectVideoUrl(rawUrl);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-w-md mx-auto rounded-t-3xl bg-[#05080c] border-[#1b2d47] text-white p-5 shadow-2xl overflow-y-auto max-h-[90vh] font-body"
      >
        <SheetHeader className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 flex items-center gap-1">
                <Video className="w-3 h-3 text-[#10b981]" />
                <span>Motion Telemetry</span>
              </span>
              {exercise.equipment && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0f1724] text-slate-300 border border-[#1b2d47]">
                  {exercise.equipment}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-[#0f1724] border border-[#1b2d47] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <SheetTitle className="text-lg font-display font-black text-white uppercase tracking-tight">
            {exercise.name}
          </SheetTitle>
          {exercise.target && (
            <SheetDescription className="text-xs text-slate-400 font-mono">
              Primary Motor Target:{" "}
              <span className="text-[#10b981] font-semibold capitalize">
                {exercise.target}
              </span>
            </SheetDescription>
          )}
        </SheetHeader>

        {/* Video Player Display Container */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[#1b2d47] flex items-center justify-center shadow-inner group">
          {isDirect && !hasVideoError ? (
            <>
              <video
                key={rawUrl}
                ref={videoRef}
                src={rawUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                onLoadedData={() => setHasVideoError(false)}
                onError={() => setHasVideoError(true)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-contain bg-black cursor-pointer"
                onClick={togglePlay}
              />

              {/* Floating Media Controls Overlay */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none opacity-80 group-hover:opacity-100 transition">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="pointer-events-auto p-1.5 rounded-lg bg-[#05080c]/80 border border-[#1b2d47] text-white hover:text-[#10b981] transition cursor-pointer"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                </button>

                <div className="flex items-center gap-1.5 pointer-events-auto">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1.5 rounded-lg bg-[#05080c]/80 border border-[#1b2d47] text-white hover:text-cyan-400 transition cursor-pointer"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <a
                    href={rawUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-[#05080c]/80 border border-[#1b2d47] text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                    title="Open Fullscreen Clip"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </>
          ) : (
            /* External Demonstration / YouTube Player Fallback */
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0f1724] border border-[#1b2d47] flex items-center justify-center text-[#10b981] shadow-lg">
                <Video className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-200">
                  Instructional Motion Demonstration
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                  Deep-linked verified tutorial available with strict tempo guidelines.
                </p>
              </div>
              <a
                href={rawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#10b981] to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-display font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg cursor-pointer"
              >
                <span>Launch Video Stream</span>
                <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              </a>
            </div>
          )}
        </div>

        {/* Form Cues & Biomechanical Instructions */}
        {(exercise.formCue || (exercise.instructions && exercise.instructions.length > 0)) && (
          <div className="p-3 rounded-xl bg-[#090d16] border border-[#1b2d47] space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#10b981]">
              <Sparkles className="w-3 h-3 text-[#10b981]" />
              <span>Biomechanical Form Guide</span>
            </div>
            {exercise.formCue ? (
              <p className="text-xs text-slate-200 leading-relaxed font-body">
                {exercise.formCue}
              </p>
            ) : (
              exercise.instructions?.slice(0, 3).map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-[#10b981] font-mono font-bold shrink-0">
                    {idx + 1}.
                  </span>
                  <p className="leading-snug">{step}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer Dismiss / Action Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 bg-[#0f1724] hover:bg-[#152232] border border-[#1b2d47] text-slate-200 font-display font-bold uppercase tracking-wider text-xs rounded-xl transition cursor-pointer"
          >
            Back to Cockpit
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
