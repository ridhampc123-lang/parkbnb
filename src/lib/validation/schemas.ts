import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const upiRegex = /^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/;
export const bankAccountRegex = /^\d{9,18}$/;

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name is required (min 2 characters)'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number').optional().or(z.literal('')),
  role: z.enum(['customer', 'provider']).default('customer'),
  bank_name: z.string().max(100).optional().or(z.literal('')),
  bank_account_holder: z.string().max(100).optional().or(z.literal('')),
  bank_account_number: z.string().optional().or(z.literal('')),
  confirm_account_number: z.string().optional().or(z.literal('')),
  bank_ifsc_code: z.string().optional().or(z.literal('')),
  upi_id: z.string().optional().or(z.literal('')),
  payout_preference: z.enum(['bank_transfer', 'upi']).optional(),
}).refine(data => {
  if (data.bank_account_number && data.confirm_account_number) {
    return data.bank_account_number === data.confirm_account_number;
  }
  return true;
}, {
  message: 'Bank account number and confirmation do not match',
  path: ['confirm_account_number'],
});

export const providerPayoutSchema = z.object({
  bank_name: z.string().max(100).optional().or(z.literal('')),
  bank_account_holder: z.string().min(2, 'Account holder name must be at least 2 characters').max(100).optional().or(z.literal('')),
  bank_account_number: z.string().regex(bankAccountRegex, 'Bank account number must be 9-18 digits').optional().or(z.literal('')),
  confirm_account_number: z.string().optional().or(z.literal('')),
  bank_ifsc_code: z.string().regex(ifscRegex, 'Invalid 11-digit IFSC code format (e.g. SBIN0001234)').optional().or(z.literal('')),
  upi_id: z.string().regex(upiRegex, 'Invalid UPI ID format (e.g. username@okhdfcbank)').optional().or(z.literal('')),
  payout_preference: z.enum(['bank_transfer', 'upi']).default('bank_transfer'),
}).refine(data => {
  if (data.bank_account_number && data.confirm_account_number) {
    return data.bank_account_number === data.confirm_account_number;
  }
  return true;
}, {
  message: 'Bank account number and confirmation do not match',
  path: ['confirm_account_number'],
});

export const vehicleSchema = z.object({
  vehicle_type: z.enum(['car_sedan', 'car_suv', 'car_hatchback', 'two_wheeler', 'ev_four_wheeler', 'ev_two_wheeler']),
  registration_number: z.string().min(4, 'Registration number is required').max(20).toUpperCase(),
  make_model: z.string().max(50).optional(),
  color: z.string().max(30).optional(),
  is_default: z.boolean().default(false),
});

export const spaceSchema = z.object({
  title: z.string().min(3, 'Title is required').default('Covered Reserved Parking Bay'),
  property_title: z.string().min(3, 'Property or Building name is required'),
  property_type: z.enum(['apartment_complex', 'independent_house', 'commercial_lot', 'open_plot']),
  city: z.string().min(2, 'City is required').default('Ahmedabad'),
  area: z.string().min(2, 'Area / Locality / Neighbourhood is required'),
  address_line1: z.string().min(5, 'Address is required'),
  postal_code: z.string().regex(/^\d{6}$/, 'Please enter a valid 6-digit postal code'),
  latitude: z.number().min(8.0, 'Valid Indian latitude required (8.0 to 37.5)').max(37.5),
  longitude: z.number().min(68.0, 'Valid Indian longitude required (68.0 to 97.5)').max(97.5),
  identifier: z.string().min(1, 'Spot identifier is required (e.g. Slot B-14)'),
  parking_type: z.enum(['covered', 'open', 'basement', 'multi_level']),
  hourly_rate: z.number().positive('Hourly rate must be greater than zero'),
  daily_rate: z.number().positive().optional(),
  monthly_rate: z.number().positive().optional(),
  has_ev_charging: z.boolean().default(false),
  height_limit_meters: z.number().positive().optional(),
  access_instructions: z.string().min(5, 'Access instructions are required for confirmed parkers'),
  security_features: z.array(z.string()).default([]),
  vehicle_types: z.array(z.enum(['car_sedan', 'car_suv', 'car_hatchback', 'two_wheeler', 'ev_four_wheeler', 'ev_two_wheeler'])).min(1, 'Select at least one vehicle type'),
});

export const searchSchema = z.object({
  city: z.string().optional(),
  destination: z.string().optional(),
  start_date: z.string().optional(),
  start_time: z.string().optional(),
  end_date: z.string().optional(),
  end_time: z.string().optional(),
  vehicle_type: z.enum(['car_sedan', 'car_suv', 'car_hatchback', 'two_wheeler', 'ev_four_wheeler', 'ev_two_wheeler']).optional(),
});
