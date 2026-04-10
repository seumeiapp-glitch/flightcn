import type {
  TelemetryEvent,
  TelemetryEventType,
  TelemetrySummary,
  TelemetryRanking,
  GeoAggregation,
  Platform,
  DeviceType,
  Severity,
} from "./types";

// Realistic global distribution with concentration in key regions
const locations = [
  // Brazil - High activity
  { continent: "South America", continentCode: "SA", country: "Brazil", countryCode: "BR", state: "Sao Paulo", stateCode: "SP", city: "Sao Paulo", lat: -23.5505, lng: -46.6333 },
  { continent: "South America", continentCode: "SA", country: "Brazil", countryCode: "BR", state: "Rio de Janeiro", stateCode: "RJ", city: "Rio de Janeiro", lat: -22.9068, lng: -43.1729 },
  { continent: "South America", continentCode: "SA", country: "Brazil", countryCode: "BR", state: "Minas Gerais", stateCode: "MG", city: "Belo Horizonte", lat: -19.9167, lng: -43.9345 },
  { continent: "South America", continentCode: "SA", country: "Brazil", countryCode: "BR", state: "Parana", stateCode: "PR", city: "Curitiba", lat: -25.4284, lng: -49.2733 },
  { continent: "South America", continentCode: "SA", country: "Brazil", countryCode: "BR", state: "Bahia", stateCode: "BA", city: "Salvador", lat: -12.9714, lng: -38.5014 },
  { continent: "South America", continentCode: "SA", country: "Brazil", countryCode: "BR", state: "Rio Grande do Sul", stateCode: "RS", city: "Porto Alegre", lat: -30.0346, lng: -51.2177 },
  
  // United States - High activity
  { continent: "North America", continentCode: "NA", country: "United States", countryCode: "US", state: "California", stateCode: "CA", city: "San Francisco", lat: 37.7749, lng: -122.4194 },
  { continent: "North America", continentCode: "NA", country: "United States", countryCode: "US", state: "New York", stateCode: "NY", city: "New York", lat: 40.7128, lng: -74.006 },
  { continent: "North America", continentCode: "NA", country: "United States", countryCode: "US", state: "Texas", stateCode: "TX", city: "Austin", lat: 30.2672, lng: -97.7431 },
  { continent: "North America", continentCode: "NA", country: "United States", countryCode: "US", state: "Washington", stateCode: "WA", city: "Seattle", lat: 47.6062, lng: -122.3321 },
  { continent: "North America", continentCode: "NA", country: "United States", countryCode: "US", state: "Illinois", stateCode: "IL", city: "Chicago", lat: 41.8781, lng: -87.6298 },
  
  // Europe
  { continent: "Europe", continentCode: "EU", country: "United Kingdom", countryCode: "GB", state: "England", stateCode: "ENG", city: "London", lat: 51.5074, lng: -0.1278 },
  { continent: "Europe", continentCode: "EU", country: "Germany", countryCode: "DE", state: "Berlin", stateCode: "BE", city: "Berlin", lat: 52.52, lng: 13.405 },
  { continent: "Europe", continentCode: "EU", country: "France", countryCode: "FR", state: "Ile-de-France", stateCode: "IDF", city: "Paris", lat: 48.8566, lng: 2.3522 },
  { continent: "Europe", continentCode: "EU", country: "Spain", countryCode: "ES", state: "Madrid", stateCode: "MAD", city: "Madrid", lat: 40.4168, lng: -3.7038 },
  { continent: "Europe", continentCode: "EU", country: "Portugal", countryCode: "PT", state: "Lisbon", stateCode: "LIS", city: "Lisbon", lat: 38.7223, lng: -9.1393 },
  { continent: "Europe", continentCode: "EU", country: "Netherlands", countryCode: "NL", state: "North Holland", stateCode: "NH", city: "Amsterdam", lat: 52.3676, lng: 4.9041 },
  
  // Asia
  { continent: "Asia", continentCode: "AS", country: "Japan", countryCode: "JP", state: "Tokyo", stateCode: "TK", city: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { continent: "Asia", continentCode: "AS", country: "Singapore", countryCode: "SG", city: "Singapore", lat: 1.3521, lng: 103.8198 },
  { continent: "Asia", continentCode: "AS", country: "India", countryCode: "IN", state: "Maharashtra", stateCode: "MH", city: "Mumbai", lat: 19.076, lng: 72.8777 },
  { continent: "Asia", continentCode: "AS", country: "South Korea", countryCode: "KR", state: "Seoul", stateCode: "SEO", city: "Seoul", lat: 37.5665, lng: 126.978 },
  { continent: "Asia", continentCode: "AS", country: "China", countryCode: "CN", state: "Shanghai", stateCode: "SH", city: "Shanghai", lat: 31.2304, lng: 121.4737 },
  
  // Other regions
  { continent: "Oceania", continentCode: "OC", country: "Australia", countryCode: "AU", state: "New South Wales", stateCode: "NSW", city: "Sydney", lat: -33.8688, lng: 151.2093 },
  { continent: "Oceania", continentCode: "OC", country: "Australia", countryCode: "AU", state: "Victoria", stateCode: "VIC", city: "Melbourne", lat: -37.8136, lng: 144.9631 },
  { continent: "Africa", continentCode: "AF", country: "South Africa", countryCode: "ZA", state: "Gauteng", stateCode: "GP", city: "Johannesburg", lat: -26.2041, lng: 28.0473 },
  { continent: "South America", continentCode: "SA", country: "Argentina", countryCode: "AR", state: "Buenos Aires", stateCode: "BA", city: "Buenos Aires", lat: -34.6037, lng: -58.3816 },
  { continent: "South America", continentCode: "SA", country: "Chile", countryCode: "CL", state: "Santiago", stateCode: "RM", city: "Santiago", lat: -33.4489, lng: -70.6693 },
  { continent: "North America", continentCode: "NA", country: "Mexico", countryCode: "MX", state: "Mexico City", stateCode: "CDMX", city: "Mexico City", lat: 19.4326, lng: -99.1332 },
  { continent: "North America", continentCode: "NA", country: "Canada", countryCode: "CA", state: "Ontario", stateCode: "ON", city: "Toronto", lat: 43.6532, lng: -79.3832 },
];

const eventTypes: TelemetryEventType[] = [
  "login", "install", "access", "session_start", "first_access", "return", "activity", "signup", "upgrade"
];

const platforms: Platform[] = ["web", "ios", "android", "desktop", "api"];
const devices: DeviceType[] = ["mobile", "tablet", "desktop"];
const browsers = ["Chrome", "Safari", "Firefox", "Edge", "Arc"];
const osOptions = ["Windows", "macOS", "iOS", "Android", "Linux"];

const tenants = [
  { id: "t1", name: "Acme Corp", workspace: "production" },
  { id: "t2", name: "TechStart", workspace: "staging" },
  { id: "t3", name: "GlobalTech", workspace: "production" },
  { id: "t4", name: "InnovateCo", workspace: "development" },
  { id: "t5", name: "NextGen Solutions", workspace: "production" },
  { id: "t6", name: "Apex Industries", workspace: "production" },
  { id: "t7", name: "Quantum Labs", workspace: "staging" },
  { id: "t8", name: "Stellar Dynamics", workspace: "production" },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomMinutesAgo(maxMinutes: number): string {
  const now = new Date();
  const minutesAgo = Math.floor(Math.random() * maxMinutes);
  now.setMinutes(now.getMinutes() - minutesAgo);
  return now.toISOString();
}

function generateEvent(id: number, maxMinutesAgo = 1440): TelemetryEvent {
  const loc = randomItem(locations);
  const eventType = randomItem(eventTypes);
  const platform = randomItem(platforms);
  const device = platform === "ios" || platform === "android" ? "mobile" : randomItem(devices);
  
  const severity: Severity | undefined = 
    eventType === "upgrade" ? "info" :
    Math.random() > 0.95 ? "critical" :
    Math.random() > 0.85 ? "warning" : undefined;

  return {
    id: `evt-${id.toString().padStart(6, "0")}`,
    type: eventType,
    timestamp: randomMinutesAgo(maxMinutesAgo),
    location: {
      continent: loc.continent,
      continentCode: loc.continentCode,
      country: loc.country,
      countryCode: loc.countryCode,
      state: loc.state,
      stateCode: loc.stateCode,
      city: loc.city,
      latitude: loc.lat + (Math.random() - 0.5) * 0.1,
      longitude: loc.lng + (Math.random() - 0.5) * 0.1,
    },
    source: {
      platform,
      device,
      browser: platform === "web" ? randomItem(browsers) : undefined,
      os: randomItem(osOptions),
      ipMasked: `${Math.floor(Math.random() * 255)}.***.***.${Math.floor(Math.random() * 255)}`,
    },
    tenant: Math.random() > 0.3 ? randomItem(tenants) : undefined,
    severity,
  };
}

// Generate 100 mock events
export const mockEvents: TelemetryEvent[] = Array.from({ length: 100 }, (_, i) => 
  generateEvent(i + 1, 1440)
).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

// Summary metrics
export const mockSummary: TelemetrySummary = {
  totalEvents: 12847,
  logins: 4523,
  installs: 892,
  activeCountries: 47,
  activeCities: 234,
  trend: 12.4,
  liveNow: 127,
  topLocation: {
    name: "Sao Paulo, Brazil",
    count: 2341,
  },
};

// Country rankings
export const mockCountryRankings: TelemetryRanking[] = [
  { name: "Brazil", code: "BR", count: 4521, trend: 15.2 },
  { name: "United States", code: "US", count: 2847, trend: 8.3 },
  { name: "Germany", code: "DE", count: 1234, trend: -2.1 },
  { name: "United Kingdom", code: "GB", count: 987, trend: 5.7 },
  { name: "Japan", code: "JP", count: 756, trend: 22.4, isNew: true },
  { name: "France", code: "FR", count: 623, trend: 3.2 },
  { name: "Australia", code: "AU", count: 512, trend: 11.8 },
  { name: "Canada", code: "CA", count: 445, trend: -0.5 },
  { name: "India", code: "IN", count: 398, trend: 45.2, isNew: true },
  { name: "Spain", code: "ES", count: 324, trend: 6.1 },
];

// City rankings
export const mockCityRankings: TelemetryRanking[] = [
  { name: "Sao Paulo", code: "SP", count: 2341, trend: 18.5 },
  { name: "New York", code: "NY", count: 1456, trend: 7.2 },
  { name: "London", code: "LON", count: 892, trend: 4.8 },
  { name: "San Francisco", code: "SF", count: 756, trend: 12.3 },
  { name: "Berlin", code: "BER", count: 634, trend: -1.2 },
  { name: "Tokyo", code: "TYO", count: 567, trend: 28.4, isNew: true },
  { name: "Rio de Janeiro", code: "RJ", count: 489, trend: 9.7 },
  { name: "Paris", code: "PAR", count: 423, trend: 2.1 },
  { name: "Sydney", code: "SYD", count: 356, trend: 15.6 },
  { name: "Austin", code: "AUS", count: 312, trend: 34.2, isNew: true },
];

// Continent aggregations
export const mockContinentAggregations: GeoAggregation[] = [
  { level: "continent", name: "South America", code: "SA", count: 5234, trend: 14.2, coordinates: [-55.0, -10.0] },
  { level: "continent", name: "North America", code: "NA", count: 3567, trend: 8.7, coordinates: [-100.0, 40.0] },
  { level: "continent", name: "Europe", code: "EU", count: 2891, trend: 3.4, coordinates: [10.0, 50.0] },
  { level: "continent", name: "Asia", code: "AS", count: 1823, trend: 25.6, coordinates: [100.0, 35.0] },
  { level: "continent", name: "Oceania", code: "OC", count: 678, trend: 12.1, coordinates: [140.0, -25.0] },
  { level: "continent", name: "Africa", code: "AF", count: 234, trend: 45.8, coordinates: [20.0, 0.0] },
];

// Generate new event for real-time simulation
export function generateNewEvent(): TelemetryEvent {
  const id = Date.now();
  return generateEvent(id, 5); // Last 5 minutes
}

// Convert events to GeoJSON for map
export function eventsToGeoJSON(events: TelemetryEvent[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: events.map((event) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [event.location.longitude, event.location.latitude],
      },
      properties: {
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
        location: `${event.location.city || event.location.state}, ${event.location.country}`,
        severity: event.severity,
      },
    })),
  };
}

// Filter events by various criteria
export function filterEvents(
  events: TelemetryEvent[],
  filters: {
    eventTypes?: TelemetryEventType[];
    country?: string;
    continent?: string;
    platform?: Platform;
    criticalOnly?: boolean;
    periodMinutes?: number;
  }
): TelemetryEvent[] {
  return events.filter((event) => {
    if (filters.eventTypes?.length && !filters.eventTypes.includes(event.type)) {
      return false;
    }
    if (filters.country && event.location.countryCode !== filters.country) {
      return false;
    }
    if (filters.continent && event.location.continentCode !== filters.continent) {
      return false;
    }
    if (filters.platform && event.source?.platform !== filters.platform) {
      return false;
    }
    if (filters.criticalOnly && event.severity !== "critical") {
      return false;
    }
    if (filters.periodMinutes) {
      const eventTime = new Date(event.timestamp).getTime();
      const cutoff = Date.now() - filters.periodMinutes * 60 * 1000;
      if (eventTime < cutoff) {
        return false;
      }
    }
    return true;
  });
}
