'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { spaceSchema } from '@/lib/validation/schemas';
import { repository } from '@/lib/db/supabase-repository';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { ParkingSpace, Property, VehicleType } from '@/types/database';

export async function createSpaceAction(formData: FormData) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required. Please sign in as a host.' };
  }

  const vehicleTypes = formData.getAll('vehicle_types') as VehicleType[];
  const securityFeatures = formData.getAll('security_features') as string[];

  const propertyTitle = (formData.get('property_title') as string)?.trim() || '';
  const area = (formData.get('area') as string)?.trim() || '';
  const city = (formData.get('city') as string)?.trim() || 'Ahmedabad';
  const parkingType = (formData.get('parking_type') as string)?.trim() || 'covered';

  // Robust, foolproof listing title resolution that NEVER fails validation
  const rawTitle = (
    (formData.get('title') as string) ||
    (formData.get('title_custom') as string) ||
    (formData.get('title_select') as string)
  )?.trim();

  let resolvedTitle = rawTitle;
  if (!resolvedTitle || resolvedTitle === '__custom__' || resolvedTitle.length < 3) {
    if (propertyTitle && area) {
      resolvedTitle = `${parkingType === 'covered' ? 'Covered Parking' : 'Reserved Parking'} at ${propertyTitle}, ${area}`;
    } else if (propertyTitle) {
      resolvedTitle = `${propertyTitle} Reserved Parking Bay`;
    } else if (area) {
      resolvedTitle = `Reserved Parking Bay in ${area}, ${city}`;
    } else {
      resolvedTitle = 'Covered Reserved Parking Bay';
    }
  }

  const rawData = {
    title: resolvedTitle,
    property_title: propertyTitle,
    property_type: formData.get('property_type'),
    city,
    area,
    address_line1: formData.get('address_line1'),
    postal_code: formData.get('postal_code'),
    latitude: Number(formData.get('latitude') || 23.0225),
    longitude: Number(formData.get('longitude') || 72.5714),
    identifier: formData.get('identifier'),
    parking_type: parkingType,
    hourly_rate: Number(formData.get('hourly_rate')),
    daily_rate: formData.get('daily_rate') ? Number(formData.get('daily_rate')) : undefined,
    monthly_rate: formData.get('monthly_rate') ? Number(formData.get('monthly_rate')) : undefined,
    has_ev_charging: formData.get('has_ev_charging') === 'true',
    height_limit_meters: formData.get('height_limit_meters') ? Number(formData.get('height_limit_meters')) : undefined,
    access_instructions: formData.get('access_instructions'),
    security_features: securityFeatures.length > 0 ? securityFeatures : ['cctv', 'gated_security'],
    vehicle_types: vehicleTypes.length > 0 ? vehicleTypes : ['car_sedan', 'car_suv', 'car_hatchback'],
  };

  const validation = spaceSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const store = getLocalStore();

  // If host provided or updated payout details during space registration, persist them securely
  const bank_name = (formData.get('bank_name') as string)?.trim();
  const bank_account_holder = (formData.get('bank_account_holder') as string)?.trim();
  const bank_account_number = (formData.get('bank_account_number') as string)?.trim();
  const bank_ifsc_code = (formData.get('bank_ifsc_code') as string)?.trim()?.toUpperCase();
  const upi_id = (formData.get('upi_id') as string)?.trim();
  const payout_preference = (formData.get('payout_preference') as 'bank_transfer' | 'upi') || 'bank_transfer';

  if (bank_account_number || bank_ifsc_code || upi_id) {
    const existingProvider = store.getProviderProfile(session.user.id);
    if (existingProvider) {
      store.updateProviderPayoutDetails(session.user.id, {
        bank_name: bank_name || existingProvider.bank_name,
        bank_account_holder: bank_account_holder || existingProvider.bank_account_holder || session.profile?.full_name,
        bank_account_number: bank_account_number || existingProvider.bank_account_number,
        bank_ifsc_code: bank_ifsc_code || existingProvider.bank_ifsc_code,
        upi_id: upi_id || existingProvider.upi_id,
        payout_preference: payout_preference || existingProvider.payout_preference,
      });
    } else {
      store.saveProviderProfile({
        id: session.user.id,
        provider_type: 'individual_residential',
        verification_status: 'draft',
        bank_name: bank_name || null,
        bank_account_holder: bank_account_holder || session.profile?.full_name || null,
        bank_account_number: bank_account_number || null,
        bank_ifsc_code: bank_ifsc_code || null,
        upi_id: upi_id || null,
        payout_preference,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  // 1. Create Property Record
  const propertyId = 'prop-' + Math.random().toString(36).substring(2, 9);
  const property: Property = {
    id: propertyId,
    provider_id: session.user.id,
    title: validation.data.property_title,
    property_type: validation.data.property_type,
    address_line1: validation.data.address_line1,
    area: validation.data.area,
    city: validation.data.city,
    postal_code: validation.data.postal_code,
    latitude: validation.data.latitude,
    longitude: validation.data.longitude,
    created_at: new Date().toISOString(),
  };
  store.createProperty(property);

  // 2. Create Parking Space (Strictly pending review until Admin approves)
  const spaceId = 'spc-' + Math.random().toString(36).substring(2, 9);
  const space: ParkingSpace = {
    id: spaceId,
    property_id: propertyId,
    provider_id: session.user.id,
    identifier: validation.data.identifier,
    title: validation.data.title,
    description: (formData.get('description') as string) || `Covered and secure parking space in ${validation.data.area}, ${validation.data.city}.`,
    parking_type: validation.data.parking_type,
    hourly_rate: validation.data.hourly_rate,
    daily_rate: validation.data.daily_rate || null,
    monthly_rate: validation.data.monthly_rate || null,
    min_duration_hours: 1,
    max_duration_hours: 720,
    access_instructions: validation.data.access_instructions,
    security_features: validation.data.security_features,
    has_ev_charging: validation.data.has_ev_charging,
    height_limit_meters: validation.data.height_limit_meters || null,
    status: 'submitted', // Under review by Admin
    is_active: false,    // INACTIVE until Admin verifies and approves
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    property,
    photos: [
      {
        id: 'p-' + Math.random().toString(36).substring(2, 9),
        space_id: spaceId,
        storage_path: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
        is_primary: true,
        display_order: 0,
        created_at: new Date().toISOString(),
      }
    ],
    vehicle_types: validation.data.vehicle_types,
  };

  await repository.createParkingSpace(space);

  // Record Admin Audit Log
  await repository.recordAuditLog({
    operator_email: session.profile?.email || 'host@parkbnb.in',
    action: 'SPACE_SUBMITTED',
    category: 'space',
    target_id: spaceId,
    target_name: space.title,
    details: `Owner ${session.profile?.full_name} submitted parking space "${space.title}" for admin verification.`,
  });

  revalidatePath('/host/spaces');
  revalidatePath('/admin/verifications');
  revalidatePath('/admin/listings');
  revalidatePath('/admin');
  revalidatePath('/search');

  return { success: true, spaceId };
}

export async function getPublicApprovedSpacesAction(): Promise<ParkingSpace[]> {
  return repository.getApprovedSpaces();
}

export async function getPendingSpacesAction(): Promise<ParkingSpace[]> {
  const store = getLocalStore();
  return store.getAllSpaces().filter(s => s.status === 'submitted');
}

export async function getAllSpacesAction(): Promise<ParkingSpace[]> {
  const store = getLocalStore();
  return store.getAllSpaces();
}

export async function getSpaceByIdAction(id: string): Promise<ParkingSpace | undefined> {
  const space = await repository.getSpaceById(id);
  return space || undefined;
}

export async function hostUpdatePricingAction(params: {
  spaceId: string;
  hourlyRate: number;
  dailyRate?: number | null;
  monthlyRate?: number | null;
}) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const { spaceId, hourlyRate, dailyRate, monthlyRate } = params;
  if (!spaceId || isNaN(hourlyRate) || hourlyRate <= 0) {
    return { error: 'Please provide a valid hourly rate greater than ₹0.' };
  }

  const space = await repository.getSpaceById(spaceId);
  if (!space) {
    return { error: 'Parking space not found.' };
  }

  if (space.provider_id !== session.user.id && session.role !== 'admin') {
    return { error: 'Unauthorized to modify this space.' };
  }

  const updated = await repository.updateParkingSpace(spaceId, {
    hourly_rate: Number(hourlyRate),
    daily_rate: dailyRate ? Number(dailyRate) : null,
    monthly_rate: monthlyRate ? Number(monthlyRate) : null,
  });

  await repository.recordAuditLog({
    operator_email: session.profile?.email || 'host@parkbnb.in',
    action: 'SPACE_PRICING_UPDATED',
    category: 'space',
    target_id: spaceId,
    target_name: space.title,
    details: `Host updated pricing: Hourly: ₹${hourlyRate}, Daily: ₹${dailyRate || 'None'}, Monthly: ₹${monthlyRate || 'None'}`,
  });

  revalidatePath('/host/spaces');
  revalidatePath('/admin/listings');
  revalidatePath('/search');
  revalidatePath(`/parking/${spaceId}`);

  return { success: true, space: updated };
}

export async function hostToggleSpaceStatusAction(spaceId: string, isActive: boolean) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const space = await repository.getSpaceById(spaceId);
  if (!space) {
    return { error: 'Parking space not found.' };
  }

  if (space.provider_id !== session.user.id && session.role !== 'admin') {
    return { error: 'Unauthorized to modify this space.' };
  }

  const updated = await repository.updateParkingSpace(spaceId, { is_active: isActive });

  await repository.recordAuditLog({
    operator_email: session.profile?.email || 'host@parkbnb.in',
    action: isActive ? 'SPACE_ACTIVATED_BY_HOST' : 'SPACE_PAUSED_BY_HOST',
    category: 'space',
    target_id: spaceId,
    target_name: space.title,
    details: `Host set space visibility to ${isActive ? 'Active (Open for bookings)' : 'Paused (Maintenance mode)'}.`,
  });

  revalidatePath('/host/spaces');
  revalidatePath('/admin/listings');
  revalidatePath('/search');

  return { success: true, space: updated };
}

export async function hostDeleteSpaceAction(spaceId: string) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required.' };
  }

  const store = getLocalStore();
  const space = store.getSpaceById(spaceId);
  if (!space) {
    return { error: 'Parking space not found.' };
  }

  if (space.provider_id !== session.user.id && session.role !== 'admin') {
    return { error: 'Unauthorized to delete this space.' };
  }

  // Check if any active/confirmed bookings exist on this space
  const bookings = store.getAllBookings().filter(
    b => b.space_id === spaceId && (b.status === 'confirmed' || b.status === 'active' || b.status === 'hold_pending')
  );

  if (bookings.length > 0) {
    return {
      error: `Cannot delete space with ${bookings.length} upcoming or active reservation(s). Complete or resolve all bookings first.`,
    };
  }

  store.deleteSpace(spaceId);

  store.recordAuditLog({
    operator_email: session.profile?.email || 'host@parkbnb.in',
    action: 'SPACE_DELETED_BY_HOST',
    category: 'space',
    target_id: spaceId,
    target_name: space.title,
    details: `Host deleted space ${space.identifier} (${space.title}).`,
  });

  revalidatePath('/host/spaces');
  revalidatePath('/admin/listings');
  revalidatePath('/search');

  return { success: true };
}
