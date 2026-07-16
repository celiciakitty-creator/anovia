"use client";

import { Card, CardHeader, EmptyState } from "@/components/ui";
import { TaskStatusChip } from "@/components/tasks/TaskStatusChip";
import { PAGE_EMPTY_STATES } from "@/data/empty-states";
import { useWorkspace } from "@/components/workspace";
import { useHydrated } from "@/hooks/useHydrated";
import { formatDueDate, getProjectById, getUrgentTasks } from "@/lib/workspace-utils";
import { PRIORITY_LABELS } from "@/types/task";
import { cn } from "@/lib/utils";

const priorityBorder = {
  high: "border-l-danger",
  medium: "border-l-warning",
  low: "border-l-border",
};

export function TasksCard() {
  const { tasks, projects } = useWorkspace();
  const isHydrated = useHydrated();
  const urgentTasks = isHydrated ? getUrgentTasks(tasks, 3) : [];
  const copy = PAGE_EMPTY_STATES.tasksDashboard;

  return (
    <Card className="h-full">
      <CardHeader
        title="Urgent tasks"
        description="Next priorities"
        action={
          <a
            href="/tasks"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </a>
        }
      />

      {urgentTasks.length === 0 ? (
        <EmptyState
          compact
          title={copy.title}
          description={copy.description}
          kizunaMessage={copy.kizunaMessage}
          emoji={copy.emoji}
          actionLabel={copy.actionLabel}
          actionHref="/tasks"
        />
      ) : (
        <ul className="space-y-2">
          {urgentTasks.map((task) => {
            const project = getProjectById(projects, task.projectId);
            return (
              <li
                key={task.id}
                className={cn(
                  "rounded-lg border border-border border-l-4 bg-muted/50 p-3",
                  priorityBorder[task.priority]
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                  <TaskStatusChip taskId={task.id} status={task.status} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {project?.name ?? "Project"} · Due {formatDueDate(task.dueDate)} ·{" "}
                  {PRIORITY_LABELS[task.priority]}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
