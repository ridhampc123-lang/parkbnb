'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/server/actions/auth-actions';
import { Car, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      if (result.role === 'admin') {
        router.push('/admin');
      } else if (result.role === 'provider') {
        router.push('/host');
      } else {
        router.push('/account');
      }
      router.refresh();
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 bg-surface-muted/40">
      <div className="w-full max-w-md bg-surface p-8 rounded-card border border-border shadow-card space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-2 rounded-control bg-primary-soft text-primary mb-1">
            <Car className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Sign in to ParkBnB</h1>
          <p className="text-xs text-muted-foreground">Access your bookings, vehicles, or provider dashboard</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-danger rounded-control text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <input
                type="email"
                name="email"
                required
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-foreground">Password</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-control shadow transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-border/80 text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
