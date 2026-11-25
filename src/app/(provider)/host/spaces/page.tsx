import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { HostSpacesClient } from './host-spaces-client';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HostSpacesPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const store = getLocalStore();
  const spaces = store.getSpacesByProvider(session.user.id);

  return <HostSpacesClient spaces={spaces} />;
}
