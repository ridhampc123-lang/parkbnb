# PARKBNB — BOOKING ENGINE & CONCURRENCY SPECIFICATION
**Document Reference:** `PARKBNB_BOOKING_ENGINE.md`  
**Version:** 2.0.0 (Production Verified)  
**Target Audience:** Core Backend Engineers, Database Architects & Financial Auditors  

---

## 1. Booking Engine Overview

The Parkbnb Booking Engine governs parking space inventory allocation, concurrency protection, temporary reservation holds, server-side pricing calculations, gate arrival/departure state transitions, and double-entry financial settlement.

---

## 2. Concurrency & Availability Algorithm

### 2.1 Availability Validation Logic (`checkAvailability`)
A parking space is available for interval $[T_{\text{start}}, T_{\text{end}}]$ if and only if all of the following conditions evaluate to `true`:
1. **Emergency Maintenance Check:** Platform emergency maintenance mode is disabled (`emergencyMaintenanceMode === false`).
2. **Space Verification & Active State:** Space exists, status is `approved`, and `is_active === true`.
3. **Temporal Validity:** Valid ISO 8601 timestamps where $T_{\text{end}} > T_{\text{start}}$.
4. **Booking Collision Check:** Zero confirmed (`status === 'confirmed'`) or active (`status === 'active'`) bookings intersect with the requested window:
   $$\text{Collision} \iff \max(T_{\text{start}}, B_{\text{start}}) < \min(T_{\text{end}}, B_{\text{end}})$$
5. **Host Availability Block Check:** Zero owner maintenance blocks intersect with the requested window:
   $$\text{Block Collision} \iff \max(T_{\text{start}}, M_{\text{start}}) < \min(T_{\text{end}}, M_{\text{end}})$$
6. **Active Hold Check:** Zero unexpired temporary holds from other customers intersect with the requested window:
   $$\text{Hold Collision} \iff (\text{ExpiresAt} > \text{Now}) \land (\max(T_{\text{start}}, H_{\text{start}}) < \min(T_{\text{end}}, H_{\text{end}}))$$

### 2.2 Temporary Reservation Hold Mechanism (`booking_holds`)
To eliminate checkout race conditions when multiple drivers view the same parking bay simultaneously:
- When a driver clicks **Proceed to Pay**, a 10-minute hold is acquired (`createHold`).
- If another driver attempts to reserve the same bay during this 10-minute window, the request is rejected with `Slot is currently reserved by another driver`.
- If checkout is cancelled or times out, the hold is released (`releaseHold`), immediately restoring bookability.
- Upon successful payment, the hold is converted into a confirmed booking in an atomic operation.

---

## 3. Server-Side Pricing Engine

Pricing calculations are strictly computed on the server; client-side price inputs are discarded to prevent client price tampering.

### 3.1 Pricing Mathematical Formulation
For a booking of duration $\Delta t = T_{\text{end}} - T_{\text{start}}$:
1. **Billing Hours Calculation:**
   $$H = \max\left(1, \left\lceil \frac{\Delta t}{3600 \text{ seconds}} \right\rceil\right)$$
2. **Base Space Amount:**
   - If $H \ge 24$ and daily rate $R_{\text{daily}}$ exists:
     $$D = \lfloor H / 24 \rfloor, \quad H_{\text{rem}} = H \bmod 24$$
     $$\text{Base Amount} = (D \times R_{\text{daily}}) + (H_{\text{rem}} \times R_{\text{hourly}})$$
   - Otherwise:
     $$\text{Base Amount} = H \times R_{\text{hourly}}$$
3. **Platform Convenience Fee:**
   $$\text{Platform Fee} = \text{Base Amount} \times 0.15 \quad (\text{Standard } 15\% \text{ commission})$$
4. **Integrated Goods & Services Tax (GST):**
   $$\text{Tax Amount} = \text{Platform Fee} \times 0.18 \quad (18\% \text{ GST applied strictly to platform fee})$$
5. **Total Customer Payable:**
   $$\text{Total Amount} = \text{Base Amount} + \text{Platform Fee} + \text{Tax Amount}$$
6. **Provider Payout Payable:**
   $$\text{Provider Payout} = \text{Base Amount} - (\text{Base Amount} \times \text{Custom Host Commission})$$

---

## 4. Booking Lifecycle State Machine

```
      [Driver Searches & Selects Slot]
                     │
                     ▼
             ┌───────────────┐
             │    HOLDING    │ (10-minute hold via booking_holds)
             └───────┬───────┘
                     │ (Payment Confirmed)
                     ▼
             ┌───────────────┐
             │   CONFIRMED   │◄────────────────┐
             └───────┬───────┘                 │
                     │                         │ (Extended via extendBooking)
        ┌────────────┴────────────┐            │
        │ (When In: Check-In)     │ (Cancellation)
        ▼                         ▼
 ┌──────────────┐         ┌───────────────┐
 │    ACTIVE    │         │   CANCELLED   │
 └──────┬───────┘         └───────┬───────┘
        │                         │
        │ (When Out: Check-Out)   ▼
        ▼                 ┌───────────────┐
 ┌──────────────┐         │   REFUNDED    │
 │  COMPLETED   │         └───────────────┘
 └──────────────┘
```

### 4.1 State Descriptions
- `pending`: Temporary hold active, awaiting gateway payment webhook.
- `confirmed`: Payment settled, slot reserved, QR gate pass issued to customer.
- `active`: Driver checked in at the gate ("When In"), vehicle currently occupying bay.
- `completed`: Driver checked out ("When Out"), overstay evaluated, bay released.
- `cancelled_by_customer`: Self-service cancellation before arrival window.
- `cancelled_by_provider`: Emergency cancellation by property owner.
- `cancelled_by_admin`: Staff intervention due to property audit or dispute.
- `refunded`: 100% funds disbursed back to customer ledger account.

---

## 5. Gate Arrival & Departure Management ("When In" / "When Out")

### 5.1 Gate Arrival ("When In")
1. Driver presents QR pass at property gate.
2. Security guard scans QR code or driver clicks **Confirm Gate Entry** on pass detail.
3. System verifies booking reference and current timestamp against arrival window.
4. Booking transitions to `active`, recording `check_in_at = ISO_TIMESTAMP`.
5. Gate manifest updates guard display with slot bay number.

### 5.2 Gate Departure ("When Out") & Overstay Management
1. Driver clicks **Confirm Gate Exit** or guard scans exit pass.
2. System evaluates departure timestamp against scheduled $T_{\text{end}}$:
   $$\text{Overstay Duration} = \max\left(0, \text{Now} - T_{\text{end}}\right)$$
3. If overstay exceeds 15-minute grace period:
   $$\text{Overstay Hours} = \lceil \text{Overstay Minutes} / 60 \rceil$$
   $$\text{Overstay Charge} = \text{Overstay Hours} \times R_{\text{hourly}} \times 1.5 \quad (1.5\times \text{ overtime tariff})$$
4. Booking transitions to `completed`, recording `check_out_at = ISO_TIMESTAMP`.
5. Bay inventory is immediately made available for subsequent drivers.
