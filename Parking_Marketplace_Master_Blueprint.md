# PARKING MARKETPLACE — COMPLETE PRODUCT, BUSINESS & ENGINEERING MASTER SPECIFICATION

> **Purpose:** This document is the single source of truth for designing, building, testing, securing and preparing a real-world parking marketplace. Read this entire file before making architectural or implementation decisions. Build the complete product in phases, but preserve the end-to-end architecture from the beginning.
>
> **Working product description:** A two-sided marketplace that lets verified parking providers list legally usable, temporarily unused parking spaces and lets drivers discover, reserve and pay for those spaces by time period.
>
> **Initial market assumption:** Ahmedabad, Gujarat, India. Expand to other cities only after validating local supply, demand, permissions and unit economics.
>
> **Product principle:** Make finding and booking parking extremely simple for customers. Make listing and managing parking straightforward for owners. Give administrators strong operational control without exposing sensitive data.

---

# 0. NON-NEGOTIABLE INSTRUCTIONS FOR THE DEVELOPMENT AGENT

You are acting as a senior product architect, UX/UI designer, full-stack engineer, database engineer, security engineer, QA engineer and technical lead.

Build a production-minded application, not a visual prototype.

## 0.1 Mandatory rules

1. Read this document fully before implementation.
2. Inspect the existing repository before changing anything. Preserve working code and existing project conventions where they are sound.
3. Do not delete, overwrite or restructure existing user work without understanding its purpose and obtaining approval where destructive.
4. Do not use fake, mock, dummy, hardcoded or randomly generated business data in production-facing flows.
5. Do not create fake bookings, fake users, fake reviews, fake earnings, fake parking listings, fake analytics, fake payment records or fake verification states.
6. Empty database states must display useful empty states, not fabricated content.
7. Demo/seed data is permitted only in a clearly isolated local development environment, labelled as development data, and must never silently appear in production.
8. Every visible action must work. Do not ship buttons that do nothing, dead links, decorative controls pretending to be functional, or forms that do not save.
9. Do not claim a payment, booking, verification, payout, refund or notification succeeded until the backend/provider confirms it.
10. All permissions must be enforced server-side and at the database level. Hiding a button is not authorization.
11. Validate every input on the server. Treat browser input, query parameters, uploaded files and webhook payloads as untrusted.
12. Use database transactions and concurrency protection for booking and payment-critical operations.
13. Do not expose Supabase service-role keys, payment secrets, webhook secrets, private storage credentials or other secrets to browser code.
14. Do not put secrets in source control. Provide `.env.example` with names and explanations only.
15. Use real integrations where credentials are configured. When credentials are missing, implement a clear configuration state and safe development adapter; never pretend a live integration is working.
16. Do not skip security, accessibility, responsive design, error handling, loading states, testing or documentation.
17. Avoid unnecessary microservices, Kubernetes, Docker requirements or premature distributed architecture. Start with a modular monolith and clear domain boundaries.
18. Use current stable, mutually compatible package versions at implementation time. Do not blindly copy outdated versions from this document.
19. Never weaken Row Level Security or authorization to make a screen work.
20. Do not expose customer personal data, exact owner residential addresses, identity documents or private booking details to unauthorized users.

## 0.2 Required working method

Before coding:
- Inspect repository, framework, package manager, existing routes, components, environment setup and current database state.
- Identify what already works, what is incomplete and what is unsafe.
- Create `PROJECT_AUDIT.md` with findings and an implementation plan.
- Create or update `IMPLEMENTATION_PLAN.md` with phases, dependencies and acceptance criteria.
- Do not overwrite existing data or run destructive database commands without explicit approval.

During coding:
- Implement one coherent phase at a time.
- Run type checking, linting, tests and production builds after meaningful changes.
- Fix root causes, not just symptoms.
- Keep database migrations version-controlled.
- Maintain a clear changelog and update documentation.
- Never mark an unfinished item as complete.

At completion:
- Run the full test suite and production build.
- Perform security and authorization tests for every role.
- Provide a truthful completion report listing completed, incomplete, blocked and credential-dependent features.
- Include exact commands for local development, migrations, tests and deployment.
- Do not claim the system is production-ready if any critical blocker remains.

---

# 1. PRODUCT VISION

## 1.1 The problem

In busy urban areas, people spend time searching for parking while many private or commercial parking spaces remain unused for part of the day.

Examples:
- An apartment parking space is empty while its owner is at work.
- An office has unused spaces after business hours.
- A private property has available parking during selected time windows.
- A driver needs a convenient space near a hospital, office, market, restaurant, event venue or other destination.

The platform connects eligible parking providers with drivers and coordinates discovery, availability, reservations, payments, access instructions, support and provider settlement.

## 1.2 Value proposition

**For drivers:** Find a suitable, available parking space near a destination and reserve it before arriving.

**For parking providers:** Earn from legally usable parking capacity that would otherwise remain unused.

**For the platform:** Earn a disclosed commission or service fee for facilitating completed bookings and providing marketplace operations.

## 1.3 Product positioning

A trusted, easy-to-use parking marketplace — not merely a parking directory, static map or conventional parking lot management dashboard.

## 1.4 Initial assumptions to validate

Use these as configurable product assumptions, not as facts:
- Initial city: Ahmedabad.
- Initial pilot areas: a small number of selected neighbourhoods, chosen after field research.
- Providers: eligible residential/private spaces and commercial parking operators.
- Vehicles: cars and two-wheelers initially.
- Booking durations: hourly, daily, weekly and monthly, subject to listing-specific rules.
- Access: owner/security-managed entry initially; QR or automated access can be added later.
- Marketplace model: platform commission on eligible completed bookings.
- Initial customer experience: responsive web application/PWA; native apps are a later decision.

Do not publish unsupported claims about availability, security, legal permission, coverage or guaranteed owner income.

---

# 2. PRODUCT GOALS AND NON-GOALS

## 2.1 Goals

1. Make parking discovery possible by destination, map, area and time.
2. Show only genuinely bookable listings for the requested time and vehicle.
3. Prevent double bookings, including simultaneous booking attempts.
4. Provide clear total pricing before payment.
5. Provide trustworthy listing verification and transparent access instructions.
6. Allow providers to manage spaces, schedules, bookings and earnings.
7. Allow administrators to verify providers/listings and handle marketplace operations.
8. Process payments, cancellations, refunds and provider payouts with auditable records.
9. Protect personal data and enforce strict role and resource-level authorization.
10. Work smoothly on mobile, tablet and desktop.

## 2.2 Non-goals for the first release

Do not make these launch blockers:
- Native Android and iOS applications.
- Automated gate hardware integrations.
- AI dynamic pricing.
- Nationwide launch.
- Complex loyalty points.
- Social networking features.
- Unnecessary microservices.
- Cryptocurrency or cashless wallet balances.
- Automated identity verification that has not been legally and operationally reviewed.

---

# 3. USERS, ROLES AND PERMISSIONS

Use explicit role-based access control (RBAC), resource ownership checks and least privilege.

