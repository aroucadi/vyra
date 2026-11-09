"use client";

import React, { useState } from "react";
import {
  adaptDailyWorkoutSession,
  DailyWorkoutAdaptationResult,
  PlannedSessionExerciseInput,
} from "@/lib/ai/daily-session-adapter";
import { gymVisionInventoryStore } from "@/lib/ai/gym-vision-inventory";

export interface DailyAiCoachAdapterCardProps {
  traineeId: string;
  gymId?: string;
  gymName?: string;
  exercises: PlannedSessionExerciseInput[];
  onApplyDailyAdaptation: (result: DailyWorkoutAdaptationResult) => void;
  onRestoreOriginalSession: () => void;
  activeAdaptation: DailyWorkoutAdaptationResult | null;
}

const QUICK_SCENARIO_CHIPS = [
  {
    id: "poor_sleep",
    label: "😴 Slept Poorly",
    prompt: "I didn't sleep well last night, so let's make today's workout lighter.",
  },
  {
    id: "football_abs",
    label: "⚽ Football Abs Strain",
    prompt:
      "I hurt my abdominals playing football yesterday, so please take that into consideration and avoid exercises that could aggravate the pain.",
  },
  {
    id: "time_20m",
    label: "⏱️ Only 20 Mins",
    prompt:
      "I have an unexpected meeting, so I only have 20 minutes today. Let's focus on the most important exercises.",
  },
  {
    id: "low_energy",
    label: "🔋 Exhausted Today",
    prompt:
      "I'm feeling exhausted today. Let's adjust the intensity and keep things manageable.",
  },
  {
    id: "hotel_gym",
    label: "🏨 Hotel / DBs Only",
    prompt:
      "Training at a hotel gym today with only dumbbells and an adjustable bench, no cables or machines.",
  },
];

export function DailyAiCoachAdapterCard({
  traineeId,
  gymId,
  gymName,
  exercises,
  onApplyDailyAdaptation,
  onRestoreOriginalSession,
  activeAdaptation,
}: DailyAiCoachAdapterCardProps) {
  const [message, setMessage] = useState("");
  const [isAdapting, setIsAdapting] = useState(false);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);

  const inventory = React.useMemo(
    () => gymVisionInventoryStore.getInventoryForGym(gymId, gymName),
    [gymId, gymName, photoStatus]
  );

  const handleRunAdaptation = async (customPrompt?: string) => {
    const textToUse = (customPrompt ?? message).trim();
    if (!textToUse) return;
    setIsAdapting(true);
    try {
      const result = await adaptDailyWorkoutSession({
        traineeId,
        voiceOrTextMessage: textToUse,
        gymId,
        gymName,
        exercises,
      });
      onApplyDailyAdaptation(result);
    } finally {
      setIsAdapting(false);
    }
  };

  const handleGymPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAdapting(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUri = typeof reader.result === "string" ? reader.result : undefined;
        const result = await adaptDailyWorkoutSession({
          traineeId,
          voiceOrTextMessage:
            message || `Recognize available equipment from gym photo at ${gymName || "current gym"}`,
          gymId,
          gymName,
          gymPhotoDataUri: dataUri,
          gymPhotoCaption: message,
          exercises,
        });
        setPhotoStatus(
          `📸 Equipment recognized at ${result.gymInventoryUsed.gymName}: ${result.gymInventoryUsed.availableCategories.join(", ")}`
        );
        onApplyDailyAdaptation(result);
        setIsAdapting(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsAdapting(false);
    }
  };

  return (
    <div
      data-testid="daily-ai-coach-adapter-card"
      style={{
        background: "linear-gradient(165deg, #111622 0%, #090C11 100%)",
        border: "1px solid #1C2436",
        borderRadius: 16,
        padding: "14px 16px",
        marginBottom: 14,
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#F59E0B",
              textTransform: "uppercase",
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              padding: "3px 9px",
              borderRadius: 999,
            }}
          >
            🎙️ AI Personal Trainer · Daily Adaptation
          </span>
        </div>

        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#10B981",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            padding: "2px 8px",
            borderRadius: 999,
          }}
        >
          🔒 Today Only · 16-Wk Plan Safe
        </span>
      </div>

      {/* Location & Visual Equipment Inventory Bar */}
      <div
        style={{
          background: "#090C11",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10,
          padding: "8px 10px",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 11, color: "#94A3B8" }}>
          <strong style={{ color: "#E2E8F0" }}>
            📍 {inventory.gymName}:
          </strong>{" "}
          {inventory.availableCategories.slice(0, 5).join(", ")}
          {inventory.limitations.length > 0 && (
            <span style={{ color: "#F59E0B", marginLeft: 6 }}>
              ({inventory.limitations[0]})
            </span>
          )}
        </div>

        <div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleGymPhotoUpload}
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            style={{
              background: "#1C2436",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              color: "#F59E0B",
              borderRadius: 8,
              padding: "4px 9px",
              fontSize: 10.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            📸 Scan Gym Photo
          </button>
        </div>
      </div>

      {photoStatus && (
        <div
          style={{
            fontSize: 11,
            color: "#38BDF8",
            marginBottom: 8,
          }}
        >
          {photoStatus}
        </div>
      )}

      {/* Quick Scenario Chips */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        {QUICK_SCENARIO_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => {
              setMessage(chip.prompt);
              handleRunAdaptation(chip.prompt);
            }}
            style={{
              background: "#1C2436",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 999,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              color: "#E2E8F0",
              cursor: "pointer",
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Voice / Text Input Row */}
      <div style={{ display: "flex", gap: 6, marginBottom: activeAdaptation ? 10 : 0 }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder='Tell Coach your situation (e.g. "Only 20m today", "Hurt abs in football")...'
          style={{
            flex: 1,
            background: "#090C11",
            border: "1px solid #1C2436",
            borderRadius: 10,
            padding: "8px 11px",
            fontSize: 12,
            color: "#F8FAFC",
          }}
        />
        <button
          type="button"
          disabled={isAdapting || !message.trim()}
          onClick={() => handleRunAdaptation()}
          style={{
            background: "#F59E0B",
            color: "#090C11",
            border: "none",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            opacity: isAdapting || !message.trim() ? 0.6 : 1,
          }}
        >
          {isAdapting ? "Adapting..." : "Adapt Day"}
        </button>
      </div>

      {/* Active Ephemeral Adaptation Summary Banner */}
      {activeAdaptation && (
        <div
          data-testid="active-daily-adaptation-banner"
          style={{
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: 12,
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <strong style={{ fontSize: 12.5, color: "#10B981" }}>
              ✅ {activeAdaptation.coachHeadline}
            </strong>
            <button
              type="button"
              onClick={onRestoreOriginalSession}
              style={{
                background: "#1C2436",
                color: "#CBD5E1",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "3px 8px",
                fontSize: 10.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ↩️ Restore Original
            </button>
          </div>
          <div style={{ fontSize: 11.5, color: "#CBD5E1", lineHeight: 1.4 }}>
            {activeAdaptation.coachExplanation}
          </div>
        </div>
      )}
    </div>
  );
}
