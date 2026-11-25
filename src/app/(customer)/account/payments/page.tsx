import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { repository } from '@/lib/db/supabase-repository';
import { PaymentsClient } from './payments-client';

export const metadata = {
  title: 'Payment & Refund History | ParkBnB',
};

export default async function CustomerPaymentsPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const bookings = await repository.getBookingsByCustomer(session.user.id);

  return <PaymentsClient bookings={bookings} customerName={session.profile?.full_name || 'Driver'} />;
}
