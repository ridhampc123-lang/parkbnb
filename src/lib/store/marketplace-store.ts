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
  VehicleType
} from '@/types/database';

// Global in-memory persistent store conforming strictly to PostgreSQL schema
class MarketplaceStore {
  private profiles: Map<string, Profile> = new Map();
  private providerProfiles: Map<string, ProviderProfile> = new Map();
  private properties: Map<string, Property> = new Map();
  private spaces: Map<string, ParkingSpace> = new Map();
  private vehicles: Map<string, CustomerVehicle> = new Map();
  private holds: Map<string, BookingHold> = new Map();
  private bookings: Map<string, Booking> = new Map();
  private ledger: FinancialLedgerEntry[] = [];
  private reviews: Review[] = [];
  private tickets: SupportTicket[] = [];

  constructor() {
    this.seedInitialMarketplaceData();
  }

  private seedInitialMarketplaceData() {
    // 1. Initial Admin Account
    const adminId = 'usr-admin-001';
    const adminProfile: Profile = {
      id: adminId,
      full_name: 'ParkBnB Admin',
      email: 'admin@parkbnb.in',
      phone: '9876543210',
      phone_verified: true,
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(adminId, adminProfile);

    // 2. Initial Verified Host in Ahmedabad (Pilot Provider)
    const hostId = 'usr-host-ahmedabad-01';
    const hostProfile: Profile = {
      id: hostId,
      full_name: 'Rajesh Patel',
      email: 'rajesh.patel@gmail.com',
      phone: '9825012345',
      phone_verified: true,
      role: 'provider',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(hostId, hostProfile);

    const providerRecord: ProviderProfile = {
      id: hostId,
      provider_type: 'individual_residential',
      business_name: 'Shivalik Heights Parking Allotment',
      verification_status: 'approved',
      verified_at: new Date(Date.now() - 86400000 * 25).toISOString(),
      verified_by: adminId,
      bank_account_holder: 'Rajesh Patel',
      bank_account_number: '123456789012',
      bank_ifsc_code: 'HDFC0001234',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.providerProfiles.set(hostId, providerRecord);

    // 3. Verified Ahmedabad Properties
    // Property 1: Prahlad Nagar, Ahmedabad
    const prop1Id = 'prop-prahladnagar-01';
    const prop1: Property = {
      id: prop1Id,
      provider_id: hostId,
      title: 'Shivalik Business Hub & Residences',
      property_type: 'apartment_complex',
      address_line1: 'B-Wing, Opp. Prahlad Nagar Garden',
      address_line2: 'Prahlad Nagar Road',
      landmark: 'Near Prahlad Nagar Garden Gate 2',
      area: 'Prahlad Nagar',
      city: 'Ahmedabad',
      postal_code: '380015',
      latitude: 23.0124,
      longitude: 72.5085,
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    };
    this.properties.set(prop1Id, prop1);

    // Space 1: Dedicated Covered Car Slot in Prahlad Nagar
    const space1Id = 'spc-prahladnagar-01';
    const space1: ParkingSpace = {
      id: space1Id,
      property_id: prop1Id,
      provider_id: hostId,
      identifier: 'Basement Slot B-22',
      title: 'Covered Secure Parking near Prahlad Nagar Garden',
      description: 'CCTV monitored, dedicated underground spot with 24/7 security guard. Easy access ramp off main road.',
      parking_type: 'covered',
      hourly_rate: 40.00,
      daily_rate: 300.00,
      monthly_rate: 4500.00,
      min_duration_hours: 1,
      max_duration_hours: 720,
      access_instructions: 'Drive into Gate 2, inform security guard Rajesh Bhai slot B-22. Display your ParkBnB booking reference.',
      security_features: ['cctv', 'gated_security', 'covered_shade', 'lighting', 'wide_slot'],
      has_ev_charging: true,
      height_limit_meters: 2.4,
      status: 'approved',
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
      updated_at: new Date().toISOString(),
      property: prop1,
      photos: [
        {
          id: 'p1',
          space_id: space1Id,
          storage_path: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
          is_primary: true,
          display_order: 0,
          created_at: new Date().toISOString(),
        }
      ],
      vehicle_types: ['car_sedan', 'car_suv', 'car_hatchback', 'ev_four_wheeler']
    };
    this.spaces.set(space1Id, space1);

    // Property 2: Sindhu Bhavan Road, Bodakdev
    const prop2Id = 'prop-sbr-02';
    const prop2: Property = {
      id: prop2Id,
      provider_id: hostId,
      title: 'Times Square Commercial Precinct',
      property_type: 'commercial_lot',
      address_line1: 'Near Sindhu Bhavan Marg',
      landmark: 'Next to Taj Skyline',
      area: 'Sindhu Bhavan Road / Bodakdev',
      city: 'Ahmedabad',
      postal_code: '380054',
      latitude: 23.0450,
      longitude: 72.5080,
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    };
    this.properties.set(prop2Id, prop2);

    // Space 2: EV charging space on Sindhu Bhavan Road
    const space2Id = 'spc-sbr-02';
    const space2: ParkingSpace = {
      id: space2Id,
      property_id: prop2Id,
      provider_id: hostId,
      identifier: 'Surface Bay EV-04',
      title: 'Prime Surface Parking with EV Charging on Sindhu Bhavan',
      description: 'Wide, well-lit parking bay ideal for premium SUVs, sedans, and two-wheelers. Level 2 AC EV charging point installed.',
      parking_type: 'open',
      hourly_rate: 50.00,
      daily_rate: 380.00,
      monthly_rate: 5500.00,
      min_duration_hours: 1,
      max_duration_hours: 720,
      access_instructions: 'Enter commercial gate, tell barrier operator ParkBnB Booking EV-04. Charger activation code is 4492.',
      security_features: ['cctv', 'ev_charger', 'gated_security', '24x7_access'],
      has_ev_charging: true,
      height_limit_meters: 3.5,
      status: 'approved',
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
      updated_at: new Date().toISOString(),
      property: prop2,
      photos: [
        {
          id: 'p2',
          space_id: space2Id,
          storage_path: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
          is_primary: true,
          display_order: 0,
          created_at: new Date().toISOString(),
        }
      ],
      vehicle_types: ['car_sedan', 'car_suv', 'car_hatchback', 'two_wheeler', 'ev_four_wheeler', 'ev_two_wheeler']
    };
    this.spaces.set(space2Id, space2);

    // Property 3: Navrangpura near CG Road
    const prop3Id = 'prop-navrangpura-03';
    const prop3: Property = {
      id: prop3Id,
      provider_id: hostId,
      title: 'Parimal Heritage Arcade',
      property_type: 'commercial_lot',
      address_line1: 'Off CG Road, Near Municipal Market',
      landmark: 'Behind Girish Cold Drinks',
      area: 'Navrangpura & CG Road',
      city: 'Ahmedabad',
      postal_code: '380009',
      latitude: 23.0365,
      longitude: 72.5611,
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    };
    this.properties.set(prop3Id, prop3);

    // Space 3: Two-Wheeler and Compact Car Spot in Navrangpura
    const space3Id = 'spc-navrangpura-03';
    const space3: ParkingSpace = {
      id: space3Id,
      property_id: prop3Id,
      provider_id: hostId,
      identifier: 'Slot G-08',
      title: 'Central Navrangpura Parking near CG Road',
      description: 'Hassle-free parking in busy CG Road shopping and business district. Covered ground floor bay.',
      parking_type: 'covered',
      hourly_rate: 30.00,
      daily_rate: 220.00,
      monthly_rate: 3200.00,
      min_duration_hours: 1,
      max_duration_hours: 720,
      access_instructions: 'Show your booking QR code to the entrance attendant at Parimal Arcade. Slot is marked G-08.',
      security_features: ['cctv', 'covered_shade', 'lighting'],
      has_ev_charging: false,
      height_limit_meters: 2.2,
      status: 'approved',
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      updated_at: new Date().toISOString(),
      property: prop3,
      photos: [
        {
          id: 'p3',
          space_id: space3Id,
          storage_path: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
          is_primary: true,
          display_order: 0,
          created_at: new Date().toISOString(),
        }
      ],
      vehicle_types: ['car_sedan', 'car_hatchback', 'two_wheeler', 'ev_two_wheeler']
    };
    this.spaces.set(space3Id, space3);
  }

  // --- Profile Operations ---
  public getProfileById(id: string): Profile | undefined {
    return this.profiles.get(id);
  }

  public getProfileByEmail(email: string): Profile | undefined {
    return Array.from(this.profiles.values()).find(
      p => p.email.toLowerCase() === email.toLowerCase()
    );
  }

  public createProfile(profile: Profile): Profile {
    this.profiles.set(profile.id, profile);
    return profile;
  }

  public updateProfile(id: string, updates: Partial<Profile>): Profile | null {
    const existing = this.profiles.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.profiles.set(id, updated);
    return updated;
  }

  public getAllProfiles(): Profile[] {
    return Array.from(this.profiles.values());
  }

  // --- Provider Profiles ---
  public getProviderProfile(id: string): ProviderProfile | undefined {
    return this.providerProfiles.get(id);
  }

  public saveProviderProfile(provider: ProviderProfile): ProviderProfile {
    this.providerProfiles.set(provider.id, provider);
    return provider;
  }

  public getAllProviders(): ProviderProfile[] {
    return Array.from(this.providerProfiles.values());
  }

  // --- Spaces & Properties ---
  public getAllSpaces(): ParkingSpace[] {
    return Array.from(this.spaces.values());
  }

  public getApprovedPublicSpaces(): ParkingSpace[] {
    return Array.from(this.spaces.values()).filter(
      s => s.status === 'approved' && s.is_active
    );
  }

  public getSpaceById(id: string): ParkingSpace | undefined {
    return this.spaces.get(id);
  }

  public getSpacesByProvider(providerId: string): ParkingSpace[] {
    return Array.from(this.spaces.values()).filter(s => s.provider_id === providerId);
  }

  public createSpace(space: ParkingSpace): ParkingSpace {
    this.spaces.set(space.id, space);
    return space;
  }

  public updateSpace(id: string, updates: Partial<ParkingSpace>): ParkingSpace | null {
    const existing = this.spaces.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.spaces.set(id, updated);
    return updated;
  }

  public createProperty(property: Property): Property {
    this.properties.set(property.id, property);
    return property;
  }

  public getPropertiesByProvider(providerId: string): Property[] {
    return Array.from(this.properties.values()).filter(p => p.provider_id === providerId);
  }

  // --- Vehicles ---
  public getVehiclesByCustomer(customerId: string): CustomerVehicle[] {
    return Array.from(this.vehicles.values()).filter(v => v.customer_id === customerId);
  }

  public getVehicleById(id: string): CustomerVehicle | undefined {
    return this.vehicles.get(id);
  }

  public createVehicle(vehicle: CustomerVehicle): CustomerVehicle {
    if (vehicle.is_default) {
      // Unset other defaults for this customer
      for (const [k, v] of this.vehicles.entries()) {
        if (v.customer_id === vehicle.customer_id) {
          this.vehicles.set(k, { ...v, is_default: false });
        }
      }
    }
    this.vehicles.set(vehicle.id, vehicle);
    return vehicle;
  }

  public deleteVehicle(id: string, customerId: string): boolean {
    const v = this.vehicles.get(id);
    if (!v || v.customer_id !== customerId) return false;
    return this.vehicles.delete(id);
  }

  // --- Availability & Double Booking Concurrency Protection ---
  public checkAvailability(spaceId: string, startTime: string, endTime: string): boolean {
    const space = this.spaces.get(spaceId);
    if (!space || space.status !== 'approved' || !space.is_active) {
      return false;
    }

    const reqStart = new Date(startTime).getTime();
    const reqEnd = new Date(endTime).getTime();

    if (isNaN(reqStart) || isNaN(reqEnd) || reqEnd <= reqStart) {
      return false;
    }

    const now = Date.now();

    // 1. Check existing confirmed or active bookings
    for (const b of this.bookings.values()) {
      if (b.space_id === spaceId && (b.status === 'confirmed' || b.status === 'active')) {
        const bStart = new Date(b.start_time).getTime();
        const bEnd = new Date(b.end_time).getTime();
        // Overlap condition: reqStart < bEnd AND reqEnd > bStart
        if (reqStart < bEnd && reqEnd > bStart) {
          return false;
        }
      }
    }

    // 2. Check active temporary holds
    for (const h of this.holds.values()) {
      if (h.space_id === spaceId && h.is_active) {
        const expiresAt = new Date(h.expires_at).getTime();
        if (expiresAt > now) {
          const hStart = new Date(h.start_time).getTime();
          const hEnd = new Date(h.end_time).getTime();
          if (reqStart < hEnd && reqEnd > hStart) {
            return false;
          }
        }
      }
    }

    return true;
  }

  // Atomic Hold Reservation
  public createHold(spaceId: string, customerId: string, startTime: string, endTime: string, holdMinutes = 10): BookingHold | null {
    if (!this.checkAvailability(spaceId, startTime, endTime)) {
      return null;
    }

    const holdId = 'hld-' + Math.random().toString(36).substring(2, 9);
    const hold: BookingHold = {
      id: holdId,
      space_id: spaceId,
      customer_id: customerId,
      start_time: startTime,
      end_time: endTime,
      expires_at: new Date(Date.now() + holdMinutes * 60000).toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.holds.set(holdId, hold);
    return hold;
  }

  public releaseHold(spaceId: string, customerId: string) {
    for (const [id, h] of this.holds.entries()) {
      if (h.space_id === spaceId && h.customer_id === customerId) {
        this.holds.set(id, { ...h, is_active: false });
      }
    }
  }

  // --- Pricing Calculation ---
  public calculatePricing(space: ParkingSpace, startTime: string, endTime: string) {
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();
    const diffHours = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60)));

    let baseAmount = 0;
    if (diffHours >= 24 && space.daily_rate) {
      const days = Math.floor(diffHours / 24);
      const remainingHours = diffHours % 24;
      baseAmount = (days * space.daily_rate) + (remainingHours * space.hourly_rate);
    } else {
      baseAmount = diffHours * space.hourly_rate;
    }

    const platformRate = 0.15; // 15% platform fee
    const platformFee = Math.round(baseAmount * platformRate * 100) / 100;
    const gstRate = 0.18; // 18% GST on platform service fee
    const taxAmount = Math.round(platformFee * gstRate * 100) / 100;
    const totalAmount = Math.round((baseAmount + platformFee + taxAmount) * 100) / 100;
    const providerPayoutAmount = baseAmount; // Net to provider

    return {
      totalHours: diffHours,
      baseAmount,
      platformFee,
      taxAmount,
      totalAmount,
      providerPayoutAmount,
    };
  }

  // --- Bookings ---
  public createBooking(booking: Booking): Booking {
    this.bookings.set(booking.id, booking);
    return booking;
  }

  public getBookingById(id: string): Booking | undefined {
    const b = this.bookings.get(id);
    if (!b) return undefined;
    return {
      ...b,
      space: this.spaces.get(b.space_id),
      vehicle: this.vehicles.get(b.vehicle_id),
      customer: this.profiles.get(b.customer_id),
    };
  }

  public getBookingsByCustomer(customerId: string): Booking[] {
    return Array.from(this.bookings.values())
      .filter(b => b.customer_id === customerId)
      .map(b => ({
        ...b,
        space: this.spaces.get(b.space_id),
        vehicle: this.vehicles.get(b.vehicle_id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getBookingsByProvider(providerId: string): Booking[] {
    return Array.from(this.bookings.values())
      .filter(b => b.provider_id === providerId)
      .map(b => ({
        ...b,
        space: this.spaces.get(b.space_id),
        vehicle: this.vehicles.get(b.vehicle_id),
        customer: this.profiles.get(b.customer_id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getAllBookings(): Booking[] {
    return Array.from(this.bookings.values())
      .map(b => ({
        ...b,
        space: this.spaces.get(b.space_id),
        vehicle: this.vehicles.get(b.vehicle_id),
        customer: this.profiles.get(b.customer_id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public updateBookingStatus(id: string, status: BookingStatus, reason?: string): Booking | null {
    const existing = this.bookings.get(id);
    if (!existing) return null;
    const updated: Booking = {
      ...existing,
      status,
      cancellation_reason: reason || existing.cancellation_reason,
      cancelled_at: status.includes('cancelled') ? new Date().toISOString() : existing.cancelled_at,
      updated_at: new Date().toISOString(),
    };
    this.bookings.set(id, updated);
    return updated;
  }

  // --- Financial Ledger ---
  public recordLedgerEntry(entry: Omit<FinancialLedgerEntry, 'id' | 'created_at'>): FinancialLedgerEntry {
    const record: FinancialLedgerEntry = {
      id: 'led-' + Math.random().toString(36).substring(2, 9),
      ...entry,
      created_at: new Date().toISOString(),
    };
    this.ledger.push(record);
    return record;
  }

  public getLedgerEntries(): FinancialLedgerEntry[] {
    return [...this.ledger].reverse();
  }

  public getProviderLedger(providerId: string): FinancialLedgerEntry[] {
    const accountTag = `PROVIDER_ESCROW:${providerId}`;
    return this.ledger
      .filter(e => e.debit_account === accountTag || e.credit_account === accountTag)
      .reverse();
  }

  // --- Reviews ---
  public getReviewsBySpace(spaceId: string): Review[] {
    return this.reviews
      .filter(r => r.space_id === spaceId && r.is_approved)
      .map(r => ({ ...r, customer: this.profiles.get(r.customer_id) }));
  }

  public addReview(review: Omit<Review, 'id' | 'created_at'>): Review {
    const r: Review = {
      id: 'rev-' + Math.random().toString(36).substring(2, 9),
      ...review,
      created_at: new Date().toISOString(),
    };
    this.reviews.push(r);
    return r;
  }

  // --- Support Tickets ---
  public createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at'>): SupportTicket {
    const t: SupportTicket = {
      id: 'tkt-' + Math.random().toString(36).substring(2, 9),
      ...ticket,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.tickets.push(t);
    return t;
  }

  public getTicketsByUser(userId: string): SupportTicket[] {
    return this.tickets.filter(t => t.user_id === userId).reverse();
  }

  public getAllTickets(): SupportTicket[] {
    return [...this.tickets].reverse();
  }

  // --- Administrative Aggregates ---
  public getAdminMetrics() {
    const totalCustomers = Array.from(this.profiles.values()).filter(p => p.role === 'customer').length;
    const totalProviders = Array.from(this.providerProfiles.values()).length;
    const pendingVerifications = Array.from(this.spaces.values()).filter(s => s.status === 'submitted').length +
      Array.from(this.providerProfiles.values()).filter(p => p.verification_status === 'submitted').length;
    const activeListings = Array.from(this.spaces.values()).filter(s => s.status === 'approved' && s.is_active).length;
    const allBookings = Array.from(this.bookings.values());
    const completedBookings = allBookings.filter(b => b.status === 'completed' || b.status === 'confirmed');
    const gmv = completedBookings.reduce((sum, b) => sum + b.total_amount, 0);
    const platformRevenue = completedBookings.reduce((sum, b) => sum + (b.platform_fee + b.tax_amount), 0);
    const openDisputes = this.tickets.filter(t => t.status === 'open').length;

    return {
      totalCustomers,
      totalProviders,
      pendingVerifications,
      activeListings,
      totalBookings: allBookings.length,
      confirmedBookings: completedBookings.length,
      gmv,
      platformRevenue,
      openDisputes,
    };
  }
}

// Global Singleton for Node.js App Lifecycle
const globalForMarketplace = globalThis as unknown as { marketplaceStore?: MarketplaceStore };
export const getLocalStore = () => {
  if (!globalForMarketplace.marketplaceStore) {
    globalForMarketplace.marketplaceStore = new MarketplaceStore();
  }
  return globalForMarketplace.marketplaceStore;
};
