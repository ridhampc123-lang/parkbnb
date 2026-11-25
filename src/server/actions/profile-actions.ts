'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { repository } from '@/lib/db/supabase-repository';
import { getLocalStore } from '@/lib/store/marketplace-store';

export async function updateCustomerProfileAction(formData: FormData) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required. Please sign in.' };
  }

  const fullName = (formData.get('full_name') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim();
  const preferredVehicleId = (formData.get('preferred_vehicle_id') as string)?.trim() || null;
  const marketingEmails = formData.get('marketing_emails') === 'true';
  const inAppNotifications = formData.get('in_app_notifications') !== 'false';

  if (!fullName || fullName.length < 2) {
    return { error: 'Please enter a valid full name (minimum 2 characters).' };
  }

  const updates = {
    full_name: fullName,
    phone: phone || session.user.phone || null,
    preferred_vehicle_id: preferredVehicleId,
    privacy_settings: {
      marketing_emails: marketingEmails,
      in_app_notifications: inAppNotifications,
    },
  };

  const updated = await repository.updateProfile(session.user.id, updates);
  if (!updated) {
    return { error: 'Failed to update profile. Please try again.' };
  }

  revalidatePath('/account/profile');
  revalidatePath('/account');

  return { success: true, profile: updated };
}

export async function requestAccountDeletionAction(reason: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  if (!reason || reason.trim().length < 5) {
    return { error: 'Please provide a reason for the account deletion request (minimum 5 characters).' };
  }

  const store = getLocalStore();
  store.recordAuditLog({
    operator_email: session.profile?.email || 'customer@parkbnb.in',
    action: 'CUSTOMER_ACCOUNT_DELETION_REQUESTED',
    category: 'privacy',
    target_id: session.user.id,
    target_name: session.profile?.full_name || 'Customer',
    details: `Customer requested DPDP Act account purge and data erasure. Reason: ${reason}`,
  });

  // Mark status as 'deleted' or pending purge
  await repository.updateProfile(session.user.id, {
    status: 'deleted',
  });

  revalidatePath('/account');
  revalidatePath('/account/profile');

  return {
    success: true,
    message: 'Your account deletion request has been submitted under the DPDP Act. Your personal details will be expunged within statutory timeframes.',
  };
}
