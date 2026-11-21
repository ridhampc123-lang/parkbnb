'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Loader2
} from 'lucide-react';
import { cancelBookingAction } from '@/server/actions/booking-actions';
import { submitReviewAction } from '@/server/actions/review-actions';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Review state
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Reference confirmed booking data
  const booking = {
    id: bookingId,
    booking_reference: 'PKB-202611-B22',
    space_id: 'spc-prahladnagar-01',
    status: 'confirmed',
    space: {
      title: 'Covered Secure Parking near Prahlad Nagar Garden',
      identifier: 'Basement Bay B-22',
      property: {
        title: 'Shivalik Business Hub',
        address_line1: 'B-Wing, Opp. Prahlad Nagar Garden Gate 2',
        area: 'Prahlad Nagar',
        city: 'Ahmedabad',
        postal_code: '380015',
      },
      access_instructions: 'Drive into Gate 2 off main Prahlad Nagar Garden Road. Inform barrier attendant slot B-22. Display your booking QR code / Reference PKB-202611-B22. Barrier opens automatically once security cross-verifies vehicle plate.',
    },
    vehicle: {
      registration_number: 'GJ 01 AB 1234',
      vehicle_type: 'car_sedan',
    },
    start_time: new Date(Date.now() + 3600000).toISOString(),
    end_time: new Date(Date.now() + 14400000).toISOString(),
    total_hours: 4,
    base_amount: 160.00,
    platform_fee: 24.00,
    tax_amount: 4.32,
    total_amount: 188.32,
  };

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this booking? Refunds are processed automatically as per policy.')) return;
    setCancelling(true);
    setCancelError(null);

    const result = await cancelBookingAction(bookingId, 'Customer requested cancellation via portal');
    if (result.error) {
      setCancelError(result.error);
      setCancelling(false);
    } else {
      router.push('/account/bookings');
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setReviewSubmitting(true);

    const result = await submitReviewAction({
      bookingId,
      rating,
      comment: reviewComment,
    });

    if (result.success) {
      setReviewSuccess(true);
      setReviewSubmitting(false);
    } else {
      alert(result.error || 'Failed to submit review');
      setReviewSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/account/bookings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to My Bookings
        </Link>
      </div>

      {cancelError && (
        <div className="p-3 bg-red-50 border border-red-200 text-danger rounded-control text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cancelError}</span>
        </div>
      )}

      {/* Confirmed Gate Clearance Pass */}
      <div className="bg-surface rounded-card border-2 border-emerald-500/40 p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed Parking Pass
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground mt-2">{booking.space.title}</h1>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>{booking.space.property.address_line1}, {booking.space.property.area}, Ahmedabad</span>
            </div>
          </div>

          <div className="bg-surface-muted p-4 rounded-control text-center shrink-0 border border-border">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Assigned Slot</div>
            <div className="text-lg font-black text-primary font-mono">{booking.space.identifier}</div>
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{booking.booking_reference}</div>
          </div>
        </div>

        {/* Access Instructions & Directions Box */}
        <div className="bg-primary-soft/50 rounded-card p-5 border border-primary/20 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Security Clearance & Entry Instructions
          </h2>
          <p className="text-xs text-foreground leading-relaxed">
            {booking.space.access_instructions}
          </p>
        </div>

        {/* Timings & Vehicle Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-surface-muted rounded-control space-y-1">
            <span className="text-muted-foreground block">Arrival Window</span>
            <span className="font-bold text-foreground">{new Date(booking.start_time).toLocaleDateString()}</span>
            <span className="text-[11px] text-muted-foreground block">{new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="p-3.5 bg-surface-muted rounded-control space-y-1">
            <span className="text-muted-foreground block">Departure Time</span>
            <span className="font-bold text-foreground">{new Date(booking.end_time).toLocaleDateString()}</span>
            <span className="text-[11px] text-muted-foreground block">{new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="p-3.5 bg-surface-muted rounded-control space-y-1">
            <span className="text-muted-foreground block">Clearance License Plate</span>
            <span className="font-mono font-bold text-foreground text-sm">{booking.vehicle.registration_number}</span>
            <span className="text-[11px] text-muted-foreground block capitalize">{booking.vehicle.vehicle_type.replace(/_/g, ' ')}</span>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="border border-border rounded-control p-4 text-xs space-y-2">
          <div className="font-semibold text-foreground uppercase tracking-wider text-[11px]">Paid Tax Invoice Breakdown</div>
          <div className="flex justify-between text-muted-foreground">
            <span>Parking Charge ({booking.total_hours} hrs)</span>
            <span className="font-mono text-foreground">₹{booking.base_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Platform Service Fee</span>
            <span className="font-mono text-foreground">₹{booking.platform_fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>GST on Service Fee (18%)</span>
            <span className="font-mono text-foreground">₹{booking.tax_amount.toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold text-sm text-foreground">
            <span>Total Paid via Razorpay</span>
            <span className="font-mono text-emerald-700">₹{booking.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Operational Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link
            href={`/account/support?booking_id=${booking.id}`}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-primary" /> Report Access Issue / Dispute
          </Link>

          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="px-4 py-2 border border-red-300 text-danger hover:bg-red-50 text-xs font-semibold rounded-control transition-colors disabled:opacity-60"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
          </button>
        </div>
      </div>

      {/* Review Section */}
      <div className="bg-surface rounded-card p-6 border border-border space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Leave a Verified Host Review</h3>
        {reviewSuccess ? (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-control flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Thank you! Your verified review has been published.</span>
          </div>
        ) : (
          <form onSubmit={handleReviewSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-accent hover:scale-110 transition-transform"
                  >
                    <Star className={`w-5 h-5 ${star <= rating ? 'fill-accent' : 'stroke-muted-foreground'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">Comments on Security & Access</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={2}
                placeholder="Was the space clean, easy to locate, and accepted by security?"
                className="w-full p-2.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
              />
            </div>

            <button
              type="submit"
              disabled={reviewSubmitting}
              className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              {reviewSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Submit Review</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
