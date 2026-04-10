"use client";

import { TrendingDown, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import type { TelemetryRanking } from "@/lib/telemetry/types";
import { formatNumber, formatTrend } from "@/lib/telemetry/utils";
import { cn } from "@/lib/utils";

type TelemetryGeoRankingProps = {
  title: string;
  rankings: TelemetryRanking[];
  onItemClick?: (ranking: TelemetryRanking) => void;
  showTrend?: boolean;
  maxItems?: number;
  className?: string;
};

export function TelemetryGeoRanking({
  title,
  rankings,
  onItemClick,
  showTrend = true,
  maxItems = 5,
  className,
}: TelemetryGeoRankingProps) {
  const displayRankings = rankings.slice(0, maxItems);
  const maxCount = Math.max(...displayRankings.map((r) => r.count));

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        {rankings.length > maxItems && (
          <button
            type="button"
            className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Ver todos
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayRankings.map((ranking, index) => {
          const barWidth = (ranking.count / maxCount) * 100;
          const isPositive = ranking.trend >= 0;

          return (
            <button
              key={ranking.code}
              type="button"
              onClick={() => onItemClick?.(ranking)}
              className="group relative w-full overflow-hidden rounded-lg bg-muted/50 transition-colors hover:bg-muted"
            >
              {/* Background bar */}
              <div
                className="absolute inset-y-0 left-0 bg-primary/10 transition-all group-hover:bg-primary/15"
                style={{ width: `${barWidth}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center gap-3 px-3 py-2">
                {/* Rank number */}
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-medium text-muted-foreground">
                  {index + 1}
                </span>

                {/* Name */}
                <span className="flex-1 truncate text-left text-sm font-medium">
                  {ranking.name}
                  {ranking.isNew && (
                    <Sparkles className="ml-1.5 inline-block h-3 w-3 text-amber-500" />
                  )}
                </span>

                {/* Count */}
                <span className="text-sm tabular-nums text-muted-foreground">
                  {formatNumber(ranking.count)}
                </span>

                {/* Trend */}
                {showTrend && (
                  <div
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-medium",
                      isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="tabular-nums">{formatTrend(ranking.trend)}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
