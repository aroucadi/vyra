"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { soundService } from "@/lib/in-gym/sound";
import type { SessionMode } from "@/components/trainee/session/types";

export function useSessionTimers(mode: SessionMode) {
  const sessionStartEpochRef = useRef<number | null>(null);
  const warmupStartEpochRef = useRef<number | null>(null);
  const liftingStartEpochRef = useRef<number | null>(null);
  const cooldownStartEpochRef = useRef<number | null>(null);
  const restTargetEpochRef = useRef<number | null>(null);
  const restStartEpochRef = useRef<number | null>(null);

  const [sessionDurationSec, setSessionDurationSec] = useState(0);
  const [liftingDurationSec, setLiftingDurationSec] = useState(0);
  const [totalRestDurationSec, setTotalRestDurationSec] = useState(0);
  const [warmupDurationSec, setWarmupDurationSec] = useState(0);
  const [cooldownDurationSec, setCooldownDurationSec] = useState(0);
  const [restTimerSec, setRestTimerSec] = useState<number | null>(null);

  const syncClocks = useCallback(() => {
    const now = Date.now();
    if (sessionStartEpochRef.current) {
      setSessionDurationSec(
        Math.max(0, Math.round((now - sessionStartEpochRef.current) / 1000))
      );
    }
    if (mode === "warmup" && warmupStartEpochRef.current) {
      setWarmupDurationSec(
        Math.max(0, Math.round((now - warmupStartEpochRef.current) / 1000))
      );
    }
    if (mode === "active" && liftingStartEpochRef.current) {
      setLiftingDurationSec(
        Math.max(0, Math.round((now - liftingStartEpochRef.current) / 1000))
      );
    }
    if (mode === "cooldown" && cooldownStartEpochRef.current) {
      setCooldownDurationSec(
        Math.max(0, Math.round((now - cooldownStartEpochRef.current) / 1000))
      );
    }
    if (restTargetEpochRef.current) {
      const remaining = Math.max(
        0,
        Math.round((restTargetEpochRef.current - now) / 1000)
      );
      setRestTimerSec(remaining);
      if (remaining <= 0) {
        if (restStartEpochRef.current) {
          const rested = Math.max(
            0,
            Math.round((now - restStartEpochRef.current) / 1000)
          );
          setTotalRestDurationSec((prev) => prev + rested);
        }
        restTargetEpochRef.current = null;
        restStartEpochRef.current = null;
        setRestTimerSec(null);
        soundService.playRestChime();
      } else if (remaining <= 3 && remaining > 0) {
        soundService.playCountdownPip();
      }
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "preview" || mode === "summary") return;
    if (!sessionStartEpochRef.current) {
      sessionStartEpochRef.current = Date.now();
    }
    if (mode === "active" && !liftingStartEpochRef.current) {
      liftingStartEpochRef.current = Date.now();
    }
    const interval = setInterval(syncClocks, 500);
    const handleSync = () => syncClocks();
    window.addEventListener("focus", handleSync);
    window.addEventListener("online", handleSync);
    document.addEventListener("visibilitychange", handleSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("online", handleSync);
      document.removeEventListener("visibilitychange", handleSync);
    };
  }, [mode, syncClocks]);

  const startRestCountdown = useCallback((seconds: number) => {
    const now = Date.now();
    if (restStartEpochRef.current && restTargetEpochRef.current) {
      const rested = Math.max(
        0,
        Math.round((now - restStartEpochRef.current) / 1000)
      );
      setTotalRestDurationSec((prev) => prev + rested);
    }
    restStartEpochRef.current = now;
    restTargetEpochRef.current = now + seconds * 1000;
    setRestTimerSec(seconds);
  }, []);

  const cancelOrSkipRest = useCallback(() => {
    const now = Date.now();
    if (restStartEpochRef.current) {
      const rested = Math.max(
        0,
        Math.round((now - restStartEpochRef.current) / 1000)
      );
      setTotalRestDurationSec((prev) => prev + rested);
    }
    restStartEpochRef.current = null;
    restTargetEpochRef.current = null;
    setRestTimerSec(null);
  }, []);

  return {
    sessionStartEpochRef,
    warmupStartEpochRef,
    liftingStartEpochRef,
    cooldownStartEpochRef,
    sessionDurationSec,
    setSessionDurationSec,
    liftingDurationSec,
    setLiftingDurationSec,
    totalRestDurationSec,
    warmupDurationSec,
    setWarmupDurationSec,
    cooldownDurationSec,
    restTimerSec,
    setRestTimerSec,
    startRestCountdown,
    cancelOrSkipRest,
  };
}
