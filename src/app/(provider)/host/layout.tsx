import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Building, LayoutDashboard, PlusCircle, Calendar, DollarSign, ShieldAlert } from 'lucide-react';
import { getLocalStore } from '@/lib/store/marketplace-store';

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated) {
    redirect('/login');
  }

  const store = getLocalStore();
  const provider = store.getProviderProfile(session.user?.id || '');

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Host Portal Header */}
      <div className="bg-surface rounded-card p-6 border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent-soft text-accent font-bold text-lg flex items-center justify-center">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">Host Operations Portal</h1>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                provider?.verification_status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {provider?.verification_status || 'Draft'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{session.profile?.full_name} • Ahmedabad Parking Supply</p>
          </div>
        </div>

        {/* Action & Nav Links */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <Link
            href="/host"
            className="px-3.5 py-2 rounded-control bg-surface-muted hover:bg-primary-soft hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/host/spaces"
            className="px-3.5 py-2 rounded-control bg-surface-muted hover:bg-primary-soft hover:text-primary transition-colors"
          >
            My Spaces
          </Link>
          <Link
            href="/host/bookings"
            className="px-3.5 py-2 rounded-control bg-surface-muted hover:bg-primary-soft hover:text-primary transition-colors"
          >
            Manifest & Bookings
          </Link>
          <Link
            href="/host/earnings"
            className="px-3.5 py-2 rounded-control bg-surface-muted hover:bg-primary-soft hover:text-primary transition-colors"
          >
            Earnings & Ledger
          </Link>
          <Link
            href="/host/spaces/new"
            className="px-3.5 py-2 rounded-control bg-primary hover:bg-primary-hover text-white shadow-sm transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>List Space</span>
          </Link>
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
