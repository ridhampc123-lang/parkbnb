export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  hasRazorpay: boolean;
  supabaseUrl: string | null;
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  const hasUrl = Boolean(url && url.trim().length > 0 && !url.includes('your-supabase'));
  const hasAnonKey = Boolean(anonKey && anonKey.trim().length > 0 && !anonKey.includes('your-anon-key'));
  const hasServiceRoleKey = Boolean(serviceKey && serviceKey.trim().length > 0 && !serviceKey.includes('••••'));
  const hasRazorpay = Boolean(rzpKey && rzpKey.trim().length > 0);

  return {
    isConfigured: hasUrl && hasAnonKey,
    hasUrl,
    hasAnonKey,
    hasServiceRoleKey,
    hasRazorpay,
    supabaseUrl: hasUrl ? url! : null,
  };
}
