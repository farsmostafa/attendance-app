/**
 * Geo Utilities - Distance calculations using Haversine formula
 * Precise WGS84 coordinate-based distance calculation for geofencing
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate the great-circle distance between two points on Earth
 * using the Haversine formula
 *
 * @param point1 - First coordinate {latitude, longitude}
 * @param point2 - Second coordinate {latitude, longitude}
 * @returns Distance in meters
 *
 * @example
 * const distance = calculateDistance(
 *   { latitude: 26.336796, longitude: 31.891085 },
 *   { latitude: 26.337000, longitude: 31.891200 }
 * );
 * console.log(distance); // ~30.5 meters
 */
export const calculateDistance = (point1: Coordinates, point2: Coordinates): number => {
  const R = 6371e3; // Earth's radius in meters (WGS84)

  // Convert degrees to radians
  const lat1Rad = (point1.latitude * Math.PI) / 180;
  const lat2Rad = (point2.latitude * Math.PI) / 180;
  const deltaLatRad = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const deltaLonRad = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Check if a point is within a specified radius of a center point
 *
 * @param userLocation - User's current location
 * @param centerLocation - Reference location (e.g., office)
 * @param radiusMeters - Allowed radius in meters
 * @returns true if user is within radius, false otherwise
 */
export const isWithinGeofence = (
  userLocation: Coordinates,
  centerLocation: Coordinates,
  radiusMeters: number,
): boolean => {
  const distance = calculateDistance(userLocation, centerLocation);
  return distance <= radiusMeters;
};
