import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Building, PlusCircle, Search, ShieldCheck, Clock } from 'lucide-react';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { HostNavbar } from '@/components/layout/host-navbar';
import { HostFooter } from '@/components/layout/host-footer';
import { HostBottomNav } from '@/components/layout/host-bottom-nav';

export const dynamic = 'force-dynamic';

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
  const isVerified = provider?.verification_status === 'approved';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-20 md:pb-0">
      {/* Dedicated Host Operations Navbar */}
      <HostNavbar
        user={{
          id: session.user?.id || '',
          fullName: session.profile?.full_name || 'Host',
          email: session.profile?.email || '',
          role: session.role,
          verificationStatus: provider?.verification_status,
        }}
      />

      {/* Main Content View with Context Subheader */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Sleek Host Portal Context Header */}
        <div className="bg-surface rounded-card p-3.5 sm:p-5 border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-accent-soft text-accent font-bold text-sm sm:text-base flex items-center justify-center border border-accent/20 shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-lg font-bold text-foreground">
                  {provider?.business_name || session.profile?.full_name || 'Host Operations'}
                </h1>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Host
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3 h-3" />
                    Under Review
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Parking Bay Operations & Escrow Management
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-control border border-border bg-surface hover:bg-surface-muted text-foreground transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-primary" />
              <span>Driver View</span>
            </Link>

            <Link
              href="/host/spaces/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-control bg-primary hover:bg-primary-hover text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Space</span>
            </Link>
          </div>
        </div>

        {/* Main Content View */}
        <div>{children}</div>
      </main>

      {/* Dedicated Host Operations Footer on Desktop */}
      <div className="hidden md:block">
        <HostFooter />
      </div>

      {/* Mobile-First Persistent Host Bottom Navigation */}
      <HostBottomNav />
    </div>
  );
}
