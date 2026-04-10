// Telemetry components - Modular and reusable
// Compatible with Seumei and Matriz

export { TelemetryGeoPage } from "./telemetry-geo-page";
export { TelemetryGeoHeader } from "./telemetry-geo-header";
export { TelemetryGeoSidebar } from "./telemetry-geo-sidebar";
export { TelemetryGeoFilters } from "./telemetry-geo-filters";
export { TelemetryGeoRanking } from "./telemetry-geo-ranking";
export { TelemetryGeoDrilldown } from "./telemetry-geo-drilldown";
export { TelemetryEventFeed } from "./telemetry-event-feed";
export { TelemetryFeedItem } from "./telemetry-feed-item";
export { TelemetryNetworkPanel } from "./telemetry-network-panel";
export { TelemetryDataView } from "./telemetry-data-view";
export {
  TelemetryEmptyState,
  TelemetryLoadingState,
  TelemetryErrorState,
  TelemetryConnectionStatus,
  TelemetryFeedSkeleton,
  TelemetryRankingSkeleton,
  TelemetryHeaderSkeleton,
} from "./telemetry-states";

// Re-export types for package consumers
export type {
  TelemetryEvent,
  TelemetryFilters,
  TelemetryRanking,
  TelemetrySummary,
  TelemetryEventType,
  TelemetryPageConfig,
  TelemetryLocation,
  TelemetrySource,
  TelemetryTenant,
  TelemetryGroup,
  TelemetryOrganization,
  RankingType,
  GeoLevel,
  Platform,
  Severity,
  DeviceType,
  GeoAggregation,
} from "@/lib/telemetry/types";

// Re-export utilities
export {
  getEventTypeLabel,
  getEventTypeColor,
  formatRelativeTime,
  getZoomForGeoLevel,
  formatNumber,
} from "@/lib/telemetry/utils";

// Re-export mock data for development
export {
  mockEvents,
  mockSummary,
  mockCountryRankings,
  mockCityRankings,
  mockGroupRankings,
  mockOrganizationRankings,
  mockTenantRankings,
  mockWorkspaceRankings,
  mockEnvironmentRankings,
  eventsToGeoJSON,
  generateNewEvent,
  filterEvents,
} from "@/lib/telemetry/mock-data";

// Re-export map components and presets
export {
  Map,
  MapControls,
  MapClusterLayer,
  MapHeatmapLayer,
  MapPopup,
  HEATMAP_PRESETS,
  type HeatmapPreset,
} from "@/components/ui/map";
