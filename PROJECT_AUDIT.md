# PROJECT AUDIT: PARKING MARKETPLACE (PARKBNB)

**Audit Date:** November 2026  
**Auditor:** Senior Product Architect & Full-Stack Lead (Antigravity)  
**Specification Reference:** `Parking_Marketplace_Master_Blueprint.md` (Single Source of Truth)

---

## 1. Executive Summary

A comprehensive initial audit of the repository located at `d:\parkbnb` was conducted before writing code.
The repository initially contained only the master specification document: `Parking_Marketplace_Master_Blueprint.md` (61,329 bytes, 1,898 lines).
No prior code, package manifests, database migrations, or infrastructure configurations were present. Git was uninitialized.

This audit establishes the baseline technical assessment, architectural decisions, and an execution roadmap to build the complete, multi-role (Customer, Provider, Admin) parking marketplace for Ahmedabad, Gujarat, India.

---

## 2. Repository Findings & Current State

| Dimension | Finding | Assessment |
| :--- | :--- | :--- |
| **Source Code** | Zero existing application files. | Green field within the repository. No legacy technical debt to migrate. |
| **Version Control** | Uninitialized. Initialized empty Git repository (`.git`). | Ready for structured commit history per phase. |
| **Node.js Environment** | Node.js `v22.14.0`, npm `11.5.2` on Windows. | Modern, stable Node runtime supporting Next.js App Router and ES Modules. |
| **Database & Backend** | Supabase PostgreSQL required by specification. | Zero existing tables or cloud connection. Schema, migrations, RLS policies, and RPC procedures must be constructed from scratch. |
| **Environment Variables** | No `.env` or `.env.local` files present. | Must provide structured `.env.example` and a clear environment configuration state. Live credentials for Supabase, Razorpay, Google Maps, and Resend/SMS must be securely injected without breaking offline/unconfigured builds. |
| **Target Market** | Ahmedabad, Gujarat, India (`Asia/Kolkata` time zone, INR currency). | Specific legal verification rules needed for society parking; tax rules (GST/TDS) and Razorpay integration required. |

---

## 3. Critical Architectural & Business Risks Identified

1. **Double Booking & Concurrency Vulnerability:**
   - *Risk:* Overlapping reservations on the same parking space during high traffic.
   - *Solution:* PostgreSQL exclusion constraints (`EXCLUDE USING gist`) on space ID and booking time range (`tstzrange`), coupled with atomic hold reservation RPC functions and `SELECT ... FOR UPDATE` row-level locks.

2. **Legal & Society Bye-Laws in Gujarat:**
   - *Risk:* Apartment societies (Cooperative Housing Societies / RERA-registered bodies) in Gujarat frequently restrict non-resident access and rental of designated parking allotments.
   - *Solution:* Strict provider onboarding verification differentiating independent commercial lots vs. allotted apartment spaces vs. private standalone plots. Verification documents must be submitted, stored in private buckets, and manually approved by an Admin before listings can be published or booked.

3. **Financial Truth & Ledger Integrity:**
   - *Risk:* Using mutable `balance` columns creates accounting discrepancies during cancellations, partial refunds, or payment disputes.
   - *Solution:* Immutable, double-entry style financial ledger (`financial_ledger_entries`) recording gross booking value, platform commission, provider payables, taxes, refunds, and payout disbursements.

4. **Role Escalation & IDOR Risks:**
   - *Risk:* Clients passing manipulated `role` or accessing another user's vehicles/bookings/payouts.
   - *Solution:* Role-based access control (RBAC) enforced in database triggers, Supabase RLS policies with strict ownership checks (`auth.uid() = user_id`), and server-side session authorization guards in Next.js Server Actions and Route Handlers.

5. **Payment Gateway State Drift:**
   - *Risk:* Trusting client-side payment success callbacks or dropping webhook notifications.
   - *Solution:* Server-side Razorpay order generation, raw-body HMAC SHA256 signature verification on webhooks, idempotent webhook event logging, and fallback order status reconciliation.

---

## 4. Technology Stack Selection

- **Framework:** Next.js (App Router, React 19/18, TypeScript)
- **Styling & UI:** Tailwind CSS, Lucide React icons, accessible dialogs/menus
- **Database & Auth:** Supabase PostgreSQL with PostGIS, Row Level Security (RLS), Supabase Auth (`@supabase/ssr`)
- **Payments:** Razorpay Server SDK & Webhooks (INR currency, UPI, Cards, Net Banking)
- **Maps & Geolocation:** Google Maps Platform / OpenStreetMap Leaflet fallback for coordinate picking, distance calculation, and interactive markers
- **Validation:** Zod schemas shared across client forms and server actions
- **State & Time:** `date-fns` with `date-fns-tz` handling `Asia/Kolkata` and UTC conversions

---

## 5. Next Steps

Proceed directly to Phase 0 deliverables:
1. `IMPLEMENTATION_PLAN.md`
2. `ARCHITECTURE.md`
3. `DATABASE_SCHEMA.md`
4. `RLS_SECURITY.md`
5. `BOOKING_ENGINE.md`
6. `PAYMENTS_AND_LEDGER.md`
7. `ENVIRONMENT_SETUP.md`
8. `LEGAL_AND_OPERATIONS_OPEN_ITEMS.md`
9. Next.js App Router scaffolding and dependencies setup (Phase 1).
