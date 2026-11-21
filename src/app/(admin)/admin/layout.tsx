import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { ShieldCheck, FileCheck, Car, Calendar, DollarSign, LifeBuoy, AlertTriangle } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // Strict Server-Side Authorization: Admin or Super-Admin ONLY
  if (!session.isAuthenticated || session.role !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Operations Header */}
      <div className="bg-slate-900 text-white rounded-card p-6 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 font-bold text-lg flex items-center justify-center border border-purple-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Admin Operations Console</h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-500/40">
                Authorized Staff
              </span>
            </div>
            <p className="text-xs text-slate-400">Ahmedabad Two-Sided Marketplace Governance & Verification</p>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <Link
            href="/admin"
            className="px-3.5 py-2 rounded-control bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/admin/verifications"
            className="px-3.5 py-2 rounded-control bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5 text-accent" />
            <span>Verification Queue</span>
          </Link>
          <Link
            href="/admin/listings"
            className="px-3.5 py-2 rounded-control bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            All Spaces
          </Link>
          <Link
            href="/admin/bookings"
            className="px-3.5 py-2 rounded-control bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Bookings
          </Link>
          <Link
            href="/admin/payments"
            className="px-3.5 py-2 rounded-control bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Financial Ledger
          </Link>
          <Link
            href="/admin/disputes"
            className="px-3.5 py-2 rounded-control bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-rose-400" />
            <span>Support & Disputes</span>
          </Link>
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
