-- ============================================================================
-- 20261123000001_customer_phone_auth_and_memory.sql
-- Frictionless Booking, Phone OTP Verification & Smart Customer Memory Schema
-- ============================================================================

-- 1. Profiles Table Updates for Optional Email & Phone First Auth
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"sms": true, "whatsapp": true, "email": false}'::jsonb,
ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS risk_score integer DEFAULT 0;

-- Prevent duplicate accounts for the same verified mobile number
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_verified_phone 
ON profiles (phone) 
WHERE phone IS NOT NULL AND phone_verified = true;

-- 2. Customer Vehicles - Add preferred vehicle linkage
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_vehicle_id uuid REFERENCES customer_vehicles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customer_vehicles_customer_id 
ON customer_vehicles (customer_id);

-- 3. Server-side OTP Verification Tracking Table
CREATE TABLE IF NOT EXISTS otp_verifications (
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
ON otp_verifications (phone, created_at DESC);

-- 4. Cryptographic Persistent Customer Sessions Table
CREATE TABLE IF NOT EXISTS customer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token_hash text NOT NULL UNIQUE,
  device_fingerprint text,
  ip_address text,
  is_revoked boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_sessions_token_hash 
ON customer_sessions (session_token_hash) 
WHERE is_revoked = false;

CREATE INDEX IF NOT EXISTS idx_customer_sessions_customer_id 
ON customer_sessions (customer_id);

-- 5. Row Level Security for New Tables
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_sessions ENABLE ROW LEVEL SECURITY;

-- OTP verifications are strictly server-side / security definer operations
CREATE POLICY "OTP server-side only" ON otp_verifications 
FOR ALL USING (false);

-- Customer sessions: Customer can view and revoke their own active sessions
CREATE POLICY "Sessions customer read" ON customer_sessions 
FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Sessions customer revoke" ON customer_sessions 
FOR UPDATE USING (customer_id = auth.uid()) 
WITH CHECK (customer_id = auth.uid());

-- 6. Helper Function: Clean expired OTP records and holds
CREATE OR REPLACE FUNCTION public.cleanup_expired_holds_and_otps()
RETURNS void AS $$
BEGIN
  -- Mark expired holds inactive
  UPDATE booking_holds 
  SET is_active = false 
  WHERE is_active = true AND expires_at < now();

  -- Clean old OTP verification attempts (> 24 hours old)
  DELETE FROM otp_verifications 
  WHERE created_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
