"use client";

import { useMemo } from "react";
import {
  Activity,
  Globe,
  Smartphone,
  Monitor,
  Code,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  Clock,
  Server,
} from "lucide-react";
import type { TelemetryEvent } from "@/lib/telemetry/types";
import { formatNumber } from "@/lib/telemetry/utils";
import { cn } from "@/lib/utils";

type NetworkStats = {
  totalBandwidth: number;
  avgLatency: number;
  peakLatency: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
  byPlatform: Record<string, number>;
  byRegion: Record<string, { count: number; latency: number }>;
  byEndpoint: { endpoint: string; count: number; avgTime: number }[];
  timeSeriesData: { time: string; requests: number; errors: number }[];
};

type TelemetryNetworkPanelProps = {
  events: TelemetryEvent[];
  className?: string;
};

function generateNetworkStats(events: TelemetryEvent[]): NetworkStats {
  const byPlatform: Record<string, number> = {};
  const byRegion: Record<string, { count: number; latency: number }> = {};

  for (const e of events) {
    const p = e.source?.platform || "unknown";
    byPlatform[p] = (byPlatform[p] || 0) + 1;

    const region = e.location.continentCode || "unknown";
    if (!byRegion[region]) {
      byRegion[region] = { count: 0, latency: 0 };
    }
    byRegion[region].count += 1;
    byRegion[region].latency += 40 + Math.random() * 120;
  }

  // Average latencies
  for (const region of Object.keys(byRegion)) {
    byRegion[region].latency = Math.round(
      byRegion[region].latency / byRegion[region].count
    );
  }

  // Simulate endpoint data
  const endpoints = [
    { endpoint: "/api/auth/login", count: Math.floor(events.length * 0.25), avgTime: 145 },
    { endpoint: "/api/events/track", count: Math.floor(events.length * 0.35), avgTime: 42 },
    { endpoint: "/api/users/profile", count: Math.floor(events.length * 0.15), avgTime: 89 },
    { endpoint: "/api/analytics/report", count: Math.floor(events.length * 0.12), avgTime: 320 },
    { endpoint: "/api/notifications", count: Math.floor(events.length * 0.08), avgTime: 56 },
    { endpoint: "/api/webhooks", count: Math.floor(events.length * 0.05), avgTime: 78 },
  ];

  // Time series data (last 12 intervals)
  const timeSeriesData = Array.from({ length: 12 }, (_, i) => {
    const time = new Date(Date.now() - (11 - i) * 5 * 60000);
    return {
      time: time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      requests: Math.floor(50 + Math.random() * 150),
      errors: Math.floor(Math.random() * 8),
    };
  });

  return {
    totalBandwidth: events.length * 1.2,
    avgLatency: 50 + Math.random() * 80,
    peakLatency: 150 + Math.random() * 200,
    activeConnections: Math.floor(events.length * 0.6),
    requestsPerMinute: Math.floor(events.length * 2.5),
    errorRate: 0.5 + Math.random() * 2,
    byPlatform,
    byRegion,
    byEndpoint: endpoints,
    timeSeriesData,
  };
}

const platformIcons: Record<string, typeof Globe> = {
  web: Globe,
  ios: Smartphone,
  android: Smartphone,
  desktop: Monitor,
  api: Code,
};

const regionNames: Record<string, string> = {
  SA: "America do Sul",
  NA: "America do Norte",
  EU: "Europa",
  AS: "Asia",
  OC: "Oceania",
  AF: "Africa",
  unknown: "Desconhecido",
};

