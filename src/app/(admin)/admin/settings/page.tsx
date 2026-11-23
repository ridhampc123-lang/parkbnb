import { getLocalStore } from '@/lib/store/marketplace-store';
import { SettingsClient } from './settings-client';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const store = getLocalStore();
  const settings = store.getPlatformSettings();

  return <SettingsClient initialSettings={settings} />;
}
