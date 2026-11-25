import { getServerSession } from '@/lib/auth/session';
import { repository } from '@/lib/db/supabase-repository';
import { redirect } from 'next/navigation';
import { HostSupportClient } from './support-client';

export const dynamic = 'force-dynamic';

export default async function HostSupportPage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const hostTickets = await repository.getSupportTicketsByUser(session.user!.id);

  return (
    <HostSupportClient
      initialTickets={hostTickets}
    />
  );
}
