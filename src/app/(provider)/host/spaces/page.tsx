import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { PlusCircle, MapPin, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default async function HostSpacesPage() {
  const session = await getServerSession();
  const store = getLocalStore();
  const spaces = store.getSpacesByProvider(session.user?.id || '');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">My Listed Parking Spaces</h2>
          <p className="text-xs text-muted-foreground">Manage your spaces, review verification feedback, and set availability.</p>
        </div>
        <Link
          href="/host/spaces/new"
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow transition-colors flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Parking Space</span>
        </Link>
      </div>

      {spaces.length === 0 ? (
        <div className="bg-surface rounded-card p-12 border border-border text-center space-y-3">
          <h3 className="text-base font-bold text-foreground">No parking spaces listed</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            List your unused residential or commercial parking slot to start earning.
          </p>
          <Link
            href="/host/spaces/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-control shadow"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>List Space Now</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((s) => (
            <div key={s.id} className="bg-surface rounded-card border border-border p-5 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-primary">{s.property?.area || 'Ahmedabad'}</span>
                  <h3 className="text-base font-bold text-foreground mt-0.5">{s.title}</h3>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                  s.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                  s.status === 'submitted' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                }`}>
                  {s.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Slot Identifier:</span>
                  <span className="font-bold text-foreground font-mono">{s.identifier}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hourly Rate:</span>
                  <span className="font-bold text-foreground font-mono">₹{s.hourly_rate} / hr</span>
                </div>
                <div className="flex justify-between">
                  <span>Parking Type:</span>
                  <span className="capitalize font-medium text-foreground">{s.parking_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>EV Charger:</span>
                  <span className="font-medium text-foreground">{s.has_ev_charging ? 'Yes (AC Type 2)' : 'No'}</span>
                </div>
              </div>

              {s.status === 'submitted' && (
                <div className="p-2.5 bg-amber-50 rounded-control border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>Pending review by Admin Operations. Listing will go live upon verification of property rights.</span>
                </div>
              )}

              {s.status === 'approved' && (
                <div className="p-2.5 bg-emerald-50 rounded-control border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>Active & Verified. This space is publicly bookable by drivers in Ahmedabad.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
