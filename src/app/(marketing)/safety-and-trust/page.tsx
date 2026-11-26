import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  FileText,
  UserCheck,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Scale,
  Building,
  PhoneCall,
  FileCheck2,
  BadgeCheck,
  Search,
  ArrowRight,
  Receipt,
  Car,
  History,
  Clock,
  ShieldAlert,
  HelpCircle,
  Check,
  X
} from 'lucide-react';

export default function SafetyAndTrustPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16 pb-24 md:pb-16">
      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION                                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft text-primary text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <span>DPDP Act 2023 Compliant • Cryptographic Platform Governance</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-[1.15]">
          Safety, Mutual Privacy & <br className="hidden sm:inline" />
          <span className="text-primary underline decoration-accent decoration-4 underline-offset-8">
            Forensic Trust Architecture
          </span>
        </h1>

        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          How ParkBnB safeguards drivers and parking space owners with <strong>zero personal contact disclosure</strong>, 
          mandatory legal title vetting, and <strong>100% digital forensic traceability</strong> in serious incidents.
        </p>

        {/* Quick Value Metrics */}
        <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-3 bg-surface rounded-control border border-border shadow-xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Contact Privacy</span>
            <span className="text-base font-black text-emerald-600 block mt-0.5">0% PII Shared</span>
            <span className="text-[11px] text-muted-foreground">Neither phone nor email</span>
          </div>

          <div className="p-3 bg-surface rounded-control border border-border shadow-xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Listing Vetting</span>
            <span className="text-base font-black text-primary block mt-0.5">100% NOC Verified</span>
            <span className="text-[11px] text-muted-foreground">Society share/allotment</span>
          </div>

          <div className="p-3 bg-surface rounded-control border border-border shadow-xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Gate Access</span>
            <span className="text-base font-black text-blue-600 block mt-0.5">Digital Manifest</span>
            <span className="text-[11px] text-muted-foreground">Time-stamped entry & exit</span>
          </div>

          <div className="p-3 bg-surface rounded-control border border-border shadow-xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Incident Defense</span>
            <span className="text-base font-black text-purple-600 block mt-0.5">Full Audit Log</span>
            <span className="text-[11px] text-muted-foreground">Law enforcement protocol</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: MUTUAL PRIVACY SHIELD (ZERO PERSONAL DETAILS)      */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="border-b border-border pb-4">
          <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider block">
            Core Security Principle #1
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
            The Mutual Privacy Shield: Zero Personal Details Disclosed
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Neither the driver nor the parking space owner ever sees the other party&apos;s personal phone number, private email address, exact apartment door, or financial account details.
          </p>
        </div>

        {/* Visual Dual Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: What the Parking Owner & Guard See */}
          <div className="bg-surface rounded-card p-6 border-2 border-primary/20 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary/10 text-primary px-3 py-1 text-[10px] font-bold uppercase rounded-bl-control font-mono">
              Host & Security Guard View
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-control bg-primary-soft text-primary">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">What the Space Owner Sees</h3>
                <span className="text-[11px] text-muted-foreground">Privacy-filtered Gate Clearance Manifest</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-control space-y-1.5">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Authorized Information Visible to Owner:</span>
                </div>
                <ul className="space-y-1 text-emerald-800 text-[11px] pl-5 list-disc">
                  <li><strong>Masked Driver Name:</strong> Only first name + last initial (e.g. <code>Rahul S.</code>)</li>
                  <li><strong>Customer Privacy Ref:</strong> Unique, random identifier (e.g. <code>PBN-REF-881920</code>)</li>
                  <li><strong>Authorized Vehicle Plate:</strong> Genuine registration number (e.g. <code>GJ 01 AB 1234</code>)</li>
                  <li><strong>Assigned Bay:</strong> Exact designated parking slot (e.g. <code>Slot B-14</code>)</li>
                  <li><strong>Time Window:</strong> Exact reserved arrival and departure hours</li>
                </ul>
              </div>

              <div className="p-3 bg-red-50/70 border border-red-200 rounded-control space-y-1.5">
                <div className="font-bold text-red-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Strictly Blocked & Never Exposed to Owner:</span>
                </div>
                <ul className="space-y-1 text-red-800 text-[11px] pl-5 list-disc">
                  <li>Driver&apos;s personal mobile telephone number</li>
                  <li>Driver&apos;s personal email address</li>
                  <li>Driver&apos;s home address, employer, or identity documents</li>
                  <li>Driver&apos;s past trip history or parking habits across other locations</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Card B: What the Driver / Customer Sees */}
          <div className="bg-surface rounded-card p-6 border-2 border-primary/20 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-700 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-control font-mono">
              Driver / Customer View
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-control bg-blue-50 text-blue-700">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">What the Driver Sees</h3>
                <span className="text-[11px] text-muted-foreground">Digital Parking Pass & Gate Directions</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-control space-y-1.5">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Authorized Information Visible to Driver:</span>
                </div>
                <ul className="space-y-1 text-emerald-800 text-[11px] pl-5 list-disc">
                  <li><strong>Premises Address:</strong> Building / society location and GPS navigation link</li>
                  <li><strong>Assigned Slot Identifier:</strong> Designated bay (e.g. <code>Bay B-14 Basement</code>)</li>
                  <li><strong>Security Clearance Instructions:</strong> Clear gate rules & barrier access instructions</li>
                  <li><strong>Verified Host Badge:</strong> Masked host name (e.g. <code>Kishan P. • Verified Owner</code>)</li>
                  <li><strong>Digital High-Contrast QR Code:</strong> Scannable pass for on-site security verification</li>
                </ul>
              </div>

              <div className="p-3 bg-red-50/70 border border-red-200 rounded-control space-y-1.5">
                <div className="font-bold text-red-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Strictly Blocked & Never Exposed to Driver:</span>
                </div>
                <ul className="space-y-1 text-red-800 text-[11px] pl-5 list-disc">
                  <li>Host&apos;s personal mobile telephone number</li>
                  <li>Host&apos;s personal residential unit/flat door number</li>
                  <li>Host&apos;s private bank account numbers, IFSC, or UPI VPA</li>
                  <li>Private ownership documents uploaded during verification</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Why this matters callout */}
        <div className="p-4 bg-primary-soft/40 border border-primary/20 rounded-card flex items-start gap-3">
          <EyeOff className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="text-xs space-y-1">
            <strong className="text-foreground block font-bold">Why Mutual Privacy Protects Both Sides:</strong>
            <p className="text-muted-foreground leading-relaxed">
              When drivers and property owners share direct phone numbers on informal forums, it inevitably leads to late-night spam calls, payment haggling, unsolicited WhatsApp messages, and unrecorded gate disputes. With ParkBnB, <strong>all parking operations happen cleanly through pseudonymous digital tokens</strong>, shielding both your personal privacy and your peace of mind.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: WHEN SOMETHING HAPPENS (SERIOUS INCIDENTS & LAW)    */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="border-b border-border pb-4">
          <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider block">
            Emergency & Legal Traceability
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
            When Anything Happens: How We Trace, Resolve, and Provide Details
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            If an emergency, property damage, vehicle scratch, unauthorized overstay, or legal dispute occurs—how does ParkBnB find the truth and protect you?
          </p>
        </div>

        {/* Step-by-Step Incident Forensics Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Step 1 */}
          <div className="bg-surface p-5 rounded-card border border-border space-y-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center font-mono">
              01
            </div>
            <h3 className="font-bold text-sm text-foreground">100% Immutable Digital Audit Trail</h3>
            <p className="text-muted-foreground leading-relaxed">
              Unlike cash transactions or unrecorded entries, every single reservation on ParkBnB is recorded with tamper-evident digital timestamps:
            </p>
            <ul className="space-y-1 text-muted-foreground text-[11px] list-disc pl-4">
              <li>OTP-verified driver phone and identity registration</li>
              <li>Official state transport vehicle license plate logged</li>
              <li>Exact GPS coordinates of the parking facility</li>
              <li>Server-recorded gate check-in time (<code>When In</code>)</li>
              <li>Server-recorded departure time (<code>When Out</code>)</li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="bg-surface p-5 rounded-card border border-border space-y-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 font-bold flex items-center justify-center font-mono">
              02
            </div>
            <h3 className="font-bold text-sm text-foreground">24/7 Security Escalation & Dispute Desk</h3>
            <p className="text-muted-foreground leading-relaxed">
              Either the driver or the parking owner can instantly trigger an incident report through the active booking pass:
            </p>
            <ul className="space-y-1 text-muted-foreground text-[11px] list-disc pl-4">
              <li><strong>Overstay Detection:</strong> Automatic overtime surcharge & host alert if vehicle stays past booked departure</li>
              <li><strong>Gate Barrier Blockage:</strong> Instant dispatch to building security with assigned bay documentation</li>
              <li><strong>Accidental Damage:</strong> Photo-evidence upload reviewed within 2 hours by our claims desk</li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="bg-surface p-5 rounded-card border border-border space-y-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 font-bold flex items-center justify-center font-mono">
              03
            </div>
            <h3 className="font-bold text-sm text-foreground">Lawful Law Enforcement Protocol</h3>
            <p className="text-muted-foreground leading-relaxed">
              In serious matters—such as major hit-and-run, stolen vehicles, vehicle abandonment, or police FIR investigations:
            </p>
            <ul className="space-y-1 text-muted-foreground text-[11px] list-disc pl-4">
              <li>Full backend identity dossier is retained immutably</li>
              <li>ParkBnB complies with Section 91 CrPC/BNSS summons</li>
              <li>Direct data handover to police & licensed motor insurers</li>
              <li>Prevents private retaliation while guaranteeing legal justice</li>
            </ul>
          </div>
        </div>

        {/* Detailed Explanation: Why We Do Not Hand Personal Numbers Directly to Private Parties */}
        <div className="bg-surface rounded-card p-6 border border-border space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <Scale className="w-4 h-4 text-primary" />
            <span>How Lawful Evidence Handover Works in Serious Cases</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            If a minor scratch or billing misunderstanding occurs, our <strong>Double-Entry Escrow Ledger</strong> handles automated adjustments, refunds, and host payouts fairly without requiring parties to confront each other. 
          </p>

          <p className="text-xs text-muted-foreground leading-relaxed">
            In severe criminal or civil incidents (e.g. intentional vandalism, trespassing, or theft), handing a private person&apos;s home address or personal mobile number directly to another private citizen often triggers physical altercations, threats, or extortion. Instead, <strong>ParkBnB acts as the authoritative legal bridge</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3.5 bg-surface-muted rounded-control border border-border space-y-1">
              <span className="font-bold text-foreground block">1. Formal Police & FIR Cooperation</span>
              <p className="text-[11px] text-muted-foreground">
                Upon presentation of a police inquiry, FIR, or formal legal notice under Indian law, our Legal & Compliance Desk releases the verified identity, vehicle owner records, entry/exit CCTV timestamps, and payment transaction hashes directly to the investigating police officer.
              </p>
            </div>

            <div className="p-3.5 bg-surface-muted rounded-control border border-border space-y-1">
              <span className="font-bold text-foreground block">2. Motor Insurance Claim Assistance</span>
              <p className="text-[11px] text-muted-foreground">
                We provide authorized vehicle owners and certified insurance surveyors with official ParkBnB Incident Reports detailing the exact bay location, verified driver presence, time records, and host gate confirmation to expedite formal motor insurance claims.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: WHY PARKBNB IS DIFFERENT (COMPARISON TABLE)        */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="border-b border-border pb-4">
          <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider block">
            Competitive Distinction
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
            Why Our System is Different: ParkBnB vs. Informal Setups
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Why you can trust ParkBnB over informal WhatsApp groups, classified websites, unvetted society boards, or ad-hoc parking arrangements.
          </p>
        </div>

        {/* Comprehensive Comparison Table */}
        <div className="bg-surface rounded-card border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-muted border-b border-border text-foreground font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5 sm:p-4">Security Safeguard</th>
                  <th className="p-3.5 sm:p-4 text-red-700 bg-red-50/40">Informal Setups & Classifieds</th>
                  <th className="p-3.5 sm:p-4 text-emerald-800 bg-emerald-50/50">ParkBnB Production Architecture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Row 1: Phone Numbers */}
                <tr className="hover:bg-surface-muted/30">
                  <td className="p-3.5 sm:p-4 font-bold text-foreground">
                    Phone & Email Privacy
                  </td>
                  <td className="p-3.5 sm:p-4 text-red-700 bg-red-50/20">
                    <div className="flex items-start gap-1.5">
                      <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>Phone numbers posted publicly. Results in spam calls, harassment, and zero privacy.</span>
                    </div>
                  </td>
                  <td className="p-3.5 sm:p-4 text-emerald-900 bg-emerald-50/30 font-medium">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>100% Masked:</strong> Both parties see only pseudonymous IDs (e.g. <code>Rahul S.</code>, <code>PBN-REF-XXXX</code>). Phone numbers are strictly never shared.</span>
                    </div>
                  </td>
                </tr>

                {/* Row 2: Property Authority */}
                <tr className="hover:bg-surface-muted/30">
                  <td className="p-3.5 sm:p-4 font-bold text-foreground">
                    Legal Right-to-Offer Verification
                  </td>
                  <td className="p-3.5 sm:p-4 text-red-700 bg-red-50/20">
                    <div className="flex items-start gap-1.5">
                      <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>Zero check. Subletters and unauthorized tenants illegally rent slots; drivers get clamped or towed.</span>
                    </div>
                  </td>
                  <td className="p-3.5 sm:p-4 text-emerald-900 bg-emerald-50/30 font-medium">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Mandatory Legal Vetting:</strong> Providers must submit society share certificates, registered allotment letters, or society NOCs before listing.</span>
                    </div>
                  </td>
                </tr>

                {/* Row 3: Identity & Vehicle Verification */}
                <tr className="hover:bg-surface-muted/30">
                  <td className="p-3.5 sm:p-4 font-bold text-foreground">
                    Identity & Vehicle Registration
                  </td>
                  <td className="p-3.5 sm:p-4 text-red-700 bg-red-50/20">
                    <div className="flex items-start gap-1.5">
                      <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>Anonymous strangers. Anyone can provide a fake name or park an untraceable vehicle.</span>
                    </div>
                  </td>
                  <td className="p-3.5 sm:p-4 text-emerald-900 bg-emerald-50/30 font-medium">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Cryptographic OTP & Plate Verification:</strong> Drivers are authenticated via phone OTP, and authorized license plates are checked at the gate.</span>
                    </div>
                  </td>
                </tr>

                {/* Row 4: Gate Clearance */}
                <tr className="hover:bg-surface-muted/30">
                  <td className="p-3.5 sm:p-4 font-bold text-foreground">
                    Security Gate Clearance
                  </td>
                  <td className="p-3.5 sm:p-4 text-red-700 bg-red-50/20">
                    <div className="flex items-start gap-1.5">
                      <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>Arguments with guards, blocked gates, and hostile apartment committee confrontations.</span>
                    </div>
                  </td>
                  <td className="p-3.5 sm:p-4 text-emerald-900 bg-emerald-50/30 font-medium">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Official Gate Manifest & Pass:</strong> Security attendant verifies the plate against the live digital manifest; entry is instant and authorized.</span>
                    </div>
                  </td>
                </tr>

                {/* Row 5: Payment Safety */}
                <tr className="hover:bg-surface-muted/30">
                  <td className="p-3.5 sm:p-4 font-bold text-foreground">
                    Payment & Refund Security
                  </td>
                  <td className="p-3.5 sm:p-4 text-red-700 bg-red-50/20">
                    <div className="flex items-start gap-1.5">
                      <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>Direct UPI or cash to strangers. Zero refund guarantee; risk of double-selling slots.</span>
                    </div>
                  </td>
                  <td className="p-3.5 sm:p-4 text-emerald-900 bg-emerald-50/30 font-medium">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Double-Entry Escrow Ledger:</strong> 100% automated refund on cancellation up to 2 hrs before arrival; host paid only upon verified completion.</span>
                    </div>
                  </td>
                </tr>

                {/* Row 6: Serious Incident Recourse */}
                <tr className="hover:bg-surface-muted/30">
                  <td className="p-3.5 sm:p-4 font-bold text-foreground">
                    Incident Recourse & Legal Defense
                  </td>
                  <td className="p-3.5 sm:p-4 text-red-700 bg-red-50/20">
                    <div className="flex items-start gap-1.5">
                      <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>Parties block each other on WhatsApp; dead end with zero audit logs or legal recourse.</span>
                    </div>
                  </td>
                  <td className="p-3.5 sm:p-4 text-emerald-900 bg-emerald-50/30 font-medium">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Full Forensic Traceability:</strong> Complete time records, payment hashes, verified identity dossiers, and formal law enforcement cooperation.</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: THE FOUR PILLARS OF PARKBNB TRUST                   */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="border-b border-border pb-4">
          <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider block">
            Guaranteed Commitments
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
            The Four Pillars of ParkBnB Governance
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Built from day one to operate with banking-grade compliance and neighborhood respect.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface p-6 rounded-card border border-border space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <FileCheck2 className="w-4 h-4" />
              <span>1. Mandatory Legal Right-to-Offer</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We never assume a parking space can be freely rented. Every residential and commercial host must upload proof of legal authority—society allotment letters, share certificates, or society NOCs. Spaces lacking verified title remain unlisted.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-card border border-border space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <BadgeCheck className="w-4 h-4" />
              <span>2. Genuine Vehicle & Gate Verification</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Drivers must register genuine Indian vehicle registration numbers (e.g. <code>GJ 01 AB 1234</code>). On arrival, the building security guard verifies the license plate against the confirmed clearance manifest before raising the barrier.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-card border border-border space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Receipt className="w-4 h-4" />
              <span>3. Double-Entry Financial Escrow</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every rupee is tracked with mathematical double-entry ledger precision. Drivers are protected with instant 100% refund capability, while parking hosts receive guaranteed, automated bank settlements without cash disputes.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-card border border-border space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Lock className="w-4 h-4" />
              <span>4. Data Minimization (DPDP Act 2023)</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              In full compliance with India&apos;s Digital Personal Data Protection Act, we practice strict data minimization. Sensitive documents are stored in encrypted private vaults, and customer PII is never exposed on public pages or gate manifests.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5: CONTACT & EMERGENCY SAFETY DESK                     */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-surface rounded-card p-6 sm:p-8 border-2 border-primary/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider">
              24/7 Security & Support
            </span>
            <h3 className="text-xl font-bold text-foreground">Need Assistance or Have a Safety Question?</h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Our dedicated Safety, Security & Compliance team is available around the clock to assist drivers, space owners, society management committees, and law enforcement officers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/account/support"
              className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Help & Support Desk</span>
            </Link>

            <Link
              href="/search"
              className="px-4 py-2.5 bg-surface-muted hover:bg-border text-foreground text-xs font-bold rounded-control border border-border transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Search className="w-4 h-4 text-primary" />
              <span>Find Verified Spaces</span>
            </Link>
          </div>
        </div>

        <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>Official Safety & Legal Inquiries: <strong className="text-foreground font-mono">safety@parkbnb.in</strong></span>
          <span>Emergency Security Hotline available 24/7 on all active passes</span>
        </div>
      </section>
    </div>
  );
}
