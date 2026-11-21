import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { Calendar, MapPin, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default async function CustomerBookingsPage() {
  const session = await getServerSession();
  const store = getLocalStore();
  const bookings = store.getBookingsByCustomer(session.user?.id || '');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">All Reservations</h2>
          <p className="text-xs text-muted-foreground">Manage your parking passes, gate directions, and receipts.</p>
        </div>
        <Link
          href="/search"
          className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-control shadow transition-colors"
        >
          Book New Parking
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-surface rounded-card p-12 border border-border text-center space-y-3">
          <div className="p-3 bg-surface-muted rounded-full w-fit mx-auto text-muted-foreground">
            <Calendar className="w-8 h-8 stroke-1" />
          </div>
          <h3 className="text-base font-bold text-foreground">No bookings found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            You do not have any active or previous parking reservations.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-control shadow transition-colors"
          >
            <span>Explore Ahmedabad Parking</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-surface rounded-card p-5 border border-border hover:border-primary/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-foreground">{b.booking_reference}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                    b.status.includes('cancelled') ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground">{b.space?.title}</h3>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{b.space?.property?.area} • Bay {b.space?.identifier}</span>
                </div>
                <div className="text-xs text-foreground font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{new Date(b.start_time).toLocaleDateString()} ({new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                <div className="text-right">
                  <div className="text-sm font-black text-foreground">₹{b.total_amount.toFixed(2)}</div>
                  <div className="text-[10px] text-muted-foreground">Total Paid (incl. GST)</div>
                </div>
                <Link
                  href={`/account/bookings/${b.id}`}
                  className="px-3 py-1.5 bg-primary-soft text-primary font-semibold text-xs rounded-control hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Pass Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
