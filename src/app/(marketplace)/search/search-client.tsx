'use client';

import { Suspense, useState, useMemo } from 'react';
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
  Navigation
} from 'lucide-react';
import { ParkingSpace, VehicleType } from '@/types/database';
import { INDIAN_CITIES } from '@/lib/constants/cities';

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
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc'>('price_asc');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  // Active City configuration
  const activeCityConfig = INDIAN_CITIES.find(
    (c) => c.name.toLowerCase() === cityFilter.toLowerCase() || c.id.toLowerCase() === cityFilter.toLowerCase()
  );

  // Filter and sort verified listings across India
  const filteredSpaces = useMemo(() => {
    return initialSpaces
      .filter((space) => {
        // City match
        if (cityFilter !== 'all') {
          const cName = space.property?.city?.toLowerCase() || '';
          const target = cityFilter.toLowerCase();
          if (!cName.includes(target) && !target.includes(cName)) {
            return false;
          }
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
        if (sortBy === 'price_asc') return a.hourly_rate - b.hourly_rate;
        return b.hourly_rate - a.hourly_rate;
      });
  }, [initialSpaces, cityFilter, destination, vehicleFilter, typeFilter, evOnly, maxPrice, sortBy]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Top Search & Filter Bar */}
      <div className="bg-surface border-b border-border sticky top-16 z-30 px-4 sm:px-6 lg:px-8 py-3 shadow-xs space-y-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-primary absolute left-3 top-3" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Search city, area, landmark (e.g. BKC, Cyber City, Koramangala)..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
            />
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

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs py-2 px-2.5 bg-surface-muted border border-border rounded-control focus:outline-none text-foreground font-medium"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Pan-India Metro Quick-Pills */}
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-primary" /> Metros:
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
              {cityFilter === 'all' ? 'across India' : `in ${cityFilter}`}
            </span>
            {(destination || cityFilter !== 'all' || vehicleFilter !== 'all' || evOnly) && (
              <button
                onClick={() => {
                  setDestination('');
                  setCityFilter('all');
                  setVehicleFilter('all');
                  setTypeFilter('all');
                  setEvOnly(false);
                  setMaxPrice(200);
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
                No spots matched your filters in {cityFilter === 'all' ? 'this search' : cityFilter}. Try selecting
                another city or resetting filters.
              </p>
              <button
                onClick={() => {
                  setDestination('');
                  setCityFilter('all');
                  setVehicleFilter('all');
                  setTypeFilter('all');
                  setEvOnly(false);
                  setMaxPrice(200);
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
                          className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-control shadow-xs transition-colors flex items-center gap-1"
                        >
                          <span>Reserve Spot</span>
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
            <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur px-3 py-2 rounded-control border border-border shadow-xs flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{activeCityConfig ? `${activeCityConfig.name} Mobility Hub` : 'Pan-India Parking Grid'}</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {activeCityConfig
                  ? `${activeCityConfig.lat.toFixed(2)}° N, ${activeCityConfig.lng.toFixed(2)}° E`
                  : 'All Metros Active'}
              </span>
            </div>

            {/* Interactive Pin Markers */}
            <div className="relative w-full h-full flex items-center justify-center">
              {filteredSpaces.map((space, idx) => {
                const isSelected = selectedSpaceId === space.id;
                const leftPos = `${20 + ((idx * 23) % 60)}%`;
                const topPos = `${25 + ((idx * 29) % 50)}%`;

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
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-white p-2.5 rounded-control shadow-lg border border-border text-[11px] z-30">
                      <div className="font-bold text-foreground line-clamp-1">{space.title}</div>
                      <div className="text-muted-foreground">
                        {space.property?.area}, {space.property?.city}
                      </div>
                      <div className="text-primary font-bold mt-1">₹{space.hourly_rate} / hr</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Map Disclaimer */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur p-2.5 rounded-control border border-border text-[11px] text-muted-foreground text-center">
              Exact residential gate pins and clearance access codes are revealed upon confirmed booking to protect host privacy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
