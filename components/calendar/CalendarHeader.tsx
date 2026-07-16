"use client";

import { Button } from "@/components/ui";
import { formatMonthYear } from "@/lib/calendar-utils";

type CalendarHeaderProps = {
  viewDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function CalendarHeader({
  viewDate,
  onPrevious,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-foreground">
        {formatMonthYear(viewDate)}
      </h2>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onToday}>
          Today
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          aria-label="Previous month"
        >
          ←
        </Button>
        <Button variant="ghost" size="sm" onClick={onNext} aria-label="Next month">
          →
        </Button>
      </div>
    </div>
  );
}
