-- ============================================================================
-- 20261123000001_privacy_and_rbac.sql
-- ParkBnB Production Privacy Architecture, Full 9-Role RBAC & Audit Schema
-- ============================================================================

-- 1. Expand User Roles to support all 9 operational tiers
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'visitor';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'support_agent';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'operations_manager';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'finance_manager';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'verification_manager';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Add Customer Privacy Columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS customer_public_id text UNIQUE,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
ADD COLUMN IF NOT EXISTS privacy_settings jsonb NOT NULL DEFAULT '{"marketing_emails": false, "in_app_notifications": true}'::jsonb;

-- 3. Add Privacy References to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS booking_customer_reference text UNIQUE,
ADD COLUMN IF NOT EXISTS customer_display_name text;

-- 4. Centralized Permissions Catalog Table
CREATE TABLE IF NOT EXISTS public.permissions (
  code text PRIMARY KEY,
  description text NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Role-Permission Junction Table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role user_role NOT NULL,
  permission_code text NOT NULL REFERENCES public.permissions(code) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role, permission_code)
);

-- 6. Customer Data Access Audit Log (Privileged Staff Lookups)
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

-- 7. Customer Consents & DPDP Compliance
CREATE TABLE IF NOT EXISTS public.customer_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Helper Functions: Cryptographic Identifier Generators
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

-- 9. Mask Customer Display Name Helper: "Rahul Sharma" -> "Rahul S."
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

-- 10. Auto-assign Customer ID on Profile Insert Trigger
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

-- 11. Auto-assign Booking Privacy Reference on Booking Insert Trigger
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

-- 12. Seed Master Permissions Catalog
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

-- 13. Seed Role-Permissions Matrix
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

-- 14. Helper Security Definer: Check if user has permission
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

-- 15. Helper Security Definer: Privileged Audited Customer Lookup
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
  -- 1. Authorization check
  SELECT role INTO v_staff_role FROM public.profiles WHERE id = v_staff_id;
  IF v_staff_role NOT IN ('admin', 'super_admin', 'support_agent', 'operations_manager') THEN
    RAISE EXCEPTION 'FORBIDDEN: User does not possess customer lookup privileges.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'AUDIT_REQUIRED: A legitimate customer support reason is mandatory.';
  END IF;

  -- 2. Find customer by Customer Public ID, Email, Phone, or Booking Reference
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

  -- 3. Record Audit Event
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

  -- 4. Return the authorized customer record
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

-- 16. Strict RLS Policies for New Entities
ALTER TABLE public.customer_data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Permissions and Role Permissions: Readable by authenticated staff
CREATE POLICY "Permissions viewable" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Role permissions viewable" ON public.role_permissions FOR SELECT USING (true);

-- Customer Data Access Logs: Viewable only by staff who created the log or super_admin
CREATE POLICY "Audit logs staff read" ON public.customer_data_access_logs FOR SELECT USING (
  staff_id = auth.uid() OR public.is_admin()
);

-- Customer Consents: Manageable by user
CREATE POLICY "Consents manage own" ON public.customer_consents FOR ALL USING (
  customer_id = auth.uid() OR public.is_admin()
);
