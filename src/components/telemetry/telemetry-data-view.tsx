"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  MapPin,
  Building2,
  Users,
  Globe,
  ArrowUpRight,
} from "lucide-react";
import type { TelemetryEvent, TelemetryRanking } from "@/lib/telemetry/types";
import {
  getEventTypeLabel,
  getEventTypeColor,
  formatRelativeTime,
  formatNumber,
} from "@/lib/telemetry/utils";
import { cn } from "@/lib/utils";

type TelemetryDataViewProps = {
  events: TelemetryEvent[];
  rankings: {
    countries?: TelemetryRanking[];
    cities?: TelemetryRanking[];
    groups?: TelemetryRanking[];
    organizations?: TelemetryRanking[];
    tenants?: TelemetryRanking[];
  };
};

export function TelemetryDataView({ events, rankings }: TelemetryDataViewProps) {
  // Aggregate data by country, city, and event type
  const aggregations = useMemo(() => {
    const byCountry: Record<string, { count: number; name: string }> = {};
    const byCity: Record<string, { count: number; name: string; country: string }> = {};
    const byEventType: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};

    for (const e of events) {
      // By country
      const countryCode = e.location.countryCode;
      if (!byCountry[countryCode]) {
        byCountry[countryCode] = { count: 0, name: e.location.country };
      }
      byCountry[countryCode].count += 1;

      // By city
      const cityKey = `${e.location.city}-${countryCode}`;
      if (e.location.city && !byCity[cityKey]) {
        byCity[cityKey] = { count: 0, name: e.location.city, country: e.location.country };
      }
      if (e.location.city) {
        byCity[cityKey].count += 1;
      }

      // By event type
      byEventType[e.type] = (byEventType[e.type] || 0) + 1;

      // By platform
      const platform = e.source?.platform || "unknown";
      byPlatform[platform] = (byPlatform[platform] || 0) + 1;
    }

    return { byCountry, byCity, byEventType, byPlatform };
  }, [events]);

  const sortedCountries = useMemo(
    () =>
      Object.entries(aggregations.byCountry)
        .map(([code, data]) => ({ code, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    [aggregations.byCountry]
  );

  const sortedCities = useMemo(
    () =>
      Object.entries(aggregations.byCity)
        .map(([key, data]) => ({ key, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    [aggregations.byCity]
  );

  const sortedEventTypes = useMemo(
    () =>
      Object.entries(aggregations.byEventType)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
    [aggregations.byEventType]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {/* Events by Country */}
      <div className="rounded-lg border border-telemetry-panel-border bg-telemetry-panel p-4">
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Eventos por Pais</h3>
        </div>
        <div className="space-y-2">
          {sortedCountries.map((country) => {
            const total = events.length;
            const percentage = total > 0 ? (country.count / total) * 100 : 0;
            const ranking = rankings.countries?.find((r) => r.code === country.code);

            return (
              <div key={country.code} className="group">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{country.name}</span>
                    {ranking?.isNew && (
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Novo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{country.count}</span>
                    {ranking && (
                      <span
                        className={cn(
                          "flex items-center text-xs",
                          ranking.trend >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {ranking.trend >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(ranking.trend).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Events by City */}
      <div className="rounded-lg border border-telemetry-panel-border bg-telemetry-panel p-4">
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Eventos por Cidade</h3>
        </div>
        <div className="space-y-2">
          {sortedCities.map((city) => {
            const total = events.length;
            const percentage = total > 0 ? (city.count / total) * 100 : 0;

            return (
              <div key={city.key} className="group">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium">{city.name}</span>
                    <span className="text-xs text-muted-foreground">{city.country}</span>
                  </div>
                  <span className="text-muted-foreground">{city.count}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Events by Type */}
      <div className="rounded-lg border border-telemetry-panel-border bg-telemetry-panel p-4">
        <div className="mb-3 flex items-center gap-2">
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Tipos de Evento</h3>
        </div>
        <div className="space-y-2">
          {sortedEventTypes.map(({ type, count }) => {
            const total = events.length;
            const percentage = total > 0 ? (count / total) * 100 : 0;

            return (
              <div key={type} className="group">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: getEventTypeColor(type as never) }}
                    />
                    <span className="font-medium">{getEventTypeLabel(type as never)}</span>
                  </div>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: getEventTypeColor(type as never),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Groups / Organizations */}
      {rankings.groups && rankings.groups.length > 0 && (
        <div className="rounded-lg border border-telemetry-panel-border bg-telemetry-panel p-4">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Grupos</h3>
          </div>
          <div className="space-y-2">
            {rankings.groups.map((group) => {
              const maxCount = Math.max(...(rankings.groups?.map((g) => g.count) || [1]));
              const percentage = maxCount > 0 ? (group.count / maxCount) * 100 : 0;

              return (
                <div key={group.code} className="group">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{group.name}</span>
                      {group.isNew && (
                        <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Novo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{formatNumber(group.count)}</span>
                      <span
                        className={cn(
                          "flex items-center text-xs",
                          group.trend >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {group.trend >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(group.trend).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-orange-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tenants */}
      {rankings.tenants && rankings.tenants.length > 0 && (
        <div className="rounded-lg border border-telemetry-panel-border bg-telemetry-panel p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Tenants</h3>
          </div>
          <div className="space-y-2">
            {rankings.tenants.slice(0, 8).map((tenant) => {
              const maxCount = Math.max(...(rankings.tenants?.map((t) => t.count) || [1]));
              const percentage = maxCount > 0 ? (tenant.count / maxCount) * 100 : 0;

              return (
                <div key={tenant.code} className="group">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{tenant.name}</span>
                      {tenant.parentName && (
                        <span className="text-xs text-muted-foreground">{tenant.parentName}</span>
                      )}
                    </div>
                    <span className="text-muted-foreground">{formatNumber(tenant.count)}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Events Table */}
      <div className="rounded-lg border border-telemetry-panel-border bg-telemetry-panel p-4 lg:col-span-2 xl:col-span-1">
        <h3 className="mb-3 text-sm font-semibold">Eventos Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-telemetry-panel-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4">Tipo</th>
                <th className="pb-2 pr-4">Local</th>
                <th className="pb-2 pr-4">Plataforma</th>
                <th className="pb-2">Tempo</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 10).map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-telemetry-panel-border/50 last:border-0"
                >
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: getEventTypeColor(event.type) }}
                      />
                      <span>{getEventTypeLabel(event.type)}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {event.location.city || event.location.country}
                  </td>
                  <td className="py-2 pr-4 capitalize text-muted-foreground">
                    {event.source?.platform || "-"}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {formatRelativeTime(event.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
