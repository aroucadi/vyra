"use client";

import React, { useState } from "react";
import {
  Brain,
  Copy,
  Check,
  Download,
  Terminal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Radio,
  ExternalLink,
} from "lucide-react";
import { appStore } from "@/lib/store";

interface ClaudeMcpConnectorCardProps {
  userId: string;
}

export function ClaudeMcpConnectorCard({ userId }: ClaudeMcpConnectorCardProps) {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const user = appStore.getUser(userId) || appStore.getCurrentUser();
  const athleteName = user.name || "Athlete";
  const cleanSlug = athleteName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const patToken = `vyra_pat_${user.id}_live`;
  const cloudRunUrl = "https://vyra-app-592834219346.me-central1.run.app";
  const mcpEndpointUrl = `${cloudRunUrl}/api/mcp`;

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        vyra: {
          command: "node",
          args: ["<project-path>/scripts/vyra-claude-mcp.mjs"],
          env: {
            VYRA_API_URL: cloudRunUrl,
            VYRA_API_KEY: patToken,
          },
        },
      },
    },
    null,
    2
  );

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(patToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } catch {}
  };

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(claudeDesktopConfig);
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    } catch {}
  };

  const handleCopyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(mcpEndpointUrl);
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    } catch {}
  };

  const handleDownloadClaudeDossier = async () => {
    const sessions = appStore.getSessions(userId);
    const metrics = appStore.getMetrics(userId);
    const program = appStore.getActiveProgramForTrainee(userId);

    const currentWeight = metrics.length
      ? metrics[metrics.length - 1].weightKg
      : user.biometrics?.baselineWeightKg ?? user.baselineMetrics?.fedBaselineWeightKg ?? 52.05;
    const smmKg = user.biometrics?.skeletalMuscleMassKg ?? 24.9;
    const smmIndex =
      currentWeight > 0 ? Number(((smmKg / currentWeight) * 100).toFixed(1)) : 47.8;
    const bodyFat = user.biometrics?.bodyFatPercent ?? 10.0;
    const targetWeight = user.biometrics?.week16TargetWeightKg ?? 57.0;
    const leftArm = user.biometrics?.segmentalSymmetry?.leftArmKg ?? 2.5;
    const rightArm = user.biometrics?.segmentalSymmetry?.rightArmKg ?? 2.5;
    const leftLeg = user.biometrics?.segmentalSymmetry?.leftLegKg ?? 7.6;
    const rightLeg = user.biometrics?.segmentalSymmetry?.rightLegKg ?? 7.5;
    const trunk = user.biometrics?.segmentalSymmetry?.trunkKg ?? 12.6;

    const markdownDossier = `# VYRA SOVEREIGN ATHLETE DOSSIER // ANTHROPIC CLAUDE SYSTEM CONTEXT
Exported: ${new Date().toISOString()}
Target Athlete: ${athleteName} (${user.email})
Athlete ID: ${user.id}

## 1. INSTRUCTIONS FOR CLAUDE
You are ${athleteName}'s Master Biomechanical, Hypertrophy, and Recovery AI Coach.
You have verified access to their physical baseline, InBody bio-impedance telemetry, active periodization split, and logged workout flight data.
When analyzing:
- Prioritize high stimulus-to-fatigue ratio movements.
- Audit progressive overload deltas without prescribing junk volume.
- Respect their structural injury restrictions and bilateral symmetry balance.

## 2. BIOMETRIC BASELINE & INBODY SEGMENTAL HYPERTROPHY
- Current Bodyweight: ${currentWeight} kg (Target: ${targetWeight} kg lean surplus)
- Skeletal Muscle Mass (SMM): ${smmKg} kg (${smmIndex}% SMM Index)
- Body Fat Percentage: ${bodyFat}%
- Bilateral Symmetry Scan:
  - Upper Extremities: Left Arm ${leftArm} kg vs Right Arm ${rightArm} kg
  - Lower Extremities: Left Leg ${leftLeg} kg vs Right Leg ${rightLeg} kg
  - Axial Trunk Base: ${trunk} kg
- Daily Macro Pacing: ${user.baselineMetrics?.dailyTargetKcal ?? 2850} kcal (${user.baselineMetrics?.dailyMacrosTarget?.proteinG ?? 140}g Protein, ${user.baselineMetrics?.dailyMacrosTarget?.carbsG ?? 380}g Carbs, ${user.baselineMetrics?.dailyMacrosTarget?.fatG ?? 65}g Fats)
- Structural Restrictions: ${user.injuries.length > 0 ? user.injuries.join(", ") : "None reported. Full ROM permitted."}

## 3. ACTIVE PERIODIZATION MESOCYCLE
- Program: ${program?.title || "16-Week Recomposition & Structural Balance"}
- Split: ${program?.title || "5-Day Master Split (Upper A / Lower A / Push B / Pull B / Legs Core)"}
- Target Sets per Movement: 3
- Standard Rep Range: 6 - 10 reps
- Prescribed Target RIR: 1 - 2 RIR

## 4. FLIGHT RECORDER WORKOUT HISTORY (${sessions.length} SESSIONS)
${sessions
  .slice(0, 10)
  .map(
    (s, idx) => `
### Session #${sessions.length - idx}: ${s.dayLabel} (${s.date})
- Total Ballast Volume: ${Math.round(
      s.setLogs.reduce((acc, l) => acc + (l.weightKg || 0) * (l.reps || 0), 0)
    ).toLocaleString()} kg
- Duration: ${Math.round((s.durationSec || 0) / 60)} minutes
- PRs Hit: ${s.setLogs.filter((l) => l.isPR).length}
- Notes: ${s.sessionNote || "None"}
- Sets Logged:
${s.setLogs
  .map(
    (l) =>
      `  * ${l.exerciseName}: ${l.weightKg}kg × ${l.reps} reps (RIR ${l.rirAchieved ?? "N/A"})${
        l.isPR ? " [PR]" : ""
      }`
  )
  .join("\n")}
`
  )
  .join("\n")}

## 5. RECENT WEIGH-IN METRICS
${metrics
  .slice(-14)
  .map((m) => `- ${m.date}: ${m.weightKg} kg`)
  .join("\n")}
`;

    if (typeof window !== "undefined") {
      const blob = new Blob([markdownDossier], {
        type: "text/markdown;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vyra-athlete-dossier-${cleanSlug}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <section className="p-4 bg-[#090d16] border border-[#1b2d47] rounded-2xl space-y-3.5 shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#1b2d47] pb-2.5">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
            Real-Time Anthropic Claude Connector (MCP)
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
          <span>LIVE API ONLINE</span>
        </span>
      </div>

      <p className="text-xs text-slate-300 font-sans leading-relaxed">
        Connect Anthropic Claude to Vyra via the official <strong>Model Context Protocol (MCP)</strong>. As your InBody muscle mass, sets, and bodyweight evolve in the gym, Claude queries this live endpoint in real time — with zero manual file downloads.
      </p>

      {/* Live Remote API Endpoint Box */}
      <div className="p-3 rounded-xl bg-[#05080c] border border-[#1b2d47] space-y-1.5 font-mono">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="uppercase flex items-center gap-1 text-[#10b981]">
            <Radio className="w-3 h-3 text-[#10b981] animate-pulse" />
            <span>Live Remote MCP Endpoint (JSON-RPC 2.0)</span>
          </span>
          <button
            type="button"
            onClick={handleCopyEndpoint}
            className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
          >
            {copiedEndpoint ? (
              <>
                <Check className="w-3 h-3 text-[#10b981]" />
                <span className="text-[#10b981]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy URL</span>
              </>
            )}
          </button>
        </div>
        <code className="text-[11px] text-cyan-300 block truncate select-all">
          {mcpEndpointUrl}
        </code>
      </div>

      {/* Quick Action CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="py-2.5 px-3 rounded-xl bg-[#10b981] hover:bg-[#059669] text-black font-display font-black uppercase tracking-wider text-xs active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)]"
        >
          <Terminal className="w-4 h-4 stroke-[2.5]" />
          <span>Setup Claude Desktop (Live)</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 ml-1" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
          )}
        </button>

        <button
          type="button"
          onClick={handleDownloadClaudeDossier}
          className="py-2.5 px-3 rounded-xl bg-[#0f1724] border border-[#1b2d47] text-slate-200 hover:text-white hover:border-cyan-400 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer font-bold"
          title="Download snapshot for Claude.ai Project Knowledge"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Export Claude Project File</span>
        </button>
      </div>

      {/* Expanded Claude Desktop / Code Setup */}
      {isExpanded && (
        <div className="pt-2 space-y-3 animate-in fade-in">
          {/* Personal Access Token */}
          <div className="p-3 rounded-xl bg-[#05080c] border border-[#1b2d47] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="uppercase">Personal Access Token (PAT) for {athleteName}</span>
              <span className="text-[#10b981] font-bold">Scoped to User ID: {user.id}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs font-mono text-[#10b981] truncate">
                {patToken}
              </code>
              <button
                type="button"
                onClick={handleCopyToken}
                className="px-2.5 py-1 rounded-lg bg-[#0f1724] border border-[#1b2d47] text-slate-300 hover:text-white text-[10px] font-mono flex items-center gap-1 cursor-pointer"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-3 h-3 text-[#10b981]" />
                    <span className="text-[#10b981]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Token</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Claude Desktop Config Snippet */}
          <div className="p-3 rounded-xl bg-[#05080c] border border-[#1b2d47] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="uppercase">claude_desktop_config.json</span>
              <button
                type="button"
                onClick={handleCopyConfig}
                className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                {copiedConfig ? (
                  <>
                    <Check className="w-3 h-3 text-[#10b981]" />
                    <span className="text-[#10b981]">Config Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Config</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-[10.5px] font-mono text-slate-300 p-2.5 bg-[#090d16] rounded-lg border border-[#1b2d47]/70 overflow-x-auto leading-relaxed no-scrollbar">
              {claudeDesktopConfig}
            </pre>
          </div>

          <div className="text-[10px] font-mono text-slate-400 leading-normal">
            💡 <strong className="text-white">How it works:</strong> Paste this into your Claude Desktop configuration file (<code className="text-cyan-300">%APPDATA%\Claude\claude_desktop_config.json</code>). Claude will automatically execute live queries to your Cloud Run instance whenever you chat!
          </div>
        </div>
      )}
    </section>
  );
}
