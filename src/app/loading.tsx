export default function Loading() {
  return (
    <div className='min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4'>
      <div className='relative w-12 h-12'>
        <div className='w-12 h-12 rounded-full border-2 border-slate-800 border-t-blue-500 animate-spin' />
      </div>
      <div className='text-xs font-medium uppercase tracking-widest text-slate-500 animate-pulse'>
        Loading Workout Data...
      </div>
    </div>
  );
}