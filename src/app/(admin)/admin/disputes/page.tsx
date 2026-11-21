import { getLocalStore } from '@/lib/store/marketplace-store';
import { LifeBuoy, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminDisputesPage() {
  const store = getLocalStore();
  const tickets = store.getAllTickets();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Disputes & Incident Arbitration</h2>
        <p className="text-xs text-muted-foreground">Review access failures, incorrect listings, and damage reports in Ahmedabad.</p>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-surface rounded-card p-12 border border-border text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-foreground">Zero open disputes</h3>
          <p className="text-xs text-muted-foreground">All customer and provider support tickets are resolved.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-card border border-border overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-muted border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Ticket #</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-surface-muted/50 transition-colors">
                  <td className="p-3.5 font-mono font-bold">{t.ticket_number}</td>
                  <td className="p-3.5 font-semibold text-foreground">{t.subject}</td>
                  <td className="p-3.5 capitalize">{t.category}</td>
                  <td className="p-3.5 uppercase font-bold text-[10px] text-amber-700">{t.priority}</td>
                  <td className="p-3.5">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
