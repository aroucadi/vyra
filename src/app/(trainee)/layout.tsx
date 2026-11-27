import { TraineeNav } from "@/components/trainee/TraineeNav";

export default function TraineeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-[100dvh] bg-[#090C11] text-slate-100 flex justify-center overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-200">
      {/* iOS Safe Area Status Bar Glass Shield for Standalone PWA */}
      <div
        aria-hidden="true"
        className="lg:hidden fixed top-0 left-0 right-0 h-[env(safe-area-inset-top,0px)] bg-[#090C11]/85 backdrop-blur-xl z-50 pointer-events-none"
      />

      <div className="w-full max-w-7xl min-h-[100dvh] flex flex-col lg:flex-row relative">
        <TraineeNav />
        <main className="flex-1 w-full min-w-0 pb-[calc(5.75rem+max(env(safe-area-inset-bottom,0px),16px))] lg:pb-10 pt-[max(env(safe-area-inset-top,0px),12px)] lg:pt-6 px-3 sm:px-6 lg:px-8 py-3 lg:py-6 overflow-x-hidden native-scroll-stage">
          {children}
        </main>
      </div>
    </div>
  );
}
