"use client";

import React, { useState, useEffect, useMemo, useRef, useSyncExternalStore, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { appStore } from "@/lib/store";
import { resolveCoachQuery, CoachSmartActionCardData } from "@/lib/coach-engine";
import { runAutonomousCoachingLifecycleCheck } from "@/lib/ai/coaching-cycle";
import { CoachSmartActionCard } from "@/components/coach/CoachSmartActionCard";
import { resolveProgramDay } from "@/lib/utils";
import { Send, Sparkles, Brain, ShieldAlert, Dumbbell, Scale, Activity } from "lucide-react";
import { clsx } from "clsx";
import { useIsClientHydrated, useVyraStoreVersion } from "@/components/auth/VyraAuthProvider";

interface Message {
  id: string;
  sender: "user" | "coach";
  text: string;
  card?: CoachSmartActionCardData;
  engineLabel?: string;
}

const EMPTY_CHAT_HISTORY: Message[] = [];
const coachHistoryListeners = new Set<() => void>();
const coachHistoryCache = new Map<string, Message[]>();

function readCoachHistory(userId: string): Message[] {
  if (typeof window === "undefined") return EMPTY_CHAT_HISTORY;
  if (coachHistoryCache.has(userId)) {
    return coachHistoryCache.get(userId) || EMPTY_CHAT_HISTORY;
  }
  try {
    const raw = sessionStorage.getItem(`vyra_coach_chat_v1_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Message[];
      if (Array.isArray(parsed)) {
        coachHistoryCache.set(userId, parsed);
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  return EMPTY_CHAT_HISTORY;
}

function appendCoachMessages(userId: string, additions: Message[]) {
  const next = [...readCoachHistory(userId), ...additions].slice(-30);
  coachHistoryCache.set(userId, next);
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(`vyra_coach_chat_v1_${userId}`, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  }
  coachHistoryListeners.forEach((l) => l());
}

function subscribeCoachHistory(cb: () => void) {
  coachHistoryListeners.add(cb);
  return () => {
    coachHistoryListeners.delete(cb);
  };
}

function CoachChat() {
  const isHydrated = useIsClientHydrated();
  useVyraStoreVersion();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || "";
  const currentUser = appStore.getCurrentUser();
  const persistedThread = useSyncExternalStore(
    subscribeCoachHistory,
    () => (isHydrated ? readCoachHistory(currentUser.id) : EMPTY_CHAT_HISTORY),
    () => EMPTY_CHAT_HISTORY
  );

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeEngineStatus, setActiveEngineStatus] = useState<
    "GEMINI 4 ARGON" | "LOCAL ENGINE"
  >("GEMINI 4 ARGON");
  const firstName = (isHydrated ? currentUser.name : "Athlete").split(" ")[0];
  const messages: Message[] = useMemo(
    () => [
      {
        id: "m_welcome",
        sender: "coach",
        text: `Ready when you are, ${firstName}. Ask about your load, request exercise swaps, review nutrition, or adapt today's session.`,
      },
      ...persistedThread,
    ],
    [firstName, persistedThread]
  );

  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const feedEndRef = useRef<HTMLDivElement | null>(null);
  const initialSentRef = useRef(false);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || isStreaming) return;

    const userMsg: Message = {
      id: `msg_user_${Date.now()}`,
      sender: "user",
      text: query,
    };

    const nextHistory = [...messagesRef.current, userMsg]
      .slice(-6)
      .map((m) => ({ sender: m.sender, text: m.text }));

    appendCoachMessages(currentUser.id, [userMsg]);
    setInput("");
    setIsStreaming(true);

    try {
      const program = appStore.getActiveProgramForTrainee(currentUser.id);
      const metrics = appStore.getMetrics(currentUser.id);
      const biometrics = appStore.getLatestWearableBiometrics(currentUser.id);
      const resolvedDay = program ? resolveProgramDay(program.startDate) : null;
      const currentWeek =
        program?.weeks && resolvedDay
          ? program.weeks[
              Math.min(Math.max(0, resolvedDay.weekIndex - 1), program.weeks.length - 1)
            ]
          : undefined;
      const todayDay =
        currentWeek?.days.find((d) => d.dayOfWeek === resolvedDay?.dayOfWeek && !d.isRestDay) ||
        currentWeek?.days.find((d) => !d.isRestDay);
      const exercises = todayDay
        ? todayDay.blocks
            .flatMap((b) => b.exercises)
            .map(
              (e) =>
                `${e.exerciseName} (${e.sets}x${e.repRangeLow}-${e.repRangeHigh}${e.targetWeightKg ? ` @ ${e.targetWeightKg}kg` : ""})`
            )
        : [];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 16000);
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traineeId: currentUser.id,
          query,
          conversationHistory: nextHistory,
          clientContext: {
            programTitle: program?.title,
            activeDayLabel: todayDay?.label,
            exercises,
            latestWeightKg: metrics[metrics.length - 1]?.weightKg,
            readinessSource: biometrics?.source || "none",
            sleepHours: biometrics?.sleepHours,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = (await res.json()) as {
          ok?: boolean;
          response?: {
            id: string;
            text: string;
            card?: CoachSmartActionCardData;
            engine?: "gemini_4_argon_live" | "deterministic_local";
            modelUsed?: string;
          };
        };

        if (json?.ok && json.response) {
          const isLive = json.response.engine === "gemini_4_argon_live";
          setActiveEngineStatus(isLive ? "GEMINI 4 ARGON" : "LOCAL ENGINE");
          const coachReply: Message = {
            id: json.response.id,
            sender: "coach",
            text: json.response.text,
            card: json.response.card,
            engineLabel: isLive
              ? (json.response.modelUsed || "gemini-4-argon").toUpperCase()
              : "LOCAL DETERMINISTIC",
          };
          appendCoachMessages(currentUser.id, [coachReply]);
          setIsStreaming(false);
          return;
        }
      }
    } catch {
      // Seamless local fallback if offline or timed out
    }

    const coachResolved = resolveCoachQuery(currentUser.id, query);
    setActiveEngineStatus("LOCAL ENGINE");
    appendCoachMessages(currentUser.id, [
      {
        id: coachResolved.id,
        sender: "coach",
        text: coachResolved.text,
        card: coachResolved.card,
        engineLabel: "LOCAL DETERMINISTIC",
      },
    ]);
    setIsStreaming(false);
  };

  useEffect(() => {
    const sessions = appStore.getSessions(currentUser.id);
    const metricEntries = appStore.getMetrics(currentUser.id);
    runAutonomousCoachingLifecycleCheck({
      traineeId: currentUser.id,
      sessions,
      metricEntries,
    });
  }, [currentUser.id]);

  useEffect(() => {
    if (initialPrompt && !initialSentRef.current) {
      initialSentRef.current = true;
      void handleSend(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  const quickChips = [
    { label: "Why this weight?", prompt: "Why was this specific weight prescribed for my sets?" },
    { label: "Swap exercise", prompt: "I need an alternative exercise for my pressing movement." },
    { label: "Nutrition & Surplus", prompt: "Am I eating enough calories to progress on my lifts?" },
    { label: "Weekly Review", prompt: "Run my weekly meso review and diagnose my bottlenecks." },
    { label: "Short on time (30m)", prompt: "I am short on time today, condense my workout to 30 min." },
    { label: "Explain my sleep", prompt: "How does my sleep impact my workout today?" },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#090C11] pb-24 px-3 sm:px-4 lg:px-6 pt-2 lg:pt-4 max-w-md lg:max-w-6xl mx-auto w-full min-h-[calc(100dvh-32px)]">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b border-[#1C2436] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-editorial text-xl lg:text-2xl font-bold text-[#F8FAFC] tracking-tight leading-none">
              VYRA Intelligence Studio
            </h1>
            <p className="text-xs text-[#94A3B8] mt-1">
              Multimodal Sports Science Concierge · Gemini 4 Argon &amp; Claude MCP
            </p>
          </div>
        </div>
        <span
          className={clsx(
            "text-[10px] font-mono px-3 py-1 rounded-full border font-bold tracking-wider",
            activeEngineStatus === "GEMINI 4 ARGON"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-[#111622] border-[#1C2436] text-amber-400"
          )}
        >
          {activeEngineStatus}
        </span>
      </header>

      {/* Responsive Grid (Chat on Left, Context Rail on Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 min-h-0">
        
        {/* Chat Feed Column */}
        <div className="lg:col-span-8 flex flex-col min-h-0 h-full">
          {/* Message Feed */}
          <div className="flex-1 overflow-y-auto py-2 space-y-4 pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={clsx(
                  "flex flex-col gap-1",
                  m.sender === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={clsx(
                    "p-3.5 rounded-2xl text-xs max-w-[88%] leading-relaxed whitespace-pre-line",
                    m.sender === "user"
                      ? "bg-amber-400 text-[#090C11] font-semibold rounded-br-none shadow-sm"
                      : "bg-[#111622] border border-[#1C2436] text-[#E2E8F0] rounded-bl-none shadow-sm"
                  )}
                >
                  {m.text}
                </div>
                {m.sender === "coach" && m.engineLabel && (
                  <span className="text-[9px] font-mono text-[#64748B] px-1 uppercase tracking-widest">
                    {m.engineLabel}
                  </span>
                )}

                {m.card && (
                  <div className="w-full max-w-[96%]">
                    <CoachSmartActionCard card={m.card} traineeId={currentUser.id} />
                  </div>
                )}
              </div>
            ))}

            {/* Intelligent UI Progressive Streaming Reserved Space */}
            {isStreaming && (
              <div className="flex flex-col items-start space-y-2 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-2xl rounded-bl-none bg-[#111622] border border-[#1C2436] text-xs text-[#CBD5E1] max-w-[88%] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-[11px] text-[#94A3B8]">
                    Reasoning with Multimodal RAG &amp; Sports Science Telemetry...
                  </span>
                </div>
                <div className="w-full max-w-[96%] h-28 rounded-2xl bg-[#111622]/60 border border-[#1C2436] p-4 space-y-3 animate-pulse">
                  <div className="h-3 w-1/3 bg-[#1C2436] rounded" />
                  <div className="h-4 w-2/3 bg-[#1C2436] rounded" />
                </div>
              </div>
            )}
            <div ref={feedEndRef} />
          </div>

          {/* Contextual Quick Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 -mx-2 px-2 flex-shrink-0 no-scrollbar">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isStreaming}
                onClick={() => void handleSend(chip.prompt)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-[#111622] border border-[#1C2436] hover:border-amber-500/40 text-[11px] text-[#CBD5E1] transition disabled:opacity-50 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="pt-1 flex items-center gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything, check rate of gain, or swap an exercise..."
              className="flex-1 bg-[#111622] border border-[#1C2436] rounded-xl px-4 py-3 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              aria-label="Send message"
              className="w-12 h-11 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-95 text-[#090C11] rounded-xl flex items-center justify-center transition flex-shrink-0 font-bold disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Context Rail (Visible on Desktop lg:) */}
        <div className="hidden lg:flex flex-col lg:col-span-4 space-y-4">
          <div className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-display uppercase tracking-wider text-white font-bold border-b border-[#1b2d47] pb-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              <span>Grounded RAG Context</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 bg-[#05080c] rounded-lg border border-[#1b2d47]">
                <span className="text-slate-400">Trainee ID:</span>
                <span className="text-white font-bold">{currentUser.id}</span>
              </div>
              <div className="flex justify-between p-2 bg-[#05080c] rounded-lg border border-[#1b2d47]">
                <span className="text-slate-400">Target Kcal:</span>
                <span className="text-amber-400 font-bold">2,850 kcal/day</span>
              </div>
              <div className="flex justify-between p-2 bg-[#05080c] rounded-lg border border-[#1b2d47]">
                <span className="text-slate-400">14-Day Gain Pace:</span>
                <span className="text-[#10b981] font-bold">+0.16 kg/wk (Optimal)</span>
              </div>
              <div className="flex justify-between p-2 bg-[#05080c] rounded-lg border border-[#1b2d47]">
                <span className="text-slate-400">Structural Balance:</span>
                <span className="text-cyan-300 font-bold">1.02:1 Push:Pull</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#0f1724] border border-[#1b2d47] rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-display uppercase tracking-wider text-white font-bold border-b border-[#1b2d47] pb-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Clinical Safety Guardrails</span>
            </div>
            <ul className="text-xs font-body text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Left supraspinatus: incline capped at 30°</li>
              <li>Left-Arm Leader Rule active on dumbbell sets</li>
              <li>Monday football: zero lower-body loading</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function CoachPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-[#94A3B8] text-xs bg-[#090C11] min-h-screen">
          Loading VYRA Coach...
        </div>
      }
    >
      <CoachChat />
    </Suspense>
  );
}
