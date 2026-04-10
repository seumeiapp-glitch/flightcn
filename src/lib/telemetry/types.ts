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
  groupId?: string;
  groupName?: string;
};

// Matriz Group (holding/network level)
export type TelemetryGroup = {
  id: string;
  name: string;
  code: string;
  country?: string;
  countryCode?: string;
};

// Organization/Company within Matriz or Seumei
export type TelemetryOrganization = {
  id: string;
  name: string;
  code: string;
  groupId?: string;
  groupName?: string;
  country?: string;
  countryCode?: string;
};

// Ranking types for different entity levels
export type RankingType = 
  | "country" 
  | "city" 
  | "state"
  | "continent"
  | "group" 
  | "organization" 
  | "tenant" 
  | "workspace" 
  | "environment";

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
  // Organization hierarchy filters
  group?: string;
  organization?: string;
  tenant?: string;
  workspace?: string;
  environment?: string;
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
  // For org hierarchy
  type?: RankingType;
  parentCode?: string;
  parentName?: string;
  // Location reference for map focus
  coordinates?: [number, number];
  countryCode?: string;
};

// Props contract for reusable telemetry page
export type TelemetryPageConfig = {
  // Data sources
  events: TelemetryEvent[];
  summary: TelemetrySummary;
  // Rankings by type
  rankings: {
    countries?: TelemetryRanking[];
    cities?: TelemetryRanking[];
    states?: TelemetryRanking[];
    groups?: TelemetryRanking[];
    organizations?: TelemetryRanking[];
    tenants?: TelemetryRanking[];
    workspaces?: TelemetryRanking[];
    environments?: TelemetryRanking[];
  };
  // Feature flags
  features?: {
    showGroupRanking?: boolean;
    showOrgRanking?: boolean;
    showTenantRanking?: boolean;
    showWorkspaceRanking?: boolean;
    showEnvironmentRanking?: boolean;
    enableRealtime?: boolean;
    realtimeIntervalMs?: number;
  };
  // Callbacks
  onEventSelect?: (event: TelemetryEvent) => void;
  onFilterChange?: (filters: TelemetryFilters) => void;
  onRankingClick?: (ranking: TelemetryRanking, type: RankingType) => void;
  onExport?: (format: "csv" | "json") => void;
  // Theme
  mapProjection?: "globe" | "mercator";
  customMarkerColors?: {
    primary?: string;
    success?: string;
    warning?: string;
    danger?: string;
  };
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
