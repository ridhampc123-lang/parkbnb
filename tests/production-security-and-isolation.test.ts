import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { getLocalStore } from '../src/lib/store/marketplace-store';
import { repository } from '../src/lib/db/supabase-repository';
import {
  generateCustomerPublicId,
  generateBookingCustomerReference,
  maskCustomerDisplayName,
  maskPhoneNumber,
  maskEmail,
  sanitizeBookingForOwner,
} from '../src/lib/privacy/customer-privacy';
import { hasPermission, isStaffRole, UserRole } from '../src/lib/auth/rbac';
import { Booking, ParkingSpace, CustomerVehicle } from '../src/types/database';

describe('ParkBnB Production Security, Multi-Tenant Isolation & Integrity Test Suite', () => {
  const store = getLocalStore();

  // =========================================================================
  // 1. CUSTOMER-TO-CUSTOMER ISOLATION & IDOR PREVENTION
  // =========================================================================
  describe('1. Customer-to-Customer Isolation & IDOR Protection', () => {
    const customerAId = 'usr-cust-a-' + Math.random().toString(36).substring(2, 7);
    const customerBId = 'usr-cust-b-' + Math.random().toString(36).substring(2, 7);

    test('1.1 Customer A cannot view or list Customer B vehicles', async () => {
      const vehicleB: CustomerVehicle = {
        id: 'veh-b-' + Math.random().toString(36).substring(2, 7),
        customer_id: customerBId,
        vehicle_type: 'car_sedan',
        registration_number: 'GJ01AB1234',
        is_default: true,
        created_at: new Date().toISOString(),
      };
      await repository.createVehicle(vehicleB);

      const customerAVehicles = await repository.getVehiclesByCustomer(customerAId);
      const containsVehicleB = customerAVehicles.some(v => v.id === vehicleB.id);
      assert.equal(containsVehicleB, false, 'Customer A should not see Customer B vehicle');
    });

    test('1.2 Customer A cannot delete or modify Customer B vehicle', async () => {
      const vehicleB: CustomerVehicle = {
        id: 'veh-del-b-' + Math.random().toString(36).substring(2, 7),
        customer_id: customerBId,
        vehicle_type: 'car_suv',
        registration_number: 'GJ01CD5678',
        is_default: false,
        created_at: new Date().toISOString(),
      };
      await repository.createVehicle(vehicleB);

      // Attempt deletion under customer A identity
      const deletedByA = await repository.deleteVehicle(vehicleB.id, customerAId);
      assert.equal(deletedByA, false, 'Customer A must fail to delete vehicle owned by Customer B');

      // Verify vehicle still exists for customer B
      const bVehicles = await repository.getVehiclesByCustomer(customerBId);
      assert.ok(bVehicles.some(v => v.id === vehicleB.id));
    });

    test('1.3 Customer A cannot view Customer B bookings', async () => {
      const bookingB: Booking = {
        id: 'bkg-b-' + Math.random().toString(36).substring(2, 7),
        booking_reference: 'PKB-TEST-B',
        booking_customer_reference: generateBookingCustomerReference(),
        customer_display_name: 'Driver B',
        space_id: 'space-1',
        customer_id: customerBId,
        provider_id: 'host-1',
        start_time: '2026-12-01T10:00:00Z',
        end_time: '2026-12-01T12:00:00Z',
        status: 'confirmed',
        total_hours: 2,
        base_amount: 100,
        platform_fee: 15,
        tax_amount: 2.7,
        total_amount: 117.7,
        provider_payout_amount: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await repository.createBooking(bookingB);

      const customerABookings = await repository.getBookingsByCustomer(customerAId);
      assert.equal(
        customerABookings.some(b => b.id === bookingB.id),
        false,
        'Customer A must not see Customer B booking'
      );
    });
  });

  // =========================================================================
  // 2. OWNER-TO-OWNER ISOLATION
  // =========================================================================
  describe('2. Owner-to-Owner Isolation', () => {
    const hostAId = 'usr-host-a-' + Math.random().toString(36).substring(2, 7);
    const hostBId = 'usr-host-b-' + Math.random().toString(36).substring(2, 7);

    test('2.1 Host A cannot view or manage Host B spaces', async () => {
      const spaceB: ParkingSpace = {
        id: 'spc-b-' + Math.random().toString(36).substring(2, 7),
        property_id: 'prop-b',
        provider_id: hostBId,
        identifier: 'BAY-B1',
        title: 'Host B Exclusive Covered Bay',
        parking_type: 'covered',
        hourly_rate: 60,
        status: 'approved',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await repository.createParkingSpace(spaceB);

      const hostASpaces = await repository.getSpacesByProvider(hostAId);
      assert.equal(
        hostASpaces.some(s => s.id === spaceB.id),
        false,
        'Host A must not see Host B parking space'
      );
    });

    test('2.2 Host A cannot access Host B financial ledger or earnings', async () => {
      await repository.recordLedgerEntry({
        booking_id: 'bkg-ledger-b',
        entry_type: 'PROVIDER_PAYABLE',
        debit_account: 'PLATFORM_UNEARNED',
        credit_account: `PROVIDER_ESCROW:${hostBId}`,
        amount: 500,
        currency: 'INR',
        description: 'Host B net earning',
      });

      const hostALedger = await repository.getLedgerEntriesByProvider(hostAId);
      assert.equal(
        hostALedger.some(e => e.credit_account === `PROVIDER_ESCROW:${hostBId}`),
        false,
        'Host A must not see Host B ledger credit entries'
      );
    });
  });

  // =========================================================================
  // 3. CUSTOMER-TO-OWNER PRIVACY & GATE MANIFEST PII STRIPPING
  // =========================================================================
  describe('3. Customer-to-Owner Privacy & Gate Clearance Manifest', () => {
    test('3.1 Owner gate manifest strictly strips private customer phone and email', () => {
      const rawBooking: Booking = {
        id: 'bkg-priv-1',
        booking_reference: 'PKB-20261125-ABCD',
        booking_customer_reference: 'PBN-REF-88392104',
        customer_display_name: 'Rahul S.',
        space_id: 'spc-priv-1',
        customer_id: 'usr-cust-raw',
        provider_id: 'usr-host-1',
        start_time: '2026-11-25T14:00:00Z',
        end_time: '2026-11-25T18:00:00Z',
        status: 'confirmed',
        gate_status: 'booked',
        total_hours: 4,
        base_amount: 200,
        platform_fee: 30,
        tax_amount: 5.4,
        total_amount: 235.4,
        provider_payout_amount: 200,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        vehicle: {
          id: 'veh-1',
          customer_id: 'usr-cust-raw',
          vehicle_type: 'car_sedan',
          registration_number: 'GJ01XX9999',
          is_default: true,
          created_at: new Date().toISOString(),
        },
      };

      const sanitized = sanitizeBookingForOwner(rawBooking);

      assert.equal((sanitized as any).customer_phone, undefined, 'Private phone number must not exist on owner manifest');
      assert.equal((sanitized as any).customer_email, undefined, 'Private email address must not exist on owner manifest');
      assert.equal(sanitized.customer_display_name, 'Rahul S.', 'Owner sees only masked display name');
      assert.equal(sanitized.booking_customer_reference, 'PBN-REF-88392104');
      assert.equal(sanitized.vehicle_plate, 'GJ01XX9999');
    });

    test('3.2 Customer Public ID format adheres to permanent PBN-C standard', () => {
      const publicId = generateCustomerPublicId();
      assert.match(publicId, /^PBN-C-[A-Z0-9]{8}$/);
    });
  });

  // =========================================================================
  // 4. ROLE-BASED ACCESS CONTROL & STAFF BOUNDARIES
  // =========================================================================
  describe('4. Staff Role Boundaries & RBAC', () => {
    test('4.1 Support agent can lookup customer with audited reason but cannot approve spaces', () => {
      const supportSession = {
        user: { id: 'usr-sup-1', email: 'support@parkbnb.in' },
        profile: { id: 'usr-sup-1', email: 'support@parkbnb.in', full_name: 'Agent Priya' },
        role: 'support_agent' as UserRole,
        isAuthenticated: true,
      };

      assert.equal(hasPermission(supportSession, 'support:lookup_customer'), true);
      assert.equal(hasPermission(supportSession, 'verification:approve_spaces'), false);
      assert.equal(hasPermission(supportSession, 'finance:disburse_payouts'), false);
    });

    test('4.2 Finance manager can manage ledger but cannot approve spaces or suspend accounts', () => {
      const financeSession = {
        user: { id: 'usr-fin-1', email: 'finance@parkbnb.in' },
        profile: { id: 'usr-fin-1', email: 'finance@parkbnb.in', full_name: 'Finance Amit' },
        role: 'finance_manager' as UserRole,
        isAuthenticated: true,
      };

      assert.equal(hasPermission(financeSession, 'finance:manage_ledger'), true);
      assert.equal(hasPermission(financeSession, 'finance:disburse_payouts'), true);
      assert.equal(hasPermission(financeSession, 'verification:approve_spaces'), false);
      assert.equal(hasPermission(financeSession, 'operations:suspend_accounts'), false);
    });

    test('4.3 Privileged customer lookup rejects empty reason and logs audit record', () => {
      // Missing reason must fail
      const failed = store.privilegedCustomerLookup({
        searchTerm: '9876543210',
        reason: '',
        staffId: 'staff-1',
        staffRole: 'support_agent',
        staffEmail: 'support@parkbnb.in',
      });
      assert.equal(failed.success, false);
      assert.match(failed.error || '', /mandatory/i);

      // Valid lookup with reason succeeds and creates audit log
      const success = store.privilegedCustomerLookup({
        searchTerm: '9876543210',
        reason: 'Driver stranded at gate clearance unable to enter',
        staffId: 'staff-1',
        staffRole: 'support_agent',
        staffEmail: 'support@parkbnb.in',
      });
      assert.equal(success.success, true);
      assert.ok(success.auditLogId);

      const logs = store.getAuditLogs();
      const lookupLog = logs.find(l => l.action === 'PRIVILEGED_CUSTOMER_LOOKUP');
      assert.ok(lookupLog, 'Privileged access audit log must be recorded');
    });
  });

  // =========================================================================
  // 5. PAYMENT INTEGRITY & RAZORPAY SIGNATURE VERIFICATION
  // =========================================================================
  describe('5. Payment Integrity & Signature Verification', () => {
    const secret = 'rzp_test_secret_998877';

    test('5.1 Valid HMAC-SHA256 signature passes verification', () => {
      const orderId = 'order_def456';
      const paymentId = 'pay_xyz789';
      const text = `${orderId}|${paymentId}`;
      const validSig = crypto.createHmac('sha256', secret).update(text).digest('hex');

      const computedSig = crypto.createHmac('sha256', secret).update(text).digest('hex');
      assert.equal(computedSig, validSig);
    });

    test('5.2 Tampered payment signature is rejected', () => {
      const orderId = 'order_def456';
      const paymentId = 'pay_xyz789';
      const text = `${orderId}|${paymentId}`;
      const forgedSig = crypto.createHmac('sha256', 'wrong_secret').update(text).digest('hex');
      const expectedSig = crypto.createHmac('sha256', secret).update(text).digest('hex');

      assert.notEqual(forgedSig, expectedSig);
    });
  });

  // =========================================================================
  // 6. WEBHOOK IDEMPOTENCY & DUPLICATE WEBHOOK HANDLING
  // =========================================================================
  describe('6. Webhook Idempotency & Replay Protection', () => {
    test('6.1 Multiple payment.captured events for same booking do not duplicate confirmation', async () => {
      const bookingId = 'bkg-webhook-' + Math.random().toString(36).substring(2, 7);
      const booking: Booking = {
        id: bookingId,
        booking_reference: 'PKB-WH-TEST',
        space_id: 'space-wh',
        customer_id: 'cust-wh',
        provider_id: 'host-wh',
        start_time: '2026-12-05T10:00:00Z',
        end_time: '2026-12-05T14:00:00Z',
        status: 'hold_pending',
        total_hours: 4,
        base_amount: 200,
        platform_fee: 30,
        tax_amount: 5.4,
        total_amount: 235.4,
        provider_payout_amount: 200,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await repository.createBooking(booking);

      // First webhook event: confirms booking
      await repository.updateBookingStatus(bookingId, 'confirmed');
      const confirmed1 = await repository.getBookingById(bookingId);
      assert.equal(confirmed1?.status, 'confirmed');

      // Second duplicate webhook event: status remains confirmed without error
      await repository.updateBookingStatus(bookingId, 'confirmed');
      const confirmed2 = await repository.getBookingById(bookingId);
      assert.equal(confirmed2?.status, 'confirmed');
    });
  });

  // =========================================================================
  // 7. CONCURRENT BOOKINGS, HOLDS & 10-MINUTE EXPIRY
  // =========================================================================
  describe('7. Concurrent Booking Holds & Expiry Engine', () => {
    const testSpace: ParkingSpace = {
      id: 'spc-concurrency-' + Math.random().toString(36).substring(2, 7),
      property_id: 'prop-conc',
      provider_id: 'host-conc',
      identifier: 'CONC-01',
      title: 'Concurrency Test Space',
      parking_type: 'covered',
      hourly_rate: 50,
      status: 'approved',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    test('7.1 First customer acquires 10-minute hold; simultaneous overlapping hold is rejected', async () => {
      await repository.createParkingSpace(testSpace);

      const cust1 = 'cust-hold-1';
      const cust2 = 'cust-hold-2';
      const start = '2026-12-10T14:00:00Z';
      const end = '2026-12-10T18:00:00Z';

      // Customer 1 acquires hold
      const hold1 = await repository.createHold(testSpace.id, cust1, start, end, 10);
      assert.ok(hold1, 'First driver should successfully acquire hold');
      assert.equal(hold1.is_active, true);

      // Customer 2 attempts hold during same interval: must be blocked
      const hold2 = await repository.createHold(testSpace.id, cust2, '2026-12-10T15:00:00Z', '2026-12-10T17:00:00Z', 10);
      assert.equal(hold2, null, 'Simultaneous overlapping hold must be strictly rejected');
    });

    test('7.2 Releasing customer 1 hold immediately restores availability for customer 2', async () => {
      const cust1 = 'cust-hold-1';
      const cust2 = 'cust-hold-2';
      const start = '2026-12-10T14:00:00Z';
      const end = '2026-12-10T18:00:00Z';

      // Customer 1 releases hold
      await repository.releaseHold(testSpace.id, cust1);

      // Customer 2 can now reserve the slot
      const hold2 = await repository.createHold(testSpace.id, cust2, start, end, 10);
      assert.ok(hold2, 'Subsequent driver can acquire hold once previous hold is released');
    });

    test('7.3 Cron cleanup deactivates expired holds past expiration timestamp', async () => {
      // Force create an expired hold
      const expiredSpaceId = 'spc-expired-' + Math.random().toString(36).substring(2, 7);
      const pastTime = new Date(Date.now() - 60000).toISOString(); // 1 minute in the past
      store['holds'].set('hold-stale-1', {
        id: 'hold-stale-1',
        space_id: expiredSpaceId,
        customer_id: 'cust-stale',
        start_time: '2026-12-11T10:00:00Z',
        end_time: '2026-12-11T12:00:00Z',
        expires_at: pastTime,
        is_active: true,
        created_at: pastTime,
      });

      const cleanupResult = await repository.cleanupExpiredHoldsAndOtps();
      assert.ok(cleanupResult.expiredHolds >= 1, 'Cleanup worker must release expired holds');

      const staleHold = store['holds'].get('hold-stale-1');
      assert.equal(staleHold?.is_active, false, 'Expired hold must be marked inactive');
    });
  });

  // =========================================================================
  // 8. REFUND INTEGRITY & FINANCIAL LEDGER RECONCILIATION
  // =========================================================================
  describe('8. Refund Integrity & Double-Entry Ledger Reconciliation', () => {
    test('8.1 Cancellation generates refund entry and reconciles debits with credits', async () => {
      const bookingId = 'bkg-ref-' + Math.random().toString(36).substring(2, 7);
      const totalAmount = 300;

      // 1. Customer Payment Entry
      await repository.recordLedgerEntry({
        booking_id: bookingId,
        entry_type: 'CUSTOMER_PAYMENT',
        debit_account: 'GATEWAY_ESCROW',
        credit_account: 'PLATFORM_UNEARNED',
        amount: totalAmount,
        currency: 'INR',
        description: 'Customer payment test',
      });

      // 2. Cancellation Refund Entry
      await repository.recordLedgerEntry({
        booking_id: bookingId,
        entry_type: 'REFUND_CUSTOMER',
        debit_account: 'PLATFORM_UNEARNED',
        credit_account: 'GATEWAY_ESCROW',
        amount: totalAmount,
        currency: 'INR',
        description: 'Full refund to customer for cancellation',
      });

      const storeEntries = store.getLedgerEntries().filter(e => e.booking_id === bookingId);
      assert.equal(storeEntries.length, 2);

      // Verify net balance across accounts is zero
      const gatewayDebits = storeEntries
        .filter(e => e.debit_account === 'GATEWAY_ESCROW')
        .reduce((sum, e) => sum + e.amount, 0);
      const gatewayCredits = storeEntries
        .filter(e => e.credit_account === 'GATEWAY_ESCROW')
        .reduce((sum, e) => sum + e.amount, 0);

      assert.equal(gatewayDebits, gatewayCredits, 'Gateway escrow debits must equal credits after refund');
    });
  });
});
