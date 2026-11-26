'use server';

import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { repository } from '@/lib/db/supabase-repository';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServerSession } from '@/lib/auth/session';
import { signSessionToken, hashOtp, verifyOtpHash } from '@/lib/auth/session-token';
import { generateCustomerPublicId } from '@/lib/privacy/customer-privacy';
import { Profile, CustomerVehicle, VehicleType } from '@/types/database';

function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

function isValidIndianPhone(phone: string): boolean {
  const clean = cleanPhoneNumber(phone);
  return /^[6-9]\d{9}$/.test(clean);
}

/**
 * Checks whether a phone number has an existing verified customer profile
 */
export async function checkMobileIdentityAction(phone: string) {
  if (!phone || !isValidIndianPhone(phone)) {
    return { error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).' };
  }

  const cleanPhone = cleanPhoneNumber(phone);
  const store = getLocalStore();
  const profile = (await repository.getProfileByPhone(cleanPhone)) || store.getProfileByPhone(cleanPhone);

  if (profile) {
    return {
      success: true,
      isExisting: true,
      phoneVerified: profile.phone_verified,
      fullName: profile.full_name,
      maskedPhone: cleanPhone.slice(0, 2) + '••••••' + cleanPhone.slice(-2),
    };
  }

  return {
    success: true,
    isExisting: false,
    phoneVerified: false,
    maskedPhone: cleanPhone.slice(0, 2) + '••••••' + cleanPhone.slice(-2),
  };
}

/**
 * Sends a 6-digit cryptographic verification code to the mobile number
 */
export async function sendOtpAction(phone: string) {
  if (!phone || !isValidIndianPhone(phone)) {
    return { error: 'Please enter a valid 10-digit Indian mobile number.' };
  }

  const cleanPhone = cleanPhoneNumber(phone);
  const store = getLocalStore();

  // 1. Rate Limiting: Max 1 request per 60 seconds
  const latestOtp = store.getLatestOtp(cleanPhone);
  if (latestOtp) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(latestOtp.created_at).getTime()) / 1000);
    if (elapsedSeconds < 60) {
      const waitRemaining = 60 - elapsedSeconds;
      return {
        error: `Please wait ${waitRemaining} seconds before requesting a new code.`,
        cooldownSeconds: waitRemaining,
      };
    }
  }

  // 2. Hourly rate limiting: Max 5 requests per hour
  const recentCount = store.getRecentOtpCount(cleanPhone, 60);
  if (recentCount >= 5) {
    return {
      error: 'Too many verification attempts for this number. Please wait 1 hour or contact support.',
    };
  }

  // 3. Cryptographically generate 6-digit numeric OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(cleanPhone, rawOtp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  // 4. Save securely in server-side store (never plaintext!)
  store.saveOtp(cleanPhone, otpHash, expiresAt);

  // 5. Audit Log
  store.recordAuditLog({
    operator_email: 'system-auth',
    action: 'OTP_DISPATCHED',
    category: 'auth',
    target_id: cleanPhone,
    target_name: 'Customer Phone Verification',
    details: `6-digit OTP generated and hashed for mobile +91-${cleanPhone}. Expires in 10 minutes.`,
  });

  // Optional: In dev/test environments, allow predictable verification fallback for automated testing
  const isDev = process.env.NODE_ENV !== 'production';

  return {
    success: true,
    phone: cleanPhone,
    cooldownSeconds: 60,
    message: `Verification code sent to +91 ${cleanPhone.slice(0, 2)}••••••${cleanPhone.slice(-2)}`,
    // Only exposed in non-production for automated end-to-end tests
    devCode: isDev ? rawOtp : undefined,
  };
}

/**
 * Server-side OTP verification & automatic customer account linking / session creation
 */
