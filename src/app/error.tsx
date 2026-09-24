'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client errors to stdout/monitoring console
    console.error('Vyra Unhandled Runtime Error:', error);
  }, [error]);

  return (
    <div className='min-h-[70vh] flex items-center justify-center p-6'>
      <div className='max-w-md w-full bg-[#131B2B] border border-red-500/30 rounded-2xl p-6 shadow-xl text-center'>
        <div className='w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400'>
          <AlertTriangle className='w-7 h-7' />
        </div>

        <h1 className='text-xl font-bold text-white mb-2'>
          Session Interrupted
        </h1>
        <p className='text-sm text-slate-400 mb-6'>
          An unexpected error occurred while loading this view. Your logged reps
          and metrics remain safe in the session cache.
        </p>

        {error?.message && (
          <div className='bg-[#0B0F17] border border-slate-800 rounded-lg p-3 mb-6 text-left overflow-x-auto text-xs text-red-300/80 font-mono'>
            {error.message}
          </div>
        )}

        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <button
            onClick={() => reset()}
            className='inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-colors'
          >
            <RefreshCw className='w-4 h-4' />
            Retry View
          </button>
          <Link
            href='/'
            className='inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition-colors border border-slate-700'
          >
            <Home className='w-4 h-4' />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}