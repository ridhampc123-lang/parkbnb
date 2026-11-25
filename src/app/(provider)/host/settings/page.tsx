import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { redirect } from 'next/navigation';
import { HostSettingsClient } from './settings-client';

export const dynamic = 'force-dynamic';

export default async function HostSettingsPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const store = getLocalStore();
  const provider = store.getProviderProfile(session.user!.id);
  const profile = session.profile;

  return (
    <HostSettingsClient
      provider={provider || null}
      profile={profile}
    />
  );
}
