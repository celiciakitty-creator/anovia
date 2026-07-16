"use client";

import Link from "next/link";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui";
import { PAGE_EMPTY_STATES } from "@/data/empty-states";
import {
  formatTimeRange,
  getUpcomingEvents,
  isToday,
} from "@/lib/calendar-utils";
import { formatDueDate } from "@/lib/workspace-utils";
import {
  CALENDAR_EVENT_TYPE_LABELS,
  CALENDAR_EVENT_TYPE_STYLES,
} from "@/types/calendar";
import { cn } from "@/lib/utils";
import type { CalendarDisplayEvent } from "@/types/calendar";

type UpcomingEventsProps = {
  events: CalendarDisplayEvent[];
  onSelectDate: (date: string) => void;
  onAddEvent: () => void;
  todayReference?: Date;
};

export function UpcomingEvents({
  events = [],
  onSelectDate,
  onAddEvent,
  todayReference,
}: UpcomingEventsProps) {
  const upcoming = getUpcomingEvents(events, 8, todayReference);
  const copy = PAGE_EMPTY_STATES.calendarUpcoming;

  return (
    <Card className="h-fit">
      <CardHeader title="Upcoming" description="Next events and deadlines" />

      {upcoming.length === 0 ? (
        <EmptyState
          compact
          title={copy.title}
          description={copy.description}
          kizunaMessage={copy.kizunaMessage}
          emoji={copy.emoji}
          actionLabel={copy.actionLabel}
          onAction={onAddEvent}
        />
      ) : (
        <ul className="space-y-3">
          {upcoming.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => onSelectDate(event.date)}
                className="flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-center">
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">
                    {isToday(event.date, todayReference)
                      ? "Tdy"
                      : formatDueDate(event.date).slice(0, 3)}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {event.startTime.split(":")[0]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {event.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDueDate(event.date)} · {formatTimeRange(event.startTime, event.endTime)}
                  </p>
                  <Badge
                    className={cn(
                      "mt-1.5 border",
                      CALENDAR_EVENT_TYPE_STYLES[event.type]
                    )}
                  >
                    {CALENDAR_EVENT_TYPE_LABELS[event.type]}
                  </Badge>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/tasks"
        className="mt-4 inline-block text-xs font-medium text-primary hover:underline"
      >
        View all tasks →
      </Link>
    </Card>
  );
}
