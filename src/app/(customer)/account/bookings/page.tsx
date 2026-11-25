import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { redirect } from 'next/navigation';
import { BookingsClient } from './bookings-client';

export const dynamic = 'force-dynamic';

export default async function CustomerBookingsPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login?next=/account/bookings');
  }

  const store = getLocalStore();
  const bookings = store.getBookingsByCustomer(session.user.id);

  return <BookingsClient initialBookings={bookings} />;
}
