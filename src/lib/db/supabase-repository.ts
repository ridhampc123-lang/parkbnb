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
  Review,
  SupportTicket,
  UserRole,
  VerificationStatus,
  BookingStatus,
  VehicleType,
  AuditLogEntry,
  CustomerDataAccessLog,
} from '@/types/database';
import {
  generateCustomerPublicId,
  generateBookingCustomerReference,
  maskCustomerDisplayName,
} from '@/lib/privacy/customer-privacy';

/**
 * Authoritative Supabase Database Repository Layer.
 * Queries real PostgreSQL database tables with RLS and falls back gracefully to
 * MarketplaceStore when Supabase client is unconfigured or in offline test environments.
 */
export class SupabaseRepository {
  private static instance: SupabaseRepository | null = null;

  public static getInstance(): SupabaseRepository {
    if (!SupabaseRepository.instance) {
      SupabaseRepository.instance = new SupabaseRepository();
    }
    return SupabaseRepository.instance;
  }

  // -------------------------------------------------------------
  // 1. PROFILES & USER ACCOUNTS
  // -------------------------------------------------------------

  async getProfileById(id: string): Promise<Profile | null> {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return data as Profile;
        }
      } catch (e) {
        console.warn('[Repository] getProfileById error:', e);
      }
    }
    return getLocalStore().getProfileById(id) || null;
  }

  async getProfileByEmail(email: string): Promise<Profile | null> {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .single();

        if (!error && data) {
          return data as Profile;
        }
      } catch (e) {
        console.warn('[Repository] getProfileByEmail error:', e);
      }
    }
    return getLocalStore().getProfileByEmail(cleanEmail) || null;
  }

  async getProfileByPhone(phone: string): Promise<Profile | null> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone', cleanPhone)
          .single();

        if (!error && data) {
          return data as Profile;
        }
      } catch (e) {
        console.warn('[Repository] getProfileByPhone error:', e);
      }
    }
    return getLocalStore().getProfileByPhone(cleanPhone) || null;
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return data as Profile;
        }
      } catch (e) {
        console.warn('[Repository] updateProfile error:', e);
      }
    }
    const store = getLocalStore();
    return store.updateProfile(id, updates) || null;
  }

  // -------------------------------------------------------------
  // 2. PARKING SPACES & PROPERTIES
  // -------------------------------------------------------------

  async getApprovedSpaces(filters?: {
    city?: string;
    area?: string;
    vehicleType?: VehicleType;
  }): Promise<ParkingSpace[]> {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        let query = supabase
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
          return data as unknown as ParkingSpace[];
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

  async getSpaceById(id: string): Promise<ParkingSpace | null> {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('parking_spaces')
          .select(`
            *,
            property:properties (*),
            photos:parking_space_photos (*)
          `)
          .eq('id', id)
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
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('parking_spaces')
          .select(`
            *,
            property:properties (*),
            photos:parking_space_photos (*)
          `)
          .eq('provider_id', providerId);

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
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        // Ensure property exists in PostgreSQL
        if (space.property) {
          await supabase.from('properties').upsert({
            id: space.property_id,
            provider_id: space.provider_id,
            title: space.property.title,
            property_type: space.property.property_type,
            address_line1: space.property.address_line1,
            address_line2: space.property.address_line2,
            landmark: space.property.landmark,
            area: space.property.area,
            city: space.property.city,
            postal_code: space.property.postal_code,
            latitude: space.property.latitude,
            longitude: space.property.longitude,
          });
        }

        const { data, error } = await supabase
          .from('parking_spaces')
          .insert({
            id: space.id,
            property_id: space.property_id,
            provider_id: space.provider_id,
            identifier: space.identifier,
            title: space.title,
            description: space.description,
            parking_type: space.parking_type,
            hourly_rate: space.hourly_rate,
            daily_rate: space.daily_rate,
            monthly_rate: space.monthly_rate,
            min_duration_hours: space.min_duration_hours,
            max_duration_hours: space.max_duration_hours,
            access_instructions: space.access_instructions,
            security_features: space.security_features,
            has_ev_charging: space.has_ev_charging,
            height_limit_meters: space.height_limit_meters,
            status: space.status,
            is_active: space.is_active,
          })
          .select()
          .single();

        if (!error && data) {
          return data as unknown as ParkingSpace;
        }
      } catch (e) {
        console.warn('[Repository] createParkingSpace error:', e);
      }
    }
    getLocalStore().createSpace(space);
    return space;
  }

  async updateParkingSpace(id: string, updates: Partial<ParkingSpace>): Promise<ParkingSpace | null> {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('parking_spaces')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return data as unknown as ParkingSpace;
        }
      } catch (e) {
        console.warn('[Repository] updateParkingSpace error:', e);
      }
    }
    const store = getLocalStore();
    return store.updateSpace(id, updates) || null;
  }

  // -------------------------------------------------------------
  // 3. CUSTOMER VEHICLES
  // -------------------------------------------------------------

  async getVehiclesByCustomer(customerId: string): Promise<CustomerVehicle[]> {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('customer_vehicles')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as CustomerVehicle[];
        }
      } catch (e) {
        console.warn('[Repository] getVehiclesByCustomer error:', e);
      }
    }
    return getLocalStore().getVehiclesByCustomer(customerId);
  }

  async createVehicle(vehicle: CustomerVehicle): Promise<CustomerVehicle> {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('customer_vehicles')
          .insert(vehicle)
          .select()
          .single();

        if (!error && data) {
          return data as CustomerVehicle;
        }
      } catch (e) {
        console.warn('[Repository] createVehicle error:', e);
      }
    }
    getLocalStore().createVehicle(vehicle);
    return vehicle;
  }

  async deleteVehicle(vehicleId: string, customerId: string): Promise<boolean> {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('customer_vehicles')
          .delete()
          .eq('id', vehicleId)
          .eq('customer_id', customerId);

        if (!error) return true;
      } catch (e) {
        console.warn('[Repository] deleteVehicle error:', e);
      }
    }
    return getLocalStore().deleteVehicle(vehicleId, customerId);
  }

  async setDefaultVehicle(vehicleId: string, customerId: string): Promise<boolean> {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase
          .from('customer_vehicles')
          .update({ is_default: false })
          .eq('customer_id', customerId);

        const { error } = await supabase
          .from('customer_vehicles')
          .update({ is_default: true })
          .eq('id', vehicleId)
          .eq('customer_id', customerId);

        if (!error) return true;
      } catch (e) {
        console.warn('[Repository] setDefaultVehicle error:', e);
      }
    }
    return getLocalStore().setDefaultVehicle(vehicleId, customerId);
  }

  // -------------------------------------------------------------
  // 4. BOOKINGS & GATE ACCESS
  // -------------------------------------------------------------

  async getBookingsByCustomer(customerId: string): Promise<Booking[]> {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            space:parking_spaces (*),
            vehicle:customer_vehicles (*)
          `)
          .eq('customer_id', customerId)
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
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            space:parking_spaces (*),
            vehicle:customer_vehicles (*)
          `)
          .eq('provider_id', providerId)
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
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            space:parking_spaces (*),
            vehicle:customer_vehicles (*)
          `)
          .eq('id', bookingId)
          .single();

        if (!error && data) {
          return data as unknown as Booking;
        }
      } catch (e) {
        console.warn('[Repository] getBookingById error:', e);
      }
    }
    return getLocalStore().getBookingById(bookingId) || null;
  }

  async createBooking(booking: Booking): Promise<Booking> {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .insert({
            id: booking.id,
            booking_reference: booking.booking_reference,
            booking_customer_reference: booking.booking_customer_reference || generateBookingCustomerReference(),
            customer_display_name: booking.customer_display_name || maskCustomerDisplayName('Valued Customer'),
            space_id: booking.space_id,
            customer_id: booking.customer_id,
            provider_id: booking.provider_id,
            vehicle_id: booking.vehicle_id,
            start_time: booking.start_time,
            end_time: booking.end_time,
            booking_duration_range: `[${booking.start_time}, ${booking.end_time}]`,
            status: booking.status,
            total_hours: booking.total_hours,
            base_amount: booking.base_amount,
            platform_fee: booking.platform_fee,
            tax_amount: booking.tax_amount,
            total_amount: booking.total_amount,
            provider_payout_amount: booking.provider_payout_amount,
            gate_status: booking.gate_status || 'booked',
          })
          .select()
          .single();

        if (!error && data) {
          return data as unknown as Booking;
        }
      } catch (e) {
        console.warn('[Repository] createBooking error:', e);
      }
    }
    getLocalStore().createBooking(booking);
    return booking;
  }

  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    reason?: string
  ): Promise<Booking | null> {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .update({
            status,
            cancellation_reason: reason,
            cancelled_at: status.includes('cancelled') ? new Date().toISOString() : undefined,
            check_out_at: status === 'completed' ? new Date().toISOString() : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookingId)
          .select()
          .single();

        if (!error && data) {
          return data as unknown as Booking;
        }
      } catch (e) {
        console.warn('[Repository] updateBookingStatus error:', e);
      }
    }
    const store = getLocalStore();
    return store.updateBookingStatus(bookingId, status, reason) || null;
  }

  // -------------------------------------------------------------
  // 5. FINANCIAL LEDGER
  // -------------------------------------------------------------

  async getLedgerEntriesByProvider(providerId: string): Promise<FinancialLedgerEntry[]> {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const account = `PROVIDER_ESCROW:${providerId}`;
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
      id: 'id' in entry && entry.id ? entry.id : 'led-' + Math.random().toString(36).substring(2, 9),
      ...entry,
      created_at: 'created_at' in entry && entry.created_at ? entry.created_at : new Date().toISOString(),
    };
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from('financial_ledger_entries').insert(fullEntry);
      } catch (e) {
        console.warn('[Repository] recordLedgerEntry error:', e);
      }
    }
    return getLocalStore().recordLedgerEntry(fullEntry);
  }

  // -------------------------------------------------------------
  // 6. SUPPORT TICKETS
  // -------------------------------------------------------------

  async getSupportTicketsByUser(userId: string): Promise<SupportTicket[]> {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', userId)
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
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .insert(ticket)
          .select()
          .single();

        if (!error && data) {
          return data as SupportTicket;
        }
      } catch (e) {
        console.warn('[Repository] createSupportTicket error:', e);
      }
    }
    getLocalStore().createSupportTicket(ticket);
    return ticket;
  }

  async getAllTickets(): Promise<SupportTicket[]> {
    const supabase = await getSupabaseServerClient();
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
    const supabase = await getSupabaseServerClient();
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
    return getLocalStore().createHold(spaceId, customerId, startTime, endTime, holdMinutes);
  }

  async releaseHold(spaceId: string, customerId: string): Promise<void> {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase
          .from('booking_holds')
          .update({ status: 'released' })
          .eq('space_id', spaceId)
          .eq('customer_id', customerId)
          .eq('status', 'active');
      } catch (e) {
        console.warn('[Repository] releaseHold error:', e);
      }
    }
    getLocalStore().releaseHold(spaceId, customerId);
  }

  async cleanupExpiredHoldsAndOtps(): Promise<{ expiredHolds: number; expiredBookings: number; expiredOtps: number }> {
    const supabase = await getSupabaseServerClient();
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
    const supabase = await getSupabaseServerClient();
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
    return getLocalStore().checkAvailability(spaceId, startTime, endTime);
  }

  calculatePricing(space: ParkingSpace, startTime: string, endTime: string) {
    return getLocalStore().calculatePricing(space, startTime, endTime);
  }

  async getAllBookings(limit = 200): Promise<Booking[]> {
    const supabase = await getSupabaseServerClient();
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
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from('audit_logs').insert({
          operator_email: entry.operator_email,
          action: entry.action,
          category: entry.category,
          target_id: entry.target_id || null,
          target_name: entry.target_name || null,
          details: entry.details || null,
        });
      } catch (e) {
        console.warn('[Repository] recordAuditLog error:', e);
      }
    }
    getLocalStore().recordAuditLog(entry);
  }

  async getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
    const supabase = await getSupabaseServerClient();
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
