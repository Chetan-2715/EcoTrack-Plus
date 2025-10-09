// Simple distance calculation utility
// In a real app, you would use Google Maps API, OpenStreetMap, or GPS coordinates

export interface Location {
  lat?: number;
  lng?: number;
  address?: string;
}

/**
 * Calculate distance between two locations
 * For now, this returns a mock distance based on the location names
 * In the future, this will be integrated with GPS/Maps API
 */
export function calculateDistance(start: string, end: string): number {
  // Mock distance calculation based on common location patterns
  // This is a placeholder until GPS integration
  
  const startLower = start.toLowerCase();
  const endLower = end.toLowerCase();
  
  // Simple heuristic based on location types and keywords
  const cityKeywords = ['city', 'downtown', 'center', 'mall', 'station'];
  const suburbanKeywords = ['suburb', 'residential', 'neighborhood', 'area'];
  const farKeywords = ['airport', 'outskirts', 'highway', 'interstate'];
  
  let estimatedDistance = 5; // default 5km
  
  // Check for distance indicators in the text
  if (startLower.includes('near') || endLower.includes('near')) {
    estimatedDistance = 2;
  } else if (startLower.includes('far') || endLower.includes('far')) {
    estimatedDistance = 15;
  } else if (farKeywords.some(keyword => startLower.includes(keyword) || endLower.includes(keyword))) {
    estimatedDistance = 25;
  } else if (cityKeywords.some(keyword => startLower.includes(keyword) || endLower.includes(keyword))) {
    estimatedDistance = 8;
  } else if (suburbanKeywords.some(keyword => startLower.includes(keyword) || endLower.includes(keyword))) {
    estimatedDistance = 3;
  }
  
  // Add some randomness to make it feel more realistic
  const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
  estimatedDistance += variation;
  
  // Ensure minimum distance of 1km
  return Math.max(1, estimatedDistance);
}

/**
 * Calculate points based on distance
 */
export function calculateTransportPoints(distance: number): number {
  if (distance <= 5) return 1;
  if (distance <= 10) return 2;
  if (distance <= 20) return 3;
  return 4;
}

/**
 * Get distance category description
 */
export function getDistanceCategory(distance: number): string {
  if (distance <= 5) return "Short distance (1-5km)";
  if (distance <= 10) return "Medium distance (5-10km)";
  if (distance <= 20) return "Long distance (11-20km)";
  return "Very long distance (20+ km)";
}

/**
 * Validate location input
 */
export function isValidLocation(location: string): boolean {
  return location.trim().length >= 3;
}

// Future GPS integration placeholder
export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * Get current GPS location (placeholder for future implementation)
 */
export async function getCurrentLocation(): Promise<GPSCoordinates | null> {
  if (!navigator.geolocation) {
    return null;
  }
  
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.warn('GPS location not available:', error);
        resolve(null);
      }
    );
  });
}

/**
 * Calculate actual distance using GPS coordinates (placeholder)
 */
export function calculateGPSDistance(
  start: GPSCoordinates,
  end: GPSCoordinates
): number {
  // Haversine formula for calculating distance between GPS coordinates
  const R = 6371; // Earth's radius in kilometers
  const dLat = (end.latitude - start.latitude) * Math.PI / 180;
  const dLon = (end.longitude - start.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(start.latitude * Math.PI / 180) * Math.cos(end.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
