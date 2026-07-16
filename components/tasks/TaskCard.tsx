"use client";

import { Badge, Button } from "@/components/ui";
import { useCommentCount } from "@/components/comments";
import { useWorkspace } from "@/components/workspace";
import {
  formatDueDate,
  formatEstimatedTime,
  getProjectById,
  getUserById,
  LABEL_COLOR_STYLES,
  PRIORITY_STYLES,
} from "@/lib/workspace-utils";
import {
  formatCompletionTimestamp,
  getTaskCompletionTimestamp,
} from "@/lib/completion-utils";
import { PRIORITY_LABELS } from "@/types/task";
import type { Task } from "@/types/task";
import { TaskStatusChip } from "./TaskStatusChip";

type TaskCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { projects, users, labels } = useWorkspace();
  const commentCount = useCommentCount("task", task.id);
  const project = getProjectById(projects, task.projectId);
  const assignee = getUserById(users, task.assigneeId);
  const taskLabels = labels.filter((l) => task.labelIds.includes(l.id));
  const completionTimestamp = getTaskCompletionTimestamp(task);

  return (
    <article
      className={`task-card rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-[var(--card-shadow)]${
        task.status === "completed" ? " task-card--completed" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="min-w-0 flex-1 text-sm font-medium text-foreground">
          {task.title}
        </h4>
        <Badge className={PRIORITY_STYLES[task.priority]}>
          {PRIORITY_LABELS[task.priority]}
        </Badge>
      </div>

      <div className="mt-2">
        <TaskStatusChip taskId={task.id} status={task.status} />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {project?.name ?? "Unknown project"}
      </p>

      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <p>
          {assignee ? assignee.name : "Unassigned"} · Due{" "}
          {formatDueDate(task.dueDate)}
        </p>
        <p>{formatEstimatedTime(task.estimatedMinutes)} estimated</p>
        {completionTimestamp ? (
          <p className="text-success">{formatCompletionTimestamp(completionTimestamp)}</p>
        ) : null}
      </div>

      {taskLabels.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {taskLabels.map((label) => (
            <Badge key={label.id} className={LABEL_COLOR_STYLES[label.color]}>
              {label.name}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        {commentCount > 0 ? (
          <span
            className="text-xs text-muted-foreground"
            aria-label={`${commentCount} comments`}
          >
            {commentCount} comment{commentCount !== 1 ? "s" : ""}
          </span>
        ) : (
          <span aria-hidden />
        )}
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(task)}>
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}
