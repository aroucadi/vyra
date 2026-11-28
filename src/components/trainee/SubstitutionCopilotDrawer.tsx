"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { RagExercise } from "@/types/exercise-rag";
import { SubstitutionCandidate } from "@/lib/training-math/substitution-copilot";
import {
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  Video,
  X,
  Dumbbell,
  Check,
  Eye,
  Activity,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import { resolveExerciseVideoUrl, getOpenGymClipUrl, getOpenGymStillUrl } from "@/lib/utils";
import { soundService } from "@/lib/in-gym/sound";
import { ExerciseVideoModal } from "@/components/trainee/ExerciseVideoModal";
import { haptics } from "@/lib/haptics";

interface SubstitutionCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentExercise: {
    id?: string;
    name: string;
    target: string;
    equipment: string;
    bodyPart?: string;
  } | null;
  onApplySubstitute: (candidate: RagExercise) => void;
}

export function SubstitutionCopilotDrawer({
  isOpen,
  onClose,
  currentExercise,
  onApplySubstitute,
}: SubstitutionCopilotDrawerProps) {
  const [candidates, setCandidates] = useState<SubstitutionCandidate[]>([]);
  const [ragEvidence, setRagEvidence] = useState<any>(null);
  const [showEvidenceCockpit, setShowEvidenceCockpit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<
    "all" | "machine" | "dumbbell" | "cable" | "barbell" | "body weight"
  >("all");
  const [previewVideoExercise, setPreviewVideoExercise] = useState<RagExercise | null>(null);

  useEffect(() => {
    if (!currentExercise || !isOpen) return;

    let active = true;
    const fetchSubs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("name", currentExercise.name);
        params.set("target", currentExercise.target);
        params.set("equipment", currentExercise.equipment);
        params.set("limit", "6");

        if (equipmentFilter !== "all") {
          params.set("preferred", equipmentFilter);
        }

        const res = await fetch(`/api/substitutions?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load substitutions");
        const data = await res.json();

        if (active) {
          if (data.substitutes) setCandidates(data.substitutes);
          if (data.ragEvidence) setRagEvidence(data.ragEvidence);
        }
      } catch {
        // fail silently
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSubs();
    return () => {
      active = false;
    };
  }, [
    currentExercise?.name,
    currentExercise?.target,
    currentExercise?.equipment,
    equipmentFilter,
    isOpen,
  ]);

  if (!currentExercise) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-w-md mx-auto rounded-t-3xl bg-[#05080c] border-[#1b2d47] p-5 space-y-4 max-h-[88vh] overflow-y-auto font-body shadow-2xl text-slate-100"
      >
        {/* 1. Header (Eyebrow + Title) */}
        <SheetHeader className="text-left space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#10b981]" />
                <span>Station Copilot</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0f1724] text-slate-300 border border-[#1b2d47]">
                {currentExercise.equipment}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-[#0f1724] border border-[#1b2d47] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <SheetTitle className="text-lg font-display font-black text-white uppercase tracking-tight pt-1">
            Swap {currentExercise.name}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-400 font-body">
            Station occupied or unavailable? Choose a biomechanically equivalent replacement targeting the exact same motor recruitment.
          </SheetDescription>
        </SheetHeader>

        {/* 2. Quick Equipment Availability Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: "all", label: "All Available" },
            { id: "cable", label: "2:1 Cable Stack" },
            { id: "machine", label: "Machine / Lever" },
            { id: "dumbbell", label: "Dumbbell" },
            { id: "barbell", label: "Barbell Rig" },
            { id: "body weight", label: "Bodyweight" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setEquipmentFilter(f.id as typeof equipmentFilter)}
              className={clsx(
                "min-h-[34px] px-3 rounded-lg text-[11px] font-mono uppercase tracking-wider whitespace-nowrap transition border cursor-pointer",
                equipmentFilter === f.id
                  ? "bg-[#10b981] text-black font-black border-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  : "bg-[#0f1724] border-[#1b2d47] text-slate-400 hover:text-white hover:border-slate-600"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 2.5 Agentic Multimodal RAG Evidence Cockpit */}
        {ragEvidence && (
          <div className="rounded-xl border border-[#10b981]/30 bg-[#08121a] p-3 text-xs space-y-2">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowEvidenceCockpit(!showEvidenceCockpit)}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#10b981]">
                <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Multimodal RAG Grounding (6 Corpora)</span>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] font-mono"
              >
                <span>{showEvidenceCockpit ? "Hide Radar" : "View Radar"}</span>
                {showEvidenceCockpit ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Quick Summary Chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="px-2 py-0.5 rounded-md bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-[10px] font-mono flex items-center gap-1">
                <Eye className="w-3 h-3 text-[#10b981]" />
                <span>Station: {ragEvidence.gymVision?.gymName || "Verified"} (Max {ragEvidence.gymVision?.maxDumbbellWeightKg || 40}kg DB)</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span>Logs: 1RM {ragEvidence.workoutLogs?.bestEstimated1RmKg || 0}kg ({ragEvidence.workoutLogs?.performanceTrend || "active"})</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-400" />
                <span>Recovery: {ragEvidence.telemetry?.readinessScore || 82}% ({ragEvidence.telemetry?.readinessState || "optimal"})</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3 text-purple-400" />
                <span>Meso: Wk {ragEvidence.mesocycle?.currentWeekNumber || 3} ({ragEvidence.mesocycle?.activePhase || "hypertrophy"})</span>
              </span>
            </div>

            {/* Expanded Multi-Corpus Detail Grid */}
            {showEvidenceCockpit && (
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 gap-2 text-[11px] font-mono text-slate-300">
                <div className="bg-[#05080c] p-2 rounded-lg border border-slate-800">
                  <span className="text-[#10b981] font-bold block mb-0.5">1. Gym Equipment Vision:</span>
                  <span>Available: {ragEvidence.gymVision?.confirmedApparatus?.join(', ')}. Specialty: {ragEvidence.gymVision?.detectedStations?.slice(0, 2).join(' • ')}.</span>
                </div>
                <div className="bg-[#05080c] p-2 rounded-lg border border-slate-800">
                  <span className="text-cyan-400 font-bold block mb-0.5">2. Workout Performance Logs:</span>
                  <span>Logged Sessions: {ragEvidence.workoutLogs?.totalSessionsLogged}. Historical Best 1RM: {ragEvidence.workoutLogs?.bestEstimated1RmKg}kg.</span>
                </div>
                <div className="bg-[#05080c] p-2 rounded-lg border border-slate-800">
                  <span className="text-amber-400 font-bold block mb-0.5">3. Recovery & Readiness Telemetry:</span>
                  <span>Readiness: {ragEvidence.telemetry?.readinessScore}/100. Sleep: {ragEvidence.telemetry?.sleepHours}h. Systemic Fatigue: {ragEvidence.telemetry?.systemicFatigue}.</span>
                </div>
                <div className="bg-[#05080c] p-2 rounded-lg border border-slate-800">
                  <span className="text-purple-400 font-bold block mb-0.5">4. Physique & Posture Vision:</span>
                  <span>Priorities: {ragEvidence.physiqueVision?.priorityDevelopmentAreas?.join(' • ') || 'Optimal structural alignment'}.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Ranked Alternatives List */}
        <div className="space-y-3 pt-1">
          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-[#10b981] animate-pulse">
              Computing optimal motor vector matches...
            </div>
          ) : candidates.length > 0 ? (
            candidates.map((cand, idx) => {
              const videoUrl = resolveExerciseVideoUrl(cand.exercise.name, {
                id: cand.exercise.id,
                clipUrl: cand.exercise.clipUrl,
                explicitVideoUrl: cand.exercise.videoUrl,
              });

              return (
                <div
                  key={cand.exercise.id || idx}
                  className="p-4 bg-[#090d16] border border-[#1b2d47] rounded-xl space-y-3 shadow-lg hover:border-[#10b981]/50 transition"
                >
                  {/* Top Badges: Match % + Tension Profile + Apparatus */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40">
                        {Math.round(cand.similarityScore * 100)}% Match
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        {cand.resistanceProfile} Tension
                      </span>
                      {cand.exercise.apparatusGroup && (
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#10b981]/10 text-emerald-300 border border-[#10b981]/30">
                          {cand.exercise.apparatusGroup.replace('_', ' ')}
                        </span>
                      )}
                      {cand.exercise.axialLoading && cand.exercise.axialLoading !== 'none' && (
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          Axial: {cand.exercise.axialLoading}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {cand.exercise.equipment}
                    </span>
                  </div>

                  {/* Candidate Name & Target */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-display font-bold text-white tracking-wide uppercase">
                        {cand.exercise.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Target:{" "}
                        <span className="text-[#10b981] font-semibold">
                          {cand.exercise.target}
                        </span>{" "}
                        · Division:{" "}
                        <span className="text-slate-300">
                          {cand.subdivision.replace("_", " ")}
                        </span>
                      </p>
                    </div>

                    {videoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewVideoExercise({
                            ...cand.exercise,
                            id: cand.exercise.id,
                            name: cand.exercise.name,
                            clipUrl:
                              cand.exercise.clipUrl ||
                              (cand.exercise.id
                                ? getOpenGymClipUrl(cand.exercise.id)
                                : undefined),
                            imageUrl:
                              cand.exercise.imageUrl ||
                              (cand.exercise.id
                                ? getOpenGymStillUrl(cand.exercise.id)
                                : undefined),
                            videoUrl,
                          })
                        }
                        className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[10px] font-mono font-bold hover:bg-cyan-500/30 shrink-0 cursor-pointer transition active:scale-95"
                        title="Preview form video demonstration"
                      >
                        <Video className="w-3 h-3" />
                        <span>VIDEO</span>
                      </button>
                    )}
                  </div>

                  {/* Coach Rationale */}
                  <div className="p-2.5 rounded-lg bg-[#05080c] border border-[#1b2d47]/80 space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#10b981]">
                      <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
                      <span>Biomechanical Rationale</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-200">
                      {cand.biomechanicalRationale}
                    </p>
                    {cand.setupAdjustmentCue && (
                      <p className="text-[10px] leading-relaxed text-slate-400 pt-1 border-t border-[#1b2d47]/60 mt-1">
                        <span className="text-cyan-400 font-semibold">
                          Setup Tip:{" "}
                        </span>
                        {cand.setupAdjustmentCue}
                      </p>
                    )}
                  </div>

                  {/* 1-Tap Swap CTA */}
                  {(() => {
                    const candidateKey = cand.exercise.id || cand.exercise.name;
                    const isThisSwapping = swappingId === candidateKey;
                    return (
                      <button
                        type="button"
                        disabled={Boolean(swappingId)}
                        onClick={() => {
                          if (swappingId) return;
                          haptics.heavy();
                          soundService.playTargetHitFeedback(true);
                          setSwappingId(candidateKey);
                          setTimeout(() => {
                            onApplySubstitute(cand.exercise);
                            onClose();
                            setSwappingId(null);
                          }, 150);
                        }}
                        className={clsx(
                          "w-full h-10 font-display uppercase tracking-wider font-black text-xs rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.3)] transition flex items-center justify-center gap-2 select-none",
                          isThisSwapping
                            ? "bg-[#059669] text-white cursor-wait"
                            : Boolean(swappingId)
                            ? "bg-[#10b981]/50 text-black/50 cursor-not-allowed"
                            : "bg-[#10b981] hover:bg-[#059669] active:scale-[0.98] text-black cursor-pointer"
                        )}
                      >
                        {isThisSwapping ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Station Swapped ✓</span>
                          </>
                        ) : (
                          <>
                            <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
                            <span>Swap Station &amp; Continue Workout</span>
                          </>
                        )}
                      </button>
                    );
                  })()}
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 bg-[#090d16] rounded-xl border border-[#1b2d47]">
              No direct substitutes found matching the filter criteria.
            </div>
          )}
        </div>

        {/* Secondary Dismiss Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 bg-[#0f1724] hover:bg-[#1b2d47] text-slate-300 font-display uppercase tracking-wider font-bold text-xs rounded-xl border border-[#1b2d47] transition cursor-pointer"
          >
            Cancel & Keep Current Exercise
          </button>
        </div>

        {/* Inline Demonstration Video Modal */}
        <ExerciseVideoModal
          isOpen={Boolean(previewVideoExercise)}
          onClose={() => setPreviewVideoExercise(null)}
          exercise={previewVideoExercise}
        />
      </SheetContent>
    </Sheet>
  );
}
