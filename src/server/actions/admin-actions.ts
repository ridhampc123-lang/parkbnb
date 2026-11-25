'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { VerificationStatus, PlatformSettings, UserRole } from '@/types/database';
import { hasPermission, isStaffRole } from '@/lib/auth/rbac';
import { signSessionToken } from '@/lib/auth/session-token';

// -------------------------------------------------------------
// DEDICATED ADMIN / STAFF AUTHENTICATION ACTION
// -------------------------------------------------------------
export async function adminLoginAction(prevState: { error?: string } | null, formData: FormData) {
  const email = (formData.get('email') as string)?.trim()?.toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both staff email and access credentials.' };
  }

  const store = getLocalStore();

  // 1. Try Supabase Auth if connected
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        // Query user profile to verify staff / admin role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, status, phone')
          .eq('id', data.user.id)
          .single();

        let currentProfile = profile;
        let userRole = currentProfile?.role;

        // Auto-heal primary admin email if profile record is missing or not yet marked as super_admin
        const primaryAdminEmail = (process.env.ADMIN_INITIAL_EMAIL || 'admin@parkbnb.in').toLowerCase();
        if ((!userRole || !isStaffRole(userRole)) && email === primaryAdminEmail) {
          const { data: upsertedProfile } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              customer_public_id: 'PBN-C-ADMIN001',
              full_name: data.user.user_metadata?.full_name || 'ParkBnB Administrator',
              email: email,
              role: 'super_admin',
              phone_verified: true,
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .select('role, full_name, status, phone')
            .single();

          if (upsertedProfile) {
            currentProfile = upsertedProfile;
            userRole = upsertedProfile.role;
          } else {
            userRole = 'super_admin';
            currentProfile = {
              role: 'super_admin',
              full_name: data.user.user_metadata?.full_name || 'ParkBnB Administrator',
              status: 'active',
              phone: '',
            } as any;
          }
        }

        if (!isStaffRole(userRole)) {
          await supabase.auth.signOut();
          return { error: 'Access Denied: This console is strictly restricted to authorized ParkBnB staff and administrators.' };
        }

        if (currentProfile?.status === 'suspended') {
          await supabase.auth.signOut();
          return { error: 'Account Suspended: Contact Super Administrator for assistance.' };
        }

        store.recordAuditLog({
          operator_email: email,
          action: 'STAFF_LOGIN_SUCCESS',
          category: 'auth',
          target_id: data.user.id,
          target_name: currentProfile?.full_name || 'Staff Member',
          details: `Staff member logged in with role: ${userRole || 'admin'}`,
        });

        const { token } = signSessionToken({
          sub: data.user.id,
          phone: (currentProfile as any)?.phone || '',
          name: currentProfile?.full_name || 'Staff Member',
          role: userRole || 'admin',
        });
        const cookieStore = await cookies();
        cookieStore.set('parkbnb_auth_token', token, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 86400 * 30,
          sameSite: 'lax',
        });

        redirect('/admin');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'digest' in err) {
        throw err;
      }
    }
  }

  // 2. Cryptographic staff credential verification (scrypt hash + salt)
  const { verified, profile: verifiedProfile } = store.verifyUserCredentials(email, password);
  if (verified && verifiedProfile && isStaffRole(verifiedProfile.role)) {
    if (verifiedProfile.status === 'suspended') {
      return { error: 'Account Suspended: Contact Super Administrator for assistance.' };
    }

    const { token } = signSessionToken({
      sub: verifiedProfile.id,
      phone: verifiedProfile.phone,
      name: verifiedProfile.full_name,
      role: verifiedProfile.role,
    });

    const cookieStore = await cookies();
    cookieStore.set('parkbnb_auth_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400 * 30,
      sameSite: 'lax',
    });

    store.recordAuditLog({
      operator_email: email,
      action: 'STAFF_LOGIN_SUCCESS',
      category: 'auth',
      target_id: verifiedProfile.id,
      target_name: verifiedProfile.full_name,
      details: `Staff member authenticated with role: ${verifiedProfile.role}`,
    });

    redirect('/admin');
  }

  return { error: 'Access Denied: Invalid staff credentials.' };
}

