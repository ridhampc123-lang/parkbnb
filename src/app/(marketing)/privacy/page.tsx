export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mt-1">Effective Date: November 2026 • Compliance with Digital Personal Data Protection (DPDP) Act</p>
      </div>

      <div className="bg-surface p-6 rounded-card border border-border text-xs leading-relaxed space-y-4 text-foreground">
        <h2 className="text-sm font-bold">1. Information We Collect</h2>
        <p className="text-muted-foreground">
          We collect only personal information strictly necessary for marketplace matching: driver name, contact phone number, vehicle registration number, and host banking settlement details. Sensitive verification documents (PAN, property tax receipts) are stored in encrypted private storage buckets accessible only by authorized operations staff.
        </p>

        <h2 className="text-sm font-bold">2. Data Minimization & Public Exposure</h2>
        <p className="text-muted-foreground">
          Exact residential addresses, host phone numbers, and customer identity documents are never displayed on public search pages. Drivers receive access notes only upon confirmed, paid reservations.
        </p>

        <h2 className="text-sm font-bold">3. Payment Information Security</h2>
        <p className="text-muted-foreground">
          ParkBnB never stores credit/debit card numbers or UPI PINs. All financial payments are processed through RBI-licensed payment aggregators (Razorpay) adhering to PCI-DSS standards.
        </p>
      </div>
    </div>
  );
}
