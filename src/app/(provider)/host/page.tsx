import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { Building, DollarSign, Calendar, ShieldCheck, ArrowRight, Plus } from 'lucide-react';

export default async function HostDashboardPage() {
  const session = await getServerSession();
  const store = getLocalStore();

  const hostSpaces = store.getSpacesByProvider(session.user?.id || '');
  const hostBookings = store.getBookingsByProvider(session.user?.id || '');

  const totalGrossRevenue = hostBookings.reduce((sum, b) => sum + b.total_amount, 0);
  const netEarnings = hostBookings.reduce((sum, b) => sum + b.provider_payout_amount, 0);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Spaces</span>
          <div className="text-2xl font-black text-foreground">{hostSpaces.filter(s => s.status === 'approved').length}</div>
          <span className="text-[11px] text-muted-foreground">{hostSpaces.length} total listed in Ahmedabad</span>
        </div>

        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Reservations</span>
          <div className="text-2xl font-black text-foreground">{hostBookings.length}</div>
          <span className="text-[11px] text-emerald-700 font-semibold">{hostBookings.filter(b => b.status === 'confirmed').length} upcoming</span>
        </div>

        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross Booking Value</span>
          <div className="text-2xl font-black text-foreground">₹{totalGrossRevenue.toFixed(2)}</div>
          <span className="text-[11px] text-muted-foreground">Before commission & taxes</span>
        </div>

        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Host Earnings</span>
          <div className="text-2xl font-black text-emerald-700">₹{netEarnings.toFixed(2)}</div>
          <span className="text-[11px] text-muted-foreground">Disbursed to verified bank account</span>
        </div>
      </div>

      {/* Grid: Space Status & Recent Reservations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Parking Spaces */}
        <div className="bg-surface rounded-card p-6 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Your Parking Slots</h3>
            <Link href="/host/spaces/new" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Space
            </Link>
          </div>

          {hostSpaces.length === 0 ? (
            <div className="text-xs text-muted-foreground py-6 text-center space-y-2">
              <p>You have not listed any parking spaces yet.</p>
              <Link
                href="/host/spaces/new"
                className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-white font-semibold rounded-control text-xs shadow"
              >
                Create First Space Listing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {hostSpaces.map((space) => (
                <div key={space.id} className="p-3.5 bg-surface-muted rounded-control flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-foreground">{space.title}</div>
                    <div className="text-muted-foreground">{space.property?.area} • Slot {space.identifier} • ₹{space.hourly_rate}/hr</div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    space.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                    space.status === 'submitted' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {space.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Drivers / Gate Manifest */}
        <div className="bg-surface rounded-card p-6 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Driver Clearance Manifest</h3>
            <Link href="/host/bookings" className="text-xs text-primary font-semibold hover:underline">
              View All
            </Link>
          </div>

          {hostBookings.length === 0 ? (
            <div className="text-xs text-muted-foreground py-6 text-center">
              No bookings received yet. Confirmed arrivals will appear here with vehicle plates for building security clearance.
            </div>
          ) : (
            <div className="space-y-3">
              {hostBookings.map((b) => (
                <div key={b.id} className="p-3.5 bg-surface-muted rounded-control flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-bold text-foreground">{b.vehicle?.registration_number || 'GJ 01 XX 0000'}</div>
                    <div className="text-muted-foreground">
                      Slot: {b.space?.identifier} • Time: {new Date(b.start_time).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700">₹{b.provider_payout_amount.toFixed(2)}</span>
                    <div className="text-[10px] text-muted-foreground font-mono">{b.booking_reference}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
