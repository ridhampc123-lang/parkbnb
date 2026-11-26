import { INDIAN_CITIES } from '@/lib/constants/cities';

export interface PincodeResolution {
  valid: boolean;
  pincode: string;
  city: string;
  state: string;
  district: string;
  localities: string[];
  latitude: number;
  longitude: number;
  source: 'india_post_api' | 'offline_directory';
}

/**
 * Built-in directory of major Indian postal hubs and PIN codes.
 * Provides instant, zero-latency offline fallback if the public API is slow or offline.
 */
interface OfflinePincodeData {
  city: string;
  state: string;
  district: string;
  localities: string[];
  lat: number;
  lng: number;
}

const OFFLINE_PINCODE_DB: Record<string, OfflinePincodeData> = {
  // Ahmedabad (Gujarat)
  '380001': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', localities: ['Khadia', 'Kalupur', 'Astodia', 'Bhadra'], lat: 23.0258, lng: 72.5873 },
  '380006': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', localities: ['Ellis Bridge', 'Pritam Nagar', 'V.S. Hospital Area'], lat: 23.0185, lng: 72.5714 },
  '380007': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', localities: ['Paldi', 'Fatehgunj', 'Sharda Mandir Road'], lat: 23.0125, lng: 72.5623 },
  '380008': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', localities: ['Maninagar', 'Kankaria Lake', 'Bhairavnath Road'], lat: 22.9978, lng: 72.6022 },
  '380009': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', localities: ['Navrangpura', 'C.G. Road', 'Commerce Six Roads', 'Mithakhali'], lat: 23.0365, lng: 72.5612 },
  '380013': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', localities: ['Naranpura', 'Shastrinagar', 'Ankur Char Rasta'], lat: 23.0542, lng: 72.5518 },
  '380015': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', localities: ['Bodakdev', 'Satellite', 'Vastrapur', 'Prahladnagar', 'SG Highway', 'ISCON'], lat: 23.0338, lng: 72.5150 },
  '380051': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', localities: ['Makarba', 'Prahladnagar Ext', 'Vejalpur', 'Corporate Road'], lat: 22.9984, lng: 72.5029 },
  '380054': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', localities: ['Thaltej', 'Drive In Road', 'Heebatpur Road', 'Sterling City'], lat: 23.0504, lng: 72.5085 },
  '380058': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', localities: ['Bopal', 'South Bopal (SoBo)', 'Ghuma Road'], lat: 23.0330, lng: 72.4630 },
  '380059': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', localities: ['Sindhu Bhavan Road (SBR)', 'Science City Road', 'Sola'], lat: 23.0722, lng: 72.5135 },
  '380060': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', localities: ['Sarkhej', 'SG Highway South', 'Ujala Circle'], lat: 22.9815, lng: 72.5012 },
  '380061': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', localities: ['Gota', 'New SG Road', 'Vandemataram', 'Chandlodiya'], lat: 23.0970, lng: 72.5360 },

  // Mumbai & MMR (Maharashtra)
  '400001': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', localities: ['Fort', 'Colaba', 'CSMT Station Area', 'Ballard Estate'], lat: 18.9340, lng: 72.8360 },
  '400021': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', localities: ['Nariman Point', 'Marine Drive', 'Backbay Reclamation'], lat: 18.9256, lng: 72.8242 },
  '400013': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', localities: ['Lower Parel', 'Delisle Road', 'Currey Road', 'Kamala Mills'], lat: 18.9950, lng: 72.8300 },
  '400050': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai Suburban', localities: ['Bandra West', 'Hill Road', 'Linking Road', 'Pali Hill'], lat: 19.0544, lng: 72.8402 },
  '400051': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai Suburban', localities: ['Bandra Kurla Complex (BKC)', 'Kalanagar', 'Bandra East'], lat: 19.0657, lng: 72.8687 },
  '400069': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai Suburban', localities: ['Andheri East', 'Chakala', 'Sahar Airport Road'], lat: 19.1170, lng: 72.8630 },
  '400076': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai Suburban', localities: ['Powai', 'Hiranandani Gardens', 'IIT Bombay Area'], lat: 19.1197, lng: 72.9051 },
  '400092': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai Suburban', localities: ['Borivali West', 'Gorai', 'Shimpoli'], lat: 19.2307, lng: 72.8567 },
  '400703': { city: 'Navi Mumbai', state: 'Maharashtra', district: 'Thane', localities: ['Vashi', 'Sector 17 Vashi', 'Vashi Railway Station Area'], lat: 19.0771, lng: 72.9986 },
  '400601': { city: 'Thane', state: 'Maharashtra', district: 'Thane', localities: ['Thane West', 'Naupada', 'Gokhale Road'], lat: 19.1970, lng: 72.9720 },

  // Delhi NCR
  '110001': { city: 'New Delhi', state: 'Delhi', district: 'Central Delhi', localities: ['Connaught Place', 'Barakhamba Road', 'Janpath', 'Bengali Market'], lat: 28.6315, lng: 77.2167 },
  '110019': { city: 'New Delhi', state: 'Delhi', district: 'South Delhi', localities: ['Nehru Place', 'Kalkaji', 'Chittaranjan Park'], lat: 28.5494, lng: 77.2530 },
  '110017': { city: 'New Delhi', state: 'Delhi', district: 'South Delhi', localities: ['Saket', 'Malviya Nagar', 'Select Citywalk Area'], lat: 28.5244, lng: 77.2167 },
  '110037': { city: 'New Delhi', state: 'Delhi', district: 'South West Delhi', localities: ['Aerocity', 'Mahipalpur', 'IGI Airport T3 Area'], lat: 28.5535, lng: 77.1215 },
  '110075': { city: 'New Delhi', state: 'Delhi', district: 'South West Delhi', localities: ['Dwarka Sector 21', 'Dwarka Sector 10', 'Dwarka Sector 6'], lat: 28.5823, lng: 77.0500 },
  '122002': { city: 'Gurgaon', state: 'Haryana', district: 'Gurgaon', localities: ['DLF Phase 2', 'DLF Cyber City', 'MG Road Gurgaon'], lat: 28.4817, lng: 77.0867 },
  '122009': { city: 'Gurgaon', state: 'Haryana', district: 'Gurgaon', localities: ['Golf Course Road', 'DLF Phase 5', 'Sector 42/43'], lat: 28.4595, lng: 77.0984 },
  '201301': { city: 'Noida', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', localities: ['Noida Sector 18', 'Sector 15', 'Atta Market'], lat: 28.5708, lng: 77.3271 },
  '201309': { city: 'Noida', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', localities: ['Noida Sector 62', 'Sector 63 IT Hub', 'Electronic City'], lat: 28.6280, lng: 77.3649 },

  // Bengaluru (Karnataka)
  '560001': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban', localities: ['MG Road', 'Brigade Road', 'Cubbon Park', 'Shivajinagar'], lat: 12.9766, lng: 77.6015 },
  '560034': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban', localities: ['Koramangala 3rd/4th Block', 'Madiwala', 'St. Johns'], lat: 12.9279, lng: 77.6271 },
  '560038': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban', localities: ['Indiranagar 100ft Road', 'HAL 2nd Stage', 'Defence Colony'], lat: 12.9784, lng: 77.6408 },
  '560066': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban', localities: ['Whitefield', 'ITPB Area', 'Kadugodi', 'Hope Farm'], lat: 12.9698, lng: 77.7500 },
  '560100': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban', localities: ['Electronic City Phase 1', 'Wipro Gate', 'Hosur Road'], lat: 12.8452, lng: 77.6602 },
  '560102': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban', localities: ['HSR Layout Sector 1/2/3', 'Agara', '27th Main'], lat: 12.9121, lng: 77.6446 },
  '560103': { city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban', localities: ['Bellandur', 'Outer Ring Road (ORR)', 'EcoSpace Tech Park'], lat: 12.9260, lng: 77.6762 },

  // Pune (Maharashtra)
  '411057': { city: 'Pune', state: 'Maharashtra', district: 'Pune', localities: ['Hinjewadi Phase 1', 'Hinjewadi Phase 2', 'Maan', 'Wakad'], lat: 18.5913, lng: 73.7389 },
  '411014': { city: 'Pune', state: 'Maharashtra', district: 'Pune', localities: ['Viman Nagar', 'Phoenix Marketcity Area', 'Symbiosis Road'], lat: 18.5679, lng: 73.9143 },
  '411045': { city: 'Pune', state: 'Maharashtra', district: 'Pune', localities: ['Baner', 'Balewadi High Street', 'Pashan'], lat: 18.5590, lng: 73.7868 },
  '411038': { city: 'Pune', state: 'Maharashtra', district: 'Pune', localities: ['Kothrud', 'Paud Road', 'Karve Road'], lat: 18.5074, lng: 73.8077 },

  // Hyderabad (Telangana)
  '500081': { city: 'Hyderabad', state: 'Telangana', district: 'Hyderabad', localities: ['Hitec City', 'Cyber Towers', 'Madhapur', 'Mindspace IT Park'], lat: 17.4474, lng: 78.3762 },
  '500032': { city: 'Hyderabad', state: 'Telangana', district: 'Hyderabad', localities: ['Gachibowli', 'Financial District', 'ISB Road'], lat: 17.4401, lng: 78.3489 },
  '500033': { city: 'Hyderabad', state: 'Telangana', district: 'Hyderabad', localities: ['Jubilee Hills Road 36', 'Road 10', 'Check Post'], lat: 17.4319, lng: 78.4073 },

  // Chennai (Tamil Nadu)
  '600017': { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai', localities: ['T. Nagar', 'Pondy Bazaar', 'Panagal Park', 'Usman Road'], lat: 13.0418, lng: 80.2341 },
  '600096': { city: 'Chennai', state: 'Tamil Nadu', district: 'Kanchipuram', localities: ['OMR (Old Mahabalipuram Road)', 'Perungudi', 'Thoraipakkam'], lat: 12.9550, lng: 80.2450 },

  // Kolkata (West Bengal)
  '700016': { city: 'Kolkata', state: 'West Bengal', district: 'Kolkata', localities: ['Park Street', 'Camac Street', 'Russell Street'], lat: 22.5510, lng: 88.3530 },
  '700091': { city: 'Kolkata', state: 'West Bengal', district: 'North 24 Parganas', localities: ['Salt Lake Sector V', 'Karunamoyee', 'College More'], lat: 22.5780, lng: 88.4310 },
  '700156': { city: 'Kolkata', state: 'West Bengal', district: 'North 24 Parganas', localities: ['New Town Action Area 1', 'City Centre 2', 'Eco Park Area'], lat: 22.5930, lng: 88.4720 },
};

/**
 * Regional postal circle approximations for all Indian postal prefixes (11 to 85)
 */
const REGIONAL_PREFIX_MAP: Record<string, { city: string; state: string; lat: number; lng: number }> = {
  '11': { city: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  '12': { city: 'Gurgaon / Faridabad', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  '13': { city: 'Ambala / Panipat', state: 'Haryana', lat: 30.3782, lng: 76.7767 },
  '14': { city: 'Jalandhar / Ludhiana', state: 'Punjab', lat: 30.9010, lng: 75.8573 },
  '16': { city: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  '20': { city: 'Noida / Ghaziabad', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910 },
  '22': { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  '30': { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  '36': { city: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022 },
  '38': { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  '39': { city: 'Surat / Vadodara', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  '40': { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  '41': { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  '45': { city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  '46': { city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  '50': { city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  '52': { city: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480 },
  '56': { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  '60': { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  '68': { city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  '70': { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  '75': { city: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  '80': { city: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
};

/**
 * Validates 6-digit Indian Postal PIN Code format
 */
export function isValidPincode(pincode: string): boolean {
  if (!pincode) return false;
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

/**
 * Resolves Indian PIN code to City, State, District, Localities, and GPS Coordinates.
 * Features:
 * 1. Queries the official India Post open database (`api.postalpincode.in`).
 * 2. Automatic fallback to built-in offline dictionary (0ms latency, zero third-party dependencies).
 * 3. Never requires Google Maps API key or paid subscriptions.
 */
export async function resolvePincode(pincode: string): Promise<PincodeResolution> {
  const cleanPin = pincode?.trim() || '';

  if (!isValidPincode(cleanPin)) {
    return {
      valid: false,
      pincode: cleanPin,
      city: '',
      state: '',
      district: '',
      localities: [],
      latitude: 23.0225,
      longitude: 72.5714,
      source: 'offline_directory',
    };
  }

  // Check exact offline database first for instant cache hit
  const exactMatch = OFFLINE_PINCODE_DB[cleanPin];

  // Attempt live India Post open API with 2.5s timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: controller.signal,
      cache: 'force-cache',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice)) {
        const postOffices = data[0].PostOffice;
        const first = postOffices[0];

        const district = first.District || first.Circle || 'District';
        const state = first.State || 'India';
        const rawLocalities: string[] = postOffices
          .map((po: { Name?: string }) => po.Name || '')
          .filter((name: string) => Boolean(name) && !name.toLowerCase().includes('b.o') && !name.toLowerCase().includes('s.o'));

        const fallbackLocalities: string[] = postOffices.map((po: { Name?: string }) => po.Name || '').filter(Boolean);
        const baseLocalities: string[] = rawLocalities.length > 0 ? rawLocalities : fallbackLocalities;
        const uniqueLocalities: string[] = Array.from(new Set<string>(baseLocalities));

        // Match district or city name against INDIAN_CITIES for accurate regional coordinates
        const matchedCity = INDIAN_CITIES.find(
          c => c.name.toLowerCase() === district.toLowerCase() ||
               c.name.toLowerCase().includes(district.toLowerCase()) ||
               district.toLowerCase().includes(c.name.toLowerCase())
        );

        const lat = exactMatch?.lat || matchedCity?.lat || 23.0225;
        const lng = exactMatch?.lng || matchedCity?.lng || 72.5714;

        const mergedLocalities: string[] = exactMatch?.localities
          ? Array.from(new Set<string>([...exactMatch.localities, ...uniqueLocalities]))
          : uniqueLocalities;

        return {
          valid: true,
          pincode: cleanPin,
          city: district,
          state,
          district,
          localities: mergedLocalities,
          latitude: lat,
          longitude: lng,
          source: 'india_post_api',
        };
      }
    }
  } catch {
    // Graceful fallback to offline dictionary on timeout or network error
  }

  // Exact offline match fallback
  if (exactMatch) {
    return {
      valid: true,
      pincode: cleanPin,
      city: exactMatch.city,
      state: exactMatch.state,
      district: exactMatch.district,
      localities: exactMatch.localities,
      latitude: exactMatch.lat,
      longitude: exactMatch.lng,
      source: 'offline_directory',
    };
  }

  // Prefix fallback (e.g. '38' -> Ahmedabad/Gujarat, '40' -> Mumbai)
  const prefix2 = cleanPin.substring(0, 2);
  const regional = REGIONAL_PREFIX_MAP[prefix2];

  if (regional) {
    return {
      valid: true,
      pincode: cleanPin,
      city: regional.city,
      state: regional.state,
      district: regional.city,
      localities: [`PIN ${cleanPin} Sector / Area`],
      latitude: regional.lat,
      longitude: regional.lng,
      source: 'offline_directory',
    };
  }

  // Safe universal fallback
  return {
    valid: true,
    pincode: cleanPin,
    city: 'India',
    state: 'India',
    district: 'India',
    localities: [`Area (${cleanPin})`],
    latitude: 23.0225,
    longitude: 72.5714,
    source: 'offline_directory',
  };
}

/**
 * Validates and extracts coordinates from owner's pasted Google Maps link.
 * Supports:
 * - maps.app.goo.gl/...
 * - goo.gl/maps/...
 * - google.com/maps/@lat,lng,zoom
 * - google.com/maps?q=lat,lng
 * - maps.google.com/?q=...
 */
export function parseGoogleMapsUrl(url: string): {
  isValid: boolean;
  latitude?: number;
  longitude?: number;
  cleanUrl?: string;
  errorMessage?: string;
} {
  if (!url || typeof url !== 'string') {
    return { isValid: false, errorMessage: 'Empty URL provided.' };
  }

  const trimmed = url.trim();

  // Basic web URL protocol check
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { isValid: false, errorMessage: 'Google Maps link must start with https://' };
  }

  // Must be from Google Maps domains
  const isGoogleMaps =
    trimmed.includes('google.com/maps') ||
    trimmed.includes('maps.google.com') ||
    trimmed.includes('maps.app.goo.gl') ||
    trimmed.includes('goo.gl/maps');

  if (!isGoogleMaps) {
    return {
      isValid: false,
      errorMessage: 'Please provide a valid Google Maps link (e.g. https://maps.app.goo.gl/... or https://goo.gl/maps/...).',
    };
  }

  let latitude: number | undefined;
  let longitude: number | undefined;

  // Extract from @lat,lng (e.g. /@23.0338,72.5150,17z)
  const atMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    latitude = parseFloat(atMatch[1]);
    longitude = parseFloat(atMatch[2]);
  }

  // Extract from q=lat,lng (e.g. ?q=23.0338,72.5150)
  if (!latitude || !longitude) {
    const qMatch = trimmed.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      latitude = parseFloat(qMatch[1]);
      longitude = parseFloat(qMatch[2]);
    }
  }

  // Extract from ll=lat,lng (e.g. ?ll=23.0338,72.5150)
  if (!latitude || !longitude) {
    const llMatch = trimmed.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (llMatch) {
      latitude = parseFloat(llMatch[1]);
      longitude = parseFloat(llMatch[2]);
    }
  }

  return {
    isValid: true,
    latitude,
    longitude,
    cleanUrl: trimmed,
  };
}

/**
 * Builds a direct 1-tap Google Maps navigation link for drivers.
 * Uses the owner's exact link if valid, or synthesizes a search query using address + landmark + city.
 */
export function generateGoogleMapsDirectionUrl(params: {
  address?: string;
  landmark?: string | null;
  area?: string;
  city?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  customUrl?: string | null;
}): string {
  // If owner provided a verified Google Maps link, use it directly
  if (params.customUrl) {
    const parsed = parseGoogleMapsUrl(params.customUrl);
    if (parsed.isValid && parsed.cleanUrl) {
      return parsed.cleanUrl;
    }
  }

  // If coordinates are available, generate exact navigation coordinates pin
  if (params.latitude && params.longitude && params.latitude > 8 && params.latitude < 38) {
    return `https://www.google.com/maps/search/?api=1&query=${params.latitude},${params.longitude}`;
  }

  // Synthesize rich landmark and address search query
  const queryParts = [
    params.address,
    params.landmark ? `Near ${params.landmark}` : null,
    params.area,
    params.city,
    params.postal_code,
    'India',
  ].filter(Boolean);

  const query = queryParts.join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