## 3.1 Roles

### Visitor
- Browse public pages.
- Search publicly discoverable listings.
- View approximate location and public listing details.
- Cannot view private owner details, exact access instructions, private booking data or internal documents.
- Must authenticate before booking.

### Customer
- Manage own profile and vehicles.
- Search and view available listings.
- Create and manage own bookings.
- Pay for own bookings.
- View own receipts and booking history.
- Request eligible cancellations/refunds.
- Submit reviews only for eligible completed bookings.
- Raise support requests and view own support conversations.
- Cannot see another customer's bookings, private information or payment records.

### Parking provider / owner
- Create and manage own provider profile.
- Submit verification information.
- Create and manage parking listings they own or are authorized to manage.
- Set prices, vehicle compatibility, availability and booking rules.
- View bookings associated with their own listings, with only the customer details needed to fulfil the booking.
- Manage access/check-in/check-out for their bookings.
- View own earnings, commission deductions and payout records.
- Cannot access another provider's listings, bookings, earnings or documents.
- Cannot approve their own verification or alter platform commission records.

### Operations staff (optional controlled role)
- Handle assigned listing verification, support tickets or disputes.
- Access only the minimum data needed for assigned work.
- Cannot manage super-admin accounts, platform secrets, global commission rules or unrestricted payouts unless explicitly granted.

### Administrator
- Manage users, providers, listings, bookings, disputes, support, approved operational settings and reporting.
- Approve/reject provider and listing verification with recorded reasons.
- Suspend listings/users under documented policy.
- Initiate authorized refunds or payout operations through controlled workflows.
- All sensitive actions must be audited.
- Admin role must not be assignable by public signup or by a normal user.

### Super administrator
- Manage administrator accounts and high-impact configuration.
- Access sensitive platform-level operations.
- Require strong authentication and additional confirmation for critical actions.
- Avoid routine use of super-admin privileges.

## 3.2 Authorization requirements

- Never trust a role sent by the browser.
- Determine identity from the authenticated server-side session/token.
- Verify resource ownership on every read and write.
- Use Supabase Row Level Security (RLS) for database access.
- Use server-side authorization helpers for application operations.
- Never allow a user to change their own role, verification status, commission, payout status or account privileges.
- Prevent insecure direct object reference (IDOR) vulnerabilities.
- Use deny-by-default policies.
- Add automated tests for every role/resource boundary.
- Record actor, action, resource, timestamp and safe metadata for privileged actions.

## 3.3 Account lifecycle

Support:
- Email/password or suitable secure sign-in.
- Phone OTP only after selecting and configuring a reliable SMS provider.
- Email verification.
- Password reset.
- Session revocation/logout.
- Account suspension and reactivation by authorized staff.
- Account deletion/deactivation workflow subject to legal, financial and audit retention requirements.
- Optional MFA for administrators and sensitive roles.

Do not imply phone OTP is configured until credentials and delivery have been tested.

---

# 4. INFORMATION ARCHITECTURE AND ROUTES

Use Next.js App Router. Keep public pages, authenticated experiences and admin operations clearly separated.

Suggested route structure (adapt to repository conventions):

```text
src/
  app/
    (marketing)/
      page.tsx
      how-it-works/page.tsx
      list-your-space/page.tsx
      safety-and-trust/page.tsx
      help/page.tsx
      contact/page.tsx
      terms/page.tsx
      privacy/page.tsx
      cancellation-policy/page.tsx
    (marketplace)/
      search/page.tsx
      parking/[slug]/page.tsx
    (auth)/
      login/page.tsx
      register/page.tsx
      forgot-password/page.tsx
      verify/page.tsx
    (customer)/
      account/layout.tsx
      account/page.tsx
      account/profile/page.tsx
      account/vehicles/page.tsx
      account/bookings/page.tsx
      account/bookings/[id]/page.tsx
      account/payments/page.tsx
      account/support/page.tsx
    (provider)/
      host/layout.tsx
      host/page.tsx
      host/onboarding/page.tsx
      host/verification/page.tsx
      host/spaces/page.tsx
      host/spaces/new/page.tsx
      host/spaces/[id]/page.tsx
      host/calendar/page.tsx
      host/bookings/page.tsx
      host/earnings/page.tsx
      host/payouts/page.tsx
      host/settings/page.tsx
    (admin)/
      admin/layout.tsx
      admin/page.tsx
      admin/users/page.tsx
      admin/providers/page.tsx
      admin/verifications/page.tsx
      admin/listings/page.tsx
      admin/bookings/page.tsx
      admin/payments/page.tsx
      admin/refunds/page.tsx
      admin/payouts/page.tsx
      admin/disputes/page.tsx
      admin/support/page.tsx
      admin/locations/page.tsx
      admin/pricing/page.tsx
      admin/reports/page.tsx
      admin/audit-logs/page.tsx
      admin/settings/page.tsx
    api/
      webhooks/
        razorpay/route.ts
  components/
    ui/
    marketing/
    marketplace/
    booking/
    provider/
    admin/
    maps/
  lib/
    auth/
    authorization/
    supabase/
    payments/
    maps/
    validation/
    pricing/
    booking/
    notifications/
    audit/
    rate-limit/
  server/
    actions/
    services/
    repositories/
  types/
  config/
  styles/
supabase/
  migrations/
  seed.sql
  tests/
docs/
```

This is a suggested organization, not a requirement to create every file before it is needed. Keep route groups and server-only code consistent with the installed Next.js version.

## 4.1 Navigation

Public desktop navigation:
- Logo
- Find Parking
- How It Works
- List Your Space
- Help
- Sign in
- Primary CTA: Find Parking

Mobile:
- Compact header with logo and clear account/menu access.
- Search should remain the most prominent action.
- Avoid overcrowded navigation.

After login:
- Customer: My Bookings, Vehicles, Profile, Support.
- Provider: Dashboard, Spaces, Calendar, Bookings, Earnings.
- Admin: Admin navigation only after server authorization.
- Never expose admin links to ordinary visitors.

---

# 5. UX/UI DESIGN SYSTEM

## 5.1 Design direction

Create a premium, modern, friendly mobility-tech product.

The experience should feel:
- Trustworthy.
- Calm.
- Clear.
- Fast.
- Modern.
- Practical.
- Accessible to non-technical users.

Avoid:
- Dark-heavy interfaces.
- Excessive gradients or neon colours.
- Generic AI-generated visual styling.
- Overly rounded everything.
- Huge empty hero areas.
- Tiny low-contrast text.
- Too many cards on one screen.
- Excessive animations.
- Cluttered maps.
- Fake ratings, fake badges or fake counters.
- Dense admin tables without filtering and hierarchy.

## 5.2 Suggested visual tokens

Use these as an initial design direction. Check contrast and adjust after implementation.

