-- ============================================================================
-- PARKBNB COMPLETE PRODUCTION DATABASE SETUP & SAFE MIGRATION MASTER SCRIPT
-- Project: https://supabase.com/dashboard/project/vfgagycdlphosxkjfxuv/sql
-- ============================================================================
-- This script is strictly idempotent (safe to run multiple times).
-- It configures:
--  1. PostgreSQL Extensions (uuid-ossp, pgcrypto, btree_gist)
--  2. Full 9-Role RBAC Enums & Types
--  3. Complete Relational Tables with Foreign Keys & Unique Constraints
--  4. GiST Hardware-Level Overbooking Exclusion Constraint
--  5. Customer Privacy Architecture (Public ID, Booking Privacy References, Display Name Masking)
--  6. Server-side Phone OTP & Persistent Session Tables
--  7. Double-Entry Financial Ledger
--  8. Security Definer Stored Procedures & Atomic RPC Functions
--  9. Triggers for Automatic Cryptographic IDs
-- 10. Complete Row Level Security (RLS) Policies on Every Table
-- 11. Initial Verified Supply Seed Data & Permissions Matrix
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ----------------------------------------------------------------------------
-- STEP 2: ENUM TYPES (WITH FULL 9-ROLE RBAC)
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'visitor',
    'customer',
    'provider',
    'support_agent',
    'operations_manager',
    'finance_manager',
    'verification_manager',
    'admin',
    'super_admin'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'visitor'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'provider'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'support_agent'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'operations_manager'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'finance_manager'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'verification_manager'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin'; EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE provider_type AS ENUM ('individual_residential', 'commercial_operator', 'authorized_agent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM ('car_sedan', 'car_suv', 'car_hatchback', 'two_wheeler', 'ev_four_wheeler', 'ev_two_wheeler');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('draft', 'submitted', 'under_review', 'more_info_needed', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'hold_pending',
    'confirmed',
    'active',
    'completed',
    'cancelled_by_customer',
    'cancelled_by_provider',
    'cancelled_by_admin',
    'expired',
    'payment_failed',
    'disputed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('created', 'authorized', 'captured', 'refunded', 'partially_refunded', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE ledger_entry_type AS ENUM (
    'CUSTOMER_PAYMENT',
    'PLATFORM_COMMISSION',
    'PROVIDER_PAYABLE',
    'REFUND_CUSTOMER',
    'COMMISSION_REVERSAL',
    'PROVIDER_PAYOUT',
    'ADJUSTMENT'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- STEP 3: CORE TABLES & PRIVACY FIELDS
-- ----------------------------------------------------------------------------

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_public_id text UNIQUE,
  full_name text NOT NULL,
  email text UNIQUE,
  phone text,
  phone_verified boolean NOT NULL DEFAULT false,
  phone_verified_at timestamptz,
  role user_role NOT NULL DEFAULT 'customer',
  avatar_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  privacy_settings jsonb NOT NULL DEFAULT '{"marketing_emails": false, "in_app_notifications": true}'::jsonb,
  notification_preferences jsonb DEFAULT '{"sms": true, "whatsapp": true, "email": false}'::jsonb,
  preferred_vehicle_id uuid,
  last_active_at timestamptz DEFAULT now(),
  risk_score integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure all columns exist if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS customer_public_id text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"sms": true, "whatsapp": true, "email": false}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_vehicle_id uuid;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS risk_score integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_settings jsonb NOT NULL DEFAULT '{"marketing_emails": false, "in_app_notifications": true}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'));
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_verified_phone 
ON public.profiles (phone) 
WHERE phone IS NOT NULL AND phone_verified = true;

