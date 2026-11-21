'use client';

import { useState } from 'react';
import { createSupportTicketAction } from '@/server/actions/support-actions';
import { LifeBuoy, AlertCircle, CheckCircle2, Loader2, Plus } from 'lucide-react';
import { SupportTicket } from '@/types/database';

export default function CustomerSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleCreateTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createSupportTicketAction(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.success && result.ticket) {
      setTickets(prev => [result.ticket, ...prev]);
      setSuccess(`Support ticket ${result.ticket.ticket_number} created successfully.`);
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Customer Support & Dispute Center</h2>
        <p className="text-xs text-muted-foreground">Report premise access problems, vehicle compatibility issues, or refund questions.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-danger rounded-control text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-control text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Ticket Creation Form */}
      <div className="bg-surface rounded-card p-6 border border-border shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Open New Case</h3>
        <form onSubmit={handleCreateTicket} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">Issue Category</label>
              <select
                name="category"
                className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
              >
                <option value="access_denied">Could not access parking / Gate refused</option>
                <option value="space_occupied">Space already occupied by another vehicle</option>
                <option value="listing_mismatch">Listing info inaccurate / Height mismatch</option>
                <option value="refund_inquiry">Cancellation / Refund inquiry</option>
                <option value="general">General Support</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">Priority</label>
              <select
                name="priority"
                className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
              >
                <option value="urgent">Urgent (Currently at location)</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">Subject</label>
            <input
              type="text"
              name="subject"
              required
              placeholder="e.g. Security guard at Prahlad Nagar Hub did not recognize booking"
              className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="py-2 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> Submit Support Ticket</>}
          </button>
        </form>
      </div>

      {/* Ticket List */}
      <div className="bg-surface rounded-card p-6 border border-border space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Your Support History</h3>
        {tickets.length === 0 ? (
          <div className="text-xs text-muted-foreground py-6 text-center">
            You do not have any open tickets or dispute inquiries.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tickets.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-foreground">{t.subject}</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">
                    Ticket: <span className="font-mono">{t.ticket_number}</span> • Category: {t.category}
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
