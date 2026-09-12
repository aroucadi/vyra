"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Save,
  Send,
  Plus,
  Trash2,
  Layers,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { appStore } from "@/lib/store";
import { Program, ProgramWeek, ProgramDay, Block, ExercisePrescription } from "@/lib/types";
import { saveProgramAction, publishProgramAction } from "@/lib/actions/program";

interface DaySchedule {
  label: string;
  isRestDay: boolean;
  blocks: Block[];
}

const initialSchedule: Record<number, DaySchedule> = {
  0: {
    label: "Push Hypertrophy A",
    isRestDay: false,
    blocks: [
      {
        id: "b_straight_1",
        order: 1,
        type: "straight",
        exercises: [
          {
            id: "ep_b1",
            exerciseId: "ex_bench_press",
            exerciseName: "Barbell Bench Press",
            sets: 3,
            repRangeLow: 8,
            repRangeHigh: 10,
            rirScheme: [2, 1, 0],
            restSeconds: 90,
            loadGuidance: "Double progression: add 2.5kg when hitting 10 reps across all sets.",
            formCueText: "Pause on sternum, stack wrists over elbows.",
            videoUrl: "https://www.youtube.com/results?search_query=barbell+bench+press+form",
            targetMuscleGroups: ["Chest", "Triceps"],
          },
        ],
      },
      {
        id: "b_super_1",
        order: 2,
        type: "superset",
        exercises: [
          {
            id: "ep_s1",
            exerciseId: "ex_lateral_raise",
            exerciseName: "Cable Lateral Raise",
            sets: 3,
            repRangeLow: 12,
            repRangeHigh: 15,
            rirScheme: [1, 0, 0],
            restSeconds: 0,
            formCueText: "Continuous tension, slight torso lean.",
            targetMuscleGroups: ["Side Deltoids"],
          },
          {
            id: "ep_s2",
            exerciseId: "ex_cable_triceps_ext",
            exerciseName: "Overhead Cable Triceps Extension",
            sets: 3,
            repRangeLow: 12,
            repRangeHigh: 15,
            rirScheme: [1, 0, 0],
            restSeconds: 60,
            formCueText: "Full stretch behind head, lock elbows in place.",
            targetMuscleGroups: ["Triceps"],
          },
        ],
      },
    ],
  },
  1: {
    label: "Pull Hypertrophy & Back",
    isRestDay: false,
    blocks: [
      {
        id: "b_pull_1",
        order: 1,
        type: "straight",
        exercises: [
          {
            id: "ep_p1",
            exerciseId: "ex_bent_over_row",
            exerciseName: "Barbell Bent-Over Row",
            sets: 3,
            repRangeLow: 8,
            repRangeHigh: 10,
            rirScheme: [2, 1, 1],
            restSeconds: 90,
            formCueText: "Hinge hips 45°, pull barbell towards lower ribcage.",
            targetMuscleGroups: ["Upper Back", "Lats"],
          },
        ],
      },
    ],
  },
  2: {
    label: "Active Recovery & Mobility",
    isRestDay: true,
    blocks: [],
  },
  3: {
    label: "Legs & Core Overload",
    isRestDay: false,
    blocks: [
      {
        id: "b_legs_1",
        order: 1,
        type: "straight",
        exercises: [
          {
            id: "ep_l1",
            exerciseId: "ex_barbell_squat",
            exerciseName: "Barbell Back Squat",
            sets: 4,
            repRangeLow: 6,
            repRangeHigh: 8,
            rirScheme: [3, 2, 2, 1],
            restSeconds: 120,
            formCueText: "Brace core 360°, break at hips and knees, hit parallel depth.",
            targetMuscleGroups: ["Quads", "Glutes"],
          },
        ],
      },
    ],
  },
  4: {
    label: "Upper Hypertrophy B",
    isRestDay: false,
    blocks: [
      {
        id: "b_up_1",
        order: 1,
        type: "straight",
        exercises: [
          {
            id: "ep_up1",
            exerciseId: "ex_incline_db_press",
            exerciseName: "Incline Dumbbell Press",
            sets: 3,
            repRangeLow: 8,
            repRangeHigh: 10,
            rirScheme: [2, 1, 0],
            restSeconds: 90,
            formCueText: "Full stretch at bottom, explosive drive.",
            targetMuscleGroups: ["Upper Chest"],
          },
        ],
      },
    ],
  },
  5: {
    label: "Mobility & Conditioning",
    isRestDay: true,
    blocks: [],
  },
  6: {
    label: "Rest & Systemic Recovery",
    isRestDay: true,
    blocks: [],
  },
};

