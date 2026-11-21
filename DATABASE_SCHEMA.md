# DATABASE SCHEMA: PARKING MARKETPLACE (PARKBNB)

## 1. Overview & Extensions

Database: **PostgreSQL 15+** on Supabase.
Required Extensions:
- `uuid-ossp` or `pgcrypto` (UUID v4 generation)
- `postgis` (Spatial indexing, geospatial distance queries)
- `btree_gist` (Enables GIST exclusion constraints combining UUID and `tstzrange`)

---

## 2. Enumerations

```sql
CREATE TYPE user_role AS ENUM ('customer', 'provider', 'admin', 'super_admin');
CREATE TYPE provider_type AS ENUM ('individual_residential', 'commercial_operator', 'authorized_agent');
CREATE TYPE vehicle_type AS ENUM ('car_sedan', 'car_suv', 'car_hatchback', 'two_wheeler', 'ev_four_wheeler', 'ev_two_wheeler');
CREATE TYPE verification_status AS ENUM ('draft', 'submitted', 'under_review', 'more_info_needed', 'approved', 'rejected', 'suspended');
CREATE TYPE booking_status AS ENUM ('hold_pending', 'confirmed', 'active', 'completed', 'cancelled_by_customer', 'cancelled_by_provider', 'cancelled_by_admin', 'expired', 'payment_failed', 'disputed');
CREATE TYPE payment_status AS ENUM ('created', 'authorized', 'captured', 'refunded', 'partially_refunded', 'failed');
CREATE TYPE ledger_entry_type AS ENUM ('CUSTOMER_PAYMENT', 'PLATFORM_COMMISSION', 'PROVIDER_PAYABLE', 'REFUND_CUSTOMER', 'COMMISSION_REVERSAL', 'PROVIDER_PAYOUT', 'ADJUSTMENT');
CREATE TYPE dispute_status AS ENUM ('open', 'under_investigation', 'resolved_refunded', 'resolved_rejected', 'closed');
```

---

## 3. Core Tables Specification

### 3.1 Identity & Profiles
- **`profiles`**
  - `id` (uuid, PK, references `auth.users(id)` ON DELETE CASCADE)
  - `full_name` (text, not null)
  - `email` (text, unique, not null)
  - `phone` (text)
  - `phone_verified` (boolean, default false)
  - `role` (user_role, default 'customer', not null)
  - `avatar_url` (text)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

### 3.2 Providers & Properties
- **`provider_profiles`**
  - `id` (uuid, PK, references `profiles(id)` ON DELETE CASCADE)
  - `provider_type` (provider_type, not null)
  - `business_name` (text)
  - `pan_number` (text) -- Encrypted or masked
  - `gstin` (text)
  - `verification_status` (verification_status, default 'draft', not null)
  - `rejection_reason` (text)
  - `verified_at` (timestamptz)
  - `verified_by` (uuid, references `profiles(id)`)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- **`provider_documents`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `provider_id` (uuid, references `provider_profiles(id)` ON DELETE CASCADE, not null)
  - `document_type` (text, not null) -- 'government_id', 'property_deed', 'society_noc', 'electricity_bill'
  - `storage_path` (text, not null) -- Path in private bucket
  - `file_name` (text, not null)
  - `status` (verification_status, default 'submitted', not null)
  - `uploaded_at` (timestamptz, default now())

- **`properties`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `provider_id` (uuid, references `provider_profiles(id)` ON DELETE CASCADE, not null)
  - `title` (text, not null)
  - `property_type` (text, not null) -- 'apartment_complex', 'independent_house', 'commercial_mall', 'private_plot'
  - `address_line1` (text, not null)
  - `address_line2` (text)
  - `landmark` (text)
  - `city` (text, default 'Ahmedabad', not null)
  - `postal_code` (text, not null)
  - `latitude` (numeric(10, 7), not null)
  - `longitude` (numeric(10, 7), not null)
  - `location` (geometry(Point, 4326)) -- Generated from lat/long
  - `created_at` (timestamptz, default now())

