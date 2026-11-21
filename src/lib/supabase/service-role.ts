import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfigStatus } from './config';

/**
 * Server-only administrative Supabase client.
 * Strictly restricted to backend operations like webhook settlement and cron tasks.
 * NEVER import this file into a Client Component.
 */
export function getSupabaseServiceRoleClient() {
  const config = getSupabaseConfigStatus();
  if (!config.hasServiceRoleKey || !config.hasUrl) {
    return null;
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
