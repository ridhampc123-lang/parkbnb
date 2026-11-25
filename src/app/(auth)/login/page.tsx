'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  loginAction,
  customerLoginWithOtpAction,
  setAccountPasswordWithOtpAction,
} from '@/server/actions/auth-actions';
import { sendOtpAction } from '@/server/actions/otp-actions';
import {
  Car,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Smartphone,
  KeyRound,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // Mode: 'otp' | 'password' | 'set_password'
  const [loginMode, setLoginMode] = useState<'otp' | 'password' | 'set_password'>('otp');

  // Common UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorPhone, setErrorPhone] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email & Password Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Mobile OTP Fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Set Password Fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP Cooldown Timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // -------------------------------------------------------------
  // Handler 1: Email & Password Sign In
  // -------------------------------------------------------------
  async function handleEmailPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    setErrorPhone(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const result = await loginAction(formData);

    if (result?.error) {
      setError(result.error);
      if ((result as any).code) {
        setErrorCode((result as any).code);
      }
      if ((result as any).phone) {
        setErrorPhone((result as any).phone);
      }
      setLoading(false);
    } else if (result?.success) {
      if (result.role === 'admin' || result.role === 'super_admin') {
        window.location.href = '/admin';
      } else if (result.role === 'provider') {
        window.location.href = '/host';
      } else {
        window.location.href = '/account';
      }
    }
  }

  // -------------------------------------------------------------
  // Handler 2: Send Mobile OTP
  // -------------------------------------------------------------
  async function handleSendOtp() {
    setError(null);
    setSuccessMessage(null);

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }

    setLoading(true);
    const result = await sendOtpAction(cleanPhone);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setOtpSent(true);
      setOtpCooldown(result.cooldownSeconds || 60);
      setDevCode(result.devCode || null);
      setSuccessMessage(result.message || `Verification code sent to +91 ${cleanPhone}`);
    }
  }

  // -------------------------------------------------------------
  // Handler 3: Verify Mobile OTP & Sign In
  // -------------------------------------------------------------
  async function handleVerifyOtpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Please enter the 6-digit numeric verification code.');
      return;
    }

    setLoading(true);
    const result = await customerLoginWithOtpAction({
      phone: cleanPhone,
      otp: otp.trim(),
    });
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      if (result.role === 'admin' || result.role === 'super_admin') {
        window.location.href = '/admin';
      } else if (result.role === 'provider') {
        window.location.href = '/host';
      } else {
        window.location.href = '/account';
      }
    }
  }

  // -------------------------------------------------------------
  // Handler 4: Set New Password via Mobile OTP
  // -------------------------------------------------------------
  async function handleSetPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    const result = await setAccountPasswordWithOtpAction({
      phone: cleanPhone,
      otp: otp.trim(),
      newPassword,
      email: email || undefined,
    });
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccessMessage('Password saved successfully! Redirecting to your dashboard...');
      setTimeout(() => {
        if (result.role === 'admin' || result.role === 'super_admin') {
          window.location.href = '/admin';
        } else if (result.role === 'provider') {
          window.location.href = '/host';
        } else {
          window.location.href = '/account';
        }
      }, 1000);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 bg-surface-muted/40">
      <div className="w-full max-w-md bg-surface p-6 sm:p-8 rounded-card border border-border shadow-card space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-2 rounded-control bg-primary-soft text-primary mb-1">
            <Car className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Sign in to ParkBnB</h1>
          <p className="text-xs text-muted-foreground">Access your bookings, saved vehicles, or parking listings</p>
        </div>

        {/* Mode Switcher Tabs */}
        {loginMode !== 'set_password' && (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-muted rounded-control border border-border text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setLoginMode('otp');
                setError(null);
                setErrorCode(null);
              }}
              className={`py-2 px-3 rounded-control flex items-center justify-center gap-1.5 transition-all ${
                loginMode === 'otp'
                  ? 'bg-surface text-primary shadow-sm border border-border/80 font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile OTP</span>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded-full hidden sm:inline">
                Instant
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('password');
                setError(null);
                setErrorCode(null);
              }}
              className={`py-2 px-3 rounded-control flex items-center justify-center gap-1.5 transition-all ${
                loginMode === 'password'
                  ? 'bg-surface text-primary shadow-sm border border-border/80 font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>
          </div>
        )}

        {/* Clear Actionable Warning / Error Resolution */}
        {error && (
          <div className="space-y-2">
            {errorCode === 'NO_PASSWORD_SET' ? (
              <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-control text-xs space-y-2 shadow-sm">
                <div className="flex items-start gap-2 font-bold text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <span>Account Created Without a Password</span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  This account was created via Mobile Verification without an email password. You can sign in right now with your phone, or create a password.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (errorPhone) {
                        setPhone(errorPhone);
                      }
                      setLoginMode('otp');
                      setError(null);
                      setErrorCode(null);
                    }}
                    className="py-1.5 px-3 bg-primary text-white font-semibold rounded-control text-xs hover:bg-primary-hover shadow-sm flex items-center gap-1"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Sign in with Mobile OTP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (errorPhone) setPhone(errorPhone);
                      setLoginMode('set_password');
                      setError(null);
                      setErrorCode(null);
                    }}
                    className="py-1.5 px-3 bg-white border border-amber-300 text-amber-900 font-semibold rounded-control text-xs hover:bg-amber-100"
                  >
                    Set Password Now
                  </button>
                </div>
              </div>
            ) : errorCode === 'INVALID_PASSWORD' ? (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-control text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
                <div className="text-[11px] text-red-700 pt-1 border-t border-red-200/60">
                  Forgot your password? You can log in directly using Mobile OTP:{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (errorPhone) setPhone(errorPhone);
                      setLoginMode('otp');
                      setError(null);
                      setErrorCode(null);
                    }}
                    className="font-bold underline text-primary ml-1"
                  >
                    Use Mobile OTP &rarr;
                  </button>
                </div>
              </div>
            ) : errorCode === 'ACCOUNT_NOT_FOUND' ? (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-control text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold block">Account not found</span>
                  <span>
                    No account matches this email.{' '}
                    <Link href="/register" className="font-bold underline text-primary">
                      Register a new account
                    </Link>{' '}
                    or try Mobile OTP.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 text-danger rounded-control text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Success Message Banner */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-control text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: MOBILE OTP SIGN IN                                     */}
        {/* ------------------------------------------------------------- */}
        {loginMode === 'otp' && (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Indian Mobile Number
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    maxLength={10}
                    required
                    className="w-full pl-12 pr-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground font-mono font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || phone.replace(/\D/g, '').length < 10 || otpCooldown > 0}
                  className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-control transition-colors disabled:opacity-50 shrink-0"
                >
                  {otpCooldown > 0 ? (
                    `Resend in ${otpCooldown}s`
                  ) : otpSent ? (
                    'Resend Code'
                  ) : (
                    'Send Code'
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Works for all accounts created during checkout or registration.
              </p>
            </div>

            {/* OTP Code Input (Appears once code sent) */}
            {otpSent && (
              <div className="space-y-2 pt-1 border-t border-border">
                <label className="block text-xs font-semibold text-foreground">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    maxLength={6}
                    required
                    autoFocus
                    className="w-full text-center tracking-[0.5em] text-lg font-bold font-mono py-2 bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  />
                </div>

                {devCode && (
                  <div className="p-2 bg-purple-50 border border-purple-200 text-purple-900 rounded-control text-[11px] flex items-center justify-between font-mono">
                    <span>Dev OTP Code: <strong>{devCode}</strong></span>
                    <button
                      type="button"
                      onClick={() => setOtp(devCode)}
                      className="underline font-bold text-purple-700 hover:text-purple-800"
                    >
                      Fill Code
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-control shadow transition-colors disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify & Sign In</span>}
                </button>
              </div>
            )}
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: EMAIL & PASSWORD SIGN IN                               */}
        {/* ------------------------------------------------------------- */}
        {loginMode === 'password' && (
          <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-foreground">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('set_password');
                    setError(null);
                    setErrorCode(null);
                  }}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Forgot or need to set password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-control shadow transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In with Password</span>}
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: SET / RESET ACCOUNT PASSWORD VIA MOBILE OTP            */}
        {/* ------------------------------------------------------------- */}
        {loginMode === 'set_password' && (
          <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-control text-xs flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <strong className="block font-semibold">Set Account Password</strong>
                Verify your mobile number to establish or update your password.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    maxLength={10}
                    required
                    className="w-full pl-12 pr-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || phone.replace(/\D/g, '').length < 10 || otpCooldown > 0}
                  className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-control transition-colors disabled:opacity-50 shrink-0"
                >
                  {otpCooldown > 0 ? `${otpCooldown}s` : 'Send Code'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                className="w-full px-3 py-2 text-sm bg-surface-muted border border-border rounded-control text-center tracking-[0.3em] font-mono font-bold focus:outline-none focus:border-primary text-foreground"
              />
            </div>

            {devCode && (
              <div className="p-2 bg-purple-50 border border-purple-200 text-purple-900 rounded-control text-[11px] flex items-center justify-between font-mono">
                <span>Dev OTP Code: <strong>{devCode}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtp(devCode)}
                  className="underline font-bold text-purple-700 hover:text-purple-800"
                >
                  Fill Code
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                New Password (min 6 characters)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-3 py-2 text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('password');
                  setError(null);
                  setErrorCode(null);
                }}
                className="w-1/3 py-2 px-3 border border-border text-foreground font-semibold rounded-control text-xs hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2 px-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-control text-xs shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Password & Sign In</span>}
              </button>
            </div>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="text-center pt-2 border-t border-border/80 text-xs text-muted-foreground space-y-2">
          <div>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Register here
            </Link>
          </div>
          <div className="pt-1">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 font-semibold text-purple-700 hover:text-purple-800 text-[11px] bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-control border border-purple-200 transition-colors"
            >
              <span>ParkBnB Staff or Administrator? Open Admin Portal &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
