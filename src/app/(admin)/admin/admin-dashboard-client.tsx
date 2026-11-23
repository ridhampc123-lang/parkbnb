'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Car,
  Calendar,
  IndianRupee,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  AlertCircle,
  TrendingUp,
  Download,
  Filter,
  ArrowRight,
  LifeBuoy,
  Search,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { exportAdminReportAction } from '@/server/actions/admin-actions';

interface DashboardMetrics {
  totalCustomers: number;
  activeCustomers: number;
  suspendedCustomers: number;
  totalParkingOwners: number;
  verifiedOwners: number;
  pendingOwnerVerification: number;
  rejectedOwners: number;
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  rejectedListings: number;
  availableParkingSpaces: number;
  totalBookings: number;
  upcomingBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  paymentTotals: number;
  platformRevenue: number;
  ownerPayableBalance: number;
  pendingPayouts: number;
  refundRequests: number;
  supportTickets: number;
  openDisputes: number;
  maintenanceMode: boolean;
}

export function AdminDashboardClient({
  initialMetrics,
}: {
  initialMetrics: DashboardMetrics;
}) {
  const [metrics] = useState<DashboardMetrics>(initialMetrics);
  const [timeFilter, setTimeFilter] = useState<'today' | '7days' | '30days' | 'all'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleExport = async (type: 'customers' | 'hosts' | 'bookings' | 'ledger') => {
    setIsExporting(true);
    setFeedback(null);
    try {
      const res = await exportAdminReportAction(type);
      if (res.error) {
        setFeedback(`Export error: ${res.error}`);
      } else if (res.csvContent && res.filename) {
        const blob = new Blob([res.csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', res.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setFeedback(`Successfully exported ${res.filename}`);
      }
    } catch {
      setFeedback('Failed to generate export file.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Top Header & Operational Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Operational Telemetry
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live DB Queries
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Admin Command Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-dimensional operational metrics across ParkBnB marketplace.
          </p>
        </div>

        {/* Date Filter & Export Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs font-semibold text-slate-300">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeFilter === 'today' ? 'bg-cyan-600 text-white' : 'hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('7days')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeFilter === '7days' ? 'bg-cyan-600 text-white' : 'hover:text-white'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setTimeFilter('30days')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeFilter === '30days' ? 'bg-cyan-600 text-white' : 'hover:text-white'
              }`}
            >
              30D
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeFilter === 'all' ? 'bg-cyan-600 text-white' : 'hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleExport('bookings')}
              disabled={isExporting}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Export Bookings CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export</span>
            </button>

            <Link
              href="/admin/users"
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Privileged Lookup</span>
            </Link>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* SECTION 1: FINANCIAL OVERVIEW */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-emerald-400" />
          <span>Financial Performance & Escrow Balance</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Payment Totals (GMV) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Gross Booking Volume</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              ₹{metrics.paymentTotals.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500">Total customer collections</p>
          </div>

          {/* Platform Revenue */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Platform Commission</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-purple-300 font-mono">
              ₹{metrics.platformRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500">15% Convenience Fee + 18% GST</p>
          </div>

          {/* Owner Payable Balance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Owner Payable Balance</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-300 font-mono">
              ₹{metrics.ownerPayableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500">Earned by parking hosts</p>
          </div>

          {/* Pending Payouts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Pending Escrow Payouts</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
              ₹{metrics.pendingPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Awaiting disbursement</span>
              <Link href="/admin/hosts" className="text-cyan-400 hover:underline">
                Disburse →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: BOOKINGS STATE MACHINE */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span>Bookings & Reservations State Machine</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Total Bookings</span>
            <p className="text-xl font-black text-white font-mono">{metrics.totalBookings}</p>
            <span className="text-[10px] text-slate-500">All registered intents</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Upcoming Bookings</span>
            <p className="text-xl font-black text-emerald-400 font-mono">{metrics.upcomingBookings}</p>
            <span className="text-[10px] text-slate-500">Confirmed & pending arrival</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Active Sessions</span>
            <p className="text-xl font-black text-blue-400 font-mono">{metrics.activeBookings}</p>
            <span className="text-[10px] text-slate-500">Vehicle currently parked</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Completed Bookings</span>
            <p className="text-xl font-black text-purple-400 font-mono">{metrics.completedBookings}</p>
            <span className="text-[10px] text-slate-500">Checked out & closed</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Cancelled Bookings</span>
            <p className="text-xl font-black text-rose-400 font-mono">{metrics.cancelledBookings}</p>
            <span className="text-[10px] text-slate-500">Customer or host cancelled</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: INVENTORY & SUPPLY TELEMETRY */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Car className="w-4 h-4 text-blue-400" />
          <span>Parking Inventory & Supply Status</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Total Listings</span>
            <p className="text-xl font-black text-white font-mono">{metrics.totalListings}</p>
            <span className="text-[10px] text-slate-500">Spaces submitted by owners</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Active & Bookable</span>
            <p className="text-xl font-black text-emerald-400 font-mono">{metrics.activeListings}</p>
            <span className="text-[10px] text-slate-500">Live in Ahmedabad search</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Pending Verifications</span>
            <p className="text-xl font-black text-amber-400 font-mono">{metrics.pendingListings}</p>
            <Link href="/admin/verifications" className="text-[10px] text-cyan-400 hover:underline block">
              Review Queue →
            </Link>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Rejected Listings</span>
            <p className="text-xl font-black text-rose-400 font-mono">{metrics.rejectedListings}</p>
            <span className="text-[10px] text-slate-500">Failed property check</span>
          </div>
        </div>
      </div>

      {/* SECTION 4: PARTICIPANTS & CUSTOMER DIRECTORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Accounts Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Customer Accounts</span>
            </h3>
            <Link href="/admin/users" className="text-xs text-cyan-400 hover:underline">
              Manage Customers →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Total</span>
              <span className="text-lg font-black text-white font-mono">{metrics.totalCustomers}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Active</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{metrics.activeCustomers}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Suspended</span>
              <span className="text-lg font-black text-rose-400 font-mono">{metrics.suspendedCustomers}</span>
            </div>
          </div>
        </div>

        {/* Parking Owners Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Parking Owners (Hosts)</span>
            </h3>
            <Link href="/admin/hosts" className="text-xs text-cyan-400 hover:underline">
              Manage Owners →
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Total</span>
              <span className="text-lg font-black text-white font-mono">{metrics.totalParkingOwners}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Verified</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{metrics.verifiedOwners}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Pending</span>
              <span className="text-lg font-black text-amber-400 font-mono">{metrics.pendingOwnerVerification}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Rejected</span>
              <span className="text-lg font-black text-rose-400 font-mono">{metrics.rejectedOwners}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: DISPUTES, INCIDENTS & ARBITRATION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-white text-sm">Customer Complaints & Disputes</h3>
          </div>
          <Link href="/admin/disputes" className="text-xs text-cyan-400 hover:underline">
            Resolve Disputes →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Support Tickets</span>
              <p className="text-xl font-black text-white font-mono">{metrics.supportTickets}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <LifeBuoy className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Open Access Disputes</span>
              <p className="text-xl font-black text-amber-400 font-mono">{metrics.openDisputes}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Refund Claims</span>
              <p className="text-xl font-black text-rose-400 font-mono">{metrics.refundRequests}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
