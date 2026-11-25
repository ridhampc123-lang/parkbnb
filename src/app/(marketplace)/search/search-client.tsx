'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  MapPin,
  Filter,
  Car,
  Zap,
  Shield,
  ChevronRight,
  SlidersHorizontal,
  Loader2,
  CheckCircle2,
  Building,
  Navigation,
  Compass,
  X,
  AlertCircle
} from 'lucide-react';
import { ParkingSpace, VehicleType } from '@/types/database';
import { INDIAN_CITIES } from '@/lib/constants/cities';
import { calculateDistanceKm, formatDistanceInfo } from '@/lib/geo/distance';

interface ParkingSpaceWithDistance extends ParkingSpace {
  distanceKm?: number;
  distanceText?: string;
  walkingTimeMinutes?: number;
  drivingTimeMinutes?: number;
}

export function SearchClient({ initialSpaces }: { initialSpaces: ParkingSpace[] }) {
  const searchParams = useSearchParams();
  const initialDestination = searchParams.get('destination') || '';
  const initialCity = searchParams.get('city') || 'all';

  const [destination, setDestination] = useState(initialDestination);
  const [cityFilter, setCityFilter] = useState<string>(initialCity);
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [evOnly, setEvOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'distance_asc'>('price_asc');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  // Customer live GPS Location State
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number | null>(null);

  // Active City configuration
  const activeCityConfig = INDIAN_CITIES.find(
    (c) => c.name.toLowerCase() === cityFilter.toLowerCase() || c.id.toLowerCase() === cityFilter.toLowerCase()
  );

  // Fetch Customer Live GPS Location
  const handleDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCustomerCoords({ lat: latitude, lng: longitude });
        setSortBy('distance_asc');
        setCityFilter('all'); // Show all spaces sorted by real distance
        setLocationLoading(false);
      },
      (err) => {
        setLocationLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please enable GPS permissions in your browser or search by area.');
        } else if (err.code === err.TIMEOUT) {
          setLocationError('Location request timed out. Please check your GPS signal and retry.');
        } else {
          setLocationError('Unable to detect your location. You can search by area or city above.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleClearLocation = () => {
    setCustomerCoords(null);
    setMaxRadiusKm(null);
    if (sortBy === 'distance_asc') {
      setSortBy('price_asc');
    }
  };

  // Filter and sort verified listings across India with live distance math
  const filteredSpaces: ParkingSpaceWithDistance[] = useMemo(() => {
    const list: ParkingSpaceWithDistance[] = initialSpaces.map((space) => {
      if (!customerCoords) {
        return space;
      }
      const lat = space.property?.latitude ?? 0;
      const lng = space.property?.longitude ?? 0;
      const d = calculateDistanceKm(customerCoords.lat, customerCoords.lng, lat, lng);
      const info = formatDistanceInfo(d);
      return {
        ...space,
        distanceKm: d,
        distanceText: info.distanceText,
        walkingTimeMinutes: info.walkingTimeMinutes,
        drivingTimeMinutes: info.drivingTimeMinutes,
      };
    });

    return list
      .filter((space) => {
        // City match
        if (cityFilter !== 'all') {
          const cName = space.property?.city?.toLowerCase() || '';
          const target = cityFilter.toLowerCase();
          if (!cName.includes(target) && !target.includes(cName)) {
            return false;
          }
        }

        // Distance Radius filter
        if (customerCoords && maxRadiusKm !== null && space.distanceKm !== undefined) {
          if (space.distanceKm > maxRadiusKm) return false;
        }

        // Destination match (area, city, title, address)
        if (destination.trim()) {
          const q = destination.toLowerCase();
          const matchArea = space.property?.area?.toLowerCase().includes(q);
          const matchCity = space.property?.city?.toLowerCase().includes(q);
          const matchTitle = space.title?.toLowerCase().includes(q);
          const matchAddress = space.property?.address_line1?.toLowerCase().includes(q);
          if (!matchArea && !matchCity && !matchTitle && !matchAddress) return false;
        }

        // Vehicle type filter
        if (vehicleFilter !== 'all') {
          if (!space.vehicle_types?.includes(vehicleFilter as VehicleType)) return false;
        }

        // Parking type filter (covered vs open vs basement vs multi_level)
        if (typeFilter !== 'all' && space.parking_type !== typeFilter) {
          return false;
        }

        // EV Filter
        if (evOnly && !space.has_ev_charging) {
          return false;
        }

        // Price filter
        if (space.hourly_rate > maxPrice) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance_asc') {
          return (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
        }
        if (sortBy === 'price_asc') return a.hourly_rate - b.hourly_rate;
        return b.hourly_rate - a.hourly_rate;
      });
  }, [
    initialSpaces,
    cityFilter,
    destination,
    vehicleFilter,
    typeFilter,
    evOnly,
    maxPrice,
    sortBy,
    customerCoords,
    maxRadiusKm,
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Top Search & Filter Bar */}
      <div className="bg-surface border-b border-border sticky top-16 z-30 px-4 sm:px-6 lg:px-8 py-3 shadow-xs space-y-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input & "Near Me" GPS Button */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-primary absolute left-3 top-3" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Search city, area, landmark (e.g. BKC, Cyber City, Koramangala)..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
              />
            </div>

            {/* GPS Near Me CTA */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locationLoading}
              className={`px-3 py-2 text-xs font-bold rounded-control flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
                customerCoords
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                  : 'bg-primary-soft hover:bg-primary/20 text-primary border border-primary/30'
              }`}
              title="Detect your live GPS coordinates to show nearest parking spaces"
            >
              {locationLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className={`w-3.5 h-3.5 ${customerCoords ? 'fill-white' : ''}`} />
              )}
              <span>{customerCoords ? 'GPS Active' : 'Near Me'}</span>
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* City Dropdown */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-surface-muted border border-border rounded-control focus:outline-none text-foreground font-bold"
            >
              <option value="all">🇮🇳 All India</option>
              {INDIAN_CITIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.state})
                </option>
              ))}
            </select>

            {/* Vehicle Type */}
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-surface-muted border border-border rounded-control focus:outline-none text-foreground font-medium"
            >
              <option value="all">All Vehicles</option>
              <option value="car_sedan">Sedan</option>
              <option value="car_suv">SUV / MUV</option>
              <option value="car_hatchback">Hatchback</option>
              <option value="two_wheeler">Two-Wheeler</option>
              <option value="ev_four_wheeler">EV Car</option>
            </select>

            {/* Parking Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-surface-muted border border-border rounded-control focus:outline-none text-foreground font-medium"
            >
              <option value="all">All Structures</option>
              <option value="covered">Covered / Stilt</option>
              <option value="basement">Basement</option>
              <option value="multi_level">Multi-Level</option>
              <option value="open">Open Surface</option>
            </select>

            {/* EV Only Toggle */}
            <button
              onClick={() => setEvOnly(!evOnly)}
              className={`text-xs py-1.5 px-3 rounded-control border flex items-center gap-1.5 font-medium transition-colors ${
                evOnly
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                  : 'bg-surface-muted text-muted-foreground border-border hover:bg-border'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${evOnly ? 'text-emerald-600 fill-emerald-600' : ''}`} />
              <span>EV Ready</span>
            </button>

            {/* Price Cap Filter */}
            <div className="flex items-center gap-1.5 bg-surface-muted border border-border rounded-control px-2.5 py-1 text-xs">
              <span className="text-[11px] text-muted-foreground">Max:</span>
              <span className="font-mono font-bold text-foreground">₹{maxPrice}</span>
              <input
                type="range"
                min="30"
                max="250"
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-16 accent-primary cursor-pointer"
              />
            </div>

            {/* Sort Selector with "Nearest to Me" */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs py-2 px-2.5 bg-surface-muted border border-border rounded-control focus:outline-none text-foreground font-semibold"
            >
              {customerCoords && <option value="distance_asc">📍 Nearest First</option>}
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Live GPS Active Notification Strip */}
        {customerCoords && (
          <div className="max-w-7xl mx-auto bg-blue-50 border border-blue-200 text-blue-900 text-xs px-3.5 py-2 rounded-control flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <span className="font-bold">
                Showing parking spaces near your GPS location ({customerCoords.lat.toFixed(3)}°N, {customerCoords.lng.toFixed(3)}°E)
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[11px] text-blue-700 font-medium">Radius:</span>
              <select
                value={maxRadiusKm !== null ? maxRadiusKm.toString() : 'all'}
                onChange={(e) => setMaxRadiusKm(e.target.value === 'all' ? null : Number(e.target.value))}
                className="text-xs bg-white border border-blue-300 rounded px-2 py-0.5 text-blue-950 font-semibold focus:outline-none"
              >
                <option value="all">Any Distance</option>
                <option value="2">Within 2 km</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="25">Within 25 km</option>
              </select>

              <button
                type="button"
                onClick={handleClearLocation}
                className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-950 font-bold hover:underline ml-1"
              >
                <X className="w-3 h-3" /> Clear GPS
              </button>
            </div>
          </div>
        )}

        {/* Location Error Notice */}
        {locationError && (
          <div className="max-w-7xl mx-auto bg-amber-50 border border-amber-200 text-amber-900 text-xs px-3.5 py-1.5 rounded-control flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{locationError}</span>
            </div>
            <button
              onClick={() => setLocationError(null)}
              className="text-amber-800 hover:text-amber-950 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Pan-India Metro Quick-Pills */}
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Compass className="w-3 h-3 text-primary" /> Metros:
          </span>
          <button
            onClick={() => setCityFilter('all')}
            className={`text-[11px] px-2.5 py-0.5 rounded-full shrink-0 border transition-colors ${
              cityFilter === 'all'
                ? 'bg-primary text-white border-primary font-bold'
                : 'bg-surface text-muted-foreground border-border hover:bg-surface-muted'
            }`}
          >
            All India ({initialSpaces.length})
          </button>
          {INDIAN_CITIES.map((c) => {
            const count = initialSpaces.filter(
              (s) => s.property?.city?.toLowerCase() === c.name.toLowerCase()
            ).length;
            const isSelected = cityFilter.toLowerCase() === c.name.toLowerCase();

            return (
              <button
                key={c.id}
                onClick={() => setCityFilter(c.name)}
                className={`text-[11px] px-2.5 py-0.5 rounded-full shrink-0 border transition-colors flex items-center gap-1 ${
                  isSelected
                    ? 'bg-primary text-white border-primary font-bold'
                    : 'bg-surface text-muted-foreground border-border hover:bg-surface-muted'
                }`}
              >
                <span>{c.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[9px] px-1.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-surface-muted text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Layout: Results List + Interactive Pan-India Map Preview */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left: Listings Column (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-2">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Showing <strong className="text-foreground">{filteredSpaces.length}</strong> verified parking spaces{' '}
              {customerCoords
                ? 'near your location'
                : cityFilter === 'all'
                  ? 'across India'
                  : `in ${cityFilter}`}
            </span>
            {(destination || cityFilter !== 'all' || vehicleFilter !== 'all' || evOnly || customerCoords) && (
              <button
                onClick={() => {
                  setDestination('');
                  setCityFilter('all');
                  setVehicleFilter('all');
                  setTypeFilter('all');
                  setEvOnly(false);
                  setMaxPrice(200);
                  setCustomerCoords(null);
                  setMaxRadiusKm(null);
                  setSortBy('price_asc');
                }}
                className="text-primary hover:underline font-semibold"
              >
                Reset filters
              </button>
            )}
          </div>

          {filteredSpaces.length === 0 ? (
            <div className="bg-surface rounded-card p-12 border border-border text-center space-y-3">
              <div className="p-3 bg-surface-muted text-muted-foreground rounded-full w-fit mx-auto">
                <Car className="w-8 h-8 stroke-1" />
              </div>
              <h3 className="text-base font-bold text-foreground">No approved parking spaces found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {customerCoords
                  ? 'No spots found within your selected distance radius. Try expanding the radius or clearing GPS.'
                  : `No spots matched your filters in ${cityFilter === 'all' ? 'this search' : cityFilter}. Try selecting another city or resetting filters.`}
              </p>
              <button
                onClick={() => {
                  setDestination('');
                  setCityFilter('all');
                  setVehicleFilter('all');
                  setTypeFilter('all');
                  setEvOnly(false);
                  setMaxPrice(200);
                  setCustomerCoords(null);
                  setMaxRadiusKm(null);
                  setSortBy('price_asc');
                }}
                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-control shadow transition-colors"
              >
                Show All Available Spaces
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSpaces.map((space) => {
                const isSelected = selectedSpaceId === space.id;
                return (
                  <div
                    key={space.id}
                    onMouseEnter={() => setSelectedSpaceId(space.id)}
                    className={`bg-surface rounded-card border transition-all overflow-hidden flex flex-col sm:flex-row hover:shadow-md ${
                      isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="sm:w-48 h-44 sm:h-auto bg-surface-muted relative shrink-0">
                      <img
                        src={
                          space.photos?.[0]?.storage_path ||
                          'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={space.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-control text-xs font-bold font-mono shadow-xs">
                        ₹{space.hourly_rate}/hr
                      </div>

                      {/* Distance Pill over image if GPS is active */}
                      {space.distanceKm !== undefined && (
                        <div className="absolute bottom-2 left-2 bg-blue-600/95 backdrop-blur-xs text-white px-2 py-0.5 rounded-control text-[10px] font-bold font-mono shadow flex items-center gap-1">
                          <Navigation className="w-2.5 h-2.5 fill-white" />
                          <span>{space.distanceText}</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {space.property?.area}, {space.property?.city || 'India'}
                          </span>
                          <span className="text-muted-foreground capitalize">• {space.parking_type}</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors">
                          <Link href={`/parking/${space.id}`}>{space.title}</Link>
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {space.description}
                        </p>
                      </div>

                      {/* Badges & Actions */}
                      <div className="pt-3 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Verified Spot
                          </span>

                          {/* Distance Badge with walking estimate */}
                          {space.distanceKm !== undefined && (
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                              <Navigation className="w-2.5 h-2.5 text-blue-600" />
                              <span>{space.distanceText} away</span>
                              <span className="text-blue-500 font-sans font-normal">
                                (~{space.walkingTimeMinutes}m walk)
                              </span>
                            </span>
                          )}

                          {space.has_ev_charging && (
                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Zap className="w-3 h-3" /> EV
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground font-medium bg-surface-muted px-2 py-0.5 rounded-full font-mono">
                            {space.identifier}
                          </span>
                        </div>

                        <Link
                          href={`/parking/${space.id}`}
                          className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow transition-colors flex items-center gap-1 shrink-0 ml-2"
                        >
                          <span>Book Spot</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Interactive Mobility Map Preview (5 cols) */}
        <div className="hidden lg:block lg:col-span-5 border-l border-border bg-slate-100 p-4 relative">
          <div className="h-full w-full rounded-card overflow-hidden bg-slate-200 border border-border relative flex flex-col items-center justify-center">
            {/* Visual India Map Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-70"></div>

            {/* Map Header Overlay */}
            <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur px-3 py-2 rounded-control border border-border shadow-xs flex items-center justify-between text-xs z-30">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                <span>
                  {customerCoords
                    ? 'Nearest Parkings to Your GPS'
                    : activeCityConfig
                      ? `${activeCityConfig.name} Mobility Hub`
                      : 'Pan-India Parking Grid'}
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {customerCoords
                  ? `${customerCoords.lat.toFixed(2)}°N, ${customerCoords.lng.toFixed(2)}°E`
                  : activeCityConfig
                    ? `${activeCityConfig.lat.toFixed(2)}° N, ${activeCityConfig.lng.toFixed(2)}° E`
                    : 'All Metros Active'}
              </span>
            </div>

            {/* Customer Location Pin Marker (if GPS is active) */}
            {customerCoords && (
              <div
                style={{ left: '50%', top: '50%' }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-10 h-10 rounded-full bg-blue-500/25 animate-ping absolute"></span>
                  <div className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-xl flex items-center gap-1 border-2 border-white">
                    <Navigation className="w-3 h-3 fill-white" />
                    <span>You are here</span>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Pin Markers */}
            <div className="relative w-full h-full flex items-center justify-center">
              {filteredSpaces.map((space, idx) => {
                const isSelected = selectedSpaceId === space.id;
                const leftPos = `${18 + ((idx * 23) % 64)}%`;
                const topPos = `${22 + ((idx * 29) % 56)}%`;

                return (
                  <div
                    key={space.id}
                    onClick={() => setSelectedSpaceId(space.id)}
                    style={{ left: leftPos, top: topPos }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 group z-20`}
                  >
                    <div
                      className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1 transition-transform ${
                        isSelected
                          ? 'bg-slate-900 text-white scale-110 ring-2 ring-primary'
                          : 'bg-primary text-white hover:scale-105'
                      }`}
                    >
                      <MapPin className="w-3 h-3 text-accent" />
                      <span>₹{space.hourly_rate}</span>
                    </div>

                    {/* Hover Card */}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 bg-white p-2.5 rounded-control shadow-lg border border-border text-[11px] z-40">
                      <div className="font-bold text-foreground line-clamp-1">{space.title}</div>
                      <div className="text-muted-foreground text-[10px]">
                        {space.property?.area}, {space.property?.city}
                      </div>
                      {space.distanceText && (
                        <div className="text-blue-600 font-bold font-mono text-[10px] mt-0.5">
                          📍 {space.distanceText} away (~{space.walkingTimeMinutes}m walk)
                        </div>
                      )}
                      <div className="text-primary font-bold mt-1">₹{space.hourly_rate} / hr</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Map Disclaimer */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur p-2.5 rounded-control border border-border text-[11px] text-muted-foreground text-center z-30">
              Exact residential gate pins and clearance access codes are revealed upon confirmed booking to protect host privacy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
