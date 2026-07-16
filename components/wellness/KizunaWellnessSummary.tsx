"use client";

import { Card } from "@/components/ui";
import { AI_ASSISTANT_NAME } from "@/lib/constants";
import { useWellness } from "./WellnessProvider";

export function KizunaWellnessSummary() {
  const { summary } = useWellness();

  return (
    <Card className="border-primary/20 bg-primary/5">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
          aria-hidden
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          </svg>
        </div>
        <div>
          <p className="text-xs font-medium text-primary">{AI_ASSISTANT_NAME} Wellness</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{summary}</p>
        </div>
      </div>
    </Card>
  );
}
