import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfigStatus } from './config';

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  const config = getSupabaseConfigStatus();
  if (!config.isConfigured) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return clientInstance;
}