```css
:root {
  --background: #F7F9FC;
  --surface: #FFFFFF;
  --surface-muted: #F0F4F8;
  --foreground: #172033;
  --muted-foreground: #667085;
  --border: #E3E8EF;

  --primary: #176B5B;
  --primary-hover: #115648;
  --primary-soft: #E7F4F0;

  --accent: #F2A541;
  --accent-soft: #FFF4E2;

  --success: #16865B;
  --warning: #B7791F;
  --danger: #C43D4B;
  --info: #2867B2;

  --radius-card: 16px;
  --radius-control: 10px;
  --shadow-card: 0 4px 18px rgba(20, 35, 55, 0.06);
  --shadow-hover: 0 10px 28px rgba(20, 35, 55, 0.10);
}
```

Use a restrained teal/green primary with warm amber accents, neutral backgrounds and strong readable text. These colours are a starting point, not a reason to sacrifice accessibility.

## 5.3 Typography

- Use a modern readable sans-serif such as Geist, Inter or another licensed/available equivalent.
- Establish a clear type scale.
- Use readable body text, preferably around 15–16px on desktop.
- Do not use low-contrast grey for important instructions.
- Use tabular numerals for prices, time, counts and financial values.

## 5.4 Components

Create a consistent component library:
- Primary, secondary, tertiary and destructive buttons.
- Text inputs, selects, date/time controls and search fields.
- Accessible dialogs and confirmation dialogs.
- Toast notifications.
- Status labels with text and icon, not colour alone.
- Listing cards.
- Booking summary panel.
- Pricing breakdown.
- Availability calendar.
- Map/list switcher.
- Empty states.
- Skeleton loaders.
- Error states with retry where appropriate.
- Pagination.
- Search filters.
- Data tables with mobile alternatives.
- Accessible dropdowns and menus.

Buttons must show hover, focus, pressed, loading and disabled states.

## 5.5 Motion and feedback

Use subtle, purposeful transitions only:
- Short hover elevation.
- Smooth panel/dialog transitions.
- Loading skeletons.
- Clear booking progress.
- Success/failure feedback after confirmed server responses.

Respect reduced-motion preferences.

## 5.6 Accessibility

Target WCAG 2.2 AA where practical:
- Keyboard navigation.
- Visible focus indicators.
- Semantic headings and landmarks.
- Form labels and helpful validation.
- Accessible dialogs.
- Sufficient colour contrast.
- Screen-reader announcements for important state changes.
- Do not rely on colour alone.
- Useful alt text for listing images.

---

# 6. PUBLIC WEBSITE EXPERIENCE

## 6.1 Homepage

The homepage must explain the product immediately.

Suggested structure:
1. Compact, clear navigation.
2. Hero headline explaining parking discovery/reservation.
3. Destination search module.
4. Short supporting statement.
5. How it works in three steps.
6. Benefits for drivers.
7. Benefits for parking providers.
8. Trust and verification explanation.
9. Selected service areas only when actual supply exists.
10. FAQs.
11. Footer with legal, support and contact links.

Example headline direction:
**“Your parking spot, before you arrive.”**

Example supporting copy:
“Find and reserve available parking near the places you need to go.”

Do not display fake city coverage, fake available-space counts, fabricated testimonials or unsupported safety guarantees.

## 6.2 Destination search

The search module should allow:
- Destination, address or area.
- Arrival date.
- Start time.
- End time or duration.
- Vehicle type.
- Search action.

Mobile search must be easy to operate with one hand and must not require users to understand technical parking terminology.

## 6.3 Search results

Desktop:
- Map and listing results in a balanced split layout.
- Filters accessible without hiding the results.
- Clear selected-listing state.
- Search parameters remain visible and editable.

Mobile:
- List-first experience with an accessible map toggle.
- Filters in a bottom sheet or simple panel.
- No tiny map controls.
- Persistent booking/search context.

Filters:
- Price range.
- Distance from destination.
- Vehicle compatibility.
- Covered/uncovered.
- Indoor/outdoor/basement.
- EV charging only if verified.
- Height/size compatibility where relevant.
- Accessible parking only when accurately verified.
- Provider/listing verification status.
- Availability for selected time.

Sorting:
- Relevance.
- Distance.
- Price.
- Rating only when legitimate reviews exist.

Never rank by fake popularity.

## 6.4 Listing detail

Display:
- Real listing photos.
- Public display area/address approximation.
- Exact access location only after booking where appropriate.
- Parking type.
- Vehicle compatibility.
- Dimensions and height restrictions.
- Covered/uncovered status.
- Verified amenities.
- Availability calendar.
- Price and all applicable fees.
- Provider response/access rules.
- Cancellation policy.
- Genuine reviews from eligible completed bookings.
- Report listing action.

Do not expose private residential details unnecessarily before a confirmed booking.

## 6.5 Booking flow

Use a short, clear step sequence:
1. Confirm date and time.
2. Confirm vehicle.
3. Review listing rules.
4. Review complete price breakdown.
5. Authenticate if needed.
6. Accept relevant terms/policies.
7. Complete payment.
8. Display confirmed booking only after verified confirmation.

Show a clear progress indicator and allow the user to review before payment.

Do not ask for unnecessary profile information during checkout.

---

# 7. CUSTOMER PANEL

## 7.1 Customer dashboard

Show real data only:
- Next confirmed booking.
- Booking status.
- Recent bookings.
- Saved vehicles.
- Support requests.
- Payment/receipt links.

For a new customer, show a helpful empty state with a “Find parking” action.

## 7.2 Vehicles

Allow:
- Add vehicle.
- Vehicle type: car/two-wheeler.
- Registration number, stored and displayed carefully.
- Optional make/model/colour.
- Edit/remove vehicle.
- Select a vehicle for a booking.

Validate vehicle details. Avoid collecting unnecessary personal information.

## 7.3 Bookings

Tabs/filters:
- Upcoming.
- Active.
- Completed.
- Cancelled.
- Payment pending/failed where relevant.

Booking details:
- Booking reference.
- Listing and approved access instructions.
- Start/end time.
- Vehicle.
- Price breakdown.
- Payment status.
- Cancellation eligibility.
- Support/report issue action.
- Receipt.

Only show access instructions when appropriate for a confirmed booking.

## 7.4 Reviews

- Only customers with eligible completed bookings can review.
- One review per eligible booking unless policy allows a controlled edit.
- Prevent self-reviews and review manipulation.
- Allow moderation and reporting.
- Display review count only from real approved reviews.

---

# 8. PARKING PROVIDER EXPERIENCE

## 8.1 Provider onboarding

Steps:
1. Create account.
2. Enter provider contact details.
3. Select provider type: individual/private property or commercial operator.
4. Submit identity and authority/permission evidence as required.
5. Add property details.
6. Submit first parking space.
7. Accept provider agreement and applicable policies.
8. Wait for verification.
9. Receive an explicit approved/rejected/needs-more-information status.

Do not let an unverified listing become publicly bookable.

## 8.2 Legal authority and property permission

This marketplace must not assume that every apartment or society parking slot can be rented to outsiders.

