import type { TelemetryEventType, GeoLevel, Severity } from "./types";

export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "agora";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return time.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function formatTrend(trend: number): string {
  const sign = trend >= 0 ? "+" : "";
  return `${sign}${trend.toFixed(1)}%`;
}

export function getEventTypeLabel(type: TelemetryEventType): string {
  const labels: Record<TelemetryEventType, string> = {
    login: "Login",
    install: "Instalacao",
    access: "Acesso",
    session_start: "Sessao",
    first_access: "Primeiro Acesso",
    return: "Retorno",
    activity: "Atividade",
    signup: "Cadastro",
    upgrade: "Upgrade",
  };
  return labels[type] || type;
}

export function getEventTypeColor(type: TelemetryEventType): string {
  const colors: Record<TelemetryEventType, string> = {
    login: "#3b82f6",
    install: "#22c55e",
    access: "#6366f1",
    session_start: "#8b5cf6",
    first_access: "#f59e0b",
    return: "#14b8a6",
    activity: "#64748b",
    signup: "#ec4899",
    upgrade: "#10b981",
  };
  return colors[type] || "#64748b";
}

export function getSeverityColor(severity?: Severity): string {
  if (!severity) return "transparent";
  const colors: Record<Severity, string> = {
    info: "#3b82f6",
    warning: "#f59e0b",
    critical: "#ef4444",
  };
  return colors[severity];
}

export function getGeoLevelLabel(level: GeoLevel): string {
  const labels: Record<GeoLevel, string> = {
    global: "Global",
    continent: "Continente",
    country: "Pais",
    state: "Estado",
    city: "Cidade",
  };
  return labels[level];
}

export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    web: "globe",
    ios: "smartphone",
    android: "smartphone",
    desktop: "monitor",
    api: "code",
  };
  return icons[platform] || "circle";
}

// Calculate zoom level for geo level
export function getZoomForGeoLevel(level: GeoLevel): number {
  const zooms: Record<GeoLevel, number> = {
    global: 1.5,
    continent: 3,
    country: 5,
    state: 7,
    city: 10,
  };
  return zooms[level];
}

// Get coordinates for geo drilldown
export function getContinentCoordinates(code: string): [number, number] {
  const coords: Record<string, [number, number]> = {
    SA: [-55, -15],
    NA: [-100, 40],
    EU: [10, 50],
    AS: [100, 35],
    OC: [140, -25],
    AF: [20, 0],
  };
  return coords[code] || [0, 0];
}
