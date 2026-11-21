import { getLocalStore } from '@/lib/store/marketplace-store';
import { Calendar, Car, MapPin, Clock, ShieldCheck } from 'lucide-react';

export default function AdminBookingsPage() {
  const store = getLocalStore();
  const bookings = store.getAllBookings();

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
          Operational Manifest
        </span>
        <h1 className="text-2xl font-black text-white mt-1">Driver Manifest & Reservations</h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete log of all driver bookings across Ahmedabad with verified clearance license plates.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-card p-12 text-center space-y-2">
          <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
          <h2 className="text-base font-bold text-white">No customer reservations found</h2>
          <p className="text-xs text-slate-400">All live bookings placed by drivers will appear here in real time.</p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-card border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Booking Ref</th>
                  <th className="p-3.5">Customer & Plate</th>
                  <th className="p-3.5">Spot & Complex</th>
                  <th className="p-3.5">Arrival Window</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Gross Total</th>
                  <th className="p-3.5 text-right">Commission</th>
                  <th className="p-3.5 text-right">Host Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-200">{b.booking_reference}</td>
                    <td className="p-3.5 space-y-0.5">
                      <div className="font-semibold text-white">{b.customer?.full_name || 'Driver'}</div>
                      <div className="font-mono text-primary font-bold">{b.vehicle?.registration_number || 'GJ 01 AB 1234'}</div>
                    </td>
                    <td className="p-3.5 space-y-0.5">
                      <div className="font-semibold text-slate-200">{b.space?.identifier}</div>
                      <div className="text-[11px] text-slate-400">{b.space?.property?.area}</div>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <div>{new Date(b.start_time).toLocaleDateString()}</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        b.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        b.status.includes('cancelled') ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-white">
                      ₹{b.total_amount.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-semibold text-emerald-400">
                      ₹{(b.platform_fee + b.tax_amount).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-300">
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
