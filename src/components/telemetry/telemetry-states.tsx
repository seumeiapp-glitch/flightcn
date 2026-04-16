"use client";

import { AlertCircle, Globe, Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  type?: "no-events" | "no-results" | "error" | "offline";
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export function TelemetryEmptyState({
  type = "no-events",
  message,
  onRetry,
  className,
}: EmptyStateProps) {
  const config = {
    "no-events": {
      icon: Globe,
      title: "Nenhum evento encontrado",
      description: message || "Aguardando novos eventos de telemetria...",
    },
    "no-results": {
      icon: Globe,
      title: "Nenhum resultado",
      description: message || "Nenhum evento corresponde aos filtros aplicados.",
    },
    error: {
      icon: AlertCircle,
      title: "Erro ao carregar",
      description: message || "Ocorreu um erro ao carregar os dados de telemetria.",
    },
    offline: {
      icon: WifiOff,
      title: "Sem conexao",
      description: message || "Voce esta offline. Reconecte para ver eventos em tempo real.",
    },
  };

  const { icon: Icon, title, description } = config[type];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12 text-center",
        className
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full",
          type === "error" ? "bg-destructive/10" : "bg-muted"
        )}
      >
        <Icon
          className={cn(
            "h-6 w-6",
            type === "error" ? "text-destructive" : "text-muted-foreground"
          )}
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}

type LoadingStateProps = {
  message?: string;
  className?: string;
};

export function TelemetryLoadingState({
  message = "Carregando telemetria...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export function TelemetryErrorState({
  title = "Erro",
  message = "Ocorreu um erro inesperado.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-12 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="max-w-xs text-xs text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}

type ConnectionStatusProps = {
  isConnected: boolean;
  className?: string;
};

export function TelemetryConnectionStatus({
  isConnected,
  className,
}: ConnectionStatusProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
        isConnected
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        className
      )}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          Conectado
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          Reconectando...
        </>
      )}
    </div>
  );
}

// Skeleton loaders
export function TelemetryFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b px-4 py-3"
        >
          <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-36 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function TelemetryRankingSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2"
        >
          <div className="h-5 w-5 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 flex-1 animate-pulse rounded bg-muted" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function TelemetryHeaderSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-48 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
            <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
            <div className="space-y-1.5">
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-12 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
