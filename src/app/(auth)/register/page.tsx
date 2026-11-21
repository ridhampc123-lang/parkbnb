'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { registerAction } from '@/server/actions/auth-actions';
import { Car, Mail, Lock, User, Phone, AlertCircle, Loader2 } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') === 'provider' ? 'provider' : 'customer';

  const [role, setRole] = useState<'customer' | 'provider'>(defaultRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('role', role);

    const result = await registerAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      if (role === 'provider') {
        router.push('/host');
      } else {
        router.push('/account');
      }
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-md bg-surface p-8 rounded-card border border-border shadow-card space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-2 rounded-control bg-primary-soft text-primary mb-1">
          <Car className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Create your account</h1>
        <p className="text-xs text-muted-foreground">Join the verified parking marketplace in Ahmedabad</p>
      </div>

      {/* Account Role Selector */}
      <div className="grid grid-cols-2 gap-2 bg-surface-muted p-1 rounded-control border border-border">
        <button
          type="button"
          onClick={() => setRole('customer')}
          className={`py-1.5 text-xs font-semibold rounded-control transition-all ${
            role === 'customer'
              ? 'bg-surface text-primary shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Driver / Customer
        </button>
        <button
          type="button"
          onClick={() => setRole('provider')}
          className={`py-1.5 text-xs font-semibold rounded-control transition-all ${
            role === 'provider'
              ? 'bg-surface text-primary shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Parking Space Host
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-danger rounded-control text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Full Legal Name</label>
          <div className="relative">
            <User className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              name="full_name"
              required
              placeholder="e.g. Amit Shah"
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
            />
          </div>
        </div>

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
          <label className="block text-xs font-semibold text-foreground mb-1">Indian Mobile Number</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="tel"
              name="phone"
              placeholder="9876543210"
              maxLength={10}
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Password (min 6 characters)</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="password"
              name="password"
              required
              minLength={6}
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
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Account</span>}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-border/80 text-xs text-muted-foreground">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 bg-surface-muted/40">
      <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
