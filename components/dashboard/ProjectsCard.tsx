"use client";

import { Card, CardHeader, EmptyState } from "@/components/ui";
import { PAGE_EMPTY_STATES } from "@/data/empty-states";
import { useWorkspace } from "@/components/workspace";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_STYLES } from "@/lib/workspace-utils";
import { cn } from "@/lib/utils";

export function ProjectsCard() {
  const { projects } = useWorkspace();
  const topProjects = projects
    .filter((p) => p.status === "active")
    .slice(0, 3);
  const copy = PAGE_EMPTY_STATES.projectsDashboard;

  return (
    <Card className="h-full">
      <CardHeader
        title="Projects"
        description="Active workstreams"
        action={
          <a
            href="/projects"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </a>
        }
      />

      {topProjects.length === 0 ? (
        <EmptyState
          compact
          title={copy.title}
          description={copy.description}
          kizunaMessage={copy.kizunaMessage}
          emoji={copy.emoji}
          actionLabel={copy.actionLabel}
          actionHref="/projects?create=1"
        />
      ) : (
        <ul className="space-y-4">
          {topProjects.map((project) => (
            <li key={project.id}>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {project.name}
                </p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    PROJECT_STATUS_STYLES[project.status]
                  )}
                >
                  {PROJECT_STATUS_LABELS[project.status]}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {project.progress}% complete
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
