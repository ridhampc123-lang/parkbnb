import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { HostBookingsClient } from './host-bookings-client';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HostBookingsPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const store = getLocalStore();
  const bookings = store.getBookingsByProvider(session.user.id);

  return <HostBookingsClient bookings={bookings} />;
}
