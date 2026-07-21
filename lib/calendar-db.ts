import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CalendarEvent,
  CalendarEventInput,
  StoredEventType,
} from "@/types/calendar";

type DbCalendarEventRow = {
  id: string;
  project_id: string | null;
  creator_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  event_type: StoredEventType;
  color: string | null;
  created_at: string;
  updated_at: string;
};

function padTimePart(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateStringFromDate(date: Date): string {
  return `${date.getFullYear()}-${padTimePart(date.getMonth() + 1)}-${padTimePart(date.getDate())}`;
}

function toTimeStringFromDate(date: Date): string {
  return `${padTimePart(date.getHours())}:${padTimePart(date.getMinutes())}`;
}

function parseLocalDateTime(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function mapCalendarEventRow(row: DbCalendarEventRow): CalendarEvent {
  const start = new Date(row.start_date);
  const end = new Date(row.end_date);

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    date: toDateStringFromDate(start),
    startTime: row.all_day ? "00:00" : toTimeStringFromDate(start),
    endTime: row.all_day ? "23:59" : toTimeStringFromDate(end),
    type: row.event_type,
    projectId: row.project_id,
    creatorId: row.creator_id,
    allDay: row.all_day,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function calendarInputToRow(input: CalendarEventInput) {
  const allDay = input.allDay ?? false;
  const startDate = allDay
    ? parseLocalDateTime(input.date, "00:00")
    : parseLocalDateTime(input.date, input.startTime);
  const endDate = allDay
    ? parseLocalDateTime(input.date, "23:59")
    : parseLocalDateTime(input.date, input.endTime);

  return {
    project_id: input.projectId,
    title: input.title.trim(),
    description: input.description.trim(),
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    all_day: allDay,
    event_type: input.type,
    color: input.color?.trim() || null,
  };
}

function calendarInputToInsert(
  input: CalendarEventInput,
  creatorId: string
) {
  return {
    ...calendarInputToRow(input),
    creator_id: creatorId,
  };
}

export async function getCalendarEvents(
  supabase: SupabaseClient
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as DbCalendarEventRow[]).map(mapCalendarEventRow);
}

export async function createCalendarEvent(
  supabase: SupabaseClient,
  input: CalendarEventInput,
  creatorId: string
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from("calendar_events")
    .insert(calendarInputToInsert(input, creatorId))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapCalendarEventRow(data as DbCalendarEventRow);
}

export async function updateCalendarEvent(
  supabase: SupabaseClient,
  id: string,
  input: CalendarEventInput
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from("calendar_events")
    .update(calendarInputToRow(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Unable to update this calendar event.");
  }

  return mapCalendarEventRow(data as DbCalendarEventRow);
}

export async function deleteCalendarEvent(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
