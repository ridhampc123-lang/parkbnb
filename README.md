# ParkBnB: Two-Sided Parking Marketplace

> A production-minded, full-featured two-sided parking marketplace designed for drivers, private/commercial parking providers, and platform administrators. Built specifically for urban mobility with initial pilot support for Ahmedabad, Gujarat, India.

---

## Key Features

- **Driver Discovery:** Search by destination landmark, area, vehicle type, and arrival/departure times. Real-time availability checks and pricing calculation.
- **Provider Management:** Complete onboarding flow, space listing wizard, photo upload, recurring availability schedules, blockout dates, and automated earnings breakdown.
- **Admin Operations:** Verification queue for identity and society/property documents, user management, booking oversight, disputes arbitration, and financial ledger inspection.
- **Double-Booking Prevention:** Database-level GiST exclusion constraints and atomic temporary hold reservation RPC functions.
- **Financial Ledger:** Double-entry immutable accounting for customer payments, platform commission, provider payables, and refunds.
- **Razorpay Integration:** Full India-ready payment gateway workflow with signature validation, webhook idempotency, and INR currency handling.

---

## Technology Stack

- **Framework:** Next.js 15 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS with responsive, accessible components
- **Database:** Supabase PostgreSQL with PostGIS and Row Level Security (RLS)
- **Payments:** Razorpay Node SDK & Webhooks
- **Date/Time:** `date-fns` & `date-fns-tz` (`Asia/Kolkata` presentation, UTC storage)
- **Validation:** Zod schemas

---

## Getting Started

### 1. Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- A Supabase project (or local Supabase instance)

### 2. Environment Setup
Copy the environment template and fill in your Supabase and Razorpay credentials:
```bash
cp .env.example .env.local
```

### 3. Database Migration
Apply the migrations located in `supabase/migrations/` using the Supabase Dashboard SQL Editor or Supabase CLI:
- `001_initial_schema.sql`: Core schema, enums, tables, RLS policies, and RPC procedures
- `002_ahmedabad_seed.sql`: Pilot areas in Ahmedabad and initial reference spaces

### 4. Install & Run
```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the marketplace.
