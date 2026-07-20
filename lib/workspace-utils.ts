import type { Project, ProjectStatus } from "@/types/project";
import type { Priority, Task, TaskStatus } from "@/types/task";
import type { User } from "@/types/user";
import type { WorkspaceData } from "@/types/workspace";
import { getTaskCompletionTimestamp } from "@/lib/completion-utils";

export function getProjectTasks(tasks: Task[], projectId: string): Task[] {
  return tasks.filter((task) => task.projectId === projectId);
}

export function calculateProjectProgress(tasks: Task[], projectId: string): number {
  const projectTasks = getProjectTasks(tasks, projectId);
  if (projectTasks.length === 0) return 0;
  const completed = projectTasks.filter((t) => t.status === "completed").length;
  return Math.round((completed / projectTasks.length) * 100);
}

export function getActiveProjectCount(projects: Project[]): number {
  return projects.filter((p) => p.status === "active").length;
}

export function getTasksDueThisWeek(tasks: Task[], reference = new Date()): Task[] {
  const start = startOfWeek(reference);
  const end = endOfWeek(reference);
  return tasks.filter((task) => {
    if (task.status === "completed") return false;
    const due = parseDate(task.dueDate);
    if (!due) return false;
    return due >= start && due <= end;
  });
}

export function getWeeklyCompletionStats(tasks: Task[], reference = new Date()) {
  const start = startOfWeek(reference);
  const end = endOfWeek(reference);
  const weekTasks = tasks.filter((task) => {
    const due = parseDate(task.dueDate);
    if (!due) return false;
    return due >= start && due <= end;
  });
  const completed = weekTasks.filter((t) => t.status === "completed").length;
  const total = weekTasks.length;

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
  const dayValues = days.map((day, index) => {
    const dayDate = addDays(start, index);
    const value = tasks.filter((task) => {
      if (task.status !== "completed") return false;
      const timestamp = getTaskCompletionTimestamp(task);
      if (!timestamp) return false;
      const completedDay = parseDate(timestamp.slice(0, 10));
      if (!completedDay) return false;
      return isSameDay(completedDay, dayDate);
    }).length;
    return { day, value };
  });

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    days: dayValues,
  };
}

export function getUrgentTasks(tasks: Task[], limit = 3): Task[] {
  const today = startOfDay(new Date());
  return tasks
    .filter((task) => task.status !== "completed")
    .sort((a, b) => {
      const priorityWeight = { high: 0, medium: 1, low: 2 };
      const priorityDiff =
        priorityWeight[a.priority] - priorityWeight[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      const aDue = parseDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bDue = parseDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    })
    .filter((task) => {
      const due = parseDate(task.dueDate);
      if (!due) return task.priority === "high";
      const daysUntil = Math.ceil(
        (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return task.priority === "high" || daysUntil <= 3;
    })
    .slice(0, limit);
}

export function getUserById(users: User[], id: string | null): User | undefined {
  if (!id) return undefined;
  return users.find((user) => user.id === id);
}

export function getProjectById(
  projects: Project[],
  id: string
): Project | undefined {
  return projects.find((project) => project.id === id);
}

export function formatDueDate(dateStr: string): string {
  const date = parseDate(dateStr);
  if (!date) return "No due date";
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, tomorrow)) return "Tomorrow";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatEstimatedTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

export const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  active: "bg-success/15 text-success",
  paused: "bg-warning/15 text-warning",
  completed: "bg-muted text-secondary",
  archived: "bg-muted text-muted-foreground",
};

export const PRIORITY_STYLES: Record<Priority, string> = {
  high: "bg-danger/15 text-danger",
  medium: "bg-warning/15 text-warning",
  low: "bg-muted text-muted-foreground",
};

export const TASK_STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/15 text-primary",
  stuck: "bg-danger/15 text-danger",
  review: "bg-accent/15 text-accent",
  completed: "bg-success/15 text-success",
};

export const LABEL_COLOR_STYLES: Record<string, string> = {
  primary: "bg-primary/15 text-primary",
  accent: "bg-accent/15 text-accent",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  secondary: "bg-muted text-secondary",
};

function parseDate(dateStr: string): Date | null {
  if (!dateStr?.trim()) return null;

  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function endOfWeek(date: Date): Date {
  return addDays(startOfWeek(date), 6);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function enrichWorkspace(data: WorkspaceData) {
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];

  return {
    ...data,
    projects: projects.map((project) => ({
      ...project,
      progress: calculateProjectProgress(tasks, project.id),
      taskCount: getProjectTasks(tasks, project.id).length,
    })),
  };
}

export type EnrichedProject = Project & { progress: number; taskCount: number };
