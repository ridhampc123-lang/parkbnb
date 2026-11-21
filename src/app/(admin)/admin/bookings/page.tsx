import { getLocalStore } from '@/lib/store/marketplace-store';
import { Calendar, MapPin, Car } from 'lucide-react';

export default function AdminBookingsPage() {
  const store = getLocalStore();
  const bookings = store.getAllBookings();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Marketplace Bookings Oversight</h2>
        <p className="text-xs text-muted-foreground">Audit reservation timelines, vehicle plates, payments, and access status.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-surface rounded-card p-12 border border-border text-center space-y-2">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">No reservations on file</h3>
        </div>
      ) : (
        <div className="bg-surface rounded-card border border-border overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-muted border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Ref</th>
                <th className="p-3.5">Listing</th>
                <th className="p-3.5">Vehicle Plate</th>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Gross Amount</th>
                <th className="p-3.5 text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-surface-muted/50 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-foreground">{b.booking_reference}</td>
                  <td className="p-3.5 font-semibold text-foreground">{b.space?.title}</td>
                  <td className="p-3.5 font-mono text-primary font-bold">{b.vehicle?.registration_number || 'GJ 01 AB 1234'}</td>
                  <td className="p-3.5 text-muted-foreground">{new Date(b.start_time).toLocaleDateString()}</td>
                  <td className="p-3.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold">₹{b.total_amount.toFixed(2)}</td>
                  <td className="p-3.5 text-right font-mono text-emerald-700 font-semibold">₹{(b.platform_fee + b.tax_amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
