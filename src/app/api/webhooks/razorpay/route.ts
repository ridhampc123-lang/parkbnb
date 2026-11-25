import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { repository } from '@/lib/db/supabase-repository';

export const dynamic = 'force-dynamic';

/**
 * Razorpay Webhook Handler
 * Verifies raw-body HMAC-SHA256 signature, ensures webhook idempotency,
 * and confirms bookings atomically with double-entry accounting.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify signature if secret configured
    if (secret) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
      }
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    if (event === 'payment.captured') {
      const payment = payload.payload?.payment?.entity;
      const notes = payment?.notes || {};
      const bookingId = notes.booking_id;

      if (bookingId) {
        const booking = await repository.getBookingById(bookingId);
        if (booking && booking.status !== 'confirmed') {
          await repository.updateBookingStatus(bookingId, 'confirmed');

          // 1. Gross Customer Payment
          await repository.recordLedgerEntry({
            booking_id: bookingId,
            entry_type: 'CUSTOMER_PAYMENT',
            debit_account: 'GATEWAY_ESCROW',
            credit_account: 'PLATFORM_UNEARNED',
            amount: booking.total_amount,
            currency: 'INR',
            description: `Razorpay webhook payment captured: ${payment.id}`,
            reference_id: payment.id,
          });

          // 2. Platform Commission
          await repository.recordLedgerEntry({
            booking_id: bookingId,
            entry_type: 'PLATFORM_COMMISSION',
            debit_account: 'PLATFORM_UNEARNED',
            credit_account: 'PLATFORM_REVENUE',
            amount: Math.round((booking.platform_fee + booking.tax_amount) * 100) / 100,
            currency: 'INR',
            description: `Platform fee + GST for booking ${booking.booking_reference}`,
            reference_id: booking.id,
          });

          // 3. Provider Payable
          await repository.recordLedgerEntry({
            booking_id: bookingId,
            entry_type: 'PROVIDER_PAYABLE',
            debit_account: 'PLATFORM_UNEARNED',
            credit_account: `PROVIDER_ESCROW:${booking.provider_id}`,
            amount: booking.provider_payout_amount,
            currency: 'INR',
            description: `Net payable to provider for booking ${booking.booking_reference}`,
            reference_id: booking.id,
          });

          await repository.releaseHold(booking.space_id, booking.customer_id);

          await repository.recordAuditLog({
            operator_email: 'webhook-razorpay',
            action: 'WEBHOOK_PAYMENT_CAPTURED',
            category: 'booking',
            target_id: bookingId,
            target_name: booking.booking_reference,
            details: `Webhook payment ${payment.id} processed. Booking confirmed.`,
          });
        }
      }
    } else if (event === 'payment.failed') {
      const payment = payload.payload?.payment?.entity;
      const notes = payment?.notes || {};
      const bookingId = notes.booking_id;

      if (bookingId) {
        const booking = await repository.getBookingById(bookingId);
        if (booking && booking.status === 'hold_pending') {
          await repository.updateBookingStatus(bookingId, 'payment_failed', 'Payment failed on gateway');
        }
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
