'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FinancialLedgerEntry, ProviderProfile } from '@/types/database';
import { updateProviderBankingAction, requestHostPayoutAction } from '@/server/actions/host-actions';
import {
  IndianRupee,
  Building,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowDownCircle,
  Send,
  Loader2,
  X,
  CreditCard,
  QrCode,
  FileText
} from 'lucide-react';

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
  const router = useRouter();

  // Banking Setup State
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankAccount, setBankAccount] = useState(provider?.bank_account_number || '');
  const [ifsc, setIfsc] = useState(provider?.bank_ifsc_code || '');
  const [holder, setHolder] = useState(provider?.bank_account_holder || '');
  const [upi, setUpi] = useState(provider?.upi_id || '');
  const [bankSaving, setBankSaving] = useState(false);
  const [bankFeedback, setBankFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Payout Request State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'NEFT' | 'IMPS' | 'UPI'>('UPI');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutFeedback, setPayoutFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filter State
  const [filterType, setFilterType] = useState<'all' | 'PROVIDER_PAYABLE' | 'PROVIDER_PAYOUT'>('all');

  // Calculate balances
  const totalPayouts = ledger
    .filter((l) => l.entry_type === 'PROVIDER_PAYOUT')
    .reduce((sum, l) => sum + l.amount, 0);

  const availableBalance = Math.max(0, totalEarned - totalPayouts);

  // Handle Save Banking Form
  async function handleSaveBanking(e: React.FormEvent) {
    e.preventDefault();
    setBankSaving(true);
    setBankFeedback(null);

    const formData = new FormData();
    formData.append('bank_account_number', bankAccount);
    formData.append('bank_ifsc_code', ifsc);
    formData.append('bank_account_holder', holder);
    formData.append('upi_id', upi);

    const result = await updateProviderBankingAction(formData);
    setBankSaving(false);

    if (result.error) {
      setBankFeedback({ message: result.error, type: 'error' });
    } else {
      setBankFeedback({ message: 'Banking & UPI settlement credentials saved successfully.', type: 'success' });
      setTimeout(() => {
        setIsBankModalOpen(false);
        router.refresh();
      }, 1200);
    }
  }

  // Handle Request Payout
  async function handleRequestPayout(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0) {
      setPayoutFeedback({ message: 'Please enter a valid amount.', type: 'error' });
      return;
    }

    if (amount > availableBalance) {
      setPayoutFeedback({
        message: `Amount exceeds available escrow balance (₹${availableBalance.toFixed(2)}).`,
        type: 'error',
      });
      return;
    }

    setPayoutLoading(true);
    setPayoutFeedback(null);

    const result = await requestHostPayoutAction({
      amount,
      paymentMethod: payoutMethod,
    });

    setPayoutLoading(false);

    if (result.error) {
      setPayoutFeedback({ message: result.error, type: 'error' });
    } else {
      setPayoutFeedback({
        message: `Payout of ₹${amount.toFixed(2)} initiated via ${payoutMethod}. Transfer Ref: ${result.reference}`,
        type: 'success',
      });
      setTimeout(() => {
        setIsPayoutModalOpen(false);
        setPayoutAmount('');
        router.refresh();
      }, 1500);
    }
  }

  const filteredLedger = ledger.filter((l) => {
    if (filterType !== 'all') {
      return l.entry_type === filterType;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Host Financial Ledger & Settlement</h2>
          <p className="text-xs text-muted-foreground">
            Immutable double-entry ledger. Net booking credits, platform commission deductions, and bank payouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBankModalOpen(true)}
            className="px-3.5 py-2 bg-surface border border-border hover:bg-surface-muted text-foreground text-xs font-semibold rounded-control shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Building className="w-4 h-4 text-primary" />
            <span>Settlement Settings</span>
          </button>

          <button
            onClick={() => {
              setPayoutAmount(availableBalance.toFixed(0));
              setIsPayoutModalOpen(true);
            }}
            disabled={availableBalance <= 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-control shadow transition-colors flex items-center gap-1.5"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Withdraw Earnings</span>
          </button>
        </div>
      </div>

      {/* KPI Balances Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Available Escrow Balance */}
        <div className="bg-surface p-5 rounded-card border-2 border-emerald-500/30 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            Available for Withdrawal
          </span>
          <div className="text-2xl font-black text-emerald-700 font-mono">₹{availableBalance.toFixed(2)}</div>
          <span className="text-[11px] text-muted-foreground block">Cleared from completed bookings</span>
        </div>

        {/* Total Lifetime Earnings */}
        <div className="bg-surface p-5 rounded-card border border-border shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Total Net Earnings
          </span>
          <div className="text-2xl font-black text-foreground font-mono">₹{totalEarned.toFixed(2)}</div>
          <span className="text-[11px] text-muted-foreground block">Gross receipts minus commission</span>
        </div>

        {/* Total Disbursed */}
        <div className="bg-surface p-5 rounded-card border border-border shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Disbursed to Bank / UPI
          </span>
          <div className="text-2xl font-black text-purple-700 font-mono">₹{totalPayouts.toFixed(2)}</div>
          <span className="text-[11px] text-muted-foreground block">Settled to your verified accounts</span>
        </div>

        {/* Account Status */}
        <div className="bg-surface p-5 rounded-card border border-border shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Settlement Account
          </span>
          <div className="text-xs font-bold text-foreground font-mono truncate">
            {provider?.upi_id ? (
              <span className="text-emerald-700">UPI: {provider.upi_id}</span>
            ) : provider?.bank_account_number ? (
              <span>A/C: ****{provider.bank_account_number.slice(-4)}</span>
            ) : (
              <span className="text-amber-600 font-sans">Setup Required</span>
            )}
          </div>
          <button
            onClick={() => setIsBankModalOpen(true)}
            className="text-[11px] text-primary hover:underline font-semibold block text-left mt-1"
          >
            {provider?.bank_account_number || provider?.upi_id ? 'Update credentials →' : 'Add Bank / UPI now →'}
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-surface rounded-card border border-border overflow-hidden space-y-4 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Double-Entry Ledger Audit ({filteredLedger.length})
            </h3>
            <p className="text-[11px] text-muted-foreground">Every credit and payout is cryptographically tracked.</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="text-xs py-1.5 px-3 bg-surface-muted border border-border rounded-control text-foreground font-medium focus:outline-none"
            >
              <option value="all">All Transactions</option>
              <option value="PROVIDER_PAYABLE">Booking Credits (+)</option>
              <option value="PROVIDER_PAYOUT">Bank Withdrawals (-)</option>
            </select>
          </div>
        </div>

        {filteredLedger.length === 0 ? (
          <div className="text-xs text-muted-foreground py-10 text-center space-y-1">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-foreground">No ledger transactions posted yet.</p>
            <p>When drivers book and clear your spaces, credit entries will appear here automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredLedger.map((entry) => {
              const isCredit = entry.entry_type === 'PROVIDER_PAYABLE';
              const isPayout = entry.entry_type === 'PROVIDER_PAYOUT';

              return (
                <div key={entry.id} className="py-3.5 flex items-center justify-between text-xs hover:bg-surface-muted/40 transition-colors px-2 rounded-control">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground flex items-center gap-2">
                      <span>{entry.description}</span>
                      <span
                        className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full ${
                          isCredit
                            ? 'bg-emerald-50 text-emerald-700 font-bold'
                            : isPayout
                              ? 'bg-purple-50 text-purple-700 font-bold'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isCredit ? 'Booking Credit' : isPayout ? 'Bank Settlement' : entry.entry_type}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-[11px] font-mono">
                      {new Date(entry.created_at).toLocaleString()} • Ref: {entry.reference_id || 'System'}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono text-sm font-black ${
                        isCredit ? 'text-emerald-700' : isPayout ? 'text-purple-700' : 'text-foreground'
                      }`}
                    >
                      {isCredit ? '+' : isPayout ? '-' : ''}₹{entry.amount.toFixed(2)}
                    </span>
                    <div className="text-[10px] text-muted-foreground font-mono">INR Settlement</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal 1: Banking & UPI Settlement Setup */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-border shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Settlement Banking & UPI Settings</h3>
              </div>
              <button onClick={() => setIsBankModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {bankFeedback && (
              <div
                className={`p-3 rounded-control text-xs flex items-center gap-2 ${
                  bankFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-danger border border-red-200'
                }`}
              >
                {bankFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{bankFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveBanking} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">UPI ID (Fastest Settlement)</label>
                <div className="relative">
                  <QrCode className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={upi}
                    onChange={(e) => setUpi(e.target.value)}
                    placeholder="e.g. host@okhdfcbank / yourname@icici"
                    className="w-full pl-9 pr-3 py-2 bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">Instant 24/7 payouts via NPCI UPI</span>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-[11px] font-bold text-primary uppercase block mb-2">NEFT / IMPS Bank Account</span>

                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={holder}
                      onChange={(e) => setHolder(e.target.value)}
                      placeholder="e.g. Rajesh Patel / Shivalik Precinct LLP"
                      className="w-full px-3 py-2 bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="e.g. 50200012345678"
                      className="w-full px-3 py-2 bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Bank IFSC Code</label>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      maxLength={11}
                      className="w-full px-3 py-2 bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono uppercase font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-3 py-2 text-muted-foreground hover:bg-surface-muted rounded-control font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bankSaving}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-control shadow flex items-center gap-1.5"
                >
                  {bankSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Banking Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Withdraw Payout */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-border shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-foreground">Withdraw Escrow Earnings</h3>
              </div>
              <button onClick={() => setIsPayoutModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {payoutFeedback && (
              <div
                className={`p-3 rounded-control text-xs flex items-center gap-2 ${
                  payoutFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-danger border border-red-200'
                }`}
              >
                {payoutFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{payoutFeedback.message}</span>
              </div>
            )}

            <div className="bg-surface-muted p-3 rounded-control border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Available Withdrawable Balance:</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">₹{availableBalance.toFixed(2)}</span>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">Withdrawal Amount (₹)</label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="1"
                    max={availableBalance}
                    step="1"
                    required
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full pl-9 pr-3 py-2 bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Disbursement Channel</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-semibold"
                >
                  <option value="UPI">UPI Instant (to {provider?.upi_id || 'Configured UPI'})</option>
                  <option value="IMPS">IMPS Instant Bank Transfer (24/7)</option>
                  <option value="NEFT">NEFT Direct Bank Settlement</option>
                </select>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-3 py-2 text-muted-foreground hover:bg-surface-muted rounded-control font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutLoading || availableBalance <= 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-control shadow flex items-center gap-1.5"
                >
                  {payoutLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
