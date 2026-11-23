import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { Car, Clock, CheckCircle2, Shield, Lock, AlertCircle } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function HostBookingsPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const store = getLocalStore();
  const bookings = store.getBookingsByProvider(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Driver Clearance Manifest</h2>
          <p className="text-xs text-muted-foreground">
            Privacy-safe manifest for security guards and gate entry. Drivers are verified by plate number and privacy reference.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-muted rounded-control border border-border text-xs text-muted-foreground">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span>Customer Contact Privacy Active</span>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-surface rounded-card p-12 border border-border text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-surface-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Car className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-foreground">No bookings on file</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            As soon as drivers reserve your parking spaces, their license plates and clearance codes will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-card border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-muted border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Booking Reference</th>
                  <th className="p-3.5">Driver Reference</th>
                  <th className="p-3.5">Driver Name</th>
                  <th className="p-3.5">Vehicle Plate</th>
                  <th className="p-3.5">Assigned Slot</th>
                  <th className="p-3.5">Arrival Window</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-surface-muted/50 transition-colors">
                    {/* Booking Reference */}
                    <td className="p-3.5 font-mono font-bold text-foreground">
                      {b.booking_reference}
                    </td>

                    {/* Booking Customer Privacy Ref */}
                    <td className="p-3.5 font-mono text-primary font-bold">
                      {b.booking_customer_reference || 'PBN-REF-CONFIRMED'}
                    </td>

                    {/* Masked Display Name */}
                    <td className="p-3.5 font-semibold text-foreground">
                      {b.customer_display_name || 'Valued Customer'}
                    </td>

                    {/* Vehicle Plate */}
                    <td className="p-3.5 font-mono font-bold text-primary">
                      {b.vehicle?.registration_number || 'Cleared Gate Plate'}
                    </td>

                    {/* Slot */}
                    <td className="p-3.5 font-semibold text-foreground">
                      {b.space?.identifier}
                    </td>

                    {/* Time */}
                    <td className="p-3.5 text-muted-foreground">
                      {new Date(b.start_time).toLocaleDateString()}{' '}
                      {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : b.status === 'active'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Payout */}
                    <td className="p-3.5 text-right font-bold text-emerald-700 font-mono">
                      ₹{b.provider_payout_amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
