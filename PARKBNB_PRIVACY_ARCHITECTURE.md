# PARKBNB — CUSTOMER PRIVACY & DPDP ACT ARCHITECTURE
**Document Reference:** `PARKBNB_PRIVACY_ARCHITECTURE.md`  
**Version:** 2.0.0 (Production Verified)  
**Security Classification:** Highly Confidential / Data Privacy Standard  
**Compliance Standard:** Digital Personal Data Protection (DPDP) Act 2023 (India)  

---

## 1. Data Privacy Principles

Under the Digital Personal Data Protection (DPDP) Act 2023, parking marketplace platforms must prevent unnecessary exposure of personally identifiable information (PII). Parkbnb enforces a Zero-PII Exposure Architecture between drivers, property owners, security guards, and third-party contractors.

```
+-------------------------------------------------------------------------+
|                              DRIVERS                                    |
|   Real Name: Rahul Sharma         Mobile: +91 98765 43210               |
|   Email: rahul@example.com        Vehicle: GJ-01-AB-1234                |
+-------------------------------------------------------------------------+
                                     │
                        ENCRYPTED PLATFORM BOUNDARY
                                     │
+-------------------------------------------------------------------------+
|                     PARKING OWNER & GATE MANIFEST                       |
|   Masked Display: Rahul S.        Mobile: [RESTRICTED]                  |
|   Email: [RESTRICTED]             Customer ID: CUST-78923412            |
|   Pass Reference: BPR-48912384    Vehicle: GJ-01-AB-1234                |
+-------------------------------------------------------------------------+
```

---

## 2. Dual-Identifier Architecture

### 2.1 Permanent Customer ID (`CUST-XXXXXXXX`)
- **Format:** `CUST-` followed by an 8-character cryptographic alphanumeric string (e.g. `CUST-4K9M2P7X`).
- **Purpose:** Used across driver profile, support tickets, and invoice receipts.
- **Security:** Immutable, non-sequential, and uncorrelated with driver phone numbers or Aadhaar.

### 2.2 Booking Customer Privacy Reference (`BPR-XXXXXXXX`)
- **Format:** `BPR-` followed by an 8-character randomized alphanumeric string (e.g. `BPR-88192041`).
- **Purpose:** Displayed on the Parking Owner Gate Manifest for bay verification.
- **Security:** Each booking generates a unique privacy reference, strictly preventing parking owners from tracking a driver's historical visits or correlating repeated reservations across multiple locations.

---

## 3. PII Masking Algorithms

### 3.1 Display Name Masking
```typescript
export function maskCustomerDisplayName(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return 'Guest Driver';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}
// Example: "Rahul Sharma" -> "Rahul S."
// Example: "Vikram Kumar Patel" -> "Vikram P."
```

### 3.2 Mobile Number Masking
```typescript
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return '••••••••••';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '••••••••••';
  const lastFour = digits.slice(-4);
  return `+91 ••••• ••${lastFour}`;
}
// Example: "+919876543210" -> "+91 ••••• ••3210"
```

### 3.3 Email Address Masking
```typescript
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return '•••••@•••••.com';
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 1);
  return `${visible}•••••@${domain}`;
}
// Example: "rahul.sharma@gmail.com" -> "r•••••@gmail.com"
```

---

## 4. Gate Manifest Privacy Sanitization (`sanitizeBookingForOwner`)

The property owner gate manifest is strictly filtered at the server boundary before serializing to client components or APIs:

```typescript
export function sanitizeBookingForOwner(booking: Booking): OwnerManifestRecord {
  return {
    id: booking.id,
    booking_reference: booking.booking_reference,
    booking_customer_reference: booking.booking_customer_reference || generateBookingCustomerReference(),
    customer_masked_name: maskCustomerDisplayName(booking.customer?.full_name),
    customer_public_id: booking.customer?.customer_public_id || 'CUST-ANON',
    vehicle_plate: booking.vehicle_plate,
    vehicle_type: booking.vehicle_type,
    start_time: booking.start_time,
    end_time: booking.end_time,
    status: booking.status,
    space_identifier: booking.space?.identifier,
    space_title: booking.space?.title,
    check_in_at: booking.check_in_at,
    check_out_at: booking.check_out_at,
    // SENSITIVE PII STRICTLY EXCLUDED:
    // customer_phone: NEVER EXPOSED
    // customer_email: NEVER EXPOSED
  };
}
```

---

## 5. Privileged Customer Data Access Logging

When authorized staff (Customer Support, Fraud Prevention, or Platform Admins) inspect raw customer data, strict auditing is enforced:
1. **Mandatory Business Justification:** Staff must enter a non-empty `reason` (minimum 10 characters).
2. **Access Audit Record (`customer_data_access_logs`):**
   - Timestamp of access.
   - Staff user ID and role (`support_agent`, `operations_manager`, `admin`).
   - Customer ID inspected.
   - Specific fields viewed (e.g. `['phone', 'email']`).
   - Associated booking reference.
   - Mandatory reason logged immutably.
3. Logs are permanently preserved and reviewable by compliance officers.

---

## 6. Right to Erasure (DPDP Account Deletion)

Customers have the statutory right under the DPDP Act 2023 to request account erasure:
- Driver clicks **Delete Account** in Profile settings.
- Customer enters explanation and confirms permanent deletion.
- A `deletionRequests` record is generated in status `pending`.
- An immutable audit log (`CUSTOMER_DELETION_REQUESTED`, category `privacy`) is posted.
- The Data Privacy Officer (DPO) executes data anonymization within 7 business days, retaining only double-entry ledger entries as required by Indian tax laws.
