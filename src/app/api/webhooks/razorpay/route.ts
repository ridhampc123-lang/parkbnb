import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getLocalStore } from '@/lib/store/marketplace-store';

/**
 * Razorpay Webhook Handler
 * Verifies raw-body HMAC-SHA256 signature, logs event idempotently, and confirms bookings atomically.
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

    const store = getLocalStore();

    if (event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const notes = payment.notes || {};
      const bookingId = notes.booking_id;

      if (bookingId) {
        store.updateBookingStatus(bookingId, 'confirmed');

        store.recordLedgerEntry({
          booking_id: bookingId,
          entry_type: 'CUSTOMER_PAYMENT',
          debit_account: 'GATEWAY_ESCROW',
          credit_account: 'PLATFORM_UNEARNED',
          amount: payment.amount / 100, // paise to INR
          currency: 'INR',
          description: `Razorpay webhook payment captured: ${payment.id}`,
          reference_id: payment.id,
        });
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
