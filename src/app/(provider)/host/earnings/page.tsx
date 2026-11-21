import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { DollarSign, ShieldCheck, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default async function HostEarningsPage() {
  const session = await getServerSession();
  const store = getLocalStore();
  const providerId = session.user?.id || '';

  const ledger = store.getProviderLedger(providerId);
  const bookings = store.getBookingsByProvider(providerId);

  const totalEarned = bookings.reduce((sum, b) => sum + b.provider_payout_amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Financial Ledger & Payout Settlement</h2>
        <p className="text-xs text-muted-foreground">
          Double-entry financial records. Gross booking amounts, platform commission deductions, and net disbursements.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Net Earnings</span>
          <div className="text-2xl font-black text-emerald-700">₹{totalEarned.toFixed(2)}</div>
          <span className="text-[11px] text-muted-foreground">Disbursed via automated bank transfer</span>
        </div>

        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bank IFSC Code</span>
          <div className="text-base font-bold text-foreground font-mono">HDFC0001234</div>
          <span className="text-[11px] text-muted-foreground">Rajesh Patel • A/C ending 9012</span>
        </div>

        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform Commission Rate</span>
          <div className="text-2xl font-black text-primary">15%</div>
          <span className="text-[11px] text-muted-foreground">+ 18% GST on convenience fee</span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-surface rounded-card border border-border overflow-hidden space-y-3 p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Ledger Transactions</h3>
        {ledger.length === 0 ? (
          <div className="text-xs text-muted-foreground py-6 text-center">
            No financial settlements recorded yet. Completed reservations create immutable ledger credit rows.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {ledger.map((entry) => (
              <div key={entry.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-foreground">{entry.description}</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">
                    {new Date(entry.created_at).toLocaleString()} • Ref: <span className="font-mono">{entry.reference_id || 'System'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-700">+₹{entry.amount.toFixed(2)}</span>
                  <div className="text-[10px] text-muted-foreground uppercase">{entry.entry_type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
