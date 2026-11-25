"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Dumbbell,
  Calendar,
  CheckCircle2,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { decodeTrainerInvite, acceptCoachInvite, TrainerInvitePayload } from "@/lib/trainer-invite";
import { appStore } from "@/lib/store";
import { getAthleteIdentity } from "@/lib/auth/identity";
import { useIsClientHydrated } from "@/components/auth/VyraAuthProvider";

function CoachInviteContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isHydrated = useIsClientHydrated();

  const coachId = (params?.coachId as string) || "trainer_1";
  const token = searchParams.get("token") || "";
  const inviteId = searchParams.get("inviteId") || "";

  const [accepted, setAccepted] = useState(false);
  const [serverInvite, setServerInvite] = useState<TrainerInvitePayload | null>(null);

  useEffect(() => {
    if (!inviteId || token) return;
    let active = true;
    fetch(`/api/invites?inviteId=${encodeURIComponent(inviteId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { ok?: boolean; invite?: TrainerInvitePayload } | null) => {
        if (active && data?.ok && data.invite) {
          setServerInvite(data.invite);
        }
      })
      .catch(() => {
        // Fallback to local/default payload cleanly
      });
    return () => {
      active = false;
    };
  }, [inviteId, token]);

  // Decode invite token, server lookup, or build default coach payload
  const invite: TrainerInvitePayload = useMemo(() => {
    const decoded = decodeTrainerInvite(token);
    if (decoded) return decoded;
    if (serverInvite) return serverInvite;

    const coach = isHydrated ? appStore.getUser(coachId) : undefined;
    return {
      coachId,
      coachName: coach?.name || "Coach Marcus",
      programTitle: "16-Week Recomposition & Structural Balance",
      weeks: 16,
      anchorLift: "barbell_bench",
      startingBenchKg: 80,
      unit: "kg",
      customNote: "Your custom periodization program is calibrated and ready on your phone.",
    };
  }, [coachId, token, serverInvite, isHydrated]);

  const handleAccept = async () => {
    const identity = getAthleteIdentity();
    const validAnonId =
      identity.uid && identity.uid !== "anon_visitor"
        ? identity.uid
        : `anon_${typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID().replace(/-/g, "").slice(0, 12) : Date.now().toString(36)}`;
    acceptCoachInvite(validAnonId, invite);
    setAccepted(true);
    void fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "accept",
        inviteId: inviteId || undefined,
        coachId: invite.coachId,
        traineeId: validAnonId,
        traineeName: invite.traineeName,
        invite,
      }),
    }).catch(() => {
      // Offline / local fallback already persisted in appStore
    });
    if (typeof window !== "undefined") {
      window.location.href = "/today";
    } else {
      router.push("/today");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col justify-center px-4 py-12">
      <div className="max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-300">
        {/* Header Eyebrow */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block">
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
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-lg">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{invite.coachName}</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
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
            <span className="text-[11px] font-mono text-amber-400 tabular-nums font-semibold">
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
                <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                <span>Starting Anchor</span>
              </div>
              <span className="text-sm font-bold text-amber-400 block mt-1 tabular-nums">
                {invite.startingBenchKg} {invite.unit} Bench
              </span>
            </div>
          </div>
        </div>

        {/* Zero Gate Guarantee */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>No credit card required · Instant access on this device</span>
        </div>

        {/* Single Primary CTA */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            disabled={accepted}
            onClick={handleAccept}
            className="w-full min-h-[48px] py-3.5 px-5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
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

export default function CoachInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0F17] text-slate-400 flex items-center justify-center text-xs font-mono">
          Loading coach invitation...
        </div>
      }
    >
      <CoachInviteContent />
    </Suspense>
  );
}
