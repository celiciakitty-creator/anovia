import type {
  CalendarDisplayEvent,
  CalendarEvent,
  CalendarEventType,
} from "@/types/calendar";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import type { WorkspaceData } from "@/types/workspace";

export type MonthDay = {
  date: string | null;
  day: number | null;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function asEventArray(
  events: CalendarDisplayEvent[] | null | undefined
): CalendarDisplayEvent[] {
  return Array.isArray(events) ? events : [];
}

export function getWeekdayLabels(): string[] {
  return WEEKDAY_LABELS;
}

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isToday(dateStr: string, reference = new Date()): boolean {
  return dateStr === toDateString(reference);
}

export function isPastDate(dateStr: string, reference = new Date()): boolean {
  const date = parseDateString(dateStr);
  const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  return date < today;
}

export function buildMonthDays(viewDate: Date): MonthDay[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;

  const days: MonthDay[] = [];
  for (let i = 0; i < startOffset; i++) {
    days.push({ date: null, day: null });
  }
  for (let d = 1; d <= lastDay; d++) {
    days.push({
      date: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      day: d,
    });
  }
  while (days.length % 7 !== 0) {
    days.push({ date: null, day: null });
  }
  return days;
}

export function formatMonthYear(viewDate: Date): string {
  return viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;
}

export function formatTime12h(time: string): string {
  const [hourRaw, minute] = time.split(":").map(Number);
  const period = hourRaw >= 12 ? "PM" : "AM";
  const hour = hourRaw % 12 || 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}

function projectDeadlineEvent(
  project: Project,
  reference: Date
): CalendarDisplayEvent {
  const overdue =
    project.status !== "completed" &&
    project.status !== "archived" &&
    isPastDate(project.dueDate, reference);

  return {
    id: `project-deadline-${project.id}`,
    title: `${project.name} due`,
    date: project.dueDate,
    startTime: "09:00",
    endTime: "09:30",
    type: "project_deadline",
    projectId: project.id,
    description: project.description,
    source: "project",
    editable: false,
    overdue,
  };
}

function taskDeadlineEvent(task: Task, reference: Date): CalendarDisplayEvent {
  const overdue = task.status !== "completed" && isPastDate(task.dueDate, reference);

  return {
    id: `task-deadline-${task.id}`,
    title: task.title,
    date: task.dueDate,
    startTime: "17:00",
    endTime: "17:30",
    type: "task_deadline",
    projectId: task.projectId,
    taskId: task.id,
    source: "task",
    editable: false,
    overdue,
  };
}

function storedEventToDisplay(event: CalendarEvent): CalendarDisplayEvent {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    type: event.type,
    projectId: event.projectId,
    description: event.description,
    source: "stored",
    editable: true,
    overdue: false,
  };
}

/** Merge stored calendar events with virtual project/task deadline events. */
export function buildCalendarEvents(
  data: WorkspaceData,
  reference = new Date()
): CalendarDisplayEvent[] {
  const storedEvents = Array.isArray(data.events) ? data.events : [];
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];

  const stored = storedEvents.map(storedEventToDisplay);
  const projectDeadlines = projects
    .filter((p) => p.status !== "archived")
    .map((p) => projectDeadlineEvent(p, reference));
  const taskDeadlines = tasks
    .filter((t) => t.status !== "completed")
    .map((t) => taskDeadlineEvent(t, reference));

  return [...stored, ...projectDeadlines, ...taskDeadlines];
}

export function getEventsForDate(
  events: CalendarDisplayEvent[] | null | undefined = [],
  date: string
): CalendarDisplayEvent[] {
  return asEventArray(events)
    .filter((event) => event.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function getUpcomingEvents(
  events: CalendarDisplayEvent[] | null | undefined = [],
  limit = 8,
  reference = new Date()
): CalendarDisplayEvent[] {
  const today = toDateString(reference);
  return asEventArray(events)
    .filter((event) => event.date >= today)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    })
    .slice(0, limit);
}

export function dateHasOverdue(
  events: CalendarDisplayEvent[] | null | undefined = [],
  date: string
): boolean {
  return asEventArray(events).some((event) => event.date === date && event.overdue);
}

export function getUniqueEventTypesForDate(
  events: CalendarDisplayEvent[] | null | undefined = [],
  date: string
): CalendarEventType[] {
  return [
    ...new Set(
      asEventArray(events)
        .filter((event) => event.date === date)
        .map((event) => event.type)
    ),
  ];
}

export function compareTimes(startTime: string, endTime: string): boolean {
  return startTime < endTime;
}
