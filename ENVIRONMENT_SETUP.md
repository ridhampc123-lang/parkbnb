# ENVIRONMENT SETUP AND CONFIGURATION GUIDE

This document lists all environment variables, their purpose, scope, and instructions for local and production deployment.

## 1. Environment Variable Reference

| Variable | Scope | Required | Purpose & Format |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Public / Browser | Yes | Root URL of application (e.g. `http://localhost:3000` or `https://parkbnb.in`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Browser | Yes | Supabase project API URL (e.g. `https://xyzproject.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Browser | Yes | Supabase public anonymous API key for client queries governed by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Only | Yes | Supabase private administrative key for webhook processing & system RPCs |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public / Browser | Yes | Razorpay publishable Key ID for client checkout modal (`rzp_test_...` or `rzp_live_...`) |
| `RAZORPAY_KEY_SECRET` | Server-Only | Yes | Razorpay private secret key for order generation |
| `RAZORPAY_WEBHOOK_SECRET` | Server-Only | Yes | Secret string configured in Razorpay dashboard for HMAC-SHA256 signature verification |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`| Public / Browser | Optional | Google Maps JavaScript API key restricted by HTTP referrers (Leaflet used if absent) |
| `EMAIL_PROVIDER_API_KEY` | Server-Only | Optional | Resend or Postmark API key for transactional emails |
| `EMAIL_FROM` | Server-Only | Optional | Verified sender address (e.g. `notifications@parkbnb.in`) |
| `CRON_SECRET` | Server-Only | Optional | Bearer secret protecting automated hold expiry and reconciliation endpoints |

---

## 2. Truthful Configuration State Behavior

In accordance with rule 0.1.15 of the specification:
- If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set, the application renders a prominent banner and operational setup view explaining that database connection credentials are required, directing the administrator or developer to configure `.env.local`.
- If Razorpay credentials are not set or in test mode, the checkout interface clearly reports the payment gateway configuration status.
- Zero fake or simulated live transactions are reported to the user.
