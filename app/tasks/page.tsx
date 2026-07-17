"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RevealOnScroll } from "@/components/motion";
import { KanbanBoard, TaskFiltersBar, TaskForm } from "@/components/tasks";
import { MainLayout } from "@/components/layout";
import { Button, DeleteConfirmModal } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import {
  DEFAULT_TASK_FILTERS,
  filterTasks,
} from "@/lib/task-filter-utils";
import type { Task, TaskStatus } from "@/types/task";

function TasksPageContent() {
  const { tasks, deleteTask, isLoaded, loadError } = useWorkspace();
  const searchParams = useSearchParams();
  const shouldOpenCreate = searchParams.get("create") === "1";
  const [formOpen, setFormOpen] = useState(shouldOpenCreate);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const [deletingTask, setDeletingTask] = useState<Task | undefined>();
  const [filters, setFilters] = useState(DEFAULT_TASK_FILTERS);

  const filteredTasks = useMemo(
    () => filterTasks(tasks, filters),
    [tasks, filters]
  );

  const openCreate = (status: TaskStatus = "todo") => {
    setEditingTask(undefined);
    setDefaultStatus(status);
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  if (!isLoaded) {
    return (
      <MainLayout subtitle="Tasks">
        <p className="text-sm text-muted-foreground">Loading tasks…</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout subtitle="Tasks">
      <div className="mx-auto max-w-[1400px]">
        {loadError ? (
          <p className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {loadError}
          </p>
        ) : null}
        <RevealOnScroll>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Tasks
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track work across your projects with a Kanban board.
              </p>
            </div>
            <Button onClick={() => openCreate("todo")}>Create Task</Button>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={40}>
          <TaskFiltersBar
            filters={filters}
            onChange={setFilters}
            filteredCount={filteredTasks.length}
            totalCount={tasks.length}
          />
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <KanbanBoard
            tasks={filteredTasks}
            totalTaskCount={tasks.length}
            filters={filters}
            onClearFilters={() => setFilters(DEFAULT_TASK_FILTERS)}
            onEdit={openEdit}
            onDelete={setDeletingTask}
            onCreate={openCreate}
          />
        </RevealOnScroll>
      </div>

      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        task={editingTask}
        defaultStatus={defaultStatus}
      />

      <DeleteConfirmModal
        open={Boolean(deletingTask)}
        onClose={() => setDeletingTask(undefined)}
        onConfirm={async () => {
          if (deletingTask) await deleteTask(deletingTask.id);
        }}
        title="Delete task"
        description={`Are you sure you want to delete "${deletingTask?.title}"? This action cannot be undone.`}
      />
    </MainLayout>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <MainLayout subtitle="Tasks">
          <p className="text-sm text-muted-foreground">Loading tasks…</p>
        </MainLayout>
      }
    >
      <TasksPageContent />
    </Suspense>
  );
}
