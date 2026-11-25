export interface IndianCity {
  id: string;
  name: string;
  state: string;
  tier: 1 | 2;
  lat: number;
  lng: number;
  popularAreas: string[];
  majorHubs: {
    name: string;
    type: 'airport' | 'railway' | 'it_park' | 'commercial' | 'mall';
    area: string;
  }[];
}

export const INDIAN_CITIES: IndianCity[] = [
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    tier: 1,
    lat: 19.0760,
    lng: 72.8777,
    popularAreas: [
      'Bandra Kurla Complex (BKC)',
      'Andheri East',
      'Lower Parel',
      'South Mumbai / Nariman Point',
      'Dadar',
      'Powai',
      'Bandra West',
      'Borivali West',
      'Vashi, Navi Mumbai',
      'Thane West',
    ],
    majorHubs: [
      { name: 'Chhatrapati Shivaji Maharaj International Airport (T2)', type: 'airport', area: 'Andheri East' },
      { name: 'BKC Financial District', type: 'commercial', area: 'Bandra Kurla Complex (BKC)' },
      { name: 'One World Center / Kamala Mills', type: 'commercial', area: 'Lower Parel' },
      { name: 'CSMT Central Railway Terminus', type: 'railway', area: 'Fort / CSMT' },
      { name: 'Hiranandani Business Park', type: 'it_park', area: 'Powai' },
    ],
  },
  {
    id: 'delhi-ncr',
    name: 'Delhi NCR',
    state: 'Delhi / Haryana / UP',
    tier: 1,
    lat: 28.6139,
    lng: 77.2090,
    popularAreas: [
      'Connaught Place',
      'Gurgaon Cyber City (DLF Phase 2/3)',
      'Noida Sector 18',
      'South Extension',
      'Aerocity',
      'Dwarka Sector 21',
      'Saket District Centre',
      'Nehru Place',
      'Noida Sector 62',
      'Gurgaon Sector 29',
    ],
    majorHubs: [
      { name: 'Indira Gandhi International Airport (T3)', type: 'airport', area: 'Aerocity / Palam' },
      { name: 'DLF Cyber City & Cyber Hub', type: 'it_park', area: 'Gurgaon Cyber City' },
      { name: 'Connaught Place Inner Circle', type: 'commercial', area: 'Connaught Place' },
      { name: 'New Delhi Railway Station (NDLS)', type: 'railway', area: 'Paharganj / Ajmeri Gate' },
      { name: 'Mall of India & Sector 18 Market', type: 'mall', area: 'Noida Sector 18' },
    ],
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    tier: 1,
    lat: 12.9716,
    lng: 77.5946,
    popularAreas: [
      'Koramangala',
      'Indiranagar',
      'Whitefield',
      'HSR Layout',
      'MG Road / Brigade Road',
      'Electronic City Phase 1',
      'Bellandur / Outer Ring Road',
      'Jayanagar',
      'Hebbal',
      'Marathahalli',
    ],
    majorHubs: [
      { name: 'Kempegowda International Airport (BLR)', type: 'airport', area: 'Devanahalli' },
      { name: 'Manyata Tech Park', type: 'it_park', area: 'Hebbal / Nagavara' },
      { name: 'International Tech Park (ITPB)', type: 'it_park', area: 'Whitefield' },
      { name: 'KSR Bengaluru City Railway Station', type: 'railway', area: 'Majestic' },
      { name: 'Prestige Tech Park / Embassy TechVillage', type: 'it_park', area: 'Outer Ring Road' },
    ],
  },
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    tier: 1,
    lat: 18.5204,
    lng: 73.8567,
    popularAreas: [
      'Hinjewadi IT Park',
      'Koregaon Park',
      'Viman Nagar',
      'Shivaji Nagar',
      'Baner',
      'Kothrud',
      'Magarpatta City',
      'Aundh',
      'Kalyani Nagar',
      'Wakad',
    ],
    majorHubs: [
      { name: 'Pune International Airport', type: 'airport', area: 'Lohegaon / Viman Nagar' },
      { name: 'Rajiv Gandhi Infotech Park', type: 'it_park', area: 'Hinjewadi' },
      { name: 'Pune Junction Railway Station', type: 'railway', area: 'Agarkar Nagar' },
      { name: 'Phoenix Marketcity', type: 'mall', area: 'Viman Nagar' },
      { name: 'Cybercity Magarpatta', type: 'it_park', area: 'Hadapsar' },
    ],
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    tier: 1,
    lat: 17.3850,
    lng: 78.4867,
    popularAreas: [
      'HITEC City / Cyberabad',
      'Gachibowli Financial District',
      'Banjara Hills',
      'Jubilee Hills',
      'Madhapur',
      'Kondapur',
      'Secunderabad',
      'Begumpet',
      'Kukatpally',
      'Ameerpet',
    ],
    majorHubs: [
      { name: 'Rajiv Gandhi International Airport (HYD)', type: 'airport', area: 'Shamshabad' },
      { name: 'Cyber Towers & Mindspace IT Park', type: 'it_park', area: 'HITEC City' },
      { name: 'Financial District & WaveRock', type: 'commercial', area: 'Gachibowli' },
      { name: 'Secunderabad Junction Station', type: 'railway', area: 'Secunderabad' },
      { name: 'Inorbit Mall Cyberabad', type: 'mall', area: 'Madhapur' },
    ],
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    tier: 1,
    lat: 13.0827,
    lng: 80.2707,
    popularAreas: [
      'T. Nagar Shopping District',
      'Old Mahabalipuram Road (OMR IT Corridor)',
      'Anna Nagar',
      'Guindy Industrial Estate',
      'Velachery',
      'Adyar',
      'Nungambakkam',
      'Mylapore',
      'Porur',
      'Thiruvanmiyur',
    ],
    majorHubs: [
      { name: 'Chennai International Airport (MAA)', type: 'airport', area: 'Meenambakkam' },
      { name: 'TIDEL Park & Ascendas IT Park', type: 'it_park', area: 'Taramani / OMR' },
      { name: 'Chennai Central Railway Station (MAS)', type: 'railway', area: 'Park Town' },
      { name: 'Express Avenue Mall', type: 'mall', area: 'Royapettah' },
      { name: 'Olympia Tech Park', type: 'it_park', area: 'Guindy' },
    ],
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    tier: 1,
    lat: 22.5726,
    lng: 88.3639,
    popularAreas: [
      'Park Street',
      'Salt Lake Sector V',
      'New Town Action Area 1/2',
      'Esplanade / BBD Bagh',
      'Ballygunge',
      'Alipore',
      'Gariahat',
      'Rajarhat',
      'Howrah Station Area',
      'Shyambazar',
    ],
    majorHubs: [
      { name: 'Netaji Subhash Chandra Bose International Airport (CCU)', type: 'airport', area: 'Dum Dum' },
      { name: 'Sector V IT Corridor', type: 'it_park', area: 'Salt Lake' },
      { name: 'EcoSpace Business Park', type: 'it_park', area: 'New Town' },
      { name: 'Howrah Railway Junction', type: 'railway', area: 'Howrah' },
      { name: 'South City Mall', type: 'mall', area: 'Prince Anwar Shah Road' },
    ],
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    tier: 1,
    lat: 23.0225,
    lng: 72.5714,
    popularAreas: [
      'SG Highway Corridor',
      'Prahlad Nagar',
      'Bodakdev',
      'Sindhu Bhavan Road (SBR)',
      'Navrangpura',
      'Ashram Road',
      'Vastrapur',
      'Maninagar',
      'Satellite',
      'Gota / Chandlodiya',
    ],
    majorHubs: [
      { name: 'Sardar Vallabhbhai Patel International Airport (AMD)', type: 'airport', area: 'Hansol' },
      { name: 'GIFT City Special Economic Zone', type: 'commercial', area: 'Gandhinagar / SG Highway' },
      { name: 'Ahmedabad Junction (Kalupur)', type: 'railway', area: 'Kalupur' },
      { name: 'Alpha One / Ahmedabad One Mall', type: 'mall', area: 'Vastrapur' },
      { name: 'Shivalik Shilp Commercial Hub', type: 'commercial', area: 'SG Highway' },
    ],
  },
  {
    id: 'surat',
    name: 'Surat',
    state: 'Gujarat',
    tier: 2,
    lat: 21.1702,
    lng: 72.8311,
    popularAreas: [
      'Vesu VIP Road',
      'Piplod',
      'Ring Road Textile Market',
      'Adajan',
      'Varachha Diamond District',
      'Dumas Road',
      'City Light',
      'Katargam',
    ],
    majorHubs: [
      { name: 'Surat International Airport (STV)', type: 'airport', area: 'Dumas Road' },
      { name: 'Surat Diamond Bourse (SDB)', type: 'commercial', area: 'DREAM City, Khajod' },
      { name: 'Surat Central Railway Station', type: 'railway', area: 'Railway Station Road' },
      { name: 'VR Surat Mall', type: 'mall', area: 'Dumas Road' },
    ],
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    tier: 2,
    lat: 26.9124,
    lng: 75.7873,
    popularAreas: [
      'C-Scheme',
      'Malviya Nagar',
      'Vaishali Nagar',
      'MI Road / Pink City',
      'Mansarovar',
      'Tonk Road',
      'Raja Park',
      'Jagatpura',
    ],
    majorHubs: [
      { name: 'Jaipur International Airport (JAI)', type: 'airport', area: 'Sanganer' },
      { name: 'Jaipur Junction Railway Station', type: 'railway', area: 'Hasanpura' },
      { name: 'World Trade Park (WTP)', type: 'mall', area: 'Malviya Nagar' },
      { name: 'Sitapura Industrial & IT Area', type: 'it_park', area: 'Sitapura' },
    ],
  },
  {
    id: 'chandigarh',
    name: 'Chandigarh Tri-City',
    state: 'Punjab / Haryana',
    tier: 2,
    lat: 30.7333,
    lng: 76.7794,
    popularAreas: [
      'Sector 17 Commercial Plaza',
      'Sector 35 Food & Leisure',
      'Rajiv Gandhi Chandigarh IT Park',
      'Mohali Phase 7 / Sector 70',
      'Panchkula Sector 5',
      'Sector 26 Madhya Marg',
      'Industrial Area Phase 1',
      'Zirakpur VIP Road',
    ],
    majorHubs: [
      { name: 'Shaheed Bhagat Singh International Airport (IXC)', type: 'airport', area: 'Mohali' },
      { name: 'Elante Mall & Commercial Complex', type: 'mall', area: 'Industrial Area Phase 1' },
      { name: 'Chandigarh Junction Railway Station', type: 'railway', area: 'Daria' },
      { name: 'DLF Info City', type: 'it_park', area: 'IT Park' },
    ],
  },
  {
    id: 'lucknow',
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    tier: 2,
    lat: 26.8467,
    lng: 80.9462,
    popularAreas: [
      'Hazratganj',
      'Gomti Nagar & Gomti Nagar Extension',
      'Alambagh',
      'Indira Nagar',
      'Mahanagar',
      'Vibhuti Khand IT Corridor',
      'Chowk',
      'Ashiyana',
    ],
    majorHubs: [
      { name: 'Chaudhary Charan Singh International Airport (LKO)', type: 'airport', area: 'Amausi' },
      { name: 'Lucknow Charbagh Railway Station', type: 'railway', area: 'Charbagh' },
      { name: 'Lulu Mall Lucknow', type: 'mall', area: 'Amar Shaheed Path' },
      { name: 'HCL IT City', type: 'it_park', area: 'Sultanpur Road' },
    ],
  },
  {
    id: 'kochi',
    name: 'Kochi (Cochin)',
    state: 'Kerala',
    tier: 2,
    lat: 9.9312,
    lng: 76.2673,
    popularAreas: [
      'Marine Drive',
      'Kakkanad InfoPark',
      'MG Road / Ernakulam South',
      'Panampilly Nagar',
      'Edappally',
      'Kadavanthra',
      'Fort Kochi',
      'Vyttila Mobility Hub',
    ],
    majorHubs: [
      { name: 'Cochin International Airport (COK)', type: 'airport', area: 'Nedumbassery' },
      { name: 'InfoPark & SmartCity Kochi', type: 'it_park', area: 'Kakkanad' },
      { name: 'Lulu International Shopping Mall', type: 'mall', area: 'Edappally' },
      { name: 'Ernakulam Junction (South) Station', type: 'railway', area: 'Ernakulam' },
    ],
  },
  {
    id: 'goa',
    name: 'Goa Coastal & City Corridors',
    state: 'Goa',
    tier: 2,
    lat: 15.2993,
    lng: 74.1240,
    popularAreas: [
      'Panaji City Center',
      'Candolim Beach Corridor',
      'Calangute / Baga Hub',
      'Margao City',
      'Vasco da Gama',
      'Porvorim Highway Corridor',
      'Anjuna / Vagator',
      'Colva Beach',
    ],
    majorHubs: [
      { name: 'Manohar International Airport (GOX)', type: 'airport', area: 'Mopa, North Goa' },
      { name: 'Dabolim Airport (GOI)', type: 'airport', area: 'Dabolim, South Goa' },
      { name: 'Madgaon Junction Railway Station', type: 'railway', area: 'Margao' },
      { name: 'Mall De Goa', type: 'mall', area: 'Porvorim' },
    ],
  },
];

export function getAllIndianCities(): IndianCity[] {
  return INDIAN_CITIES;
}

export function getCityById(id: string): IndianCity | undefined {
  return INDIAN_CITIES.find(c => c.id.toLowerCase() === id.toLowerCase() || c.name.toLowerCase() === id.toLowerCase());
}

export function searchCitiesAndAreas(query: string) {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const matchedCities = INDIAN_CITIES.filter(
    c => c.name.toLowerCase().includes(clean) || c.state.toLowerCase().includes(clean)
  );

  const matchedAreas: { city: IndianCity; area: string; hub?: string }[] = [];
  for (const city of INDIAN_CITIES) {
    for (const area of city.popularAreas) {
      if (area.toLowerCase().includes(clean)) {
        matchedAreas.push({ city, area });
      }
    }
    for (const hub of city.majorHubs) {
      if (hub.name.toLowerCase().includes(clean)) {
        matchedAreas.push({ city, area: hub.area, hub: hub.name });
      }
    }
  }

  return {
    cities: matchedCities,
    areas: matchedAreas.slice(0, 8),
  };
}