Design verification workflows that distinguish:
- Independently controlled private parking.
- Parking allotted under property/society documents.
- Common areas or common parking.
- Commercially operated parking.
- Spaces managed under written authorization.

Require evidence of the legal right to offer the space and any required society/association/property-manager permissions.

Flag uncertain cases for manual legal/operations review. Do not give automated legal approval.

Obtain review from a qualified Gujarat property lawyer before launch. Platform terms must not imply that listing approval overrides property law, society rules or local regulations.

## 8.3 Listing creation

Required fields should be limited to what is needed:
- Listing title.
- Parking category.
- Property/provider reference.
- Location pin.
- Address (private fields protected).
- Vehicle types accepted.
- Dimensions and height restrictions if applicable.
- Covered/uncovered.
- Indoor/outdoor/basement.
- Photos.
- Entry/exit instructions.
- Availability.
- Pricing.
- Cancellation rules.
- Verification evidence.

Use a guided wizard with save-as-draft.

Photo uploads:
- Validate MIME type and actual file content.
- Limit file size and count.
- Re-encode/strip unsafe metadata where feasible.
- Use private storage for documents.
- Use separate public/controlled image storage rules.
- Never allow arbitrary executable uploads.
- Do not expose verification documents through public URLs.

## 8.4 Availability management

Support:
- One-time availability windows.
- Weekly recurring schedules.
- Blocked dates/times.
- Provider holidays.
- Existing booking visibility.
- Buffer time if configured.
- Minimum/maximum duration.
- Advance booking window.
- Same-day booking cut-off.
- Listing-specific booking increments.

All times must be stored consistently in UTC and presented in the listing's local time zone. For the initial Indian market, use `Asia/Kolkata` for local presentation, but keep timezone-aware implementation.

Availability must account for:
- Confirmed bookings.
- Temporary booking holds.
- Provider blocks.
- Listing status.
- Verification status.
- Buffer periods.
- Vehicle constraints.
- Minimum/maximum stay rules.

## 8.5 Provider dashboard

Real metrics:
- Active listings.
- Upcoming bookings.
- Current occupancy where supported.
- Gross booking value.
- Commission deductions.
- Net earnings.
- Payout status.
- Listing verification status.

Do not label gross booking value as provider earnings.

## 8.6 Provider earnings and payouts

Show a transparent ledger:
- Booking gross amount.
- Platform commission.
- Taxes/fees where applicable.
- Refund/adjustment.
- Net payable.
- Payout status.
- Payout reference.
- Settlement date.

Do not allow providers to edit their earnings or payout status.

---

# 9. ADMINISTRATION AND MARKETPLACE OPERATIONS

Admin is a critical operational product, not a decorative dashboard.

## 9.1 Admin dashboard

Show database-derived metrics only:
- Total registered customers.
- Total providers.
- Submitted/approved/rejected listings.
- Active bookable listings.
- Bookings by status.
- Completed booking GMV.
- Platform revenue/commission.
- Payment failures.
- Pending refunds.
- Pending payouts.
- Open disputes/support tickets.
- Operational alerts.

Every metric must have a clear definition and correct date range. Do not add unrelated numbers or fallback demo metrics.

## 9.2 User management

- Search/filter users.
- View permitted profile data.
- View role and account status.
- Suspend/reactivate with reason.
- Review user history as permitted.
- Do not expose password hashes, auth secrets or unnecessary sensitive data.
- Record administrative actions.

## 9.3 Provider/listing verification

Queue statuses:
- Draft.
- Submitted.
- Under review.
- More information required.
- Approved.
- Rejected.
- Suspended.
- Expired/reverification required.

Verification review should include:
- Identity/authority evidence.
- Property control/permission evidence.
- Listing photographs.
- Location consistency.
- Vehicle compatibility.
- Safety/access notes.
- Reviewer notes.
- Decision reason.
- Reviewer identity and timestamp.

Approval must be an explicit server-authorized action.

## 9.4 Booking operations

- Search by booking reference, listing, customer or provider.
- Filter by status/date/payment status.
- View booking timeline.
- View payment state.
- View cancellation/refund state.
- Handle access issues.
- Apply policy-based corrections through audited actions.
- Do not silently edit booking amounts or times after confirmation.

## 9.5 Payments, refunds and payouts

- Reconcile internal records with payment provider records.
- View webhook events and processing status.
- Handle failed/duplicate webhooks safely.
- Authorize refunds according to policy.
- Require additional confirmation for high-impact actions.
- Maintain immutable financial ledger entries.
- Track provider payout eligibility and settlement.
- Do not manually mark a payment as paid without verifiable evidence.

## 9.6 Disputes and support

Categories:
- Could not access parking.
- Space unavailable/occupied.
- Wrong listing information.
- Vehicle compatibility issue.
- Damage/security incident.
- Cancellation/refund.
- Payment issue.
- Other.

Support case fields:
- Case ID.
- Related booking.
- Reporter.
- Assigned agent.
- Category.
- Priority.
- Status.
- Messages.
- Evidence attachments.
- Resolution.
- Audit timeline.

Restrict evidence and messages to authorized participants and assigned staff.

## 9.7 Admin security

- Admin route protection on server.
- Admin role assigned only through a controlled trusted process.
- MFA strongly recommended and required for super-admin/high-impact operations.
- Rate-limit login and sensitive actions.
- Audit role changes, verification decisions, refunds, payouts and settings changes.
- Do not rely on client-side route guards.
- Never expose service-role credentials in admin browser bundles.

---

# 10. BOOKING ENGINE — CORE DOMAIN LOGIC

This is one of the most important engineering areas.

## 10.1 Booking states

Use an explicit state machine. Example states:
- `pending_payment`
- `confirmed`
- `active`
- `completed`
- `cancelled`
- `expired`
- `payment_failed`
- `refund_pending`
- `partially_refunded`
- `refunded`
- `disputed`

Define permitted transitions centrally. Do not allow arbitrary status updates from client forms.

## 10.2 Booking creation sequence

1. Authenticate the customer.
2. Validate listing is published, approved and active.
3. Validate provider is eligible.
4. Validate vehicle compatibility.
5. Validate start/end times and duration.
6. Validate listing booking rules.
7. Check for conflicts using a database-safe operation.
8. Calculate price on the server.
9. Create a temporary hold with expiry.
10. Create payment order with the payment provider.
11. Customer completes payment.
12. Verify webhook signature.
13. Verify payment/order relationship and amount.
14. Confirm booking atomically.
15. Send confirmation and access instructions.
16. Record ledger entries and audit events.

If payment fails or hold expires, release inventory safely.

## 10.3 Double-booking prevention

A frontend availability check is not enough.

Implement database-level concurrency protection. For PostgreSQL, evaluate a time-range/exclusion-constraint design for reservations on the same parking space, or a carefully locked transactional reservation procedure. Account for temporary holds and booking states.

Requirements:
- Two concurrent attempts for overlapping periods cannot both become confirmed.
- Expired holds stop blocking inventory after a reliable expiry process.
- A retry cannot create duplicate bookings or duplicate charges.
- Webhook retries are idempotent.
- Booking confirmation and payment state remain consistent.
- All times use a consistent timezone strategy.

