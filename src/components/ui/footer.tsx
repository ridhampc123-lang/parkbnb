import Link from 'next/link';
import { Car, MapPin, Mail, Phone, Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Market */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-xl text-primary">
              <div className="bg-primary text-white p-1.5 rounded-control">
                <Car className="w-4 h-4" />
              </div>
              <span>Park<span className="text-accent">BnB</span></span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              India&apos;s verified peer-to-peer parking marketplace. Currently operating in select mobility corridors in Ahmedabad, Gujarat.
            </p>
            <div className="text-xs font-medium text-primary flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Pilot City: Ahmedabad, Gujarat</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Marketplace</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/search" className="text-foreground hover:text-primary">Find Parking</Link></li>
              <li><Link href="/list-your-space" className="text-foreground hover:text-primary">List Your Space</Link></li>
              <li><Link href="/how-it-works" className="text-foreground hover:text-primary">How It Works</Link></li>
              <li><Link href="/safety-and-trust" className="text-foreground hover:text-primary">Verification & Safety</Link></li>
            </ul>
          </div>

          {/* Ahmedabad Pilot Hotspots */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Active Service Areas</h3>
            <ul className="space-y-1.5 text-xs text-foreground">
              <li>Prahlad Nagar & Corporate Road</li>
              <li>Sindhu Bhavan Road / Bodakdev</li>
              <li>Navrangpura & CG Road</li>
              <li>Ashram Road & Sabarmati Riverfront</li>
              <li>Vastrapur / IIM Ahmedabad</li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Legal & Governance</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="text-foreground hover:text-primary">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-foreground hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/cancellation-policy" className="text-foreground hover:text-primary">Cancellation & Refunds</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} ParkBnB Technologies India Pvt Ltd. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-primary" /> Verified Peer-to-Peer Mobility System
          </p>
        </div>
      </div>
    </footer>
  );
}
