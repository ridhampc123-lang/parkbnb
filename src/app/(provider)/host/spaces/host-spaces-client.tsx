'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ParkingSpace,
  VehicleType
} from '@/types/database';
import {
  hostUpdatePricingAction,
  hostToggleSpaceStatusAction,
  hostDeleteSpaceAction
} from '@/server/actions/space-actions';
import {
  PlusCircle,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  DollarSign,
  Power,
  Trash2,
  Edit3,
  Car,
  Zap,
  Shield,
  Eye,
  Loader2,
  X,
  IndianRupee,
  Building,
  SlidersHorizontal
} from 'lucide-react';

export function HostSpacesClient({ spaces }: { spaces: ParkingSpace[] }) {
  const router = useRouter();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [editingSpace, setEditingSpace] = useState<ParkingSpace | null>(null);
  const [inspectingSpace, setInspectingSpace] = useState<ParkingSpace | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number>(50);
  const [dailyRate, setDailyRate] = useState<string>('');
  const [monthlyRate, setMonthlyRate] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filter Spaces
  const filteredSpaces = spaces.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchId = s.identifier.toLowerCase().includes(q);
      const matchArea = s.property?.area.toLowerCase().includes(q);
      const matchCity = s.property?.city.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchArea && !matchCity) return false;
    }

    if (cityFilter !== 'all') {
      if (s.property?.city?.toLowerCase() !== cityFilter.toLowerCase()) return false;
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'approved' && (s.status !== 'approved' || !s.is_active)) return false;
      if (statusFilter === 'paused' && (s.status !== 'approved' || s.is_active)) return false;
      if (statusFilter === 'submitted' && s.status !== 'submitted') return false;
    }

    return true;
  });

  // Unique cities from host's spaces
  const hostCities = Array.from(new Set(spaces.map((s) => s.property?.city).filter(Boolean)));

  // Open Edit Pricing Modal
  function handleOpenPricing(space: ParkingSpace) {
    setEditingSpace(space);
    setHourlyRate(space.hourly_rate);
    setDailyRate(space.daily_rate ? space.daily_rate.toString() : '');
    setMonthlyRate(space.monthly_rate ? space.monthly_rate.toString() : '');
    setFeedback(null);
  }

  // Submit Pricing Update
  async function handleSavePricing(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSpace) return;

    setActionLoading(true);
    setFeedback(null);

    const result = await hostUpdatePricingAction({
      spaceId: editingSpace.id,
      hourlyRate,
      dailyRate: dailyRate ? Number(dailyRate) : null,
      monthlyRate: monthlyRate ? Number(monthlyRate) : null,
    });

    setActionLoading(false);

    if (result.error) {
      setFeedback({ message: result.error, type: 'error' });
    } else {
      setFeedback({ message: 'Pricing rates updated successfully across the network.', type: 'success' });
      setTimeout(() => {
        setEditingSpace(null);
        router.refresh();
      }, 1000);
    }
  }

  // Toggle Space Status (Active / Paused)
  async function handleToggleStatus(space: ParkingSpace) {
    if (space.status !== 'approved') {
      alert('Only spaces approved by admin verification can be activated or paused.');
      return;
    }

    const nextState = !space.is_active;
    const confirmMsg = nextState
      ? 'Activate this space for public bookings?'
      : 'Pause this space? It will temporarily disappear from search until reactivated.';

    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    const result = await hostToggleSpaceStatusAction(space.id, nextState);
    setActionLoading(false);

    if (result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  // Delete Space
  async function handleDeleteSpace(space: ParkingSpace) {
    if (!confirm(`Are you sure you want to permanently delete "${space.title}" (${space.identifier})?`)) {
      return;
    }

    setActionLoading(true);
    const result = await hostDeleteSpaceAction(space.id);
    setActionLoading(false);

    if (result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  const activeCount = spaces.filter((s) => s.status === 'approved' && s.is_active).length;
  const underReviewCount = spaces.filter((s) => s.status === 'submitted').length;
  const pausedCount = spaces.filter((s) => s.status === 'approved' && !s.is_active).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">My Listed Parking Spaces</h2>
          <p className="text-xs text-muted-foreground">
            Manage pricing, toggle availability, and monitor live bookings across India.
          </p>
        </div>
        <Link
          href="/host/spaces/new"
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow transition-colors flex items-center justify-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>List a New Space</span>
        </Link>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface p-4 rounded-card border border-border shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Listings</span>
          <div className="text-xl font-black text-foreground">{spaces.length}</div>
          <span className="text-[10px] text-muted-foreground">All spaces created</span>
        </div>

        <div className="bg-surface p-4 rounded-card border border-border shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Live & Bookable</span>
          <div className="text-xl font-black text-emerald-700">{activeCount}</div>
          <span className="text-[10px] text-emerald-700 font-semibold">Active in search</span>
        </div>

        <div className="bg-surface p-4 rounded-card border border-border shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Under Review</span>
          <div className="text-xl font-black text-amber-600">{underReviewCount}</div>
          <span className="text-[10px] text-amber-700 font-semibold">Admin verification</span>
        </div>

        <div className="bg-surface p-4 rounded-card border border-border shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Paused / Maintenance</span>
          <div className="text-xl font-black text-slate-600">{pausedCount}</div>
          <span className="text-[10px] text-slate-500">Temporarily hidden</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-surface p-4 rounded-card border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by spot ID, property, or area..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* City Filter */}
          {hostCities.length > 1 && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="text-xs py-1.5 px-3 bg-surface-muted border border-border rounded-control text-foreground font-medium focus:outline-none"
            >
              <option value="all">All Cities</option>
              {hostCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 bg-surface-muted border border-border rounded-control text-foreground font-medium focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Live & Bookable</option>
            <option value="submitted">Under Review</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      {/* Space Cards Grid */}
      {filteredSpaces.length === 0 ? (
        <div className="bg-surface rounded-card p-12 border border-border text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-surface-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Car className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-foreground">No parking spaces match your criteria</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {spaces.length === 0
              ? 'List your residential or commercial parking slot to start earning effortless parking income.'
              : 'Try clearing your search query or status filter to see all your spaces.'}
          </p>
          {spaces.length === 0 && (
            <Link
              href="/host/spaces/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-control shadow"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>List Space Now</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSpaces.map((s) => {
            const isLive = s.status === 'approved' && s.is_active;
            const isPaused = s.status === 'approved' && !s.is_active;
            const isPending = s.status === 'submitted';

            return (
              <div
                key={s.id}
                className="bg-surface rounded-card border border-border overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Photo Header & Identifier Pill */}
                  <div className="relative h-36 bg-surface-muted overflow-hidden">
                    <img
                      src={
                        s.photos?.[0]?.storage_path ||
                        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full shadow">
                      {s.identifier}
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shadow ${
                          isLive
                            ? 'bg-emerald-600 text-white'
                            : isPaused
                              ? 'bg-slate-700 text-white'
                              : 'bg-amber-600 text-white'
                        }`}
                      >
                        {isLive ? 'Live' : isPaused ? 'Paused' : 'Pending Review'}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span>
                        {s.property?.area}, {s.property?.city || 'India'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-foreground line-clamp-1">{s.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {s.property?.title} • {s.property?.address_line1}
                      </p>
                    </div>

                    {/* Rates Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-surface-muted/60 p-2.5 rounded-control text-center border border-border/50">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Hourly</span>
                        <span className="text-xs font-black text-foreground font-mono">₹{s.hourly_rate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Daily</span>
                        <span className="text-xs font-black text-foreground font-mono">
                          {s.daily_rate ? `₹${s.daily_rate}` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Monthly</span>
                        <span className="text-xs font-black text-foreground font-mono">
                          {s.monthly_rate ? `₹${s.monthly_rate}` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Features Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] px-2 py-0.5 bg-surface-muted rounded-full text-foreground capitalize font-medium">
                        {s.parking_type}
                      </span>
                      {s.has_ev_charging && (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full font-semibold flex items-center gap-1">
                          <Zap className="w-3 h-3" /> EV Ready
                        </span>
                      )}
                      {s.security_features?.includes('cctv') && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full font-semibold">
                          CCTV
                        </span>
                      )}
                      {s.security_features?.includes('gated_security') && (
                        <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-800 rounded-full font-semibold">
                          24/7 Guard
                        </span>
                      )}
                    </div>

                    {/* Notice for Under Review */}
                    {isPending && (
                      <div className="p-2.5 bg-amber-50 rounded-control border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span>Submitted for verification. Listing will go live once admin checks ownership docs.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="p-3 bg-surface-muted/40 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* View Details */}
                    <button
                      onClick={() => setInspectingSpace(s)}
                      title="Inspect spot specifications & access rules"
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface rounded-control transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit Pricing */}
                    <button
                      onClick={() => handleOpenPricing(s)}
                      title="Edit pricing rates"
                      className="p-1.5 text-primary hover:bg-primary-soft rounded-control transition-colors flex items-center gap-1 text-xs font-semibold"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Pricing</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Active / Pause Toggle Button */}
                    {s.status === 'approved' && (
                      <button
                        onClick={() => handleToggleStatus(s)}
                        disabled={actionLoading}
                        title={s.is_active ? 'Pause spot from public discovery' : 'Reactivate spot'}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-control flex items-center gap-1 transition-colors ${
                          s.is_active
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{s.is_active ? 'Pause' : 'Activate'}</span>
                      </button>
                    )}

                    {/* Delete Space */}
                    <button
                      onClick={() => handleDeleteSpace(s)}
                      disabled={actionLoading}
                      title="Delete space listing"
                      className="p-1.5 text-muted-foreground hover:text-danger hover:bg-red-50 rounded-control transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Quick Pricing Editor */}
      {editingSpace && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-border shadow-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Update Pricing Rates</h3>
                <p className="text-xs text-muted-foreground">
                  {editingSpace.identifier} • {editingSpace.property?.area}, {editingSpace.property?.city}
                </p>
              </div>
              <button
                onClick={() => setEditingSpace(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-control text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-danger border border-red-200'
                }`}
              >
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSavePricing} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Hourly Rate (₹ / hr) <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono font-bold"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Recommended for standard cars: ₹30 - ₹90 / hr</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Daily Discounted Rate (₹ / 24 hrs)</label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="50"
                    step="50"
                    placeholder="Optional (e.g. 400)"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Automatic discount applied when parkers book 12+ hours.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Monthly Subscription Rate (₹ / month)</label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="500"
                    step="250"
                    placeholder="Optional (e.g. 5000)"
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Guarantees steady recurring monthly revenue from daily commuters.</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingSpace(null)}
                  className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface-muted rounded-control"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Rates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Space Details & Access Instructions */}
      {inspectingSpace && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-border shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono text-primary font-bold uppercase">{inspectingSpace.identifier}</span>
                <h3 className="text-base font-bold text-foreground">{inspectingSpace.title}</h3>
              </div>
              <button
                onClick={() => setInspectingSpace(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-muted-foreground block text-[11px]">Location & Property</span>
                <p className="text-foreground font-medium mt-0.5">
                  {inspectingSpace.property?.title} ({inspectingSpace.property?.property_type})
                </p>
                <p className="text-muted-foreground text-[11px]">
                  {inspectingSpace.property?.address_line1}, {inspectingSpace.property?.area},{' '}
                  {inspectingSpace.property?.city} ({inspectingSpace.property?.postal_code})
                </p>
              </div>

              <div>
                <span className="font-semibold text-muted-foreground block text-[11px]">Gate Access Procedures</span>
                <div className="p-3 bg-surface-muted rounded-control border border-border font-mono text-foreground text-[11px] mt-0.5 whitespace-pre-wrap">
                  {inspectingSpace.access_instructions || 'Show ParkBnB verified booking pass to gate security attendant.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-surface-muted p-2.5 rounded-control">
                  <span className="text-[10px] text-muted-foreground block">Max Clearance Height</span>
                  <span className="font-bold text-foreground">
                    {inspectingSpace.height_limit_meters ? `${inspectingSpace.height_limit_meters} Meters` : 'No Height Limit'}
                  </span>
                </div>
                <div className="bg-surface-muted p-2.5 rounded-control">
                  <span className="text-[10px] text-muted-foreground block">EV Fast Charger</span>
                  <span className="font-bold text-foreground">
                    {inspectingSpace.has_ev_charging ? 'Level 2 AC Type 2' : 'Not Equipped'}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-muted-foreground block text-[11px]">Permitted Vehicles</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {inspectingSpace.vehicle_types?.map((vt) => (
                    <span
                      key={vt}
                      className="px-2 py-0.5 bg-primary-soft text-primary font-medium text-[10px] rounded-full capitalize"
                    >
                      {vt.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                onClick={() => setInspectingSpace(null)}
                className="px-4 py-2 bg-surface-muted hover:bg-border text-foreground text-xs font-semibold rounded-control"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
