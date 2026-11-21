export type UserRole = 'customer' | 'provider' | 'admin' | 'super_admin';
export type ProviderType = 'individual_residential' | 'commercial_operator' | 'authorized_agent';
export type VehicleType = 'car_sedan' | 'car_suv' | 'car_hatchback' | 'two_wheeler' | 'ev_four_wheeler' | 'ev_two_wheeler';
export type VerificationStatus = 'draft' | 'submitted' | 'under_review' | 'more_info_needed' | 'approved' | 'rejected' | 'suspended';
export type BookingStatus = 'hold_pending' | 'confirmed' | 'active' | 'completed' | 'cancelled_by_customer' | 'cancelled_by_provider' | 'cancelled_by_admin' | 'expired' | 'payment_failed' | 'disputed';
export type PaymentStatus = 'created' | 'authorized' | 'captured' | 'refunded' | 'partially_refunded' | 'failed';
export type LedgerEntryType = 'CUSTOMER_PAYMENT' | 'PLATFORM_COMMISSION' | 'PROVIDER_PAYABLE' | 'REFUND_CUSTOMER' | 'COMMISSION_REVERSAL' | 'PROVIDER_PAYOUT' | 'ADJUSTMENT';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  phone_verified: boolean;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderProfile {
  id: string;
  provider_type: ProviderType;
  business_name?: string | null;
  pan_number?: string | null;
  gstin?: string | null;
  verification_status: VerificationStatus;
  rejection_reason?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  bank_account_number?: string | null;
  bank_ifsc_code?: string | null;
  bank_account_holder?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  provider_id: string;
  title: string;
  property_type: string;
  address_line1: string;
  address_line2?: string | null;
  landmark?: string | null;
  area: string;
  city: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface ParkingSpace {
  id: string;
  property_id: string;
  provider_id: string;
  identifier: string;
  title: string;
  description?: string | null;
  parking_type: 'covered' | 'open' | 'basement' | 'multi_level';
  hourly_rate: number;
  daily_rate?: number | null;
  monthly_rate?: number | null;
  min_duration_hours: number;
  max_duration_hours: number;
  access_instructions?: string | null;
  security_features: string[];
  has_ev_charging: boolean;
  height_limit_meters?: number | null;
  status: VerificationStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  property?: Property;
  photos?: ParkingSpacePhoto[];
  vehicle_types?: VehicleType[];
}

export interface ParkingSpacePhoto {
  id: string;
  space_id: string;
  storage_path: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface CustomerVehicle {
  id: string;
  customer_id: string;
  vehicle_type: VehicleType;
  registration_number: string;
  make_model?: string | null;
  color?: string | null;
  is_default: boolean;
  created_at: string;
}

export interface BookingHold {
  id: string;
  space_id: string;
  customer_id: string;
  start_time: string;
  end_time: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_reference: string;
  space_id: string;
  customer_id: string;
  provider_id: string;
  vehicle_id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  total_hours: number;
  base_amount: number;
  platform_fee: number;
  tax_amount: number;
  total_amount: number;
  provider_payout_amount: number;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  check_in_at?: string | null;
  check_out_at?: string | null;
  created_at: string;
  updated_at: string;
  space?: ParkingSpace;
  vehicle?: CustomerVehicle;
  customer?: Profile;
}

export interface FinancialLedgerEntry {
  id: string;
  booking_id?: string | null;
  entry_type: LedgerEntryType;
  debit_account: string;
  credit_account: string;
  amount: number;
  currency: string;
  description: string;
  reference_id?: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  space_id: string;
  customer_id: string;
  rating: number;
  comment?: string | null;
  is_approved: boolean;
  created_at: string;
  customer?: Profile;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  booking_id?: string | null;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}
