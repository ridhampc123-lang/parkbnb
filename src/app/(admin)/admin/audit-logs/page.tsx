import { getLocalStore } from '@/lib/store/marketplace-store';
import { AuditLogsClient } from './audit-logs-client';

export default async function AdminAuditLogsPage() {
  const store = getLocalStore();
  const auditLogs = store.getAuditLogs();

  return <AuditLogsClient initialAuditLogs={auditLogs} />;
}