// -------------------------------------------------------------
// PRIVILEGED CUSTOMER LOOKUP ACTION (AUDITED SUPPORT WORKFLOW)
// -------------------------------------------------------------
export async function privilegedCustomerLookupAction(params: {
  searchTerm: string;
  reason: string;
  unmaskSensitive?: boolean;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !hasPermission(session, 'support:lookup_customer')) {
    return { error: 'Forbidden: Insufficient privileges to perform customer data lookup.' };
  }

  const store = getLocalStore();
  const result = store.privilegedCustomerLookup({
    searchTerm: params.searchTerm,
    reason: params.reason,
    staffId: session.user?.id || 'staff',
    staffRole: session.role,
    staffEmail: session.profile?.email || 'staff@parkbnb.in',
    unmaskSensitive: params.unmaskSensitive,
  });

  if (!result.success) {
    return { error: result.error || 'Lookup failed.' };
  }

  revalidatePath('/admin/users');
  revalidatePath('/admin/audit-logs');
  return { success: true, customer: result.customer, auditLogId: result.auditLogId };
}

// -------------------------------------------------------------
// USER / DRIVER MANAGEMENT ACTIONS
// -------------------------------------------------------------
export async function toggleUserStatusAction(params: {
  userId: string;
  status: 'active' | 'suspended';
  reason?: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !hasPermission(session, 'operations:suspend_accounts')) {
    return { error: 'Forbidden: Required permission [operations:suspend_accounts] not held.' };
  }

  const store = getLocalStore();
  const updated = store.toggleUserStatus(params.userId, params.status, params.reason);
  if (!updated) {
    return { error: 'User record not found.' };
  }

  revalidatePath('/admin/users');
  revalidatePath('/admin');
  return { success: true, status: updated.status };
}

/**
 * Changes a user's operational role across the platform.
 * Requires admin:full_access or super_admin permissions.
 */
