"use client";

import { Badge, Card, CardHeader } from "@/components/ui";
import { getMoodMessage, isCheckInToday } from "@/lib/wellness-utils";
import { cn } from "@/lib/utils";
import { MOOD_OPTIONS, type Mood } from "@/types/wellness";
import { AI_ASSISTANT_NAME } from "@/lib/constants";
import { useWellness } from "./WellnessProvider";

export function DailyCheckIn() {
  const { data, setMood } = useWellness();
  const checkedInToday = isCheckInToday(data);
  const selectedMood = checkedInToday ? data.checkIn.mood : null;

  return (
    <Card className="h-full">
      <CardHeader
        title="Daily Check-In"
        description="How are you feeling today?"
      />

      <fieldset>
        <legend className="sr-only">How are you feeling today?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {MOOD_OPTIONS.map((option) => {
            const selected = selectedMood === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setMood(option.value as Mood)}
                aria-pressed={selected}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-center transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  selected
                    ? option.style
                    : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
                )}
              >
                <span className="text-xl" aria-hidden>
                  {option.emoji}
                </span>
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {selectedMood ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Today&apos;s mood</span>
            <Badge className={cn("border", MOOD_OPTIONS.find((m) => m.value === selectedMood)?.style)}>
              {MOOD_OPTIONS.find((m) => m.value === selectedMood)?.emoji}{" "}
              {MOOD_OPTIONS.find((m) => m.value === selectedMood)?.label}
            </Badge>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              {AI_ASSISTANT_NAME} says
            </p>
            <p className="mt-1 text-sm text-foreground">
              {getMoodMessage(selectedMood)}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Choose the option that fits best — there is no wrong answer.
        </p>
      )}
    </Card>
  );
}
