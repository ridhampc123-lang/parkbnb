'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';

/**
 * Host Gate Check-In: Confirms arrival of driver's vehicle at the gate, marks booking active
 */
export async function hostCheckInAction(bookingId: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const store = getLocalStore();
  const result = store.hostCheckInBooking(bookingId, session.user.id);

  if (!result.success) {
    return { error: result.error || 'Failed to check in driver.' };
  }

  revalidatePath('/host/bookings');
  revalidatePath('/host');
  revalidatePath('/admin/bookings');
  revalidatePath(`/account/bookings/${bookingId}`);

  return { success: true, booking: result.booking };
}

/**
 * Host Gate Check-Out: Confirms departure of vehicle from the gate, marks booking completed, frees slot
 */
export async function hostCheckOutAction(bookingId: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const store = getLocalStore();
  const result = store.hostCheckOutBooking(bookingId, session.user.id);

  if (!result.success) {
    return { error: result.error || 'Failed to check out driver.' };
  }

  revalidatePath('/host/bookings');
  revalidatePath('/host/spaces');
  revalidatePath('/host/earnings');
  revalidatePath('/host');
  revalidatePath('/admin/bookings');
  revalidatePath(`/account/bookings/${bookingId}`);

  return { success: true, booking: result.booking };
}

/**
 * Host Reports Overstay / Delayed Departure
 */
export async function hostReportOverstayAction(params: {
  bookingId: string;
  notes: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const { bookingId, notes } = params;
  const store = getLocalStore();
  const booking = store.getBookingById(bookingId);

  if (!booking) {
    return { error: 'Booking not found.' };
  }

  if (booking.provider_id !== session.user.id && session.role !== 'admin') {
    return { error: 'Unauthorized.' };
  }

  store.recordAuditLog({
    operator_email: session.profile?.email || 'host@parkbnb.in',
    action: 'OVERSTAY_FLAGGED_BY_HOST',
    category: 'booking',
    target_id: bookingId,
    target_name: booking.booking_reference,
    details: `Host flagged overstay for vehicle ${booking.vehicle?.registration_number || 'Plate'}. Notes: ${notes}`,
  });

  revalidatePath('/host/bookings');

  return { success: true };
}

/**
 * Host Banking & UPI Details Update
 */
export async function updateProviderBankingAction(formData: FormData) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const bankName = (formData.get('bank_name') as string)?.trim() || null;
  const bankAccountNumber = (formData.get('bank_account_number') as string)?.trim() || null;
  const bankIfscCode = (formData.get('bank_ifsc_code') as string)?.trim().toUpperCase() || null;
  const bankAccountHolder = (formData.get('bank_account_holder') as string)?.trim() || null;
  const upiId = (formData.get('upi_id') as string)?.trim() || null;
  const payoutPreference = (formData.get('payout_preference') as 'bank_transfer' | 'upi') || 'bank_transfer';

  if (bankIfscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfscCode)) {
    return { error: 'Please enter a valid 11-character Indian Bank IFSC code (e.g. HDFC0001234).' };
  }

  if (bankAccountNumber && bankAccountNumber.length < 8) {
    return { error: 'Please enter a valid bank account number.' };
  }

  if (upiId && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
    return { error: 'Please enter a valid UPI ID format (e.g. yourname@okhdfcbank).' };
  }

  const store = getLocalStore();
  const updated = store.updateProviderBankingDetails(session.user.id, {
    bank_name: bankName,
    bank_account_number: bankAccountNumber,
    bank_ifsc_code: bankIfscCode,
    bank_account_holder: bankAccountHolder,
    upi_id: upiId,
    payout_preference: payoutPreference,
  });

  if (!updated) {
    return { error: 'Provider profile not found.' };
  }

  revalidatePath('/host/earnings');
  revalidatePath('/host');
  revalidatePath('/admin/hosts');

  return { success: true, provider: updated };
}

/**
 * Host Request Payout Disbursement
 */
export async function requestHostPayoutAction(params: {
  amount: number;
  paymentMethod: 'NEFT' | 'IMPS' | 'UPI';
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const { amount, paymentMethod } = params;
  if (!amount || isNaN(amount) || amount <= 0) {
    return { error: 'Please specify a valid payout amount.' };
  }

  const store = getLocalStore();
  const provider = store.getProviderProfile(session.user.id);
  if (!provider) {
    return { error: 'Provider profile not found.' };
  }

  if (paymentMethod === 'UPI' && !provider.upi_id) {
    return { error: 'Please configure your UPI ID in Settlement Settings before requesting UPI payout.' };
  }

  if ((paymentMethod === 'NEFT' || paymentMethod === 'IMPS') && (!provider.bank_account_number || !provider.bank_ifsc_code)) {
    return { error: 'Please configure your Bank Account Number and IFSC in Settlement Settings before requesting bank transfer.' };
  }

  // Calculate unpaid escrow balance
  const ledger = store.getProviderLedger(session.user.id);
  const totalEarned = ledger.filter(l => l.entry_type === 'PROVIDER_PAYABLE').reduce((sum, l) => sum + l.amount, 0);
  const totalPaid = ledger.filter(l => l.entry_type === 'PROVIDER_PAYOUT').reduce((sum, l) => sum + l.amount, 0);
  const availableBalance = Math.max(0, totalEarned - totalPaid);

  if (amount > availableBalance) {
    return { error: `Insufficient available balance. Max withdrawable amount: ₹${availableBalance.toFixed(2)}.` };
  }

  try {
    const result = store.disburseHostPayout({
      hostId: session.user.id,
      amount,
      paymentMethod,
      operatorEmail: session.profile?.email || 'host@parkbnb.in',
    });

    revalidatePath('/host/earnings');
    revalidatePath('/host');
    revalidatePath('/admin/payments');
    revalidatePath('/admin/hosts');

    return { success: true, reference: result.reference, amount: result.amount };
  } catch (err: any) {
    return { error: err.message || 'Failed to process payout disbursement.' };
  }
}

/**
 * Host sends emergency gate notification to driver
 */
export async function hostSendEmergencyNoticeAction(params: {
  bookingId: string;
  message: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const { bookingId, message } = params;
  if (!message || message.trim().length < 5) {
    return { error: 'Please provide a clear emergency message for the driver.' };
  }

  const store = getLocalStore();
  const booking = store.getBookingById(bookingId);
  if (!booking) {
    return { error: 'Booking not found.' };
  }

  if (booking.provider_id !== session.user.id && session.role !== 'admin') {
    return { error: 'Unauthorized.' };
  }

  store.recordAuditLog({
    operator_email: session.profile?.email || 'host@parkbnb.in',
    action: 'EMERGENCY_DRIVER_NOTICE_DISPATCHED',
    category: 'booking',
    target_id: bookingId,
    target_name: booking.booking_reference,
    details: `Host dispatched emergency gate alert to driver of vehicle ${booking.vehicle?.registration_number || 'Plate'}: "${message}"`,
  });

  return { success: true, message: 'Emergency alert dispatched to driver in-app notification center.' };
}
