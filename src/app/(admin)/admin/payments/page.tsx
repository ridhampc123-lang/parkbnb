import { getLocalStore } from '@/lib/store/marketplace-store';
import { DollarSign, ShieldAlert, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function AdminPaymentsPage() {
  const store = getLocalStore();
  const ledger = store.getLedgerEntries();

  const totalGrossInflow = ledger
    .filter(e => e.entry_type === 'CUSTOMER_PAYMENT')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCommissionRevenue = ledger
    .filter(e => e.entry_type === 'PLATFORM_COMMISSION')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalProviderPayable = ledger
    .filter(e => e.entry_type === 'PROVIDER_PAYABLE')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalProviderPayouts = ledger
    .filter(e => e.entry_type === 'PROVIDER_PAYOUT')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalRefunds = ledger
    .filter(e => e.entry_type === 'REFUND_CUSTOMER')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
          Financial Governance
        </span>
        <h1 className="text-2xl font-black text-white mt-1">Double-Entry Financial Ledger & Escrow</h1>
        <p className="text-xs text-slate-400 mt-1">
          Immutable audit trail matching Razorpay settlement inflows, platform revenue, and provider liabilities.
        </p>
      </div>

      {/* Aggregate Reconciliations */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-card space-y-1">
          <span className="text-xs text-slate-400 font-medium">Customer Inflows (Gross)</span>
          <div className="text-2xl font-black text-white font-mono">₹{totalGrossInflow.toFixed(2)}</div>
          <span className="text-[11px] text-slate-500">Collected via Razorpay</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-card space-y-1">
          <span className="text-xs text-slate-400 font-medium">Platform Fee + GST</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">₹{totalCommissionRevenue.toFixed(2)}</div>
          <span className="text-[11px] text-slate-500">15% fee + 18% GST</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-card space-y-1">
          <span className="text-xs text-slate-400 font-medium">Provider Escrow Payable</span>
          <div className="text-2xl font-black text-accent font-mono">₹{totalProviderPayable.toFixed(2)}</div>
          <span className="text-[11px] text-slate-500">Net due to parking hosts</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-card space-y-1">
          <span className="text-xs text-slate-400 font-medium">Disbursed Refunds</span>
          <div className="text-2xl font-black text-rose-400 font-mono">₹{totalRefunds.toFixed(2)}</div>
          <span className="text-[11px] text-slate-500">Cancellations & dispute refunds</span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900 rounded-card border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Immutable Ledger Entries ({ledger.length})
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Currency: INR (₹)</span>
        </div>

        {ledger.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No transactions posted to the financial ledger yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Debit Account</th>
                  <th className="p-3.5">Credit Account</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Reference ID</th>
                  <th className="p-3.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {ledger.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        e.entry_type === 'CUSTOMER_PAYMENT' ? 'bg-blue-500/20 text-blue-300' :
                        e.entry_type === 'PLATFORM_COMMISSION' ? 'bg-emerald-500/20 text-emerald-300' :
                        e.entry_type === 'PROVIDER_PAYABLE' ? 'bg-amber-500/20 text-amber-300' :
                        e.entry_type === 'PROVIDER_PAYOUT' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-rose-500/20 text-rose-300'
                      }`}>
                        {e.entry_type}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300 text-[11px]">{e.debit_account}</td>
                    <td className="p-3.5 font-mono text-slate-300 text-[11px]">{e.credit_account}</td>
                    <td className="p-3.5 text-slate-200">{e.description}</td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">{e.reference_id || 'System'}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-white">
                      ₹{e.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
