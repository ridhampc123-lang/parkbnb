'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { registerAction } from '@/server/actions/auth-actions';
import {
  Car,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  Loader2,
  CreditCard,
  Building,
  CheckCircle2,
  Send,
  HelpCircle
} from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') === 'provider' ? 'provider' : 'customer';

  const [role, setRole] = useState<'customer' | 'provider'>(defaultRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Host Payout Fields
  const [bankHolder, setBankHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upi, setUpi] = useState('');
  const [payoutPref, setPayoutPref] = useState<'bank_transfer' | 'upi'>('bank_transfer');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // If provider, perform client validation on payout details
    if (role === 'provider') {
      if (accountNumber && confirmAccount && accountNumber !== confirmAccount) {
        setError('Bank account number and confirmation account number do not match.');
        return;
      }
      if (accountNumber && !/^\d{9,18}$/.test(accountNumber.trim())) {
        setError('Please enter a valid 9 to 18-digit bank account number.');
        return;
      }
      if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase())) {
        setError('Please enter a valid 11-digit IFSC code (e.g. SBIN0001234, HDFC0000240).');
        return;
      }
      if (upi && !/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi.trim())) {
        setError('Please enter a valid UPI ID (e.g. name@okhdfcbank or 9876543210@upi).');
        return;
      }
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('role', role);

    if (role === 'provider') {
      formData.set('bank_account_holder', bankHolder.trim());
      formData.set('bank_name', bankName.trim());
      formData.set('bank_account_number', accountNumber.trim());
      formData.set('confirm_account_number', confirmAccount.trim());
      formData.set('bank_ifsc_code', ifsc.trim().toUpperCase());
      formData.set('upi_id', upi.trim());
      formData.set('payout_preference', payoutPref);
    }

    const result = await registerAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      if (role === 'provider') {
        router.push('/host');
      } else {
        router.push('/account');
      }
      router.refresh();
    }
  }

  return (
    <div className={`w-full ${role === 'provider' ? 'max-w-xl' : 'max-w-md'} bg-surface p-8 rounded-card border border-border shadow-card space-y-6 transition-all duration-200`}>
      <div className="text-center space-y-2">
        <div className="inline-flex p-2 rounded-control bg-primary-soft text-primary mb-1">
          <Car className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Create your account</h1>
        <p className="text-xs text-muted-foreground">Join the verified parking marketplace in Ahmedabad</p>
      </div>

      {/* Account Role Selector */}
      <div className="grid grid-cols-2 gap-2 bg-surface-muted p-1 rounded-control border border-border">
        <button
          type="button"
          onClick={() => setRole('customer')}
          className={`py-1.5 text-xs font-semibold rounded-control transition-all ${
            role === 'customer'
              ? 'bg-surface text-primary shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Driver / Customer
        </button>
        <button
          type="button"
          onClick={() => setRole('provider')}
          className={`py-1.5 text-xs font-semibold rounded-control transition-all ${
            role === 'provider'
              ? 'bg-surface text-primary shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Parking Space Host
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-control text-xs space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          {error.includes('already exists') && (
            <div className="pt-1.5 border-t border-red-200 text-[11px]">
              Already registered?{' '}
              <Link
                href="/login"
                className="font-bold text-primary underline hover:text-primary-hover"
              >
                Sign in with Password or Mobile OTP &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Full Legal Name</label>
          <div className="relative">
            <User className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              name="full_name"
              required
              placeholder="e.g. Amit Shah"
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="email"
              name="email"
              required
              placeholder="name@example.com"
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Indian Mobile Number</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="tel"
              name="phone"
              placeholder="9876543210"
              maxLength={10}
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Password (min 6 characters)</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
            />
          </div>
        </div>

        {/* Payout Details Section for Parking Space Host */}
        {role === 'provider' && (
          <div className="pt-4 border-t border-border space-y-3 bg-surface-muted/60 p-4 rounded-control border border-border">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-control bg-emerald-50 text-emerald-800">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">
                  Payout Settlement Destination
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  To which bank account or UPI ID should Parkbnb disburse your parking booking earnings?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Bank Account Holder Name
                </label>
                <input
                  type="text"
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  placeholder="As per bank passbook / cheque"
                  className="w-full px-3 py-1.5 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. SBI, HDFC, ICICI, Kotak"
                  className="w-full px-3 py-1.5 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Bank Account Number
                </label>
                <input
                  type="password"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="9 to 18-digit account number"
                  maxLength={18}
                  className="w-full px-3 py-1.5 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Confirm Bank Account Number
                </label>
                <input
                  type="text"
                  value={confirmAccount}
                  onChange={(e) => setConfirmAccount(e.target.value)}
                  placeholder="Re-enter bank account number"
                  maxLength={18}
                  className="w-full px-3 py-1.5 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Bank IFSC Code (11 characters)
                </label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0001234 / HDFC0000240"
                  maxLength={11}
                  className="w-full px-3 py-1.5 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  UPI ID (Optional for Instant UPI)
                </label>
                <input
                  type="text"
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  placeholder="e.g. 9876543210@upi / name@okhdfc"
                  className="w-full px-3 py-1.5 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                Preferred Payout Disbursement Method
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPayoutPref('bank_transfer')}
                  className={`p-2 rounded-control border text-left transition-colors ${
                    payoutPref === 'bank_transfer'
                      ? 'border-primary bg-primary-soft text-primary font-bold'
                      : 'border-border bg-surface text-muted-foreground'
                  }`}
                >
                  <div className="text-[11px]">Direct Bank NEFT / IMPS</div>
                  <div className="text-[9px] text-muted-foreground">Direct account settlement</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutPref('upi')}
                  className={`p-2 rounded-control border text-left transition-colors ${
                    payoutPref === 'upi'
                      ? 'border-primary bg-primary-soft text-primary font-bold'
                      : 'border-border bg-surface text-muted-foreground'
                  }`}
                >
                  <div className="text-[11px]">Instant UPI Transfer</div>
                  <div className="text-[9px] text-muted-foreground">Immediate settlement to VPA</div>
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-control shadow transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{role === 'provider' ? 'Register Host Account & Payout Details' : 'Create Account'}</span>}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-border/80 text-xs text-muted-foreground">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 bg-surface-muted/40">
      <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
