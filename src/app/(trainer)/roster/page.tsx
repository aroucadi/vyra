"use client";

import { useState } from "react";
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
} from "lucide-react";
import { appStore } from "@/lib/store";
import { generateCoachInviteUrl } from "@/lib/trainer-invite";

export default function TrainerRosterPage() {
  const rosterItems = appStore.getRoster();
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const filteredRoster = rosterItems.filter((item) =>
    item.trainee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.activeProgram && item.activeProgram.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const currentUser = appStore.getCurrentUser();
  const coachId = currentUser.role === "trainer" || currentUser.role === "both" ? currentUser.id : "coach_1";
  const coachName = currentUser.name || "Coach Julian";

  const inviteUrl = typeof window !== "undefined"
    ? generateCoachInviteUrl(window.location.origin, {
        coachId,
        coachName,
        programTitle: "16-Week Recomposition & Structural Balance",
        weeks: 16,
        anchorLift: "barbell_bench",
        startingBenchKg: 80,
        unit: "kg",
      })
    : `/invite/${coachId}`;

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName) return;

    // Create trainee in appStore
    const newTraineeId = `trainee_${Date.now()}`;
    appStore.addUser({
      id: newTraineeId,
      name: inviteName,
      email: inviteEmail || `${inviteName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      role: "trainee",
      injuries: [],
      goals: ["Strength & Hypertrophy"],
    });

    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteName("");
    }, 2500);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight">Athlete & Client Roster</h1>
            <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-mono font-bold text-xs">
              Live Overview
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time compliance monitoring, periodization schedules, and algorithmic alert flags.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search athlete or program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-lg bg-[#162032] border border-[#334155] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#10B981] w-64"
            />
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Invite Trainee
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      {(() => {
        const totalAthletes = rosterItems.length;
        const avgAdherence = totalAthletes > 0
          ? Math.round(rosterItems.reduce((acc, r) => acc + r.adherencePercentage, 0) / totalAthletes)
          : 0;
        const needsAttentionCount = rosterItems.filter(
          (r) => r.adherencePercentage < 70 || r.alerts.some((a) => a.type === "missed_sessions" || a.type === "plateau")
        ).length;
        const allSessions = rosterItems.flatMap((r) => appStore.getSessions(r.trainee.id));
        const totalVolumeKg = allSessions.reduce(
          (acc, s) => acc + s.setLogs.reduce((setAcc, set) => setAcc + set.weightKg * set.reps, 0),
          0
        );

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Active Athletes</span>
                <Users className="w-4 h-4 text-[#10B981]" />
              </div>
              <p className="text-2xl font-black text-white font-mono">{totalAthletes}</p>
              <span className="text-[10px] text-[#10B981] font-mono">100% assigned periodized programs</span>
            </div>

            <div className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Avg Adherence</span>
                <Activity className="w-4 h-4 text-[#06B6D4]" />
              </div>
              <p className="text-2xl font-black text-white font-mono">{avgAdherence}%</p>
              <span className="text-[10px] text-slate-400 font-mono">Workout compliance average</span>
            </div>

            <div className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Needs Attention</span>
                <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <p className="text-2xl font-black text-white font-mono">{needsAttentionCount}</p>
              <span className="text-[10px] text-[#F59E0B] font-mono">Missed sessions / Compliance flags</span>
            </div>

            <div className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Logged Volume</span>
                <TrendingUp className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <p className="text-2xl font-black text-white font-mono">
                {totalVolumeKg > 0 ? `${Math.round(totalVolumeKg).toLocaleString()} kg` : "Baseline"}
              </p>
              <span className="text-[10px] text-[#8B5CF6] font-mono">Across {allSessions.length} logged sessions</span>
            </div>
          </div>
        );
      })()}

      {/* 3. Trainee Roster Table */}
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Roster Status ({filteredRoster.length})
          </h2>
          <span className="text-xs text-slate-400 font-mono">Sorted by Adherence Score</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#0F172A]/70 text-slate-400 font-mono">
                <th className="p-3.5">Athlete & Program</th>
                <th className="p-3.5">Cycle</th>
                <th className="p-3.5">Workout Adh.</th>
                <th className="p-3.5">Supplement Adh.</th>
                <th className="p-3.5">Hydration Adh.</th>
                <th className="p-3.5">Last Session</th>
                <th className="p-3.5">Algorithmic Alert</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {filteredRoster.map((item) => {
                const isOptimal = item.adherencePercentage >= 90;
                const isWarning = item.adherencePercentage < 60;

                const suppAdh = item.supplementAdherencePercentage ?? 80;
                const isSuppOptimal = suppAdh >= 85;
                const isSuppWarning = suppAdh < 70;

                const hydrAdh = item.hydrationAdherencePercentage ?? 75;
                const isHydrOptimal = hydrAdh >= 85;
                const isHydrWarning = hydrAdh < 60;

                return (
                  <tr key={item.trainee.id} className="hover:bg-[#131C2E] transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0F172A] border border-[#334155] flex items-center justify-center font-bold text-slate-200">
                          {item.trainee.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/trainee/${item.trainee.id}`}
                            className="font-bold text-sm text-slate-100 hover:text-[#10B981] transition"
                          >
                            {item.trainee.name}
                          </Link>
                          <p className="text-[11px] text-slate-400">
                            {item.activeProgram?.title || "No active program"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className="text-slate-200 font-semibold">
                        Wk {item.currentWeekIndex}
                      </span>
                      <span className="text-slate-500">/{item.activeProgram?.durationWeeks || 4}</span>
                    </td>

                    {/* Workout Adherence */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-[#0F172A] rounded-full h-2 overflow-hidden border border-[#1E293B]">
                          <div
                            style={{ width: `${item.adherencePercentage}%` }}
                            className={`h-2 rounded-full ${
                              isOptimal ? "bg-[#10B981]" : isWarning ? "bg-[#EF4444]" : "bg-[#06B6D4]"
                            }`}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-200">
                          {item.adherencePercentage}%
                        </span>
                      </div>
                    </td>

                    {/* Supplement Adherence */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-[#0F172A] rounded-full h-2 overflow-hidden border border-[#1E293B]">
                          <div
                            style={{ width: `${suppAdh}%` }}
                            className={`h-2 rounded-full ${
                              isSuppOptimal ? "bg-[#10B981]" : isSuppWarning ? "bg-[#EF4444]" : "bg-[#06B6D4]"
                            }`}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-200">
                          {suppAdh}%
                        </span>
                      </div>
                    </td>

                    {/* Hydration Adherence */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-[#0F172A] rounded-full h-2 overflow-hidden border border-[#1E293B]">
                          <div
                            style={{ width: `${hydrAdh}%` }}
                            className={`h-2 rounded-full ${
                              isHydrOptimal ? "bg-[#10B981]" : isHydrWarning ? "bg-[#EF4444]" : "bg-[#06B6D4]"
                            }`}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-200">
                          {hydrAdh}%
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-300">
                      {item.lastSessionDate ? item.lastSessionDate : "Pending first log"}
                    </td>

                    <td className="p-3.5">
                      {item.alerts.map((alert, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            alert.type === "optimal"
                              ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                              : alert.type === "missed_sessions"
                              ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30"
                              : "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30"
                          }`}
                        >
                          {alert.type === "missed_sessions" && <AlertTriangle className="w-3 h-3" />}
                          {alert.message}
                        </span>
                      ))}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/trainee/${item.trainee.id}`}
                          className="px-2.5 py-1 rounded bg-[#0F172A] border border-[#334155] text-slate-300 hover:text-white hover:border-slate-500 font-medium text-[11px] transition"
                        >
                          View Logs
                        </Link>
                        <Link
                          href={`/program/${item.activeProgram?.id || "new"}`}
                          className="px-2.5 py-1 rounded bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] hover:bg-[#10B981]/30 font-bold text-[11px] transition"
                        >
                          Edit Program
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

      {/* 4. Invite Trainee Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#162032] border border-[#334155] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#10B981]" />
                <h3 className="text-base font-black text-white">Invite New Athlete</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg bg-[#0F172A] border border-[#1E293B] text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteSent ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto" />
                <h4 className="text-sm font-bold text-white">Athlete Added to Roster!</h4>
                <p className="text-xs text-slate-400">
                  {inviteName} has been enrolled in the 16-week mesocycle.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* 1-Tap Direct Link (Spec 023) */}
                <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Instant 1-Tap Onboarding Link
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Zero Signup Wall
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Pre-fills your 16-week mesocycle and starting weights automatically.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-white font-medium flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Link Copied!</span>
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
                  <div className="flex-grow border-t border-[#1E293B]"></div>
                  <span className="flex-shrink mx-2 text-[10px] font-mono text-slate-500 uppercase">
                    Or Direct Add
                  </span>
                  <div className="flex-grow border-t border-[#1E293B]"></div>
                </div>

                <form onSubmit={handleSendInvite} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-mono uppercase text-[10px]">Athlete Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jordan Lee"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white focus:outline-none focus:border-[#10B981]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-mono uppercase text-[10px]">Email Address</label>
                    <input
                      type="email"
                      placeholder="jordan@example.com (optional)"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white focus:outline-none focus:border-[#10B981]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      Add to Roster & Enroll
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
