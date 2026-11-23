import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateCustomerPublicId,
  generateBookingCustomerReference,
  maskCustomerDisplayName,
  maskPhoneNumber,
  maskEmail,
  sanitizeBookingForOwner,
} from '../src/lib/privacy/customer-privacy';
import {
  hasPermission,
  isStaffRole,
  ROLE_PERMISSIONS,
  UserRole,
} from '../src/lib/auth/rbac';
import { getLocalStore } from '../src/lib/store/marketplace-store';

describe('ParkBnB Role-Based Access Control (RBAC) Architecture', () => {
  const allRoles: UserRole[] = [
    'visitor',
    'customer',
    'provider',
    'support_agent',
    'operations_manager',
    'finance_manager',
    'verification_manager',
    'admin',
    'super_admin',
  ];

  test('All 9 operational roles are explicitly defined and configured', () => {
    assert.equal(allRoles.length, 9);
    for (const role of allRoles) {
      assert.ok(ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] !== undefined, `Missing permissions mapping for role [${role}]`);
    }
  });

  test('Visitor has zero administrative or customer permissions', () => {
    const session = {
      user: null,
      profile: null,
      role: 'visitor' as UserRole,
      isAuthenticated: false,
    };
    assert.equal(hasPermission(session, 'customer:create_booking'), false);
    assert.equal(hasPermission(session, 'admin:full_access'), false);
    assert.equal(hasPermission(session, 'support:lookup_customer'), false);
    assert.equal(isStaffRole(session.role), false);
  });

  test('Customer cannot perform staff, owner, or financial operations', () => {
    const session = {
      user: { id: 'usr-cust-1', email: 'driver@example.com' },
      profile: null,
      role: 'customer' as UserRole,
      isAuthenticated: true,
    };
    assert.equal(hasPermission(session, 'customer:create_booking'), true);
    assert.equal(hasPermission(session, 'provider:manage_spaces'), false);
    assert.equal(hasPermission(session, 'finance:disburse_payouts'), false);
    assert.equal(hasPermission(session, 'verification:audit_hosts'), false);
    assert.equal(hasPermission(session, 'support:lookup_customer'), false);
    assert.equal(isStaffRole(session.role), false);
  });

  test('Parking Provider cannot perform administrative or customer lookups', () => {
    const session = {
      user: { id: 'usr-host-1', email: 'host@example.com' },
      profile: null,
      role: 'provider' as UserRole,
      isAuthenticated: true,
    };
    assert.equal(hasPermission(session, 'provider:manage_spaces'), true);
    assert.equal(hasPermission(session, 'provider:view_gate_manifest'), true);
    assert.equal(hasPermission(session, 'support:lookup_customer'), false);
    assert.equal(hasPermission(session, 'finance:disburse_payouts'), false);
    assert.equal(isStaffRole(session.role), false);
  });

  test('Support Agent has customer lookup permission but cannot disburse payouts or approve spaces', () => {
    const session = {
      user: { id: 'usr-support-1', email: 'support@parkbnb.in' },
      profile: null,
      role: 'support_agent' as UserRole,
      isAuthenticated: true,
    };
    assert.equal(hasPermission(session, 'support:view_tickets'), true);
    assert.equal(hasPermission(session, 'support:lookup_customer'), true);
    assert.equal(hasPermission(session, 'finance:disburse_payouts'), false);
    assert.equal(hasPermission(session, 'verification:approve_spaces'), false);
    assert.equal(isStaffRole(session.role), true);
  });

  test('Finance Manager has ledger and payout permissions without space verification rights', () => {
    const session = {
      user: { id: 'usr-fin-1', email: 'finance@parkbnb.in' },
      profile: null,
      role: 'finance_manager' as UserRole,
      isAuthenticated: true,
    };
    assert.equal(hasPermission(session, 'finance:manage_ledger'), true);
    assert.equal(hasPermission(session, 'finance:disburse_payouts'), true);
    assert.equal(hasPermission(session, 'verification:audit_hosts'), false);
    assert.equal(hasPermission(session, 'support:lookup_customer'), false);
    assert.equal(isStaffRole(session.role), true);
  });

  test('Super Admin has blanket permissions across all operational tiers', () => {
    const session = {
      user: { id: 'usr-super-1', email: 'root@parkbnb.in' },
      profile: null,
      role: 'super_admin' as UserRole,
      isAuthenticated: true,
    };
    assert.equal(hasPermission(session, 'super_admin:all'), true);
    assert.equal(hasPermission(session, 'finance:disburse_payouts'), true);
    assert.equal(hasPermission(session, 'support:lookup_customer'), true);
    assert.equal(hasPermission(session, 'verification:audit_hosts'), true);
    assert.equal(isStaffRole(session.role), true);
  });
});

