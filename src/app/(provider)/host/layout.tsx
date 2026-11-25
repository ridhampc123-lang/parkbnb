import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Building, PlusCircle, Search, ShieldCheck, Clock } from 'lucide-react';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { HostNavbar } from '@/components/layout/host-navbar';
import { HostFooter } from '@/components/layout/host-footer';

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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
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
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Sleek Host Portal Context Header */}
        <div className="bg-surface rounded-card p-4 sm:p-5 border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-soft text-accent font-bold text-base flex items-center justify-center border border-accent/20 shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-foreground">
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
              <p className="text-xs text-muted-foreground mt-0.5">
                Pan-India Parking Supply Corridor • Escrow Payouts Active
              </p>
            </div>
          </div>

          {/* Action Buttons with Proper Alignment */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-control border border-border bg-surface hover:bg-surface-muted text-foreground transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-primary" />
              <span>Driver View</span>
            </Link>

            <Link
              href="/host/spaces/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-control bg-primary hover:bg-primary-hover text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ List New Space</span>
            </Link>
          </div>
        </div>

        {/* Main Content View */}
        <div>{children}</div>
      </main>

      {/* Dedicated Host Operations Footer */}
      <HostFooter />
    </div>
  );
}
