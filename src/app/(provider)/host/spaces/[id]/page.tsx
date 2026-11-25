import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { redirect, notFound } from 'next/navigation';
import { HostSpaceDetailClient } from './space-detail-client';

export const dynamic = 'force-dynamic';

interface HostSpaceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function HostSpaceDetailPage({ params }: HostSpaceDetailPageProps) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const { id } = await params;
  const store = getLocalStore();
  const space = store.getSpaceById(id);

  if (!space || (space.provider_id !== session.user.id && session.role !== 'admin')) {
    notFound();
  }

  const allBookings = store.getAllBookings().filter(b => b.space_id === id);
  const activeBookings = allBookings.filter(b => b.status === 'confirmed' || b.status === 'active');
  const blocks = store.getAvailabilityBlocks(id);

  return (
    <HostSpaceDetailClient
      space={space}
      allBookingsCount={allBookings.length}
      activeBookingsCount={activeBookings.length}
      blocks={blocks}
    />
  );
}
