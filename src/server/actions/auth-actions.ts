'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginSchema, registerSchema } from '@/lib/validation/schemas';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { Profile, ProviderProfile } from '@/types/database';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const validation = loginSchema.safeParse({ email, password });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const supabase = await getSupabaseServerClient();

  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error: error.message };
    }
  }

  // Local store authentication fallback/coordination
  const store = getLocalStore();
  let profile = store.getProfileByEmail(email);

  if (!profile) {
    // If not found in local store, return error
    return { error: 'Invalid email or password. Please register if you do not have an account.' };
  }

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set('parkbnb_auth_token', profile.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return { success: true, role: profile.role };
}

export async function registerAction(formData: FormData) {
  const full_name = formData.get('full_name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const phone = (formData.get('phone') as string) || '';
  const role = (formData.get('role') as 'customer' | 'provider') || 'customer';

  const validation = registerSchema.safeParse({ full_name, email, password, phone, role });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const store = getLocalStore();
  const existing = store.getProfileByEmail(email);
  if (existing) {
    return { error: 'An account with this email address already exists. Please sign in.' };
  }

  const userId = 'usr-' + Math.random().toString(36).substring(2, 9);
  const newProfile: Profile = {
    id: userId,
    full_name,
    email,
    phone: phone || null,
    phone_verified: false,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.createProfile(newProfile);

  if (role === 'provider') {
    const newProvider: ProviderProfile = {
      id: userId,
      provider_type: 'individual_residential',
      verification_status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.saveProviderProfile(newProvider);
  }

  // If Supabase is connected, trigger signup
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name, role },
        },
      });
    } catch {
      // Continue with local session
    }
  }

  const cookieStore = await cookies();
  cookieStore.set('parkbnb_auth_token', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return { success: true, role };
}

export async function logoutAction() {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
  }

  const cookieStore = await cookies();
  cookieStore.delete('parkbnb_auth_token');

  redirect('/login');
}
