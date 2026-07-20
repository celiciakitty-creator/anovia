"use client";

import { useState } from "react";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { CommentThread } from "@/components/comments";
import { useWorkspace } from "@/components/workspace";
import { validateProjectInput } from "@/lib/validation";
import { PROJECT_STATUS_LABELS } from "@/lib/workspace-utils";
import { cn } from "@/lib/utils";
import type { Project, ProjectInput, ProjectStatus } from "@/types/project";

type ProjectFormProps = {
  open: boolean;
  onClose: () => void;
  project?: Project;
  onSaved?: () => void;
};

const STATUS_OPTIONS = Object.entries(PROJECT_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

const emptyForm: ProjectInput = {
  name: "",
  description: "",
  dueDate: "",
  status: "active",
  memberIds: [],
};

function projectToForm(project: Project): ProjectInput {
  return {
    name: project.name,
    description: project.description,
    dueDate: project.dueDate,
    status: project.status,
    memberIds: project.memberIds,
  };
}

type ProjectFormContentProps = {
  project?: Project;
  onClose: () => void;
  onSaved?: () => void;
};

function ProjectFormContent({ project, onClose, onSaved }: ProjectFormContentProps) {
  const { users, createProject, updateProject } = useWorkspace();
  const isEditing = Boolean(project);
  const [form, setForm] = useState<ProjectInput>(() =>
    project ? projectToForm(project) : emptyForm
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = validateProjectInput(form);
    setErrors(result.errors);
    if (!result.valid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (project) {
        await updateProject(project.id, form);
      } else {
        await createProject(form);
      }
      onSaved?.();
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save project."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMember = (userId: string) => {
    setForm((current) => ({
      ...current,
      memberIds: current.memberIds.includes(userId)
        ? current.memberIds.filter((id) => id !== userId)
        : [...current.memberIds, userId],
    }));
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project name"
          name="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          required
        />
        <Textarea
          label="Description"
          name="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Due date"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            error={errors.dueDate}
            required
          />
          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as ProjectStatus })
            }
            options={STATUS_OPTIONS}
          />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-foreground">
            Team members
          </legend>
          <p className="text-xs text-muted-foreground">
            Selections here are for planning in this demo. Only the project owner
            is saved to Supabase.
          </p>
          <div className="flex flex-wrap gap-2">
            {users.map((user) => {
              const selected = form.memberIds.includes(user.id);
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleMember(user.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors",
                    selected
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                  aria-pressed={selected}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {user.initials}
                  </span>
                  {user.name}
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
            {isSubmitting
              ? "Saving…"
              : isEditing
                ? "Save changes"
                : "Create project"}
          </Button>
        </div>
      </form>

      {isEditing && project ? (
        <div className="mt-6 border-t border-border pt-6">
          <CommentThread
            embedded
            parentType="project"
            parentId={project.id}
            title="Project discussion"
            description="Share updates, decisions, and ideas for this project. Saved locally in your browser."
          />
        </div>
      ) : null}
    </>
  );
}

export function ProjectForm({ open, onClose, project, onSaved }: ProjectFormProps) {
  const isEditing = Boolean(project);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit project" : "Create project"}
      description={
        isEditing
          ? "Update project details and team assignments."
          : "Add a new project to your workspace."
      }
      className={isEditing ? "max-w-2xl" : undefined}
    >
      {open ? (
        <ProjectFormContent
          key={project?.id ?? "create"}
          project={project}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}
