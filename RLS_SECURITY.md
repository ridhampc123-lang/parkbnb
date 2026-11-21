# ROW LEVEL SECURITY (RLS) & ACCESS CONTROL SPECIFICATION

## 1. Security Tenets

1. **Deny by Default:** `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;` is executed on every table without exception. Tables with no explicit policy permit zero client access.
2. **Server-Side Session Validation:** Client-supplied role headers or parameters are discarded. Authorization queries use `auth.uid()` and verified JWT claims.
3. **Admin Privilege Isolation:** Admin actions run through server actions that verify `profiles.role IN ('admin', 'super_admin')` or via narrow service-role RPCs. Service-role credentials never reach the browser.
4. **Least Privilege Data Exposure:** Search queries on `parking_spaces` and `properties` return approximate coordinates (`ST_SnapToGrid`) and general vicinity names; exact slot directions and contact numbers are only accessible after booking confirmation.

---

## 2. Table-by-Table Policy Matrix

| Table | Role | Operation | Permitted Scope / Using Condition |
| :--- | :--- | :--- | :--- |
| **`profiles`** | Public / Anon | None | Denied |
| | Authenticated | SELECT | `auth.uid() = id` (or if admin) |
| | Authenticated | UPDATE | `auth.uid() = id` (Role column change blocked by trigger) |
| **`provider_profiles`** | Authenticated | SELECT | `auth.uid() = id` (or if admin) |
| | Authenticated | INSERT | `auth.uid() = id` |
| | Authenticated | UPDATE | `auth.uid() = id AND verification_status IN ('draft', 'more_info_needed')` |
| **`provider_documents`**| Authenticated | SELECT | `provider_id = auth.uid() OR is_admin()` |
| | Authenticated | INSERT | `provider_id = auth.uid()` |
| | Customer / Anon | ANY | Strictly Denied |
| **`properties`** | Public / Anon | SELECT | Only properties linked to `approved` and `active` spaces |
| | Provider | ALL | `provider_id = auth.uid()` |
| **`parking_spaces`** | Public / Anon | SELECT | `status = 'approved' AND is_active = true` (Safe public fields only) |
| | Provider | ALL | `provider_id = auth.uid()` |
| **`customer_vehicles`** | Customer | ALL | `customer_id = auth.uid()` |
| **`booking_holds`** | Customer | SELECT, INSERT| `customer_id = auth.uid()` |
| | Provider | SELECT | `space_id IN (SELECT id FROM parking_spaces WHERE provider_id = auth.uid())` |
| **`bookings`** | Customer | SELECT | `customer_id = auth.uid()` |
| | Provider | SELECT | `provider_id = auth.uid()` (Customer personal info redacted except vehicle plate) |
| | Admin | ALL | `is_admin()` |
| **`financial_ledger_entries`** | Customer | None | Denied |
| | Provider | SELECT | Filtered entries where `credit_account = auth.uid() OR debit_account = auth.uid()` |
| | Admin | SELECT | `is_admin()` |
| **`reviews`** | Public | SELECT | `is_approved = true` |
| | Customer | INSERT | `customer_id = auth.uid() AND EXISTS(SELECT 1 FROM bookings WHERE id = booking_id AND customer_id = auth.uid() AND status = 'completed')` |
| **`support_tickets`** | User | ALL | `user_id = auth.uid() OR is_admin()` |

---

## 3. SQL Role Validation Functions

```sql
-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
