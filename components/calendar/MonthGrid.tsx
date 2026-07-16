"use client";

import { getWeekdayLabels, getUniqueEventTypesForDate, isToday, dateHasOverdue } from "@/lib/calendar-utils";
import { CALENDAR_EVENT_DOT_STYLES } from "@/types/calendar";
import { cn } from "@/lib/utils";
import type { CalendarDisplayEvent } from "@/types/calendar";
import type { MonthDay } from "@/lib/calendar-utils";

type MonthGridProps = {
  days: MonthDay[];
  events: CalendarDisplayEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  todayReference?: Date;
};

export function MonthGrid({
  days,
  events = [],
  selectedDate,
  onSelectDate,
  todayReference,
}: MonthGridProps) {
  const weekdays = getWeekdayLabels();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[320px]">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekdays.map((day) => (
            <div
              key={day}
              className="px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs"
            >
              {day}
            </div>
          ))}

          {days.map((cell, index) => {
            if (!cell.date) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-16 rounded-lg bg-transparent sm:min-h-24"
                  aria-hidden
                />
              );
            }

            const types = getUniqueEventTypesForDate(events, cell.date);
            const hasEvents = types.length > 0;
            const today = isToday(cell.date, todayReference);
            const overdue = dateHasOverdue(events, cell.date);
            const selected = selectedDate === cell.date;

            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => onSelectDate(cell.date!)}
                className={cn(
                  "min-h-16 rounded-lg border p-1.5 text-left transition-colors sm:min-h-24 sm:p-2",
                  "hover:border-primary/40 hover:bg-muted/50",
                  selected && "border-primary bg-primary/5 ring-2 ring-primary",
                  !selected && "border-border bg-card",
                  today && !selected && "ring-1 ring-primary/60",
                  overdue && "border-danger/40"
                )}
                aria-label={`${cell.day}${hasEvents ? ", has events" : ""}${overdue ? ", overdue items" : ""}`}
                aria-pressed={selected}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium sm:h-7 sm:w-7 sm:text-sm",
                    today
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  {cell.day}
                </span>
                <div className="mt-1 flex flex-wrap gap-0.5 sm:mt-2">
                  {types.slice(0, 4).map((type) => (
                    <span
                      key={type}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2",
                        CALENDAR_EVENT_DOT_STYLES[type]
                      )}
                      aria-hidden
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
