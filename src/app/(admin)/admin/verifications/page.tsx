'use client';

import { useState } from 'react';
import { verifySpaceAction } from '@/server/actions/admin-actions';
import { FileCheck, CheckCircle2, XCircle, AlertCircle, Building, MapPin } from 'lucide-react';
import { ParkingSpace } from '@/types/database';

export default function VerificationsPage() {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([
    {
      id: 'spc-pending-ahmedabad-04',
      property_id: 'prop-sg-04',
      provider_id: 'usr-host-ahmedabad-01',
      identifier: 'Surface Bay S-09',
      title: 'Commercial Basement Slot near Iscon Cross Road',
      description: 'Underground commercial spot next to Iscon Mega Mall with 24/7 security guard.',
      parking_type: 'covered',
      hourly_rate: 50.00,
      daily_rate: 350.00,
      monthly_rate: 4800.00,
      min_duration_hours: 1,
      max_duration_hours: 720,
      access_instructions: 'Enter basement ramp from service road. Inform attendant slot S-09.',
      security_features: ['cctv', 'gated_security'],
      has_ev_charging: true,
      height_limit_meters: 2.2,
      status: 'submitted',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      property: {
        id: 'prop-sg-04',
        provider_id: 'usr-host-ahmedabad-01',
        title: 'Iscon Business Arcade',
        property_type: 'commercial_lot',
        address_line1: 'Near Iscon Cross Road, S.G. Highway',
        area: 'SG Highway / Bodakdev',
        city: 'Ahmedabad',
        postal_code: '380054',
        latitude: 23.0298,
        longitude: 72.5085,
        created_at: new Date().toISOString(),
      },
      photos: [
        {
          id: 'p4',
          space_id: 'spc-pending-ahmedabad-04',
          storage_path: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
          is_primary: true,
          display_order: 0,
          created_at: new Date().toISOString(),
        }
      ],
      vehicle_types: ['car_sedan', 'car_suv', 'two_wheeler']
    }
  ]);

  const [message, setMessage] = useState<string | null>(null);

  async function handleVerify(spaceId: string, status: 'approved' | 'rejected') {
    const result = await verifySpaceAction({ spaceId, status });
    if (result.success) {
      setSpaces(prev => prev.filter(s => s.id !== spaceId));
      setMessage(`Listing marked as ${status.toUpperCase()}. Database records updated.`);
    } else {
      alert(result.error || 'Verification action failed');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Listing Verification Queue</h2>
        <p className="text-xs text-muted-foreground">
          Audit host identity, society NOCs, and property ownership evidence. Only approved listings are published to the public search map.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-control text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {spaces.length === 0 ? (
        <div className="bg-surface rounded-card p-12 border border-border text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-foreground">Queue is clear</h3>
          <p className="text-xs text-muted-foreground">All submitted parking listings have been reviewed and verified.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {spaces.map((s) => (
            <div key={s.id} className="bg-surface rounded-card p-6 border border-border shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full">
                    Awaiting Admin Approval
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-1.5">{s.title}</h3>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{s.property?.address_line1}, {s.property?.area}, Ahmedabad</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVerify(s.id, 'approved')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-control shadow transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Publish</span>
                  </button>
                  <button
                    onClick={() => handleVerify(s.id, 'rejected')}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-danger border border-red-200 text-xs font-bold rounded-control transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-surface-muted p-3.5 rounded-control">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Property Type</span>
                  <span className="font-semibold text-foreground capitalize">{s.property?.property_type.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Slot Identifier</span>
                  <span className="font-semibold text-foreground font-mono">{s.identifier}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Hourly / Daily Rate</span>
                  <span className="font-semibold text-foreground font-mono">₹{s.hourly_rate} / ₹{s.daily_rate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">EV Charging</span>
                  <span className="font-semibold text-foreground">{s.has_ev_charging ? 'Yes (Verified)' : 'No'}</span>
                </div>
              </div>

              <div className="text-xs text-foreground bg-primary-soft/40 p-3 rounded-control border border-primary/20">
                <strong className="font-semibold text-primary block mb-0.5">Access Instructions Audit:</strong>
                {s.access_instructions}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
