"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { User } from "@/lib/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Shield, LogIn, RefreshCw } from "lucide-react";
import { useVyraAuth } from "@/components/auth/VyraAuthProvider";
import { appStore } from "@/lib/store";

export function DeveloperMenu({
  currentUser,
  children,
}: {
  currentUser: User;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const clickCountRef = useRef(0);
  const { isAuthenticated, isAlaa, authEmail, refreshBootstrap } = useVyraAuth();

  // Hidden diagnostics menu: 5 quick taps on version label
  const handleTrigger = () => {
    clickCountRef.current += 1;
    if (clickCountRef.current >= 5) {
      setIsOpen(true);
      clickCountRef.current = 0;
    }
  };

  return (
    <>
      <div onClick={handleTrigger} className="cursor-pointer select-none">
        {children}
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto">
          <SheetHeader>
            <div className="flex items-center gap-2 text-amber-400">
              <Shield className="w-4 h-4" />
              <SheetTitle>Tenant & Sync Diagnostics</SheetTitle>
            </div>
            <SheetDescription>
              Read-only session and Firestore tenant state for the currently authenticated user.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 pt-2">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5">
              <div className="text-slate-400">Active Tenant:</div>
              <div className="font-bold text-white flex items-center justify-between">
                <span>{currentUser.name} ({currentUser.role})</span>
                <span className="text-[10px] font-mono text-amber-400">
                  {isAuthenticated ? (isAlaa ? "ALAA VERIFIED" : "CLOUD SYNCED") : "LOCAL ANON"}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 truncate">
                UID: {currentUser.id}
              </div>
              {authEmail && (
                <div className="text-[11px] font-mono text-emerald-400 truncate">
                  Email: {authEmail}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={async () => {
                    await appStore.flushCloudSync();
                    await refreshBootstrap();
                    setIsOpen(false);
                  }}
                  className="flex-1 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Force Cloud Sync</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 p-3 rounded-xl border border-amber-500/30 bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In with Firebase</span>
                </Link>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
