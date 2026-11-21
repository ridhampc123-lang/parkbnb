'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';

export async function verifySpaceAction(params: {
  spaceId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || session.role !== 'admin') {
    return { error: 'Forbidden: Admin authorization required.' };
  }

  const store = getLocalStore();
  const space = store.getSpaceById(params.spaceId);
  if (!space) {
    return { error: 'Space not found.' };
  }

  store.updateSpace(params.spaceId, {
    status: params.status,
  });

  revalidatePath('/admin/verifications');
  revalidatePath('/admin/listings');
  revalidatePath('/search');

  return { success: true };
}

export async function verifyProviderAction(params: {
  providerId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || session.role !== 'admin') {
    return { error: 'Forbidden: Admin authorization required.' };
  }

  const store = getLocalStore();
  const provider = store.getProviderProfile(params.providerId);
  if (!provider) {
    return { error: 'Provider record not found.' };
  }

  store.saveProviderProfile({
    ...provider,
    verification_status: params.status,
    rejection_reason: params.rejectionReason || null,
    verified_at: params.status === 'approved' ? new Date().toISOString() : null,
    verified_by: session.user?.id,
  });

  revalidatePath('/admin/verifications');
  revalidatePath('/admin/providers');

  return { success: true };
}
