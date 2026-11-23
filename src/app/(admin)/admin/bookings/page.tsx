import { getLocalStore } from '@/lib/store/marketplace-store';
import { BookingsClient } from './bookings-client';

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  const store = getLocalStore();
  const bookings = store.getAllBookings();

  return <BookingsClient initialBookings={bookings} />;
}
