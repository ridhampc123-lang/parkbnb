# DEPLOYMENT & PRODUCTION READINESS GUIDE

## 1. Hosting Architecture

- **Web Application / API:** Vercel, AWS ECS, or any standard Node.js runtime supporting Next.js 15 App Router.
- **Database & Storage:** Supabase Cloud (Managed PostgreSQL 15+ with PostGIS and pgvector extensions).
- **Payment Gateway:** Razorpay India (Production Merchant Account with UPI AutoPay / Route settlement).

---

## 2. Pre-Deployment Checklist

- [x] Database migration scripts created in `supabase/migrations/`:
  - `20261121000001_initial_schema.sql` (Tables, PostGIS indexes, RLS policies, RPC functions)
  - `20261121000002_ahmedabad_seed.sql` (Ahmedabad pilot service areas & commission rules)
- [x] TypeScript type checking and strict compiler flags enabled
- [x] Server-side session authentication with cookie isolation
- [x] Supabase Service-Role key restricted strictly to `src/lib/supabase/service-role.ts` (Never exposed to browser)
- [x] Truthful configuration detection banner implemented (`src/components/ui/status-banner.tsx`)
- [x] Razorpay raw-body HMAC-SHA256 webhook signature verification (`src/app/api/webhooks/razorpay/route.ts`)
- [x] Double-entry immutable financial ledger (`financial_ledger_entries`)
- [x] Database GiST exclusion constraint preventing overlapping bookings on identical spaces

---

## 3. Production Environment Variables Configuration

Populate the following variables in your production environment settings (e.g. Vercel Project Settings):

```env
NEXT_PUBLIC_APP_URL=https://your-domain.in
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your-live-razorpay-secret
RAZORPAY_WEBHOOK_SECRET=your-configured-webhook-secret
```

---

## 4. Database Migration Commands

Apply migrations using the Supabase CLI or the Supabase SQL Editor:
```bash
supabase db push
```
Or execute the SQL files in order:
1. `supabase/migrations/20261121000001_initial_schema.sql`
2. `supabase/migrations/20261121000002_ahmedabad_seed.sql`
