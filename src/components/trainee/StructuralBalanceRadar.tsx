"use client";

import React, { useState } from "react";
import { RoleEvaluationResult, BALANCE_STATUSES } from "@/lib/training-math/structural-balance-types";
import { clsx } from "clsx";

export interface StructuralBalanceRadarProps {
  results: RoleEvaluationResult[];
  labels: Record<string, string>;
  selectedRoleId?: string;
  onSelectRole?: (roleId: string) => void;
  className?: string;
}

export function StructuralBalanceRadar({
  results,
  labels,
  selectedRoleId,
  onSelectRole,
  className,
}: StructuralBalanceRadarProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    selectedRoleId || results[0]?.roleId || ""
  );

  const activeId = selectedRoleId !== undefined ? selectedRoleId : internalSelectedId;
  const activeResult = results.find((r) => r.roleId === activeId) || results[0];

  const handleSelect = (roleId: string) => {
    setInternalSelectedId(roleId);
    if (onSelectRole) onSelectRole(roleId);
  };

  const N = results.length;
  if (N < 3) {
    return (
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
        At least 3 benchmark roles required for radar visualization.
      </div>
    );
  }

  const cx = 150;
  const cy = 150;
  const maxR = 95;

  // Compute angle for each role (starting from 12 o'clock)
  const angleForIndex = (i: number) => (2 * Math.PI * i) / N - Math.PI / 2;

  // Concentric rings (25%, 50%, 75%, 100%)
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Benchmark target polygon coordinates (at 100%)
  const targetPoints = results
    .map((_, i) => {
      const angle = angleForIndex(i);
      const x = cx + maxR * Math.cos(angle);
      const y = cy + maxR * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Actual lifter polygon coordinates
  const actualPointsData = results.map((r, i) => {
    const angle = angleForIndex(i);
    // Relative score: actualPct / targetPct (1.0 = 100% of benchmark)
    const ratio =
      r.actualPct != null && r.targetPct > 0 ? r.actualPct / r.targetPct : 0.15;
    const clampedRatio = Math.min(1.25, Math.max(0.1, ratio));
    const radius = clampedRatio * maxR;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    return { x, y, roleId: r.roleId, status: r.status, ratio: Math.round(ratio * 100) };
  });

  const actualPoints = actualPointsData.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const statusColors: Record<string, { fill: string; stroke: string; text: string; bg: string }> = {
    [BALANCE_STATUSES.BALANCED]: {
      fill: "#10B981",
      stroke: "#059669",
      text: "text-emerald-400",
      bg: "bg-emerald-500/15 border-emerald-500/30",
    },
    [BALANCE_STATUSES.BORDERLINE]: {
      fill: "#F59E0B",
      stroke: "#D97706",
      text: "text-amber-400",
      bg: "bg-amber-500/15 border-amber-500/30",
    },
    [BALANCE_STATUSES.WEAK]: {
      fill: "#F43F5E",
      stroke: "#E11D48",
      text: "text-rose-400",
      bg: "bg-rose-500/15 border-rose-500/30",
    },
    [BALANCE_STATUSES.NO_DATA]: {
      fill: "#64748B",
      stroke: "#475569",
      text: "text-slate-400",
      bg: "bg-slate-800 border-slate-700",
    },
  };

  return (
    <div className={clsx("p-4 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4", className)}>
      {/* 1. Radar Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
            Biomechanical Symmetry
          </span>
          <h3 className="text-sm font-bold text-white tracking-tight">Postural Balance Radar</h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Actual
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            100% Benchmark
          </span>
        </div>
      </div>

      {/* 2. SVG Radar Canvas */}
      <div className="relative w-full aspect-square max-w-[280px] mx-auto select-none">
        <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
          {/* Concentric grid rings */}
          {rings.map((factor) => (
            <circle
              key={factor}
              cx={cx}
              cy={cy}
              r={maxR * factor}
              fill="none"
              stroke="#1e293b"
              strokeWidth="1"
              strokeDasharray={factor === 1.0 ? "none" : "2 3"}
            />
          ))}

          {/* Spokes from center to vertices */}
          {results.map((_, i) => {
            const angle = angleForIndex(i);
            const x = cx + maxR * Math.cos(angle);
            const y = cy + maxR * Math.sin(angle);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="#1e293b"
                strokeWidth="1"
              />
            );
          })}

          {/* Benchmark 100% Target Envelope (dashed slate/cyan) */}
          <polygon
            points={targetPoints}
            fill="#06b6d4"
            fillOpacity="0.04"
            stroke="#0891b2"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />

          {/* Actual Lifter Polygon */}
          <polygon
            points={actualPoints}
            fill="#10b981"
            fillOpacity="0.22"
            stroke="#10b981"
            strokeWidth="2"
          />

          {/* Vertex handles with tap targets */}
          {actualPointsData.map((p, i) => {
            const angle = angleForIndex(i);
            const labelX = cx + (maxR + 18) * Math.cos(angle);
            const labelY = cy + (maxR + 18) * Math.sin(angle);
            const isSelected = p.roleId === activeId;
            const color = statusColors[p.status] || statusColors[BALANCE_STATUSES.NO_DATA];

            return (
              <g key={p.roleId} className="cursor-pointer" onClick={() => handleSelect(p.roleId)}>
                {/* Vertex Dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 6 : 4}
                  fill={color.fill}
                  stroke="#0b0f17"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {/* Spoke Axis Label */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={clsx(
                    "text-[9px] font-mono transition-colors",
                    isSelected ? "fill-emerald-400 font-bold" : "fill-slate-400"
                  )}
                >
                  {labels[p.roleId] || p.roleId}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 3. Selected Role Detail (Obeying 3-element vertical ceiling) */}
      {activeResult && (
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs animate-in fade-in duration-150">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Selected Role</span>
            <div className="font-bold text-white tracking-tight">
              {labels[activeResult.roleId] || activeResult.roleId}
            </div>
            <div className="text-[11px] font-mono text-slate-400 tabular">
              {activeResult.current ? (
                <span>
                  Current: <strong className="text-white">{activeResult.current.w}kg</strong> ×{" "}
                  {activeResult.current.r} reps
                </span>
              ) : (
                <span className="text-slate-500">No session logged yet</span>
              )}
            </div>
          </div>

          <div className="text-right space-y-1">
            <span
              className={clsx(
                "inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border",
                (statusColors[activeResult.status] || statusColors[BALANCE_STATUSES.NO_DATA]).bg,
                (statusColors[activeResult.status] || statusColors[BALANCE_STATUSES.NO_DATA]).text
              )}
            >
              {activeResult.status.toUpperCase()}
            </span>
            <div className="text-[11px] font-mono tabular text-slate-300">
              {activeResult.actualPct != null ? `${Math.round(activeResult.actualPct)}%` : "—"}{" "}
              <span className="text-slate-500">/ {activeResult.targetPct}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
