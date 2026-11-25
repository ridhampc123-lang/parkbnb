'use client';

import { useState } from 'react';
import {
  User,
  Shield,
  Copy,
  Check,
  Smartphone,
  Mail,
  Car,
  Bell,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Profile, CustomerVehicle } from '@/types/database';
import {
  updateCustomerProfileAction,
  requestAccountDeletionAction,
} from '@/server/actions/profile-actions';

interface ProfileClientProps {
  profile: Profile;
  vehicles: CustomerVehicle[];
}

export function ProfileClient({ profile, vehicles }: ProfileClientProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [preferredVehicleId, setPreferredVehicleId] = useState(
    profile.preferred_vehicle_id || (vehicles.find((v) => v.is_default)?.id || '')
  );
  const [marketingEmails, setMarketingEmails] = useState(
    profile.privacy_settings?.marketing_emails ?? false
  );
  const [inAppNotifications, setInAppNotifications] = useState(
    profile.privacy_settings?.in_app_notifications ?? true
  );

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const customerId = profile.customer_public_id || 'PBN-C-PENDING';

  const handleCopyId = () => {
    navigator.clipboard.writeText(customerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('phone', phone);
    formData.append('preferred_vehicle_id', preferredVehicleId);
    formData.append('marketing_emails', String(marketingEmails));
    formData.append('in_app_notifications', String(inAppNotifications));

    const result = await updateCustomerProfileAction(formData);
    setSaving(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      setSuccessMessage('Profile and privacy preferences updated successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleDeleteRequest = async () => {
    if (!deletionReason || deletionReason.trim().length < 5) {
      alert('Please provide a reason for the deletion request.');
      return;
    }

    setDeleting(true);
    const result = await requestAccountDeletionAction(deletionReason);
    setDeleting(false);

    if (result.error) {
      alert(result.error);
    } else {
      alert(result.message);
      setShowDeleteModal(false);
      window.location.href = '/login';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          Customer Profile & Privacy
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Manage your account identity, security preferences, and privacy controls.
        </p>
      </div>

      {/* Customer Permanent ID Card */}
      <div className="bg-gradient-to-r from-teal-900 via-primary to-emerald-800 text-white p-5 sm:p-6 rounded-card shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-teal-200 bg-white/10 px-2 py-0.5 rounded-full inline-block mb-1">
            Permanent Public Identifier
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xl sm:text-2xl font-black tracking-wider">
              {customerId}
            </span>
            <button
              onClick={handleCopyId}
              type="button"
              className="p-1.5 rounded-control bg-white/15 hover:bg-white/25 text-white transition-colors"
              title="Copy Customer ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-teal-100 mt-1 max-w-md">
            This anonymized ID protects your privacy. Parking hosts never see your real contact info or full name.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-control backdrop-blur-xs text-xs self-start sm:self-center">
          <Shield className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>DPDP Act Protected</span>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-control bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-control bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-surface rounded-card p-5 sm:p-6 border border-border shadow-xs space-y-6">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Personal Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Full Legal Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-control border border-border bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Registered Email (Primary)
            </label>
            <div className="relative">
              <input
                type="email"
                value={profile.email || 'None'}
                disabled
                className="w-full px-3 py-2 rounded-control border border-border bg-surface-muted text-muted-foreground text-sm cursor-not-allowed"
              />
              <Lock className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Contact support to update registered email address.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Mobile Number (OTP Verified)
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 rounded-control border border-border bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <Smartphone className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Default Parking Vehicle
            </label>
            <select
              value={preferredVehicleId}
              onChange={(e) => setPreferredVehicleId(e.target.value)}
              className="w-full px-3 py-2 rounded-control border border-border bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Select preferred vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} ({v.make_model || v.vehicle_type.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-4">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Notification & Privacy Preferences
          </h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={inAppNotifications}
                onChange={(e) => setInAppNotifications(e.target.checked)}
                className="w-4 h-4 rounded-sm border-border text-primary focus:ring-primary/20"
              />
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  In-App Gate Arrival & Overstay Alerts
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Receive live alerts when your vehicle is checked in or approaching reservation expiry.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingEmails}
                onChange={(e) => setMarketingEmails(e.target.checked)}
                className="w-4 h-4 rounded-sm border-border text-primary focus:ring-primary/20"
              />
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Marketplace Updates & Ahmedabad Promos
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Receive announcements about new parking zones and promotional discounts.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow-xs transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* Account Deletion Section (DPDP Act Compliance) */}
      <div className="bg-rose-50/50 rounded-card p-5 border border-rose-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Request Account Deletion & Data Erasure
            </h3>
            <p className="text-xs text-rose-700 mt-1 max-w-xl">
              Under India's Digital Personal Data Protection (DPDP) Act, you have the right to request erasure of your personal data.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-control transition-colors shrink-0"
          >
            Request Deletion
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-card p-6 max-w-md w-full border border-border shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Confirm Account Deletion Request
            </h3>
            <p className="text-xs text-muted-foreground">
              This action initiates the permanent purge of your customer profile, saved vehicles, and associated identifiers. Active bookings must be completed or cancelled first.
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Reason for deletion (Mandatory)
              </label>
              <textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Please state why you wish to delete your account..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-control border border-border bg-background text-foreground"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-border text-foreground rounded-control text-xs font-semibold hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRequest}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-control text-xs font-bold flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Confirm Erasure</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
