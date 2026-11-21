'use client';

import { useState } from 'react';
import { verifySpaceAction } from '@/server/actions/admin-actions';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building,
  MapPin,
  Clock,
  Shield,
  Loader2,
  Zap
} from 'lucide-react';
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
      is_active: false,
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

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleAction(spaceId: string, status: 'approved' | 'rejected') {
    setProcessingId(spaceId);
    setFeedback(null);

    const result = await verifySpaceAction({
      spaceId,
      status,
      rejectionReason: status === 'rejected' ? 'Incomplete property rights documentation' : undefined,
    });

    if (result.success) {
      setSpaces(prev => prev.filter(s => s.id !== spaceId));
      setFeedback({
        type: 'success',
        text: status === 'approved'
          ? 'Listing approved! It is now live and bookable on the Ahmedabad public marketplace.'
          : 'Listing rejected. Rejection reason recorded and host notified.',
      });
    } else {
      setFeedback({
        type: 'error',
        text: result.error || 'Verification action failed',
      });
    }
    setProcessingId(null);
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
          Legal & Property Audit
        </span>
        <h1 className="text-2xl font-black text-white mt-1">Host Listing Verification Queue</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review evidence of property ownership, society NOCs, and gate clearance rules. Unverified spaces cannot be booked by the public.
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-control text-xs flex items-center gap-2 border ${
          feedback.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            : 'bg-red-950/60 border-red-800 text-red-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {spaces.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-card p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">All Host Listings Verified</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently zero pending parking space submissions awaiting audit.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {spaces.map((s) => (
            <div
              key={s.id}
              className="bg-slate-900 border border-slate-800 rounded-card p-6 space-y-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      Awaiting Operational Review
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID: {s.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{s.title}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{s.property?.address_line1}, {s.property?.area}, Ahmedabad ({s.property?.postal_code})</span>
                  </div>
                </div>

                {/* Approve & Reject Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(s.id, 'approved')}
                    disabled={processingId === s.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-control shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {processingId === s.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Make Live</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleAction(s.id, 'rejected')}
                    disabled={processingId === s.id}
                    className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800 text-xs font-bold rounded-control transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              {/* Property Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/70 p-4 rounded-control border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Complex Category</span>
                  <span className="font-semibold text-slate-200 capitalize">{s.property?.property_type.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Spot Identifier</span>
                  <span className="font-mono font-bold text-slate-200">{s.identifier}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Hourly / Daily Rate</span>
                  <span className="font-mono font-bold text-white">₹{s.hourly_rate} / ₹{s.daily_rate || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">EV Charging Setup</span>
                  <span className="font-semibold text-slate-200">{s.has_ev_charging ? 'Installed (AC Type 2)' : 'None'}</span>
                </div>
              </div>

              {/* Gate Clearance Instructions */}
              <div className="text-xs bg-purple-950/20 border border-purple-900/30 p-3.5 rounded-control text-slate-300">
                <span className="font-bold text-purple-300 block mb-1 uppercase text-[10px] tracking-wider">
                  Access Clearance Notes for Confirmed Parkers:
                </span>
                {s.access_instructions}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
