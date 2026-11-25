-- ============================================================================
-- SQL Script: Fix Supabase Auth "Database error querying schema" & Configure Admin
-- Run this in your Supabase Dashboard > SQL Editor:
-- https://supabase.com/dashboard/project/vfgagycdlphosxkjfxuv/sql
-- ============================================================================
-- NOTE: For complete table setup (spaces, bookings, ledger, etc.), run:
-- supabase/complete_production_database_setup.sql
-- ============================================================================

-- Step 1: Fix any NULL token columns in auth.users (fixes "Database error querying schema")
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, '');

-- Step 2: Ensure user_role enum exists with all 9 operational roles
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

-- Step 3: Ensure public.profiles table exists with privacy fields
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

-- Step 4: Link or promote user in public.profiles to 'super_admin'
INSERT INTO public.profiles (
  id,
  customer_public_id,
  full_name,
  email,
  role,
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
  true,
  'active',
  now(),
  now()
FROM auth.users
WHERE email = 'admin@parkbnb.in'
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin',
    customer_public_id = COALESCE(public.profiles.customer_public_id, 'PBN-C-ADMIN001'),
    status = 'active',
    updated_at = now();

-- Step 5: Verify the admin profile
SELECT id, customer_public_id, full_name, email, role, status, created_at 
FROM public.profiles 
WHERE role IN ('admin', 'super_admin');
