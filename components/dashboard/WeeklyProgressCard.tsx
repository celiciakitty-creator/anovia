"use client";

import { Card, CardHeader } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { useHydrated } from "@/hooks/useHydrated";
import { getWeeklyCompletionStats } from "@/lib/workspace-utils";

const EMPTY_WEEKLY_PROGRESS = {
  completed: 0,
  total: 0,
  percentage: 0,
  days: [
    { day: "Mon", value: 0 },
    { day: "Tue", value: 0 },
    { day: "Wed", value: 0 },
    { day: "Thu", value: 0 },
    { day: "Fri", value: 0 },
    { day: "Sat", value: 0 },
    { day: "Sun", value: 0 },
  ],
};

export function WeeklyProgressCard() {
  const { tasks } = useWorkspace();
  const isHydrated = useHydrated();
  const weeklyProgress = isHydrated
    ? getWeeklyCompletionStats(tasks)
    : EMPTY_WEEKLY_PROGRESS;
  const maxValue = Math.max(...weeklyProgress.days.map((d) => d.value), 1);

  return (
    <Card className="h-full">
      <CardHeader
        title="Weekly Progress"
        description={
          isHydrated
            ? `${weeklyProgress.completed} of ${weeklyProgress.total} tasks completed`
            : "Loading weekly progress"
        }
      />

      <div className="flex items-end justify-center gap-2 sm:gap-3">
        {weeklyProgress.days.map((day) => (
          <div key={day.day} className="flex flex-col items-center gap-1.5">
            <div className="flex h-24 w-7 items-end sm:w-8">
              <div
                className="w-full rounded-t-md bg-primary/20 transition-all"
                style={{
                  height: `${(day.value / maxValue) * 100}%`,
                  minHeight: day.value > 0 ? "8px" : "2px",
                }}
              >
                {day.value > 0 ? (
                  <div className="h-full w-full rounded-t-md bg-primary" />
                ) : null}
              </div>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">
              {day.day}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Completion rate</span>
          <span className="font-semibold text-foreground">
            {isHydrated ? `${weeklyProgress.percentage}%` : "—"}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: isHydrated ? `${weeklyProgress.percentage}%` : "0%",
            }}
          />
        </div>
      </div>
    </Card>
  );
}
