import Link from "next/link";
import { Dumbbell, ArrowLeft, BookOpen, Calendar } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-center items-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6 text-center shadow-2xl backdrop-blur-md">
        
        {/* Eyebrow & Biomechanical Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
          <Dumbbell className="w-7 h-7" />
        </div>

        {/* Hero Content */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
            Status 404 · Unmapped Route
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">Movement Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            The session, protocol, or route you are looking for has been moved or does not exist in the active blueprint.
          </p>
        </div>

        {/* Action Buttons (Obeying 44x44px touch targets) */}
        <div className="space-y-2.5 pt-2">
          <Link
            href="/today"
            className="w-full h-11 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
          >
            <Calendar className="w-4 h-4" />
            <span>Return to Today&apos;s Workout</span>
          </Link>

          <Link
            href="/exercises"
            className="w-full h-11 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Browse Movement Library (6,554 Movements)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}