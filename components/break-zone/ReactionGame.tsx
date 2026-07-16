"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ReactionGameStatus } from "@/types/break-zone";
import { BreakZoneCard } from "./BreakZoneCard";
import { useBreakZone } from "./BreakZoneProvider";

const MIN_DELAY_MS = 1500;
const MAX_DELAY_MS = 4500;

function randomDelayMs(): number {
  return MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
}

export function ReactionGame() {
  const { data, saveReactionBest } = useBreakZone();
  const [status, setStatus] = useState<ReactionGameStatus>("idle");
  const [latestMs, setLatestMs] = useState<number | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyAtRef = useRef<number | null>(null);

  const clearDelay = useCallback(() => {
    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
  }, []);

  const startRound = () => {
    clearDelay();
    setLatestMs(null);
    setStatus("waiting");
    readyAtRef.current = null;

    delayRef.current = setTimeout(() => {
      readyAtRef.current = performance.now();
      setStatus("ready");
    }, randomDelayMs());
  };

  const handleAction = () => {
    if (status !== "ready" || readyAtRef.current === null) return;

    const elapsed = Math.round(performance.now() - readyAtRef.current);
    setLatestMs(elapsed);
    saveReactionBest(elapsed);
    setStatus("result");
    readyAtRef.current = null;
  };

  useEffect(() => clearDelay, [clearDelay]);

  const statusLabel =
    status === "idle"
      ? "Press Start, then wait for the signal."
      : status === "waiting"
        ? "Wait for the signal…"
        : status === "ready"
          ? "Click now!"
          : "Round complete.";

  return (
    <BreakZoneCard variant="reaction">
      <div className="break-zone-card-header mb-4">
        <h2 className="break-zone-display text-sm font-semibold">
          Reaction Game ⚡
        </h2>
        <p className="mt-0.5 text-xs break-zone-subtle">
          Test your reflexes when the moment arrives.
        </p>
      </div>

      <button
        type="button"
        onClick={handleAction}
        disabled={status !== "ready"}
        aria-label={status === "ready" ? "Click now" : "Reaction target"}
        aria-live="polite"
        className={cn(
          "flex min-h-32 w-full flex-col items-center justify-center rounded-[1.25rem] border px-4 py-6 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed",
          status === "ready" &&
            "break-zone-target--ready motion-safe:animate-pulse",
          status === "waiting" &&
            "border-[var(--bz-border)] bg-[color-mix(in_srgb,var(--bz-mint)_6%,var(--bz-surface))] break-zone-subtle opacity-80",
          status === "result" &&
            "border-[color-mix(in_srgb,var(--bz-mint)_45%,var(--bz-border))] bg-[color-mix(in_srgb,var(--bz-mint)_12%,var(--bz-surface))]",
          status === "idle" &&
            "border-dashed border-[var(--bz-border)] bg-[color-mix(in_srgb,var(--bz-cream)_50%,var(--bz-surface))] break-zone-subtle"
        )}
      >
        <span className="text-sm font-medium">{statusLabel}</span>
        {status === "ready" ? (
          <span className="mt-2 text-lg font-semibold">Click now!</span>
        ) : null}
      </button>

      <p className="mt-2 text-xs break-zone-subtle">
        The target stays disabled until the signal appears — early clicks are not possible.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="break-zone-chip rounded-2xl px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide break-zone-subtle">
            Latest
          </p>
          <p className="mt-0.5 text-sm font-semibold">
            {latestMs !== null ? `${latestMs} ms` : "—"}
          </p>
        </div>
        <div className="break-zone-chip rounded-2xl px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide break-zone-subtle">
            Best
          </p>
          <p className="mt-0.5 text-sm font-semibold">
            {data.reactionGame.bestMs !== null
              ? `${data.reactionGame.bestMs} ms`
              : "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={startRound}
          disabled={status === "waiting" || status === "ready"}
        >
          {status === "result" ? "Try again" : "Start"}
        </Button>
        {status === "result" && (
          <Button variant="secondary" size="sm" onClick={() => setStatus("idle")}>
            Reset
          </Button>
        )}
      </div>
    </BreakZoneCard>
  );
}
