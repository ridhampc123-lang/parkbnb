import { getLocalStore } from '@/lib/store/marketplace-store';
import { DisputesClient } from './disputes-client';
import { getServerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { isStaffRole } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

export default async function AdminDisputesPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !isStaffRole(session.role)) {
    redirect('/login');
  }

  const store = getLocalStore();
  const tickets = store.getAllTickets();

  return (
    <div className="p-6 md:p-8">
      <DisputesClient initialTickets={tickets} />
    </div>
  );
}