export default function ProgramBuilderPage() {
  const router = useRouter();
  const trainees = appStore.getTrainees();
  const exercisesLibrary = appStore.getExercises();

  const [selectedTraineeId, setSelectedTraineeId] = useState(trainees[0]?.id || "trainee_1");
  const [title, setTitle] = useState("Hypertrophy Block 1 - Precision");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [activeWeekIndex, setActiveWeekIndex] = useState(1);
  const [activeDayIndex, setActiveDayIndex] = useState(0); // 0 = Mon
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [version, setVersion] = useState(1);

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [pickerTargetBlockIndex, setPickerTargetBlockIndex] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState("");

  // Full 7-day meso-cycle schedule state
  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>(initialSchedule);

  const currentDaySchedule = schedule[activeDayIndex] || {
    label: "Training Day",
    isRestDay: false,
    blocks: [],
  };
  const blocks = currentDaySchedule.blocks;

  const setBlocks = (newBlocks: Block[]) => {
    setSchedule((prev) => ({
      ...prev,
      [activeDayIndex]: {
        ...prev[activeDayIndex],
        blocks: newBlocks,
      },
    }));
  };

  const toggleRestDay = (isRest: boolean) => {
    setSchedule((prev) => ({
      ...prev,
      [activeDayIndex]: {
        ...prev[activeDayIndex],
        isRestDay: isRest,
      },
    }));
  };

  const updateDayLabel = (newLabel: string) => {
    setSchedule((prev) => ({
      ...prev,
      [activeDayIndex]: {
        ...prev[activeDayIndex],
        label: newLabel,
      },
    }));
  };

  const [nextId, setNextId] = useState(100);

  const handleAddStraightBlock = () => {
    setNextId((prev) => prev + 1);
    const newBlock: Block = {
      id: `b_${nextId}`,
      order: blocks.length + 1,
      type: "straight",
      exercises: [],
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleAddSupersetBlock = () => {
    setNextId((prev) => prev + 1);
    const newBlock: Block = {
      id: `b_${nextId}`,
      order: blocks.length + 1,
      type: "superset",
      exercises: [],
    };
    setBlocks([...blocks, newBlock]);
  };

  const openPickerForBlock = (blockIndex: number) => {
    setPickerTargetBlockIndex(blockIndex);
    setShowExercisePicker(true);
  };

  const selectExerciseForBlock = (exerciseId: string) => {
    if (pickerTargetBlockIndex === null) return;
    const ex = exercisesLibrary.find((e) => e.id === exerciseId);
    if (!ex) return;

    setNextId((prev) => prev + 1);
    const newPrescription: ExercisePrescription = {
      id: `ep_${nextId}`,
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: 3,
      repRangeLow: 8,
      repRangeHigh: 12,
      rirScheme: [2, 1, 0],
      restSeconds: 90,
      formCueText: "Focus on controlled eccentric phase.",
      targetMuscleGroups: [ex.primaryMuscle],
    };

    const updated = [...blocks];
    updated[pickerTargetBlockIndex].exercises.push(newPrescription);
    setBlocks(updated);
    setShowExercisePicker(false);
    setPickerTargetBlockIndex(null);
  };

  const removeExercise = (blockIdx: number, exIdx: number) => {
    const updated = [...blocks];
    updated[blockIdx].exercises.splice(exIdx, 1);
    setBlocks(updated);
  };

  const buildProgramObject = (progStatus: "draft" | "published", progVersion: number): Program => {
    const progId = `prog_${Date.now()}`;
    const weeks: ProgramWeek[] = [];
    const end = new Date(startDate);
    end.setDate(end.getDate() + durationWeeks * 7 - 1);
    const endDateStr = end.toISOString().split("T")[0];

    for (let w = 1; w <= durationWeeks; w++) {
      const weekId = `week_${progId}_${w}`;
      const days: ProgramDay[] = [];
      for (let d = 0; d < 7; d++) {
        const daySched = schedule[d] || {
          label: `Day ${d + 1}`,
          isRestDay: d === 2 || d === 5 || d === 6,
          blocks: [],
        };
        days.push({
          id: `${weekId}_d${d}`,
          weekId,
          dayOfWeek: d,
          label: daySched.label,
          isRestDay: daySched.isRestDay,
          morningRoutine: ["750ml hydration", "Dynamic mobility warmup"],
          blocks: daySched.isRestDay ? [] : daySched.blocks,
          nutrition: {
            targetProteinGrams: 180,
            supplements: [{ name: "Creatine", dosage: "5g", timing: "Post-workout", checked: true }],
          },
        });
      }
      weeks.push({
        id: weekId,
        programId: progId,
        weekIndex: w,
        days,
      });
    }

    return {
      id: progId,
      trainerId: "trainer_1",
      traineeId: selectedTraineeId,
      title,
      startDate,
      endDate: endDateStr,
      durationWeeks,
      status: progStatus,
      version: progVersion,
      weeks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSaveDraft = async () => {
    const prog = buildProgramObject("draft", version);
    await saveProgramAction(prog);
    setStatus("draft");
    setSuccessToast("Program draft saved successfully.");
    setTimeout(() => setSuccessToast(""), 3000);
  };

  const handlePublish = async () => {
    setShowPublishModal(false);
    const newVersion = version + 1;
    const prog = buildProgramObject("published", newVersion);
    await saveProgramAction(prog);
    await publishProgramAction(prog.id);
    setStatus("published");
    setVersion(newVersion);
    setSuccessToast("Program v" + newVersion + ".0 published to athlete device!");
    setTimeout(() => {
      setSuccessToast("");
      router.push("/roster");
    }, 1500);
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Program Metadata */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/roster"
            className="p-2 rounded-lg bg-[#162032] border border-[#334155] text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-black text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-[#10B981] focus:outline-none px-1"
              />
              <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-mono text-xs font-bold uppercase">
                {status} v{version}.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Multi-week periodized meso-cycle editor with superset grouping & RIR target schemes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {successToast && (
            <span className="text-xs text-[#10B981] font-mono font-bold flex items-center gap-1 mr-2">
              <CheckCircle2 className="w-4 h-4" /> {successToast}
            </span>
          )}

          <button
            onClick={handleSaveDraft}
            className="px-3.5 py-2 rounded-lg bg-[#162032] border border-[#334155] text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>

          <button
            onClick={() => setShowPublishModal(true)}
            className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow-sm uppercase tracking-wider"
          >
            <Send className="w-3.5 h-3.5" />
            Publish Program
          </button>
        </div>
      </div>

      {/* 2. Program Setup Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#162032] p-4 rounded-xl border border-[#1E293B] text-xs">
        <div>
          <label className="text-slate-400 font-mono text-[10px] uppercase">Assigned Athlete</label>
          <select
            value={selectedTraineeId}
            onChange={(e) => setSelectedTraineeId(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white focus:outline-none focus:border-[#10B981]"
          >
            {trainees.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.goals[0] || "General"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-slate-400 font-mono text-[10px] uppercase">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white focus:outline-none focus:border-[#10B981] font-mono"
          />
        </div>

        <div>
          <label className="text-slate-400 font-mono text-[10px] uppercase">Block Duration</label>
          <select
            value={durationWeeks}
            onChange={(e) => setDurationWeeks(parseInt(e.target.value))}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white focus:outline-none focus:border-[#10B981] font-mono"
          >
            <option value={3}>3 Weeks (Concentrated)</option>
            <option value={4}>4 Weeks (Standard Mesocycle)</option>
            <option value={6}>6 Weeks (Extended Overload)</option>
            <option value={8}>8 Weeks (Double Block)</option>
          </select>
        </div>
      </div>

      {/* 3. Week Tabs Selector */}
      <div className="flex gap-2 border-b border-[#1E293B] pb-2">
        {Array.from({ length: durationWeeks }, (_, i) => i + 1).map((weekNum) => (
          <button
            key={weekNum}
            onClick={() => setActiveWeekIndex(weekNum)}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition ${
              activeWeekIndex === weekNum
                ? "bg-[#10B981] text-slate-950 shadow-sm"
                : "bg-[#162032] text-slate-400 hover:text-white border border-[#1E293B]"
            }`}
          >
            Week {weekNum}
          </button>
        ))}
      </div>

      {/* 4. Day-by-Day Calendar Columns Bar */}
      <div className="grid grid-cols-7 gap-2">
        {daysOfWeek.map((dayName, idx) => {
          const dSched = schedule[idx];
          return (
            <button
              key={dayName}
              onClick={() => setActiveDayIndex(idx)}
              className={`p-3 rounded-xl border text-center transition ${
                activeDayIndex === idx
                  ? "bg-[#162032] border-[#10B981] ring-1 ring-[#10B981]"
                  : "bg-[#162032]/60 border-[#1E293B] hover:border-slate-700"
              }`}
            >
              <span className="text-[10px] uppercase font-mono text-slate-400 block">{dayName.slice(0, 3)}</span>
              <span className="text-xs font-bold text-white mt-1 block truncate">
                {dSched?.label || `Day ${idx + 1}`}
              </span>
              {dSched?.isRestDay && (
                <span className="mt-1 px-1.5 py-0.2 rounded bg-[#06B6D4]/10 text-[#06B6D4] text-[9px] font-mono block">
                  Rest
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 5. Day Detail & Exercise Blocks Editor */}
      <section className="bg-[#162032] rounded-xl border border-[#1E293B] p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
          <div>
            <span className="text-[10px] font-mono text-[#06B6D4] uppercase font-bold tracking-wider">
              {daysOfWeek[activeDayIndex]} • Week {activeWeekIndex} Editor
            </span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={currentDaySchedule.label}
                onChange={(e) => updateDayLabel(e.target.value)}
                className="text-base font-black text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-[#10B981] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F172A] border border-[#334155] cursor-pointer hover:border-slate-600 transition">
              <input
                type="checkbox"
                checked={currentDaySchedule.isRestDay}
                onChange={(e) => toggleRestDay(e.target.checked)}
                className="accent-[#10B981] w-4 h-4 rounded"
              />
              <span className="text-xs font-mono font-bold text-slate-300">Rest Day</span>
            </label>

            {!currentDaySchedule.isRestDay && (
              <>
                <button
                  onClick={handleAddStraightBlock}
                  className="px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-[#334155] text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5 text-[#10B981]" />
                  Add Straight Set
                </button>
                <button
                  onClick={handleAddSupersetBlock}
                  className="px-3 py-1.5 rounded-lg bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 border border-[#06B6D4]/40 text-[#06B6D4] text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Add Superset Block
                </button>
              </>
            )}
          </div>
        </div>

        {currentDaySchedule.isRestDay ? (
          <div className="p-8 text-center bg-[#0F172A] rounded-xl border border-[#1E293B] space-y-2">
            <p className="text-sm font-bold text-slate-200">Scheduled Rest & Muscle Protein Synthesis</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              This day is designated as non-lifting recovery. Uncheck &ldquo;Rest Day&rdquo; above to prescribe exercises.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
          {blocks.map((block, bIdx) => (
            <div
              key={block.id}
              className={`p-4 rounded-xl border space-y-3 ${
                block.type === "superset"
                  ? "bg-[#06B6D4]/5 border-[#06B6D4]/40"
                  : "bg-[#0F172A] border-[#1E293B]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {block.type === "superset" && <Layers className="w-4 h-4 text-[#06B6D4]" />}
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Block {bIdx + 1}: {block.type === "superset" ? "Superset Circuit (Shared Rest)" : "Straight Sets"}
                  </span>
                </div>

                <button
                  onClick={() => openPickerForBlock(bIdx)}
                  className="px-2.5 py-1 rounded bg-[#162032] hover:bg-[#1E293B] border border-[#334155] text-xs text-[#10B981] font-bold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Movement
                </button>
              </div>

              {/* Exercises in block */}
              {block.exercises.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-[#334155] rounded-lg">
                  <p className="text-xs text-slate-500">No exercises added to this block yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {block.exercises.map((ex, exIdx) => (
                    <div
                      key={ex.id}
                      className="bg-[#162032] p-3 rounded-lg border border-[#334155]/60 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-100">{ex.exerciseName}</span>
                        <button
                          onClick={() => removeExercise(bIdx, exIdx)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase">Sets</label>
                          <input
                            type="number"
                            value={ex.sets}
                            onChange={(e) => {
                              const updated = [...blocks];
                              updated[bIdx].exercises[exIdx].sets = parseInt(e.target.value) || 1;
                              setBlocks(updated);
                            }}
                            className="w-full bg-[#0F172A] border border-[#334155] rounded px-2 py-1 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase">Rep Range</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={ex.repRangeLow}
                              onChange={(e) => {
                                const updated = [...blocks];
                                updated[bIdx].exercises[exIdx].repRangeLow = parseInt(e.target.value) || 1;
                                setBlocks(updated);
                              }}
                              className="w-full bg-[#0F172A] border border-[#334155] rounded px-2 py-1 text-white text-xs"
                            />
                            <span>-</span>
                            <input
                              type="number"
                              value={ex.repRangeHigh}
                              onChange={(e) => {
                                const updated = [...blocks];
                                updated[bIdx].exercises[exIdx].repRangeHigh = parseInt(e.target.value) || 1;
                                setBlocks(updated);
                              }}
                              className="w-full bg-[#0F172A] border border-[#334155] rounded px-2 py-1 text-white text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase">RIR Target</label>
                          <input
                            type="number"
                            value={ex.rirScheme[0]}
                            onChange={(e) => {
                              const updated = [...blocks];
                              updated[bIdx].exercises[exIdx].rirScheme = [parseInt(e.target.value) || 0];
                              setBlocks(updated);
                            }}
                            className="w-full bg-[#0F172A] border border-[#334155] rounded px-2 py-1 text-[#06B6D4] text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase">Rest Seconds</label>
                          <input
                            type="number"
                            value={ex.restSeconds}
                            onChange={(e) => {
                              const updated = [...blocks];
                              updated[bIdx].exercises[exIdx].restSeconds = parseInt(e.target.value) || 0;
                              setBlocks(updated);
                            }}
                            className="w-full bg-[#0F172A] border border-[#334155] rounded px-2 py-1 text-white text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-400 font-mono uppercase">Coach Form Cue</label>
                        <input
                          type="text"
                          value={ex.formCueText || ""}
                          onChange={(e) => {
                            const updated = [...blocks];
                            updated[bIdx].exercises[exIdx].formCueText = e.target.value;
                            setBlocks(updated);
                          }}
                          placeholder="e.g. Pause on chest, avoid flared elbows."
                          className="w-full bg-[#0F172A] border border-[#334155] rounded px-2 py-1 text-slate-300 text-xs mt-0.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </section>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#162032] border border-[#334155] rounded-2xl p-5 max-w-md w-full max-h-[80vh] overflow-y-auto space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-white">Select from Exercise Library</h3>
            <div className="space-y-1.5">
              {exercisesLibrary.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => selectExerciseForBlock(ex.id)}
                  className="w-full p-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-[#1E293B] text-left flex items-center justify-between transition"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-100">{ex.name}</p>
                    <span className="text-[10px] text-[#10B981] font-mono">{ex.primaryMuscle} • {ex.equipment}</span>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#162032] border border-[#334155] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 mx-auto flex items-center justify-center text-[#10B981]">
              <Send className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">Publish Program v{version + 1}.0?</h3>
              <p className="text-xs text-slate-400 mt-1">
                This will immediately deploy the program to the athlete&apos;s app. Previous versions will be safely archived without affecting past session logs.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowPublishModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="flex-1 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-slate-950 font-black text-xs uppercase tracking-wider"
              >
                Confirm & Push
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
