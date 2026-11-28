"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  isDirectVideoUrl,
  getOpenGymClipUrl,
  getOpenGymStillUrl,
  buildExerciseVideoUrl,
} from "@/lib/utils";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  X,
  Sparkles,
  Video,
} from "lucide-react";
import { clsx } from "clsx";

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
    stillUrl?: string;
    imageUrl?: string;
    formCue?: string;
  } | null;
  defaultMode?: "opengym" | "youtube";
}

export function ExerciseVideoModal({
  isOpen,
  onClose,
  exercise,
  defaultMode = "opengym",
}: ExerciseVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeMode, setActiveMode] = useState<"opengym" | "youtube">(defaultMode);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveMode(defaultMode || "opengym");
      setHasVideoError(false);
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          // Autoplay policy fallback handled by user interaction
        });
      }
    }
  }, [isOpen, defaultMode, exercise?.id, exercise?.name, exercise?.clipUrl]);

  if (!exercise) return null;

  // 1. OpenGym direct clip URL derivation
  const opengymClipUrl =
    exercise.clipUrl ||
    (exercise.id ? getOpenGymClipUrl(exercise.id) : undefined) ||
    (isDirectVideoUrl(exercise.videoUrl) ? exercise.videoUrl : undefined);

  // 2. OpenGym poster / still image URL derivation
  const opengymStillUrl =
    exercise.stillUrl ||
    exercise.imageUrl ||
    (exercise.id ? getOpenGymStillUrl(exercise.id) : undefined);

  // 3. YouTube tutorial search URL derivation
  const youtubeUrl =
    exercise.videoUrl && !isDirectVideoUrl(exercise.videoUrl)
      ? exercise.videoUrl
      : buildExerciseVideoUrl(exercise.name, {
          equipment: exercise.equipment,
          targetMuscle: exercise.target,
        });

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

  const handleSelectMode = (mode: "opengym" | "youtube") => {
    setActiveMode(mode);
    if (mode === "youtube" && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else if (mode === "opengym" && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-w-md mx-auto rounded-t-3xl bg-[#05080c] border-[#1b2d47] text-white p-5 shadow-2xl overflow-y-auto max-h-[90vh] font-body space-y-4"
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

        {/* Dual-Modal Mode Selector Tabs: [ OpenGym 3D Clip | YouTube Tutorial ] */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#090d16] border border-[#1b2d47] rounded-xl text-xs font-mono">
          <button
            type="button"
            onClick={() => handleSelectMode("opengym")}
            className={clsx(
              "py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition font-bold cursor-pointer",
              activeMode === "opengym"
                ? "bg-[#10b981] text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "text-slate-400 hover:text-white hover:bg-[#0f1724]"
            )}
          >
            <Video className="w-3.5 h-3.5" />
            <span>OpenGym 3D Clip</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectMode("youtube")}
            className={clsx(
              "py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition font-bold cursor-pointer",
              activeMode === "youtube"
                ? "bg-[#10b981] text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "text-slate-400 hover:text-white hover:bg-[#0f1724]"
            )}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>YouTube Tutorial</span>
          </button>
        </div>

        {/* Video Player Display Container */}
        {activeMode === "opengym" ? (
          opengymClipUrl && !hasVideoError ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[#1b2d47] flex items-center justify-center shadow-inner group">
              <video
                key={opengymClipUrl}
                ref={videoRef}
                src={opengymClipUrl}
                poster={opengymStillUrl}
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
                    href={opengymClipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-[#05080c]/80 border border-[#1b2d47] text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                    title="Open Fullscreen Clip"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Graceful Fallback for missing or failed OpenGym clip */
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-[#070b12] border border-[#1b2d47] flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0f1724] border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
                <Video className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-200">
                  OpenGym 3D Clip Unavailable
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                  Direct biomechanical 3D animation clip is not available for this exercise. Switch to the verified YouTube demonstration stream.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSelectMode("youtube")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#10b981] to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-display font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg cursor-pointer"
              >
                <span>Switch to YouTube Tutorial</span>
                <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )
        ) : (
          /* YouTube Mode: Precision Search Stream with Query Badges & Launch CTA */
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-[#070b12] border border-[#1b2d47] flex flex-col items-center justify-center p-5 text-center space-y-3 shadow-inner">
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
                <Video className="w-3 h-3 text-red-400" />
                <span>YouTube Form Demo</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                &lt; 4m Filter
              </span>
              {exercise.equipment && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0f1724] text-slate-300 border border-[#1b2d47]">
                  {exercise.equipment}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-200">
                Precision Form &amp; Technique Demonstration
              </h4>
              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                Deep-linked verified tutorial filtered for concise form cues, tempo control, and setup biomechanics.
              </p>
            </div>

            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-display font-black text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
            >
              <span>Launch Video Stream</span>
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
            </a>
          </div>
        )}

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
