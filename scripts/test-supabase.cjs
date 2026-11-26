const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load .env.local manually if not already loaded
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

async function testSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  console.log('Testing Supabase Connection...');
  console.log('URL:', url);
  console.log('Anon Key length:', anonKey?.length, 'prefix:', anonKey?.substring(0, 15));
  console.log('Service Key length:', serviceKey?.length, 'prefix:', serviceKey?.substring(0, 15));

  // Test 1: Anon client
  const anonClient = createClient(url, anonKey);
  console.log('\n--- 1. Testing Anon Client ---');
  try {
    const { data, error, count } = await anonClient.from('profiles').select('*', { count: 'exact', head: true });
    console.log('Anon profiles query:', { error: error ? `${error.code}: ${error.message} (${error.details || ''})` : 'None', count });
  } catch (err) {
    console.error('Anon profiles threw:', err);
  }

  // Test 2: Service Role client
  const adminClient = createClient(url, serviceKey);
  console.log('\n--- 2. Testing Service Role Client (Auth Admin) ---');
  try {
    const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers();
    if (usersError) {
      console.log('Admin listUsers ERROR:', usersError);
    } else {
      console.log(`Admin listUsers OK: Found ${usersData.users.length} users:`);
      for (const u of usersData.users) {
        console.log(`  - ID: ${u.id}, Email: ${u.email}, Phone: ${u.phone}`);
      }
    }
  } catch (err) {
    console.error('Admin listUsers threw:', err);
  }

  // Test 3: Check database tables
  const tables = [
    'profiles',
    'provider_profiles',
    'properties',
    'parking_spaces',
    'customer_vehicles',
    'bookings',
    'booking_holds',
    'financial_ledger',
    'reviews',
    'support_tickets',
    'audit_logs',
    'customer_data_access_logs'
  ];
  console.log('\n--- 3. Testing Database Tables via Service Role ---');
  for (const table of tables) {
    try {
      const { data, error, count } = await adminClient.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`Table [${table}]: ERROR -> ${error.code}: ${error.message} (${error.details || ''})`);
      } else {
        console.log(`Table [${table}]: OK (count: ${count})`);
      }
    } catch (err) {
      console.log(`Table [${table}]: EXCEPTION -> ${err.message}`);
    }
  }
}

testSupabase();
