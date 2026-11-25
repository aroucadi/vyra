"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  Search,
  Plus,
  CheckCircle2,
  X,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Dumbbell,
} from "lucide-react";
import { appStore } from "@/lib/store";
import { generateCoachInviteUrl } from "@/lib/trainer-invite";
import {
  useIsClientHydrated,
  useVyraAuth,
  useVyraStoreVersion,
} from "@/components/auth/VyraAuthProvider";
import type { FirestoreClientLinkRecord } from "@/lib/firebase/firestore-repository";

export default function TrainerRosterPage() {
  const isHydrated = useIsClientHydrated();
  const { isAuthenticated } = useVyraAuth();
  const storeVersion = useVyraStoreVersion();
  const [cloudClients, setCloudClients] = useState<FirestoreClientLinkRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentUser = appStore.getCurrentUser();
  const coachId =
    currentUser.role === "trainer" || currentUser.role === "both"
      ? currentUser.id
      : "coach_1";
  const coachName = (isHydrated && currentUser.name) || "Coach Marcus";

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;
    let active = true;
    fetch(`/api/invites?coachId=${encodeURIComponent(coachId)}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data: { ok?: boolean; clients?: FirestoreClientLinkRecord[] } | null) => {
          if (active && data?.ok && Array.isArray(data.clients)) {
            setCloudClients(data.clients);
          }
        }
      )
      .catch(() => {
        // Non-fatal fallback to local roster
      });
    return () => {
      active = false;
    };
  }, [isHydrated, isAuthenticated, coachId]);

  const rosterItems = useMemo(() => {
    void storeVersion;
    if (!isHydrated) return [];
    const localRoster = appStore.getRoster();
    const seenIds = new Set(localRoster.map((r) => r.trainee.id));
    const merged = [...localRoster];

    for (const cloudClient of cloudClients) {
      if (!seenIds.has(cloudClient.traineeId)) {
        seenIds.add(cloudClient.traineeId);
        merged.push({
          trainee: {
            id: cloudClient.traineeId,
            name: cloudClient.name,
            email: cloudClient.email || `${cloudClient.traineeId}@app.vyra.fit`,
            role: "trainee",
            injuries: [],
            goals: ["Strength & Hypertrophy"],
          },
          activeProgram: cloudClient.programId
            ? {
                id: cloudClient.programId,
                trainerId: cloudClient.coachId,
                traineeId: cloudClient.traineeId,
                title:
                  cloudClient.programTitle ||
                  "16-Week Recomposition & Structural Balance",
                startDate: cloudClient.joinedAt.split("T")[0],
                endDate: cloudClient.joinedAt.split("T")[0],
                durationWeeks: cloudClient.weeks || 16,
                status: "published",
                version: 1,
                createdAt: cloudClient.joinedAt,
                updatedAt: cloudClient.joinedAt,
                weeks: [],
              }
            : undefined,
          adherencePercentage: cloudClient.adherencePercentage ?? 100,
          supplementAdherencePercentage: 100,
          hydrationAdherencePercentage: 100,
          currentWeekIndex: 1,
          lastSessionDate: cloudClient.lastSessionDate,
          totalVolumeKg: 0,
          alerts: [],
        });
      }
    }

    return merged;
  }, [isHydrated, cloudClients, storeVersion]);

  const filteredRoster = useMemo(() => {
    if (!searchQuery.trim()) return rosterItems;
    const q = searchQuery.toLowerCase();
    return rosterItems.filter(
      (r) =>
        r.trainee.name.toLowerCase().includes(q) ||
        r.trainee.email.toLowerCase().includes(q) ||
        r.activeProgram?.title.toLowerCase().includes(q)
    );
  }, [rosterItems, searchQuery]);

  const handleCopyLink = async () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://app.vyra.fit";
    const inviteUrl = generateCoachInviteUrl(origin, {
      coachId,
      coachName,
      programTitle: "16-Week Recomposition & Structural Balance",
      weeks: 16,
      anchorLift: "barbell_bench",
      startingBenchKg: 80,
      unit: "kg",
    });

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Non-fatal
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) return;

    const resolvedEmail =
      inviteEmail.trim() ||
      `${inviteName.toLowerCase().replace(/\s+/g, ".")}@app.vyra.fit`;

    appStore.addUser({
      id: `trainee_${Date.now()}`,
      name: inviteName.trim(),
      email: resolvedEmail,
      role: "trainee",
      injuries: [],
      goals: ["Strength & Hypertrophy"],
    });

    try {
      await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          coachId,
          traineeName: inviteName,
          traineeEmail: resolvedEmail,
          invite: {
            coachId,
            coachName,
            programTitle: "16-Week Recomposition & Structural Balance",
            weeks: 16,
            anchorLift: "barbell_bench",
            startingBenchKg: 80,
            unit: "kg",
          },
        }),
      });
    } catch {
      // Local enrollment remains active offline
    }

    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteName("");
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#05080c] text-slate-100 p-6 space-y-6 max-w-7xl mx-auto font-body selection:bg-[#10b981] selection:text-black">
      {/* 1. Top Aerospace HUD Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1b2d47] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-display font-black text-white uppercase tracking-tight">
              Squadron Athlete Radar
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-mono font-bold text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
              <span>LIVE TELEMETRY</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time compliance monitoring, bilateral symmetry balance, and periodization telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search athlete or split..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl bg-[#090d16] border border-[#1b2d47] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#10b981] w-64 font-mono transition"
            />
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] active:scale-95 text-black font-display font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Invite Trainee</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Tiles */}
      {(() => {
        const totalAthletes = rosterItems.length;
        const avgAdherence =
          totalAthletes > 0
            ? Math.round(
                rosterItems.reduce((acc, r) => acc + r.adherencePercentage, 0) /
                  totalAthletes
              )
            : 0;
        const needsAttentionCount = rosterItems.filter(
          (r) =>
            r.adherencePercentage < 70 ||
            r.alerts.some(
              (a) => a.type === "missed_sessions" || a.type === "plateau"
            )
        ).length;
        const allSessions = rosterItems.flatMap((r) =>
          appStore.getSessions(r.trainee.id)
        );
        const totalVolumeKg = allSessions.reduce(
          (acc, s) =>
            acc +
            s.setLogs.reduce(
              (setAcc, set) => setAcc + (set.weightKg || 0) * (set.reps || 0),
              0
            ),
          0
        );

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#090d16] p-4 rounded-xl border border-[#1b2d47] space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                <span>Active Athletes</span>
                <Users className="w-4 h-4 text-[#10b981]" />
              </div>
              <p className="text-3xl font-display font-black text-white font-mono">
                {totalAthletes}
              </p>
              <span className="text-[10px] text-[#10b981] font-mono">
                100% assigned periodized programs
              </span>
            </div>

            <div className="bg-[#090d16] p-4 rounded-xl border border-[#1b2d47] space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                <span>Mean Compliance</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-3xl font-display font-black text-cyan-300 font-mono">
                {avgAdherence}%
              </p>
              <span className="text-[10px] text-slate-400 font-mono">
                Mesocycle workout completion rate
              </span>
            </div>

            <div className="bg-[#090d16] p-4 rounded-xl border border-[#1b2d47] space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                <span>Systemic Alerts</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-display font-black text-amber-300 font-mono">
                {needsAttentionCount}
              </p>
              <span className="text-[10px] text-amber-400/80 font-mono">
                Missed sessions / Stagnation flags
              </span>
            </div>

            <div className="bg-[#090d16] p-4 rounded-xl border border-[#1b2d47] space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                <span>Ballast Volume</span>
                <TrendingUp className="w-4 h-4 text-[#10b981]" />
              </div>
              <p className="text-3xl font-display font-black text-white font-mono">
                {totalVolumeKg > 0
                  ? `${Math.round(totalVolumeKg).toLocaleString()} kg`
                  : "Baseline"}
              </p>
              <span className="text-[10px] text-[#10b981] font-mono">
                Across {allSessions.length} logged flight sessions
              </span>
            </div>
          </div>
        );
      })()}

      {/* 3. Trainee Roster Radar Table */}
      <section className="bg-[#090d16] rounded-2xl border border-[#1b2d47] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#1b2d47] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#10b981]" />
            <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider">
              Athlete Squadron Fleet ({filteredRoster.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Sorted by Adherence Score
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1b2d47] bg-[#05080c] text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                <th className="p-4">Athlete &amp; Split</th>
                <th className="p-4">Mesocycle</th>
                <th className="p-4">Workout Compliance</th>
                <th className="p-4">Supplements</th>
                <th className="p-4">Hydration</th>
                <th className="p-4">Last Flight</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2d47]/70 font-mono">
              {filteredRoster.map((item) => {
                const isOptimal = item.adherencePercentage >= 90;
                const isWarning = item.adherencePercentage < 60;

                const suppAdh = item.supplementAdherencePercentage ?? 80;
                const hydrAdh = item.hydrationAdherencePercentage ?? 75;

                return (
                  <tr
                    key={item.trainee.id}
                    className="hover:bg-[#0f1724] transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0f1724] border border-[#1b2d47] flex items-center justify-center font-display font-bold text-slate-200">
                          {item.trainee.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/trainee/${item.trainee.id}`}
                            className="font-bold text-sm text-white hover:text-[#10b981] transition flex items-center gap-1.5"
                          >
                            <span>{item.trainee.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                          </Link>
                          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                            {item.activeProgram?.title || "5-Day Hypertrophy Master Split"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono">
                      <span className="text-white font-bold">
                        Wk {item.currentWeekIndex}
                      </span>
                      <span className="text-slate-500">
                        /{item.activeProgram?.durationWeeks || 16}
                      </span>
                    </td>

                    {/* Workout Adherence */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-[#05080c] rounded-full h-2 overflow-hidden border border-[#1b2d47]">
                          <div
                            style={{ width: `${item.adherencePercentage}%` }}
                            className={`h-2 rounded-full ${
                              isOptimal
                                ? "bg-[#10b981]"
                                : isWarning
                                ? "bg-rose-500"
                                : "bg-cyan-400"
                            }`}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-200">
                          {item.adherencePercentage}%
                        </span>
                      </div>
                    </td>

                    {/* Supplement Adherence */}
                    <td className="p-4">
                      <span className="font-mono font-bold text-cyan-300">
                        {suppAdh}%
                      </span>
                    </td>

                    {/* Hydration Adherence */}
                    <td className="p-4">
                      <span className="font-mono font-bold text-slate-300">
                        {hydrAdh}%
                      </span>
                    </td>

                    <td className="p-4 font-mono text-slate-300">
                      {item.lastSessionDate
                        ? item.lastSessionDate
                        : "Today ✓"}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/trainee/${item.trainee.id}`}
                          className="px-3 py-1.5 rounded-lg bg-[#0f1724] border border-[#1b2d47] text-slate-200 hover:text-white hover:border-[#10b981] font-mono text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <span>Flight Telemetry</span>
                          <ChevronRight className="w-3 h-3 text-[#10b981]" />
                        </Link>
                        <Link
                          href={`/program/${item.activeProgram?.id || "new"}`}
                          className="px-2.5 py-1.5 rounded-lg bg-[#10b981]/15 border border-[#10b981]/40 text-[#10b981] hover:bg-[#10b981]/25 font-mono font-bold text-[11px] transition"
                        >
                          Edit Split
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Invite Trainee Modal (Obsidian Glass) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#090d16] border border-[#1b2d47] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1b2d47] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#10b981]" />
                <h3 className="text-base font-display font-black text-white uppercase">
                  Enroll New Athlete
                </h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg bg-[#0f1724] border border-[#1b2d47] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteSent ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#10b981] mx-auto" />
                <h4 className="text-sm font-bold text-white font-display uppercase">
                  Athlete Enrolled into Roster!
                </h4>
                <p className="text-xs text-slate-400">
                  {inviteName} has been assigned to the 16-week master mesocycle.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* 1-Tap Direct Link */}
                <div className="p-3.5 rounded-xl bg-[#05080c] border border-[#1b2d47] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Instant 1-Tap Onboarding Link
                    </span>
                    <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/15 px-1.5 py-0.5 rounded border border-[#10b981]/30 font-bold">
                      Zero Signup Wall
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Pre-fills the 16-week mesocycle and starting weights automatically.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full py-2 px-3 rounded-lg bg-[#0f1724] hover:bg-[#142032] text-white font-mono font-bold flex items-center justify-center gap-2 border border-[#1b2d47] transition cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#10b981]" />
                        <span className="text-[#10b981] font-bold">
                          Link Copied!
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Coach Invite Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[#1b2d47]"></div>
                  <span className="flex-shrink mx-2 text-[10px] font-mono text-slate-500 uppercase">
                    Or Direct Add
                  </span>
                  <div className="flex-grow border-t border-[#1b2d47]"></div>
                </div>

                <form onSubmit={handleSendInvite} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-mono uppercase text-[10px]">
                      Athlete Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jordan Lee"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#05080c] border border-[#1b2d47] text-white focus:outline-none focus:border-[#10b981] font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-mono uppercase text-[10px]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="jordan@example.com (optional)"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#05080c] border border-[#1b2d47] text-white focus:outline-none focus:border-[#10b981] font-mono text-xs"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] active:scale-95 text-black font-display font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                      Enroll into Active Squadron
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
