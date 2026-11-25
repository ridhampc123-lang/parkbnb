'use client';

import { useState } from 'react';
import {
  Star,
  MessageSquare,
  AlertTriangle,
  Send,
  CheckCircle2,
  Flag,
  User,
  X,
  Clock
} from 'lucide-react';
import { Review } from '@/types/database';
import { replyToHostReviewAction, reportHostReviewAction } from '@/server/actions/host-actions';

interface HostReviewsClientProps {
  reviews: Review[];
  totalReviews: number;
  averageRating: number;
}

export function HostReviewsClient({
  reviews: initialReviews,
  totalReviews,
  averageRating,
}: HostReviewsClientProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Report modal
  const [reportModalReviewId, setReportModalReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleReply = async (reviewId: string) => {
    if (!replyText || replyText.trim().length < 3) return;

    setIsSubmittingReply(true);
    try {
      const res = await replyToHostReviewAction({
        reviewId,
        responseText: replyText.trim(),
      });

      if (res.success) {
        setReviews(prev =>
          prev.map(r =>
            r.id === reviewId
              ? {
                  ...r,
                  response: {
                    id: 'resp-' + Math.random().toString(36).substring(2, 9),
                    review_id: reviewId,
                    provider_id: 'provider',
                    response_text: replyText.trim(),
                    created_at: new Date().toISOString(),
                  },
                }
              : r
          )
        );
        setReplyReviewId(null);
        setReplyText('');
      }
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleReport = async () => {
    if (!reportModalReviewId || !reportReason || reportReason.trim().length < 5) return;

    setIsSubmittingReport(true);
    try {
      const res = await reportHostReviewAction({
        reviewId: reportModalReviewId,
        reason: reportReason.trim(),
      });

      if (res.success) {
        setReportSuccess(true);
        setReviews(prev =>
          prev.map(r =>
            r.id === reportModalReviewId ? { ...r, is_reported: true } : r
          )
        );
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Verified Customer Reviews</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Feedback and ratings from drivers who completed verified reservations at your parking spaces.
        </p>
      </div>

      {/* Rating Overview Card */}
      <div className="bg-surface rounded-card p-6 border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent-soft text-accent flex items-center justify-center font-extrabold text-2xl font-mono shrink-0">
            {averageRating > 0 ? averageRating.toFixed(1) : '—'}
          </div>

          <div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(averageRating)
                      ? 'text-accent fill-accent'
                      : 'text-border'
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-foreground ml-2">
                {averageRating > 0 ? `${averageRating.toFixed(1)} out of 5 Stars` : 'No reviews yet'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Based on {totalReviews} verified completed parking session{totalReviews === 1 ? '' : 's'}.
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-surface-muted p-3 rounded-control border border-border">
          <span className="font-semibold text-foreground block">Authenticity Guarantee:</span>
          Only drivers with confirmed and completed check-outs can submit reviews. Fake reviews are blocked.
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-surface rounded-card border border-border shadow-xs overflow-hidden">
        {reviews.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto" />
            <h3 className="text-sm font-bold text-foreground">No customer reviews yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Once drivers complete their reservations at your parking slots, their verified ratings and comments will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {reviews.map((r) => (
              <div key={r.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-foreground block">
                        {r.customer?.full_name ? r.customer.full_name.split(' ')[0] + ' ' + (r.customer.full_name.split(' ')[1]?.[0] || '') + '.' : 'Verified Driver'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= r.rating ? 'text-accent fill-accent' : 'text-border'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {r.comment && (
                  <p className="text-xs text-foreground leading-relaxed pl-10">
                    &quot;{r.comment}&quot;
                  </p>
                )}

                {/* Host Response if present */}
                {r.response && (
                  <div className="ml-10 p-3 bg-surface-muted rounded-control border border-border space-y-1 text-xs">
                    <span className="font-bold text-primary block text-[11px]">
                      Your Response:
                    </span>
                    <p className="text-muted-foreground">{r.response.response_text}</p>
                  </div>
                )}

                {/* Actions Row */}
                <div className="flex items-center justify-between pl-10 pt-1 text-xs">
                  {!r.response && replyReviewId !== r.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyReviewId(r.id);
                        setReplyText('');
                      }}
                      className="text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Reply to Driver</span>
                    </button>
                  )}

                  {!r.is_reported ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReportModalReviewId(r.id);
                        setReportReason('');
                        setReportSuccess(false);
                      }}
                      className="text-muted-foreground hover:text-danger text-[11px] flex items-center gap-1 ml-auto"
                    >
                      <Flag className="w-3 h-3" />
                      <span>Report Review</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-amber-700 font-semibold ml-auto flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Report Under Review</span>
                    </span>
                  )}
                </div>

                {/* Inline Reply Form */}
                {replyReviewId === r.id && (
                  <div className="ml-10 pt-2 space-y-2">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a professional response to thank the driver or address concerns..."
                      className="w-full p-2.5 rounded-control border border-border text-xs text-foreground bg-surface focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyReviewId(null)}
                        className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-muted rounded-control"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReply(r.id)}
                        disabled={isSubmittingReply || !replyText.trim()}
                        className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-control hover:bg-primary-hover disabled:opacity-50 flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isSubmittingReply ? 'Posting...' : 'Post Reply'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportModalReviewId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-card p-6 max-w-md w-full border border-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Report Inappropriate Review</h3>
              <button
                type="button"
                onClick={() => setReportModalReviewId(null)}
                className="p-1 rounded-control text-muted-foreground hover:bg-surface-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-control border border-emerald-200">
                  Review reported for moderation. Our trust & safety team will review the driver&apos;s comment within 24 hours.
                </div>
                <button
                  type="button"
                  onClick={() => setReportModalReviewId(null)}
                  className="w-full py-2 bg-primary text-white text-xs font-bold rounded-control"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Explain why this review violates ParkBnB policies (e.g. abusive language, factually false claims, unrelated incident).
                </p>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Violation Details
                  </label>
                  <textarea
                    rows={3}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="w-full p-2.5 rounded-control border border-border text-xs text-foreground bg-surface focus:ring-2 focus:ring-danger/20"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalReviewId(null)}
                    className="px-4 py-2 border border-border rounded-control text-xs font-semibold text-foreground hover:bg-surface-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReport}
                    disabled={isSubmittingReport}
                    className="px-4 py-2 bg-danger text-white rounded-control text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                  >
                    {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
