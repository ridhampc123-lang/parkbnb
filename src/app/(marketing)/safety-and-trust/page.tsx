import { ShieldCheck, Lock, FileText, UserCheck } from 'lucide-react';

export default function SafetyAndTrustPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Governance & Trust</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">Safety & Verification Framework</h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          ParkBnB operates under strict legal, identity, and property rights governance to ensure safe urban mobility in Gujarat.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-surface p-6 rounded-card border border-border space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <FileText className="w-4 h-4" />
            <span>1. Mandatory Legal Right-to-Offer Verification</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We do not assume that every residential parking slot in Ahmedabad can be freely rented. Providers must upload proof of legal authority—such as society share certificates, registered allotment letters, or society NOCs. Spaces without verified documentation remain in draft status and cannot be booked by the public.
          </p>
        </div>

        <div className="bg-surface p-6 rounded-card border border-border space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <UserCheck className="w-4 h-4" />
            <span>2. Customer & Vehicle Verification</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Drivers must register genuine Indian vehicle registration numbers (e.g. GJ 01 AB 1234) and verified contact details before booking. Security guards at host premises verify the license plate on arrival against the confirmed booking manifest.
          </p>
        </div>

        <div className="bg-surface p-6 rounded-card border border-border space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Lock className="w-4 h-4" />
            <span>3. Address & Privacy Minimization</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Exact apartment numbers, gate clearance codes, and private host contact details are never disclosed to anonymous visitors. Only approximate neighbourhood locations (e.g. Prahlad Nagar Garden vicinity) are visible during public search.
          </p>
        </div>
      </div>
    </div>
  );
}
