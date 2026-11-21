export default function CancellationPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Cancellation & Refund Policy</h1>
        <p className="text-xs text-muted-foreground mt-1">Effective Date: November 2026 • Governing Jurisdiction: Ahmedabad, Gujarat, India</p>
      </div>

      <div className="prose prose-sm text-foreground space-y-6 text-xs leading-relaxed">
        <section className="bg-surface p-5 rounded-card border border-border space-y-2">
          <h2 className="text-sm font-bold text-foreground">1. Customer Cancellation Windows</h2>
          <p className="text-muted-foreground">
            <strong>More than 2 hours before booking start time:</strong> Full 100% refund of base parking fee. The platform convenience fee is non-refundable to cover payment gateway processing costs.<br />
            <strong>Within 2 hours of booking start time:</strong> 50% refund of base parking fee to protect host commitment.<br />
            <strong>After booking start time:</strong> No refund is permitted for no-shows.
          </p>
        </section>

        <section className="bg-surface p-5 rounded-card border border-border space-y-2">
          <h2 className="text-sm font-bold text-foreground">2. Access Failure / Host Inability to Provide Space</h2>
          <p className="text-muted-foreground">
            If a customer arrives at the designated slot and finds the space occupied or gate access denied by premise security, the driver can report an immediate access dispute within 30 minutes of arrival. Following verification by our Admin Operations team, a 100% full refund including all fees is returned to the original payment method.
          </p>
        </section>

        <section className="bg-surface p-5 rounded-card border border-border space-y-2">
          <h2 className="text-sm font-bold text-foreground">3. Refund Processing Timeline</h2>
          <p className="text-muted-foreground">
            Refunds are credited directly to the customer&apos;s original payment source (UPI, Card, or Net Banking) via Razorpay within 5 to 7 Indian banking business days. All refund transactions are recorded in the system&apos;s immutable financial ledger.
          </p>
        </section>
      </div>
    </div>
  );
}
