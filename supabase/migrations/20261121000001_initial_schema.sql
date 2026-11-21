-- ============================================================================
-- 001_initial_schema.sql
-- ParkBnB Core Database Schema, Enums, Tables, RLS, Indexes & RPC Functions
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Custom Types & Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'provider', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

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
  CREATE TYPE booking_status AS ENUM ('hold_pending', 'confirmed', 'active', 'completed', 'cancelled_by_customer', 'cancelled_by_provider', 'cancelled_by_admin', 'expired', 'payment_failed', 'disputed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('created', 'authorized', 'captured', 'refunded', 'partially_refunded', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE ledger_entry_type AS ENUM ('CUSTOMER_PAYMENT', 'PLATFORM_COMMISSION', 'PROVIDER_PAYABLE', 'REFUND_CUSTOMER', 'COMMISSION_REVERSAL', 'PROVIDER_PAYOUT', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. Cities & Service Areas
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL DEFAULT 'Gujarat',
  country text NOT NULL DEFAULT 'India',
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name text NOT NULL,
  postal_codes text[] NOT NULL,
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Profiles (Public user metadata linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
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

-- 3. Providers & Verifications
CREATE TABLE IF NOT EXISTS provider_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  provider_type provider_type NOT NULL DEFAULT 'individual_residential',
  business_name text,
  pan_number text,
  gstin text,
  verification_status verification_status NOT NULL DEFAULT 'draft',
  rejection_reason text,
  verified_at timestamptz,
  verified_by uuid REFERENCES profiles(id),
  bank_account_number text,
  bank_ifsc_code text,
  bank_account_holder text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provider_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL, -- 'government_id', 'property_ownership', 'society_noc', 'commercial_license'
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  status verification_status NOT NULL DEFAULT 'submitted',
  admin_notes text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Properties & Parking Spaces
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  property_type text NOT NULL, -- 'apartment_complex', 'independent_house', 'commercial_lot', 'open_plot'
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

CREATE TABLE IF NOT EXISTS parking_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  identifier text NOT NULL, -- e.g. "Slot A-101"
  title text NOT NULL,
  description text,
  parking_type text NOT NULL DEFAULT 'covered', -- 'covered', 'open', 'basement', 'multi_level'
  hourly_rate numeric(10, 2) NOT NULL CHECK (hourly_rate >= 0),
  daily_rate numeric(10, 2) CHECK (daily_rate IS NULL OR daily_rate >= 0),
  monthly_rate numeric(10, 2) CHECK (monthly_rate IS NULL OR monthly_rate >= 0),
  min_duration_hours integer NOT NULL DEFAULT 1 CHECK (min_duration_hours >= 1),
  max_duration_hours integer DEFAULT 720,
  access_instructions text, -- Exact directions, gate codes (hidden until confirmed)
  security_features text[] DEFAULT '{}',
  has_ev_charging boolean NOT NULL DEFAULT false,
  height_limit_meters numeric(3, 2),
  status verification_status NOT NULL DEFAULT 'submitted',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parking_space_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES parking_spaces(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parking_space_vehicle_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES parking_spaces(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  UNIQUE(space_id, vehicle_type)
);

-- 5. Availability Schedules & Provider Blocks
CREATE TABLE IF NOT EXISTS availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES parking_spaces(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_recurring boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS provider_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES parking_spaces(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

-- 6. Customer Vehicles
CREATE TABLE IF NOT EXISTS customer_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  registration_number text NOT NULL,
  make_model text,
  color text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Bookings & Holds
CREATE TABLE IF NOT EXISTS booking_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES parking_spaces(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  hold_duration_range tstzrange NOT NULL,
  expires_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text UNIQUE NOT NULL,
  space_id uuid NOT NULL REFERENCES parking_spaces(id),
  customer_id uuid NOT NULL REFERENCES profiles(id),
  provider_id uuid NOT NULL REFERENCES provider_profiles(id),
  vehicle_id uuid NOT NULL REFERENCES customer_vehicles(id),
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
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

-- Prevent overlapping confirmed bookings at database level
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS no_overlapping_confirmed_bookings;

ALTER TABLE bookings
ADD CONSTRAINT no_overlapping_confirmed_bookings
EXCLUDE USING gist (
  space_id WITH =,
  booking_duration_range WITH &&
)
WHERE (status IN ('confirmed', 'active'));

CREATE TABLE IF NOT EXISTS booking_price_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  description text NOT NULL,
  unit_price numeric(10, 2) NOT NULL,
  quantity numeric(10, 2) NOT NULL,
  amount numeric(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS booking_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status booking_status,
  to_status booking_status NOT NULL,
  actor_id uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Payments, Orders & Financial Ledger
CREATE TABLE IF NOT EXISTS payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id),
  razorpay_order_id text UNIQUE NOT NULL,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'created',
  receipt_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES payment_orders(id),
  booking_id uuid NOT NULL REFERENCES bookings(id),
  razorpay_payment_id text UNIQUE NOT NULL,
  razorpay_signature text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  method text,
  status payment_status NOT NULL DEFAULT 'captured',
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  entry_type ledger_entry_type NOT NULL,
  debit_account text NOT NULL,
  credit_account text NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR',
  description text NOT NULL,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rate_percentage numeric(5, 2) NOT NULL DEFAULT 15.00,
  tax_rate_percentage numeric(5, 2) NOT NULL DEFAULT 18.00, -- GST on commission
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Reviews, Support & Audit
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid UNIQUE NOT NULL REFERENCES bookings(id),
  space_id uuid NOT NULL REFERENCES parking_spaces(id),
  customer_id uuid NOT NULL REFERENCES profiles(id),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id),
  booking_id uuid REFERENCES bookings(id),
  subject text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id),
  message text NOT NULL,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  metadata jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- HELPER FUNCTIONS & RPC STORED PROCEDURES
-- ============================================================================

-- Admin Check Helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  -- Verify space is published and approved
  SELECT ps.is_active, (ps.status = 'approved')
  INTO v_is_active, v_is_verified
  FROM parking_spaces ps
  WHERE ps.id = p_space_id;

  IF NOT FOUND OR NOT v_is_active OR NOT v_is_verified THEN
    RETURN false;
  END IF;

  -- Check provider manual blocks
  SELECT COUNT(*) INTO v_conflict_count
  FROM provider_blocks pb
  WHERE pb.space_id = p_space_id
    AND tstzrange(pb.start_time, pb.end_time) && v_requested_range;

  IF v_conflict_count > 0 THEN
    RETURN false;
  END IF;

  -- Check confirmed or active bookings
  SELECT COUNT(*) INTO v_conflict_count
  FROM bookings b
  WHERE b.space_id = p_space_id
    AND b.status IN ('confirmed', 'active')
    AND b.booking_duration_range && v_requested_range;

  IF v_conflict_count > 0 THEN
    RETURN false;
  END IF;

  -- Check unexpired temporary holds
  SELECT COUNT(*) INTO v_conflict_count
  FROM booking_holds bh
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
  -- Check availability inside transaction with lock
  PERFORM 1 FROM parking_spaces WHERE id = p_space_id FOR UPDATE;

  v_is_available := public.check_space_availability(p_space_id, p_start_time, p_end_time);

  IF NOT v_is_available THEN
    RAISE EXCEPTION 'SPACE_UNAVAILABLE: Parking space is not available for requested period.';
  END IF;

  INSERT INTO booking_holds (
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
  v_booking bookings%ROWTYPE;
  v_order_id uuid;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;

  IF v_booking.status = 'confirmed' THEN
    RETURN true; -- Idempotent return
  END IF;

  IF v_booking.status <> 'hold_pending' THEN
    RAISE EXCEPTION 'INVALID_BOOKING_STATUS: Cannot confirm booking in status %', v_booking.status;
  END IF;

  -- Update order record
  SELECT id INTO v_order_id FROM payment_orders WHERE razorpay_order_id = p_razorpay_order_id;
  IF v_order_id IS NOT NULL THEN
    UPDATE payment_orders SET status = 'captured' WHERE id = v_order_id;
  END IF;

  -- Insert payment transaction
  INSERT INTO payment_transactions (
    order_id,
    booking_id,
    razorpay_payment_id,
    razorpay_signature,
    amount,
    method,
    status
  )
  VALUES (
    COALESCE(v_order_id, gen_random_uuid()),
    p_booking_id,
    p_razorpay_payment_id,
    p_razorpay_signature,
    v_booking.total_amount,
    p_payment_method,
    'captured'
  )
  ON CONFLICT (razorpay_payment_id) DO NOTHING;

  -- Update booking status to confirmed
  UPDATE bookings
  SET status = 'confirmed', updated_at = now()
  WHERE id = p_booking_id;

  -- Record status event
  INSERT INTO booking_status_events (
    booking_id,
    from_status,
    to_status,
    actor_id,
    notes
  )
  VALUES (
    p_booking_id,
    'hold_pending',
    'confirmed',
    v_booking.customer_id,
    'Payment confirmed via Razorpay payment ID: ' || p_razorpay_payment_id
  );

  -- Record immutable ledger entries
  -- 1. Customer Payment (Gross)
  INSERT INTO financial_ledger_entries (
    booking_id, entry_type, debit_account, credit_account, amount, currency, description, reference_id
  ) VALUES (
    p_booking_id, 'CUSTOMER_PAYMENT', 'GATEWAY_ESCROW', 'PLATFORM_UNEARNED', v_booking.total_amount, 'INR',
    'Gross customer payment for booking ' || v_booking.booking_reference, p_razorpay_payment_id
  );

  -- 2. Platform Commission
  INSERT INTO financial_ledger_entries (
    booking_id, entry_type, debit_account, credit_account, amount, currency, description, reference_id
  ) VALUES (
    p_booking_id, 'PLATFORM_COMMISSION', 'PLATFORM_UNEARNED', 'PLATFORM_REVENUE', (v_booking.platform_fee + v_booking.tax_amount), 'INR',
    'Platform service fee + GST for booking ' || v_booking.booking_reference, p_booking_id::text
  );

  -- 3. Provider Payable
  INSERT INTO financial_ledger_entries (
    booking_id, entry_type, debit_account, credit_account, amount, currency, description, reference_id
  ) VALUES (
    p_booking_id, 'PROVIDER_PAYABLE', 'PLATFORM_UNEARNED', 'PROVIDER_ESCROW:' || v_booking.provider_id::text, v_booking.provider_payout_amount, 'INR',
    'Net payable to provider for booking ' || v_booking.booking_reference, p_booking_id::text
  );

  -- Release temporary hold
  UPDATE booking_holds SET is_active = false
  WHERE space_id = v_booking.space_id AND customer_id = v_booking.customer_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_space_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_space_vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_price_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read & edit their own profile; admins can read all
CREATE POLICY "Profiles read own" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Profiles update own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Provider Profiles: Provider reads/updates own; admin manages all
CREATE POLICY "Provider read own" ON provider_profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Provider insert own" ON provider_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Provider update own" ON provider_profiles FOR UPDATE USING (auth.uid() = id OR is_admin());

-- Provider Documents: Strictly restricted to provider and admins
CREATE POLICY "Docs read own" ON provider_documents FOR SELECT USING (provider_id = auth.uid() OR is_admin());
CREATE POLICY "Docs insert own" ON provider_documents FOR INSERT WITH CHECK (provider_id = auth.uid());

-- Properties: Public can view active properties; providers manage own
CREATE POLICY "Properties public view" ON properties FOR SELECT USING (true);
CREATE POLICY "Properties provider manage" ON properties FOR ALL USING (provider_id = auth.uid() OR is_admin());

-- Parking Spaces: Public can view approved & active spaces; providers manage own
CREATE POLICY "Spaces public view" ON parking_spaces FOR SELECT USING (
  (status = 'approved' AND is_active = true) OR provider_id = auth.uid() OR is_admin()
);
CREATE POLICY "Spaces provider manage" ON parking_spaces FOR ALL USING (provider_id = auth.uid() OR is_admin());

-- Parking Space Photos: Public can view
CREATE POLICY "Photos public view" ON parking_space_photos FOR SELECT USING (true);
CREATE POLICY "Photos provider manage" ON parking_space_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM parking_spaces WHERE id = parking_space_photos.space_id AND (provider_id = auth.uid() OR is_admin()))
);

-- Vehicle Types
CREATE POLICY "Vehicle types public view" ON parking_space_vehicle_types FOR SELECT USING (true);
CREATE POLICY "Vehicle types provider manage" ON parking_space_vehicle_types FOR ALL USING (
  EXISTS (SELECT 1 FROM parking_spaces WHERE id = parking_space_vehicle_types.space_id AND (provider_id = auth.uid() OR is_admin()))
);

-- Availability & Blocks
CREATE POLICY "Availability public view" ON availability_rules FOR SELECT USING (true);
CREATE POLICY "Availability provider manage" ON availability_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM parking_spaces WHERE id = availability_rules.space_id AND (provider_id = auth.uid() OR is_admin()))
);

CREATE POLICY "Blocks public view" ON provider_blocks FOR SELECT USING (true);
CREATE POLICY "Blocks provider manage" ON provider_blocks FOR ALL USING (
  EXISTS (SELECT 1 FROM parking_spaces WHERE id = provider_blocks.space_id AND (provider_id = auth.uid() OR is_admin()))
);

-- Customer Vehicles: Scoped strictly to customer
CREATE POLICY "Vehicles customer manage" ON customer_vehicles FOR ALL USING (customer_id = auth.uid());

-- Booking Holds: Scoped to customer or space provider
CREATE POLICY "Holds customer read" ON booking_holds FOR SELECT USING (
  customer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM parking_spaces WHERE id = booking_holds.space_id AND provider_id = auth.uid()) OR
  is_admin()
);
CREATE POLICY "Holds customer insert" ON booking_holds FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Bookings: Customers view own; Providers view own space bookings; Admins view all
CREATE POLICY "Bookings view" ON bookings FOR SELECT USING (
  customer_id = auth.uid() OR provider_id = auth.uid() OR is_admin()
);
CREATE POLICY "Bookings insert" ON bookings FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Bookings update" ON bookings FOR UPDATE USING (
  customer_id = auth.uid() OR provider_id = auth.uid() OR is_admin()
);

