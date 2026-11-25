import Link from 'next/link';
import { Car, ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/ui/footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Self-contained static header to avoid runtime cookie access during static prerender */}
      <header className="h-16 border-b border-border bg-surface px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-control bg-primary flex items-center justify-center text-white font-black text-sm">
            P
          </div>
          <span className="font-extrabold text-lg text-foreground tracking-tight">
            Park<span className="text-primary">BnB</span>
          </span>
        </Link>
        <Link href="/search" className="text-xs font-bold text-primary hover:underline">
          Search Parking
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-3 bg-surface-muted rounded-full text-primary">
          <Car className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">404 - Page Not Found</h1>
        <p className="text-xs text-muted-foreground max-w-sm">
          The parking space or page you are looking for does not exist or has been relocated.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-control shadow transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Homepage</span>
        </Link>
      </main>
      <Footer />
    </div>
  );
}
