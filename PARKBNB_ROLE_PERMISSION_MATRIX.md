# PARKBNB — ROLE-BASED ACCESS CONTROL (RBAC) MATRIX
**Document Reference:** `PARKBNB_ROLE_PERMISSION_MATRIX.md`  
**Version:** 2.0.0 (Production Verified)  
**Security Classification:** Highly Confidential / Authorization Specification  

---

## 1. Operational Role Definitions

The Parkbnb platform defines 9 distinct operational roles enforced across server actions, API routes, middleware, and database Row Level Security (RLS):

1. `visitor`: Anonymous public browser searching for parking.
2. `customer`: Registered driver booking parking and managing vehicles.
3. `provider`: Parking space property host or commercial facility operator.
4. `support_agent`: Customer support representative resolving driver/host inquiries.
5. `operations_manager`: Field operations manager overseeing listing verification and gate access.
6. `finance_manager`: Financial accountant overseeing ledger reconciliation and payouts.
7. `verification_manager`: Legal officer auditing property rights and host KYC documents.
8. `admin`: System administrator managing users, listings, disputes, and platform rules.
9. `super_admin`: Platform executive with blanket permissions across all operational tiers.

---

## 2. Comprehensive RBAC Permission Matrix

| Capability / Operational Action | visitor | customer | provider | support_agent | operations_manager | finance_manager | verification_manager | admin | super_admin |
|---|---|---|---|---|---|---|---|---|---|
| **Browse & Search Approved Spaces** |  |  |  |  |  |  |  |  |  |
| **Calculate Rates & Check Availability** |  |  |  |  |  |  |  |  |  |
| **Acquire 10-Min Reservation Hold** |  |  |  |  |  |  |  |  |  |
| **Create & Pay for Bookings** | ❌ |  | ❌ | ❌ | ❌ | ❌ | ❌ |  |  |
| **View Own Driver Passes & QR Codes** | ❌ |  | ❌ | ❌ | ❌ | ❌ | ❌ |  |  |
| **Gate Check-In & Check-Out ("In/Out")** | ❌ |  |  | ❌ | ❌ | ❌ | ❌ |  |  |
| **Request Booking Refund** | ❌ |  | ❌ | ❌ | ❌ | ❌ | ❌ |  |  |
| **Add / Edit / Remove Saved Vehicles** | ❌ |  | ❌ | ❌ | ❌ | ❌ | ❌ |  |  |
| **Submit Host KYC Verification** | ❌ | ❌ |  | ❌ | ❌ | ❌ | ❌ |  |  |
| **Create & Edit Parking Spaces** | ❌ | ❌ |  | ❌ |  | ❌ | ❌ |  |  |
| **Schedule Space Maintenance Blocks** | ❌ | ❌ |  | ❌ |  | ❌ | ❌ |  |  |
| **View Masked Gate Manifest** | ❌ | ❌ |  | ❌ |  | ❌ | ❌ |  |  |
| **View Own Escrow Earnings & Ledger** | ❌ | ❌ |  | ❌ | ❌ | ❌ | ❌ |  |  |
| **Reply to Driver Space Reviews** | ❌ | ❌ |  | ❌ | ❌ | ❌ | ❌ |  |  |
| **Report Policy-Violating Reviews** | ❌ | ❌ |  | ❌ | ❌ | ❌ | ❌ |  |  |
| **Privileged Customer Lookup (with reason)** | ❌ | ❌ | ❌ |  |  | ❌ | ❌ |  |  |
| **Review & Audit Host KYC Documents** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |  |  |  |
| **Approve / Reject Parking Spaces** | ❌ | ❌ | ❌ | ❌ |  | ❌ |  |  |  |
| **View Full Double-Entry Ledger** | ❌ | ❌ | ❌ | ❌ | ❌ |  | ❌ |  |  |
| **Disburse Bank & UPI Host Payouts** | ❌ | ❌ | ❌ | ❌ | ❌ |  | ❌ |  |  |
| **Manage Platform Settings & GST Rates** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |  |  |
| **Toggle Emergency Maintenance Mode** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |  |
| **Inspect System Audit Logs** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |  |  |

---

## 3. Enforcement Implementation

- **Server Action Protection:** Every action executes `getServerSession()` and verifies user role against `ROLE_PERMISSIONS`:
  ```typescript
  if (!hasPermission(session.role, 'payouts:disburse')) {
    return { error: 'Unauthorized: Insufficient financial governance permissions.' };
  }
  ```
- **Route Protection Middleware (`src/middleware.ts`):** Enforces `/account/*` for authenticated users, `/host/*` for verified providers, and `/admin/*` for staff roles (`isStaffRole`).
- **Database Row Level Security (RLS):** Supabase PostgreSQL policies enforce that `auth.uid() = customer_id` for customer tables, and `auth.uid() = provider_id` for parking host tables.
