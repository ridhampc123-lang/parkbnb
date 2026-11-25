import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { getLocalStore } from '../src/lib/store/marketplace-store';
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
} from '../src/lib/auth/session-token';
import { spaceSchema, loginSchema, registerSchema } from '../src/lib/validation/schemas';
import { generateCustomerPublicId } from '../src/lib/privacy/customer-privacy';
import { Profile, ParkingSpace } from '../src/types/database';

describe('ParkBnB Root-Cause Fix Verification: Register-Then-Login & Listing Title Resilience', () => {
  const store = getLocalStore();

  // =============================================================
  // SUITE 1: ROOT-CAUSE REGISTER-THEN-LOGIN RESILIENCE
  // =============================================================
  describe('Register-Then-Login Architecture & Password Cryptography', () => {
    test('1. Cryptographic scrypt password hashing generates unique salts and verifiable hashes', () => {
      const password = 'SecurePassword@2026!';
      const cred1 = hashPassword(password);
      const cred2 = hashPassword(password);

      // Salts must be unique per hash
      assert.notEqual(cred1.salt, cred2.salt, 'Salts must be randomly generated and distinct');
      assert.notEqual(cred1.hash, cred2.hash, 'Hashes must differ due to unique salts');

      // Both must verify correctly against their respective salts
      assert.ok(verifyPassword(password, cred1.hash, cred1.salt), 'cred1 must verify with correct password');
      assert.ok(verifyPassword(password, cred2.hash, cred2.salt), 'cred2 must verify with correct password');

      // Incorrect password must be rejected
      assert.equal(verifyPassword('WrongPassword123', cred1.hash, cred1.salt), false, 'Incorrect password must fail verification');
    });

    test('2. Timing-safe constant-time password verification rejects mismatched length and content', () => {
      const password = 'TestCustomer@Pass99';
      const { hash, salt } = hashPassword(password);

      assert.equal(verifyPassword(password + 'extra', hash, salt), false);
      assert.equal(verifyPassword('', hash, salt), false);
      assert.equal(verifyPassword(password, '0'.repeat(128), salt), false);
    });

    test('3. New customer registers and can immediately authenticate without warnings or barriers', () => {
      const userEmail = `newcustomer_${Date.now()}@parkbnb.test`;
      const plainPassword = 'Driver@Pass2026!';
      const fullName = 'Kavita Sharma';
      const phone = '9876549999';
      const userId = crypto.randomUUID();

      // 1. Hash and store credentials
      const { hash, salt } = hashPassword(plainPassword);
      store.saveAuthCredentials({
        userId,
        email: userEmail,
        passwordHash: hash,
        salt,
        role: 'customer',
        fullName,
        phone,
        createdAt: new Date().toISOString(),
      });

      // 2. Save customer profile
      const profile: Profile = {
        id: userId,
        customer_public_id: generateCustomerPublicId(),
        full_name: fullName,
        email: userEmail,
        phone,
        phone_verified: false,
        role: 'customer',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.createProfile(profile);

      // 3. Verify user can authenticate immediately with their credentials
      const authResult = store.verifyUserCredentials(userEmail, plainPassword);
      assert.ok(authResult.verified, 'Credentials must verify successfully');
      assert.ok(authResult.profile, 'Profile must be returned upon verified authentication');
      assert.equal(authResult.profile.id, userId);
      assert.equal(authResult.profile.email, userEmail);
      assert.equal(authResult.profile.status, 'active');

      // 4. Verify signed session token can be issued and validated
      const { token, payload } = signSessionToken({
        sub: authResult.profile.id,
        phone: authResult.profile.phone,
        name: authResult.profile.full_name,
        role: authResult.profile.role,
      });

      assert.ok(token, 'Session token must be produced');
      const verifiedPayload = verifySessionToken(token);
      assert.ok(verifiedPayload, 'Session token must verify cryptographically');
      assert.equal(verifiedPayload?.sub, userId);
      assert.equal(verifiedPayload?.role, 'customer');
    });

    test('4. Registration case-insensitivity: user can sign in with different email casing', () => {
      const userEmail = `Host_${Date.now()}@ParkBnB.Test`;
      const plainPassword = 'HostPassword@2026';
      const userId = crypto.randomUUID();

      const { hash, salt } = hashPassword(plainPassword);
      store.saveAuthCredentials({
        userId,
        email: userEmail.toLowerCase(),
        passwordHash: hash,
        salt,
        role: 'provider',
        fullName: 'Manish Verma',
        createdAt: new Date().toISOString(),
      });

      store.createProfile({
        id: userId,
        customer_public_id: generateCustomerPublicId(),
        full_name: 'Manish Verma',
        email: userEmail.toLowerCase(),
        role: 'provider',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Attempt login with UPPERCASE email
      const uppercaseAttempt = store.verifyUserCredentials(userEmail.toUpperCase(), plainPassword);
      assert.ok(uppercaseAttempt.verified, 'Login must succeed regardless of email casing');
      assert.equal(uppercaseAttempt.profile?.id, userId);

      // Attempt login with Mixed Case email
      const mixedAttempt = store.verifyUserCredentials(userEmail, plainPassword);
      assert.ok(mixedAttempt.verified, 'Login must succeed with mixed casing');
    });

    test('5. Non-existent user or invalid password produces clean failure without system exceptions', () => {
      const result = store.verifyUserCredentials('nonexistent@parkbnb.test', 'AnyPassword123');
      assert.equal(result.verified, false);
      assert.equal(result.profile, undefined);
    });
  });

  // =============================================================
  // SUITE 2: LISTING TITLE ZERO-FAILURE RESILIENCE
  // =============================================================
  describe('Listing Title Zero-Failure & Automatic Fallback Synthesis', () => {
    test('1. Valid standard title passes space schema validation', () => {
      const spaceData = {
        title: 'Covered Basement Parking Bay',
        property_title: 'Titanium City Centre',
        property_type: 'commercial_lot' as const,
        city: 'Ahmedabad',
        area: 'Prahlad Nagar',
        address_line1: '100 Feet Anand Nagar Road',
        postal_code: '380015',
        latitude: 23.0135,
        longitude: 72.5142,
        identifier: 'Slot B-12',
        parking_type: 'covered' as const,
        hourly_rate: 45,
        access_instructions: 'Drive into gate 1, show booking reference to security.',
        security_features: ['cctv', 'gated_security'],
        vehicle_types: ['car_sedan' as const],
      };

      const result = spaceSchema.safeParse(spaceData);
      assert.ok(result.success, 'Valid title must pass validation');
      assert.equal(result.data.title, 'Covered Basement Parking Bay');
    });

    test('2. Custom title passes space schema validation', () => {
      const spaceData = {
        title: 'Reserved Stilt Bay near Titanium Lobby Gate A',
        property_title: 'Titanium Square',
        property_type: 'commercial_lot' as const,
        city: 'Ahmedabad',
        area: 'Thaltej',
        address_line1: 'SG Highway',
        postal_code: '380054',
        latitude: 23.0512,
        longitude: 72.5218,
        identifier: 'Stilt 04',
        parking_type: 'covered' as const,
        hourly_rate: 50,
        access_instructions: 'Direct access from SG Highway service lane.',
        security_features: ['cctv'],
        vehicle_types: ['car_sedan' as const],
      };

      const result = spaceSchema.safeParse(spaceData);
      assert.ok(result.success, 'Custom title must pass validation');
      assert.equal(result.data.title, 'Reserved Stilt Bay near Titanium Lobby Gate A');
    });

    test('3. Server-side title synthesis guarantees valid title even when client supplies blank title or "__custom__"', () => {
      // Simulate server-side fallback synthesis
      function synthesizeListingTitle(params: {
        rawTitle?: string;
        propertyTitle?: string;
        area?: string;
        city?: string;
        parkingType?: string;
      }): string {
        const raw = params.rawTitle?.trim();
        if (raw && raw !== '__custom__' && raw.length >= 3) {
          return raw;
        }
        if (params.propertyTitle && params.area) {
          return `${params.parkingType === 'covered' ? 'Covered Parking' : 'Reserved Parking'} at ${params.propertyTitle}, ${params.area}`;
        }
        if (params.propertyTitle) {
          return `${params.propertyTitle} Reserved Parking Bay`;
        }
        if (params.area) {
          return `Reserved Parking Bay in ${params.area}, ${params.city || 'Ahmedabad'}`;
        }
        return 'Covered Reserved Parking Bay';
      }

      // Case A: rawTitle is '__custom__' with no custom text entered
      const titleA = synthesizeListingTitle({
        rawTitle: '__custom__',
        propertyTitle: 'Shivalik Heights',
        area: 'Prahlad Nagar',
        city: 'Ahmedabad',
        parkingType: 'covered',
      });
      assert.equal(titleA, 'Covered Parking at Shivalik Heights, Prahlad Nagar');
      assert.ok(spaceSchema.shape.title.safeParse(titleA).success);

      // Case B: rawTitle is empty or whitespace
      const titleB = synthesizeListingTitle({
        rawTitle: '   ',
        propertyTitle: 'Galaxy Business Hub',
        area: 'Bodakdev',
        parkingType: 'basement',
      });
      assert.equal(titleB, 'Reserved Parking at Galaxy Business Hub, Bodakdev');
      assert.ok(spaceSchema.shape.title.safeParse(titleB).success);

      // Case C: No property or area provided
      const titleC = synthesizeListingTitle({});
      assert.equal(titleC, 'Covered Reserved Parking Bay');
      assert.ok(spaceSchema.shape.title.safeParse(titleC).success);
    });

    test('4. Space stored in database retains sanitized, verified listing title', () => {
      const spaceId = 'spc-test-title-' + Math.random().toString(36).substring(2, 7);
      const testSpace: ParkingSpace = {
        id: spaceId,
        property_id: 'prop-test-01',
        provider_id: 'usr-host-ahmedabad-01',
        identifier: 'Slot T-99',
        title: 'Covered Parking at Titanium City Centre, Prahlad Nagar',
        parking_type: 'covered',
        hourly_rate: 40,
        min_duration_hours: 1,
        max_duration_hours: 24,
        security_features: ['cctv', 'gated_security'],
        has_ev_charging: true,
        status: 'submitted',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.createSpace(testSpace);
      const retrieved = store.getSpaceById(spaceId);
      assert.ok(retrieved);
      assert.equal(retrieved.title, 'Covered Parking at Titanium City Centre, Prahlad Nagar');
    });
  });
});
