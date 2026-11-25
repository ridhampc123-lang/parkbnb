import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { redirect } from 'next/navigation';
import { NewSpaceClient } from './new-space-client';

export const dynamic = 'force-dynamic';

export default async function NewSpacePage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login?next=/host/spaces/new');
  }

  const store = getLocalStore();
  const listingTitles = store.getListingTitleOptions();
  const provider = store.getProviderProfile(session.user.id);

  return (
    <NewSpaceClient
      initialTitles={listingTitles}
      existingProvider={provider}
      userFullName={session.profile?.full_name || ''}
    />
  );
}
