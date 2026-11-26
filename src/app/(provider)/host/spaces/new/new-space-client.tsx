'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSpaceAction } from '@/server/actions/space-actions';
import { INDIAN_CITIES } from '@/lib/constants/cities';
import { resolvePincode, parseGoogleMapsUrl, isValidPincode } from '@/lib/location/pincode-directory';
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
  Camera,
  Upload,
  Plus,
  Trash2,
  Navigation,
  Compass,
  Star,
  ExternalLink,
  Sparkles,
  Search
} from 'lucide-react';

interface NewSpaceClientProps {
  initialTitles: string[];
  existingProvider?: ProviderProfile;
  userFullName: string;
}

interface UploadedPhotoItem {
  id: string;
  url: string;
  is_primary: boolean;
  name?: string;
}

const PRESET_PARKING_PHOTOS = [
  {
    title: 'Covered Basement Slot',
    url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Gated Residential Stilt Bay',
    url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Commercial Podium Parking',
    url: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Automated Multi-Level Bay',
    url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
  },
];

export function NewSpaceClient({
  initialTitles,
  existingProvider,
  userFullName,
}: NewSpaceClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Location & Address State (Zero-Google-API Postal Engine)
  // -------------------------------------------------------------
  const [postalCode, setPostalCode] = useState('380015');
  const [isResolvingPin, setIsResolvingPin] = useState(false);
  const [pinDetails, setPinDetails] = useState<{
    city?: string;
    state?: string;
    district?: string;
    localities?: string[];
    source?: string;
  } | null>({
    city: 'Ahmedabad',
    state: 'Gujarat',
    district: 'Ahmedabad',
    localities: ['Bodakdev', 'Satellite', 'Vastrapur', 'SG Highway', 'ISCON'],
    source: 'offline_directory',
  });

  const [selectedCityId, setSelectedCityId] = useState('ahmedabad');
  const [area, setArea] = useState('Bodakdev');
  const [propertyTitle, setPropertyTitle] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [landmark, setLandmark] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [mapsValidation, setMapsValidation] = useState<{
    isValid: boolean;
    message?: string;
  } | null>(null);

  const [latitude, setLatitude] = useState(23.0338);
  const [longitude, setLongitude] = useState(72.5150);

  // -------------------------------------------------------------
  // Spot Architecture & Amenities
  // -------------------------------------------------------------
  const [hasEv, setHasEv] = useState(false);
  const [evKw, setEvKw] = useState('7.4');
  const [parkingType, setParkingType] = useState('covered');
  const [hourlyRate, setHourlyRate] = useState('50');
  const [dailyRate, setDailyRate] = useState('380');
  const [monthlyRate, setMonthlyRate] = useState('5500');

  // Listing Title state
  const [selectedTitle, setSelectedTitle] = useState(initialTitles[0] || 'Covered Reserved Parking Bay');
  const [customTitle, setCustomTitle] = useState('');
  const [isCustomTitle, setIsCustomTitle] = useState(false);

  // -------------------------------------------------------------
  // Photos State (Multiple photo upload + preview + primary cover)
  // -------------------------------------------------------------
  const [photos, setPhotos] = useState<UploadedPhotoItem[]>([
    {
      id: 'default-cover',
      url: PRESET_PARKING_PHOTOS[0].url,
      is_primary: true,
      name: PRESET_PARKING_PHOTOS[0].title,
    },
  ]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [manualPhotoUrl, setManualPhotoUrl] = useState('');

  // -------------------------------------------------------------
  // Payout Details State
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Instant PIN Code Auto-Fetch
  // -------------------------------------------------------------
  async function handlePostalCodeChange(val: string) {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPostalCode(clean);

    if (clean.length === 6 && isValidPincode(clean)) {
      setIsResolvingPin(true);
      try {
        const res = await resolvePincode(clean);
        if (res.valid) {
          setPinDetails(res);
          if (res.latitude && res.longitude) {
            setLatitude(res.latitude);
            setLongitude(res.longitude);
          }
          if (res.localities && res.localities.length > 0) {
            setArea(res.localities[0]);
          }

          // Match city
          const matched = INDIAN_CITIES.find(
            c => c.name.toLowerCase() === res.city.toLowerCase() ||
                 c.name.toLowerCase() === res.district.toLowerCase() ||
                 res.district.toLowerCase().includes(c.name.toLowerCase()) ||
                 c.name.toLowerCase().includes(res.city.toLowerCase())
          );
          if (matched) {
            setSelectedCityId(matched.id);
          }
        }
      } catch (err) {
        console.warn('Pincode resolution error:', err);
      } finally {
        setIsResolvingPin(false);
      }
    } else {
      setPinDetails(null);
    }
  }

  // -------------------------------------------------------------
  // Live Google Maps Link Validation
  // -------------------------------------------------------------
  function handleGoogleMapsLinkChange(val: string) {
    setGoogleMapsLink(val);
    if (!val.trim()) {
      setMapsValidation(null);
      return;
    }

    const res = parseGoogleMapsUrl(val);
    if (res.isValid) {
      if (res.latitude && res.longitude) {
        setLatitude(res.latitude);
        setLongitude(res.longitude);
        setMapsValidation({
          isValid: true,
          message: `✓ Valid Google Maps Pin (GPS: ${res.latitude.toFixed(4)}°N, ${res.longitude.toFixed(4)}°E)`,
        });
      } else {
        setMapsValidation({
          isValid: true,
          message: '✓ Valid Google Maps link (Drivers can tap to navigate)',
        });
      }
    } else {
      setMapsValidation({
        isValid: false,
        message: res.errorMessage || 'Please enter a valid Google Maps URL',
      });
    }
  }

  // -------------------------------------------------------------
  // Photo Upload Handler (Files -> /api/upload)
  // -------------------------------------------------------------
  async function handlePhotoFilesUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploadingPhoto(true);
    setUploadError(null);

    try {
      const newItems: UploadedPhotoItem[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const fd = new FormData();
        fd.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: fd,
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to upload image file.');
        }

        if (data.url) {
          newItems.push({
            id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            url: data.url,
            is_primary: photos.length === 0 && newItems.length === 0,
            name: file.name,
          });
        }
      }

      setPhotos(prev => [...prev, ...newItems]);
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  }

  function handleAddPresetPhoto(preset: { title: string; url: string }) {
    if (photos.some(p => p.url === preset.url)) return;
    setPhotos(prev => [
      ...prev,
      {
        id: `preset-${Date.now()}`,
        url: preset.url,
        is_primary: prev.length === 0,
        name: preset.title,
      },
    ]);
  }

  function handleAddManualPhotoUrl() {
    if (!manualPhotoUrl.trim()) return;
    const cleanUrl = manualPhotoUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setUploadError('Photo URL must begin with http:// or https://');
      return;
    }

    setPhotos(prev => [
      ...prev,
      {
        id: `url-${Date.now()}`,
        url: cleanUrl,
        is_primary: prev.length === 0,
        name: 'Custom Photo Link',
      },
    ]);
    setManualPhotoUrl('');
    setUploadError(null);
  }

  function handleSetPrimaryPhoto(id: string) {
    setPhotos(prev =>
      prev.map(p => ({
        ...p,
        is_primary: p.id === id,
      }))
    );
  }

  function handleRemovePhoto(id: string) {
    setPhotos(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (filtered.length > 0 && !filtered.some(p => p.is_primary)) {
        filtered[0].is_primary = true;
      }
      return filtered;
    });
  }

  function handleCityChange(cityId: string) {
    setSelectedCityId(cityId);
    const city = INDIAN_CITIES.find(c => c.id === cityId);
    if (city) {
      setArea(city.popularAreas[0] || '');
      setLatitude(city.lat);
      setLongitude(city.lng);
    }
  }

  function handleTitleDropdownChange(val: string) {
    if (val === '__custom__') {
      setIsCustomTitle(true);
    } else {
      setIsCustomTitle(false);
      setSelectedTitle(val);
    }
  }

  // -------------------------------------------------------------
  // Submission
  // -------------------------------------------------------------
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validation checks
    if (!postalCode || postalCode.length !== 6) {
      setError('Please provide a valid 6-digit Indian PIN Code.');
      return;
    }

    if (!landmark || landmark.trim().length < 3) {
      setError('Please provide a nearby landmark (at least 3 characters) so drivers can easily navigate to your parking spot.');
      return;
    }

    if (photos.length === 0) {
      setError('Please upload or select at least one photo of your parking space for drivers to verify.');
      return;
    }

    if (googleMapsLink.trim()) {
      const parsed = parseGoogleMapsUrl(googleMapsLink.trim());
      if (!parsed.isValid) {
        setError(parsed.errorMessage || 'Please provide a valid Google Maps link.');
        return;
      }
    }

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
    formData.set('area', area.trim());
    formData.set('postal_code', postalCode.trim());
    formData.set('address_line1', addressLine1.trim());
    formData.set('landmark', landmark.trim());
    formData.set('google_maps_link', googleMapsLink.trim());
    formData.set('latitude', latitude.toString());
    formData.set('longitude', longitude.toString());
    formData.set('has_ev_charging', hasEv.toString());

    // Serialize photos
    formData.set(
      'photos_json',
      JSON.stringify(
        photos.map(p => ({
          storage_path: p.url,
          is_primary: p.is_primary,
        }))
      )
    );

    // Resolve final listing title
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
            <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary-soft px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> High-Accuracy Location Onboarding
            </span>
            <span className="text-xs text-muted-foreground font-mono">India Post Verified</span>
          </div>
          <h1 className="text-2xl font-black text-foreground mt-1.5">List a Verified Parking Space</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Provide your exact parking location, nearby landmarks, and photos so verified drivers find your spot with zero confusion.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-danger rounded-control text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ========================================================= */}
          {/* SECTION 1: HIGH-ACCURACY POSTAL LOCATION & LANDMARK       */}
          {/* ========================================================= */}
          <div className="space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>1. Verified Postal Location & Exact Gate Navigation</span>
              </h2>
              <span className="text-[10px] font-mono text-muted-foreground">No Paid Maps API Required</span>
            </div>

            {/* PIN Code Lookup Box */}
            <div className="p-4 bg-primary-soft/30 rounded-control border border-primary/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-foreground">
                    Indian Postal PIN Code <span className="text-danger">*</span>
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    Enter your 6-digit PIN code. Our system automatically resolves your city, state, and nearby localities.
                  </p>
                </div>
                {isResolvingPin && (
                  <div className="flex items-center gap-1 text-[11px] text-primary font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Resolving postal directory...</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      name="postal_code"
                      required
                      value={postalCode}
                      onChange={(e) => handlePostalCodeChange(e.target.value)}
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="e.g. 380015 / 400051"
                      className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono font-bold tracking-wider"
                    />
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-2.5" />
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-center">
                  {pinDetails ? (
                    <div className="text-[11px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-control flex items-center gap-1.5 w-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>
                        <strong>Postal Hub:</strong> {pinDetails.district || pinDetails.city}, {pinDetails.state}
                        <span className="text-muted-foreground ml-1 font-mono text-[10px]">
                          ({latitude.toFixed(3)}°N, {longitude.toFixed(3)}°E)
                        </span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">
                      Type 6-digit PIN code to auto-populate area & coordinates.
                    </span>
                  )}
                </div>
              </div>

              {/* Localities suggestions under this PIN code */}
              {pinDetails?.localities && pinDetails.localities.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] font-semibold text-muted-foreground block mb-1">
                    Select your locality under PIN {postalCode}:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {pinDetails.localities.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setArea(loc)}
                        className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-colors ${
                          area === loc
                            ? 'bg-primary text-white border-primary font-bold'
                            : 'bg-surface text-muted-foreground border-border hover:bg-surface-muted'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* City & Area Select */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

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
                  placeholder="e.g. Bodakdev / BKC / Koramangala / DLF Cyber City"
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-semibold"
                />
              </div>
            </div>

            {/* Building & Address Line 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Society / Complex / Commercial Building Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="property_title"
                  required
                  value={propertyTitle}
                  onChange={(e) => setPropertyTitle(e.target.value)}
                  placeholder="e.g. Shivalik Shilp Commercial / Hiranandani Gardens / Godrej Garden City"
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-semibold"
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

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Street Address & Access Wing <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="address_line1"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="e.g. Tower B, Flat 402, Near Gate 1, SG Highway / Main Ring Road"
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                />
              </div>
            </div>

            {/* MANDATORY LANDMARK & NEARBY ADDRESS DETAILS */}
            <div className="p-4 bg-amber-500/10 rounded-control border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nearby Landmark / Visual Location Cue <span className="text-danger">*</span></span>
                </label>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Mandatory For Drivers
                </span>
              </div>
              <input
                type="text"
                name="landmark"
                required
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Opposite Rajpath Club, Behind Iscon Mega Mall, Next to SBI ATM, Near Metro Pillar 124"
                className="w-full px-3 py-2 text-xs bg-surface border border-amber-300 rounded-control focus:outline-none focus:border-amber-600 text-foreground font-semibold"
              />
              <p className="text-[10px] text-muted-foreground leading-normal">
                Drivers frequently rely on physical landmarks in Indian cities. This cue will be prominently highlighted on the driver&apos;s digital booking pass.
              </p>
            </div>

            {/* GOOGLE MAPS LINK WITH 1-TAP NAVIGATION */}
            <div className="p-4 bg-blue-50/50 rounded-control border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Maps Pin Link (Recommended)</span>
                </label>
                <span className="text-[10px] font-mono text-blue-700 font-semibold">1-Tap Driver Navigation</span>
              </div>
              <input
                type="url"
                name="google_maps_link"
                value={googleMapsLink}
                onChange={(e) => handleGoogleMapsLinkChange(e.target.value)}
                placeholder="e.g. https://maps.app.goo.gl/... or https://goo.gl/maps/..."
                className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-blue-600 text-foreground font-mono text-[11px]"
              />
              {mapsValidation && (
                <div
                  className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                    mapsValidation.isValid ? 'text-emerald-700' : 'text-danger'
                  }`}
                >
                  {mapsValidation.isValid ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-danger" />
                  )}
                  <span>{mapsValidation.message}</span>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground leading-normal">
                Open Google Maps on your phone, drop a pin at your parking entrance gate, tap <strong>Share</strong>, and paste the link here. If left blank, Parkbnb will automatically build an accurate Google Maps navigation query from your verified address and landmark.
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 2: SPOT PHOTOS & VISUAL DRIVER GUIDE             */}
          {/* ========================================================= */}
          <div className="space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                <span>2. Parking Photos & Visual Verification Gallery</span>
              </h2>
              <span className="text-[10px] font-mono text-muted-foreground">{photos.length} Photo(s) Attached</span>
            </div>

            {uploadError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-danger rounded-control text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Photo Uploader Card */}
            <div className="p-4 bg-surface-muted/60 rounded-control border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-foreground">Upload Photos from Device or Camera</div>
                  <p className="text-[10px] text-muted-foreground">
                    Upload clear photos of the parking slot, entrance gate, and driveway (JPG, PNG, WebP up to 8MB).
                  </p>
                </div>

                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-bold cursor-pointer transition-colors shadow-sm shrink-0">
                  {isUploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{isUploadingPhoto ? 'Uploading...' : 'Choose Photo Files'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={isUploadingPhoto}
                    onChange={handlePhotoFilesUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Photo Previews Grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {photos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className={`relative group rounded-card overflow-hidden border-2 bg-surface shadow-sm ${
                        photo.is_primary ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.name || `Parking photo ${idx + 1}`}
                        className="w-full h-28 object-cover"
                      />
                      {photo.is_primary ? (
                        <div className="absolute top-1.5 left-1.5 bg-primary text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-white" /> Cover Photo
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryPhoto(photo.id)}
                          className="absolute top-1.5 left-1.5 bg-black/70 hover:bg-primary text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow opacity-90 hover:opacity-100 transition-all"
                        >
                          Make Cover
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="absolute top-1.5 right-1.5 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-full shadow transition-all"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <div className="p-1.5 text-[10px] text-muted-foreground truncate bg-surface">
                        {photo.name || `Photo #${idx + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Presets or Direct Image URL Option */}
              <div className="pt-3 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Or select from verified parking presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_PARKING_PHOTOS.map((preset) => (
                      <button
                        key={preset.title}
                        type="button"
                        onClick={() => handleAddPresetPhoto(preset)}
                        className="text-[10px] px-2.5 py-1 bg-surface border border-border hover:border-primary text-foreground rounded-control transition-colors"
                      >
                        + {preset.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:w-1/2">
                  <input
                    type="url"
                    value={manualPhotoUrl}
                    onChange={(e) => setManualPhotoUrl(e.target.value)}
                    placeholder="Or paste direct image URL (https://...)"
                    className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualPhotoUrl}
                    className="px-3 py-1.5 bg-surface-muted hover:bg-border border border-border rounded-control font-bold text-[11px] text-foreground shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 3: SPOT ARCHITECTURE & DIMENSIONS                 */}
          {/* ========================================================= */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2 flex items-center gap-1.5">
              <Car className="w-4 h-4" />
              <span>3. Spot Architecture & Dimensions</span>
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
                    Select from standardized titles or enter your own custom title.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-primary font-semibold bg-primary-soft px-2 py-0.5 rounded-full">
                  Standardized Format
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

          {/* ========================================================= */}
          {/* SECTION 4: PRICING TARIFF (INR ₹)                          */}
          {/* ========================================================= */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4" />
              <span>4. Parking Tariff & Rates (INR ₹)</span>
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

          {/* ========================================================= */}
          {/* SECTION 5: GATE PROCEDURES & DRIVER INSTRUCTIONS          */}
          {/* ========================================================= */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2 flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              <span>5. Gate Entry Procedures & Driver Instructions</span>
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

          {/* ========================================================= */}
          {/* SECTION 6: PAYOUT SETTLEMENT & BANKING DESTINATION        */}
          {/* ========================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>6. Payout Settlement & Banking Destination</span>
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

          {/* ========================================================= */}
          {/* SECTION 7: LEGAL DECLARATION & SUBMISSION                */}
          {/* ========================================================= */}
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
              disabled={loading || isUploadingPhoto}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
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
