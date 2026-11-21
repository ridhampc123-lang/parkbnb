# TESTING GUIDE & VALIDATION REPORT

## 1. Automated Test Suite Execution

The automated test suite verifies core business logic, concurrency rules, pricing snapshots, and financial reconciliation.

```bash
npm test
```

### Test Cases Covered:
1. **Pricing Engine Calculation:**
   - Base hourly amount computation for single and multi-hour durations
   - Server-side platform commission calculation (15%)
   - Indian GST calculation on platform convenience fee (18%)
   - Mathematical precision and rounding to 2 decimal places

2. **Concurrency & Overlapping Interval Math:**
   - Verifies that two reservations with interval overlap `[reqStart < bEnd && reqEnd > bStart]` are rejected
   - Verifies that adjacent, non-overlapping intervals (e.g. 08:00–10:00 and 10:00–14:00) are permitted without false-positive blocks

3. **Booking State Machine Transitions:**
   - Enforces permitted lifecycle states: `hold_pending` -> `confirmed` -> `active` -> `completed` / `cancelled` / `disputed`

4. **Double-Entry Financial Ledger Reconciliation:**
   - Asserts that customer payment gross exactly equals platform revenue plus provider payable escrow.

---

## 2. End-to-End Booking Lifecycle Verification

1. **Visitor Discovery:**
   - Navigate to `/` or `/search`
   - Filter by vehicle type (Sedan, SUV, Two-Wheeler) or EV Charging
   - Select a verified listing in Ahmedabad (Prahlad Nagar, Sindhu Bhavan Road, Navrangpura)

2. **Booking Hold & Price Lock:**
   - Select arrival and departure timestamps
   - Enter vehicle registration number
   - Initiate hold: System reserves a 10-minute hold window and locks out concurrent bookers

3. **Payment & Confirmation:**
   - Review transparent itemized price breakdown (Base rate + 15% platform fee + 18% GST)
   - Confirm payment: System transitions booking to `confirmed`, records double-entry ledger entries, and unlocks full security clearance instructions and gate directions

4. **Clearance Pass & Access:**
   - Customer accesses `/account/bookings/[id]` showing clearance PIN and guard instructions
   - Host accesses `/host/bookings` seeing customer vehicle plate on gate clearance manifest
