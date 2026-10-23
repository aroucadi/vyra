"use client";

import React, { useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Dumbbell,
  Calendar,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { decodeTrainerInvite, acceptCoachInvite, TrainerInvitePayload } from "@/lib/trainer-invite";
import { appStore } from "@/lib/store";

export default function CoachInvitePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const coachId = (params?.coachId as string) || "trainer_1";
  const token = searchParams.get("token") || "";

  const [accepted, setAccepted] = useState(false);

  // Decode invite token or build default coach payload
  const invite: TrainerInvitePayload = useMemo(() => {
    const decoded = decodeTrainerInvite(token);
    if (decoded) return decoded;

    const coach = appStore.getUser(coachId);
    return {
      coachId,
      coachName: coach?.name || "Coach Julian",
      programTitle: "16-Week Recomposition & Structural Balance",
      weeks: 16,
      anchorLift: "barbell_bench",
      startingBenchKg: 80,
      unit: "kg",
      customNote: "Your custom periodization program is calibrated and ready on your phone.",
    };
  }, [coachId, token]);

  const handleAccept = () => {
    const randomTraineeId = `athlete_${Date.now()}`;
    acceptCoachInvite(randomTraineeId, invite);
    setAccepted(true);
    setTimeout(() => {
      router.push("/today");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col justify-center px-4 py-12">
      <div className="max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-300">
        {/* Header Eyebrow */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 inline-block">
            Coach Invitation
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            You&apos;re Invited to Train with {invite.coachName}
          </h1>
          <p className="text-xs text-slate-400">
            A bespoke 16-week mesocycle has been curated and calibrated for you.
          </p>
        </div>

        {/* Coach Credential Card (<= 3 elements per AGENTS.md) */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3.5 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-lg">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{invite.coachName}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Verified Coach
                </span>
              </div>
              <span className="text-xs text-slate-400 block mt-0.5">
                Vyra Certified Performance Coach
              </span>
            </div>
          </div>

          {invite.customNote && (
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 italic leading-relaxed">
              &ldquo;{invite.customNote}&rdquo;
            </div>
          )}
        </div>

        {/* Program Preview Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
              Assigned Mesocycle
            </span>
            <span className="text-[11px] font-mono text-emerald-400 tabular-nums font-semibold">
              {invite.weeks} Weeks Total
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">{invite.programTitle}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Poliquin structural balance progression with auto-regulated RIR and tension spotlights.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Frequency</span>
              </div>
              <span className="text-sm font-bold text-white block mt-1">4 Days / Week</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                <span>Starting Anchor</span>
              </div>
              <span className="text-sm font-bold text-emerald-400 block mt-1 tabular-nums">
                {invite.startingBenchKg} {invite.unit} Bench
              </span>
            </div>
          </div>
        </div>

        {/* Zero Gate Guarantee */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>No credit card required · Instant access on this device</span>
        </div>

        {/* Single Primary CTA */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            disabled={accepted}
            onClick={handleAccept}
            className="w-full min-h-[48px] py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
          >
            {accepted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Setting up Day 1...</span>
              </>
            ) : (
              <>
                <span>Accept & Start Day 1 Workout</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center">
            <Link
              href="/exercises"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Explore 6,554 Exercise Catalogue First →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
