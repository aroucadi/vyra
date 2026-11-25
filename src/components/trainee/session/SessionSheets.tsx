"use client";

import React from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Camera,
  CheckCircle2,
  ExternalLink,
  Plus,
  Search,
  Share2,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SubstitutionCopilotDrawer } from "@/components/trainee/SubstitutionCopilotDrawer";
import { ExerciseVideoModal } from "@/components/trainee/ExerciseVideoModal";
import { shareEquipmentPhotoWithGemini } from "@/lib/share-equipment";
import { resolveExerciseVideoUrl } from "@/lib/utils";
import type { ActiveExercise } from "./types";
import type { Exercise } from "@/lib/types";

interface SwapTargetExercise {
  id?: string;
  name: string;
  target: string;
  equipment: string;
  bodyPart?: string;
}

interface SessionSheetsProps {
  activeEx: ActiveExercise;
  exercises: ActiveExercise[];
  currentExIndex: number;
  catalogue: Exercise[];
  userId: string;
  gymName?: string;
  isTipsOpen: boolean;
  setIsTipsOpen: (open: boolean) => void;
  isExitAlertOpen: boolean;
  setIsExitAlertOpen: (open: boolean) => void;
  isSwapDrawerOpen: boolean;
  setIsSwapDrawerOpen: (open: boolean) => void;
  swapTargetExercise: SwapTargetExercise | null;
  isReorderDrawerOpen: boolean;
  setIsReorderDrawerOpen: (open: boolean) => void;
  isWorkoutCompleteModalOpen: boolean;
  setIsWorkoutCompleteModalOpen: (open: boolean) => void;
  isAddExerciseSheetOpen: boolean;
  setIsAddExerciseSheetOpen: (open: boolean) => void;
  exerciseSearchQuery: string;
  setExerciseSearchQuery: (q: string) => void;
  selectedMuscleFilter: string;
  setSelectedMuscleFilter: (cat: string) => void;
  filteredCatalogueExercises: Exercise[];
  selectedFullPhoto: string | null;
  setSelectedFullPhoto: (photo: string | null) => void;
  onExitToToday: () => void;
  onApplySubstitute: (candidate: {
    name: string;
    instructions?: string[];
    equipment: string;
    target?: string;
    videoUrl?: string;
  }) => void;
  onFinishSession: () => void;
  onAddBonusSet: () => void;
  onAddExtraExercise: (picked: Exercise) => void;
  onMoveExerciseUp: (index: number) => void;
  onMoveExerciseDown: (index: number) => void;
  onJumpToExercise: (index: number) => void;
}