Use database transactions, row/advisory locking or exclusion constraints as appropriate. Document the chosen design and test it under concurrent requests.

## 10.4 Pricing engine

Calculate server-side:
- Base hourly/daily/weekly/monthly price.
- Duration and billing increments.
- Minimum booking charge.
- Optional provider-defined fees if allowed.
- Platform service fee if applicable.
- Tax treatment as configured after professional advice.
- Discounts/coupons if valid.
- Refund/cancellation amount under policy.
- Final customer payable.
- Provider net amount.
- Platform commission.

Store a booking price snapshot so later listing price changes do not rewrite old booking amounts.

Do not hardcode tax assumptions. Obtain qualified Indian tax/accounting advice for GST, invoicing, marketplace operator obligations, TDS or other applicable rules before enabling real payments/payouts.

## 10.5 Extensions and overstay

Do not silently extend bookings.

For extension:
- Check availability for the additional period.
- Recalculate amount.
- Collect required additional payment.
- Confirm extension atomically.
- Notify provider and customer.

For overstay:
- Define transparent policy.
- Avoid arbitrary penalty charges.
- Record evidence and timestamps where supported.
- Provide a dispute path.
- Do not automatically charge a stored payment method without valid consent and provider support.

---

# 11. PAYMENTS, COMMISSION AND FINANCIAL RECORDS

## 11.1 Payment provider

Use Razorpay as the initial India-oriented payment gateway, subject to account approval, supported payment methods, current terms and required business verification.

Never store raw card data.

## 11.2 Payment workflow

- Create order server-side.
- Use the amount calculated by the backend.
- Link provider order to internal booking/payment record.
- Verify payment signature server-side where applicable.
- Verify webhook signatures using raw request body and secret.
- Store webhook event ID and process idempotently.
- Handle success, failure, timeout, duplicate and out-of-order events.
- Reconcile uncertain states with provider APIs.
- Do not trust a browser redirect as proof of payment.

## 11.3 Financial ledger

Maintain append-only financial records for:
- Customer payment.
- Platform commission.
- Provider payable.
- Refund.
- Partial refund.
- Adjustment.
- Payout.
- Chargeback/dispute where applicable.

Never use a mutable `balance` field as the sole source of financial truth. Derive balances from ledger entries or maintain a rigorously reconciled projection.

## 11.4 Commission

Commission should be configurable by authorized administrators:
- Default rate.
- Optional provider-specific rate only if business policy allows.
- Effective dates.
- Versioned changes.
- Clear display before booking.
- Snapshot applied to each booking.

Do not invent the final commission rate. Use a configurable initial value set only after founder approval and market validation.

## 11.5 Refunds and payouts

- Refund eligibility based on published cancellation policy.
- Refund request and provider status tracked separately from booking state.
- Idempotent refund execution.
- Payout eligibility after booking completion and dispute/hold rules.
- Provider KYC/bank verification before payouts as required by payment provider and applicable law.
- Payout reconciliation and failure handling.
- No fake payout completion.

---

# 12. DATABASE DESIGN — SUPABASE POSTGRESQL

Use PostgreSQL as the relational source of truth.

Use Supabase for:
- Managed PostgreSQL.
- Authentication.
- Storage.
- Realtime for suitable user-facing updates.
- Row Level Security.

Use PostGIS where geographic queries materially benefit from it. Use proper indexes and query plans.

## 12.1 Suggested entities

Design normalized schemas and foreign keys. Names can be adapted, but preserve the relationships and security requirements.

### Identity and access
- `profiles`
- `user_roles` or a secure role field managed only by trusted server/admin operations
- `admin_assignments` if granular admin scopes are required
- `user_sessions` only if needed beyond Supabase Auth
- `consents`

### Providers and properties
- `provider_profiles`
- `provider_verification_submissions`
- `provider_documents`
- `properties`
- `property_permissions`
- `parking_spaces`
- `parking_space_photos`
- `parking_space_amenities`
- `parking_space_vehicle_types`

### Availability
- `availability_rules`
- `availability_exceptions`
- `provider_blocks`
- `booking_holds`
- `space_reservations`

### Customers and vehicles
- `customer_vehicles`
- `saved_listings` if included

### Bookings and pricing
- `bookings`
- `booking_price_lines`
- `booking_status_events`
- `booking_access_events`
- `booking_extensions`

### Payments and finance
- `payment_orders`
- `payment_transactions`
- `payment_webhook_events`
- `refunds`
- `financial_ledger_entries`
- `commission_rules`
- `provider_payout_accounts`
- `provider_payouts`
- `payout_items`

### Trust and operations
- `reviews`
- `support_tickets`
- `support_messages`
- `disputes`
- `incident_reports`
- `notifications`
- `audit_logs`
- `platform_settings`
- `cities`
- `service_areas`

## 12.2 Data rules

- UUID primary keys unless a well-justified alternative exists.
- Foreign keys and appropriate delete behavior.
- `created_at` and `updated_at` timestamps.
- Use UTC timestamps for instants.
- Use explicit local timezone identifiers where recurring schedules require them.
- Use numeric/decimal types for money, never floating point.
- Store currency explicitly (initially INR).
- Use check constraints for valid amounts and statuses where suitable.
- Add indexes for common filters and joins.
- Add unique constraints for idempotency keys and provider references.
- Keep audit/financial records append-only where appropriate.
- Soft-delete only when there is a valid retention reason; otherwise use explicit lifecycle status.
- Avoid storing duplicate data unless it is a deliberate, documented snapshot.

## 12.3 Geographic data

Store precise coordinates securely for operational use. Public search results may expose an approximate location until booking confirmation, depending on listing policy.

Use geographic indexes for nearby search. Never return private residential coordinates or exact address to arbitrary visitors if doing so creates privacy or safety risk.

## 12.4 RLS policy requirements

Enable RLS on every table accessible through Supabase client APIs.

Policies must ensure:
- Public can read only approved, published, safe-to-display listing fields.
- Customers can read/update only their own profile, vehicles, bookings, payments and support data.
- Providers can manage only their own provider profile, properties, spaces, schedules and related records.
- Providers can see only bookings associated with their own spaces and only necessary customer information.
- Customers cannot read provider verification documents.
- Providers cannot read another provider's documents, listings or payouts.
- Admin operations use secure, explicitly authorized server-side pathways.
- Service-role access remains server-only and is used sparingly.
- Role claims cannot be self-assigned by users.
- Storage object policies enforce ownership and access.
- No broad `USING (true)` policy on sensitive tables.

Write RLS tests for every role and sensitive table. Document each policy.

---

# 13. SUPABASE ARCHITECTURE AND CONFIGURATION

## 13.1 Client separation

Create separate modules for:
- Browser Supabase client.
- Server Supabase client using the authenticated request/session.
- Trusted service-role client, server-only, for narrowly scoped administrative operations that cannot safely run under user RLS.

