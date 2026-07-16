"use client";

import { Button, Card, CardHeader } from "@/components/ui";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { getTodayDateString } from "@/lib/wellness-storage";
import { cn } from "@/lib/utils";
import { HYDRATION_GOAL } from "@/types/wellness";
import { useWellness } from "./WellnessProvider";

export function HydrationTracker() {
  const { data, adjustHydration, setHydrationCount } = useWellness();
  const prefersReducedMotion = usePrefersReducedMotion();
  const today = getTodayDateString();
  const count = data.hydration.date === today ? data.hydration.count : 0;
  const progress = Math.min((count / HYDRATION_GOAL) * 100, 100);

  return (
    <Card className="h-full">
      <CardHeader
        title="Hydration Tracker"
        description={`A gentle goal of ${HYDRATION_GOAL} glasses today`}
      />

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => adjustHydration(-1)}
          disabled={count <= 0}
          aria-label="Remove one glass of water"
        >
          −1
        </Button>

        <div className="text-center">
          <p className="text-3xl font-semibold text-foreground" aria-live="polite">
            {count}
            <span className="text-lg text-muted-foreground"> / {HYDRATION_GOAL}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">glasses today</p>
        </div>

        <Button
          size="sm"
          onClick={() => adjustHydration(1)}
          aria-label="Add one glass of water"
        >
          +1
        </Button>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "hydration-progress h-full rounded-full bg-accent",
            prefersReducedMotion && "hydration-progress--static"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
        {Array.from({ length: HYDRATION_GOAL }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              index < count ? "bg-accent" : "bg-border"
            )}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHydrationCount(0)}
          disabled={count === 0}
        >
          Reset today
        </Button>
      </div>
    </Card>
  );
}
