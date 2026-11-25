'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSpaceAction } from '@/server/actions/space-actions';
import { INDIAN_CITIES } from '@/lib/constants/cities';
import { ProviderProfile } from '@/types/database';
import {
  Building,
  MapPin,
  Car,
  Shield,
  AlertCircle,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Zap,
  IndianRupee,
  Lock,
  CreditCard,
  Send,
  HelpCircle
} from 'lucide-react';

interface NewSpaceClientProps {
  initialTitles: string[];
  existingProvider?: ProviderProfile;
  userFullName: string;
}

export function NewSpaceClient({
  initialTitles,
  existingProvider,
  userFullName,
}: NewSpaceClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedCityId, setSelectedCityId] = useState('mumbai');
  const [area, setArea] = useState('Bandra Kurla Complex (BKC)');
  const [latitude, setLatitude] = useState(19.0657);
  const [longitude, setLongitude] = useState(72.8687);
  const [hasEv, setHasEv] = useState(false);
  const [evKw, setEvKw] = useState('7.4');
  const [parkingType, setParkingType] = useState('covered');
  const [hourlyRate, setHourlyRate] = useState('50');
  const [dailyRate, setDailyRate] = useState('380');
  const [monthlyRate, setMonthlyRate] = useState('5500');

  // Listing Title state: dropdown + optional custom
  const [selectedTitle, setSelectedTitle] = useState(initialTitles[0] || 'Covered Basement Parking Bay');
  const [customTitle, setCustomTitle] = useState('');
  const [isCustomTitle, setIsCustomTitle] = useState(false);

  // Payout details state
  const hasExistingBank = Boolean(existingProvider?.bank_account_number || existingProvider?.upi_id);
  const [editPayout, setEditPayout] = useState(!hasExistingBank);
  const [bankHolder, setBankHolder] = useState(existingProvider?.bank_account_holder || userFullName);
  const [bankName, setBankName] = useState(existingProvider?.bank_name || '');
  const [accountNumber, setAccountNumber] = useState(existingProvider?.bank_account_number || '');
  const [confirmAccount, setConfirmAccount] = useState(existingProvider?.bank_account_number || '');
  const [ifsc, setIfsc] = useState(existingProvider?.bank_ifsc_code || '');
  const [upi, setUpi] = useState(existingProvider?.upi_id || '');
  const [payoutPref, setPayoutPref] = useState<'bank_transfer' | 'upi'>(existingProvider?.payout_preference || 'bank_transfer');

  const currentCity = INDIAN_CITIES.find(c => c.id === selectedCityId) || INDIAN_CITIES[0];

  function handleCityChange(cityId: string) {
    setSelectedCityId(cityId);
    const city = INDIAN_CITIES.find(c => c.id === cityId);
    if (city) {
      setArea(city.popularAreas[0] || '');
      setLatitude(city.lat);
      setLongitude(city.lng);
    }
  }

  function handleAreaSelect(popularArea: string) {
    setArea(popularArea);
  }

  function handleTitleDropdownChange(val: string) {
    if (val === '__custom__') {
      setIsCustomTitle(true);
    } else {
      setIsCustomTitle(false);
      setSelectedTitle(val);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validate account confirmation if editing payout
    if (editPayout && accountNumber && confirmAccount && accountNumber !== confirmAccount) {
      setError('Bank account number and confirmation account number do not match.');
      return;
    }

    if (editPayout && ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase())) {
      setError('Please enter a valid 11-digit IFSC code (e.g. SBIN0001234, HDFC0000240).');
      return;
    }

    if (editPayout && upi && !/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi)) {
      setError('Please enter a valid UPI ID (e.g. name@okhdfcbank or 9876543210@upi).');
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('city', currentCity.name);
    formData.set('latitude', latitude.toString());
    formData.set('longitude', longitude.toString());
    formData.set('has_ev_charging', hasEv.toString());

    // Resolve final listing title with zero-failure fallbacks
    const resolvedCustom = isCustomTitle && customTitle.trim().length >= 3 ? customTitle.trim() : null;
    const finalTitle = resolvedCustom || selectedTitle || (initialTitles.length > 0 ? initialTitles[0] : 'Covered Reserved Parking Bay');
    formData.set('title', finalTitle);
    formData.set('title_select', selectedTitle || initialTitles[0] || 'Covered Reserved Parking Bay');
    if (resolvedCustom) {
      formData.set('title_custom', resolvedCustom);
    }

    // Payout details
    if (editPayout) {
      formData.set('bank_name', bankName.trim());
      formData.set('bank_account_holder', bankHolder.trim());
      formData.set('bank_account_number', accountNumber.trim());
      formData.set('confirm_account_number', confirmAccount.trim());
      formData.set('bank_ifsc_code', ifsc.trim().toUpperCase());
      formData.set('upi_id', upi.trim());
      formData.set('payout_preference', payoutPref);
    }

    const result = await createSpaceAction(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.success) {
      router.push('/host/spaces');
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/host/spaces"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Spaces
        </Link>
      </div>

      <div className="bg-surface rounded-card p-6 sm:p-8 border border-border shadow-card space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary-soft px-2.5 py-0.5 rounded-full">
              Pan-India Supply Onboarding
            </span>
            <span className="text-xs text-muted-foreground font-mono">14+ Indian Metro Hubs</span>
          </div>
          <h1 className="text-2xl font-black text-foreground mt-1.5">List a Verified Parking Space</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monetize unused residential or commercial parking capacity in Mumbai, Delhi NCR, Bengaluru, Pune, Hyderabad, Ahmedabad, Chennai, and across India.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-danger rounded-control text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: City & Exact Geographic Location */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>1. City & Property Location</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* City Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Operating City <span className="text-danger">*</span>
                </label>
                <select
                  value={selectedCityId}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-bold"
                >
                  {INDIAN_CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.state})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Corridor Center: {currentCity.lat.toFixed(4)}°N, {currentCity.lng.toFixed(4)}°E
                </span>
              </div>

              {/* Area / Locality */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Area / Locality / Sub-Market <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="area"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Bandra Kurla Complex / Koramangala / DLF Cyber City"
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-semibold"
                />
              </div>
            </div>

            {/* Quick Area Suggestion Chips */}
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground block mb-1.5">
                Popular mobility corridors in {currentCity.name}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentCity.popularAreas.map((pa) => (
                  <button
                    key={pa}
                    type="button"
                    onClick={() => handleAreaSelect(pa)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                      area === pa
                        ? 'bg-primary text-white border-primary font-bold'
                        : 'bg-surface-muted text-muted-foreground border-border hover:bg-border'
                    }`}
                  >
                    {pa}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Society / Commercial Building Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="property_title"
                  required
                  placeholder="e.g. Maker Chambers VI / Hiranandani Gardens / Shivalik Hub"
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Property Classification <span className="text-danger">*</span>
                </label>
                <select
                  name="property_type"
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="apartment_complex">Gated Residential Society</option>
                  <option value="commercial_lot">Commercial IT Park / Mall</option>
                  <option value="independent_house">Private Bungalow Driveway</option>
                  <option value="open_plot">Gated Private Open Ground</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Street Address & Access Wing <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="address_line1"
                  required
                  placeholder="e.g. Tower B, Opp. Garden Gate 3, Central Avenue"
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Postal PIN Code <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="postal_code"
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="e.g. 400051 / 110001 / 560034"
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Spot Architecture & Capacity */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2 flex items-center gap-1.5">
              <Car className="w-4 h-4" />
              <span>2. Spot Architecture & Dimensions</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Spot Identifier / Number <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="identifier"
                  required
                  placeholder="e.g. Basement Slot B-22 / Stilt S-04"
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Parking Structure Type <span className="text-danger">*</span>
                </label>
                <select
                  name="parking_type"
                  value={parkingType}
                  onChange={(e) => setParkingType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground capitalize"
                >
                  <option value="covered">Covered / Stilt (Full Sun/Rain Shade)</option>
                  <option value="basement">Underground Basement (Climate Protected)</option>
                  <option value="multi_level">Multi-Level Automated / Podium</option>
                  <option value="open">Open Surface (Gated compound)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Max Clearance Height (Meters)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1.8"
                  max="5.0"
                  name="height_limit_meters"
                  placeholder="e.g. 2.4 (Leave blank if open)"
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono"
                />
              </div>
            </div>

            {/* Public Listing Title with Admin-Managed Dropdown */}
            <div className="p-4 bg-surface-muted/50 rounded-control border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-[11px] font-semibold text-foreground">
                    Listing Title <span className="text-danger">*</span>
                  </label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Select from platform standardized titles managed by Parkbnb Admin, or customize below.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-primary font-semibold bg-primary-soft px-2 py-0.5 rounded-full">
                  Admin-Managed Dropdown
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                    Choose from standard listing title options:
                  </label>
                  <select
                    name="title_select"
                    value={isCustomTitle ? '__custom__' : selectedTitle}
                    onChange={(e) => handleTitleDropdownChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-semibold"
                  >
                    {initialTitles.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="__custom__">+ Enter custom listing title...</option>
                  </select>
                </div>

                {isCustomTitle && (
                  <div className="animate-in fade-in duration-150">
                    <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                      Custom Listing Title: <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="title_custom"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      required={isCustomTitle}
                      placeholder="e.g. Covered Basement Slot near BKC Gate 2"
                      className="w-full px-3 py-2 text-xs bg-surface border border-primary rounded-control focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-semibold"
                    />
                  </div>
                )}
              </div>
              <input
                type="hidden"
                name="title"
                value={isCustomTitle && customTitle.trim().length >= 3 ? customTitle.trim() : selectedTitle}
              />
            </div>

            {/* Vehicle Types Permitted */}
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-2">
                Eligible Vehicle Classes <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { value: 'car_sedan', label: 'Sedans (City, Verna, Ciaz)' },
                  { value: 'car_suv', label: 'Mid/Full SUVs (Creta, Fortuner)' },
                  { value: 'car_hatchback', label: 'Hatchbacks (Swift, i20)' },
                  { value: 'ev_four_wheeler', label: 'EV Cars (Nexon, ZS EV)' },
                  { value: 'two_wheeler', label: 'Motorcycles & Scooters' },
                  { value: 'ev_two_wheeler', label: 'Electric Scooters (Ola, Ather)' },
                ].map((v) => (
                  <label
                    key={v.value}
                    className="flex items-center gap-2 p-2 bg-surface-muted rounded-control border border-border hover:bg-border/40 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="vehicle_types"
                      value={v.value}
                      defaultChecked={v.value === 'car_sedan' || v.value === 'car_suv' || v.value === 'car_hatchback'}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-foreground text-[11px] font-medium">{v.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* EV Charging Socket Specification */}
            <div className="p-4 bg-surface-muted rounded-control border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${hasEv ? 'text-emerald-700' : 'text-muted-foreground'}`} />
                  <span className="text-xs font-bold text-foreground">Dedicated EV Charging Point Available</span>
                </div>
                <input
                  type="checkbox"
                  checked={hasEv}
                  onChange={(e) => setHasEv(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
              </div>

              {hasEv && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/80">
                  <div>
                    <label className="block text-[10px] font-semibold text-foreground mb-1">
                      EV Socket / Connector Type
                    </label>
                    <select
                      name="ev_charger_type"
                      className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-control text-foreground"
                    >
                      <option value="15A_3pin">Standard 15A / 16A 3-Pin Industrial AC (Slow Charge)</option>
                      <option value="type2_ac">Type-2 AC Fast Socket (7.4 kW - 22 kW)</option>
                      <option value="bharat_ac001">Bharat AC-001 Standard (3 x 3.3 kW)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-foreground mb-1">Output Power Rating (kW)</label>
                    <input
                      type="text"
                      name="ev_power_kw"
                      value={evKw}
                      onChange={(e) => setEvKw(e.target.value)}
                      placeholder="e.g. 3.3 / 7.4 / 11"
                      className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-control text-foreground font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Pricing Strategy */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4" />
              <span>3. Parking Tariff & Rates (INR ₹)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Hourly Rate (₹) <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono font-bold text-muted-foreground">₹</span>
                  <input
                    type="number"
                    name="hourly_rate"
                    required
                    min="10"
                    max="1000"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Daily Cap / 24-Hour Max (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono font-bold text-muted-foreground">₹</span>
                  <input
                    type="number"
                    name="daily_rate"
                    min="50"
                    max="5000"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Monthly Pass Rate (₹ Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono font-bold text-muted-foreground">₹</span>
                  <input
                    type="number"
                    name="monthly_rate"
                    min="500"
                    max="50000"
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Amenities & Security Checklist */}
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-foreground mb-2">Security & Facility Amenities</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'cctv', label: '24/7 CCTV Surveillance' },
                  { value: 'gated_security', label: 'Manned Security Guard' },
                  { value: 'boom_barrier', label: 'Automated Boom Barrier' },
                  { value: 'elevator', label: 'Elevator / Lift Access' },
                  { value: 'lighting', label: 'Well-Lit at Night' },
                  { value: 'valet', label: 'Valet Assistance' },
                  { value: 'wide_slot', label: 'Wide Door Clearance' },
                  { value: '24x7_access', label: '24/7 Unlimited Access' },
                ].map((f) => (
                  <label
                    key={f.value}
                    className="flex items-center gap-2 p-2 bg-surface-muted rounded-control border border-border hover:bg-border/40 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="security_features"
                      value={f.value}
                      defaultChecked={f.value === 'cctv' || f.value === 'gated_security'}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-foreground text-[10px] font-medium">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Gate Clearance Procedures & Driver Instructions */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2 flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              <span>4. Gate Entry Procedures & Driver Clearance Notes</span>
            </h2>

            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Gate Instructions for Confirmed Parkers <span className="text-danger">*</span>
              </label>
              <textarea
                name="access_instructions"
                required
                rows={3}
                placeholder="e.g. Drive to Gate 2 on MG Road. Inform security attendant of ParkBnB booking code. Take ramp down to Basement B2, slot #44 is directly opposite elevator lobby."
                className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                These instructions will strictly only be revealed to verified drivers who complete payment.
              </span>
            </div>
          </div>

          {/* Section 5: Payout Settlement & Bank Account Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>5. Payout Settlement & Banking Destination</span>
              </h2>
              {hasExistingBank && (
                <button
                  type="button"
                  onClick={() => setEditPayout(!editPayout)}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  {editPayout ? 'Use Saved Account' : 'Edit Payout Account'}
                </button>
              )}
            </div>

            {hasExistingBank && !editPayout ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-control flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 block">Verified Payout Account Configured</span>
                    <p className="text-[11px] text-emerald-800">
                      {existingProvider?.bank_name ? `${existingProvider.bank_name} • ` : ''}
                      {existingProvider?.bank_account_number
                        ? `A/C ending in ****${existingProvider.bank_account_number.slice(-4)}`
                        : ''}
                      {existingProvider?.bank_ifsc_code ? ` (IFSC: ${existingProvider.bank_ifsc_code})` : ''}
                      {existingProvider?.upi_id ? ` • UPI: ${existingProvider.upi_id}` : ''}
                    </p>
                    <span className="text-[10px] text-emerald-700">
                      Payout Route: {existingProvider?.payout_preference === 'upi' ? 'Instant UPI Payout' : 'Bank NEFT/IMPS Transfer'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditPayout(true)}
                  className="px-3 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-control font-semibold text-[11px] shadow-sm hover:bg-emerald-50"
                >
                  Change Account
                </button>
              </div>
            ) : (
              <div className="p-4 bg-surface-muted/60 border border-border rounded-control space-y-4">
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded bg-primary-soft text-primary mt-0.5">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground text-xs block">
                      To which account should Parkbnb disburse your parking earnings?
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Earnings from completed bookings are calculated server-side and automatically disbursed to your verified bank account or UPI ID.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      Account Holder Name (as per Bank Passbook)
                    </label>
                    <input
                      type="text"
                      name="bank_account_holder"
                      value={bankHolder}
                      onChange={(e) => setBankHolder(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India, HDFC Bank, ICICI Bank"
                      className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="password"
                      name="bank_account_number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter 9-18 digit account number"
                      maxLength={18}
                      className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      Confirm Bank Account Number
                    </label>
                    <input
                      type="text"
                      name="confirm_account_number"
                      value={confirmAccount}
                      onChange={(e) => setConfirmAccount(e.target.value)}
                      placeholder="Re-enter account number"
                      maxLength={18}
                      className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      Bank IFSC Code (11-characters)
                    </label>
                    <input
                      type="text"
                      name="bank_ifsc_code"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001234 / HDFC0000240"
                      maxLength={11}
                      className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono uppercase font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      UPI ID (Instant Payouts)
                    </label>
                    <input
                      type="text"
                      name="upi_id"
                      value={upi}
                      onChange={(e) => setUpi(e.target.value)}
                      placeholder="e.g. mobile@upi or username@okhdfcbank"
                      className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Preferred Payout Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutPref('bank_transfer')}
                      className={`p-2.5 rounded-control border text-left text-xs transition-all ${
                        payoutPref === 'bank_transfer'
                          ? 'border-primary bg-primary-soft text-primary font-bold'
                          : 'border-border bg-surface text-muted-foreground hover:bg-surface-muted'
                      }`}
                    >
                      <div className="font-semibold text-foreground">Direct Bank NEFT / IMPS</div>
                      <div className="text-[10px] text-muted-foreground">Standard bank account settlement</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutPref('upi')}
                      className={`p-2.5 rounded-control border text-left text-xs transition-all ${
                        payoutPref === 'upi'
                          ? 'border-primary bg-primary-soft text-primary font-bold'
                          : 'border-border bg-surface text-muted-foreground hover:bg-surface-muted'
                      }`}
                    >
                      <div className="font-semibold text-foreground">Instant UPI Settlement</div>
                      <div className="text-[10px] text-muted-foreground">Direct to VPA / Phone number</div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Legal Ownership Declaration */}
          <div className="p-4 bg-surface-muted rounded-control border border-border space-y-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-foreground">Ownership & Society Authority Affirmation</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Under ParkBnB Trust & Safety Guidelines, all parking hosts must hold lawful title, long-term lease, or society allotment rights to monetize private parking capacity.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs cursor-pointer pt-1">
              <input type="checkbox" required className="rounded border-border text-primary focus:ring-primary" />
              <span className="text-foreground text-[11px] font-semibold">
                I affirm that I am the legal owner or authorized resident of this spot with full authority to host vehicles under local society bye-laws.
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Link
              href="/host/spaces"
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface-muted rounded-control transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow transition-colors flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Submit Listing for Admin Clearance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
