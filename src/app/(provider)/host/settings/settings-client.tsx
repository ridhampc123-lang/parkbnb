'use client';

import { useState } from 'react';
import {
  Building,
  CreditCard,
  Bell,
  KeyRound,
  ShieldCheck,
  Check,
  AlertTriangle,
  LogOut,
  Save
} from 'lucide-react';
import { ProviderProfile, Profile } from '@/types/database';
import { updateHostSettingsAction } from '@/server/actions/host-actions';
import { logoutAction } from '@/server/actions/auth-actions';

interface HostSettingsClientProps {
  provider: ProviderProfile | null;
  profile: Profile | null;
}

export function HostSettingsClient({
  provider,
  profile,
}: HostSettingsClientProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [businessName, setBusinessName] = useState(provider?.business_name || '');
  const [bankName, setBankName] = useState(provider?.bank_name || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(provider?.bank_account_number || '');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(provider?.bank_account_number || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(provider?.bank_account_holder || profile?.full_name || '');
  const [bankIfscCode, setBankIfscCode] = useState(provider?.bank_ifsc_code || '');
  const [upiId, setUpiId] = useState(provider?.upi_id || '');
  const [payoutPreference, setPayoutPreference] = useState<'bank_transfer' | 'upi'>(provider?.payout_preference || 'bank_transfer');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);

    if (bankAccountNumber && confirmAccountNumber && bankAccountNumber !== confirmAccountNumber) {
      setMsg({ type: 'error', text: 'Bank account number and confirmation number do not match.' });
      setIsSaving(false);
      return;
    }

    const formData = new FormData();
    formData.append('business_name', businessName);
    formData.append('bank_name', bankName);
    formData.append('bank_account_number', bankAccountNumber);
    formData.append('bank_account_holder', bankAccountHolder);
    formData.append('bank_ifsc_code', bankIfscCode);
    formData.append('upi_id', upiId);
    formData.append('payout_preference', payoutPreference);

    try {
      const res = await updateHostSettingsAction(formData);
      if (res.error) {
        setMsg({ type: 'error', text: res.error });
      } else {
        setMsg({ type: 'success', text: 'Settlement settings and preferences updated successfully.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Failed to update settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Host Settings & Settlement</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Configure payout destination accounts, banking IFSC details, and gate arrival notification channels.
        </p>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-control text-xs font-semibold flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {msg.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 bg-surface rounded-card p-6 border border-border shadow-xs space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Business Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Building className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Host Profile Information
                </h2>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Business / Property Title
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Shivalik Heights Parking Allotment"
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Payout & Banking */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <CreditCard className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Payout Settlement Destination
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Settlement Method
                  </label>
                  <select
                    value={payoutPreference}
                    onChange={(e) => setPayoutPreference(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs"
                  >
                    <option value="bank_transfer">Direct Bank Transfer (NEFT / IMPS)</option>
                    <option value="upi">Instant UPI Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    UPI ID (VPA)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="name@okhdfcbank"
                    className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="HDFC Bank, ICICI Bank..."
                    className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder="Legal name as in bank passbook"
                    className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="password"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                    className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Confirm Account Number
                  </label>
                  <input
                    type="text"
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value)}
                    placeholder="Re-enter account number"
                    className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Bank IFSC Code
                </label>
                <input
                  type="text"
                  value={bankIfscCode}
                  onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                  maxLength={11}
                  placeholder="HDFC0001234"
                  className="w-full sm:w-1/2 px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs font-mono uppercase"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Settings...' : 'Save Settlement Details'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Security & Sessions */}
        <div className="space-y-6">
          <div className="bg-surface rounded-card p-6 border border-border shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <KeyRound className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Host Operator Session</h3>
            </div>

            <div className="p-3.5 bg-surface-muted rounded-control border border-border space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Operator Role</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Provider</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Verified Parking Provider • RBAC Gate Manifest Clearance
              </p>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full py-2 px-3 border border-border hover:bg-surface-muted text-xs font-bold text-foreground rounded-control transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Host Console</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
