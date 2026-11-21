'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';

export async function verifySpaceAction(params: {
  spaceId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || session.role !== 'admin') {
    return { error: 'Forbidden: Admin authorization required.' };
  }

  const store = getLocalStore();
  const space = store.getSpaceById(params.spaceId);
  if (!space) {
    return { error: 'Space not found.' };
  }

  store.updateSpace(params.spaceId, {
    status: params.status,
    is_active: params.status === 'approved',
  });

  revalidatePath('/admin/verifications');
  revalidatePath('/admin/listings');
  revalidatePath('/admin');
  revalidatePath('/search');
  revalidatePath('/host/spaces');

  return { success: true };
}

export async function toggleSpaceActiveAction(spaceId: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || session.role !== 'admin') {
    return { error: 'Forbidden: Admin authorization required.' };
  }

  const store = getLocalStore();
  const space = store.getSpaceById(spaceId);
  if (!space) {
    return { error: 'Space not found.' };
  }

  const newActive = !space.is_active;
  store.updateSpace(spaceId, { is_active: newActive });

  revalidatePath('/admin/listings');
  revalidatePath('/admin');
  revalidatePath('/search');
  revalidatePath('/host/spaces');

  return { success: true, is_active: newActive };
}

export async function verifyProviderAction(params: {
  providerId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || session.role !== 'admin') {
    return { error: 'Forbidden: Admin authorization required.' };
  }

  const store = getLocalStore();
  const provider = store.getProviderProfile(params.providerId);
  if (!provider) {
    return { error: 'Provider record not found.' };
  }

  store.saveProviderProfile({
    ...provider,
    verification_status: params.status,
    rejection_reason: params.rejectionReason || null,
    verified_at: params.status === 'approved' ? new Date().toISOString() : null,
    verified_by: session.user?.id,
  });

  revalidatePath('/admin/verifications');
  revalidatePath('/admin');
  revalidatePath('/host');

  return { success: true };
}

export async function resolveDisputeAction(params: {
  ticketId: string;
  resolution: 'refund_full' | 'reject';
  resolutionNotes: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || session.role !== 'admin') {
    return { error: 'Forbidden: Admin authorization required.' };
  }

  const store = getLocalStore();
  const tickets = store.getAllTickets();
  const ticket = tickets.find(t => t.id === params.ticketId);

  if (!ticket) {
    return { error: 'Ticket not found.' };
  }

  ticket.status = 'resolved';
  ticket.updated_at = new Date().toISOString();

  // If full refund approved and ticket is linked to a booking, process ledger refund
  if (params.resolution === 'refund_full' && ticket.booking_id) {
    const booking = store.getBookingById(ticket.booking_id);
    if (booking) {
      store.updateBookingStatus(booking.id, 'cancelled_by_admin', params.resolutionNotes);

      // Record refund in double-entry ledger
      store.recordLedgerEntry({
        booking_id: booking.id,
        entry_type: 'REFUND_CUSTOMER',
        debit_account: 'PLATFORM_UNEARNED',
        credit_account: 'GATEWAY_ESCROW',
        amount: booking.total_amount,
        currency: 'INR',
        description: `Admin dispute resolution refund for booking ${booking.booking_reference}: ${params.resolutionNotes}`,
        reference_id: ticket.ticket_number,
      });
    }
  }

  revalidatePath('/admin/disputes');
  revalidatePath('/admin/payments');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin');
  revalidatePath('/account/support');
  revalidatePath('/account/bookings');

  return { success: true };
}
