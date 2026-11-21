'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="p-3 bg-red-50 text-danger rounded-full">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
      <p className="text-xs text-muted-foreground max-w-sm">
        An unexpected error occurred while processing your request. Please try again.
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-control shadow transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="px-4 py-2 bg-surface-muted hover:bg-surface border border-border text-foreground text-xs font-semibold rounded-control transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
