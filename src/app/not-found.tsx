import Link from 'next/link';
import { Dumbbell, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className='min-h-[70vh] flex items-center justify-center p-6'>
      <div className='max-w-md w-full bg-[#131B2B] border border-slate-800 rounded-2xl p-8 shadow-xl text-center'>
        <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400'>
          <Dumbbell className='w-8 h-8' />
        </div>

        <h1 className='text-2xl font-bold text-white mb-2'>Page Not Found</h1>
        <p className='text-sm text-slate-400 mb-6'>
          The workout session, athlete profile, or protocol you are looking for
          does not exist or has been moved.
        </p>

        <div className='flex justify-center'>
          <Link
            href='/'
            className='inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/20'
          >
            <Home className='w-4 h-4' />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}