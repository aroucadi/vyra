"use client";

import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { Mic, Square, Play, Pause, Trash2, Volume2, Sparkles, Share2 } from "lucide-react";
import { shareAudioNoteWithGemini } from "@/lib/share-equipment";
import { telemetry } from "@/lib/telemetry";

interface AudioNoteRecorderProps {
  audioUrl?: string;
  onSave: (audioDataUrl: string) => void;
  onDelete: () => void;
  label?: string;
  traineeId?: string;
  exerciseName?: string;
  compact?: boolean;
}

export function AudioNoteRecorder({
  audioUrl,
  onSave,
  onDelete,
  label = "Voice Feedback Note",
  traineeId,
  exerciseName,
  compact = false,
}: AudioNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDurationSec, setRecordDurationSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio element and timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  // Update playback state when audioUrl changes
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsPlaying(false);
    setPlayProgress(0);
  }, [audioUrl]);

  const startRecording = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine supported mime type
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ];
      let selectedMime = "";
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all audio tracks to release microphone hardware immediately
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, {
          type: selectedMime || "audio/webm",
        });

        // Convert blob to Base64 Data URL for durable local & server storage
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onSave(base64Audio);
          telemetry.track("audio_feedback_recorded", {
            exercise_name: exerciseName || "workout_overall",
            duration_sec: recordDurationSec,
          }, traineeId);
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start(250); // collect 250ms chunks
      setIsRecording(true);
      setRecordDurationSec(0);

      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        setRecordDurationSec(elapsed);

        // Auto-stop at 60 seconds max
        if (elapsed >= 60) {
          stopRecording();
        }
      }, 500);
    } catch (err: any) {
      console.warn("Microphone access failed:", err);
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setErrorMessage("Microphone permission denied. Please allow microphone access in your browser settings.");
      } else {
        setErrorMessage(err?.message || "Could not access microphone.");
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      // Discard recorded chunks
      audioChunksRef.current = [];
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordDurationSec(0);
  };

  const togglePlayback = () => {
    if (!audioUrl) return;

    if (!audioElementRef.current) {
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPlayProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setPlayProgress(0);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setErrorMessage("Could not play audio recording.");
      };
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Playback error:", err);
        setIsPlaying(false);
      });
    }
  };

  const handleDelete = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsPlaying(false);
    setPlayProgress(0);
    onDelete();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // --------------------------------------------------------------------------
  // STATE 1: RECORDING IN PROGRESS
  // --------------------------------------------------------------------------
  if (isRecording) {
    return (
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 animate-pulse text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="font-mono text-rose-300 font-bold">
            Recording Voice Note: {formatTimer(recordDurationSec)}
          </span>
          <span className="text-[10px] text-rose-400/80">(max 60s)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={cancelRecording}
            className="px-2 py-1 text-[10px] text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow transition active:scale-95 cursor-pointer"
          >
            <Square className="w-3 h-3 fill-white" />
            <span>Done</span>
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STATE 2: AUDIO MEMO READY (PLAYBACK & DELETE)
  // --------------------------------------------------------------------------
  if (audioUrl) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-cyan-800/40 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={togglePlayback}
              className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 transition cursor-pointer active:scale-95"
              title={isPlaying ? "Pause audio note" : "Play audio note"}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400 ml-0.5" />
              )}
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-white flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-cyan-400" />
                <span className="truncate">{label}</span>
              </span>
              <div className="w-24 sm:w-32 bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-cyan-400 h-full transition-all duration-200"
                  style={{ width: `${playProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => shareAudioNoteWithGemini({
                audioUrl,
                exerciseName,
                traineeId,
              })}
              className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-950/70 hover:bg-indigo-900/70 border border-indigo-700/60 text-indigo-300 text-[10px] font-semibold transition cursor-pointer active:scale-95"
              title="Share voice note with Google Gemini"
            >
              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
              <span>Gemini</span>
              <Share2 className="w-2.5 h-2.5 ml-0.5" />
            </button>
            <button
              type="button"
              onClick={startRecording}
              className="text-[10px] text-slate-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-slate-800 transition"
              title="Record again"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
              title="Delete audio note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STATE 3: IDLE (OFFER OPTIONAL AUDIO RECORDING)
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={startRecording}
        className={clsx(
          "flex items-center gap-2 rounded-xl transition cursor-pointer active:scale-98 group text-left",
          compact
            ? "px-2 py-1 text-[11px] text-slate-400 hover:text-cyan-300 bg-slate-900/60 hover:bg-slate-850 border border-slate-800"
            : "w-full px-3 py-2 text-xs text-slate-300 bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-slate-700"
        )}
      >
        <div className="p-1 rounded-lg bg-cyan-950/80 border border-cyan-800/40 text-cyan-400 group-hover:scale-105 transition flex-shrink-0">
          <Mic className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-slate-200 text-[11px] group-hover:text-cyan-300 transition">
            {label}
          </span>
          <span className="text-[10px] text-slate-500">
            Tap to record quick voice notes (optional)
          </span>
        </div>
      </button>

      {errorMessage && (
        <p className="text-[10px] text-rose-400 px-1 pt-0.5">{errorMessage}</p>
      )}
    </div>
  );
}
