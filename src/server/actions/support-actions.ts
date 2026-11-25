'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { repository } from '@/lib/db/supabase-repository';
import { SupportTicket } from '@/types/database';

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

  const ticketNum = 'TKT-' + Math.floor(100000 + Math.random() * 900000);

  const ticket: SupportTicket = {
    id: 'tkt-' + Math.random().toString(36).substring(2, 9),
    ticket_number: ticketNum,
    user_id: session.user.id,
    booking_id,
    subject,
    category: category || 'general',
    priority,
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const created = await repository.createSupportTicket(ticket);

  revalidatePath('/account/support');
  revalidatePath('/admin/support');

  return { success: true, ticket: created };
}
