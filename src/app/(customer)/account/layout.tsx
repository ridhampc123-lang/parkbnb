import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MapPin, Search, ShieldCheck } from 'lucide-react';
import { UserNavbar } from '@/components/layout/user-navbar';
import { UserFooter } from '@/components/layout/user-footer';

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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
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
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Sleek Context Subheader Bar */}
        <div className="bg-surface rounded-card p-4 sm:p-5 border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-soft text-primary font-bold text-base flex items-center justify-center border border-primary/20 shrink-0">
              {session.profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-foreground">
                  Welcome back, {session.profile?.full_name?.split(' ')[0] || 'Driver'}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Driver
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-primary shrink-0" />
                <span>Ahmedabad Metro Mobility Service • {session.profile?.phone || '+91 98XXX XXXXX'}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow-xs transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Ahmedabad Parking</span>
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div>{children}</div>
      </main>

      {/* Dedicated Customer / Driver Footer */}
      <UserFooter />
    </div>
  );
}
