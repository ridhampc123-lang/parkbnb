# IMPLEMENTATION PLAN: PARKING MARKETPLACE (PARKBNB)

**Reference:** `Parking_Marketplace_Master_Blueprint.md`  
**Market:** Ahmedabad, Gujarat, India (`Asia/Kolkata`)  
**Currency:** INR (₹)  
**Status:** In Progress (Phase 0 Complete, Phase 1 Underway)

---

## Phase Breakdown & Tracking

### Phase 0: Repository Audit, Architecture & Planning
- [x] Comprehensive review of `Parking_Marketplace_Master_Blueprint.md`
- [x] Initial audit of workspace and developer toolchains (`PROJECT_AUDIT.md`)
- [x] Architecture specification (`ARCHITECTURE.md`)
- [x] PostgreSQL relational database schema and PostGIS design (`DATABASE_SCHEMA.md`)
- [x] Row Level Security (RLS) and RBAC design (`RLS_SECURITY.md`)
- [x] Booking state machine and concurrency protection design (`BOOKING_ENGINE.md`)
- [x] Razorpay payment, webhook and financial ledger design (`PAYMENTS_AND_LEDGER.md`)
- [x] Environment configuration guide (`ENVIRONMENT_SETUP.md`)
- [x] Legal, property and tax considerations (`LEGAL_AND_OPERATIONS_OPEN_ITEMS.md`)
- [x] Project setup documentation (`README.md`, `CHANGELOG.md`)

---

### Phase 1: Foundation, Auth, Database Migrations & Security
- [ ] Initialize Next.js App Router project with TypeScript, Tailwind CSS, Lucide icons, and Zod
- [ ] Create Supabase browser, server, and service-role client modules with strict boundary isolation
- [ ] Create `.env.example` with exact variable documentation
- [ ] Create environment configuration detector to report truthful integration states
- [ ] Write version-controlled Supabase migration `001_initial_schema.sql`:
  - Enums (`user_role`, `provider_type`, `vehicle_type`, `verification_status`, `booking_status`, `payment_status`, `dispute_status`)
  - Tables: `profiles`, `provider_profiles`, `provider_documents`, `properties`, `property_permissions`, `parking_spaces`, `parking_space_photos`, `parking_space_amenities`, `availability_rules`, `provider_blocks`, `customer_vehicles`, `bookings`, `booking_price_lines`, `booking_status_events`, `payment_orders`, `payment_transactions`, `payment_webhook_events`, `refunds`, `financial_ledger_entries`, `commission_rules`, `provider_payout_accounts`, `provider_payouts`, `reviews`, `support_tickets`, `support_messages`, `disputes`, `audit_logs`, `cities`, `service_areas`
  - PostGIS geometry columns and spatial GIST indexes
  - Exclusion constraint / atomic check for overlapping bookings
  - Row Level Security (RLS) on all tables with explicit deny-by-default policies
  - Stored procedures / RPC functions: `check_space_availability`, `create_booking_hold`, `confirm_booking_payment`
- [ ] Write seed migration `002_ahmedabad_seed.sql` for Ahmedabad pilot locations (Prahlad Nagar, SG Highway, Bodakdev, Navrangpura, Sindhu Bhavan Road, Ashram Road)
- [ ] Implement Server-side Auth helpers (Login, Signup, Session, Logout, Role checks)
- [ ] Implement Auth UI pages: `/login`, `/register`, `/forgot-password`, `/verify`

---

### Phase 2: Public Marketplace, Discovery & Maps
- [ ] Brand theme and UI tokens (Teal `#176B5B`, Amber `#F2A541`, accessible surfaces)
- [ ] Navigation header (Visitor, Customer, Provider, Admin contextual links)
- [ ] Homepage with real destination search, 3-step value prop, Ahmedabad pilot areas, FAQs
- [ ] Marketing & policy pages (`/how-it-works`, `/list-your-space`, `/safety-and-trust`, `/terms`, `/privacy`, `/cancellation-policy`, `/help`, `/contact`)
- [ ] Search page (`/search`) with split layout:
  - Destination input (Ahmedabad landmarks, areas)
  - Date & time picker (Asia/Kolkata)
  - Vehicle filter (Car, Two-Wheeler)
  - Interactive map with custom price badges
  - Result list with real listing cards, distance, pricing, amenities
  - Empty state when no spaces match criteria
- [ ] Listing detail page (`/parking/[slug]`):
  - Photo gallery
  - Approximate location preview (exact directions hidden until booking confirmation)
  - Specifications (dimensions, height restriction, covered/open, EV charging)
  - Live availability calendar check
  - Transparent pricing breakdown (base rate + platform fee + tax calculation)
  - Real customer reviews (if completed)
  - Direct checkout trigger

