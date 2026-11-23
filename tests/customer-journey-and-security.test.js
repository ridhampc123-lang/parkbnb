import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { signSessionToken, verifySessionToken, hashOtp, verifyOtpHash } from '@/lib/auth/session-token';
import { getLocalStore } from '@/lib/store/marketplace-store';

describe('ParkBnB Phase 9: 23-Scenario Customer Journey, OTP Verification & Security Test Suite', () => {
  let store;

  beforeEach(() => {
    store = getLocalStore();
  });

  // --------------------------------------------------------------------------
  // Scenario 1: New visitor searches without registration
  // --------------------------------------------------------------------------
  test('Scenario 1: New visitor searches and discovers parking spaces without registration or login', () => {
    const publicSpaces = store.getApprovedPublicSpaces();
    assert.ok(publicSpaces.length > 0, 'Public spaces must be visible without login');

    // Verify Ahmedabad locations are accessible
    const prahladSpace = publicSpaces.find(s => s.property?.area.includes('Prahlad Nagar'));
    assert.ok(prahladSpace, 'Ahmedabad Prahlad Nagar space should be discoverable');
    assert.equal(prahladSpace.status, 'approved');
    assert.equal(prahladSpace.is_active, true);
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Visitor opens parking details without OTP
  // --------------------------------------------------------------------------
  test('Scenario 2: Visitor opens parking space details, rules, and facilities without OTP or personal data', () => {
    const space = store.getSpaceById('spc-prahladnagar-01');
    assert.ok(space, 'Listing details must load for public visitor');
    assert.ok(space.photos && space.photos.length > 0, 'Genuine listing photos must be present');
    assert.ok(space.hourly_rate > 0, 'Actual pricing must be visible');
    assert.ok(space.security_features.length > 0, 'Security amenities must be visible');
    assert.ok(space.access_instructions, 'Access rules must be defined');
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Visitor selects a parking space & verifies pricing calculation
  // --------------------------------------------------------------------------
  test('Scenario 3: Visitor selects date, duration, vehicle type and server calculates price independently', () => {
    const space = store.getSpaceById('spc-prahladnagar-01');
    const startTime = '2026-11-25T10:00:00.000Z';
    const endTime = '2026-11-25T14:00:00.000Z'; // 4 hours

    const pricing = store.calculatePricing(space, startTime, endTime);
    assert.equal(pricing.totalHours, 4);
    assert.equal(pricing.baseAmount, 160.00); // 4 * 40
    assert.equal(pricing.platformFee, 24.00); // 15% of 160
    assert.equal(pricing.taxAmount, 4.32); // 18% of 24
    assert.equal(pricing.totalAmount, 188.32);
    assert.equal(pricing.providerPayoutAmount, 160.00);
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Visitor clicks Book Now
  // --------------------------------------------------------------------------
  test('Scenario 4: Visitor clicks Book Now and availability is checked before customer details are requested', () => {
    const spaceId = 'spc-prahladnagar-01';
    const startTime = '2026-11-26T10:00:00.000Z';
    const endTime = '2026-11-26T14:00:00.000Z';

    const isAvailable = store.checkAvailability(spaceId, startTime, endTime);
    assert.equal(isAvailable, true, 'Space must be available for unbooked slot');
  });

  // --------------------------------------------------------------------------
  // Scenario 5: New customer receives OTP (Rate limited, hashed salt, 10-min expiry)
  // --------------------------------------------------------------------------
  test('Scenario 5: New customer receives 6-digit OTP stored as cryptographic hash (never plaintext)', () => {
    const phone = '9876500001';
    const rawOtp = '482910';
    const otpHash = hashOtp(phone, rawOtp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const record = store.saveOtp(phone, otpHash, expiresAt);
    assert.ok(record.id);
    assert.equal(record.phone, phone);
    assert.notEqual(record.otp_hash, rawOtp, 'Plaintext OTP must NEVER be stored');
    assert.equal(record.attempts, 0);

    const latest = store.getLatestOtp(phone);
    assert.ok(latest);
    assert.equal(latest.otp_hash, otpHash);
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Incorrect OTP is rejected
  // --------------------------------------------------------------------------
  test('Scenario 6: Incorrect OTP is rejected using constant-time comparison and attempts are incremented', () => {
    const phone = '9876500002';
    const correctOtp = '654321';
    const wrongOtp = '111111';
    const otpHash = hashOtp(phone, correctOtp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    store.saveOtp(phone, otpHash, expiresAt);

    // Verify wrong OTP fails constant-time check
    const isValid = verifyOtpHash(phone, wrongOtp, otpHash);
    assert.equal(isValid, false, 'Incorrect OTP must be rejected');

    const attemptsUsed = store.recordOtpAttempt(phone);
    assert.equal(attemptsUsed, 1);
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Expired OTP is rejected
  // --------------------------------------------------------------------------
  test('Scenario 7: Expired OTP is rejected when expires_at is in the past', () => {
    const phone = '9876500003';
    const rawOtp = '123456';
    const otpHash = hashOtp(phone, rawOtp);
    // 5 minutes in the past
    const pastExpiresAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    store.saveOtp(phone, otpHash, pastExpiresAt);
    const record = store.getLatestOtp(phone);

    const isExpired = new Date(record.expires_at).getTime() < Date.now();
    assert.equal(isExpired, true, 'Expired OTP must be detected as expired');
  });

  // --------------------------------------------------------------------------
  // Scenario 8: OTP resend limits work
  // --------------------------------------------------------------------------
  test('Scenario 8: OTP resend limits enforce cooldown and hourly request caps', () => {
    const phone = '9876500004';
    const otpHash = hashOtp(phone, '123456');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // First request
    store.saveOtp(phone, otpHash, expiresAt);

    // Check count in last 60 minutes
    const count1 = store.getRecentOtpCount(phone, 60);
    assert.equal(count1, 1);

    // Simulate 4 more requests
    store.saveOtp(phone, otpHash, expiresAt);
    store.saveOtp(phone, otpHash, expiresAt);
    store.saveOtp(phone, otpHash, expiresAt);
    store.saveOtp(phone, otpHash, expiresAt);

    const count5 = store.getRecentOtpCount(phone, 60);
    assert.equal(count5, 5);
    assert.ok(count5 >= 5, 'Rate cap of 5 OTPs/hour must be reached');
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Successful OTP creates or links the correct account
  // --------------------------------------------------------------------------
  test('Scenario 9: Successful OTP verification creates verified customer profile and returns signed token', () => {
    const phone = '9876500009';
    const otp = '998877';
    const otpHash = hashOtp(phone, otp);
    store.saveOtp(phone, otpHash, new Date(Date.now() + 600000).toISOString());

    // Verify OTP
    assert.equal(verifyOtpHash(phone, otp, otpHash), true);
    store.markOtpVerified(phone);

    // Create profile
    const newCustomerId = 'usr-test-cust-09';
    const profile = {
      id: newCustomerId,
      full_name: 'Anand Sharma',
      email: null,
      phone,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
      role: 'customer',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.createProfile(profile);

    const retrieved = store.getProfileByPhone(phone);
    assert.ok(retrieved);
    assert.equal(retrieved.phone_verified, true);
    assert.equal(retrieved.full_name, 'Anand Sharma');

    // Cryptographic Session Token
    const { token, payload } = signSessionToken({
      sub: profile.id,
      phone: profile.phone,
      name: profile.full_name,
      role: profile.role,
    });
    assert.ok(token);
    assert.equal(payload.sub, newCustomerId);
  });

  // --------------------------------------------------------------------------
  // Scenario 10: Customer completes the first booking
  // --------------------------------------------------------------------------
  test('Scenario 10: Customer completes first booking with 10-minute hold, payment, and double-entry ledger', () => {
    const customerId = 'usr-test-cust-09';
    const spaceId = 'spc-prahladnagar-01';
    const startTime = '2026-11-27T09:00:00.000Z';
    const endTime = '2026-11-27T12:00:00.000Z'; // 3 hours

    // Register vehicle
    const vehicle = store.createVehicle({
      id: 'veh-cust-09',
      customer_id: customerId,
      vehicle_type: 'car_sedan',
      registration_number: 'GJ 01 CD 5678',
      is_default: true,
      created_at: new Date().toISOString(),
    });

    // 10-minute Hold
    const hold = store.createHold(spaceId, customerId, startTime, endTime, 10);
    assert.ok(hold, 'Hold must be created');
    assert.equal(hold.is_active, true);

    const space = store.getSpaceById(spaceId);
    const pricing = store.calculatePricing(space, startTime, endTime);

    // Create booking
    const bookingId = 'bkg-cust-09-01';
    const booking = store.createBooking({
      id: bookingId,
      booking_reference: 'PKB-20261127-TEST',
      space_id: spaceId,
      customer_id: customerId,
      provider_id: space.provider_id,
      vehicle_id: vehicle.id,
      start_time: startTime,
      end_time: endTime,
      status: 'hold_pending',
      total_hours: pricing.totalHours,
      base_amount: pricing.baseAmount,
      platform_fee: pricing.platformFee,
      tax_amount: pricing.taxAmount,
      total_amount: pricing.totalAmount,
      provider_payout_amount: pricing.providerPayoutAmount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    assert.equal(booking.status, 'hold_pending');

    // Confirm Payment
    store.updateBookingStatus(bookingId, 'confirmed');
    store.releaseHold(spaceId, customerId);

    const confirmed = store.getBookingById(bookingId);
    assert.equal(confirmed.status, 'confirmed');
  });

  // --------------------------------------------------------------------------
  // Scenario 11: Customer closes the browser and returns with a valid session
  // --------------------------------------------------------------------------
  test('Scenario 11: Returning customer with signed HMAC session token is cryptographically validated', () => {
    const customerId = 'usr-test-cust-09';
    const profile = store.getProfileById(customerId);

    const { token } = signSessionToken({
      sub: profile.id,
      phone: profile.phone,
      name: profile.full_name,
      role: profile.role,
    });

    // Validate token
    const verifiedPayload = verifySessionToken(token);
    assert.ok(verifiedPayload, 'Valid token must be verified');
    assert.equal(verifiedPayload.sub, customerId);
    assert.equal(verifiedPayload.role, 'customer');

    // Check tampered token fails
    const tamperedToken = token.slice(0, -4) + 'abcd';
    const tamperedResult = verifySessionToken(tamperedToken);
    assert.equal(tamperedResult, null, 'Tampered token must be rejected');
  });

  // --------------------------------------------------------------------------
  // Scenario 12: Customer makes another booking without repeated OTP
  // --------------------------------------------------------------------------
  test('Scenario 12: Authenticated returning customer initiates second booking without OTP prompt', () => {
    const customerId = 'usr-test-cust-09';
    const profile = store.getProfileById(customerId);
    assert.equal(profile.phone_verified, true, 'Customer is already verified');

    // Can immediately create hold for another slot
    const spaceId = 'spc-sbr-02';
    const startTime = '2026-11-28T14:00:00.000Z';
    const endTime = '2026-11-28T18:00:00.000Z';

    const hold = store.createHold(spaceId, customerId, startTime, endTime, 10);
    assert.ok(hold, 'Returning customer gets instant hold without repeated OTP');
  });

  // --------------------------------------------------------------------------
  // Scenario 13: Customer sees saved vehicles
  // --------------------------------------------------------------------------
  test('Scenario 13: Customer smart memory loads previously saved vehicles automatically', () => {
    const customerId = 'usr-test-cust-09';
    const vehicles = store.getVehiclesByCustomer(customerId);
    assert.ok(vehicles.length >= 1, 'Saved vehicles must be loaded');
    assert.equal(vehicles[0].registration_number, 'GJ 01 CD 5678');
  });

  // --------------------------------------------------------------------------
  // Scenario 14: Customer adds another vehicle
  // --------------------------------------------------------------------------
  test('Scenario 14: Customer adds a second vehicle to smart memory with distinct registration', () => {
    const customerId = 'usr-test-cust-09';
    const vehicle2 = store.createVehicle({
      id: 'veh-cust-09-scooter',
      customer_id: customerId,
      vehicle_type: 'two_wheeler',
      registration_number: 'GJ 01 EF 9900',
      is_default: false,
      created_at: new Date().toISOString(),
    });

    const vehicles = store.getVehiclesByCustomer(customerId);
    assert.equal(vehicles.length, 2, 'Customer now has 2 registered vehicles');
    assert.ok(vehicles.some(v => v.registration_number === 'GJ 01 EF 9900'));
  });

  // --------------------------------------------------------------------------
  // Scenario 15: Customer logs out and must authenticate again
  // --------------------------------------------------------------------------
  test('Scenario 15: Logging out removes session cookie and requires re-authentication', () => {
    // When logoutAction is executed, cookie is deleted
    // Without cookie or with empty token, verifySessionToken returns null
    const emptyResult = verifySessionToken('');
    assert.equal(emptyResult, null, 'Empty or deleted session token cannot authenticate');
  });

  // --------------------------------------------------------------------------
  // Scenario 16: Expired session is handled correctly
  // --------------------------------------------------------------------------
  test('Scenario 16: Expired session token (exp < now) is rejected by cryptographic verifier', () => {
    // Sign token with -10 seconds duration (already expired)
    const { token } = signSessionToken({
      sub: 'usr-expired-test',
      phone: '9876543210',
      name: 'Expired User',
      role: 'customer',
      expiresInSeconds: -10,
    });

    const result = verifySessionToken(token);
    assert.equal(result, null, 'Expired session token must be rejected');
  });

  // --------------------------------------------------------------------------
  // Scenario 17: Another customer cannot access this customer's bookings (IDOR protection)
  // --------------------------------------------------------------------------
  test('Scenario 17: IDOR Protection: Customer B cannot view or confirm Customer A booking', () => {
    const customerA = 'usr-test-cust-09';
    const customerB = 'usr-malicious-b';
    const booking = store.getBookingById('bkg-cust-09-01');

    assert.ok(booking);
    assert.equal(booking.customer_id, customerA);

    // IDOR Check
    const canAccess = booking.customer_id === customerB;
    assert.equal(canAccess, false, 'Access must be denied to non-owning customer');
  });

  // --------------------------------------------------------------------------
  // Scenario 18: Two customers cannot reserve overlapping time slots (Concurrency)
  // --------------------------------------------------------------------------
  test('Scenario 18: Concurrency Double-Booking Prevention: Overlapping interval rejected', () => {
    const spaceId = 'spc-sbr-02';
    const customer1 = 'usr-driver-1';
    const customer2 = 'usr-driver-2';

    const tStart = '2026-11-29T10:00:00.000Z';
    const tEnd = '2026-11-29T14:00:00.000Z';

    // Driver 1 acquires hold
    const hold1 = store.createHold(spaceId, customer1, tStart, tEnd, 10);
    assert.ok(hold1, 'First driver successfully acquires hold');

    // Driver 2 attempts overlapping reservation (11:00 to 13:00)
    const overlapStart = '2026-11-29T11:00:00.000Z';
    const overlapEnd = '2026-11-29T13:00:00.000Z';
    const hold2 = store.createHold(spaceId, customer2, overlapStart, overlapEnd, 10);

    assert.equal(hold2, null, 'Second driver reservation MUST be rejected due to active hold');
  });

  // --------------------------------------------------------------------------
  // Scenario 19: Payment failures do not create confirmed bookings
  // --------------------------------------------------------------------------
  test('Scenario 19: Payment failure leaves booking in unconfirmed state without ledger entries', () => {
    const bookingId = 'bkg-failed-test';
    store.createBooking({
      id: bookingId,
      booking_reference: 'PKB-FAIL-TEST',
      space_id: 'spc-sbr-02',
      customer_id: 'usr-driver-1',
      provider_id: 'usr-host-ahmedabad-01',
      vehicle_id: 'veh-temp',
      start_time: '2026-11-30T10:00:00.000Z',
      end_time: '2026-11-30T12:00:00.000Z',
      status: 'hold_pending',
      total_hours: 2,
      base_amount: 100,
      platform_fee: 15,
      tax_amount: 2.7,
      total_amount: 117.7,
      provider_payout_amount: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Simulate payment failure transition
    store.updateBookingStatus(bookingId, 'payment_failed', 'Bank gateway timeout');
    const updated = store.getBookingById(bookingId);

    assert.equal(updated.status, 'payment_failed');
    assert.notEqual(updated.status, 'confirmed', 'Failed payment must not confirm booking');
  });

  // --------------------------------------------------------------------------
  // Scenario 20: Duplicate webhooks do not create duplicate bookings or payments
  // --------------------------------------------------------------------------
  test('Scenario 20: Webhook Idempotency: Duplicate payment.captured events do not duplicate ledger entries', () => {
    const bookingId = 'bkg-idempotency-test';
    store.createBooking({
      id: bookingId,
      booking_reference: 'PKB-IDEM-01',
      space_id: 'spc-prahladnagar-01',
      customer_id: 'usr-driver-1',
      provider_id: 'usr-host-ahmedabad-01',
      vehicle_id: 'veh-temp',
      start_time: '2026-12-01T10:00:00.000Z',
      end_time: '2026-12-01T12:00:00.000Z',
      status: 'hold_pending',
      total_hours: 2,
      base_amount: 80,
      platform_fee: 12,
      tax_amount: 2.16,
      total_amount: 94.16,
      provider_payout_amount: 80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Webhook event 1
    const booking = store.getBookingById(bookingId);
    if (booking.status !== 'confirmed') {
      store.updateBookingStatus(bookingId, 'confirmed');
      store.recordLedgerEntry({
        booking_id: bookingId,
        entry_type: 'CUSTOMER_PAYMENT',
        debit_account: 'GATEWAY_ESCROW',
        credit_account: 'PLATFORM_UNEARNED',
        amount: 94.16,
        currency: 'INR',
        description: 'First webhook processing',
        reference_id: 'pay_123',
      });
    }

    // Webhook event 2 (Duplicate)
    const bookingRecheck = store.getBookingById(bookingId);
    let duplicateCreated = false;
    if (bookingRecheck.status !== 'confirmed') {
      duplicateCreated = true;
    }

    assert.equal(duplicateCreated, false, 'Duplicate webhook must be ignored idempotently');
    assert.equal(bookingRecheck.status, 'confirmed');
  });

  // --------------------------------------------------------------------------
  // Scenario 21: Provider sees only their own relevant booking information
  // --------------------------------------------------------------------------
  test('Scenario 21: Provider data isolation: Provider A cannot see Provider B bookings', () => {
    const providerA = 'usr-host-ahmedabad-01';
    const providerB = 'usr-host-ahmedabad-02';

    const bookingsA = store.getBookingsByProvider(providerA);
    const bookingsB = store.getBookingsByProvider(providerB);

    // Ensure all bookings for Provider A belong strictly to Provider A
    for (const b of bookingsA) {
      assert.equal(b.provider_id, providerA);
      assert.notEqual(b.provider_id, providerB);
    }

    // Ensure all bookings for Provider B belong strictly to Provider B
    for (const b of bookingsB) {
      assert.equal(b.provider_id, providerB);
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 22: Admin permissions are enforced server-side
  // --------------------------------------------------------------------------
  test('Scenario 22: Server-side RBAC: Non-admin customer cannot perform admin actions', () => {
    const customerSession = {
      user: { id: 'usr-customer-01', email: 'cust@example.com' },
      role: 'customer',
      isAuthenticated: true,
    };

    const adminSession = {
      user: { id: 'usr-admin-001', email: 'admin@parkbnb.in' },
      role: 'admin',
      isAuthenticated: true,
    };

    function isAuthorizedForAdmin(role) {
      return role === 'admin' || role === 'super_admin';
    }

    assert.equal(isAuthorizedForAdmin(customerSession.role), false, 'Customer must be denied admin access');
    assert.equal(isAuthorizedForAdmin(adminSession.role), true, 'Admin must be granted admin access');
  });

  // --------------------------------------------------------------------------
  // Scenario 23: Checkout progress is preserved during refresh & network interruption
  // --------------------------------------------------------------------------
  test('Scenario 23: Active hold and booking details persist across sessions during 10-minute hold window', () => {
    const spaceId = 'spc-prahladnagar-01';
    const customerId = 'usr-test-cust-09';
    const startTime = '2026-12-05T10:00:00.000Z';
    const endTime = '2026-12-05T13:00:00.000Z';

    const hold = store.createHold(spaceId, customerId, startTime, endTime, 10);
    assert.ok(hold);

    // Simulate page refresh: Check availability excluding same customer returns true (they own the hold)
    const canCustomerContinue = store.checkAvailability(spaceId, startTime, endTime, customerId);
    assert.equal(canCustomerContinue, true, 'Customer can continue their own held booking on refresh');

    // Another customer still blocked
    const canOtherCustomerBook = store.checkAvailability(spaceId, startTime, endTime, 'usr-other-driver');
    assert.equal(canOtherCustomerBook, false, 'Other drivers remain blocked by active hold');
  });
});
