# PARKBNB — CUSTOMER PANEL COMPLETE ARCHITECTURAL MANUAL
**Document Reference:** `PARKBNB_CUSTOMER_PANEL.md`  
**Version:** 2.0.0 (Production Verified)  
**Target Audience:** Engineering, Product, Security & QA Teams  

---

## 1. Customer Experience Architecture

The Parkbnb Customer Experience provides a seamless journey from anonymous public parking discovery through frictionless checkout, live gate arrival pass presentation, vehicle management, payment invoicing, and data privacy rights.

```
Public Discovery (No Login) ──► Space Selection ──► Frictionless Checkout
                                                            │
  ┌───────────────── Logged-In Customer Panel ──────────────┴───────────────┐
  │                                                                         │
  ├─► Overview (Live Pass, Quick Search, Upcoming Slots, Pending Actions)   │
  ├─► My Bookings (Filter Tabs: All, Active, Upcoming, Completed, Cancelled)│
  ├─► Pass Details (Gate QR Code, Check-In "When In", Check-Out "When Out") │
  ├─► My Vehicles (Add Vehicle, License Plate Sanitization, Default Toggle) │
  ├─► Payments & Refunds (Itemized 18% GST Invoice, Self-Service Refunds)   │
  ├─► Notifications Center (Read/Unread State, Deep Links, Reminders)       │
  ├─► Support Tickets (Direct Inquiry Linked to Pass Reference)             │
  └─► Profile & Privacy (Permanent Customer ID, Contact Info, DPDP Deletion)│
```

---

## 2. Public Discovery & Advanced Search (`/`, `/search`, `/parking/[slug]`)

### 2.1 Non-Intrusive Public Exploration
- **Zero Registration Barriers:** Visitors browse parking spaces, view approved high-resolution photos, examine genuine amenities, and inspect pricing without entering phone numbers, email, or OTP.
- **Geospatial Discovery:** Users search by destination landmark or toggle **Use Current Location** (via browser Geolocation API with user consent).
- **Multi-Filter Engine:**
  - Vehicle Compatibility: Car, SUV, Electric Vehicle (EV), Two-Wheeler.
  - Parking Category: Covered, Underground/Basement, Open Surface, Valet.
  - Amenities: EV Charging Station, 24/7 CCTV, Security Guard, Automated Gate.
  - Duration & Date Range: Hourly, Daily, Monthly pass calculation.
- **Privacy Preservation:** Approximate neighborhood and distance are revealed publicly. Private residential unit numbers and exact property gate codes remain hidden until a confirmed reservation is created.

---

## 3. Frictionless Checkout Engine

### 3.1 First-Time Driver Experience
1. Driver selects parking space and clicks **Book Now**.
2. System requests Driver Mobile Number.
3. Cryptographic OTP verification takes place in single turn.
4. Driver account is automatically synthesized; user enters full name and vehicle license plate.
5. Server creates a 10-minute temporary reservation hold (`booking_holds`) to prevent double-booking.
6. Driver reviews transparent price breakdown:
   $$\text{Total Amount} = \text{Base Rate} + (\text{Base Rate} \times 0.15) + ((\text{Base Rate} \times 0.15) \times 0.18)$$
7. Driver accepts house rules and completes Razorpay / UPI payment.
8. Driver receives instant booking confirmation and encrypted QR pass.

### 3.2 Returning Authenticated Driver
1. System recognizes secure HTTP-only session token (`parkbnb_auth_token`).
2. One-click vehicle selection from saved garage (`customer_vehicles`).
3. Zero repetitive OTP prompts during active trusted sessions.
4. Immediate payment authorization and pass issuance.

---

## 4. Customer Panel Modules

### 4.1 Overview (`/account`)
- **Active Session Hero Card:** Real-time badge if driver is currently parked, displaying slot number, elapsed parking minutes, and direct link to gate pass.
- **Quick Book:** Instant shortcut to nearby Ahmedabad parking spaces.
- **Recent Bookings Table:** Summary of past reservations with status indicators.
- **Account Snapshot:** Displays Permanent Customer ID and active vehicle count.

### 4.2 My Bookings (`/account/bookings`)
- **Filter Tabs:**
  - `All Bookings`: Complete reservation ledger.
  - `Active Now`: Live sessions currently occupying parking slots.
  - `Upcoming`: Confirmed future bookings awaiting arrival window.
  - `Completed`: Gracefully finished parking sessions.
  - `Cancelled`: Cancelled reservations with refund tracking.
- **Instant Search:** Dynamic client-side filter by booking reference (`PKB-XXXX`), property area, or space identifier.

### 4.3 Interactive Pass & Gate Management (`/account/bookings/[id]`)
- **Arrival Check-In ("When In"):** When driver reaches the gate, clicking **Confirm Gate Entry** changes booking status to `active`, logs entry timestamp, and clears vehicle with gate security.
- **Departure Check-Out ("When Out"):** When leaving, driver clicks **Confirm Gate Exit**. If vehicle stayed past scheduled end time, overstay minutes and calculated penalty fee are logged, releasing slot back to available inventory.
- **Self-Service Cancellation:** Cancellations before arrival window disburse automatic ledger refunds without human delay.
- **Reservation Extensions:** Drivers can extend ongoing sessions by 1 to 4 hours; extension verifies availability with collision detection before charging additional hours.
- **Driver Reviews:** Completed bookings allow star rating (1–5) and feedback submission, automatically notifying host.

### 4.4 My Vehicles (`/account/vehicles`)
- Add unlimited vehicles with plate format validation (e.g. `GJ01AB1234`).
- Classify vehicle by type: Hatchback/Sedan (`car`), Compact SUV / SUV (`suv`), Electric Vehicle (`ev`), Two-Wheeler (`motorcycle`).
- Set default vehicle for 1-click checkout selection.
- Delete obsolete vehicles with cascade safety guards.

### 4.5 Payments & Refunds (`/account/payments`)
- Metric summary cards: Total Parking Spend, Completed Transactions, Processed Refunds.
- Itemized financial list with breakdown: Base Space Fare, 15% Platform Convenience Fee, 18% Integrated GST.
- **Tax Invoice Modal:** Formatted, printable GST-compliant receipt with Parkbnb corporate details, customer public ID, and transaction references.
- **Self-Service Refund System:** Dedicated tab showing refund status (`requested`, `processing`, `completed`, `rejected`), with modal allowing drivers to submit refund requests for eligible bookings.

### 4.6 In-App Notifications (`/account/notifications`)
- Real-time notification categories: `booking`, `reminder`, `payment`, `security`, `system`.
- Read and unread status with unread count badge.
- Interactive actions: Mark single notification read, **Mark All Read** in 1 click.
- Deep links routing driver straight to corresponding reservation pass or payment receipt.

### 4.7 Profile & Data Privacy (`/account/profile`)
- **Permanent Customer ID:** Immutable format (`CUST-XXXXXXXX`) used for support inquiries and gate clearances without exposing mobile numbers.
- **Driver Contact Information:** Editable full name, mobile number, and email.
- **Notification Channels:** Granular toggles for SMS, WhatsApp, and Email alerts.
- **Active Session Management:** Shows client IP, browser user agent, and secure logout action.
- **DPDP Act Account Deletion:** Self-service modal submitting an official account erasure request under Digital Personal Data Protection Act 2023, generating an immutable audit log.