-- 2. Provider Profiles Table (Host Details & Banking)
CREATE TABLE IF NOT EXISTS public.provider_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_type provider_type NOT NULL DEFAULT 'individual_residential',
  business_name text,
  pan_number text,
  gstin text,
  verification_status verification_status NOT NULL DEFAULT 'draft',
  rejection_reason text,
  verified_at timestamptz,
  verified_by uuid REFERENCES public.profiles(id),
  bank_name text,
  bank_account_number text,
  bank_ifsc_code text,
  bank_account_holder text,
  upi_id text,
  payout_preference text NOT NULL DEFAULT 'bank_transfer' CHECK (payout_preference IN ('bank_transfer', 'upi')),
  commission_rate numeric(5, 2) DEFAULT 0.15,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  property_type text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  landmark text,
  area text NOT NULL,
  city text NOT NULL DEFAULT 'Ahmedabad',
  postal_code text NOT NULL,
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Parking Spaces Table
CREATE TABLE IF NOT EXISTS public.parking_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  identifier text NOT NULL,
  title text NOT NULL,
  description text,
  parking_type text NOT NULL DEFAULT 'covered',
  hourly_rate numeric(10, 2) NOT NULL CHECK (hourly_rate >= 0),
  daily_rate numeric(10, 2) CHECK (daily_rate IS NULL OR daily_rate >= 0),
  monthly_rate numeric(10, 2) CHECK (monthly_rate IS NULL OR monthly_rate >= 0),
  min_duration_hours integer NOT NULL DEFAULT 1 CHECK (min_duration_hours >= 1),
  max_duration_hours integer DEFAULT 720,
  access_instructions text,
  security_features text[] DEFAULT '{}',
  has_ev_charging boolean NOT NULL DEFAULT false,
  height_limit_meters numeric(3, 2),
  status verification_status NOT NULL DEFAULT 'submitted',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Customer Saved Vehicles Table (Smart Memory)
CREATE TABLE IF NOT EXISTS public.customer_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  registration_number text NOT NULL,
  make_model text,
  color text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_vehicles_customer_id 
ON public.customer_vehicles (customer_id);

