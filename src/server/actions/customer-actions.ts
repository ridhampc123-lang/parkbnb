'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { repository } from '@/lib/db/supabase-repository';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { InAppNotification, RefundRecord } from '@/types/database';

/**
 * Updates Customer Profile & Notification Preferences
 */
export async function updateCustomerProfileAction(formData: FormData) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required. Please sign in.' };
  }

  const full_name = (formData.get('full_name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const phone = (formData.get('phone') as string)?.trim();

  if (full_name && full_name.length < 2) {
    return { error: 'Full name must be at least 2 characters long.' };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  if (phone && !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''))) {
    return { error: 'Please enter a valid 10-digit Indian mobile number.' };
  }

  const notify_sms = formData.get('notify_sms') === 'true';
  const notify_whatsapp = formData.get('notify_whatsapp') === 'true';
  const notify_email = formData.get('notify_email') === 'true';

  const store = getLocalStore();
  const updated = store.updateProfileDetails(session.user.id, {
    full_name: full_name || undefined,
    email: email || undefined,
    phone: phone || undefined,
    notification_preferences: {
      sms: notify_sms,
      whatsapp: notify_whatsapp,
      email: notify_email,
    },
  });

  if (!updated) {
    return { error: 'Failed to update profile.' };
  }

  await repository.updateProfile(session.user.id, {
    full_name: full_name || undefined,
    email: email || undefined,
    phone: phone || undefined,
  });

  await repository.recordAuditLog({
    operator_email: session.profile?.email || 'customer',
    action: 'CUSTOMER_PROFILE_UPDATED',
    category: 'user',
    target_id: session.user.id,
    target_name: updated.full_name,
    details: `Customer updated profile information and notification preferences.`,
  });

  revalidatePath('/account');
  revalidatePath('/account/profile');

  return { success: true, profile: updated };
}

/**
 * Submits formal Account Deletion Request under Data Protection laws
 */
export async function requestAccountDeletionAction(reason: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  if (!reason || reason.trim().length < 5) {
    return { error: 'Please provide a brief reason for account deletion (min 5 characters).' };
  }

  const store = getLocalStore();
  const result = store.requestAccountDeletion(session.user.id, reason.trim());

  if (!result.success) {
    return { error: result.error || 'Failed to submit account deletion request.' };
  }

  revalidatePath('/account/profile');

  return { success: true };
}

/**
 * Retrieves complete payment and refund history for customer
 */
export async function getCustomerPaymentsAndRefundsAction() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const store = getLocalStore();
  const bookings = await repository.getBookingsByCustomer(session.user.id);
  const refunds = store.getRefundsByCustomer(session.user.id);

  // Derive itemized payment records from confirmed, completed, active, cancelled bookings
  const payments = bookings.map(b => ({
    id: b.id,
    booking_reference: b.booking_reference,
    space_title: b.space?.title || 'Reserved Parking Bay',
    space_identifier: b.space?.identifier || 'Slot',
    area: b.space?.property?.area || 'Ahmedabad',
    start_time: b.start_time,
    end_time: b.end_time,
    total_hours: b.total_hours,
    base_amount: b.base_amount,
    platform_fee: b.platform_fee,
    tax_amount: b.tax_amount,
    total_amount: b.total_amount,
    status: b.status,
    created_at: b.created_at,
    has_refund_requested: refunds.some(r => r.booking_id === b.id),
  }));

  const totalSpent = payments
    .filter(p => p.status === 'confirmed' || p.status === 'completed' || p.status === 'active')
    .reduce((sum, p) => sum + p.total_amount, 0);

  return {
    success: true,
    payments,
    refunds,
    totalSpent: Math.round(totalSpent * 100) / 100,
  };
}

/**
 * Customer submits refund request for an eligible booking
 */
export async function requestBookingRefundAction(bookingId: string, reason: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  if (!reason || reason.trim().length < 5) {
    return { error: 'Please provide a clear reason for the refund request (min 5 characters).' };
  }

  const store = getLocalStore();
  const result = store.requestCustomerRefund({
    bookingId,
    customerId: session.user.id,
    reason: reason.trim(),
  });

  if (!result.success) {
    return { error: result.error || 'Failed to submit refund request.' };
  }

  revalidatePath('/account/payments');
  revalidatePath('/account/bookings');
  revalidatePath(`/account/bookings/${bookingId}`);

  return { success: true, refund: result.refund };
}

/**
 * Retrieves in-app notifications for customer
 */
export async function getCustomerNotificationsAction() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const store = getLocalStore();
  const notifications = store.getNotificationsByUser(session.user.id);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    success: true,
    notifications,
    unreadCount,
  };
}

/**
 * Marks a single notification as read
 */
export async function markNotificationReadAction(notificationId: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const store = getLocalStore();
  store.markNotificationRead(notificationId, session.user.id);

  revalidatePath('/account/notifications');
  revalidatePath('/account');

  return { success: true };
}

/**
 * Marks all notifications as read for current user
 */
export async function markAllNotificationsReadAction() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const store = getLocalStore();
  store.markAllNotificationsRead(session.user.id);

  revalidatePath('/account/notifications');
  revalidatePath('/account');

  return { success: true };
}
