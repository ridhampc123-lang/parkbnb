const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k && !process.env[k]) {
      process.env[k] = v.join('=');
    }
  }
}

async function inspectDb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const client = createClient(url, serviceKey);

  console.log('--- Inspecting Profiles Table ---');
  const { data: profiles, error: pErr } = await client.from('profiles').select('*');
  console.log('Profiles in DB:', { count: profiles?.length, error: pErr, sample: profiles });

  console.log('\n--- Inspecting Provider Profiles ---');
  const { data: providers, error: provErr } = await client.from('provider_profiles').select('*');
  console.log('Provider Profiles in DB:', { count: providers?.length, error: provErr });

  console.log('\n--- Inspecting Properties ---');
  const { data: props, error: propErr } = await client.from('properties').select('*');
  console.log('Properties in DB:', { count: props?.length, error: propErr });

  console.log('\n--- Inspecting Parking Spaces ---');
  const { data: spaces, error: spErr } = await client.from('parking_spaces').select('*');
  console.log('Spaces in DB:', { count: spaces?.length, error: spErr });

  console.log('\n--- Inspecting Bookings ---');
  const { data: bookings, error: bkErr } = await client.from('bookings').select('*');
  console.log('Bookings in DB:', { count: bookings?.length, error: bkErr });

  console.log('\n--- Inspecting Audit Logs ---');
  const { data: audit, error: aErr } = await client.from('audit_logs').select('*');
  console.log('Audit logs in DB:', { count: audit?.length, error: aErr });

  console.log('\n--- Testing Insert & Delete on Profiles ---');
  const testId = '00000000-0000-0000-0000-000000000001';
  const { data: insData, error: insErr } = await client.from('profiles').upsert({
    id: testId,
    full_name: 'Test Connectivity User',
    email: 'connectivity_test@parkbnb.in',
    role: 'customer',
    status: 'active',
    customer_public_id: 'PKB-TEST-001'
  }).select();
  console.log('Upsert test result:', { insData, insErr });

  if (!insErr) {
    const { error: delErr } = await client.from('profiles').delete().eq('id', testId);
    console.log('Cleanup test result:', { delErr });
  }
}

inspectDb();
