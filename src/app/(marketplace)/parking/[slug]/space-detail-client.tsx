'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  ShieldCheck,
  Zap,
  Calendar,
  Clock,
  Car,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowLeft,
  Info,
  Smartphone,
  Check,
  Plus,
  Receipt,
  FileCheck2,
  ChevronRight,
  Shield
} from 'lucide-react';
import { initiateBookingHoldAction, confirmBookingPaymentAction } from '@/server/actions/booking-actions';
import {
  checkMobileIdentityAction,
  sendOtpAction,
  verifyOtpAction,
  getCustomerMemoryAction,
  saveCustomerVehicleAction
} from '@/server/actions/otp-actions';
import { ParkingSpace, CustomerVehicle, VehicleType, Profile } from '@/types/database';

export function SpaceDetailClient({ space }: { space: ParkingSpace }) {
  const router = useRouter();

  // -------------------------------------------------------------
  // 1. Public Discovery & Time Selection State (No auth required)
  // -------------------------------------------------------------
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState(todayStr);
  const [endTime, setEndTime] = useState('14:00');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car_sedan');

  // -------------------------------------------------------------
  // 2. Checkout Modal & Customer Memory State
  // -------------------------------------------------------------
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'auth_phone' | 'auth_otp' | 'customer_details' | 'select_vehicle' | 'payment' | 'confirmed'>('auth_phone');

  // Customer Authentication Memory
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerProfile, setCustomerProfile] = useState<Profile | null>(null);
  const [savedVehicles, setSavedVehicles] = useState<CustomerVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isAddingNewVehicle, setIsAddingNewVehicle] = useState(false);

  // Form Inputs for Customer
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');

  // OTP Controls
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Hold & Pricing State
  const [isHoldActive, setIsHoldActive] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [pricingSnapshot, setPricingSnapshot] = useState<{
    totalHours: number;
    baseAmount: number;
    platformFee: number;
    taxAmount: number;
    totalAmount: number;
    providerPayoutAmount: number;
  } | null>(null);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState(600); // 10 minutes

  // UI Loaders & Errors
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // 3. Live Price Calculation (Public Preview)
  // -------------------------------------------------------------
  const livePricing = useMemo(() => {
    try {
      const startMs = new Date(`${startDate}T${startTime}:00Z`).getTime();
      const endMs = new Date(`${endDate}T${endTime}:00Z`).getTime();
      if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
        return null;
      }
      const totalHours = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60)));

      let baseAmount = 0;
      if (totalHours >= 24 && space.daily_rate) {
        const days = Math.floor(totalHours / 24);
        const rem = totalHours % 24;
        baseAmount = days * space.daily_rate + rem * space.hourly_rate;
      } else {
        baseAmount = totalHours * space.hourly_rate;
      }

      const platformFee = Math.round(baseAmount * 0.15 * 100) / 100;
      const taxAmount = Math.round(platformFee * 0.18 * 100) / 100;
      const totalAmount = Math.round((baseAmount + platformFee + taxAmount) * 100) / 100;

      return { totalHours, baseAmount, platformFee, taxAmount, totalAmount };
    } catch {
      return null;
    }
  }, [startDate, startTime, endDate, endTime, space.hourly_rate, space.daily_rate]);

  // -------------------------------------------------------------
  // 4. Initial Check: Detect Authenticated Returning Customer
  // -------------------------------------------------------------
  const refreshCustomerMemory = useCallback(async () => {
    try {
      const mem = await getCustomerMemoryAction();
      if (mem.isAuthenticated && mem.profile) {
        setIsAuthenticated(true);
        setCustomerProfile(mem.profile);
        setSavedVehicles(mem.vehicles);
        if (mem.vehicles.length > 0) {
          const def = mem.vehicles.find((v) => v.is_default) || mem.vehicles[0];
          setSelectedVehicleId(def.id);
          setIsAddingNewVehicle(false);
        } else {
          setIsAddingNewVehicle(true);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    refreshCustomerMemory();
  }, [refreshCustomerMemory]);

  // -------------------------------------------------------------
  // 5. Timers (Hold Countdown & OTP Resend Cooldown)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isHoldActive) return;
    const interval = setInterval(() => {
      setHoldSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsHoldActive(false);
          setErrorMessage('Your 10-minute temporary reservation hold has expired. Please select a time slot again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isHoldActive]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);

  // -------------------------------------------------------------
  // 6. Step 2 -> Step 3 Action: Customer Clicks "Book Now"
  // -------------------------------------------------------------
  async function handleBookNowClick() {
    setErrorMessage(null);

    const startIso = `${startDate}T${startTime}:00Z`;
    const endIso = `${endDate}T${endTime}:00Z`;

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setErrorMessage('Departure time must be strictly after arrival time.');
      return;
    }

    // Check if customer already has a valid persistent session
    const mem = await getCustomerMemoryAction();
    if (mem.isAuthenticated && mem.profile) {
      setIsAuthenticated(true);
      setCustomerProfile(mem.profile);
      setSavedVehicles(mem.vehicles);

      if (mem.vehicles.length > 0) {
        const def = mem.vehicles.find((v) => v.is_default) || mem.vehicles[0];
        setSelectedVehicleId(def.id);
        setIsAddingNewVehicle(false);
      } else {
        setIsAddingNewVehicle(true);
      }

      setCheckoutStep('select_vehicle');
    } else {
      // Unauthenticated first-time or returning customer on new device
      setCheckoutStep('auth_phone');
    }

    setIsCheckoutOpen(true);
  }

  // -------------------------------------------------------------
  // 7. OTP Flow: Send Verification Code
  // -------------------------------------------------------------
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const clean = mobileNumber.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      setLoading(false);
      return;
    }

    const res = await sendOtpAction(clean);
    setLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
      if (res.cooldownSeconds) setOtpCooldown(res.cooldownSeconds);
    } else {
      setOtpCooldown(res.cooldownSeconds || 60);
      if (res.devCode) {
        setDevOtpHint(res.devCode);
      }
      setCheckoutStep('auth_otp');
    }
  }

  // -------------------------------------------------------------
  // 8. OTP Flow: Verify Code & Authenticate Session
  // -------------------------------------------------------------
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const clean = mobileNumber.replace(/\D/g, '').slice(-10);
    const res = await verifyOtpAction({
      phone: clean,
      otp: otpCode.trim(),
      customerDetails: fullNameInput.trim()
        ? { fullName: fullNameInput.trim(), email: emailInput.trim() || undefined }
        : undefined,
    });

    setLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.success && res.profile) {
      setIsAuthenticated(true);
      setCustomerProfile(res.profile);

      // Refresh smart memory vehicles
      await refreshCustomerMemory();

      if (res.isNewCustomer || !res.profile.full_name || res.profile.full_name === 'Valued Guest') {
        // Collect basic customer details (Name, optional Email, Vehicle Plate)
        setCheckoutStep('customer_details');
      } else {
        // Returning customer: proceed directly to vehicle confirmation
        setCheckoutStep('select_vehicle');
      }
    }
  }

  // -------------------------------------------------------------
  // 9. Smart Memory: Confirm Customer Details & Vehicle
  // -------------------------------------------------------------
  async function handleConfirmCustomerDetails(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullNameInput.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!newVehiclePlate.trim()) {
      setErrorMessage('Please enter your vehicle license plate (e.g. GJ 01 AB 1234).');
      return;
    }

    setLoading(true);

    // Save vehicle into customer smart memory
    const vehRes = await saveCustomerVehicleAction({
      vehicleType,
      registrationNumber: newVehiclePlate.trim().toUpperCase(),
      isDefault: true,
    });

    setLoading(false);

    if (vehRes.error) {
      setErrorMessage(vehRes.error);
      return;
    }

    if (vehRes.vehicle) {
      setSelectedVehicleId(vehRes.vehicle.id);
      await refreshCustomerMemory();
      // Lock temporary reservation hold
      await executeBookingHold(vehRes.vehicle.id);
    }
  }

  // -------------------------------------------------------------
  // 10. Concurrency Hold: Lock 10-Minute Hold
  // -------------------------------------------------------------
  async function executeBookingHold(vehicleIdToUse?: string) {
    setErrorMessage(null);
    setLoading(true);

    const startIso = `${startDate}T${startTime}:00Z`;
    const endIso = `${endDate}T${endTime}:00Z`;

    const vId = vehicleIdToUse || selectedVehicleId;
    let params: {
      spaceId: string;
      vehicleId?: string;
      vehiclePlate?: string;
      vehicleType?: VehicleType;
      startTime: string;
      endTime: string;
    };

    if (isAddingNewVehicle && newVehiclePlate.trim()) {
      params = {
        spaceId: space.id,
        vehiclePlate: newVehiclePlate.trim().toUpperCase(),
        vehicleType,
        startTime: startIso,
        endTime: endIso,
      };
    } else {
      params = {
        spaceId: space.id,
        vehicleId: vId,
        startTime: startIso,
        endTime: endIso,
      };
    }

    const result = await initiateBookingHoldAction(params);
    setLoading(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else if (result.success && result.bookingId && result.pricing) {
      setBookingId(result.bookingId);
      setBookingRef(result.bookingRef || 'PKB-NEW');
      setPricingSnapshot(result.pricing);
      setIsHoldActive(true);
      setHoldSecondsRemaining(600); // 10 minutes
      setCheckoutStep('payment');
    }
  }

  // -------------------------------------------------------------
  // 11. Payment: Confirm Verified Booking
  // -------------------------------------------------------------
  async function handleConfirmPayment() {
    if (!bookingId) return;
    setPaymentProcessing(true);
    setErrorMessage(null);

    const paymentId = 'pay_' + Math.random().toString(36).substring(2, 12);
    const result = await confirmBookingPaymentAction({
      bookingId,
      paymentId,
      orderId: 'order_' + Math.random().toString(36).substring(2, 10),
    });

    setPaymentProcessing(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      setIsHoldActive(false);
      setCheckoutStep('confirmed');
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link href="/search" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Search Results
        </Link>
      </div>

      {/* Main Grid: Gallery & Info + Public Selection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Photos, Description, Specifications, Rules */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Photo Gallery */}
          <div className="rounded-card overflow-hidden h-72 sm:h-96 bg-surface-muted relative border border-border shadow-sm">
            {space.photos && space.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={space.photos[0].storage_path}
                alt={space.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Car className="w-16 h-16 stroke-1" />
              </div>
            )}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-control text-sm font-extrabold text-foreground shadow-sm">
              ₹{space.hourly_rate} / hour
            </div>
            {space.has_ev_charging && (
              <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1 rounded-control text-xs font-semibold flex items-center gap-1 shadow-sm">
                <Zap className="w-3.5 h-3.5" /> EV Charging Ready
              </div>
            )}
          </div>

          {/* Title & Location Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <MapPin className="w-4 h-4" />
              <span>{space.property?.area}, Ahmedabad</span>
              <span className="text-muted-foreground">• {space.property?.postal_code}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{space.title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{space.description}</p>
          </div>

          {/* Specifications Card */}
          <div className="bg-surface rounded-card p-6 border border-border space-y-4">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Spot Specifications</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-surface-muted rounded-control space-y-1">
                <span className="text-muted-foreground block text-[11px]">Parking Type</span>
                <span className="font-bold text-foreground capitalize">{space.parking_type}</span>
              </div>
              <div className="p-3 bg-surface-muted rounded-control space-y-1">
                <span className="text-muted-foreground block text-[11px]">Identifier</span>
                <span className="font-bold text-foreground">{space.identifier}</span>
              </div>
              <div className="p-3 bg-surface-muted rounded-control space-y-1">
                <span className="text-muted-foreground block text-[11px]">Max Height</span>
                <span className="font-bold text-foreground">{space.height_limit_meters || 'No limit'} m</span>
              </div>
              <div className="p-3 bg-surface-muted rounded-control space-y-1">
                <span className="text-muted-foreground block text-[11px]">Daily Rate</span>
                <span className="font-bold text-foreground">₹{space.daily_rate || space.hourly_rate * 8}</span>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-surface rounded-card p-6 border border-border space-y-3">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Verified Security Amenities</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {space.security_features.map((feat) => (
                <span
                  key={feat}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-800 font-medium rounded-full flex items-center gap-1.5 border border-emerald-200"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="capitalize">{feat.replace(/_/g, ' ')}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Policy & Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface rounded-card p-4 border border-border space-y-2 text-xs">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-primary" />
                <span>Cancellation Policy</span>
              </div>
              <p className="text-muted-foreground">
                Free cancellation with 100% refund up to 2 hours before your scheduled arrival time.
              </p>
            </div>

            <div className="bg-surface rounded-card p-4 border border-border space-y-2 text-xs">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-primary" />
                <span>Gate Pass & Access Directions</span>
              </div>
              <p className="text-muted-foreground">
                Exact security PIN and direct host contact are generated on your pass immediately upon confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Public Booking Selection (Phase 1, Step 2) */}
        <div className="lg:col-span-4">
          <div className="bg-surface rounded-card border border-border p-6 shadow-card sticky top-24 space-y-5">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-foreground">₹{space.hourly_rate}</span>
                <span className="text-xs text-muted-foreground"> / hour</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Instant Confirmation
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-danger rounded-control text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Arrival */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">Arrival Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    min={todayStr}
                    className="w-full px-2.5 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">Arrival Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              {/* Departure */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">Departure Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    min={startDate}
                    className="w-full px-2.5 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">Departure Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              {/* Vehicle Type Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="w-full px-2.5 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="car_sedan">Sedan (GJ / Other)</option>
                  <option value="car_suv">SUV / MUV</option>
                  <option value="car_hatchback">Hatchback</option>
                  <option value="two_wheeler">Two-Wheeler / Scooter</option>
                  <option value="ev_four_wheeler">Electric Car (EV)</option>
                </select>
              </div>

              {/* Live Price Estimation */}
              {livePricing && (
                <div className="border border-border rounded-control p-3 space-y-1.5 text-xs bg-surface-muted">
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Parking Rate ({livePricing.totalHours} hr{livePricing.totalHours > 1 ? 's' : ''} × ₹{space.hourly_rate})</span>
                    <span className="font-mono text-foreground">₹{livePricing.baseAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Convenience Fee (15%)</span>
                    <span className="font-mono text-foreground">₹{livePricing.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>GST (18%)</span>
                    <span className="font-mono text-foreground">₹{livePricing.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-1.5 flex justify-between font-bold text-sm text-foreground">
                    <span>Estimated Total</span>
                    <span className="font-mono text-primary font-black">₹{livePricing.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Clear Book Now Action */}
              <button
                type="button"
                onClick={handleBookNowClick}
                disabled={space.status !== 'approved' || !space.is_active}
                className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-control shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>Book Now</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1 pt-1">
                <Lock className="w-3 h-3 text-muted-foreground" /> No pre-registration needed to check slots
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CHECKOUT MODAL: FRICTIONLESS CUSTOMER JOURNEY & OTP MODAL     */}
      {/* ------------------------------------------------------------- */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-border shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {checkoutStep === 'payment'
                    ? '10-Minute Hold Locked'
                    : checkoutStep === 'confirmed'
                    ? 'Booking Confirmed'
                    : isAuthenticated
                    ? 'Returning Customer'
                    : '1-Step Verification'}
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {checkoutStep === 'payment'
                    ? 'Review & Confirm Reservation'
                    : checkoutStep === 'confirmed'
                    ? 'Your Parking Pass Is Ready'
                    : isAuthenticated
                    ? 'Confirm Vehicle & Hold Spot'
                    : 'Enter Mobile Number to Book'}
                </h3>
              </div>

              {/* Hold timer pill if hold is active */}
              {isHoldActive && (
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-danger bg-red-50 px-2 py-0.5 rounded-control inline-block">
                    {Math.floor(holdSecondsRemaining / 60)}:
                    {(holdSecondsRemaining % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Hold expires</div>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-danger rounded-control text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Dev OTP Helper Badge (for quick testing) */}
            {devOtpHint && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-control text-xs flex items-center justify-between">
                <span>Test Verification Code: <strong className="font-mono text-sm">{devOtpHint}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtpCode(devOtpHint)}
                  className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-semibold"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SUB-STEP A: MOBILE NUMBER INPUT (Phase 1, Step 3)             */}
            {/* ------------------------------------------------------------- */}
            {checkoutStep === 'auth_phone' && (
              <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-control text-emerald-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="block font-semibold">One-Time Verification</strong>
                    Verify your mobile number once. You will stay remembered and never need OTP for future bookings.
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Mobile Number (10 digits)
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-xs font-semibold text-muted-foreground bg-surface-muted border border-r-0 border-border rounded-l-control">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      maxLength={10}
                      required
                      autoFocus
                      className="w-full px-3 py-2 text-sm font-mono bg-surface-muted border border-border rounded-r-control focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="w-1/3 py-2 px-3 border border-border text-foreground font-semibold rounded-control hover:bg-surface-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || mobileNumber.length < 10}
                    className="w-2/3 py-2 px-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-control shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Verification Code</span>}
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SUB-STEP B: 6-DIGIT OTP VERIFICATION                         */}
            {/* ------------------------------------------------------------- */}
            {checkoutStep === 'auth_otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
                <div className="p-3 bg-surface-muted rounded-control space-y-1">
                  <div className="text-muted-foreground">Code sent to:</div>
                  <div className="font-mono font-bold text-foreground text-sm">
                    +91 {mobileNumber.slice(0, 2)}••••••{mobileNumber.slice(-2)}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    required
                    autoFocus
                    className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-bold"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Didn&apos;t receive code?</span>
                  {otpCooldown > 0 ? (
                    <span className="font-mono text-primary">Resend in {otpCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-primary font-bold hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('auth_phone')}
                    className="w-1/3 py-2 px-3 border border-border text-foreground font-semibold rounded-control hover:bg-surface-muted"
                  >
                    Change Number
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 6}
                    className="w-2/3 py-2 px-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-control shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify Code & Continue</span>}
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SUB-STEP C: SMART CUSTOMER INFORMATION COLLECTION             */}
            {/* ------------------------------------------------------------- */}
            {checkoutStep === 'customer_details' && (
              <form onSubmit={handleConfirmCustomerDetails} className="space-y-4 text-xs">
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-control flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="block font-semibold">Mobile Verified!</strong>
                    Tell us your name and vehicle plate once to complete your booking.
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    required
                    autoFocus
                    className="w-full px-3 py-1.5 bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Email Address <span className="text-muted-foreground font-normal">(Optional, for PDF receipts)</span>
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="rajesh@example.com"
                    className="w-full px-3 py-1.5 bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Vehicle License Plate <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={newVehiclePlate}
                    onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="e.g. GJ 01 AB 1234"
                    required
                    className="w-full px-3 py-1.5 bg-surface-muted border border-border rounded-control uppercase font-mono font-bold focus:outline-none focus:border-primary text-foreground"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="w-1/3 py-2 px-3 border border-border text-foreground font-semibold rounded-control hover:bg-surface-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-2 px-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-control shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Lock Hold & Continue</span>}
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SUB-STEP D: RETURNING CUSTOMER VEHICLE SELECTION (Phase 5)    */}
            {/* ------------------------------------------------------------- */}
            {checkoutStep === 'select_vehicle' && (
              <div className="space-y-4 text-xs">
                {/* Greeting & Auto-Recognized Customer */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-control text-emerald-900 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block">Verified Session</span>
                    <strong className="text-sm font-bold text-foreground">
                      {customerProfile?.full_name || 'Driver'}
                    </strong>
                    <span className="text-muted-foreground text-[11px] ml-1.5">
                      (+91 {customerProfile?.phone})
                    </span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>

                {/* Saved Vehicles Radio Selection */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider">
                    Select Vehicle for Access Pass
                  </label>

                  {savedVehicles.length > 0 && !isAddingNewVehicle && (
                    <div className="space-y-2">
                      {savedVehicles.map((v) => (
                        <label
                          key={v.id}
                          className={`p-3 rounded-control border flex items-center justify-between cursor-pointer transition-all ${
                            selectedVehicleId === v.id
                              ? 'border-primary bg-primary-soft/50 ring-1 ring-primary'
                              : 'border-border bg-surface hover:bg-surface-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="customer_vehicle"
                              value={v.id}
                              checked={selectedVehicleId === v.id}
                              onChange={() => setSelectedVehicleId(v.id)}
                              className="text-primary focus:ring-primary"
                            />
                            <div>
                              <span className="font-mono font-bold text-foreground">{v.registration_number}</span>
                              <span className="text-muted-foreground ml-2 capitalize text-[11px]">
                                ({v.vehicle_type.replace(/_/g, ' ')})
                              </span>
                            </div>
                          </div>
                          {v.is_default && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Default
                            </span>
                          )}
                        </label>
                      ))}

                      <button
                        type="button"
                        onClick={() => setIsAddingNewVehicle(true)}
                        className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New Vehicle
                      </button>
                    </div>
                  )}

                  {/* Add New Vehicle Form if selected or no vehicles */}
                  {(isAddingNewVehicle || savedVehicles.length === 0) && (
                    <div className="p-3 border border-border rounded-control bg-surface-muted space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground mb-1">
                          License Plate Number
                        </label>
                        <input
                          type="text"
                          value={newVehiclePlate}
                          onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
                          placeholder="e.g. GJ 01 AB 1234"
                          className="w-full px-3 py-1.5 bg-surface border border-border rounded-control uppercase font-mono font-bold focus:outline-none focus:border-primary text-foreground"
                        />
                      </div>

                      {savedVehicles.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsAddingNewVehicle(false)}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          Use a previously saved vehicle
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="w-1/3 py-2 px-3 border border-border text-foreground font-semibold rounded-control hover:bg-surface-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => executeBookingHold()}
                    disabled={loading || (!selectedVehicleId && !newVehiclePlate.trim())}
                    className="w-2/3 py-2 px-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-control shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Lock 10-Min Hold & Continue</span>}
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SUB-STEP E: 10-MINUTE HOLD & PAYMENT CONFIRMATION             */}
            {/* ------------------------------------------------------------- */}
            {checkoutStep === 'payment' && pricingSnapshot && (
              <div className="space-y-4 text-xs">
                {/* Hold Summary Card */}
                <div className="p-3 bg-surface-muted rounded-control space-y-1">
                  <div className="font-semibold text-foreground">{space.title}</div>
                  <div className="text-muted-foreground">
                    {space.property?.area} • Slot {space.identifier}
                  </div>
                  <div className="text-primary font-medium">
                    Duration: {pricingSnapshot.totalHours} hr{pricingSnapshot.totalHours > 1 ? 's' : ''} ({startDate} {startTime} - {endDate} {endTime})
                  </div>
                </div>

                {/* Itemized Financial Breakdown */}
                <div className="border border-border rounded-control p-3 space-y-2 bg-surface">
                  <div className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                    Price Breakdown
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Parking Slot ({pricingSnapshot.totalHours} hrs × ₹{space.hourly_rate})</span>
                    <span className="font-mono text-foreground">₹{pricingSnapshot.baseAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Platform Convenience Fee (15%)</span>
                    <span className="font-mono text-foreground">₹{pricingSnapshot.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST on Convenience Fee (18%)</span>
                    <span className="font-mono text-foreground">₹{pricingSnapshot.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-bold text-sm text-foreground">
                    <span>Total Amount Payable</span>
                    <span className="font-mono text-primary font-black">
                      ₹{pricingSnapshot.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Razorpay / UPI Payment Action */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={paymentProcessing}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-control shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {paymentProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Pay ₹{pricingSnapshot.totalAmount.toFixed(2)} via Razorpay / UPI</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsHoldActive(false);
                      setIsCheckoutOpen(false);
                    }}
                    className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
                  >
                    Cancel Hold & Return
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SUB-STEP F: CONFIRMED BOOKING PASS                            */}
            {/* ------------------------------------------------------------- */}
            {checkoutStep === 'confirmed' && (
              <div className="space-y-4 text-xs text-center py-2 animate-in zoom-in-95">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>

                <div>
                  <h4 className="text-base font-bold text-foreground">Booking Confirmed!</h4>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Your parking slot is securely reserved. Present your clearance reference at the gate.
                  </p>
                </div>

                <div className="p-3 bg-surface-muted rounded-control font-mono font-bold text-sm text-primary">
                  {bookingRef || 'PKB-CONFIRMED'}
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-control text-left text-[11px] space-y-1">
                  <strong className="block font-semibold">Access PIN & Clearance Directions:</strong>
                  <p>{space.access_instructions || 'Show your booking reference at the gate barrier.'}</p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href={`/account/bookings/${bookingId}`}
                    className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-control shadow text-xs flex items-center justify-center gap-1.5"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>View Access Pass & Receipt</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      router.push('/search');
                    }}
                    className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
                  >
                    Find Another Parking Space
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
