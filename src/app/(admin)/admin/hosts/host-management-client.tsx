'use client';

import { useState } from 'react';
import { Profile, ProviderProfile, ParkingSpace } from '@/types/database';
import {
  updateHostKYCAction,
  overrideHostCommissionAction,
  disburseHostPayoutAction,
  toggleSpaceActiveAction
} from '@/server/actions/admin-actions';
import {
  Building2,
  Search,
  Filter,
  Car,
  IndianRupee,
  ShieldCheck,
  ShieldAlert,
  Send,
  Percent,
  CheckCircle2,
  X,
  AlertCircle,
  Building,
  CreditCard,
  MapPin,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface HostData {
  profile: Profile;
  provider: ProviderProfile;
  spacesCount: number;
  activeSpacesCount: number;
  totalEarnings: number;
  unpaidBalance: number;
  spaces: ParkingSpace[];
}

export function HostManagementClient({
  initialHosts,
}: {
  initialHosts: HostData[];
}) {
  const [hosts, setHosts] = useState<HostData[]>(initialHosts);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'submitted' | 'suspended'>('all');
  const [selectedHost, setSelectedHost] = useState<HostData | null>(null);
  const [payoutHost, setPayoutHost] = useState<HostData | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<'NEFT' | 'IMPS' | 'UPI'>('NEFT');
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [commissionModalHost, setCommissionModalHost] = useState<HostData | null>(null);
  const [customCommission, setCustomCommission] = useState<number>(15);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter hosts
  const filteredHosts = hosts.filter(h => {
    const fullName = h.profile?.full_name || '';
    const email = h.profile?.email || '';
    const businessName = h.provider?.business_name || '';
    const phone = h.profile?.phone || '';
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      fullName.toLowerCase().includes(searchLower) ||
      businessName.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower) ||
      phone.includes(searchTerm);

    const matchesStatus =
      statusFilter === 'all' ||
      h.provider.verification_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI calculations
  const totalHosts = hosts.length;
  const verifiedHosts = hosts.filter(h => h.provider.verification_status === 'approved').length;
  const pendingHosts = hosts.filter(h => h.provider.verification_status === 'submitted').length;
  const totalHostEarnings = hosts.reduce((sum, h) => sum + h.totalEarnings, 0);
  const totalUnpaidEscrow = hosts.reduce((sum, h) => sum + h.unpaidBalance, 0);

  // KYC Verification Handler
  const handleUpdateKYC = async (host: HostData, nextStatus: 'approved' | 'suspended') => {
    const confirmMsg =
      nextStatus === 'approved'
        ? `Approve host KYC for "${host.provider.business_name || host.profile.full_name}"?`
        : `Suspend host "${host.provider.business_name || host.profile.full_name}"? All their spaces will be paused from public search.`;

    if (!confirm(confirmMsg)) return;

    setActionLoadingId(host.provider.id);
    setFeedback(null);

    const res = await updateHostKYCAction({
      hostId: host.provider.id,
      status: nextStatus,
      reason: nextStatus === 'approved' ? 'Administrator KYC approval' : 'Administrative host suspension',
    });

    setActionLoadingId(null);

    if (res.error) {
      setFeedback({ type: 'error', message: res.error });
    } else {
      setHosts(prev =>
        prev.map(h =>
          h.provider.id === host.provider.id
            ? { ...h, provider: { ...h.provider, verification_status: nextStatus } }
            : h
        )
      );
      if (selectedHost?.provider.id === host.provider.id) {
        setSelectedHost(prev =>
          prev ? { ...prev, provider: { ...prev.provider, verification_status: nextStatus } } : null
        );
      }
      setFeedback({
        type: 'success',
        message: `Host ${host.provider.business_name || host.profile.full_name} status updated to ${nextStatus}.`,
      });
    }
  };

  // Commission Override Handler
  const handleSaveCommission = async () => {
    if (!commissionModalHost) return;

    const rateFraction = customCommission / 100;
    setActionLoadingId(commissionModalHost.provider.id);
    setFeedback(null);

    const res = await overrideHostCommissionAction({
      hostId: commissionModalHost.provider.id,
      customRate: rateFraction,
    });

    setActionLoadingId(null);

    if (res.error) {
      setFeedback({ type: 'error', message: res.error });
    } else {
      setHosts(prev =>
        prev.map(h =>
          h.provider.id === commissionModalHost.provider.id
            ? { ...h, provider: { ...h.provider, commission_rate: rateFraction } }
            : h
        )
      );
      setFeedback({
        type: 'success',
        message: `Commission rate updated to ${customCommission}% for ${commissionModalHost.provider.business_name || commissionModalHost.profile.full_name}.`,
      });
      setCommissionModalHost(null);
    }
  };

  // Disburse Payout Handler
  const handleDisbursePayout = async () => {
    if (!payoutHost || payoutAmount <= 0) return;

    setActionLoadingId(payoutHost.provider.id);
    setFeedback(null);

    const res = await disburseHostPayoutAction({
      hostId: payoutHost.provider.id,
      amount: payoutAmount,
      paymentMethod: payoutMethod,
    });

    setActionLoadingId(null);

    if (res.error) {
      setFeedback({ type: 'error', message: res.error });
    } else {
      setHosts(prev =>
        prev.map(h =>
          h.provider.id === payoutHost.provider.id
            ? { ...h, unpaidBalance: Math.max(0, h.unpaidBalance - payoutAmount) }
            : h
        )
      );
      setFeedback({
        type: 'success',
        message: `Payout of ₹${payoutAmount.toFixed(2)} processed via ${payoutMethod} (Ref: ${res.reference}).`,
      });
      setPayoutHost(null);
    }
  };

  // Toggle single space active state
  const handleToggleSpace = async (spaceId: string) => {
    setActionLoadingId(spaceId);
    const res = await toggleSpaceActiveAction(spaceId);
    setActionLoadingId(null);

    if (res.success) {
      setHosts(prev =>
        prev.map(h => ({
          ...h,
          spaces: h.spaces.map(s => (s.id === spaceId ? { ...s, is_active: res.is_active } : s)),
        }))
      );
      if (selectedHost) {
        setSelectedHost(prev =>
          prev
            ? {
                ...prev,
                spaces: prev.spaces.map(s => (s.id === spaceId ? { ...s, is_active: res.is_active } : s)),
              }
            : null
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Parking Space Owners & Commercial Providers
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              {totalHosts} Hosts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Oversee residential hosts, commercial operators, KYC compliance, settlement bank accounts, and payouts.
          </p>
        </div>
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

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Hosts</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{totalHosts}</p>
          <p className="text-[10px] text-slate-500">Registered parking suppliers</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Verified / Live</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">{verifiedHosts}</p>
          <p className="text-[10px] text-slate-500">KYC approved suppliers</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Pending Review</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400">{pendingHosts}</p>
          <p className="text-[10px] text-slate-500">Awaiting verification</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Host Earnings</span>
            <IndianRupee className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-extrabold text-white">₹{totalHostEarnings.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-500">Disbursed & accumulated</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Unpaid Escrow</span>
            <CreditCard className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-purple-400">₹{totalUnpaidEscrow.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-500">Pending host withdrawal</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by host name, business/society name, phone, or email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({totalHosts})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'approved' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Approved ({verifiedHosts})
            </button>
            <button
              onClick={() => setStatusFilter('submitted')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'submitted' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending ({pendingHosts})
            </button>
          </div>
        </div>
      </div>

      {/* Hosts Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Host / Entity</th>
                <th className="py-3.5 px-4">Provider Type</th>
                <th className="py-3.5 px-4 text-center">KYC Status</th>
                <th className="py-3.5 px-4 text-center">Spaces</th>
                <th className="py-3.5 px-4 text-right">Commission Rate</th>
                <th className="py-3.5 px-4 text-right">Unpaid Balance</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredHosts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Building className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-400">No parking providers match your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredHosts.map(host => {
                  const isApproved = host.provider.verification_status === 'approved';
                  const isSubmitted = host.provider.verification_status === 'submitted';
                  const isSuspended = host.provider.verification_status === 'suspended';
                  const isLoading = actionLoadingId === host.provider.id;
                  const commissionPercent = ((host.provider.commission_rate || 0.15) * 100).toFixed(0);

                  return (
                    <tr key={host.provider.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Host & Entity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {host.profile.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {host.provider.business_name || host.profile.full_name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Contact: {host.profile.full_name} • {host.profile.phone || host.profile.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Provider Type */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 capitalize">
                          {host.provider.provider_type?.replace('_', ' ') || 'Residential'}
                        </span>
                        {host.provider.gstin && (
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">GST: {host.provider.gstin}</p>
                        )}
                      </td>

                      {/* KYC Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        ) : isSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Pending Review</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Suspended</span>
                          </span>
                        )}
                      </td>

                      {/* Spaces */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedHost(host)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition-colors"
                        >
                          <Car className="w-3 h-3 text-emerald-400" />
                          <span>{host.spacesCount}</span>
                          <span className="text-[10px] text-emerald-400">({host.activeSpacesCount} Live)</span>
                        </button>
                      </td>

                      {/* Commission Rate */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setCommissionModalHost(host);
                            setCustomCommission(Number(commissionPercent));
                          }}
                          className="font-mono font-semibold text-slate-200 hover:text-accent transition-colors inline-flex items-center gap-1"
                        >
                          <span>{commissionPercent}%</span>
                          <Percent className="w-2.5 h-2.5 opacity-60" />
                        </button>
                      </td>

                      {/* Unpaid Balance */}
                      <td className="py-3.5 px-4 text-right">
                        <div>
                          <p className={`font-mono font-bold ${host.unpaidBalance > 0 ? 'text-purple-300' : 'text-slate-400'}`}>
                            ₹{host.unpaidBalance.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-slate-500">Gross: ₹{host.totalEarnings.toFixed(0)}</p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Payout Button */}
                          <button
                            onClick={() => {
                              setPayoutHost(host);
                              setPayoutAmount(host.unpaidBalance);
                            }}
                            disabled={host.unpaidBalance <= 0}
                            title="Disburse Payout"
                            className="p-1.5 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 text-[11px] font-semibold transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* Inspect Spaces */}
                          <button
                            onClick={() => setSelectedHost(host)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors"
                          >
                            Spaces
                          </button>

                          {/* KYC Toggle */}
                          {isSubmitted ? (
                            <button
                              onClick={() => handleUpdateKYC(host, 'approved')}
                              disabled={isLoading}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors"
                            >
                              Approve KYC
                            </button>
                          ) : isApproved ? (
                            <button
                              onClick={() => handleUpdateKYC(host, 'suspended')}
                              disabled={isLoading}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition-colors"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateKYC(host, 'approved')}
                              disabled={isLoading}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-colors"
                            >
                              Re-Verify
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Host Spaces Inspection Modal */}
      {selectedHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedHost.provider.business_name || selectedHost.profile.full_name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Bank: {selectedHost.provider.bank_account_holder} • IFSC: {selectedHost.provider.bank_ifsc_code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHost(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Financial & Settlement Details */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                    Settlement Bank & UPI Details
                  </span>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    Escrow: ₹{selectedHost.unpaidBalance.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Beneficiary Name</span>
                    <span className="font-semibold">{selectedHost.provider.bank_account_holder || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Bank Account No.</span>
                    <span className="font-mono">{selectedHost.provider.bank_account_number ? `••••${selectedHost.provider.bank_account_number.slice(-4)}` : 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">IFSC Code</span>
                    <span className="font-mono">{selectedHost.provider.bank_ifsc_code || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">UPI VPA</span>
                    <span className="font-mono text-emerald-400">{selectedHost.provider.upi_id || 'Not configured'}</span>
                  </div>
                </div>
              </div>

              {/* Spaces List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  Registered Parking Slots ({selectedHost.spaces.length})
                </h4>

                {selectedHost.spaces.length === 0 ? (
                  <p className="text-slate-500 italic">No spaces registered under this host yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedHost.spaces.map(s => (
                      <div
                        key={s.id}
                        className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{s.title}</span>
                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              s.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {s.is_active ? 'Publicly Live' : 'Paused'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{s.property?.area || 'Ahmedabad'} • Slot: {s.identifier}</span>
                          </p>
                          <p className="font-mono font-semibold text-emerald-400 text-xs">
                            ₹{s.hourly_rate}/hr {s.daily_rate ? `• ₹${s.daily_rate}/day` : ''}
                          </p>
                        </div>

                        <button
                          onClick={() => handleToggleSpace(s.id)}
                          disabled={actionLoadingId === s.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            s.is_active
                              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30'
                              : 'bg-emerald-600 text-white hover:bg-emerald-500'
                          }`}
                        >
                          {s.is_active ? 'Pause Listing' : 'Publish Live'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedHost(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Payout Modal */}
      {payoutHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Disburse Host Earnings</h3>
              </div>
              <button onClick={() => setPayoutHost(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400">
              Transfer verified booking earnings to <span className="text-white font-semibold">{payoutHost.provider.business_name || payoutHost.profile.full_name}</span>.
            </p>

            {/* Beneficiary Settlement Account Info */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                Disbursement Account Destination
              </span>
              {payoutHost.provider.bank_account_number || payoutHost.provider.upi_id ? (
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Beneficiary:</span>
                    <span className="font-semibold text-white">
                      {payoutHost.provider.bank_account_holder || payoutHost.profile.full_name}
                    </span>
                  </div>
                  {payoutHost.provider.bank_name && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank:</span>
                      <span className="font-mono">{payoutHost.provider.bank_name}</span>
                    </div>
                  )}
                  {payoutHost.provider.bank_account_number && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">A/C Number:</span>
                      <span className="font-mono font-bold text-white">
                        {payoutHost.provider.bank_account_number}
                      </span>
                    </div>
                  )}
                  {payoutHost.provider.bank_ifsc_code && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">IFSC Code:</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {payoutHost.provider.bank_ifsc_code}
                      </span>
                    </div>
                  )}
                  {payoutHost.provider.upi_id && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">UPI ID:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {payoutHost.provider.upi_id}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-slate-900 text-[10px]">
                    <span className="text-slate-500">Preferred Method:</span>
                    <span className="font-semibold text-purple-400 uppercase">
                      {payoutHost.provider.payout_preference || 'bank_transfer'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Host has not entered bank or UPI details yet.</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Available Unpaid Balance</span>
              <p className="text-2xl font-mono font-extrabold text-emerald-400">
                ₹{payoutHost.unpaidBalance.toFixed(2)}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Disbursement Amount (₹)</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(Math.max(0, Math.min(payoutHost.unpaidBalance, Number(e.target.value))))}
                  max={payoutHost.unpaidBalance}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Transfer Route / Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['NEFT', 'IMPS', 'UPI'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayoutMethod(method)}
                      className={`py-2 rounded-lg font-semibold text-center border transition-colors ${
                        payoutMethod === method
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setPayoutHost(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDisbursePayout}
                disabled={payoutAmount <= 0 || actionLoadingId === payoutHost.provider.id}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/25 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Disburse ₹{payoutAmount.toFixed(0)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Override Modal */}
      {commissionModalHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-accent" />
                <h3 className="text-base font-bold text-white">Override Commission</h3>
              </div>
              <button onClick={() => setCommissionModalHost(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400">
              Set custom platform fee rate for <span className="text-white font-semibold">{commissionModalHost.provider.business_name || commissionModalHost.profile.full_name}</span>. Standard rate is 15%.
            </p>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Commission Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min={5}
                  max={30}
                  step={0.5}
                  value={customCommission}
                  onChange={e => setCustomCommission(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-accent"
                />
                <span className="absolute right-3 top-2.5 text-slate-500 font-mono">%</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setCommissionModalHost(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCommission}
                disabled={actionLoadingId === commissionModalHost.provider.id}
                className="px-4 py-2 rounded-xl bg-accent text-slate-950 font-bold hover:bg-amber-400 transition-colors"
              >
                Apply Custom Rate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

