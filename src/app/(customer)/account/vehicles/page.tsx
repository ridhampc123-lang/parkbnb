'use client';

import { useState } from 'react';
import { addVehicleAction, deleteVehicleAction } from '@/server/actions/vehicle-actions';
import { Car, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { CustomerVehicle } from '@/types/database';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAddVehicle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await addVehicleAction(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.success && result.vehicle) {
      setVehicles(prev => [result.vehicle, ...prev]);
      setSuccess('Vehicle registered successfully.');
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this vehicle?')) return;
    const result = await deleteVehicleAction(id);
    if (result.success) {
      setVehicles(prev => prev.filter(v => v.id !== id));
      setSuccess('Vehicle removed.');
    } else {
      setError(result.error || 'Failed to remove vehicle');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Registered Vehicles</h2>
        <p className="text-xs text-muted-foreground">Add your car or two-wheeler license plates for security clearance at host locations.</p>
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

      {/* Add Vehicle Form */}
      <div className="bg-surface rounded-card p-6 border border-border shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Add New Vehicle</h3>
        <form onSubmit={handleAddVehicle} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">Registration Plate</label>
            <input
              type="text"
              name="registration_number"
              required
              placeholder="e.g. GJ 01 AB 1234"
              className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control uppercase font-mono focus:outline-none focus:border-primary text-foreground"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">Vehicle Type</label>
            <select
              name="vehicle_type"
              className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
            >
              <option value="car_sedan">Sedan</option>
              <option value="car_suv">SUV / MUV</option>
              <option value="car_hatchback">Hatchback</option>
              <option value="two_wheeler">Two-Wheeler / Scooter</option>
              <option value="ev_four_wheeler">Electric Vehicle (EV)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">Make / Model (Optional)</label>
            <input
              type="text"
              name="make_model"
              placeholder="e.g. Hyundai Creta"
              className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-control focus:outline-none focus:border-primary text-foreground"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-1.5 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-control shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 h-[34px]"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> Save Vehicle</>}
            </button>
          </div>
        </form>
      </div>

      {/* Vehicle List */}
      <div className="bg-surface rounded-card p-6 border border-border space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Saved Vehicles</h3>
        {vehicles.length === 0 ? (
          <div className="text-xs text-muted-foreground py-6 text-center">
            No vehicles registered yet. Add your vehicle above for fast checkout.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {vehicles.map((v) => (
              <div key={v.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-muted text-primary rounded-control">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-foreground text-sm">{v.registration_number}</div>
                    <div className="text-muted-foreground capitalize">
                      {v.vehicle_type.replace(/_/g, ' ')} {v.make_model ? `• ${v.make_model}` : ''}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(v.id)}
                  title="Remove vehicle"
                  className="p-1.5 text-muted-foreground hover:text-danger rounded-control hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
