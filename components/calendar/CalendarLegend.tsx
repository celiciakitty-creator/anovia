import {
  CALENDAR_EVENT_TYPE_LABELS,
  CALENDAR_EVENT_DOT_STYLES,
  type CalendarEventType,
} from "@/types/calendar";

const LEGEND_TYPES: CalendarEventType[] = [
  "project_deadline",
  "task_deadline",
  "meeting",
  "focus_session",
  "wellness_reminder",
];

export function CalendarLegend() {
  return (
    <div
      className="flex flex-wrap gap-x-4 gap-y-2"
      aria-label="Calendar event types"
    >
      {LEGEND_TYPES.map((type) => (
        <div key={type} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`h-2 w-2 rounded-full ${CALENDAR_EVENT_DOT_STYLES[type]}`}
            aria-hidden
          />
          {CALENDAR_EVENT_TYPE_LABELS[type]}
        </div>
      ))}
    </div>
  );
}
