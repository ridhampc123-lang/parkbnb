import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { Car, Calendar, MapPin, ArrowRight, ShieldCheck, Plus, Lock, UserCheck } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function CustomerDashboardPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const store = getLocalStore();
  const customerBookings = store.getBookingsByCustomer(session.user.id);
  const customerVehicles = store.getVehiclesByCustomer(session.user.id);
  const profile = session.profile;

  const nextBooking = customerBookings.find(b => b.status === 'confirmed' || b.status === 'active');

  return (
    <div className="space-y-6">
      {/* Customer Identity & Privacy Card */}
      <div className="bg-surface rounded-card p-5 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              Verified Driver Account
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
              Active
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground mt-1">{profile?.full_name || 'My Account'}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your unique ParkBnB Customer ID keeps your private contact details protected from parking owners.
          </p>
        </div>

        <div className="bg-surface-muted p-3.5 rounded-control border border-border/80 text-right sm:text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block flex items-center gap-1 justify-end">
            <Lock className="w-3 h-3 text-primary" /> Permanent Customer ID
          </span>
          <span className="font-mono text-sm font-extrabold text-primary">
            {profile?.customer_public_id || 'PBN-C-PENDING'}
          </span>
        </div>
      </div>

      {/* Active / Next Booking Spotlight */}
      {nextBooking ? (
        <div className="bg-gradient-to-r from-primary-soft/80 to-surface rounded-card p-6 border border-primary/20 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Confirmed Reservation
            </span>
            <span className="font-mono text-xs font-bold text-foreground">{nextBooking.booking_reference}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">{nextBooking.space?.title || 'Parking Space'}</h2>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{nextBooking.space?.property?.area || 'Ahmedabad'} • Slot {nextBooking.space?.identifier}</span>
              </div>
              <div className="text-xs text-foreground font-semibold mt-2">
                Time: {new Date(nextBooking.start_time).toLocaleDateString()} ({new Date(nextBooking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(nextBooking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </div>
            </div>

            <Link
              href={`/account/bookings/${nextBooking.id}`}
              className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow transition-colors flex items-center gap-1.5 w-fit"
            >
              <span>View Access Instructions & Pass</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-card p-8 border border-border text-center space-y-3">
          <div className="p-3 bg-surface-muted rounded-full w-fit mx-auto text-muted-foreground">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">No upcoming bookings</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Reserve parking before arriving at your next destination in Ahmedabad.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-control shadow transition-colors"
          >
            <span>Find Parking in Ahmedabad</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Grid: Saved Vehicles & Recent Bookings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicles Box */}
        <div className="bg-surface rounded-card p-6 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-4 h-4 text-primary" />
              <span>Registered Vehicles</span>
            </h3>
            <Link href="/account/vehicles" className="text-xs text-primary font-semibold hover:underline">
              Manage
            </Link>
          </div>

          {customerVehicles.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center space-y-2">
              <p>No vehicles added yet.</p>
              <Link
                href="/account/vehicles"
                className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add your car or bike
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {customerVehicles.map(v => (
                <div key={v.id} className="p-3 bg-surface-muted rounded-control flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-foreground">{v.registration_number}</span>
                    <span className="text-muted-foreground ml-2 capitalize">({v.vehicle_type.replace(/_/g, ' ')})</span>
                  </div>
                  {v.is_default && (
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Booking History */}
        <div className="bg-surface rounded-card p-6 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Recent Bookings</span>
            </h3>
            <Link href="/account/bookings" className="text-xs text-primary font-semibold hover:underline">
              View All
            </Link>
          </div>

          {customerBookings.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center">
              Your completed and cancelled reservations will appear here.
            </div>
          ) : (
            <div className="space-y-2">
              {customerBookings.slice(0, 3).map(b => (
                <Link
                  key={b.id}
                  href={`/account/bookings/${b.id}`}
                  className="p-3 bg-surface-muted hover:bg-surface border border-transparent hover:border-border rounded-control flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="font-semibold text-foreground">{b.space?.title || 'Parking Space'}</div>
                    <div className="text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString()} • ₹{b.total_amount.toFixed(2)}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : b.status.includes('cancelled')
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
