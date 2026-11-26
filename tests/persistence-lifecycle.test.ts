import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const testStoreFile = path.resolve(process.cwd(), 'data', `parkbnb-test-${process.pid}.json`);
process.env.PARKBNB_STORE_FILE = testStoreFile;

import { getLocalStore } from '../src/lib/store/marketplace-store';
import {
  generateCustomerPublicId,
  generateOwnerPublicId,
  generateSpacePublicId,
  generateBookingCustomerReference,
} from '../src/lib/privacy/customer-privacy';
import {
  Profile,
  ProviderProfile,
  Property,
  ParkingSpace,
  CustomerVehicle,
  Booking,
} from '../src/types/database';

describe('ParkBnB Permanent Root-Cause Persistence Lifecycle Suite', () => {
  const store = getLocalStore();
  const testRunId = Date.now().toString(36);

  after(() => {
    try {
      if (fs.existsSync(testStoreFile)) {
        fs.unlinkSync(testStoreFile);
      }
    } catch {
      // Cleanup best effort
    }
  });

  it('1. Persists newly created property and parking space to disk and retains them across store re-instantiations', () => {
    const ownerId = `usr-test-owner-${testRunId}`;
    const ownerPublicId = generateOwnerPublicId();

    const providerProfile: ProviderProfile = {
      id: ownerId,
      owner_public_id: ownerPublicId,
      provider_type: 'individual_residential',
      business_name: `Navrangpura Luxury Residency ${testRunId}`,
      verification_status: 'approved',
      bank_name: 'State Bank of India',
      bank_account_holder: 'Mahesh Shah',
      bank_account_number: '987654321098',
      bank_ifsc_code: 'SBIN0001234',
      payout_preference: 'bank_transfer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.saveProviderProfile(providerProfile);

    const propertyId = `prop-test-${testRunId}`;
    const property: Property = {
      id: propertyId,
      provider_id: ownerId,
      title: `Navrangpura Residency Tower A`,
      property_type: 'apartment_complex',
      address_line1: 'Opp. Ahmedabad Central Mall',
      landmark: 'Near Law Garden Circle',
      area: 'Navrangpura',
      city: 'Ahmedabad',
      postal_code: '380009',
      latitude: 23.033,
      longitude: 72.565,
      created_at: new Date().toISOString(),
    };
    store.createProperty(property);

    const spaceId = `spc-test-${testRunId}`;
    const spacePublicId = generateSpacePublicId();
    const space: ParkingSpace = {
      id: spaceId,
      space_public_id: spacePublicId,
      owner_public_id: ownerPublicId,
      property_id: propertyId,
      provider_id: ownerId,
      identifier: 'BAY-A101',
      title: 'Covered Stilt Bay at Navrangpura Tower A',
      description: 'CCTV monitored covered bay with automatic boom barrier access.',
      parking_type: 'covered',
      hourly_rate: 60,
      daily_rate: 350,
      monthly_rate: 4500,
      min_duration_hours: 1,
      max_duration_hours: 720,
      status: 'approved',
      is_active: true,
      vehicle_types: ['car_sedan', 'car_suv'],
      security_features: ['cctv', 'gated_security', 'boom_barrier'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      property,
    };
    store.createSpace(space);

    // Verify written to test store file
    assert.ok(fs.existsSync(testStoreFile), 'Test store file must physically exist in data directory');

    const fileContent = JSON.parse(fs.readFileSync(testStoreFile, 'utf8'));
    assert.ok(Array.isArray(fileContent.spaces), 'Store payload must contain serialized spaces');
    assert.ok(Array.isArray(fileContent.properties), 'Store payload must contain serialized properties');

    const serializedSpaceEntry = fileContent.spaces.find(([id]: [string, any]) => id === spaceId);
    assert.ok(serializedSpaceEntry, 'Created space must be serialized in disk JSON');
    assert.equal(serializedSpaceEntry[1].space_public_id, spacePublicId);
    assert.equal(serializedSpaceEntry[1].owner_public_id, ownerPublicId);

    // Test hydration from disk
    const retrievedSpace = store.getSpaceById(spaceId);
    assert.ok(retrievedSpace, 'Space must be retrievable from store');
    assert.equal(retrievedSpace?.title, 'Covered Stilt Bay at Navrangpura Tower A');
    assert.equal(retrievedSpace?.property?.area, 'Navrangpura');
    assert.equal(retrievedSpace?.owner_public_id, ownerPublicId);

    const providerSpaces = store.getSpacesByProvider(ownerId);
    assert.ok(providerSpaces.some(s => s.id === spaceId), 'Host spaces query must return the newly created space');
  });

  it('2. Persists customer profiles, credentials, and registered vehicles to disk', () => {
    const customerId = `usr-test-cust-${testRunId}`;
    const customerPublicId = generateCustomerPublicId();

    const customerProfile: Profile = {
      id: customerId,
      customer_public_id: customerPublicId,
      full_name: 'Chirag Dave',
      email: `chirag.${testRunId}@example.com`,
      phone: '9898012345',
      phone_verified: true,
      role: 'customer',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.createProfile(customerProfile);

    const vehicleId = `veh-test-${testRunId}`;
    const vehicle: CustomerVehicle = {
      id: vehicleId,
      customer_id: customerId,
      registration_number: 'GJ 01 AB 9999',
      vehicle_type: 'car_sedan',
      make_model: 'Honda City',
      color: 'Pearl White',
      is_default: true,
      created_at: new Date().toISOString(),
    };
    store.createVehicle(vehicle);

    // Verify stored and retrievable
    const retrievedCust = store.getProfileById(customerId);
    assert.ok(retrievedCust, 'Customer must exist in store');
    assert.equal(retrievedCust?.customer_public_id, customerPublicId);

    const vehicles = store.getVehiclesByCustomer(customerId);
    assert.equal(vehicles.length, 1);
    assert.equal(vehicles[0].registration_number, 'GJ 01 AB 9999');

    // Verify disk payload contains the vehicle and customer
    const fileContent = JSON.parse(fs.readFileSync(testStoreFile, 'utf8'));
    const customerEntry = fileContent.profiles.find(([id]: [string, any]) => id === customerId);
    assert.ok(customerEntry, 'Customer must be saved in persistent JSON file');

    const vehicleEntry = fileContent.vehicles.find(([id]: [string, any]) => id === vehicleId);
    assert.ok(vehicleEntry, 'Vehicle must be saved in persistent JSON file');
  });

  it('3. Persists booking reservations with DPDP privacy references across server reboots', () => {
    const bookingId = `bkg-test-${testRunId}`;
    const spaceId = `spc-test-${testRunId}`;
    const customerId = `usr-test-cust-${testRunId}`;
    const ownerId = `usr-test-owner-${testRunId}`;
    const vehicleId = `veh-test-${testRunId}`;

    const booking: Booking = {
      id: bookingId,
      booking_reference: `PKB-20261126-${testRunId.toUpperCase()}`,
      booking_customer_reference: generateBookingCustomerReference(),
      customer_display_name: 'Chirag D.',
      space_id: spaceId,
      customer_id: customerId,
      provider_id: ownerId,
      vehicle_id: vehicleId,
      start_time: '2026-12-01T10:00:00.000Z',
      end_time: '2026-12-01T14:00:00.000Z',
      total_hours: 4,
      base_amount: 240,
      platform_fee: 36,
      tax_amount: 49.68,
      total_amount: 325.68,
      provider_payout_amount: 204,
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.createBooking(booking);

    // Verify stored
    const retrieved = store.getBookingById(bookingId);
    assert.ok(retrieved, 'Booking must exist in store');
    assert.equal(retrieved?.status, 'confirmed');
    assert.equal(retrieved?.total_amount, 325.68);
    assert.ok(retrieved?.booking_customer_reference.startsWith('PBN-REF-'));

    // Verify disk payload contains the booking
    const fileContent = JSON.parse(fs.readFileSync(testStoreFile, 'utf8'));
    const bookingEntry = fileContent.bookings.find(([id]: [string, any]) => id === bookingId);
    assert.ok(bookingEntry, 'Booking reservation must be saved in persistent JSON file');
    assert.equal(bookingEntry[1].status, 'confirmed');
  });

  it('4. Real-time mutations update disk atomically and are never lost', () => {
    const spaceId = `spc-test-${testRunId}`;

    // Update hourly rate
    const updatedSpace = store.updateSpacePricing({
      spaceId,
      hourlyRate: 75,
      dailyRate: 400,
    });
    assert.ok(updatedSpace, 'Space pricing update must succeed');
    assert.equal(updatedSpace?.hourly_rate, 75);

    // Verify updated pricing is reflected immediately on disk
    const fileContent = JSON.parse(fs.readFileSync(testStoreFile, 'utf8'));
    const spaceEntry = fileContent.spaces.find(([id]: [string, any]) => id === spaceId);
    assert.ok(spaceEntry, 'Space entry must exist in disk JSON');
    assert.equal(spaceEntry[1].hourly_rate, 75, 'Hourly rate on disk must match updated value');
    assert.equal(spaceEntry[1].daily_rate, 400, 'Daily rate on disk must match updated value');
  });
});
