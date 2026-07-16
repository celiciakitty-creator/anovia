"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { RevealOnScroll } from "@/components/motion";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskForm } from "@/components/tasks/TaskForm";
import { MainLayout } from "@/components/layout";
import { Button, DeleteConfirmModal } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import type { Task, TaskStatus } from "@/types/task";

function TasksPageContent() {
  const { tasks, deleteTask } = useWorkspace();
  const searchParams = useSearchParams();
  const shouldOpenCreate = searchParams.get("create") === "1";
  const [formOpen, setFormOpen] = useState(shouldOpenCreate);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const [deletingTask, setDeletingTask] = useState<Task | undefined>();

  const openCreate = (status: TaskStatus = "todo") => {
    setEditingTask(undefined);
    setDefaultStatus(status);
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  return (
    <MainLayout subtitle="Tasks">
      <div className="mx-auto max-w-[1400px]">
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

        <RevealOnScroll delay={80}>
          <KanbanBoard
            tasks={tasks}
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
        onConfirm={() => {
          if (deletingTask) deleteTask(deletingTask.id);
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
