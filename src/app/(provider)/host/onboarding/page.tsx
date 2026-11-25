import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { redirect } from 'next/navigation';
import { HostOnboardingClient } from './onboarding-client';

export const dynamic = 'force-dynamic';

export default async function HostOnboardingPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const store = getLocalStore();
  const provider = store.getProviderProfile(session.user!.id);
  const profile = session.profile;

  return (
    <HostOnboardingClient
      provider={provider || null}
      profile={profile}
    />
  );
}
