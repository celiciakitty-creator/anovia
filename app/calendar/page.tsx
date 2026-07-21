"use client";

import { useEffect, useMemo, useState } from "react";
import { RevealOnScroll } from "@/components/motion";
import {
  CalendarHeader,
  CalendarLegend,
  DateDetailPanel,
  EventForm,
  MonthGrid,
  UpcomingEvents,
} from "@/components/calendar";
import { MainLayout } from "@/components/layout";
import { Card, DeleteConfirmModal } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { useHydrated } from "@/hooks/useHydrated";
import { buildMonthDays, toDateString } from "@/lib/calendar-utils";
import type { CalendarEvent } from "@/types/calendar";

/** Deterministic month anchor for SSR and pre-hydration render. */
const SSR_CALENDAR_ANCHOR = new Date(Date.UTC(2026, 6, 1, 12, 0, 0));

export default function CalendarPage() {
  const {
    calendarEvents: rawCalendarEvents,
    deleteEvent,
    getEvent,
    isLoaded,
    loadError,
  } = useWorkspace();
  const calendarEvents = rawCalendarEvents ?? [];
  const isHydrated = useHydrated();
  const [viewDate, setViewDate] = useState(SSR_CALENDAR_ANCHOR);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>();
  const [formDefaultDate, setFormDefaultDate] = useState<string>("");
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    const today = new Date();
    queueMicrotask(() => {
      setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
      setSelectedDate(toDateString(today));
    });
  }, [isHydrated]);

  const days = useMemo(() => buildMonthDays(viewDate), [viewDate]);

  const goToPreviousMonth = () => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(toDateString(today));
  };

  const openAddEvent = (date: string) => {
    setEditingEvent(undefined);
    setFormDefaultDate(date);
    setFormOpen(true);
  };

  const openEditEvent = (displayEventId: string) => {
    const stored = getEvent(displayEventId);
    if (!stored) return;
    setEditingEvent(stored);
    setFormOpen(true);
  };

  const deletingEvent = deletingEventId ? getEvent(deletingEventId) : undefined;
  const fallbackEventDate = isHydrated
    ? toDateString(new Date())
    : toDateString(SSR_CALENDAR_ANCHOR);

  if (!isLoaded) {
    return (
      <MainLayout subtitle="Calendar">
        <p className="text-sm text-muted-foreground">Loading calendar…</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout subtitle="Calendar">
      <div className="mx-auto max-w-7xl">
        {loadError ? (
          <p className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {loadError}
          </p>
        ) : null}
        <RevealOnScroll>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Calendar
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View deadlines, meetings, and wellness reminders in one place.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid gap-6 lg:grid-cols-3">
          <RevealOnScroll className="lg:col-span-2" delay={80}>
            <Card>
              <CalendarHeader
                viewDate={viewDate}
                onPrevious={goToPreviousMonth}
                onNext={goToNextMonth}
                onToday={goToToday}
              />
              <MonthGrid
                days={days}
                events={calendarEvents}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                todayReference={isHydrated ? undefined : SSR_CALENDAR_ANCHOR}
              />
              <div className="mt-4 border-t border-border pt-4">
                <CalendarLegend />
              </div>
            </Card>
          </RevealOnScroll>

          <RevealOnScroll delay={120}>
            <UpcomingEvents
              events={calendarEvents}
              todayReference={isHydrated ? undefined : SSR_CALENDAR_ANCHOR}
              onSelectDate={(date) => {
                setSelectedDate(date);
                const parsed = new Date(date);
                setViewDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
              }}
              onAddEvent={() =>
                openAddEvent(selectedDate ?? fallbackEventDate)
              }
            />
          </RevealOnScroll>
        </div>

        {selectedDate ? (
          <RevealOnScroll delay={160}>
            <DateDetailPanel
              date={selectedDate}
              events={calendarEvents}
              onClose={() => setSelectedDate(null)}
              onAddEvent={openAddEvent}
              onEditEvent={openEditEvent}
              onDeleteEvent={setDeletingEventId}
            />
          </RevealOnScroll>
        ) : null}
      </div>

      <EventForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        event={editingEvent}
        defaultDate={formDefaultDate || selectedDate || undefined}
      />

      <DeleteConfirmModal
        open={Boolean(deletingEventId)}
        onClose={() => setDeletingEventId(null)}
        onConfirm={async () => {
          if (!deletingEventId) return;
          await deleteEvent(deletingEventId);
        }}
        title="Delete event"
        description={`Are you sure you want to delete "${deletingEvent?.title}"?`}
      />
    </MainLayout>
  );
}
