import Link from 'next/link';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { Users, Building, FileCheck, Car, DollarSign, LifeBuoy, ArrowRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const store = getLocalStore();
  const metrics = store.getAdminMetrics();

  return (
    <div className="space-y-6">
      {/* Real Database Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Verifications</span>
          <div className="text-2xl font-black text-amber-600">{metrics.pendingVerifications}</div>
          <Link href="/admin/verifications" className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1">
            Review Queue <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Bookable Spaces</span>
          <div className="text-2xl font-black text-foreground">{metrics.activeListings}</div>
          <span className="text-[11px] text-muted-foreground">In Ahmedabad pilot areas</span>
        </div>

        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross Booking Value (GMV)</span>
          <div className="text-2xl font-black text-foreground">₹{metrics.gmv.toFixed(2)}</div>
          <span className="text-[11px] text-muted-foreground">{metrics.confirmedBookings} confirmed reservations</span>
        </div>

        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform Revenue (Commission)</span>
          <div className="text-2xl font-black text-emerald-700">₹{metrics.platformRevenue.toFixed(2)}</div>
          <span className="text-[11px] text-muted-foreground">Commission + GST collected</span>
        </div>
      </div>

      {/* Grid: Quick Ops Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-card p-6 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-primary" />
              <span>Pending Listing Verifications</span>
            </h3>
            <Link href="/admin/verifications" className="text-xs text-primary font-semibold hover:underline">
              View Queue
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Review submitted property deeds, society NOC documents, and street photos before publishing.
          </p>
        </div>

        <div className="bg-surface rounded-card p-6 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <LifeBuoy className="w-4 h-4 text-rose-500" />
              <span>Open Support & Access Cases</span>
            </h3>
            <Link href="/admin/disputes" className="text-xs text-primary font-semibold hover:underline">
              Arbitration
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.openDisputes} open customer support tickets requiring staff intervention or refund review.
          </p>
        </div>
      </div>
    </div>
  );
}
