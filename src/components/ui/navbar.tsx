import { getServerSession } from '@/lib/auth/session';
import { NavbarClient } from './navbar-client';

export async function Navbar() {
  const session = await getServerSession();

  return (
    <NavbarClient
      session={{
        isAuthenticated: session.isAuthenticated,
        role: session.role,
        profile: session.profile
          ? {
              full_name: session.profile.full_name,
              email: session.profile.email,
            }
          : null,
      }}
    />
  );
}
