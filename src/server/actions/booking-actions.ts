'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { repository } from '@/lib/db/supabase-repository';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { Booking, CustomerVehicle, VehicleType } from '@/types/database';

export async function initiateBookingHoldAction(params: {
  spaceId: string;
  vehicleId?: string;
  vehiclePlate?: string;
  vehicleType?: VehicleType;
  startTime: string;
  endTime: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required. Please verify your mobile number to reserve.' };
  }

  const { spaceId, vehicleId, vehiclePlate, vehicleType, startTime, endTime } = params;

  if (!spaceId || (!vehicleId && !vehiclePlate) || !startTime || !endTime) {
    return { error: 'Missing required reservation parameters.' };
  }

  const space = await repository.getSpaceById(spaceId);
  if (!space || space.status !== 'approved' || !space.is_active) {
    return { error: 'This parking space is currently not available for reservation.' };
  }

  // Validate reservation duration
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
    return { error: 'Departure time must be strictly after arrival time.' };
  }

  const durationHours = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60)));
  if (space.min_duration_hours && durationHours < space.min_duration_hours) {
    return { error: `Minimum parking duration is ${space.min_duration_hours} hour(s).` };
  }

  // Resolve customer vehicle in smart memory
  const store = getLocalStore();
  let resolvedVehicle: CustomerVehicle | undefined;
  if (vehicleId) {
    resolvedVehicle = store.getVehicleById(vehicleId);
  }
  if (!resolvedVehicle && vehiclePlate) {
    const cleanPlate = vehiclePlate.trim().toUpperCase();
    resolvedVehicle = store.findVehicleByPlate(session.user.id, cleanPlate);

    if (!resolvedVehicle) {
      // Create and save vehicle into customer memory
      const customerVehicles = await repository.getVehiclesByCustomer(session.user.id);
      resolvedVehicle = {
        id: crypto.randomUUID(),
        customer_id: session.user.id,
        vehicle_type: vehicleType || 'car_sedan',
        registration_number: cleanPlate,
        is_default: customerVehicles.length === 0,
        created_at: new Date().toISOString(),
      };
      await repository.createVehicle(resolvedVehicle);
    }
  }

  if (!resolvedVehicle) {
    return { error: 'Please select or enter a valid vehicle for parking access.' };
  }

  // Concurrency check & 10-minute temporary inventory reservation
  const hold = await repository.createHold(spaceId, session.user.id, startTime, endTime, 10);
  if (!hold) {
    return { error: 'This time slot is no longer available. Another driver has reserved or is booking it.' };
  }

  // Calculate server-side pricing independently
  const pricing = repository.calculatePricing(space, startTime, endTime);

  // Create temporary booking in hold_pending status
  const bookingId = crypto.randomUUID();
  const bookingRef =
    'PKB-' +
    new Date().toISOString().slice(0, 10).replace(/-/g, '') +
    '-' +
    Math.random().toString(36).substring(2, 6).toUpperCase();

  const booking: Booking = {
    id: bookingId,
    booking_reference: bookingRef,
    booking_customer_reference: 'PBN-REF-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    customer_display_name: session.profile?.full_name ? session.profile.full_name.split(' ')[0] + ' ' + (session.profile.full_name.split(' ')[1]?.[0] || '') + '.' : 'Verified Guest',
    space_id: spaceId,
    customer_id: session.user.id,
    provider_id: space.provider_id,
    vehicle_id: resolvedVehicle.id,
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

  await repository.createBooking(booking);

  await repository.recordAuditLog({
    operator_email: session.user.email || 'customer',
    action: 'BOOKING_HOLD_CREATED',
    category: 'booking',
    target_id: bookingId,
    target_name: bookingRef,
    details: `10-minute hold created for space ${space.title}. Amount: ₹${pricing.totalAmount}`,
  });

  return {
    success: true,
    bookingId,
    bookingRef,
    pricing,
    expiresAt: hold.expires_at,
    vehicle: resolvedVehicle,
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

  const booking = await repository.getBookingById(params.bookingId);
  if (!booking) {
    return { error: 'Booking record not found.' };
  }

  if (booking.customer_id !== session.user.id && session.role !== 'admin') {
    return { error: 'Access forbidden.' };
  }

  // Idempotency: If already confirmed, return safely
  if (booking.status === 'confirmed') {
    return { success: true, booking };
  }

  // Verify Razorpay signature if secret and signature are provided
  const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
  if (rzpSecret && params.orderId && params.signature) {
    const text = `${params.orderId}|${params.paymentId}`;
    const expectedSig = crypto
      .createHmac('sha256', rzpSecret)
      .update(text)
      .digest('hex');

    if (expectedSig !== params.signature) {
      return { error: 'Invalid payment signature. Payment verification failed.' };
    }
  }

  // Update status atomically to confirmed
  await repository.updateBookingStatus(booking.id, 'confirmed');

  // Record double-entry financial ledger entries (idempotent)
  await repository.recordLedgerEntry({
    booking_id: booking.id,
    entry_type: 'CUSTOMER_PAYMENT',
    debit_account: 'GATEWAY_ESCROW',
    credit_account: 'PLATFORM_UNEARNED',
    amount: booking.total_amount,
    currency: 'INR',
    description: `Customer payment for booking ${booking.booking_reference}`,
    reference_id: params.paymentId,
  });

  await repository.recordLedgerEntry({
    booking_id: booking.id,
    entry_type: 'PLATFORM_COMMISSION',
    debit_account: 'PLATFORM_UNEARNED',
    credit_account: 'PLATFORM_REVENUE',
    amount: Math.round((booking.platform_fee + booking.tax_amount) * 100) / 100,
    currency: 'INR',
    description: `Platform fee + GST for booking ${booking.booking_reference}`,
    reference_id: booking.id,
  });

  await repository.recordLedgerEntry({
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
  await repository.releaseHold(booking.space_id, booking.customer_id);

  await repository.recordAuditLog({
    operator_email: session.user.email || 'customer',
    action: 'BOOKING_PAYMENT_CONFIRMED',
    category: 'booking',
    target_id: booking.id,
    target_name: booking.booking_reference,
    details: `Booking confirmed with payment ID: ${params.paymentId}. Net payable: ₹${booking.provider_payout_amount}`,
  });

  revalidatePath('/account/bookings');
  revalidatePath(`/account/bookings/${booking.id}`);
  revalidatePath('/host/bookings');
  revalidatePath('/admin/bookings');

  const confirmedBooking = await repository.getBookingById(booking.id);
  return { success: true, booking: confirmedBooking };
}

export async function cancelBookingAction(bookingId: string, reason: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Unauthorized.' };
  }

  const booking = await repository.getBookingById(bookingId);
  if (!booking) {
    return { error: 'Booking not found.' };
  }

  if (booking.customer_id !== session.user.id && booking.provider_id !== session.user.id && session.role !== 'admin') {
    return { error: 'Permission denied.' };
  }

  const newStatus =
    session.role === 'admin'
      ? 'cancelled_by_admin'
      : session.user.id === booking.customer_id
        ? 'cancelled_by_customer'
        : 'cancelled_by_provider';

  await repository.updateBookingStatus(bookingId, newStatus, reason);

  // Record refund in financial ledger
  await repository.recordLedgerEntry({
    booking_id: booking.id,
    entry_type: 'REFUND_CUSTOMER',
    debit_account: 'PLATFORM_UNEARNED',
    credit_account: 'GATEWAY_ESCROW',
    amount: booking.total_amount,
    currency: 'INR',
    description: `Refund processed for cancelled booking ${booking.booking_reference}: ${reason}`,
    reference_id: booking.id,
  });

  await repository.recordAuditLog({
    operator_email: session.user.email || 'system',
    action: 'BOOKING_CANCELLED',
    category: 'booking',
    target_id: booking.id,
    target_name: booking.booking_reference,
    details: `Booking cancelled by ${session.role}. Reason: ${reason}. Refund queued: ₹${booking.total_amount}`,
  });

  revalidatePath('/account/bookings');
  revalidatePath('/host/bookings');
  revalidatePath('/admin/bookings');

  return { success: true };
}

export async function extendBookingAction(params: {
  bookingId: string;
  additionalHours: number;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Please sign in to extend your booking.' };
  }

  const store = getLocalStore();
  const updatedBooking = store.extendBooking(params.bookingId, params.additionalHours);
  if (!updatedBooking) {
    return { error: 'Booking not found or could not be extended.' };
  }

  await repository.recordAuditLog({
    operator_email: session.user.email || 'customer',
    action: 'BOOKING_EXTENDED',
    category: 'booking',
    target_id: updatedBooking.id,
    target_name: updatedBooking.booking_reference,
    details: `Driver extended reservation by ${params.additionalHours} hours.`,
  });

  revalidatePath('/account/bookings');
  revalidatePath(`/account/bookings/${updatedBooking.id}`);
  revalidatePath('/host/bookings');
  revalidatePath('/admin/bookings');

  return { success: true, booking: updatedBooking };
}

export async function customerCheckInAction(bookingId: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Please sign in to check in to your reserved parking spot.' };
  }

  const store = getLocalStore();
  const result = store.customerCheckInBooking(bookingId, session.user.id);

  if (!result.success) {
    return { error: result.error || 'Failed to check in.' };
  }

  await repository.recordAuditLog({
    operator_email: session.user.email || 'customer',
    action: 'GATE_CHECK_IN',
    category: 'booking',
    target_id: bookingId,
    details: 'Customer verified gate arrival and checked in.',
  });

  revalidatePath('/account/bookings');
  revalidatePath(`/account/bookings/${bookingId}`);
  revalidatePath('/host/bookings');
  revalidatePath('/admin/bookings');
  revalidatePath('/search');

  return { success: true, booking: result.booking };
}

export async function customerCheckOutAction(bookingId: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Please sign in to check out and release your parking spot.' };
  }

  const store = getLocalStore();
  const result = store.customerCheckOutBooking(bookingId, session.user.id);

  if (!result.success) {
    return { error: result.error || 'Failed to check out.' };
  }

  await repository.recordAuditLog({
    operator_email: session.user.email || 'customer',
    action: 'GATE_CHECK_OUT',
    category: 'booking',
    target_id: bookingId,
    details: `Customer released spot. Overstay minutes: ${result.overstayMinutes || 0}`,
  });

  revalidatePath('/account/bookings');
  revalidatePath(`/account/bookings/${bookingId}`);
  revalidatePath('/host/bookings');
  revalidatePath('/admin/bookings');
  revalidatePath('/search');

  return {
    success: true,
    booking: result.booking,
    overstayMinutes: result.overstayMinutes,
    overstayAmount: result.overstayAmount,
  };
}
