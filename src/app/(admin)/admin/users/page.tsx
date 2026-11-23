import { getLocalStore } from '@/lib/store/marketplace-store';
import { CustomerManagementClient } from './customer-management-client';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const store = getLocalStore();
  const customers = store.getAllCustomers();
  const bookings = store.getAllBookings();

  return (
    <CustomerManagementClient
      initialCustomers={customers}
      bookings={bookings}
    />
  );
}
