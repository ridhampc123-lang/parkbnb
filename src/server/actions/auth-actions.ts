'use server';

import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { loginSchema, registerSchema } from '@/lib/validation/schemas';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { repository } from '@/lib/db/supabase-repository';
import { Profile, ProviderProfile, CustomerVehicle, VehicleType } from '@/types/database';
import { signSessionToken, hashPassword } from '@/lib/auth/session-token';
import { generateCustomerPublicId, generateOwnerPublicId } from '@/lib/privacy/customer-privacy';
import { verifyOtpAction } from './otp-actions';

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  const validation = loginSchema.safeParse({ email, password });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const store = getLocalStore();
  let authenticatedProfile: Profile | null = null;

  // 1. Primary: Attempt Supabase Auth if connected
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error && data?.user) {
        authenticatedProfile = store.getProfileByEmail(email) || {
          id: data.user.id,
          customer_public_id: generateCustomerPublicId(),
          email,
          full_name: (data.user.user_metadata?.full_name as string) || email.split('@')[0],
          role: (data.user.user_metadata?.role as any) || 'customer',
          status: 'active',
          phone: data.user.phone || null,
          phone_verified: !!data.user.phone,
          created_at: data.user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else if (error) {
        console.info(`[Auth] Supabase signIn note: ${error.message}. Checking local verified credentials.`);
      }
    } catch (err) {
      console.warn('[Auth] Supabase signIn exception:', err);
    }
  }

  // 2. Verify with cryptographically hashed credential store (scrypt constant-time verification)
  if (!authenticatedProfile) {
    const { verified, profile } = store.verifyUserCredentials(email, password);
    if (verified && profile) {
      authenticatedProfile = profile;
    }
  }

  // 3. Reject if credentials do not match with clear, actionable warnings
  if (!authenticatedProfile) {
    const existingProfile = store.getProfileByEmail(email);
    if (existingProfile) {
      const cred = store.getAuthCredential(email);
      if (!cred || !cred.passwordHash) {
        return {
          error: 'This account was created via Mobile OTP without a password. Please use Mobile OTP Sign In, or set a password below to continue.',
          code: 'NO_PASSWORD_SET',
          phone: existingProfile.phone || undefined,
        };
      }
      return {
        error: 'Incorrect password entered. If you forgot your password, you can sign in directly using Mobile OTP.',
        code: 'INVALID_PASSWORD',
        phone: existingProfile.phone || undefined,
      };
    }
    return {
      error: 'Invalid email or password. Please check your credentials or register for a new account.',
      code: 'ACCOUNT_NOT_FOUND',
    };
  }

  // 5. Set cryptographically signed session cookie (30 days persistent)
  const cookieStore = await cookies();
  const { token } = signSessionToken({
    sub: authenticatedProfile.id,
    phone: authenticatedProfile.phone,
    name: authenticatedProfile.full_name,
    role: authenticatedProfile.role,
  });
  cookieStore.set('parkbnb_auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return { success: true, role: authenticatedProfile.role };
}

