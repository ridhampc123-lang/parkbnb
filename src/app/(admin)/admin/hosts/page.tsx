import { getLocalStore } from '@/lib/store/marketplace-store';
import { HostManagementClient } from './host-management-client';

export const dynamic = 'force-dynamic';

export default async function AdminHostsPage() {
  const store = getLocalStore();
  const hosts = store.getAllHosts();

  return <HostManagementClient initialHosts={hosts} />;
}
