# BOOKING ENGINE SPECIFICATION: CONCURRENCY, HOLDS & STATE MACHINE

## 1. Booking State Machine

```
               [Customer initiates checkout]
                            │
                            ▼
                    ┌───────────────┐
                    │  HOLD_PENDING │  (10-minute temporary inventory reservation)
                    └───────┬───────┘
            Payment Succeeded│   │ Hold Expires or Payment Fails
                            │   ▼
                            │ ┌───────────────┐
                            │ │    EXPIRED    │
                            │ └───────────────┘
                            ▼
                    ┌───────────────┐
                    │   CONFIRMED   │  (Payment captured, slot reserved, gate pin sent)
                    └───────┬───────┘
           Check-in Time    │   │ Cancellation by customer/provider/admin
                            │   ▼
                            │ ┌───────────────┐
                            │ │   CANCELLED   │  (Ledger records refund calculation)
                            │ └───────────────┘
                            ▼
                    ┌───────────────┐
                    │    ACTIVE     │  (Vehicle parked on premise)
                    └───────┬───────┘
           Check-out Time   │   │ Overstay or access incident
                            │   ▼
                            │ ┌───────────────┐
                            │ │   DISPUTED    │
                            │ └───────────────┘
                            ▼
                    ┌───────────────┐
                    │   COMPLETED   │  (Eligible for review & provider payout)
                    └───────────────┘
```

---

## 2. Double-Booking Prevention & Concurrency Model

### 2.1 The Race Condition
When two users concurrently attempt to book the same parking space for an overlapping interval `[T_start, T_end]`, a simple `SELECT WHERE NOT EXISTS` can result in double bookings due to race conditions.

### 2.2 PostgreSQL Exclusion Constraint
To enforce mathematical uniqueness across intervals at the database engine level, we define an exclusion constraint using GiST:

```sql
-- Ensure btree_gist extension is enabled
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- bookings table constraint:
ALTER TABLE bookings
ADD CONSTRAINT no_overlapping_confirmed_bookings
EXCLUDE USING gist (
  space_id WITH =,
  booking_duration_range WITH &&
)
WHERE (status IN ('confirmed', 'active'));
```

### 2.3 Temporary Holds with Expiring Semantics
Before creating a Razorpay order, the booking engine creates a row in `booking_holds` with a 10-minute window:
1. `check_space_availability(p_space_id, p_start, p_end)` verifies:
   - Space status is `approved` and `is_active = true`.
   - Day of week and time of day fall within provider's `availability_rules`.
   - No row in `provider_blocks` overlaps.
   - No row in `bookings` with status IN ('confirmed', 'active') overlaps.
   - No active row in `booking_holds` (where `expires_at > now()`) overlaps.
2. If available, an atomic transaction inserts the `booking_hold` and creates a `bookings` record in `hold_pending` state.
3. If concurrent requests race, the first transaction acquires the hold, and subsequent requests fail immediately with `SPACE_ALREADY_RESERVED`.

---

## 3. Server-Side Pricing Engine

Pricing is computed entirely on the server based on the snapshot of rates at booking time:
- Duration in hours = `ceil((end_time - start_time) in minutes / 60)`
- `base_amount`:
  - If duration >= 24 hours and `daily_rate` is defined: `(days * daily_rate) + (remaining_hours * hourly_rate)`.
  - Else: `duration_hours * hourly_rate`.
  - Enforce `min_duration_hours`.
- `platform_fee`: Derived from active `commission_rules` (default 15% platform commission).
- `tax_amount`: GST (18% applied to platform service fee as per Indian marketplace regulations).
- `total_amount`: `base_amount + platform_fee + tax_amount`.
- `provider_payout_amount`: `base_amount` (net amount payable to provider upon successful completion).
