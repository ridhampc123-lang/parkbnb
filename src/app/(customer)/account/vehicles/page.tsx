import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { redirect } from 'next/navigation';
import { VehiclesClient } from './vehicles-client';

export default async function VehiclesPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const store = getLocalStore();
  const vehicles = store.getVehiclesByCustomer(session.user.id);

  return <VehiclesClient initialVehicles={vehicles} />;
}
