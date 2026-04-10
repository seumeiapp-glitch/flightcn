"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type MapLibreGL from "maplibre-gl";

import {
  Map,
  MapControls,
  MapClusterLayer,
  MapPopup,
} from "@/components/ui/map";
import type {
  TelemetryEvent,
  TelemetryFilters,
  TelemetryRanking,
  GeoLevel,
  RankingType,
} from "@/lib/telemetry/types";
import {
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
import {
  getEventTypeLabel,
  getEventTypeColor,
  formatRelativeTime,
  getZoomForGeoLevel,
} from "@/lib/telemetry/utils";

import { TelemetryGeoHeader } from "./telemetry-geo-header";
import { TelemetryGeoSidebar } from "./telemetry-geo-sidebar";
import { TelemetryGeoDrilldown } from "./telemetry-geo-drilldown";
import {
  TelemetryLoadingState,
  TelemetryErrorState,
} from "./telemetry-states";
import { cn } from "@/lib/utils";

type DrilldownLevel = {
  level: GeoLevel;
  name: string;
  code?: string;
};

const defaultFilters: TelemetryFilters = {
  period: "24h",
  eventTypes: [],
  geoLevel: "global",
  liveOnly: false,
  criticalOnly: false,
};

// Map load timeout in ms
const MAP_LOAD_TIMEOUT = 15000;

export function TelemetryGeoPage() {
  const mapRef = useRef<MapLibreGL.Map | null>(null);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading");
  const [events, setEvents] = useState<TelemetryEvent[]>(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<TelemetryEvent | null>(null);
  const [filters, setFilters] = useState<TelemetryFilters>(defaultFilters);
  const [activeRankingFilter, setActiveRankingFilter] = useState<{
    type: RankingType;
    code: string;
    name: string;
  } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [drilldownPath, setDrilldownPath] = useState<DrilldownLevel[]>([
    { level: "global", name: "Global" },
  ]);

  // Map load timeout handler
  useEffect(() => {
    if (mapStatus !== "loading") return;

    const timeout = setTimeout(() => {
      if (mapStatus === "loading") {
        setMapStatus("error");
      }
    }, MAP_LOAD_TIMEOUT);

    return () => clearTimeout(timeout);
  }, [mapStatus]);

  // Filter events based on current filters + active ranking
  const filteredEvents = useMemo(() => {
    let filtered = filterEvents(events, {
      eventTypes: filters.eventTypes.length > 0 ? filters.eventTypes : undefined,
      country: filters.country,
      continent: filters.continent,
      platform: filters.platform,
      criticalOnly: filters.criticalOnly,
    });

    // Apply ranking filter if active
    if (activeRankingFilter) {
      switch (activeRankingFilter.type) {
        case "country":
          filtered = filtered.filter(
            (e) => e.location.countryCode === activeRankingFilter.code
          );
          break;
        case "group":
          filtered = filtered.filter(
            (e) => e.tenant?.groupId === activeRankingFilter.code
          );
          break;
        case "tenant":
          filtered = filtered.filter(
            (e) => e.tenant?.id === activeRankingFilter.code
          );
          break;
      }
    }

    return filtered;
  }, [events, filters, activeRankingFilter]);

  // Convert to GeoJSON for map
  const geoJsonData = useMemo(() => {
    return eventsToGeoJSON(filteredEvents);
  }, [filteredEvents]);

  // Simulate real-time events
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = generateNewEvent();
      setEvents((prev) => [newEvent, ...prev.slice(0, 99)]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Handle map load
  const handleMapLoad = useCallback(() => {
    setMapStatus("ready");
  }, []);

  // Handle map ref assignment
  const handleMapRef = useCallback((map: MapLibreGL.Map | null) => {
    mapRef.current = map;
  }, []);

  // Handle event selection - fly to location
  const handleEventSelect = useCallback((event: TelemetryEvent) => {
    setSelectedEvent(event);

    if (mapRef.current && mapStatus === "ready") {
      mapRef.current.flyTo({
        center: [event.location.longitude, event.location.latitude],
        zoom: 10,
        duration: 1500,
      });
    }
  }, [mapStatus]);

  // Handle cluster point click
  const handlePointClick = useCallback(
    (
      feature: GeoJSON.Feature<GeoJSON.Point>,
      coordinates: [number, number]
    ) => {
      const eventId = feature.properties?.id;
      const event = events.find((e) => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
        if (mapRef.current && mapStatus === "ready") {
          mapRef.current.flyTo({
            center: coordinates,
            zoom: Math.max(mapRef.current.getZoom(), 10),
            duration: 1000,
          });
        }
      }
    },
    [events, mapStatus]
  );

  // Handle ranking click - focus map on region and apply filter
  const handleRankingClick = useCallback(
    (ranking: TelemetryRanking, type: RankingType) => {
      // Set active ranking filter
      setActiveRankingFilter({
        type,
        code: ranking.code,
        name: ranking.name,
      });

      // Fly to coordinates if available
      if (ranking.coordinates && mapRef.current && mapStatus === "ready") {
        const zoom =
          type === "country" ? 5 :
          type === "city" ? 10 :
          type === "group" || type === "organization" ? 6 :
          8;

        mapRef.current.flyTo({
          center: ranking.coordinates,
          zoom,
          duration: 1500,
        });
      } else if (type === "country" && mapRef.current && mapStatus === "ready") {
        // Fallback: find first event in that region
        const event = events.find(
          (e) => e.location.countryCode === ranking.code
        );
        if (event) {
          mapRef.current.flyTo({
            center: [event.location.longitude, event.location.latitude],
            zoom: 5,
            duration: 1500,
          });
        }
      }

      // Update drilldown path for geo types
      if (type === "country") {
        setDrilldownPath([
          { level: "global", name: "Global" },
          { level: "country", name: ranking.name, code: ranking.code },
        ]);
        setFilters((prev) => ({ ...prev, country: ranking.code, geoLevel: "country" }));
      }
    },
    [events, mapStatus]
  );

  // Clear ranking filter
  const handleClearRankingFilter = useCallback(() => {
    setActiveRankingFilter(null);
  }, []);

  // Handle drilldown navigation
  const handleDrilldownNavigate = useCallback(
    (level: GeoLevel, path: DrilldownLevel[]) => {
      setDrilldownPath(path);
      setActiveRankingFilter(null);

      const zoomLevel = getZoomForGeoLevel(level);

      if (level === "global" && mapRef.current && mapStatus === "ready") {
        mapRef.current.flyTo({
          center: [0, 20],
          zoom: 1.5,
          duration: 1500,
        });
        setFilters((prev) => ({
          ...prev,
          geoLevel: "global",
          continent: undefined,
          country: undefined,
          state: undefined,
          city: undefined,
        }));
      } else if (mapRef.current && mapStatus === "ready") {
        mapRef.current.zoomTo(zoomLevel, { duration: 1000 });
      }
    },
    [mapStatus]
  );

  // Close popup
  const handleClosePopup = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  // Retry map load
  const handleRetryMap = useCallback(() => {
    setMapStatus("loading");
  }, []);

  // All rankings organized by type
  const allRankings = useMemo(() => ({
    countries: mockCountryRankings,
    cities: mockCityRankings,
    groups: mockGroupRankings,
    organizations: mockOrganizationRankings,
    tenants: mockTenantRankings,
    workspaces: mockWorkspaceRankings,
    environments: mockEnvironmentRankings,
  }), []);

  return (
    <div className="flex h-screen flex-col bg-telemetry-map-bg">
      {/* Header */}
      <TelemetryGeoHeader summary={mockSummary} />

      {/* Drilldown breadcrumb + active filter indicator */}
      {(drilldownPath.length > 1 || activeRankingFilter) && (
        <div className="flex items-center gap-2 border-b border-telemetry-panel-border bg-telemetry-panel px-4 py-2">
          {drilldownPath.length > 1 && (
            <TelemetryGeoDrilldown
              path={drilldownPath}
              onNavigate={handleDrilldownNavigate}
            />
          )}
          {activeRankingFilter && (
            <div className="flex items-center gap-2 rounded-md bg-telemetry-feed-item-selected px-3 py-1 text-sm">
              <span className="text-muted-foreground">Filtro:</span>
              <span className="font-medium">{activeRankingFilter.name}</span>
              <button
                type="button"
                onClick={handleClearRankingFilter}
                className="ml-1 rounded p-0.5 hover:bg-muted"
              >
                <span className="sr-only">Remover filtro</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="relative flex-1">
          {mapStatus === "error" ? (
            <div className="flex h-full items-center justify-center bg-telemetry-map-bg">
              <TelemetryErrorState
                title="Erro ao carregar mapa"
                message="Nao foi possivel carregar o mapa. Verifique sua conexao e tente novamente."
                onRetry={handleRetryMap}
              />
            </div>
          ) : (
            <Map
              ref={handleMapRef}
              center={[0, 20]}
              zoom={1.5}
              projection={{ type: "globe" }}
              onLoad={handleMapLoad}
            >
              {mapStatus === "ready" && (
                <>
                  {/* Event clusters */}
                  <MapClusterLayer
                    data={geoJsonData}
                    clusterRadius={60}
                    clusterMaxZoom={12}
                    clusterColors={[
                      "var(--telemetry-cluster-small)",
                      "var(--telemetry-cluster-medium)",
                      "var(--telemetry-cluster-large)",
                    ]}
                    clusterThresholds={[10, 50]}
                    pointColor="var(--telemetry-marker-primary)"
                    onPointClick={handlePointClick}
                  />

                  {/* Selected event popup */}
                  {selectedEvent && (
                    <MapPopup
                      longitude={selectedEvent.location.longitude}
                      latitude={selectedEvent.location.latitude}
                      onClose={handleClosePopup}
                      closeButton
                      offset={20}
                    >
                      <div className="min-w-[220px] rounded-lg border border-telemetry-popup-border bg-telemetry-popup-bg p-3 shadow-lg">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: getEventTypeColor(selectedEvent.type),
                            }}
                          />
                          <span className="text-sm font-medium text-foreground">
                            {getEventTypeLabel(selectedEvent.type)}
                          </span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {formatRelativeTime(selectedEvent.timestamp)}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {selectedEvent.location.city && (
                            <span>{selectedEvent.location.city}, </span>
                          )}
                          {selectedEvent.location.state && (
                            <span>{selectedEvent.location.state}, </span>
                          )}
                          <span>{selectedEvent.location.country}</span>
                        </div>
                        {selectedEvent.tenant && (
                          <div className="mt-2 rounded bg-muted px-2 py-1 text-xs">
                            <span className="text-muted-foreground">Tenant: </span>
                            <span className="font-medium">{selectedEvent.tenant.name}</span>
                            {selectedEvent.tenant.groupName && (
                              <span className="text-muted-foreground"> ({selectedEvent.tenant.groupName})</span>
                            )}
                          </div>
                        )}
                        {selectedEvent.source && (
                          <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                            <span>{selectedEvent.source.platform}</span>
                            {selectedEvent.source.browser && (
                              <span>• {selectedEvent.source.browser}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </MapPopup>
                  )}

                  {/* Map controls */}
                  <MapControls
                    position="bottom-right"
                    showZoom
                    showCompass
                    showFullscreen
                  />
                </>
              )}
            </Map>
          )}

          {/* Map loading overlay - shows only while loading, not blocking sidebar */}
          {mapStatus === "loading" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-telemetry-overlay-bg">
              <TelemetryLoadingState message="Carregando mapa..." />
            </div>
          )}

          {/* Active filters indicator on map */}
          {mapStatus === "ready" && (filters.eventTypes.length > 0 ||
            filters.country ||
            filters.criticalOnly ||
            activeRankingFilter) && (
            <div className="absolute left-4 top-4 rounded-lg border border-telemetry-panel-border bg-telemetry-panel/95 px-3 py-2 text-xs backdrop-blur-sm">
              <span className="font-medium">Filtros ativos: </span>
              {filters.eventTypes.length > 0 && (
                <span className="text-muted-foreground">
                  {filters.eventTypes.length} tipo(s)
                </span>
              )}
              {filters.country && (
                <span className="ml-2 text-muted-foreground">
                  Pais: {filters.country}
                </span>
              )}
              {activeRankingFilter && (
                <span className="ml-2 text-primary">
                  {activeRankingFilter.name}
                </span>
              )}
              {filters.criticalOnly && (
                <span className="ml-2 text-telemetry-marker-danger">Apenas criticos</span>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - always visible and interactive */}
        <TelemetryGeoSidebar
          events={filteredEvents}
          selectedEventId={selectedEvent?.id}
          onEventSelect={handleEventSelect}
          filters={filters}
          onFiltersChange={setFilters}
          rankings={allRankings}
          activeRankingFilter={activeRankingFilter}
          onRankingClick={handleRankingClick}
          onClearRankingFilter={handleClearRankingFilter}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>
    </div>
  );
}
