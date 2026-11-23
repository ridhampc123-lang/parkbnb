'use client';

import { Suspense, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Filter, Car, Zap, Shield, ChevronRight, SlidersHorizontal, Loader2, CheckCircle2 } from 'lucide-react';
import { ParkingSpace, VehicleType } from '@/types/database';

export function SearchClient({ initialSpaces }: { initialSpaces: ParkingSpace[] }) {
  const searchParams = useSearchParams();
  const initialDestination = searchParams.get('destination') || '';

  const [destination, setDestination] = useState(initialDestination);
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [evOnly, setEvOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc'>('price_asc');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  // Filter and sort verified listings
  const filteredSpaces = useMemo(() => {
    return initialSpaces
      .filter((space) => {
        // Destination match
        if (destination.trim()) {
          const q = destination.toLowerCase();
          const matchArea = space.property?.area?.toLowerCase().includes(q);
          const matchTitle = space.title?.toLowerCase().includes(q);
          const matchAddress = space.property?.address_line1?.toLowerCase().includes(q);
          if (!matchArea && !matchTitle && !matchAddress) return false;
        }

        // Vehicle type filter
        if (vehicleFilter !== 'all') {
          if (!space.vehicle_types?.includes(vehicleFilter as VehicleType)) return false;
        }

        // Parking type filter (covered vs open)
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
  }, [initialSpaces, destination, vehicleFilter, typeFilter, evOnly, maxPrice, sortBy]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Top Search & Filter Bar */}
      <div className="bg-surface border-b border-border sticky top-16 z-30 px-4 sm:px-6 lg:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-primary absolute left-3 top-3" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Search area (e.g. Prahlad Nagar, CG Road, Bodakdev)..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-surface-muted border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
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
              <option value="all">All Types</option>
              <option value="covered">Covered / Basement</option>
              <option value="open">Open / Surface</option>
            </select>

            {/* EV Toggle */}
            <button
              type="button"
              onClick={() => setEvOnly(!evOnly)}
              className={`flex items-center gap-1 text-xs py-2 px-3 rounded-control border transition-all ${
                evOnly
                  ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                  : 'bg-surface-muted text-foreground border-border hover:bg-surface'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>EV Only</span>
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'price_asc' | 'price_desc')}
              className="text-xs py-2 px-3 bg-surface-muted border border-border rounded-control focus:outline-none text-foreground font-medium"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Results List + Interactive Ahmedabad Map Preview */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left: Listings Column (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-2">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Showing <strong className="text-foreground">{filteredSpaces.length}</strong> Admin-verified parking spaces in Ahmedabad
            </span>
            {destination && (
              <button
                onClick={() => setDestination('')}
                className="text-primary hover:underline font-semibold"
              >
                Clear search
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
                Only parking spaces verified and approved by ParkBnB Admin appear here. Try adjusting your search or clearing filters.
              </p>
              <button
                onClick={() => {
                  setDestination('');
                  setVehicleFilter('all');
                  setTypeFilter('all');
                  setEvOnly(false);
                  setMaxPrice(200);
                }}
                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-control shadow transition-colors"
              >
                Reset All Filters
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
                      {space.photos && space.photos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={space.photos[0].storage_path}
                          alt={space.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Car className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-white/95 backdrop-blur px-2.5 py-1 rounded-control text-xs font-bold text-foreground shadow-xs">
                        ₹{space.hourly_rate}/hr
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{space.property?.area || 'Ahmedabad'}</span>
                          <span className="text-muted-foreground">• {space.parking_type}</span>
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
                            <CheckCircle2 className="w-3 h-3" /> Verified
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
                          <span>Reserve</span>
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

        {/* Right: Interactive Ahmedabad Map Preview (5 cols) */}
        <div className="hidden lg:block lg:col-span-5 border-l border-border bg-slate-100 p-4 relative">
          <div className="h-full w-full rounded-card overflow-hidden bg-slate-200 border border-border relative flex flex-col items-center justify-center">
            {/* Visual Ahmedabad Map Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-70"></div>

            {/* Map Header Overlay */}
            <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur px-3 py-2 rounded-control border border-border shadow-xs flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" /> Ahmedabad Mobility View
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">GPS: 23.0225° N, 72.5714° E</span>
            </div>

            {/* Interactive Pin Markers */}
            <div className="relative w-full h-full flex items-center justify-center">
              {filteredSpaces.map((space, idx) => {
                const isSelected = selectedSpaceId === space.id;
                const leftPos = `${25 + ((idx * 27) % 55)}%`;
                const topPos = `${30 + ((idx * 21) % 45)}%`;

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
                      <div className="text-muted-foreground">{space.property?.area || 'Ahmedabad'}</div>
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

