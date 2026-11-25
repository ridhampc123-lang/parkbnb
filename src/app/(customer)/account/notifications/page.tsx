import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { repository } from '@/lib/db/supabase-repository';
import { NotificationsClient } from './notifications-client';

export const metadata = {
  title: 'Notification Center & Gate Alerts | ParkBnB',
};

export default async function CustomerNotificationsPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const bookings = await repository.getBookingsByCustomer(session.user.id);
  const tickets = await repository.getSupportTicketsByUser(session.user.id);

  return <NotificationsClient bookings={bookings} tickets={tickets} />;
}
