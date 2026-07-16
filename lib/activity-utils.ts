import { getTaskCompletionTimestamp } from "@/lib/completion-utils";
import type { ActivityItem } from "@/types/dashboard";
import type { Task } from "@/types/task";

function formatRelativeTime(iso: string, reference = new Date()): string {
  const date = new Date(iso);
  const diffMs = reference.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Build recent activity items from workspace task completion data. */
export function getRecentActivityFromTasks(
  tasks: Task[],
  limit = 5,
  reference = new Date()
): ActivityItem[] {
  return tasks
    .filter((task) => task.status === "completed")
    .map((task) => ({
      task,
      timestamp: getTaskCompletionTimestamp(task),
    }))
    .filter((entry): entry is { task: Task; timestamp: string } =>
      Boolean(entry.timestamp)
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, limit)
    .map(({ task, timestamp }) => ({
      id: `activity_${task.id}`,
      message: `You completed "${task.title}"`,
      timestamp: formatRelativeTime(timestamp, reference),
      type: "task" as const,
    }));
}
