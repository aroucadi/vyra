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
  ArrowRight,
  Shield,
  CheckCircle2,
  X,
  Dumbbell,
  ExternalLink,
} from "lucide-react";
import { appStore } from "@/lib/store";
import { TraineeRosterItem } from "@/lib/types";

export default function TrainerRosterPage() {
  const rosterItems = appStore.getRoster();
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  const filteredRoster = rosterItems.filter((item) =>
    item.trainee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.activeProgram?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteName("");
    }, 2000);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Athletes</span>
            <Users className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-2xl font-black text-white font-mono">24</p>
          <span className="text-[10px] text-[#10B981] font-mono">100% assigned periodized programs</span>
        </div>

        <div className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>7-Day Adherence</span>
            <Activity className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <p className="text-2xl font-black text-white font-mono">88.4%</p>
          <span className="text-[10px] text-slate-400 font-mono">+3.2% vs previous microcycle</span>
        </div>

        <div className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Needs Attention</span>
            <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <p className="text-2xl font-black text-white font-mono">3</p>
          <span className="text-[10px] text-[#F59E0B] font-mono">Missed sessions / Plateau flags</span>
        </div>

        <div className="bg-[#162032] p-4 rounded-xl border border-[#1E293B] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Volume (7d)</span>
            <TrendingUp className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <p className="text-2xl font-black text-white font-mono">142,500 kg</p>
          <span className="text-[10px] text-[#8B5CF6] font-mono">Across 86 logged sessions</span>
        </div>
      </div>

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
                <th className="p-3.5">Cycle Timeline</th>
                <th className="p-3.5">14-Day Adherence</th>
                <th className="p-3.5">Last Logged Session</th>
                <th className="p-3.5">Algorithmic Alert</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {filteredRoster.map((item) => {
                const isOptimal = item.adherencePercentage >= 90;
                const isWarning = item.adherencePercentage < 60;

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
                        Week {item.currentWeekIndex}
                      </span>
                      <span className="text-slate-500"> of {item.activeProgram?.durationWeeks || 4}</span>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-[#0F172A] rounded-full h-2 overflow-hidden border border-[#1E293B]">
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
                <h4 className="text-sm font-bold text-white">Invitation Dispatched!</h4>
                <p className="text-xs text-slate-400">
                  Onboarding link generated and emailed to {inviteEmail}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-3 text-xs">
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
                    required
                    placeholder="jordan@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white focus:outline-none focus:border-[#10B981]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-slate-950 font-black text-xs uppercase tracking-wider transition"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