Never import the service-role module into client components.

## 13.2 Environment variables

Create `.env.example` with placeholders only, such as:

```env
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

GOOGLE_MAPS_API_KEY=
MAP_PROVIDER=

EMAIL_PROVIDER=
EMAIL_API_KEY=
EMAIL_FROM=

SMS_PROVIDER=
SMS_API_KEY=

CRON_SECRET=
```

Use the current Supabase publishable/secret key conventions if applicable at implementation time. Document which variables are browser-safe and which are server-only. Never expose a secret key with a `NEXT_PUBLIC_` prefix.

## 13.3 Database migrations

- All schema changes must be version-controlled in `supabase/migrations`.
- Avoid manual production schema changes that are not captured in migrations.
- Review migrations before applying.
- Back up production data before risky changes.
- Never run destructive reset commands against production.
- Use separate local/development/staging/production environments.
- Test migrations against a disposable development database first.

## 13.4 Realtime

Use Realtime only for appropriate events:
- Booking status updates.
- Provider booking alerts.
- Availability refreshes.
- Support message updates.
- Admin operational alerts.

Do not broadcast private information to public channels. Authorize private channels and still verify data access on the server. Realtime is an update mechanism, not the source of truth.

---

# 14. MAPS AND LOCATION SEARCH

Use Google Maps Platform or Mapbox after comparing current pricing, terms, geographic quality and required features.

Required:
- Destination autocomplete.
- Map display.
- Listing markers.
- Search by coordinates/area.
- Distance calculation.
- Directions/navigation link after booking.
- Geocoding/reverse geocoding where permitted.
- Rate limits and API key restrictions.

Security:
- Restrict browser map keys by domain/API.
- Keep server-only keys private.
- Do not expose unnecessary exact provider addresses.
- Avoid excessive map API calls.
- Debounce autocomplete.
- Cache permitted geocoding/search responses.
- Respect provider terms and attribution requirements.

Search must use actual available listings and booking time constraints, not merely map proximity.

---

# 15. NOTIFICATIONS AND COMMUNICATIONS

Channels may include email, SMS and WhatsApp, subject to provider configuration, consent, Indian messaging rules and template approvals.

Events:
- Account verification.
- Provider verification submitted/approved/rejected.
- Listing approved/rejected.
- Booking hold created.
- Payment confirmed/failed.
- Booking confirmed/cancelled.
- Upcoming booking reminder.
- Provider new booking alert.
- Booking start/end reminder.
- Refund update.
- Payout update.
- Support response.
- Dispute update.

Requirements:
- Store notification status.
- Retry transient failures safely.
- Avoid duplicate messages.
- Use templates.
- Do not include sensitive documents or unnecessary personal data in messages.
- Respect notification preferences and applicable consent rules.
- Provide an in-app notification centre if included.

---

# 16. SECURITY REQUIREMENTS

Apply defence in depth.

## 16.1 Application security
- Secure authentication and session handling.
- Server-side authorization on every protected operation.
- Input validation with a schema library such as Zod.
- Output minimization.
- CSRF protection where applicable to the chosen auth/session architecture.
- XSS prevention; avoid unsafe HTML rendering.
- SQL injection protection through parameterized queries.
- Rate limiting on authentication, booking, search and sensitive operations.
- Secure headers and appropriate Content Security Policy.
- Safe error messages; no stack traces or secrets to users.
- No sensitive data in URLs, logs or analytics.
- Protect against IDOR and mass assignment.
- Avoid trusting hidden form fields.
- Re-authentication/step-up checks for high-risk actions.

## 16.2 Supabase security
- RLS enabled and tested.
- No service-role key in client bundle.
- Storage policies.
- Secure Auth redirect allowlist.
- Correct production site URL.
- MFA for administrators.
- No user-controlled role escalation.
- Audit privileged changes.

## 16.3 Payments
- Verify webhook signatures.
- Idempotency.
- Amount/currency verification.
- Reconcile provider records.
- Never trust client payment status.
- Never store card data.
- Log provider event identifiers safely.

## 16.4 File uploads
- File type and size validation.
- Private buckets for sensitive documents.
- Short-lived signed URLs when needed.
- Access checks on every document request.
- Safe image processing.
- Malware scanning where available/appropriate.
- No executable uploads.
- No public access to identity/property permission documents.

## 16.5 Privacy and compliance
- Collect only necessary personal data.
- Publish a clear privacy policy.
- Define data retention and deletion.
- Obtain consent where required.
- Provide access/correction/deletion processes where legally applicable.
- Review applicable Indian data protection, consumer protection, e-commerce, payment, tax and local property/society requirements with qualified professionals.
- Do not claim legal compliance without review.
- Maintain incident response and breach escalation procedures.

## 16.6 Threat model

Explicitly test:
- Customer accessing another customer's booking.
- Provider accessing another provider's listing or payout.
- Unverified provider publishing a listing.
- User changing own role to admin.
- Browser manipulating price/commission.
- Duplicate payment webhooks.
- Concurrent double booking.
- Expired hold being confirmed.
- Forged payment success redirect.
- Unauthorized refund/payout.
- Public access to private documents.
- Enumeration of booking IDs or private addresses.
- Malicious upload.
- Brute-force login/OTP.
- Admin account compromise.

---

# 17. PERFORMANCE, SCALABILITY AND RELIABILITY

Start with a modular monolith. Keep domain modules separated so scaling is possible without premature complexity.

## 17.1 Performance

- Use Server Components by default.
- Use Client Components only for interactivity.
- Avoid unnecessary client-side JavaScript.
- Use image optimization and responsive image sizes.
- Lazy-load map and heavy modules.
- Paginate large tables.
- Index real query patterns.
- Avoid N+1 queries.
- Debounce search.
- Cache public, non-sensitive content carefully.
- Do not cache private customer/provider data across users.
- Use loading skeletons and progressive rendering.
- Monitor slow queries and failed requests.

## 17.2 Reliability

- Database backups and tested restore procedure.
- Migration rollback/recovery plan.
- Payment reconciliation.
- Webhook retry handling.
- Scheduled cleanup of expired holds.
- Notification retry queue or reliable provider mechanism.
- Error monitoring.
- Structured logs with request/correlation IDs.
- Health checks.
- Operational alerts for failed payment processing and stuck bookings.

## 17.3 Background work

Use Supabase scheduled functions/cron or a suitable managed job service for:
- Expiring holds.
- Sending reminders.
- Reconciliation.
- Notification retries.
- Payout eligibility checks.
- Cleaning temporary files.

Secure all scheduled endpoints with secrets and idempotent job logic. Do not rely on a browser tab or local timer for critical jobs.

---

# 18. SEARCH, DISCOVERY AND MARKETPLACE QUALITY

Search ranking should be transparent and based on relevant signals:
1. Availability for the requested time.
2. Vehicle compatibility.
3. Distance to destination.
4. Total price.
5. Listing quality/completeness.
6. Verified status.
7. Genuine reviews once sufficient data exists.

