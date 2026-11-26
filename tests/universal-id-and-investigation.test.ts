import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateOwnerPublicId,
  generateSpacePublicId,
  generateCustomerPublicId,
  detectIdentifierType,
} from '../src/lib/privacy/customer-privacy';
import { getLocalStore } from '../src/lib/store/marketplace-store';
import { ProviderProfile, ParkingSpace } from '../src/types/database';

describe('ParkBnB Universal Identifier & Forensic Investigation Test Suite', () => {
  const store = getLocalStore();

  // -------------------------------------------------------------
  // 1. UNIQUE IDENTIFIER GENERATORS
  // -------------------------------------------------------------
  describe('1. Immutable Public ID Generators', () => {
    test('1.1 generateOwnerPublicId produces unpredictable formatted Owner IDs', () => {
      const id1 = generateOwnerPublicId();
      const id2 = generateOwnerPublicId();

      assert.ok(id1.startsWith('PBN-O-'), `Expected prefix PBN-O-, got ${id1}`);
      assert.ok(id2.startsWith('PBN-O-'), `Expected prefix PBN-O-, got ${id2}`);
      assert.equal(id1.length, 14, `Expected 14 chars, got ${id1.length}`);
      assert.notEqual(id1, id2, 'Successive calls must produce distinct random IDs');

      // Check charset (no ambiguous chars: 0, O, 1, I)
      const randomPart = id1.replace('PBN-O-', '');
      assert.match(randomPart, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/);
    });

    test('1.2 generateSpacePublicId produces unpredictable formatted Space IDs', () => {
      const id1 = generateSpacePublicId();
      const id2 = generateSpacePublicId();

      assert.ok(id1.startsWith('PBN-S-'), `Expected prefix PBN-S-, got ${id1}`);
      assert.ok(id2.startsWith('PBN-S-'), `Expected prefix PBN-S-, got ${id2}`);
      assert.equal(id1.length, 14, `Expected 14 chars, got ${id1.length}`);
      assert.notEqual(id1, id2, 'Successive calls must produce distinct random IDs');

      const randomPart = id1.replace('PBN-S-', '');
      assert.match(randomPart, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/);
    });

    test('1.3 detectIdentifierType accurately classifies all platform identifier formats', () => {
      assert.equal(detectIdentifierType('PBN-O-8K2M9P4X'), 'owner');
      assert.equal(detectIdentifierType('pbn-o-hst001'), 'owner');
      assert.equal(detectIdentifierType('PBN-C-7K9X4M2Q'), 'customer');
      assert.equal(detectIdentifierType('pbn-c-admin001'), 'customer');
      assert.equal(detectIdentifierType('PBN-S-3T7W5R9Y'), 'space');
      assert.equal(detectIdentifierType('pbn-s-ahm001'), 'space');
      assert.equal(detectIdentifierType('PKB-BKC-7892'), 'booking');
      assert.equal(detectIdentifierType('PBN-REF-8M2Q4K9X'), 'booking');
      assert.equal(detectIdentifierType('GJ 01 AB 1234'), 'vehicle');
      assert.equal(detectIdentifierType('MH02CD5678'), 'vehicle');
      assert.equal(detectIdentifierType('DL 3C AB 9999'), 'vehicle');
      assert.equal(detectIdentifierType('random-text-123'), 'unknown');
      assert.equal(detectIdentifierType(''), 'unknown');
    });
  });

  // -------------------------------------------------------------
  // 2. STORE SEED INTEGRITY & DYNAMIC ID INHERITANCE
  // -------------------------------------------------------------
  describe('2. Store Seed Integrity & Inheritance', () => {
    test('2.1 Seed hosts have permanent Owner Public IDs configured', () => {
      const p1 = store.getProviderByOwnerPublicId('PBN-O-HST001');
      assert.ok(p1, 'Ahmedabad Host 1 must be resolvable by PBN-O-HST001');
      assert.equal(p1.owner_public_id, 'PBN-O-HST001');

      const p3 = store.getProviderByOwnerPublicId('PBN-O-MUM001');
      assert.ok(p3, 'Mumbai Host 3 must be resolvable by PBN-O-MUM001');
      assert.equal(p3.owner_public_id, 'PBN-O-MUM001');
    });

    test('2.2 Seed parking spaces have Space Public IDs and linked Owner Public IDs', () => {
      const s1 = store.getSpaceBySpacePublicId('PBN-S-AHM001');
      assert.ok(s1, 'Ahmedabad Space 1 must be resolvable by PBN-S-AHM001');
      assert.equal(s1.space_public_id, 'PBN-S-AHM001');
      assert.equal(s1.owner_public_id, 'PBN-O-HST001');
    });

    test('2.3 Creating a space dynamically inherits Host Owner Public ID', () => {
      const hostId = 'usr-host-ahmedabad-01'; // Host with PBN-O-HST001
      const newSpaceId = 'spc-test-dynamic-inherit-01';

      const created = store.createSpace({
        id: newSpaceId,
        property_id: 'prop-prahladnagar-01',
        provider_id: hostId,
        identifier: 'Dynamic Slot D-99',
        title: 'Dynamic Test Space with Auto-Generated IDs',
        description: 'Testing automatic ID assignment and owner inheritance',
        parking_type: 'covered',
        hourly_rate: 60.0,
        min_duration_hours: 1,
        max_duration_hours: 24,
        access_instructions: 'Gate 1',
        security_features: ['cctv'],
        has_ev_charging: false,
        status: 'approved',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        photos: [],
        vehicle_types: ['car_sedan'],
      });

      assert.ok(created.space_public_id, 'Dynamic space must receive a generated space_public_id');
      assert.ok(created.space_public_id?.startsWith('PBN-S-'), 'Space public ID must start with PBN-S-');
      assert.equal(created.owner_public_id, 'PBN-O-HST001', 'Space must inherit owner_public_id from provider profile');

      // Verify resolvable via getSpaceBySpacePublicId
      const fetched = store.getSpaceBySpacePublicId(created.space_public_id!);
      assert.ok(fetched, 'Must be retrievable by generated Space Public ID');
      assert.equal(fetched.id, newSpaceId);

      // Clean up test space
      store.deleteSpace(newSpaceId);
    });
  });

  // -------------------------------------------------------------
  // 3. UNIVERSAL FORENSIC LOOKUP ENGINE
  // -------------------------------------------------------------
  describe('3. Universal Forensic Lookup Engine', () => {
    test('3.1 Resolves Owner record by PBN-O-HST001 with full audit trail', () => {
      const lookup = store.universalLookup('PBN-O-HST001', {
        staffId: 'usr-admin-system-01',
        staffEmail: 'admin@parkbnb.in',
        staffRole: 'super_admin',
      });

      assert.equal(lookup.found, true);
      assert.equal(lookup.detectedType, 'owner');
      assert.ok(lookup.ownerData, 'Must return ownerData');
      assert.equal(lookup.ownerData.provider.owner_public_id, 'PBN-O-HST001');
      assert.ok(lookup.ownerData.spaces.length > 0, 'Must include list of owned spaces');
      assert.ok(lookup.ownerData.totalEarnings >= 0);

      // Verify audit log entry was created
      const logs = store.getAuditLogs();
      const match = logs.find(l => l.action === 'UNIVERSAL_LOOKUP_OWNER' && l.target_id === 'PBN-O-HST001');
      assert.ok(match, 'Audit log entry must be recorded for owner lookup');
    });

    test('3.2 Resolves Parking Space record by PBN-S-AHM001 with linked owner', () => {
      const lookup = store.universalLookup('PBN-S-AHM001', {
        staffId: 'usr-admin-system-01',
        staffEmail: 'admin@parkbnb.in',
        staffRole: 'super_admin',
      });

      assert.equal(lookup.found, true);
      assert.equal(lookup.detectedType, 'space');
      assert.ok(lookup.spaceData, 'Must return spaceData');
      assert.equal(lookup.spaceData.space.space_public_id, 'PBN-S-AHM001');
      assert.equal(lookup.spaceData.space.owner_public_id, 'PBN-O-HST001');
      assert.ok(lookup.spaceData.owner, 'Must include linked owner profile');
      assert.equal(lookup.spaceData.owner?.owner_public_id, 'PBN-O-HST001');
    });

    test('3.3 Resolves Customer record by PBN-C-ADMIN001', () => {
      const lookup = store.universalLookup('PBN-C-ADMIN001');

      assert.equal(lookup.found, true);
      assert.equal(lookup.detectedType, 'customer');
      assert.ok(lookup.customerData, 'Must return customerData');
      assert.equal(lookup.customerData.profile.customer_public_id, 'PBN-C-ADMIN001');
      assert.equal(lookup.customerData.profile.role, 'super_admin');
    });

    test('3.4 Handles invalid or non-existent identifiers gracefully', () => {
      const lookup = store.universalLookup('PBN-O-NONEXISTENT999');
      assert.equal(lookup.found, false);
      assert.equal(lookup.detectedType, 'owner');
    });
  });

  // -------------------------------------------------------------
  // 4. SUSPENSION & FAKE LISTING DELISTING ENGINE
  // -------------------------------------------------------------
  describe('4. Owner Suspension & Immediate Delisting of Fake Listings', () => {
    test('4.1 Suspending an owner delists all their spaces and updates status immediately', () => {
      // Find Host 2 (Times Square, PBN-O-HST002)
      const hostPublicId = 'PBN-O-HST002';
      const initialSpaces = store.getSpacesByProvider('usr-host-ahmedabad-02');
      assert.ok(initialSpaces.length > 0, 'Host must have active spaces initially');
      assert.equal(initialSpaces[0].is_active, true);

      // Admin executes suspension due to reported fake parking
      const result = store.adminSuspendOwner(
        hostPublicId,
        'Reported fraudulent gate by driver; verified unauthorized premises',
        'admin@parkbnb.in'
      );

      assert.equal(result.success, true);
      assert.ok(result.deactivatedSpacesCount > 0, 'Must deactivate all owned spaces');

      // Verify provider profile is rejected
      const provider = store.getProviderByOwnerPublicId(hostPublicId);
      assert.equal(provider?.verification_status, 'rejected');

      // Verify user profile is suspended
      const profile = store.getProfileById('usr-host-ahmedabad-02');
      assert.equal(profile?.status, 'suspended');

      // Verify spaces are deactivated and marked rejected
      const updatedSpaces = store.getSpacesByProvider('usr-host-ahmedabad-02');
      for (const space of updatedSpaces) {
        assert.equal(space.is_active, false, 'Space must be marked is_active: false');
        assert.equal(space.status, 'rejected', 'Space must be marked status: rejected');
      }

      // Verify public approved spaces list excludes the delisted spaces
      const approvedPublic = store.getApprovedPublicSpaces();
      assert.ok(
        !approvedPublic.some(s => s.provider_id === 'usr-host-ahmedabad-02'),
        'Public search must strictly exclude spaces from suspended owner'
      );

      // Verify audit log entry
      const logs = store.getAuditLogs();
      const auditMatch = logs.find(
        l => l.action === 'SUSPEND_OWNER_DELIST_SPACES' && l.target_id === hostPublicId
      );
      assert.ok(auditMatch, 'Suspension action must be recorded in audit log');

      // 4.2 Reactivate owner restores approved state
      const reactivateRes = store.adminReactivateOwner(hostPublicId, 'admin@parkbnb.in');
      assert.equal(reactivateRes.success, true);

      const restoredProvider = store.getProviderByOwnerPublicId(hostPublicId);
      assert.equal(restoredProvider?.verification_status, 'approved');

      const restoredProfile = store.getProfileById('usr-host-ahmedabad-02');
      assert.equal(restoredProfile?.status, 'active');

      const restoredSpaces = store.getSpacesByProvider('usr-host-ahmedabad-02');
      for (const space of restoredSpaces) {
        assert.equal(space.is_active, true);
        assert.equal(space.status, 'approved');
      }
    });
  });
});
