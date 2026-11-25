import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { redirect } from 'next/navigation';
import { HostCalendarClient } from './calendar-client';

export const dynamic = 'force-dynamic';

export default async function HostCalendarPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const store = getLocalStore();
  const spaces = store.getSpacesByProvider(session.user!.id);
  const bookings = store.getBookingsByProvider(session.user!.id);
  const blocks = store.getAvailabilityBlocksByProvider(session.user!.id);

  return (
    <HostCalendarClient
      spaces={spaces}
      initialBookings={bookings}
      initialBlocks={blocks}
    />
  );
}
