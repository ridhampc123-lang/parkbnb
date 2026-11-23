# PARKBNB — COMPLETE PROJECT ARCHITECTURE AUDIT & ROOT-CAUSE ANALYSIS

**Audit Date:** November 2026  
**Auditor:** Principal Full-Stack Engineer, Database Architect & Cybersecurity Lead  
**Scope:** Full repository inspection across frontend, backend, database schema, RLS, authentication, RBAC, privacy architecture, booking concurrency, financial ledger, and administration.

---

## 1. Executive Summary

A comprehensive architectural inspection of the ParkBnB codebase at `d:\parkbnb` revealed that while Next.js App Router scaffolding, responsive UI design, and initial SQL migrations were constructed, the application was largely dependent on an in-memory mock repository (`MarketplaceStore`) populated with fake users (`Rajesh Patel`, `Vikram Shah`, `usr-admin-001`, `usr-driver-01`), hardcoded dispute tickets, and simulated bookings. 

Furthermore, the system lacked the mandatory **Customer Privacy Architecture** (unique unpredictable Customer IDs, booking-specific privacy references, masked driver identities, and audited staff lookups) and had an incomplete **Role-Based Access Control (RBAC)** model that supported only 4 roles rather than the 9 operational roles required by the specification.

This transformation plan establishes true database-driven operations, implements zero-trust privacy boundaries, eliminates all fake/mock data, and hardens the booking concurrency and financial ledger engines.

---

## 2. Complete Architecture Audit Table

| Area | Current Condition | Root Cause | Required Correction | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Data Integrity & Storage** | In-memory `MarketplaceStore` with hardcoded profiles, bookings, and ledger entries used across server actions. | Rapid prototyping fallback not migrated to real database queries. | Remove all fake data; implement true Supabase PostgreSQL repository with zero-state empty handling. | **Critical (P0)** |
| **RBAC & Authorization** | `user_role` enum only had 4 roles (`customer`, `provider`, `admin`, `super_admin`). No permissions table or role-permission matrix. | Incomplete authorization schema and lack of granular staff roles. | Expand to all 9 roles (`visitor`, `customer`, `provider`, `support_agent`, `operations_manager`, `finance_manager`, `verification_manager`, `admin`, `super_admin`), create `permissions` & `role_permissions` tables, and server-side `hasPermission` guards. | **Critical (P0)** |
| **Customer Privacy Architecture** | No permanent public Customer ID; raw customer UUIDs exposed; owners see customer profile joins; no staff lookup audit. | Missing privacy architecture required by specification Section 7. | Implement cryptographically secure `customer_public_id` (`PBN-C-XXXX-XXXX`), `booking_customer_reference` (`PBN-REF-XXXX`), masked display names ("Rahul S."), `customer_data_access_logs` table, and privileged staff lookup tool. | **Critical (P0)** |
| **Admin Command Center** | Dashboard displayed metrics from in-memory mock store; disputes page had hardcoded ticket array; no date/time filters. | Mock data dependency and incomplete metrics aggregation queries. | Replace with database-driven aggregations, real KPI counts, date filters, empty states, and dynamic dispute arbitration. | **High (P0)** |
| **Customer Portal** | Basic dashboard; missing permanent Customer ID, saved vehicle edit/delete validation, QR booking pass, privacy settings, and deletion request. | Incomplete customer self-service implementation. | Overhaul customer portal with Customer ID display, vehicle management, QR pass generator, booking cancellation/refund tracking, and DPDP privacy requests. | **High (P1)** |
| **Owner / Provider Portal** | Gate clearance manifest exposed full customer references; no visual availability calendar; mock earnings. | Incomplete provider workflow and missing privacy boundary. | Implement privacy-safe Gate Manifest (plate, vehicle type, masked name only), visual availability calendar with slot blocking, and ledger-backed earnings & payout requests. | **High (P1)** |
| **Booking & Concurrency Engine** | Booking holds and payment confirmations performed in memory rather than running PostgreSQL transactions or RPCs. | Server actions called `getLocalStore()` rather than Supabase stored procedures. | Execute atomic database holds (`create_booking_hold`), enforce exclusion constraints on overlapping intervals, server-side duration pricing, and idempotency checks. | **Critical (P0)** |
| **Financial Ledger & Payments** | Simulated Razorpay payment capture and ledger entries recorded in memory. Webhook verification was incomplete. | Missing secure payment gateway boundary. | Connect double-entry ledger to database (`financial_ledger_entries`), integrate Razorpay HMAC SHA256 signature verification, and provide safe unconfigured fallback. | **High (P0)** |
| **Row Level Security (RLS)** | Existing RLS allowed owners to read bookings table rows containing customer foreign keys without field-level masking. | RLS policies lacked column-level security or privacy views. | Tighten RLS policies; create security definer functions for privileged lookups and ensure owners never query customer contact details. | **Critical (P0)** |
| **Testing & Verification** | Only 4 unit tests in `tests/marketplace.test.js`; zero tests for RBAC, privacy boundary, or customer masking. | Testing suite limited to pricing calculations. | Build comprehensive automated test suite covering all 9 roles, customer privacy masking, booking concurrency, and ledger reconciliation. | **High (P0)** |

---

## 3. Implementation Roadmap

- **Phase 1:** Complete Repository & Architecture Audit (this document).
- **Phase 2:** Database Schema, Privacy Migration & Strict RLS (`20261123000001_privacy_and_rbac.sql`).
- **Phase 3:** Role-Based Access Control (RBAC) & Server-Side Permission Guards.
- **Phase 4:** Customer Privacy Engine (Cryptographic IDs, References, Masked Names, Audited Lookups).
- **Phase 5:** Production Booking & Availability Engine (Concurrency, Holds, Ledger Entries).
- **Phase 6:** Advanced Admin Command Center (KPIs, Customers, Owners, Listings, Finance, Disputes, Lookup).
- **Phase 7:** Advanced Customer Portal (Profile, Vehicles, Passes, Privacy, Receipts).
- **Phase 8:** Advanced Owner Portal (Listings, Availability Calendar, Gate Manifest, Payouts).
- **Phase 9:** Payment, Webhook, Ledger & Safe Mock Gateway Boundary.
- **Phase 10:** Automated Testing Suite & Production Build Verification.
