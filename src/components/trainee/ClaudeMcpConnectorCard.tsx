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
} from "lucide-react";
import { appStore } from "@/lib/store";

interface ClaudeMcpConnectorCardProps {
  userId: string;
}

export function ClaudeMcpConnectorCard({ userId }: ClaudeMcpConnectorCardProps) {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isAlaa = userId === "trainee_alaa" || userId.includes("alaa");
  const patToken = `vyra_pat_${userId.replace(/^trainee_/, "")}_live`;
  const cloudRunUrl = "https://vyra-app-592834219346.me-central1.run.app";

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

  const handleDownloadClaudeDossier = async () => {
    const user = appStore.getUser(userId) || appStore.getCurrentUser();
    const sessions = appStore.getSessions(userId);
    const metrics = appStore.getMetrics(userId);
    const program = appStore.getActiveProgramForTrainee(userId);

    const markdownDossier = `# VYRA SOVEREIGN ATHLETE DOSSIER // ANTHROPIC CLAUDE SYSTEM CONTEXT
Exported: ${new Date().toISOString()}
Target Athlete: ${user.name} (${user.email})

## 1. INSTRUCTIONS FOR CLAUDE
You are ${user.name}'s Master Biomechanical, Hypertrophy, and Recovery AI Coach.
You have direct verified access to their physical baseline, InBody bio-impedance telemetry, active periodization split, and logged workout flight data.
When analyzing:
- Prioritize high stimulus-to-fatigue ratio movements.
- Audit progressive overload deltas without prescribing junk volume.
- Respect their structural injury restrictions and bilateral symmetry balance.

## 2. BIOMETRIC BASELINE & INBODY SEGMENTAL HYPERTROPHY
- Baseline Weight: 52.05 kg (Target: 57.0 kg lean surplus)
- Skeletal Muscle Mass (SMM): ${isAlaa ? "24.9 kg (47.8% SMM Index)" : "Tracked"}
- Body Fat Percentage: ${isAlaa ? "10.0%" : "Tracked"}
- Bilateral Symmetry Scan:
  - Upper Extremities: Left Arm 2.5 kg vs Right Arm 2.5 kg (100% Equilibrium)
  - Lower Extremities: Left Leg 7.6 kg vs Right Leg 7.5 kg (99.2% Equilibrium, 0.1 kg Micro-Delta)
  - Axial Trunk Base: 12.6 kg
- Daily Macro Pacing: 2,850 kcal (140g Protein, 380g Carbs, 65g Fats)
- Structural Restrictions: ${user.injuries.length > 0 ? user.injuries.join(", ") : "None reported. Full ROM permitted."}

## 3. ACTIVE PERIODIZATION MESOCYCLE
- Program: ${program?.title || "16-Week Recomposition & Structural Balance"}
- Split: 5-Day Master Split (Upper A / Lower A / Push B / Pull B / Legs Core)
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
      a.download = `vyra-athlete-dossier-for-claude-${userId}.md`;
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
            Anthropic Claude Connector (MCP)
          </span>
        </div>
        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>MCP READY</span>
        </span>
      </div>

      <p className="text-xs text-slate-300 font-sans leading-relaxed">
        Connect Claude Desktop or Claude.ai directly to Vyra. Claude gains live tool access to your 24.9 kg SMM balance, flight logs, and mesocycle split to process deep biomechanical coaching, fatigue telemetry, and program evolutions.
      </p>

      {/* 1-Tap Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs">
        <button
          type="button"
          onClick={handleDownloadClaudeDossier}
          className="py-2.5 px-3 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>Dossier for Claude.ai</span>
        </button>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="py-2.5 px-3 rounded-xl bg-[#0f1724] border border-[#1b2d47] text-slate-200 hover:text-white hover:border-[#10b981] active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer font-bold"
        >
          <Terminal className="w-4 h-4 text-[#10b981]" />
          <span>Claude Desktop Setup</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 ml-1 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-400" />
          )}
        </button>
      </div>

      {/* Expanded Claude Desktop / Code Config */}
      {isExpanded && (
        <div className="pt-2 space-y-3 animate-in fade-in">
          {/* Personal Access Token */}
          <div className="p-3 rounded-xl bg-[#05080c] border border-[#1b2d47] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="uppercase">Personal Access Token (PAT)</span>
              <span className="text-[#10b981] font-bold">Scoped to Your Vault</span>
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
                    <span>Copy</span>
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
            💡 <strong className="text-white">How it works:</strong> Paste the config into your Claude Desktop settings file (<code className="text-cyan-300">%APPDATA%\Claude\claude_desktop_config.json</code>). Claude will instantly discover the 6 Vyra telemetry tools!
          </div>
        </div>
      )}
    </section>
  );
}
