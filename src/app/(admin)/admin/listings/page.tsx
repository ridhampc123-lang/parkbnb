import { getLocalStore } from '@/lib/store/marketplace-store';
import { MapPin, ShieldCheck, Zap } from 'lucide-react';

export default function AdminListingsPage() {
  const store = getLocalStore();
  const spaces = store.getAllSpaces();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">All Parking Listings</h2>
        <p className="text-xs text-muted-foreground">Marketplace inventory oversight, status controls, and provider attribution.</p>
      </div>

      <div className="bg-surface rounded-card border border-border overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-surface-muted border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3.5">Listing Title</th>
              <th className="p-3.5">Area</th>
              <th className="p-3.5">Identifier</th>
              <th className="p-3.5">Rate</th>
              <th className="p-3.5">EV Ready</th>
              <th className="p-3.5">Verification Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {spaces.map((s) => (
              <tr key={s.id} className="hover:bg-surface-muted/50 transition-colors">
                <td className="p-3.5 font-bold text-foreground">{s.title}</td>
                <td className="p-3.5 text-muted-foreground">{s.property?.area}</td>
                <td className="p-3.5 font-mono font-semibold">{s.identifier}</td>
                <td className="p-3.5 font-mono font-bold text-foreground">₹{s.hourly_rate}/hr</td>
                <td className="p-3.5">
                  {s.has_ev_charging ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1"><Zap className="w-3 h-3" /> Yes</span>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </td>
                <td className="p-3.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    s.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
