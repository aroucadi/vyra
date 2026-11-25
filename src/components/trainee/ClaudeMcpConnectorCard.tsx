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
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<"web" | "prompt" | "desktop">("web");
  const [isExpanded, setIsExpanded] = useState(false);

  const user = appStore.getUser(userId) || appStore.getCurrentUser();
  const athleteName = user.name || "Athlete";
  const cleanSlug = athleteName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const patToken = `vyra_pat_${user.id}_live`;
  const cloudRunUrl = "https://vyra-app-592834219346.me-central1.run.app";
  const mcpEndpointUrl = `${cloudRunUrl}/api/mcp?userId=${user.id}&token=${patToken}`;

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

  const handleCopyLivePrompt = async () => {
    const sessions = appStore.getSessions(userId);
    const metrics = appStore.getMetrics(userId);
    const currentWeight = metrics.length
      ? metrics[metrics.length - 1].weightKg
      : user.biometrics?.baselineWeightKg ?? user.baselineMetrics?.fedBaselineWeightKg ?? 52.05;
    const smmKg = user.biometrics?.skeletalMuscleMassKg ?? 24.9;
    const smmIndex = currentWeight > 0 ? Number(((smmKg / currentWeight) * 100).toFixed(1)) : 47.8;
    const bodyFat = user.biometrics?.bodyFatPercent ?? 10.0;
    const targetWeight = user.biometrics?.week16TargetWeightKg ?? 57.0;
    const leftArm = user.biometrics?.segmentalSymmetry?.leftArmKg ?? 2.5;
    const rightArm = user.biometrics?.segmentalSymmetry?.rightArmKg ?? 2.5;
    const leftLeg = user.biometrics?.segmentalSymmetry?.leftLegKg ?? 7.6;
    const rightLeg = user.biometrics?.segmentalSymmetry?.rightLegKg ?? 7.5;
    const trunk = user.biometrics?.segmentalSymmetry?.trunkKg ?? 12.6;

    const latestSession = sessions[0];
    const sessionDetails = latestSession
      ? `Recent Session (${latestSession.dayLabel}, ${latestSession.date}):\n` +
        latestSession.setLogs
          .slice(0, 8)
          .map(
            (l) =>
              `• ${l.exerciseName}: ${l.weightKg}kg × ${l.reps} reps (RIR ${
                l.rirAchieved ?? "N/A"
              })${l.isPR ? " [PR]" : ""}`
          )
          .join("\n")
      : "No workouts logged yet.";

    const livePrompt = `You are my Master Biomechanical & Hypertrophy AI Coach. Here is my live Vyra biometric and workout telemetry as of today:
- Athlete: ${athleteName}
- Current Weight: ${currentWeight} kg (Target: ${targetWeight} kg lean surplus)
- InBody Skeletal Muscle Mass (SMM): ${smmKg} kg (${smmIndex}% SMM Index)
- Body Fat: ${bodyFat}%
- Segmental Bilateral Symmetry:
  * Arms: Left ${leftArm} kg vs Right ${rightArm} kg
  * Legs: Left ${leftLeg} kg vs Right ${rightLeg} kg
  * Trunk: ${trunk} kg
- Daily Macro Pacing: ${user.baselineMetrics?.dailyTargetKcal ?? 2850} kcal (${
      user.baselineMetrics?.dailyMacrosTarget?.proteinG ?? 140
    }g Protein, ${user.baselineMetrics?.dailyMacrosTarget?.carbsG ?? 380}g Carbs, ${
      user.baselineMetrics?.dailyMacrosTarget?.fatG ?? 65
    }g Fats)
- Structural Restrictions: ${
      user.injuries.length > 0 ? user.injuries.join(", ") : "None reported."
    }

${sessionDetails}

Please review my stimulus-to-fatigue ratio, audit my progressive overload, and recommend my next coaching directives.`;

    try {
      await navigator.clipboard.writeText(livePrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
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
            Claude AI Integration & Real-Time Sync
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
          <span>LIVE REMOTE ENDPOINT READY</span>
        </span>
      </div>

      <p className="text-xs text-slate-300 font-sans leading-relaxed">
        Connect Anthropic Claude to your real-time athlete profile. As your InBody muscle mass, sets, and bodyweight evolve in the gym, Claude queries Vyra directly — with zero manual file downloads.
      </p>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#05080c] rounded-xl border border-[#1b2d47] text-[11px] font-mono">
        <button
          type="button"
          onClick={() => setActiveTab("web")}
          className={`py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === "web"
              ? "bg-[#10b981] text-black shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Radio className="w-3 h-3" />
          <span>Claude Web</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("prompt")}
          className={`py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === "prompt"
              ? "bg-cyan-500 text-black shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Instant Prompt</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("desktop")}
          className={`py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === "desktop"
              ? "bg-slate-700 text-white shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Terminal className="w-3 h-3" />
          <span>Desktop App</span>
        </button>
      </div>

      {/* Tab 1: Claude Web (claude.ai) Custom Connector */}
      {activeTab === "web" && (
        <div className="space-y-3 pt-1 animate-in fade-in">
          <div className="p-3 rounded-xl bg-[#05080c] border border-[#1b2d47] space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-[#10b981] font-bold uppercase flex items-center gap-1">
                <Radio className="w-3 h-3 text-[#10b981] animate-pulse" />
                <span>Your Real-Time Remote Connector URL</span>
              </span>
              <button
                type="button"
                onClick={handleCopyEndpoint}
                className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                {copiedEndpoint ? (
                  <>
                    <Check className="w-3 h-3 text-[#10b981]" />
                    <span className="text-[#10b981]">URL Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Connector URL</span>
                  </>
                )}
              </button>
            </div>
            <code className="text-[11px] font-mono text-cyan-300 block break-all select-all p-2 bg-[#090d16] rounded-lg border border-[#1b2d47]/70">
              {mcpEndpointUrl}
            </code>
          </div>

          <div className="p-3 rounded-xl bg-[#090d16] border border-[#1b2d47]/70 space-y-2 text-xs text-slate-300">
            <div className="text-[11px] font-display uppercase tracking-wider text-white font-bold flex items-center gap-1.5">
              <span>⚡ How to add it in Claude.ai (Web / Mobile):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 font-sans">
              <li>
                Open <strong className="text-white">claude.ai</strong> in your browser and click your profile icon.
              </li>
              <li>
                Select <strong className="text-white">Customize</strong> (or <strong className="text-white">Settings</strong>) &rarr; <strong className="text-cyan-300">Connectors</strong>.
              </li>
              <li>
                Click <strong className="text-[#10b981]">+ Add custom connector</strong>.
              </li>
              <li>
                Set Name to <strong className="text-white">Vyra Telemetry</strong> and paste the URL copied above.
              </li>
              <li>
                Click <strong className="text-white">Add</strong>. Claude on the web will now call your live Vyra database in real time whenever you chat!
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Tab 2: Instant 1-Tap Telemetry Prompt */}
      {activeTab === "prompt" && (
        <div className="space-y-3 pt-1 animate-in fade-in">
          <p className="text-[11px] text-slate-300 font-sans">
            No setup required! Copy your up-to-the-minute InBody composition and latest workout telemetry to paste directly into any Claude chat message:
          </p>
          <button
            type="button"
            onClick={handleCopyLivePrompt}
            className="w-full py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-black uppercase tracking-wider text-xs active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Live Telemetry Prompt Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Copy Live Telemetry Prompt for Claude</span>
              </>
            )}
          </button>
          <div className="text-[10px] font-mono text-slate-400">
            💡 This prompt includes your current weight, 24.9kg SMM, bilateral symmetry, macro pacing, and last logged sets so Claude can analyze your session immediately.
          </div>
        </div>
      )}

      {/* Tab 3: Claude Desktop Configuration */}
      {activeTab === "desktop" && (
        <div className="space-y-3 pt-1 animate-in fade-in">
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

          <div className="flex items-center justify-between gap-2 pt-1 font-mono text-xs">
            <button
              type="button"
              onClick={handleDownloadClaudeDossier}
              className="w-full py-2 px-3 rounded-xl bg-[#0f1724] border border-[#1b2d47] text-slate-200 hover:text-white hover:border-cyan-400 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer font-bold"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download Project Knowledge File (.md)</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
