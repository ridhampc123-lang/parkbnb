import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Car, Calendar, Shield, LifeBuoy, User } from 'lucide-react';

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated) {
    redirect('/login');
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Customer Header */}
      <div className="bg-surface rounded-card p-6 border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-soft text-primary font-bold text-lg flex items-center justify-center">
            {session.profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{session.profile?.full_name}</h1>
            <p className="text-xs text-muted-foreground">{session.profile?.email} • {session.profile?.phone || 'Ahmedabad, GJ'}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <Link
            href="/account"
            className="px-3.5 py-2 rounded-control bg-surface-muted hover:bg-primary-soft hover:text-primary transition-colors whitespace-nowrap"
          >
            Overview
          </Link>
          <Link
            href="/account/bookings"
            className="px-3.5 py-2 rounded-control bg-surface-muted hover:bg-primary-soft hover:text-primary transition-colors whitespace-nowrap"
          >
            My Bookings
          </Link>
          <Link
            href="/account/vehicles"
            className="px-3.5 py-2 rounded-control bg-surface-muted hover:bg-primary-soft hover:text-primary transition-colors whitespace-nowrap"
          >
            My Vehicles
          </Link>
          <Link
            href="/account/support"
            className="px-3.5 py-2 rounded-control bg-surface-muted hover:bg-primary-soft hover:text-primary transition-colors whitespace-nowrap"
          >
            Support & Disputes
          </Link>
        </nav>
      </div>

      {/* Main Content View */}
      <div>{children}</div>
    </div>
  );
}
