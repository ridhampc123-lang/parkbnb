import { getLocalStore } from '@/lib/store/marketplace-store';
import { ListingsClient } from './listings-client';

export const dynamic = 'force-dynamic';

export default async function AdminListingsPage() {
  const store = getLocalStore();
  const spaces = store.getAllSpaces();

  return <ListingsClient initialSpaces={spaces} />;
}
