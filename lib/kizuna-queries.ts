import { getCompletionStats, getTaskCompletionTimestamp } from "@/lib/completion-utils";
import type { EnrichedProject } from "@/lib/workspace-utils";
import type { Priority, Task } from "@/types/task";
import type { User } from "@/types/user";

export const DUE_SOON_DAYS = 3;

const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export type NextTaskTier =
  | "overdue"
  | "due_soon"
  | "high_priority"
  | "in_progress"
  | "other";

export type AssigneeTaskCount = {
  userId: string;
  displayName: string;
  count: number;
};

export type WeeklySummary = {
  completedThisWeek: number;
  openTasks: number;
  overdueCount: number;
  laggingProjects: EnrichedProject[];
};

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function parseDueDate(dateStr: string): Date | null {
  if (!dateStr?.trim()) return null;

  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

export function endOfWeek(date: Date): Date {
  return addDays(startOfWeek(date), 6);
}

export function getOpenTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.status !== "completed");
}

export function getCompletedTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.status === "completed");
}

export function isTaskOverdue(task: Task, reference: Date): boolean {
  if (task.status === "completed") return false;
  const due = parseDueDate(task.dueDate);
  if (!due) return false;
  return due < startOfDay(reference);
}

export function isTaskDueToday(task: Task, reference: Date): boolean {
  if (task.status === "completed") return false;
  const due = parseDueDate(task.dueDate);
  if (!due) return false;
  return isSameDay(due, startOfDay(reference));
}

export function isTaskDueSoon(
  task: Task,
  reference: Date,
  withinDays = DUE_SOON_DAYS
): boolean {
  if (task.status === "completed") return false;
  const due = parseDueDate(task.dueDate);
  if (!due) return false;
  const today = startOfDay(reference);
  const limit = addDays(today, withinDays);
  return due >= today && due <= limit;
}

export function getOverdueTasks(tasks: Task[], reference: Date): Task[] {
  return getOpenTasks(tasks)
    .filter((task) => isTaskOverdue(task, reference))
    .sort((a, b) => {
      const aDue = parseDueDate(a.dueDate)?.getTime() ?? 0;
      const bDue = parseDueDate(b.dueDate)?.getTime() ?? 0;
      return aDue - bDue;
    });
}

export function getTasksDueToday(tasks: Task[], reference: Date): Task[] {
  return getOpenTasks(tasks)
    .filter((task) => isTaskDueToday(task, reference))
    .sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]);
}

export function getNextTaskTier(task: Task, reference: Date): NextTaskTier {
  if (task.status === "completed") return "other";
  if (isTaskOverdue(task, reference)) return "overdue";
  if (isTaskDueSoon(task, reference)) return "due_soon";
  if (task.priority === "high") return "high_priority";
  if (task.status === "in_progress") return "in_progress";
  return "other";
}

const TIER_ORDER: Record<NextTaskTier, number> = {
  overdue: 0,
  due_soon: 1,
  high_priority: 2,
  in_progress: 3,
  other: 4,
};

/** Rank open tasks for “what should I work on next?” */
export function rankNextTasks(tasks: Task[], reference: Date): Task[] {
  return [...getOpenTasks(tasks)].sort((a, b) => {
    const tierDiff =
      TIER_ORDER[getNextTaskTier(a, reference)] -
      TIER_ORDER[getNextTaskTier(b, reference)];
    if (tierDiff !== 0) return tierDiff;

    const aDue = parseDueDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bDue = parseDueDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (aDue !== bDue) return aDue - bDue;

    return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
  });
}

export function getTasksForUser(tasks: Task[], userId: string): Task[] {
  return tasks.filter(
    (task) =>
      task.assigneeId === userId ||
      (task.assigneeId === null && task.createdBy === userId)
  );
}

export function getMyOpenTasks(
  tasks: Task[],
  userId: string | null
): Task[] {
  if (!userId) return [];
  return getOpenTasks(getTasksForUser(tasks, userId)).sort((a, b) => {
    const aDue = parseDueDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bDue = parseDueDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aDue - bDue;
  });
}

export function getFallingBehindProjects(
  projects: EnrichedProject[]
): EnrichedProject[] {
  return [...projects]
    .filter((project) => project.status === "active" && project.taskCount > 0)
    .sort((a, b) => {
      if (a.progress !== b.progress) return a.progress - b.progress;
      return (parseDueDate(a.dueDate)?.getTime() ?? 0) - (parseDueDate(b.dueDate)?.getTime() ?? 0);
    });
}

function memberDisplayName(user: User): string {
  return user.displayName.trim() || user.name;
}

export function countAssignedOpenTasksByUser(
  tasks: Task[],
  users: User[]
): AssigneeTaskCount[] {
  const counts = new Map<string, number>();

  for (const task of getOpenTasks(tasks)) {
    if (!task.assigneeId) continue;
    counts.set(task.assigneeId, (counts.get(task.assigneeId) ?? 0) + 1);
  }

  return users
    .map((user) => ({
      userId: user.id,
      displayName: memberDisplayName(user),
      count: counts.get(user.id) ?? 0,
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.displayName.localeCompare(b.displayName));
}

export function getTopAssignees(
  tasks: Task[],
  users: User[]
): AssigneeTaskCount[] {
  const ranked = countAssignedOpenTasksByUser(tasks, users);
  if (ranked.length === 0) return [];

  const topCount = ranked[0].count;
  return ranked.filter((entry) => entry.count === topCount);
}

export function getTasksCompletedThisWeek(
  tasks: Task[],
  reference: Date
): Task[] {
  const weekStart = startOfWeek(reference);
  const weekEnd = endOfWeek(reference);

  return getCompletedTasks(tasks).filter((task) => {
    const timestamp = getTaskCompletionTimestamp(task);
    if (!timestamp) return false;
    const completedDate = new Date(timestamp);
    return completedDate >= weekStart && completedDate <= weekEnd;
  });
}

export function buildWeeklySummary(
  tasks: Task[],
  projects: EnrichedProject[],
  reference: Date
): WeeklySummary {
  const completion = getCompletionStats(tasks, reference);
  const laggingProjects = getFallingBehindProjects(projects).slice(0, 3);

  return {
    completedThisWeek: completion.completedThisWeek,
    openTasks: getOpenTasks(tasks).length,
    overdueCount: getOverdueTasks(tasks, reference).length,
    laggingProjects,
  };
}
