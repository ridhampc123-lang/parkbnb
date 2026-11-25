#!/usr/bin/env node
/**
 * ParkBnB Role Management CLI Script
 * 
 * Usage:
 *   node scripts/set-role.cjs <email> <role>
 * 
 * Examples:
 *   node scripts/set-role.cjs admin@parkbnb.in super_admin
 *   node scripts/set-role.cjs host@parkbnb.in provider
 *   node scripts/set-role.cjs support@parkbnb.in support_agent
 */

const fs = require('fs');
const path = require('path');

// 1. Load environment variables from .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)?$/);
    if (match) {
      const key = match[1];
      let val = match[2] || '';
      val = val.trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const ALLOWED_ROLES = [
  'visitor',
  'customer',
  'provider',
  'support_agent',
  'operations_manager',
  'finance_manager',
  'verification_manager',
  'admin',
  'super_admin',
];

const email = process.argv[2]?.trim().toLowerCase();
const newRole = process.argv[3]?.trim().toLowerCase();

if (!email || !newRole) {
  console.log('\n❌ Error: Missing required arguments.\n');
  console.log('Usage:');
  console.log('  node scripts/set-role.cjs <email> <role>\n');
  console.log('Available roles:');
  ALLOWED_ROLES.forEach(r => console.log(`  - ${r}`));
  console.log('\nExample:');
  console.log('  node scripts/set-role.cjs admin@parkbnb.in super_admin\n');
  process.exit(1);
}

if (!ALLOWED_ROLES.includes(newRole)) {
  console.log(`\n❌ Error: Invalid role "${newRole}".`);
  console.log('Allowed roles are:', ALLOWED_ROLES.join(', '), '\n');
  process.exit(1);
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`   ParkBnB Role Reassignment Tool`);
  console.log(`======================================================`);
  console.log(`Target Email : ${email}`);
  console.log(`Assigned Role: ${newRole}`);
  console.log(`------------------------------------------------------`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && serviceKey) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // 1. Check if user exists in public.profiles
      const { data: profiles, error: selectErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('email', email);

      if (selectErr) {
        console.warn(`[Supabase Notice] Could not query profiles: ${selectErr.message}`);
      } else if (profiles && profiles.length > 0) {
        const user = profiles[0];
        const oldRole = user.role;

        // 2. Update role in public.profiles
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('email', email);

        if (updateErr) {
          console.error(`❌ Failed to update Supabase profiles table: ${updateErr.message}`);
        } else {
          console.log(`✅ Success! Updated profile in Supabase database.`);
          console.log(`   User: ${user.full_name} (${user.id})`);
          console.log(`   Role: ${oldRole} ➔ ${newRole}`);
        }

        // 3. If changing to provider, ensure provider_profiles row exists
        if (newRole === 'provider') {
          const { data: existingProvider } = await supabase
            .from('provider_profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (!existingProvider) {
            await supabase.from('provider_profiles').insert({
              id: user.id,
              business_name: user.full_name,
              business_type: 'individual',
              verification_status: 'approved',
              commission_rate: 0.15,
            });
            console.log(`✅ Created parking provider profile record for host operations.`);
          }
        }
      } else {
        console.log(`⚠️ User with email "${email}" was not found in Supabase public.profiles.`);
        console.log(`   Make sure the user has registered or signed up first.`);
      }
    } catch (err) {
      console.warn(`[Supabase Connection] ${err.message}`);
    }
  } else {
    console.log(`⚠️ Supabase environment variables not found in .env.local.`);
  }

  console.log(`\n------------------------------------------------------`);
  console.log(`💡 Note: If the user is currently logged in, they must`);
  console.log(`   LOG OUT and LOG BACK IN for the new role permissions`);
  console.log(`   to take effect in their browser session cookie.`);
  console.log(`======================================================\n`);
}

main();
