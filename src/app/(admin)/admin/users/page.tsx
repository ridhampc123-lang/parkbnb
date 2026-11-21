import { getLocalStore } from '@/lib/store/marketplace-store';
import { Users, Shield, Mail, Phone, Calendar } from 'lucide-react';

export default function AdminUsersPage() {
  const store = getLocalStore();
  const profiles = store.getAllProfiles();

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
          Identity Directory
        </span>
        <h1 className="text-2xl font-black text-white mt-1">User & Host Accounts</h1>
        <p className="text-xs text-slate-400 mt-1">
          Registered accounts on ParkBnB. Strictly controlled RBAC roles.
        </p>
      </div>

      <div className="bg-slate-900 rounded-card border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            All Accounts ({profiles.length})
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Governed by Row Level Security</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">User Name</th>
                <th className="p-3.5">Email Address</th>
                <th className="p-3.5">Mobile</th>
                <th className="p-3.5">Assigned Role</th>
                <th className="p-3.5">Phone Verified</th>
                <th className="p-3.5 text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold text-white">{p.full_name}</td>
                  <td className="p-3.5 text-slate-300 font-mono text-[11px]">{p.email}</td>
                  <td className="p-3.5 text-slate-400 font-mono text-[11px]">{p.phone || 'Not recorded'}</td>
                  <td className="p-3.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      p.role === 'admin' || p.role === 'super_admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      p.role === 'provider' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {p.role}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {p.phone_verified ? (
                      <span className="text-emerald-400 font-semibold text-[11px]">Yes</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Pending SMS</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right text-slate-400 font-mono text-[11px]">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
