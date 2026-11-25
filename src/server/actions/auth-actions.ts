'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { loginSchema, registerSchema } from '@/lib/validation/schemas';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { Profile, ProviderProfile } from '@/types/database';
import { signSessionToken } from '@/lib/auth/session-token';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const validation = loginSchema.safeParse({ email, password });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const supabase = await getSupabaseServerClient();

  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error: error.message };
    }
  }

  // Local store authentication fallback/coordination
  const store = getLocalStore();
  let profile = store.getProfileByEmail(email);

  if (!profile) {
    // If not found in local store, return error
    return { error: 'Invalid email or password. Please register if you do not have an account.' };
  }

  // Set cryptographically signed session cookie (30 days persistent)
  const cookieStore = await cookies();
  const { token } = signSessionToken({
    sub: profile.id,
    phone: profile.phone,
    name: profile.full_name,
    role: profile.role,
  });
  cookieStore.set('parkbnb_auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return { success: true, role: profile.role };
}

export async function registerAction(formData: FormData) {
  const full_name = formData.get('full_name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const phone = (formData.get('phone') as string) || '';
  const role = (formData.get('role') as 'customer' | 'provider') || 'customer';

  const validation = registerSchema.safeParse({ full_name, email, password, phone, role });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const store = getLocalStore();
  const existing = store.getProfileByEmail(email);
  if (existing) {
    return { error: 'An account with this email address already exists. Please sign in.' };
  }

  const userId = 'usr-' + Math.random().toString(36).substring(2, 9);
  const newProfile: Profile = {
    id: userId,
    full_name,
    email,
    phone: phone || null,
    phone_verified: false,
    role,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.createProfile(newProfile);

  // Extract and validate payout details if host registration
  let bank_name: string | null = null;
  let bank_account_holder: string | null = null;
  let bank_account_number: string | null = null;
  let bank_ifsc_code: string | null = null;
  let upi_id: string | null = null;
  let payout_preference: 'bank_transfer' | 'upi' = 'bank_transfer';

  if (role === 'provider') {
    bank_name = (formData.get('bank_name') as string)?.trim() || null;
    bank_account_holder = (formData.get('bank_account_holder') as string)?.trim() || full_name;
    bank_account_number = (formData.get('bank_account_number') as string)?.trim() || null;
    const confirm_account_number = (formData.get('confirm_account_number') as string)?.trim() || null;
    bank_ifsc_code = (formData.get('bank_ifsc_code') as string)?.trim()?.toUpperCase() || null;
    upi_id = (formData.get('upi_id') as string)?.trim() || null;
    payout_preference = (formData.get('payout_preference') as 'bank_transfer' | 'upi') || 'bank_transfer';

    if (bank_account_number && confirm_account_number && bank_account_number !== confirm_account_number) {
      return { error: 'Bank account number and confirmation account number do not match.' };
    }
    if (bank_account_number && !/^\d{9,18}$/.test(bank_account_number)) {
      return { error: 'Please enter a valid Indian bank account number (9 to 18 digits).' };
    }
    if (bank_ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank_ifsc_code)) {
      return { error: 'Please enter a valid 11-digit IFSC code (e.g. SBIN0001234, HDFC0000240).' };
    }
    if (upi_id && !/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi_id)) {
      return { error: 'Please enter a valid UPI ID (e.g. name@okhdfcbank or 9876543210@upi).' };
    }

    const newProvider: ProviderProfile = {
      id: userId,
      provider_type: 'individual_residential',
      verification_status: 'draft',
      bank_name: bank_name || null,
      bank_account_number: bank_account_number || null,
      bank_account_holder: bank_account_holder || full_name,
      bank_ifsc_code: bank_ifsc_code || null,
      upi_id: upi_id || null,
      payout_preference: payout_preference || 'bank_transfer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.saveProviderProfile(newProvider);
  }

  // If Supabase is connected, trigger signup
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name, role },
        },
      });
    } catch {
      // Continue with local session
    }
  }

  const cookieStore = await cookies();
  const { token } = signSessionToken({
    sub: userId,
    phone: phone || null,
    name: full_name,
    role,
  });
  cookieStore.set('parkbnb_auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  return { success: true, role };
}

export async function logoutAction() {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
  }

  const cookieStore = await cookies();
  cookieStore.delete('parkbnb_auth_token');

  redirect('/login');
}

export async function updateHostPayoutDetailsAction(formData: FormData) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required. Please sign in as a host.' };
  }

  const bank_name = (formData.get('bank_name') as string)?.trim() || null;
  const bank_account_holder = (formData.get('bank_account_holder') as string)?.trim() || null;
  const bank_account_number = (formData.get('bank_account_number') as string)?.trim() || null;
  const confirm_account_number = (formData.get('confirm_account_number') as string)?.trim() || null;
  const bank_ifsc_code = (formData.get('bank_ifsc_code') as string)?.trim()?.toUpperCase() || null;
  const upi_id = (formData.get('upi_id') as string)?.trim() || null;
  const payout_preference = (formData.get('payout_preference') as 'bank_transfer' | 'upi') || 'bank_transfer';

  if (bank_account_number && confirm_account_number && bank_account_number !== confirm_account_number) {
    return { error: 'Bank account number and confirmation account number do not match.' };
  }
  if (bank_account_number && !/^\d{9,18}$/.test(bank_account_number)) {
    return { error: 'Please enter a valid Indian bank account number (9 to 18 digits).' };
  }
  if (bank_ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank_ifsc_code)) {
    return { error: 'Please enter a valid 11-digit IFSC code (e.g. SBIN0001234, HDFC0000240).' };
  }
  if (upi_id && !/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi_id)) {
    return { error: 'Please enter a valid UPI ID (e.g. name@okhdfcbank or 9876543210@upi).' };
  }

  const store = getLocalStore();
  const existingProvider = store.getProviderProfile(session.user.id);
  if (!existingProvider) {
    store.saveProviderProfile({
      id: session.user.id,
      provider_type: 'individual_residential',
      verification_status: 'draft',
      bank_name,
      bank_account_holder: bank_account_holder || session.profile?.full_name || null,
      bank_account_number,
      bank_ifsc_code,
      upi_id,
      payout_preference,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } else {
    store.updateProviderPayoutDetails(session.user.id, {
      bank_name,
      bank_account_holder: bank_account_holder || existingProvider.bank_account_holder || session.profile?.full_name || null,
      bank_account_number,
      bank_ifsc_code,
      upi_id,
      payout_preference,
    });
  }

  store.recordAuditLog({
    operator_email: session.profile?.email || 'host@parkbnb.in',
    action: 'HOST_PAYOUT_DETAILS_UPDATED',
    category: 'host',
    target_id: session.user.id,
    target_name: session.profile?.full_name || 'Host',
    details: `Host updated payout settlement account details. IFSC: ${bank_ifsc_code || 'None'}, UPI: ${upi_id || 'None'}, Route: ${payout_preference}`,
  });

  revalidatePath('/host');
  revalidatePath('/host/earnings');
  revalidatePath('/host/spaces/new');
  revalidatePath('/admin/hosts');

  return { success: true };
}
