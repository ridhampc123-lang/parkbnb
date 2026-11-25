'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Booking } from '@/types/database';
import {
  hostCheckInAction,
  hostCheckOutAction,
  hostReportOverstayAction,
  hostSendEmergencyNoticeAction
} from '@/server/actions/host-actions';
import {
  Car,
  Clock,
  CheckCircle2,
  Shield,
  Lock,
  AlertCircle,
  Search,
  Filter,
  Check,
  LogOut,
  AlertTriangle,
  Send,
  Loader2,
  X,
  PhoneCall,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Eye
} from 'lucide-react';

export function HostBookingsClient({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'active' | 'completed'>('all');

  // Modals & Active Action
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [overstayBooking, setOverstayBooking] = useState<Booking | null>(null);
  const [overstayNotes, setOverstayNotes] = useState('');
  const [emergencyBooking, setEmergencyBooking] = useState<Booking | null>(null);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPlate = b.vehicle?.registration_number.toLowerCase().includes(q);
      const matchRef = b.booking_reference.toLowerCase().includes(q);
      const matchCustRef = b.booking_customer_reference?.toLowerCase().includes(q);
      const matchSlot = b.space?.identifier.toLowerCase().includes(q);
      const matchName = b.customer_display_name?.toLowerCase().includes(q);
      if (!matchPlate && !matchRef && !matchCustRef && !matchSlot && !matchName) return false;
    }

    if (statusFilter !== 'all') {
      if (b.status !== statusFilter) return false;
    }

    return true;
  });

  // Handle Driver Check-In (Arrival at Gate)
  async function handleCheckIn(bookingId: string) {
    if (!confirm('Confirm driver arrival and grant security gate clearance?')) return;

    setActionLoading(true);
    const result = await hostCheckInAction(bookingId);
    setActionLoading(false);

    if (result.error) {
      alert(result.error);
    } else {
      setActionSuccess('Driver checked in successfully! Gate entry cleared.');
      setTimeout(() => setActionSuccess(null), 3000);
      router.refresh();
    }
  }

  // Handle Driver Check-Out (Departure from Gate)
  async function handleCheckOut(bookingId: string) {
    if (!confirm('Confirm vehicle departure and release parking spot back to available inventory?')) return;

    setActionLoading(true);
    const result = await hostCheckOutAction(bookingId);
    setActionLoading(false);

    if (result.error) {
      alert(result.error);
    } else {
      setActionSuccess('Vehicle departed and parking slot released.');
      setTimeout(() => setActionSuccess(null), 3000);
      router.refresh();
    }
  }

  // Handle Overstay Submission
  async function handleSubmitOverstay(e: React.FormEvent) {
    e.preventDefault();
    if (!overstayBooking) return;

    setActionLoading(true);
    const result = await hostReportOverstayAction({
      bookingId: overstayBooking.id,
      notes: overstayNotes || 'Driver vehicle remained parked beyond booked departure time.',
    });
    setActionLoading(false);

    if (result.error) {
      alert(result.error);
    } else {
      setOverstayBooking(null);
      setOverstayNotes('');
      setActionSuccess('Overstay flagged on driver record.');
      setTimeout(() => setActionSuccess(null), 3000);
      router.refresh();
    }
  }

  // Handle Emergency Message Dispatch
  async function handleSendEmergency(e: React.FormEvent) {
    e.preventDefault();
    if (!emergencyBooking) return;

    setActionLoading(true);
    const result = await hostSendEmergencyNoticeAction({
      bookingId: emergencyBooking.id,
      message: emergencyMessage,
    });
    setActionLoading(false);

    if (result.error) {
      alert(result.error);
    } else {
      setEmergencyBooking(null);
      setEmergencyMessage('');
      setActionSuccess(result.message || 'Emergency message relayed to driver.');
      setTimeout(() => setActionSuccess(null), 3000);
    }
  }

  const expectedTodayCount = bookings.filter((b) => b.status === 'confirmed').length;
  const currentlyParkedCount = bookings.filter((b) => b.status === 'active').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Driver Clearance Manifest</h2>
          <p className="text-xs text-muted-foreground">
            Privacy-safe gate control console. Verify license plates, check in arriving drivers, and release departed spots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-muted rounded-control border border-border text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold text-foreground">Customer Privacy Shield Active</span>
          </div>
        </div>
      </div>

      {/* Action Success Toast */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-control text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* Live Telemetry Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface p-4 rounded-card border border-border shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Bookings</span>
          <div className="text-xl font-black text-foreground">{bookings.length}</div>
          <span className="text-[10px] text-muted-foreground">Lifetime reservations</span>
        </div>

        <div className="bg-surface p-4 rounded-card border border-border shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">Expected Arrivals</span>
          <div className="text-xl font-black text-emerald-700">{expectedTodayCount}</div>
          <span className="text-[10px] text-emerald-700 font-semibold">Confirmed & awaiting entry</span>
        </div>

        <div className="bg-surface p-4 rounded-card border border-border shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">Currently Parked</span>
          <div className="text-xl font-black text-blue-700">{currentlyParkedCount}</div>
          <span className="text-[10px] text-blue-700 font-semibold">Active in your bays</span>
        </div>

        <div className="bg-surface p-4 rounded-card border border-border shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Completed Trips</span>
          <div className="text-xl font-black text-foreground">{completedCount}</div>
          <span className="text-[10px] text-muted-foreground">Cleared & spot freed</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-surface p-4 rounded-card border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search license plate (e.g. MH 02, GJ 01), ref, or slot..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs py-1.5 px-3 bg-surface-muted border border-border rounded-control text-foreground font-medium focus:outline-none"
          >
            <option value="all">All Bookings</option>
            <option value="confirmed">Expected Arrivals (Confirmed)</option>
            <option value="active">Currently Parked (Active)</option>
            <option value="completed">Departed (Completed)</option>
          </select>
        </div>
      </div>

      {/* Manifest Table */}
      {filteredBookings.length === 0 ? (
        <div className="bg-surface rounded-card p-12 border border-border text-center space-y-2 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-surface-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Car className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-foreground">No bookings found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {bookings.length === 0
              ? 'As drivers reserve your parking spots across Indian cities, their vehicle numbers and clearance passes will appear here.'
              : 'No bookings match your current search plate or status filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-card border border-border overflow-hidden shadow-xs">
          {/* Desktop Table View (hidden on mobile, visible on lg screens) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-muted border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Vehicle Plate</th>
                  <th className="p-3.5">Driver Ref</th>
                  <th className="p-3.5">Assigned Slot</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Time Window</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Net Payout</th>
                  <th className="p-3.5 text-right">Gate Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBookings.map((b) => {
                  const isConfirmed = b.status === 'confirmed';
                  const isActive = b.status === 'active';

                  return (
                    <tr key={b.id} className="hover:bg-surface-muted/50 transition-colors">
                      {/* Vehicle Plate */}
                      <td className="p-3.5">
                        <div className="font-mono font-black text-primary text-xs tracking-wider">
                          {b.vehicle?.registration_number || 'CLEARED GATE PLATE'}
                        </div>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {b.vehicle?.vehicle_type?.replace(/_/g, ' ') || 'Car'}
                        </span>
                      </td>

                      {/* Driver Privacy Reference */}
                      <td className="p-3.5">
                        <div className="font-mono font-semibold text-foreground">
                          {b.booking_customer_reference || b.booking_reference}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {b.customer_display_name || 'Verified Parker'}
                        </span>
                      </td>

                      {/* Assigned Slot */}
                      <td className="p-3.5 font-bold text-foreground font-mono">
                        {b.space?.identifier}
                      </td>

                      {/* Location & City */}
                      <td className="p-3.5">
                        <div className="font-semibold text-foreground line-clamp-1">{b.space?.title}</div>
                        <span className="text-[10px] text-muted-foreground">
                          {b.space?.property?.area}, {b.space?.property?.city || 'India'}
                        </span>
                      </td>

                      {/* Time Window */}
                      <td className="p-3.5 text-muted-foreground">
                        <div className="font-medium text-foreground">
                          {new Date(b.start_time).toLocaleDateString()}
                        </div>
                        <span className="text-[10px] font-mono">
                          {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isActive
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isConfirmed ? 'Expected Today' : isActive ? 'Currently Parked' : b.status}
                        </span>
                      </td>

                      {/* Net Payout */}
                      <td className="p-3.5 font-mono font-bold text-emerald-700">
                        ₹{b.provider_payout_amount.toFixed(2)}
                      </td>

                      {/* Gate Actions */}
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Inspect Pass */}
                          <button
                            onClick={() => setSelectedBooking(b)}
                            title="Inspect Security Gate Pass"
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface rounded-control"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Check In Action */}
                          {isConfirmed && (
                            <button
                              onClick={() => handleCheckIn(b.id)}
                              disabled={actionLoading}
                              title="Driver Arrived: Clear Gate Entry"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-control shadow-xs flex items-center gap-1 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              <span>Check In</span>
                            </button>
                          )}

                          {/* Check Out Action */}
                          {isActive && (
                            <button
                              onClick={() => handleCheckOut(b.id)}
                              disabled={actionLoading}
                              title="Driver Departing: Release Parking Spot"
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-control shadow-xs flex items-center gap-1 transition-colors"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>Check Out</span>
                            </button>
                          )}

                          {/* Flag Overstay / Alert */}
                          {isActive && (
                            <button
                              onClick={() => setOverstayBooking(b)}
                              title="Flag Overstay"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-control"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Emergency Driver Notice Relay */}
                          <button
                            onClick={() => setEmergencyBooking(b)}
                            title="Send Masked Emergency Notice to Driver"
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-surface rounded-control"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Manifest View (touch-first card list for smartphones) */}
          <div className="lg:hidden divide-y divide-border">
            {filteredBookings.map((b) => {
              const isConfirmed = b.status === 'confirmed';
              const isActive = b.status === 'active';

              return (
                <div key={b.id} className="p-4 space-y-3 bg-surface">
                  {/* Card Header: Slot, Status Pill, Payout */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-primary-soft text-primary font-mono font-bold text-xs rounded-control border border-primary/20">
                        Slot {b.space?.identifier}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isConfirmed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isActive
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isConfirmed ? 'Expected' : isActive ? 'Parked' : b.status}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-emerald-700">
                        ₹{b.provider_payout_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Plate & Type */}
                  <div className="flex items-center justify-between bg-surface-muted p-2.5 rounded-control border border-border">
                    <div>
                      <div className="font-mono font-black text-primary text-sm tracking-wider">
                        {b.vehicle?.registration_number || 'CLEARED GATE PLATE'}
                      </div>
                      <div className="text-[10px] text-muted-foreground capitalize">
                        {b.vehicle?.vehicle_type?.replace(/_/g, ' ') || 'Motor Vehicle'} • {b.customer_display_name || 'Driver'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedBooking(b)}
                      className="px-2.5 py-1 text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Pass</span>
                    </button>
                  </div>

                  {/* Location & Time Info */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="text-foreground font-medium line-clamp-1">{b.space?.title}</div>
                    <div className="flex items-center gap-1 text-[11px] font-mono">
                      <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span>
                        {new Date(b.start_time).toLocaleDateString()} (
                        {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </div>
                  </div>

                  {/* Touch-Friendly Mobile Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-border/60">
                    {isConfirmed && (
                      <button
                        type="button"
                        onClick={() => handleCheckIn(b.id)}
                        disabled={actionLoading}
                        className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-control shadow-xs flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                      >
                        <Check className="w-4 h-4" />
                        <span>Check In Driver (Grant Entry)</span>
                      </button>
                    )}

                    {isActive && (
                      <button
                        type="button"
                        onClick={() => handleCheckOut(b.id)}
                        disabled={actionLoading}
                        className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-control shadow-xs flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Check Out Driver (Release Bay)</span>
                      </button>
                    )}

                    {isActive && (
                      <button
                        type="button"
                        onClick={() => setOverstayBooking(b)}
                        className="p-2.5 text-amber-600 bg-amber-50 border border-amber-200 rounded-control min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Flag Overstay"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setEmergencyBooking(b)}
                      className="p-2.5 text-muted-foreground bg-surface-muted border border-border rounded-control min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Send Emergency Message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal 1: Security Gate Clearance Pass */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-border shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-foreground">Security Gate Clearance Pass</h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Vehicle Number Big Card */}
            <div className="bg-surface-muted border-2 border-primary/30 p-4 rounded-control text-center space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block">
                Authorized License Plate
              </span>
              <div className="text-2xl font-black font-mono text-primary tracking-wider">
                {selectedBooking.vehicle?.registration_number || 'CLEARED PLATE'}
              </div>
              <span className="text-xs text-foreground font-semibold capitalize">
                {selectedBooking.vehicle?.vehicle_type?.replace(/_/g, ' ') || 'Car'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Assigned Slot:</span>
                <span className="font-bold text-foreground font-mono">{selectedBooking.space?.identifier}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Clearance Reference:</span>
                <span className="font-bold text-foreground font-mono">
                  {selectedBooking.booking_customer_reference || selectedBooking.booking_reference}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Arrival Window:</span>
                <span className="font-semibold text-foreground">
                  {new Date(selectedBooking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(selectedBooking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Net Payout to Host:</span>
                <span className="font-bold text-emerald-700 font-mono">
                  ₹{selectedBooking.provider_payout_amount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Payment Status:</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                  PAID & GUARANTEED
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              {selectedBooking.status === 'confirmed' ? (
                <button
                  onClick={() => {
                    handleCheckIn(selectedBooking.id);
                    setSelectedBooking(null);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-control shadow flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Grant Entry Clearance</span>
                </button>
              ) : selectedBooking.status === 'active' ? (
                <button
                  onClick={() => {
                    handleCheckOut(selectedBooking.id);
                    setSelectedBooking(null);
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-control shadow flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Complete Departure & Free Spot</span>
                </button>
              ) : (
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-full py-2 bg-surface-muted text-foreground font-semibold text-xs rounded-control"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Report Overstay */}
      {overstayBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-border shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-foreground">Flag Driver Overstay</h3>
              </div>
              <button
                onClick={() => setOverstayBooking(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Vehicle <span className="font-mono font-bold text-foreground">{overstayBooking.vehicle?.registration_number}</span> was scheduled to depart at{' '}
              <span className="font-semibold text-foreground">
                {new Date(overstayBooking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>.
            </p>

            <form onSubmit={handleSubmitOverstay} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Overstay Observations / Notes
                </label>
                <textarea
                  required
                  rows={3}
                  value={overstayNotes}
                  onChange={(e) => setOverstayNotes(e.target.value)}
                  placeholder="e.g. Vehicle still occupying Slot B-22 past departure time. Security attendant notified."
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setOverstayBooking(null)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-muted rounded-control"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-control shadow flex items-center gap-1"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Record Overstay Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Emergency Notice Relay */}
      {emergencyBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-border shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Send Masked Driver Alert</h3>
              </div>
              <button
                onClick={() => setEmergencyBooking(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Relay an urgent gate notice to the driver of vehicle{' '}
              <span className="font-mono font-bold text-foreground">
                {emergencyBooking.vehicle?.registration_number}
              </span> without exposing their personal phone number.
            </p>

            <form onSubmit={handleSendEmergency} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Alert Message
                </label>
                <textarea
                  required
                  rows={3}
                  value={emergencyMessage}
                  onChange={(e) => setEmergencyMessage(e.target.value)}
                  placeholder="e.g. Please note society gate 2 closes at 10 PM. Use gate 1 for late departure."
                  className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEmergencyBooking(null)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-muted rounded-control"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-control shadow flex items-center gap-1"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Dispatch Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