export async function registerAction(formData: FormData) {
  const full_name = (formData.get('full_name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const phone = ((formData.get('phone') as string) || '').trim();
  const role = ((formData.get('role') as string) || 'customer') as 'customer' | 'provider';

  const validation = registerSchema.safeParse({ full_name, email, password, phone, role });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const store = getLocalStore();
  const existing = store.getProfileByEmail(email);
  if (existing) {
    return { error: 'An account with this email address already exists. Please sign in.' };
  }

  // Payout validation if host registration
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
  }

  // 1. Attempt Supabase signup in parallel if configured
  let supabaseUserId: string | null = null;
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    try {
      const { data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name, role },
        },
      });
      if (data?.user?.id) {
        supabaseUserId = data.user.id;
      }
    } catch (err) {
      console.warn('[Auth] Supabase signUp non-blocking notice:', err);
    }
  }

  // 2. Consistent UUID identifier
  const userId = supabaseUserId || crypto.randomUUID();
  const customerPublicId = generateCustomerPublicId();

  // 3. Save cryptographically hashed password credential with unique salt
  const { hash, salt } = hashPassword(password);
  store.saveAuthCredentials({
    userId,
    email,
    passwordHash: hash,
    salt,
    role,
    fullName: full_name,
    phone: phone || null,
    createdAt: new Date().toISOString(),
  });

  // 4. Save Customer/Host Profile
  const newProfile: Profile = {
    id: userId,
    customer_public_id: customerPublicId,
    full_name,
    email,
    phone: phone || null,
    phone_verified: false,
    role,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await repository.upsertProfile(newProfile);

  if (role === 'provider') {
    const newProvider: ProviderProfile = {
      id: userId,
      owner_public_id: generateOwnerPublicId(),
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
    await repository.upsertProviderProfile(newProvider);
  }

  // 5. Issue persistent 30-day session token cookie
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

  return { success: true, role, userId };
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

/**
 * Direct Mobile OTP Customer Login Action
 */
export async function customerLoginWithOtpAction(params: { phone: string; otp: string }) {
  const result = await verifyOtpAction(params);
  if (result.error) {
    return { error: result.error };
  }
  return {
    success: true,
    role: result.profile?.role || 'customer',
    userId: result.profile?.id,
  };
}

/**
 * Set or Reset Account Password via Mobile OTP Verification
 */
export async function setAccountPasswordWithOtpAction(params: {
  phone: string;
  otp: string;
  newPassword: string;
  email?: string;
}) {
  const { phone, otp, newPassword, email } = params;

  if (!newPassword || newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  // 1. Verify OTP first
  const otpRes = await verifyOtpAction({
    phone,
    otp,
    customerDetails: email ? { email } : undefined,
  });

  if (otpRes.error || !otpRes.profile) {
    return { error: otpRes.error || 'Failed to verify mobile OTP.' };
  }

  // 2. Hash and save password
  const store = getLocalStore();
  const { hash, salt } = hashPassword(newPassword);
  const targetEmail = (email || otpRes.profile.email || `${phone.replace(/\D/g, '').slice(-10)}@phone.parkbnb.in`).toLowerCase().trim();

  store.saveAuthCredentials({
    userId: otpRes.profile.id,
    email: targetEmail,
    passwordHash: hash,
    salt,
    role: otpRes.profile.role,
    fullName: otpRes.profile.full_name,
    phone: otpRes.profile.phone,
    createdAt: new Date().toISOString(),
  });

  // Ensure profile email is updated if new email was provided
  if (email && otpRes.profile.email !== targetEmail) {
    await repository.updateProfile(otpRes.profile.id, { email: targetEmail });
  }

  store.recordAuditLog({
    operator_email: targetEmail,
    action: 'PASSWORD_SET_VIA_OTP',
    category: 'auth',
    target_id: otpRes.profile.id,
    target_name: otpRes.profile.full_name,
    details: 'Customer established account password via mobile OTP verification.',
  });

  return { success: true, role: otpRes.profile.role };
}

/**
 * Complete Customer Onboarding from Checkout (Full Name, Email, Password & Vehicle)
 */
export async function completeCustomerOnboardingAction(params: {
  fullName: string;
  email?: string;
  password?: string;
  vehiclePlate: string;
  vehicleType?: VehicleType;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required. Please verify your mobile number.' };
  }

  const { fullName, email, password, vehiclePlate, vehicleType } = params;

  if (!fullName || fullName.trim().length < 2) {
    return { error: 'Please enter your full legal name.' };
  }

  if (!vehiclePlate || vehiclePlate.trim().length < 4) {
    return { error: 'Please enter a valid vehicle license plate number.' };
  }

  const store = getLocalStore();

  // 1. Update customer profile details
  const updates: Partial<Profile> = {
    full_name: fullName.trim(),
  };
  if (email && email.trim()) {
    updates.email = email.trim().toLowerCase();
  }
  await repository.updateProfile(session.user.id, updates);

  // 2. If password provided, save credentials for email sign-in
  if (password && password.length >= 6) {
    const credEmail = (email?.trim() || session.profile?.email || `${session.user.phone}@phone.parkbnb.in`).toLowerCase();
    const { hash, salt } = hashPassword(password);
    store.saveAuthCredentials({
      userId: session.user.id,
      email: credEmail,
      passwordHash: hash,
      salt,
      role: 'customer',
      fullName: fullName.trim(),
      phone: session.user.phone || null,
      createdAt: new Date().toISOString(),
    });

    store.recordAuditLog({
      operator_email: credEmail,
      action: 'PASSWORD_SET_ON_CHECKOUT',
      category: 'auth',
      target_id: session.user.id,
      target_name: fullName.trim(),
      details: 'Customer created account password during booking checkout.',
    });
  }

  // 3. Save vehicle into customer smart memory
  const cleanPlate = vehiclePlate.trim().toUpperCase();
  const existingVehicles = await repository.getVehiclesByCustomer(session.user.id);
  const vehicleId = crypto.randomUUID();
  const newVehicle: CustomerVehicle = {
    id: vehicleId,
    customer_id: session.user.id,
    vehicle_type: vehicleType || 'car_sedan',
    registration_number: cleanPlate,
    is_default: existingVehicles.length === 0,
    created_at: new Date().toISOString(),
  };
  await repository.createVehicle(newVehicle);

  return { success: true, vehicle: newVehicle };
}
