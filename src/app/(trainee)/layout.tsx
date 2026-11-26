import { TraineeNav } from "@/components/trainee/TraineeNav";

export default function TraineeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-[100dvh] bg-[#090C11] text-slate-100 flex justify-center overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-200">
      <div className="w-full max-w-7xl min-h-[100dvh] flex flex-col lg:flex-row relative">
        <TraineeNav />
        <main className="flex-1 w-full min-w-0 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-10 pt-[env(safe-area-inset-top,0px)] px-3 sm:px-6 lg:px-8 py-3 lg:py-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
