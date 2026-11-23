'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { cancelBookingAction, extendBookingAction } from '@/server/actions/booking-actions';
import { submitReviewAction } from '@/server/actions/review-actions';
import { Booking } from '@/types/database';

export function BookingDetailClient({ booking }: { booking: Booking }) {
  const router = useRouter();

  const [currentBooking, setCurrentBooking] = useState<Booking>(booking);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Extension state
  const [extendHours, setExtendHours] = useState(1);
  const [extending, setExtending] = useState(false);
  const [extendFeedback, setExtendFeedback] = useState<string | null>(null);

  // Review state
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

      {/* Confirmed Gate Clearance Pass */}
      <div className="bg-surface rounded-card border-2 border-emerald-500/40 p-6 sm:p-8 shadow-card space-y-6">
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
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>
                {currentBooking.space?.property?.address_line1 || 'Designated Premises'},{' '}
                {currentBooking.space?.property?.area || 'Ahmedabad'}
              </span>
            </div>
          </div>

          <div className="bg-surface-muted p-4 rounded-control text-center shrink-0 border border-border">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Assigned Slot</div>
            <div className="text-lg font-black text-primary font-mono">
              {currentBooking.space?.identifier || 'Bay Assigned'}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {currentBooking.booking_reference}
            </div>
          </div>
        </div>

        {/* Access Instructions & Directions Box */}
        <div className="bg-primary-soft/50 rounded-card p-5 border border-primary/20 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Security Clearance & Entry Instructions
          </h2>
          <p className="text-xs text-foreground leading-relaxed">
            {currentBooking.space?.access_instructions ||
              'Show your booking pass to security at the gate. Display your vehicle registration plate for verification.'}
          </p>
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
            {/* Visual SVG QR Code placeholder pattern */}
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
                onChange={e => setExtendHours(Number(e.target.value))}
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
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-control text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{cancelling ? 'Processing Refund...' : 'Cancel Reservation'}</span>
            </button>
          </div>
        )}

        {/* Review Form for Completed Bookings */}
        {currentBooking.status === 'completed' && !reviewSuccess && (
          <form onSubmit={handleReviewSubmit} className="bg-surface-muted p-5 rounded-card border border-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Leave a Verified Review</span>
            </h3>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-lg ${star <= rating ? 'text-amber-500' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              placeholder="How was the parking access and security?"
              className="w-full p-2.5 bg-surface border border-border rounded-control text-xs text-foreground"
            />
            <button
              type="submit"
              disabled={reviewSubmitting}
              className="px-4 py-1.5 bg-primary text-white rounded-control text-xs font-bold hover:bg-primary-hover disabled:opacity-50"
            >
              {reviewSubmitting ? 'Posting...' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
