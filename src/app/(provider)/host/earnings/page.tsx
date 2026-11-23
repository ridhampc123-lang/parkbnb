import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { EarningsClient } from './earnings-client';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HostEarningsPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const store = getLocalStore();
  const providerId = session.user.id;
  const provider = store.getProviderProfile(providerId);
  const ledger = store.getProviderLedger(providerId);
  const bookings = store.getBookingsByProvider(providerId);

  const eligibleBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed' || b.status === 'active');
  const totalEarned = eligibleBookings.reduce((sum, b) => sum + b.provider_payout_amount, 0);
  const commissionRate = provider?.commission_rate || store.getPlatformSettings().platformCommissionRate || 0.15;

  return (
    <EarningsClient
      provider={provider}
      ledger={ledger}
      totalEarned={totalEarned}
      commissionRate={commissionRate}
    />
  );
}
