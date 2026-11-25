'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  DollarSign,
  Shield,
  Zap,
  Car,
  Calendar,
  Eye,
  Trash2,
  Pause,
  Play,
  Save,
  Check,
  ArrowLeft
} from 'lucide-react';
import { ParkingSpace, AvailabilityBlock } from '@/types/database';
import { updateHostSpaceFullAction } from '@/server/actions/host-actions';
import {
  hostToggleSpaceStatusAction,
  hostDeleteSpaceAction
} from '@/server/actions/space-actions';

interface HostSpaceDetailClientProps {
  space: ParkingSpace;
  allBookingsCount: number;
  activeBookingsCount: number;
  blocks: AvailabilityBlock[];
}

export function HostSpaceDetailClient({
  space,
  allBookingsCount,
  activeBookingsCount,
  blocks,
}: HostSpaceDetailClientProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(space.is_active);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Edit form states
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [title, setTitle] = useState(space.title);
  const [description, setDescription] = useState(space.description || '');
  const [hourlyRate, setHourlyRate] = useState(String(space.hourly_rate));
  const [dailyRate, setDailyRate] = useState(space.daily_rate ? String(space.daily_rate) : '');
  const [monthlyRate, setMonthlyRate] = useState(space.monthly_rate ? String(space.monthly_rate) : '');
  const [accessInstructions, setAccessInstructions] = useState(space.access_instructions || '');
  const [hasEvCharging, setHasEvCharging] = useState(space.has_ev_charging);
  const [heightLimit, setHeightLimit] = useState(space.height_limit_meters ? String(space.height_limit_meters) : '');
  const [parkingType, setParkingType] = useState(space.parking_type);

  const handleToggleActive = async () => {
    setIsTogglingStatus(true);
    try {
      const res = await hostToggleSpaceStatusAction(space.id, !isActive);
      if (res.success) {
        setIsActive(!isActive);
      }
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMsg(null);

    const formData = new FormData();
    formData.append('space_id', space.id);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('hourly_rate', hourlyRate);
    formData.append('daily_rate', dailyRate);
    formData.append('monthly_rate', monthlyRate);
    formData.append('access_instructions', accessInstructions);
    formData.append('height_limit_meters', heightLimit);
    formData.append('has_ev_charging', String(hasEvCharging));
    formData.append('parking_type', parkingType);

    try {
      const res = await updateHostSpaceFullAction(formData);
      if (res.error) {
        setSaveMsg({ type: 'error', text: res.error });
      } else {
        setSaveMsg({ type: 'success', text: 'Space listing details updated successfully.' });
      }
    } catch {
      setSaveMsg({ type: 'error', text: 'Failed to update space details.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this parking space listing? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await hostDeleteSpaceAction(space.id);
      if (res.error) {
        setDeleteError(res.error);
      } else {
        router.push('/host/spaces');
      }
    } catch {
      setDeleteError('An unexpected error occurred while deleting the space.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/host/spaces"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Listed Spaces</span>
        </Link>

        <div className="flex items-center gap-2">
          {space.status === 'approved' && (
            <Link
              href={`/parking/${space.id}`}
              target="_blank"
              className="px-3 py-1.5 border border-border rounded-control text-xs font-semibold hover:bg-surface-muted flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span>Public Driver Preview</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleToggleActive}
            disabled={isTogglingStatus}
            className={`px-3 py-1.5 text-xs font-bold rounded-control transition-colors flex items-center gap-1.5 ${
              isActive
                ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isActive ? 'Pause Bookings' : 'Reactivate Bookings'}</span>
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`p-4 rounded-card border flex items-center justify-between gap-4 ${
          space.status === 'approved'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : space.status === 'submitted'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-red-50 border-red-200 text-red-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {space.status === 'approved' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {space.status === 'submitted' && <Clock className="w-5 h-5 text-amber-600 shrink-0" />}
          {space.status === 'rejected' && <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}

          <div>
            <span className="font-bold text-xs uppercase tracking-wider block">
              Listing Status: {space.status} • {isActive ? 'Open for Bookings' : 'Paused by Host'}
            </span>
            <p className="text-xs mt-0.5">
              {space.status === 'approved' && 'This listing meets verified parking guidelines and is publicly discoverable.'}
              {space.status === 'submitted' && 'Under review by ParkBnB verification team. Changes you save will be reviewed.'}
              {space.status === 'rejected' && 'Listing was rejected. Update details to meet compliance and resubmit.'}
            </p>
          </div>
        </div>

        <Link
          href="/host/calendar"
          className="px-3 py-1.5 bg-white border border-border text-foreground text-xs font-semibold rounded-control shadow-xs shrink-0 flex items-center gap-1.5 hover:bg-surface-muted"
        >
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span>Calendar</span>
        </Link>
      </div>

      {deleteError && (
        <div className="p-3.5 bg-red-50 text-danger border border-red-200 rounded-control text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Grid: Space Specs & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Edit Listing Form */}
        <div className="lg:col-span-2 bg-surface rounded-card p-6 border border-border shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Listing Configuration
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              ID: {space.identifier}
            </span>
          </div>

          {saveMsg && (
            <div
              className={`p-3.5 rounded-control text-xs font-semibold flex items-center gap-2 ${
                saveMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {saveMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
              <span>{saveMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveChanges} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Listing Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Description & Driver Notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-control border border-border bg-surface text-foreground text-xs focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Pricing Section */}
            <div className="p-4 bg-surface-muted rounded-control border border-border space-y-3">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-primary" />
                Hourly & Daily Pricing (INR)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    Hourly Rate (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-control border border-border bg-surface text-foreground text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    Daily Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    placeholder="Optional daily cap"
                    className="w-full px-3 py-2 rounded-control border border-border bg-surface text-foreground text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    Monthly Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(e.target.value)}
                    placeholder="Optional monthly"
                    className="w-full px-3 py-2 rounded-control border border-border bg-surface text-foreground text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Specs & Access Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Parking Type
                </label>
                <select
                  value={parkingType}
                  onChange={(e) => setParkingType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs"
                >
                  <option value="covered">Covered Basement / Stilt</option>
                  <option value="open">Open Surface Parking</option>
                  <option value="multi_level">Multi-Level Podium</option>
                  <option value="basement">Basement Underground</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Max Vehicle Height Limit (Meters)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={heightLimit}
                  onChange={(e) => setHeightLimit(e.target.value)}
                  placeholder="e.g. 2.4"
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 p-3 rounded-control bg-surface-muted border border-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEvCharging}
                  onChange={(e) => setHasEvCharging(e.target.checked)}
                  className="rounded-xs text-primary focus:ring-primary w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-accent" /> EV Charging Available
                  </span>
                  <span className="text-muted-foreground block text-[11px]">
                    Space has an active AC or DC EV charging point available for electric vehicles
                  </span>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Gate Entry & Access Instructions (Revealed ONLY after confirmed payment)
              </label>
              <textarea
                rows={3}
                value={accessInstructions}
                onChange={(e) => setAccessInstructions(e.target.value)}
                placeholder="E.g., Drive into Gate 2, show booking pass to security guard, park in bay B-22..."
                className="w-full p-3 rounded-control border border-border bg-surface text-foreground text-xs focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Space Details'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Metrics & Danger Zone */}
        <div className="space-y-6">
          {/* Space Stats Card */}
          <div className="bg-surface rounded-card p-6 border border-border shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
              Performance & Manifest
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-control bg-surface-muted">
                <span className="text-muted-foreground">Active Sessions</span>
                <span className="font-mono font-bold text-foreground text-sm">{activeBookingsCount}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-control bg-surface-muted">
                <span className="text-muted-foreground">Lifetime Reservations</span>
                <span className="font-mono font-bold text-foreground text-sm">{allBookingsCount}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-control bg-surface-muted">
                <span className="text-muted-foreground">Maintenance Blocks</span>
                <span className="font-mono font-bold text-foreground text-sm">{blocks.length}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/host/calendar"
                className="w-full py-2 border border-border text-xs font-bold text-foreground rounded-control flex items-center justify-center gap-1.5 hover:bg-surface-muted transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Manage Slot Calendar</span>
              </Link>
            </div>
          </div>

          {/* Danger Zone: Delete Space */}
          <div className="bg-surface rounded-card p-6 border border-red-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-danger uppercase tracking-wider flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" />
              <span>Danger Zone</span>
            </h3>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Permanently remove this parking slot from the marketplace. Cannot be deleted if active or confirmed reservations exist.
            </p>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-danger border border-red-200 text-xs font-bold rounded-control transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting Space...' : 'Delete Space Listing'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
