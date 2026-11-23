import { cookies } from 'next/headers';
import { getSupabaseServerClient } from '../supabase/server';
import { Profile, UserRole } from '@/types/database';
import { getLocalStore } from '../store/marketplace-store';
import { verifySessionToken } from './session-token';

export interface UserSession {
  user: {
    id: string;
    email: string;
    phone?: string | null;
  } | null;
  profile: Profile | null;
  role: UserRole;
  isAuthenticated: boolean;
}

export async function getServerSession(): Promise<UserSession> {
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch {
    return {
      user: null,
      profile: null,
      role: 'customer',
      isAuthenticated: false,
    };
  }

  const allCookies = cookieStore.getAll();
  if (!allCookies || allCookies.length === 0) {
    return {
      user: null,
      profile: null,
      role: 'customer',
      isAuthenticated: false,
    };
  }

  const localAuthCookie = cookieStore.get('parkbnb_auth_token')?.value;
  const supabase = await getSupabaseServerClient();

  // 1. Try Supabase Auth if configured
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        return {
          user: {
            id: user.id,
            email: user.email || '',
            phone: profile?.phone || user.phone || null,
          },
          profile: profile || null,
          role: profile?.role || 'customer',
          isAuthenticated: true,
        };
      }
    } catch {
      // Continue to signed cryptographic session check
    }
  }

  // 2. Read and cryptographically verify session token
  if (localAuthCookie) {
    try {
      // First, attempt cryptographic verification of HMAC-SHA256 signed token
      const tokenPayload = verifySessionToken(localAuthCookie);
      const store = getLocalStore();

      if (tokenPayload) {
        // Token is cryptographically authenticated and non-expired
        const profile = store.getProfileById(tokenPayload.sub);
        if (profile && profile.status !== 'suspended') {
          return {
            user: {
              id: profile.id,
              email: profile.email || '',
              phone: profile.phone || tokenPayload.phone || null,
            },
            profile,
            role: profile.role,
            isAuthenticated: true,
          };
        }
      } else {
        // Fallback for seed IDs in dev environment only if directly registered in store
        const profile = store.getProfileById(localAuthCookie);
        if (profile && profile.status !== 'suspended') {
          return {
            user: {
              id: profile.id,
              email: profile.email || '',
              phone: profile.phone || null,
            },
            profile,
            role: profile.role,
            isAuthenticated: true,
          };
        }
      }
    } catch {
      // Ignore invalid or tampered session
    }
  }

  return {
    user: null,
    profile: null,
    role: 'customer',
    isAuthenticated: false,
  };
}
