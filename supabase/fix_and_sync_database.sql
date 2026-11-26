-- ============================================================================
-- PARKBNB: SUPABASE PRODUCTION DATABASE SYNC & MIGRATION SCRIPT
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vfgagycdlphosxkjfxuv/sql
-- ============================================================================
-- Safe, non-destructive, and strictly idempotent (can be run multiple times).

-- 1. Profiles Table: Add missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS customer_public_id text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_settings jsonb NOT NULL DEFAULT '{"marketing_emails": false, "in_app_notifications": true}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"sms": true, "whatsapp": true, "email": false}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_vehicle_id uuid;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS risk_score integer DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- 2. Bookings Table: Add missing privacy & operational columns
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_customer_reference text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_display_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS owner_public_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS space_public_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gate_status text NOT NULL DEFAULT 'booked' CHECK (gate_status IN ('booked', 'checked_in', 'checked_out', 'overstay'));

-- 3. Parking Spaces & Provider Profiles: Add Universal Forensic Identifiers & Vehicle Types
ALTER TABLE public.provider_profiles ADD COLUMN IF NOT EXISTS owner_public_id text UNIQUE;
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS space_public_id text UNIQUE;
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS owner_public_id text;
ALTER TABLE public.parking_spaces ADD COLUMN IF NOT EXISTS vehicle_types text[] DEFAULT '{"car_sedan","car_suv","car_hatchback"}';

-- 4. Financial Ledger Table: Ensure table exists
CREATE TABLE IF NOT EXISTS public.financial_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  entry_type text NOT NULL,
  debit_account text NOT NULL,
  credit_account text NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  description text NOT NULL,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Customer Data Access Logs (DPDP Act Compliance)
CREATE TABLE IF NOT EXISTS public.customer_data_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  operator_email text NOT NULL,
  customer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_reason text NOT NULL,
  accessed_fields text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Enable RLS and Service Role Bypass
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_data_access_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read on approved parking spaces and properties
DO $$ BEGIN
  CREATE POLICY "Public read approved spaces" ON public.parking_spaces
    FOR SELECT USING (status = 'approved' AND is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read properties" ON public.properties
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read space photos" ON public.parking_space_photos
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 7. Landmark and Google Maps Navigation Links for Properties and Parking Spaces
ALTER TABLE properties ADD COLUMN IF NOT EXISTS landmark text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS google_maps_link text;
ALTER TABLE parking_spaces ADD COLUMN IF NOT EXISTS google_maps_link text;
ALTER TABLE parking_spaces ADD COLUMN IF NOT EXISTS landmark text;

-- 8. Ensure Parking Photos Storage Bucket Exists (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('parking-photos', 'parking-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
  CREATE POLICY "Public parking photos viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'parking-photos');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 9. Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';
