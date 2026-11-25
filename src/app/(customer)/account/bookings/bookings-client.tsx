'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  ArrowRight,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { Booking } from '@/types/database';

type FilterTab = 'all' | 'upcoming' | 'active' | 'completed' | 'cancelled';

export function BookingsClient({ initialBookings }: { initialBookings: Booking[] }) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const now = Date.now();

  // Categorize bookings
  const categorized = initialBookings.map((b) => {
    const startMs = new Date(b.start_time).getTime();
    const endMs = new Date(b.end_time).getTime();
    let category: 'upcoming' | 'active' | 'completed' | 'cancelled' = 'upcoming';

    if (b.status.includes('cancelled') || b.status.includes('refunded')) {
      category = 'cancelled';
    } else if (b.status === 'active') {
      category = 'active';
    } else if (b.status === 'completed') {
      category = 'completed';
    } else if (b.status === 'confirmed') {
      if (now < startMs) {
        category = 'upcoming';
      } else if (now >= startMs && now <= endMs) {
        category = 'active';
      } else {
        category = 'completed';
      }
    }

    return { ...b, category };
  });

  const upcomingCount = categorized.filter((b) => b.category === 'upcoming').length;
  const activeCount = categorized.filter((b) => b.category === 'active').length;
  const completedCount = categorized.filter((b) => b.category === 'completed').length;
  const cancelledCount = categorized.filter((b) => b.category === 'cancelled').length;

  const filtered = categorized.filter((b) => {
    if (activeTab !== 'all' && b.category !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = b.booking_reference?.toLowerCase().includes(q);
      const matchTitle = b.space?.title?.toLowerCase().includes(q);
      const matchArea = b.space?.property?.area?.toLowerCase().includes(q);
      const matchSlot = b.space?.identifier?.toLowerCase().includes(q);
      return matchRef || matchTitle || matchArea || matchSlot;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">My Bookings</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            View active passes, upcoming reservations, entry QR codes, and parking receipts.
          </p>
        </div>
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-control shadow transition-colors w-fit"
        >
          <span>Book Parking Space</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted'
            }`}
          >
            <span>All Bookings</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-surface-muted text-muted-foreground'
              }`}
            >
              {initialBookings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted'
            }`}
          >
            <span>Active Now</span>
            {activeCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                {activeCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'upcoming'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted'
            }`}
          >
            <span>Upcoming</span>
            {upcomingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {upcomingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'completed'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted'
            }`}
          >
            <span>Completed</span>
            {completedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                {completedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'cancelled'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted'
            }`}
          >
            <span>Cancelled</span>
            {cancelledCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                {cancelledCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search booking ref, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border rounded-control text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="bg-surface rounded-card p-12 border border-border text-center space-y-3">
          <div className="p-3 bg-surface-muted rounded-full w-fit mx-auto text-muted-foreground">
            <Calendar className="w-8 h-8 stroke-1" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {searchQuery
              ? 'No matching reservations'
              : activeTab === 'active'
              ? 'No active parking sessions right now'
              : activeTab === 'upcoming'
              ? 'No upcoming reservations scheduled'
              : activeTab === 'completed'
              ? 'No completed parking history'
              : activeTab === 'cancelled'
              ? 'No cancelled bookings'
              : 'No bookings found'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? 'Try modifying your search query or switch back to the All Bookings tab.'
              : 'Reserve a secure parking spot in seconds across verified commercial and residential hubs.'}
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-control shadow transition-colors"
          >
            <span>Explore Available Parking</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const isLive = b.category === 'active';
            const isConfirmed = b.status === 'confirmed';
            const isCompleted = b.category === 'completed';
            const isCancelled = b.category === 'cancelled';

            return (
              <div
                key={b.id}
                className={`bg-surface rounded-card p-5 border transition-all ${
                  isLive
                    ? 'border-blue-500/60 shadow-md ring-1 ring-blue-500/20'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left Column: Details */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground bg-surface-muted px-2 py-0.5 rounded border border-border">
                        {b.booking_reference}
                      </span>
                      {isLive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          Live Session Active
                        </span>
                      )}
                      {isConfirmed && !isLive && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Confirmed & Ready
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          Completed
                        </span>
                      )}
                      {isCancelled && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-foreground">{b.space?.title}</h3>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>
                          {b.space?.property?.area} • Bay{' '}
                          <strong className="text-foreground">{b.space?.identifier}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-foreground font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>
                        {new Date(b.start_time).toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        • {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        - {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Pricing & Pass Link */}
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                    <div className="text-left sm:text-right">
                      <div className="text-base font-black text-foreground">₹{b.total_amount.toFixed(2)}</div>
                      <div className="text-[10px] text-muted-foreground">Paid (Base + 18% GST)</div>
                    </div>

                    <Link
                      href={`/account/bookings/${b.id}`}
                      className={`px-3.5 py-1.5 font-semibold text-xs rounded-control transition-all flex items-center gap-1.5 shadow-sm ${
                        isLive
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-primary-soft text-primary hover:bg-primary hover:text-white'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{isLive ? 'Active Gate Pass' : 'View Pass & QR'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
