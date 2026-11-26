'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { repository } from '@/lib/db/supabase-repository';

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

  await repository.updateBookingStatus(bookingId, 'active');

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

  await repository.updateBookingStatus(bookingId, 'completed');

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

  await repository.upsertProviderProfile({
    id: session.user.id,
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


/**
 * Host Onboarding & KYC Submission
 */
export async function submitHostOnboardingKYCAction(formData: FormData) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required. Please sign in.' };
  }

  const business_name = (formData.get('business_name') as string)?.trim() || null;
  const provider_type = (formData.get('provider_type') as any) || 'individual_residential';
  const pan_number = (formData.get('pan_number') as string)?.trim()?.toUpperCase() || null;
  const gstin = (formData.get('gstin') as string)?.trim()?.toUpperCase() || null;
  const bank_name = (formData.get('bank_name') as string)?.trim() || null;
  const bank_account_number = (formData.get('bank_account_number') as string)?.trim() || null;
  const bank_account_holder = (formData.get('bank_account_holder') as string)?.trim() || session.profile?.full_name || null;
  const bank_ifsc_code = (formData.get('bank_ifsc_code') as string)?.trim()?.toUpperCase() || null;
  const upi_id = (formData.get('upi_id') as string)?.trim() || null;
  const payout_preference = (formData.get('payout_preference') as 'bank_transfer' | 'upi') || 'bank_transfer';
  const authority_evidence = (formData.get('authority_evidence') as string)?.trim();

  if (pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan_number)) {
    return { error: 'Please enter a valid 10-character Indian PAN number (e.g. ABCDE1234F).' };
  }

  if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
    return { error: 'Please enter a valid 15-character GSTIN number.' };
  }

  if (bank_account_number && !/^\d{9,18}$/.test(bank_account_number)) {
    return { error: 'Please enter a valid bank account number (9 to 18 digits).' };
  }

  if (bank_ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank_ifsc_code)) {
    return { error: 'Please enter a valid 11-digit IFSC code.' };
  }

  if (upi_id && !/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi_id)) {
    return { error: 'Please enter a valid UPI ID (e.g. name@okhdfcbank).' };
  }

  const store = getLocalStore();
  const existingProvider = store.getProviderProfile(session.user.id);

  const updatedProvider = {
    id: session.user.id,
    provider_type,
    business_name: business_name || existingProvider?.business_name || null,
    pan_number: pan_number || existingProvider?.pan_number || null,
    gstin: gstin || existingProvider?.gstin || null,
    verification_status: 'submitted' as const,
    rejection_reason: null,
    bank_name: bank_name || existingProvider?.bank_name || null,
    bank_account_number: bank_account_number || existingProvider?.bank_account_number || null,
    bank_account_holder: bank_account_holder || existingProvider?.bank_account_holder || null,
    bank_ifsc_code: bank_ifsc_code || existingProvider?.bank_ifsc_code || null,
    upi_id: upi_id || existingProvider?.upi_id || null,
    payout_preference,
    commission_rate: existingProvider?.commission_rate || 0.15,
    created_at: existingProvider?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.saveProviderProfile(updatedProvider);

  store.recordAuditLog({
    operator_email: session.profile?.email || 'host',
    action: 'HOST_KYC_SUBMITTED',
    category: 'host',
    target_id: session.user.id,
    target_name: business_name || session.profile?.full_name || 'Host',
    details: `Owner submitted onboarding verification. Type: ${provider_type}, PAN: ${pan_number || 'N/A'}, Authority Notes: ${authority_evidence || 'Standard'}`,
  });

  revalidatePath('/host');
  revalidatePath('/host/onboarding');
  revalidatePath('/admin/hosts');
  revalidatePath('/admin/verifications');

  return { success: true, provider: updatedProvider };
}

/**
 * Retrieves Calendar data for parking owner: Spaces, Bookings & Maintenance Blocks
 */