export async function updateUserRoleAction(params: {
  userId: string;
  role: UserRole;
  reason?: string;
}) {
  const session = await getServerSession();
  if (
    !session.isAuthenticated ||
    (!hasPermission(session, 'admin:full_access') &&
      !hasPermission(session, 'super_admin:manage_roles') &&
      session.role !== 'admin' &&
      session.role !== 'super_admin')
  ) {
    return { error: 'Forbidden: Administrator privileges required to reassign roles.' };
  }

  const store = getLocalStore();
  const profile = store.getProfileById(params.userId);
  if (!profile) {
    return { error: 'User record not found.' };
  }

  const oldRole = profile.role;
  profile.role = params.role;
  profile.updated_at = new Date().toISOString();
  store.updateProfile(params.userId, { role: params.role });

  // If changing to provider, ensure provider_profile exists
  if (params.role === 'provider' && !store.getProviderProfile(params.userId)) {
    store.saveProviderProfile({
      id: params.userId,
      business_name: profile.full_name,
      provider_type: 'individual_residential',
      verification_status: 'approved',
      commission_rate: 0.15,
      payout_preference: 'bank_transfer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Also update Supabase database if connected
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase
        .from('profiles')
        .update({ role: params.role, updated_at: new Date().toISOString() })
        .eq('id', params.userId);
    } catch (err) {
      console.warn('[Admin] Failed to sync role to Supabase:', err);
    }
  }

  store.recordAuditLog({
    operator_email: session.user?.email || 'admin@parkbnb.in',
    action: 'USER_ROLE_UPDATED',
    category: 'user',
    target_id: params.userId,
    target_name: profile.full_name,
    details: 'Role changed from ' + oldRole + ' to ' + params.role + '. Reason: ' + (params.reason || 'Admin modification via console'),
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin');
  revalidatePath('/admin/hosts');

  return { success: true, updatedRole: params.role };
}

// -------------------------------------------------------------
// PARKING OWNER / HOST ACTIONS
// -------------------------------------------------------------
export async function updateHostKYCAction(params: {
  hostId: string;
  status: VerificationStatus;
  reason?: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !hasPermission(session, 'verification:audit_hosts')) {
    return { error: 'Forbidden: Verification Manager authorization required.' };
  }

  const store = getLocalStore();
  const updated = store.updateHostKYC(
    params.hostId,
    params.status,
    params.reason,
    session.profile?.email || 'verification@parkbnb.in'
  );

  if (!updated) {
    return { error: 'Host provider record not found.' };
  }

  revalidatePath('/admin/hosts');
  revalidatePath('/admin/verifications');
  revalidatePath('/admin/listings');
  revalidatePath('/admin');
  revalidatePath('/search');

  return { success: true };
}

export async function overrideHostCommissionAction(params: {
  hostId: string;
  customRate: number; // e.g. 0.12 for 12%
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !hasPermission(session, 'finance:manage_ledger')) {
    return { error: 'Forbidden: Finance Manager authorization required.' };
  }

  const store = getLocalStore();
  const updated = store.overrideHostCommission(
    params.hostId,
    params.customRate,
    session.profile?.email || 'finance@parkbnb.in'
  );

  if (!updated) {
    return { error: 'Host provider record not found.' };
  }

  revalidatePath('/admin/hosts');
  revalidatePath('/admin');
  return { success: true };
}

export async function disburseHostPayoutAction(params: {
  hostId: string;
  amount: number;
  paymentMethod: 'NEFT' | 'IMPS' | 'UPI';
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !hasPermission(session, 'finance:disburse_payouts')) {
    return { error: 'Forbidden: Finance disbursement authorization required.' };
  }

  const store = getLocalStore();
  try {
    const res = store.disburseHostPayout({
      hostId: params.hostId,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      operatorEmail: session.profile?.email || 'finance@parkbnb.in',
    });

    revalidatePath('/admin/hosts');
    revalidatePath('/admin/payments');
    revalidatePath('/admin');

    return { success: true, reference: res.reference };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Payout disbursement failed.' };
  }
}
// -------------------------------------------------------------
// PARKING SPACES & PRICING ACTIONS
// -------------------------------------------------------------
export async function verifySpaceAction(params: {
  spaceId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !hasPermission(session, 'verification:approve_spaces')) {
    return { error: 'Forbidden: Listing Verification authorization required.' };
  }

  const store = getLocalStore();
  const space = store.getSpaceById(params.spaceId);
  if (!space) {
    return { error: 'Space not found.' };
  }

  store.updateSpace(params.spaceId, {
    status: params.status,
    is_active: params.status === 'approved',
  });

  store.recordAuditLog({
    operator_email: session.profile?.email || 'admin@parkbnb.in',
    action: `SPACE_${params.status.toUpperCase()}`,
    category: 'space',
    target_id: space.id,
    target_name: space.title,
    details: params.rejectionReason || `Staff updated space status to ${params.status}.`,
  });

  revalidatePath('/admin/verifications');
  revalidatePath('/admin/listings');
  revalidatePath('/admin');
  revalidatePath('/search');
  revalidatePath('/host/spaces');

  return { success: true };
}

export async function toggleSpaceActiveAction(spaceId: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !hasPermission(session, 'operations:manage_spaces')) {
    return { error: 'Forbidden: Space operational management authorization required.' };
  }

  const store = getLocalStore();
  const space = store.getSpaceById(spaceId);
  if (!space) {
    return { error: 'Space not found.' };
  }

  const newActive = !space.is_active;
  store.updateSpace(spaceId, { is_active: newActive });

  store.recordAuditLog({
    operator_email: session.profile?.email || 'admin@parkbnb.in',
    action: newActive ? 'SPACE_ACTIVATED' : 'SPACE_SUSPENDED',
    category: 'space',
    target_id: space.id,
    target_name: space.title,
    details: `Staff toggled listing active status to ${newActive}.`,
  });

  revalidatePath('/admin/listings');
  revalidatePath('/admin');
  revalidatePath('/search');
  revalidatePath('/host/spaces');

  return { success: true, is_active: newActive };
}

export async function updateSpacePricingAction(params: {
  spaceId: string;
  hourlyRate: number;
  dailyRate?: number | null;
  monthlyRate?: number | null;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !hasPermission(session, 'operations:manage_spaces')) {
    return { error: 'Forbidden: Pricing modification authorization required.' };
  }

  const store = getLocalStore();
  const updated = store.updateSpacePricing({
    ...params,
    operatorEmail: session.profile?.email || 'admin@parkbnb.in',
  });

  if (!updated) {
    return { error: 'Space not found.' };
  }

  revalidatePath('/admin/listings');
  revalidatePath('/admin');
  revalidatePath('/search');
  revalidatePath('/parking/[slug]');

  return { success: true };
}

// -------------------------------------------------------------
// BOOKING ACTIONS
// -------------------------------------------------------------
export async function forceCompleteBookingAction(params: {
  bookingId: string;
  reason?: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !hasPermission(session, 'operations:arbitrate_disputes')) {
    return { error: 'Forbidden: Operations clearance authorization required.' };
  }

  const store = getLocalStore();
  const updated = store.forceCompleteBooking(
    params.bookingId,
    params.reason,
    session.profile?.email || 'admin@parkbnb.in'
  );

  if (!updated) {
    return { error: 'Booking not found.' };
  }

  revalidatePath('/admin/bookings');
  revalidatePath('/admin');
  revalidatePath('/account/bookings');
  revalidatePath('/host/bookings');

  return { success: true };
}

export async function adminCancelBookingAction(params: {
  bookingId: string;
  refundReason: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !hasPermission(session, 'operations:arbitrate_disputes')) {
    return { error: 'Forbidden: Operational cancellation authorization required.' };
  }

  const store = getLocalStore();
  const updated = store.adminCancelAndRefund(
    params.bookingId,
    params.refundReason,
    session.profile?.email || 'admin@parkbnb.in'
  );

  if (!updated) {
    return { error: 'Booking not found.' };
  }

  revalidatePath('/admin/bookings');
  revalidatePath('/admin/payments');
  revalidatePath('/admin');
  revalidatePath('/account/bookings');
  revalidatePath('/host/bookings');

  return { success: true };
}

// -------------------------------------------------------------
// DISPUTE & GRIEVANCE ACTIONS
// -------------------------------------------------------------
export async function resolveDisputeAction(params: {
  ticketId: string;
  resolution: 'refund_full' | 'reject';
  resolutionNotes: string;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !hasPermission(session, 'operations:arbitrate_disputes')) {
    return { error: 'Forbidden: Dispute resolution authorization required.' };
  }

  const store = getLocalStore();
  const tickets = store.getAllTickets();
  const ticket = tickets.find(t => t.id === params.ticketId);

  if (!ticket) {
    return { error: 'Ticket not found.' };
  }

  ticket.status = 'resolved';
  ticket.internal_notes = params.resolutionNotes;
  ticket.updated_at = new Date().toISOString();

  if (params.resolution === 'refund_full' && ticket.booking_id) {
    store.adminCancelAndRefund(
      ticket.booking_id,
      params.resolutionNotes,
      session.profile?.email || 'admin@parkbnb.in'
    );
  } else {
    store.recordAuditLog({
      operator_email: session.profile?.email || 'admin@parkbnb.in',
      action: 'DISPUTE_DISMISSED',
      category: 'dispute',
      target_id: ticket.id,
      target_name: ticket.ticket_number,
      details: `Dispute closed without refund: ${params.resolutionNotes}`,
    });
  }

  revalidatePath('/admin/disputes');
  revalidatePath('/admin/payments');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin');
  revalidatePath('/account/support');
  revalidatePath('/account/bookings');

  return { success: true };
}

// -------------------------------------------------------------
// PLATFORM SETTINGS ACTIONS
// -------------------------------------------------------------
export async function updatePlatformSettingsAction(newSettings: Partial<PlatformSettings>) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !hasPermission(session, 'admin:full_access')) {
    return { error: 'Forbidden: Admin authorization required to update platform settings.' };
  }

  const store = getLocalStore();
  const updated = store.updatePlatformSettings(
    newSettings,
    session.profile?.email || 'admin@parkbnb.in'
  );

  revalidatePath('/admin/settings');
  revalidatePath('/admin');
  return { success: true, settings: updated };
}

