// Telemetry Types - Generic for Seumei and Matriz
// Avoids domain-specific naming (no "restaurant", "store", "order")
// Uses generic abstractions: event, access, install, tenant, workspace

export type TelemetryEventType =
  | "login"
  | "install"
  | "access"
  | "session_start"
  | "first_access"
  | "return"
  | "activity"
  | "signup"
  | "upgrade";

export type Platform = "web" | "ios" | "android" | "desktop" | "api";
export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";
export type Severity = "info" | "warning" | "critical";
export type GeoLevel = "global" | "continent" | "country" | "state" | "city";

export type TelemetryLocation = {
  continent: string;
  continentCode: string;
  country: string;
  countryCode: string;
  state?: string;
  stateCode?: string;
  city?: string;
  latitude: number;
  longitude: number;
};

export type TelemetrySource = {
  platform: Platform;
  device: DeviceType;
  browser?: string;
  os?: string;
  ipMasked?: string;
};

export type TelemetryTenant = {
  id: string;
  name: string;
  workspace?: string;
  environment?: string;
};

export type TelemetryEvent = {
  id: string;
  type: TelemetryEventType;
  timestamp: string;
  location: TelemetryLocation;
  source?: TelemetrySource;
  tenant?: TelemetryTenant;
  severity?: Severity;
  metadata?: Record<string, unknown>;
};

export type GeoAggregation = {
  level: GeoLevel;
  name: string;
  code: string;
  count: number;
  trend: number; // percentage change vs previous period
  coordinates: [number, number]; // [lng, lat]
  children?: GeoAggregation[];
};

export type TelemetrySummary = {
  totalEvents: number;
  logins: number;
  installs: number;
  activeCountries: number;
  activeCities: number;
  trend: number; // percentage change vs previous period
  liveNow: number;
  topLocation: {
    name: string;
    count: number;
  };
};

export type TelemetryFilters = {
  period: "1h" | "24h" | "7d" | "30d" | "custom";
  eventTypes: TelemetryEventType[];
  geoLevel: GeoLevel;
  continent?: string;
  country?: string;
  state?: string;
  city?: string;
  tenant?: string;
  platform?: Platform;
  liveOnly: boolean;
  criticalOnly: boolean;
};

export type TelemetryRanking = {
  name: string;
  code: string;
  count: number;
  trend: number;
  isNew?: boolean;
};

// GeoJSON helpers for map integration
export type TelemetryGeoFeature = GeoJSON.Feature<
  GeoJSON.Point,
  {
    id: string;
    type: TelemetryEventType;
    timestamp: string;
    location: string;
    severity?: Severity;
  }
>;

export type TelemetryGeoFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  TelemetryGeoFeature["properties"]
>;
