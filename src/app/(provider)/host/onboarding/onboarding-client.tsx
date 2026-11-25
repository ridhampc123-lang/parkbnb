'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  CreditCard,
  ArrowRight,
  Info,
  Check
} from 'lucide-react';
import { ProviderProfile, Profile } from '@/types/database';
import { submitHostOnboardingKYCAction } from '@/server/actions/host-actions';

interface HostOnboardingClientProps {
  provider: ProviderProfile | null;
  profile: Profile | null;
}

export function HostOnboardingClient({
  provider,
  profile,
}: HostOnboardingClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const status = provider?.verification_status || 'draft';

  // Form states
  const [providerType, setProviderType] = useState(provider?.provider_type || 'individual_residential');
  const [businessName, setBusinessName] = useState(provider?.business_name || '');
  const [panNumber, setPanNumber] = useState(provider?.pan_number || '');
  const [gstin, setGstin] = useState(provider?.gstin || '');
  const [authorityEvidence, setAuthorityEvidence] = useState('');
  const [bankName, setBankName] = useState(provider?.bank_name || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(provider?.bank_account_number || '');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(provider?.bank_account_number || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(provider?.bank_account_holder || profile?.full_name || '');
  const [bankIfscCode, setBankIfscCode] = useState(provider?.bank_ifsc_code || '');
  const [upiId, setUpiId] = useState(provider?.upi_id || '');
  const [payoutPreference, setPayoutPreference] = useState<'bank_transfer' | 'upi'>(provider?.payout_preference || 'bank_transfer');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (bankAccountNumber && confirmAccountNumber && bankAccountNumber !== confirmAccountNumber) {
      setErrorMsg('Bank account number and confirmation number do not match.');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('provider_type', providerType);
    formData.append('business_name', businessName);
    formData.append('pan_number', panNumber);
    formData.append('gstin', gstin);
    formData.append('authority_evidence', authorityEvidence);
    formData.append('bank_name', bankName);
    formData.append('bank_account_number', bankAccountNumber);
    formData.append('bank_account_holder', bankAccountHolder);
    formData.append('bank_ifsc_code', bankIfscCode);
    formData.append('upi_id', upiId);
    formData.append('payout_preference', payoutPreference);

    try {
      const res = await submitHostOnboardingKYCAction(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Your onboarding verification has been submitted successfully for operations review.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Parking Owner Onboarding & Verification</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Complete mandatory property authority verification and bank payout setup to make your parking listings bookable.
        </p>
      </div>

      {/* Verification Status Banner */}
      <div
        className={`rounded-card p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          status === 'approved'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : status === 'submitted' || status === 'under_review'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : status === 'rejected'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-surface-muted border-border text-foreground'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {status === 'approved' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {(status === 'submitted' || status === 'under_review') && <Clock className="w-5 h-5 text-amber-600" />}
            {status === 'rejected' && <AlertTriangle className="w-5 h-5 text-red-600" />}
            {status === 'draft' && <Info className="w-5 h-5 text-primary" />}

            <span className="font-bold text-sm uppercase tracking-wide">
              Verification Status: {status.replace(/_/g, ' ')}
            </span>
          </div>

          <p className="text-xs leading-relaxed max-w-2xl">
            {status === 'approved' &&
              'Your parking provider account is fully verified. All approved listings are actively discoverable and bookable by drivers.'}
            {(status === 'submitted' || status === 'under_review') &&
              'Your verification documents have been received by our Verification & Legal review team. We typically review society permissions and documents within 24-48 business hours.'}
            {status === 'rejected' &&
              `Verification was declined: "${provider?.rejection_reason || 'Incomplete documentation'}". Please review the requirements below and resubmit.`}
            {status === 'draft' &&
              'Please complete the verification form below to activate your host account. Unverified hosts cannot receive driver bookings.'}
          </p>
        </div>

        {status === 'approved' && (
          <Link
            href="/host/spaces/new"
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow-xs shrink-0 flex items-center gap-1.5"
          >
            <span>+ List New Space</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Verification Form */}
      <div className="bg-surface rounded-card p-6 border border-border shadow-xs space-y-6">
        {errorMsg && (
          <div className="p-3.5 bg-red-50 text-danger border border-red-200 rounded-control text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-control text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Entity & Property Authority */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2.5">
              <Building className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                1. Provider Entity & Legal Authority
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Provider Type
                </label>
                <select
                  value={providerType}
                  onChange={(e) => setProviderType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs focus:ring-2 focus:ring-primary/20"
                >
                  <option value="individual_residential">Individual / Residential Apartment Owner</option>
                  <option value="commercial_operator">Commercial Parking Lot / Mall Operator</option>
                  <option value="authorized_agent">Authorized Property Manager / Estate Agent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Business / Building Display Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="E.g. Shivalik Heights Residents Association / Central Mall Parking"
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Property Right / Society Permission Notes
              </label>
              <textarea
                rows={3}
                value={authorityEvidence}
                onChange={(e) => setAuthorityEvidence(e.target.value)}
                placeholder="E.g., Allocated slot under society allotment letter dated 15/03/2024. Society allows visitor parking under written bye-law resolution #14..."
                className="w-full p-3 rounded-control border border-border bg-surface text-foreground text-xs focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Do not claim society parking is eligible without legal authority or association permission.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  PAN Number (Mandatory for Tax TDS)
                </label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs font-mono uppercase focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  GSTIN (Optional for Individuals)
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  maxLength={15}
                  placeholder="24AABCT1234E1Z5"
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs font-mono uppercase focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payout Settlement Setup */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-border pb-2.5">
              <CreditCard className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                2. Bank Account & UPI Settlement
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Settlement Method Preference
                </label>
                <select
                  value={payoutPreference}
                  onChange={(e) => setPayoutPreference(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs focus:ring-2 focus:ring-primary/20"
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
                  placeholder="e.g. yourname@okhdfcbank or 9876543210@upi"
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs font-mono focus:ring-2 focus:ring-primary/20"
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
                  placeholder="HDFC Bank, State Bank of India, ICICI..."
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Account Holder Legal Name
                </label>
                <input
                  type="text"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  placeholder="Name as printed on bank passbook"
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs focus:ring-2 focus:ring-primary/20"
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
                  placeholder="Enter 9 to 18 digit account number"
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs font-mono focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Confirm Bank Account Number
                </label>
                <input
                  type="text"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                  placeholder="Re-enter bank account number"
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs font-mono focus:ring-2 focus:ring-primary/20"
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
                placeholder="e.g. HDFC0001234 or SBIN0000456"
                className="w-full sm:w-1/2 px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs font-mono uppercase focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting Verification...' : 'Submit Verification for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
