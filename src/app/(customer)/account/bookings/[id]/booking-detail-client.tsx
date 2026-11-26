'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  LifeBuoy,
  Star,
  Loader2,
  Lock,
  Plus,
  RotateCcw,
  QrCode,
  IndianRupee,
  Receipt,
  LogIn,
  LogOut,
  Navigation,
  Check,
  Sparkles
} from 'lucide-react';
import {
  cancelBookingAction,
  extendBookingAction,
  customerCheckInAction,
  customerCheckOutAction
} from '@/server/actions/booking-actions';
import { submitReviewAction } from '@/server/actions/review-actions';
import { Booking } from '@/types/database';

export function BookingDetailClient({ booking }: { booking: Booking }) {
  const router = useRouter();

  const [currentBooking, setCurrentBooking] = useState<Booking>(booking);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // In / Out Gate Management state
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [gateFeedback, setGateFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live timer for active sessions
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (currentBooking.status === 'active') {
      const timer = setInterval(() => setNow(Date.now()), 30000);
      return () => clearInterval(timer);
    }
  }, [currentBooking.status]);

  // Extension state
  const [extendHours, setExtendHours] = useState(1);
  const [extending, setExtending] = useState(false);
  const [extendFeedback, setExtendFeedback] = useState<string | null>(null);

  // Review state
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Handle Customer Check-In (When In)
  async function handleCheckIn() {
    if (!confirm('Confirm arrival at the gate and check in to your assigned parking slot?')) return;
    setCheckInLoading(true);
    setGateFeedback(null);

    const result = await customerCheckInAction(currentBooking.id);
    setCheckInLoading(false);

    if (result.error) {
      setGateFeedback({ type: 'error', message: result.error });
    } else if (result.booking) {
      setCurrentBooking(result.booking);
      setGateFeedback({
        type: 'success',
        message: `Check-in confirmed! Your vehicle is cleared for entry into Slot ${result.booking.space?.identifier || 'B-14'}.`,
      });
      router.refresh();
    }
  }

  // Handle Customer Check-Out (When Out)
  async function handleCheckOut() {
    if (!confirm('Confirm departure from the premises and release your parking slot?')) return;
    setCheckOutLoading(true);
    setGateFeedback(null);

    const result = await customerCheckOutAction(currentBooking.id);
    setCheckOutLoading(false);

    if (result.error) {
      setGateFeedback({ type: 'error', message: result.error });
    } else if (result.booking) {
      setCurrentBooking(result.booking);
      let msg = 'Vehicle departure logged and parking slot released back to inventory.';
      if (result.overstayMinutes && result.overstayMinutes > 0) {
        msg += ` Note: Overstay of ${result.overstayMinutes} minutes recorded (Additional charge: ₹${result.overstayAmount}).`;
      }
      setGateFeedback({ type: 'success', message: msg });
      router.refresh();
    }
  }

  async function handleCancel() {
    if (
      !confirm(
        'Are you sure you want to cancel this booking? 100% full refund is credited to your ledger account automatically.'
      )
    )
      return;
    setCancelling(true);
    setCancelError(null);

    const result = await cancelBookingAction(currentBooking.id, 'Customer requested cancellation via self-service portal');
    if (result.error) {
      setCancelError(result.error);
      setCancelling(false);
    } else {
      router.push('/account/bookings');
    }
  }

  async function handleExtend() {
    setExtending(true);
    setExtendFeedback(null);

    const result = await extendBookingAction({
      bookingId: currentBooking.id,
      additionalHours: extendHours,
    });

    setExtending(false);

    if (result.error) {
      setExtendFeedback(`Extension failed: ${result.error}`);
    } else if (result.booking) {
      setCurrentBooking(result.booking);
      setExtendFeedback(`Successfully extended parking by ${extendHours} hour(s)!`);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setReviewSubmitting(true);

    const result = await submitReviewAction({
      bookingId: currentBooking.id,
      rating,
      comment: reviewComment,
    });

    setReviewSubmitting(false);

    if (result.success) {
      setReviewSuccess(true);
    } else {
      alert(result.error || 'Failed to submit review');
    }
  }

  // Calculate elapsed parked duration for active session
  let elapsedMinutes = 0;
  if (currentBooking.status === 'active' && currentBooking.check_in_at) {
    const startMs = new Date(currentBooking.check_in_at).getTime();
    elapsedMinutes = Math.max(1, Math.floor((now - startMs) / (1000 * 60)));
  }

  const isOverstay =
    currentBooking.status === 'active' && now > new Date(currentBooking.end_time).getTime();
  const overstayMinutes = isOverstay
    ? Math.floor((now - new Date(currentBooking.end_time).getTime()) / (1000 * 60))
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 md:pb-6">
      <div>
        <Link
          href="/account/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Bookings
        </Link>
      </div>

      {cancelError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-control text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cancelError}</span>
        </div>
      )}

      {extendFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-control text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{extendFeedback}</span>
        </div>
      )}

      {gateFeedback && (
        <div
          className={`p-3.5 rounded-control text-xs flex items-center gap-2 border animate-in fade-in duration-200 ${
            gateFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {gateFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
          )}
          <span>{gateFeedback.message}</span>
        </div>
      )}

      {/* ============================================================= */}
      {/* SECTION: REAL-TIME "WHEN IN" & "WHEN OUT" GATE MANAGEMENT PASS */}
      {/* ============================================================= */}

      {/* State 1: Confirmed Arrival Window -> Prompt to Check-In ("When In") */}
      {currentBooking.status === 'confirmed' && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-card p-6 shadow-xl space-y-4 border border-blue-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-cyan-300 border border-blue-400/30">
                <LogIn className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold block">
                  Step 1 • Gate Arrival Check-In
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">Arrived at the Parking Gate?</h2>
                <p className="text-xs text-blue-200 mt-1 max-w-lg leading-relaxed">
                  When you reach <strong className="text-white">{currentBooking.space?.property?.area || 'the premises'}</strong>, click Confirm Gate Entry to notify the security guard and start your authorized parking session in Slot <span className="font-mono font-bold text-cyan-300">{currentBooking.space?.identifier || 'B-14'}</span>.
                </p>
              </div>
            </div>

            <button
              onClick={handleCheckIn}
              disabled={checkInLoading}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {checkInLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>Confirm Gate Entry (Check In)</span>
            </button>
          </div>
        </div>
      )}

      {/* State 2: Actively Parked -> Live Timer & Check-Out ("When Out") */}
      {currentBooking.status === 'active' && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-2 border-emerald-500 rounded-card p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-wider">
                    Live Session Active
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">
                    Slot {currentBooking.space?.identifier}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white mt-0.5">Vehicle Currently Parked</h2>
              </div>
            </div>

            {/* Check-Out Action Button */}
            <button
              onClick={handleCheckOut}
              disabled={checkOutLoading}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {checkOutLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span>Confirm Gate Exit (Check Out)</span>
            </button>
          </div>

          {/* Active Session Timers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Entry Logged</span>
              <span className="font-bold text-white font-mono">
                {currentBooking.check_in_at
                  ? new Date(currentBooking.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Just now'}
              </span>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Time Elapsed</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {Math.floor(elapsedMinutes / 60)}h {elapsedMinutes % 60}m
              </span>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Booked Until</span>
              <span className="font-bold text-white font-mono">
                {new Date(currentBooking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Vehicle Plate</span>
              <span className="font-mono font-black text-cyan-300">
                {currentBooking.vehicle?.registration_number || 'Cleared Plate'}
              </span>
            </div>
          </div>

          {/* Overstay Warning Banner if driver is still parked past end_time */}
          {isOverstay && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>Overstay Warning:</strong> You have exceeded booked departure by {overstayMinutes} min. Additional hourly rate applies upon check-out.
                </span>
              </div>
              <button
                onClick={handleExtend}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg shrink-0 ml-2"
              >
                Extend Booking
              </button>
            </div>
          )}
        </div>
      )}

      {/* State 3: Completed Session -> Log Summary */}
      {currentBooking.status === 'completed' && (
        <div className="bg-surface rounded-card p-5 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Gate Entry & Exit Log Record
              </span>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
              Slot Released & Returned to Inventory
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-surface-muted p-3.5 rounded-control font-mono">
            <div>
              <span className="text-[10px] text-muted-foreground block font-sans">Check-In Timestamp</span>
              <span className="font-bold text-foreground">
                {currentBooking.check_in_at
                  ? new Date(currentBooking.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Recorded'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-sans">Check-Out Timestamp</span>
              <span className="font-bold text-foreground">
                {currentBooking.check_out_at
                  ? new Date(currentBooking.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Recorded'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-sans">Assigned Bay</span>
              <span className="font-bold text-primary">{currentBooking.space?.identifier}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-sans">Overstay Notes</span>
              <span className="font-bold text-foreground">
                {currentBooking.overstay_minutes ? `${currentBooking.overstay_minutes}m (₹${currentBooking.overstay_amount})` : 'Zero Overstay (On Time)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed Gate Clearance Pass Card */}
      <div className="bg-surface rounded-card border-2 border-emerald-500/40 p-5 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {currentBooking.status === 'confirmed'
                ? 'Confirmed Parking Pass'
                : currentBooking.status.replace(/_/g, ' ').toUpperCase()}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground mt-2">
              {currentBooking.space?.title || 'Parking Space'}
            </h1>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 flex-wrap">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                {currentBooking.space?.property?.address_line1 || 'Designated Premises'},{' '}
                {currentBooking.space?.property?.area || 'Ahmedabad'}
              </span>
              <span>•</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-muted border border-border text-foreground font-semibold">
                Space ID: {currentBooking.space_public_id || currentBooking.space?.space_public_id || 'PBN-S-VERIFIED'}
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-semibold">
                Host ID: {currentBooking.owner_public_id || 'PBN-O-VERIFIED'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-surface-muted p-4 rounded-control text-center shrink-0 border border-border flex-1 sm:flex-initial">
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Assigned Slot</div>
              <div className="text-xl font-black text-primary font-mono">
                {currentBooking.space?.identifier || 'Bay Assigned'}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {currentBooking.booking_reference}
              </div>
            </div>

            {/* Direct Google Maps Navigation Button */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${currentBooking.space?.property?.latitude && currentBooking.space?.property?.longitude ? `${currentBooking.space.property.latitude},${currentBooking.space.property.longitude}` : `${currentBooking.space?.property?.address_line1 || ''}, ${currentBooking.space?.property?.area || ''}, ${currentBooking.space?.property?.city || 'India'}`}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-control shadow transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 shrink-0 min-h-[44px]"
              title="Open directions in Google Maps"
            >
              <Navigation className="w-4 h-4 fill-white shrink-0" />
              <span className="font-bold">Directions</span>
            </a>
          </div>
        </div>

        {/* Access Instructions & Directions Box */}
        <div className="bg-primary-soft/50 rounded-card p-5 border border-primary/20 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Security Clearance & Entry Instructions
            </h2>
            <div className="text-[11px] font-mono text-muted-foreground">
              Verified Host ID: <strong className="text-purple-700">{currentBooking.owner_public_id || 'PBN-O-VERIFIED'}</strong>
            </div>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            {currentBooking.space?.access_instructions ||
              'Show your booking pass to security at the gate. Display your vehicle registration plate for verification.'}
          </p>
          <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
            <span>If the gate attendant or host denies entry, quote Host ID <strong className="font-mono text-purple-700">{currentBooking.owner_public_id || 'PBN-O-VERIFIED'}</strong> to ParkBnB 24/7 Operations for immediate resolution and 100% refund guarantee.</span>
          </div>
        </div>

        {/* Timings, Privacy Ref & Vehicle Clearance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-surface-muted rounded-control space-y-1">
            <span className="text-muted-foreground block">Arrival Window</span>
            <span className="font-bold text-foreground">
              {new Date(currentBooking.start_time).toLocaleDateString()}
            </span>
            <span className="text-[11px] text-muted-foreground block font-mono">
              {new Date(currentBooking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
              {new Date(currentBooking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="p-3.5 bg-surface-muted rounded-control space-y-1">
            <span className="text-muted-foreground block">Authorized Vehicle</span>
            <span className="font-mono font-bold text-foreground text-sm">
              {currentBooking.vehicle?.registration_number || 'Registered Plate'}
            </span>
            <span className="text-[11px] text-muted-foreground block capitalize">
              {currentBooking.vehicle?.vehicle_type?.replace(/_/g, ' ') || 'Motor Vehicle'}
            </span>
          </div>

          <div className="p-3.5 bg-surface-muted rounded-control space-y-1">
            <span className="text-muted-foreground block flex items-center gap-1">
              <Lock className="w-3 h-3 text-primary" /> Privacy Reference
            </span>
            <span className="font-mono font-bold text-primary text-sm">
              {currentBooking.booking_customer_reference || 'PBN-REF-CONFIRMED'}
            </span>
            <span className="text-[10px] text-muted-foreground block">Protected from owner view</span>
          </div>
        </div>

        {/* QR Visual Pass Simulation */}
        <div className="bg-surface-muted p-6 rounded-card border border-border flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5 justify-center sm:justify-start">
              <QrCode className="w-4 h-4 text-primary" />
              <span>Gate Access Pass</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Attendant will scan or verify your vehicle plate and booking reference upon entry.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 shrink-0">
            <div className="w-24 h-24 bg-slate-950 p-2 rounded flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-5 h-5 bg-white rounded-sm"></div>
                <div className="w-5 h-5 bg-white rounded-sm"></div>
              </div>
              <div className="text-center font-mono text-[8px] text-white font-bold">PARKBNB</div>
              <div className="flex justify-between">
                <div className="w-5 h-5 bg-white rounded-sm"></div>
                <div className="w-2 h-2 bg-white rounded-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Payment Receipt Breakdown */}
        <div className="bg-surface-muted p-5 rounded-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-primary" />
              <span>Tax Invoice & Payment Receipt</span>
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground">INR (₹)</span>
          </div>

          <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-2">
            <div className="flex justify-between">
              <span>Parking Base Rate ({currentBooking.total_hours} hrs):</span>
              <span className="font-mono text-foreground">₹{currentBooking.base_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Convenience Fee (15%):</span>
              <span className="font-mono text-foreground">₹{currentBooking.platform_fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST on Service Fee (18%):</span>
              <span className="font-mono text-foreground">₹{currentBooking.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground">
              <span>Total Paid (Captured):</span>
              <span className="font-mono text-emerald-700">₹{currentBooking.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Controls: Extend Reservation & Cancellation */}
        {(currentBooking.status === 'confirmed' || currentBooking.status === 'active') && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-border pt-6">
            {/* Extend Slot Form */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Extend:</span>
              <select
                value={extendHours}
                onChange={(e) => setExtendHours(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-surface border border-border rounded-control text-xs text-foreground font-semibold"
              >
                <option value={1}>+1 Hour</option>
                <option value={2}>+2 Hours</option>
                <option value={4}>+4 Hours</option>
              </select>
              <button
                onClick={handleExtend}
                disabled={extending}
                className="px-3.5 py-1.5 bg-primary text-white rounded-control text-xs font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {extending ? 'Extending...' : 'Add Time'}
              </button>
            </div>

            {/* Cancel Button */}
            {currentBooking.status === 'confirmed' && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-control text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{cancelling ? 'Processing Refund...' : 'Cancel Reservation'}</span>
              </button>
            )}
          </div>
        )}

        {/* Review Form for Completed Bookings */}
        {currentBooking.status === 'completed' && (
          <div className="border-t border-border pt-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span>Rate Your Parking Experience</span>
            </h3>

            {reviewSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-control text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Thank you! Your verified parking review has been published.</span>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-1 rounded hover:scale-110 transition-transform ${
                          star <= rating ? 'text-accent' : 'text-slate-300'
                        }`}
                      >
                        <Star className={`w-5 h-5 ${star <= rating ? 'fill-accent' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about gate clearance, lighting, spot accessibility, or security..."
                  className="w-full p-2.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                />

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {reviewSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Verified Review</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
