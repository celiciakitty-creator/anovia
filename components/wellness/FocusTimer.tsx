"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, CardHeader } from "@/components/ui";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { formatTimerDisplay } from "@/lib/wellness-utils";
import { cn } from "@/lib/utils";
import { FOCUS_PRESETS, type FocusPresetMinutes } from "@/types/wellness";
import { useWellness } from "./WellnessProvider";

type TimerStatus = "idle" | "running" | "paused" | "complete";

export function FocusTimer() {
  const { data, setFocusPreset, recordFocusSession, setActiveFocusSession } =
    useWellness();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(
    data.focusTimer.presetMinutes * 60
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const selectPreset = (minutes: FocusPresetMinutes) => {
    if (status === "running") return;
    setFocusPreset(minutes);
    setRemainingSeconds(minutes * 60);
    setStatus("idle");
  };

  const startTimer = () => {
    if (status === "running") return;
    if (remainingSeconds <= 0) {
      setRemainingSeconds(data.focusTimer.presetMinutes * 60);
    }
    setActiveFocusSession(new Date().toISOString());
    setStatus("running");
  };

  const pauseTimer = () => {
    if (status !== "running") return;
    setActiveFocusSession(null);
    setStatus("paused");
  };

  const resetTimer = () => {
    clearTimer();
    setActiveFocusSession(null);
    setStatus("idle");
    setRemainingSeconds(data.focusTimer.presetMinutes * 60);
  };

  useEffect(() => {
    if (status !== "running") {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          clearTimer();
          setActiveFocusSession(null);
          setStatus("complete");
          recordFocusSession();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return clearTimer;
  }, [status, clearTimer, recordFocusSession, setActiveFocusSession]);

  useEffect(() => {
    return () => {
      setActiveFocusSession(null);
    };
  }, [setActiveFocusSession]);

  const totalSeconds = data.focusTimer.presetMinutes * 60;
  const displayedRemainingSeconds =
    status === "idle" ? totalSeconds : remainingSeconds;
  const progress =
    totalSeconds > 0
      ? ((totalSeconds - displayedRemainingSeconds) / totalSeconds) * 100
      : 0;

  return (
    <Card className="h-full">
      <CardHeader
        title="Focus Timer"
        description="One session at a time — pause whenever you need."
      />

      <div className="flex flex-wrap gap-2">
        {FOCUS_PRESETS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => selectPreset(minutes)}
            disabled={status === "running"}
            aria-pressed={data.focusTimer.presetMinutes === minutes}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-50",
              data.focusTimer.presetMinutes === minutes
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:bg-muted/40"
            )}
          >
            {minutes} min
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center">
        <p
          className="font-mono text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          aria-live="polite"
          aria-label={`${formatTimerDisplay(displayedRemainingSeconds)} remaining`}
        >
          {formatTimerDisplay(displayedRemainingSeconds)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {status === "complete"
            ? "Session complete — well done."
            : status === "running"
              ? "Focus time in progress"
              : status === "paused"
                ? "Paused"
                : "Ready when you are"}
        </p>

        <div className="mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "focus-timer-progress h-full rounded-full bg-primary",
              prefersReducedMotion && "focus-timer-progress--static"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {status === "running" ? (
          <Button variant="secondary" size="sm" onClick={pauseTimer}>
            Pause
          </Button>
        ) : (
          <Button size="sm" onClick={startTimer}>
            {status === "complete" ? "Start again" : "Start"}
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={resetTimer}>
          Reset
        </Button>
      </div>
    </Card>
  );
}
