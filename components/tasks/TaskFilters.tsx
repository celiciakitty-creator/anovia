"use client";

import { Button, Select } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import {
  DEFAULT_TASK_FILTERS,
  isTaskFiltersActive,
  type TaskFilters,
  type TaskFilterAssignee,
  type TaskFilterProject,
  type TaskFilterStatus,
} from "@/lib/task-filter-utils";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/types/task";

type TaskFiltersProps = {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  filteredCount: number;
  totalCount: number;
};

const STATUS_OPTIONS: { value: TaskFilterStatus; label: string }[] = [
  { value: "all", label: "All statuses" },
  ...Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
    value: value as TaskStatus,
    label,
  })),
];

export function TaskFiltersBar({
  filters,
  onChange,
  filteredCount,
  totalCount,
}: TaskFiltersProps) {
  const { users, projects } = useWorkspace();
  const filtersActive = isTaskFiltersActive(filters);

  const assigneeOptions: { value: TaskFilterAssignee; label: string }[] = [
    { value: "all", label: "All assignees" },
    { value: "unassigned", label: "Unassigned" },
    ...users.map((user) => ({ value: user.id, label: user.name })),
  ];

  const projectOptions: { value: TaskFilterProject; label: string }[] = [
    { value: "all", label: "All projects" },
    ...projects.map((project) => ({ value: project.id, label: project.name })),
  ];

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="-mx-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:overflow-visible lg:pb-0">
          <div
            className="flex min-w-min gap-3 sm:min-w-0 sm:flex-wrap lg:flex-1"
            role="group"
            aria-label="Task filters"
          >
            <div className="w-44 shrink-0 sm:w-auto sm:min-w-[11rem]">
              <Select
                label="Status"
                name="filter-status"
                value={filters.status}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    status: event.target.value as TaskFilterStatus,
                  })
                }
                options={STATUS_OPTIONS}
              />
            </div>
            <div className="w-44 shrink-0 sm:w-auto sm:min-w-[11rem]">
              <Select
                label="Assignee"
                name="filter-assignee"
                value={filters.assignee}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    assignee: event.target.value as TaskFilterAssignee,
                  })
                }
                options={assigneeOptions}
              />
            </div>
            <div className="w-44 shrink-0 sm:w-auto sm:min-w-[11rem]">
              <Select
                label="Project"
                name="filter-project"
                value={filters.project}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    project: event.target.value as TaskFilterProject,
                  })
                }
                options={projectOptions}
              />
            </div>
          </div>
        </div>

        {filtersActive ? (
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <p
              className="text-xs text-muted-foreground"
              aria-live="polite"
              aria-atomic="true"
            >
              Showing {filteredCount} of {totalCount} task
              {totalCount !== 1 ? "s" : ""}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onChange(DEFAULT_TASK_FILTERS)}
            >
              Clear filters
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
