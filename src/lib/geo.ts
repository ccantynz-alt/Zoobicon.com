// Geo utilities: IP lookup, distance, nearby cities, geocoding.
// Free providers with graceful fallbacks. No `any` types.

export interface GeoLocation {
  ip: string;
  country: string;
  region: string;
  city: string;
  lat: number;
  lng: number;
  timezone: string;
  isp: string;
}

interface IpapiResponse {
  ip?: string;
  country_name?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  org?: string;
  error?: boolean;
}

interface IpinfoResponse {
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  loc?: string;
  timezone?: string;
  org?: string;
}

const UA = "Zoobicon-Geo/1.0 (+https://zoobicon.com)";

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json", ...headers },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function lookupIp(ip: string): Promise<GeoLocation> {
  const cleanIp = (ip || "").trim();

  // Primary: ipapi.co (free, no token)
  const primary = await fetchJson<IpapiResponse>(`https://ipapi.co/${encodeURIComponent(cleanIp)}/json/`);
  if (primary && !primary.error && typeof primary.latitude === "number" && typeof primary.longitude === "number") {
    return {
      ip: primary.ip ?? cleanIp,
      country: primary.country_name ?? primary.country ?? "",
      region: primary.region ?? "",
      city: primary.city ?? "",
      lat: primary.latitude,
      lng: primary.longitude,
      timezone: primary.timezone ?? "",
      isp: primary.org ?? "",
    };
  }

  // Fallback: ipinfo.io (optional token via env)
  const token = process.env.IPINFO_TOKEN;
  const ipinfoUrl = `https://ipinfo.io/${encodeURIComponent(cleanIp)}/json${token ? `?token=${token}` : ""}`;
  const fallback = await fetchJson<IpinfoResponse>(ipinfoUrl);
  if (fallback && fallback.loc) {
    const [latStr, lngStr] = fallback.loc.split(",");
    const lat = Number(latStr);
    const lng = Number(lngStr);
    return {
      ip: fallback.ip ?? cleanIp,
      country: fallback.country ?? "",
      region: fallback.region ?? "",
      city: fallback.city ?? "",
      lat: Number.isFinite(lat) ? lat : 0,
      lng: Number.isFinite(lng) ? lng : 0,
      timezone: fallback.timezone ?? "",
      isp: fallback.org ?? "",
    };
  }

  return {
    ip: cleanIp,
    country: "",
    region: "",
    city: "",
    lat: 0,
    lng: 0,
    timezone: "",
    isp: "",
  };
}

export function distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

