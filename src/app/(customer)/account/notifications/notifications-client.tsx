'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Receipt,
  LifeBuoy,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Booking, SupportTicket } from '@/types/database';

interface NotificationsClientProps {
  bookings: Booking[];
  tickets: SupportTicket[];
}

interface NotificationItem {
  id: string;
  category: 'booking' | 'gate' | 'payment' | 'support';
  title: string;
  message: string;
  timestamp: string;
  linkText?: string;
  linkHref?: string;
  isImportant?: boolean;
}

export function NotificationsClient({ bookings, tickets }: NotificationsClientProps) {
  const [filter, setFilter] = useState<'all' | 'booking' | 'gate' | 'payment'>('all');

  // Synthesize dynamic notifications from authoritative booking & ticket state
  const notifications: NotificationItem[] = [];

  bookings.forEach((b) => {
    // 1. Upcoming or Confirmed Booking Notice
    if (b.status === 'confirmed') {
      notifications.push({
        id: `notif-confirmed-${b.id}`,
        category: 'booking',
        title: 'Reservation Confirmed & QR Pass Ready',
        message: `Your slot at ${b.space?.title || 'Parking Space'} is secured for ${new Date(b.start_time).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}. Present your digital QR pass at the security gate upon arrival.`,
        timestamp: b.created_at,
        linkText: 'View Digital Pass',
        linkHref: `/account/bookings/${b.id}`,
        isImportant: true,
      });
    }

    // 2. Active Gate Check-in Notice
    if (b.status === 'active' || b.gate_status === 'checked_in') {
      notifications.push({
        id: `notif-gate-${b.id}`,
        category: 'gate',
        title: 'Gate Clearance: Vehicle Checked In',
        message: `Security gate attendant verified vehicle ${b.vehicle?.registration_number || 'Plate'}. Parking session is active. Expected departure: ${new Date(b.end_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.`,
        timestamp: b.check_in_at || b.updated_at,
        linkText: 'Active Session Details',
        linkHref: `/account/bookings/${b.id}`,
      });
    }

    // 3. Completed Booking Notice
    if (b.status === 'completed' || b.gate_status === 'checked_out') {
      notifications.push({
        id: `notif-checkout-${b.id}`,
        category: 'gate',
        title: 'Parking Completed — Gate Departure Recorded',
        message: `Your parking stay at ${b.space?.title || 'Parking Space'} concluded successfully. Thank you for parking with ParkBnB.`,
        timestamp: b.check_out_at || b.updated_at,
        linkText: 'View Receipt',
        linkHref: '/account/payments',
      });
    }

    // 4. Refund Notice
    if (b.status.includes('cancelled')) {
      notifications.push({
        id: `notif-refund-${b.id}`,
        category: 'payment',
        title: 'Reservation Cancelled & Refund Initiated',
        message: `Cancellation for booking ref ${b.booking_customer_reference || b.booking_reference} has been processed. Refund of ₹${Number(b.total_amount).toFixed(2)} routed to original payment source.`,
        timestamp: b.cancelled_at || b.updated_at,
        linkText: 'Refund Tracker',
        linkHref: '/account/payments',
      });
    }
  });

  // Support Ticket notices
  tickets.forEach((t) => {
    notifications.push({
      id: `notif-tkt-${t.id}`,
      category: 'support',
      title: `Support Ticket #${t.ticket_number}: ${t.status.toUpperCase()}`,
      message: `Inquiry regarding "${t.subject}" is currently ${t.status}. ParkBnB customer care is handling your issue.`,
      timestamp: t.updated_at,
      linkText: 'Ticket Center',
      linkHref: '/account/support',
    });
  });

  // Sort newest first
  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.category === filter;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          Notification Center
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Real-time updates regarding your reservations, security gate clearances, and payment transactions.
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('booking')}
          className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${
            filter === 'booking'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Bookings ({notifications.filter((n) => n.category === 'booking').length})
        </button>
        <button
          onClick={() => setFilter('gate')}
          className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${
            filter === 'gate'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Gate Arrivals ({notifications.filter((n) => n.category === 'gate').length})
        </button>
        <button
          onClick={() => setFilter('payment')}
          className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${
            filter === 'payment'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Receipts & Refunds ({notifications.filter((n) => n.category === 'payment').length})
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="bg-surface rounded-card p-12 text-center border border-border">
          <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-sm font-bold text-foreground">No Notifications</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            You're all caught up! Booking confirmations, check-in gate events, and receipts will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-card border transition-all ${
                item.isImportant
                  ? 'bg-teal-50/40 border-teal-200'
                  : 'bg-surface border-border shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-control mt-0.5 shrink-0 ${
                      item.category === 'booking'
                        ? 'bg-primary-soft text-primary'
                        : item.category === 'gate'
                        ? 'bg-emerald-50 text-emerald-600'
                        : item.category === 'payment'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {item.category === 'booking' && <Calendar className="w-4 h-4" />}
                    {item.category === 'gate' && <ShieldCheck className="w-4 h-4" />}
                    {item.category === 'payment' && <Receipt className="w-4 h-4" />}
                    {item.category === 'support' && <LifeBuoy className="w-4 h-4" />}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span>{item.title}</span>
                      {item.isImportant && (
                        <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          New
                        </span>
                      )}
                    </h3>

                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                      {item.message}
                    </p>

                    <span className="text-[10px] text-muted-foreground/75 mt-2 block font-medium">
                      {new Date(item.timestamp).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {item.linkHref && (
                  <Link
                    href={item.linkHref}
                    className="shrink-0 px-3 py-1.5 rounded-control text-xs font-semibold bg-surface border border-border hover:bg-surface-muted transition-colors flex items-center gap-1"
                  >
                    <span>{item.linkText || 'View'}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
