const { getLocalStore } = require('D:/parkbnb/src/lib/store/marketplace-store');
const { signSessionToken, verifySessionToken } = require('D:/parkbnb/src/lib/auth/session-token');

async function testFullSuite() {
  console.log('=== TEST 1: SPACE LISTING & ADMIN APPROVAL LIFECYCLE ===');
  const store = getLocalStore();

  const provider = store.getAllHosts()[0];
  console.log('Using Host:', provider.full_name, `(${provider.id})`);

  // 1. Host creates a space
  const testSpaceId = 'spc-test-flow-' + Date.now();
  const testSlug = 'bodakdev-premier-valet-' + Date.now();
  const newSpace = {
    id: testSpaceId,
    provider_id: provider.id,
    title: 'Bodakdev Premier Valet Parking',
    slug: testSlug,
    description: 'Secure, covered valet parking in Bodakdev, Ahmedabad.',
    address_line1: 'SG Highway, Bodakdev',
    city: 'Ahmedabad',
    state: 'Gujarat',
    postal_code: '380054',
    latitude: 23.0338,
    longitude: 72.5050,
    hourly_rate: 60,
    daily_rate: 350,
    monthly_rate: 4500,
    total_spots: 10,
    available_spots: 10,
    vehicle_types: ['car', 'suv'],
    access_type: 'valet',
    amenities: ['cctv', 'covered', 'security_guard'],
    status: 'submitted',
    is_active: false,
    rating_average: 0,
    rating_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.createSpace(newSpace);
  console.log('✓ Space created in submitted status. is_active:', newSpace.is_active);

  // 2. Check public approved spaces
  let publicSpaces = store.getApprovedPublicSpaces();
  let foundInPublic = publicSpaces.some(s => s.id === testSpaceId);
  console.log('Is submitted space visible in public search?', foundInPublic);
  if (foundInPublic) {
    throw new Error('FAILURE: Unapproved space is visible in public marketplace!');
  }
  console.log('✓ Unapproved space is correctly HIDDEN from public drivers.');

  // 3. Admin verifies space in /admin/verifications
  console.log('\n--- Admin Approving Space ---');
  store.updateSpace(testSpaceId, {
    status: 'approved',
    is_active: true,
  });

  const approvedSpace = store.getSpaceById(testSpaceId);
  console.log('Space status after Admin approval:', approvedSpace.status, 'is_active:', approvedSpace.is_active);

  publicSpaces = store.getApprovedPublicSpaces();
  foundInPublic = publicSpaces.some(s => s.id === testSpaceId);
  console.log('Is approved space now visible in public search?', foundInPublic);
  if (!foundInPublic) {
    throw new Error('FAILURE: Approved space did NOT appear in public marketplace!');
  }
  console.log('✓ Space is immediately LIVE and discoverable by public drivers!');

  // Cleanup test space
  store.deleteSpace(testSpaceId);
  console.log('✓ Test space cleaned up cleanly.');

  console.log('\n=== TEST 2: AUTHENTICATION & DIRECT ADMIN TOKEN ===');
  const adminStaff = store.getProfileByEmail('admin@parkbnb.in');
  console.log('Admin Staff found:', adminStaff.full_name, 'Role:', adminStaff.role);

  const { token } = signSessionToken({
    sub: adminStaff.id,
    phone: adminStaff.phone,
    name: adminStaff.full_name,
    role: adminStaff.role,
  });

  const verified = verifySessionToken(token);
  console.log('Token verified successfully. Role in token:', verified.role);
  if (verified.role !== 'admin' && verified.role !== 'super_admin') {
    throw new Error('FAILURE: Token role mismatch!');
  }
  console.log('✓ Admin cryptographic session token verified successfully.');

  console.log('\n=== ALL INTEGRATION CHECKS PASSED PERFECTLY! ===');
}

testFullSuite().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
