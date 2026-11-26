'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { vehicleSchema } from '@/lib/validation/schemas';
import { repository } from '@/lib/db/supabase-repository';
import { CustomerVehicle } from '@/types/database';

export async function addVehicleAction(formData: FormData) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'You must be signed in to manage vehicles.' };
  }

  const rawData = {
    vehicle_type: formData.get('vehicle_type'),
    registration_number: formData.get('registration_number'),
    make_model: formData.get('make_model') || undefined,
    color: formData.get('color') || undefined,
    is_default: formData.get('is_default') === 'true',
  };

  const validation = vehicleSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const vehicle: CustomerVehicle = {
    id: crypto.randomUUID(),
    customer_id: session.user.id,
    vehicle_type: validation.data.vehicle_type,
    registration_number: validation.data.registration_number,
    make_model: validation.data.make_model || null,
    color: validation.data.color || null,
    is_default: validation.data.is_default,
    created_at: new Date().toISOString(),
  };

  await repository.createVehicle(vehicle);
  revalidatePath('/account/vehicles');
  return { success: true, vehicle };
}

export async function deleteVehicleAction(vehicleId: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Unauthorized' };
  }

  const success = await repository.deleteVehicle(vehicleId, session.user.id);
  if (!success) {
    return { error: 'Unable to remove vehicle. Resource not found or permission denied.' };
  }

  revalidatePath('/account/vehicles');
  return { success: true };
}
