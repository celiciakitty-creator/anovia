"use client";

import { Badge, Button, Card } from "@/components/ui";
import { useCommentCount } from "@/components/comments";
import { useWorkspace } from "@/components/workspace";
import {
  formatDueDate,
  getUserById,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_STYLES,
} from "@/lib/workspace-utils";
import { cn } from "@/lib/utils";
import type { EnrichedProject } from "@/lib/workspace-utils";

type ProjectCardProps = {
  project: EnrichedProject;
  onEdit: (project: EnrichedProject) => void;
  onDelete: (project: EnrichedProject) => void;
};

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const { users } = useWorkspace();
  const commentCount = useCommentCount("project", project.id);
  const members = project.memberIds
    .map((id) => getUserById(users, id))
    .filter(Boolean);
  const isComplete = project.progress === 100 && project.taskCount > 0;

  return (
    <Card
      hoverable
      className={cn("flex h-full flex-col", isComplete && "project-card--complete")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {project.name}
            </h3>
            {isComplete ? (
              <span className="project-complete-badge rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                100% complete
              </span>
            ) : null}
          </div>
          <Badge className={cn("mt-2", PROJECT_STATUS_STYLES[project.status])}>
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(project)}
            aria-label={`Edit ${project.name}`}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(project)}
            aria-label={`Delete ${project.name}`}
          >
            Delete
          </Button>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted-foreground">
        {project.description}
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span
              className={cn(
                "font-medium text-foreground",
                isComplete && "text-success"
              )}
            >
              {project.progress}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isComplete ? "bg-success project-progress--complete" : "bg-primary"
              )}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Due {formatDueDate(project.dueDate)}</span>
          <span className="flex flex-wrap items-center gap-2">
            {commentCount > 0 ? (
              <span aria-label={`${commentCount} comments`}>
                {commentCount} comment{commentCount !== 1 ? "s" : ""}
              </span>
            ) : null}
            <span>
              {project.taskCount} task{project.taskCount !== 1 ? "s" : ""}
            </span>
          </span>
        </div>

        {members.length > 0 ? (
          <div className="flex items-center gap-1" aria-label="Assigned team">
            {members.map((member) => (
              <span
                key={member!.id}
                title={member!.name}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground ring-2 ring-card"
              >
                {member!.initials}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
