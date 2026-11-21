import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { Car, Clock, CheckCircle2, Shield } from 'lucide-react';

export default async function HostBookingsPage() {
  const session = await getServerSession();
  const store = getLocalStore();
  const bookings = store.getBookingsByProvider(session.user?.id || '');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Driver Clearance Manifest</h2>
        <p className="text-xs text-muted-foreground">
          Verified vehicles cleared for gate entry at your property. Security attendants can verify license plates against this manifest.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-surface rounded-card p-12 border border-border text-center space-y-2">
          <h3 className="text-base font-bold text-foreground">No bookings on file</h3>
          <p className="text-xs text-muted-foreground">As soon as drivers reserve your spaces, their license plates will appear here.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-muted border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Booking Ref</th>
                  <th className="p-3.5">Vehicle Plate</th>
                  <th className="p-3.5">Assigned Slot</th>
                  <th className="p-3.5">Arrival Window</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-foreground">{b.booking_reference}</td>
                    <td className="p-3.5 font-mono font-bold text-primary">{b.vehicle?.registration_number || 'GJ 01 AB 1234'}</td>
                    <td className="p-3.5 font-semibold text-foreground">{b.space?.identifier}</td>
                    <td className="p-3.5 text-muted-foreground">
                      {new Date(b.start_time).toLocaleDateString()} {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-foreground">
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
