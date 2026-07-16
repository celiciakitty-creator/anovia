"use client";

import { EmptyState } from "@/components/ui";
import { PAGE_EMPTY_STATES } from "@/data/empty-states";
import { TaskCard } from "./TaskCard";
import { TASK_STATUS_LABELS } from "@/types/task";
import type { Task } from "@/types/task";
import { cn } from "@/lib/utils";

type CompletedSectionProps = {
  tasks: Task[];
  expanded: boolean;
  onToggle: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function CompletedSection({
  tasks,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: CompletedSectionProps) {
  const copy = PAGE_EMPTY_STATES.completedTasks;

  return (
    <section
      className="mt-4 rounded-xl border border-border bg-muted/20"
      aria-label={TASK_STATUS_LABELS.completed}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block text-xs text-muted-foreground transition-transform",
              expanded && "rotate-90"
            )}
            aria-hidden
          >
            ▶
          </span>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
            {TASK_STATUS_LABELS.completed}
          </h3>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </button>

      {expanded ? (
        <div className="grid gap-2 border-t border-border p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tasks.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                compact
                title={copy.title}
                description={copy.description}
                kizunaMessage={copy.kizunaMessage}
                emoji={copy.emoji}
                actionLabel={copy.actionLabel}
                actionHref="/tasks"
              />
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}