---

### Phase 3: Provider Onboarding, Verification & Listing Management
- [ ] Provider portal layout (`/host`)
- [ ] Provider onboarding wizard (`/host/onboarding`):
  - Individual property owner vs Commercial operator
  - Identity verification info
  - Property ownership / Society allotment authority document upload
- [ ] Space listing creation wizard (`/host/spaces/new`):
  - Category, address, geo-coordinates
  - Dimensions, vehicle compatibility
  - Photos upload (validated MIME types)
  - Hourly, daily, monthly pricing
  - Availability schedules & recurring rules
  - Direct submission for Admin review
- [ ] Provider listing management (`/host/spaces`, `/host/spaces/[id]`)
- [ ] Provider calendar & block manager (`/host/calendar`)
- [ ] Verification status indicators: Draft, Submitted, Under Review, Approved, Rejected

---

### Phase 4: Availability Engine, Atomic Booking & Concurrency Protection
- [ ] Booking hold service: 10-minute temporary inventory reservation
- [ ] Double-booking prevention via PostgreSQL RPC and timestamp range constraints
- [ ] Server-side pricing calculation module (`lib/pricing/calculator.ts`):
  - Duration calculation with minimum billing rules
  - Platform commission calculation (configured rule)
  - Applicable GST / tax rules
  - Immutable price snapshot saved per booking
- [ ] Checkout step flow:
  1. Confirm duration & vehicle selection
  2. Review listing rules & access notes
  3. Review itemized pricing snapshot
  4. Create temporary booking hold
  5. Initialize payment order
  6. Atomic confirmation upon verified payment

---

### Phase 5: Payment Processing, Webhooks & Financial Ledger
- [ ] Razorpay checkout integration with INR currency and test-mode support
- [ ] Server-side order creation (`api/payments/create-order`)
- [ ] Raw-body HMAC-SHA256 signature verification for Razorpay webhooks (`api/webhooks/razorpay`)
- [ ] Idempotent webhook event logger (`payment_webhook_events`)
- [ ] Booking confirmation atomic workflow on `payment.captured`
- [ ] Automated release of expired holds
- [ ] Double-entry financial ledger records:
  - `CUSTOMER_PAYMENT` (Gross amount)
  - `PLATFORM_COMMISSION` (Disclosed platform fee)
  - `PROVIDER_PAYABLE` (Net amount due to provider)
  - `REFUND` / `CHARGEBACK` (Adjustment entries)
- [ ] Cancellation & refund calculations based on time-before-arrival policy

---

### Phase 6: Customer & Provider Operational Experiences
- [ ] Customer dashboard (`/account`):
  - Next confirmed booking card with navigation link & access code
  - Booking history tabs (Upcoming, Active, Completed, Cancelled)
  - Vehicle management (`/account/vehicles` - Car, Bike, number plate)
  - Payment receipts & invoices
  - Real review submission for completed bookings
  - Support ticket creation for active/past bookings
- [ ] Provider operational dashboard (`/host`):
  - Active listings, today's arrivals & departures
  - Booking management with customer vehicle plate for gate clearance
  - Real financial ledger: Gross bookings, Platform fees, Net earnings, Payout ledger
  - Payout bank account management

---

### Phase 7: Administrator Portal & Marketplace Operations
- [ ] Server-protected Admin layout (`/admin`) requiring `role = 'admin'`
- [ ] Operations dashboard (`/admin`) with real database metrics:
  - User counts, active listings, GMV, platform revenue, open disputes
- [ ] Verification Queue (`/admin/verifications`):
  - Review submitted identity & society authorization documents
  - Approve or reject with recorded reason and admin audit trail
- [ ] User & Provider management (`/admin/users`, `/admin/providers`)
- [ ] Listing management & suspension controls (`/admin/listings`)
- [ ] Booking operations & manual interventions (`/admin/bookings`)
- [ ] Financial operations & refund execution (`/admin/payments`, `/admin/refunds`)
- [ ] Support tickets & dispute arbitration (`/admin/disputes`, `/admin/support`)
- [ ] System audit logs viewer (`/admin/audit-logs`)

---

### Phase 8: Hardening, Automated Tests & Verification
- [ ] End-to-end integration tests:
  - Customer vehicle registration -> Search -> Booking hold -> Payment -> Confirmation
  - Overlapping concurrent booking rejection
  - Webhook replay idempotency
  - RLS role boundaries (Customer cannot read other customer's bookings; Provider cannot read other provider's payouts)
- [ ] Production build (`npm run build`) validation with zero TypeScript or Lint errors
- [ ] Responsive UI verification on Mobile (375px), Tablet (768px), and Desktop (1280px)
- [ ] Final launch readiness report
