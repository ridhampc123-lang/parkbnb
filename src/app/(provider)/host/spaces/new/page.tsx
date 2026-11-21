'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSpaceAction } from '@/server/actions/space-actions';
import { Building, MapPin, Car, Shield, AlertCircle, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function NewSpacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createSpaceAction(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.success) {
      router.push('/host/spaces');
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/host/spaces" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to My Spaces
        </Link>
      </div>

      <div className="bg-surface rounded-card p-6 sm:p-8 border border-border shadow-card space-y-6">
        <div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Guided Listing Wizard</span>
          <h1 className="text-2xl font-bold text-foreground mt-1">List a New Parking Space in Ahmedabad</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Provide property location, spot specifications, security amenities, and gate clearance rules.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-danger rounded-control text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Property & Area Location */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
              1. Property Location & Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">Building / Complex Name</label>
                <input
                  type="text"
                  name="property_title"
                  required
                  placeholder="e.g. Shivalik Business Hub / Orchid Elegance"
                  className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">Property Category</label>
                <select
                  name="property_type"
                  className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="apartment_complex">Residential Apartment Complex</option>
                  <option value="commercial_lot">Commercial Complex / Mall</option>
                  <option value="independent_house">Independent Bungalow / House</option>
                  <option value="open_plot">Private Gated Open Plot</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">Ahmedabad Neighbourhood / Area</label>
                <input
                  type="text"
                  name="area"
                  required
                  placeholder="e.g. Prahlad Nagar, Bodakdev, Navrangpura"
                  className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">Postal Code (PIN)</label>
                <input
                  type="text"
                  name="postal_code"
                  required
                  maxLength={6}
                  placeholder="380015"
                  className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-foreground mb-1">Street Address</label>
                <input
                  type="text"
                  name="address_line1"
                  required
                  placeholder="e.g. B-Wing, Opp. Prahlad Nagar Garden Gate 2"
                  className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Spot Specifications & Pricing */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
              2. Parking Space Specifications & Pricing
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">Listing Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Covered Basement Slot near SG Highway"
                  className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">Spot Identifier</label>
                <input
                  type="text"
                  name="identifier"
                  required
                  placeholder="e.g. Bay B-14 / Slot 42"
                  className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control font-mono focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">Parking Structure</label>
                <select
                  name="parking_type"
                  className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="covered">Covered / Underground Basement</option>
                  <option value="open">Surface / Open-Air</option>
                  <option value="basement">Basement Level -1/-2</option>
                  <option value="multi_level">Multi-Level Car Park</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">Hourly Rate (₹ INR)</label>
                <input
                  type="number"
                  name="hourly_rate"
                  required
                  min={10}
                  max={500}
                  defaultValue={40}
                  className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">Daily Cap (₹ INR, Optional)</label>
                <input
                  type="number"
                  name="daily_rate"
                  placeholder="e.g. 300"
                  className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">Max Height Limit (Meters)</label>
                <input
                  type="number"
                  step="0.1"
                  name="height_limit_meters"
                  placeholder="e.g. 2.4"
                  className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                />
              </div>
            </div>

            {/* EV Charging & Amenities */}
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                <input type="checkbox" name="has_ev_charging" value="true" className="rounded text-primary" />
                <span>Installed EV Charger (Level 2 AC / 15A Socket)</span>
              </label>
            </div>
          </div>

          {/* Section 3: Gate Clearance & Security Instructions */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
              3. Security Clearance & Access Instructions
            </h2>

            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Exact Entry Instructions (Revealed ONLY to paid parkers)
              </label>
              <textarea
                name="access_instructions"
                required
                rows={3}
                placeholder="e.g. Enter through Gate 2. Inform security guard Rajesh Bhai slot B-14. Driver license plate will be matched with ParkBnB booking manifest."
                className="w-full p-2.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Submitted listings are reviewed by Admin Operations before becoming publicly bookable.
            </span>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-6 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit Listing for Review</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
