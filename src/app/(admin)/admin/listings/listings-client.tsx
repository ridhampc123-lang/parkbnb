'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toggleSpaceActiveAction, updateSpacePricingAction } from '@/server/actions/admin-actions';
import {
  Car,
  Search,
  MapPin,
  Zap,
  ExternalLink,
  Power,
  ShieldCheck,
  AlertTriangle,
  IndianRupee,
  Edit3,
  X,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { ParkingSpace } from '@/types/database';

export function ListingsClient({ initialSpaces }: { initialSpaces: ParkingSpace[] }) {
  const [spaces, setSpaces] = useState<ParkingSpace[]>(initialSpaces);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editPriceSpace, setEditPriceSpace] = useState<ParkingSpace | null>(null);
  const [hourlyRateInput, setHourlyRateInput] = useState<number>(40);
  const [dailyRateInput, setDailyRateInput] = useState<number>(300);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleToggleActive(id: string) {
    const result = await toggleSpaceActiveAction(id);
    if (result.success) {
      setSpaces(prev => prev.map(s => s.id === id ? { ...s, is_active: result.is_active } : s));
    } else {
      alert(result.error || 'Action failed');
    }
  }

  async function handleSavePrice() {
    if (!editPriceSpace) return;
    setIsUpdating(true);
    setFeedback(null);

    const res = await updateSpacePricingAction({
      spaceId: editPriceSpace.id,
      hourlyRate: hourlyRateInput,
      dailyRate: dailyRateInput,
    });

    setIsUpdating(false);

    if (res.success) {
      setSpaces(prev =>
        prev.map(s =>
          s.id === editPriceSpace.id
            ? { ...s, hourly_rate: hourlyRateInput, daily_rate: dailyRateInput }
            : s
        )
      );
      setFeedback(`Price updated for ${editPriceSpace.title}.`);
      setEditPriceSpace(null);
    } else {
      alert(res.error || 'Failed to update pricing');
    }
  }

  const filtered = spaces.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchArea = s.property?.area?.toLowerCase().includes(q);
      const matchId = s.identifier.toLowerCase().includes(q);
      if (!matchTitle && !matchArea && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
            Live Inventory Management
          </span>
          <h1 className="text-2xl font-black text-white mt-1">All Parking Spaces in Ahmedabad</h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor public bookability, adjust pricing rates dynamically, and suspend non-compliant spaces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
            {spaces.filter(s => s.is_active && s.status === 'approved').length} Active in Ahmedabad
          </span>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by spot title, area (e.g. Prahlad Nagar, SBR), or identifier..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({spaces.length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'approved' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Approved ({spaces.filter(s => s.status === 'approved').length})
            </button>
            <button
              onClick={() => setStatusFilter('submitted')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'submitted' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending ({spaces.filter(s => s.status === 'submitted').length})
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((space) => {
          const isSuspended = !space.is_active;

          return (
            <div
              key={space.id}
              className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between ${
                isSuspended ? 'border-rose-950/60 bg-slate-900/40 opacity-75' : 'border-slate-800'
              }`}
            >
              <div className="space-y-3">
                {/* Status & Identifier Header */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-bold">
                    {space.identifier}
                  </span>

                  <div className="flex items-center gap-2">
                    {space.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" />
                        {space.status}
                      </span>
                    )}

                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      space.is_active
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {space.is_active ? 'Live' : 'Suspended'}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{space.title}</h3>
                  <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{space.property?.area || 'Ahmedabad'}</span>
                  </div>
                </div>

                {/* Pricing & EV details */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Pricing Rates</span>
                    <span className="font-mono font-bold text-white text-sm">₹{space.hourly_rate}</span>
                    <span className="text-slate-400 text-[10px]">/hr</span>
                    {space.daily_rate && (
                      <span className="text-slate-400 text-[10px] ml-1.5 font-mono">
                        (₹{space.daily_rate}/day)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {space.has_ev_charging && (
                      <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Level 2 EV Charging">
                        <Zap className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setEditPriceSpace(space);
                        setHourlyRateInput(space.hourly_rate);
                        setDailyRateInput(space.daily_rate || 300);
                      }}
                      title="Edit Pricing"
                      className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <Link
                  href={`/parking/${space.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Public View</span>
                </Link>

                <button
                  type="button"
                  onClick={() => handleToggleActive(space.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                    space.is_active
                      ? 'border-rose-500/30 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20'
                      : 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{space.is_active ? 'Suspend Listing' : 'Activate Live'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Pricing Modal */}
      {editPriceSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-accent" />
                <h3 className="text-base font-bold text-white">Adjust Listing Rates</h3>
              </div>
              <button onClick={() => setEditPriceSpace(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400">
              Update pricing for <span className="text-white font-semibold">{editPriceSpace.title}</span>. Changes take effect immediately in marketplace search.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hourly Base Rate (₹)</label>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={hourlyRateInput}
                  onChange={e => setHourlyRateInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Daily Cap Rate (₹)</label>
                <input
                  type="number"
                  min={50}
                  max={5000}
                  value={dailyRateInput}
                  onChange={e => setDailyRateInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setEditPriceSpace(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrice}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors"
              >
                {isUpdating ? 'Saving...' : 'Save & Publish Rates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