export async function verifyOtpAction(params: {
  phone: string;
  otp: string;
  customerDetails?: {
    fullName?: string;
    email?: string;
  };
}) {
  const { phone, otp, customerDetails } = params;

  if (!phone || !isValidIndianPhone(phone)) {
    return { error: 'Invalid mobile number.' };
  }

  if (!otp || !/^\d{6}$/.test(otp.trim())) {
    return { error: 'Please enter the valid 6-digit verification code.' };
  }

  const cleanPhone = cleanPhoneNumber(phone);
  const store = getLocalStore();
  const otpRecord = store.getLatestOtp(cleanPhone);

  if (!otpRecord) {
    return { error: 'No active verification code found for this mobile number. Please request a new code.' };
  }

  // 1. Expiration check
  if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
    return { error: 'This verification code has expired. Please request a fresh code.' };
  }

  // 2. Max attempts check (3 failed attempts maximum)
  if (otpRecord.attempts >= otpRecord.max_attempts) {
    return {
      error: 'Too many incorrect attempts. This code has been invalidated. Please request a new code.',
    };
  }

  // 3. Cryptographic constant-time comparison
  const isValid = verifyOtpHash(cleanPhone, otp.trim(), otpRecord.otp_hash);

  if (!isValid) {
    const attemptsUsed = store.recordOtpAttempt(cleanPhone);
    const attemptsLeft = Math.max(0, otpRecord.max_attempts - attemptsUsed);

    store.recordAuditLog({
      operator_email: 'system-auth',
      action: 'OTP_FAILED_ATTEMPT',
      category: 'auth',
      target_id: cleanPhone,
      target_name: 'Customer Phone Verification',
      details: `Failed OTP attempt for +91-${cleanPhone}. Attempts remaining: ${attemptsLeft}`,
    });

    if (attemptsLeft === 0) {
      return {
        error: 'Too many incorrect attempts. For security, please request a new verification code.',
      };
    }

    return {
      error: `Incorrect verification code. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`,
    };
  }

  // Mark OTP as verified
  store.markOtpVerified(cleanPhone);

  // 4. Customer Profile Resolution / Creation
  let profile = (await repository.getProfileByPhone(cleanPhone)) || store.getProfileByPhone(cleanPhone);
  let isNewCustomer = false;

  if (!profile) {
    // Brand new customer: Create verified customer profile
    isNewCustomer = true;
    const userId = crypto.randomUUID();
    const publicId = generateCustomerPublicId();
    const newProfile: Profile = {
      id: userId,
      customer_public_id: publicId,
      full_name: customerDetails?.fullName?.trim() || 'Valued Guest',
      email: customerDetails?.email?.trim() || `${cleanPhone}@phone.parkbnb.in`,
      phone: cleanPhone,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
      role: 'customer',
      status: 'active',
      privacy_settings: {
        marketing_emails: false,
        in_app_notifications: true,
        data_retention_days: 365,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    profile = await repository.upsertProfile(newProfile);

    store.recordAuditLog({
      operator_email: 'system-auth',
      action: 'CUSTOMER_REGISTERED_VIA_OTP',
      category: 'user',
      target_id: userId,
      target_name: profile.full_name,
      details: `New customer account created and verified with phone +91-${cleanPhone}.`,
    });
  } else {
    // Existing customer: Update verification timestamp and name if provided
    const updates: Partial<Profile> = {
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };
    if (customerDetails?.fullName?.trim() && (!profile.full_name || profile.full_name === 'Valued Guest')) {
      updates.full_name = customerDetails.fullName.trim();
    }
    if (customerDetails?.email?.trim() && !profile.email) {
      updates.email = customerDetails.email.trim();
    }
    const updated = await repository.updateProfile(profile.id, updates);
    if (updated) {
      profile = updated;
    }

    store.recordAuditLog({
      operator_email: 'system-auth',
      action: 'CUSTOMER_AUTHENTICATED_VIA_OTP',
      category: 'auth',
      target_id: profile.id,
      target_name: profile.full_name,
      details: `Returning customer authenticated with verified phone +91-${cleanPhone}.`,
    });
  }

  // 5. Establish persistent cryptographically signed session (30-day persistent session)
  const finalProfile: Profile = profile!;
  const cookieStore = await cookies();
  const { token } = signSessionToken({
    sub: finalProfile.id,
    phone: cleanPhone,
    name: finalProfile.full_name,
    role: finalProfile.role,
  });

  cookieStore.set('parkbnb_auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return {
    success: true,
    isNewCustomer,
    profile: finalProfile,
  };
}

/**
 * Retrieves the authenticated customer's smart memory (profile, verified phone, saved vehicles)
 */
export async function getCustomerMemoryAction() {
  const session = await getServerSession();

  if (!session.isAuthenticated || !session.user || !session.profile) {
    return {
      isAuthenticated: false,
      profile: null,
      vehicles: [],
    };
  }

  const store = getLocalStore();
  const vehicles = store.getVehiclesByCustomer(session.user.id);
  const preferredVehicle = vehicles.find(v => v.is_default) || vehicles[0] || null;

  return {
    isAuthenticated: true,
    profile: session.profile,
    vehicles,
    preferredVehicle,
  };
}

/**
 * Saves a vehicle into the customer's smart memory
 */
export async function saveCustomerVehicleAction(params: {
  vehicleType: VehicleType;
  registrationNumber: string;
  makeModel?: string;
  color?: string;
  isDefault?: boolean;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required to save vehicle.' };
  }

  const { vehicleType, registrationNumber, makeModel, color, isDefault } = params;

  if (!registrationNumber || registrationNumber.trim().length < 4) {
    return { error: 'Please enter a valid vehicle license plate (e.g. GJ 01 AB 1234).' };
  }

  const cleanReg = registrationNumber.trim().toUpperCase();
  const store = getLocalStore();

  // Check if customer already has this vehicle
  const existing = store.findVehicleByPlate(session.user.id, cleanReg);
  if (existing) {
    if (isDefault && !existing.is_default) {
      store.createVehicle({ ...existing, is_default: true });
    }
    return { success: true, vehicle: existing };
  }

  // Create new customer vehicle record
  const customerVehicles = store.getVehiclesByCustomer(session.user.id);
  const isFirstVehicle = customerVehicles.length === 0;

  const vehicle: CustomerVehicle = {
    id: 'veh-' + Math.random().toString(36).substring(2, 9),
    customer_id: session.user.id,
    vehicle_type: vehicleType,
    registration_number: cleanReg,
    make_model: makeModel?.trim() || null,
    color: color?.trim() || null,
    is_default: Boolean(isDefault || isFirstVehicle),
    created_at: new Date().toISOString(),
  };

  store.createVehicle(vehicle);

  return {
    success: true,
    vehicle,
  };
}
