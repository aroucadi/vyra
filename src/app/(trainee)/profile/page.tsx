"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRightLeft, Camera } from "lucide-react";
import { appStore } from "@/lib/store";
import { switchUserAction } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const currentUser = appStore.getCurrentUser();

  const program = appStore.getActiveProgramForTrainee(currentUser.id);
  const trainerId = program?.trainerId || appStore.getTrainers()[0]?.id || "";
  const coach = trainerId ? appStore.getUser(trainerId) : undefined;

  const [aiConsent, setAiConsent] = useState(true);
  const faceCropEnforced = true;

  const handleSwitchToTrainer = async () => {
    await switchUserAction(trainerId);
    router.push("/roster");
    router.refresh();
  };

  return (
    <div className="px-4 py-5 space-y-5 pb-24">
      <header className="flex items-center gap-3 border-b border-[#1E293B] pb-4">
        <div className="w-14 h-14 rounded-full bg-[#162032] border-2 border-[#10B981] flex items-center justify-center font-bold text-lg text-white">
          {currentUser.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-black text-white">{currentUser.name}</h1>
          <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] text-[10px] font-bold uppercase">
            Trainee Account
          </span>
        </div>
      </header>

      {/* Bio Details */}
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-4 space-y-3">
        <h2 className="text-sm font-bold text-white">Physical Profile</h2>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-[#0F172A] p-2.5 rounded-lg border border-[#1E293B]">
            <span className="text-slate-400 text-[10px] uppercase">Height</span>
            <p className="text-sm font-bold text-white mt-0.5">{currentUser.heightCm || 173} cm</p>
          </div>
          <div className="bg-[#0F172A] p-2.5 rounded-lg border border-[#1E293B]">
            <span className="text-slate-400 text-[10px] uppercase">Sex / DOB</span>
            <p className="text-sm font-bold text-white mt-0.5">
              {currentUser.sex ? currentUser.sex.charAt(0).toUpperCase() + currentUser.sex.slice(1) : "Male"} •{" "}
              {currentUser.dob ? currentUser.dob : "1989"}
            </p>
          </div>
        </div>
      </section>

      {/* Injury Notes & Precautions */}
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-4 space-y-2">
        <div className="flex items-center gap-2 text-[#F59E0B]">
          <AlertTriangle className="w-4 h-4" />
          <h2 className="text-sm font-bold">Injury Notes & Movement Modifications</h2>
        </div>
        <div className="bg-[#0F172A] p-3 rounded-lg border border-[#F59E0B]/30 text-xs text-slate-300">
          {currentUser.injuries && currentUser.injuries.length > 0
            ? currentUser.injuries.join(" • ")
            : "No active injuries reported. Full ROM cleared."}
        </div>
      </section>

      {/* Responsible AI & Privacy Consent Guardrails (Constitution Principle IV) */}
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-4 space-y-3">
        <div className="flex items-center gap-2 text-[#06B6D4]">
          <Camera className="w-4 h-4" />
          <h2 className="text-sm font-bold">Privacy & AI Analysis Consent</h2>
        </div>
        <p className="text-xs text-slate-400">
          NewME guarantees privacy guardrails: client-side face cropping before upload and strict 18+ age gating.
        </p>

        <div className="space-y-2 text-xs">
          <label className="flex items-center justify-between p-2 rounded-lg bg-[#0F172A] border border-[#1E293B] cursor-pointer">
            <span className="text-slate-300">Opt-in to Gemini physique analysis</span>
            <input
              type="checkbox"
              checked={aiConsent}
              onChange={(e) => setAiConsent(e.target.checked)}
              className="accent-[#10B981] w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg bg-[#0F172A] border border-[#1E293B] cursor-pointer">
            <span className="text-slate-300">Mandatory client-side face cropping</span>
            <input
              type="checkbox"
              checked={faceCropEnforced}
              disabled
              className="accent-[#10B981] w-4 h-4"
            />
          </label>
        </div>
      </section>

      {/* Coach Portal Link */}
      <div className="pt-2">
        <button
          onClick={handleSwitchToTrainer}
          className="w-full py-3 px-4 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
        >
          <ArrowRightLeft className="w-4 h-4 text-[#8B5CF6]" />
          Switch to {coach?.name ? `${coach.name} Console` : "Coach Console"}
        </button>
      </div>
    </div>
  );
}
