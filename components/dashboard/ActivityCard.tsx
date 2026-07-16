"use client";

import { Card, CardHeader, EmptyState } from "@/components/ui";
import { PAGE_EMPTY_STATES } from "@/data/empty-states";
import { useHydrated } from "@/hooks/useHydrated";
import { getRecentActivityFromTasks } from "@/lib/activity-utils";
import { AI_ASSISTANT_NAME } from "@/lib/constants";
import { useWorkspace } from "@/components/workspace";
import { cn } from "@/lib/utils";

const typeStyles = {
  ai: "bg-primary/15 text-primary",
  task: "bg-success/15 text-success",
  project: "bg-accent/15 text-accent",
  comment: "bg-warning/15 text-warning",
};

const typeLabels = {
  ai: AI_ASSISTANT_NAME,
  task: "Task",
  project: "Project",
  comment: "Comment",
};

export function ActivityCard() {
  const { tasks } = useWorkspace();
  const isHydrated = useHydrated();
  const activity = isHydrated ? getRecentActivityFromTasks(tasks) : [];
  const copy = PAGE_EMPTY_STATES.activity;

  return (
    <Card>
      <CardHeader title="Activity" description="Recent updates across your workspace" />

      {activity.length === 0 ? (
        <EmptyState
          compact
          title={copy.title}
          description={copy.description}
          kizunaMessage={copy.kizunaMessage}
          emoji={copy.emoji}
          actionLabel={copy.actionLabel}
          actionHref="/tasks"
        />
      ) : (
        <ul className="divide-y divide-border">
          {activity.map((item) => (
            <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <span
                className={cn(
                  "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  typeStyles[item.type]
                )}
              >
                {typeLabels[item.type]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{item.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.timestamp}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
