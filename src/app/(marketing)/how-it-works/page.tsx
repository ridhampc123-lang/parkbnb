import Link from 'next/link';
import { Search, Shield, CreditCard, Key, ArrowRight } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Product Guide</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">How ParkBnB Works</h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          ParkBnB coordinates discovery, availability holds, secure payments, and gate access for private and commercial parking spaces in Ahmedabad.
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-surface p-6 rounded-card border border-border shadow-sm flex items-start gap-4">
          <div className="p-3 bg-primary-soft text-primary rounded-control shrink-0">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">1. Real-Time Discovery by Destination & Time</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Drivers specify their Ahmedabad destination (e.g. S.G. Highway, Prahlad Nagar, Navrangpura), date, arrival, and departure times. Our availability engine searches exclusively through legally verified, active spaces, filtering by vehicle dimensions and requirements such as EV charging.
            </p>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-card border border-border shadow-sm flex items-start gap-4">
          <div className="p-3 bg-accent-soft text-accent rounded-control shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">2. Transparent Pricing & Concurrency Holds</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Unlike static parking boards, ParkBnB applies database-level temporary holds when checkout starts. You receive a guaranteed 10-minute reservation window with a transparent price breakdown: base hourly rate, platform commission, and 18% GST on the service fee.
            </p>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-card border border-border shadow-sm flex items-start gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-control shrink-0">
            <Key className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">3. Access Instructions & Host Settlement</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Once payment is captured, the exact slot number, security checkpoint instructions, and entry pin are made available on your dashboard. Upon completed stay, provider payouts are reconciled in an append-only financial ledger.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center pt-6">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-control shadow transition-colors"
        >
          <span>Find Parking in Ahmedabad</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
