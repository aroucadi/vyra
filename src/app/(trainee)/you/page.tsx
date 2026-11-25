"use client";

import React, { useState } from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { DeveloperMenu } from "@/components/DeveloperMenu";
import { GymSelectorDrawer } from "@/components/trainee/GymSelectorDrawer";
import { PasskeySyncCard } from "@/components/trainee/PasskeySyncCard";
import { ClaudeMcpConnectorCard } from "@/components/trainee/ClaudeMcpConnectorCard";
import {
  useIsClientHydrated,
  useVyraAuth,
  useVyraStoreVersion,
} from "@/components/auth/VyraAuthProvider";
import { triggerBackupDownload } from "@/lib/storage";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Dumbbell,
  ExternalLink,
  Flame,
  KeyRound,
  LogIn,
  LogOut,
  MapPin,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

function getTodayIsoDate(): string {
  return new Date().toISOString().split("T")[0];
}

export default function YouPage() {
  useVyraStoreVersion();
  const isHydrated = useIsClientHydrated();
  const { isAuthenticated, isAlaa, authEmail, signOutAll } = useVyraAuth();
  const currentUser = appStore.getCurrentUser();

  const [isGymDrawerOpen, setIsGymDrawerOpen] = useState(false);
  const [, setGymListVersion] = useState(0);
  const [expandedTruthIndex, setExpandedTruthIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const displayName = isHydrated ? currentUser.name : "Athlete";
  const displayAvatar = isHydrated ? currentUser.avatarUrl : undefined;
  const defaultGym = isHydrated
    ? appStore.getDefaultGymLocation(currentUser.id)
    : undefined;
  const gymsCount = isHydrated
    ? appStore.getUserGymLocations(currentUser.id).length
    : 0;

  // Biometrics telemetry
  const baselineWeight = currentUser.biometrics?.baselineWeightKg ?? 52.05;
  const targetWeightW12 = currentUser.biometrics?.week12TargetWeightKg ?? 55.5;
  const apexWeight = currentUser.biometrics?.longTermAthleteTargetKg ?? 59.3;
  const heightCm = currentUser.biometrics?.heightCm ?? currentUser.heightCm ?? 172;
  const skeletalMuscleKg = currentUser.biometrics?.skeletalMuscleMassKg ?? 24.9;
  const bodyFat = currentUser.biometrics?.bodyFatPercent ?? 10.0;
  const dailyKcal = currentUser.baselineMetrics?.dailyTargetKcal ?? 2710;

  // Mass Trajectory calculation
  // Assume current progress is on the path from baselineWeight to targetWeightW12
  const trajectoryPercent = Math.min(
    100,
    Math.max(15, Math.round(((52.45 - baselineWeight) / (targetWeightW12 - baselineWeight)) * 100))
  );

  // The 5 Biomechanical Truths
  const truths = [
    {
      id: "01",
      code: "PELVIC_MASTER_SWITCH",
      title: "01 // Pelvic Master Switch",
      badge: "ARMED",
      color: "#10b981",
      rule: "Glutes locked, ribs stacked down over hips on every lift.",
      detail:
        currentUser.biomechanicalTruths?.truth1_pelvicMasterSwitch ||
        "Anterior pelvic tilt and rib flare slacken the thoracolumbar fascia and overload the lumbar spine. Lock pelvis (glutes squeezed, belt buckle tilted slightly up, ribs stacked down) on every lift.",
    },
    {
      id: "02",
      code: "SCAPULAR_STARTER_MOTOR",
      title: "02 // Scapular Starter Motor",
      badge: "ENFORCED",
      color: "#00f2fe",
      rule: "1s scapular depression pause at top of every pulldown before humeral drive.",
      detail:
        currentUser.biomechanicalTruths?.truth4_widePullStarterMotor ||
        "0 wide pull-ups stem from weak scapular depression initiation. Fix via daily 30s Hollow-Body Scapular Hangs and 1s scapular depression pauses at the top of every pulldown.",
    },
    {
      id: "03",
      code: "EXTERNAL_TORSO_SUPPORT",
      title: "03 // External Torso Support",
      badge: "VERIFIED",
      color: "#10b981",
      rule: "Chest, back & preacher pads eliminate torso guarding to unlock true 1-2 RIR.",
      detail:
        currentUser.biomechanicalTruths?.truth3_externalSupport ||
        "Chest, back, and preacher pads eliminate torso-stabilization guarding and unlock true 1-2 RIR hypertrophy output under the 37-minute lunch clock.",
    },
    {
      id: "04",
      code: "30_DEG_SCAPULAR_PLANE",
      title: "04 // 30° Scapular Plane",
      badge: "COLLIMATED",
      color: "#00f2fe",
      rule: "30° plane, 2:1 cable stack, 5kg flat jumps prevent supraspinatus impingement.",
      detail:
        currentUser.biomechanicalTruths?.truth2_midlineVsLongLever ||
        "Strong midline pulling vs long-lever neural braking on abduction/shoulder press. Use 30° scapular plane, 2:1 stack 5 kg flat progression, and 10 kg flat shoulder press on fresh Saturday mornings.",
    },
    {
      id: "05",
      code: "MONDAY_FOOTBALL_DECONFLICTION",
      title: "05 // Monday Football Deconfliction",
      badge: "GUARDED",
      color: "#f59e0b",
      rule: "Zero lower-body loading Monday night. 100% seated/chest-supported Tuesday.",
      detail:
        "Monday Night Football (19:15 match) mandates zero lower-body axial loading on Monday and 100% seated/supported pulls on Tuesday to deconflict hamstring and adductor recovery.",
    },
  ];

  // Clinical Biomarkers
  const creatinineVal = 8.2;
  const ureaVal = 0.2;
  const egfrVal = 113;

  const handleExportFullVault = async () => {
    try {
      setIsExporting(true);
      const { buildFullTraineeExportPayloadAsync } = await import("@/lib/export-backup");
      const exportPayload = await buildFullTraineeExportPayloadAsync(currentUser.id);
      triggerBackupDownload(
        exportPayload,
        `vyra-sovereign-vault-${currentUser.id}-${getTodayIsoDate()}.json`
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 pb-28 px-4 pt-4 max-w-md mx-auto w-full space-y-5 animate-in fade-in duration-300 font-body select-none">
      {/* 1. TOP IDENTITY & CLEARANCE HEADER */}
      <header className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
            <span className="text-[10px] font-mono text-[#10b981] font-bold tracking-widest uppercase">
              SOVEREIGN PASSPORT ACTIVE
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/25 font-bold">
            256-BIT SYNC
          </span>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-xl bg-[#05080c] border border-[#1b2d47] flex items-center justify-center text-[#10b981] overflow-hidden font-display font-black text-xl shadow-[0_0_12px_rgba(16,185,129,0.2)] flex-shrink-0">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              displayName.slice(0, 2).toUpperCase()
            )}
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display uppercase tracking-wider font-extrabold text-white truncate">
                {displayName}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-bold flex-shrink-0">
                ATHLETE
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              ID: {currentUser.id.toUpperCase()} · {authEmail || currentUser.email}
            </p>
            {isAlaa && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Owner Biological Vault</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 2. BIOLOGICAL PASSPORT & MASS TRAJECTORY */}
      <section className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#10b981]" />
            <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
              Biological Passport // Hypertrophy Cadence
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#10b981] font-bold">
            +0.20 to +0.40 kg/wk
          </span>
        </div>

        {/* Horizontal Milestone Trajectory Gauge */}
        <div className="p-3 bg-[#05080c] rounded-xl border border-[#1b2d47] space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">
                Floor Baseline
              </span>
              <span className="font-bold text-slate-300">
                {baselineWeight.toFixed(2)} KG
              </span>
            </div>

            <div className="text-center">
              <span className="text-[9px] text-[#10b981] uppercase font-bold block">
                Target W12
              </span>
              <span className="font-extrabold text-[#10b981] text-sm">
                {targetWeightW12.toFixed(1)} KG
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-cyan-400 uppercase block">
                Apex Horizon
              </span>
              <span className="font-bold text-cyan-300">
                {apexWeight.toFixed(1)} KG
              </span>
            </div>
          </div>

          {/* Progress track */}
          <div className="w-full bg-[#1b2d47] h-2 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-[#10b981] to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
              style={{ width: `${trajectoryPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
            <span>Fed Baseline: 52.45 KG</span>
            <span className="text-[#10b981] font-bold">Cadence: In Progress</span>
            <span>Target: Lean Mass</span>
          </div>
        </div>

        {/* 4-Column Key Biometrics Matrix */}
        <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
          <div className="p-2 bg-[#05080c] rounded-lg border border-[#1b2d47]">
            <div className="text-sm font-display font-black text-white">
              {heightCm}
              <span className="text-[9px] text-slate-400 ml-0.5">CM</span>
            </div>
            <div className="text-[9px] text-slate-400 uppercase mt-0.5">Height</div>
          </div>

          <div className="p-2 bg-[#05080c] rounded-lg border border-[#1b2d47]">
            <div className="text-sm font-display font-black text-[#10b981]">
              {skeletalMuscleKg}
              <span className="text-[9px] text-slate-400 ml-0.5">KG</span>
            </div>
            <div className="text-[9px] text-slate-400 uppercase mt-0.5">Muscle</div>
          </div>

          <div className="p-2 bg-[#05080c] rounded-lg border border-[#1b2d47]">
            <div className="text-sm font-display font-black text-cyan-300">
              {bodyFat.toFixed(1)}
              <span className="text-[9px] text-slate-400 ml-0.5">%</span>
            </div>
            <div className="text-[9px] text-slate-400 uppercase mt-0.5">Body Fat</div>
          </div>

          <div className="p-2 bg-[#05080c] rounded-lg border border-[#1b2d47]">
            <div className="text-sm font-display font-black text-amber-400">
              {dailyKcal}
            </div>
            <div className="text-[9px] text-slate-400 uppercase mt-0.5">Kcal/D</div>
          </div>
        </div>
      </section>

      {/* 3. THE 5 BIOMECHANICAL TRUTHS (INTERACTIVE TACTICAL HUD) */}
      <section className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
              The 5 Biomechanical Truths // Tactical HUD
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/15 px-2 py-0.5 rounded border border-[#10b981]/30 font-bold">
            CALIBRATED 5/5
          </span>
        </div>

        <div className="space-y-2">
          {truths.map((t, idx) => {
            const isExpanded = expandedTruthIndex === idx;
            return (
              <div
                key={t.id}
                onClick={() => setExpandedTruthIndex(isExpanded ? null : idx)}
                className="p-3 bg-[#05080c] rounded-xl border border-[#1b2d47] hover:border-cyan-500/40 transition cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="font-display uppercase tracking-wider text-sm font-extrabold text-white truncate">
                      {t.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold"
                      style={{
                        color: t.color,
                        borderColor: `${t.color}40`,
                        backgroundColor: `${t.color}15`,
                      }}
                    >
                      {t.badge}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-cyan-400" : ""
                      }`}
                    />
                  </div>
                </div>

                <p className="text-[11px] font-mono text-slate-300 leading-snug">
                  {t.rule}
                </p>

                {isExpanded && (
                  <div className="pt-2 mt-2 border-t border-[#1b2d47]/70 text-[11px] text-slate-400 leading-relaxed font-body animate-in fade-in">
                    {t.detail}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. CLINICAL BIOMARKER GUARDRAILS (RENAL & METABOLIC SHIELD) */}
      <section className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
              Clinical Biomarker Guardrails // Renal Shield
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 font-bold">
            LAB VERIFIED
          </span>
        </div>

        {/* 3 Telemetry Tiles */}
        <div className="grid grid-cols-3 gap-2 font-mono text-center">
          <div className="p-2.5 bg-[#05080c] rounded-xl border border-[#1b2d47]">
            <div className="text-lg font-display font-black text-[#10b981]">
              {creatinineVal}{" "}
              <span className="text-[10px] font-mono text-slate-400 font-normal">
                mg/L
              </span>
            </div>
            <div className="text-[9px] text-slate-400 uppercase mt-0.5">
              Creatinine
            </div>
            <div className="text-[9px] text-[#10b981] mt-1 font-bold">
              Ref: 6.7–11.7
            </div>
          </div>

          <div className="p-2.5 bg-[#05080c] rounded-xl border border-[#1b2d47]">
            <div className="text-lg font-display font-black text-cyan-300">
              {ureaVal}{" "}
              <span className="text-[10px] font-mono text-slate-400 font-normal">
                g/L
              </span>
            </div>
            <div className="text-[9px] text-slate-400 uppercase mt-0.5">
              Serum Urea
            </div>
            <div className="text-[9px] text-cyan-300 mt-1 font-bold">
              Ref: 0.17–0.48
            </div>
          </div>

          <div className="p-2.5 bg-[#05080c] rounded-xl border border-[#1b2d47]">
            <div className="text-lg font-display font-black text-white">
              {egfrVal}{" "}
              <span className="text-[10px] font-mono text-slate-400 font-normal">
                mL/m
              </span>
            </div>
            <div className="text-[9px] text-slate-400 uppercase mt-0.5">
              eGFR (CKD-EPI)
            </div>
            <div className="text-[9px] text-[#10b981] mt-1 font-bold">
              Class I Clean
            </div>
          </div>
        </div>

        {/* Clinical Context Box */}
        <div className="p-3 bg-[#05080c] rounded-xl border border-[#1b2d47] text-[11px] font-mono text-slate-400 leading-relaxed">
          <span className="text-[#10b981] font-bold">● High-Protein Renal Audit: </span>
          Creatine Monohydrate (2.82 g/day in Jumbo Hardcore) tracked for benign
          serum creatinine bumps. Clearance values confirm low muscle turnover
          and green delta for high-protein lean mass accumulation.
        </div>
      </section>

      {/* 5. ANTHROPIC CLAUDE CONNECTOR (MCP) */}
      <ClaudeMcpConnectorCard userId={currentUser.id} />

      {/* 6. SOVEREIGN VAULT & HARDWARE HEADQUARTERS */}
      <section className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#1b2d47]/70 pb-2">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#10b981]" />
            <span className="text-xs font-display uppercase tracking-wider text-white font-bold">
              Sovereign Vault &amp; Hardware Headquarters
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#10b981] font-bold">
            HARDWARE BOUND
          </span>
        </div>

        {/* Training Station Node */}
        <div className="p-3 bg-[#05080c] rounded-xl border border-[#1b2d47] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 flex-shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">
                Assigned Training Station
              </span>
              <p className="font-bold text-white text-xs truncate">
                {defaultGym?.name || "Punch Lissasfa · Casablanca"}
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                {defaultGym?.address || "Lissasfa, Casablanca"} · {gymsCount} locations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsGymDrawerOpen(true)}
            className="text-xs font-mono font-bold text-cyan-300 hover:text-cyan-200 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition cursor-pointer flex-shrink-0"
          >
            Change
          </button>
        </div>

        {/* Passkey Biometric Sync Node */}
        <PasskeySyncCard
          userId={currentUser.id}
          userName={currentUser.name}
          sessionsCount={1}
        />

        {/* Cloud Authentication & Studio Switch */}
        <div className="p-3 bg-[#05080c] rounded-xl border border-[#1b2d47] space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Cloud Link Status:</span>
            {isAuthenticated ? (
              <span className="text-[#10b981] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Firestore Authenticated</span>
              </span>
            ) : (
              <span className="text-amber-400 font-bold">Local Device Storage</span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1 font-mono text-xs">
            {(currentUser.role === "trainer" || currentUser.role === "both") && (
              <Link
                href="/roster"
                className="flex-1 py-2 px-3 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-center hover:bg-cyan-500/25 transition"
              >
                Coach Studio →
              </Link>
            )}

            {isAuthenticated ? (
              <button
                type="button"
                onClick={signOutAll}
                className="py-2 px-3 rounded-lg bg-[#0f1724] border border-[#1b2d47] hover:border-rose-500/40 text-slate-300 hover:text-rose-300 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Deauthorize</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-center transition"
              >
                Sign In to Cloud
              </Link>
            )}
          </div>
        </div>

        {/* PRIMARY CTA: EXPORT SOVEREIGN VAULT */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportFullVault}
            className="w-full h-15 py-3.5 bg-gradient-to-r from-[#10b981] via-emerald-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 active:scale-[0.98] text-[#05080c] font-display uppercase tracking-wider text-xl font-black rounded-xl shadow-[0_0_24px_rgba(16,185,129,0.45)] hover:shadow-[0_0_32px_rgba(0,242,254,0.6)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            <span>
              {isExporting
                ? "EXPORTING TELEMETRY..."
                : "EXPORT SOVEREIGN VAULT (JSON)"}
            </span>
          </button>
        </div>
      </section>

      {/* DEVELOPER TRIGGER */}
      <footer className="pt-4 pb-2 text-center">
        <DeveloperMenu currentUser={currentUser}>
          <div className="text-[10px] font-mono text-slate-600 hover:text-cyan-400 transition select-none cursor-default">
            <p>VYRA · v2.0.0 · SOVEREIGN ATHLETE VAULT</p>
          </div>
        </DeveloperMenu>
      </footer>

      {/* GYM SELECTION DRAWER */}
      <GymSelectorDrawer
        isOpen={isGymDrawerOpen}
        onOpenChange={(open) => {
          setIsGymDrawerOpen(open);
          if (!open) setGymListVersion((v) => v + 1);
        }}
        selectedGymId={defaultGym?.id}
        onSelectGym={(gym) => {
          appStore.setDefaultGymLocation(gym.id, currentUser.id);
          setGymListVersion((v) => v + 1);
        }}
        title="Salles de Sport & Training Locations"
        subtitle="Manage your primary and secondary gyms. Set your default gym for automatic workout attribution."
      />
    </div>
  );
}
