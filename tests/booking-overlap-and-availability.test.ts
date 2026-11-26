import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { getLocalStore } from '../src/lib/store/marketplace-store';
import { repository, ensureValidUuid } from '../src/lib/db/supabase-repository';
import {
  checkSpaceAvailabilityAction,
  checkBatchAvailabilityAction,
  getSpaceBookedIntervalsAction
} from '../src/server/actions/booking-actions';
import { Booking, ParkingSpace, Property } from '../src/types/database';

describe('ParkBnB Slot Availability & Overlapping Booking Prevention Architecture', () => {
  const store = getLocalStore();

  // Test setup: Create a dedicated test space
  const testSpaceId = 'spc-overlap-test-' + Math.random().toString(36).substring(2, 7);
  const testSpaceUuid = ensureValidUuid(testSpaceId);
  const testPublicId = 'PBN-S-OVL' + Math.floor(100 + Math.random() * 900);
  const providerId = 'usr-host-overlap-01';

  const testSpace: ParkingSpace = {
    id: testSpaceId,
    space_public_id: testPublicId,
    owner_public_id: 'PBN-O-OVL001',
    property_id: 'prop-overlap-01',
    provider_id: providerId,
    identifier: 'Bay Overlap-99',
    title: 'Test Overlap Spot Bodakdev',
    description: 'Unit testing bay for overlap verification',
    parking_type: 'covered',
    hourly_rate: 50.0,
    daily_rate: 400.0,
    min_duration_hours: 1,
    max_duration_hours: 24,
    access_instructions: 'Gate 1',
    security_features: ['cctv', 'gated_security'],
    has_ev_charging: true,
    status: 'approved',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    vehicle_types: ['car_sedan', 'car_suv'],
  };

  store.createSpace(testSpace);

  // Reference slot: Tomorrow 10:00 to 14:00 UTC
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const slotStart = `${tomorrow}T10:00:00Z`;
  const slotEnd = `${tomorrow}T14:00:00Z`;

  const customer1Id = 'usr-cust-first-booker';
  const customer2Id = 'usr-cust-second-booker';

  describe('1. Confirmed Booking Overlap Detection across all time boundaries', () => {
    // Create an initial confirmed booking on testSpace
    const initialBookingId = 'bk-test-existing-01';
    const confirmedBooking: Booking = {
      id: initialBookingId,
      booking_reference: 'PKB-TEST-OVL1',
      booking_customer_reference: 'PBN-REF-OVL1',
      customer_display_name: 'Ankit S.',
      space_id: testSpaceId,
      customer_id: customer1Id,
      provider_id: providerId,
      vehicle_id: 'veh-01',
      start_time: slotStart,
      end_time: slotEnd,
      status: 'confirmed',
      total_hours: 4,
      base_amount: 200,
      platform_fee: 30,
      tax_amount: 5.4,
      total_amount: 235.4,
      provider_payout_amount: 170,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.createBooking(confirmedBooking);

    test('1.1 Exact same time reservation must be strictly blocked', async () => {
      const isAvailable = await repository.isSpaceAvailable(testSpaceId, slotStart, slotEnd, customer2Id);
      assert.equal(isAvailable, false, 'Exact overlapping booking must be rejected');
    });

    test('1.2 Internal partial overlap (e.g. 11:00 to 13:00) must be blocked', async () => {
      const reqStart = `${tomorrow}T11:00:00Z`;
      const reqEnd = `${tomorrow}T13:00:00Z`;
      const isAvailable = await repository.isSpaceAvailable(testSpaceId, reqStart, reqEnd, customer2Id);
      assert.equal(isAvailable, false, 'Booking inside existing slot must be blocked');
    });

    test('1.3 Overlapping arrival boundary (09:00 to 11:00) must be blocked', async () => {
      const reqStart = `${tomorrow}T09:00:00Z`;
      const reqEnd = `${tomorrow}T11:00:00Z`;
      const isAvailable = await repository.isSpaceAvailable(testSpaceId, reqStart, reqEnd, customer2Id);
      assert.equal(isAvailable, false, 'Booking overlapping start boundary must be blocked');
    });

    test('1.4 Overlapping departure boundary (13:00 to 15:00) must be blocked', async () => {
      const reqStart = `${tomorrow}T13:00:00Z`;
      const reqEnd = `${tomorrow}T15:00:00Z`;
      const isAvailable = await repository.isSpaceAvailable(testSpaceId, reqStart, reqEnd, customer2Id);
      assert.equal(isAvailable, false, 'Booking overlapping end boundary must be blocked');
    });

    test('1.5 Complete enclosing slot (08:00 to 16:00) must be blocked', async () => {
      const reqStart = `${tomorrow}T08:00:00Z`;
      const reqEnd = `${tomorrow}T16:00:00Z`;
      const isAvailable = await repository.isSpaceAvailable(testSpaceId, reqStart, reqEnd, customer2Id);
      assert.equal(isAvailable, false, 'Booking completely engulfing booked window must be blocked');
    });

    test('1.6 Non-overlapping slot strictly before (07:00 to 09:30) must be ALLOWED', async () => {
      const reqStart = `${tomorrow}T07:00:00Z`;
      const reqEnd = `${tomorrow}T09:30:00Z`;
      const isAvailable = await repository.isSpaceAvailable(testSpaceId, reqStart, reqEnd, customer2Id);
      assert.equal(isAvailable, true, 'Slot before booked window must be allowed');
    });

    test('1.7 Non-overlapping slot strictly after (14:30 to 18:00) must be ALLOWED', async () => {
      const reqStart = `${tomorrow}T14:30:00Z`;
      const reqEnd = `${tomorrow}T18:00:00Z`;
      const isAvailable = await repository.isSpaceAvailable(testSpaceId, reqStart, reqEnd, customer2Id);
      assert.equal(isAvailable, true, 'Slot after booked window must be allowed');
    });
  });

  describe('2. Cross-Identifier Representation Matching (UUID, Raw Slug, Public ID)', () => {
    test('2.1 Availability check with deterministic UUID correctly detects booking on raw slug', async () => {
      const isAvailable = await repository.isSpaceAvailable(testSpaceUuid, slotStart, slotEnd, customer2Id);
      assert.equal(isAvailable, false, 'Checking by UUID must detect booking made by raw slug');
    });

    test('2.2 Availability check with public ID (e.g. PBN-S-OVLxxx) detects booking', async () => {
      const isAvailable = await repository.isSpaceAvailable(testPublicId, slotStart, slotEnd, customer2Id);
      assert.equal(isAvailable, false, 'Checking by public ID must detect booking');
    });

    test('2.3 Store getBookedIntervals returns all conflicting intervals for the date', () => {
      const intervals = store.getBookedIntervals(testSpaceId, tomorrow);
      assert.ok(intervals.length >= 1, 'Should find at least 1 booked interval');
      assert.equal(intervals[0].startTime, slotStart);
      assert.equal(intervals[0].endTime, slotEnd);
    });
  });

  describe('3. Concurrency Protection via Temporary Booking Holds', () => {
    const afterSlotStart = `${tomorrow}T15:00:00Z`;
    const afterSlotEnd = `${tomorrow}T17:00:00Z`;

    test('3.1 Customer A can create a 10-minute hold on an available slot', async () => {
      const hold = await repository.createHold(testSpaceId, customer1Id, afterSlotStart, afterSlotEnd, 10);
      assert.ok(hold, 'Hold should be created successfully');
      assert.equal(hold.space_id, testSpaceId);
      assert.equal(hold.customer_id, customer1Id);
      assert.equal(hold.is_active, true);
    });

    test('3.2 Customer B is BLOCKED while Customer A holds the slot', async () => {
      const isAvailableForCust2 = await repository.isSpaceAvailable(testSpaceId, afterSlotStart, afterSlotEnd, customer2Id);
      assert.equal(isAvailableForCust2, false, 'Slot held by Customer A must be unavailable to Customer B');

      const holdCust2 = await repository.createHold(testSpaceId, customer2Id, afterSlotStart, afterSlotEnd, 10);
      assert.equal(holdCust2, null, 'Customer B cannot create a concurrent hold on Customer A slot');
    });

    test('3.3 Customer A who holds the slot CAN proceed through availability check', async () => {
      const isAvailableForHolder = await repository.isSpaceAvailable(testSpaceId, afterSlotStart, afterSlotEnd, customer1Id);
      assert.equal(isAvailableForHolder, true, 'Holder customer must be permitted to complete checkout');
    });

    test('3.4 Releasing the hold restores availability to all customers', async () => {
      await repository.releaseHold(testSpaceId, customer1Id);
      const isAvailableNow = await repository.isSpaceAvailable(testSpaceId, afterSlotStart, afterSlotEnd, customer2Id);
      assert.equal(isAvailableNow, true, 'Releasing the hold must immediately free up the slot');
    });
  });

  describe('4. Server Actions for Real-Time UI Integration', () => {
    test('4.1 checkSpaceAvailabilityAction accurately reports slot conflict', async () => {
      const res = await checkSpaceAvailabilityAction({
        spaceId: testSpaceId,
        startTime: slotStart,
        endTime: slotEnd,
      });

      assert.equal(res.available, false, 'Should be unavailable due to existing booking');
      assert.ok(res.error, 'Should contain human-friendly conflict error message');
      assert.ok(res.intervals && res.intervals.length > 0, 'Should include conflicting intervals');
    });

    test('4.2 checkSpaceAvailabilityAction returns available: true for non-overlapping slot', async () => {
      const res = await checkSpaceAvailabilityAction({
        spaceId: testSpaceId,
        startTime: `${tomorrow}T18:00:00Z`,
        endTime: `${tomorrow}T20:00:00Z`,
      });

      assert.equal(res.available, true, 'Non-overlapping slot must report available');
      assert.equal(res.error, undefined);
    });

    test('4.3 checkBatchAvailabilityAction returns map with correct status for search results', async () => {
      const batchRes = await checkBatchAvailabilityAction({
        spaceIds: [testSpaceId],
        startTime: slotStart,
        endTime: slotEnd,
      });

      assert.equal(batchRes.availabilityMap[testSpaceId], false, 'Batch check must flag testSpaceId as false');

      const batchResFree = await checkBatchAvailabilityAction({
        spaceIds: [testSpaceId],
        startTime: `${tomorrow}T18:00:00Z`,
        endTime: `${tomorrow}T20:00:00Z`,
      });

      assert.equal(batchResFree.availabilityMap[testSpaceId], true, 'Batch check must flag testSpaceId as true for free slot');
    });

    test('4.4 Rejects invalid time range where departure <= arrival', async () => {
      const invalidRes = await checkSpaceAvailabilityAction({
        spaceId: testSpaceId,
        startTime: `${tomorrow}T14:00:00Z`,
        endTime: `${tomorrow}T10:00:00Z`,
      });

      assert.equal(invalidRes.available, false);
      assert.ok(invalidRes.error?.includes('strictly after'));
    });
  });
});
