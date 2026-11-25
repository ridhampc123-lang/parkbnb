'use client';

import { useState } from 'react';
import { PlatformSettings } from '@/types/database';
import {
  updatePlatformSettingsAction,
  addListingTitleOptionAction,
  updateListingTitleOptionAction,
  removeListingTitleOptionAction
} from '@/server/actions/admin-actions';
import {
  Sliders,
  Percent,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Save,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  ListFilter,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Loader2,
  Car
} from 'lucide-react';

export function SettingsClient({ initialSettings }: { initialSettings: PlatformSettings }) {
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);
  const [commissionPercent, setCommissionPercent] = useState<number>(settings.platformCommissionRate * 100);
  const [gstPercent, setGstPercent] = useState<number>(settings.gstRate * 100);
  const [holdMinutes, setHoldMinutes] = useState<number>(settings.temporaryHoldMinutes);
  const [cancellationHours, setCancellationHours] = useState<number>(settings.cancellationWindowHours);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(settings.emergencyMaintenanceMode);
  const [hotline, setHotline] = useState<string>(settings.supportHotline);
  const [email, setEmail] = useState<string>(settings.supportEmail);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Listing Titles Dropdown Management State
  const [listingTitles, setListingTitles] = useState<string[]>(
    settings.listingTitleOptions && settings.listingTitleOptions.length > 0
      ? settings.listingTitleOptions
      : [
          'Covered Basement Parking Bay',
          'Prime Surface Parking Slot with Security',
          'Residential Gated Stilt Parking',
          'Covered Parking Bay with EV Charging Socket',
          'Commercial Multi-Level Parking Slot',
          'Secure Overnight Parking Bay',
          'Private Driveway Parking Space',
          'Open-Air Visitor Parking Bay',
        ]
  );
  const [newTitleInput, setNewTitleInput] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [titleLoading, setTitleLoading] = useState(false);
  const [titleMessage, setTitleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const res = await updatePlatformSettingsAction({
      platformCommissionRate: commissionPercent / 100,
      gstRate: gstPercent / 100,
      temporaryHoldMinutes: holdMinutes,
      cancellationWindowHours: cancellationHours,
      emergencyMaintenanceMode: maintenanceMode,
      supportHotline: hotline,
      supportEmail: email,
    });

    setIsSaving(false);

    if (res.success && res.settings) {
      setSettings(res.settings);
      setFeedback('Platform settings saved and applied across all modules.');
    } else {
      alert('Failed to save settings.');
    }
  };

  // Add a new listing title option
  const handleAddTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitleInput.trim();
    if (!trimmed) return;

    setTitleLoading(true);
    setTitleMessage(null);

    const res = await addListingTitleOptionAction(trimmed);
    setTitleLoading(false);

    if (res.error) {
      setTitleMessage({ type: 'error', text: res.error });
    } else if (res.options) {
      setListingTitles(res.options);
      setNewTitleInput('');
      setTitleMessage({
        type: 'success',
        text: `Successfully added "${trimmed}" to parking registration dropdown!`,
      });
    }
  };

  // Start editing a title
  const startEditing = (idx: number, title: string) => {
    setEditingIndex(idx);
    setEditTitleValue(title);
    setTitleMessage(null);
  };

  // Save edited title
  const handleSaveEdit = async (oldTitle: string) => {
    const trimmed = editTitleValue.trim();
    if (!trimmed || trimmed === oldTitle) {
      setEditingIndex(null);
      return;
    }

    setTitleLoading(true);
    setTitleMessage(null);

    const res = await updateListingTitleOptionAction(oldTitle, trimmed);
    setTitleLoading(false);

    if (res.error) {
      setTitleMessage({ type: 'error', text: res.error });
    } else if (res.options) {
      setListingTitles(res.options);
      setEditingIndex(null);
      setEditTitleValue('');
      setTitleMessage({
        type: 'success',
        text: `Updated title option from "${oldTitle}" to "${trimmed}".`,
      });
    }
  };

  // Remove a listing title option
  const handleRemoveTitle = async (title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the registration dropdown?`)) {
      return;
    }

    setTitleLoading(true);
    setTitleMessage(null);

    const res = await removeListingTitleOptionAction(title);
    setTitleLoading(false);

    if (res.error) {
      setTitleMessage({ type: 'error', text: res.error });
    } else if (res.options) {
      setListingTitles(res.options);
      setTitleMessage({
        type: 'success',
        text: `Removed "${title}" from the parking registration dropdown.`,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
          Platform Governance
        </span>
        <h1 className="text-2xl font-black text-white mt-1">Platform Operations & Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure financial commission percentages, atomic hold timers, emergency circuit breakers, and Ahmedabad operations.
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* SECTION: Centrally Managed Listing Title Dropdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ListFilter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Parking Registration Listing Titles Dropdown</h2>
              <p className="text-[11px] text-slate-400">
                Manage all predefined titles hosts can select when listing a parking space across the platform.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-mono font-bold rounded-lg">
            {listingTitles.length} Options Active
          </span>
        </div>

        {titleMessage && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              titleMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {titleMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{titleMessage.text}</span>
          </div>
        )}

        {/* Add New Title Input */}
        <form onSubmit={handleAddTitle} className="flex gap-2">
          <input
            type="text"
            value={newTitleInput}
            onChange={(e) => setNewTitleInput(e.target.value)}
            placeholder="Type a new listing title option (e.g. Dedicated EV Stilt Slot with CCTV)..."
            className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={titleLoading || !newTitleInput.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition-colors"
          >
            {titleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Add to Dropdown</span>
          </button>
        </form>

        {/* Current Titles List */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
            Current Dropdown Choices in Space Registration:
          </span>

          <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            {listingTitles.map((title, idx) => (
              <div
                key={title}
                className="p-3 flex items-center justify-between text-xs hover:bg-slate-900/50 transition-colors"
              >
                {editingIndex === idx ? (
                  <div className="flex-1 flex items-center gap-2 mr-3">
                    <input
                      type="text"
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-cyan-500 rounded-lg text-white text-xs font-semibold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(title)}
                      disabled={titleLoading || !editTitleValue.trim()}
                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                      title="Save Changes"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingIndex(null)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-200">{title}</span>
                  </div>
                )}

                {editingIndex !== idx && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEditing(idx, title)}
                      disabled={titleLoading}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 text-[11px] font-semibold transition-colors flex items-center gap-1"
                      title="Edit / Change Title"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span className="text-[10px]">Change</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveTitle(title)}
                      disabled={titleLoading || listingTitles.length <= 1}
                      className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-900/40 hover:bg-rose-900/60 text-rose-300 text-[11px] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      title="Remove from Dropdown"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Financial & Tax Policies */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Percent className="w-5 h-5 text-accent" />
            <div>
              <h2 className="text-sm font-bold text-white">Financial & Commission Rules</h2>
              <p className="text-[11px] text-slate-400">Convenience fee percentages and Indian GST compliance rules.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Standard Platform Convenience Fee (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={5}
                  max={30}
                  step={0.5}
                  value={commissionPercent}
                  onChange={e => setCommissionPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute right-3 top-2 text-slate-500 font-mono font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Applied to customer base rate (default 15.0%).</p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                GST on Platform Service Fee (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={28}
                  step={1}
                  value={gstPercent}
                  onChange={e => setGstPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute right-3 top-2 text-slate-500 font-mono font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Statutory GST on platform service charges (default 18.0%).</p>
            </div>
          </div>
        </div>

        {/* Section 2: Concurrency & Booking Timers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Clock className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Booking Concurrency & Holds</h2>
              <p className="text-[11px] text-slate-400">Lock duration to prevent double-bookings during checkout.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Temporary Hold Duration (Minutes)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={holdMinutes}
                  onChange={e => setHoldMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute right-3 top-2 text-slate-500 font-mono">min</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Time allowed for driver payment capture before auto-release.</p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Free Cancellation Grace Window (Hours)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={cancellationHours}
                  onChange={e => setCancellationHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute right-3 top-2 text-slate-500 font-mono">hrs</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Hours before start time for 100% full customer refund.</p>
            </div>
          </div>
        </div>

        {/* Section 3: Emergency Circuit Breaker */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Emergency Controls & Maintenance</h2>
              <p className="text-[11px] text-slate-400">Emergency switch to temporarily pause all new reservations.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-white">Platform Maintenance Mode</span>
              <p className="text-[11px] text-slate-400">
                When enabled, search and checkout are paused across Ahmedabad with a maintenance notice.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMaintenanceMode(prev => !prev)}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-colors ${
                maintenanceMode
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {maintenanceMode ? 'ENABLED (PAUSED)' : 'DISABLED (NORMAL)'}
            </button>
          </div>
        </div>

        {/* Section 4: Operational Dispatch & Support Contacts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Phone className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Escalation & Support Contacts</h2>
              <p className="text-[11px] text-slate-400">Emergency lines displayed on gate passes and clearance tickets.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Support Hotline</label>
              <div className="relative">
                <input
                  type="text"
                  value={hotline}
                  onChange={e => setHotline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Ops Dispatch Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Active Ahmedabad Operating Zones */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <MapPin className="w-5 h-5 text-accent" />
            <div>
              <h2 className="text-sm font-bold text-white">Active Ahmedabad Pilot Zones</h2>
              <p className="text-[11px] text-slate-400">Geographic bounding clusters enabled for peer-to-peer parking.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {settings.activeZones.map(zone => (
              <span
                key={zone}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-medium flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{zone}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/25 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Applying Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
