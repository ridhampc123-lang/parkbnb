import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/rbac';
import { VerificationsClient } from './verifications-client';

export default async function VerificationsPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !hasPermission(session, 'verification:approve_spaces')) {
    redirect('/admin');
  }

  const store = getLocalStore();
  const pendingSpaces = store.getAllSpaces().filter(s => s.status === 'submitted');

  return <VerificationsClient initialSpaces={pendingSpaces} />;
}
