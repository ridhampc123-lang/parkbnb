'use client';

import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  X,
  Building,
  Car
} from 'lucide-react';
import { ParkingSpace, Booking, AvailabilityBlock } from '@/types/database';
import {
  createHostAvailabilityBlockAction,
  deleteHostAvailabilityBlockAction,
} from '@/server/actions/host-actions';

interface HostCalendarClientProps {
  spaces: ParkingSpace[];
  initialBookings: Booking[];
  initialBlocks: AvailabilityBlock[];
}

export function HostCalendarClient({
  spaces,
  initialBookings,
  initialBlocks,
}: HostCalendarClientProps) {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(spaces[0]?.id || 'all');
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>(initialBlocks);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  // Modal State
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockSpaceId, setBlockSpaceId] = useState(spaces[0]?.id || '');
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  // Filter bookings and blocks based on selected space
  const filteredBookings = bookings.filter(b =>
    selectedSpaceId === 'all' ? true : b.space_id === selectedSpaceId
  );
  const filteredBlocks = blocks.filter(b =>
    selectedSpaceId === 'all' ? true : b.space_id === selectedSpaceId
  );

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlockError(null);

    if (!blockSpaceId || !blockStart || !blockEnd) {
      setBlockError('Please fill out all required time interval fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createHostAvailabilityBlockAction({
        spaceId: blockSpaceId,
        startTime: new Date(blockStart).toISOString(),
        endTime: new Date(blockEnd).toISOString(),
        reason: blockReason || 'Maintenance Block',
      });

      if (res.error) {
        setBlockError(res.error);
      } else if (res.block) {
        setBlocks(prev => [...prev, res.block!]);
        setShowBlockModal(false);
        setBlockStart('');
        setBlockEnd('');
        setBlockReason('');
      }
    } catch {
      setBlockError('Failed to create availability block.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to remove this availability block? The time slot will immediately reopen for driver bookings.')) {
      return;
    }

    setBlocks(prev => prev.filter(b => b.id !== blockId));
    await deleteHostAvailabilityBlockAction(blockId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Availability Calendar</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage your slot schedules, review booked intervals, and block dates for personal use or building maintenance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Space Filter Dropdown */}
          <select
            value={selectedSpaceId}
            onChange={(e) => setSelectedSpaceId(e.target.value)}
            className="px-3.5 py-2 rounded-control border border-border bg-surface text-foreground text-xs font-semibold focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Listed Spaces ({spaces.length})</option>
            {spaces.map(s => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.identifier})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setBlockSpaceId(selectedSpaceId === 'all' ? (spaces[0]?.id || '') : selectedSpaceId);
              setShowBlockModal(true);
              setBlockError(null);
            }}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Block Dates</span>
          </button>
        </div>
      </div>

      {/* Schedule Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface p-4 rounded-card border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-control bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            {filteredBookings.filter(b => b.status === 'confirmed').length}
          </div>
          <div className="text-xs">
            <span className="font-bold text-foreground block">Confirmed Bookings</span>
            <span className="text-muted-foreground">Reserved by drivers</span>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-card border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-control bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            {filteredBookings.filter(b => b.status === 'active').length}
          </div>
          <div className="text-xs">
            <span className="font-bold text-foreground block">Active Sessions</span>
            <span className="text-muted-foreground">Vehicle currently parked</span>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-card border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-control bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            {filteredBlocks.length}
          </div>
          <div className="text-xs">
            <span className="font-bold text-foreground block">Owner Blocks</span>
            <span className="text-muted-foreground">Closed for maintenance/use</span>
          </div>
        </div>
      </div>

      {/* Visual Timeline Schedule */}
      <div className="bg-surface rounded-card border border-border shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <span>Upcoming Timeline & Manifest Schedule</span>
          </h2>
          <span className="text-xs text-muted-foreground">
            Indian Standard Time (Asia/Kolkata)
          </span>
        </div>

        {filteredBookings.length === 0 && filteredBlocks.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CalendarIcon className="w-8 h-8 text-muted-foreground mx-auto" />
            <h3 className="text-sm font-bold text-foreground">All slots are open for reservations</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No upcoming customer bookings or maintenance blocks are currently scheduled for this selection.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Confirmed / Active Bookings */}
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                className={`p-4 rounded-control border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  b.status === 'active'
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-blue-50/60 border-blue-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        b.status === 'active'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-blue-700 text-white'
                      }`}
                    >
                      {b.status === 'active' ? 'Vehicle Parked' : 'Confirmed Booking'}
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground">
                      {b.booking_reference}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-foreground">
                    Slot {b.space?.identifier || 'Assigned'} • Vehicle: {b.vehicle?.registration_number || 'Cleared Plate'} ({b.customer_display_name || 'Driver'})
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(b.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      {' → '}
                      {new Date(b.end_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-sm font-extrabold text-foreground block">
                    ₹{b.provider_payout_amount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Net Payout
                  </span>
                </div>
              </div>
            ))}

            {/* Maintenance Blocks */}
            {filteredBlocks.map((blk) => (
              <div
                key={blk.id}
                className="p-4 rounded-control border border-slate-300 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-700 text-white">
                      Maintenance / Owner Block
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {blk.reason}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(blk.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      {' → '}
                      {new Date(blk.end_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteBlock(blk.id)}
                  className="px-3 py-1.5 text-xs font-bold rounded-control text-danger border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-1 self-start sm:self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Block</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Block Dates Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface rounded-t-2xl sm:rounded-card p-5 sm:p-6 max-w-md w-full border-t sm:border border-border shadow-xl space-y-4 pb-safe animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1 bg-border rounded-full mx-auto mb-1 sm:hidden shrink-0" />

            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Block Parking Dates</h3>
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                className="p-1 rounded-control text-muted-foreground hover:bg-surface-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {blockError && (
              <div className="p-3 bg-red-50 text-danger text-xs rounded-control border border-red-200 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{blockError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBlock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Select Parking Space
                </label>
                <select
                  value={blockSpaceId}
                  onChange={(e) => setBlockSpaceId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs focus:ring-2 focus:ring-primary/20"
                >
                  {spaces.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.identifier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Reason for Block
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="E.g., Building painting, gate repair, private guest visit"
                  className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-xs focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 border border-border rounded-control text-xs font-semibold text-foreground hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Validating Conflicts...' : 'Confirm Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
