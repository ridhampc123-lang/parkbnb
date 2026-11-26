'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Users,
  Car,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Ban,
  RotateCcw,
  Loader2,
  Fingerprint,
  Info,
  Clock,
  MapPin,
  CreditCard,
  FileText
} from 'lucide-react';
import {
  universalLookupAction,
  adminSuspendOwnerAction,
  adminReactivateOwnerAction,
} from '@/server/actions/admin-actions';
import type { UniversalLookupResult } from '@/lib/store/marketplace-store';
import { detectIdentifierType } from '@/lib/privacy/customer-privacy';

export function UniversalLookupClient() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UniversalLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Suspension modal / form state
  const [isSuspending, setIsSuspending] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Live identifier detection
  const detectedType = query.trim() ? detectIdentifierType(query.trim()) : 'unknown';

  async function handleSearch(searchTerm?: string) {
    const term = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!term) return;

    setLoading(true);
    setError(null);
    setActionFeedback(null);
    setIsSuspending(false);

    try {
      const res = await universalLookupAction(term);
      if (res.error) {
        setError(res.error);
        setResult(null);
      } else if (res.result) {
        setResult(res.result);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to complete forensic lookup.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSuspendOwner(providerId: string) {
    if (!suspensionReason.trim() || suspensionReason.trim().length < 5) {
      alert('Please provide a descriptive reason for suspension (at least 5 characters).');
      return;
    }

    setActionLoading(true);
    setActionFeedback(null);

    const res = await adminSuspendOwnerAction({
      providerId,
      reason: suspensionReason.trim(),
    });

    setActionLoading(false);

    if (res.error) {
      setActionFeedback({ type: 'error', message: res.error });
    } else {
      setActionFeedback({
        type: 'success',
        message: `Owner successfully suspended and ${res.deactivatedSpacesCount ?? 0} fake/unverified parking spaces delisted immediately.`,
      });
      setIsSuspending(false);
      setSuspensionReason('');
      // Refresh current lookup
      handleSearch(query);
    }
  }

  async function handleReactivateOwner(providerId: string) {
    if (!confirm('Reactivate this parking owner and restore their verified listings?')) return;

    setActionLoading(true);
    setActionFeedback(null);

    const res = await adminReactivateOwnerAction({ providerId });
    setActionLoading(false);

    if (res.error) {
      setActionFeedback({ type: 'error', message: res.error });
    } else {
      setActionFeedback({
        type: 'success',
        message: 'Owner profile reactivated and verified spaces restored to public discovery.',
      });
      handleSearch(query);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
            <Fingerprint className="w-4 h-4" />
            <span>Forensic Incident & ID Investigation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Universal Identifier Lookup
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Search any verified entity across the ParkBnB network. Type an Owner ID (<span className="font-mono text-purple-300">PBN-O-</span>), Parking Space ID (<span className="font-mono text-amber-300">PBN-S-</span>), Customer ID (<span className="font-mono text-cyan-300">PBN-C-</span>), Booking Ref (<span className="font-mono text-emerald-300">PKB-</span>), or Vehicle Plate.
          </p>
        </div>
      </div>

      {/* Search Bar & Auto-Detection Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. PBN-O-HST001, PBN-S-AHM001, PBN-C-ADMIN001, or GJ 01 AB 1234..."
              className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            {detectedType !== 'unknown' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800 hidden sm:inline-block">
                Detected: {detectedType}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 min-h-[44px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Investigating...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Investigate ID</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Example Search Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold text-[11px]">Quick Forensic Presets:</span>
          <button
            type="button"
            onClick={() => {
              setQuery('PBN-O-HST001');
              handleSearch('PBN-O-HST001');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-mono text-[11px] border border-slate-700"
          >
            Owner: PBN-O-HST001
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('PBN-O-MUM001');
              handleSearch('PBN-O-MUM001');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-mono text-[11px] border border-slate-700"
          >
            Owner: PBN-O-MUM001
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('PBN-S-AHM001');
              handleSearch('PBN-S-AHM001');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[11px] border border-slate-700"
          >
            Space: PBN-S-AHM001
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('PBN-C-ADMIN001');
              handleSearch('PBN-C-ADMIN001');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[11px] border border-slate-700"
          >
            Customer: PBN-C-ADMIN001
          </button>
        </div>
      </div>

      {/* Action Notification Feedback */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
              : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="font-semibold">{actionFeedback.message}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800/80 text-rose-200 rounded-xl text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Not Found State */}
      {result && !result.found && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <XCircle className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-base font-bold text-white">No Entity Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            No active or archived record matches <span className="font-mono text-purple-300">{result.query}</span>.
            Check that the identifier prefix (<span className="font-mono">PBN-O-</span>, <span className="font-mono">PBN-S-</span>, <span className="font-mono">PBN-C-</span>) is typed accurately.
          </p>
        </div>
      )}

      {/* RESULT 1: OWNER / PROVIDER DOSSIER */}
      {result && result.found && result.ownerData && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            {/* Header / Identity */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-mono">
                    <Building2 className="w-3.5 h-3.5" /> Parking Owner Record
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full font-mono ${
                      result.ownerData.provider.verification_status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : result.ownerData.provider.verification_status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    Verification: {result.ownerData.provider.verification_status}
                  </span>
                  {result.ownerData.profile?.status === 'suspended' && (
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                      Account Suspended
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                  {result.ownerData.provider.business_name || result.ownerData.profile?.full_name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                  <span>Permanent Owner ID: <strong className="text-purple-300">{result.ownerData.provider.owner_public_id}</strong></span>
                  <span>• Internal ID: {result.ownerData.provider.id}</span>
                  <span>• Provider Type: <span className="capitalize">{result.ownerData.provider.provider_type.replace(/_/g, ' ')}</span></span>
                </div>
              </div>

              {/* Enforcement Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {result.ownerData.provider.verification_status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => setIsSuspending(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 min-h-[40px]"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Suspend Owner & Delist Spaces</span>
                  </button>
                )}

                {result.ownerData.provider.verification_status === 'rejected' && (
                  <button
                    type="button"
                    onClick={() => handleReactivateOwner(result.ownerData!.provider.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 min-h-[40px]"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reactivate Owner</span>
                  </button>
                )}
              </div>
            </div>

            {/* Immediate Suspension Inline Form */}
            {isSuspending && (
              <div className="p-5 bg-rose-950/40 border-2 border-rose-600 rounded-xl space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Immediate Enforcement: Delist Fake Parking & Suspend Host</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Executing this action will immediately reject the owner profile, mark their account as suspended, and deactivate all <strong>{result.ownerData.spaces.length}</strong> parking spaces so no drivers can view or book them.
                </p>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-300 block mb-1">
                    Enforcement Reason / Incident Report Summary:
                  </label>
                  <input
                    type="text"
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    placeholder="e.g. Reported by driver as non-existent residential gate; illegal parking space on private premises..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-rose-700/80 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSuspendOwner(result.ownerData!.provider.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow flex items-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                    <span>Confirm Immediate Suspension & Delisting</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSuspending(false);
                      setSuspensionReason('');
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">Total Spaces</span>
                <div className="text-xl font-black text-white">{result.ownerData.spaces.length}</div>
                <span className="text-[10px] text-slate-500">{result.ownerData.spaces.filter(s => s.is_active).length} currently active</span>
              </div>
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">Total Reservations</span>
                <div className="text-xl font-black text-white">{result.ownerData.totalBookings}</div>
                <span className="text-[10px] text-purple-400">Driver bookings</span>
              </div>
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">Net Payouts</span>
                <div className="text-xl font-black text-emerald-400">₹{result.ownerData.totalEarnings.toFixed(2)}</div>
                <span className="text-[10px] text-slate-500">Gross revenue</span>
              </div>
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">Disputes / Incidents</span>
                <div className="text-xl font-black text-rose-400">{result.ownerData.disputesCount}</div>
                <span className="text-[10px] text-slate-500">Support tickets</span>
              </div>
            </div>

            {/* Verification & Financial Dossier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Identity & Verification Records
                </h4>
                <div className="space-y-1.5 text-slate-400">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span>Contact Name:</span>
                    <strong className="text-white">{result.ownerData.profile?.full_name}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span>Registered Email:</span>
                    <strong className="text-white font-mono">{result.ownerData.profile?.email}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span>Registered Phone:</span>
                    <strong className="text-white font-mono">{result.ownerData.profile?.phone}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>GSTIN / Tax ID:</span>
                    <strong className="text-white font-mono">{result.ownerData.provider.gstin || 'N/A (Individual)'}</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Bank Payout & Settlement Details
                </h4>
                <div className="space-y-1.5 text-slate-400">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span>Account Holder:</span>
                    <strong className="text-white">{result.ownerData.provider.bank_account_holder || 'Not Provided'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span>Account Number:</span>
                    <strong className="text-white font-mono">{result.ownerData.provider.bank_account_number ? `•••• •••• ${result.ownerData.provider.bank_account_number.slice(-4)}` : 'N/A'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span>Bank IFSC:</span>
                    <strong className="text-white font-mono">{result.ownerData.provider.bank_ifsc_code || 'N/A'}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>UPI ID:</span>
                    <strong className="text-white font-mono">{result.ownerData.provider.upi_id || 'N/A'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Owned Parking Spaces Inventory */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Car className="w-4 h-4 text-purple-400" />
                <span>Spaces Listed by This Owner ({result.ownerData.spaces.length})</span>
              </h3>

              <div className="space-y-2.5">
                {result.ownerData.spaces.map((space) => (
                  <div
                    key={space.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{space.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {space.space_public_id || space.id}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                        <span>Slot: <strong className="text-purple-300">{space.identifier}</strong></span>
                        <span>• Type: {space.parking_type}</span>
                        <span>• Rates: ₹{space.hourly_rate}/hr (₹{space.daily_rate || space.hourly_rate * 8}/day)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full font-mono ${
                          space.status === 'approved' && space.is_active
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {space.is_active ? space.status : 'Delisted'}
                      </span>
                      <Link
                        href={`/parking/${space.id}`}
                        target="_blank"
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESULT 2: PARKING SPACE DOSSIER */}
      {result && result.found && result.spaceData && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                  <Car className="w-3.5 h-3.5" /> Parking Space Record
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full font-mono ${
                    result.spaceData.space.status === 'approved' && result.spaceData.space.is_active
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {result.spaceData.space.is_active ? result.spaceData.space.status : 'Delisted'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                {result.spaceData.space.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                <span>Space ID: <strong className="text-amber-300">{result.spaceData.space.space_public_id || result.spaceData.space.id}</strong></span>
                <span>• Slot: {result.spaceData.space.identifier}</span>
                <span>• Type: {result.spaceData.space.parking_type}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/parking/${result.spaceData.space.id}`}
                target="_blank"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
              >
                <span>Open Listing</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Linked Owner Banner */}
          <div className="p-4 bg-purple-950/40 border border-purple-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-300 block">Verified Parking Owner / Provider</span>
              <div className="font-bold text-white text-sm mt-0.5">
                {result.spaceData.owner?.business_name || result.spaceData.ownerProfile?.full_name || 'Host Profile'}
              </div>
              <div className="text-slate-400 font-mono mt-0.5">
                Owner ID: <strong className="text-purple-300">{result.spaceData.space.owner_public_id || result.spaceData.owner?.owner_public_id || 'PBN-O-REGISTERED'}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const ownerId = result.spaceData?.space.owner_public_id || result.spaceData?.owner?.owner_public_id || result.spaceData?.owner?.id;
                if (ownerId) {
                  setQuery(ownerId);
                  handleSearch(ownerId);
                }
              }}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shrink-0"
            >
              Inspect Owner Record →
            </button>
          </div>

          {/* Location & Specs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">Premises & Address</span>
              <div className="font-bold text-white font-sans">{result.spaceData.property?.title || 'Registered Property'}</div>
              <div className="text-slate-400 font-sans">
                {result.spaceData.property?.address_line1}, {result.spaceData.property?.area}, {result.spaceData.property?.city} • {result.spaceData.property?.postal_code}
              </div>
              <div className="text-slate-500 text-[11px] pt-1">
                Landmark: {result.spaceData.property?.landmark || 'N/A'}
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">Pricing & Activity</span>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Hourly Rate:</span>
                <strong className="text-emerald-400">₹{result.spaceData.space.hourly_rate}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Daily Rate:</span>
                <strong className="text-white">₹{result.spaceData.space.daily_rate || result.spaceData.space.hourly_rate * 8}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Historical Reservations:</span>
                <strong className="text-purple-300">{result.spaceData.totalBookings} bookings</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESULT 3: CUSTOMER DOSSIER */}
      {result && result.found && result.customerData && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-mono">
                  <Users className="w-3.5 h-3.5" /> Customer Identity Record
                </span>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Status: {result.customerData.profile.status || 'active'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                {result.customerData.profile.full_name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                <span>Customer ID: <strong className="text-cyan-300">{result.customerData.profile.customer_public_id}</strong></span>
                <span>• Role: {result.customerData.profile.role}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block font-sans">Reservations</span>
                <span className="text-lg font-black text-white">{result.customerData.totalBookings}</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block font-sans">Platform Spend</span>
                <span className="text-lg font-black text-emerald-400">₹{result.customerData.totalSpent.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Vehicles Registered */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-cyan-400" />
              <span>Registered Vehicles ({result.customerData.vehicles.length})</span>
            </h3>

            {result.customerData.vehicles.length === 0 ? (
              <p className="text-xs text-slate-500">No permanent vehicles registered to this profile.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.customerData.vehicles.map((v) => (
                  <div key={v.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="font-mono font-bold text-white text-sm">{v.registration_number}</div>
                    <div className="text-slate-400 capitalize">{v.make_model || 'Vehicle'} • {v.vehicle_type.replace(/_/g, ' ')}</div>
                    {v.is_default && <span className="text-[10px] text-cyan-400 font-semibold">Primary Default</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESULT 4: BOOKING RESERVATION DOSSIER */}
      {result && result.found && result.bookingData && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5" /> Booking Reservation Manifest
                </span>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  Status: {result.bookingData.booking.status}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white mt-2 font-mono">
                {result.bookingData.booking.booking_reference}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                <span>Privacy Ref: <strong className="text-emerald-300">{result.bookingData.booking.booking_customer_reference}</strong></span>
                <span>• Space Slot: {result.bookingData.space?.identifier || 'Bay'}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-slate-400 text-xs block">Total Amount</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                ₹{result.bookingData.booking.total_amount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">Linked Host ID</span>
              <div className="font-bold text-purple-300">{result.bookingData.booking.owner_public_id || result.bookingData.owner?.owner_public_id || 'PBN-O-RECORD'}</div>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">Linked Space ID</span>
              <div className="font-bold text-amber-300">{result.bookingData.booking.space_public_id || result.bookingData.space?.space_public_id || 'PBN-S-RECORD'}</div>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">Masked Driver Name</span>
              <div className="font-bold text-white">{result.bookingData.booking.customer_display_name}</div>
            </div>
          </div>
        </div>
      )}

      {/* RESULT 5: VEHICLE REGISTRATION DOSSIER */}
      {result && result.found && result.vehicleData && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-mono">
                <Car className="w-3.5 h-3.5" /> Vehicle Registration Plate
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-2 font-mono">
              {result.vehicleData.plateNumber}
            </h2>
            <div className="text-xs text-slate-400 mt-1">
              Associated with driver profile: <strong className="text-cyan-300 font-mono">{result.vehicleData.customerProfile?.customer_public_id || 'Customer Record'}</strong> ({result.vehicleData.customerProfile?.full_name || 'Driver'})
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs font-mono">
            <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">Reservations Logged Against Plate</span>
            <div className="text-lg font-black text-white">{result.vehicleData.bookingsCount} bookings recorded</div>
          </div>
        </div>
      )}
    </div>
  );
}
