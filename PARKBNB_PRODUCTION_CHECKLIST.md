# PARKBNB — PRODUCTION READINESS & DEPLOYMENT RUNBOOK
**Document Reference:** `PARKBNB_PRODUCTION_CHECKLIST.md`  
**Version:** 2.0.0 (Production Verified)  
**Security Classification:** Operational Runbook  

---

## 1. Pre-Deployment Configuration Checklist

### 1.1 Environment Variables Validation
Ensure all environment variables are populated in production deployment environment (Vercel / AWS / Docker):

```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# Cryptographic Session Security (Minimum 64 Hex Characters)
SESSION_SECRET=c8f1a4e9b72045d6a8e312bc90fa7b49e1f582c6d37014ab59e8f2a1c0d4e7b6

# Razorpay Production Payment Gateway
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Platform Defaults
PLATFORM_COMMISSION_RATE=0.15
GST_RATE=0.18
TEMPORARY_HOLD_MINUTES=10
```

---

## 2. Database Migration Execution

1. Access Supabase SQL Editor.
2. Execute `supabase/complete_production_database_setup.sql`.
3. Verify all 12 tables exist:
   - `profiles`
   - `provider_profiles`
   - `properties`
   - `parking_spaces`
   - `customer_vehicles`
   - `booking_holds`
   - `bookings`
   - `availability_blocks`
   - `reviews`
   - `support_tickets`
   - `financial_ledger_entries`
   - `audit_logs`
   - `customer_data_access_logs`
   - `platform_settings`
4. Confirm Row Level Security (RLS) is ENABLED on every table.

---

## 3. Webhook Endpoint Registration

1. Navigate to Razorpay Dashboard ➔ Settings ➔ Webhooks.
2. Add Webhook URL: `https://parkbnb.in/api/webhooks/razorpay`.
3. Subscribe to Events:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
4. Set Secret to match `RAZORPAY_WEBHOOK_SECRET`.

---

## 4. Production Smoke Test Verification

Execute the following verification checklist immediately following deployment:

- [x] **Public Search:** Search for parking spaces in Ahmedabad without logging in (`/search`).
- [x] **Listing Detail:** Open a parking space detail page (`/parking/[slug]`) and verify dynamic rates, operating hours, and photo gallery.
- [x] **Customer Registration & Login:** Register a new driver (`/register`) and verify immediate authentication.
- [x] **Checkout & Hold:** Initiate booking and verify 10-minute hold is acquired in `booking_holds`.
- [x] **Pass Generation:** Confirm booking and verify interactive QR pass renders with "When In" / "When Out" buttons.
- [x] **Customer Vehicles:** Add and edit vehicle license plate in `/account/vehicles`.
- [x] **Customer Invoices:** Open `/account/payments` and print GST tax invoice.
- [x] **Customer Refunds:** Submit self-service refund request and verify in-app notification.
- [x] **Owner Onboarding:** Complete KYC wizard in `/host/onboarding` and verify submission status.
- [x] **Owner Calendar:** Schedule maintenance block in `/host/calendar` and verify collision rejection against confirmed bookings.
- [x] **Owner Reviews:** Reply to a customer review in `/host/reviews` and verify driver receives in-app alert.
- [x] **Admin Ledger:** View double-entry ledger in `/admin/payments` and verify credit/debit reconciliation.

---

## 5. Emergency Procedures

### 5.1 Emergency Maintenance Mode
If property sync or upstream payment services experience an outage:
1. Log into `/admin/settings` as `super_admin`.
2. Toggle **Emergency Maintenance Mode** to `ENABLED`.
3. The platform will immediately pause new bookings and inventory holds across the marketplace while keeping driver gate passes accessible for active check-outs.
