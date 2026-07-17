"use client";

import { PAGE_EMPTY_STATES, KANBAN_COLUMN_EMPTY_HINT } from "@/data/empty-states";
import { EmptyState } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { ACTIVE_KANBAN_STATUSES } from "@/lib/completion-utils";
import {
  getVisibleKanbanStatuses,
  isTaskFiltersActive,
  shouldShowCompletedSection,
  type TaskFilters,
} from "@/lib/task-filter-utils";
import { CompletedSection } from "./CompletedSection";
import { TaskCard } from "./TaskCard";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/types/task";
import type { Task } from "@/types/task";

type KanbanBoardProps = {
  /** Tasks after filters are applied. */
  tasks: Task[];
  /** Total tasks before filtering (for empty-state context). */
  totalTaskCount: number;
  filters: TaskFilters;
  onClearFilters: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onCreate: (status: TaskStatus) => void;
};

export function KanbanBoard({
  tasks,
  totalTaskCount,
  filters,
  onClearFilters,
  onEdit,
  onDelete,
  onCreate,
}: KanbanBoardProps) {
  const { completionMeta, setCompletedSectionExpanded } = useWorkspace();
  const filtersActive = isTaskFiltersActive(filters);
  const visibleStatuses = getVisibleKanbanStatuses(filters, ACTIVE_KANBAN_STATUSES);
  const showCompletedSection = shouldShowCompletedSection(filters);

  const activeTasks = tasks.filter((task) => task.status !== "completed");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  if (totalTaskCount === 0) {
    const copy = PAGE_EMPTY_STATES.tasks;
    return (
      <EmptyState
        title={copy.title}
        description={copy.description}
        kizunaMessage={copy.kizunaMessage}
        emoji={copy.emoji}
        actionLabel={copy.actionLabel}
        onAction={() => onCreate("todo")}
      />
    );
  }

  if (tasks.length === 0 && filtersActive) {
    const copy = PAGE_EMPTY_STATES.tasksFiltered;
    return (
      <EmptyState
        title={copy.title}
        description={copy.description}
        kizunaMessage={copy.kizunaMessage}
        emoji={copy.emoji}
        actionLabel={copy.actionLabel}
        onAction={onClearFilters}
      />
    );
  }

  return (
    <div className="flex flex-col">
      {visibleStatuses.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {visibleStatuses.map((status) => {
            const columnTasks = activeTasks.filter((task) => task.status === status);
            return (
              <section
                key={status}
                className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/30"
                aria-label={TASK_STATUS_LABELS[status]}
              >
                <header className="flex items-center justify-between border-b border-border px-3 py-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    {TASK_STATUS_LABELS[status]}
                  </h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </header>
                <div className="flex flex-1 flex-col gap-2 p-2">
                  {columnTasks.length === 0 ? (
                    <p className="px-2 py-4 text-center text-xs leading-relaxed text-muted-foreground">
                      {KANBAN_COLUMN_EMPTY_HINT}
                    </p>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : null}

      {showCompletedSection ? (
        <CompletedSection
          tasks={completedTasks}
          expanded={
            filters.status === "completed"
              ? true
              : completionMeta.completedSectionExpanded
          }
          onToggle={() =>
            setCompletedSectionExpanded(!completionMeta.completedSectionExpanded)
          }
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : null}
    </div>
  );
}
