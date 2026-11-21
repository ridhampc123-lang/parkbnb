export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Terms of Service</h1>
        <p className="text-xs text-muted-foreground mt-1">Effective Date: November 2026 • ParkBnB Technologies India Pvt Ltd</p>
      </div>

      <div className="bg-surface p-6 rounded-card border border-border text-xs leading-relaxed space-y-4 text-foreground">
        <h2 className="text-sm font-bold">1. Marketplace Intermediary Role</h2>
        <p className="text-muted-foreground">
          ParkBnB acts strictly as a digital peer-to-peer matching marketplace under Section 79 of the Information Technology Act, 2000. ParkBnB does not own, lease, or take custody of parking spaces, nor does it operate as a bailee under Section 151 of the Indian Contract Act.
        </p>

        <h2 className="text-sm font-bold">2. Host Warranties & Society Compliance</h2>
        <p className="text-muted-foreground">
          Every provider represents that they have the unencumbered legal right and any necessary society or commercial authorizations to allow temporary vehicular parking on the listed space. Providers agree to indemnify ParkBnB against any fines, society penalties, or claims arising from unauthorized subleasing.
        </p>

        <h2 className="text-sm font-bold">3. Driver Obligations & Vehicle Insurance</h2>
        <p className="text-muted-foreground">
          Drivers must park only the vehicle registration number confirmed on the booking receipt, operate within the designated space boundaries, and vacate the premises prior to the reservation end time. Drivers are solely responsible for maintaining valid third-party motor vehicle insurance as mandated by the Motor Vehicles Act, 1988.
        </p>
      </div>
    </div>
  );
}
