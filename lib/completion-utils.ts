import type { CompletionStats } from "@/types/completion";
import type { Task, TaskStatus } from "@/types/task";

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
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

export function getTaskCompletionTimestamp(task: Task): string | null {
  if (task.status !== "completed") return null;
  return task.completedAt ?? task.updatedAt ?? null;
}

export function getCompletedTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.status === "completed");
}

export function getCompletionStats(
  tasks: Task[],
  reference = new Date()
): CompletionStats {
  const today = toDateString(reference);
  const weekStart = startOfWeek(reference);
  const weekEnd = endOfWeek(reference);

  const completed = getCompletedTasks(tasks);
  let completedToday = 0;
  let completedThisWeek = 0;
  const completionDates = new Set<string>();

  for (const task of completed) {
    const timestamp = getTaskCompletionTimestamp(task);
    if (!timestamp) continue;

    const completedDate = new Date(timestamp);
    const dateKey = toDateString(completedDate);
    completionDates.add(dateKey);

    if (dateKey === today) completedToday += 1;

    if (completedDate >= weekStart && completedDate <= weekEnd) {
      completedThisWeek += 1;
    }
  }

  let streak = 0;
  let cursor = startOfDay(reference);
  if (!completionDates.has(today)) {
    cursor = addDays(cursor, -1);
  }

  while (completionDates.has(toDateString(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return {
    completedToday,
    completedThisWeek,
    streakDays: streak,
  };
}

export function formatCompletionTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const today = startOfDay(new Date());
  const completedDay = startOfDay(date);

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (completedDay.getTime() === today.getTime()) {
    return `Completed today at ${time}`;
  }

  const yesterday = addDays(today, -1);
  if (completedDay.getTime() === yesterday.getTime()) {
    return `Completed yesterday at ${time}`;
  }

  return `Completed ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} at ${time}`;
}

export function resolveTaskCompletionFields(
  task: Pick<Task, "status" | "completedAt">,
  nextStatus: TaskStatus,
  now: string
): Pick<Task, "status" | "completedAt"> {
  const wasCompleted = task.status === "completed";
  const isCompleted = nextStatus === "completed";

  if (isCompleted && !wasCompleted) {
    return { status: nextStatus, completedAt: now };
  }

  if (!isCompleted) {
    return { status: nextStatus, completedAt: null };
  }

  return {
    status: nextStatus,
    completedAt: task.completedAt ?? now,
  };
}

export const ACTIVE_KANBAN_STATUSES = [
  "todo",
  "in_progress",
  "stuck",
  "review",
] as const;
