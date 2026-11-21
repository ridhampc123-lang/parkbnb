import Link from 'next/link';
import { Building, ShieldCheck, FileCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ListYourSpacePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Host Onboarding</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">List Your Parking Space</h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          Monetize legally usable parking capacity in residential apartment complexes, independent properties, and commercial precincts across Ahmedabad.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-card border border-border space-y-3">
          <div className="p-2.5 bg-primary-soft text-primary rounded-control w-fit">
            <Building className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-foreground">Residential Hosts</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Allotted apartment parking slots empty during work hours? If your society bye-laws permit visitor parking with prior authorization, you can earn recurring income without disrupting neighbors.
          </p>
          <ul className="text-xs text-foreground space-y-1.5 pt-2">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Society allotment proof required</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Control days & exact operating hours</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Registered vehicle plates verified prior to entry</li>
          </ul>
        </div>

        <div className="bg-surface p-6 rounded-card border border-border space-y-3">
          <div className="p-2.5 bg-accent-soft text-accent rounded-control w-fit">
            <FileCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-foreground">Commercial Operators</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Commercial lots near corporate parks (S.G. Highway, Prahlad Nagar, Ashram Road) with excess evening or weekend capacity can maximize occupancy and generate automated bank settlements.
          </p>
          <ul className="text-xs text-foreground space-y-1.5 pt-2">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Bulk bay management & multi-slot listings</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Support for EV chargers & oversized vehicles</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tax invoices with GST compliance</li>
          </ul>
        </div>
      </div>

      <div className="bg-surface-muted p-6 rounded-card border border-border space-y-3 text-center">
        <h3 className="text-sm font-bold text-foreground">Ready to submit your listing for verification?</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Creating a listing takes under 5 minutes. Our team verifies your property ownership or society NOC before making it live to drivers.
        </p>
        <div className="pt-2">
          <Link
            href="/register?role=provider"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow transition-colors"
          >
            <span>Register as Parking Host</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
