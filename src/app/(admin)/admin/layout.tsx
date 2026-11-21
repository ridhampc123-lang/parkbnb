import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import {
  ShieldCheck,
  FileCheck,
  Car,
  Calendar,
  DollarSign,
  LifeBuoy,
  Users,
  LayoutDashboard,
  ExternalLink,
  LogOut,
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { getSupabaseConfigStatus } from '@/lib/supabase/config';
import { logoutAction } from '@/server/actions/auth-actions';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // Strict Server-Side Security: Reject unauthorized visitors immediately
  if (!session.isAuthenticated || session.role !== 'admin') {
    redirect('/login?error=Unauthorized%20access%20to%20admin%20operations');
  }

  const store = getLocalStore();
  const metrics = store.getAdminMetrics();
  const dbStatus = getSupabaseConfigStatus();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-lg text-white tracking-tight">
            <div className="bg-primary text-white p-2 rounded-control flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <span>Park<span className="text-accent">BnB</span></span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono px-2 py-0.5 rounded-full uppercase ml-1">
              OPS
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 text-xs font-medium">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-control text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span>Command Center</span>
          </Link>

          <Link
            href="/admin/verifications"
            className="flex items-center justify-between px-3 py-2.5 rounded-control text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-4 h-4 text-accent" />
              <span>Verification Queue</span>
            </div>
            {metrics.pendingVerifications > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {metrics.pendingVerifications}
              </span>
            )}
          </Link>

          <Link
            href="/admin/listings"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-control text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <Car className="w-4 h-4 text-emerald-400" />
            <span>All Parking Spaces</span>
          </Link>

          <Link
            href="/admin/bookings"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-control text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Driver Manifest & Bookings</span>
          </Link>

          <Link
            href="/admin/payments"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-control text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Financial Ledger & Escrow</span>
          </Link>

          <Link
            href="/admin/disputes"
            className="flex items-center justify-between px-3 py-2.5 rounded-control text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <LifeBuoy className="w-4 h-4 text-rose-400" />
              <span>Disputes & Incidents</span>
            </div>
            {metrics.openDisputes > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {metrics.openDisputes}
              </span>
            )}
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-control text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>User & Host Accounts</span>
          </Link>
        </nav>

        {/* Sidebar Footer: Role switch & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900/50">
          <div className="text-[11px] text-slate-400">
            <div className="font-semibold text-slate-200">{session.profile?.full_name}</div>
            <div className="font-mono text-slate-500">{session.profile?.email}</div>
            <div className="mt-1 flex items-center gap-1.5 text-purple-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Role: Administrator</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <Link
              href="/"
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Marketplace View</span>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Sign out of Admin session"
                className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Exit</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Command Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Top Diagnostic Health Bar */}
        <header className="h-14 bg-slate-900/80 border-b border-slate-800 px-6 flex items-center justify-between text-xs backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dbStatus.isConfigured ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${dbStatus.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-semibold text-slate-200">
              {dbStatus.isConfigured ? 'Live Cloud Supabase Connected' : 'Local Concurrency Engine Active'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Ahmedabad Regional Node (Asia/Kolkata)</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <div className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>PostgreSQL 15</span>
            </div>
            <div className="flex items-center gap-1">
              {dbStatus.hasRazorpay ? (
                <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Razorpay Active</span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Gateway Ready</span>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