export async function getHostCalendarDataAction() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const store = getLocalStore();
  const spaces = store.getSpacesByProvider(session.user.id);
  const bookings = store.getBookingsByProvider(session.user.id);
  const blocks = store.getAvailabilityBlocksByProvider(session.user.id);

  return {
    success: true,
    spaces,
    bookings,
    blocks,
  };
}

/**
 * Creates an Availability / Maintenance Block on a parking space
 */
export async function createHostAvailabilityBlockAction(params: {
  spaceId: string;
  startTime: string;
  endTime: string;
  reason: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const { spaceId, startTime, endTime, reason } = params;
  if (!spaceId || !startTime || !endTime) {
    return { error: 'Please specify the parking space and time range.' };
  }

  const store = getLocalStore();
  const result = store.createAvailabilityBlock({
    spaceId,
    providerId: session.user.id,
    startTime,
    endTime,
    reason: reason || 'Maintenance / Private use',
  });

  if (!result.success) {
    return { error: result.error || 'Failed to create availability block.' };
  }

  revalidatePath('/host/calendar');
  revalidatePath('/host/spaces');
  revalidatePath('/search');

  return { success: true, block: result.block };
}

/**
 * Removes an Availability / Maintenance Block
 */
export async function deleteHostAvailabilityBlockAction(blockId: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const store = getLocalStore();
  const success = store.deleteAvailabilityBlock(blockId, session.user.id);

  if (!success) {
    return { error: 'Failed to remove block or unauthorized.' };
  }

  revalidatePath('/host/calendar');
  revalidatePath('/host/spaces');
  revalidatePath('/search');

  return { success: true };
}

/**
 * Retrieves full details for an individual space for host editing
 */
export async function getHostSpaceDetailAction(spaceId: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const store = getLocalStore();
  const space = store.getSpaceById(spaceId);

  if (!space || (space.provider_id !== session.user.id && session.role !== 'admin')) {
    return { error: 'Parking space not found or unauthorized.' };
  }

  const blocks = store.getAvailabilityBlocks(spaceId);
  const bookings = store.getAllBookings().filter(b => b.space_id === spaceId);

  return {
    success: true,
    space,
    blocks,
    activeBookingsCount: bookings.filter(b => b.status === 'confirmed' || b.status === 'active').length,
  };
}

/**
 * Updates full listing configuration (pricing, amenities, rules, access instructions)
 */
export async function updateHostSpaceFullAction(formData: FormData) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const spaceId = formData.get('space_id') as string;
  if (!spaceId) {
    return { error: 'Missing parking space identifier.' };
  }

  const store = getLocalStore();
  const space = store.getSpaceById(spaceId);
  if (!space || (space.provider_id !== session.user.id && session.role !== 'admin')) {
    return { error: 'Parking space not found or unauthorized.' };
  }

  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const hourly_rate = Number(formData.get('hourly_rate'));
  const daily_rate = formData.get('daily_rate') ? Number(formData.get('daily_rate')) : null;
  const monthly_rate = formData.get('monthly_rate') ? Number(formData.get('monthly_rate')) : null;
  const access_instructions = (formData.get('access_instructions') as string)?.trim() || null;
  const height_limit_meters = formData.get('height_limit_meters') ? Number(formData.get('height_limit_meters')) : null;
  const has_ev_charging = formData.get('has_ev_charging') === 'true';
  const parking_type = (formData.get('parking_type') as any) || space.parking_type;

  const vehicleTypes = formData.getAll('vehicle_types') as any[];
  const securityFeatures = formData.getAll('security_features') as string[];

  if (isNaN(hourly_rate) || hourly_rate <= 0) {
    return { error: 'Hourly rate must be greater than ₹0.' };
  }

  const updated = store.updateSpace(spaceId, {
    title: title || space.title,
    description: description !== undefined ? description : space.description,
    hourly_rate,
    daily_rate,
    monthly_rate,
    access_instructions,
    height_limit_meters,
    has_ev_charging,
    parking_type,
    vehicle_types: vehicleTypes.length > 0 ? vehicleTypes : space.vehicle_types,
    security_features: securityFeatures.length > 0 ? securityFeatures : space.security_features,
  });

  store.recordAuditLog({
    operator_email: session.profile?.email || 'host',
    action: 'SPACE_CONFIG_UPDATED',
    category: 'space',
    target_id: spaceId,
    target_name: updated?.title || space.title,
    details: `Owner updated space specs and pricing: ₹${hourly_rate}/hr.`,
  });

  revalidatePath('/host/spaces');
  revalidatePath(`/host/spaces/${spaceId}`);
  revalidatePath('/search');
  revalidatePath(`/parking/${spaceId}`);

  return { success: true, space: updated };
}

