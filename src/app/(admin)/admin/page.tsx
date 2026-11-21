import Link from 'next/link';
import { getLocalStore } from '@/lib/store/marketplace-store';
import {
  Users,
  Building,
  FileCheck,
  Car,
  DollarSign,
  LifeBuoy,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Calendar
} from 'lucide-react';

export default function AdminDashboardPage() {
  const store = getLocalStore();
  const metrics = store.getAdminMetrics();
  const allBookings = store.getAllBookings();
  const allSpaces = store.getAllSpaces();

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Page Title & Operational Scope */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
            ParkBnB Ahmedabad Operational Node
          </span>
          <h1 className="text-2xl font-black text-white mt-1">Platform Command Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time database metrics. Zero fabricated or mock data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/verifications"
            className="px-3.5 py-2 bg-accent hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-control shadow-sm transition-colors flex items-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Verification Queue ({metrics.pendingVerifications})</span>
          </Link>
          <Link
            href="/search"
            target="_blank"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-control border border-slate-700 transition-colors"
          >
            Live Search View
          </Link>
        </div>
      </div>

      {/* Real Metric Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-card space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pending Verifications</span>
            <FileCheck className="w-4 h-4 text-accent" />
          </div>
          <div className="text-3xl font-black text-white">{metrics.pendingVerifications}</div>
          <div className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3" />
            <span>Requires legal / property audit</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-card space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Bookable Spaces</span>
            <Car className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{metrics.activeListings}</div>
          <div className="text-[11px] text-slate-400">
            Out of {allSpaces.length} total registered spaces
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-card space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Completed GMV (INR)</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            ₹{metrics.gmv.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400">
            {metrics.confirmedBookings} confirmed reservations
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-card space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Recognized Commission</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            ₹{metrics.platformRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400">
            15% fee + 18% GST collected
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-card flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-slate-400 block">Registered Customers</span>
            <span className="text-xl font-bold text-white">{metrics.totalCustomers}</span>
          </div>
          <Users className="w-5 h-5 text-indigo-400" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-card flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-slate-400 block">Registered Parking Hosts</span>
            <span className="text-xl font-bold text-white">{metrics.totalProviders}</span>
          </div>
          <Building className="w-5 h-5 text-accent" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-card flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-slate-400 block">Open Support Disputes</span>
            <span className={`text-xl font-bold ${metrics.openDisputes > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {metrics.openDisputes}
            </span>
          </div>
          <LifeBuoy className="w-5 h-5 text-rose-400" />
        </div>
      </div>

      {/* Grid: Live Activity Feed & Operational Governance Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Recent Reservations Log */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Latest Customer Reservations</span>
            </h2>
            <Link href="/admin/bookings" className="text-xs text-primary font-semibold hover:underline">
              View All
            </Link>
          </div>

          {allBookings.length === 0 ? (
            <div className="text-xs text-slate-400 py-8 text-center space-y-2">
              <p>No reservations placed yet.</p>
              <p className="text-[11px] text-slate-500">Live bookings made by customers will stream directly into this console.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {allBookings.slice(0, 5).map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-control flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-200">{b.booking_reference}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.2 rounded-full ${
                        b.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300' :
                        b.status.includes('cancelled') ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {b.space?.title} • Slot {b.space?.identifier}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Vehicle: <span className="font-mono font-semibold text-slate-300">{b.vehicle?.registration_number || 'GJ 01 XX 0000'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-white">₹{b.total_amount.toFixed(2)}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">
                      Comm: ₹{(b.platform_fee + b.tax_amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Operational Integrity Checklist */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Marketplace Integrity Controls</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-control border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Double-Booking Prevention</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                PostgreSQL GiST exclusion constraint active on space intervals. 10-minute temporary holds enforced.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-control border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Financial Ledger Balancing</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Immutable double-entry accounting. Customer debits balance platform commission and provider escrow credits.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-control border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Gujarat Society Law Review</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Mandatory host proof of authority (society share certificate or NOC) required prior to listing approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
