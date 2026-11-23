import { getLocalStore } from '@/lib/store/marketplace-store';
import { AdminDashboardClient } from './admin-dashboard-client';
import { getServerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { isStaffRole } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !isStaffRole(session.role)) {
    redirect('/admin/login');
  }

  const store = getLocalStore();
  const metrics = store.getAdminMetrics();

  return (
    <div className="p-6 md:p-8">
      <AdminDashboardClient initialMetrics={metrics} />
    </div>
  );
}
