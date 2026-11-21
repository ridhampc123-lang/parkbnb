'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';

export async function submitReviewAction(params: {
  bookingId: string;
  rating: number;
  comment?: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'You must be signed in to submit a review.' };
  }

  if (params.rating < 1 || params.rating > 5) {
    return { error: 'Rating must be between 1 and 5 stars.' };
  }

  const store = getLocalStore();
  const booking = store.getBookingById(params.bookingId);
  if (!booking) {
    return { error: 'Booking not found.' };
  }

  if (booking.customer_id !== session.user.id) {
    return { error: 'You can only review bookings made on your own account.' };
  }

  if (booking.status !== 'completed' && booking.status !== 'confirmed') {
    return { error: 'Reviews can only be submitted for completed or confirmed bookings.' };
  }

  const review = store.addReview({
    booking_id: booking.id,
    space_id: booking.space_id,
    customer_id: session.user.id,
    rating: params.rating,
    comment: params.comment || null,
    is_approved: true,
  });

  revalidatePath(`/parking/${booking.space_id}`);
  revalidatePath('/account/bookings');

  return { success: true, review };
}
