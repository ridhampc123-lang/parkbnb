import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { repository } from '@/lib/db/supabase-repository';
import { ProfileClient } from './profile-client';

export const metadata = {
  title: 'Profile & Privacy Settings | ParkBnB',
};

export default async function CustomerProfilePage() {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    redirect('/login');
  }

  const profile = (await repository.getProfileById(session.user.id)) || session.profile;
  const vehicles = await repository.getVehiclesByCustomer(session.user.id);

  return <ProfileClient profile={profile!} vehicles={vehicles} />;
}
