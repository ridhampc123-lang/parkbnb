'use client';

import { useState } from 'react';
import {
  LifeBuoy,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Building,
  CreditCard,
  Car,
  Shield,
  X
} from 'lucide-react';
import { SupportTicket } from '@/types/database';
import { createSupportTicketAction } from '@/server/actions/support-actions';

interface HostSupportClientProps {
  initialTickets: SupportTicket[];
}

export function HostSupportClient({ initialTickets }: HostSupportClientProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('listing_approval');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || subject.trim().length < 5) {
      setErrorMsg('Subject must be at least 5 characters long.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('subject', subject.trim());
    formData.append('category', category);
    formData.append('priority', priority);
    formData.append('description', description.trim());

    try {
      const res = await createSupportTicketAction(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.ticket) {
        setTickets(prev => [res.ticket, ...prev]);
        setShowCreateModal(false);
        setSubject('');
        setDescription('');
      }
    } catch {
      setErrorMsg('Failed to create support ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Host Operations Support</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Get expedited assistance from the ParkBnB Partner Operations team for listing approvals, KYC documents, gate incidents, and payouts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateModal(true);
            setErrorMsg(null);
          }}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow-xs transition-colors flex items-center gap-1.5 shrink-0 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Support Ticket</span>
        </button>
      </div>

      {/* Ticket List */}
      <div className="bg-surface rounded-card border border-border shadow-xs overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <LifeBuoy className="w-8 h-8 text-muted-foreground mx-auto" />
            <h3 className="text-sm font-bold text-foreground">No open host support cases</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              If you ever experience issues with gate clearances, document approvals, or payouts, submit a ticket for our partner desk.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tickets.map((t) => (
              <div key={t.id} className="p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-foreground">
                      {t.ticket_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        t.status === 'resolved' || t.status === 'closed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : t.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {t.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-0.5 rounded-full bg-surface-muted">
                      {t.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span className="text-[11px] text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-foreground">{t.subject}</h4>

                {t.internal_notes && (
                  <div className="p-3 bg-surface-muted rounded-control border border-border text-xs text-muted-foreground space-y-1">
                    <span className="font-bold text-primary block text-[11px]">Partner Operations Response:</span>
                    <p>{t.internal_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-card p-6 max-w-md w-full border border-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Open Host Support Ticket</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-control text-muted-foreground hover:bg-surface-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-danger text-xs rounded-control font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-control border border-border bg-surface text-foreground text-xs"
                >
                  <option value="listing_approval">Listing Verification & Approval Support</option>
                  <option value="kyc_verification">Owner KYC & Society Documents</option>
                  <option value="gate_incident">Driver Gate Incident / Overstay Dispute</option>
                  <option value="payout_issue">Payout Settlement & Bank Details Inquiry</option>
                  <option value="technical">Technical or Availability Calendar Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-control border border-border bg-surface text-foreground text-xs"
                >
                  <option value="low">Low (General inquiry)</option>
                  <option value="medium">Medium (Standard request)</option>
                  <option value="high">High (Driver arriving today / Payout pending)</option>
                  <option value="urgent">Urgent (Active gate blockage / Security emergency)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  placeholder="Brief summary of the issue..."
                  className="w-full px-3 py-2 rounded-control border border-border bg-surface text-foreground text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide all relevant details, booking reference, or slot identifier..."
                  className="w-full p-2.5 rounded-control border border-border text-xs text-foreground bg-surface"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-border rounded-control text-xs font-semibold text-foreground hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
