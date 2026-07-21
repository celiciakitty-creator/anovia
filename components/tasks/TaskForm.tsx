"use client";

import { useState } from "react";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { CommentThread } from "@/components/comments";
import { useWorkspace } from "@/components/workspace";
import { validateTaskInput } from "@/lib/validation";
import {
  PRIORITY_LABELS,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_STATUS_LABELS,
} from "@/types/task";
import { LABEL_COLOR_STYLES } from "@/lib/workspace-utils";
import { cn } from "@/lib/utils";
import type { Task, TaskInput, TaskStatus, Priority } from "@/types/task";

type TaskFormProps = {
  open: boolean;
  onClose: () => void;
  task?: Task;
  defaultStatus?: TaskStatus;
  onSaved?: () => void;
};

const STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const emptyForm: TaskInput = {
  title: "",
  description: "",
  projectId: "",
  assigneeId: null,
  dueDate: "",
  priority: "medium",
  status: "todo",
  estimatedMinutes: 60,
  labelIds: [],
};

function taskToForm(task: Task): TaskInput {
  return {
    title: task.title,
    description: task.description,
    projectId: task.projectId,
    assigneeId: task.assigneeId,
    dueDate: task.dueDate,
    priority: task.priority,
    status: task.status,
    estimatedMinutes: task.estimatedMinutes,
    labelIds: task.labelIds,
  };
}

type TaskFormContentProps = {
  task?: Task;
  defaultStatus: TaskStatus;
  onClose: () => void;
  onSaved?: () => void;
};

function TaskFormContent({
  task,
  defaultStatus,
  onClose,
  onSaved,
}: TaskFormContentProps) {
  const { projects, users, labels, createTask, updateTask } = useWorkspace();
  const isEditing = Boolean(task);
  const [form, setForm] = useState<TaskInput>(() =>
    task
      ? taskToForm(task)
      : {
          ...emptyForm,
          status: defaultStatus,
          projectId: projects[0]?.id ?? "",
        }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: TaskInput = {
      ...form,
      description: form.description.trim(),
    };
    const result = validateTaskInput(payload);
    setErrors(result.errors);
    if (!result.valid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (task) {
        await updateTask(task.id, payload);
      } else {
        await createTask(payload);
      }
      onSaved?.();
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save task."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLabel = (labelId: string) => {
    setForm((current) => ({
      ...current,
      labelIds: current.labelIds.includes(labelId)
        ? current.labelIds.filter((id) => id !== labelId)
        : [...current.labelIds, labelId],
    }));
  };

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));
  const assigneeOptions = [
    { value: "", label: "Unassigned" },
    ...users.map((u) => ({ value: u.id, label: u.name })),
  ];

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          name="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          error={errors.title}
          required
        />
        <Textarea
          label="Description"
          name="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          error={errors.description}
          maxLength={TASK_DESCRIPTION_MAX_LENGTH}
          rows={isEditing ? 5 : 3}
          placeholder="Add context, acceptance criteria, or notes for this task."
        />
        <Select
          label="Project"
          name="projectId"
          value={form.projectId}
          onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          options={
            projectOptions.length > 0
              ? projectOptions
              : [{ value: "", label: "No projects available" }]
          }
          error={errors.projectId}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Assignee"
            name="assigneeId"
            value={form.assigneeId ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                assigneeId: e.target.value ? e.target.value : null,
              })
            }
            options={assigneeOptions}
          />
          <Input
            label="Due date"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            error={errors.dueDate}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Priority"
            name="priority"
            value={form.priority}
            onChange={(e) =>
              setForm({ ...form, priority: e.target.value as Priority })
            }
            options={PRIORITY_OPTIONS}
          />
          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as TaskStatus })
            }
            options={STATUS_OPTIONS}
          />
          <Input
            label="Estimated time (minutes)"
            name="estimatedMinutes"
            type="number"
            min={0}
            step={15}
            value={form.estimatedMinutes}
            onChange={(e) =>
              setForm({
                ...form,
                estimatedMinutes: Number(e.target.value) || 0,
              })
            }
            error={errors.estimatedMinutes}
          />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-foreground">Labels</legend>
          <p className="text-xs text-muted-foreground">
            Labels are stored in this browser only and are not synced to Supabase
            yet.
          </p>
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => {
              const selected = form.labelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    selected
                      ? cn(LABEL_COLOR_STYLES[label.color], "ring-1 ring-primary")
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                  aria-pressed={selected}
                >
                  {label.name}
                </button>
              );
            })}
          </div>
        </fieldset>
        {submitError ? (
          <p className="text-sm text-danger" role="alert">
            {submitError}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>

      {isEditing && task ? (
        <div className="mt-6 border-t border-border pt-6">
          <CommentThread
            embedded
            parentType="task"
            parentId={task.id}
            title="Task comments"
            description="Note blockers, questions, updates, and review feedback. Synced to your workspace."
          />
        </div>
      ) : null}
    </>
  );
}

export function TaskForm({
  open,
  onClose,
  task,
  defaultStatus = "todo",
  onSaved,
}: TaskFormProps) {
  const isEditing = Boolean(task);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit task" : "Create task"}
      description={
        isEditing ? "Update task details and assignment." : "Add a new task to a project."
      }
      className={isEditing ? "max-w-2xl" : undefined}
    >
      {open ? (
        <TaskFormContent
          key={task?.id ?? `create-${defaultStatus}`}
          task={task}
          defaultStatus={defaultStatus}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}
