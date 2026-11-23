'use client';

import { useState } from 'react';
import { PlatformSettings } from '@/types/database';
import { updatePlatformSettingsAction } from '@/server/actions/admin-actions';
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
  AlertTriangle
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

