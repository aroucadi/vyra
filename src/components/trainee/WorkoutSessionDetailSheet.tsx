"use client";

import React from "react";
import clsx from "clsx";
import { WorkoutSession, SetLog } from "@/lib/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dumbbell, Clock, Trophy, Flame, CheckCircle2, Calendar, Camera, FileText, X, Share2, Sparkles, Volume2, Play, Pause, MapPin } from "lucide-react";
import { shareEquipmentPhotoWithGemini, shareAudioNoteWithGemini } from "@/lib/share-equipment";
import { GymSelectorDrawer } from "@/components/trainee/GymSelectorDrawer";
import { appStore } from "@/lib/store";

interface WorkoutSessionDetailSheetProps {
  session: WorkoutSession | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDuration(sec?: number): string {
  if (!sec || sec <= 0) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

function AudioPlayerPill({
  audioUrl,
  label,
  exerciseName,
  sessionTitle,
  traineeId,
  gymName,
}: {
  audioUrl: string;
  label: string;
  exerciseName?: string;
  sessionTitle?: string;
  traineeId?: string;
  gymName?: string;
}) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182030] border border-[#1C2436] text-amber-400 hover:text-amber-300 transition cursor-pointer text-xs active:scale-95 font-body"
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> : <Play className="w-3.5 h-3.5 fill-amber-400 text-amber-400 ml-0.5" />}
        <span className="text-[11px] font-semibold">{label}</span>
        <Volume2 className="w-3.5 h-3.5 text-amber-400 ml-0.5" />
      </button>

      <button
        type="button"
        onClick={async () => {
          await shareAudioNoteWithGemini({
            audioUrl,
            exerciseName,
            sessionTitle,
            traineeId,
            gymName,
          });
        }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-700/60 hover:bg-indigo-900/60 text-indigo-300 transition text-[11px] font-semibold cursor-pointer active:scale-95 shadow-sm"
        title="Share audio memo with Google Gemini for coaching insights"
      >
        <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
        <span>Gemini Analyze</span>
        <Share2 className="w-3 h-3 ml-0.5" />
      </button>
    </div>
  );
}

