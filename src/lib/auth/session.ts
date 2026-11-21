import { cookies } from 'next/headers';
import { getSupabaseServerClient } from '../supabase/server';
import { Profile, UserRole } from '@/types/database';
import { getLocalStore } from '../store/marketplace-store';

export interface UserSession {
  user: {
    id: string;
    email: string;
  } | null;
  profile: Profile | null;
  role: UserRole;
  isAuthenticated: boolean;
}

export async function getServerSession(): Promise<UserSession> {
  const supabase = await getSupabaseServerClient();
  const cookieStore = await cookies();
  const localAuthCookie = cookieStore.get('parkbnb_auth_token')?.value;

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
          },
          profile: profile || null,
          role: profile?.role || 'customer',
          isAuthenticated: true,
        };
      }
    } catch {
      // Continue to local session check
    }
  }

  // 2. Read local development session token
  if (localAuthCookie) {
    try {
      const store = getLocalStore();
      const profile = store.getProfileById(localAuthCookie);
      if (profile) {
        return {
          user: {
            id: profile.id,
            email: profile.email,
          },
          profile,
          role: profile.role,
          isAuthenticated: true,
        };
      }
    } catch {
      // Ignore invalid local session
    }
  }

  return {
    user: null,
    profile: null,
    role: 'customer',
    isAuthenticated: false,
  };
}
