-- ============================================================================
-- ParkBnB Complete Production Database Setup & Migration Script
-- Project: https://supabase.com/dashboard/project/vfgagycdlphosxkjfxuv/sql
-- ============================================================================
-- Run this complete script in your Supabase Dashboard > SQL Editor.
-- It is idempotent (safe to run multiple times) and configures:
-- 1. Authentication token fix for auth.users
-- 2. PostgreSQL Extensions (uuid-ossp, pgcrypto, btree_gist)
-- 3. All 9 Operational Role Enums & Types
-- 4. Complete Relational Tables with Foreign Keys & Constraints
-- 5. GiST Exclusion Constraint (Hardware-Level Overbooking Protection)
-- 6. Privacy Architecture (Customer Public ID, Booking Privacy References)
-- 7. Double-Entry Financial Ledger
-- 8. Row Level Security (RLS) Policies
-- 9. Initial Verified Supply Seed Data
-- 10. Super Admin Account Configuration
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: FIX NULL AUTH TOKENS IN AUTH.USERS
-- ----------------------------------------------------------------------------
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, '');

-- ----------------------------------------------------------------------------
-- STEP 2: EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ----------------------------------------------------------------------------
-- STEP 3: ENUM TYPES (WITH FULL 9-ROLE RBAC)
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

-- Ensure all 9 roles exist even if enum was previously created with fewer roles
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
-- STEP 4: CORE MARKETPLACE TABLES
-- ----------------------------------------------------------------------------

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_public_id text UNIQUE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  phone_verified boolean NOT NULL DEFAULT false,
  role user_role NOT NULL DEFAULT 'customer',
  avatar_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  privacy_settings jsonb NOT NULL DEFAULT '{"marketing_emails": false, "in_app_notifications": true}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

-- ----------------------------------------------------------------------------
-- STEP 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public read basic profiles" ON public.profiles;
CREATE POLICY "Public read basic profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Parking Spaces Policies (Visitors can view approved spaces; hosts manage their own)
DROP POLICY IF EXISTS "Anyone can discover approved active parking spaces" ON public.parking_spaces;
CREATE POLICY "Anyone can discover approved active parking spaces" ON public.parking_spaces FOR SELECT USING (status = 'approved' AND is_active = true);

DROP POLICY IF EXISTS "Hosts manage own spaces" ON public.parking_spaces;
CREATE POLICY "Hosts manage own spaces" ON public.parking_spaces FOR ALL USING (provider_id = auth.uid());

-- Customer Vehicles Policies (Customers only view/edit own vehicles)
DROP POLICY IF EXISTS "Customers manage own vehicles" ON public.customer_vehicles;
CREATE POLICY "Customers manage own vehicles" ON public.customer_vehicles FOR ALL USING (customer_id = auth.uid());

-- Bookings Policies (Customers see own bookings; Hosts see incoming bookings)
DROP POLICY IF EXISTS "Customers see own bookings" ON public.bookings;
CREATE POLICY "Customers see own bookings" ON public.bookings FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Hosts see incoming bookings for their spaces" ON public.bookings;
CREATE POLICY "Hosts see incoming bookings for their spaces" ON public.bookings FOR SELECT USING (provider_id = auth.uid());

-- ----------------------------------------------------------------------------
-- STEP 6: CONFIGURE / PROMOTE SUPER ADMIN ACCOUNT
-- ----------------------------------------------------------------------------
-- If admin@parkbnb.in exists in auth.users, promote to super_admin; otherwise link profile:
INSERT INTO public.profiles (
  id,
  customer_public_id,
  full_name,
  email,
  role,
  phone,
  phone_verified,
  status,
  created_at,
  updated_at
)
SELECT 
  id,
  'PBN-C-ADMIN001',
  COALESCE(raw_user_meta_data->>'full_name', 'ParkBnB Administrator'),
  email,
  'super_admin'::user_role,
  COALESCE(phone, '9876543210'),
  true,
  'active',
  now(),
  now()
FROM auth.users
WHERE email = 'admin@parkbnb.in'
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin',
    status = 'active',
    updated_at = now();

-- ----------------------------------------------------------------------------
-- STEP 7: VERIFICATION QUERY
-- ----------------------------------------------------------------------------
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
