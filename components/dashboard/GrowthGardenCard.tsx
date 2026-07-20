"use client";

import { Card, CardHeader } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { useHydrated } from "@/hooks/useHydrated";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { AI_ASSISTANT_NAME } from "@/lib/constants";
import {
  getGrowthGardenStats,
  type GrowthGardenStats,
} from "@/lib/growth-garden-utils";
import { cn } from "@/lib/utils";

type GrowthGardenCardProps = {
  stats?: GrowthGardenStats;
  className?: string;
};

function GardenPlant({ progress }: { progress: number }) {
  const stemHeight = 24 + (progress / 100) * 40;

  return (
    <svg
      viewBox="0 0 80 96"
      className="h-24 w-20 shrink-0 text-success sm:h-28 sm:w-24"
      aria-hidden
    >
      <rect
        x="22"
        y="78"
        width="36"
        height="14"
        rx="4"
        className="fill-muted stroke-border"
        strokeWidth="1.5"
      />
      <rect
        x="26"
        y="82"
        width="28"
        height="6"
        rx="2"
        className="fill-card"
      />
      <line
        x1="40"
        y1="78"
        x2="40"
        y2={78 - stemHeight}
        className="stroke-success"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <g
        className="growth-garden-leaf growth-garden-leaf--left origin-center"
        style={{ transformOrigin: "40px 52px" }}
      >
        <path
          d={`M40 ${78 - stemHeight + 18} C28 ${78 - stemHeight + 8}, 24 ${78 - stemHeight + 22}, 34 ${78 - stemHeight + 28} C38 ${78 - stemHeight + 30}, 40 ${78 - stemHeight + 26}, 40 ${78 - stemHeight + 18}`}
          className="fill-success/25 stroke-success"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>
      <g
        className="growth-garden-leaf growth-garden-leaf--right origin-center"
        style={{ transformOrigin: "40px 46px" }}
      >
        <path
          d={`M40 ${78 - stemHeight + 10} C52 ${78 - stemHeight}, 56 ${78 - stemHeight + 14}, 46 ${78 - stemHeight + 20} C42 ${78 - stemHeight + 22}, 40 ${78 - stemHeight + 18}, 40 ${78 - stemHeight + 10}`}
          className="fill-success/20 stroke-success"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>
      <circle
        cx="40"
        cy={78 - stemHeight - 2}
        r="3"
        className="fill-accent/80"
      />
    </svg>
  );
}

function StatItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-muted/20 px-3 py-2.5", className)}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function GrowthGardenCard({ stats: statsOverride, className }: GrowthGardenCardProps) {
  const { tasks } = useWorkspace();
  const isHydrated = useHydrated();
  const prefersReducedMotion = usePrefersReducedMotion();
  const stats =
    statsOverride ??
    (isHydrated ? getGrowthGardenStats(tasks) : getGrowthGardenStats([]));

  const isEmptyGarden = stats.usingFallback;

  const todayLabel = isEmptyGarden
    ? "No leaves yet"
    : stats.todayLeaves === 1
      ? "+1 leaf"
      : `+${stats.todayLeaves} leaves`;

  const streakLabel = isEmptyGarden
    ? "0 days"
    : stats.streakDays === 1
      ? "1 day"
      : `${stats.streakDays} days`;

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader
        title="Growth Garden"
        description={
          isEmptyGarden
            ? "Complete tasks to help your garden grow"
            : "Celebrate steady progress"
        }
      />

      <div className="flex items-start gap-4">
        <GardenPlant progress={stats.progress} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-lg font-semibold text-foreground">
              {stats.stage}
            </span>
            <span className="text-sm text-muted-foreground">
              {stats.progress}% growth
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "growth-garden-progress h-full rounded-full bg-success",
                prefersReducedMotion && "growth-garden-progress--static"
              )}
              style={{ width: `${stats.progress}%` }}
            />
          </div>

          {isEmptyGarden ? (
            <div className="mt-3 space-y-1">
              <p className="text-sm text-foreground">
                Your garden will grow as you complete tasks.
              </p>
              <p className="text-xs text-muted-foreground">
                Complete your first task to begin your streak.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatItem label="Current stage" value={stats.stage} />
        <StatItem label="Progress" value={`${stats.progress}%`} />
        <StatItem
          label="Streak"
          value={isEmptyGarden ? "No streak yet" : streakLabel}
        />
        <StatItem label="Today's growth" value={todayLabel} />
      </div>

      <div className="mt-3 rounded-lg border border-dashed border-border bg-card px-3 py-2.5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Next unlock
        </p>
        <p className="mt-0.5 text-sm font-medium text-foreground">
          {stats.nextUnlock}
        </p>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">{AI_ASSISTANT_NAME}</span>
        {": "}
        Small progress, every day, creates remarkable growth.
      </p>
    </Card>
  );
}
