export type StoredEventType = "meeting" | "focus_session" | "wellness_reminder";

export type CalendarEventType =
  | "project_deadline"
  | "task_deadline"
  | StoredEventType;

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: StoredEventType;
  projectId: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEventInput = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: StoredEventType;
  projectId: string | null;
  description: string;
};

export type CalendarDisplayEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: CalendarEventType;
  projectId?: string | null;
  taskId?: string | null;
  description?: string;
  source: "stored" | "project" | "task";
  editable: boolean;
  overdue?: boolean;
};

export const STORED_EVENT_TYPE_LABELS: Record<StoredEventType, string> = {
  meeting: "Meeting",
  focus_session: "Focus session",
  wellness_reminder: "Wellness reminder",
};

export const CALENDAR_EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  project_deadline: "Project deadline",
  task_deadline: "Task deadline",
  meeting: "Meeting",
  focus_session: "Focus session",
  wellness_reminder: "Wellness reminder",
};

export const CALENDAR_EVENT_TYPE_STYLES: Record<CalendarEventType, string> = {
  project_deadline: "bg-accent/15 text-accent border-accent/40",
  task_deadline: "bg-primary/15 text-primary border-primary/40",
  meeting: "bg-muted text-foreground border-border",
  focus_session: "bg-success/15 text-success border-success/40",
  wellness_reminder: "bg-warning/15 text-warning border-warning/40",
};

export const CALENDAR_EVENT_DOT_STYLES: Record<CalendarEventType, string> = {
  project_deadline: "bg-accent",
  task_deadline: "bg-primary",
  meeting: "bg-secondary",
  focus_session: "bg-success",
  wellness_reminder: "bg-warning",
};
