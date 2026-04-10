"use client";

import { ChevronRight, Globe, Home } from "lucide-react";
import type { GeoLevel } from "@/lib/telemetry/types";
import { cn } from "@/lib/utils";

type DrilldownLevel = {
  level: GeoLevel;
  name: string;
  code?: string;
};

type TelemetryGeoDrilldownProps = {
  path: DrilldownLevel[];
  onNavigate: (level: GeoLevel, path: DrilldownLevel[]) => void;
  className?: string;
};

export function TelemetryGeoDrilldown({
  path,
  onNavigate,
  className,
}: TelemetryGeoDrilldownProps) {
  const handleNavigate = (index: number) => {
    const newPath = path.slice(0, index + 1);
    const targetLevel = newPath[newPath.length - 1]?.level || "global";
    onNavigate(targetLevel, newPath);
  };

  const handleHome = () => {
    onNavigate("global", [{ level: "global", name: "Global" }]);
  };

  if (path.length <= 1) {
    return null;
  }

  return (
    <nav
      className={cn(
        "flex items-center gap-1 overflow-x-auto px-4 py-2 text-sm",
        className
      )}
      aria-label="Navegacao geografica"
    >
      <button
        type="button"
        onClick={handleHome}
        className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Voltar ao nivel global"
      >
        <Home className="h-3.5 w-3.5" />
      </button>

      {path.map((item, index) => {
        const isLast = index === path.length - 1;

        return (
          <div key={`${item.level}-${item.code || item.name}`} className="flex items-center">
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <button
              type="button"
              onClick={() => handleNavigate(index)}
              disabled={isLast}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 transition-colors",
                isLast
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {index === 0 && <Globe className="h-3.5 w-3.5" />}
              <span className="whitespace-nowrap">{item.name}</span>
              {item.code && (
                <span className="text-xs text-muted-foreground">({item.code})</span>
              )}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
