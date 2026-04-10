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
} from "@/lib/telemetry/types";
import {
  mockEvents,
  mockSummary,
  mockCountryRankings,
  mockCityRankings,
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
import { TelemetryLoadingState } from "./telemetry-states";
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

export function TelemetryGeoPage() {
  const mapRef = useRef<MapLibreGL.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [events, setEvents] = useState<TelemetryEvent[]>(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<TelemetryEvent | null>(null);
  const [filters, setFilters] = useState<TelemetryFilters>(defaultFilters);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [drilldownPath, setDrilldownPath] = useState<DrilldownLevel[]>([
    { level: "global", name: "Global" },
  ]);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return filterEvents(events, {
      eventTypes: filters.eventTypes.length > 0 ? filters.eventTypes : undefined,
      country: filters.country,
      continent: filters.continent,
      platform: filters.platform,
      criticalOnly: filters.criticalOnly,
    });
  }, [events, filters]);

  // Convert to GeoJSON for map
  const geoJsonData = useMemo(() => {
    return eventsToGeoJSON(filteredEvents);
  }, [filteredEvents]);

  // Simulate real-time events
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = generateNewEvent();
      setEvents((prev) => [newEvent, ...prev.slice(0, 99)]);
    }, 8000); // New event every 8 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle event selection - fly to location
  const handleEventSelect = useCallback((event: TelemetryEvent) => {
    setSelectedEvent(event);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [event.location.longitude, event.location.latitude],
        zoom: 10,
        duration: 1500,
      });
    }
  }, []);

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
        mapRef.current?.flyTo({
          center: coordinates,
          zoom: Math.max(mapRef.current.getZoom(), 10),
          duration: 1000,
        });
      }
    },
    [events]
  );

  // Handle ranking click - focus map on region
  const handleRankingClick = useCallback(
    (ranking: TelemetryRanking, type: "country" | "city") => {
      // Find first event in that region to get coordinates
      const event = events.find((e) =>
        type === "country"
          ? e.location.countryCode === ranking.code
          : e.location.city?.toLowerCase().includes(ranking.name.toLowerCase())
      );

      if (event && mapRef.current) {
        mapRef.current.flyTo({
          center: [event.location.longitude, event.location.latitude],
          zoom: type === "country" ? 5 : 10,
          duration: 1500,
        });
      }

      // Update drilldown path
      if (type === "country") {
        setDrilldownPath([
          { level: "global", name: "Global" },
          { level: "country", name: ranking.name, code: ranking.code },
        ]);
        setFilters((prev) => ({ ...prev, country: ranking.code, geoLevel: "country" }));
      }
    },
    [events]
  );

  // Handle drilldown navigation
  const handleDrilldownNavigate = useCallback(
    (level: GeoLevel, path: DrilldownLevel[]) => {
      setDrilldownPath(path);

      const zoomLevel = getZoomForGeoLevel(level);

      if (level === "global" && mapRef.current) {
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
      } else if (mapRef.current) {
        mapRef.current.zoomTo(zoomLevel, { duration: 1000 });
      }
    },
    []
  );

  // Close popup
  const handleClosePopup = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <TelemetryGeoHeader summary={mockSummary} />

      {/* Drilldown breadcrumb */}
      {drilldownPath.length > 1 && (
        <div className="border-b">
          <TelemetryGeoDrilldown
            path={drilldownPath}
            onNavigate={handleDrilldownNavigate}
          />
        </div>
      )}

      {/* Main content */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="relative flex-1">
          <Map
            ref={mapRef}
            center={[0, 20]}
            zoom={1.5}
            projection={{ type: "globe" }}
            onLoad={() => setIsMapLoaded(true)}
          >
            {isMapLoaded && (
              <>
                {/* Event clusters */}
                <MapClusterLayer
                  data={geoJsonData}
                  clusterRadius={60}
                  clusterMaxZoom={12}
                  clusterColors={["#22c55e", "#f59e0b", "#ef4444"]}
                  clusterThresholds={[10, 50]}
                  pointColor="#3b82f6"
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
                    <div className="min-w-[200px] space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: getEventTypeColor(selectedEvent.type),
                          }}
                        />
                        <span className="text-sm font-medium">
                          {getEventTypeLabel(selectedEvent.type)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(selectedEvent.timestamp)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedEvent.location.city && (
                          <span>{selectedEvent.location.city}, </span>
                        )}
                        {selectedEvent.location.state && (
                          <span>{selectedEvent.location.state}, </span>
                        )}
                        <span>{selectedEvent.location.country}</span>
                      </div>
                      {selectedEvent.tenant && (
                        <div className="rounded bg-muted px-2 py-1 text-xs">
                          {selectedEvent.tenant.name}
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

          {/* Map loading overlay */}
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <TelemetryLoadingState message="Carregando mapa..." />
            </div>
          )}

          {/* Active filters indicator on map */}
          {(filters.eventTypes.length > 0 ||
            filters.country ||
            filters.criticalOnly) && (
            <div className="absolute left-4 top-4 rounded-lg border bg-background/90 px-3 py-2 text-xs backdrop-blur">
              <span className="font-medium">Filtros ativos: </span>
              {filters.eventTypes.length > 0 && (
                <span className="text-muted-foreground">
                  {filters.eventTypes.length} tipo(s)
                </span>
              )}
              {filters.country && (
                <span className="text-muted-foreground ml-2">
                  Pais: {filters.country}
                </span>
              )}
              {filters.criticalOnly && (
                <span className="ml-2 text-red-500">Apenas criticos</span>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <TelemetryGeoSidebar
          events={filteredEvents}
          selectedEventId={selectedEvent?.id}
          onEventSelect={handleEventSelect}
          filters={filters}
          onFiltersChange={setFilters}
          countryRankings={mockCountryRankings}
          cityRankings={mockCityRankings}
          onRankingClick={handleRankingClick}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>
    </div>
  );
}
