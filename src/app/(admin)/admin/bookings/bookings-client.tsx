'use client';

import { useState } from 'react';
import { Booking } from '@/types/database';
import { forceCompleteBookingAction, adminCancelBookingAction } from '@/server/actions/admin-actions';
import {
  Calendar,
  Search,
  Filter,
  Car,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  QrCode,
  X,
  AlertCircle,
  IndianRupee,
  ShieldCheck,
  Check
} from 'lucide-react';

export function BookingsClient({ initialBookings }: { initialBookings: Booking[] }) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('Administrative operational cancellation and full refund');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = bookings.filter(b => {
    const matchesSearch =
      b.booking_reference.toLowerCase().includes(search.toLowerCase()) ||
      (b.customer?.full_name && b.customer.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (b.vehicle?.registration_number && b.vehicle.registration_number.toLowerCase().includes(search.toLowerCase())) ||
      (b.space?.title && b.space.title.toLowerCase().includes(search.toLowerCase())) ||
      (b.space?.property?.area && b.space.property.area.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && (b.status === 'confirmed' || b.status === 'active')) ||
      (statusFilter === 'completed' && b.status === 'completed') ||
      (statusFilter === 'cancelled' && b.status.includes('cancelled'));

    return matchesSearch && matchesStatus;
  });

  const handleForceComplete = async (booking: Booking) => {
    if (!confirm(`Force complete booking ${booking.booking_reference}? This will mark check-out and free the parking space.`)) {
      return;
    }

    setActionLoadingId(booking.id);
    setFeedback(null);

    const res = await forceCompleteBookingAction({
      bookingId: booking.id,
      reason: 'Admin manual gate check-out validation',
    });

    setActionLoadingId(null);

    if (res.success) {
      setBookings(prev =>
        prev.map(b => (b.id === booking.id ? { ...b, status: 'completed' } : b))
      );
      setFeedback(`Booking ${booking.booking_reference} marked completed and space released.`);
      if (selectedBooking?.id === booking.id) {
        setSelectedBooking(prev => (prev ? { ...prev, status: 'completed' } : null));
      }
    } else {
      alert(res.error || 'Failed to complete booking');
    }
  };

  const handleCancelAndRefund = async () => {
    if (!cancelModalBooking) return;

    setActionLoadingId(cancelModalBooking.id);
    setFeedback(null);

    const res = await adminCancelBookingAction({
      bookingId: cancelModalBooking.id,
      refundReason: cancelReason,
    });

    setActionLoadingId(null);

    if (res.success) {
      setBookings(prev =>
        prev.map(b => (b.id === cancelModalBooking.id ? { ...b, status: 'cancelled_by_admin' } : b))
      );
      setFeedback(`Booking ${cancelModalBooking.booking_reference} cancelled and 100% refund posted to ledger.`);
      setCancelModalBooking(null);
      if (selectedBooking?.id === cancelModalBooking.id) {
        setSelectedBooking(prev => (prev ? { ...prev, status: 'cancelled_by_admin' } : null));
      }
    } else {
      alert(res.error || 'Failed to cancel booking');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
            Operational Manifest
          </span>
          <h1 className="text-2xl font-black text-white mt-1">Driver Manifest & Reservations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry of all driver bookings across Ahmedabad with verified clearance license plates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full font-semibold">
            {bookings.length} Total Reservations
          </span>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by reference (PB-AHM-...), driver, vehicle plate, or spot..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'active' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active ({bookings.filter(b => b.status === 'confirmed' || b.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'completed' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Completed ({bookings.filter(b => b.status === 'completed').length})
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'cancelled' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cancelled ({bookings.filter(b => b.status.includes('cancelled')).length})
            </button>
          </div>
        </div>
      </div>

      {/* Manifest Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Booking Ref</th>
                <th className="py-3.5 px-4">Customer & Vehicle</th>
                <th className="py-3.5 px-4">Parking Spot</th>
                <th className="py-3.5 px-4">Duration Window</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Gross Total</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-400">No reservations found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(b => {
                  const isLive = b.status === 'confirmed' || b.status === 'active';

                  return (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Booking Ref */}
                      <td className="py-3.5 px-4 font-mono font-bold text-accent">
                        {b.booking_reference}
                      </td>

                      {/* Customer & Vehicle */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white">{b.customer?.full_name || 'Driver'}</p>
                        <p className="font-mono text-indigo-400 font-bold flex items-center gap-1 text-[11px]">
                          <Car className="w-3 h-3" />
                          <span>{b.vehicle?.registration_number || 'GJ-01-XX-0000'}</span>
                        </p>
                      </td>

                      {/* Parking Spot */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-200">{b.space?.identifier || 'Reserved Slot'}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-slate-500" />
                          <span>{b.space?.property?.area || 'Ahmedabad'}</span>
                        </p>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <p>{new Date(b.start_time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({b.total_hours}h)
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          b.status === 'confirmed' || b.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : b.status === 'completed'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Gross Total */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        ₹{b.total_amount.toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors"
                          >
                            Pass
                          </button>

                          {isLive && (
                            <>
                              <button
                                onClick={() => handleForceComplete(b)}
                                disabled={actionLoadingId === b.id}
                                title="Force Complete & Release Slot"
                                className="px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition-colors"
                              >
                                Check-out
                              </button>

                              <button
                                onClick={() => {
                                  setCancelModalBooking(b);
                                  setCancelReason('Operational administrative cancellation and refund');
                                }}
                                title="Admin Cancel & Refund"
                                className="px-2 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition-colors"
                              >
                                Refund
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gate Pass & QR Code Inspector Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-accent" />
                <h3 className="text-base font-bold text-white">Gate Clearance Manifest</h3>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clearance Pass Card */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Clearance Reference</span>
                  <p className="font-mono font-extrabold text-white text-base">{selectedBooking.booking_reference}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase font-mono">
                  {selectedBooking.status}
                </span>
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Driver Name</span>
                  <span className="font-semibold text-white">{selectedBooking.customer?.full_name || 'Driver'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Driver Email</span>
                  <span className="font-mono text-slate-400">{selectedBooking.customer?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle Registration</span>
                  <span className="font-mono font-bold text-accent">{selectedBooking.vehicle?.registration_number || 'GJ-01-XX-0000'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Spot Identifier</span>
                  <span className="font-bold text-white">{selectedBooking.space?.identifier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Area</span>
                  <span>{selectedBooking.space?.property?.area}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 font-mono">
                  <span className="text-slate-400">Total Paid</span>
                  <span className="font-bold text-emerald-400">₹{selectedBooking.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel & Refund Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Cancel & Full Refund</h3>
              </div>
              <button onClick={() => setCancelModalBooking(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300">
              You are about to cancel reservation <span className="font-mono font-bold text-accent">{cancelModalBooking.booking_reference}</span>. A 100% refund of <span className="font-mono font-bold text-emerald-400">₹{cancelModalBooking.total_amount.toFixed(2)}</span> will be automatically issued and posted to the double-entry financial ledger.
            </p>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Reason for Cancellation</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
              >
                Abort
              </button>
              <button
                onClick={handleCancelAndRefund}
                disabled={actionLoadingId === cancelModalBooking.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
              >
                Confirm Full Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

