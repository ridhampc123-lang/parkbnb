import { getSupabaseConfigStatus } from '@/lib/supabase/config';
import { Database, CheckCircle2, AlertCircle } from 'lucide-react';

export function StatusBanner() {
  const status = getSupabaseConfigStatus();

  return (
    <div className="bg-slate-900 text-white text-xs py-2 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.isConfigured ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${status.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="font-medium">
            {status.isConfigured ? 'Supabase Connected (Live PostgreSQL & RLS)' : 'Local Engine Mode (Active Schema & Concurrency Guards)'}
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden sm:inline">Ahmedabad Pilot Network (Asia/Kolkata)</span>
        </div>

        <div className="flex items-center gap-3 text-slate-300">
          <div className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>DB: {status.hasUrl ? 'Cloud' : 'Local'}</span>
          </div>
          <div className="flex items-center gap-1">
            {status.hasRazorpay ? (
              <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Razorpay Live</span>
            ) : (
              <span className="flex items-center gap-1 text-amber-300"><AlertCircle className="w-3 h-3" /> Gateway Test/Ready</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
