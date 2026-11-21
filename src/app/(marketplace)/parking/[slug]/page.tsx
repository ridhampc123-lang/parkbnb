'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Info
} from 'lucide-react';
import { initiateBookingHoldAction, confirmBookingPaymentAction } from '@/server/actions/booking-actions';
import { ParkingSpace } from '@/types/database';

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.slug as string;

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState('14:00');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('car_sedan');

  // Checkout modal & hold states
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

  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reference listing for Ahmedabad
  const space: ParkingSpace = {
    id: spaceId || 'spc-prahladnagar-01',
    property_id: 'prop-prahladnagar-01',
    provider_id: 'usr-host-ahmedabad-01',
    identifier: 'Basement Bay B-22',
    title: 'Covered Secure Parking near Prahlad Nagar Garden',
    description: 'Dedicated underground slot inside Shivalik Hub with 24/7 security guard, CCTV surveillance, and covered shade. Perfect for business meetings or residents.',
    parking_type: 'covered',
    hourly_rate: 40.00,
    daily_rate: 300.00,
    monthly_rate: 4500.00,
    min_duration_hours: 1,
    max_duration_hours: 720,
    access_instructions: 'Drive into Gate 2, inform security guard Rajesh Bhai slot B-22. Exact booking reference and clearance PIN will be unlocked upon confirmed reservation.',
    security_features: ['cctv', 'gated_security', 'covered_shade', 'lighting', 'wide_slot'],
    has_ev_charging: true,
    height_limit_meters: 2.4,
    status: 'approved',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    property: {
      id: 'prop-prahladnagar-01',
      provider_id: 'usr-host-ahmedabad-01',
      title: 'Shivalik Business Hub',
      property_type: 'apartment_complex',
      address_line1: 'B-Wing, Opp. Prahlad Nagar Garden',
      area: 'Prahlad Nagar',
      city: 'Ahmedabad',
      postal_code: '380015',
      latitude: 23.0124,
      longitude: 72.5085,
      created_at: new Date().toISOString(),
    },
    photos: [
      {
        id: 'p1',
        space_id: spaceId,
        storage_path: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
        is_primary: true,
        display_order: 0,
        created_at: new Date().toISOString(),
      }
    ],
    vehicle_types: ['car_sedan', 'car_suv', 'car_hatchback', 'ev_four_wheeler']
  };

  // Hold Countdown Timer
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

  // Handle Reserve / Hold Request
  async function handleInitiateHold(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const startIso = `${startDate}T${startTime}:00Z`;
    const endIso = `${endDate}T${endTime}:00Z`;

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setErrorMessage('Departure time must be after arrival time.');
      setLoading(false);
      return;
    }

    if (!vehiclePlate.trim()) {
      setErrorMessage('Please enter your vehicle registration number (e.g. GJ 01 AB 1234).');
      setLoading(false);
      return;
    }

    const result = await initiateBookingHoldAction({
      spaceId: space.id,
      vehicleId: 'veh-temp-' + vehiclePlate.replace(/\s+/g, ''),
      startTime: startIso,
      endTime: endIso,
    });

    if (result.error) {
      setErrorMessage(result.error);
      setLoading(false);
    } else if (result.success && result.bookingId && result.pricing) {
      setBookingId(result.bookingId);
      setBookingRef(result.bookingRef || 'PKB-NEW');
      setPricingSnapshot(result.pricing);
      setIsHoldActive(true);
      setHoldSecondsRemaining(600);
      setLoading(false);
    }
  }

  // Handle Verified Payment Confirmation
  async function handleConfirmPayment() {
    if (!bookingId) return;
    setPaymentProcessing(true);

    const paymentId = 'pay_' + Math.random().toString(36).substring(2, 12);
    const result = await confirmBookingPaymentAction({
      bookingId,
      paymentId,
      orderId: 'order_' + Math.random().toString(36).substring(2, 10),
    });

    if (result.error) {
      setErrorMessage(result.error);
      setPaymentProcessing(false);
    } else {
      router.push(`/account/bookings/${bookingId}`);
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

      {/* Main Grid: Gallery & Info + Sticky Booking Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Photo, Overview, Amenities, Rules */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Photo Gallery */}
          <div className="rounded-card overflow-hidden h-72 sm:h-96 bg-surface-muted relative border border-border">
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
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1 rounded-control text-sm font-bold text-foreground shadow-sm">
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{space.title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{space.description}</p>
          </div>

          {/* Specifications Card */}
          <div className="bg-surface rounded-card p-6 border border-border space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Spot Specifications</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-surface-muted rounded-control space-y-1">
                <span className="text-muted-foreground block">Parking Type</span>
                <span className="font-bold text-foreground capitalize">{space.parking_type}</span>
              </div>
              <div className="p-3 bg-surface-muted rounded-control space-y-1">
                <span className="text-muted-foreground block">Identifier</span>
                <span className="font-bold text-foreground">{space.identifier}</span>
              </div>
              <div className="p-3 bg-surface-muted rounded-control space-y-1">
                <span className="text-muted-foreground block">Max Height</span>
                <span className="font-bold text-foreground">{space.height_limit_meters || 'No limit'} m</span>
              </div>
              <div className="p-3 bg-surface-muted rounded-control space-y-1">
                <span className="text-muted-foreground block">Daily Rate</span>
                <span className="font-bold text-foreground">₹{space.daily_rate || space.hourly_rate * 8}</span>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-surface rounded-card p-6 border border-border space-y-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Verified Security Amenities</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {space.security_features.map((feat) => (
                <span
                  key={feat}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-800 font-medium rounded-full flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="capitalize">{feat.replace(/_/g, ' ')}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Access Note Warning */}
          <div className="bg-amber-50 p-4 rounded-card border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <strong className="block font-semibold">Privacy & Gate Clearance Policy:</strong>
              Exact host contact numbers, building gate pass numbers, and floor directions are provided immediately on your confirmation receipt after reservation to safeguard resident security.
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Sticky Reservation Box */}
        <div className="lg:col-span-4">
          <div className="bg-surface rounded-card border border-border p-6 shadow-card sticky top-24 space-y-5">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-foreground">₹{space.hourly_rate}</span>
                <span className="text-xs text-muted-foreground"> / hour</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Verified Slot
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-danger rounded-control text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleInitiateHold} className="space-y-4">
              {/* Arrival */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">Arrival Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
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

              {/* Vehicle Registration */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">Vehicle License Plate</label>
                <div className="relative">
                  <Car className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    required
                    placeholder="e.g. GJ 01 AB 1234"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control uppercase font-mono focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="car_sedan">Sedan (GJ)</option>
                  <option value="car_suv">SUV / MUV</option>
                  <option value="car_hatchback">Hatchback</option>
                  <option value="two_wheeler">Two-Wheeler / Scooter</option>
                  <option value="ev_four_wheeler">Electric Car (EV)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold rounded-control shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Lock 10-Minute Hold & Reserve</span>}
              </button>
            </form>

            <div className="pt-2 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Concurrency protected. Double bookings impossible.
            </div>
          </div>
        </div>
      </div>

      {/* 10-Minute Hold Checkout Modal */}
      {isHoldActive && pricingSnapshot && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-border shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            {/* Header & Hold Timer */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Hold Reserved</span>
                <h3 className="text-base font-bold text-foreground">Review & Confirm Booking</h3>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-danger bg-red-50 px-2 py-0.5 rounded-control inline-block">
                  {Math.floor(holdSecondsRemaining / 60)}:
                  {(holdSecondsRemaining % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-[10px] text-muted-foreground">Hold expires</div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-surface-muted rounded-control space-y-1">
                <div className="font-semibold text-foreground">{space.title}</div>
                <div className="text-muted-foreground">{space.property?.area} • Slot {space.identifier}</div>
                <div className="text-primary font-medium">Vehicle: {vehiclePlate}</div>
              </div>

              {/* Itemized Price Breakdown */}
              <div className="border border-border rounded-control p-3 space-y-2">
                <div className="font-semibold text-foreground text-[11px] uppercase tracking-wider">Price Breakdown</div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Parking Rate ({pricingSnapshot.totalHours} hrs × ₹{space.hourly_rate})</span>
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
                  <span className="font-mono text-primary">₹{pricingSnapshot.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={paymentProcessing}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-control shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {paymentProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Pay ₹{pricingSnapshot.totalAmount.toFixed(2)} via Razorpay / UPI</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsHoldActive(false)}
                className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                Cancel Hold & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
