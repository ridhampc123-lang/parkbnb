import { getLocalStore } from '@/lib/store/marketplace-store';
import { getServerSession } from '@/lib/auth/session';
import { notFound, redirect } from 'next/navigation';
import { BookingDetailClient } from './booking-detail-client';

export const dynamic = 'force-dynamic';

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession();

  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const store = getLocalStore();
  const booking = store.getBookingById(id);

  if (!booking) {
    notFound();
  }

  // Strict ownership check: Only customer or admin can view this pass
  if (booking.customer_id !== session.user.id && session.role !== 'admin' && session.role !== 'super_admin') {
    notFound();
  }

  return <BookingDetailClient booking={booking} />;
}
