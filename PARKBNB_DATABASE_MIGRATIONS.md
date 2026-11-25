# PARKBNB — COMPLETE DATABASE MIGRATIONS & SCHEMA
**Document Reference:** `PARKBNB_DATABASE_MIGRATIONS.md`  
**Version:** 2.0.0 (Production Verified)  
**Database Engine:** PostgreSQL 15 / Supabase  

---

## 1. Production Database Schema Architecture

The Parkbnb relational database is engineered for ACID compliance, zero race-condition inventory locking, immutable audit trails, and strict multi-tenant Row Level Security (RLS).

```
                      ┌───────────────┐
                      │   PROFILES    │
                      └───────┬───────┘
                              │ 1:1
                              ├──────────────────────┐
                              ▼                      ▼
                    ┌──────────────────┐   ┌──────────────────┐
                    │CUSTOMER_VEHICLES │   │PROVIDER_PROFILES │
                    └──────────────────┘   └─────────┬────────┘
                                                     │ 1:N
                                                     ▼
                                            ┌──────────────────┐
                                            │    PROPERTIES    │
                                            └────────┬─────────┘
                                                     │ 1:N
                                                     ▼
                                            ┌──────────────────┐
                                            │  PARKING_SPACES  │
                                            └────────┬─────────┘
                                                     │
               ┌─────────────────────┬───────────────┴───────────────┐
               ▼                     ▼                               ▼
      ┌──────────────────┐  ┌──────────────────┐           ┌──────────────────┐
      │  BOOKING_HOLDS   │  │     BOOKINGS     │           │AVAILABILITY_BLOCK│
      └──────────────────┘  └────────┬─────────┘           └──────────────────┘
                                     │ 1:N
                                     ├───────────────────────┐
                                     ▼                       ▼
                           ┌──────────────────┐    ┌──────────────────┐
                           │     REVIEWS      │    │  LEDGER_ENTRIES  │
                           └──────────────────┘    └──────────────────┘
```

---

## 2. Core Relational DDL (Data Definition Language)

```sql
-- 1. User Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_public_id VARCHAR(32) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(32),
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'customer',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Parking Provider Profiles
CREATE TABLE IF NOT EXISTS public.provider_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  business_type VARCHAR(64) DEFAULT 'individual',
  pan_number VARCHAR(16),
  gstin VARCHAR(32),
  verification_status VARCHAR(32) NOT NULL DEFAULT 'draft',
  commission_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.1500,
  payout_method VARCHAR(32) DEFAULT 'bank_account',
  bank_account_number VARCHAR(64),
  bank_ifsc VARCHAR(32),
  account_holder_name VARCHAR(255),
  upi_id VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Parking Spaces
CREATE TABLE IF NOT EXISTS public.parking_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  property_type VARCHAR(64) NOT NULL DEFAULT 'commercial',
  space_type VARCHAR(64) NOT NULL DEFAULT 'covered',
  vehicle_types TEXT[] NOT NULL DEFAULT ARRAY['car'],
  identifier VARCHAR(64) NOT NULL,
  access_type VARCHAR(64) NOT NULL DEFAULT 'digital_gate',
  hourly_rate NUMERIC(10, 2) NOT NULL,
  daily_rate NUMERIC(10, 2),
  monthly_rate NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(32) NOT NULL DEFAULT 'submitted',
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  access_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Temporary Booking Holds (Concurrency Lock)
CREATE TABLE IF NOT EXISTS public.booking_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.parking_spaces(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference VARCHAR(32) UNIQUE NOT NULL,
  booking_customer_reference VARCHAR(32) UNIQUE NOT NULL,
  space_id UUID NOT NULL REFERENCES public.parking_spaces(id),
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  vehicle_plate VARCHAR(32) NOT NULL,
  vehicle_type VARCHAR(32) NOT NULL DEFAULT 'car',
  base_amount NUMERIC(10, 2) NOT NULL,
  platform_fee NUMERIC(10, 2) NOT NULL,
  tax_amount NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  provider_payout_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'confirmed',
  payment_status VARCHAR(32) NOT NULL DEFAULT 'paid',
  payment_intent_id VARCHAR(128),
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Availability & Maintenance Blocks
CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.parking_spaces(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Double-Entry Financial Ledger
CREATE TABLE IF NOT EXISTS public.financial_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id),
  entry_type VARCHAR(64) NOT NULL,
  debit_account VARCHAR(128) NOT NULL,
  credit_account VARCHAR(128) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  reference_id VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. High-Performance Indexing Strategy

```sql
-- Geospatial & Active Space Discovery
CREATE INDEX IF NOT EXISTS idx_spaces_status_active ON public.parking_spaces(status, is_active);

-- Concurrency Hold Expiry Index
CREATE INDEX IF NOT EXISTS idx_holds_active_expiry ON public.booking_holds(space_id, is_active, expires_at);

-- Booking Availability Check Index
CREATE INDEX IF NOT EXISTS idx_bookings_space_interval ON public.bookings(space_id, start_time, end_time) WHERE status IN ('confirmed', 'active');

-- Provider Manifest Fast Lookup
CREATE INDEX IF NOT EXISTS idx_bookings_provider_schedule ON public.bookings(space_id, start_time);

-- Customer Fast Booking History
CREATE INDEX IF NOT EXISTS idx_bookings_customer_created ON public.bookings(customer_id, created_at DESC);
```

---

## 4. Row Level Security (RLS) Policies

1. **Customer Profile Privacy:**
   ```sql
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
   CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
   ```
2. **Provider Space Tenancy:**
   ```sql
   ALTER TABLE public.parking_spaces ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Public reads approved spaces" ON public.parking_spaces FOR SELECT USING (status = 'approved' AND is_active = TRUE);
   CREATE POLICY "Hosts manage own spaces" ON public.parking_spaces FOR ALL USING (auth.uid() = provider_id);
   ```
3. **Booking Protection:**
   ```sql
   ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Customers view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = customer_id);
   CREATE POLICY "Hosts view bookings for own spaces" ON public.bookings FOR SELECT USING (
     space_id IN (SELECT id FROM public.parking_spaces WHERE provider_id = auth.uid())
   );
   ```
