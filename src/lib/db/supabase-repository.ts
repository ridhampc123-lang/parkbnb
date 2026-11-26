import crypto from 'crypto';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/service-role';
import { getLocalStore } from '@/lib/store/marketplace-store';
import {
  Profile,
  ProviderProfile,
  Property,
  ParkingSpace,
  CustomerVehicle,
  Booking,
  BookingHold,
  FinancialLedgerEntry,
  SupportTicket,
  BookingStatus,
  VehicleType,
  AuditLogEntry,
} from '@/types/database';
import {
  generateCustomerPublicId,
  generateBookingCustomerReference,
  maskCustomerDisplayName,
} from '@/lib/privacy/customer-privacy';

/**
 * Ensures any identifier passed to PostgreSQL UUID columns is a strictly valid RFC-4122 UUID.
 * Prevents PostgreSQL 'invalid input syntax for type uuid' errors.
 */
export function ensureValidUuid(id?: string | null): string {
  if (!id) return crypto.randomUUID();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  const hash = crypto.createHash('md5').update(id).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

/**
 * Authoritative Supabase Database Repository Layer.
 * Interacts directly with live PostgreSQL tables using elevated service role execution for server actions,
 * adapts gracefully to present database columns, and syncs seamlessly with MarketplaceStore.
 */
export class SupabaseRepository {
  private static instance: SupabaseRepository | null = null;

  public static getInstance(): SupabaseRepository {
    if (!SupabaseRepository.instance) {
      SupabaseRepository.instance = new SupabaseRepository();
    }
    return SupabaseRepository.instance;
  }

  /**
   * Internal helper: Returns the privileged Supabase Service Role client for authoritative server writes,
   * falling back to the server SSR client when running in standard request context.
   */
  private async getClient() {
    return getSupabaseServiceRoleClient() || (await getSupabaseServerClient());
  }

  // -------------------------------------------------------------
  // 1. PROFILES & USER ACCOUNTS
  // -------------------------------------------------------------

  async getProfileById(id: string): Promise<Profile | null> {
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          const profile = data as Profile;
          getLocalStore().createProfile(profile);
          return profile;
        }
      } catch (e) {
        console.warn('[Repository] getProfileById error:', e);
      }
    }
    return getLocalStore().getProfileById(id) || null;
  }

  async getProfileByEmail(email: string): Promise<Profile | null> {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .single();

        if (!error && data) {
          const profile = data as Profile;
          getLocalStore().createProfile(profile);
          return profile;
        }
      } catch (e) {
        console.warn('[Repository] getProfileByEmail error:', e);
      }
    }
    return getLocalStore().getProfileByEmail(cleanEmail) || null;
  }

  async getProfileByPhone(phone: string): Promise<Profile | null> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone', cleanPhone)
          .single();

        if (!error && data) {
          const profile = data as Profile;
          getLocalStore().createProfile(profile);
          return profile;
        }
      } catch (e) {
        console.warn('[Repository] getProfileByPhone error:', e);
      }
    }
    return getLocalStore().getProfileByPhone(cleanPhone) || null;
  }

  /**
   * Authoritatively upserts a customer or provider profile into Supabase PostgreSQL.
   * Resilient to unmigrated schema columns: gracefully retries with standard columns on PGRST204.
   */
  async upsertProfile(profile: Partial<Profile> & { id: string }): Promise<Profile> {
    const store = getLocalStore();
    const existing = store.getProfileById(profile.id);
    const mergedProfile: Profile = {
      id: profile.id,
      customer_public_id: profile.customer_public_id || existing?.customer_public_id || generateCustomerPublicId(),
      full_name: profile.full_name || existing?.full_name || 'Valued Guest',
      email: profile.email || existing?.email || null,
      phone: profile.phone || existing?.phone || null,
      phone_verified: profile.phone_verified ?? existing?.phone_verified ?? false,
      phone_verified_at: profile.phone_verified_at || existing?.phone_verified_at || (profile.phone_verified ? new Date().toISOString() : undefined),
      role: profile.role || existing?.role || 'customer',
      avatar_url: profile.avatar_url || existing?.avatar_url || null,
      status: profile.status || existing?.status || 'active',
      privacy_settings: profile.privacy_settings || existing?.privacy_settings || {
        marketing_emails: false,
        in_app_notifications: true,
      },
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Keep memory store updated immediately
    store.createProfile(mergedProfile);

    const supabase = await this.getClient();
    if (supabase) {
      try {
        // Attempt full insert with all privacy fields
        const { error } = await supabase.from('profiles').upsert({
          id: mergedProfile.id,
          customer_public_id: mergedProfile.customer_public_id,
          full_name: mergedProfile.full_name,
          email: mergedProfile.email,
          phone: mergedProfile.phone,
          phone_verified: mergedProfile.phone_verified,
          phone_verified_at: mergedProfile.phone_verified_at,
          role: mergedProfile.role,
          avatar_url: mergedProfile.avatar_url,
          status: mergedProfile.status,
          privacy_settings: mergedProfile.privacy_settings,
          updated_at: mergedProfile.updated_at,
        });

        if (error) {
          // If customer_public_id or privacy_settings column not yet migrated, fall back to core columns
          if (error.code === 'PGRST204') {
            await supabase.from('profiles').upsert({
              id: mergedProfile.id,
              full_name: mergedProfile.full_name,
              email: mergedProfile.email,
              phone: mergedProfile.phone,
              phone_verified: mergedProfile.phone_verified,
              role: mergedProfile.role,
              avatar_url: mergedProfile.avatar_url,
              updated_at: mergedProfile.updated_at,
            });
          } else {
            console.warn('[Repository] upsertProfile error:', error.message);
          }
        }
      } catch (err) {
        console.warn('[Repository] upsertProfile threw:', err);
      }
    }

    return mergedProfile;
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const store = getLocalStore();
    const updated = store.updateProfile(id, updates);

    const supabase = await this.getClient();
    if (supabase) {
      try {
        const payload: Record<string, unknown> = {
          ...updates,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', id);

        if (error && error.code === 'PGRST204') {
          // Strip unmigrated columns and retry
          const safePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
          if (updates.full_name !== undefined) safePayload.full_name = updates.full_name;
          if (updates.email !== undefined) safePayload.email = updates.email;
          if (updates.phone !== undefined) safePayload.phone = updates.phone;
          if (updates.phone_verified !== undefined) safePayload.phone_verified = updates.phone_verified;
          if (updates.role !== undefined) safePayload.role = updates.role;
          if (updates.avatar_url !== undefined) safePayload.avatar_url = updates.avatar_url;

          await supabase.from('profiles').update(safePayload).eq('id', id);
        }
      } catch (e) {
        console.warn('[Repository] updateProfile error:', e);
      }
    }

    return updated || null;
  }

  async upsertProviderProfile(provider: Partial<ProviderProfile> & { id: string }): Promise<ProviderProfile> {
    const store = getLocalStore();
    const existing = store.getProviderProfile(provider.id);

    const mergedProvider: ProviderProfile = {
      id: provider.id,
      provider_type: provider.provider_type || existing?.provider_type || 'individual_residential',
      business_name: provider.business_name || existing?.business_name || null,
      pan_number: provider.pan_number || existing?.pan_number || null,
      gstin: provider.gstin || existing?.gstin || null,
      verification_status: provider.verification_status || existing?.verification_status || 'draft',
      rejection_reason: provider.rejection_reason || existing?.rejection_reason || null,
      verified_at: provider.verified_at || existing?.verified_at || null,
      verified_by: provider.verified_by || existing?.verified_by || null,
      bank_name: provider.bank_name || existing?.bank_name || null,
      bank_account_number: provider.bank_account_number || existing?.bank_account_number || null,
      bank_account_holder: provider.bank_account_holder || existing?.bank_account_holder || null,
      bank_ifsc_code: provider.bank_ifsc_code || existing?.bank_ifsc_code || null,
      upi_id: provider.upi_id || existing?.upi_id || null,
      payout_preference: provider.payout_preference || existing?.payout_preference || 'bank_transfer',
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.saveProviderProfile(mergedProvider);

    const supabase = await this.getClient();
    if (supabase) {
      try {
        await supabase.from('provider_profiles').upsert({
          id: mergedProvider.id,
          provider_type: mergedProvider.provider_type,
          business_name: mergedProvider.business_name,
          pan_number: mergedProvider.pan_number,
          gstin: mergedProvider.gstin,
          verification_status: mergedProvider.verification_status,
          rejection_reason: mergedProvider.rejection_reason,
          verified_at: mergedProvider.verified_at,
          verified_by: mergedProvider.verified_by,
          bank_name: mergedProvider.bank_name,
          bank_account_number: mergedProvider.bank_account_number,
          bank_account_holder: mergedProvider.bank_account_holder,
          bank_ifsc_code: mergedProvider.bank_ifsc_code,
          upi_id: mergedProvider.upi_id,
          payout_preference: mergedProvider.payout_preference,
          updated_at: mergedProvider.updated_at,
        });
      } catch (err) {
        console.warn('[Repository] upsertProviderProfile error:', err);
      }
    }

    return mergedProvider;
  }

  // -------------------------------------------------------------
  // 2. PARKING SPACES & PROPERTIES
  // -------------------------------------------------------------

  async getApprovedSpaces(filters?: {
    city?: string;
    area?: string;
    vehicleType?: VehicleType;
  }): Promise<ParkingSpace[]> {
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const query = supabase
          .from('parking_spaces')
          .select(`
            *,
            property:properties (*),
            photos:parking_space_photos (*)
          `)
          .eq('status', 'approved')
          .eq('is_active', true);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const spaces = data as unknown as ParkingSpace[];
          // Populate local store cache
          spaces.forEach(s => getLocalStore().createSpace(s));
          return spaces;
        }
      } catch (e) {
        console.warn('[Repository] getApprovedSpaces error:', e);
      }
    }
    const spaces = getLocalStore().getApprovedPublicSpaces();
    if (!filters) return spaces;
    return spaces.filter(s => {
      if (filters.city && s.property?.city.toLowerCase() !== filters.city.toLowerCase()) return false;
      if (filters.area && !s.property?.area.toLowerCase().includes(filters.area.toLowerCase())) return false;
      if (filters.vehicleType && s.vehicle_types && !s.vehicle_types.includes(filters.vehicleType)) return false;
      return true;
    });
  }

  async getAllSpaces(): Promise<ParkingSpace[]> {
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('parking_spaces')
          .select(`
            *,
            property:properties (*),
            photos:parking_space_photos (*)
          `)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as unknown as ParkingSpace[];
        }
      } catch (e) {
        console.warn('[Repository] getAllSpaces error:', e);
      }
    }
    return getLocalStore().getAllSpaces();
  }

  async getSpaceById(id: string): Promise<ParkingSpace | null> {
    const validId = ensureValidUuid(id);
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('parking_spaces')
          .select(`
            *,
            property:properties (*),
            photos:parking_space_photos (*)
          `)
          .eq('id', validId)
          .single();

        if (!error && data) {
          return data as unknown as ParkingSpace;
        }
      } catch (e) {
        console.warn('[Repository] getSpaceById error:', e);
      }
    }
    return getLocalStore().getSpaceById(id) || null;
  }

  async getSpacesByProvider(providerId: string): Promise<ParkingSpace[]> {
    const validProviderId = ensureValidUuid(providerId);
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('parking_spaces')
          .select(`
            *,
            property:properties (*),
            photos:parking_space_photos (*)
          `)
          .eq('provider_id', validProviderId);

        if (!error && data && data.length > 0) {
          return data as unknown as ParkingSpace[];
        }
      } catch (e) {
        console.warn('[Repository] getSpacesByProvider error:', e);
      }
    }
    return getLocalStore().getSpacesByProvider(providerId);
  }

  async createParkingSpace(space: ParkingSpace): Promise<ParkingSpace> {
    const validSpaceId = ensureValidUuid(space.id);
    const validPropertyId = ensureValidUuid(space.property_id || space.property?.id);
    const validProviderId = ensureValidUuid(space.provider_id);

    const normalizedSpace: ParkingSpace = {
      ...space,
      id: validSpaceId,
      property_id: validPropertyId,
      provider_id: validProviderId,
      identifier: space.identifier || 'BAY-1',
    };

    if (normalizedSpace.property) {
      normalizedSpace.property.id = validPropertyId;
      normalizedSpace.property.provider_id = validProviderId;
    }

    // Keep in-memory store in sync
    const originalSpaceId = space.id || validSpaceId;
    getLocalStore().createSpace({ ...normalizedSpace, id: originalSpaceId });
    if (originalSpaceId !== validSpaceId) {
      getLocalStore().createSpace({ ...normalizedSpace, id: validSpaceId });
    }

    const supabase = await this.getClient();
    if (supabase) {
      try {
        // 1. Ensure provider profile exists in Supabase PostgreSQL
        await supabase.from('provider_profiles').upsert({
          id: validProviderId,
          provider_type: 'individual_residential',
          verification_status: 'approved',
        });

        // 2. Ensure property exists in Supabase PostgreSQL
        if (normalizedSpace.property) {
          const { error: propErr } = await supabase.from('properties').upsert({
            id: validPropertyId,
            provider_id: validProviderId,
            title: normalizedSpace.property.title || 'Parking Property',
            property_type: normalizedSpace.property.property_type || 'residential',
            address_line1: normalizedSpace.property.address_line1 || 'Near Main Road',
            address_line2: normalizedSpace.property.address_line2 || null,
            landmark: normalizedSpace.property.landmark || null,
            area: normalizedSpace.property.area || 'Ahmedabad Central',
            city: normalizedSpace.property.city || 'Ahmedabad',
            postal_code: normalizedSpace.property.postal_code || '380009',
            latitude: Number(normalizedSpace.property.latitude || 23.0225),
            longitude: Number(normalizedSpace.property.longitude || 72.5714),
          });
          if (propErr) {
            console.warn('[Repository] property upsert notice:', propErr.message);
          }
        }

        // 3. Insert parking space into PostgreSQL
        const spacePayload: Record<string, unknown> = {
          id: validSpaceId,
          property_id: validPropertyId,
          provider_id: validProviderId,
          identifier: normalizedSpace.identifier,
          title: normalizedSpace.title,
          description: normalizedSpace.description || null,
          parking_type: normalizedSpace.parking_type || 'covered',
          hourly_rate: Number(normalizedSpace.hourly_rate || 50),
          daily_rate: normalizedSpace.daily_rate ? Number(normalizedSpace.daily_rate) : null,
          monthly_rate: normalizedSpace.monthly_rate ? Number(normalizedSpace.monthly_rate) : null,
          min_duration_hours: Number(normalizedSpace.min_duration_hours || 1),
          max_duration_hours: Number(normalizedSpace.max_duration_hours || 720),
          access_instructions: normalizedSpace.access_instructions || null,
          security_features: normalizedSpace.security_features || [],
          has_ev_charging: Boolean(normalizedSpace.has_ev_charging),
          height_limit_meters: normalizedSpace.height_limit_meters ? Number(normalizedSpace.height_limit_meters) : null,
          status: normalizedSpace.status || 'submitted',
          is_active: normalizedSpace.is_active ?? false,
        };

        const { data, error } = await supabase
          .from('parking_spaces')
          .upsert(spacePayload)
          .select()
          .single();

        if (error) {
          console.warn('[Repository] createParkingSpace error:', error.message);
        }

        // 3. Insert photos into parking_space_photos
        if (normalizedSpace.photos && normalizedSpace.photos.length > 0) {
          for (const photo of normalizedSpace.photos) {
            await supabase.from('parking_space_photos').upsert({
              id: ensureValidUuid(photo.id),
              space_id: validSpaceId,
              storage_path: photo.storage_path,
              is_primary: photo.is_primary,
              display_order: photo.display_order || 0,
            });
          }
        }

        if (!error && data) {
          return { ...normalizedSpace, ...data };
        }
      } catch (e) {
        console.warn('[Repository] createParkingSpace threw:', e);
      }
    }

    return normalizedSpace;
  }

  async updateParkingSpace(id: string, updates: Partial<ParkingSpace>): Promise<ParkingSpace | null> {
    const validId = ensureValidUuid(id);
    const store = getLocalStore();
    const updated = store.updateSpace(validId, updates);

    const supabase = await this.getClient();
    if (supabase) {
      try {
        const payload: Record<string, unknown> = {
          ...updates,
          updated_at: new Date().toISOString(),
        };
        // Clean joined fields
        delete payload.property;
        delete payload.photos;
        delete payload.vehicle_types;

        await supabase
          .from('parking_spaces')
          .update(payload)
          .eq('id', validId);
      } catch (e) {
        console.warn('[Repository] updateParkingSpace error:', e);
      }
    }
    return updated || null;
  }

  // -------------------------------------------------------------
  // 3. CUSTOMER VEHICLES
  // -------------------------------------------------------------

  async getVehiclesByCustomer(customerId: string): Promise<CustomerVehicle[]> {
    const localVehicles = getLocalStore().getVehiclesByCustomer(customerId);
    if (localVehicles && localVehicles.length > 0) {
      return localVehicles;
    }

    const validCustomerId = ensureValidUuid(customerId);
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('customer_vehicles')
          .select('*')
          .eq('customer_id', validCustomerId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const vehicles = data as CustomerVehicle[];
          vehicles.forEach(v => getLocalStore().createVehicle(v));
          return vehicles;
        }
      } catch (e) {
        console.warn('[Repository] getVehiclesByCustomer error:', e);
      }
    }
    return localVehicles;
  }

  async createVehicle(vehicle: CustomerVehicle): Promise<CustomerVehicle> {
    const validVehicleId = ensureValidUuid(vehicle.id);
    const validCustomerId = ensureValidUuid(vehicle.customer_id);

    const normalizedVehicle: CustomerVehicle = {
      ...vehicle,
      id: validVehicleId,
      customer_id: validCustomerId,
    };

    const originalVehicleId = vehicle.id || validVehicleId;
    getLocalStore().createVehicle({ ...vehicle, id: originalVehicleId });
    if (originalVehicleId !== validVehicleId) {
      getLocalStore().createVehicle({ ...normalizedVehicle, id: validVehicleId });
    }

    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('customer_vehicles')
          .upsert({
            id: validVehicleId,
            customer_id: validCustomerId,
            registration_number: normalizedVehicle.registration_number,
            vehicle_type: normalizedVehicle.vehicle_type,
            make_model: normalizedVehicle.make_model || null,
            color: normalizedVehicle.color || null,
            is_default: Boolean(normalizedVehicle.is_default),
          })
          .select()
          .single();

        if (!error && data) {
          return data as CustomerVehicle;
        }
      } catch (e) {
        console.warn('[Repository] createVehicle error:', e);
      }
    }

    return normalizedVehicle;
  }

  async deleteVehicle(vehicleId: string, customerId: string): Promise<boolean> {
    const memoryDeleted = getLocalStore().deleteVehicle(vehicleId, customerId);
    if (!memoryDeleted) {
      return false;
    }

    const validVehicleId = ensureValidUuid(vehicleId);
    const validCustomerId = ensureValidUuid(customerId);

    const supabase = await this.getClient();
    if (supabase) {
      try {
        await supabase
          .from('customer_vehicles')
          .delete()
          .eq('id', validVehicleId)
          .eq('customer_id', validCustomerId);
      } catch (e) {
        console.warn('[Repository] deleteVehicle error:', e);
      }
    }
    return true;
  }

  async setDefaultVehicle(vehicleId: string, customerId: string): Promise<boolean> {
    const validVehicleId = ensureValidUuid(vehicleId);
    const validCustomerId = ensureValidUuid(customerId);
    getLocalStore().setDefaultVehicle(vehicleId, customerId);

    const supabase = await this.getClient();
    if (supabase) {
      try {
        await supabase
          .from('customer_vehicles')
          .update({ is_default: false })
          .eq('customer_id', validCustomerId);

        await supabase
          .from('customer_vehicles')
          .update({ is_default: true })
          .eq('id', validVehicleId)
          .eq('customer_id', validCustomerId);

        return true;
      } catch (e) {
        console.warn('[Repository] setDefaultVehicle error:', e);
      }
    }
    return true;
  }

  // -------------------------------------------------------------
  // 4. BOOKINGS & GATE ACCESS
  // -------------------------------------------------------------

  async getBookingsByCustomer(customerId: string): Promise<Booking[]> {
    const validCustomerId = ensureValidUuid(customerId);
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            space:parking_spaces (*),
            vehicle:customer_vehicles (*)
          `)
          .eq('customer_id', validCustomerId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as unknown as Booking[];
        }
      } catch (e) {
        console.warn('[Repository] getBookingsByCustomer error:', e);
      }
    }
    return getLocalStore().getBookingsByCustomer(customerId);
  }

  async getBookingsByProvider(providerId: string): Promise<Booking[]> {
    const validProviderId = ensureValidUuid(providerId);
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            space:parking_spaces (*),
            vehicle:customer_vehicles (*)
          `)
          .eq('provider_id', validProviderId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as unknown as Booking[];
        }
      } catch (e) {
        console.warn('[Repository] getBookingsByProvider error:', e);
      }
    }
    return getLocalStore().getBookingsByProvider(providerId);
  }

  async getBookingById(bookingId: string): Promise<Booking | null> {
    const validBookingId = ensureValidUuid(bookingId);
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            space:parking_spaces (*),
            vehicle:customer_vehicles (*)
          `)
          .eq('id', validBookingId)
          .single();

        if (!error && data) {
          return data as unknown as Booking;
        }
      } catch (e) {
        console.warn('[Repository] getBookingById error:', e);
      }
    }
    return getLocalStore().getBookingById(bookingId) || getLocalStore().getBookingById(validBookingId) || null;
  }

  async createBooking(booking: Booking): Promise<Booking> {
    const validBookingId = ensureValidUuid(booking.id);
    const validSpaceId = ensureValidUuid(booking.space_id);
    const validCustomerId = ensureValidUuid(booking.customer_id);
    const validProviderId = ensureValidUuid(booking.provider_id);
    const validVehicleId = ensureValidUuid(booking.vehicle_id);

    const normalizedBooking: Booking = {
      ...booking,
      id: validBookingId,
      space_id: validSpaceId,
      customer_id: validCustomerId,
      provider_id: validProviderId,
      vehicle_id: validVehicleId,
      booking_customer_reference: booking.booking_customer_reference || generateBookingCustomerReference(),
      customer_display_name: booking.customer_display_name || maskCustomerDisplayName('Valued Customer'),
    };

    const originalBookingId = booking.id || validBookingId;
    getLocalStore().createBooking({ ...normalizedBooking, id: originalBookingId });
    if (originalBookingId !== validBookingId) {
      getLocalStore().createBooking({ ...normalizedBooking, id: validBookingId });
    }

    const supabase = await this.getClient();
    if (supabase) {
      try {
        const payload: Record<string, unknown> = {
          id: validBookingId,
          booking_reference: normalizedBooking.booking_reference,
          booking_customer_reference: normalizedBooking.booking_customer_reference,
          customer_display_name: normalizedBooking.customer_display_name,
          space_id: validSpaceId,
          customer_id: validCustomerId,
          provider_id: validProviderId,
          vehicle_id: validVehicleId,
          start_time: normalizedBooking.start_time,
          end_time: normalizedBooking.end_time,
          booking_duration_range: `[${normalizedBooking.start_time}, ${normalizedBooking.end_time}]`,
          status: normalizedBooking.status,
          total_hours: normalizedBooking.total_hours,
          base_amount: normalizedBooking.base_amount,
          platform_fee: normalizedBooking.platform_fee,
          tax_amount: normalizedBooking.tax_amount,
          total_amount: normalizedBooking.total_amount,
          provider_payout_amount: normalizedBooking.provider_payout_amount,
          gate_status: normalizedBooking.gate_status || 'booked',
        };

        const { data, error } = await supabase
          .from('bookings')
          .insert(payload)
          .select()
          .single();

        if (error) {
          // If gate_status or booking_customer_reference not in DB, retry without them
          if (error.code === 'PGRST204') {
            const fallbackPayload = {
              id: validBookingId,
              booking_reference: normalizedBooking.booking_reference,
              space_id: validSpaceId,
              customer_id: validCustomerId,
              provider_id: validProviderId,
              vehicle_id: validVehicleId,
              start_time: normalizedBooking.start_time,
              end_time: normalizedBooking.end_time,
              booking_duration_range: `[${normalizedBooking.start_time}, ${normalizedBooking.end_time}]`,
              status: normalizedBooking.status,
              total_hours: normalizedBooking.total_hours,
              base_amount: normalizedBooking.base_amount,
              platform_fee: normalizedBooking.platform_fee,
              tax_amount: normalizedBooking.tax_amount,
              total_amount: normalizedBooking.total_amount,
              provider_payout_amount: normalizedBooking.provider_payout_amount,
            };

            await supabase.from('bookings').insert(fallbackPayload);
          } else {
            console.warn('[Repository] createBooking error:', error.message);
          }
        }

        if (!error && data) {
          return { ...normalizedBooking, ...data };
        }
      } catch (e) {
        console.warn('[Repository] createBooking threw:', e);
      }
    }

    return normalizedBooking;
  }

  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    reason?: string
  ): Promise<Booking | null> {
    const validBookingId = ensureValidUuid(bookingId);
    const store = getLocalStore();
    const updated = store.updateBookingStatus(bookingId, status, reason) || store.updateBookingStatus(validBookingId, status, reason);

    const supabase = await this.getClient();
    if (supabase) {
      try {
        await supabase
          .from('bookings')
          .update({
            status,
            cancellation_reason: reason || null,
            cancelled_at: status.includes('cancelled') ? new Date().toISOString() : undefined,
            check_out_at: status === 'completed' ? new Date().toISOString() : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', validBookingId);
      } catch (e) {
        console.warn('[Repository] updateBookingStatus error:', e);
      }
    }
    return updated || null;
  }

  // -------------------------------------------------------------
  // 5. FINANCIAL LEDGER
  // -------------------------------------------------------------

  async getLedgerEntriesByProvider(providerId: string): Promise<FinancialLedgerEntry[]> {
    const validProviderId = ensureValidUuid(providerId);
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const account = `PROVIDER_ESCROW:${validProviderId}`;
        const { data, error } = await supabase
          .from('financial_ledger_entries')
          .select('*')
          .or(`debit_account.eq.${account},credit_account.eq.${account}`)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as FinancialLedgerEntry[];
        }
      } catch (e) {
        console.warn('[Repository] getLedgerEntriesByProvider error:', e);
      }
    }
    return getLocalStore().getProviderLedger(providerId);
  }

  async recordLedgerEntry(entry: Omit<FinancialLedgerEntry, 'id' | 'created_at'> | FinancialLedgerEntry): Promise<FinancialLedgerEntry> {
    const fullEntry: FinancialLedgerEntry = {
      id: 'id' in entry && entry.id ? ensureValidUuid(entry.id) : crypto.randomUUID(),
      ...entry,
      created_at: 'created_at' in entry && entry.created_at ? entry.created_at : new Date().toISOString(),
    };

    getLocalStore().recordLedgerEntry(fullEntry);

    const supabase = await this.getClient();
    if (supabase) {
      try {
        await supabase.from('financial_ledger_entries').insert({
          id: fullEntry.id,
          booking_id: fullEntry.booking_id ? ensureValidUuid(fullEntry.booking_id) : null,
          entry_type: fullEntry.entry_type,
          debit_account: fullEntry.debit_account,
          credit_account: fullEntry.credit_account,
          amount: fullEntry.amount,
          currency: fullEntry.currency || 'INR',
          description: fullEntry.description,
          reference_id: fullEntry.reference_id || null,
        });
      } catch (e) {
        console.warn('[Repository] recordLedgerEntry error:', e);
      }
    }

    return fullEntry;
  }

  // -------------------------------------------------------------
  // 6. SUPPORT TICKETS
  // -------------------------------------------------------------

  async getSupportTicketsByUser(userId: string): Promise<SupportTicket[]> {
    const validUserId = ensureValidUuid(userId);
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', validUserId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as SupportTicket[];
        }
      } catch (e) {
        console.warn('[Repository] getSupportTicketsByUser error:', e);
      }
    }
    return getLocalStore().getTicketsByUser(userId);
  }

  async createSupportTicket(ticket: SupportTicket): Promise<SupportTicket> {
    const validTicketId = ensureValidUuid(ticket.id);
    const validUserId = ensureValidUuid(ticket.user_id);

    const normalizedTicket: SupportTicket = {
      ...ticket,
      id: validTicketId,
      user_id: validUserId,
    };

    getLocalStore().createSupportTicket(normalizedTicket);

    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .insert({
            id: validTicketId,
            user_id: validUserId,
            subject: normalizedTicket.subject,
            category: normalizedTicket.category,
            priority: normalizedTicket.priority || 'medium',
            status: normalizedTicket.status || 'open',
            messages: normalizedTicket.messages || [],
          })
          .select()
          .single();

        if (!error && data) {
          return data as SupportTicket;
        }
      } catch (e) {
        console.warn('[Repository] createSupportTicket error:', e);
      }
    }

    return normalizedTicket;
  }

  async getAllTickets(): Promise<SupportTicket[]> {
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as SupportTicket[];
        }
      } catch (e) {
        console.warn('[Repository] getAllTickets error:', e);
      }
    }
    return getLocalStore().getAllTickets();
  }

  // -------------------------------------------------------------
  // 7. BOOKING INVENTORY HOLDS & CONCURRENCY
  // -------------------------------------------------------------

  async createHold(
    spaceId: string,
    customerId: string,
    startTime: string,
    endTime: string,
    holdMinutes = 10
  ): Promise<BookingHold | null> {
    const isRealUuidSpace = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(spaceId);
    const isRealUuidCust = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId);

    if (isRealUuidSpace && isRealUuidCust) {
      const supabase = await this.getClient();
      if (supabase) {
        try {
          const { data, error } = await supabase.rpc('create_booking_hold', {
            p_space_id: spaceId,
            p_customer_id: customerId,
            p_start_time: startTime,
            p_end_time: endTime,
            p_hold_minutes: holdMinutes,
          });

          if (!error && data && data.length > 0 && data[0].success) {
            const hold: BookingHold = {
              id: data[0].hold_id,
              space_id: spaceId,
              customer_id: customerId,
              start_time: startTime,
              end_time: endTime,
              expires_at: data[0].expires_at,
              is_active: true,
              created_at: new Date().toISOString(),
            };
            getLocalStore().createHold(spaceId, customerId, startTime, endTime, holdMinutes);
            return hold;
          }
        } catch (e) {
          console.warn('[Repository] createHold rpc error:', e);
        }
      }
    }
    return getLocalStore().createHold(spaceId, customerId, startTime, endTime, holdMinutes);
  }

  async releaseHold(spaceId: string, customerId: string): Promise<void> {
    getLocalStore().releaseHold(spaceId, customerId);

    const isRealUuidSpace = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(spaceId);
    const isRealUuidCust = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId);

    if (isRealUuidSpace && isRealUuidCust) {
      const supabase = await this.getClient();
      if (supabase) {
        try {
          await supabase
            .from('booking_holds')
            .update({ is_active: false })
            .eq('space_id', spaceId)
            .eq('customer_id', customerId);
        } catch (e) {
          console.warn('[Repository] releaseHold error:', e);
        }
      }
    }
  }

  async cleanupExpiredHoldsAndOtps(): Promise<{ expiredHolds: number; expiredBookings: number; expiredOtps: number }> {
    const supabase = await this.getClient();
    if (supabase) {
      try {
        await supabase.rpc('cleanup_expired_holds_and_otps');
      } catch (e) {
        console.warn('[Repository] cleanupExpiredHoldsAndOtps rpc error:', e);
      }
    }
    return getLocalStore().cleanupExpiredHoldsAndOtps();
  }

  async isSpaceAvailable(spaceId: string, startTime: string, endTime: string): Promise<boolean> {
    const isRealUuidSpace = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(spaceId);
    if (isRealUuidSpace) {
      const supabase = await this.getClient();
      if (supabase) {
        try {
          const { data, error } = await supabase.rpc('check_space_availability', {
            p_space_id: spaceId,
            p_start_time: startTime,
            p_end_time: endTime,
          });

          if (!error && typeof data === 'boolean') {
            return data;
          }
        } catch (e) {
          console.warn('[Repository] check_space_availability error:', e);
        }
      }
    }
    return getLocalStore().checkAvailability(spaceId, startTime, endTime);
  }

  calculatePricing(space: ParkingSpace, startTime: string, endTime: string) {
    return getLocalStore().calculatePricing(space, startTime, endTime);
  }

  async getAllBookings(limit = 200): Promise<Booking[]> {
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            space:parking_spaces (*),
            vehicle:customer_vehicles (*)
          `)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          return data as unknown as Booking[];
        }
      } catch (e) {
        console.warn('[Repository] getAllBookings error:', e);
      }
    }
    return getLocalStore().getAllBookings();
  }

  // -------------------------------------------------------------
  // 8. AUDIT LOGGING & COMPLIANCE
  // -------------------------------------------------------------

  async recordAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    getLocalStore().recordAuditLog(entry);

    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('audit_logs').insert({
          id: crypto.randomUUID(),
          operator_email: entry.operator_email,
          action: entry.action,
          category: entry.category,
          target_id: entry.target_id || null,
          target_name: entry.target_name || null,
          details: entry.details || null,
        });

        if (error && error.code === 'PGRST204') {
          // If custom columns not yet added, use standard schema with metadata json
          await supabase.from('audit_logs').insert({
            id: crypto.randomUUID(),
            action: entry.action,
            entity_type: entry.category || 'system',
            entity_id: entry.target_id || null,
            metadata: {
              operator_email: entry.operator_email,
              category: entry.category,
              target_name: entry.target_name,
              details: entry.details,
            },
          });
        }
      } catch (e) {
        console.warn('[Repository] recordAuditLog error:', e);
      }
    }
  }

  async getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
    const supabase = await this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          return data as AuditLogEntry[];
        }
      } catch (e) {
        console.warn('[Repository] getAuditLogs error:', e);
      }
    }
    return getLocalStore().getAuditLogs();
  }
}

export const repository = SupabaseRepository.getInstance();
