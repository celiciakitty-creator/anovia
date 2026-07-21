"use client";

import { Card, CardHeader } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { useHydrated } from "@/hooks/useHydrated";
import { getCompletionStats } from "@/lib/completion-utils";
import { cn } from "@/lib/utils";
import { DashboardNavCard } from "./dashboard-nav";

const EMPTY_COMPLETION_STATS = {
  completedToday: 0,
  completedThisWeek: 0,
  streakDays: 0,
};

function StatBlock({
  label,
  value,
  suffix,
  accent,
  placeholder = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: boolean;
  placeholder?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/30 px-3 py-3 text-center",
        accent && "border-primary/30 bg-primary/5"
      )}
    >
      <p className="text-2xl font-semibold tabular-nums text-foreground">
        {placeholder ? "—" : value}
        {!placeholder && suffix ? (
          <span className="ml-0.5 text-sm font-medium text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function CompletedStatsCard() {
  const { tasks } = useWorkspace();
  const isHydrated = useHydrated();
  const stats = isHydrated ? getCompletionStats(tasks) : EMPTY_COMPLETION_STATS;

  return (
    <DashboardNavCard href="/tasks" ariaLabel="View tasks and completion stats">
      <Card className="h-full transition-colors group-hover:border-primary/20">
        <CardHeader
          title="Completed"
          description="Your completion momentum at a glance"
        />
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatBlock
          label="Today"
          value={stats.completedToday}
          placeholder={!isHydrated}
        />
        <StatBlock
          label="This Week"
          value={stats.completedThisWeek}
          placeholder={!isHydrated}
        />
        <StatBlock
          label="Streak"
          value={stats.streakDays}
          suffix={stats.streakDays === 1 ? "day" : "days"}
          accent={isHydrated && stats.streakDays > 0}
          placeholder={!isHydrated}
        />
      </div>
      </Card>
    </DashboardNavCard>
  );
}
