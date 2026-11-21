# SYSTEM ARCHITECTURE: PARKING MARKETPLACE (PARKBNB)

## 1. Architectural Philosophy

ParkBnB is structured as a **modular monolith** using Next.js App Router and PostgreSQL (via Supabase).
This design maximizes development velocity, eliminates premature microservice network latency, maintains strict transactional integrity for double-booking prevention, and guarantees auditable financial accounting.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT BROWSERS                                   |
|   (Customer Mobile/Desktop, Provider Dashboard, Admin Operations Console)         |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTPS / WSS
                                         v
+-----------------------------------------------------------------------------------+
|                             NEXT.JS 15 (APP ROUTER)                               |
|                                                                                   |
|  [Route Groups]                                                                   |
|   - (marketing)     : SSR / SSG Public Landing, SEO, Legal, Help                 |
|   - (marketplace)   : Dynamic Search, Spatial Discovery, Listing Detail           |
|   - (auth)          : Secure Login, Registration, Password Recovery               |
|   - (customer)      : Protected Customer Portal (Bookings, Vehicles, Receipts)    |
|   - (provider)      : Protected Host Portal (Listings, Schedules, Earnings)       |
|   - (admin)         : RBAC Protected Admin Operations (Verifications, Disputes)   |
|                                                                                   |
|  [Server Layer]                                                                   |
|   - Server Actions  : Mutative operations with Zod validation & auth context      |
|   - Route Handlers  : Razorpay Webhooks, Health Checks, Export endpoints          |
|   - Domain Services : Pricing Engine, Availability Engine, Notification Dispatch  |
+-----------------------------------------------------------------------------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
          Server Auth  |                                   | Webhooks / SDK
                       v                                   v
+--------------------------------------+   +----------------------------------------+
|       SUPABASE CLOUD POSTGRESQL      |   |            EXTERNAL SERVICES           |
|                                      |   |                                        |
|  - Auth & JWT Sessions               |   |  - Razorpay (India Payments & Orders)  |
|  - PostgreSQL Database with PostGIS  |   |  - Google Maps / OpenStreetMap         |
|  - Row Level Security (RLS)          |   |  - Resend / Postmark (Email notices)   |
|  - Stored Procedures / Concurrency   |   |  - SMS / WhatsApp Gateway (Twilio/Gupshup)
|  - Private & Public Storage Buckets  |   +----------------------------------------+
|  - Realtime WebSocket Channels       |
+--------------------------------------+
```

---

## 2. Directory Structure and Module Boundaries

```text
d:/parkbnb/
├── src/
│   ├── app/
│   │   ├── (marketing)/           # Public promotional & informational pages
│   │   ├── (marketplace)/         # Search & listing discovery
│   │   ├── (auth)/                # Supabase auth forms
│   │   ├── (customer)/account/    # Customer vehicle, booking & receipt dashboard
│   │   ├── (provider)/host/       # Provider onboarding, space creation, calendar
│   │   ├── (admin)/admin/         # Admin verification queue, finances, audit logs
│   │   ├── api/                   # Webhooks & server routes
│   │   └── layout.tsx             # Root layout with providers & toasts
│   ├── components/
│   │   ├── ui/                    # Reusable primitive components (Button, Input, Modal, Badge)
│   │   ├── marketing/             # Landing page sections, FAQs, hero
│   │   ├── marketplace/           # Search bar, filter drawer, listing cards, map preview
│   │   ├── booking/               # Checkout modal, step wizard, hold countdown
│   │   ├── provider/              # Space wizard, calendar grid, document upload
│   │   └── admin/                 # Verification tables, dispute viewer, metric cards
│   ├── lib/
│   │   ├── supabase/              # Client separation (browser, server, service-role)
│   │   ├── auth/                  # RBAC verification & session extraction
│   │   ├── pricing/               # Server-side fee, commission & GST calculation
│   │   ├── booking/               # Concurrency lock & hold expiry logic
│   │   ├── payments/              # Razorpay SDK wrappers & webhook verification
│   │   ├── maps/                  # Geocoding & coordinate calculations
│   │   └── validation/            # Shared Zod schemas
│   ├── types/                     # TypeScript database and domain interfaces
│   └── styles/                    # Global CSS and Tailwind directives
├── supabase/
│   ├── migrations/                # Version-controlled SQL migrations
│   └── seed.sql                   # Isolated development seed data
└── docs/                          # Architecture and operational documentation
```

---

## 3. Strict Boundary Rules

1. **Client Isolation:** The Supabase Service-Role Key (`SUPABASE_SERVICE_ROLE_KEY`) is strictly restricted to `src/lib/supabase/service-role.ts`. It is NEVER exported or referenced in any file beginning with `'use client'`.
2. **Pricing Integrity:** The client browser NEVER dictates the booking price or commission. The frontend submits only `spaceId`, `start_time`, `end_time`, and `vehicle_id`. The server re-fetches the listing rate, calculates the billing increments, checks for active commission rules, generates the price breakdown, and signs the Razorpay order.
3. **Storage Security:** Verification documents (Identity proofs, Property tax receipts, Society allotment letters) are saved to a private Supabase Storage bucket (`provider-documents`). Access requires short-lived signed URLs generated only for authorized Admins or the owning Provider.
4. **Timezone Policy:** All timestamps in PostgreSQL are stored with time zone (`timestamptz`, UTC). User interfaces convert to `Asia/Kolkata` for display and input processing.
