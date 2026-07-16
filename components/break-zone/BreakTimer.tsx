"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { formatTimerDisplay } from "@/lib/break-zone-storage";
import { cn } from "@/lib/utils";
import { BREAK_PRESETS, type BreakPresetMinutes } from "@/types/break-zone";
import { BreakZoneCard } from "./BreakZoneCard";
import { useBreakZone } from "./BreakZoneProvider";

type TimerStatus = "idle" | "running" | "paused" | "complete";

export function BreakTimer() {
  const { data, setBreakPreset } = useBreakZone();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(
    data.breakTimer.presetMinutes * 60
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const selectPreset = (minutes: BreakPresetMinutes) => {
    if (status === "running") return;
    setBreakPreset(minutes);
    setRemainingSeconds(minutes * 60);
    setStatus("idle");
  };

  const startTimer = () => {
    if (status === "running") return;
    if (remainingSeconds <= 0) {
      setRemainingSeconds(data.breakTimer.presetMinutes * 60);
    }
    setStatus("running");
  };

  const pauseTimer = () => {
    if (status !== "running") return;
    setStatus("paused");
  };

  const resetTimer = () => {
    clearTimer();
    setStatus("idle");
    setRemainingSeconds(data.breakTimer.presetMinutes * 60);
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
          setStatus("complete");
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return clearTimer;
  }, [status, clearTimer]);

  const totalSeconds = data.breakTimer.presetMinutes * 60;
  const displayedRemainingSeconds =
    status === "idle" ? totalSeconds : remainingSeconds;
  const progress =
    totalSeconds > 0
      ? ((totalSeconds - displayedRemainingSeconds) / totalSeconds) * 100
      : 0;

  return (
    <BreakZoneCard variant="timer">
      <div className="break-zone-card-header mb-4">
        <h2 className="break-zone-display text-sm font-semibold">
          Break Timer ⏱️
        </h2>
        <p className="mt-0.5 text-xs break-zone-subtle">
          A short pause — choose what feels right.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {BREAK_PRESETS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => selectPreset(minutes)}
            disabled={status === "running"}
            aria-pressed={data.breakTimer.presetMinutes === minutes}
            className={cn(
              "break-zone-chip break-zone-chip--timer rounded-2xl px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-50",
              data.breakTimer.presetMinutes === minutes && "is-active"
            )}
          >
            {minutes} min
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col items-center">
        <p
          className="font-mono text-3xl font-semibold tracking-tight"
          aria-live="polite"
          aria-label={`${formatTimerDisplay(displayedRemainingSeconds)} remaining`}
        >
          {formatTimerDisplay(displayedRemainingSeconds)}
        </p>

        {status === "complete" ? (
          <p className="mt-2 text-center text-sm text-[color-mix(in_srgb,var(--bz-mint)_80%,var(--bz-ink))]">
            Your break is complete. Take a breath, then return when you&apos;re ready.
          </p>
        ) : (
          <p className="mt-2 text-xs break-zone-subtle">
            {status === "running"
              ? "Break in progress"
              : status === "paused"
                ? "Paused"
                : "Ready when you are"}
          </p>
        )}

        <div className="mt-4 h-2.5 w-full max-w-xs overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--bz-blush)_10%,var(--bz-surface))]">
          <div
            className={cn(
              "break-timer-progress break-zone-progress--timer h-full rounded-full",
              prefersReducedMotion && "break-timer-progress--static"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
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
    </BreakZoneCard>
  );
}
