/**
 * Browser Geolocation + OpenStreetMap Reverse Geocoding
 *
 * Gets GPS coordinates from browser and converts to street address
 * using OpenStreetMap Nominatim API (completely free, no API key required).
 *
 * Rate limit: 1 request/second (per IP) — we only call this once per session.
 */

// ─── Get GPS position from browser ───────────────────────────

export function requestGpsPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }

    // Options: high accuracy for better street-level results
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,        // 10 seconds timeout
      maximumAge: 300000,    // Cache up to 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => resolve(null),    // Silently fail if denied/error
      options
    );
  });
}

// ─── Reverse geocode via OpenStreetMap Nominatim ────────────
// Docs: https://nominatim.org/release-docs/develop/api/Reverse/
// COMPLETELY FREE — no API key, no registration needed
// Only requirement: provide a meaningful User-Agent

export interface NominatimAddress {
  road?: string;
  houseNumber?: string;
  suburb?: string;
  city?: string;
  district?: string;
  state?: string;
  postcode?: string;
  country?: string;
  countryCode?: string;
  displayName: string;
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<NominatimAddress | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}` +
      `&format=jsonv2&addressdetails=1`,
      {
        headers: {
          // Nominatim requires a meaningful User-Agent
          'User-Agent': 'AmarChurighorAnalytics/1.0 (admin@amarchurighor.com)',
          'Accept-Language': 'bn,en', // Bengali preferred, English fallback
        },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();

    if (!data || !data.address) return null;

    const addr = data.address;
    return {
      road: addr.road || addr.street || addr.pedestrian || null,
      houseNumber: addr.house_number || null,
      suburb: addr.suburb || addr.neighbourhood || addr.village || null,
      city: addr.city || addr.town || addr.municipality || null,
      district: addr.county || addr.state_district || null,
      state: addr.state || null,
      postcode: addr.postcode || null,
      country: addr.country || null,
      countryCode: addr.country_code ? addr.country_code.toUpperCase() : null,
      displayName: data.display_name || '',
    };
  } catch {
    return null;
  }
}

// ─── Combined: Get GPS + Address in one call ─────────────────

export interface GpsLocationData {
  gpsLat: number;
  gpsLon: number;
  gpsAccuracy: number;
  streetAddress: string;
  road: string | null;
  houseNumber: string | null;
  suburb: string | null;
  isGpsLocation: boolean;
}

export async function getGpsLocation(): Promise<GpsLocationData | null> {
  try {
    const position = await requestGpsPosition();
    if (!position) return null;

    const { latitude, longitude, accuracy } = position.coords;

    // If accuracy is too low (>1000m), skip reverse geocoding — not useful
    if (accuracy > 1000) {
      return {
        gpsLat: latitude,
        gpsLon: longitude,
        gpsAccuracy: accuracy,
        streetAddress: '',
        road: null,
        houseNumber: null,
        suburb: null,
        isGpsLocation: true,
      };
    }

    const address = await reverseGeocode(latitude, longitude);

    // Build a nice street address string
    const parts: string[] = [];
    if (address?.houseNumber) parts.push(address.houseNumber);
    if (address?.road) parts.push(address.road);
    if (address?.suburb) parts.push(address.suburb);
    if (address?.city) parts.push(address.city);
    if (address?.state) parts.push(address.state);
    if (address?.postcode) parts.push(address.postcode);
    if (address?.country) parts.push(address.country);

    return {
      gpsLat: latitude,
      gpsLon: longitude,
      gpsAccuracy: accuracy,
      streetAddress: parts.length > 0 ? parts.join(', ') : (address?.displayName || ''),
      road: address?.road || null,
      houseNumber: address?.houseNumber || null,
      suburb: address?.suburb || null,
      isGpsLocation: true,
    };
  } catch {
    return null;
  }
}