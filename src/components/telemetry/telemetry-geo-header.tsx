"use client";

import { Activity, Globe, MapPin, TrendingUp, Users, Zap, Download } from "lucide-react";
import type { TelemetrySummary } from "@/lib/telemetry/types";
import { formatNumber, formatTrend } from "@/lib/telemetry/utils";
import { cn } from "@/lib/utils";

type TelemetryGeoHeaderProps = {
  summary: TelemetrySummary;
  className?: string;
};

function MetricCard({
  label,
  value,
  trend,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string | number;
  trend?: number;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
        highlight
          ? "bg-emerald-500/10 dark:bg-emerald-500/20"
          : "bg-muted/50 hover:bg-muted"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          highlight
            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : "bg-background text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tabular-nums">
            {typeof value === "number" ? formatNumber(value) : value}
          </span>
          {trend !== undefined && (
            <span
              className={cn(
                "text-xs font-medium",
                trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
              )}
            >
              {formatTrend(trend)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function TelemetryGeoHeader({ summary, className }: TelemetryGeoHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Telemetria Global</h1>
            <p className="text-sm text-muted-foreground">
              Monitoramento geografico em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {summary.liveNow} ao vivo
          </div>
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          label="Total de Eventos"
          value={summary.totalEvents}
          trend={summary.trend}
          icon={Activity}
        />
        <MetricCard
          label="Logins"
          value={summary.logins}
          icon={Users}
        />
        <MetricCard
          label="Instalacoes"
          value={summary.installs}
          icon={Zap}
        />
        <MetricCard
          label="Paises Ativos"
          value={summary.activeCountries}
          icon={Globe}
        />
        <MetricCard
          label="Cidades Ativas"
          value={summary.activeCities}
          icon={MapPin}
        />
        <MetricCard
          label="Maior Concentracao"
          value={summary.topLocation.name.split(",")[0]}
          icon={TrendingUp}
          highlight
        />
      </div>
    </header>
  );
}
