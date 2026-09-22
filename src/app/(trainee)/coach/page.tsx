"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { appStore } from "@/lib/store";
import { MessageSquare, Send, Sparkles, Dumbbell, Clock, RefreshCw, Check } from "lucide-react";
import { clsx } from "clsx";

interface Message {
  id: string;
  sender: "user" | "coach";
  text: string;
  action?: {
    label: string;
    applied?: boolean;
    onApply?: () => void;
  };
}

function CoachChat() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || "";
  const currentUser = appStore.getCurrentUser();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m_welcome",
      sender: "coach",
      text: `Ready when you are, ${currentUser.name.split(" ")[0]}. Ask about your load, request exercise swaps, or adjust for time.`,
    },
  ]);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `msg_user_${Date.now()}`,
      sender: "user",
      text: query,
    };

    let coachReply: Message;

    if (query.toLowerCase().includes("sleep") || query.toLowerCase().includes("recovery")) {
      coachReply = {
        id: `msg_coach_${Date.now()}`,
        sender: "coach",
        text: "You logged 7h 20m with 82ms HRV. Your autonomic recovery is elevated, so full training volume is supported today.",
      };
    } else if (query.toLowerCase().includes("short on time") || query.toLowerCase().includes("time")) {
      coachReply = {
        id: `msg_coach_${Date.now()}`,
        sender: "coach",
        text: "Condensed to 30 min: 2 top sets for compound lifts, superset rear delts, and drop isolations.",
        action: {
          label: "Apply 30-min condensed session",
          applied: false,
          onApply: () => alert("30-minute condensed session applied to today's workout."),
        },
      };
    } else if (query.toLowerCase().includes("swap")) {
      coachReply = {
        id: `msg_coach_${Date.now()}`,
        sender: "coach",
        text: "Incline Machine Press can swap to 30° Incline Dumbbell Press or High-to-Low Cable Flye with matching tension profiles.",
        action: {
          label: "Swap to Incline Dumbbell Press",
          applied: false,
          onApply: () => alert("Swapped to Incline Dumbbell Press for today."),
        },
      };
    } else if (query.toLowerCase().includes("weight") || query.toLowerCase().includes("why")) {
      coachReply = {
        id: `msg_coach_${Date.now()}`,
        sender: "coach",
        text: "75 kg is based on your 10-rep set at 2 RIR last Thursday. Progressive overload calls for matching reps before adding 2.5 kg.",
      };
    } else {
      coachReply = {
        id: `msg_coach_${Date.now()}`,
        sender: "coach",
        text: "Understood. Maintaining your 16-week periodization trajectory. Focus on strict scapular retraction today.",
      };
    }

    setMessages((prev) => [...prev, userMsg, coachReply]);
    setInput("");
  };

  const quickChips = [
    { label: "Why this weight?", prompt: "Why was this specific weight prescribed for my sets?" },
    { label: "Swap exercise", prompt: "I need an alternative exercise for the machine press." },
    { label: "Short on time (30m)", prompt: "I am short on time today, condense my workout to 30 min." },
    { label: "Explain my sleep score", prompt: "How does my sleep score impact my workout today?" },
  ];

  return (
    <div className="flex-1 flex flex-col pb-24 px-4 pt-6 max-w-md mx-auto w-full h-screen">
      
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">VYRA Coach</h1>
            <p className="text-[11px] text-slate-400">Adaptive Performance Concierge</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">
          ONLINE
        </span>
      </header>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={clsx(
              "flex flex-col",
              m.sender === "user" ? "items-end" : "items-start"
            )}
          >
            <div
              className={clsx(
                "p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed",
                m.sender === "user"
                  ? "bg-emerald-500 text-slate-950 font-medium rounded-br-none"
                  : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm"
              )}
            >
              {m.text}

              {m.action && (
                <button
                  type="button"
                  onClick={() => {
                    m.action?.onApply?.();
                    m.action!.applied = true;
                  }}
                  className="mt-2.5 w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-[11px] font-semibold text-emerald-400 flex items-center justify-center gap-1.5 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{m.action.label}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Contextual Quick Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 -mx-4 px-4 flex-shrink-0 no-scrollbar">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(chip.prompt)}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 transition"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="pt-2 flex items-center gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything or request a swap..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="w-11 h-11 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 rounded-xl flex items-center justify-center transition flex-shrink-0 font-bold"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}

export default function CoachPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400 text-xs">Loading Coach...</div>}>
      <CoachChat />
    </Suspense>
  );
}
