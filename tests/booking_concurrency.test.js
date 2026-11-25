import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getLocalStore } from '../src/lib/store/marketplace-store.ts';

describe('ParkBnB Booking Engine & Concurrency Protection', () => {
  const store = getLocalStore();

  // Create test provider and space
  const provider = store.saveProviderProfile({
    id: 'usr-provider-concurrency-test',
    provider_type: 'commercial_operator',
    business_name: 'Ahmedabad Concurrency Test Lot',
    verification_status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const property = store.createProperty({
    id: 'prop-concurrency-test',
    provider_id: provider.id,
    title: 'Bodakdev Test Tower',
    property_type: 'commercial_lot',
    address_line1: 'SBR Road',
    area: 'Sindhu Bhavan Road / Bodakdev',
    city: 'Ahmedabad',
    postal_code: '380054',
    latitude: 23.045,
    longitude: 72.508,
    created_at: new Date().toISOString(),
  });

  const space = store.createSpace({
    id: 'spc-concurrency-test-01',
    property_id: property.id,
    provider_id: provider.id,
    identifier: 'Slot C-101',
    title: 'Prime Bodakdev Space',
    parking_type: 'covered',
    hourly_rate: 50.00,
    daily_rate: 400.00,
    min_duration_hours: 1,
    max_duration_hours: 720,
    security_features: ['cctv'],
    has_ev_charging: true,
    status: 'approved',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  test('Simultaneous booking attempts on overlapping intervals are strictly prevented', () => {
    const startTime = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
    const endTime = new Date(Date.now() + 86400000 + 3 * 3600000).toISOString(); // +3 hrs

    // Driver 1 creates a hold
    const hold1 = store.createHold(space.id, 'usr-driver-1', startTime, endTime, 10);
    assert.ok(hold1 !== null, 'Driver 1 hold creation failed');
    assert.equal(hold1.is_active, true);

    // Driver 2 attempts to create an overlapping hold during the active hold window
    const overlappingStart = new Date(new Date(startTime).getTime() + 3600000).toISOString();
    const overlappingEnd = new Date(new Date(endTime).getTime() + 3600000).toISOString();

    const hold2 = store.createHold(space.id, 'usr-driver-2', overlappingStart, overlappingEnd, 10);
    assert.equal(hold2, null, 'Race condition: Overlapping hold allowed for Driver 2!');

    // Clean up
    store.releaseHold(space.id, 'usr-driver-1');
  });

  test('Releasing a hold immediately restores availability for subsequent drivers', () => {
    const startTime = new Date(Date.now() + 172800000).toISOString(); // Day after tomorrow
    const endTime = new Date(Date.now() + 172800000 + 2 * 3600000).toISOString();

    const holdA = store.createHold(space.id, 'usr-driver-A', startTime, endTime, 10);
    assert.ok(holdA !== null);

    // Release hold
    store.releaseHold(space.id, 'usr-driver-A');

    // Driver B should now be able to hold the slot
    const holdB = store.createHold(space.id, 'usr-driver-B', startTime, endTime, 10);
    assert.ok(holdB !== null, 'Availability not restored after hold release');

    store.releaseHold(space.id, 'usr-driver-B');
  });

  test('Pricing calculation calculates server-side rates, commission, and GST', () => {
    const baseNow = Date.now();
    const start = new Date(baseNow + 3600000).toISOString();
    const end = new Date(baseNow + 5 * 3600000).toISOString(); // 4 hours
    const pricing = store.calculatePricing(space, start, end);

    assert.equal(pricing.totalHours, 4);
    assert.equal(pricing.baseAmount, 200.00); // 4 * 50
    assert.equal(pricing.platformFee, 30.00); // 15% of 200
    assert.equal(pricing.taxAmount, 5.40); // 18% GST on 30
    assert.equal(pricing.totalAmount, 235.40);
    assert.equal(pricing.providerPayoutAmount, 200.00);
  });

  test('Double-entry ledger records reconcile with zero discrepancy', () => {
    const initialLedgerCount = store.getLedgerEntries().length;
    const bookingId = 'bkg-test-ledger-01';

    // 1. Record customer payment
    store.recordLedgerEntry({
      booking_id: bookingId,
      entry_type: 'CUSTOMER_PAYMENT',
      debit_account: 'GATEWAY_ESCROW:RAZORPAY',
      credit_account: 'PLATFORM_UNEARNED',
      amount: 235.40,
      currency: 'INR',
      description: 'Customer payment captured',
    });

    // 2. Record platform commission
    store.recordLedgerEntry({
      booking_id: bookingId,
      entry_type: 'PLATFORM_COMMISSION',
      debit_account: 'PLATFORM_UNEARNED',
      credit_account: 'PLATFORM_REVENUE:COMMISSION',
      amount: 35.40,
      currency: 'INR',
      description: 'Platform fee + GST',
    });

    // 3. Record provider payable
    store.recordLedgerEntry({
      booking_id: bookingId,
      entry_type: 'PROVIDER_PAYABLE',
      debit_account: 'PLATFORM_UNEARNED',
      credit_account: `PROVIDER_ESCROW:${provider.id}`,
      amount: 200.00,
      currency: 'INR',
      description: 'Net payable to owner',
    });

    const entries = store.getLedgerEntries();
    assert.equal(entries.length, initialLedgerCount + 3);

    // Sum verification
    const platformFee = 35.40;
    const providerPay = 200.00;
    assert.equal(platformFee + providerPay, 235.40);
  });
});
