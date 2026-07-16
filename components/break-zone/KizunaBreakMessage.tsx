"use client";

import { AI_ASSISTANT_NAME } from "@/lib/constants";
import { BreakZoneCard } from "./BreakZoneCard";

export function KizunaBreakMessage() {
  return (
    <BreakZoneCard variant="message">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--bz-lavender)_18%,var(--bz-surface))] text-[color-mix(in_srgb,var(--bz-lavender)_80%,var(--bz-ink))]"
          aria-hidden
        >
          ☁️
        </div>
        <p className="text-sm leading-relaxed">
          <span className="break-zone-display font-medium break-zone-card-accent">
            {AI_ASSISTANT_NAME}
          </span>
          {": "}
          Short breaks can help you return with better focus.
        </p>
      </div>
    </BreakZoneCard>
  );
}
