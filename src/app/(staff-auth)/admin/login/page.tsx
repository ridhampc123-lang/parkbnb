'use client';

import { useState } from 'react';
import Link from 'next/link';
import { adminLoginAction } from '@/server/actions/admin-actions';
import {
  ShieldCheck,
  Lock,
  Mail,
  Car,
  AlertCircle,
  Loader2,
  ExternalLink,
  KeyRound
} from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFillDemo() {
    setEmail('admin@parkbnb.in');
    setPassword('Admin@2026!');
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const result = await adminLoginAction(null, formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 font-bold text-2xl text-white tracking-tight">
            <div className="bg-primary text-white p-2 rounded-control flex items-center justify-center shadow-md">
              <Car className="w-5 h-5" />
            </div>
            <span>Park<span className="text-accent">BnB</span></span>
            <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono px-2 py-0.5 rounded-full uppercase ml-1">
              OPS
            </span>
          </div>
          <h1 className="text-xl font-black text-white">Administrator Command Console</h1>
          <p className="text-xs text-slate-400">
            Ahmedabad Regional Operations Node • Restricted Access
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-card p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Privileged Staff Authentication</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              SHA-256 Validated
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-control text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@parkbnb.in"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-control text-slate-200 focus:outline-none focus:border-primary font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Access Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-control text-slate-200 focus:outline-none focus:border-primary font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Staff Role...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authenticate & Enter Console</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800/60 border border-slate-800 rounded-control text-[11px] text-slate-300 font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-accent" />
              <span>Fill Admin Demo Credentials (admin@parkbnb.in)</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-3">
          <Link href="/" className="hover:text-slate-300 flex items-center gap-1 transition-colors">
            <ExternalLink className="w-3 h-3" />
            <span>Return to Public Marketplace</span>
          </Link>
          <span>•</span>
          <Link href="/login" className="hover:text-slate-300 transition-colors">
            Customer Login
          </Link>
        </div>
      </div>
    </div>
  );
}