export function WorkoutSessionDetailSheet({
  session,
  isOpen,
  onOpenChange,
}: WorkoutSessionDetailSheetProps) {
  const [selectedPhoto, setSelectedPhoto] = React.useState<{ url: string; exerciseName: string } | null>(null);
  const [isGymDrawerOpen, setIsGymDrawerOpen] = React.useState(false);
  const [currentGymName, setCurrentGymName] = React.useState<string>("");

  React.useEffect(() => {
    if (session) {
      if (session.gymName) {
        setCurrentGymName(session.gymName);
      } else if (session.gymId) {
        const gym = appStore.getUserGymLocations(session.traineeId).find((g) => g.id === session.gymId);
        setCurrentGymName(gym?.name || "Punch by Badr Hari Lissasfa");
      } else {
        const defaultGym = appStore.getDefaultGymLocation(session.traineeId);
        setCurrentGymName(defaultGym?.name || "Punch by Badr Hari Lissasfa");
      }
    }
  }, [session]);

  if (!session) return null;

  const totalVolume = session.setLogs
    ? session.setLogs.reduce(
        (acc, l) => acc + (l.weightKg || 0) * (l.reps || 0),
        0
      )
    : 0;

  const prCount = session.setLogs
    ? session.setLogs.filter((l) => l.isPR).length
    : 0;

  const dropSetCount = session.setLogs
    ? session.setLogs.filter((l) => l.isDropSet).length
    : 0;

  const durationMin = session.durationSec
    ? Math.max(1, Math.round(session.durationSec / 60))
    : 0;

  // Group set logs by exercise name preserving order of appearance
  const exerciseGroups: {
    name: string;
    equipment?: string;
    sets: SetLog[];
    totalVolume: number;
  }[] = [];

  if (session.setLogs) {
    session.setLogs.forEach((log) => {
      let group = exerciseGroups.find((g) => g.name === log.exerciseName);
      if (!group) {
        group = {
          name: log.exerciseName,
          equipment: log.selectedEquipment,
          sets: [],
          totalVolume: 0,
        };
        exerciseGroups.push(group);
      }
      group.sets.push(log);
      group.totalVolume += (log.weightKg || 0) * (log.reps || 0);
    });
  }

  // Format date display (e.g. Monday, Oct 20, 2026)
  const formattedDate = session.date
    ? new Date(session.date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : "Completed Workout";

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-w-md mx-auto max-h-[88vh] overflow-y-auto rounded-t-3xl bg-[#090C11] border-[#1C2436] p-6 space-y-5 shadow-2xl font-body text-slate-100"
      >
        <SheetHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-amber-400" />
              <span>LOGGED WORKOUT</span>
            </span>
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
            </span>
          </div>

          <SheetTitle className="text-xl font-editorial font-bold text-white tracking-tight pt-1">
            {session.dayLabel || session.programTitle || "Workout Session"}
          </SheetTitle>

          <SheetDescription className="text-xs text-slate-400 font-body">
            {session.setLogs?.length || 0} total sets recorded · {exerciseGroups.length} exercises performed
          </SheetDescription>
        </SheetHeader>

        {/* Salle de Sport / Gym Location */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#111622] border border-[#1C2436] text-xs shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white text-xs truncate font-editorial">
                  {currentGymName}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {session.gymAddress || "Training Facility"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsGymDrawerOpen(true)}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition flex-shrink-0 active:scale-95 cursor-pointer font-editorial"
          >
            Change
          </button>
        </div>

        {/* Overview Metric Matrix */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-[#111622] border border-[#1C2436] rounded-2xl text-center shadow-sm">
            <div className="text-xl font-display font-black text-white tabular-nums">
              {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
            </div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5 font-medium">Vol (kg)</div>
          </div>

          <div className="p-3 bg-[#111622] border border-[#1C2436] rounded-2xl text-center shadow-sm">
            <div className="text-xl font-display font-black text-white tabular-nums">
              {durationMin > 0 ? `${durationMin}m` : "—"}
            </div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5 font-medium">Duration</div>
          </div>

          <div className="p-3 bg-[#111622] border border-[#1C2436] rounded-2xl text-center shadow-sm">
            <div className="text-xl font-display font-black text-amber-400 tabular-nums flex items-center justify-center gap-1">
              {prCount > 0 ? (
                <>
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>+{prCount}</span>
                </>
              ) : (
                <span>{session.setLogs?.length || 0} Sets</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5 font-medium">
              {prCount > 0 ? "PRs Broken" : "Total Sets"}
            </div>
          </div>
        </div>

        {/* 3 Parallel Timing Indicators Architecture */}
        {(session.liftingDurationSec !== undefined || session.totalRestDurationSec !== undefined || session.warmupCompleted !== undefined || session.durationSec > 0) && (
          <div className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Time Architecture</span>
              </span>
              <span className="text-[10px] font-mono text-amber-400">
                Telemetry Validated
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-[#090C11] border border-[#1C2436] rounded-xl">
                <div className="text-xs font-mono font-bold text-white tabular-nums">
                  {formatDuration(session.durationSec)}
                </div>
                <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5 font-medium">Total Gym</div>
              </div>

              <div className="p-2.5 bg-[#090C11] border border-[#1C2436] rounded-xl">
                <div className="text-xs font-mono font-bold text-sky-300 tabular-nums">
                  {formatDuration(session.liftingDurationSec || Math.max(0, session.durationSec - (session.totalRestDurationSec || 0)))}
                </div>
                <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5 font-medium">Lifting</div>
              </div>

              <div className="p-2.5 bg-[#090C11] border border-[#1C2436] rounded-xl">
                <div className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                  {formatDuration(session.totalRestDurationSec || 0)}
                </div>
                <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5 font-medium">Cum. Rest</div>
              </div>
            </div>

            {/* Overall Workout Audio Debrief */}
            {session.audioNoteUrl && (
              <div className="pt-2">
                <AudioPlayerPill
                  audioUrl={session.audioNoteUrl}
                  label="Workout Voice Debrief"
                  sessionTitle={session.dayLabel || session.programTitle}
                  traineeId={session.traineeId}
                  gymName={currentGymName}
                />
              </div>
            )}

            {/* Warmup & Cooldown Adherence Badges */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {session.warmupCompleted !== undefined && (
                <span className={clsx(
                  "text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1",
                  session.warmupCompleted
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-[#090C11] text-slate-400 border-[#1C2436]"
                )}>
                  <span>{session.warmupCompleted ? `✓ Warmup (${formatDuration(session.warmupDurationSec)})` : "— Warmup Skipped"}</span>
                </span>
              )}

              {session.cooldownCompleted !== undefined && (
                <span className={clsx(
                  "text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1",
                  session.cooldownCompleted
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                    : "bg-[#090C11] text-slate-400 border-[#1C2436]"
                )}>
                  <span>{session.cooldownCompleted ? `✓ Cooldown (${formatDuration(session.cooldownDurationSec)})` : "— Cooldown Skipped"}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Exercise-by-Exercise Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-display font-bold uppercase tracking-wider text-xs text-slate-400">
              Exercise Breakdown
            </span>
            {dropSetCount > 0 && (
              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                <span>{dropSetCount} Drop Sets</span>
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {exerciseGroups.map((group, gIdx) => (
              <div
                key={gIdx}
                className="p-4 bg-[#111622] border border-[#1C2436] rounded-2xl space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-mono text-slate-500 text-[10px] w-5">
                      {gIdx + 1}.
                    </span>
                    <span className="font-semibold text-white text-xs truncate">
                      {group.name}
                    </span>
                    {group.equipment && (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#182030] text-slate-300 border border-[#1C2436]">
                        {group.equipment}
                      </span>
                    )}
                    {(() => {
                      const tagsFromSets = group.sets.flatMap((s) => s.feedbackTags || (s.feedbackTag ? [s.feedbackTag] : []));
                      const tagsFromSession = session.exerciseFeedbacks?.find((f) => f.exerciseName === group.name)?.tags ||
                        (session.exerciseFeedbacks?.find((f) => f.exerciseName === group.name)?.tag ? [session.exerciseFeedbacks.find((f) => f.exerciseName === group.name)!.tag!] : []);
                      const combined = Array.from(new Set([...tagsFromSets, ...tagsFromSession]));
                      if (combined.length === 0) return null;
                      const labelMap: Record<string, string> = {
                        balance_issue: "⚖️ Balance",
                        joint_strain: "⚡ Joint",
                        heavy: "🥵 Heavy",
                        light: "🪶 Light",
                        optimal: "🎯 Optimal",
                      };
                      return (
                        <div className="flex items-center gap-1 flex-wrap">
                          {combined.map((tag) => (
                            <span key={tag} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#182030] text-amber-300 border border-[#1C2436]">
                              {labelMap[tag] || tag}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <span className="text-[11px] font-mono text-amber-400 font-semibold tabular-nums flex-shrink-0">
                    {group.totalVolume > 0 ? `${group.totalVolume.toLocaleString()} kg` : ""}
                  </span>
                </div>

                {/* Set Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {group.sets.map((s, sIdx) => (
                    <div
                      key={sIdx}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono border flex items-center gap-1.5 ${
                        s.isDropSet
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          : s.isPR
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          : "bg-[#090C11] border-[#1C2436] text-slate-200"
                      }`}
                    >
                      <span className="text-[10px] text-slate-400">
                        {s.isDropSet ? "🔥 Drop" : `S${sIdx + 1}`}
                      </span>
                      <span className="font-bold tabular-nums">{s.weightKg}kg</span>
                      <span className="text-slate-400 tabular-nums">× {s.reps}</span>
                      {s.isPR && (
                        <Trophy className="w-3 h-3 text-amber-400 ml-0.5" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Free-form notes */}
                {(() => {
                  const noteFromSets = group.sets.find((s) => s.note)?.note;
                  const noteFromFeedback = session.exerciseFeedbacks?.find((f) => f.exerciseName === group.name)?.note;
                  const note = noteFromSets || noteFromFeedback;
                  if (!note) return null;
                  return (
                    <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-[#090C11] border border-[#1C2436] text-xs text-slate-300">
                      <FileText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="italic">{note}</span>
                    </div>
                  );
                })()}

                {/* Exercise Audio Note */}
                {(() => {
                  const audioFromSets = group.sets.find((s) => s.audioNoteUrl)?.audioNoteUrl;
                  const audioFromFeedback = session.exerciseFeedbacks?.find((f) => f.exerciseName === group.name)?.audioNoteUrl;
                  const audio = audioFromSets || audioFromFeedback;
                  if (!audio) return null;
                  return (
                    <div className="pt-1">
                      <AudioPlayerPill
                        audioUrl={audio}
                        label={`Voice Note: ${group.name}`}
                        exerciseName={group.name}
                        traineeId={session.traineeId}
                        gymName={currentGymName}
                      />
                    </div>
                  );
                })()}

                {/* Machine / Equipment Setup Photo */}
                {(() => {
                  const photoFromSets = group.sets.find((s) => s.photoUrl)?.photoUrl;
                  const photoFromFeedback = session.exerciseFeedbacks?.find((f) => f.exerciseName === group.name)?.photoUrl;
                  const photo = photoFromSets || photoFromFeedback;
                  if (!photo) return null;
                  return (
                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto({ url: photo, exerciseName: group.name })}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#090C11] border border-[#1C2436] hover:bg-[#182030] transition group cursor-pointer text-left"
                      >
                        <img
                          src={photo}
                          alt="Machine setup thumbnail"
                          className="w-8 h-8 object-cover rounded-lg border border-[#1C2436] group-hover:scale-105 transition flex-shrink-0"
                        />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold text-slate-200 flex items-center gap-1">
                            <Camera className="w-3 h-3 text-amber-400" /> Machine / Bar Setup
                          </span>
                          <span className="text-[9px] text-slate-400">Tap to enlarge</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => shareEquipmentPhotoWithGemini({
                          photoUrl: photo,
                          exerciseName: group.name,
                          note: group.sets.find((s) => s.note)?.note,
                          traineeId: session.traineeId,
                          gymName: currentGymName,
                        })}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-950/60 border border-indigo-700/60 hover:bg-indigo-900/60 text-indigo-300 transition text-[11px] font-semibold cursor-pointer active:scale-95 shadow-sm"
                        title="Share setup photo with Google Gemini"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>Share with Gemini</span>
                        <Share2 className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full py-3.5 bg-[#111622] hover:bg-[#182030] active:scale-[0.99] text-white border border-[#1C2436] font-display uppercase tracking-wider font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>
        
        {/* Full Size Photo Preview Modal with Gemini Sharing */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-sm w-full bg-[#111622] border border-[#1C2436] rounded-2xl overflow-hidden p-4 space-y-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 font-editorial">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>{selectedPhoto.exerciseName} — Setup</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#182030] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <img src={selectedPhoto.url} alt="Machine setup full" className="w-full h-auto max-h-[60vh] object-contain rounded-xl border border-[#1C2436]" />

              {/* Native Share Button */}
              <button
                type="button"
                onClick={async () => {
                  await shareEquipmentPhotoWithGemini({
                    photoUrl: selectedPhoto.url,
                    exerciseName: selectedPhoto.exerciseName,
                    traineeId: session.traineeId,
                    gymName: currentGymName,
                  });
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>Share with Gemini / Phone Apps</span>
                <Share2 className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}
        <GymSelectorDrawer
          isOpen={isGymDrawerOpen}
          onOpenChange={setIsGymDrawerOpen}
          selectedGymId={session.gymId}
          onSelectGym={(gym) => {
            setCurrentGymName(gym.name);
            session.gymId = gym.id;
            session.gymName = gym.name;
            session.gymAddress = gym.address;
            appStore.updateSessionGym(session.id, {
              id: gym.id,
              name: gym.name,
              address: gym.address,
            });
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
