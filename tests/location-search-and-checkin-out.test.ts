import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getLocalStore } from '../src/lib/store/marketplace-store';
import { calculateDistanceKm, formatDistanceInfo, sortByDistance } from '../src/lib/geo/distance';
import { Booking, ParkingSpace } from '../src/types/database';

describe('ParkBnB Customer Location Discovery & In/Out Gate Management', () => {
  const store = getLocalStore();

  // -------------------------------------------------------------
  // SUITE 1: CUSTOMER LOCATION FETCH & NEAREST PARKING CALCULATION
  // -------------------------------------------------------------
  describe('Customer Location Fetch & Nearest Parking Discovery', () => {
    test('1. Haversine distance formula calculates accurate distance in kilometers', () => {
      // Prahlad Nagar Garden (23.0124, 72.5085) to Bodakdev SG Highway (23.0450, 72.5080) ~ 3.6 km
      const lat1 = 23.0124;
      const lon1 = 72.5085;
      const lat2 = 23.0450;
      const lon2 = 72.5080;

      const dist = calculateDistanceKm(lat1, lon1, lat2, lon2);
      assert.ok(dist >= 3.4 && dist <= 3.8, `Expected ~3.6 km, got ${dist}`);

      // Distance to exact same spot must be 0
      assert.equal(calculateDistanceKm(lat1, lon1, lat1, lon1), 0);
    });

    test('2. Walking and driving duration estimates scale accurately with distance', () => {
      // 0.5 km (~500m)
      const near = formatDistanceInfo(0.5);
      assert.equal(near.distanceText, '500 m');
      assert.ok(near.walkingTimeMinutes >= 5 && near.walkingTimeMinutes <= 9);

      // 4.5 km
      const med = formatDistanceInfo(4.5);
      assert.equal(med.distanceText, '4.5 km');
      assert.ok(med.walkingTimeMinutes >= 55 && med.walkingTimeMinutes <= 65);
      assert.ok(med.drivingTimeMinutes >= 10 && med.drivingTimeMinutes <= 15);
    });

    test('3. sortByDistance sorts parking spaces strictly by proximity to customer coordinates', () => {
      // Customer is at Prahlad Nagar Garden (23.0124, 72.5085)
      const customerLat = 23.0124;
      const customerLng = 72.5085;

      const mockSpaces = [
        {
          id: 'spc-far',
          title: 'Far Airport Parking',
          property: { latitude: 23.0734, longitude: 72.6266 }, // ~14 km away
        },
        {
          id: 'spc-very-close',
          title: 'Prahlad Nagar Basement Bay',
          property: { latitude: 23.0130, longitude: 72.5090 }, // ~0.1 km away
        },
        {
          id: 'spc-mid',
          title: 'Bodakdev Surface Lot',
          property: { latitude: 23.0450, longitude: 72.5080 }, // ~3.6 km away
        },
      ];

      const sorted = sortByDistance(mockSpaces, customerLat, customerLng);

      assert.equal(sorted[0].id, 'spc-very-close', 'Closest spot must be ranked #1');
      assert.equal(sorted[1].id, 'spc-mid', 'Intermediate spot must be ranked #2');
      assert.equal(sorted[2].id, 'spc-far', 'Furthest spot must be ranked #3');

      assert.ok(sorted[0].distanceKm < sorted[1].distanceKm);
      assert.ok(sorted[1].distanceKm < sorted[2].distanceKm);
    });

    test('4. Radius filtering accurately isolates spaces within requested threshold', () => {
      const customerLat = 23.0124;
      const customerLng = 72.5085;

      const mockSpaces = [
        { id: '1', property: { latitude: 23.0130, longitude: 72.5090 } }, // ~0.1 km (within 2km)
        { id: '2', property: { latitude: 23.0250, longitude: 72.5100 } }, // ~1.4 km (within 2km)
        { id: '3', property: { latitude: 23.0450, longitude: 72.5080 } }, // ~3.6 km (within 5km, not 2km)
        { id: '4', property: { latitude: 23.0734, longitude: 72.6266 } }, // ~14 km (over 10km)
      ];

      const within2Km = mockSpaces.filter(s => {
        const d = calculateDistanceKm(customerLat, customerLng, s.property.latitude, s.property.longitude);
        return d <= 2.0;
      });
      assert.equal(within2Km.length, 2);

      const within5Km = mockSpaces.filter(s => {
        const d = calculateDistanceKm(customerLat, customerLng, s.property.latitude, s.property.longitude);
        return d <= 5.0;
      });
      assert.equal(within5Km.length, 3);
    });
  });

  // -------------------------------------------------------------
  // SUITE 2: "WHEN IN" CHECK-IN LIFECYCLE MANAGEMENT
  // -------------------------------------------------------------
  describe('Gate Arrival Check-In ("When In") Management', () => {
    test('1. Customer self-check-in confirms arrival, transitions status to active, and logs check_in_at', () => {
      const customerId = 'cust-checkin-' + Math.random().toString(36).substring(2, 7);
      const hostId = 'host-checkin-' + Math.random().toString(36).substring(2, 7);
      const bookingId = 'bkg-test-' + Math.random().toString(36).substring(2, 7);

      const booking: Booking = {
        id: bookingId,
        booking_reference: 'PKB-TEST-001',
        space_id: 'spc-test',
        customer_id: customerId,
        provider_id: hostId,
        vehicle_id: 'veh-1',
        start_time: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        end_time: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
        status: 'confirmed',
        total_hours: 2,
        base_amount: 80,
        platform_fee: 12,
        tax_amount: 2.16,
        total_amount: 94.16,
        provider_payout_amount: 80,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.createBooking(booking);

      // Execute customer self check-in
      const res = store.customerCheckInBooking(bookingId, customerId);
      assert.ok(res.success);
      assert.ok(res.booking);
      assert.equal(res.booking.status, 'active');
      assert.ok(res.booking.check_in_at, 'check_in_at timestamp must be populated');

      const auditLogs = store.getAuditLogs();
      const inLog = auditLogs.find(l => l.action === 'DRIVER_SELF_CHECK_IN' && l.target_id === bookingId);
      assert.ok(inLog, 'Driver self check-in audit record must be generated');
    });

    test('2. Unauthorized customer cannot check in another customer reservation', () => {
      const legitCustomerId = 'cust-legit';
      const imposterCustomerId = 'cust-imposter';
      const bookingId = 'bkg-sec-' + Math.random().toString(36).substring(2, 7);

      const booking: Booking = {
        id: bookingId,
        booking_reference: 'PKB-SEC-002',
        space_id: 'spc-test',
        customer_id: legitCustomerId,
        provider_id: 'host-1',
        vehicle_id: 'veh-1',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        status: 'confirmed',
        total_hours: 1,
        base_amount: 40,
        platform_fee: 6,
        tax_amount: 1.08,
        total_amount: 47.08,
        provider_payout_amount: 40,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.createBooking(booking);

      const res = store.customerCheckInBooking(bookingId, imposterCustomerId);
      assert.equal(res.success, false);
      assert.ok(res.error?.includes('Unauthorized'));
    });

    test('3. Host can also perform gate check-in when driver arrives at the gate', () => {
      const customerId = 'cust-hostin';
      const hostId = 'host-guard';
      const bookingId = 'bkg-hostin-' + Math.random().toString(36).substring(2, 7);

      const booking: Booking = {
        id: bookingId,
        booking_reference: 'PKB-HOSTIN-003',
        space_id: 'spc-test',
        customer_id: customerId,
        provider_id: hostId,
        vehicle_id: 'veh-1',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        status: 'confirmed',
        total_hours: 1,
        base_amount: 40,
        platform_fee: 6,
        tax_amount: 1.08,
        total_amount: 47.08,
        provider_payout_amount: 40,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.createBooking(booking);

      const res = store.hostCheckInBooking(bookingId, hostId);
      assert.ok(res.success);
      assert.equal(res.booking?.status, 'active');
      assert.ok(res.booking?.check_in_at);
    });
  });

  // -------------------------------------------------------------
  // SUITE 3: "WHEN OUT" CHECK-OUT & OVERSTAY MANAGEMENT
  // -------------------------------------------------------------
  describe('Gate Departure Check-Out ("When Out") & Overstay Management', () => {
    test('1. On-time customer check-out logs check_out_at, completes booking, and releases slot', () => {
      const customerId = 'cust-checkout-ontime';
      const bookingId = 'bkg-ontime-' + Math.random().toString(36).substring(2, 7);

      const booking: Booking = {
        id: bookingId,
        booking_reference: 'PKB-ONTIME-004',
        space_id: 'spc-test',
        customer_id: customerId,
        provider_id: 'host-1',
        vehicle_id: 'veh-1',
        start_time: new Date(Date.now() - 3600000).toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour remaining (On time)
        status: 'active',
        total_hours: 2,
        base_amount: 80,
        platform_fee: 12,
        tax_amount: 2.16,
        total_amount: 94.16,
        provider_payout_amount: 80,
        check_in_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.createBooking(booking);

      const res = store.customerCheckOutBooking(bookingId, customerId);
      assert.ok(res.success);
      assert.equal(res.booking?.status, 'completed');
      assert.ok(res.booking?.check_out_at);
      assert.equal(res.booking?.overstay_minutes, null, 'No overstay for on-time exit');
    });

    test('2. Overstay check-out calculates overtime duration and extra charge', () => {
      const customerId = 'cust-overstay';
      const bookingId = 'bkg-overstay-' + Math.random().toString(36).substring(2, 7);

      // Booked departure was 45 minutes AGO
      const scheduledEnd = new Date(Date.now() - 1000 * 60 * 45).toISOString();

      const booking: Booking = {
        id: bookingId,
        booking_reference: 'PKB-OVERSTAY-005',
        space_id: 'spc-test',
        customer_id: customerId,
        provider_id: 'host-1',
        vehicle_id: 'veh-1',
        start_time: new Date(Date.now() - 1000 * 60 * 165).toISOString(),
        end_time: scheduledEnd,
        status: 'active',
        total_hours: 2,
        base_amount: 80,
        platform_fee: 12,
        tax_amount: 2.16,
        total_amount: 94.16,
        provider_payout_amount: 80,
        check_in_at: new Date(Date.now() - 1000 * 60 * 165).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.createBooking(booking);

      const res = store.customerCheckOutBooking(bookingId, customerId);
      assert.ok(res.success);
      assert.equal(res.booking?.status, 'completed');
      assert.ok(res.booking?.overstay_minutes && res.booking.overstay_minutes >= 44);
      assert.ok(res.booking?.overstay_amount && res.booking.overstay_amount >= 40, 'Overstay charges must apply');

      const auditLogs = store.getAuditLogs();
      const outLog = auditLogs.find(l => l.action === 'DRIVER_SELF_CHECK_OUT' && l.target_id === bookingId);
      assert.ok(outLog);
      assert.ok(outLog.details.includes('Overstay'));
    });

    test('3. Host check-out departs vehicle and completes reservation', () => {
      const hostId = 'host-gate-exit';
      const bookingId = 'bkg-hostout-' + Math.random().toString(36).substring(2, 7);

      const booking: Booking = {
        id: bookingId,
        booking_reference: 'PKB-HOSTOUT-006',
        space_id: 'spc-test',
        customer_id: 'cust-1',
        provider_id: hostId,
        vehicle_id: 'veh-1',
        start_time: new Date(Date.now() - 3600000).toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        status: 'active',
        total_hours: 2,
        base_amount: 80,
        platform_fee: 12,
        tax_amount: 2.16,
        total_amount: 94.16,
        provider_payout_amount: 80,
        check_in_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.createBooking(booking);

      const res = store.hostCheckOutBooking(bookingId, hostId);
      assert.ok(res.success);
      assert.equal(res.booking?.status, 'completed');
      assert.ok(res.booking?.check_out_at);
    });
  });
});
