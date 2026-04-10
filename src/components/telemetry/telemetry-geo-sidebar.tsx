"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Activity,
  Filter,
  Building2,
  Globe,
  X,
} from "lucide-react";
import type {
  TelemetryEvent,
  TelemetryFilters,
  TelemetryRanking,
  RankingType,
} from "@/lib/telemetry/types";
import { TelemetryEventFeed } from "./telemetry-event-feed";
import { TelemetryGeoFilters } from "./telemetry-geo-filters";
import { TelemetryGeoRanking } from "./telemetry-geo-ranking";
import { cn } from "@/lib/utils";

type SidebarTab = "feed" | "geo-rankings" | "org-rankings" | "filters";

type Rankings = {
  countries?: TelemetryRanking[];
  cities?: TelemetryRanking[];
  groups?: TelemetryRanking[];
  organizations?: TelemetryRanking[];
  tenants?: TelemetryRanking[];
  workspaces?: TelemetryRanking[];
  environments?: TelemetryRanking[];
};

type TelemetryGeoSidebarProps = {
  events: TelemetryEvent[];
  selectedEventId?: string | null;
  onEventSelect?: (event: TelemetryEvent) => void;
  filters: TelemetryFilters;
  onFiltersChange: (filters: TelemetryFilters) => void;
  rankings: Rankings;
  activeRankingFilter?: { type: RankingType; code: string; name: string } | null;
  onRankingClick?: (ranking: TelemetryRanking, type: RankingType) => void;
  onClearRankingFilter?: () => void;
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
  rankings,
  activeRankingFilter,
  onRankingClick,
  onClearRankingFilter,
  isCollapsed = false,
  onToggleCollapse,
  className,
}: TelemetryGeoSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("feed");

  const tabs: { id: SidebarTab; label: string; icon: React.ElementType }[] = [
    { id: "feed", label: "Feed", icon: Activity },
    { id: "geo-rankings", label: "Geografia", icon: Globe },
    { id: "org-rankings", label: "Empresas", icon: Building2 },
    { id: "filters", label: "Filtros", icon: Filter },
  ];

  if (isCollapsed) {
    return (
      <div
        className={cn(
          "flex flex-col items-center border-l border-telemetry-panel-border bg-telemetry-panel py-4",
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
        "flex h-full w-[400px] flex-col border-l border-telemetry-panel-border bg-telemetry-panel",
        className
      )}
    >
      {/* Active filter banner */}
      {activeRankingFilter && (
        <div className="flex items-center justify-between border-b border-telemetry-panel-border bg-telemetry-feed-item-selected px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Filtro ativo:</span>
            <span className="font-medium">{activeRankingFilter.name}</span>
          </div>
          <button
            type="button"
            onClick={onClearRankingFilter}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Limpar filtro"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Sidebar header with tabs */}
      <div className="flex items-center justify-between border-b border-telemetry-panel-border px-2 py-2">
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
              <span className="hidden lg:inline">{tab.label}</span>
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

        {activeTab === "geo-rankings" && (
          <div className="custom-scrollbar h-full space-y-6 overflow-y-auto p-4">
            {rankings.countries && rankings.countries.length > 0 && (
              <TelemetryGeoRanking
                title="Top Paises"
                rankings={rankings.countries}
                onItemClick={(r) => onRankingClick?.(r, "country")}
                activeCode={activeRankingFilter?.type === "country" ? activeRankingFilter.code : undefined}
                maxItems={8}
              />
            )}
            {rankings.cities && rankings.cities.length > 0 && (
              <TelemetryGeoRanking
                title="Top Cidades"
                rankings={rankings.cities}
                onItemClick={(r) => onRankingClick?.(r, "city")}
                activeCode={activeRankingFilter?.type === "city" ? activeRankingFilter.code : undefined}
                maxItems={8}
              />
            )}
          </div>
        )}

        {activeTab === "org-rankings" && (
          <div className="custom-scrollbar h-full space-y-6 overflow-y-auto p-4">
            {rankings.groups && rankings.groups.length > 0 && (
              <TelemetryGeoRanking
                title="Grupos (Matriz)"
                rankings={rankings.groups}
                onItemClick={(r) => onRankingClick?.(r, "group")}
                activeCode={activeRankingFilter?.type === "group" ? activeRankingFilter.code : undefined}
                maxItems={6}
              />
            )}
            {rankings.organizations && rankings.organizations.length > 0 && (
              <TelemetryGeoRanking
                title="Empresas"
                rankings={rankings.organizations}
                onItemClick={(r) => onRankingClick?.(r, "organization")}
                activeCode={activeRankingFilter?.type === "organization" ? activeRankingFilter.code : undefined}
                maxItems={6}
              />
            )}
            {rankings.tenants && rankings.tenants.length > 0 && (
              <TelemetryGeoRanking
                title="Tenants (Seumei)"
                rankings={rankings.tenants}
                onItemClick={(r) => onRankingClick?.(r, "tenant")}
                activeCode={activeRankingFilter?.type === "tenant" ? activeRankingFilter.code : undefined}
                maxItems={6}
              />
            )}
            {rankings.workspaces && rankings.workspaces.length > 0 && (
              <TelemetryGeoRanking
                title="Workspaces"
                rankings={rankings.workspaces}
                onItemClick={(r) => onRankingClick?.(r, "workspace")}
                activeCode={activeRankingFilter?.type === "workspace" ? activeRankingFilter.code : undefined}
                maxItems={5}
              />
            )}
            {rankings.environments && rankings.environments.length > 0 && (
              <TelemetryGeoRanking
                title="Environments"
                rankings={rankings.environments}
                onItemClick={(r) => onRankingClick?.(r, "environment")}
                activeCode={activeRankingFilter?.type === "environment" ? activeRankingFilter.code : undefined}
                maxItems={5}
              />
            )}
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