Do not create artificial popularity or fabricated ratings.

Search must:
- Validate input.
- Support pagination.
- Filter out unpublished, suspended, unverified or unavailable spaces.
- Account for overlapping reservations and holds.
- Return only public-safe fields.
- Avoid leaking exact private addresses before booking.
- Handle no-results states with useful suggestions such as changing time or radius.

---

# 19. BUSINESS MODEL AND OPERATING RULES

## 19.1 Revenue model

Initial model: disclosed commission on eligible bookings.

Later possibilities:
- Corporate parking plans.
- Commercial operator subscriptions.
- Parking management software.
- Featured listings only if clearly labelled and not misleading.
- Enterprise partnerships.

Do not implement multiple monetization methods before validating the first.

## 19.2 Marketplace operations

The business needs real processes for:
- Provider acquisition.
- Property permission checks.
- Listing verification.
- Customer support.
- Access failure.
- Cancellations.
- Refunds.
- Damage/security reports.
- Fraud prevention.
- Provider payout reconciliation.

## 19.3 Marketplace metrics

Track:
- Active verified spaces.
- Search-to-booking conversion.
- Completed bookings.
- Booking GMV.
- Platform commission revenue.
- Occupancy by space/time.
- Repeat customer rate.
- Provider retention.
- Cancellation rate.
- Payment failure rate.
- Support incidents per booking.
- Customer acquisition cost.
- Contribution margin.

Every metric must have a documented definition and source query. Do not mix GMV, platform revenue and provider earnings.

---

# 20. LEGAL, PROPERTY AND MARKET VALIDATION CHECKLIST

This is a product risk area and must be addressed before public launch.

- Obtain advice from a qualified Gujarat property lawyer on which categories of spaces can lawfully be offered.
- Review apartment/society bye-laws, allotment documents and permissions.
- Do not treat common parking as individually rentable without the necessary legal authority/permissions.
- Review property owner/operator authority and written agreements.
- Define platform role, provider role and customer responsibilities clearly.
- Review consumer protection and e-commerce obligations.
- Review privacy/data protection requirements.
- Review GST, invoicing, marketplace commission, TDS and payout treatment with a qualified Indian CA/tax professional.
- Review Razorpay marketplace/settlement capabilities and onboarding requirements.
- Review insurance and liability allocation for vehicle damage, theft, access and third-party incidents.
- Publish accurate cancellation, refund, dispute and support policies.
- Do not claim that the platform guarantees vehicle security unless the operating model and insurance support that claim.

The development agent must create a `LEGAL_AND_OPERATIONS_OPEN_ITEMS.md` listing items requiring founder/lawyer/CA/payment-provider confirmation. Do not invent legal conclusions.

---

# 21. TESTING STRATEGY AND ACCEPTANCE CRITERIA

Use unit, integration, end-to-end, security and manual testing.

## 21.1 Unit tests
Test:
- Pricing calculations.
- Commission calculations.
- Duration rules.
- Cancellation/refund calculations.
- Booking state transitions.
- Availability interval calculations.
- Vehicle compatibility.
- Validation schemas.
- Permission helper functions.

## 21.2 Integration tests
Test:
- Supabase queries and RLS.
- Booking creation.
- Concurrent booking attempts.
- Hold expiry.
- Payment webhook verification.
- Duplicate webhook handling.
- Refund flow.
- Provider earnings ledger.
- Storage access policies.
- Notifications.

## 21.3 End-to-end tests
Test complete journeys:
1. Visitor searches parking.
2. Customer signs up and verifies account.
3. Customer adds vehicle.
4. Customer books a verified listing.
5. Payment succeeds and booking confirms.
6. Customer sees booking and access instructions.
7. Provider sees the booking.
8. Provider marks check-in/check-out where supported.
9. Booking completes.
10. Financial records update.
11. Eligible review can be submitted.
12. Customer raises a support case.
13. Admin handles verification and support.

Also test cancellation, payment failure, refund, expired hold and simultaneous booking attempts.

## 21.4 Security tests

For every role:
- Attempt access to another user's resources.
- Attempt role escalation.
- Attempt direct API calls without permission.
- Attempt to access private storage objects.
- Attempt price/commission manipulation.
- Attempt to confirm an unavailable space.
- Attempt duplicate payment/refund operations.

Expected result: unauthorized requests are rejected server-side and do not mutate data.

## 21.5 UX tests

- Test at common mobile widths.
- Test slow network.
- Test no listings.
- Test empty account.
- Test invalid form.
- Test loading and retry states.
- Test keyboard-only navigation.
- Test long addresses and long provider/listing names.
- Test time-zone and date-boundary behaviour.

## 21.6 Definition of done

A feature is done only when:
- UI is complete and responsive.
- Server-side validation exists.
- Authorization exists and is tested.
- Database constraints/migrations exist where required.
- Loading, empty, success and failure states exist.
- Tests pass.
- No mock production data exists.
- Documentation is updated.
- It works against the real configured backend.

---

# 22. DEVELOPMENT PHASES

Build in this order. Do not jump to visual polish while core architecture and security are broken.

## Phase 0 — Repository audit and product setup
Deliver:
- Repository audit.
- Architecture decision record.
- Route plan.
- Environment variable documentation.
- Implementation plan.
- Risk/open-items list.
- Design tokens and component plan.

Acceptance:
- Existing code understood.
- No destructive change.
- Clear build plan approved.

## Phase 1 — Foundation
Build:
- Next.js App Router foundation.
- TypeScript.
- Tailwind and component system.
- Supabase client separation.
- Environment validation.
- Logging/error handling.
- Authentication.
- Profiles and role model.
- RLS and initial migrations.
- Protected route/server authorization helpers.

Acceptance:
- Sign-up/sign-in/session/logout works.
- Role escalation is impossible.
- RLS tests pass.
- No secret appears in client bundle.

## Phase 2 — Public marketplace and discovery
Build:
- Homepage.
- How-it-works pages.
- Search form.
- Map/list results.
- Filters.
- Listing detail.
- Responsive mobile UX.
- Empty/loading/error states.

Acceptance:
- Search results come from actual approved listings.
- No fake listing data.
- Private fields are not exposed.
- Search filters are functional.

## Phase 3 — Provider onboarding and listings
Build:
- Provider profile.
- Verification submission.
- Property/permission records.
- Listing wizard.
- Photo upload.
- Pricing.
- Availability rules.
- Provider dashboard.

Acceptance:
- Unverified spaces cannot be publicly booked.
- Providers can access only their own resources.
- Private documents are protected.
- Listing lifecycle works.

## Phase 4 — Availability and booking engine
Build:
- Availability service.
- Holds.
- Database conflict protection.
- Booking state machine.
- Server-side pricing.
- Booking summaries.
- Booking history.

Acceptance:
- Overlapping concurrent reservations cannot both confirm.
- Expired holds release capacity.
- Price is calculated server-side.
- State transitions are controlled.

