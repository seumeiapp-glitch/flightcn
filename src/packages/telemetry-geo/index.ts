/**
 * @seumei/telemetry-geo
 * 
 * Telemetry Geographic Dashboard - A complete, reusable telemetry visualization
 * component featuring global map visualization, heatmaps, real-time event feed,
 * geographic drilldown, and comprehensive analytics.
 * 
 * Designed for both Seumei and Matriz platforms with generic, adaptable types.
 * 
 * @example
 * ```tsx
 * import { TelemetryGeoPage } from '@seumei/telemetry-geo'
 * import type { TelemetryPageConfig } from '@seumei/telemetry-geo/types'
 * 
 * export default function TelemetryDashboard() {
 *   return <TelemetryGeoPage />
 * }
 * ```
 */

// Main page component
export { TelemetryGeoPage } from "@/components/telemetry/telemetry-geo-page";

// Individual components for custom composition
export { TelemetryGeoHeader } from "@/components/telemetry/telemetry-geo-header";
export { TelemetryGeoSidebar } from "@/components/telemetry/telemetry-geo-sidebar";
export { TelemetryGeoDrilldown } from "@/components/telemetry/telemetry-geo-drilldown";
export { TelemetryGeoRanking } from "@/components/telemetry/telemetry-geo-ranking";
export { TelemetryGeoFilters } from "@/components/telemetry/telemetry-geo-filters";
export { TelemetryEventFeed } from "@/components/telemetry/telemetry-event-feed";
export { TelemetryFeedItem } from "@/components/telemetry/telemetry-feed-item";
export {
  TelemetryEmptyState,
  TelemetryLoadingState,
  TelemetryErrorState,
  TelemetryConnectionStatus,
  TelemetryFeedSkeleton,
  TelemetryRankingSkeleton,
  TelemetryHeaderSkeleton,
} from "@/components/telemetry/telemetry-states";

// Map components (from UI library)
export {
  Map,
  MapControls,
  MapClusterLayer,
  MapHeatmapLayer,
  MapPopup,
  MapMarker,
  HEATMAP_PRESETS,
  type HeatmapPreset,
} from "@/components/ui/map";

// Types
export type {
  TelemetryEvent,
  TelemetryEventType,
  TelemetryFilters,
  TelemetryRanking,
  TelemetrySummary,
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

// Utilities
export {
  getEventTypeLabel,
  getEventTypeColor,
  formatRelativeTime,
  getZoomForGeoLevel,
  formatNumber,
} from "@/lib/telemetry/utils";

// Mock data for development/testing
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
