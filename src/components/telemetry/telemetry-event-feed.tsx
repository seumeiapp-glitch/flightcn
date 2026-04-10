"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Pause, Play, RefreshCw } from "lucide-react";
import type { TelemetryEvent } from "@/lib/telemetry/types";
import { TelemetryFeedItem } from "./telemetry-feed-item";
import { cn } from "@/lib/utils";

type TelemetryEventFeedProps = {
  events: TelemetryEvent[];
  selectedEventId?: string | null;
  onEventSelect?: (event: TelemetryEvent) => void;
  onNewEvent?: (event: TelemetryEvent) => void;
  isLive?: boolean;
  className?: string;
};

export function TelemetryEventFeed({
  events,
  selectedEventId,
  onEventSelect,
  isLive = true,
  className,
}: TelemetryEventFeedProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const prevEventsRef = useRef<TelemetryEvent[]>(events);

  // Track new events for animation
  useEffect(() => {
    const prevIds = new Set(prevEventsRef.current.map((e) => e.id));
    const newIds = events.filter((e) => !prevIds.has(e.id)).map((e) => e.id);

    if (newIds.length > 0) {
      setNewEventIds((prev) => new Set([...prev, ...newIds]));

      // Clear "new" status after animation
      const timer = setTimeout(() => {
        setNewEventIds((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 2000);

      return () => clearTimeout(timer);
    }

    prevEventsRef.current = events;
  }, [events]);

  const handleEventClick = (event: TelemetryEvent) => {
    onEventSelect?.(event);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const displayEvents = isPaused ? prevEventsRef.current : events;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Feed de Eventos</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
            {events.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isLive && (
            <button
              type="button"
              onClick={togglePause}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors",
                isPaused
                  ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {isPaused ? (
                <>
                  <Play className="h-3 w-3" />
                  Pausado
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3" />
                  Pausar
                </>
              )}
            </button>
          )}
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Atualizar"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Events list */}
      <div
        ref={listRef}
        className="custom-scrollbar flex-1 overflow-y-auto"
      >
        {displayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Nenhum evento encontrado
            </p>
            <p className="text-xs text-muted-foreground/70">
              Aguardando novos eventos...
            </p>
          </div>
        ) : (
          displayEvents.map((event) => (
            <TelemetryFeedItem
              key={event.id}
              event={event}
              isSelected={selectedEventId === event.id}
              isNew={newEventIds.has(event.id)}
              onClick={() => handleEventClick(event)}
            />
          ))
        )}
      </div>

      {/* Live indicator */}
      {isLive && !isPaused && (
        <div className="flex items-center justify-center gap-2 border-t bg-muted/30 py-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Recebendo eventos em tempo real
        </div>
      )}
    </div>
  );
}
