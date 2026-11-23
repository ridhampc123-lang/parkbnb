'use client';

import { useState } from 'react';
import { Profile, CustomerVehicle, Booking } from '@/types/database';
import {
  toggleUserStatusAction,
  privilegedCustomerLookupAction,
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
} from 'lucide-react';

interface CustomerWithData extends Profile {
  vehicles: CustomerVehicle[];
  totalBookings: number;
  lifetimeSpend: number;
  activeBookingsCount: number;
}

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
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithData | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

    return matchesSearch && matchesStatus;
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
        message: `Driver ${customer.full_name} status updated to ${nextStatus}.`,
      });
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

  // Get bookings for selected customer
  const customerBookings = selectedCustomer
    ? bookings.filter(b => b.customer_id === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Driver & Customer Directory</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
              {totalDrivers} Renters
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage registered motorists, unique Customer Public IDs, and account security.
          </p>
        </div>

        {/* Privileged Lookup Trigger Button */}
        <button
          onClick={() => {
            setLookupModalOpen(true);
            setLookupResult(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all w-fit"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Privileged Customer Lookup (Audited)</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
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
            <span>Total Customers</span>
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

        <div className="flex items-center gap-2">
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
            <p className="font-bold text-white text-sm">No customers found</p>
            <p>No customer accounts match your current query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Customer Public ID</th>
                  <th className="p-3.5">Full Name</th>
                  <th className="p-3.5">Contact (Masked)</th>
                  <th className="p-3.5">Vehicles</th>
                  <th className="p-3.5">Reservations</th>
                  <th className="p-3.5">Lifetime Spend</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Customer Public ID */}
                    <td className="p-3.5 font-mono font-bold text-cyan-400 text-[11px]">
                      {customer.customer_public_id || 'PBN-C-PENDING'}
                    </td>

                    {/* Name */}
                    <td className="p-3.5 font-semibold text-white">
                      {customer.full_name}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