export function SessionSheets({
  activeEx,
  exercises,
  currentExIndex,
  catalogue,
  userId,
  gymName,
  isTipsOpen,
  setIsTipsOpen,
  isExitAlertOpen,
  setIsExitAlertOpen,
  isSwapDrawerOpen,
  setIsSwapDrawerOpen,
  swapTargetExercise,
  isReorderDrawerOpen,
  setIsReorderDrawerOpen,
  isWorkoutCompleteModalOpen,
  setIsWorkoutCompleteModalOpen,
  isAddExerciseSheetOpen,
  setIsAddExerciseSheetOpen,
  exerciseSearchQuery,
  setExerciseSearchQuery,
  selectedMuscleFilter,
  setSelectedMuscleFilter,
  filteredCatalogueExercises,
  selectedFullPhoto,
  setSelectedFullPhoto,
  onExitToToday,
  onApplySubstitute,
  onFinishSession,
  onAddBonusSet,
  onAddExtraExercise,
  onMoveExerciseUp,
  onMoveExerciseDown,
  onJumpToExercise,
}: SessionSheetsProps) {
  const [isVideoModalOpen, setIsVideoModalOpen] = React.useState(false);
  return (
    <>
      <Sheet open={isTipsOpen} onOpenChange={setIsTipsOpen}>
        <SheetContent
          side="bottom"
          className="max-w-md mx-auto rounded-t-3xl bg-[#090C11] border-[#1C2436] p-6 space-y-4 font-body shadow-2xl text-slate-100"
        >
          <SheetHeader className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>FORM &amp; CUES</span>
              </span>
            </div>
            <SheetTitle className="text-xl font-editorial font-bold text-white tracking-tight pt-1">
              {activeEx.name}
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400 font-body">
              Setup guide and biomechanical progression cues.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 pt-1 pb-4 text-xs">
            {activeEx.videoUrl && (
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#10b981] to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-display uppercase tracking-wider font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#10b981]/20 transition cursor-pointer active:scale-95"
              >
                <Video className="w-4 h-4 stroke-[2.5]" />
                <span>Watch Form Demonstration Video</span>
              </button>
            )}

            {activeEx.formCue && (
              <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-xl space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                  Form Cue &amp; Anchor
                </span>
                <p className="text-xs text-white font-medium leading-relaxed">
                  {activeEx.formCue}
                </p>
              </div>
            )}

            {activeEx.loadGuidance && (
              <div className="p-3.5 bg-[#111622] border border-[#1C2436] rounded-xl space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-sky-400 font-bold">
                  Overload Strategy
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeEx.loadGuidance}
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isExitAlertOpen} onOpenChange={setIsExitAlertOpen}>
        <SheetContent
          side="bottom"
          className="max-w-md mx-auto text-center space-y-4 rounded-t-3xl bg-[#090C11] border-[#1C2436] p-6 font-body text-slate-100 shadow-2xl"
        >
          <SheetHeader>
            <SheetTitle className="text-xl font-editorial font-bold text-white tracking-tight">
              Exit Active Workout?
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400 font-body">
              Your logged sets will be safely preserved in today&apos;s training
              log.
            </SheetDescription>
          </SheetHeader>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsExitAlertOpen(false)}
              className="flex-1 py-3.5 bg-[#111622] hover:bg-[#182030] text-slate-300 font-display uppercase tracking-wider font-bold text-xs rounded-xl border border-[#1C2436] transition cursor-pointer"
            >
              Keep Training
            </button>
            <button
              type="button"
              onClick={() => {
                setIsExitAlertOpen(false);
                onExitToToday();
              }}
              className="flex-1 py-3.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-display uppercase tracking-wider font-bold text-xs rounded-xl border border-rose-500/40 transition cursor-pointer"
            >
              Exit to Today
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isReorderDrawerOpen} onOpenChange={setIsReorderDrawerOpen}>
        <SheetContent
          side="bottom"
          className="max-w-md mx-auto max-h-[80vh] flex flex-col p-5 rounded-t-3xl bg-[#090C11] border-[#1C2436] font-body text-slate-100 shadow-2xl"
        >
          <SheetHeader className="pb-3 text-left">
            <SheetTitle className="text-xl font-editorial font-bold text-white flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-amber-400" />
              <span>Reorder or Jump Station</span>
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400 font-body">
              Jump directly to any open equipment station or adjust your lift
              sequence.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {exercises.map((ex, idx) => {
              const isCurrent = idx === currentExIndex;
              const isDone =
                ex.completedSets.length >= ex.targetSets || ex.skippedRemaining;
              return (
                <div
                  key={`${ex.id}_${idx}`}
                  className={clsx(
                    "p-3 rounded-xl border flex items-center justify-between gap-2 transition",
                    isCurrent
                      ? "bg-[#182030] border-amber-500/50"
                      : "bg-[#111622] border-[#1C2436]"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onJumpToExercise(idx)}
                    className="flex-1 text-left min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-white truncate">
                        {ex.name}
                      </span>
                      {isDone && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Done
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {ex.completedSets.length}/{ex.targetSets} sets ·{" "}
                      {ex.currentWeight}kg
                    </div>
                  </button>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => onMoveExerciseUp(idx)}
                      aria-label={`Move ${ex.name} up`}
                      className="p-1.5 rounded-lg bg-[#090C11] hover:bg-[#182030] border border-[#1C2436] disabled:opacity-25 text-slate-300 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === exercises.length - 1}
                      onClick={() => onMoveExerciseDown(idx)}
                      aria-label={`Move ${ex.name} down`}
                      className="p-1.5 rounded-lg bg-[#090C11] hover:bg-[#182030] border border-[#1C2436] disabled:opacity-25 text-slate-300 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <SubstitutionCopilotDrawer
        isOpen={isSwapDrawerOpen}
        onClose={() => setIsSwapDrawerOpen(false)}
        currentExercise={swapTargetExercise}
        onApplySubstitute={onApplySubstitute}
      />

      {/* Inline Form Video Demonstration Modal */}
      <ExerciseVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        exercise={{
          id: activeEx.id,
          name: activeEx.name,
          target: activeEx.target,
          equipment: activeEx.equipment,
          videoUrl: activeEx.videoUrl,
          formCue: activeEx.formCue,
        }}
      />

      <Sheet
        open={isWorkoutCompleteModalOpen}
        onOpenChange={setIsWorkoutCompleteModalOpen}
      >
        <SheetContent
          side="bottom"
          className="max-w-md mx-auto text-center space-y-5 pb-6 rounded-t-3xl bg-[#090C11] border-[#1C2436] p-6 font-body text-slate-100 shadow-2xl"
        >
          <SheetHeader className="space-y-2">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-2xl shadow-lg shadow-amber-500/10 animate-in zoom-in-50 duration-300">
              🔥
            </div>
            <SheetTitle className="text-2xl font-editorial font-bold text-white tracking-tight">
              Workout Prescribed Target Crushed!
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed font-body">
              All prescribed sets logged (
              {exercises.reduce((s, e) => s + e.completedSets.length, 0)} total
              sets). Are you done for today, or do you want to log extra
              exercises on top of the program?
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsWorkoutCompleteModalOpen(false);
                onFinishSession();
              }}
              className="w-full py-4 px-5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-display uppercase tracking-wider font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Finish &amp; Save Workout ✓</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsWorkoutCompleteModalOpen(false);
                setIsAddExerciseSheetOpen(true);
              }}
              className="w-full py-3.5 px-4 bg-[#111622] hover:bg-[#182030] active:scale-[0.98] text-white font-display uppercase tracking-wider font-bold text-xs rounded-xl border border-[#1C2436] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ Log Extra Exercise (On Top of Program)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsWorkoutCompleteModalOpen(false);
                onAddBonusSet();
              }}
              className="w-full py-2.5 px-4 text-xs font-mono text-slate-400 hover:text-amber-400 transition cursor-pointer"
            >
              + Add 1 More Bonus Set to {activeEx?.name || "Exercise"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={isAddExerciseSheetOpen}
        onOpenChange={setIsAddExerciseSheetOpen}
      >
        <SheetContent
          side="bottom"
          className="max-w-md mx-auto max-h-[85vh] flex flex-col p-5 rounded-t-3xl bg-[#090C11] border-[#1C2436] font-body text-slate-100 shadow-2xl"
        >
          <SheetHeader className="pb-3 text-left">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-editorial font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Extra Exercise</span>
              </SheetTitle>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                Logged on top of program
              </span>
            </div>
            <SheetDescription className="text-xs text-slate-400 font-body">
              Select any movement from the catalogue to add bonus volume to
              today&apos;s workout.
            </SheetDescription>
          </SheetHeader>

          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search exercise or muscle (e.g. chest, lat, curl)..."
              value={exerciseSearchQuery}
              onChange={(e) => setExerciseSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-[#111622] border border-[#1C2436] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition font-body"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-[11px]">
            {["all", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core"].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedMuscleFilter(cat)}
                  className={clsx(
                    "px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer font-body",
                    selectedMuscleFilter === cat
                      ? "bg-amber-400 text-slate-950 font-display font-black uppercase tracking-wider text-xs shadow-sm"
                      : "bg-[#111622] text-slate-400 hover:text-white border border-[#1C2436] text-xs font-medium"
                  )}
                >
                  {cat === "all" ? "All Muscles" : cat}
                </button>
              )
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[50vh]">
            {filteredCatalogueExercises.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => onAddExtraExercise(ex)}
                className="w-full p-3.5 bg-[#111622] hover:bg-[#182030] border border-[#1C2436] hover:border-slate-700 rounded-xl text-left flex items-center justify-between transition cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-amber-400 transition font-body">
                    {ex.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                    <span className="text-amber-400 font-medium">
                      {ex.primaryMuscle}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{ex.equipment}</span>
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-[#182030] group-hover:bg-amber-400 group-hover:text-slate-950 text-slate-400 border border-[#1C2436] transition">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {selectedFullPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedFullPhoto(null)}
        >
          <div
            className="relative max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-3 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>{activeEx.name} — Setup</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedFullPhoto(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <img
              src={selectedFullPhoto}
              alt="Machine setup full"
              className="w-full h-auto max-h-[60vh] object-contain rounded-xl border border-slate-800"
            />

            <button
              type="button"
              onClick={async () => {
                await shareEquipmentPhotoWithGemini({
                  photoUrl: selectedFullPhoto,
                  exerciseName: activeEx.name,
                  note: activeEx.feedbackNote,
                  traineeId: userId,
                  gymName,
                });
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-[0.98] text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Share with Gemini / Phone Apps</span>
              <Share2 className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
