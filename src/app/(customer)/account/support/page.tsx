import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { redirect } from 'next/navigation';
import { SupportClient } from './support-client';

export default async function CustomerSupportPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const store = getLocalStore();
  const tickets = store.getTicketsByUser(session.user.id);

  return <SupportClient initialTickets={tickets} />;
}
