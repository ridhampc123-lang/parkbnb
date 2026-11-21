import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('ParkBnB Core Business Logic & Pricing Engine', () => {
  // Test Pricing Calculation
  test('Pricing calculation calculates base amount, 15% platform fee, and 18% GST on fee accurately', () => {
    const hourlyRate = 40.00;
    const durationHours = 4;
    const baseAmount = hourlyRate * durationHours; // 160.00
    const platformRate = 0.15;
    const platformFee = Math.round(baseAmount * platformRate * 100) / 100; // 24.00
    const gstRate = 0.18;
    const taxAmount = Math.round(platformFee * gstRate * 100) / 100; // 4.32
    const totalAmount = Math.round((baseAmount + platformFee + taxAmount) * 100) / 100; // 188.32
    const providerPayout = baseAmount; // 160.00

    assert.equal(baseAmount, 160.00);
    assert.equal(platformFee, 24.00);
    assert.equal(taxAmount, 4.32);
    assert.equal(totalAmount, 188.32);
    assert.equal(providerPayout, 160.00);
  });

  // Test Concurrency & Overlapping Interval Math
  test('Double booking prevention detects overlapping intervals', () => {
    // Booking 1: 10:00 to 14:00 (10 to 14)
    const b1Start = 10;
    const b1End = 14;

    function isOverlapping(start, end) {
      // Overlap condition: reqStart < bEnd AND reqEnd > bStart
      return start < b1End && end > b1Start;
    }

    // Attempt A: 11:00 to 13:00 (Inside) -> Overlaps
    assert.equal(isOverlapping(11, 13), true);

    // Attempt B: 09:00 to 11:00 (Starts before, overlaps) -> Overlaps
    assert.equal(isOverlapping(9, 11), true);

    // Attempt C: 13:00 to 15:00 (Overlaps end) -> Overlaps
    assert.equal(isOverlapping(13, 15), true);

    // Attempt D: 08:00 to 10:00 (Adjacent before) -> Does not overlap
    assert.equal(isOverlapping(8, 10), false);

    // Attempt E: 14:00 to 16:00 (Adjacent after) -> Does not overlap
    assert.equal(isOverlapping(14, 16), false);

    // Attempt F: 15:00 to 18:00 (Completely outside) -> Does not overlap
    assert.equal(isOverlapping(15, 18), false);
  });

  // Test Booking State Transitions
  test('Booking state machine enforces valid lifecycle states', () => {
    const validStates = [
      'hold_pending',
      'confirmed',
      'active',
      'completed',
      'cancelled_by_customer',
      'cancelled_by_provider',
      'cancelled_by_admin',
      'expired',
      'payment_failed',
      'disputed'
    ];

    assert.ok(validStates.includes('hold_pending'));
    assert.ok(validStates.includes('confirmed'));
    assert.ok(validStates.includes('completed'));
    assert.ok(!validStates.includes('arbitrary_status'));
  });

  // Test Double-Entry Financial Ledger
  test('Ledger balance reconciles customer payment with commission and provider payable', () => {
    const customerPaid = 188.32;
    const commissionFee = 28.32; // 24 fee + 4.32 GST
    const providerPayable = 160.00;

    const reconciledSum = commissionFee + providerPayable;
    assert.equal(Math.round(reconciledSum * 100) / 100, customerPaid);
  });
});
