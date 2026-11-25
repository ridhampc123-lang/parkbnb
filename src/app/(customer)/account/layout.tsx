import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MapPin, Search, ShieldCheck } from 'lucide-react';
import { UserNavbar } from '@/components/layout/user-navbar';
import { UserFooter } from '@/components/layout/user-footer';
import { CustomerBottomNav } from '@/components/layout/customer-bottom-nav';
import { getLocalStore } from '@/lib/store/marketplace-store';

export const dynamic = 'force-dynamic';

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated) {
    redirect('/login');
  }

  const store = getLocalStore();
  const notifications = store.getNotificationsByUser(session.user?.id || '');
  const unreadAlerts = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-20 md:pb-0">
      {/* Dedicated Customer / Driver Portal Navbar */}
      <UserNavbar
        user={{
          id: session.user?.id || '',
          fullName: session.profile?.full_name || 'Driver',
          email: session.profile?.email || '',
          role: session.role,
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Sleek Context Subheader Bar */}
        <div className="bg-surface rounded-card p-3.5 sm:p-5 border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary-soft text-primary font-bold text-sm sm:text-base flex items-center justify-center border border-primary/20 shrink-0">
              {session.profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-lg font-bold text-foreground">
                  Welcome, {session.profile?.full_name?.split(' ')[0] || 'Driver'}
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-primary shrink-0" />
                <span>Ahmedabad Metro Mobility Service</span>
              </p>
            </div>
          </div>

          {/* Quick Search Action */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow-xs transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Ahmedabad Parking</span>
            </Link>
          </div>
        </div>

        {/* Content View */}
        <div>{children}</div>
      </main>

      {/* Dedicated Customer / Driver Footer on Desktop */}
      <div className="hidden md:block">
        <UserFooter />
      </div>

      {/* Mobile-First Persistent Bottom Navigation */}
      <CustomerBottomNav unreadAlertsCount={unreadAlerts} />
    </div>
  );
}
