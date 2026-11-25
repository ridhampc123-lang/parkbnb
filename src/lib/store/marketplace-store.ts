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
  PlatformSettings,
} from '@/types/database';
import {
  generateCustomerPublicId,
  generateBookingCustomerReference,
  maskCustomerDisplayName,
  maskPhoneNumber,
  maskEmail,
} from '@/lib/privacy/customer-privacy';
import { hashPassword, verifyPassword } from '@/lib/auth/session-token';

export interface AuthCredential {
  userId: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  fullName: string;
  phone?: string | null;
  createdAt: string;
}

export interface OtpVerification {
  id: string;
  phone: string;
  otp_hash: string;
  attempts: number;
  max_attempts: number;
  expires_at: string;
  verified_at?: string;
  created_at: string;
}

/**
 * Production In-Memory Database Store conforming strictly to PostgreSQL schema.
 * STRICT NON-NEGOTIABLE COMPLIANCE:
 * - Empty collections display true empty states and zeros.
 * - Privacy architecture: Customer Public ID, Booking Privacy References, Masked Names.
 * - Privileged Customer Lookup audit logging.
 * - Pilot Ahmedabad parking supply enabled for discovery and reservations.
 */
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
  private auditLogs: AuditLogEntry[] = [];
  private customerDataAccessLogs: CustomerDataAccessLog[] = [];
  private otps: Map<string, OtpVerification[]> = new Map();
  private credentials: Map<string, AuthCredential> = new Map();
  private settings: PlatformSettings = {
    platformCommissionRate: 0.15,
    gstRate: 0.18,
    temporaryHoldMinutes: 10,
    cancellationWindowHours: 2,
    emergencyMaintenanceMode: false,
    instantPayoutsEnabled: true,
    supportHotline: '+91 79 4900 1234',
    supportEmail: 'ops@parkbnb.in',
    activeZones: [
      'Prahlad Nagar',
      'Sindhu Bhavan Road / Bodakdev',
      'Navrangpura & CG Road',
      'Ashram Road',
      'Vastrapur',
    ],
    listingTitleOptions: [
      'Covered Basement Parking Bay',
      'Prime Surface Parking Slot with Security',
      'Residential Gated Stilt Parking',
      'Covered Parking Bay with EV Charging Socket',
      'Commercial Multi-Level Parking Slot',
      'Secure Overnight Parking Bay',
      'Private Driveway Parking Space',
      'Open-Air Visitor Parking Bay',
    ],
  };

  constructor() {
    this.initializeSystemBootstrap();
  }

  private initializeSystemBootstrap() {
    // 1. Initial Root Administrator
    const adminId = 'usr-admin-system-01';
    const systemAdmin: Profile = {
      id: adminId,
      customer_public_id: 'PBN-C-ADMIN001',
      full_name: 'ParkBnB Administrator',
      email: 'admin@parkbnb.in',
      phone: '9876543210',
      phone_verified: true,
      role: 'super_admin',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(adminId, systemAdmin);

    // Bootstrap Root Admin & Host Credentials for reliable zero-friction login
    const adminHash = hashPassword('Admin@2026!', 'salt-admin-static-2026');
    this.credentials.set('admin@parkbnb.in', {
      userId: adminId,
      email: 'admin@parkbnb.in',
      passwordHash: adminHash.hash,
      salt: adminHash.salt,
      role: 'super_admin',
      fullName: 'ParkBnB Administrator',
      phone: '9876543210',
      createdAt: new Date().toISOString(),
    });

    const host1Cred = hashPassword('Host@123456', 'salt-host1-static-2026');
    this.credentials.set('rajesh.patel@example.com', {
      userId: 'usr-host-ahmedabad-01',
      email: 'rajesh.patel@example.com',
      passwordHash: host1Cred.hash,
      salt: host1Cred.salt,
      role: 'provider',
      fullName: 'Rajesh Patel',
      phone: '9825012345',
      createdAt: new Date().toISOString(),
    });

    // 2. Pilot Ahmedabad Parking Supply (Verified & Bookable)
    // Host 1: Rajesh Patel (Residential Individual, Prahlad Nagar)
    const host1Id = 'usr-host-ahmedabad-01';
    const host1Profile: Profile = {
      id: host1Id,
      customer_public_id: 'PBN-C-HST001',
      full_name: 'Rajesh Patel',
      email: 'rajesh.patel@example.com',
      phone: '9825012345',
      phone_verified: true,
      role: 'provider',
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(host1Id, host1Profile);

    const provider1: ProviderProfile = {
      id: host1Id,
      provider_type: 'individual_residential',
      business_name: 'Shivalik Heights Parking Allotment',
      verification_status: 'approved',
      verified_at: new Date(Date.now() - 86400000 * 28).toISOString(),
      verified_by: adminId,
      bank_account_holder: 'Rajesh Patel',
      bank_account_number: '123456789012',
      bank_ifsc_code: 'HDFC0001234',
      upi_id: 'rajesh.patel@okhdfcbank',
      commission_rate: 0.15,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.providerProfiles.set(host1Id, provider1);

    const prop1Id = 'prop-prahladnagar-01';
    const prop1: Property = {
      id: prop1Id,
      provider_id: host1Id,
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
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    };
    this.properties.set(prop1Id, prop1);

    const space1Id = 'spc-prahladnagar-01';
    const space1: ParkingSpace = {
      id: space1Id,
      property_id: prop1Id,
      provider_id: host1Id,
      identifier: 'Basement Slot B-22',
      title: 'Covered Secure Parking near Prahlad Nagar Garden',
      description: 'CCTV monitored, dedicated underground spot with 24/7 security guard. Easy access ramp off main road.',
      parking_type: 'covered',
      hourly_rate: 40.0,
      daily_rate: 300.0,
      monthly_rate: 4500.0,
      min_duration_hours: 1,
      max_duration_hours: 720,
      access_instructions: 'Drive into Gate 2, inform security attendant slot B-22. Display your ParkBnB booking reference.',
      security_features: ['cctv', 'gated_security', 'covered_shade', 'lighting', 'wide_slot'],
      has_ev_charging: true,
      height_limit_meters: 2.4,
      status: 'approved',
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
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
        },
      ],
      vehicle_types: ['car_sedan', 'car_suv', 'car_hatchback', 'ev_four_wheeler'],
    };
    this.spaces.set(space1Id, space1);

    // Host 2: Vikram Shah / Times Square Commercial (Sindhu Bhavan Road)
    const host2Id = 'usr-host-ahmedabad-02';
    const host2Profile: Profile = {
      id: host2Id,
      customer_public_id: 'PBN-C-HST002',
      full_name: 'Vikram Shah',
      email: 'management@timessquare-ahmedabad.com',
      phone: '9879511223',
      phone_verified: true,
      role: 'provider',
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(host2Id, host2Profile);

    const provider2: ProviderProfile = {
      id: host2Id,
      provider_type: 'commercial_operator',
      business_name: 'Times Square Commercial Precinct LLP',
      pan_number: 'AABCT1234E',
      gstin: '24AABCT1234E1Z5',
      verification_status: 'approved',
      verified_at: new Date(Date.now() - 86400000 * 20).toISOString(),
      verified_by: adminId,
      bank_account_holder: 'Times Square Commercial Precinct LLP',
      bank_account_number: '987654321098',
      bank_ifsc_code: 'ICIC0000102',
      upi_id: 'timessquare@icici',
      commission_rate: 0.12,
      created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.providerProfiles.set(host2Id, provider2);

    const prop2Id = 'prop-sbr-02';
    const prop2: Property = {
      id: prop2Id,
      provider_id: host2Id,
      title: 'Times Square Commercial Precinct',
      property_type: 'commercial_lot',
      address_line1: 'Near Sindhu Bhavan Marg',
      landmark: 'Next to Taj Skyline',
      area: 'Sindhu Bhavan Road / Bodakdev',
      city: 'Ahmedabad',
      postal_code: '380054',
      latitude: 23.045,
      longitude: 72.508,
      created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
    };
    this.properties.set(prop2Id, prop2);

    const space2Id = 'spc-sbr-02';
    const space2: ParkingSpace = {
      id: space2Id,
      property_id: prop2Id,
      provider_id: host2Id,
      identifier: 'Surface Bay EV-04',
      title: 'Prime Surface Parking with EV Charging on Sindhu Bhavan',
      description: 'Wide, well-lit parking bay ideal for premium SUVs, sedans, and two-wheelers. Level 2 AC EV charging point installed.',
      parking_type: 'open',
      hourly_rate: 50.0,
      daily_rate: 380.0,
      monthly_rate: 5500.0,
      min_duration_hours: 1,
      max_duration_hours: 720,
      access_instructions: 'Enter commercial gate, tell barrier attendant ParkBnB Booking EV-04. Charger activation code is 4492.',
      security_features: ['cctv', 'ev_charger', 'gated_security', '24x7_access'],
      has_ev_charging: true,
      height_limit_meters: 3.5,
      status: 'approved',
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
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
        },
      ],
      vehicle_types: ['car_sedan', 'car_suv', 'car_hatchback', 'two_wheeler', 'ev_four_wheeler', 'ev_two_wheeler'],
    };
    this.spaces.set(space2Id, space2);

    // =============================================================
    // PAN-INDIA METRO SUPPLY (MUMBAI, DELHI NCR, BENGALURU, PUNE, HYDERABAD, CHENNAI, KOLKATA)
    // =============================================================
    // Host 3: Mumbai Metro Supply
    const host3Id = 'usr-host-mumbai-01';
    const host3Profile: Profile = {
      id: host3Id,
      customer_public_id: 'PBN-C-MUM001',
      full_name: 'Aditya Singhania',
      email: 'aditya.singhania@bkc-parking.in',
      phone: '9820011223',
      phone_verified: true,
      role: 'provider',
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 40).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(host3Id, host3Profile);

    const provider3: ProviderProfile = {
      id: host3Id,
      provider_type: 'commercial_operator',
      business_name: 'BKC Financial Center Parking Towers',
      pan_number: 'AAACS9876K',
      gstin: '27AAACS9876K1Z9',
      verification_status: 'approved',
      verified_at: new Date(Date.now() - 86400000 * 35).toISOString(),
      verified_by: adminId,
      bank_account_holder: 'BKC Financial Center Parking Towers',
      bank_account_number: '50200012345678',
      bank_ifsc_code: 'HDFC0000060',
      upi_id: 'bkc.parking@hdfcbank',
      commission_rate: 0.12,
      created_at: new Date(Date.now() - 86400000 * 40).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.providerProfiles.set(host3Id, provider3);

    const prop3Id = 'prop-mumbai-bkc-01';
    const prop3: Property = {
      id: prop3Id,
      provider_id: host3Id,
      title: 'One BKC Commercial Tower',
      property_type: 'commercial_lot',
      address_line1: 'G Block, Bandra Kurla Complex',
      landmark: 'Near MCA Club & US Consulate',
      area: 'Bandra Kurla Complex (BKC)',
      city: 'Mumbai',
      postal_code: '400051',
      latitude: 19.0657,
      longitude: 72.8687,
      created_at: new Date(Date.now() - 86400000 * 40).toISOString(),
    };
    this.properties.set(prop3Id, prop3);

    const space3Id = 'spc-mumbai-bkc-01';
    const space3: ParkingSpace = {
      id: space3Id,
      property_id: prop3Id,
      provider_id: host3Id,
      identifier: 'Podium Bay P2-18',
      title: 'Covered Executive Parking at BKC Financial Center',
      description: 'Boom barrier ANPR access, 24/7 CISF grade security, EV fast charging. Premium multi-level podium spot in Mumbai BKC.',
      parking_type: 'covered',
      hourly_rate: 80.0,
      daily_rate: 650.0,
      monthly_rate: 9500.0,
      min_duration_hours: 1,
      max_duration_hours: 720,
      access_instructions: 'Scan entry QR or display ParkBnB Booking ID to gate attendant. Automatic ANPR barrier clears verified plates.',
      security_features: ['cctv', 'gated_security', 'ev_charger', 'covered_shade', 'boom_barrier', 'valet'],
      has_ev_charging: true,
      height_limit_meters: 2.8,
      status: 'approved',
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 40).toISOString(),
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
        },
      ],
      vehicle_types: ['car_sedan', 'car_suv', 'car_hatchback', 'two_wheeler', 'ev_four_wheeler', 'ev_two_wheeler'],
    };
    this.spaces.set(space3Id, space3);

    // Host 4: Delhi NCR Supply
    const host4Id = 'usr-host-delhi-01';
    const host4Profile: Profile = {
      id: host4Id,
      customer_public_id: 'PBN-C-DEL001',
      full_name: 'Rohit Mehra',
      email: 'rohit.mehra@cybercity-dlf.in',
      phone: '9811099887',
      phone_verified: true,
      role: 'provider',
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 35).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(host4Id, host4Profile);

    const provider4: ProviderProfile = {
      id: host4Id,
      provider_type: 'commercial_operator',
      business_name: 'Cyber City Mobility Services',
      pan_number: 'AABCM6543R',
      gstin: '07AABCM6543R1Z2',
      verification_status: 'approved',
      verified_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      verified_by: adminId,
      bank_account_holder: 'Cyber City Mobility Services',
      bank_account_number: '002105001234',
      bank_ifsc_code: 'ICIC0000021',
      upi_id: 'cybercity.parking@icici',
      commission_rate: 0.15,
      created_at: new Date(Date.now() - 86400000 * 35).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.providerProfiles.set(host4Id, provider4);

    const prop4Id = 'prop-delhi-cybercity-01';
    const prop4: Property = {
      id: prop4Id,
      provider_id: host4Id,
      title: 'DLF Cyber City Tower 10',
      property_type: 'commercial_lot',
      address_line1: 'DLF Phase 2, Cyber Hub Corridor',
      landmark: 'Next to Cyber Hub Metro Station',
      area: 'Gurgaon Cyber City (DLF Phase 2/3)',
      city: 'Delhi NCR',
      postal_code: '122002',
      latitude: 28.4950,
      longitude: 77.0895,
      created_at: new Date(Date.now() - 86400000 * 35).toISOString(),
    };
    this.properties.set(prop4Id, prop4);

    const space4Id = 'spc-delhi-cybercity-01';
    const space4: ParkingSpace = {
      id: space4Id,
      property_id: prop4Id,
      provider_id: host4Id,
      identifier: 'Basement 1, Spot 42',
      title: 'Premium Corporate Spot at DLF Cyber City Tower',
      description: 'Underground climate-controlled parking with direct high-speed elevator access to corporate offices and Cyber Hub food court.',
      parking_type: 'basement',
      hourly_rate: 70.0,
      daily_rate: 550.0,
      monthly_rate: 8000.0,
      min_duration_hours: 1,
      max_duration_hours: 720,
      access_instructions: 'Drive into Basement Gate 3, show booking QR code to security. Slot #42 is immediately beside Tower 10 lobby.',
      security_features: ['cctv', 'gated_security', 'covered_shade', 'ev_charger', 'elevator_access'],
      has_ev_charging: true,
      height_limit_meters: 2.5,
      status: 'approved',
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 35).toISOString(),
      updated_at: new Date().toISOString(),
      property: prop4,
      photos: [
        {
          id: 'p4',
          space_id: space4Id,
          storage_path: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
          is_primary: true,
          display_order: 0,
          created_at: new Date().toISOString(),
        },
      ],
      vehicle_types: ['car_sedan', 'car_suv', 'car_hatchback', 'two_wheeler', 'ev_four_wheeler', 'ev_two_wheeler'],
    };
    this.spaces.set(space4Id, space4);

    // Host 5: Bengaluru Silicon Valley Supply
    const host5Id = 'usr-host-blr-01';
    const host5Profile: Profile = {
      id: host5Id,
      customer_public_id: 'PBN-C-BLR001',
      full_name: 'Suresh Narayanan',
      email: 'suresh.n@koramangala-parking.com',
      phone: '9845012399',
      phone_verified: true,
      role: 'provider',
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(host5Id, host5Profile);

    const provider5: ProviderProfile = {
      id: host5Id,
      provider_type: 'individual_residential',
      business_name: 'Koramangala Gated Stilt Parking',
      verification_status: 'approved',
      verified_at: new Date(Date.now() - 86400000 * 25).toISOString(),
      verified_by: adminId,
      bank_account_holder: 'Suresh Narayanan',
      bank_account_number: '600123456789',
      bank_ifsc_code: 'SBIN0001234',
      upi_id: 'suresh.n@oksbi',
      commission_rate: 0.15,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.providerProfiles.set(host5Id, provider5);

    const prop5Id = 'prop-blr-kora-01';
    const prop5: Property = {
      id: prop5Id,
      provider_id: host5Id,
      title: 'Green Glen Residences',
      property_type: 'apartment_complex',
      address_line1: '17th Main Road, 4th Block',
      landmark: 'Near Sony World Signal & Bethany High School',
      area: 'Koramangala',
      city: 'Bengaluru',
      postal_code: '560034',
      latitude: 12.9352,
      longitude: 77.6245,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    };
    this.properties.set(prop5Id, prop5);

    const space5Id = 'spc-blr-kora-01';
    const space5: ParkingSpace = {
      id: space5Id,
      property_id: prop5Id,
      provider_id: host5Id,
      identifier: 'Stilt Slot S-08',
      title: 'Gated Stilt Parking in Koramangala 4th Block',
      description: 'Covered stilt parking in premium residential society. 24-hour guard on duty, CCTV monitoring, walking distance to cafes and startups.',
      parking_type: 'covered',
      hourly_rate: 50.0,
      daily_rate: 400.0,
      monthly_rate: 5800.0,
      min_duration_hours: 1,
      max_duration_hours: 720,
      access_instructions: 'Show guard booking reference code at society main gate. Park in assigned stilt slot S-08.',
      security_features: ['cctv', 'gated_security', 'covered_shade', 'lighting'],
      has_ev_charging: true,
      height_limit_meters: 2.6,
      status: 'approved',
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      updated_at: new Date().toISOString(),
      property: prop5,
      photos: [
        {
          id: 'p5',
          space_id: space5Id,
          storage_path: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
          is_primary: true,
          display_order: 0,
          created_at: new Date().toISOString(),
        },
      ],
      vehicle_types: ['car_sedan', 'car_suv', 'car_hatchback', 'two_wheeler', 'ev_four_wheeler', 'ev_two_wheeler'],
    };
    this.spaces.set(space5Id, space5);

    // Host 6: Pune IT Hub Supply
    const host6Id = 'usr-host-pune-01';
    const host6Profile: Profile = {
      id: host6Id,
      customer_public_id: 'PBN-C-PUN001',
      full_name: 'Nitin Deshmukh',
      email: 'nitin.d@hinjewadi-parking.in',
      phone: '9890123456',
      phone_verified: true,
      role: 'provider',
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 28).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(host6Id, host6Profile);

    const provider6: ProviderProfile = {
      id: host6Id,
      provider_type: 'commercial_operator',
      business_name: 'Hinjewadi Tech Corridor Parking',
      verification_status: 'approved',
      verified_at: new Date(Date.now() - 86400000 * 20).toISOString(),
      verified_by: adminId,
      bank_account_holder: 'Nitin Deshmukh',
      bank_account_number: '112233445566',
      bank_ifsc_code: 'BARB0HINJEW',
      upi_id: 'nitin.d@barodampay',
      commission_rate: 0.15,
      created_at: new Date(Date.now() - 86400000 * 28).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.providerProfiles.set(host6Id, provider6);

    const prop6Id = 'prop-pune-hinj-01';
    const prop6: Property = {
      id: prop6Id,
      provider_id: host6Id,
      title: 'Infotech Park Plaza',
      property_type: 'commercial_lot',
      address_line1: 'Phase 1, Hinjewadi Rajiv Gandhi Infotech Park',
      landmark: 'Near Wipro Circle & Blue Ridge',
      area: 'Hinjewadi IT Park',
      city: 'Pune',
      postal_code: '411057',
      latitude: 18.5913,
      longitude: 73.7389,
      created_at: new Date(Date.now() - 86400000 * 28).toISOString(),
    };
    this.properties.set(prop6Id, prop6);

    const space6Id = 'spc-pune-hinj-01';
    const space6: ParkingSpace = {
      id: space6Id,
      property_id: prop6Id,
      provider_id: host6Id,
      identifier: 'Bay IT-14',
      title: 'Covered IT Park Parking at Hinjewadi Phase 1',
      description: 'Dedicated parking bay with shade net, CCTV surveillance, and 24/7 access. Ideal for daily IT professionals.',
      parking_type: 'covered',
      hourly_rate: 40.0,
      daily_rate: 320.0,
      monthly_rate: 4500.0,
      min_duration_hours: 1,
      max_duration_hours: 720,
      access_instructions: 'Enter via Gate 1 on Wipro Road. Attendant will verify license plate against ParkBnB manifest.',
      security_features: ['cctv', 'gated_security', 'covered_shade', '24x7_access'],
      has_ev_charging: true,
      height_limit_meters: 2.7,
      status: 'approved',
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 28).toISOString(),
      updated_at: new Date().toISOString(),
      property: prop6,
      photos: [
        {
          id: 'p6',
          space_id: space6Id,
          storage_path: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
          is_primary: true,
          display_order: 0,
          created_at: new Date().toISOString(),
        },
      ],
      vehicle_types: ['car_sedan', 'car_suv', 'car_hatchback', 'two_wheeler', 'ev_four_wheeler', 'ev_two_wheeler'],
    };
    this.spaces.set(space6Id, space6);

    // Host 7: Hyderabad Cyberabad Supply
    const host7Id = 'usr-host-hyd-01';
    const host7Profile: Profile = {
      id: host7Id,
      customer_public_id: 'PBN-C-HYD001',
      full_name: 'Venkat Reddy',
      email: 'venkat.reddy@cyberabad-parking.com',
      phone: '9849011224',
      phone_verified: true,
      role: 'provider',
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 26).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(host7Id, host7Profile);

    const provider7: ProviderProfile = {
      id: host7Id,
      provider_type: 'commercial_operator',
      business_name: 'HITEC City Smart Park Services',
      verification_status: 'approved',
      verified_at: new Date(Date.now() - 86400000 * 22).toISOString(),
      verified_by: adminId,
      bank_account_holder: 'HITEC City Smart Park Services',
      bank_account_number: '998877665544',
      bank_ifsc_code: 'ANDB0000123',
      upi_id: 'hitecpark@unionbank',
      commission_rate: 0.14,
      created_at: new Date(Date.now() - 86400000 * 26).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.providerProfiles.set(host7Id, provider7);

    const prop7Id = 'prop-hyd-hitec-01';
    const prop7: Property = {
      id: prop7Id,
      provider_id: host7Id,
      title: 'Mindspace Cyber Towers Arcade',
      property_type: 'commercial_lot',
      address_line1: 'Madhapur Road, HITEC City',
      landmark: 'Opposite Cyber Towers Main Gate',
      area: 'HITEC City / Cyberabad',
      city: 'Hyderabad',
      postal_code: '500081',
      latitude: 17.4435,
      longitude: 78.3772,
      created_at: new Date(Date.now() - 86400000 * 26).toISOString(),
    };
    this.properties.set(prop7Id, prop7);

    const space7Id = 'spc-hyd-hitec-01';
    const space7: ParkingSpace = {
      id: space7Id,
      property_id: prop7Id,
      provider_id: host7Id,
      identifier: 'Multi-Level P3-11',
      title: 'Mindspace Corporate Bay at HITEC City Phase 2',
      description: 'Multi-level covered parking bay with automated license plate recognition and CCS2 fast DC charger on site.',
      parking_type: 'multi_level',
      hourly_rate: 55.0,
      daily_rate: 450.0,
      monthly_rate: 6500.0,
      min_duration_hours: 1,
      max_duration_hours: 720,
      access_instructions: 'Drive up to Podium Level 3. Boom barrier automatically raises when license plate matches booking.',
      security_features: ['cctv', 'gated_security', 'ev_charger', 'covered_shade', 'boom_barrier'],
      has_ev_charging: true,
      height_limit_meters: 2.8,
      status: 'approved',
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 26).toISOString(),
      updated_at: new Date().toISOString(),
      property: prop7,
      photos: [
        {
          id: 'p7',
          space_id: space7Id,
          storage_path: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
          is_primary: true,
          display_order: 0,
          created_at: new Date().toISOString(),
        },
      ],
      vehicle_types: ['car_sedan', 'car_suv', 'car_hatchback', 'two_wheeler', 'ev_four_wheeler', 'ev_two_wheeler'],
    };
    this.spaces.set(space7Id, space7);
  }

  // =============================================================
  // PROFILE & USER MANAGEMENT (Drivers / Customers / Admins)
  // =============================================================
  public saveAuthCredentials(credential: AuthCredential): void {
    this.credentials.set(credential.email.toLowerCase().trim(), credential);
  }

  public getAuthCredential(email: string): AuthCredential | undefined {
    return this.credentials.get(email.toLowerCase().trim());
  }

  public verifyUserCredentials(email: string, password: string): { verified: boolean; profile?: Profile } {
    const cred = this.credentials.get(email.toLowerCase().trim());
    if (!cred) {
      return { verified: false };
    }
    const isMatch = verifyPassword(password, cred.passwordHash, cred.salt);
    if (!isMatch) {
      return { verified: false };
    }
    const profile = this.profiles.get(cred.userId) || this.getProfileByEmail(email);
    return { verified: true, profile };
  }

  public getProfileById(id: string): Profile | undefined {
    return this.profiles.get(id);
  }

  public getProfileByEmail(email: string): Profile | undefined {
    return Array.from(this.profiles.values()).find(
      p => p.email && p.email.toLowerCase() === email.toLowerCase()
    );
  }

  public getProfileByPublicId(publicId: string): Profile | undefined {
    const clean = publicId.trim().toUpperCase();
    return Array.from(this.profiles.values()).find(
      p => p.customer_public_id && p.customer_public_id.toUpperCase() === clean
    );
  }

  public getProfileByPhone(phone: string): Profile | undefined {
    const clean = phone.replace(/\D/g, '').slice(-10);
    if (!clean) return undefined;
    return Array.from(this.profiles.values()).find(p => {
      if (!p.phone) return false;
      const pClean = p.phone.replace(/\D/g, '').slice(-10);
      return pClean === clean;
    });
  }

  public createProfile(profile: Profile): Profile {
    const publicId = profile.customer_public_id || generateCustomerPublicId();
    const cleanProfile: Profile = {
      ...profile,
      customer_public_id: publicId,
      status: profile.status || 'active',
    };
    this.profiles.set(profile.id, cleanProfile);
    return cleanProfile;
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

  public getAllCustomers(): Array<
    Profile & {
      vehicles: CustomerVehicle[];
      totalBookings: number;
      lifetimeSpend: number;
      activeBookingsCount: number;
    }
  > {
    return Array.from(this.profiles.values())
      .filter(p => p.role === 'customer')
      .map(p => {
        const vehicles = Array.from(this.vehicles.values()).filter(v => v.customer_id === p.id);
        const customerBookings = Array.from(this.bookings.values()).filter(b => b.customer_id === p.id);
        const lifetimeSpend = customerBookings
          .filter(b => b.status === 'confirmed' || b.status === 'completed' || b.status === 'active')
          .reduce((sum, b) => sum + b.total_amount, 0);
        const activeBookingsCount = customerBookings.filter(
          b => b.status === 'confirmed' || b.status === 'active'
        ).length;

        return {
          ...p,
          status: p.status || 'active',
          vehicles,
          totalBookings: customerBookings.length,
          lifetimeSpend: Math.round(lifetimeSpend * 100) / 100,
          activeBookingsCount,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public toggleUserStatus(userId: string, newStatus: 'active' | 'suspended', reason?: string): Profile | null {
    const profile = this.profiles.get(userId);
    if (!profile) return null;

    const updated: Profile = {
      ...profile,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(userId, updated);

    this.recordAuditLog({
      operator_email: 'admin@parkbnb.in',
      action: newStatus === 'suspended' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      category: 'user',
      target_id: userId,
      target_name: profile.full_name,
      details: reason || `Administrator changed account status to ${newStatus}.`,
    });

    return updated;
  }

  // =============================================================
  // OTP AUTHENTICATION & PHONE VERIFICATION
  // =============================================================
  public saveOtp(phone: string, otpHash: string, expiresAt: string): OtpVerification {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const record: OtpVerification = {
      id: 'otp-' + Math.random().toString(36).substring(2, 9),
      phone: cleanPhone,
      otp_hash: otpHash,
      attempts: 0,
      max_attempts: 3,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };
    const list = this.otps.get(cleanPhone) || [];
    list.unshift(record);
    this.otps.set(cleanPhone, list);
    return record;
  }

  public getLatestOtp(phone: string): OtpVerification | undefined {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const list = this.otps.get(cleanPhone) || [];
    return list[0];
  }

  public recordOtpAttempt(phone: string): number {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const list = this.otps.get(cleanPhone) || [];
    if (list.length > 0) {
      list[0].attempts += 1;
      return list[0].attempts;
    }
    return 0;
  }

  public markOtpVerified(phone: string): void {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const list = this.otps.get(cleanPhone) || [];
    if (list.length > 0) {
      list[0].verified_at = new Date().toISOString();
    }
  }

  public getRecentOtpCount(phone: string, windowMinutes: number = 60): number {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const list = this.otps.get(cleanPhone) || [];
    const cutoff = Date.now() - windowMinutes * 60 * 1000;
    return list.filter(o => new Date(o.created_at).getTime() >= cutoff).length;
  }

  // =============================================================
  // PRIVILEGED CUSTOMER LOOKUP ENGINE (AUDITED STAFF ACCESS)
  // =============================================================
  public privilegedCustomerLookup(params: {
    searchTerm: string;
    reason: string;
    staffId: string;
    staffRole: UserRole;
    staffEmail: string;
    unmaskSensitive?: boolean;
  }): {
    success: boolean;
    customer?: {
      id: string;
      customer_public_id: string;
      masked_display_name: string;
      full_name: string;
      email_masked: string;
      email_unmasked?: string;
      phone_masked: string;
      phone_unmasked?: string;
      status: string;
      created_at: string;
      bookingsCount: number;
    };
    auditLogId?: string;
    error?: string;
  } {
    const { searchTerm, reason, staffId, staffRole, staffEmail, unmaskSensitive } = params;

    if (!reason || reason.trim().length < 5) {
      return { success: false, error: 'A legitimate business reason (min 5 chars) is mandatory for customer lookup.' };
    }

    const term = searchTerm.trim().toLowerCase();
    let targetProfile: Profile | undefined;

    for (const p of this.profiles.values()) {
      if (
        (p.customer_public_id && p.customer_public_id.toLowerCase() === term) ||
        p.id.toLowerCase() === term ||
        (p.email && p.email.toLowerCase() === term) ||
        (p.phone && p.phone.includes(term))
      ) {
        targetProfile = p;
        break;
      }
    }

    if (!targetProfile) {
      for (const b of this.bookings.values()) {
        if (
          b.booking_reference.toLowerCase() === term ||
          (b.booking_customer_reference && b.booking_customer_reference.toLowerCase() === term)
        ) {
          targetProfile = this.profiles.get(b.customer_id);
          break;
        }
      }
    }

    if (!targetProfile) {
      return { success: false, error: 'No customer matching the specified reference was found.' };
    }

    const auditId = 'cda-' + Math.random().toString(36).substring(2, 9);
    const accessLog: CustomerDataAccessLog = {
      id: auditId,
      staff_id: staffId,
      staff_role: staffRole,
      customer_id: targetProfile.id,
      booking_reference: searchTerm,
      reason,
      fields_accessed: unmaskSensitive ? ['full_name', 'email', 'phone', 'vehicles'] : ['masked_identity', 'booking_count'],
      outcome: 'SUCCESS_REVEALED',
      created_at: new Date().toISOString(),
    };
    this.customerDataAccessLogs.unshift(accessLog);

    this.recordAuditLog({
      operator_email: staffEmail,
      action: 'PRIVILEGED_CUSTOMER_LOOKUP',
      category: 'privacy_lookup',
      target_id: targetProfile.customer_public_id || targetProfile.id,
      target_name: targetProfile.full_name,
      details: `Staff member performed audited customer lookup. Reason: ${reason}. Sensitive unmasked: ${Boolean(unmaskSensitive)}`,
    });

    const customerBookings = Array.from(this.bookings.values()).filter(b => b.customer_id === targetProfile!.id);

    return {
      success: true,
      auditLogId: auditId,
      customer: {
        id: targetProfile.id,
        customer_public_id: targetProfile.customer_public_id || generateCustomerPublicId(),
        masked_display_name: maskCustomerDisplayName(targetProfile.full_name),
        full_name: unmaskSensitive ? targetProfile.full_name : maskCustomerDisplayName(targetProfile.full_name),
        email_masked: maskEmail(targetProfile.email),
        email_unmasked: (unmaskSensitive && targetProfile.email) ? targetProfile.email : undefined,
        phone_masked: maskPhoneNumber(targetProfile.phone),
        phone_unmasked: unmaskSensitive ? targetProfile.phone || undefined : undefined,
        status: targetProfile.status || 'active',
        created_at: targetProfile.created_at,
        bookingsCount: customerBookings.length,
      },
    };
  }

  public getCustomerDataAccessLogs(): CustomerDataAccessLog[] {
    return [...this.customerDataAccessLogs];
  }
  // =============================================================
  // PARKING OWNER & HOST MANAGEMENT (Providers)
  // =============================================================
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

  public getAllHosts(): Array<{
    profile: Profile;
    provider: ProviderProfile;
    spacesCount: number;
    activeSpacesCount: number;
    totalEarnings: number;
    unpaidBalance: number;
    spaces: ParkingSpace[];
  }> {
    const results: Array<{
      profile: Profile;
      provider: ProviderProfile;
      spacesCount: number;
      activeSpacesCount: number;
      totalEarnings: number;
      unpaidBalance: number;
      spaces: ParkingSpace[];
    }> = [];

    for (const provider of this.providerProfiles.values()) {
      const profile = this.profiles.get(provider.id);
      if (!profile) continue;

      const hostSpaces = Array.from(this.spaces.values()).filter(s => s.provider_id === provider.id);
      const hostBookings = Array.from(this.bookings.values()).filter(
        b => b.provider_id === provider.id && (b.status === 'completed' || b.status === 'confirmed')
      );

      const totalEarnings = hostBookings.reduce((sum, b) => sum + b.provider_payout_amount, 0);

      const accountTag = `PROVIDER_ESCROW:${provider.id}`;
      const credits = this.ledger
        .filter(e => e.credit_account === accountTag)
        .reduce((sum, e) => sum + e.amount, 0);
      const debits = this.ledger
        .filter(e => e.debit_account === accountTag)
        .reduce((sum, e) => sum + e.amount, 0);
      const unpaidBalance = Math.max(0, credits - debits);

      results.push({
        profile,
        provider,
        spacesCount: hostSpaces.length,
        activeSpacesCount: hostSpaces.filter(s => s.status === 'approved' && s.is_active).length,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        unpaidBalance: Math.round(unpaidBalance * 100) / 100,
        spaces: hostSpaces,
      });
    }

    return results.sort((a, b) => b.totalEarnings - a.totalEarnings);
  }

  public updateHostKYC(
    providerId: string,
    status: VerificationStatus,
    reason?: string,
    operatorEmail = 'admin@parkbnb.in'
  ): ProviderProfile | null {
    const provider = this.providerProfiles.get(providerId);
    if (!provider) return null;

    const updated: ProviderProfile = {
      ...provider,
      verification_status: status,
      rejection_reason: reason || null,
      verified_at: status === 'approved' ? new Date().toISOString() : null,
      verified_by: operatorEmail,
      updated_at: new Date().toISOString(),
    };
    this.providerProfiles.set(providerId, updated);

    if (status === 'suspended') {
      for (const [id, space] of this.spaces.entries()) {
        if (space.provider_id === providerId) {
          this.spaces.set(id, { ...space, is_active: false, status: 'suspended' });
        }
      }
    }

    this.recordAuditLog({
      operator_email: operatorEmail,
      action: `HOST_KYC_${status.toUpperCase()}`,
      category: 'host',
      target_id: providerId,
      target_name: provider.business_name || providerId,
      details: reason || `Admin updated host KYC verification status to ${status}.`,
    });

    return updated;
  }

  public overrideHostCommission(
    providerId: string,
    customRate: number,
    operatorEmail = 'admin@parkbnb.in'
  ): ProviderProfile | null {
    const provider = this.providerProfiles.get(providerId);
    if (!provider) return null;

    const updated: ProviderProfile = {
      ...provider,
      commission_rate: customRate,
      updated_at: new Date().toISOString(),
    };
    this.providerProfiles.set(providerId, updated);

    this.recordAuditLog({
      operator_email: operatorEmail,
      action: 'COMMISSION_OVERRIDE',
      category: 'host',
      target_id: providerId,
      target_name: provider.business_name || providerId,
      details: `Custom commission rate updated to ${(customRate * 100).toFixed(1)}%.`,
    });

    return updated;
  }

  public disburseHostPayout(params: {
    hostId: string;
    amount: number;
    paymentMethod: 'NEFT' | 'IMPS' | 'UPI';
    operatorEmail?: string;
  }) {
    const provider = this.providerProfiles.get(params.hostId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    const reference = `${params.paymentMethod}-IND-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const accountTag = `PROVIDER_ESCROW:${params.hostId}`;

    this.recordLedgerEntry({
      entry_type: 'PROVIDER_PAYOUT',
      debit_account: accountTag,
      credit_account: `BANK_SETTLEMENT:${params.paymentMethod}`,
      amount: params.amount,
      currency: 'INR',
      description: `Disbursement to ${provider.business_name || provider.bank_account_holder || 'Provider'} via ${params.paymentMethod} (Ref: ${reference})`,
      reference_id: reference,
    });

    this.recordAuditLog({
      operator_email: params.operatorEmail || 'admin@parkbnb.in',
      action: 'HOST_PAYOUT_DISBURSED',
      category: 'payout',
      target_id: params.hostId,
      target_name: provider.business_name || params.hostId,
      details: `Processed ₹${params.amount.toFixed(2)} payout via ${params.paymentMethod} with reference ${reference}.`,
    });

    return { success: true, reference, amount: params.amount };
  }

  public updateProviderBankingDetails(providerId: string, details: {
    bank_name?: string | null;
    bank_account_number?: string | null;
    bank_ifsc_code?: string | null;
    bank_account_holder?: string | null;
    upi_id?: string | null;
    payout_preference?: 'bank_transfer' | 'upi';
  }): ProviderProfile | null {
    const existing = this.providerProfiles.get(providerId);
    if (!existing) return null;

    const updated: ProviderProfile = {
      ...existing,
      bank_name: details.bank_name !== undefined ? details.bank_name : existing.bank_name,
      bank_account_number: details.bank_account_number !== undefined ? details.bank_account_number : existing.bank_account_number,
      bank_ifsc_code: details.bank_ifsc_code !== undefined ? details.bank_ifsc_code : existing.bank_ifsc_code,
      bank_account_holder: details.bank_account_holder !== undefined ? details.bank_account_holder : existing.bank_account_holder,
      upi_id: details.upi_id !== undefined ? details.upi_id : existing.upi_id,
      payout_preference: details.payout_preference !== undefined ? details.payout_preference : existing.payout_preference,
      updated_at: new Date().toISOString(),
    };

    this.providerProfiles.set(providerId, updated);

    this.recordAuditLog({
      operator_email: 'host@parkbnb.in',
      action: 'HOST_BANKING_UPDATED',
      category: 'host',
      target_id: providerId,
      target_name: existing.business_name || providerId,
      details: `Disbursement banking details updated: IFSC ${details.bank_ifsc_code || existing.bank_ifsc_code || 'N/A'}, UPI ${details.upi_id || existing.upi_id || 'N/A'}.`,
    });

    return updated;
  }

  // =============================================================
  // PARKING SPACES & PROPERTIES
  // =============================================================
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

  public deleteSpace(id: string): boolean {
    return this.spaces.delete(id);
  }

  public updateSpacePricing(params: {
    spaceId: string;
    hourlyRate: number;
    dailyRate?: number | null;
    monthlyRate?: number | null;
    operatorEmail?: string;
  }): ParkingSpace | null {
    const space = this.spaces.get(params.spaceId);
    if (!space) return null;

    const oldHourly = space.hourly_rate;
    const updated = {
      ...space,
      hourly_rate: params.hourlyRate,
      daily_rate: params.dailyRate !== undefined ? params.dailyRate : space.daily_rate,
      monthly_rate: params.monthlyRate !== undefined ? params.monthlyRate : space.monthly_rate,
      updated_at: new Date().toISOString(),
    };
    this.spaces.set(params.spaceId, updated);

    this.recordAuditLog({
      operator_email: params.operatorEmail || 'admin@parkbnb.in',
      action: 'SPACE_PRICING_UPDATED',
      category: 'space',
      target_id: params.spaceId,
      target_name: space.title,
      details: `Hourly rate adjusted from ₹${oldHourly} to ₹${params.hourlyRate}.`,
    });

    return updated;
  }

  public createProperty(property: Property): Property {
    this.properties.set(property.id, property);
    return property;
  }

  public getPropertiesByProvider(providerId: string): Property[] {
    return Array.from(this.properties.values()).filter(p => p.provider_id === providerId);
  }

  // =============================================================
  // VEHICLES
  // =============================================================
  public getVehiclesByCustomer(customerId: string): CustomerVehicle[] {
    return Array.from(this.vehicles.values()).filter(v => v.customer_id === customerId);
  }

  public getVehicleById(id: string): CustomerVehicle | undefined {
    return this.vehicles.get(id);
  }

  public createVehicle(vehicle: CustomerVehicle): CustomerVehicle {
    if (vehicle.is_default) {
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

  public findVehicleByPlate(customerId: string, regNumber: string): CustomerVehicle | undefined {
    const cleanReg = regNumber.replace(/[\s-]/g, '').toUpperCase();
    return Array.from(this.vehicles.values()).find(
      v => v.customer_id === customerId && v.registration_number.replace(/[\s-]/g, '').toUpperCase() === cleanReg
    );
  }

  // =============================================================
  // AVAILABILITY & ATOMIC HOLD CONCURRENCY PROTECTION
  // =============================================================
  public checkAvailability(spaceId: string, startTime: string, endTime: string, excludingCustomerId?: string): boolean {
    if (this.settings.emergencyMaintenanceMode) {
      return false;
    }

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

    for (const b of this.bookings.values()) {
      if (b.space_id === spaceId && (b.status === 'confirmed' || b.status === 'active')) {
        const bStart = new Date(b.start_time).getTime();
        const bEnd = new Date(b.end_time).getTime();
        if (reqStart < bEnd && reqEnd > bStart) {
          return false;
        }
      }
    }

    for (const h of this.holds.values()) {
      if (h.space_id === spaceId && h.is_active) {
        if (excludingCustomerId && h.customer_id === excludingCustomerId) {
          continue;
        }

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

  public createHold(spaceId: string, customerId: string, startTime: string, endTime: string, holdMinutes?: number): BookingHold | null {
    const minutes = holdMinutes || this.settings.temporaryHoldMinutes || 10;
    if (!this.checkAvailability(spaceId, startTime, endTime, customerId)) {
      return null;
    }

    const holdId = 'hld-' + Math.random().toString(36).substring(2, 9);
    const hold: BookingHold = {
      id: holdId,
      space_id: spaceId,
      customer_id: customerId,
      start_time: startTime,
      end_time: endTime,
      expires_at: new Date(Date.now() + minutes * 60000).toISOString(),
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

  // =============================================================
  // PRICING ENGINE
  // =============================================================
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

    const platformRate = this.settings.platformCommissionRate || 0.15;
    const platformFee = Math.round(baseAmount * platformRate * 100) / 100;
    const gstRate = this.settings.gstRate || 0.18;
    const taxAmount = Math.round(platformFee * gstRate * 100) / 100;
    const totalAmount = Math.round((baseAmount + platformFee + taxAmount) * 100) / 100;
    const providerPayoutAmount = baseAmount;

    return {
      totalHours: diffHours,
      baseAmount,
      platformFee,
      taxAmount,
      totalAmount,
      providerPayoutAmount,
    };
  }

  // =============================================================
  // BOOKINGS MANAGEMENT
  // =============================================================
  public createBooking(booking: Booking): Booking {
    const customer = this.profiles.get(booking.customer_id);
    const bookingWithPrivacy: Booking = {
      ...booking,
      booking_customer_reference: booking.booking_customer_reference || generateBookingCustomerReference(),
      customer_display_name: booking.customer_display_name || maskCustomerDisplayName(customer?.full_name),
    };
    this.bookings.set(booking.id, bookingWithPrivacy);
    return bookingWithPrivacy;
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
        customer: undefined,
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
      check_out_at: status === 'completed' ? new Date().toISOString() : existing.check_out_at,
      updated_at: new Date().toISOString(),
    };
    this.bookings.set(id, updated);
    return updated;
  }

  public hostCheckInBooking(bookingId: string, hostId: string): { success: boolean; error?: string; booking?: Booking } {
    const b = this.bookings.get(bookingId);
    if (!b) return { success: false, error: 'Booking reservation not found.' };
    if (b.provider_id !== hostId) return { success: false, error: 'Unauthorized to manage clearance for this booking.' };
    if (b.status !== 'confirmed') return { success: false, error: `Only confirmed reservations can be checked in (current status: ${b.status}).` };

    const updated: Booking = {
      ...b,
      status: 'active',
      check_in_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.bookings.set(bookingId, updated);

    this.recordAuditLog({
      operator_email: 'host@parkbnb.in',
      action: 'DRIVER_GATE_CHECK_IN',
      category: 'booking',
      target_id: bookingId,
      target_name: b.booking_reference,
      details: `Gate entry granted for vehicle ${b.vehicle?.registration_number || 'Cleared Plate'}. Slot assigned: ${b.space?.identifier}`,
    });

    return { success: true, booking: updated };
  }

  public hostCheckOutBooking(bookingId: string, hostId: string): { success: boolean; error?: string; booking?: Booking; overstayMinutes?: number; overstayAmount?: number } {
    const b = this.bookings.get(bookingId);
    if (!b) return { success: false, error: 'Booking reservation not found.' };
    if (b.provider_id !== hostId) return { success: false, error: 'Unauthorized to manage clearance for this booking.' };
    if (b.status !== 'active') return { success: false, error: `Only active parked vehicles can be checked out (current status: ${b.status}).` };

    const nowMs = Date.now();
    const endMs = new Date(b.end_time).getTime();
    let overstayMinutes = 0;
    let overstayAmount = 0;
    if (nowMs > endMs) {
      overstayMinutes = Math.ceil((nowMs - endMs) / (1000 * 60));
      const overstayHours = Math.ceil(overstayMinutes / 60);
      const hourly = b.space?.hourly_rate || 40;
      overstayAmount = overstayHours * hourly;
    }

    const updated: Booking = {
      ...b,
      status: 'completed',
      check_out_at: new Date().toISOString(),
      overstay_minutes: overstayMinutes > 0 ? overstayMinutes : null,
      overstay_amount: overstayAmount > 0 ? overstayAmount : null,
      updated_at: new Date().toISOString(),
    };
    this.bookings.set(bookingId, updated);

    this.recordAuditLog({
      operator_email: 'host@parkbnb.in',
      action: 'DRIVER_GATE_CHECK_OUT',
      category: 'booking',
      target_id: bookingId,
      target_name: b.booking_reference,
      details: `Driver departed gate. Slot ${b.space?.identifier} released back to inventory.`,
    });

    return { success: true, booking: updated, overstayMinutes, overstayAmount };
  }

  public customerCheckInBooking(bookingId: string, customerId: string): { success: boolean; error?: string; booking?: Booking } {
    const b = this.bookings.get(bookingId);
    if (!b) return { success: false, error: 'Booking reservation not found.' };
    if (b.customer_id !== customerId) return { success: false, error: 'Unauthorized to check in this reservation.' };
    if (b.status !== 'confirmed') return { success: false, error: `Only confirmed reservations can be checked in (current status: ${b.status}).` };

    const updated: Booking = {
      ...b,
      status: 'active',
      check_in_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.bookings.set(bookingId, updated);

    this.recordAuditLog({
      operator_email: 'customer',
      action: 'DRIVER_SELF_CHECK_IN',
      category: 'booking',
      target_id: bookingId,
      target_name: b.booking_reference,
      details: `Driver self-checked in at gate for vehicle ${b.vehicle?.registration_number || 'Plate'}. Slot assigned: ${b.space?.identifier}`,
    });

    return { success: true, booking: updated };
  }

  public customerCheckOutBooking(
    bookingId: string,
    customerId: string,
    overstayParams?: { overstayMinutes: number; overstayCharge: number }
  ): { success: boolean; error?: string; booking?: Booking; overstayMinutes?: number; overstayAmount?: number } {
    const b = this.bookings.get(bookingId);
    if (!b) return { success: false, error: 'Booking reservation not found.' };
    if (b.customer_id !== customerId) return { success: false, error: 'Unauthorized to check out this reservation.' };
    if (b.status !== 'active') return { success: false, error: `Only actively parked vehicles can be checked out (current status: ${b.status}).` };

    const nowMs = Date.now();
    const endMs = new Date(b.end_time).getTime();
    let overstayMinutes = overstayParams?.overstayMinutes || 0;
    let overstayAmount = overstayParams?.overstayCharge || 0;

    if (!overstayMinutes && nowMs > endMs) {
      overstayMinutes = Math.ceil((nowMs - endMs) / (1000 * 60));
      const overstayHours = Math.ceil(overstayMinutes / 60);
      const hourly = b.space?.hourly_rate || 40;
      overstayAmount = overstayHours * hourly;
    }

    const updated: Booking = {
      ...b,
      status: 'completed',
      check_out_at: new Date().toISOString(),
      overstay_minutes: overstayMinutes > 0 ? overstayMinutes : null,
      overstay_amount: overstayAmount > 0 ? overstayAmount : null,
      updated_at: new Date().toISOString(),
    };
    this.bookings.set(bookingId, updated);

    this.recordAuditLog({
      operator_email: 'customer',
      action: 'DRIVER_SELF_CHECK_OUT',
      category: 'booking',
      target_id: bookingId,
      target_name: b.booking_reference,
      details: `Driver confirmed departure. Slot ${b.space?.identifier} released back to inventory.${overstayMinutes > 0 ? ` Overstay: ${overstayMinutes}m (Extra: ₹${overstayAmount})` : ''}`,
    });

    return { success: true, booking: updated, overstayMinutes, overstayAmount };
  }

  public forceCompleteBooking(bookingId: string, reason?: string, operatorEmail = 'admin@parkbnb.in'): Booking | null {
    const b = this.bookings.get(bookingId);
    if (!b) return null;

    const updated = this.updateBookingStatus(bookingId, 'completed', reason || 'Manually completed by Admin operator');
    this.recordAuditLog({
      operator_email: operatorEmail,
      action: 'BOOKING_FORCE_COMPLETED',
      category: 'booking',
      target_id: bookingId,
      target_name: b.booking_reference,
      details: reason || 'Operator triggered manual clearance and spot release.',
    });
    return updated;
  }

  public adminCancelAndRefund(bookingId: string, reason: string, operatorEmail = 'admin@parkbnb.in'): Booking | null {
    const b = this.bookings.get(bookingId);
    if (!b) return null;

    const updated = this.updateBookingStatus(bookingId, 'cancelled_by_admin', reason);

    this.recordLedgerEntry({
      booking_id: b.id,
      entry_type: 'REFUND_CUSTOMER',
      debit_account: 'PLATFORM_UNEARNED',
      credit_account: 'GATEWAY_ESCROW:RAZORPAY',
      amount: b.total_amount,
      currency: 'INR',
      description: `Admin cancel and full refund for ${b.booking_reference}: ${reason}`,
      reference_id: `REF-${b.booking_reference}`,
    });

    this.recordAuditLog({
      operator_email: operatorEmail,
      action: 'BOOKING_CANCELLED_REFUNDED',
      category: 'booking',
      target_id: bookingId,
      target_name: b.booking_reference,
      details: `Issued 100% full refund of ₹${b.total_amount.toFixed(2)}. Reason: ${reason}`,
    });

    return updated;
  }

  public extendBooking(bookingId: string, additionalHours: number): Booking | null {
    const existing = this.bookings.get(bookingId);
    if (!existing) return null;

    const currentEnd = new Date(existing.end_time).getTime();
    const newEnd = new Date(currentEnd + additionalHours * 3600 * 1000).toISOString();

    const space = this.spaces.get(existing.space_id);
    const hourlyRate = space?.hourly_rate || 50;
    const additionalAmount = hourlyRate * additionalHours;
    const additionalFee = Math.round(additionalAmount * 0.1);
    const additionalGst = Math.round((additionalAmount + additionalFee) * 0.18);
    const totalAdditional = additionalAmount + additionalFee + additionalGst;
    const providerAdditional = Math.round(additionalAmount * 0.85);

    const updated: Booking = {
      ...existing,
      end_time: newEnd,
      total_amount: existing.total_amount + totalAdditional,
      provider_payout_amount: existing.provider_payout_amount + providerAdditional,
      updated_at: new Date().toISOString(),
    };

    this.bookings.set(bookingId, updated);
    return updated;
  }

  // =============================================================
  // FINANCIAL LEDGER
  // =============================================================
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

  // =============================================================
  // REVIEWS & TICKETS
  // =============================================================
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

  // =============================================================
  // PLATFORM SETTINGS & AUDIT TRAIL
  // =============================================================
  public getListingTitleOptions(): string[] {
    return this.settings.listingTitleOptions && this.settings.listingTitleOptions.length > 0
      ? [...this.settings.listingTitleOptions]
      : [
          'Covered Basement Parking Bay',
          'Prime Surface Parking Slot with Security',
          'Residential Gated Stilt Parking',
          'Covered Parking Bay with EV Charging Socket',
          'Commercial Multi-Level Parking Slot',
          'Secure Overnight Parking Bay',
          'Private Driveway Parking Space',
          'Open-Air Visitor Parking Bay',
        ];
  }

  public addListingTitleOption(title: string, operatorEmail = 'admin@parkbnb.in'): string[] {
    const trimmed = title.trim();
    if (!trimmed) return this.getListingTitleOptions();
    if (!this.settings.listingTitleOptions) {
      this.settings.listingTitleOptions = this.getListingTitleOptions();
    }
    if (!this.settings.listingTitleOptions.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      this.settings.listingTitleOptions.push(trimmed);
      this.recordAuditLog({
        operator_email: operatorEmail,
        action: 'LISTING_TITLE_OPTION_ADDED',
        category: 'settings',
        details: `Added listing title option: "${trimmed}"`,
      });
    }
    return [...this.settings.listingTitleOptions];
  }

  public updateListingTitleOption(oldTitle: string, newTitle: string, operatorEmail = 'admin@parkbnb.in'): string[] {
    const trimmedOld = oldTitle.trim();
    const trimmedNew = newTitle.trim();
    if (!trimmedNew) return this.getListingTitleOptions();
    if (!this.settings.listingTitleOptions) {
      this.settings.listingTitleOptions = this.getListingTitleOptions();
    }
    const idx = this.settings.listingTitleOptions.findIndex(t => t.toLowerCase() === trimmedOld.toLowerCase());
    if (idx !== -1) {
      this.settings.listingTitleOptions[idx] = trimmedNew;
      this.recordAuditLog({
        operator_email: operatorEmail,
        action: 'LISTING_TITLE_OPTION_UPDATED',
        category: 'settings',
        details: `Updated listing title option from "${trimmedOld}" to "${trimmedNew}"`,
      });
    }
    return [...this.settings.listingTitleOptions];
  }

  public removeListingTitleOption(title: string, operatorEmail = 'admin@parkbnb.in'): string[] {
    const trimmed = title.trim();
    if (!this.settings.listingTitleOptions) {
      this.settings.listingTitleOptions = this.getListingTitleOptions();
    }
    if (this.settings.listingTitleOptions.length > 1) {
      this.settings.listingTitleOptions = this.settings.listingTitleOptions.filter(
        t => t.toLowerCase() !== trimmed.toLowerCase()
      );
      this.recordAuditLog({
        operator_email: operatorEmail,
        action: 'LISTING_TITLE_OPTION_REMOVED',
        category: 'settings',
        details: `Removed listing title option: "${trimmed}"`,
      });
    }
    return [...this.settings.listingTitleOptions];
  }

  public updateProviderPayoutDetails(providerId: string, details: Partial<ProviderProfile>): ProviderProfile | undefined {
    const existing = this.providerProfiles.get(providerId);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      ...details,
      updated_at: new Date().toISOString(),
    };
    this.providerProfiles.set(providerId, updated);
    return updated;
  }

  public getPlatformSettings(): PlatformSettings {
    return { ...this.settings };
  }

  public updatePlatformSettings(newSettings: Partial<PlatformSettings>, operatorEmail = 'admin@parkbnb.in'): PlatformSettings {
    this.settings = { ...this.settings, ...newSettings };
    this.recordAuditLog({
      operator_email: operatorEmail,
      action: 'PLATFORM_SETTINGS_UPDATED',
      category: 'settings',
      details: `Updated platform configuration: ${JSON.stringify(newSettings)}`,
    });
    return { ...this.settings };
  }

  public recordAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const record: AuditLogEntry = {
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(record);
    return record;
  }

  public getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }

  // =============================================================
  // REAL OPERATIONAL METRICS (WITH DATE RANGE SUPPORT)
  // =============================================================
  public getAdminMetrics(options?: { startDate?: string; endDate?: string }) {
    let filteredBookings = Array.from(this.bookings.values());

    if (options?.startDate) {
      const startMs = new Date(options.startDate).getTime();
      filteredBookings = filteredBookings.filter(b => new Date(b.created_at).getTime() >= startMs);
    }
    if (options?.endDate) {
      const endMs = new Date(options.endDate).getTime();
      filteredBookings = filteredBookings.filter(b => new Date(b.created_at).getTime() <= endMs);
    }

    const totalCustomers = Array.from(this.profiles.values()).filter(p => p.role === 'customer').length;
    const activeCustomers = Array.from(this.profiles.values()).filter(p => p.role === 'customer' && p.status === 'active').length;
    const suspendedCustomers = Array.from(this.profiles.values()).filter(p => p.role === 'customer' && p.status === 'suspended').length;

    const totalProviders = Array.from(this.providerProfiles.values()).length;
    const verifiedOwners = Array.from(this.providerProfiles.values()).filter(p => p.verification_status === 'approved').length;
    const pendingOwnerVerification = Array.from(this.providerProfiles.values()).filter(p => p.verification_status === 'submitted' || p.verification_status === 'under_review').length;
    const rejectedOwners = Array.from(this.providerProfiles.values()).filter(p => p.verification_status === 'rejected').length;

    const allSpaces = Array.from(this.spaces.values());
    const totalListings = allSpaces.length;
    const activeListings = allSpaces.filter(s => s.status === 'approved' && s.is_active).length;
    const pendingListings = allSpaces.filter(s => s.status === 'submitted' || s.status === 'under_review').length;
    const rejectedListings = allSpaces.filter(s => s.status === 'rejected').length;

    const upcomingBookings = filteredBookings.filter(b => b.status === 'confirmed').length;
    const activeBookings = filteredBookings.filter(b => b.status === 'active').length;
    const completedBookings = filteredBookings.filter(b => b.status === 'completed').length;
    const cancelledBookings = filteredBookings.filter(b => b.status.includes('cancelled')).length;

    const eligibleRevenueBookings = filteredBookings.filter(b => b.status === 'completed' || b.status === 'confirmed' || b.status === 'active');
    const paymentTotals = eligibleRevenueBookings.reduce((sum, b) => sum + b.total_amount, 0);
    const platformRevenue = eligibleRevenueBookings.reduce((sum, b) => sum + (b.platform_fee + b.tax_amount), 0);
    const ownerPayableBalance = eligibleRevenueBookings.reduce((sum, b) => sum + b.provider_payout_amount, 0);

    const openDisputes = this.tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const refundRequests = filteredBookings.filter(b => b.status === 'disputed' || b.status === 'cancelled_by_admin').length;

    let pendingHostPayouts = 0;
    for (const p of this.providerProfiles.values()) {
      const accountTag = `PROVIDER_ESCROW:${p.id}`;
      const credits = this.ledger.filter(e => e.credit_account === accountTag).reduce((sum, e) => sum + e.amount, 0);
      const debits = this.ledger.filter(e => e.debit_account === accountTag).reduce((sum, e) => sum + e.amount, 0);
      pendingHostPayouts += Math.max(0, credits - debits);
    }

    return {
      totalCustomers,
      activeCustomers,
      suspendedCustomers,
      totalProviders,
      totalParkingOwners: totalProviders,
      verifiedOwners,
      pendingOwnerVerification,
      pendingVerifications: pendingOwnerVerification + pendingListings,
      rejectedOwners,
      totalListings,
      activeListings,
      pendingListings,
      rejectedListings,
      availableParkingSpaces: activeListings,
      totalBookings: filteredBookings.length,
      upcomingBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      confirmedBookings: upcomingBookings + completedBookings,
      gmv: Math.round(paymentTotals * 100) / 100,
      paymentTotals: Math.round(paymentTotals * 100) / 100,
      platformRevenue: Math.round(platformRevenue * 100) / 100,
      ownerPayableBalance: Math.round(ownerPayableBalance * 100) / 100,
      pendingPayouts: Math.round(pendingHostPayouts * 100) / 100,
      pendingHostPayouts: Math.round(pendingHostPayouts * 100) / 100,
      refundRequests,
      supportTickets: this.tickets.length,
      openDisputes,
      maintenanceMode: this.settings.emergencyMaintenanceMode,
    };
  }
}

// Global Singleton for Node.js Lifecycle
const globalForMarketplace = globalThis as unknown as { marketplaceStore?: MarketplaceStore };
export const getLocalStore = () => {
  if (!globalForMarketplace.marketplaceStore) {
    globalForMarketplace.marketplaceStore = new MarketplaceStore();
  }
  return globalForMarketplace.marketplaceStore;
};
