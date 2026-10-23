"use client";

import React, { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchUserAction } from "@/lib/actions/auth";
import { User } from "@/lib/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CheckCircle, Shield } from "lucide-react";

export function DeveloperMenu({
  currentUser,
  children,
}: {
  currentUser: User;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const clickCountRef = useRef(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Hidden activation: 5 quick taps on version label
  const handleTrigger = () => {
    clickCountRef.current += 1;
    if (clickCountRef.current >= 5) {
      setIsOpen(true);
      clickCountRef.current = 0;
    }
  };

  const handleSwitch = (userId: string, targetPath: string) => {
    startTransition(async () => {
      await switchUserAction(userId);
      setIsOpen(false);
      router.push(targetPath);
      router.refresh();
    });
  };

  return (
    <>
      <div onClick={handleTrigger} className="cursor-pointer select-none">
        {children}
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto">
          <SheetHeader>
            <div className="flex items-center gap-2 text-emerald-400">
              <Shield className="w-4 h-4" />
              <SheetTitle>Developer & Sandbox Controls</SheetTitle>
            </div>
            <SheetDescription>
              Hidden developer tool for testing personas and system state. Not visible to end users.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 pt-2">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
              <div className="text-slate-400">Current Session User:</div>
              <div className="font-bold text-white flex items-center justify-between">
                <span>{currentUser.name} ({currentUser.role})</span>
                <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">Switch Persona:</div>
              
              <button
                type="button"
                disabled={isPending || currentUser.id === "trainee_alaa"}
                onClick={() => handleSwitch("trainee_alaa", "/today")}
                className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-left flex items-center justify-between transition"
              >
                <div>
                  <div className="text-xs font-bold text-white">Alaa (Trainee)</div>
                  <div className="text-[11px] text-slate-400">Block 1 Upper Hypertrophy · 16-Week Blueprint</div>
                </div>
                {currentUser.id === "trainee_alaa" && (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
              </button>

              <button
                type="button"
                disabled={isPending || currentUser.id === "trainer_1"}
                onClick={() => handleSwitch("trainer_1", "/roster")}
                className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-left flex items-center justify-between transition"
              >
                <div>
                  <div className="text-xs font-bold text-white">Coach Marcus, CSCS (Trainer)</div>
                  <div className="text-[11px] text-slate-400">Trainer Roster · Athlete Management</div>
                </div>
                {currentUser.id === "trainer_1" && (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
