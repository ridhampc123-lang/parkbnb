import Link from 'next/link';
import { Search, MapPin, Calendar, Clock, ShieldCheck, ArrowRight, CheckCircle2, Building, Car, Sparkles, AlertCircle } from 'lucide-react';
import { getLocalStore } from '@/lib/store/marketplace-store';

export default function HomePage() {
  const store = getLocalStore();
  const approvedSpaces = store.getApprovedPublicSpaces();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Destination Search */}
      <section className="relative bg-gradient-to-b from-primary-soft/40 via-background to-background pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft text-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Active in 14+ Indian Metro Corridors</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Your parking spot, <br className="hidden sm:inline" />
            <span className="text-primary underline decoration-accent decoration-4 underline-offset-8">before you arrive.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
            Find and reserve verified parking across Mumbai, Delhi NCR, Bengaluru, Pune, Hyderabad, Chennai, Ahmedabad, and major Indian cities. Guaranteed spot, transparent pricing, zero cruising.
          </p>

          {/* Search Module */}
          <div className="max-w-4xl mx-auto mt-8 bg-surface p-4 sm:p-5 rounded-card shadow-card border border-border text-left">
            <form action="/search" method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Destination */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  City, Corridor or Destination in India
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-primary absolute left-3 top-3" />
                  <input
                    type="text"
                    name="destination"
                    placeholder="e.g. BKC Mumbai, Cyber City Delhi, Koramangala, SG Highway"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Arrival Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <input
                    type="date"
                    name="start_date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  />
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Arrival Time
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <input
                    type="time"
                    name="start_time"
                    defaultValue="10:00"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full h-[38px] flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-control shadow-sm transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Find Parking</span>
                </button>
              </div>
            </form>

            {/* Quick Metro Hub Chips */}
            <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Explore Metros:</span>
              <Link href="/search?city=Mumbai" className="px-2.5 py-1 bg-surface-muted hover:bg-primary-soft hover:text-primary rounded-control transition-colors font-medium">
                Mumbai (BKC)
              </Link>
              <Link href="/search?city=Delhi+NCR" className="px-2.5 py-1 bg-surface-muted hover:bg-primary-soft hover:text-primary rounded-control transition-colors font-medium">
                Delhi NCR (Cyber City)
              </Link>
              <Link href="/search?city=Bengaluru" className="px-2.5 py-1 bg-surface-muted hover:bg-primary-soft hover:text-primary rounded-control transition-colors font-medium">
                Bengaluru (Koramangala)
              </Link>
              <Link href="/search?city=Pune" className="px-2.5 py-1 bg-surface-muted hover:bg-primary-soft hover:text-primary rounded-control transition-colors font-medium">
                Pune (Hinjewadi)
              </Link>
              <Link href="/search?city=Hyderabad" className="px-2.5 py-1 bg-surface-muted hover:bg-primary-soft hover:text-primary rounded-control transition-colors font-medium">
                Hyderabad (HITEC City)
              </Link>
              <Link href="/search?city=Ahmedabad" className="px-2.5 py-1 bg-surface-muted hover:bg-primary-soft hover:text-primary rounded-control transition-colors font-medium">
                Ahmedabad (SBR & Prahlad Nagar)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Inventory Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-wider">Live & Verified Spaces</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">Available parking across India</h2>
            <p className="text-sm text-muted-foreground mt-1">Only verified listings with legal host authority are published.</p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            <span>View all spaces on map</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedSpaces.map((space) => (
            <div
              key={space.id}
              className="group bg-surface rounded-card border border-border overflow-hidden hover:shadow-hover transition-all flex flex-col"
            >
              {/* Image Preview */}
              <div className="relative h-48 bg-surface-muted overflow-hidden">
                {space.photos && space.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={space.photos[0].storage_path}
                    alt={space.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Car className="w-12 h-12 stroke-[1.5]" />
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-control text-xs font-bold text-foreground shadow-sm">
                  ₹{space.hourly_rate} / hr
                </div>
                {space.has_ev_charging && (
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2 py-0.5 rounded-control text-[11px] font-semibold flex items-center gap-1 shadow-sm">
                    ⚡ EV Charging
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-xs font-medium text-primary flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{space.property?.area}, {space.property?.city || 'India'}</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {space.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {space.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground capitalize font-medium">
                    {space.parking_type} • {space.identifier}
                  </span>
                  <Link
                    href={`/parking/${space.id}`}
                    className="px-3 py-1.5 bg-primary-soft text-primary font-semibold rounded-control hover:bg-primary hover:text-white transition-colors"
                  >
                    Reserve Spot
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works in 3 Simple Steps */}
      <section className="bg-surface-muted/60 py-16 px-4 sm:px-6 lg:px-8 border-y border-border">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Simple & Transparent</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">How ParkBnB works</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
              From finding a spot near your meeting in Prahlad Nagar to parking seamlessly without gate disputes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-surface p-6 rounded-card border border-border shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary-soft text-primary font-bold text-base flex items-center justify-center">
                1
              </div>
              <h3 className="text-base font-bold text-foreground">Find & Compare</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enter your destination and arrival hours. Browse real photos, verify vehicle compatibility (SUV, Sedan, EV), and check verified security features.
              </p>
            </div>

            <div className="bg-surface p-6 rounded-card border border-border shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-full bg-accent-soft text-accent font-bold text-base flex items-center justify-center">
                2
              </div>
              <h3 className="text-base font-bold text-foreground">Hold & Pay Securely</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A 10-minute hold prevents double bookings. View an itemized price breakdown (base rate + GST) and pay via UPI, Card, or Net Banking.
              </p>
            </div>

            <div className="bg-surface p-6 rounded-card border border-border shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 font-bold text-base flex items-center justify-center">
                3
              </div>
              <h3 className="text-base font-bold text-foreground">Arrive & Park</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Instant confirmation provides precise gate directions, security guard clearance notes, and slot number. No cruising or street bargaining.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Provider Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-primary text-white rounded-card p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-accent text-xs font-semibold uppercase tracking-wider">
              <Building className="w-3.5 h-3.5" />
              <span>For Property Owners & Commercial Operators</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Turn unused parking capacity into predictable earnings.
            </h2>
            <p className="text-sm text-primary-soft leading-relaxed">
              Have an allotted society parking spot empty during office hours or commercial capacity after 7 PM? List with verified legal authority and earn directly into your bank account.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/list-your-space"
                className="px-5 py-2.5 bg-accent hover:bg-amber-500 text-slate-900 font-bold text-sm rounded-control shadow transition-colors"
              >
                List Your Space
              </Link>
              <Link
                href="/safety-and-trust"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-control transition-colors"
              >
                Verification Criteria
              </Link>
            </div>
          </div>

          <div className="bg-white/10 p-6 rounded-card border border-white/20 text-xs space-y-3 max-w-xs w-full">
            <div className="font-bold text-sm text-accent">Host Protections</div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>Verified customer identity & registered vehicle plates</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>Set custom availability schedules & blockout dates</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>Automated direct payouts to your Indian bank account</span>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full border-t border-border">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Clear Answers</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">Frequently asked questions</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-surface p-5 rounded-card border border-border">
            <h3 className="text-sm font-bold text-foreground">Can I list any apartment parking slot in Ahmedabad?</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              No. In accordance with Gujarat Cooperative Housing Society regulations and local association rules, providers must possess documented legal authority or society NOC before listing. Our Admin Operations team audits all property verification documents before a listing is approved.
            </p>
          </div>

          <div className="bg-surface p-5 rounded-card border border-border">
            <h3 className="text-sm font-bold text-foreground">What happens if another vehicle is parked in my reserved spot?</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              You can instantly trigger an access dispute directly from your active booking screen. Our operations team verifies the report with the host and immediately issues an alternative nearby spot or a 100% refund.
            </p>
          </div>

          <div className="bg-surface p-5 rounded-card border border-border">
            <h3 className="text-sm font-bold text-foreground">How does the 10-minute booking hold prevent double bookings?</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              When you begin checkout, our PostgreSQL booking engine reserves a temporary hold row and locks the time range. Other drivers attempting to reserve the same time slot are prevented from checking out until your hold expires or completes payment.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