describe('ParkBnB Customer Privacy Architecture', () => {
  test('Customer Public ID generator produces unique, unpredictable, formatted identifiers', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const id = generateCustomerPublicId();
      assert.match(id, /^PBN-C-[2-9A-HJ-NP-Z]{8}$/, `Invalid ID format: ${id}`);
      assert.ok(!ids.has(id), 'Collision detected in cryptographic customer ID');
      ids.add(id);
    }
  });

  test('Booking Customer Privacy Reference produces formatted non-correlatable codes', () => {
    const refs = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const ref = generateBookingCustomerReference();
      assert.match(ref, /^PBN-REF-[2-9A-HJ-NP-Z]{8}$/, `Invalid reference format: ${ref}`);
      assert.ok(!refs.has(ref), 'Collision detected in booking customer reference');
      refs.add(ref);
    }
  });

  test('Customer display name masking protects identity while providing legible gate clearance', () => {
    assert.equal(maskCustomerDisplayName('Rahul Sharma'), 'Rahul S.');
    assert.equal(maskCustomerDisplayName('Vikram Jitendra Patel'), 'Vikram P.');
    assert.equal(maskCustomerDisplayName('Priya'), 'Priya');
    assert.equal(maskCustomerDisplayName(''), 'Valued Customer');
    assert.equal(maskCustomerDisplayName(null), 'Valued Customer');
  });

  test('Phone and Email masking utilities obscure sensitive identifiers', () => {
    assert.equal(maskPhoneNumber('9876543210'), '98****3210');
    assert.equal(maskPhoneNumber(null), 'Not registered');
    assert.equal(maskEmail('rahul.patel@gmail.com'), 'r***l@gmail.com');
    assert.equal(maskEmail(null), 'Not registered');
  });

  test('Owner Gate Clearance Manifest strictly strips sensitive customer PII', () => {
    const booking = {
      id: 'bkg-priv-01',
      booking_reference: 'PKB-20261123-A99',
      booking_customer_reference: 'PBN-REF-8M2Q4K9X',
      customer_display_name: 'Amit S.',
      space_id: 'spc-01',
      customer_id: 'usr-sensitive-internal-uuid-001',
      provider_id: 'usr-provider-1',
      vehicle_id: 'veh-01',
      start_time: '2026-11-23T10:00:00Z',
      end_time: '2026-11-23T14:00:00Z',
      status: 'confirmed' as const,
      total_hours: 4,
      base_amount: 160,
      platform_fee: 24,
      tax_amount: 4.32,
      total_amount: 188.32,
      provider_payout_amount: 160,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      space: {
        id: 'spc-01',
        property_id: 'prop-01',
        provider_id: 'usr-provider-1',
        identifier: 'Slot B-12',
        title: 'Covered Bay',
        parking_type: 'covered' as const,
        hourly_rate: 40,
        min_duration_hours: 1,
        max_duration_hours: 720,
        security_features: ['cctv'],
        has_ev_charging: false,
        status: 'approved' as const,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      vehicle: {
        id: 'veh-01',
        customer_id: 'usr-sensitive-internal-uuid-001',
        vehicle_type: 'car_sedan' as const,
        registration_number: 'GJ-01-AB-1234',
        make_model: 'Honda City',
        is_default: true,
        created_at: new Date().toISOString(),
      },
      customer: {
        id: 'usr-sensitive-internal-uuid-001',
        full_name: 'Amit Shah',
        email: 'amit.shah@private-domain.com',
        phone: '9825099887',
        phone_verified: true,
        role: 'customer' as UserRole,
        status: 'active' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    const sanitized = sanitizeBookingForOwner(booking);

    // Verify allowed fields exist
    assert.equal(sanitized.booking_reference, 'PKB-20261123-A99');
    assert.equal(sanitized.booking_customer_reference, 'PBN-REF-8M2Q4K9X');
    assert.equal(sanitized.customer_display_name, 'Amit S.');
    assert.equal(sanitized.vehicle_plate, 'GJ-01-AB-1234');
    assert.equal(sanitized.space_identifier, 'Slot B-12');

    // CRITICAL PRIVACY ASSERTIONS: Verify sensitive data is NOT present on the sanitized manifest
    assert.equal((sanitized as any).customer_id, undefined, 'Internal customer UUID leaked to owner!');
    assert.equal((sanitized as any).email, undefined, 'Customer email address leaked to owner!');
    assert.equal((sanitized as any).phone, undefined, 'Customer mobile number leaked to owner!');
    assert.equal((sanitized as any).full_name, undefined, 'Raw customer full name leaked to owner!');
  });

  test('Privileged Customer Lookup requires mandatory reason and records audit trail', () => {
    const store = getLocalStore();

    // Create a real customer
    const customer = store.createProfile({
      id: 'usr-test-lookup-01',
      customer_public_id: generateCustomerPublicId(),
      full_name: 'Priyanka Trivedi',
      email: 'priyanka.t@example.com',
      phone: '9909911223',
      phone_verified: true,
      role: 'customer',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 1. Fails when reason is missing
    const failedRes = store.privilegedCustomerLookup({
      searchTerm: customer.customer_public_id!,
      reason: '',
      staffId: 'usr-staff-01',
      staffRole: 'support_agent',
      staffEmail: 'support@parkbnb.in',
    });
    assert.equal(failedRes.success, false);
    assert.match(failedRes.error!, /reason/i);

    // 2. Succeeds when legitimate reason is supplied
    const initialLogsCount = store.getCustomerDataAccessLogs().length;
    const successRes = store.privilegedCustomerLookup({
      searchTerm: customer.customer_public_id!,
      reason: 'gate_entry_denial: Attendant refused entry at SG Highway spot',
      staffId: 'usr-staff-01',
      staffRole: 'support_agent',
      staffEmail: 'support@parkbnb.in',
    });

    assert.equal(successRes.success, true);
    assert.ok(successRes.auditLogId !== undefined);
    assert.equal(successRes.customer?.customer_public_id, customer.customer_public_id);
    assert.equal(successRes.customer?.masked_display_name, 'Priyanka T.');
    assert.equal(successRes.customer?.phone_masked, '99****1223');

    // Verify audit log was recorded
    const logsAfter = store.getCustomerDataAccessLogs();
    assert.equal(logsAfter.length, initialLogsCount + 1);
    assert.equal(logsAfter[0].customer_id, customer.id);
    assert.equal(logsAfter[0].staff_id, 'usr-staff-01');
    assert.match(logsAfter[0].reason, /gate_entry_denial/);
  });
});
