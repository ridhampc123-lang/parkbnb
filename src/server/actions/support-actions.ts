'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';

export async function createSupportTicketAction(formData: FormData) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'You must be signed in to submit a support request.' };
  }

  const subject = formData.get('subject') as string;
  const category = formData.get('category') as string;
  const booking_id = (formData.get('booking_id') as string) || undefined;
  const priority = (formData.get('priority') as 'low' | 'medium' | 'high' | 'urgent') || 'medium';

  if (!subject || subject.trim().length < 5) {
    return { error: 'Please enter a descriptive subject for your ticket (min 5 characters).' };
  }

  const store = getLocalStore();
  const ticketNum = 'TKT-' + Math.floor(100000 + Math.random() * 900000);

  const ticket = store.createSupportTicket({
    ticket_number: ticketNum,
    user_id: session.user.id,
    booking_id,
    subject,
    category: category || 'general',
    priority,
    status: 'open',
  });

  revalidatePath('/account/support');
  revalidatePath('/admin/support');

  return { success: true, ticket };
}