## Phase 5 — Payments and financial system
Build:
- Razorpay integration.
- Payment orders.
- Signature/webhook verification.
- Idempotency.
- Booking confirmation.
- Refund workflow.
- Commission calculation.
- Financial ledger.
- Provider payout records.

Acceptance:
- Browser redirect alone cannot confirm payment.
- Duplicate webhooks do not duplicate records/charges.
- Financial values reconcile.
- No false payment/payout status.

## Phase 6 — Customer and provider operations
Build:
- Customer dashboard.
- Vehicle management.
- Booking management.
- Provider calendar.
- Check-in/check-out workflow where supported.
- Earnings and payout views.
- Notifications.
- Support requests.

Acceptance:
- All information is scoped to the correct user/provider.
- Every action is functional.
- No unauthorized data access.

## Phase 7 — Admin and support operations
Build:
- Admin dashboard.
- Verification queue.
- User/provider management.
- Listing management.
- Booking operations.
- Payment/refund/payout operations.
- Support/disputes.
- Audit logs.
- Reports.

Acceptance:
- Admin-only server authorization works.
- High-impact actions require confirmation and audit.
- Metrics use real database queries.
- Staff permissions are scoped.

## Phase 8 — Hardening and pilot readiness
Build/perform:
- Security review.
- RLS review.
- Payment reconciliation tests.
- Performance checks.
- Accessibility checks.
- Backup/restore test.
- Error monitoring.
- Production environment setup.
- Legal/operational checklist.
- Manual end-to-end pilot checklist.

Acceptance:
- No unresolved critical/high security issues.
- Payment and booking flows pass.
- Legal and operational blockers are clearly identified.
- Founder receives a truthful launch readiness report.

## Phase 9 — Expansion
Only after pilot evidence:
- Native apps.
- Corporate plans.
- More cities.
- EV charging.
- Automated access.
- Advanced analytics.
- Dynamic pricing if justified.

---

# 23. DEPLOYMENT AND ENVIRONMENTS

Use separate:
- Local development.
- Staging.
- Production.

Suggested hosting:
- Next.js: Vercel or a suitable managed Node hosting provider.
- Supabase: managed project with backups and production settings.
- Domain/DNS: configured securely.
- Maps/payment/email/SMS: separate credentials per environment.

Before production:
- Configure exact production URLs and Auth redirects.
- Restrict map API keys.
- Configure payment live mode only after account verification and end-to-end testing.
- Configure webhook URLs and secrets.
- Configure email domain authentication (SPF/DKIM/DMARC where applicable).
- Configure rate limiting and security headers.
- Configure monitoring and alerts.
- Verify backups and recovery.
- Ensure no development seed data is present.
- Run migrations using the documented process.
- Run smoke tests.

Never copy development secrets into production.

---

# 24. REQUIRED PROJECT DOCUMENTATION

Maintain these documents:
- `README.md` — project overview and setup.
- `PROJECT_AUDIT.md` — repository findings.
- `IMPLEMENTATION_PLAN.md` — phase tracking.
- `ARCHITECTURE.md` — system architecture and boundaries.
- `DATABASE_SCHEMA.md` — entities, relations and indexes.
- `RLS_SECURITY.md` — table policies and authorization matrix.
- `BOOKING_ENGINE.md` — availability, holds and concurrency model.
- `PAYMENTS_AND_LEDGER.md` — payment, commission, refund and payout flows.
- `ENVIRONMENT_SETUP.md` — environment variables and provider setup.
- `DEPLOYMENT.md` — staging/production deployment.
- `TESTING.md` — test commands and coverage.
- `LEGAL_AND_OPERATIONS_OPEN_ITEMS.md` — matters requiring professional/founder decisions.
- `CHANGELOG.md` — meaningful implementation changes.

Keep documentation consistent with actual code. Do not describe unimplemented features as complete.

---

# 25. FINAL ACCEPTANCE CHECKLIST

The product is not complete merely because the homepage looks good.

## Public experience
- [ ] Responsive homepage and public pages.
- [ ] Functional destination search.
- [ ] Real map/list results.
- [ ] Functional filters and sorting.
- [ ] Real listing details.
- [ ] No fake reviews or coverage claims.
- [ ] Accessible and clear UI.

## Customer
- [ ] Secure account.
- [ ] Profile and vehicle management.
- [ ] Real booking creation.
- [ ] Verified payment.
- [ ] Booking details and access information.
- [ ] Cancellation/refund workflow.
- [ ] Support and eligible reviews.

## Provider
- [ ] Secure provider onboarding.
- [ ] Verification workflow.
- [ ] Permission/authority evidence.
- [ ] Listing creation and management.
- [ ] Real availability calendar.
- [ ] Booking management.
- [ ] Earnings and payout records.
- [ ] Provider data isolation.

## Admin
- [ ] Server-protected admin access.
- [ ] Verification management.
- [ ] User/provider/listing management.
- [ ] Booking/payment/refund/payout operations.
- [ ] Disputes/support.
- [ ] Real analytics.
- [ ] Audit logs.
- [ ] No privilege escalation.

## Backend and security
- [ ] PostgreSQL schema and migrations.
- [ ] RLS enabled and tested.
- [ ] Server-side authorization.
- [ ] No exposed secrets.
- [ ] Booking concurrency protection.
- [ ] Payment webhook idempotency.
- [ ] Financial ledger.
- [ ] Secure file storage.
- [ ] Rate limiting and input validation.
- [ ] Backups and monitoring.

## Launch
- [ ] Legal/property permission review.
- [ ] Tax/accounting review.
- [ ] Payment provider approval.
- [ ] Real supply and customer pilot.
- [ ] Support operations ready.
- [ ] Production smoke tests.
- [ ] Launch readiness report.

---

# 26. FINAL INSTRUCTIONS TO ANTIGRAVITY

Build this as a cohesive, production-minded parking marketplace with a simple customer experience and a powerful, secure backend.

Prioritise in this order:

1. Correct business rules and legally eligible parking supply.
2. Secure identity, role and resource authorization.
3. Accurate availability and double-booking prevention.
4. Correct payment, refund, commission and payout accounting.
5. Simple customer discovery and booking UX.
6. Usable provider tools.
7. Strong admin operations.
8. Performance, accessibility and visual refinement.

Do not generate a large collection of disconnected pages. Every panel must use the same real backend and consistent domain logic.

Do not add fake data to make the interface look populated. Build meaningful empty states and test fixtures isolated from production.

Do not silently make legal, financial, commission, cancellation or insurance decisions. Keep these configurable and list unresolved decisions for the founder and qualified professionals.

If a third-party integration cannot be completed because credentials or account approval are missing:
- Implement the correct integration boundary.
- Provide setup instructions.
- Display a truthful unavailable/configuration state.
- Do not simulate a successful live transaction.

Start by auditing the existing repository, then create the project plan and architecture documents. Proceed phase by phase, test each phase, and keep this specification updated when an approved decision changes.

**The final deliverable must be a working, tested, secure and documented product — not just a beautiful UI.**
