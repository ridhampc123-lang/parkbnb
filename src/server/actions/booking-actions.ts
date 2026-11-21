'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { Booking } from '@/types/database';

export async function initiateBookingHoldAction(params: {
  spaceId: string;
  vehicleId: string;
  startTime: string;
  endTime: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required. Please sign in to reserve parking.' };
  }

  const { spaceId, vehicleId, startTime, endTime } = params;

  if (!spaceId || !vehicleId || !startTime || !endTime) {
    return { error: 'Missing required reservation parameters.' };
  }

  const store = getLocalStore();
  const space = store.getSpaceById(spaceId);
  if (!space || space.status !== 'approved' || !space.is_active) {
    return { error: 'This parking space is currently not available for reservation.' };
  }

  // Double-booking check & atomic hold reservation
  const hold = store.createHold(spaceId, session.user.id, startTime, endTime, 10);
  if (!hold) {
    return { error: 'This time slot is no longer available. Another driver has reserved or is booking it.' };
  }

  // Calculate server-side pricing
  const pricing = store.calculatePricing(space, startTime, endTime);

  // Create temporary booking in hold_pending status
  const bookingId = 'bkg-' + Math.random().toString(36).substring(2, 9);
  const bookingRef = 'PKB-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

  const booking: Booking = {
    id: bookingId,
    booking_reference: bookingRef,
    space_id: spaceId,
    customer_id: session.user.id,
    provider_id: space.provider_id,
    vehicle_id: vehicleId,
    start_time: startTime,
    end_time: endTime,
    status: 'hold_pending',
    total_hours: pricing.totalHours,
    base_amount: pricing.baseAmount,
    platform_fee: pricing.platformFee,
    tax_amount: pricing.taxAmount,
    total_amount: pricing.totalAmount,
    provider_payout_amount: pricing.providerPayoutAmount,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.createBooking(booking);

  return {
    success: true,
    bookingId,
    bookingRef,
    pricing,
    expiresAt: hold.expires_at,
  };
}

export async function confirmBookingPaymentAction(params: {
  bookingId: string;
  paymentId: string;
  orderId?: string;
  signature?: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Unauthorized.' };
  }

  const store = getLocalStore();
  const booking = store.getBookingById(params.bookingId);
  if (!booking) {
    return { error: 'Booking record not found.' };
  }

  if (booking.customer_id !== session.user.id && session.role !== 'admin') {
    return { error: 'Access forbidden.' };
  }

  if (booking.status === 'confirmed') {
    return { success: true, booking };
  }

  // Update status atomically to confirmed
  store.updateBookingStatus(booking.id, 'confirmed');

  // Record double-entry financial ledger entries
  store.recordLedgerEntry({
    booking_id: booking.id,
    entry_type: 'CUSTOMER_PAYMENT',
    debit_account: 'GATEWAY_ESCROW',
    credit_account: 'PLATFORM_UNEARNED',
    amount: booking.total_amount,
    currency: 'INR',
    description: `Customer payment for booking ${booking.booking_reference}`,
    reference_id: params.paymentId,
  });

  store.recordLedgerEntry({
    booking_id: booking.id,
    entry_type: 'PLATFORM_COMMISSION',
    debit_account: 'PLATFORM_UNEARNED',
    credit_account: 'PLATFORM_REVENUE',
    amount: Math.round((booking.platform_fee + booking.tax_amount) * 100) / 100,
    currency: 'INR',
    description: `Platform fee + GST for booking ${booking.booking_reference}`,
    reference_id: booking.id,
  });

  store.recordLedgerEntry({
    booking_id: booking.id,
    entry_type: 'PROVIDER_PAYABLE',
    debit_account: 'PLATFORM_UNEARNED',
    credit_account: `PROVIDER_ESCROW:${booking.provider_id}`,
    amount: booking.provider_payout_amount,
    currency: 'INR',
    description: `Net payable to provider for booking ${booking.booking_reference}`,
    reference_id: booking.id,
  });

  // Release temporary hold
  store.releaseHold(booking.space_id, booking.customer_id);

  revalidatePath('/account/bookings');
  revalidatePath(`/account/bookings/${booking.id}`);
  revalidatePath('/host/bookings');
  revalidatePath('/admin/bookings');

  return { success: true, booking: store.getBookingById(booking.id) };
}

export async function cancelBookingAction(bookingId: string, reason: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Unauthorized.' };
  }

  const store = getLocalStore();
  const booking = store.getBookingById(bookingId);
  if (!booking) {
    return { error: 'Booking not found.' };
  }

  if (booking.customer_id !== session.user.id && booking.provider_id !== session.user.id && session.role !== 'admin') {
    return { error: 'Permission denied.' };
  }

  const newStatus = session.role === 'admin'
    ? 'cancelled_by_admin'
    : session.user.id === booking.customer_id
      ? 'cancelled_by_customer'
      : 'cancelled_by_provider';

  store.updateBookingStatus(bookingId, newStatus, reason);

  // Record refund in financial ledger
  store.recordLedgerEntry({
    booking_id: booking.id,
    entry_type: 'REFUND_CUSTOMER',
    debit_account: 'PLATFORM_UNEARNED',
    credit_account: 'GATEWAY_ESCROW',
    amount: booking.total_amount,
    currency: 'INR',
    description: `Refund processed for cancelled booking ${booking.booking_reference}: ${reason}`,
    reference_id: booking.id,
  });

  revalidatePath('/account/bookings');
  revalidatePath('/host/bookings');
  revalidatePath('/admin/bookings');

  return { success: true };
}