- **`parking_spaces`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `property_id` (uuid, references `properties(id)` ON DELETE CASCADE, not null)
  - `provider_id` (uuid, references `provider_profiles(id)` ON DELETE CASCADE, not null)
  - `identifier` (text, not null) -- e.g. "Slot B-12"
  - `title` (text, not null)
  - `description` (text)
  - `parking_type` (text, not null) -- 'covered', 'open', 'basement', 'multi_level'
  - `hourly_rate` (numeric(10, 2), not null)
  - `daily_rate` (numeric(10, 2))
  - `monthly_rate` (numeric(10, 2))
  - `min_duration_hours` (integer, default 1, not null)
  - `max_duration_hours` (integer, default 720)
  - `access_instructions` (text) -- Only visible to confirmed customer
  - `security_features` (text[]) -- e.g. ['cctv', 'gated_security', 'lighting']
  - `has_ev_charging` (boolean, default false)
  - `height_limit_meters` (numeric(3, 2))
  - `status` (verification_status, default 'submitted', not null)
  - `is_active` (boolean, default true, not null)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- **`parking_space_photos`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `space_id` (uuid, references `parking_spaces(id)` ON DELETE CASCADE, not null)
  - `storage_path` (text, not null)
  - `is_primary` (boolean, default false)
  - `display_order` (integer, default 0)
  - `created_at` (timestamptz, default now())

- **`parking_space_vehicle_types`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `space_id` (uuid, references `parking_spaces(id)` ON DELETE CASCADE, not null)
  - `vehicle_type` (vehicle_type, not null)
  - UNIQUE(`space_id`, `vehicle_type`)

### 3.3 Availability & Holds
- **`availability_rules`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `space_id` (uuid, references `parking_spaces(id)` ON DELETE CASCADE, not null)
  - `day_of_week` (integer, not null) -- 0 = Sunday, 6 = Saturday
  - `start_time` (time, not null)
  - `end_time` (time, not null)
  - `is_recurring` (boolean, default true)

- **`provider_blocks`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `space_id` (uuid, references `parking_spaces(id)` ON DELETE CASCADE, not null)
  - `start_time` (timestamptz, not null)
  - `end_time` (timestamptz, not null)
  - `reason` (text)

- **`booking_holds`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `space_id` (uuid, references `parking_spaces(id)` ON DELETE CASCADE, not null)
  - `customer_id` (uuid, references `profiles(id)` ON DELETE CASCADE, not null)
  - `start_time` (timestamptz, not null)
  - `end_time` (timestamptz, not null)
  - `hold_duration_range` (tstzrange, not null)
  - `expires_at` (timestamptz, not null)
  - `is_active` (boolean, default true)

### 3.4 Customers & Bookings
- **`customer_vehicles`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `customer_id` (uuid, references `profiles(id)` ON DELETE CASCADE, not null)
  - `vehicle_type` (vehicle_type, not null)
  - `registration_number` (text, not null) -- e.g. "GJ 01 AB 1234"
  - `make_model` (text)
  - `color` (text)
  - `is_default` (boolean, default false)
  - `created_at` (timestamptz, default now())

- **`bookings`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `booking_reference` (text, unique, not null) -- e.g. "PKB-202611-ABCD"
  - `space_id` (uuid, references `parking_spaces(id)` not null)
  - `customer_id` (uuid, references `profiles(id)` not null)
  - `provider_id` (uuid, references `provider_profiles(id)` not null)
  - `vehicle_id` (uuid, references `customer_vehicles(id)` not null)
  - `start_time` (timestamptz, not null)
  - `end_time` (timestamptz, not null)
  - `booking_duration_range` (tstzrange, not null)
  - `status` (booking_status, default 'hold_pending', not null)
  - `total_hours` (numeric(6, 2), not null)
  - `base_amount` (numeric(10, 2), not null)
  - `platform_fee` (numeric(10, 2), not null)
  - `tax_amount` (numeric(10, 2), default 0.00, not null)
  - `total_amount` (numeric(10, 2), not null)
  - `provider_payout_amount` (numeric(10, 2), not null)
  - `cancellation_reason` (text)
  - `cancelled_at` (timestamptz)
  - `check_in_at` (timestamptz)
  - `check_out_at` (timestamptz)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- **`booking_price_lines`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `booking_id` (uuid, references `bookings(id)` ON DELETE CASCADE, not null)
  - `description` (text, not null)
  - `unit_price` (numeric(10, 2), not null)
  - `quantity` (numeric(10, 2), not null)
  - `amount` (numeric(10, 2), not null)

