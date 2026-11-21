import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name is required (min 2 characters)'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number').optional().or(z.literal('')),
  role: z.enum(['customer', 'provider']).default('customer'),
});

export const vehicleSchema = z.object({
  vehicle_type: z.enum(['car_sedan', 'car_suv', 'car_hatchback', 'two_wheeler', 'ev_four_wheeler', 'ev_two_wheeler']),
  registration_number: z.string().min(4, 'Registration number is required').max(20).toUpperCase(),
  make_model: z.string().max(50).optional(),
  color: z.string().max(30).optional(),
  is_default: z.boolean().default(false),
});

export const spaceSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  property_title: z.string().min(3, 'Property or Building name is required'),
  property_type: z.enum(['apartment_complex', 'independent_house', 'commercial_lot', 'open_plot']),
  area: z.string().min(2, 'Ahmedabad Area / Neighbourhood is required'),
  address_line1: z.string().min(5, 'Address is required'),
  postal_code: z.string().regex(/^\d{6}$/, 'Please enter a valid 6-digit postal code'),
  latitude: z.number().min(20).max(25),
  longitude: z.number().min(70).max(75),
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
  destination: z.string().optional(),
  start_date: z.string().optional(),
  start_time: z.string().optional(),
  end_date: z.string().optional(),
  end_time: z.string().optional(),
  vehicle_type: z.enum(['car_sedan', 'car_suv', 'car_hatchback', 'two_wheeler', 'ev_four_wheeler', 'ev_two_wheeler']).optional(),
});
