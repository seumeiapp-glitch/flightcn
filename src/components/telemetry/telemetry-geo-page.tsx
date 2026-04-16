"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type MapLibreGL from "maplibre-gl";
import { Globe, Map as MapIcon, Layers, Moon, Sun, Download, Activity, Building2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import {
  Map,
  MapControls,
  MapClusterLayer,
  MapHeatmapLayer,
  MapPopup,
  HEATMAP_PRESETS,
  type HeatmapPreset,
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

type MapProjection = "globe" | "mercator";
type VisualizationMode = "points" | "heatmap" | "both";
type ViewMode = "telemetry" | "network";

// Company color map for heatmap filtering
const COMPANY_COLORS: Record<string, HeatmapPreset> = {
  g1: "blue",    // Grupo Alpha
  g2: "green",   // Grupo Beta
  g3: "orange",  // Grupo Gamma
  g4: "purple",  // Grupo Delta
};

const COMPANY_LIST = [
  { id: "g1", name: "Grupo Alpha", color: "blue" },
  { id: "g2", name: "Grupo Beta", color: "green" },
  { id: "g3", name: "Grupo Gamma", color: "orange" },
  { id: "g4", name: "Grupo Delta", color: "purple" },
];

export function TelemetryGeoPage() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  );
  const mapRef = useRef<MapLibreGL.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapProjection, setMapProjection] = useState<MapProjection>("globe");
  const [vizMode, setVizMode] = useState<VisualizationMode>("both");
  const [viewMode, setViewMode] = useState<ViewMode>("telemetry");
  const [heatmapColor, setHeatmapColor] = useState<HeatmapPreset>("neutral");
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
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

  // Detect map ready via ref polling
  useEffect(() => {
    const checkMapReady = () => {
      if (mapRef.current && mapRef.current.isStyleLoaded()) {
        setMapReady(true);
      }
    };
    checkMapReady();
    const interval = setInterval(checkMapReady, 200);
    return () => clearInterval(interval);
  }, []);

  // Filter events based on current filters + company filter
  const filteredEvents = useMemo(() => {
    let filtered = filterEvents(events, {
      eventTypes: filters.eventTypes.length > 0 ? filters.eventTypes : undefined,
      country: filters.country,
      continent: filters.continent,
      platform: filters.platform,
      criticalOnly: filters.criticalOnly,
    });

    // Apply company filter
    if (companyFilter) {
      filtered = filtered.filter((e) => e.tenant?.groupId === companyFilter);
    }

    // Apply ranking filter if active
    if (activeRankingFilter) {
      switch (activeRankingFilter.type) {
        case "country":
          filtered = filtered.filter((e) => e.location.countryCode === activeRankingFilter.code);
          break;
        case "group":
          filtered = filtered.filter((e) => e.tenant?.groupId === activeRankingFilter.code);
          break;
        case "tenant":
          filtered = filtered.filter((e) => e.tenant?.id === activeRankingFilter.code);
          break;
      }
    }

    return filtered;
  }, [events, filters, activeRankingFilter, companyFilter]);

  // Determine heatmap color based on company filter
  const activeHeatmapColor = useMemo(() => {
    if (companyFilter && COMPANY_COLORS[companyFilter]) {
      return COMPANY_COLORS[companyFilter];
    }
    return heatmapColor;
  }, [companyFilter, heatmapColor]);

  // Convert to GeoJSON for map
  const geoJsonData = useMemo(() => eventsToGeoJSON(filteredEvents), [filteredEvents]);

  // Simulate real-time events
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = generateNewEvent();
      setEvents((prev) => [newEvent, ...prev.slice(0, 99)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Handle map ref assignment
  const handleMapRef = useCallback((map: MapLibreGL.Map | null) => {
    mapRef.current = map;
  }, []);

  // Handle event selection - fly to location
  const handleEventSelect = useCallback((event: TelemetryEvent) => {
    setSelectedEvent(event);
    if (mapRef.current && mapReady) {
      mapRef.current.flyTo({
        center: [event.location.longitude, event.location.latitude],
        zoom: 10,
        duration: 1500,
      });
    }
  }, [mapReady]);

  // Handle cluster point click
  const handlePointClick = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Point>, coordinates: [number, number]) => {
      const eventId = feature.properties?.id;
      const event = events.find((e) => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
        if (mapRef.current && mapReady) {
          mapRef.current.flyTo({
            center: coordinates,
            zoom: Math.max(mapRef.current.getZoom(), 10),
            duration: 1000,
          });
        }
      }
    },
    [events, mapReady]
  );

  // Handle ranking click
  const handleRankingClick = useCallback(
    (ranking: TelemetryRanking, type: RankingType) => {
      setActiveRankingFilter({ type, code: ranking.code, name: ranking.name });

      if (ranking.coordinates && mapRef.current && mapReady) {
        const zoom = type === "country" ? 5 : type === "city" ? 10 : type === "group" || type === "organization" ? 6 : 8;
        mapRef.current.flyTo({ center: ranking.coordinates, zoom, duration: 1500 });
      } else if (type === "country" && mapRef.current && mapReady) {
        const event = events.find((e) => e.location.countryCode === ranking.code);
        if (event) {
          mapRef.current.flyTo({
            center: [event.location.longitude, event.location.latitude],
            zoom: 5,
            duration: 1500,
          });
        }
      }

      if (type === "country") {
        setDrilldownPath([
          { level: "global", name: "Global" },
          { level: "country", name: ranking.name, code: ranking.code },
        ]);
        setFilters((prev) => ({ ...prev, country: ranking.code, geoLevel: "country" }));
      }
    },
    [events, mapReady]
  );

  const handleClearRankingFilter = useCallback(() => setActiveRankingFilter(null), []);

  const handleDrilldownNavigate = useCallback(
    (level: GeoLevel, path: DrilldownLevel[]) => {
      setDrilldownPath(path);
      setActiveRankingFilter(null);
      const zoomLevel = getZoomForGeoLevel(level);

      if (level === "global" && mapRef.current && mapReady) {
        mapRef.current.flyTo({ center: [0, 20], zoom: 1.5, duration: 1500 });
        setFilters((prev) => ({
          ...prev,
          geoLevel: "global",
          continent: undefined,
          country: undefined,
          state: undefined,
          city: undefined,
        }));
      } else if (mapRef.current && mapReady) {
        mapRef.current.zoomTo(zoomLevel, { duration: 1000 });
      }
    },
    [mapReady]
  );

  const handleClosePopup = useCallback(() => setSelectedEvent(null), []);
  const handleToggleProjection = useCallback(() => setMapProjection((prev) => (prev === "globe" ? "mercator" : "globe")), []);
  const handleToggleVizMode = useCallback(() => {
    setVizMode((prev) => (prev === "both" ? "points" : prev === "points" ? "heatmap" : "both"));
  }, []);
  const handleToggleTheme = useCallback(() => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    setIsDark(next);
  }, []);

  // Export PDF function
  const handleExportPDF = useCallback(async () => {
    if (!mapContainerRef.current) return;
    setIsExporting(true);

    try {
      // Capture map screenshot
      const canvas = await html2canvas(mapContainerRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
      });

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Relatorio de Telemetria Geografica Global", 14, 20);

      // Date
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 28);

      // Summary section
      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Resumo Executivo", 14, 40);

      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105);
      const summaryLines = [
        `Total de Eventos: ${mockSummary.totalEvents.toLocaleString()}`,
        `Logins: ${mockSummary.logins.toLocaleString()}`,
        `Instalacoes: ${mockSummary.installs.toLocaleString()}`,
        `Paises Ativos: ${mockSummary.activeCountries}`,
        `Cidades Ativas: ${mockSummary.activeCities}`,
        `Tendencia: ${mockSummary.trend >= 0 ? "+" : ""}${mockSummary.trend}%`,
        `Usuarios ao Vivo: ${mockSummary.liveNow}`,
      ];
      summaryLines.forEach((line, i) => {
        pdf.text(line, 14, 48 + i * 6);
      });

      // Map image
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pageWidth - 28;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 14, 95, imgWidth, Math.min(imgHeight, pageHeight - 110));

      // Page 2: Rankings
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Rankings por Pais", 14, 20);

      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      mockCountryRankings.slice(0, 15).forEach((r, i) => {
        pdf.text(`${i + 1}. ${r.name}: ${r.count.toLocaleString()} eventos (${r.trend >= 0 ? "+" : ""}${r.trend}%)`, 14, 30 + i * 6);
      });

      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Rankings por Empresa", 14, 130);

      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      mockGroupRankings.forEach((r, i) => {
        pdf.text(`${i + 1}. ${r.name}: ${r.count.toLocaleString()} eventos (${r.trend >= 0 ? "+" : ""}${r.trend}%)`, 14, 140 + i * 6);
      });

      // Page 3: Events sample
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Amostra de Eventos Recentes", 14, 20);

      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      filteredEvents.slice(0, 30).forEach((e, i) => {
        const line = `${getEventTypeLabel(e.type)} - ${e.location.city || e.location.country} - ${formatRelativeTime(e.timestamp)}`;
        pdf.text(line, 14, 30 + i * 5);
      });

      pdf.save("telemetria-global-report.pdf");
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setIsExporting(false);
    }
  }, [filteredEvents]);

  // All rankings
  const allRankings = useMemo(() => ({
    countries: mockCountryRankings,
    cities: mockCityRankings,
    groups: mockGroupRankings,
    organizations: mockOrganizationRankings,
    tenants: mockTenantRankings,
    workspaces: mockWorkspaceRankings,
    environments: mockEnvironmentRankings,
  }), []);

  // Network traffic stats (creative addition 1)
  const networkStats = useMemo(() => {
    const byPlatform = filteredEvents.reduce((acc, e) => {
      const p = e.source?.platform || "unknown";
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalBandwidth = filteredEvents.length * 1.2; // Simulated MB
    const avgLatency = Math.round(50 + Math.random() * 100); // Simulated ms

    return { byPlatform, totalBandwidth: totalBandwidth.toFixed(1), avgLatency };
  }, [filteredEvents]);

  return (
    <div className="flex h-screen flex-col bg-telemetry-map-bg">
      {/* Top Navigation Bar with View Mode Toggle */}
      <div className="flex items-center justify-between border-b border-telemetry-panel-border bg-telemetry-panel px-4 py-2">
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setViewMode("telemetry")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              viewMode === "telemetry"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Globe className="h-4 w-4" />
            Telemetria Global
          </button>
          <button
            type="button"
            onClick={() => setViewMode("network")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              viewMode === "network"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Activity className="h-4 w-4" />
            Network Traffic
          </button>
        </div>

        {/* Company Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <select
              value={companyFilter || ""}
              onChange={(e) => setCompanyFilter(e.target.value || null)}
              className="rounded-md border border-telemetry-panel-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todas as empresas</option>
              {COMPANY_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-md border border-telemetry-panel-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exportando..." : "Exportar PDF"}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-telemetry-panel-border bg-background transition-colors hover:bg-muted"
            title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-yellow-500" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* Header */}
      <TelemetryGeoHeader summary={mockSummary} />

      {/* Network Traffic View (Creative Addition 1) */}
      {viewMode === "network" && (
        <div className="border-b border-telemetry-panel-border bg-telemetry-panel px-4 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <Activity className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Bandwidth Total</div>
                <div className="text-sm font-semibold">{networkStats.totalBandwidth} MB</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <Globe className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Latencia Media</div>
                <div className="text-sm font-semibold">{networkStats.avgLatency} ms</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {Object.entries(networkStats.byPlatform).map(([platform, count]) => (
                <div key={platform} className="text-center">
                  <div className="text-xs text-muted-foreground capitalize">{platform}</div>
                  <div className="text-sm font-semibold">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Drilldown breadcrumb */}
      {(drilldownPath.length > 1 || activeRankingFilter || companyFilter) && (
        <div className="flex items-center gap-2 border-b border-telemetry-panel-border bg-telemetry-panel px-4 py-2">
          {drilldownPath.length > 1 && (
            <TelemetryGeoDrilldown path={drilldownPath} onNavigate={handleDrilldownNavigate} />
          )}
          {companyFilter && (
            <div className="flex items-center gap-2 rounded-md bg-telemetry-feed-item-selected px-3 py-1 text-sm">
              <span className="text-muted-foreground">Empresa:</span>
              <span className="font-medium">{COMPANY_LIST.find((c) => c.id === companyFilter)?.name}</span>
              <button type="button" onClick={() => setCompanyFilter(null)} className="ml-1 rounded p-0.5 hover:bg-muted">
                <span className="sr-only">Remover filtro</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {activeRankingFilter && (
            <div className="flex items-center gap-2 rounded-md bg-telemetry-feed-item-selected px-3 py-1 text-sm">
              <span className="text-muted-foreground">Filtro:</span>
              <span className="font-medium">{activeRankingFilter.name}</span>
              <button type="button" onClick={handleClearRankingFilter} className="ml-1 rounded p-0.5 hover:bg-muted">
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
        <div ref={mapContainerRef} className="relative flex-1">
          <Map ref={handleMapRef} center={[0, 20]} zoom={1.5} projection={{ type: mapProjection }}>
            {/* Heatmap layer */}
            {(vizMode === "heatmap" || vizMode === "both") && (
              <MapHeatmapLayer
                data={geoJsonData}
                radius={25}
                intensity={0.8}
                opacity={vizMode === "both" ? 0.4 : 0.65}
                colorGradient={activeHeatmapColor}
                maxZoom={12}
              />
            )}

            {/* Event clusters/points */}
            {(vizMode === "points" || vizMode === "both") && (
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
                pointColor="var(--telemetry-point-default)"
                onPointClick={handlePointClick}
              />
            )}

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
                      style={{ backgroundColor: getEventTypeColor(selectedEvent.type) }}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {getEventTypeLabel(selectedEvent.type)}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatRelativeTime(selectedEvent.timestamp)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {selectedEvent.location.city && <span>{selectedEvent.location.city}, </span>}
                    {selectedEvent.location.state && <span>{selectedEvent.location.state}, </span>}
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
                      {selectedEvent.source.browser && <span>• {selectedEvent.source.browser}</span>}
                    </div>
                  )}
                </div>
              </MapPopup>
            )}

            <MapControls position="bottom-right" showZoom showCompass showFullscreen />
          </Map>

          {/* Map loading overlay */}
          {!mapReady && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-telemetry-overlay-bg">
              <TelemetryLoadingState message="Carregando mapa..." />
            </div>
          )}

          {/* Map visualization controls - moved up to avoid collision */}
          <div className="absolute bottom-36 right-3 z-10 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleToggleVizMode}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-telemetry-panel-border bg-telemetry-panel shadow-md transition-colors hover:bg-telemetry-feed-item-hover"
              title={vizMode === "both" ? "Apenas pontos" : vizMode === "points" ? "Apenas heatmap" : "Pontos + heatmap"}
            >
              <Layers className={cn("h-5 w-5", vizMode === "both" ? "text-primary" : "text-muted-foreground")} />
            </button>
            <button
              type="button"
              onClick={handleToggleProjection}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-telemetry-panel-border bg-telemetry-panel shadow-md transition-colors hover:bg-telemetry-feed-item-hover"
              title={mapProjection === "globe" ? "Mapa plano" : "Globo 3D"}
            >
              {mapProjection === "globe" ? (
                <MapIcon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Globe className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Map legend */}
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            <div className="rounded-lg border border-telemetry-panel-border bg-telemetry-panel/95 px-3 py-2 text-xs backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="font-medium text-muted-foreground">Visualizacao:</span>
                <div className="flex items-center gap-2">
                  {(vizMode === "points" || vizMode === "both") && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-telemetry-point-default" />
                      <span>Pontos</span>
                    </span>
                  )}
                  {(vizMode === "heatmap" || vizMode === "both") && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-4 rounded bg-gradient-to-r from-telemetry-heatmap-low via-telemetry-heatmap-medium to-telemetry-heatmap-high" />
                      <span>Densidade</span>
                    </span>
                  )}
                </div>
              </div>
              {companyFilter && (
                <div className="mt-1 flex items-center gap-2 border-t border-telemetry-panel-border pt-1">
                  <span className="text-muted-foreground">Cor:</span>
                  <span className="capitalize">{COMPANY_COLORS[companyFilter]}</span>
                </div>
              )}
            </div>

            {/* Creative Addition 2: Live Activity Indicator */}
            <div className="rounded-lg border border-telemetry-panel-border bg-telemetry-panel/95 px-3 py-2 text-xs backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {mockSummary.liveNow} usuarios ativos agora
                </span>
              </div>
              <div className="mt-1 text-muted-foreground">
                Ultimo evento: {formatRelativeTime(filteredEvents[0]?.timestamp || new Date().toISOString())}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
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