export function TelemetryNetworkPanel({
  events,
  className,
}: TelemetryNetworkPanelProps) {
  const stats = useMemo(() => generateNetworkStats(events), [events]);

  return (
    <div className={cn("flex flex-col gap-4 p-4", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={Wifi}
          label="Bandwidth"
          value={`${stats.totalBandwidth.toFixed(1)} MB`}
          trend={8.3}
        />
        <StatCard
          icon={Clock}
          label="Latencia Media"
          value={`${stats.avgLatency.toFixed(0)} ms`}
          trend={-2.1}
        />
        <StatCard
          icon={Activity}
          label="Pico Latencia"
          value={`${stats.peakLatency.toFixed(0)} ms`}
          trend={5.4}
        />
        <StatCard
          icon={Server}
          label="Conexoes Ativas"
          value={formatNumber(stats.activeConnections)}
          trend={12.7}
        />
        <StatCard
          icon={TrendingUp}
          label="Req/min"
          value={formatNumber(stats.requestsPerMinute)}
          trend={15.2}
        />
        <StatCard
          icon={TrendingDown}
          label="Taxa de Erro"
          value={`${stats.errorRate.toFixed(2)}%`}
          trend={-0.8}
          invertTrend
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Traffic by Platform */}
        <div className="rounded-lg border border-telemetry-panel-border bg-telemetry-panel p-4">
          <h3 className="mb-3 text-sm font-semibold">Trafego por Plataforma</h3>
          <div className="space-y-3">
            {Object.entries(stats.byPlatform)
              .sort(([, a], [, b]) => b - a)
              .map(([platform, count]) => {
                const Icon = platformIcons[platform] || Globe;
                const total = Object.values(stats.byPlatform).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={platform} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{platform}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Traffic by Region */}
        <div className="rounded-lg border border-telemetry-panel-border bg-telemetry-panel p-4">
          <h3 className="mb-3 text-sm font-semibold">Latencia por Regiao</h3>
          <div className="space-y-2">
            {Object.entries(stats.byRegion)
              .sort(([, a], [, b]) => b.count - a.count)
              .map(([region, data]) => (
                <div
                  key={region}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{regionNames[region] || region}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {data.count} req
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        data.latency < 80
                          ? "text-green-600 dark:text-green-400"
                          : data.latency < 150
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {data.latency} ms
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Top Endpoints */}
        <div className="rounded-lg border border-telemetry-panel-border bg-telemetry-panel p-4">
          <h3 className="mb-3 text-sm font-semibold">Top Endpoints</h3>
          <div className="space-y-2">
            {stats.byEndpoint.map((ep) => (
              <div
                key={ep.endpoint}
                className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
              >
                <code className="text-xs text-muted-foreground">{ep.endpoint}</code>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{ep.count} req</span>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      ep.avgTime < 100
                        ? "text-green-600 dark:text-green-400"
                        : ep.avgTime < 200
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {ep.avgTime} ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time Series Chart (Simple Bar Chart) */}
      <div className="rounded-lg border border-telemetry-panel-border bg-telemetry-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Requests nos ultimos 60 minutos</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Requests</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Erros</span>
            </div>
          </div>
        </div>
        <div className="flex h-32 items-end gap-1">
          {stats.timeSeriesData.map((data, idx) => {
            const maxRequests = Math.max(...stats.timeSeriesData.map((d) => d.requests));
            const requestHeight = maxRequests > 0 ? (data.requests / maxRequests) * 100 : 0;
            const errorHeight = maxRequests > 0 ? (data.errors / maxRequests) * 100 : 0;

            return (
              <div key={idx} className="group relative flex flex-1 flex-col items-center gap-0.5">
                <div className="relative flex w-full flex-1 flex-col justify-end gap-0.5">
                  {data.errors > 0 && (
                    <div
                      className="w-full rounded-t bg-destructive/80 transition-all group-hover:bg-destructive"
                      style={{ height: `${errorHeight}%` }}
                    />
                  )}
                  <div
                    className="w-full rounded-t bg-primary/70 transition-all group-hover:bg-primary"
                    style={{ height: `${requestHeight}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{data.time}</span>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden rounded bg-popover px-2 py-1 text-xs shadow-md group-hover:block">
                  <div>{data.requests} req</div>
                  <div className="text-destructive">{data.errors} erros</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connection Table */}
      <div className="rounded-lg border border-telemetry-panel-border bg-telemetry-panel p-4">
        <h3 className="mb-3 text-sm font-semibold">Conexoes Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-telemetry-panel-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Tipo</th>
                <th className="pb-2 pr-4">Plataforma</th>
                <th className="pb-2 pr-4">Regiao</th>
                <th className="pb-2 pr-4">Latencia</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 8).map((event, idx) => {
                const latency = Math.floor(30 + Math.random() * 150);
                const status = Math.random() > 0.1 ? "success" : "error";

                return (
                  <tr key={event.id} className="border-b border-telemetry-panel-border/50 last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                      {event.id.slice(0, 12)}...
                    </td>
                    <td className="py-2 pr-4 capitalize">{event.type}</td>
                    <td className="py-2 pr-4 capitalize">{event.source?.platform || "unknown"}</td>
                    <td className="py-2 pr-4">{event.location.country}</td>
                    <td
                      className={cn(
                        "py-2 pr-4 font-medium",
                        latency < 80
                          ? "text-green-600 dark:text-green-400"
                          : latency < 150
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {latency} ms
                    </td>
                    <td className="py-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          status === "success"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}
                      >
                        {status === "success" ? "OK" : "Erro"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  invertTrend = false,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  trend: number;
  invertTrend?: boolean;
}) {
  const isPositive = invertTrend ? trend < 0 : trend > 0;
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="rounded-lg border border-telemetry-panel-border bg-telemetry-panel p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
        <div
          className={cn(
            "flex items-center text-xs font-medium",
            isPositive
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          )}
        >
          <TrendIcon className="h-3 w-3" />
          {Math.abs(trend).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