- **`booking_status_events`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `booking_id` (uuid, references `bookings(id)` ON DELETE CASCADE, not null)
  - `from_status` (booking_status)
  - `to_status` (booking_status, not null)
  - `actor_id` (uuid, references `profiles(id)`)
  - `notes` (text)
  - `created_at` (timestamptz, default now())

### 3.5 Payments & Financial Ledger
- **`payment_orders`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `booking_id` (uuid, references `bookings(id)` not null)
  - `razorpay_order_id` (text, unique, not null)
  - `amount` (numeric(10, 2), not null)
  - `currency` (text, default 'INR', not null)
  - `status` (payment_status, default 'created', not null)
  - `receipt_number` (text, not null)
  - `created_at` (timestamptz, default now())

- **`payment_transactions`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `order_id` (uuid, references `payment_orders(id)` not null)
  - `booking_id` (uuid, references `bookings(id)` not null)
  - `razorpay_payment_id` (text, unique, not null)
  - `razorpay_signature` (text, not null)
  - `amount` (numeric(10, 2), not null)
  - `method` (text) -- 'upi', 'card', 'netbanking'
  - `status` (payment_status, not null)
  - `captured_at` (timestamptz, default now())

- **`payment_webhook_events`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `event_id` (text, unique, not null)
  - `event_type` (text, not null)
  - `payload` (jsonb, not null)
  - `processed_at` (timestamptz, default now())

- **`financial_ledger_entries`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `booking_id` (uuid, references `bookings(id)`)
  - `entry_type` (ledger_entry_type, not null)
  - `debit_account` (text, not null)
  - `credit_account` (text, not null)
  - `amount` (numeric(10, 2), not null)
  - `currency` (text, default 'INR', not null)
  - `description` (text, not null)
  - `reference_id` (text)
  - `created_at` (timestamptz, default now())

### 3.6 Operations & Auditing
- **`reviews`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `booking_id` (uuid, references `bookings(id)` unique, not null)
  - `space_id` (uuid, references `parking_spaces(id)` not null)
  - `customer_id` (uuid, references `profiles(id)` not null)
  - `rating` (integer CHECK (rating BETWEEN 1 AND 5), not null)
  - `comment` (text)
  - `is_approved` (boolean, default true)
  - `created_at` (timestamptz, default now())

- **`support_tickets`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `ticket_number` (text, unique, not null)
  - `user_id` (uuid, references `profiles(id)` not null)
  - `booking_id` (uuid, references `bookings(id)`)
  - `subject` (text, not null)
  - `category` (text, not null)
  - `priority` (text, default 'medium', not null)
  - `status` (text, default 'open', not null)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- **`support_messages`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `ticket_id` (uuid, references `support_tickets(id)` ON DELETE CASCADE, not null)
  - `sender_id` (uuid, references `profiles(id)` not null)
  - `message` (text, not null)
  - `attachment_url` (text)
  - `created_at` (timestamptz, default now())

- **`audit_logs`**
  - `id` (uuid, PK, default gen_random_uuid())
  - `actor_id` (uuid, references `profiles(id)`)
  - `action` (text, not null)
  - `entity_type` (text, not null)
  - `entity_id` (text, not null)
  - `metadata` (jsonb)
  - `ip_address` (text)
  - `created_at` (timestamptz, default now())
