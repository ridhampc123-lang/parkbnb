import Link from 'next/link';
import { Building, ShieldCheck, DollarSign, HelpCircle } from 'lucide-react';

export function HostFooter() {
  return (
    <footer className="bg-surface border-t border-border mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          {/* Left: Host Portal Identity */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-sm bg-accent text-slate-950 font-bold flex items-center justify-center">
              <Building className="w-3 h-3" />
            </div>
            <span className="font-semibold text-foreground">ParkBnB Host Operations Console</span>
            <span>•</span>
            <span>Ahmedabad Supply Corridor</span>
          </div>

          {/* Center: Quick Links */}
          <div className="flex items-center gap-4 text-xs">
            <Link href="/host/spaces" className="hover:text-primary transition-colors">
              My Listed Spaces
            </Link>
            <Link href="/host/earnings" className="hover:text-primary transition-colors flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              <span>Payout Settlement</span>
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Host Terms of Service
            </Link>
            <Link href="/safety-and-trust" className="hover:text-primary transition-colors flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-primary" />
              <span>Host Protection Cover</span>
            </Link>
          </div>

          {/* Right: Host Concierge */}
          <div className="flex items-center gap-3">
            <span className="text-[11px]">Host Concierge: +91 79 4900 1234 (Ext. 2)</span>
            <span>•</span>
            <span>© {new Date().getFullYear()} ParkBnB</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

