"use client";

import { useState } from "react";
import {
  ChevronDown,
  Globe,
  LogIn,
  Download,
  Activity,
  UserPlus,
  RotateCcw,
  Zap,
  Play,
  ArrowUpCircle,
  Smartphone,
  Monitor,
  Tablet,
  Code,
  MapPin,
  Clock,
  Building2,
  Copy,
  ExternalLink,
  Filter,
} from "lucide-react";
import type { TelemetryEvent } from "@/lib/telemetry/types";
import {
  formatRelativeTime,
  getEventTypeLabel,
  getEventTypeColor,
  getSeverityColor,
} from "@/lib/telemetry/utils";
import { cn } from "@/lib/utils";

type TelemetryFeedItemProps = {
  event: TelemetryEvent;
  isSelected?: boolean;
  isNew?: boolean;
  onClick?: () => void;
};

const eventIcons: Record<string, React.ElementType> = {
  login: LogIn,
  install: Download,
  access: Globe,
  session_start: Play,
  first_access: Zap,
  return: RotateCcw,
  activity: Activity,
  signup: UserPlus,
  upgrade: ArrowUpCircle,
};

const deviceIcons: Record<string, React.ElementType> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  unknown: Globe,
};

const platformIcons: Record<string, React.ElementType> = {
  web: Globe,
  ios: Smartphone,
  android: Smartphone,
  desktop: Monitor,
  api: Code,
};

export function TelemetryFeedItem({
  event,
  isSelected = false,
  isNew = false,
  onClick,
}: TelemetryFeedItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const EventIcon = eventIcons[event.type] || Activity;
  const DeviceIcon = deviceIcons[event.source?.device || "unknown"];
  const PlatformIcon = platformIcons[event.source?.platform || "web"];
  const eventColor = getEventTypeColor(event.type);
  const severityColor = getSeverityColor(event.severity);

  const locationText = event.location.city
    ? `${event.location.city}, ${event.location.countryCode}`
    : `${event.location.state || event.location.country}`;

  const handleClick = () => {
    onClick?.();
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={cn(
        "group relative border-b border-telemetry-panel-border bg-telemetry-feed-item transition-all duration-200",
        isSelected
          ? "bg-telemetry-feed-item-selected"
          : "hover:bg-telemetry-feed-item-hover",
        isNew && "animate-in slide-in-from-top-2 fade-in duration-300"
      )}
    >
      {/* Severity indicator */}
      {event.severity && (
        <div
          className="absolute left-0 top-0 h-full w-1"
          style={{ backgroundColor: severityColor }}
        />
      )}

      {/* Main row */}
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
      >
        {/* Event icon */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${eventColor}20` }}
        >
          <EventIcon className="h-4 w-4" style={{ color: eventColor }} />
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{getEventTypeLabel(event.type)}</span>
            {event.tenant && (
              <span className="truncate rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {event.tenant.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{locationText}</span>
            <span className="text-muted-foreground/50">·</span>
            <span>{formatRelativeTime(event.timestamp)}</span>
          </div>
        </div>

        {/* Platform/Device indicator */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <PlatformIcon className="h-3.5 w-3.5" />
          {event.source?.device && event.source.device !== "unknown" && (
            <DeviceIcon className="h-3.5 w-3.5" />
          )}
        </div>

        {/* Expand button */}
        <button
          type="button"
          onClick={handleExpand}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
            isExpanded && "rotate-180"
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-telemetry-panel-border bg-telemetry-feed-bg px-4 py-3">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            {/* Location details */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Localizacao
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pais</span>
                  <span>{event.location.country}</span>
                </div>
                {event.location.state && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado</span>
                    <span>{event.location.state}</span>
                  </div>
                )}
                {event.location.city && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cidade</span>
                    <span>{event.location.city}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coordenadas</span>
                  <span className="font-mono text-[10px]">
                    {event.location.latitude.toFixed(4)}, {event.location.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Technical details */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium text-muted-foreground">
                <Monitor className="h-3.5 w-3.5" />
                Detalhes Tecnicos
              </h4>
              <div className="space-y-1 text-xs">
                {event.source?.platform && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plataforma</span>
                    <span className="capitalize">{event.source.platform}</span>
                  </div>
                )}
                {event.source?.device && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dispositivo</span>
                    <span className="capitalize">{event.source.device}</span>
                  </div>
                )}
                {event.source?.browser && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Navegador</span>
                    <span>{event.source.browser}</span>
                  </div>
                )}
                {event.source?.os && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sistema</span>
                    <span>{event.source.os}</span>
                  </div>
                )}
                {event.source?.ipMasked && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IP</span>
                    <span className="font-mono">{event.source.ipMasked}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tenant/Workspace */}
            {event.tenant && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 font-medium text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  Organizacao
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tenant</span>
                    <span>{event.tenant.name}</span>
                  </div>
                  {event.tenant.workspace && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Workspace</span>
                      <span>{event.tenant.workspace}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Tempo
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data/Hora</span>
                  <span>
                    {new Date(event.timestamp).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "medium",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Relativo</span>
                  <span>{formatRelativeTime(event.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-telemetry-panel-border pt-3">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md bg-telemetry-feed-item px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-telemetry-feed-item-hover hover:text-foreground"
            >
              <Filter className="h-3 w-3" />
              Filtrar similares
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md bg-telemetry-feed-item px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-telemetry-feed-item-hover hover:text-foreground"
            >
              <Copy className="h-3 w-3" />
              Copiar dados
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md bg-telemetry-feed-item px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-telemetry-feed-item-hover hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              Abrir entidade
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
