'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/session';
import { spaceSchema } from '@/lib/validation/schemas';
import { getLocalStore } from '@/lib/store/marketplace-store';
import { ParkingSpace, Property, VehicleType } from '@/types/database';

export async function createSpaceAction(formData: FormData) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) {
    return { error: 'Authentication required. Please sign in as a host.' };
  }

  const vehicleTypes = formData.getAll('vehicle_types') as VehicleType[];
  const securityFeatures = formData.getAll('security_features') as string[];

  const rawData = {
    title: formData.get('title'),
    property_title: formData.get('property_title'),
    property_type: formData.get('property_type'),
    area: formData.get('area'),
    address_line1: formData.get('address_line1'),
    postal_code: formData.get('postal_code'),
    latitude: Number(formData.get('latitude') || 23.0225),
    longitude: Number(formData.get('longitude') || 72.5714),
    identifier: formData.get('identifier'),
    parking_type: formData.get('parking_type'),
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

  // 1. Create Property Record
  const propertyId = 'prop-' + Math.random().toString(36).substring(2, 9);
  const property: Property = {
    id: propertyId,
    provider_id: session.user.id,
    title: validation.data.property_title,
    property_type: validation.data.property_type,
    address_line1: validation.data.address_line1,
    area: validation.data.area,
    city: 'Ahmedabad',
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
    description: (formData.get('description') as string) || `Covered and secure parking space in ${validation.data.area}, Ahmedabad.`,
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

  store.createSpace(space);

  // Record Admin Audit Log
  store.recordAuditLog({
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
  const store = getLocalStore();
  return store.getApprovedPublicSpaces();
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
  const store = getLocalStore();
  return store.getSpaceById(id);
}
