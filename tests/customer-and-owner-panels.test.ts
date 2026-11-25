import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getLocalStore } from '../src/lib/store/marketplace-store';

describe('ParkBnB Customer & Parking Owner Complete Experience Test Suite', () => {
  const store = getLocalStore();

  const testCustomerId = 'cust-test-' + Date.now();
  const testHostId = 'host-test-' + Date.now();
  const testSpaceId = 'sp-test-' + Date.now();
  const testBookingId = 'bk-test-' + Date.now();

  // Seed baseline entities
  store.createProfile({
    id: testCustomerId,
    email: 'driver.test@parkbnb.in',
    phone: '+919876543210',
    full_name: 'Rahul Sharma',
    role: 'customer',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  store.createProfile({
    id: testHostId,
    email: 'owner.test@parkbnb.in',
    phone: '+919876599999',
    full_name: 'Vikram Patel',
    role: 'provider',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  store.saveProviderProfile({
    id: testHostId,
    business_name: 'Patel Commercial Parking Services',
    business_type: 'individual',
    verification_status: 'approved',
    commission_rate: 0.15,
    payout_method: 'bank_account',
    bank_account_number: '987654321098',
    bank_ifsc: 'HDFC0001234',
    account_holder_name: 'Vikram Patel',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  store.createSpace({
    id: testSpaceId,
    provider_id: testHostId,
    title: 'Navrangpura Premium Basement Bay 1',
    description: 'Secured basement parking with 24/7 CCTV and automated gate access.',
    property_type: 'commercial',
    space_type: 'covered',
    vehicle_types: ['car', 'suv', 'ev'],
    identifier: 'B1-04',
    access_type: 'digital_gate',
    hourly_rate: 40,
    daily_rate: 300,
    monthly_rate: 4500,
    is_active: true,
    status: 'approved',
    amenities: ['cctv', 'ev_charging', 'covered', 'security_guard'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Seed test booking for today
  const bookingStart = new Date(Date.now() + 3600000).toISOString();
  const bookingEnd = new Date(Date.now() + 7200000).toISOString();

  store.createBooking({
    id: testBookingId,
    booking_reference: 'PKB-TEST-8899',
    space_id: testSpaceId,
    customer_id: testCustomerId,
    start_time: bookingStart,
    end_time: bookingEnd,
    vehicle_plate: 'GJ01AB1234',
    vehicle_type: 'car',
    base_amount: 80,
    platform_fee: 12,
    tax_amount: 2.16,
    total_amount: 94.16,
    provider_payout_amount: 80,
    status: 'confirmed',
    payment_status: 'paid',
    payment_intent_id: 'pay_test_' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // =========================================================================
  // 1. CUSTOMER PROFILE & DPDP ACT PRIVACY
  // =========================================================================
  describe('Customer Profile Management & DPDP Act Data Privacy', () => {
    it('1.1 Updates customer profile details with validation and timestamp tracking', () => {
      const updated = store.updateProfileDetails(testCustomerId, {
        fullName: 'Rahul S. Sharma',
        phone: '+919876543299',
      });

      assert.ok(updated, 'Updated profile should be returned');
      assert.strictEqual(updated.full_name, 'Rahul S. Sharma');
      assert.strictEqual(updated.phone, '+919876543299');
      assert.ok(updated.updated_at, 'Updated at timestamp must be updated');
    });

    it('1.2 Submits DPDP Act account erasure request and logs immutable audit trail', () => {
      const result = store.requestAccountDeletion(
        testCustomerId,
        'Moving abroad permanently and closing parking accounts.'
      );

      assert.strictEqual(result.success, true);
      assert.ok(result.message?.includes('DPDP Act 2023'));

      const logs = store.getAuditLogs();
      const deletionLog = logs.find(
        (l) => l.action === 'CUSTOMER_DELETION_REQUESTED' && l.category === 'privacy'
      );
      assert.ok(deletionLog, 'Privacy audit log entry must be recorded');
      assert.ok(deletionLog.details.includes(testCustomerId));
    });
  });

  // =========================================================================
  // 2. IN-APP NOTIFICATIONS SYSTEM
  // =========================================================================
  describe('In-App Notification System & Read State', () => {
    let testNotifId: string;

    it('2.1 Creates in-app notifications across distinct categories', () => {
      const notif1 = store.createNotification({
        user_id: testCustomerId,
        title: 'Booking Confirmed',
        message: 'Your slot B1-04 is confirmed at Navrangpura.',
        type: 'booking',
        link: `/account/bookings/${testBookingId}`,
      });

      const notif2 = store.createNotification({
        user_id: testCustomerId,
        title: 'Parking Starts in 30 Mins',
        message: 'Remember to present your QR pass at the gate.',
        type: 'reminder',
        link: `/account/bookings/${testBookingId}`,
      });

      assert.ok(notif1.id, 'Notification 1 must have generated ID');
      assert.strictEqual(notif1.is_read, false, 'Notification must default to unread');
      testNotifId = notif1.id;

      const userNotifs = store.getNotificationsByUser(testCustomerId);
      assert.ok(userNotifs.length >= 2, 'User should have at least 2 notifications');
      const notifIds = userNotifs.map((n) => n.id);
      assert.ok(notifIds.includes(notif1.id), 'Notification 1 must be present');
      assert.ok(notifIds.includes(notif2.id), 'Notification 2 must be present');
    });

    it('2.2 Marks a single notification as read', () => {
      const success = store.markNotificationRead(testNotifId, testCustomerId);
      assert.strictEqual(success, true);

      const notifs = store.getNotificationsByUser(testCustomerId);
      const target = notifs.find((n) => n.id === testNotifId);
      assert.strictEqual(target?.is_read, true, 'Target notification must be marked read');
    });

    it('2.3 Rejects mark read if notification belongs to another user', () => {
      const success = store.markNotificationRead(testNotifId, 'unauthorized-user');
      assert.strictEqual(success, false, 'Cross-user mark read must be rejected');
    });

    it('2.4 Marks all remaining notifications as read in bulk', () => {
      const readCount = store.markAllNotificationsRead(testCustomerId);
      assert.ok(readCount >= 1, 'At least 1 remaining notification was marked read');

      const notifs = store.getNotificationsByUser(testCustomerId);
      const unread = notifs.filter((n) => !n.is_read);
      assert.strictEqual(unread.length, 0, 'Zero unread notifications must remain');
    });
  });

  // =========================================================================
  // 3. REFUNDS & LEDGER RECONCILIATION
  // =========================================================================
  describe('Customer Refunds & Financial Tracking', () => {
    it('3.1 Rejects refund request from non-owner customer', () => {
      const result = store.requestCustomerRefund({
        bookingId: testBookingId,
        customerId: 'stranger-id',
        reason: 'Fraudulent attempt',
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error?.includes('Unauthorized'));
    });

    it('3.2 Submits valid customer refund request and dispatches customer notification', () => {
      const result = store.requestCustomerRefund({
        bookingId: testBookingId,
        customerId: testCustomerId,
        reason: 'Meeting was rescheduled by client, slot not used.',
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.refund, 'Refund record must be created');
      assert.strictEqual(result.refund.booking_id, testBookingId);
      assert.strictEqual(result.refund.status, 'requested');
      assert.strictEqual(result.refund.amount, 94.16);

      // Verify refund query
      const customerRefunds = store.getRefundsByCustomer(testCustomerId);
      assert.ok(customerRefunds.length >= 1);
      assert.strictEqual(customerRefunds[0].booking_id, testBookingId);

      // Verify notification was sent
      const notifs = store.getNotificationsByUser(testCustomerId);
      const refundNotif = notifs.find((n) => n.title.includes('Refund Request Received'));
      assert.ok(refundNotif, 'Customer must receive notification for refund submission');
    });

    it('3.3 Prevents duplicate pending refund requests on the same reservation', () => {
      const result = store.requestCustomerRefund({
        bookingId: testBookingId,
        customerId: testCustomerId,
        reason: 'Second duplicate attempt',
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error?.includes('already pending review'));
    });
  });

  // =========================================================================
  // 4. OWNER AVAILABILITY CALENDAR & COLLISION PREVENTION
  // =========================================================================
  describe('Parking Owner Availability Calendar & Collision Guard', () => {
    let createdBlockId: string;

    it('4.1 Rejects availability block when colliding with an existing confirmed booking', () => {
      // Overlaps with testBookingId (bookingStart to bookingEnd)
      const collisionResult = store.createAvailabilityBlock({
        spaceId: testSpaceId,
        providerId: testHostId,
        startTime: bookingStart,
        endTime: bookingEnd,
        reason: 'Repainting floor markings',
      });

      assert.strictEqual(collisionResult.success, false);
      assert.ok(
        collisionResult.error?.includes('Collision detected'),
        'Collision with confirmed booking must be rejected'
      );
    });

    it('4.2 Rejects availability block creation by an unauthorized host', () => {
      const blockStart = new Date(Date.now() + 86400000).toISOString();
      const blockEnd = new Date(Date.now() + 90000000).toISOString();

      const result = store.createAvailabilityBlock({
        spaceId: testSpaceId,
        providerId: 'unauthorized-host',
        startTime: blockStart,
        endTime: blockEnd,
        reason: 'Host unauthorized',
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error?.includes('Unauthorized'));
    });

    it('4.3 Successfully creates availability block on conflict-free schedule', () => {
      const blockStart = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
      const blockEnd = new Date(Date.now() + 93600000).toISOString();

      const result = store.createAvailabilityBlock({
        spaceId: testSpaceId,
        providerId: testHostId,
        startTime: blockStart,
        endTime: blockEnd,
        reason: 'Scheduled electrical cabling maintenance',
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.block);
      assert.strictEqual(result.block.space_id, testSpaceId);
      createdBlockId = result.block.id;

      // Verify block is included in provider availability queries
      const hostBlocks = store.getAvailabilityBlocksByProvider(testHostId);
      assert.ok(hostBlocks.some((b) => b.id === createdBlockId));
    });

    it('4.4 checkAvailability strictly rejects customer booking during blocked maintenance interval', () => {
      const blockStart = new Date(Date.now() + 86400000).toISOString();
      const blockEnd = new Date(Date.now() + 93600000).toISOString();

      const isAvailable = store.checkAvailability(testSpaceId, blockStart, blockEnd);
      assert.strictEqual(isAvailable, false, 'Space must be unavailable during owner maintenance block');
    });

    it('4.5 Deletes availability block and immediately restores space bookability', () => {
      const deleted = store.deleteAvailabilityBlock(createdBlockId, testHostId);
      assert.strictEqual(deleted, true);

      const blockStart = new Date(Date.now() + 86400000).toISOString();
      const blockEnd = new Date(Date.now() + 93600000).toISOString();

      const isAvailableNow = store.checkAvailability(testSpaceId, blockStart, blockEnd);
      assert.strictEqual(isAvailableNow, true, 'Space must be available again once block is removed');
    });
  });

  // =========================================================================
  // 5. OWNER REVIEWS, REPLIES & REPORTING
  // =========================================================================
  describe('Owner Reviews Moderation & Customer Feedback Thread', () => {
    let reviewId: string;

    it('5.1 Creates a genuine driver review for the parking space', () => {
      const review = store.addReview({
        booking_id: testBookingId,
        space_id: testSpaceId,
        customer_id: testCustomerId,
        rating: 5,
        comment: 'Great security guards and clean basement parking. Will book again!',
        is_approved: true,
      });

      assert.ok(review.id);
      reviewId = review.id;

      const providerReviews = store.getReviewsByProvider(testHostId);
      assert.ok(providerReviews.some((r) => r.id === reviewId));
    });

    it('5.2 Allows parking owner to submit professional reply and notifies driver', () => {
      const result = store.addReviewResponse(
        reviewId,
        testHostId,
        'Thank you Rahul! We look forward to hosting your vehicle again.'
      );

      assert.strictEqual(result.success, true);

      // Verify response attached
      const reviews = store.getReviewsByProvider(testHostId);
      const targetReview = reviews.find((r) => r.id === reviewId);
      assert.ok(targetReview?.response);
      assert.strictEqual(
        targetReview.response.response_text,
        'Thank you Rahul! We look forward to hosting your vehicle again.'
      );

      // Verify driver notified of owner reply
      const notifs = store.getNotificationsByUser(testCustomerId);
      const replyNotif = notifs.find((n) => n.title.includes('Parking Owner Replied'));
      assert.ok(replyNotif, 'Driver must receive notification of owner review reply');
    });

    it('5.3 Allows parking owner to report policy-violating review with audit log', () => {
      const reportResult = store.reportReview(
        reviewId,
        'Contains competitor promotional spam'
      );

      assert.strictEqual(reportResult.success, true);

      const reviews = store.getReviewsByProvider(testHostId);
      const targetReview = reviews.find((r) => r.id === reviewId);
      assert.strictEqual(targetReview?.is_reported, true);
      assert.strictEqual(targetReview?.report_reason, 'Contains competitor promotional spam');

      const logs = store.getAuditLogs();
      const reportLog = logs.find((l) => l.action === 'REVIEW_REPORTED_BY_OWNER');
      assert.ok(reportLog, 'Review report audit log must be recorded');
    });
  });

  // =========================================================================
  // 6. OWNER SPACE SPECIFICATIONS & OPERATIONAL CONTROLS
  // =========================================================================
  describe('Owner Space Specification Updates & Active Controls', () => {
    it('6.1 Updates space rates, amenities, and access instructions', () => {
      const updated = store.updateSpace(testSpaceId, {
        hourly_rate: 45,
        daily_rate: 350,
        access_instructions: 'Show QR code to Security Guard at Entrance Gate 2.',
      });

      assert.ok(updated);
      assert.strictEqual(updated.hourly_rate, 45);
      assert.strictEqual(updated.daily_rate, 350);
      assert.strictEqual(
        updated.access_instructions,
        'Show QR code to Security Guard at Entrance Gate 2.'
      );
    });

    it('6.2 Pausing space removes it from public availability check', () => {
      store.updateSpace(testSpaceId, { is_active: false });

      const futureStart = new Date(Date.now() + 10000000).toISOString();
      const futureEnd = new Date(Date.now() + 15000000).toISOString();

      const isAvailable = store.checkAvailability(testSpaceId, futureStart, futureEnd);
      assert.strictEqual(isAvailable, false, 'Paused space must not be bookable');

      // Re-activate
      store.updateSpace(testSpaceId, { is_active: true });
      const isAvailableAgain = store.checkAvailability(testSpaceId, futureStart, futureEnd);
      assert.strictEqual(isAvailableAgain, true, 'Reactivated space must be bookable');
    });
  });
});
