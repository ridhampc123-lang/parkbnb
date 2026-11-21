'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toggleSpaceActiveAction } from '@/server/actions/admin-actions';
import {
  Car,
  Search,
  MapPin,
  Zap,
  ExternalLink,
  Power,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { ParkingSpace } from '@/types/database';

export default function AdminListingsPage() {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([
    {
      id: 'spc-prahladnagar-01',
      property_id: 'prop-prahladnagar-01',
      provider_id: 'usr-host-ahmedabad-01',
      identifier: 'Basement Slot B-22',
      title: 'Covered Secure Parking near Prahlad Nagar Garden',
      parking_type: 'covered',
      hourly_rate: 40.00,
      daily_rate: 300.00,
      monthly_rate: 4500.00,
      min_duration_hours: 1,
      max_duration_hours: 720,
      security_features: ['cctv', 'gated_security'],
      has_ev_charging: true,
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
      }
    },
    {
      id: 'spc-sbr-02',
      property_id: 'prop-sbr-02',
      provider_id: 'usr-host-ahmedabad-01',
      identifier: 'Surface Bay EV-04',
      title: 'Prime Surface Parking with EV Charging on Sindhu Bhavan',
      parking_type: 'open',
      hourly_rate: 50.00,
      daily_rate: 380.00,
      monthly_rate: 5500.00,
      min_duration_hours: 1,
      max_duration_hours: 720,
      security_features: ['cctv', 'ev_charger'],
      has_ev_charging: true,
      status: 'approved',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      property: {
        id: 'prop-sbr-02',
        provider_id: 'usr-host-ahmedabad-01',
        title: 'Times Square Commercial Precinct',
        property_type: 'commercial_lot',
        address_line1: 'Near Sindhu Bhavan Marg',
        area: 'Sindhu Bhavan Road / Bodakdev',
        city: 'Ahmedabad',
        postal_code: '380054',
        latitude: 23.0450,
        longitude: 72.5080,
        created_at: new Date().toISOString(),
      }
    },
    {
      id: 'spc-navrangpura-03',
      property_id: 'prop-navrangpura-03',
      provider_id: 'usr-host-ahmedabad-01',
      identifier: 'Slot G-08',
      title: 'Central Navrangpura Parking near CG Road',
      parking_type: 'covered',
      hourly_rate: 30.00,
      daily_rate: 220.00,
      monthly_rate: 3200.00,
      min_duration_hours: 1,
      max_duration_hours: 720,
      security_features: ['cctv'],
      has_ev_charging: false,
      status: 'approved',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      property: {
        id: 'prop-navrangpura-03',
        provider_id: 'usr-host-ahmedabad-01',
        title: 'Parimal Heritage Arcade',
        property_type: 'commercial_lot',
        address_line1: 'Off CG Road, Near Municipal Market',
        area: 'Navrangpura & CG Road',
        city: 'Ahmedabad',
        postal_code: '380009',
        latitude: 23.0365,
        longitude: 72.5611,
        created_at: new Date().toISOString(),
      }
    }
  ]);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  async function handleToggleActive(id: string) {
    const result = await toggleSpaceActiveAction(id);
    if (result.success) {
      setSpaces(prev => prev.map(s => s.id === id ? { ...s, is_active: result.is_active } : s));
    } else {
      alert(result.error || 'Action failed');
    }
  }

  const filtered = spaces.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchArea = s.property?.area.toLowerCase().includes(q);
      const matchId = s.identifier.toLowerCase().includes(q);
      if (!matchTitle && !matchArea && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
          Inventory Control
        </span>
        <h1 className="text-2xl font-black text-white mt-1">All Parking Spaces in Ahmedabad</h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor public bookability, emergency suspend listings, and audit property rates.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-card border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title, area, or slot..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-control text-slate-200 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-control text-slate-200 focus:outline-none"
          >
            <option value="all">All Verification Statuses</option>
            <option value="approved">Approved & Live</option>
            <option value="submitted">Submitted (Under Review)</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Spaces Table */}
      <div className="bg-slate-900 rounded-card border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Listing Title</th>
                <th className="p-3.5">Area & Location</th>
                <th className="p-3.5">Slot ID</th>
                <th className="p-3.5">Hourly Rate</th>
                <th className="p-3.5">EV Status</th>
                <th className="p-3.5">State</th>
                <th className="p-3.5 text-right">Emergency Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold text-white max-w-xs truncate">
                    <div className="flex items-center gap-2">
                      <span>{s.title}</span>
                      <Link
                        href={`/parking/${s.id}`}
                        target="_blank"
                        className="text-slate-500 hover:text-primary"
                        title="View on public marketplace"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-400">{s.property?.area}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-200">{s.identifier}</td>
                  <td className="p-3.5 font-mono font-bold text-white">₹{s.hourly_rate}/hr</td>
                  <td className="p-3.5">
                    {s.has_ev_charging ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]"><Zap className="w-3 h-3" /> Ready</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">No</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      s.is_active && s.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {s.is_active ? 'Active / Live' : 'Suspended'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleToggleActive(s.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-control transition-colors inline-flex items-center gap-1 ${
                        s.is_active
                          ? 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{s.is_active ? 'Suspend Space' : 'Activate Space'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
