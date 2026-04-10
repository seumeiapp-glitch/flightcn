"use client";

import { Clock, Filter, Globe, Layers, Smartphone, X } from "lucide-react";
import type { TelemetryFilters, GeoLevel, TelemetryEventType, Platform } from "@/lib/telemetry/types";
import { getEventTypeLabel, getGeoLevelLabel } from "@/lib/telemetry/utils";
import { cn } from "@/lib/utils";

type TelemetryGeoFiltersProps = {
  filters: TelemetryFilters;
  onFiltersChange: (filters: TelemetryFilters) => void;
  className?: string;
};

const periodOptions: { value: TelemetryFilters["period"]; label: string }[] = [
  { value: "1h", label: "1 hora" },
  { value: "24h", label: "24 horas" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
];

const geoLevelOptions: GeoLevel[] = ["global", "continent", "country", "state", "city"];

const eventTypeOptions: TelemetryEventType[] = [
  "login", "install", "access", "session_start", "first_access", "return", "signup", "upgrade"
];

const platformOptions: { value: Platform; label: string }[] = [
  { value: "web", label: "Web" },
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
  { value: "desktop", label: "Desktop" },
  { value: "api", label: "API" },
];

function FilterPill({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

export function TelemetryGeoFilters({
  filters,
  onFiltersChange,
  className,
}: TelemetryGeoFiltersProps) {
  const activeFiltersCount = [
    filters.eventTypes.length > 0,
    filters.platform,
    filters.continent,
    filters.country,
    filters.liveOnly,
    filters.criticalOnly,
  ].filter(Boolean).length;

  const updateFilters = (updates: Partial<TelemetryFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onFiltersChange({
      period: "24h",
      eventTypes: [],
      geoLevel: "global",
      liveOnly: false,
      criticalOnly: false,
    });
  };

  const toggleEventType = (type: TelemetryEventType) => {
    const newTypes = filters.eventTypes.includes(type)
      ? filters.eventTypes.filter((t) => t !== type)
      : [...filters.eventTypes, type];
    updateFilters({ eventTypes: newTypes });
  };

  return (
    <div className={cn("space-y-4 border-b bg-muted/30 px-4 py-4", className)}>
      {/* Filter header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Limpar
          </button>
        )}
      </div>

      {/* Period filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Periodo
        </div>
        <div className="flex flex-wrap gap-1.5">
          {periodOptions.map((option) => (
            <FilterPill
              key={option.value}
              label={option.label}
              isActive={filters.period === option.value}
              onClick={() => updateFilters({ period: option.value })}
            />
          ))}
        </div>
      </div>

      {/* Geo level filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          Nivel Geografico
        </div>
        <div className="flex flex-wrap gap-1.5">
          {geoLevelOptions.map((level) => (
            <FilterPill
              key={level}
              label={getGeoLevelLabel(level)}
              isActive={filters.geoLevel === level}
              onClick={() => updateFilters({ geoLevel: level })}
            />
          ))}
        </div>
      </div>

      {/* Event type filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5" />
          Tipo de Evento
        </div>
        <div className="flex flex-wrap gap-1.5">
          {eventTypeOptions.map((type) => (
            <FilterPill
              key={type}
              label={getEventTypeLabel(type)}
              isActive={filters.eventTypes.includes(type)}
              onClick={() => toggleEventType(type)}
            />
          ))}
        </div>
      </div>

      {/* Platform filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Smartphone className="h-3.5 w-3.5" />
          Plataforma
        </div>
        <div className="flex flex-wrap gap-1.5">
          {platformOptions.map((option) => (
            <FilterPill
              key={option.value}
              label={option.label}
              isActive={filters.platform === option.value}
              onClick={() =>
                updateFilters({
                  platform: filters.platform === option.value ? undefined : option.value,
                })
              }
            />
          ))}
        </div>
      </div>

      {/* Quick toggles */}
      <div className="flex gap-4 border-t pt-3">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={filters.liveOnly}
            onChange={(e) => updateFilters({ liveOnly: e.target.checked })}
            className="h-4 w-4 rounded border-muted-foreground/25 accent-primary"
          />
          <span className="text-xs text-muted-foreground">Apenas tempo real</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={filters.criticalOnly}
            onChange={(e) => updateFilters({ criticalOnly: e.target.checked })}
            className="h-4 w-4 rounded border-muted-foreground/25 accent-primary"
          />
          <span className="text-xs text-muted-foreground">Apenas criticos</span>
        </label>
      </div>
    </div>
  );
}