/**
 * Retrieves reviews for parking owner's spaces
 */
export async function getHostReviewsAction() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const store = getLocalStore();
  const reviews = store.getReviewsByProvider(session.user.id);
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
    : 0;

  return {
    success: true,
    reviews,
    totalReviews,
    averageRating,
  };
}

/**
 * Parking Owner replies to a customer review
 */
export async function replyToHostReviewAction(params: {
  reviewId: string;
  responseText: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const { reviewId, responseText } = params;
  if (!responseText || responseText.trim().length < 3) {
    return { error: 'Please enter a response of at least 3 characters.' };
  }

  const store = getLocalStore();
  const result = store.addReviewResponse(reviewId, session.user.id, responseText.trim());

  if (!result.success) {
    return { error: result.error || 'Failed to submit review response.' };
  }

  revalidatePath('/host/reviews');

  return { success: true };
}

/**
 * Parking Owner reports an abusive or fraudulent review
 */
export async function reportHostReviewAction(params: {
  reviewId: string;
  reason: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const { reviewId, reason } = params;
  if (!reason || reason.trim().length < 5) {
    return { error: 'Please explain why this review violates marketplace policies (min 5 characters).' };
  }

  const store = getLocalStore();
  const result = store.reportReview(reviewId, reason.trim());

  if (!result.success) {
    return { error: result.error || 'Failed to report review.' };
  }

  revalidatePath('/host/reviews');

  return { success: true };
}

/**
 * Updates Host Profile & Settlement Settings
 */
export async function updateHostSettingsAction(formData: FormData) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const business_name = (formData.get('business_name') as string)?.trim() || null;
  const bank_name = (formData.get('bank_name') as string)?.trim() || null;
  const bank_account_number = (formData.get('bank_account_number') as string)?.trim() || null;
  const bank_account_holder = (formData.get('bank_account_holder') as string)?.trim() || null;
  const bank_ifsc_code = (formData.get('bank_ifsc_code') as string)?.trim()?.toUpperCase() || null;
  const upi_id = (formData.get('upi_id') as string)?.trim() || null;
  const payout_preference = (formData.get('payout_preference') as 'bank_transfer' | 'upi') || 'bank_transfer';

  if (bank_account_number && !/^\d{9,18}$/.test(bank_account_number)) {
    return { error: 'Please enter a valid bank account number (9 to 18 digits).' };
  }

  if (bank_ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank_ifsc_code)) {
    return { error: 'Please enter a valid 11-digit IFSC code.' };
  }

  if (upi_id && !/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi_id)) {
    return { error: 'Please enter a valid UPI ID (e.g. name@okhdfcbank).' };
  }

  const store = getLocalStore();
  const provider = store.getProviderProfile(session.user.id);

  if (provider) {
    store.saveProviderProfile({
      ...provider,
      business_name: business_name !== null ? business_name : provider.business_name,
      bank_name: bank_name || provider.bank_name,
      bank_account_number: bank_account_number || provider.bank_account_number,
      bank_account_holder: bank_account_holder || provider.bank_account_holder,
      bank_ifsc_code: bank_ifsc_code || provider.bank_ifsc_code,
      upi_id: upi_id || provider.upi_id,
      payout_preference,
      updated_at: new Date().toISOString(),
    });
  }

  revalidatePath('/host');
  revalidatePath('/host/settings');
  revalidatePath('/host/earnings');

  return { success: true };
}
