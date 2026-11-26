import crypto from 'crypto';
import { Booking, CustomerDataAccessLog, Profile, UserRole } from '@/types/database';

// Character set avoiding ambiguous characters (0, O, 1, I)
const ID_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates permanent unpredictable Customer Public ID
 * Example: PBN-C-7K9X4M2Q
 */
export function generateCustomerPublicId(): string {
  const bytes = crypto.randomBytes(8);
  let result = 'PBN-C-';
  for (let i = 0; i < 8; i++) {
    result += ID_CHARSET[bytes[i] % ID_CHARSET.length];
  }
  return result;
}

/**
 * Generates permanent unpredictable Owner / Parking Provider Public ID
 * Example: PBN-O-8K2M9P4X
 */
export function generateOwnerPublicId(): string {
  const bytes = crypto.randomBytes(8);
  let result = 'PBN-O-';
  for (let i = 0; i < 8; i++) {
    result += ID_CHARSET[bytes[i] % ID_CHARSET.length];
  }
  return result;
}

/**
 * Generates permanent unpredictable Parking Space / Listing Public ID
 * Example: PBN-S-3T7W5R9Y
 */
export function generateSpacePublicId(): string {
  const bytes = crypto.randomBytes(8);
  let result = 'PBN-S-';
  for (let i = 0; i < 8; i++) {
    result += ID_CHARSET[bytes[i] % ID_CHARSET.length];
  }
  return result;
}

/**
 * Auto-detects identifier type from string prefix / format
 */
export function detectIdentifierType(identifier: string): 'owner' | 'customer' | 'space' | 'booking' | 'vehicle' | 'unknown' {
  if (!identifier) return 'unknown';
  const clean = identifier.trim().toUpperCase();

  if (clean.startsWith('PBN-O-')) return 'owner';
  if (clean.startsWith('PBN-C-')) return 'customer';
  if (clean.startsWith('PBN-S-')) return 'space';
  if (clean.startsWith('PKB-') || clean.startsWith('PBN-REF-') || clean.startsWith('BPR-')) return 'booking';
  
  // Indian vehicle registration number format (e.g. GJ01AB1234 or GJ 01 AB 1234)
  const plateClean = clean.replace(/[\s-]/g, '');
  if (/^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}$/.test(plateClean)) {
    return 'vehicle';
  }

  return 'unknown';
}

/**
 * Generates unique booking-specific customer reference
 * Example: PBN-REF-8M2Q4K9X
 */
export function generateBookingCustomerReference(): string {
  const bytes = crypto.randomBytes(8);
  let result = 'PBN-REF-';
  for (let i = 0; i < 8; i++) {
    result += ID_CHARSET[bytes[i] % ID_CHARSET.length];
  }
  return result;
}

/**
 * Masks customer display name for owner/provider views
 * "Rahul Sharma" -> "Rahul S."
 * "Priya" -> "Priya"
 * "" -> "Valued Customer"
 */
export function maskCustomerDisplayName(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) {
    return 'Valued Customer';
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0];
  }

  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

/**
 * Privacy-safe booking clearance manifest for parking owners / security guards.
 * STRICT PRIVACY RULE: Excludes raw email, phone number, residential address,
 * and internal database UUIDs.
 */
export interface OwnerGateManifestItem {
  id: string;
  booking_reference: string;
  booking_customer_reference: string;
  customer_display_name: string;
  start_time: string;
  end_time: string;
  status: string;
  space_title: string;
  space_identifier: string;
  vehicle_plate: string;
  vehicle_type: string;
  vehicle_make_model?: string | null;
  provider_payout_amount: number;
}

export function sanitizeBookingForOwner(booking: Booking): OwnerGateManifestItem {
  return {
    id: booking.id,
    booking_reference: booking.booking_reference,
    booking_customer_reference: booking.booking_customer_reference || generateBookingCustomerReference(),
    customer_display_name: booking.customer_display_name || maskCustomerDisplayName(booking.customer?.full_name),
    start_time: booking.start_time,
    end_time: booking.end_time,
    status: booking.status,
    space_title: booking.space?.title || 'Reserved Parking Bay',
    space_identifier: booking.space?.identifier || 'Assigned Slot',
    vehicle_plate: booking.vehicle?.registration_number || 'GJ 01 Clearance Required',
    vehicle_type: booking.vehicle?.vehicle_type || 'car_sedan',
    vehicle_make_model: booking.vehicle?.make_model || null,
    provider_payout_amount: booking.provider_payout_amount,
  };
}

export const VALID_SUPPORT_LOOKUP_REASONS = [
  'gate_entry_denial',
  'wrong_vehicle_parked',
  'overstay_penalty_review',
  'property_damage_claim',
  'lost_property_inquiry',
  'payment_dispute_arbitration',
  'authorized_legal_escalation',
] as const;

export type SupportLookupReason = (typeof VALID_SUPPORT_LOOKUP_REASONS)[number];

export interface PrivilegedLookupResult {
  customer_public_id: string;
  masked_display_name: string;
  phone_masked: string;
  email_masked: string;
  full_name?: string;
  phone_unmasked?: string;
  email_unmasked?: string;
  status: string;
  account_created: string;
  lookup_audit_id: string;
}

/**
 * Masks phone number for intermediate support view:
 * "9876543210" -> "98****3210"
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone || phone.length < 6) return 'Not registered';
  const clean = phone.trim();
  return clean.slice(0, 2) + '****' + clean.slice(-4);
}

/**
 * Masks email address for intermediate support view:
 * "rahul.patel@example.com" -> "r***l@example.com"
 */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return 'Not registered';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local.charAt(0)}*@${domain}`;
  return `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;
}
