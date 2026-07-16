"use client";

import { GARDEN_FALLBACK } from "@/lib/growth-garden-utils";
import { cn } from "@/lib/utils";

function MiniGardenPlant({ progress }: { progress: number }) {
  const stemHeight = 18 + (progress / 100) * 28;

  return (
    <svg
      viewBox="0 0 80 96"
      className="h-20 w-16 shrink-0 text-success"
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
      <line
        x1="40"
        y1="78"
        x2="40"
        y2={78 - stemHeight}
        className="stroke-success"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d={`M40 ${78 - stemHeight + 16} C30 ${78 - stemHeight + 8}, 26 ${78 - stemHeight + 20}, 36 ${78 - stemHeight + 26} C39 ${78 - stemHeight + 28}, 40 ${78 - stemHeight + 24}, 40 ${78 - stemHeight + 16}`}
        className="fill-success/25 stroke-success"
        strokeWidth="1.5"
      />
      <path
        d={`M40 ${78 - stemHeight + 8} C50 ${78 - stemHeight}, 54 ${78 - stemHeight + 12}, 44 ${78 - stemHeight + 18} C41 ${78 - stemHeight + 20}, 40 ${78 - stemHeight + 16}, 40 ${78 - stemHeight + 8}`}
        className="fill-success/20 stroke-success"
        strokeWidth="1.5"
      />
      <circle
        cx="40"
        cy={78 - stemHeight - 2}
        r="3"
        className="fill-accent/80"
      />
    </svg>
  );
}

export function GrowthGardenPreview() {
  const stats = GARDEN_FALLBACK;

  return (
    <div
      className="onboarding-garden-preview rounded-2xl border border-border/60 bg-card/50 p-4"
      aria-label="Growth Garden preview"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Growth Garden preview
      </p>
      <div className="mt-3 flex items-center gap-3">
        <MiniGardenPlant progress={stats.progress} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{stats.stage}</p>
          <p className="text-xs text-muted-foreground">{stats.progress}% growth</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full bg-success onboarding-garden-bar")}
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5">
          {stats.streakDays}-day streak
        </span>
        <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5">
          +{stats.todayLeaves} leaves today
        </span>
        <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5">
          Next: {stats.nextUnlock}
        </span>
      </div>
    </div>
  );
}
