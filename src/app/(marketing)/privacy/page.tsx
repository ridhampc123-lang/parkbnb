import Link from 'next/link';
import { ShieldCheck, Lock, EyeOff, FileText, Scale } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8 pb-24 md:pb-16">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>DPDP Act 2023 Compliant</span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Effective Date: November 2026 • Governing Digital Personal Data Protection (DPDP) Act & Information Technology Act
        </p>
      </div>

      <div className="bg-surface p-6 sm:p-8 rounded-card border border-border text-xs leading-relaxed space-y-6 text-foreground shadow-xs">
        {/* Section 1 */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>1. Information We Collect & Purpose Limitation</span>
          </h2>
          <p className="text-muted-foreground">
            We collect only personal information strictly necessary for parking marketplace matching: driver name, contact mobile phone number (verified via OTP), vehicle registration number, and host banking settlement details. Sensitive verification documents (society share certificates, allotment letters, property tax receipts) are stored in encrypted private vaults accessible strictly to verified operations personnel.
          </p>
        </div>

        {/* Section 2: Mutual Privacy Shield */}
        <div className="space-y-2 p-4 bg-primary-soft/40 border border-primary/20 rounded-control">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-primary" />
            <span>2. Mutual Privacy Shield: No Personal Contact Details Shared</span>
          </h2>
          <p className="text-muted-foreground">
            In compliance with DPDP data minimization mandates, <strong>ParkBnB never discloses personal contact details between drivers and space owners</strong>.
          </p>
          <ul className="text-muted-foreground space-y-1 list-disc pl-4 text-[11px] pt-1">
            <li><strong>Parking owners & guards see only:</strong> A masked driver name (e.g. <code>Rahul S.</code>), an uncorrelatable Customer Privacy Reference (<code>PBN-REF-XXXX</code>), the authorized vehicle registration plate, and the assigned parking slot.</li>
            <li><strong>Drivers see only:</strong> The parking facility location, designated bay number, verified host verification badge, and security gate instructions. Direct personal telephone numbers and private residential unit doors are strictly withheld.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span>3. Payment Information Security & PCI-DSS Compliance</span>
          </h2>
          <p className="text-muted-foreground">
            ParkBnB never stores credit/debit card numbers or UPI PINs. All financial payments are processed through RBI-licensed payment aggregators adhering to PCI-DSS Level 1 standards. Transactions are recorded in a double-entry cryptographic ledger to guarantee automated refunds upon timely cancellation.
          </p>
        </div>

        {/* Section 4: Emergency / Serious Incident Protocol */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            <span>4. Lawful Information Provision in Serious Incidents</span>
          </h2>
          <p className="text-muted-foreground">
            To prevent harassment, extortion, or physical confrontations, ParkBnB does not distribute user contact information directly to private citizens in the event of an incident. Instead, in serious cases (property damage, vehicle theft, hit-and-run, or legal disputes):
          </p>
          <ul className="text-muted-foreground space-y-1 list-disc pl-4 text-[11px] pt-1">
            <li>ParkBnB maintains complete, unalterable digital forensic audit logs (verified vehicle plates, exact time-stamped gate entries, GPS coordinates, and payment hashes).</li>
            <li>We cooperate directly with police, registered legal authorities, and authorized motor insurance surveyors under Section 91 of the CrPC/BNSS and applicable Indian cyber laws.</li>
            <li>All disclosures are documented in our immutable audit trail to safeguard civil liberties and privacy rights.</li>
          </ul>
        </div>

        {/* Section 5: Statutory Rights */}
        <div className="space-y-2 pt-2 border-t border-border">
          <h2 className="text-sm font-bold text-foreground">5. Your DPDP Statutory Rights & Data Deletion</h2>
          <p className="text-muted-foreground">
            Users retain statutory rights to review, rectify, or request erasure of their personal data. Account deletion requests can be initiated from your Profile Settings. Data anonymization is completed within statutory timelines while preserving mandatory financial records as required by Indian tax statutes.
          </p>
        </div>
      </div>
    </div>
  );
}
