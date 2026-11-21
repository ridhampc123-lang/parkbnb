'use client';

import { useState } from 'react';
import { resolveDisputeAction } from '@/server/actions/admin-actions';
import {
  LifeBuoy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Clock,
  Loader2
} from 'lucide-react';
import { SupportTicket } from '@/types/database';

export default function AdminDisputesPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'tkt-001',
      ticket_number: 'TKT-928174',
      user_id: 'usr-customer-001',
      booking_id: 'bkg-demo-01',
      subject: 'Security barrier attendant refused entry claiming space was private',
      category: 'access_denied',
      priority: 'urgent',
      status: 'open',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleResolve(ticketId: string, resolution: 'refund_full' | 'reject') {
    setProcessingId(ticketId);
    setFeedback(null);

    const result = await resolveDisputeAction({
      ticketId,
      resolution,
      resolutionNotes: resolution === 'refund_full'
        ? 'Admin approved full refund due to premise access failure'
        : 'Dispute investigated and rejected',
    });

    if (result.success) {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'resolved' } : t));
      setFeedback(resolution === 'refund_full'
        ? 'Dispute resolved: 100% full refund credited to customer in ledger and booking marked refunded.'
        : 'Dispute closed without refund.'
      );
    } else {
      alert(result.error || 'Failed to process dispute');
    }
    setProcessingId(null);
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
          Customer Protection & Arbitration
        </span>
        <h1 className="text-2xl font-black text-white mt-1">Disputes & Incident Arbitration</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review customer premise access reports, verify incidents with hosts, and execute authorized refunds.
        </p>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-control text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-card p-12 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h2 className="text-base font-bold text-white">Zero open disputes</h2>
          <p className="text-xs text-slate-400">All customer support inquiries and access disputes have been arbitrated.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900 border border-slate-800 rounded-card p-6 space-y-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-300">{t.ticket_number}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      t.status === 'open' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {t.status}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                      {t.priority}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{t.subject}</h3>
                  <div className="text-xs text-slate-400">
                    Category: <span className="capitalize text-slate-200">{t.category.replace(/_/g, ' ')}</span> • Reported: {new Date(t.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Arbitration Controls */}
                {t.status === 'open' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResolve(t.id, 'refund_full')}
                      disabled={processingId === t.id}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-control shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {processingId === t.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Issue 100% Full Refund</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleResolve(t.id, 'reject')}
                      disabled={processingId === t.id}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-control transition-colors"
                    >
                      Dismiss Case
                    </button>
                  </div>
                )}
              </div>

              <div className="text-xs bg-slate-950/70 p-3.5 rounded-control border border-slate-800/80 text-slate-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="block text-slate-200 font-semibold mb-0.5">Policy Arbitration Rule:</strong>
                  If the driver was unable to park due to host unavailability or gate barrier denial within 30 minutes of arrival, the platform immediately credits a 100% refund to the driver and charges the reversal to the host escrow account.
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
