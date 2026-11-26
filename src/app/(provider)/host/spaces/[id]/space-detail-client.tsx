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
  ArrowLeft,
  Navigation,
  Camera,
  Upload,
  Loader2,
  Star,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { ParkingSpace, AvailabilityBlock, ParkingSpacePhoto } from '@/types/database';
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
  const [landmark, setLandmark] = useState(space.landmark || space.property?.landmark || '');
  const [googleMapsLink, setGoogleMapsLink] = useState(space.google_maps_link || space.property?.google_maps_link || '');
  const [hourlyRate, setHourlyRate] = useState(String(space.hourly_rate));
  const [dailyRate, setDailyRate] = useState(space.daily_rate ? String(space.daily_rate) : '');
  const [monthlyRate, setMonthlyRate] = useState(space.monthly_rate ? String(space.monthly_rate) : '');
  const [accessInstructions, setAccessInstructions] = useState(space.access_instructions || '');
  const [hasEvCharging, setHasEvCharging] = useState(space.has_ev_charging);
  const [heightLimit, setHeightLimit] = useState(space.height_limit_meters ? String(space.height_limit_meters) : '');
  const [parkingType, setParkingType] = useState(space.parking_type);

  // Photos state
  const [photos, setPhotos] = useState<ParkingSpacePhoto[]>(space.photos || []);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsUploadingPhoto(true);
    setUploadError(null);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to upload photo.');
        }
        if (data.url) {
          setPhotos(prev => [
            ...prev,
            {
              id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              space_id: space.id,
              storage_path: data.url,
              is_primary: prev.length === 0,
              display_order: prev.length,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed.');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (filtered.length > 0 && !filtered.some(p => p.is_primary)) {
        filtered[0].is_primary = true;
      }
      return filtered;
    });
  };

  const handleSetPrimaryPhoto = (id: string) => {
    setPhotos(prev =>
      prev.map(p => ({
        ...p,
        is_primary: p.id === id,
      }))
    );
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMsg(null);

    const formData = new FormData();
    formData.append('space_id', space.id);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('landmark', landmark);
    formData.append('google_maps_link', googleMapsLink);
    formData.append('photos_json', JSON.stringify(photos));
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

            {/* Landmark & Google Maps Link Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-amber-500/10 rounded-control border border-amber-500/30 space-y-1.5">
                <label className="block text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nearby Landmark / Visual Location Cue</span>
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite Rajpath Club, Behind Iscon Mega Mall"
                  className="w-full px-3 py-2 rounded-control border border-amber-300 bg-surface text-foreground text-xs font-semibold focus:ring-2 focus:ring-amber-500/20"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Highlighted on driver booking passes for effortless arrival.
                </span>
              </div>

              <div className="p-3.5 bg-blue-50/50 rounded-control border border-blue-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    <span>Google Maps Link</span>
                  </label>
                  {googleMapsLink && (
                    <a
                      href={googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>Test Pin</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={googleMapsLink}
                  onChange={(e) => setGoogleMapsLink(e.target.value)}
                  placeholder="e.g. https://maps.app.goo.gl/... or https://goo.gl/maps/..."
                  className="w-full px-3 py-2 rounded-control border border-border bg-surface text-foreground text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Enables 1-tap navigation inside Google Maps for drivers.
                </span>
              </div>
            </div>

            {/* Parking Photos Gallery & Upload */}
            <div className="p-4 bg-surface-muted rounded-control border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-primary" />
                    <span>Parking Spot Photos ({photos.length})</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Upload real photos of your gate, driveway, and parking bay.
                  </span>
                </div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-bold cursor-pointer transition-colors shadow-xs">
                  {isUploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Photos'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={isUploadingPhoto}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {uploadError && (
                <div className="text-xs text-danger font-semibold">{uploadError}</div>
              )}

              {photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {photos.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className={`relative rounded-control overflow-hidden border-2 bg-surface shadow-xs ${
                        p.is_primary ? 'border-primary' : 'border-border'
                      }`}
                    >
                      <img src={p.storage_path} alt="Parking slot" className="w-full h-24 object-cover" />
                      {p.is_primary ? (
                        <span className="absolute top-1 left-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                          Cover
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryPhoto(p.id)}
                          className="absolute top-1 left-1 bg-black/70 hover:bg-primary text-white text-[9px] font-semibold px-1.5 py-0.5 rounded shadow"
                        >
                          Make Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(p.id)}
                        className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-full shadow"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-surface rounded-control text-center text-xs text-muted-foreground border border-dashed border-border">
                  No photos uploaded yet. Upload at least one photo so drivers can identify your spot.
                </div>
              )}
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
