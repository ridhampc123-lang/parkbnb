import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getLocalStore } from '../src/lib/store/marketplace-store';
import {
  registerSchema,
  providerPayoutSchema,
  ifscRegex,
  upiRegex,
  bankAccountRegex,
  spaceSchema
} from '../src/lib/validation/schemas';
import { ProviderProfile, ParkingSpace } from '../src/types/database';

describe('ParkBnB Listing Title Dropdown Management & Provider Payout Details', () => {
  const store = getLocalStore();

  // -------------------------------------------------------------
  // SUITE 1: ADMIN LISTING TITLE DROPDOWN MANAGEMENT
  // -------------------------------------------------------------
  describe('Admin Listing Title Dropdown Management', () => {
    test('1. Initial listing titles are populated with standard professional options', () => {
      const titles = store.getListingTitleOptions();
      assert.ok(Array.isArray(titles), 'Titles must be an array');
      assert.ok(titles.length >= 5, 'Should have at least 5 standard predefined options');
      assert.ok(titles.includes('Covered Basement Parking Bay'), 'Should contain standard basement option');
      assert.ok(titles.includes('Prime Surface Parking Slot with Security'), 'Should contain standard surface option');
    });

    test('2. Admin can add a new listing title option to the dropdown', () => {
      const initialCount = store.getListingTitleOptions().length;
      const newOption = 'Exclusive Penthouse Stilt Parking Bay with EV Supercharger';

      const updated = store.addListingTitleOption(newOption, 'admin@parkbnb.in');
      assert.equal(updated.length, initialCount + 1);
      assert.ok(updated.includes(newOption));

      const logs = store.getAuditLogs();
      const addLog = logs.find(l => l.action === 'LISTING_TITLE_OPTION_ADDED');
      assert.ok(addLog, 'Audit log must record adding a listing title option');
      assert.ok(addLog.details.includes(newOption));
    });

    test('3. Duplicate listing title options are strictly prevented (case-insensitive)', () => {
      const existing = 'Covered Basement Parking Bay';
      const beforeCount = store.getListingTitleOptions().length;

      const result = store.addListingTitleOption('covered basement parking bay', 'admin@parkbnb.in');
      assert.equal(result.length, beforeCount, 'Duplicate should not increase count');
    });

    test('4. Admin can update and change an existing listing title option in the dropdown', () => {
      const oldOption = 'Exclusive Penthouse Stilt Parking Bay with EV Supercharger';
      const changedOption = 'Executive Penthouse Stilt Parking Bay with Fast EV Charger';

      const updated = store.updateListingTitleOption(oldOption, changedOption, 'admin@parkbnb.in');
      assert.ok(updated.includes(changedOption), 'Updated title must exist in dropdown');
      assert.ok(!updated.includes(oldOption), 'Old title must be replaced');

      const logs = store.getAuditLogs();
      const updateLog = logs.find(l => l.action === 'LISTING_TITLE_OPTION_UPDATED');
      assert.ok(updateLog, 'Audit log must record title option update');
    });

    test('5. Admin can remove a listing title option from the dropdown', () => {
      const toRemove = 'Executive Penthouse Stilt Parking Bay with Fast EV Charger';
      const beforeCount = store.getListingTitleOptions().length;

      const updated = store.removeListingTitleOption(toRemove, 'admin@parkbnb.in');
      assert.equal(updated.length, beforeCount - 1);
      assert.ok(!updated.includes(toRemove));

      const logs = store.getAuditLogs();
      const removeLog = logs.find(l => l.action === 'LISTING_TITLE_OPTION_REMOVED');
      assert.ok(removeLog, 'Audit log must record title option removal');
    });

    test('6. The last remaining listing title cannot be removed (preserves dropdown usability)', () => {
      // Create an isolated scenario where dropdown is reduced to 1 option
      const current = store.getListingTitleOptions();
      const lastOption = current[0];

      // Attempting to remove until 1 option remains
      for (let i = 1; i < current.length; i++) {
        store.removeListingTitleOption(current[i]);
      }

      assert.equal(store.getListingTitleOptions().length, 1);
      // Attempting to remove the last one should not remove it
      const afterAttempt = store.removeListingTitleOption(lastOption);
      assert.equal(afterAttempt.length, 1);
      assert.equal(afterAttempt[0], lastOption);

      // Restore default options
      store.addListingTitleOption('Covered Basement Parking Bay');
      store.addListingTitleOption('Prime Surface Parking Slot with Security');
      store.addListingTitleOption('Residential Gated Stilt Parking');
      store.addListingTitleOption('Covered Parking Bay with EV Charging Socket');
      store.addListingTitleOption('Commercial Multi-Level Parking Slot');
    });
  });

  // -------------------------------------------------------------
  // SUITE 2: PROPER PAYOUT PAYMENT DETAILS VALIDATION & PERSISTENCE
  // -------------------------------------------------------------
  describe('Provider Payout Payment Details System', () => {
    test('1. Valid Indian Bank IFSC regex conforms to RBI standards (4 chars, 0, 6 alphanumeric)', () => {
      assert.ok(ifscRegex.test('SBIN0001234'), 'State Bank of India format valid');
      assert.ok(ifscRegex.test('HDFC0000240'), 'HDFC Bank format valid');
      assert.ok(ifscRegex.test('ICIC0000001'), 'ICICI Bank format valid');
      assert.ok(ifscRegex.test('KKBK0000811'), 'Kotak Mahindra Bank format valid');

      // Invalid formats
      assert.equal(ifscRegex.test('sbin0001234'), false, 'Lowercase must be rejected');
      assert.equal(ifscRegex.test('SBIN1001234'), false, 'Fifth char must be 0');
      assert.equal(ifscRegex.test('SBI0001234'), false, 'Must be 11 characters');
      assert.equal(ifscRegex.test('SBIN00012345'), false, 'Over 11 characters must be rejected');
    });

    test('2. Indian UPI ID regex conforms to NPCI standards', () => {
      assert.ok(upiRegex.test('rahul.sharma@okhdfcbank'), 'Standard bank UPI valid');
      assert.ok(upiRegex.test('9876543210@upi'), 'Phone number UPI handle valid');
      assert.ok(upiRegex.test('host_parking@paytm'), 'Special characters in username valid');

      // Invalid formats
      assert.equal(upiRegex.test('invalid_upi'), false, 'Missing handle must be rejected');
      assert.equal(upiRegex.test('@okhdfc'), false, 'Missing username must be rejected');
      assert.equal(upiRegex.test('rahul@'), false, 'Missing provider must be rejected');
    });

    test('3. Bank Account Number regex validates standard 9 to 18 digits', () => {
      assert.ok(bankAccountRegex.test('123456789'), '9 digits valid');
      assert.ok(bankAccountRegex.test('123456789012345'), '15 digits valid');
      assert.ok(bankAccountRegex.test('123456789012345678'), '18 digits valid');

      assert.equal(bankAccountRegex.test('12345678'), false, 'Under 9 digits rejected');
      assert.equal(bankAccountRegex.test('1234567890123456789'), false, 'Over 18 digits rejected');
      assert.equal(bankAccountRegex.test('12345ABCD89'), false, 'Non-digits rejected');
    });

    test('4. Register Schema validates provider registration with matching bank accounts', () => {
      const validProviderData = {
        full_name: 'Rajesh Patel',
        email: 'rajesh.patel@example.com',
        password: 'Password@123',
        phone: '9876543210',
        role: 'provider' as const,
        bank_name: 'HDFC Bank',
        bank_account_holder: 'Rajesh Patel',
        bank_account_number: '50100234567890',
        confirm_account_number: '50100234567890',
        bank_ifsc_code: 'HDFC0000240',
        upi_id: 'rajesh@okhdfcbank',
        payout_preference: 'bank_transfer' as const,
      };

      const result = registerSchema.safeParse(validProviderData);
      assert.ok(result.success, 'Valid provider registration must pass');
    });

    test('5. Register Schema rejects mismatched bank account and confirmation', () => {
      const mismatchedData = {
        full_name: 'Rajesh Patel',
        email: 'rajesh.mismatch@example.com',
        password: 'Password@123',
        phone: '9876543210',
        role: 'provider' as const,
        bank_name: 'HDFC Bank',
        bank_account_holder: 'Rajesh Patel',
        bank_account_number: '50100234567890',
        confirm_account_number: '50100234567999', // Typo in confirmation
      };

      const result = registerSchema.safeParse(mismatchedData);
      assert.equal(result.success, false, 'Mismatched account numbers must be rejected');
    });

    test('6. Provider profile persists payout details and updates via store methods', () => {
      const providerId = 'host-test-' + Math.random().toString(36).substring(2, 7);
      const initialProfile: ProviderProfile = {
        id: providerId,
        provider_type: 'individual_residential',
        verification_status: 'draft',
        bank_name: 'State Bank of India',
        bank_account_number: '20345678901',
        bank_account_holder: 'Amit Shah',
        bank_ifsc_code: 'SBIN0001234',
        upi_id: 'amit@upi',
        payout_preference: 'bank_transfer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.saveProviderProfile(initialProfile);

      const retrieved = store.getProviderProfile(providerId);
      assert.ok(retrieved);
      assert.equal(retrieved.bank_name, 'State Bank of India');
      assert.equal(retrieved.bank_account_number, '20345678901');
      assert.equal(retrieved.bank_ifsc_code, 'SBIN0001234');
      assert.equal(retrieved.upi_id, 'amit@upi');
      assert.equal(retrieved.payout_preference, 'bank_transfer');

      // Update payout details to instant UPI
      const updated = store.updateProviderPayoutDetails(providerId, {
        upi_id: 'amit.new@okhdfcbank',
        payout_preference: 'upi',
      });

      assert.ok(updated);
      assert.equal(updated.upi_id, 'amit.new@okhdfcbank');
      assert.equal(updated.payout_preference, 'upi');
      assert.equal(updated.bank_account_number, '20345678901', 'Bank account remains preserved');
    });
  });

  // -------------------------------------------------------------
  // SUITE 3: SPACE REGISTRATION WITH TITLE DROPDOWN & PAYOUT DETAILS
  // -------------------------------------------------------------
  describe('Space Registration with Title Dropdown & Payout Integration', () => {
    test('1. Parking space validates title from admin-managed dropdown options', () => {
      const validDropdownTitle = store.getListingTitleOptions()[0];
      const spaceData = {
        title: validDropdownTitle,
        property_title: 'Shivalik Hub',
        property_type: 'commercial_lot' as const,
        city: 'Ahmedabad',
        area: 'Prahlad Nagar',
        address_line1: 'Opp. Garden Gate 2',
        postal_code: '380015',
        latitude: 23.0125,
        longitude: 72.5055,
        identifier: 'Slot B-14',
        parking_type: 'covered' as const,
        hourly_rate: 45,
        daily_rate: 350,
        access_instructions: 'Enter via Gate 1 and present Parkbnb pass',
        security_features: ['cctv', 'gated_security'],
        vehicle_types: ['car_sedan' as const, 'car_suv' as const],
      };

      const result = spaceSchema.safeParse(spaceData);
      assert.ok(result.success, 'Space registration with dropdown title must pass validation');
      assert.equal(result.data.title, validDropdownTitle);
    });

    test('2. Space registration accepts custom listing title when provided', () => {
      const customTitle = 'VIP Stilt Parking Bay opposite Sindhu Bhavan Gate 3';
      const spaceData = {
        title: customTitle,
        property_title: 'SBR Landmark',
        property_type: 'commercial_lot' as const,
        city: 'Ahmedabad',
        area: 'Bodakdev',
        address_line1: 'Sindhu Bhavan Road',
        postal_code: '380054',
        latitude: 23.0456,
        longitude: 72.5123,
        identifier: 'Bay VIP-1',
        parking_type: 'covered' as const,
        hourly_rate: 60,
        access_instructions: 'Show security guard booking QR',
        security_features: ['cctv', 'valet'],
        vehicle_types: ['car_sedan' as const],
      };

      const result = spaceSchema.safeParse(spaceData);
      assert.ok(result.success, 'Custom title must pass validation');
      assert.equal(result.data.title, customTitle);
    });

    test('3. Space creation in store links to provider with payout account configured', () => {
      const hostId = 'host-payout-' + Math.random().toString(36).substring(2, 7);
      const spaceId = 'spc-test-' + Math.random().toString(36).substring(2, 7);

      // Create host with verified payout account
      store.saveProviderProfile({
        id: hostId,
        provider_type: 'individual_residential',
        verification_status: 'approved',
        bank_name: 'Kotak Mahindra Bank',
        bank_account_holder: 'Priya Desai',
        bank_account_number: '987654321098',
        bank_ifsc_code: 'KKBK0000811',
        upi_id: 'priya@kotak',
        payout_preference: 'upi',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const space: ParkingSpace = {
        id: spaceId,
        property_id: 'prop-1',
        provider_id: hostId,
        identifier: 'Slot 101',
        title: 'Covered Basement Parking Bay',
        parking_type: 'covered',
        hourly_rate: 50,
        min_duration_hours: 1,
        max_duration_hours: 24,
        security_features: ['cctv'],
        has_ev_charging: false,
        status: 'submitted',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.createSpace(space);

      const savedSpace = store.getSpaceById(spaceId);
      assert.ok(savedSpace);
      assert.equal(savedSpace.title, 'Covered Basement Parking Bay');

      const hostProfile = store.getProviderProfile(savedSpace.provider_id);
      assert.ok(hostProfile);
      assert.equal(hostProfile.bank_ifsc_code, 'KKBK0000811');
      assert.equal(hostProfile.upi_id, 'priya@kotak');
    });
  });
});
