# PARKBNB — PARKING OWNER PANEL ARCHITECTURAL MANUAL
**Document Reference:** `PARKBNB_OWNER_PANEL.md`  
**Version:** 2.0.0 (Production Verified)  
**Target Audience:** Engineering, Product, Property Operations & Partner Success  

---

## 1. Parking Owner Experience Architecture

The Parking Owner Panel provides a comprehensive, business-management system designed for commercial parking operators, corporate campuses, society secretaries, and residential property owners.

```
Host Registration ──► Multi-Step KYC ──► Listing Space Wizard (8 Steps)
                             │                       │
                             ▼                       ▼
                     Admin Verification      Admin Verification
                             │                       │
                             └───────────┬───────────┘
                                         ▼
                            Active Host Management Panel
  ┌──────────────────────────────────────┴──────────────────────────────────────┐
  ├─► Dashboard (Active Bays, Occupancy %, Unpaid Escrow, Quick Actions)        │
  ├─► Spaces (`/host/spaces`): Inventory Grid, Pause/Resume, Full Specs Editor │
  ├─► Calendar (`/host/calendar`): Timeline, Confirmed Slots, Maintenance Block │
  ├─► Gate Manifest (`/host/bookings`): In/Out Gate Verification, QR Pass Scan  │
  ├─► Earnings (`/host/earnings`): Escrow Balance, Ledger Breakdown, Payout Req │
  ├─► Reviews (`/host/reviews`): Driver Ratings, Host Replies, Abusive Reporting│
  ├─► Settings (`/host/settings`): Business Profile, Bank Account & UPI Setup   │
  └─► Support (`/host/support`): Priority Inquiries (Gate, Payout, KYC, Space)  │
```

---

## 2. Host Onboarding & KYC Verification (`/host/onboarding`)

### 2.1 Multi-Step Onboarding Wizard
To comply with Indian financial and legal regulations, property owners must complete KYC before listing spaces:
1. **Business Profile:** Ownership model (`individual` vs `registered_business`), registered business/trade name.
2. **Tax & Legal Verification:** Permanent Account Number (PAN) validation, Goods and Services Tax Identification Number (GSTIN) for registered firms.
3. **Property Authorization:** Legal authority assertion (Owner, Authorized Leaseholder, Property Management Operator).
4. **Payout Configuration:**
   - Bank Account: Account number, IFSC Code (validated against RBI bank formats), and verified Account Holder Name.
   - Fast Payout UPI: Virtual Payment Address (e.g. `owner@okhdfcbank`).
5. **Verification Lifecycle:**
   - `draft`: Host is drafting information.
   - `submitted`: Application queued for admin document review.
   - `approved`: Host is verified; payout disbursement enabled.
   - `rejected`: Application returned with explicit legal deficiency explanation.

---

## 3. Real-Time Operations Dashboard (`/host`)

- **Live Operational Metrics:**
  - Total Registered Bays vs Active Bookable Bays.
  - Current Bay Occupancy Percentage.
  - Active Parked Sessions ("Currently In").
  - Unpaid Escrow Balance awaiting bank disbursement.
- **Immediate Attention Queue:** Highlights upcoming driver arrivals scheduled within the next 2 hours.
- **Quick Links:** Shortcuts to Add Space, Open Gate Manifest, View Calendar, and Request Payout.

---

## 4. Spaces Management & Space Editor (`/host/spaces`, `/host/spaces/[id]`, `/host/spaces/new`)

### 4.1 8-Step Listing Wizard
1. **Property Type:** Commercial, Residential, Private Garage, Society Plot.
2. **Location & Geospatial Pin:** City, Neighborhood Area, Landmark, Latitude & Longitude.
3. **Space Details:** Space Category (Covered, Basement, Open), Bay Identifier (`B-14`).
4. **Vehicle Compatibility:** Multi-select for Car, SUV, EV, Motorcycle.
5. **Amenities:** 24/7 CCTV, EV Charger (AC/DC Type 2), Security Guard, Automated Barrier.
6. **Operating Hours:** 24/7 Access or fixed daily operating schedule.
7. **Dynamic Pricing:** Hourly rate (₹), Daily rate (₹), Monthly pass rate (₹).
8. **Access Instructions & Photo Gallery:** Gate entry guidelines revealed only upon confirmed booking.

### 4.2 Space Specification Editor & Booking Guard
- **Spec Updates:** Hosts can update pricing, access guidelines, and amenities in real time.
- **Pause/Reactivate:** 1-click toggle to temporarily remove a space from public search.
- **Deletion Booking Guard:** If an owner attempts to delete a space that has active or upcoming confirmed bookings, the system strictly rejects deletion with an explicit error to prevent stranded reservations.

---

## 5. Availability Calendar & Maintenance Blocking (`/host/calendar`)

- **Interactive Timeline:** Displays confirmed driver bookings alongside active parking sessions.
- **Maintenance Block Scheduling:** Hosts can block specific dates/times for private use, maintenance, cleaning, or repainting.
- **Collision Protection Guard:** When creating a maintenance block, the booking engine validates against all active and confirmed reservations. If a customer reservation exists during the requested window, block creation is rejected with collision details.
- **1-Click Block Release:** Removing an availability block immediately restores space bookability on the public marketplace.

---

## 6. Gate Manifest & In/Out Verification (`/host/bookings`)

- **Live Gate Manifest:** Security guards and hosts view real-time arrivals and departures.
- **Privacy Enforcement:** In accordance with the DPDP Act 2023, customer phone numbers and emails are stripped. The driver's name is masked (`Rahul S.`) and identified via non-correlatable Booking Customer Reference (`BPR-XXXXXXXX`).
- **In/Out Actions:**
  - **Check-In ("When In"):** Confirms vehicle arrival, logs gate entry time, changes status to `active`.
  - **Check-Out ("When Out"):** Confirms vehicle departure, checks for overstay duration, logs exit time, marks booking `completed`, releases slot back to inventory.

---

## 7. Earnings & Payout Disbursements (`/host/earnings`)

- **Double-Entry Escrow Reconciliation:** Net earnings are automatically calculated:
  $$\text{Host Payout} = \text{Base Amount} - (\text{Base Amount} \times \text{Commission Rate})$$
- **Ledger Inflow Audit:** Complete chronological record of every credited reservation.
- **Payout Disbursement Request:** Hosts can trigger an instant payout request via NEFT/IMPS or UPI, generating a debit entry against host escrow in the double-entry ledger.

---

## 8. Reviews Moderation & Support (`/host/reviews`, `/host/support`)

- **Review Management:** Aggregated list of driver reviews with ratings and verified booking links.
- **Professional Host Reply:** Hosts can submit replies to reviews; submitting a reply dispatches an automatic in-app notification to the driver.
- **Report Abusive Review:** Hosts can report fraudulent or policy-violating reviews with an audit log.
- **Priority Host Support:** Category-specific ticketing (Listing Approval, KYC, Gate Incident, Payout Discrepancy, Technical Support).