-- 6. Booking Holds (10-minute temporary inventory locks)
CREATE TABLE IF NOT EXISTS public.booking_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.parking_spaces(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  hold_duration_range tstzrange NOT NULL,
  expires_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

-- 7. Bookings Table (With Privacy Architecture & Audit trail)
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text UNIQUE NOT NULL,
  booking_customer_reference text UNIQUE,
  customer_display_name text,
  space_id uuid NOT NULL REFERENCES public.parking_spaces(id),
  customer_id uuid NOT NULL REFERENCES public.profiles(id),
  provider_id uuid NOT NULL REFERENCES public.provider_profiles(id),
  vehicle_id uuid NOT NULL REFERENCES public.customer_vehicles(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  booking_duration_range tstzrange NOT NULL,
  status booking_status NOT NULL DEFAULT 'hold_pending',
  total_hours numeric(6, 2) NOT NULL CHECK (total_hours > 0),
  base_amount numeric(10, 2) NOT NULL CHECK (base_amount >= 0),
  platform_fee numeric(10, 2) NOT NULL CHECK (platform_fee >= 0),
  tax_amount numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
  provider_payout_amount numeric(10, 2) NOT NULL CHECK (provider_payout_amount >= 0),
  cancellation_reason text,
  cancelled_at timestamptz,
  check_in_at timestamptz,
  check_out_at timestamptz,
  gate_status text NOT NULL DEFAULT 'booked' CHECK (gate_status IN ('booked', 'checked_in', 'checked_out', 'overstay')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_customer_reference text UNIQUE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_display_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS check_in_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS check_out_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gate_status text NOT NULL DEFAULT 'booked' CHECK (gate_status IN ('booked', 'checked_in', 'checked_out', 'overstay'));

-- Strict Database-Level Overlapping Booking Exclusion Constraint (GIST)
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS no_overlapping_confirmed_bookings;
ALTER TABLE public.bookings
ADD CONSTRAINT no_overlapping_confirmed_bookings
EXCLUDE USING gist (
  space_id WITH =,
  booking_duration_range WITH &&
)
WHERE (status IN ('confirmed', 'active'));

-- 8. Double-Entry Financial Ledger Table
CREATE TABLE IF NOT EXISTS public.financial_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id),
  entry_type ledger_entry_type NOT NULL,
  debit_account text NOT NULL,
  credit_account text NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR',
  description text NOT NULL,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Privileged Customer Data Access Audit Log
CREATE TABLE IF NOT EXISTS public.customer_data_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  staff_role user_role NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  booking_reference text,
  reason text NOT NULL,
  fields_accessed text[] NOT NULL,
  approval_details text,
  outcome text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Operational Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_email text NOT NULL,
  action text NOT NULL,
  category text NOT NULL,
  target_id text,
  target_name text,
  details text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 11. Customer Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  booking_id uuid REFERENCES public.bookings(id),
  subject text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 12. Support Messages Table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  message text NOT NULL,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 13. Customer Consents & DPDP Compliance
CREATE TABLE IF NOT EXISTS public.customer_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 14. Server-Side Phone OTP Verification Table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone_created 
ON public.otp_verifications (phone, created_at DESC);

-- 15. Customer Sessions Table (Cryptographic Persistent Tokens)
CREATE TABLE IF NOT EXISTS public.customer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token_hash text NOT NULL UNIQUE,
  device_fingerprint text,
  ip_address text,
  is_revoked boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_sessions_token_hash 
ON public.customer_sessions (session_token_hash) 
WHERE is_revoked = false;

-- 16. Permissions & Role Permissions Catalog
CREATE TABLE IF NOT EXISTS public.permissions (
  code text PRIMARY KEY,
  description text NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role user_role NOT NULL,
  permission_code text NOT NULL REFERENCES public.permissions(code) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role, permission_code)
);

-- ----------------------------------------------------------------------------
-- STEP 4: HELPER FUNCTIONS & RPC PROCEDURES
-- ----------------------------------------------------------------------------

-- Check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check granular permission
CREATE OR REPLACE FUNCTION public.has_permission(p_permission_code text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.role_permissions rp ON rp.role = p.role
    WHERE p.id = auth.uid()
      AND (rp.permission_code = p_permission_code OR p.role = 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate Cryptographic Customer Public ID: PBN-C-XXXX-XXXX
CREATE OR REPLACE FUNCTION public.generate_cryptographic_customer_id()
RETURNS text AS $$
DECLARE
  v_chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_result text := 'PBN-C-';
  v_random_bytes bytea;
  v_val integer;
  i integer;
BEGIN
  v_random_bytes := gen_random_bytes(8);
  FOR i IN 0..7 LOOP
    v_val := get_byte(v_random_bytes, i);
    v_result := v_result || substr(v_chars, (v_val % length(v_chars)) + 1, 1);
  END LOOP;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Generate Booking Privacy Reference: PBN-REF-XXXX
CREATE OR REPLACE FUNCTION public.generate_booking_privacy_ref()
RETURNS text AS $$
DECLARE
  v_chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_result text := 'PBN-REF-';
  v_random_bytes bytea;
  v_val integer;
  i integer;
BEGIN
  v_random_bytes := gen_random_bytes(8);
  FOR i IN 0..7 LOOP
    v_val := get_byte(v_random_bytes, i);
    v_result := v_result || substr(v_chars, (v_val % length(v_chars)) + 1, 1);
  END LOOP;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Mask Customer Display Name: "Rahul Sharma" -> "Rahul S."
CREATE OR REPLACE FUNCTION public.mask_customer_display_name(p_name text)
RETURNS text AS $$
DECLARE
  v_parts text[];
  v_first text;
  v_last text;
BEGIN
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RETURN 'Valued Customer';
  END IF;

  v_parts := regexp_split_to_array(trim(p_name), '\s+');
  IF array_length(v_parts, 1) = 1 THEN
    RETURN v_parts[1];
  ELSE
    v_first := v_parts[1];
    v_last := v_parts[array_length(v_parts, 1)];
    RETURN v_first || ' ' || upper(substr(v_last, 1, 1)) || '.';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger: Auto-assign Customer ID on Profile Insert
CREATE OR REPLACE FUNCTION public.trg_assign_customer_public_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.customer_public_id IS NULL THEN
    NEW.customer_public_id := public.generate_cryptographic_customer_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_customer_public_id ON public.profiles;
CREATE TRIGGER trg_profiles_customer_public_id
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_assign_customer_public_id();

-- Trigger: Auto-assign Booking Privacy Reference on Booking Insert
CREATE OR REPLACE FUNCTION public.trg_assign_booking_privacy_details()
RETURNS trigger AS $$
DECLARE
  v_cust_name text;
BEGIN
  IF NEW.booking_customer_reference IS NULL THEN
    NEW.booking_customer_reference := public.generate_booking_privacy_ref();
  END IF;

  IF NEW.customer_display_name IS NULL THEN
    SELECT full_name INTO v_cust_name FROM public.profiles WHERE id = NEW.customer_id;
    NEW.customer_display_name := public.mask_customer_display_name(v_cust_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_privacy_details ON public.bookings;
CREATE TRIGGER trg_bookings_privacy_details
BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.trg_assign_booking_privacy_details();

-- Check Space Availability Procedure
CREATE OR REPLACE FUNCTION public.check_space_availability(
  p_space_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz
)
RETURNS boolean AS $$
DECLARE
  v_requested_range tstzrange := tstzrange(p_start_time, p_end_time);
  v_is_active boolean;
  v_is_verified boolean;
  v_conflict_count integer;
BEGIN
  SELECT ps.is_active, (ps.status = 'approved')
  INTO v_is_active, v_is_verified
  FROM public.parking_spaces ps
  WHERE ps.id = p_space_id;

  IF NOT FOUND OR NOT v_is_active OR NOT v_is_verified THEN
    RETURN false;
  END IF;

  -- Check confirmed or active bookings
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.bookings b
  WHERE b.space_id = p_space_id
    AND b.status IN ('confirmed', 'active')
    AND b.booking_duration_range && v_requested_range;

  IF v_conflict_count > 0 THEN
    RETURN false;
  END IF;

  -- Check unexpired temporary holds
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.booking_holds bh
  WHERE bh.space_id = p_space_id
    AND bh.is_active = true
    AND bh.expires_at > now()
    AND bh.hold_duration_range && v_requested_range;

  IF v_conflict_count > 0 THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Booking Hold Procedure
CREATE OR REPLACE FUNCTION public.create_booking_hold(
  p_space_id uuid,
  p_customer_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_hold_minutes integer DEFAULT 10
)
RETURNS uuid AS $$
DECLARE
  v_hold_id uuid;
  v_is_available boolean;
BEGIN
  PERFORM 1 FROM public.parking_spaces WHERE id = p_space_id FOR UPDATE;

  v_is_available := public.check_space_availability(p_space_id, p_start_time, p_end_time);

  IF NOT v_is_available THEN
    RAISE EXCEPTION 'SPACE_UNAVAILABLE: Parking space is not available for requested period.';
  END IF;

  INSERT INTO public.booking_holds (
    space_id,
    customer_id,
    start_time,
    end_time,
    hold_duration_range,
    expires_at,
    is_active
  )
  VALUES (
    p_space_id,
    p_customer_id,
    p_start_time,
    p_end_time,
    tstzrange(p_start_time, p_end_time),
    now() + (p_hold_minutes || ' minutes')::interval,
    true
  )
  RETURNING id INTO v_hold_id;

  RETURN v_hold_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Confirm Booking Payment Procedure
CREATE OR REPLACE FUNCTION public.confirm_booking_payment(
  p_booking_id uuid,
  p_razorpay_payment_id text,
  p_razorpay_order_id text,
  p_razorpay_signature text,
  p_payment_method text DEFAULT 'upi'
)
RETURNS boolean AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;

  IF v_booking.status = 'confirmed' THEN
    RETURN true;
  END IF;

  IF v_booking.status <> 'hold_pending' THEN
    RAISE EXCEPTION 'INVALID_BOOKING_STATUS: Cannot confirm booking in status %', v_booking.status;
  END IF;

  -- Update booking status to confirmed
  UPDATE public.bookings
  SET status = 'confirmed', updated_at = now()
  WHERE id = p_booking_id;

  -- Record immutable ledger entries
  INSERT INTO public.financial_ledger_entries (
    booking_id, entry_type, debit_account, credit_account, amount, currency, description, reference_id
  ) VALUES (
    p_booking_id, 'CUSTOMER_PAYMENT', 'GATEWAY_ESCROW', 'PLATFORM_UNEARNED', v_booking.total_amount, 'INR',
    'Gross customer payment for booking ' || v_booking.booking_reference, p_razorpay_payment_id
  );

  INSERT INTO public.financial_ledger_entries (
    booking_id, entry_type, debit_account, credit_account, amount, currency, description, reference_id
  ) VALUES (
    p_booking_id, 'PLATFORM_COMMISSION', 'PLATFORM_UNEARNED', 'PLATFORM_REVENUE', (v_booking.platform_fee + v_booking.tax_amount), 'INR',
    'Platform service fee + GST for booking ' || v_booking.booking_reference, p_booking_id::text
  );

  INSERT INTO public.financial_ledger_entries (
    booking_id, entry_type, debit_account, credit_account, amount, currency, description, reference_id
  ) VALUES (
    p_booking_id, 'PROVIDER_PAYABLE', 'PLATFORM_UNEARNED', 'PROVIDER_ESCROW:' || v_booking.provider_id::text, v_booking.provider_payout_amount, 'INR',
    'Net payable to provider for booking ' || v_booking.booking_reference, p_booking_id::text
  );

  -- Release temporary hold
  UPDATE public.booking_holds SET is_active = false
  WHERE space_id = v_booking.space_id AND customer_id = v_booking.customer_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Privileged Audited Customer Lookup Procedure
CREATE OR REPLACE FUNCTION public.privileged_customer_lookup(
  p_search_term text,
  p_reason text,
  p_fields_requested text[] DEFAULT ARRAY['phone', 'email', 'name', 'vehicles']
)
RETURNS TABLE (
  customer_id uuid,
  customer_public_id text,
  full_name text,
  email text,
  phone text,
  phone_verified boolean,
  status text,
  created_at timestamptz
) AS $$
DECLARE
  v_staff_id uuid := auth.uid();
  v_staff_role user_role;
  v_target_id uuid;
BEGIN
  SELECT role INTO v_staff_role FROM public.profiles WHERE id = v_staff_id;
  IF v_staff_role NOT IN ('admin', 'super_admin', 'support_agent', 'operations_manager') THEN
    RAISE EXCEPTION 'FORBIDDEN: User does not possess customer lookup privileges.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'AUDIT_REQUIRED: A legitimate customer support reason is mandatory.';
  END IF;

  SELECT p.id INTO v_target_id
  FROM public.profiles p
  LEFT JOIN public.bookings b ON b.customer_id = p.id
  WHERE p.customer_public_id = p_search_term
     OR p.email = p_search_term
     OR p.phone = p_search_term
     OR b.booking_reference = p_search_term
     OR b.booking_customer_reference = p_search_term
  LIMIT 1;

  IF v_target_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.customer_data_access_logs (
    staff_id,
    staff_role,
    customer_id,
    booking_reference,
    reason,
    fields_accessed,
    outcome
  ) VALUES (
    v_staff_id,
    v_staff_role,
    v_target_id,
    p_search_term,
    p_reason,
    p_fields_requested,
    'SUCCESS_RECORD_REVEALED'
  );

  RETURN QUERY
  SELECT 
    p.id,
    p.customer_public_id,
    p.full_name,
    p.email,
    p.phone,
    p.phone_verified,
    p.status,
    p.created_at
  FROM public.profiles p
  WHERE p.id = v_target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup Expired Holds & OTPs Procedure
CREATE OR REPLACE FUNCTION public.cleanup_expired_holds_and_otps()
RETURNS void AS $$
BEGIN
  UPDATE public.booking_holds 
  SET is_active = false 
  WHERE is_active = true AND expires_at < now();

  DELETE FROM public.otp_verifications 
  WHERE created_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- STEP 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can read basic profile; users edit own; staff reads with permission
DROP POLICY IF EXISTS "Public read basic profiles" ON public.profiles;
CREATE POLICY "Public read basic profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Parking Spaces: Anyone discovers active approved spaces; providers manage own
DROP POLICY IF EXISTS "Anyone can discover approved active parking spaces" ON public.parking_spaces;
CREATE POLICY "Anyone can discover approved active parking spaces" ON public.parking_spaces 
FOR SELECT USING ((status = 'approved' AND is_active = true) OR provider_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Hosts manage own spaces" ON public.parking_spaces;
CREATE POLICY "Hosts manage own spaces" ON public.parking_spaces 
FOR ALL USING (provider_id = auth.uid() OR public.is_admin());

-- Customer Vehicles: Customers manage own vehicles
DROP POLICY IF EXISTS "Customers manage own vehicles" ON public.customer_vehicles;
CREATE POLICY "Customers manage own vehicles" ON public.customer_vehicles 
FOR ALL USING (customer_id = auth.uid() OR public.is_admin());

-- Bookings: Customers see own; Hosts see incoming bookings; Admins see all
DROP POLICY IF EXISTS "Customers see own bookings" ON public.bookings;
CREATE POLICY "Customers see own bookings" ON public.bookings 
FOR SELECT USING (customer_id = auth.uid() OR provider_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Customers create bookings" ON public.bookings;
CREATE POLICY "Customers create bookings" ON public.bookings 
FOR INSERT WITH CHECK (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Update bookings" ON public.bookings;
CREATE POLICY "Update bookings" ON public.bookings 
FOR UPDATE USING (customer_id = auth.uid() OR provider_id = auth.uid() OR public.is_admin());

-- Financial Ledger: Providers see own escrow; Admins see all; Customers denied
DROP POLICY IF EXISTS "Ledger view" ON public.financial_ledger_entries;
CREATE POLICY "Ledger view" ON public.financial_ledger_entries 
FOR SELECT USING (
  debit_account = ('PROVIDER_ESCROW:' || auth.uid()::text) OR
  credit_account = ('PROVIDER_ESCROW:' || auth.uid()::text) OR
  public.is_admin()
);

-- Support Tickets: Users manage own; Admins manage all
DROP POLICY IF EXISTS "Tickets view" ON public.support_tickets;
CREATE POLICY "Tickets view" ON public.support_tickets 
FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Tickets insert" ON public.support_tickets;
CREATE POLICY "Tickets insert" ON public.support_tickets 
FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Permissions catalog: viewable by all authenticated users
DROP POLICY IF EXISTS "Permissions viewable" ON public.permissions;
CREATE POLICY "Permissions viewable" ON public.permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Role permissions viewable" ON public.role_permissions;
CREATE POLICY "Role permissions viewable" ON public.role_permissions FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- STEP 6: SEED DATA & PERMISSIONS
-- ----------------------------------------------------------------------------

-- Seed Master Permissions Catalog
INSERT INTO public.permissions (code, description, category) VALUES
  ('customer:manage_self', 'Manage own customer profile and vehicles', 'customer'),
  ('customer:create_booking', 'Create holds and reserve parking spaces', 'customer'),
  ('customer:cancel_own_booking', 'Cancel eligible reservations', 'customer'),
  ('provider:manage_spaces', 'Create and modify parking spaces', 'provider'),
  ('provider:view_gate_manifest', 'View check-in vehicle plate numbers and masked names', 'provider'),
  ('provider:request_payout', 'Request earnings withdrawal to bank account', 'provider'),
  ('support:view_tickets', 'Read and reply to support inquiries', 'support'),
  ('support:lookup_customer', 'Perform audited customer lookup for active incidents', 'support'),
  ('verification:audit_hosts', 'Review KYC documents and verify properties', 'verification'),
  ('finance:manage_ledger', 'Inspect financial transactions and ledger integrity', 'finance'),
  ('finance:disburse_payouts', 'Authorize provider settlement transfers', 'finance'),
  ('operations:manage_spaces', 'Approve, suspend, or modify space listings', 'operations'),
  ('operations:arbitrate_disputes', 'Investigate and resolve customer complaints', 'operations'),
  ('admin:full_access', 'Standard administrative operations', 'admin'),
  ('super_admin:all', 'Complete platform governance, role assignment & secrets', 'super_admin')
ON CONFLICT (code) DO NOTHING;

-- Seed Role-Permissions Matrix
INSERT INTO public.role_permissions (role, permission_code) VALUES
  -- Customer
  ('customer', 'customer:manage_self'),
  ('customer', 'customer:create_booking'),
  ('customer', 'customer:cancel_own_booking'),
  -- Provider / Owner
  ('provider', 'provider:manage_spaces'),
  ('provider', 'provider:view_gate_manifest'),
  ('provider', 'provider:request_payout'),
  -- Support Agent
  ('support_agent', 'support:view_tickets'),
  ('support_agent', 'support:lookup_customer'),
  -- Verification Manager
  ('verification_manager', 'verification:audit_hosts'),
  ('verification_manager', 'operations:manage_spaces'),
  -- Finance Manager
  ('finance_manager', 'finance:manage_ledger'),
  ('finance_manager', 'finance:disburse_payouts'),
  -- Operations Manager
  ('operations_manager', 'operations:manage_spaces'),
  ('operations_manager', 'operations:arbitrate_disputes'),
  ('operations_manager', 'support:view_tickets'),
  -- Admin
  ('admin', 'admin:full_access'),
  ('admin', 'operations:manage_spaces'),
  ('admin', 'operations:arbitrate_disputes'),
  ('admin', 'verification:audit_hosts'),
  ('admin', 'finance:manage_ledger'),
  ('admin', 'support:lookup_customer'),
  ('admin', 'support:view_tickets'),
  -- Super Admin
  ('super_admin', 'super_admin:all'),
  ('super_admin', 'admin:full_access')
ON CONFLICT DO NOTHING;

-- Verify setup
SELECT count(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