// -------------------------------------------------------------
// REPORT EXPORT ACTION (PERMISSION CONTROLLED)
// -------------------------------------------------------------
export async function exportAdminReportAction(reportType: 'customers' | 'hosts' | 'bookings' | 'ledger') {
  const session = await getServerSession();
  if (!session.isAuthenticated || !hasPermission(session, 'admin:view_dashboard')) {
    return { error: 'Forbidden: Unauthorized to export business reports.' };
  }

  const store = getLocalStore();
  let csvContent = '';

  if (reportType === 'customers') {
    const customers = store.getAllCustomers();
    csvContent = 'Customer_Public_ID,Status,Total_Bookings,Spend_INR,Joined\n';
    for (const c of customers) {
      csvContent += `"${c.customer_public_id || c.id}","${c.status}","${c.totalBookings}","${c.lifetimeSpend}","${c.created_at}"\n`;
    }
  } else if (reportType === 'hosts') {
    const hosts = store.getAllHosts();
    csvContent = 'Host_ID,Business_Name,Status,Spaces_Count,Earnings_INR,Unpaid_Balance\n';
    for (const h of hosts) {
      csvContent += `"${h.provider.id}","${h.provider.business_name || 'Individual'}","${h.provider.verification_status}","${h.spacesCount}","${h.totalEarnings}","${h.unpaidBalance}"\n`;
    }
  } else if (reportType === 'bookings') {
    const bookings = store.getAllBookings();
    csvContent = 'Booking_Ref,Privacy_Ref,Masked_Name,Status,Hours,Total_Amount,Start_Time\n';
    for (const b of bookings) {
      csvContent += `"${b.booking_reference}","${b.booking_customer_reference}","${b.customer_display_name}","${b.status}","${b.total_hours}","${b.total_amount}","${b.start_time}"\n`;
    }
  } else if (reportType === 'ledger') {
    if (!hasPermission(session, 'finance:manage_ledger')) {
      return { error: 'Forbidden: Finance permission required for ledger export.' };
    }
    const entries = store.getLedgerEntries();
    csvContent = 'ID,Type,Debit_Account,Credit_Account,Amount_INR,Reference,Timestamp\n';
    for (const e of entries) {
      csvContent += `"${e.id}","${e.entry_type}","${e.debit_account}","${e.credit_account}","${e.amount}","${e.reference_id || ''}","${e.created_at}"\n`;
    }
  }

  store.recordAuditLog({
    operator_email: session.profile?.email || 'admin@parkbnb.in',
    action: 'REPORT_EXPORTED',
    category: 'settings',
    details: `Exported ${reportType} report with ${csvContent.split('\n').length - 1} records.`,
  });

  return { success: true, csvContent, filename: `parkbnb-${reportType}-${new Date().toISOString().slice(0, 10)}.csv` };
}