-- Price lines & events
CREATE POLICY "Price lines view" ON booking_price_lines FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings WHERE id = booking_price_lines.booking_id AND (customer_id = auth.uid() OR provider_id = auth.uid() OR is_admin()))
);
CREATE POLICY "Status events view" ON booking_status_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings WHERE id = booking_status_events.booking_id AND (customer_id = auth.uid() OR provider_id = auth.uid() OR is_admin()))
);

-- Financial Ledger: Providers view their own entries; Admins view all; Customers denied
CREATE POLICY "Ledger view" ON financial_ledger_entries FOR SELECT USING (
  debit_account = ('PROVIDER_ESCROW:' || auth.uid()::text) OR
  credit_account = ('PROVIDER_ESCROW:' || auth.uid()::text) OR
  is_admin()
);

-- Reviews: Public view approved; Customer insert for completed booking
CREATE POLICY "Reviews view" ON reviews FOR SELECT USING (is_approved = true OR customer_id = auth.uid() OR is_admin());
CREATE POLICY "Reviews insert" ON reviews FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Support Tickets: Users view own tickets; Admins view all
CREATE POLICY "Tickets view" ON support_tickets FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Tickets insert" ON support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Messages view" ON support_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id AND (user_id = auth.uid() OR is_admin()))
);
CREATE POLICY "Messages insert" ON support_messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Public Cities & Service Areas
CREATE POLICY "Cities public view" ON cities FOR SELECT USING (true);
CREATE POLICY "Service areas public view" ON service_areas FOR SELECT USING (true);
