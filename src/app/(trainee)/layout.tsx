import { TraineeNav } from "@/components/trainee/TraineeNav";

export default function TraineeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-[#0B0F17] flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-[#0F172A] border-x border-[#1E293B]/60 flex flex-col pb-24 relative shadow-2xl">
        {children}
        <TraineeNav />
      </div>
    </div>
  );
}
