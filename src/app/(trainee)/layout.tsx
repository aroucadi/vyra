import { TraineeNav } from "@/components/trainee/TraineeNav";

export default function TraineeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-[100dvh] bg-[#0B0F17] flex justify-center">
      <div className="w-full max-w-[480px] min-h-[100dvh] bg-[#0B0F17] border-x border-[#1E293B]/60 flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom,0px))] pt-[env(safe-area-inset-top,0px)] relative shadow-2xl">
        {children}
        <TraineeNav />
      </div>
    </div>
  );
}
