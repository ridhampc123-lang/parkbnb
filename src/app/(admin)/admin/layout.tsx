import { getServerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { isStaffRole } from '@/lib/auth/rbac';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { getSupabaseConfigStatus } from '@/lib/supabase/config';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { Database, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // Strict Server-Side Security Guard: Redirect directly to Login
  if (!session.isAuthenticated || !isStaffRole(session.role)) {
    redirect('/login');
  }

  const store = getLocalStore();
  const metrics = store.getAdminMetrics();
  const settings = store.getPlatformSettings();
  const dbStatus = getSupabaseConfigStatus();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-purple-600 selection:text-white">
      {/* Responsive Admin Sidebar (Desktop sidebar + Mobile drawer) */}
      <AdminSidebar
        operator={{
          fullName: session.profile?.full_name || 'ParkBnB Administrator',
          email: session.profile?.email || 'admin@parkbnb.in',
          role: session.role,
        }}
        metrics={{
          pendingVerifications: metrics.pendingOwnerVerification,
          openDisputes: metrics.openDisputes,
        }}
        isDbConfigured={dbStatus.isConfigured}
        maintenanceMode={settings.emergencyMaintenanceMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top System Health Bar */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-4 sm:px-6 flex items-center justify-between text-xs shrink-0 sticky top-0 md:static z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-slate-300 font-semibold text-[11px] sm:text-xs">
                AHMEDABAD OPS NODE
              </span>
            </div>

            {settings.emergencyMaintenanceMode && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold font-mono">
                MAINTENANCE MODE
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-5 text-slate-400 font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">DB:</span>
              <span className="text-slate-300 font-semibold">
                {dbStatus.isConfigured ? 'Supabase' : 'Local Store'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Active</span>
            </div>
          </div>
        </header>

        {/* Page Children with responsive padding */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
