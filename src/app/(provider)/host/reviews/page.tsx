import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { redirect } from 'next/navigation';
import { HostReviewsClient } from './reviews-client';

export const dynamic = 'force-dynamic';

export default async function HostReviewsPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const store = getLocalStore();
  const reviews = store.getReviewsByProvider(session.user!.id);
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
    : 0;

  return (
    <HostReviewsClient
      reviews={reviews}
      totalReviews={totalReviews}
      averageRating={averageRating}
    />
  );
}
