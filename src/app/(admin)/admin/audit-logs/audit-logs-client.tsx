'use client';

import { useState } from 'react';
import { AuditLogEntry } from '@/types/database';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';

export function AuditLogsClient({ initialAuditLogs }: { initialAuditLogs: AuditLogEntry[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredLogs = initialAuditLogs.filter(log => {
    const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
    const matchesSearch =
      searchTerm === '' ||
      log.operator_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.target_name && log.target_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
            Compliance & Security
          </span>
          <h1 className="text-2xl font-black text-white mt-1">Security Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable chronological record of administrative interventions, KYC approvals, fee updates, and financial arbitration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cryptographic Integrity Active</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by operator, action, target, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All Categories</option>
            <option value="auth">Auth & Security</option>
            <option value="user">Drivers & Users</option>
            <option value="host">Hosts & KYC</option>
            <option value="space">Parking Spaces</option>
            <option value="booking">Reservations</option>
            <option value="payout">Financial Payouts</option>
            <option value="dispute">Arbitration</option>
            <option value="settings">Platform Settings</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp (IST)</th>
                <th className="py-3.5 px-4">Operator</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-400">No audit logs matching query.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      {/* Operator */}
                      <td className="py-3.5 px-4 font-mono text-white text-xs whitespace-nowrap">
                        {log.operator_email}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-full ${
                          log.category === 'auth' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          log.category === 'user' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                          log.category === 'host' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          log.category === 'space' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          log.category === 'payout' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          log.category === 'dispute' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {log.category}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 font-mono font-bold text-accent text-[11px] whitespace-nowrap">
                        {log.action}
                      </td>

                      {/* Target */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-200">{log.target_name || '-'}</p>
                        {log.target_id && (
                          <p className="font-mono text-[10px] text-slate-500">{log.target_id}</p>
                        )}
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 text-slate-300 max-w-md">
                        <p className="line-clamp-2 leading-relaxed">{log.details}</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
