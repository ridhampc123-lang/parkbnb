import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidPincode,
  resolvePincode,
  parseGoogleMapsUrl,
  generateGoogleMapsDirectionUrl
} from '../src/lib/location/pincode-directory';
import { spaceSchema } from '../src/lib/validation/schemas';
import { getLocalStore } from '../src/lib/store/marketplace-store';
import { ParkingSpace, Property } from '../src/types/database';

describe('ParkBnB Advanced Location Management, Indian Pincode Directory & Photo Architecture', () => {

  describe('1. Indian Postal PIN Code Directory Engine (Zero Google Maps API)', () => {
    test('1.1 Validates strictly 6-digit Indian postal PIN codes', () => {
      assert.equal(isValidPincode('380015'), true, 'Valid 6-digit PIN code must pass');
      assert.equal(isValidPincode('400051'), true, 'Valid 6-digit PIN code must pass');
      assert.equal(isValidPincode('110001'), true, 'Valid 6-digit PIN code must pass');
      assert.equal(isValidPincode('560034'), true, 'Valid 6-digit PIN code must pass');

      // Invalid PIN codes
      assert.equal(isValidPincode('38001'), false, '5-digit PIN must fail');
      assert.equal(isValidPincode('3800151'), false, '7-digit PIN must fail');
      assert.equal(isValidPincode('080015'), false, 'PIN starting with 0 must fail');
      assert.equal(isValidPincode('ABCDEF'), false, 'Alphanumeric PIN must fail');
      assert.equal(isValidPincode(''), false, 'Empty PIN must fail');
    });

    test('1.2 Resolves Ahmedabad commercial & residential corridor (380015)', async () => {
      const res = await resolvePincode('380015');
      assert.equal(res.valid, true);
      assert.equal(res.city, 'Ahmedabad');
      assert.equal(res.state, 'Gujarat');
      assert.ok(res.localities.includes('Bodakdev') || res.localities.includes('Satellite') || res.localities.includes('SG Highway'));
      assert.ok(res.latitude > 22.9 && res.latitude < 23.2, 'Latitude must match Ahmedabad region');
      assert.ok(res.longitude > 72.4 && res.longitude < 72.7, 'Longitude must match Ahmedabad region');
    });

    test('1.3 Resolves Mumbai BKC financial corridor (400051)', async () => {
      const res = await resolvePincode('400051');
      assert.equal(res.valid, true);
      assert.equal(res.state, 'Maharashtra');
      assert.ok(res.localities.some(l => l.includes('BKC') || l.includes('Bandra Kurla') || l.includes('Bandra East')));
      assert.ok(res.latitude > 18.9 && res.latitude < 19.3, 'Latitude must match Mumbai region');
    });

    test('1.4 Resolves Delhi NCR Connaught Place (110001)', async () => {
      const res = await resolvePincode('110001');
      assert.equal(res.valid, true);
      assert.equal(res.state, 'Delhi');
      assert.ok(res.localities.some(l => l.includes('Connaught') || l.includes('Barakhamba')));
    });

    test('1.5 Resolves Bengaluru tech hub Koramangala (560034)', async () => {
      const res = await resolvePincode('560034');
      assert.equal(res.valid, true);
      assert.ok(res.city === 'Bengaluru' || res.city.toLowerCase().includes('bangalore'), 'City must resolve to Bengaluru / Bangalore');
      assert.equal(res.state, 'Karnataka');
      assert.ok(res.localities.some(l => l.includes('Koramangala')));
    });

    test('1.6 Gracefully falls back to regional circle for unlisted PIN codes (e.g. 390001)', async () => {
      const res = await resolvePincode('390001');
      assert.equal(res.valid, true);
      assert.equal(res.state, 'Gujarat');
      assert.ok(res.localities.length > 0);
    });
  });

  describe('2. Google Maps Link Parsing & Navigation Generation', () => {
    test('2.1 Parses Google Maps short/app links (maps.app.goo.gl)', () => {
      const url = 'https://maps.app.goo.gl/w1x8yZ9kL2m3';
      const parsed = parseGoogleMapsUrl(url);
      assert.equal(parsed.isValid, true);
      assert.equal(parsed.cleanUrl, url);
    });

    test('2.2 Extracts latitude and longitude from @lat,lng format in URL', () => {
      const url = 'https://www.google.com/maps/@23.0338,72.5150,17z';
      const parsed = parseGoogleMapsUrl(url);
      assert.equal(parsed.isValid, true);
      assert.equal(parsed.latitude, 23.0338);
      assert.equal(parsed.longitude, 72.5150);
    });

    test('2.3 Extracts coordinates from ?q=lat,lng query format', () => {
      const url = 'https://maps.google.com/?q=19.0657,72.8687';
      const parsed = parseGoogleMapsUrl(url);
      assert.equal(parsed.isValid, true);
      assert.equal(parsed.latitude, 19.0657);
      assert.equal(parsed.longitude, 72.8687);
    });

    test('2.4 Rejects invalid or phishing domains', () => {
      const malicious = 'https://fake-maps-phishing.com/@23.0338,72.5150';
      const parsed = parseGoogleMapsUrl(malicious);
      assert.equal(parsed.isValid, false);
      assert.ok(parsed.errorMessage?.includes('Google Maps link'));
    });

    test('2.5 generateGoogleMapsDirectionUrl prioritizes owner custom link when valid', () => {
      const customUrl = 'https://maps.app.goo.gl/spotPin123';
      const navUrl = generateGoogleMapsDirectionUrl({
        address: 'Tower A, SG Highway',
        landmark: 'Opposite Rajpath Club',
        area: 'Bodakdev',
        city: 'Ahmedabad',
        customUrl,
      });
      assert.equal(navUrl, customUrl, 'Must directly open owner verified link');
    });

    test('2.6 generateGoogleMapsDirectionUrl synthesizes pinpoint query when no link provided', () => {
      const navUrl = generateGoogleMapsDirectionUrl({
        address: 'Flat 102, Shivalik Shilp',
        landmark: 'Behind Iscon Mega Mall',
        area: 'Bodakdev',
        city: 'Ahmedabad',
        postal_code: '380015',
      });
      assert.ok(navUrl.startsWith('https://www.google.com/maps/search/?api=1&query='));
      assert.ok(navUrl.includes(encodeURIComponent('Behind Iscon Mega Mall')));
      assert.ok(navUrl.includes(encodeURIComponent('Ahmedabad')));
      assert.ok(navUrl.includes(encodeURIComponent('380015')));
    });
  });

  describe('3. Space Schema & Address Validation Rules', () => {
    test('3.1 Rejects space registration if postal code is not a 6-digit Indian PIN', () => {
      const invalidData = {
        title: 'Covered Bay at SG Highway',
        property_title: 'Shivalik Shilp',
        property_type: 'commercial_lot' as const,
        city: 'Ahmedabad',
        area: 'Bodakdev',
        address_line1: 'Sindhu Bhavan Road',
        landmark: 'Opposite Rajpath Club',
        postal_code: '38001', // 5 digits - invalid
        latitude: 23.0338,
        longitude: 72.5150,
        identifier: 'Slot B-101',
        parking_type: 'covered' as const,
        hourly_rate: 50,
        access_instructions: 'Show pass to security attendant at Gate 2',
        security_features: ['cctv'],
        vehicle_types: ['car_sedan' as const],
      };

      const result = spaceSchema.safeParse(invalidData);
      assert.equal(result.success, false);
      assert.ok(result.error?.errors.some(e => e.path.includes('postal_code')));
    });

    test('3.2 Requires nearby landmark for driver navigation (min 3 chars)', () => {
      const validData = {
        title: 'Covered Bay at SG Highway',
        property_title: 'Shivalik Shilp',
        property_type: 'commercial_lot' as const,
        city: 'Ahmedabad',
        area: 'Bodakdev',
        address_line1: 'Sindhu Bhavan Road',
        landmark: 'Opposite Rajpath Club',
        postal_code: '380015',
        latitude: 23.0338,
        longitude: 72.5150,
        identifier: 'Slot B-101',
        parking_type: 'covered' as const,
        hourly_rate: 50,
        access_instructions: 'Show pass to security attendant at Gate 2',
        security_features: ['cctv'],
        vehicle_types: ['car_sedan' as const],
      };

      const result = spaceSchema.safeParse(validData);
      assert.equal(result.success, true);
      assert.equal(result.data.landmark, 'Opposite Rajpath Club');
    });
  });

  describe('4. Photo Architecture & Storage Verification', () => {
    test('4.1 Parking Space stores multiple photos with cover designation', () => {
      const store = getLocalStore();
      const spaceId = 'spc-test-photo-' + Date.now();
      const propId = 'prop-test-photo-' + Date.now();
      const hostId = 'hst-test-photo-' + Date.now();

      const testProperty: Property = {
        id: propId,
        provider_id: hostId,
        title: 'Shivalik Complex',
        property_type: 'commercial_lot',
        address_line1: 'Sindhu Bhavan Road',
        landmark: 'Opposite Taj Skyline',
        area: 'Bodakdev',
        city: 'Ahmedabad',
        postal_code: '380054',
        latitude: 23.0456,
        longitude: 72.5123,
        google_maps_link: 'https://maps.app.goo.gl/tajSkylinePin',
        created_at: new Date().toISOString(),
      };

      const testSpace: ParkingSpace = {
        id: spaceId,
        property_id: propId,
        provider_id: hostId,
        identifier: 'Slot C-22',
        title: 'VIP Stilt Bay near Taj Skyline',
        landmark: 'Opposite Taj Skyline',
        google_maps_link: 'https://maps.app.goo.gl/tajSkylinePin',
        parking_type: 'covered',
        hourly_rate: 70,
        min_duration_hours: 1,
        max_duration_hours: 24,
        status: 'approved',
        is_active: true,
        security_features: ['cctv', 'valet'],
        has_ev_charging: true,
        property: testProperty,
        photos: [
          {
            id: 'photo-1',
            space_id: spaceId,
            storage_path: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
            is_primary: true,
            display_order: 0,
            created_at: new Date().toISOString(),
          },
          {
            id: 'photo-2',
            space_id: spaceId,
            storage_path: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
            is_primary: false,
            display_order: 1,
            created_at: new Date().toISOString(),
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.createSpace(testSpace);
      const retrieved = store.getSpaceById(spaceId);

      assert.ok(retrieved, 'Space must be retrievable');
      assert.equal(retrieved.photos?.length, 2, 'Must store 2 photos');
      assert.equal(retrieved.photos?.[0].is_primary, true, 'First photo must be cover');
      assert.equal(retrieved.landmark, 'Opposite Taj Skyline');
      assert.equal(retrieved.google_maps_link, 'https://maps.app.goo.gl/tajSkylinePin');
      assert.equal(retrieved.property?.landmark, 'Opposite Taj Skyline');
    });
  });

});
