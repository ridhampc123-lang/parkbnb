/**
 * Great-circle distance calculations using the Haversine formula
 */

export interface DistanceInfo {
  distanceKm: number;
  distanceText: string;
  walkingTimeMinutes: number;
  drivingTimeMinutes: number;
}

/**
 * Calculates distance in kilometers between two GPS coordinate pairs
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }

  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Formats distance with walking and driving estimates
 */
export function formatDistanceInfo(distanceKm: number): DistanceInfo {
  // Average city walking speed ~4.5 km/h -> 1 km in ~13.3 min
  const walkingTimeMinutes = Math.max(1, Math.round((distanceKm / 4.5) * 60));
  // Average congested city driving speed ~22 km/h
  const drivingTimeMinutes = Math.max(1, Math.round((distanceKm / 22) * 60));

  const distanceText =
    distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`;

  return {
    distanceKm,
    distanceText,
    walkingTimeMinutes,
    drivingTimeMinutes,
  };
}

/**
 * Sorts array of items by proximity to customer coordinates
 */
export function sortByDistance<T extends { property?: { latitude?: number; longitude?: number } }>(
  items: T[],
  customerLat: number,
  customerLng: number
): (T & { distanceKm: number; distanceText: string; walkingTimeMinutes: number })[] {
  return items
    .map((item) => {
      const lat = item.property?.latitude ?? 0;
      const lng = item.property?.longitude ?? 0;
      const d = calculateDistanceKm(customerLat, customerLng, lat, lng);
      const info = formatDistanceInfo(d);
      return {
        ...item,
        distanceKm: d,
        distanceText: info.distanceText,
        walkingTimeMinutes: info.walkingTimeMinutes,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
