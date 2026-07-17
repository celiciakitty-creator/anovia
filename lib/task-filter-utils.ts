import type { Task, TaskStatus } from "@/types/task";

/** Status filter value — a specific status or all. */
export type TaskFilterStatus = TaskStatus | "all";

/** Assignee filter — all, unassigned, or a workspace user id. */
export type TaskFilterAssignee = "all" | "unassigned" | string;

/** Project filter — all or a workspace project id. */
export type TaskFilterProject = "all" | string;

export type TaskFilters = {
  status: TaskFilterStatus;
  assignee: TaskFilterAssignee;
  project: TaskFilterProject;
};

export const DEFAULT_TASK_FILTERS: TaskFilters = {
  status: "all",
  assignee: "all",
  project: "all",
};

export function isTaskFiltersActive(filters: TaskFilters): boolean {
  return (
    filters.status !== "all" ||
    filters.assignee !== "all" ||
    filters.project !== "all"
  );
}

/** Apply combined status, assignee, and project filters (AND logic). */
export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  return tasks.filter((task) => {
    if (filters.status !== "all" && task.status !== filters.status) {
      return false;
    }

    if (filters.project !== "all" && task.projectId !== filters.project) {
      return false;
    }

    if (filters.assignee === "unassigned") {
      if (task.assigneeId !== null) return false;
    } else if (filters.assignee !== "all" && task.assigneeId !== filters.assignee) {
      return false;
    }

    return true;
  });
}

/** Kanban columns to render for the current status filter. */
export function getVisibleKanbanStatuses(
  filters: TaskFilters,
  activeStatuses: readonly TaskStatus[]
): TaskStatus[] {
  if (filters.status === "all") {
    return [...activeStatuses];
  }

  if (filters.status === "completed") {
    return [];
  }

  return activeStatuses.includes(filters.status) ? [filters.status] : [];
}

export function shouldShowCompletedSection(filters: TaskFilters): boolean {
  return filters.status === "all" || filters.status === "completed";
}
