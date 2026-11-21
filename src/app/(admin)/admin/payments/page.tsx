import { getLocalStore } from '@/lib/store/marketplace-store';
import { DollarSign, ShieldAlert, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function AdminPaymentsPage() {
  const store = getLocalStore();
  const ledger = store.getLedgerEntries();

  const totalGross = ledger
    .filter(e => e.entry_type === 'CUSTOMER_PAYMENT')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCommission = ledger
    .filter(e => e.entry_type === 'PLATFORM_COMMISSION')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalProviderPayable = ledger
    .filter(e => e.entry_type === 'PROVIDER_PAYABLE')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Financial Ledger Audit</h2>
        <p className="text-xs text-muted-foreground">Immutable double-entry transaction ledger matching Razorpay gateway settlement records.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross Customer Inflow</span>
          <div className="text-2xl font-black text-foreground">₹{totalGross.toFixed(2)}</div>
          <span className="text-[11px] text-muted-foreground">Processed via Razorpay</span>
        </div>

        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform Revenue (15% + GST)</span>
          <div className="text-2xl font-black text-emerald-700">₹{totalCommission.toFixed(2)}</div>
          <span className="text-[11px] text-muted-foreground">Recognized marketplace revenue</span>
        </div>

        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Provider Escrow Obligations</span>
          <div className="text-2xl font-black text-primary">₹{totalProviderPayable.toFixed(2)}</div>
          <span className="text-[11px] text-muted-foreground">Net payable to parking hosts</span>
        </div>
      </div>

      {/* Ledger Entries */}
      <div className="bg-surface rounded-card border border-border overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-surface-muted border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Debit Account</th>
              <th className="p-3.5">Credit Account</th>
              <th className="p-3.5">Description</th>
              <th className="p-3.5 text-right">Amount (INR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ledger.map((e) => (
              <tr key={e.id} className="hover:bg-surface-muted/50 transition-colors">
                <td className="p-3.5 text-muted-foreground">{new Date(e.created_at).toLocaleTimeString()}</td>
                <td className="p-3.5 font-bold uppercase text-[10px]">{e.entry_type}</td>
                <td className="p-3.5 font-mono text-[11px]">{e.debit_account}</td>
                <td className="p-3.5 font-mono text-[11px]">{e.credit_account}</td>
                <td className="p-3.5 text-foreground">{e.description}</td>
                <td className="p-3.5 text-right font-mono font-bold text-foreground">₹{e.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
