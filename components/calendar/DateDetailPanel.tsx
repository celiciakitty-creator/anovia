"use client";

import Link from "next/link";
import { Badge, Button, Card, CardHeader, EmptyState } from "@/components/ui";
import { PAGE_EMPTY_STATES } from "@/data/empty-states";
import { useWorkspace } from "@/components/workspace";
import { formatTimeRange, getEventsForDate, parseDateString } from "@/lib/calendar-utils";
import {
  CALENDAR_EVENT_TYPE_LABELS,
  CALENDAR_EVENT_TYPE_STYLES,
} from "@/types/calendar";
import { cn } from "@/lib/utils";
import type { CalendarDisplayEvent } from "@/types/calendar";

type DateDetailPanelProps = {
  date: string | null;
  events: CalendarDisplayEvent[];
  onClose: () => void;
  onAddEvent: (date: string) => void;
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
};

export function DateDetailPanel({
  date,
  events = [],
  onClose,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}: DateDetailPanelProps) {
  const { getProject } = useWorkspace();

  if (!date) return null;

  const dayEvents = getEventsForDate(events, date);
  const copy = PAGE_EMPTY_STATES.calendarDay;
  const formattedDate = parseDateString(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="mt-4 lg:mt-0">
      <CardHeader
        title={formattedDate}
        description={`${dayEvents.length} item${dayEvents.length !== 1 ? "s" : ""}`}
        action={
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close day panel">
            ✕
          </Button>
        }
      />

      <div className="mb-4">
        <Button size="sm" onClick={() => onAddEvent(date)}>
          Add Event
        </Button>
      </div>

      {dayEvents.length === 0 ? (
        <EmptyState
          compact
          title={copy.title}
          description={copy.description}
          kizunaMessage={copy.kizunaMessage}
          emoji={copy.emoji}
          actionLabel={copy.actionLabel}
          onAction={() => onAddEvent(date)}
        />
      ) : (
        <ul className="space-y-3">
          {dayEvents.map((event) => {
            const project = event.projectId
              ? getProject(event.projectId)
              : undefined;

            return (
              <li
                key={event.id}
                className={cn(
                  "rounded-lg border p-3",
                  event.overdue
                    ? "border-danger/40 bg-danger/5"
                    : "border-border bg-muted/20"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {event.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatTimeRange(event.startTime, event.endTime)}
                      {project ? ` · ${project.name}` : ""}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "shrink-0 border",
                      CALENDAR_EVENT_TYPE_STYLES[event.type]
                    )}
                  >
                    {CALENDAR_EVENT_TYPE_LABELS[event.type]}
                  </Badge>
                </div>

                {event.description ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {event.description}
                  </p>
                ) : null}

                {event.overdue ? (
                  <p className="mt-2 text-xs font-medium text-danger">Overdue</p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {event.source === "task" && event.taskId ? (
                    <Link
                      href="/tasks"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Open tasks
                    </Link>
                  ) : null}
                  {event.source === "project" && event.projectId ? (
                    <Link
                      href="/projects"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Open projects
                    </Link>
                  ) : null}
                  {event.editable ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => onEditEvent(event.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => onDeleteEvent(event.id)}
                      >
                        Delete
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
