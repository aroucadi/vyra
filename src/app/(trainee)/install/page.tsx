"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Share, PlusSquare, Smartphone, CheckCircle, ExternalLink, ArrowRight } from "lucide-react";
import { telemetry } from "@/lib/telemetry";

export default function InstallPage() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);

      if (standalone) {
        telemetry.track("install_detected", { mode: "standalone", platform: "ios_pwa" });
      }

      const ua = window.navigator.userAgent.toLowerCase();
      const iosDevice = /iphone|ipad|ipod/.test(ua);
      setIsIOS(iosDevice);

      // Detect in-app browsers like Instagram, WhatsApp, Messenger
      const inApp = /fban|fbav|instagram|whatsapp|line|micromessenger/.test(ua);
      setIsInAppBrowser(inApp);
    }
  }, []);

  return (
    <div className="flex-1 pb-16 px-4 pt-8 max-w-[480px] mx-auto w-full space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 font-bold text-2xl tracking-tighter">
          VYRA
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Install VYRA on iPhone</h1>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Add VYRA to your home screen for full-screen performance, offline logging, and native speed.
        </p>
      </header>

      {/* State 1: Already installed in standalone mode */}
      {isStandalone ? (
        <div className="p-6 bg-slate-900 border border-emerald-500/40 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Already Installed</h2>
            <p className="text-xs text-slate-400 mt-1">
              You are currently running VYRA in standalone native app mode.
            </p>
          </div>
          <Link
            href="/today"
            className="w-full py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
          >
            <span>Open Today&apos;s Protocol</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>
      ) : (
        /* State 2: Step-by-step 3-step installation guide */
        <div className="space-y-4">
          
          {/* In-app browser warning banner */}
          {isInAppBrowser && (
            <div className="p-4 bg-amber-950/60 border border-amber-800/80 rounded-2xl text-xs space-y-1 text-amber-200">
              <div className="font-bold flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span>Open in Safari required</span>
              </div>
              <p className="text-[11px] text-amber-300/80">
                You are viewing this inside an in-app browser (WhatsApp/Instagram). Tap the three dots (•••) and select <strong>&quot;Open in Safari&quot;</strong> to install.
              </p>
            </div>
          )}

          {/* 3 Step Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                1
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Tap the Share Button</h3>
                  <Share className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-400">
                  In Safari&apos;s bottom toolbar, tap the standard iOS Share icon (square with arrow pointing up).
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-4 flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                2
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Tap &quot;Add to Home Screen&quot;</h3>
                  <PlusSquare className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-xs text-slate-400">
                  Scroll down the share sheet and select <strong>&quot;Add to Home Screen&quot;</strong>. Tap <strong>Add</strong> in the top-right corner.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-4 flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                3
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Launch from Home Screen</h3>
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-xs text-slate-400">
                  Find the VYRA icon on your home screen and open it. It now runs without browser URL bars, with instant full-screen speed.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/today"
              className="w-full py-3.5 px-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2"
            >
              <span>Continue in Safari for now →</span>
            </Link>
          </div>

        </div>
      )}

    </div>
  );
}
