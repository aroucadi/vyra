"use client";

import React, { useState } from "react";
import { CoachProposition, CoachingTier } from "@/lib/ai/coach-agent";

export interface JitCoachPropositionCardProps {
  proposition: CoachProposition;
  onAccept: (proposition: CoachProposition) => void;
  onDismiss: (proposition: CoachProposition) => void;
}

const TIER_BADGE_MAP: Record<
  CoachingTier,
  { label: string; accent: string; bg: string; border: string }
> = {
  tier_1_micro_setup: {
    label: "TIER 1 · SETUP & TEMPO TUNING",
    accent: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.3)",
  },
  tier_2_surgical_swap: {
    label: "TIER 2 · SURGICAL MOVEMENT SWAP",
    accent: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.35)",
  },
  tier_3_volume_prune: {
    label: "TIER 3 · JUNK VOLUME PRUNING",
    accent: "#A855F7",
    bg: "rgba(168, 85, 247, 0.12)",
    border: "rgba(168, 85, 247, 0.3)",
  },
  tier_4_overload_protocol: {
    label: "TIER 4 · OVERLOAD PROTOCOL SHIFT",
    accent: "#10B981",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.3)",
  },
  tier_5_macro_pivot: {
    label: "TIER 5 · SYSTEMIC CNS RECOVERY PIVOT",
    accent: "#EF4444",
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.35)",
  },
};

export function JitCoachPropositionCard({
  proposition,
  onAccept,
  onDismiss,
}: JitCoachPropositionCardProps) {
  const [showTrace, setShowTrace] = useState(false);
  const badge = TIER_BADGE_MAP[proposition.tier] || TIER_BADGE_MAP.tier_2_surgical_swap;
  const trace = proposition.agentTrace;

  return (
    <div
      data-testid="jit-coach-proposition-card"
      style={{
        background: "linear-gradient(165deg, #111622 0%, #0D111A 100%)",
        border: `1px solid ${badge.border}`,
        borderRadius: 16,
        padding: "14px 16px",
        marginBottom: 14,
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.45)",
      }}
    >
      {/* Top Header Row: Tier Badge + Expandable Agent Trace Pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 999,
            background: badge.bg,
            border: `1px solid ${badge.border}`,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: badge.accent,
              boxShadow: `0 0 8px ${badge.accent}`,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: badge.accent,
              textTransform: "uppercase",
            }}
          >
            {badge.label}
          </span>
        </div>

        {trace && (
          <button
            type="button"
            onClick={() => setShowTrace((prev) => !prev)}
            style={{
              background: "#1C2436",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 999,
              padding: "3px 10px",
              fontSize: 10,
              fontWeight: 700,
              color: "#94A3B8",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span>⚡ Agent Trace: {trace.iterationsExecuted} Steps</span>
            {trace.selfCorrectionRetries > 0 && (
              <span style={{ color: "#F59E0B" }}>
                · {trace.selfCorrectionRetries} Self-Correction
              </span>
            )}
            <span>{showTrace ? "▲" : "▼"}</span>
          </button>
        )}
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: "#F8FAFC",
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {proposition.headline}
      </div>

      {/* Observation + Sensory RAG Quote + Root Cause */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          fontSize: 12,
          color: "#CBD5E1",
          lineHeight: 1.45,
          marginBottom: 10,
        }}
      >
        <div>
          <strong style={{ color: "#F8FAFC" }}>📊 Observation: </strong>
          {proposition.observation}
        </div>
        {proposition.sensoryRagContext && (
          <div
            style={{
              background: "rgba(28, 36, 54, 0.75)",
              borderLeft: `3px solid ${badge.accent}`,
              borderRadius: "4px 8px 8px 4px",
              padding: "6px 10px",
              fontSize: 11.5,
              color: "#E2E8F0",
            }}
          >
            <strong style={{ color: badge.accent }}>🎙️ Sensory Memory RAG: </strong>
            {proposition.sensoryRagContext}
          </div>
        )}
        <div>
          <strong style={{ color: "#F8FAFC" }}>🧠 Root Cause: </strong>
          {proposition.rootCauseDiagnosis}
        </div>
      </div>

      {/* Prescription Diff Box */}
      <div
        style={{
          background: "#090C11",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: "10px 12px",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.07em",
            color: "#94A3B8",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          PROPOSED EVOLUTION ({proposition.tierLabel})
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#F59E0B",
            marginBottom: 4,
          }}
        >
          {proposition.proposedFix}
        </div>
        {proposition.mutation.newFormCue && (
          <div style={{ fontSize: 11.5, color: "#94A3B8" }}>
            🎯 <em>Cue: {proposition.mutation.newFormCue}</em>
          </div>
        )}
      </div>

      {/* Optional Expandable Multi-Turn Agent ReAct Trace */}
      {showTrace && trace && (
        <div
          data-testid="agent-execution-trace"
          style={{
            background: "#090C11",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 12,
            fontSize: 11,
            color: "#94A3B8",
          }}
        >
          <div
            style={{
              fontWeight: 800,
              color: "#38BDF8",
              marginBottom: 6,
              fontSize: 10.5,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            AUTONOMOUS REACT TOOL TRACE ({trace.steps.length} TOOL CALLS · COSINE SIM:{" "}
            {trace.topRagCosineSimilarity.toFixed(3)})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {trace.steps.map((s) => (
              <div
                key={`${s.stepIndex}_${s.toolName}`}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  paddingBottom: 5,
                }}
              >
                <div style={{ color: "#E2E8F0", fontWeight: 700 }}>
                  Step {s.stepIndex}: <code>{s.toolName}</code>
                </div>
                <div style={{ color: "#94A3B8", fontSize: 10.5 }}>
                  💭 <em>{s.thought}</em>
                </div>
                <div style={{ color: "#10B981", fontSize: 10.5 }}>
                  🔎 {s.observationSummary}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          data-testid="accept-evolution-btn"
          onClick={() => onAccept(proposition)}
          style={{
            flex: 1.5,
            background: "#F59E0B",
            color: "#090C11",
            border: "none",
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 12.5,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span>✅ Accept & Evolve Today</span>
        </button>
        <button
          type="button"
          data-testid="dismiss-evolution-btn"
          onClick={() => onDismiss(proposition)}
          style={{
            flex: 1,
            background: "#1C2436",
            color: "#CBD5E1",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ✋ Keep Current
        </button>
      </div>
    </div>
  );
}
