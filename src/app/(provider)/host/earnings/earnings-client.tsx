'use client';

import { useState } from 'react';
import { FinancialLedgerEntry, ProviderProfile } from '@/types/database';
import { IndianRupee, Building, ShieldCheck, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

export function EarningsClient({
  provider,
  ledger,
  totalEarned,
  commissionRate,
}: {
  provider?: ProviderProfile;
  ledger: FinancialLedgerEntry[];
  totalEarned: number;
  commissionRate: number;
}) {
  const [bankAccount, setBankAccount] = useState(provider?.bank_account_number || '');
  const [ifsc, setIfsc] = useState(provider?.bank_ifsc_code || '');
  const [holder, setHolder] = useState(provider?.bank_account_holder || '');
  const [upi, setUpi] = useState(provider?.upi_id || '');
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Financial Ledger & Payout Settlement</h2>
        <p className="text-xs text-muted-foreground">
          Double-entry financial records. Gross booking amounts, platform commission deductions, and net disbursements.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Net Earnings */}
        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Net Earnings</span>
          <div className="text-2xl font-black text-emerald-700 font-mono">₹{totalEarned.toFixed(2)}</div>
          <span className="text-[11px] text-muted-foreground">Earned across completed bookings</span>
        </div>

        {/* Bank Account Settlement Status */}
        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Disbursement Account</span>
          <div className="text-sm font-bold text-foreground font-mono">
            {provider?.bank_ifsc_code ? (
              <span>IFSC: {provider.bank_ifsc_code}</span>
            ) : (
              <span className="text-amber-600 font-sans">Bank Account Pending</span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground block truncate">
            {provider?.bank_account_number
              ? `A/C ending ****${provider.bank_account_number.slice(-4)}`
              : 'Add banking details below for NEFT/IMPS transfers'}
          </span>
        </div>

        {/* Platform Commission Rate */}
        <div className="bg-surface p-5 rounded-card border border-border shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform Commission</span>
          <div className="text-2xl font-black text-primary font-mono">{(commissionRate * 100).toFixed(0)}%</div>
          <span className="text-[11px] text-muted-foreground">+ statutory GST on convenience fee</span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-surface rounded-card border border-border overflow-hidden space-y-3 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Immutable Ledger Transactions ({ledger.length})
          </h3>
          <span className="text-[11px] font-mono text-muted-foreground">Currency: INR (₹)</span>
        </div>

        {ledger.length === 0 ? (
          <div className="text-xs text-muted-foreground py-8 text-center space-y-1">
            <p className="font-semibold text-foreground">No ledger transactions posted yet.</p>
            <p>When drivers complete reservations on your spaces, credit entries will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {ledger.map(entry => (
              <div key={entry.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-foreground">{entry.description}</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5 font-mono">
                    {new Date(entry.created_at).toLocaleString()} • Ref: {entry.reference_id || 'System'}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono font-bold ${
                      entry.entry_type === 'PROVIDER_PAYABLE'
                        ? 'text-emerald-700'
                        : entry.entry_type === 'PROVIDER_PAYOUT'
                          ? 'text-purple-700'
                          : 'text-foreground'
                    }`}
                  >
                    {entry.entry_type === 'PROVIDER_PAYOUT' ? '-' : '+'}₹{entry.amount.toFixed(2)}
                  </span>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">{entry.entry_type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