// Curated 100 major world cities (offline).
export const MAJOR_CITIES: ReadonlyArray<City> = [
  { name: "Tokyo", country: "JP", lat: 35.6762, lng: 139.6503 },
  { name: "Delhi", country: "IN", lat: 28.7041, lng: 77.1025 },
  { name: "Shanghai", country: "CN", lat: 31.2304, lng: 121.4737 },
  { name: "São Paulo", country: "BR", lat: -23.5505, lng: -46.6333 },
  { name: "Mexico City", country: "MX", lat: 19.4326, lng: -99.1332 },
  { name: "Cairo", country: "EG", lat: 30.0444, lng: 31.2357 },
  { name: "Mumbai", country: "IN", lat: 19.076, lng: 72.8777 },
  { name: "Beijing", country: "CN", lat: 39.9042, lng: 116.4074 },
  { name: "Dhaka", country: "BD", lat: 23.8103, lng: 90.4125 },
  { name: "Osaka", country: "JP", lat: 34.6937, lng: 135.5023 },
  { name: "New York", country: "US", lat: 40.7128, lng: -74.006 },
  { name: "Karachi", country: "PK", lat: 24.8607, lng: 67.0011 },
  { name: "Buenos Aires", country: "AR", lat: -34.6037, lng: -58.3816 },
  { name: "Chongqing", country: "CN", lat: 29.4316, lng: 106.9123 },
  { name: "Istanbul", country: "TR", lat: 41.0082, lng: 28.9784 },
  { name: "Kolkata", country: "IN", lat: 22.5726, lng: 88.3639 },
  { name: "Manila", country: "PH", lat: 14.5995, lng: 120.9842 },
  { name: "Lagos", country: "NG", lat: 6.5244, lng: 3.3792 },
  { name: "Rio de Janeiro", country: "BR", lat: -22.9068, lng: -43.1729 },
  { name: "Tianjin", country: "CN", lat: 39.3434, lng: 117.3616 },
  { name: "Kinshasa", country: "CD", lat: -4.4419, lng: 15.2663 },
  { name: "Guangzhou", country: "CN", lat: 23.1291, lng: 113.2644 },
  { name: "Los Angeles", country: "US", lat: 34.0522, lng: -118.2437 },
  { name: "Moscow", country: "RU", lat: 55.7558, lng: 37.6173 },
  { name: "Shenzhen", country: "CN", lat: 22.5431, lng: 114.0579 },
  { name: "Lahore", country: "PK", lat: 31.5204, lng: 74.3587 },
  { name: "Bangalore", country: "IN", lat: 12.9716, lng: 77.5946 },
  { name: "Paris", country: "FR", lat: 48.8566, lng: 2.3522 },
  { name: "Bogotá", country: "CO", lat: 4.711, lng: -74.0721 },
  { name: "Jakarta", country: "ID", lat: -6.2088, lng: 106.8456 },
  { name: "Chennai", country: "IN", lat: 13.0827, lng: 80.2707 },
  { name: "Lima", country: "PE", lat: -12.0464, lng: -77.0428 },
  { name: "Bangkok", country: "TH", lat: 13.7563, lng: 100.5018 },
  { name: "Seoul", country: "KR", lat: 37.5665, lng: 126.978 },
  { name: "Nagoya", country: "JP", lat: 35.1815, lng: 136.9066 },
  { name: "Hyderabad", country: "IN", lat: 17.385, lng: 78.4867 },
  { name: "London", country: "GB", lat: 51.5074, lng: -0.1278 },
  { name: "Tehran", country: "IR", lat: 35.6892, lng: 51.389 },
  { name: "Chicago", country: "US", lat: 41.8781, lng: -87.6298 },
  { name: "Chengdu", country: "CN", lat: 30.5728, lng: 104.0668 },
  { name: "Nanjing", country: "CN", lat: 32.0603, lng: 118.7969 },
  { name: "Wuhan", country: "CN", lat: 30.5928, lng: 114.3055 },
  { name: "Ho Chi Minh City", country: "VN", lat: 10.8231, lng: 106.6297 },
  { name: "Luanda", country: "AO", lat: -8.839, lng: 13.2894 },
  { name: "Ahmedabad", country: "IN", lat: 23.0225, lng: 72.5714 },
  { name: "Kuala Lumpur", country: "MY", lat: 3.139, lng: 101.6869 },
  { name: "Xi'an", country: "CN", lat: 34.3416, lng: 108.9398 },
  { name: "Hong Kong", country: "HK", lat: 22.3193, lng: 114.1694 },
  { name: "Dongguan", country: "CN", lat: 23.0207, lng: 113.7518 },
  { name: "Hangzhou", country: "CN", lat: 30.2741, lng: 120.1551 },
  { name: "Foshan", country: "CN", lat: 23.0218, lng: 113.1219 },
  { name: "Shenyang", country: "CN", lat: 41.8057, lng: 123.4315 },
  { name: "Riyadh", country: "SA", lat: 24.7136, lng: 46.6753 },
  { name: "Baghdad", country: "IQ", lat: 33.3152, lng: 44.3661 },
  { name: "Santiago", country: "CL", lat: -33.4489, lng: -70.6693 },
  { name: "Surat", country: "IN", lat: 21.1702, lng: 72.8311 },
  { name: "Madrid", country: "ES", lat: 40.4168, lng: -3.7038 },
  { name: "Suzhou", country: "CN", lat: 31.2989, lng: 120.5853 },
  { name: "Pune", country: "IN", lat: 18.5204, lng: 73.8567 },
  { name: "Harbin", country: "CN", lat: 45.8038, lng: 126.5349 },
  { name: "Houston", country: "US", lat: 29.7604, lng: -95.3698 },
  { name: "Dallas", country: "US", lat: 32.7767, lng: -96.797 },
  { name: "Toronto", country: "CA", lat: 43.6532, lng: -79.3832 },
  { name: "Dar es Salaam", country: "TZ", lat: -6.7924, lng: 39.2083 },
  { name: "Miami", country: "US", lat: 25.7617, lng: -80.1918 },
  { name: "Belo Horizonte", country: "BR", lat: -19.9167, lng: -43.9345 },
  { name: "Singapore", country: "SG", lat: 1.3521, lng: 103.8198 },
  { name: "Philadelphia", country: "US", lat: 39.9526, lng: -75.1652 },
  { name: "Atlanta", country: "US", lat: 33.749, lng: -84.388 },
  { name: "Fukuoka", country: "JP", lat: 33.5904, lng: 130.4017 },
  { name: "Khartoum", country: "SD", lat: 15.5007, lng: 32.5599 },
  { name: "Barcelona", country: "ES", lat: 41.3851, lng: 2.1734 },
  { name: "Johannesburg", country: "ZA", lat: -26.2041, lng: 28.0473 },
  { name: "Saint Petersburg", country: "RU", lat: 59.9311, lng: 30.3609 },
  { name: "Qingdao", country: "CN", lat: 36.0671, lng: 120.3826 },
  { name: "Dalian", country: "CN", lat: 38.914, lng: 121.6147 },
  { name: "Washington", country: "US", lat: 38.9072, lng: -77.0369 },
  { name: "Yangon", country: "MM", lat: 16.8409, lng: 96.1735 },
  { name: "Alexandria", country: "EG", lat: 31.2001, lng: 29.9187 },
  { name: "Jinan", country: "CN", lat: 36.6512, lng: 117.1201 },
  { name: "Guadalajara", country: "MX", lat: 20.6597, lng: -103.3496 },
  { name: "Sydney", country: "AU", lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne", country: "AU", lat: -37.8136, lng: 144.9631 },
  { name: "Auckland", country: "NZ", lat: -36.8485, lng: 174.7633 },
  { name: "Wellington", country: "NZ", lat: -41.2865, lng: 174.7762 },
  { name: "Berlin", country: "DE", lat: 52.52, lng: 13.405 },
  { name: "Rome", country: "IT", lat: 41.9028, lng: 12.4964 },
  { name: "Vienna", country: "AT", lat: 48.2082, lng: 16.3738 },
  { name: "Amsterdam", country: "NL", lat: 52.3676, lng: 4.9041 },
  { name: "Brussels", country: "BE", lat: 50.8503, lng: 4.3517 },
  { name: "Stockholm", country: "SE", lat: 59.3293, lng: 18.0686 },
  { name: "Oslo", country: "NO", lat: 59.9139, lng: 10.7522 },
  { name: "Copenhagen", country: "DK", lat: 55.6761, lng: 12.5683 },
  { name: "Helsinki", country: "FI", lat: 60.1699, lng: 24.9384 },
  { name: "Dublin", country: "IE", lat: 53.3498, lng: -6.2603 },
  { name: "Lisbon", country: "PT", lat: 38.7223, lng: -9.1393 },
  { name: "Athens", country: "GR", lat: 37.9838, lng: 23.7275 },
  { name: "Warsaw", country: "PL", lat: 52.2297, lng: 21.0122 },
  { name: "Prague", country: "CZ", lat: 50.0755, lng: 14.4378 },
  { name: "Dubai", country: "AE", lat: 25.2048, lng: 55.2708 },
  { name: "Tel Aviv", country: "IL", lat: 32.0853, lng: 34.7818 },
  { name: "Nairobi", country: "KE", lat: -1.2921, lng: 36.8219 },
];

export interface NearbyCity extends City {
  distanceKm: number;
}

export function nearbyCities(lat: number, lng: number, radiusKm: number): NearbyCity[] {
  const out: NearbyCity[] = [];
  for (const city of MAJOR_CITIES) {
    const d = distance(lat, lng, city.lat, city.lng);
    if (d <= radiusKm) {
      out.push({ ...city, distanceKm: Math.round(d * 100) / 100 });
    }
  }
  out.sort((a, b) => a.distanceKm - b.distanceKm);
  return out;
}

export interface TimezoneInfo {
  timezone: string;
  offsetMinutes: number;
  offsetHours: number;
  formatted: string;
}

export function timezoneOffset(tz: string): TimezoneInfo {
  try {
    const now = new Date();
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "longOffset",
    });
    const parts = dtf.formatToParts(now);
    const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+00:00";
    const match = tzName.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);
    let offsetMinutes = 0;
    if (match) {
      const sign = match[1] === "-" ? -1 : 1;
      const hours = Number(match[2] ?? "0");
      const mins = Number(match[3] ?? "0");
      offsetMinutes = sign * (hours * 60 + mins);
    }
    const offsetHours = offsetMinutes / 60;
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const absMin = Math.abs(offsetMinutes);
    const hh = String(Math.floor(absMin / 60)).padStart(2, "0");
    const mm = String(absMin % 60).padStart(2, "0");
    return {
      timezone: tz,
      offsetMinutes,
      offsetHours,
      formatted: `UTC${sign}${hh}:${mm}`,
    };
  } catch {
    return { timezone: tz, offsetMinutes: 0, offsetHours: 0, formatted: "UTC+00:00" };
  }
}

export interface GeocodeResult {
  address: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
  importance: number;
}

interface NominatimResult {
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  importance?: number;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const data = await fetchJson<NominatimResult[]>(url, { "User-Agent": UA });
  if (!data || data.length === 0) return null;
  const top = data[0];
  const lat = Number(top.lat ?? "0");
  const lng = Number(top.lon ?? "0");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    address,
    displayName: top.display_name ?? address,
    lat,
    lng,
    type: top.type ?? "",
    importance: typeof top.importance === "number" ? top.importance : 0,
  };
}
