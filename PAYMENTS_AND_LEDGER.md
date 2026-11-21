# PAYMENTS, FINANCIAL LEDGER & PAYOUT ARCHITECTURE

## 1. Razorpay Payment Architecture

- **Payment Currency:** Indian Rupee (`INR`, ₹)
- **Smallest Currency Unit:** Paise (`amount_in_paise = amount_in_inr * 100`)
- **Payment Methods:** UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards (RuPay, Visa, Mastercard), Net Banking
- **Integration Boundary:**
  1. Frontend invokes Server Action `createPaymentOrderAction(bookingId)`
  2. Server verifies booking status is `hold_pending` and hold has not expired
  3. Server invokes Razorpay Orders API: `razorpay.orders.create({ amount, currency: 'INR', receipt })`
  4. Server persists `payment_orders` row linking `razorpay_order_id` to `booking_id`
  5. Client displays Razorpay standard checkout modal using `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `order_id`
  6. Client receives response: `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }`
  7. Client submits payment confirmation to Server Action or awaits Webhook confirmation

---

## 2. Webhook Verification & Idempotency

- Endpoint: `/api/webhooks/razorpay`
- **Signature Verification:**
  ```typescript
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');
  if (expectedSignature !== req.headers['x-razorpay-signature']) {
    return new Response('Invalid Signature', { status: 400 });
  }
  ```
- **Idempotent Execution:**
  The server inserts the incoming `event.id` into `payment_webhook_events`. If a duplicate webhook arrives with the same `event.id`, PostgreSQL raises a unique constraint violation and the webhook returns `200 OK` immediately without duplicate booking confirmation or duplicate ledger entries.

---

## 3. Double-Entry Style Immutable Financial Ledger

To maintain mathematical auditing and reconcile with Razorpay bank settlements:

| Event | Ledger Entry Type | Debit Account | Credit Account | Amount |
| :--- | :--- | :--- | :--- | :--- |
| Customer Pays ₹500 | `CUSTOMER_PAYMENT` | `GATEWAY_ESCROW` | `PLATFORM_UNEARNED` | ₹500.00 |
| Booking Confirmed | `PLATFORM_COMMISSION` | `PLATFORM_UNEARNED` | `PLATFORM_REVENUE` | ₹75.00 |
| Booking Confirmed | `PROVIDER_PAYABLE` | `PLATFORM_UNEARNED` | `PROVIDER_ESCROW:<id>` | ₹425.00 |
| Customer Cancels (Full) | `REFUND_CUSTOMER` | `GATEWAY_ESCROW` | `CUSTOMER` | ₹500.00 |
| Provider Payout Settled | `PROVIDER_PAYOUT` | `PROVIDER_ESCROW:<id>` | `PROVIDER_BANK` | ₹425.00 |

No row in `financial_ledger_entries` is ever mutated or deleted (`ON UPDATE NO ACTION`, `ON DELETE RESTRICT`). Balances are derived via `SUM(CASE WHEN debit_account = ... THEN amount ELSE -amount END)`.
