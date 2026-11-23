import Link from 'next/link';
import { Car, ShieldCheck, Phone, HelpCircle } from 'lucide-react';

export function UserFooter() {
  return (
    <footer className="bg-surface border-t border-border mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          {/* Left: Driver Portal Identity */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-sm bg-primary text-white flex items-center justify-center">
              <Car className="w-3 h-3" />
            </div>
            <span className="font-semibold text-foreground">ParkBnB Driver Portal</span>
            <span>•</span>
            <span>Ahmedabad, Gujarat</span>
          </div>

          {/* Center: Quick Links */}
          <div className="flex items-center gap-4 text-xs">
            <Link href="/search" className="hover:text-primary transition-colors">
              Find Parking
            </Link>
            <Link href="/account/support" className="hover:text-primary transition-colors flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-primary" />
              <span>Support & Grievances</span>
            </Link>
            <Link href="/cancellation-policy" className="hover:text-primary transition-colors">
              Cancellation Terms
            </Link>
            <Link href="/safety-and-trust" className="hover:text-primary transition-colors flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Safety Guarantee</span>
            </Link>
          </div>

          {/* Right: Copyright & Emergency Contact */}
          <div className="flex items-center gap-3">
            <span className="text-[11px]">Hotline: +91 79 4900 1234</span>
            <span>•</span>
            <span>© {new Date().getFullYear()} ParkBnB</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

