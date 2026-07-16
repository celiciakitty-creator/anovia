"use client";

import { useWorkspace } from "@/components/workspace";
import { Card } from "@/components/ui";
import { useHydrated } from "@/hooks/useHydrated";
import { AI_ASSISTANT_NAME } from "@/lib/constants";
import {
  getActiveProjectCount,
  getTasksDueThisWeek,
  getWeeklyCompletionStats,
} from "@/lib/workspace-utils";

function formatStat(value: number | null): string {
  return value === null ? "—" : String(value);
}

export function WelcomeSection() {
  const { projects, tasks } = useWorkspace();
  const isHydrated = useHydrated();

  const greeting = isHydrated
    ? (() => {
        const hour = new Date().getHours();
        return hour < 12
          ? "Good morning"
          : hour < 17
            ? "Good afternoon"
            : "Good evening";
      })()
    : "Welcome";

  const activeProjects = isHydrated ? getActiveProjectCount(projects) : null;
  const dueThisWeek = isHydrated ? getTasksDueThisWeek(tasks).length : null;
  const weeklyPercentage = isHydrated
    ? getWeeklyCompletionStats(tasks).percentage
    : null;

  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary to-accent text-primary-foreground">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-foreground/10" />
      <div className="absolute -bottom-12 -left-4 h-40 w-40 rounded-full bg-primary-foreground/5" />

      <div className="relative">
        <p className="text-sm font-medium text-primary-foreground/80">
          {greeting}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome back to Anovia
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-primary-foreground/80">
          Stay focused, collaborate with your team, and let {AI_ASSISTANT_NAME}{" "}
          help you move projects forward with clarity and balance.
        </p>

        <div className="mt-6 flex flex-wrap gap-6">
          <div>
            <p className="text-2xl font-semibold">{formatStat(activeProjects)}</p>
            <p className="text-xs text-primary-foreground/70">Active projects</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{formatStat(dueThisWeek)}</p>
            <p className="text-xs text-primary-foreground/70">
              Tasks due this week
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold">
              {weeklyPercentage === null ? "—" : `${weeklyPercentage}%`}
            </p>
            <p className="text-xs text-primary-foreground/70">
              Weekly completion
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
