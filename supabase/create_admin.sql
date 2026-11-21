-- ============================================================================
-- SQL Script: Create an Admin User with Email & Password Directly
-- Run this in your Supabase Dashboard > SQL Editor:
-- https://supabase.com/dashboard/project/vfgagycdlphosxkjfxuv/sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  -- >>> SET YOUR DESIRED ADMIN CREDENTIALS HERE <<<
  v_email text := 'admin@parkbnb.in';
  v_password text := 'Admin@12345';
  v_full_name text := 'ParkBnB Admin';
  v_phone text := '9876543210';

  v_user_id uuid;
BEGIN
  -- 1. Check if user already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    -- Generate fresh user UUID
    v_user_id := gen_random_uuid();

    -- Create user in Supabase auth.users with encrypted bcrypt password
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    )
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('full_name', v_full_name, 'role', 'admin'),
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  ELSE
    -- If user already exists, update their password & confirm email
    UPDATE auth.users
    SET encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- 2. Ensure public.profiles table has the user with role = 'admin'
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    phone_verified,
    role,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_full_name,
    v_email,
    v_phone,
    true,
    'admin',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      updated_at = now();

  RAISE NOTICE 'SUCCESS: Admin user configured. Email: %, Password: %', v_email, v_password;
END $$;

-- Verify admin account created:
SELECT id, full_name, email, role, created_at 
FROM public.profiles 
WHERE email = 'admin@parkbnb.in';
