"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, BarChart3, Activity, Filter } from "lucide-react";
import type { TelemetryEvent, TelemetryFilters, TelemetryRanking } from "@/lib/telemetry/types";
import { TelemetryEventFeed } from "./telemetry-event-feed";
import { TelemetryGeoFilters } from "./telemetry-geo-filters";
import { TelemetryGeoRanking } from "./telemetry-geo-ranking";
import { cn } from "@/lib/utils";

type SidebarTab = "feed" | "rankings" | "filters";

type TelemetryGeoSidebarProps = {
  events: TelemetryEvent[];
  selectedEventId?: string | null;
  onEventSelect?: (event: TelemetryEvent) => void;
  filters: TelemetryFilters;
  onFiltersChange: (filters: TelemetryFilters) => void;
  countryRankings: TelemetryRanking[];
  cityRankings: TelemetryRanking[];
  onRankingClick?: (ranking: TelemetryRanking, type: "country" | "city") => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
};

export function TelemetryGeoSidebar({
  events,
  selectedEventId,
  onEventSelect,
  filters,
  onFiltersChange,
  countryRankings,
  cityRankings,
  onRankingClick,
  isCollapsed = false,
  onToggleCollapse,
  className,
}: TelemetryGeoSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("feed");

  const tabs: { id: SidebarTab; label: string; icon: React.ElementType }[] = [
    { id: "feed", label: "Feed", icon: Activity },
    { id: "rankings", label: "Rankings", icon: BarChart3 },
    { id: "filters", label: "Filtros", icon: Filter },
  ];

  if (isCollapsed) {
    return (
      <div
        className={cn(
          "flex flex-col items-center border-l bg-background py-4",
          className
        )}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Expandir painel"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="mt-4 flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                onToggleCollapse?.();
              }}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={tab.label}
            >
              <tab.icon className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-[380px] flex-col border-l bg-background",
        className
      )}
    >
      {/* Sidebar header with tabs */}
      <div className="flex items-center justify-between border-b px-2 py-2">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Recolher painel"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "feed" && (
          <TelemetryEventFeed
            events={events}
            selectedEventId={selectedEventId}
            onEventSelect={onEventSelect}
            isLive
          />
        )}

        {activeTab === "rankings" && (
          <div className="custom-scrollbar h-full space-y-6 overflow-y-auto p-4">
            <TelemetryGeoRanking
              title="Top Paises"
              rankings={countryRankings}
              onItemClick={(r) => onRankingClick?.(r, "country")}
              maxItems={8}
            />
            <TelemetryGeoRanking
              title="Top Cidades"
              rankings={cityRankings}
              onItemClick={(r) => onRankingClick?.(r, "city")}
              maxItems={8}
            />
          </div>
        )}

        {activeTab === "filters" && (
          <div className="custom-scrollbar h-full overflow-y-auto">
            <TelemetryGeoFilters
              filters={filters}
              onFiltersChange={onFiltersChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
