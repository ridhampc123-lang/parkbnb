-- ============================================================================
-- SQL Script: Fix Supabase Auth "Database error querying schema" & Configure Admin
-- Run this in your Supabase Dashboard > SQL Editor:
-- https://supabase.com/dashboard/project/vfgagycdlphosxkjfxuv/sql
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

-- Step 2: Ensure public.profiles table exists with role enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'provider', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  phone_verified boolean NOT NULL DEFAULT false,
  role user_role NOT NULL DEFAULT 'customer',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 3: Link or promote user in public.profiles to 'admin'
-- If user already exists in auth.users (e.g. admin@parkbnb.in or your email), set them to admin:
INSERT INTO public.profiles (
  id,
  full_name,
  email,
  role,
  phone_verified,
  created_at,
  updated_at
)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', 'ParkBnB Admin'),
  email,
  'admin'::user_role,
  true,
  now(),
  now()
FROM auth.users
WHERE email = 'admin@parkbnb.in'
ON CONFLICT (id) DO UPDATE
SET role = 'admin',
    updated_at = now();

-- Step 4: Verify the admin profile
SELECT id, full_name, email, role, created_at 
FROM public.profiles 
WHERE role IN ('admin', 'super_admin');
