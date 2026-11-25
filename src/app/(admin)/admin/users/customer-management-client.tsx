'use client';

import { useState } from 'react';
import { Profile, CustomerVehicle, Booking, UserRole } from '@/types/database';
import {
  toggleUserStatusAction,
  privilegedCustomerLookupAction,
  updateUserRoleAction,
} from '@/server/actions/admin-actions';
import {
  Users,
  Search,
  Filter,
  Car,
  Calendar,
  IndianRupee,
  ShieldCheck,
  ShieldAlert,
  UserX,
  UserCheck,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  X,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  FileText,
  UserCog,
  Shield,
  Sparkles,
} from 'lucide-react';

interface CustomerWithData extends Profile {
  vehicles: CustomerVehicle[];
  totalBookings: number;
  lifetimeSpend: number;
  activeBookingsCount: number;
}

const ALL_ROLES: { role: UserRole; label: string; desc: string; badgeClass: string }[] = [
  { role: 'customer', label: 'Driver / Customer', desc: 'Books parking bays & manages vehicles', badgeClass: 'bg-slate-800 text-slate-300 border-slate-700' },
  { role: 'provider', label: 'Parking Host / Owner', desc: 'Owns properties, lists bays, manages gate manifest', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { role: 'support_agent', label: 'Support Agent', desc: 'Resolves driver inquiries & conducts audited lookups', badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { role: 'operations_manager', label: 'Operations Manager', desc: 'Manages spaces, gate disputes & operational overrides', badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { role: 'finance_manager', label: 'Finance Manager', desc: 'Audits ledger, disburses payouts & reviews earnings', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { role: 'verification_manager', label: 'Verification Manager', desc: 'Audits property rights & host KYC applications', badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { role: 'admin', label: 'Administrator', desc: 'Full console access across listings, users & finances', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { role: 'super_admin', label: 'Super Admin', desc: 'Unrestricted root authority & role governance', badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
];

export function CustomerManagementClient({
  initialCustomers,
  bookings,
}: {
  initialCustomers: CustomerWithData[];
  bookings: Booking[];
}) {
  const [customers, setCustomers] = useState<CustomerWithData[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithData | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Role Reassignment Modal State
  const [roleModalCustomer, setRoleModalCustomer] = useState<CustomerWithData | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('customer');
  const [roleReason, setRoleReason] = useState('');
  const [roleUpdating, setRoleUpdating] = useState(false);

  // Privileged Lookup Modal State
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [lookupTerm, setLookupTerm] = useState('');
  const [lookupReason, setLookupReason] = useState('gate_entry_denial');
  const [lookupDetails, setLookupDetails] = useState('');
  const [unmaskSensitive, setUnmaskSensitive] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    customer?: any;
    auditLogId?: string;
    error?: string;
  } | null>(null);

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const fullName = c.full_name || '';
    const email = c.email || '';
    const phone = c.phone || '';
    const publicId = c.customer_public_id || '';
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      fullName.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower) ||
      phone.includes(searchTerm) ||
      publicId.toLowerCase().includes(searchLower) ||
      c.vehicles.some(v => (v.registration_number || '').toLowerCase().includes(searchLower));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && (!c.status || c.status === 'active')) ||
      (statusFilter === 'suspended' && c.status === 'suspended');

    const matchesRole = roleFilter === 'all' || c.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // KPI calculations
  const totalDrivers = customers.length;
  const activeDrivers = customers.filter(c => !c.status || c.status === 'active').length;
  const suspendedDrivers = customers.filter(c => c.status === 'suspended').length;
  const totalLifetimeSpend = customers.reduce((sum, c) => sum + c.lifetimeSpend, 0);

  // Toggle user status
  const handleToggleStatus = async (customer: CustomerWithData) => {
    const nextStatus = customer.status === 'suspended' ? 'active' : 'suspended';
    const confirmMsg =
      nextStatus === 'suspended'
        ? `Are you sure you want to suspend driver "${customer.full_name}"? Their account will be locked immediately.`
        : `Reactivate driver account for "${customer.full_name}"?`;

    if (!confirm(confirmMsg)) return;

    setActionLoadingId(customer.id);
    setFeedback(null);

    const res = await toggleUserStatusAction({
      userId: customer.id,
      status: nextStatus,
      reason: nextStatus === 'suspended' ? 'Administrative suspension' : 'Administrative reactivation',
    });

    setActionLoadingId(null);

    if (res.error) {
      setFeedback({ type: 'error', message: res.error });
    } else {
      setCustomers(prev =>
        prev.map(c => (c.id === customer.id ? { ...c, status: nextStatus } : c))
      );
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(prev => (prev ? { ...prev, status: nextStatus } : null));
      }
      setFeedback({
        type: 'success',
        message: `User ${customer.full_name} status updated to ${nextStatus}.`,
      });
    }
  };

  // Reassign User Role
  const handleSaveRole = async () => {
    if (!roleModalCustomer) return;
    setRoleUpdating(true);
    setFeedback(null);

    const res = await updateUserRoleAction({
      userId: roleModalCustomer.id,
      role: targetRole,
      reason: roleReason.trim() || 'Role reassigned via Admin User Directory',
    });

    setRoleUpdating(false);

    if (res.error) {
      setFeedback({ type: 'error', message: res.error });
    } else {
      setCustomers(prev =>
        prev.map(c => (c.id === roleModalCustomer.id ? { ...c, role: targetRole } : c))
      );
      if (selectedCustomer?.id === roleModalCustomer.id) {
        setSelectedCustomer(prev => (prev ? { ...prev, role: targetRole } : null));
      }
      setFeedback({
        type: 'success',
        message: `Successfully changed role for ${roleModalCustomer.full_name} to "${targetRole}".`,
      });
      setRoleModalCustomer(null);
      setRoleReason('');
    }
  };

  // Perform Audited Privileged Customer Lookup
  const handlePrivilegedLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupLoading(true);
    setLookupResult(null);

    const fullReason = `${lookupReason}: ${lookupDetails}`.trim();
    const res = await privilegedCustomerLookupAction({
      searchTerm: lookupTerm,
      reason: fullReason,
      unmaskSensitive,
    });

    setLookupLoading(false);

    if (res.error) {
      setLookupResult({ error: res.error });
    } else {
      setLookupResult({
        customer: res.customer,
        auditLogId: res.auditLogId,
      });
    }
  };

  const getRoleConfig = (role?: string) => {
    return ALL_ROLES.find(r => r.role === role) || ALL_ROLES[0];
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
            Identity & User Directory
          </span>
          <h1 className="text-2xl font-black text-white mt-1">User & Role Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage customer accounts, parking providers, and platform staff roles under DPDP Act privacy governance.
          </p>
        </div>

        <button
          onClick={() => {
            setLookupModalOpen(true);
            setLookupResult(null);
            setLookupTerm('');
            setLookupDetails('');
          }}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-cyan-800/50 shadow-sm transition-colors flex items-center gap-2 w-fit"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Privileged Customer Lookup (Audited)</span>
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Accounts</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{totalDrivers}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Accounts</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">{activeDrivers}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Suspended</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 font-mono">{suspendedDrivers}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Lifetime Spend</span>
            <IndianRupee className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-300 font-mono">₹{totalLifetimeSpend.toFixed(2)}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by Public ID (PBN-C-...), name, email, or license plate..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-semibold"
          >
            <option value="all">All Roles</option>
            {ALL_ROLES.map(r => (
              <option key={r.role} value={r.role}>
                {r.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                statusFilter === 'all' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({totalDrivers})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                statusFilter === 'active' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active ({activeDrivers})
            </button>
            <button
              onClick={() => setStatusFilter('suspended')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                statusFilter === 'suspended' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Suspended ({suspendedDrivers})
            </button>
          </div>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-bold text-white text-sm">No users found</p>
            <p>No user accounts match your current query.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (lg:block) */}
            <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">User Public ID</th>
                  <th className="p-3.5">Full Name</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Contact (Masked)</th>
                  <th className="p-3.5">Vehicles</th>
                  <th className="p-3.5">Reservations</th>
                  <th className="p-3.5">Spend</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCustomers.map(customer => {
                  const roleConfig = getRoleConfig(customer.role);
                  return (
                    <tr key={customer.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Customer Public ID */}
                      <td className="p-3.5 font-mono font-bold text-cyan-400 text-[11px]">
                        {customer.customer_public_id || 'PBN-C-PENDING'}
                      </td>

                      {/* Name */}
                      <td className="p-3.5 font-semibold text-white">
                        {customer.full_name}
                      </td>

                      {/* Role Badge with Change Trigger */}
                      <td className="p-3.5">
                        <button
                          onClick={() => {
                            setRoleModalCustomer(customer);
                            setTargetRole(customer.role);
                            setRoleReason('');
                          }}
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border transition-transform hover:scale-105 ${roleConfig.badgeClass}`}
                          title="Click to change role"
                        >
                          <Shield className="w-2.5 h-2.5" />
                          <span>{customer.role || 'customer'}</span>
                        </button>
                      </td>

                      {/* Contact (Masked by default) */}
                      <td className="p-3.5 space-y-0.5 text-slate-400 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>
                            {customer.email ? `${customer.email.slice(0, 3)}***@${customer.email.split('@')[1] || ''}` : 'No email'}
                          </span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{customer.phone.slice(0, 2)}****{customer.phone.slice(-4)}</span>
                          </div>
                        )}
                      </td>

                      {/* Vehicles */}
                      <td className="p-3.5">
                        {customer.vehicles.length === 0 ? (
                          <span className="text-slate-500">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {customer.vehicles.map(v => (
                              <span
                                key={v.id}
                                className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300"
                              >
                                {v.registration_number}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Reservations */}
                      <td className="p-3.5 font-mono text-slate-300">
                        {customer.totalBookings}
                      </td>

                      {/* Lifetime Spend */}
                      <td className="p-3.5 font-mono font-bold text-white">
                        ₹{customer.lifetimeSpend.toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            customer.status === 'suspended'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {customer.status || 'active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setRoleModalCustomer(customer);
                            setTargetRole(customer.role);
                            setRoleReason('');
                          }}
                          className="px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800 rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          Change Role
                        </button>

                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          Details
                        </button>

                        <button
                          onClick={() => handleToggleStatus(customer)}
                          disabled={actionLoadingId === customer.id}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            customer.status === 'suspended'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {customer.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

            {/* Mobile Card User Directory View (lg:hidden) */}
            <div className="lg:hidden divide-y divide-slate-800">
              {filteredCustomers.map(customer => {
                const roleConfig = getRoleConfig(customer.role);
                return (
                  <div key={customer.id} className="p-4 space-y-3 bg-slate-900">
                    {/* Card Header: Public ID, Role, Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-cyan-400 text-xs">
                        {customer.customer_public_id || 'PBN-C-PENDING'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${roleConfig.badgeClass}`}>
                          <Shield className="w-2.5 h-2.5" />
                          <span>{customer.role || 'customer'}</span>
                        </span>

                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            customer.status === 'suspended'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {customer.status || 'active'}
                        </span>
                      </div>
                    </div>

                    {/* Name and Contact */}
                    <div>
                      <h4 className="text-sm font-bold text-white">{customer.full_name}</h4>
                      <div className="text-xs text-slate-400 font-mono space-y-0.5 mt-1">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            {customer.email ? `${customer.email.slice(0, 3)}***@${customer.email.split('@')[1] || ''}` : 'No email'}
                          </span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{customer.phone.slice(0, 2)}****{customer.phone.slice(-4)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vehicles & Stats Row */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Vehicles</span>
                        <span className="font-mono text-white font-bold">
                          {customer.vehicles.length > 0
                            ? customer.vehicles.map(v => v.registration_number).join(', ')
                            : 'None'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Spend ({customer.totalBookings} trips)</span>
                        <span className="font-mono text-cyan-300 font-bold">
                          ₹{customer.lifetimeSpend.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => {
                          setRoleModalCustomer(customer);
                          setTargetRole(customer.role);
                          setRoleReason('');
                        }}
                        className="flex-1 py-2 px-3 bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-800 rounded-xl text-xs font-semibold transition-colors min-h-[44px] flex items-center justify-center gap-1"
                      >
                        <UserCog className="w-3.5 h-3.5" />
                        <span>Change Role</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(customer)}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors min-h-[44px] flex items-center justify-center"
                      >
                        Details
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(customer)}
                        disabled={actionLoadingId === customer.id}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors min-h-[44px] flex items-center justify-center ${
                          customer.status === 'suspended'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {customer.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ROLE REASSIGNMENT MODAL */}
      {roleModalCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl pb-safe animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-1 sm:hidden shrink-0" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Change User Role</h3>
              </div>
              <button
                onClick={() => setRoleModalCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
              <p className="text-slate-400">
                Target User: <strong className="text-white">{roleModalCustomer.full_name}</strong>
              </p>
              <p className="text-slate-400 font-mono text-[11px]">
                Email: {roleModalCustomer.email}
              </p>
              <p className="text-slate-400">
                Current Role: <span className="font-bold text-cyan-400 uppercase">{roleModalCustomer.role}</span>
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Select New Operational Role
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {ALL_ROLES.map(r => {
                    const isSelected = targetRole === r.role;
                    return (
                      <div
                        key={r.role}
                        onClick={() => setTargetRole(r.role)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-950/60 border-purple-500 shadow-sm'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${isSelected ? 'text-purple-300' : 'text-slate-200'}`}>
                            {r.label}
                          </span>
                          <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${r.badgeClass}`}>
                            {r.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{r.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Reason for Role Change (Audit Trail)
                </label>
                <input
                  type="text"
                  value={roleReason}
                  onChange={e => setRoleReason(e.target.value)}
                  placeholder="e.g. Promoted to property provider or staff team"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRoleModalCustomer(null)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={roleUpdating || targetRole === roleModalCustomer.role}
                  onClick={handleSaveRole}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
                >
                  {roleUpdating ? 'Updating Role...' : 'Save Role Change'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER DETAILS DRAWER / MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl pb-safe animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-1 sm:hidden shrink-0" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">User Account Details</h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block">Public ID:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedCustomer.customer_public_id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Role:</span>
                  <span className="font-bold uppercase text-purple-400">{selectedCustomer.role}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Full Name:</span>
                  <span className="font-semibold text-white">{selectedCustomer.full_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Account Status:</span>
                  <span className={`font-bold uppercase ${selectedCustomer.status === 'suspended' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedCustomer.status || 'active'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Reservations:</span>
                  <span className="font-mono font-bold text-white">{selectedCustomer.totalBookings}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Lifetime Spend:</span>
                  <span className="font-mono font-bold text-white">₹{selectedCustomer.lifetimeSpend.toFixed(2)}</span>
                </div>
              </div>

              {/* Registered Vehicles */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Registered Vehicles ({selectedCustomer.vehicles.length})
                </h4>
                {selectedCustomer.vehicles.length === 0 ? (
                  <p className="text-slate-500 italic">No vehicles registered yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedCustomer.vehicles.map(v => (
                      <div
                        key={v.id}
                        className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-cyan-400" />
                          <span className="font-mono font-bold text-white">{v.registration_number}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {v.vehicle_type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedCustomer;
                    setSelectedCustomer(null);
                    setRoleModalCustomer(c);
                    setTargetRole(c.role);
                    setRoleReason('');
                  }}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <UserCog className="w-4 h-4" />
                  <span>Change Role</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRIVILEGED CUSTOMER LOOKUP MODAL */}
      {lookupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Privileged Customer Lookup</h3>
              </div>
              <button
                onClick={() => setLookupModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Compliance Notice:</strong> This lookup is strictly audited. An immutable log entry with your staff ID, timestamp, and selected reason will be recorded in the security audit trail.
              </span>
            </div>

            <form onSubmit={handlePrivilegedLookup} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Lookup Reference (Customer ID, Booking Ref, Phone, or Email)
                </label>
                <input
                  type="text"
                  required
                  value={lookupTerm}
                  onChange={e => setLookupTerm(e.target.value)}
                  placeholder="e.g. PBN-C-XXXX or PKB-20261123-XXXX"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Legitimate Support Category (Mandatory)
                </label>
                <select
                  value={lookupReason}
                  onChange={e => setLookupReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="gate_entry_denial">Gate Entry Barrier Denial / Security Refusal</option>
                  <option value="wrong_vehicle_parked">Wrong Vehicle License Plate Occupying Bay</option>
                  <option value="overstay_penalty_review">Overstay Violation Investigation</option>
                  <option value="property_damage_claim">Property Damage Incident Claim</option>
                  <option value="lost_property_inquiry">Lost Property Recovery Inquiry</option>
                  <option value="payment_dispute_arbitration">Payment / Refund Dispute Arbitration</option>
                  <option value="authorized_legal_escalation">Authorized Legal / Law Enforcement Escalation</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Detailed Support Notes / Ticket Reference
                </label>
                <textarea
                  required
                  rows={2}
                  value={lookupDetails}
                  onChange={e => setLookupDetails(e.target.value)}
                  placeholder="Provide incident reference and justification for lookup..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="unmaskSensitive"
                  checked={unmaskSensitive}
                  onChange={e => setUnmaskSensitive(e.target.checked)}
                  className="rounded border-slate-800 text-cyan-600 focus:ring-cyan-500 bg-slate-950"
                />
                <label htmlFor="unmaskSensitive" className="text-slate-300 font-medium">
                  Request unmasked phone & email (Logs elevated audit event)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setLookupModalOpen(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {lookupLoading ? 'Auditing & Fetching...' : 'Perform Audited Lookup'}
                </button>
              </div>
            </form>

            {/* Lookup Result Box */}
            {lookupResult && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                {lookupResult.error ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{lookupResult.error}</span>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950 border border-cyan-800/60 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-cyan-400 font-mono text-[11px]">
                      <span>AUDIT LOG ID: {lookupResult.auditLogId}</span>
                      <span className="text-emerald-400 font-bold uppercase">RECORD VERIFIED</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Customer Public ID:</span>
                        <span className="font-mono font-bold text-white">{lookupResult.customer?.customer_public_id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Display Name:</span>
                        <span className="font-semibold text-white">{lookupResult.customer?.full_name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Email Address:</span>
                        <span className="font-mono text-white">{lookupResult.customer?.email_unmasked || lookupResult.customer?.email_masked}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Verified Mobile:</span>
                        <span className="font-mono text-white">{lookupResult.customer?.phone_unmasked || lookupResult.customer?.phone_masked}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
