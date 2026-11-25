'use client';

import { useState } from 'react';
import {
  CreditCard,
  Receipt,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDownLeft,
  ChevronRight,
  Filter,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { Booking } from '@/types/database';

interface PaymentsClientProps {
  bookings: Booking[];
  customerName: string;
}

export function PaymentsClient({ bookings, customerName }: PaymentsClientProps) {
  const [filter, setFilter] = useState<'all' | 'captured' | 'refunded'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Booking | null>(null);

  // Filter out pending holds, only show actual transactions
  const paymentBookings = bookings.filter((b) =>
    ['confirmed', 'active', 'completed', 'cancelled_by_customer', 'cancelled_by_provider'].includes(b.status)
  );

  const filteredBookings = paymentBookings.filter((b) => {
    if (filter === 'captured') {
      return ['confirmed', 'active', 'completed'].includes(b.status);
    }
    if (filter === 'refunded') {
      return b.status.includes('cancelled');
    }
    return true;
  });

  const totalSpent = paymentBookings
    .filter((b) => ['confirmed', 'active', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  const totalRefunded = paymentBookings
    .filter((b) => b.status.includes('cancelled'))
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          Payment Receipts & Refunds
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          View official tax invoices, payment transaction records, and automated refund tracking.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-card p-4 sm:p-5 border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Paid (Gross)</span>
            <div className="p-2 rounded-control bg-primary-soft text-primary">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            ₹{totalSpent.toFixed(2)}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {paymentBookings.filter((b) => ['confirmed', 'active', 'completed'].includes(b.status)).length} Successful Transactions
          </span>
        </div>

        <div className="bg-surface rounded-card p-4 sm:p-5 border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Refunded</span>
            <div className="p-2 rounded-control bg-blue-50 text-blue-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            ₹{totalRefunded.toFixed(2)}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {paymentBookings.filter((b) => b.status.includes('cancelled')).length} Refunded Reservations
          </span>
        </div>

        <div className="bg-surface rounded-card p-4 sm:p-5 border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Gateway & Escrow</span>
            <div className="p-2 rounded-control bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-foreground mt-2">
            Razorpay Automated
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            PCI-DSS 256-bit Encrypted
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          All Receipts ({paymentBookings.length})
        </button>
        <button
          onClick={() => setFilter('captured')}
          className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${
            filter === 'captured'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Paid ({paymentBookings.filter((b) => ['confirmed', 'active', 'completed'].includes(b.status)).length})
        </button>
        <button
          onClick={() => setFilter('refunded')}
          className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${
            filter === 'refunded'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Refunds ({paymentBookings.filter((b) => b.status.includes('cancelled')).length})
        </button>
      </div>

      {/* Payments Table / Cards */}
      {filteredBookings.length === 0 ? (
        <div className="bg-surface rounded-card p-12 text-center border border-border">
          <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-sm font-bold text-foreground">No Transactions Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            When you complete a parking reservation, official GST invoices and payment receipts will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-card border border-border shadow-xs overflow-hidden">
          <div className="divide-y divide-border">
            {filteredBookings.map((b) => {
              const isRefunded = b.status.includes('cancelled');
              return (
                <div
                  key={b.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-control mt-0.5 shrink-0 ${
                        isRefunded
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {isRefunded ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">
                          {b.space?.title || 'Covered Parking Bay'}
                        </span>
                        <span className="font-mono text-[11px] bg-surface-muted px-2 py-0.5 rounded-control border border-border text-muted-foreground">
                          {b.booking_customer_reference || b.booking_reference}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isRefunded
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isRefunded ? 'Refund Processed' : 'Payment Captured'}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1">
                        Reserved on {new Date(b.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })} • Vehicle: {b.vehicle?.registration_number || 'Plate Saved'} • Duration: {b.total_hours} hr(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-base font-extrabold ${
                          isRefunded ? 'text-blue-700 line-through' : 'text-foreground'
                        }`}
                      >
                        ₹{Number(b.total_amount).toFixed(2)}
                      </div>
                      {isRefunded && (
                        <span className="text-[11px] font-semibold text-blue-600 block">
                          Refunded ₹{Number(b.total_amount).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedReceipt(b)}
                      className="px-3 py-1.5 rounded-control border border-border text-xs font-semibold hover:bg-surface-muted flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span>Invoice</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invoice Breakdown Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-card p-6 max-w-lg w-full border border-border shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  Official Marketplace Receipt
                </span>
                <h3 className="text-base font-bold text-foreground">
                  Invoice #{selectedReceipt.booking_customer_reference || selectedReceipt.booking_reference}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Billed To</span>
                <span className="font-semibold text-foreground">{customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Parking Space</span>
                <span className="font-semibold text-foreground text-right">
                  {selectedReceipt.space?.title || 'Parking Bay'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Slot Duration</span>
                <span className="font-semibold text-foreground">
                  {selectedReceipt.total_hours} Hours
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Base Parking Fee</span>
                <span className="font-mono font-semibold text-foreground">
                  ₹{Number(selectedReceipt.base_amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Platform Service Fee (15%)</span>
                <span className="font-mono font-semibold text-foreground">
                  ₹{Number(selectedReceipt.platform_fee).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">GST (18% on Platform Fee)</span>
                <span className="font-mono font-semibold text-foreground">
                  ₹{Number(selectedReceipt.tax_amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-border text-sm">
                <span className="font-bold text-foreground">Total Paid (INR)</span>
                <span className="font-mono font-black text-primary text-base">
                  ₹{Number(selectedReceipt.total_amount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-surface-muted rounded-control text-[11px] text-muted-foreground">
              <span>Payment Gateway: Razorpay India Ltd. • Payment Method: UPI / Netbanking • Transaction Status: Captured</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
