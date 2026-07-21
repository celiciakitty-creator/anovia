"use client";

import { Badge, Card, CardHeader, EmptyState } from "@/components/ui";
import { PAGE_EMPTY_STATES } from "@/data/empty-states";
import { useWorkspace } from "@/components/workspace";
import { useHydrated } from "@/hooks/useHydrated";
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
import { DashboardNavCard } from "./dashboard-nav";

/** Fixed reference for SSR and pre-hydration calendar filtering. */
const SSR_CALENDAR_REFERENCE = new Date(Date.UTC(2026, 6, 15, 12, 0, 0));

export function CalendarCard() {
  const { calendarEvents } = useWorkspace();
  const isHydrated = useHydrated();
  const reference = isHydrated ? new Date() : SSR_CALENDAR_REFERENCE;
  const upcoming = getUpcomingEvents(calendarEvents ?? [], 3, reference);
  const copy = PAGE_EMPTY_STATES.calendarDashboard;

  return (
    <DashboardNavCard href="/calendar" ariaLabel="View calendar and upcoming deadlines">
      <Card className="h-full transition-colors group-hover:border-primary/20">
        <CardHeader
          title="Calendar"
          description="Upcoming events"
          action={
            <span className="text-xs font-medium text-primary group-hover:underline">
              View all
            </span>
          }
        />

      {upcoming.length === 0 ? (
        <EmptyState
          compact
          title={copy.title}
          description={copy.description}
          kizunaMessage={copy.kizunaMessage}
          emoji={copy.emoji}
          actionLabel={copy.actionLabel}
          actionHref="/calendar"
        />
      ) : (
        <ul className="space-y-3">
          {upcoming.map((event) => (
            <li
              key={event.id}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-center">
                <span className="text-[10px] font-medium uppercase text-muted-foreground">
                  {isHydrated && isToday(event.date, reference)
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
                    "mt-1 border",
                    CALENDAR_EVENT_TYPE_STYLES[event.type]
                  )}
                >
                  {CALENDAR_EVENT_TYPE_LABELS[event.type]}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
      </Card>
    </DashboardNavCard>
  );
}