// -------------------------------------------------------------
// LISTING TITLE DROPDOWN MANAGEMENT (ADMIN CONTROLLED)
// -------------------------------------------------------------
export async function getListingTitleOptionsAction(): Promise<string[]> {
  const store = getLocalStore();
  return store.getListingTitleOptions();
}

export async function addListingTitleOptionAction(title: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || (!hasPermission(session, 'admin:full_access') && !isStaffRole(session.role))) {
    return { error: 'Forbidden: Admin authorization required to manage listing title dropdown options.' };
  }

  const trimmed = title?.trim();
  if (!trimmed || trimmed.length < 3) {
    return { error: 'Listing title option must be at least 3 characters long.' };
  }

  const store = getLocalStore();
  const existing = store.getListingTitleOptions();
  if (existing.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
    return { error: 'This listing title option already exists in the dropdown.' };
  }

  const updated = store.addListingTitleOption(trimmed, session.profile?.email || 'admin@parkbnb.in');

  revalidatePath('/admin/settings');
  revalidatePath('/host/spaces/new');
  revalidatePath('/admin/listings');

  return { success: true, options: updated };
}

export async function updateListingTitleOptionAction(oldTitle: string, newTitle: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || (!hasPermission(session, 'admin:full_access') && !isStaffRole(session.role))) {
    return { error: 'Forbidden: Admin authorization required to manage listing title dropdown options.' };
  }

  const trimmedOld = oldTitle?.trim();
  const trimmedNew = newTitle?.trim();
  if (!trimmedNew || trimmedNew.length < 3) {
    return { error: 'Listing title option must be at least 3 characters long.' };
  }

  const store = getLocalStore();
  const updated = store.updateListingTitleOption(trimmedOld, trimmedNew, session.profile?.email || 'admin@parkbnb.in');

  revalidatePath('/admin/settings');
  revalidatePath('/host/spaces/new');
  revalidatePath('/admin/listings');

  return { success: true, options: updated };
}

export async function removeListingTitleOptionAction(title: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || (!hasPermission(session, 'admin:full_access') && !isStaffRole(session.role))) {
    return { error: 'Forbidden: Admin authorization required to manage listing title dropdown options.' };
  }

  const trimmed = title?.trim();
  const store = getLocalStore();
  const existing = store.getListingTitleOptions();
  if (existing.length <= 1) {
    return { error: 'Cannot remove the last listing title option. At least one option must remain in the dropdown.' };
  }

  const updated = store.removeListingTitleOption(trimmed, session.profile?.email || 'admin@parkbnb.in');

  revalidatePath('/admin/settings');
  revalidatePath('/host/spaces/new');
  revalidatePath('/admin/listings');

  return { success: true, options: updated };
}
